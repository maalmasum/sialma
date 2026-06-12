import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Database ID from configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Saves or updates a single document in Firestore
 */
export async function saveToCloud(collectionName: string, docId: string, data: any) {
  try {
    if (!docId) return;
    const docRef = doc(db, collectionName, String(docId));
    await setDoc(docRef, data);
  } catch (error: any) {
    console.error(`[Firebase Cloud] Gagal menyimpan ke ${collectionName}/${docId}:`, error);
    if (error && (error.code === "permission-denied" || error.message?.includes("permission"))) {
      alert(`[Firebase Cloud] Pembatasan Otorisasi: Gagal menyimpan data ke ${collectionName} di server.`);
    }
  }
}

/**
 * Removes a document from Firestore
 */
export async function removeFromCloud(collectionName: string, docId: string) {
  try {
    if (!docId) return;
    const docRef = doc(db, collectionName, String(docId));
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error(`[Firebase Cloud] Gagal menghapus dari ${collectionName}/${docId}:`, error);
    if (error && (error.code === "permission-denied" || error.message?.includes("permission"))) {
      alert(`[Firebase Cloud] Pembatasan Otorisasi: Gagal menghapus data dari ${collectionName} di server.`);
    }
  }
}

/**
 * Retrieves all documents from a Firestore collection
 */
export async function getCollectionFromCloud(collectionName: string): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: any[] = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        items.push(docSnap.data());
      }
    });
    return items;
  } catch (error) {
    console.error(`[Firebase Cloud] Gagal mengambil data dari ${collectionName}:`, error);
    return [];
  }
}

/**
 * Bulk updates/synchronizes a collection with local changes, deleting any items in the cloud that are no longer present locally.
 */
export async function syncEntireListToCloud(collectionName: string, list: any[], idField: string = "id") {
  try {
    // 1. Upload/Sync new/updated items
    for (const item of list) {
      const docId = item[idField];
      if (docId) {
        await saveToCloud(collectionName, docId, item);
      }
    }

    // 2. Fetch remote documents to detect and delete any items that were removed locally
    const remoteItems = await getCollectionFromCloud(collectionName);
    const localIds = new Set(list.map(item => String(item[idField] || "")));

    for (const remoteItem of remoteItems) {
      const remoteId = String(remoteItem[idField] || "");
      if (remoteId && !localIds.has(remoteId)) {
        await removeFromCloud(collectionName, remoteId);
      }
    }
  } catch (error) {
    console.error(`[Firebase Cloud] Gagal membackup seluruh list ke ${collectionName}:`, error);
  }
}

/**
 * Highly granular, incremental list synchronizer.
 * Only saves modified/added documents, and deletes removed documents.
 * This avoids hitting size limits, limits latency, and minimizes redundant snapshot triggers.
 */
export async function syncListIncrementally(
  collectionName: string,
  oldList: any[],
  newList: any[],
  idField: string = "id"
) {
  try {
    const oldFiltered = Array.isArray(oldList) ? oldList : [];
    const newFiltered = Array.isArray(newList) ? newList : [];

    const oldMap = new Map(oldFiltered.map((item) => [String(item[idField] || ""), item]));
    const newMap = new Map(newFiltered.map((item) => [String(item[idField] || ""), item]));

    // 1. Check for removed files/documents
    for (const [oldId] of oldMap.entries()) {
      if (oldId && !newMap.has(oldId)) {
        console.log(`[SIALMA-Sync] Deteksi Hapus: ${collectionName}/${oldId}`);
        await removeFromCloud(collectionName, oldId);
      }
    }

    // 2. Check for added or modified files/documents
    for (const [newId, newItem] of newMap.entries()) {
      if (newId) {
        const oldItem = oldMap.get(newId);
        // Compare values or JSON representation
        if (!oldItem || JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
          console.log(`[SIALMA-Sync] Deteksi Simpan/Ubah: ${collectionName}/${newId}`);
          await saveToCloud(collectionName, newId, newItem);
        }
      }
    }
  } catch (error) {
    console.error(`[Firebase Cloud] Gagal memproses sinkronisasi inkremental untuk ${collectionName}:`, error);
  }
}

