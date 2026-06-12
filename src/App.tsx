import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Role, UserProfile, Announcement, SubjectItem, StudentItem, TeacherItem, QuizItem, SystemAuditLog, GradeRecord, AttendanceRecord, ScheduleItem, LearningMaterial, Assignment, AssignmentSubmission } from "./types";
import {
  demoProfiles,
  initialAnnouncements,
  initialSubjects,
  initialStudents,
  initialTeachers,
  initialQuizzes,
  initialAttendanceRecords,
  initialGradeRecords,
  initialLogs,
  initialSchedules,
  initialMaterials,
  initialAssignments,
  initialSubmissions,
} from "./data";

// Import Modular Components
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import SiswaDashboard from "./components/SiswaDashboard";
import GuruDashboard from "./components/GuruDashboard";
import AdminDashboard from "./components/AdminDashboard";
import KepalaSekolahDashboard from "./components/KepalaSekolahDashboard";

// Import Firebase Cloud Utility Helpers
import { db, saveToCloud, getCollectionFromCloud, syncEntireListToCloud, syncListIncrementally } from "./firebase";
import { onSnapshot, collection } from "firebase/firestore";

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeModule, setActiveModule] = useState<string>("beranda");
  const [showRoleSwitcherModal, setShowRoleSwitcherModal] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("sialma_theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    localStorage.setItem("sialma_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Core Persisted Databases
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [gradeRecords, setGradeRecords] = useState<GradeRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [classGroups, setClassGroups] = useState<string[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [academicYear, setAcademicYear] = useState<string>(() => {
    return localStorage.getItem("sialma_academic_year") || "2023/2024";
  });
  const [academicSemester, setAcademicSemester] = useState<string>(() => {
    return localStorage.getItem("sialma_academic_semester") || "1"; // "1" = Ganjil, "2" = Genap
  });
  const [activeCurriculum, setActiveCurriculum] = useState<string>(() => {
    return localStorage.getItem("sialma_active_curriculum") || "Kurikulum Merdeka";
  });

  const handleUpdateCurriculum = (curriculum: string) => {
    setActiveCurriculum(curriculum);
    localStorage.setItem("sialma_active_curriculum", curriculum);
    // Also save log
    const newLog: SystemAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: `Menu admin merubah tipe kurikulum aktif sistem menjadi: ${curriculum}`
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Synchronization Indicators
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);

  // Initialize and load state from Cloud Firestore or secondary localStorage seed
  useEffect(() => {
    async function loadAndSync() {
      setIsSyncing(true);
      try {
        console.log("[SIALMA-Sync] Memulai sinkronisasi cloud dengan Firebase...");

        // Helper to load collection from Firebase first, falling back/seeding if empty
        const loadOrSeed = async (
          collectionName: string,
          localStorageKey: string,
          defaultValues: any[],
          idField: string = "id"
        ): Promise<any[]> => {
          const cloudData = await getCollectionFromCloud(collectionName);
          if (cloudData && cloudData.length > 0) {
            // Found in cloud! Overwrite local storage and load
            localStorage.setItem(localStorageKey, JSON.stringify(cloudData));
            return cloudData;
          } else {
            // Empty in cloud! Populate with cached values or fallback seeds
            const localRaw = localStorage.getItem(localStorageKey);
            const dataToSeed = localRaw ? JSON.parse(localRaw) : defaultValues;
            if (dataToSeed && dataToSeed.length > 0) {
              await syncEntireListToCloud(collectionName, dataToSeed, idField);
            }
            return dataToSeed;
          }
        };

        // Sync and load all collections sequentially
        const loadedSchedules = await loadOrSeed("schedules", "sialma_schedules", initialSchedules, "id");
        
        // Anti-dummy filter to automatically remove legacy sch-1 to sch-7 from firestore/local if present
        const dummyIds = ["sch-1", "sch-2", "sch-3", "sch-4", "sch-5", "sch-6", "sch-7"];
        const cleanSchedules = loadedSchedules.filter((s: any) => !dummyIds.includes(s.id));
        if (cleanSchedules.length !== loadedSchedules.length) {
          await syncEntireListToCloud("schedules", cleanSchedules, "id");
          localStorage.setItem("sialma_schedules", JSON.stringify(cleanSchedules));
          setSchedules(cleanSchedules);
        } else {
          setSchedules(loadedSchedules);
        }

        const loadedAnns = await loadOrSeed("announcements", "sialma_announcements", initialAnnouncements, "id");
        setAnnouncements(loadedAnns);

        const loadedSubjects = await loadOrSeed("subjects", "sialma_subjects", initialSubjects, "id");
        setSubjects(loadedSubjects);

        const loadedStudents = await loadOrSeed("students", "sialma_students", initialStudents, "nisn");
        setStudents(loadedStudents);

        const loadedTeachers = await loadOrSeed("teachers", "sialma_teachers", initialTeachers, "nip");
        setTeachers(loadedTeachers);

        const loadedQuizzes = await loadOrSeed("quizzes", "sialma_quizzes", initialQuizzes, "id");
        setQuizzes(loadedQuizzes);

        const loadedAttendance = await loadOrSeed("attendance", "sialma_attendance", initialAttendanceRecords, "id");
        setAttendanceRecords(loadedAttendance);

        const loadedGrades = await loadOrSeed("grades", "sialma_grades", initialGradeRecords, "id");
        setGradeRecords(loadedGrades);

        const loadedMaterials = await loadOrSeed("materials", "sialma_materials", initialMaterials, "id");
        setMaterials(loadedMaterials);

        const loadedAssignments = await loadOrSeed("assignments", "sialma_assignments", initialAssignments, "id");
        setAssignments(loadedAssignments);

        const loadedSubmissions = await loadOrSeed("submissions", "sialma_submissions", initialSubmissions, "id");
        setSubmissions(loadedSubmissions);

        const loadedLogs = await loadOrSeed("logs", "sialma_logs", initialLogs, "id");
        setAuditLogs(loadedLogs);

        // Custom Class Groups sync
        const defaultClasses = ["XII - IPA 1", "XII - IPA 2", "XI - IPS 1", "XI - IPS 2", "X - 1"];
        const cloudClassGroups = await getCollectionFromCloud("class_groups");
        if (cloudClassGroups && cloudClassGroups.length > 0) {
          const names = cloudClassGroups.map(c => c.name);
          localStorage.setItem("sialma_class_groups", JSON.stringify(names));
          setClassGroups(names);
        } else {
          const localClassRaw = localStorage.getItem("sialma_class_groups");
          const names = localClassRaw ? JSON.parse(localClassRaw) : defaultClasses;
          const classList = names.map((name: string) => ({ id: name.replace(/\s+/g, '-'), name }));
          await syncEntireListToCloud("class_groups", classList, "id");
          setClassGroups(names);
        }

        // Custom Users profiles sync
        const defaultUsers = Object.values(demoProfiles).map(u => ({
          ...u,
          password: u.role === Role.ADMIN ? "admin123" : "password123"
        }));
        if (!defaultUsers.some(u => u.username.toLowerCase() === "admin")) {
          defaultUsers.push({
            id: "ADM-0001",
            name: "Admin SIALMA",
            email: "admin@ma-alsum.edu",
            username: "admin",
            role: Role.ADMIN,
            avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCV76PALTNnY9-xgkMcL7gBkxiEGJ-VCbspOr_U2LJ-eWj1DHnlQcrBpHzic_GKZIGHDEqSQA1ppDFuw8EdJbpBW74XPLz9qsKLkMMANeczCe60xzLcTTV-29JhNojxqFM123B3UFzXDsh1BEea3VR9TpVEcc22PWqQQ5JAkAcbXuqLr6LpIeutCb0s3hVcu9ruuaPMA8PIRkHfZOT1z8BdBzXRHL04UvcrHAHNyg9w3uq1FycfOyDrMjlRqbF-IY0LJ3m_VhFDaR8",
            title: "Administrator Utama",
            password: "admin123"
          });
        }
        const cloudUsers = await getCollectionFromCloud("users");
        if (cloudUsers && cloudUsers.length > 0) {
          const normalized = cloudUsers.map(u => ({ ...u, password: u.password || "password123" }));
          localStorage.setItem("sialma_users", JSON.stringify(normalized));
          setUsers(normalized);
        } else {
          const localUsersRaw = localStorage.getItem("sialma_users");
          const usersList = localUsersRaw ? JSON.parse(localUsersRaw) : defaultUsers;
          await syncEntireListToCloud("users", usersList, "id");
          setUsers(usersList);
        }

        // Check active session profile locally
        const localProfile = localStorage.getItem("sialma_active_profile");
        if (localProfile) {
          setProfile(JSON.parse(localProfile));
        }

        setCloudSynced(true);
        console.log("[SIALMA-Sync] Sinkronisasi cloud berhasil diselesaikan.");
      } catch (error) {
        console.error("[SIALMA-Sync] Kesalahan sinkronisasi data cloud pada startup:", error);
      } finally {
        setIsSyncing(false);
      }
    }

    loadAndSync();
  }, []);

  // Real-time synchronization listeners for cross-device support
  useEffect(() => {
    if (!cloudSynced) return;

    console.log("[SIALMA-Sync] Mengaktifkan Listener Real-time Firestore untuk Sinkronisasi Lintas Perangkat...");

    const unsubSchedules = onSnapshot(collection(db, "schedules"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as ScheduleItem);
      setSchedules(data);
      localStorage.setItem("sialma_schedules", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan schedules:", err);
    });

    const unsubAnnouncements = onSnapshot(collection(db, "announcements"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as Announcement);
      setAnnouncements(data);
      localStorage.setItem("sialma_announcements", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan announcements:", err);
    });

    const unsubSubjects = onSnapshot(collection(db, "subjects"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as SubjectItem);
      setSubjects(data);
      localStorage.setItem("sialma_subjects", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan subjects:", err);
    });

    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as StudentItem);
      setStudents(data);
      localStorage.setItem("sialma_students", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan students:", err);
    });

    const unsubTeachers = onSnapshot(collection(db, "teachers"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as TeacherItem);
      setTeachers(data);
      localStorage.setItem("sialma_teachers", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan teachers:", err);
    });

    const unsubQuizzes = onSnapshot(collection(db, "quizzes"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as QuizItem);
      setQuizzes(data);
      localStorage.setItem("sialma_quizzes", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan quizzes:", err);
    });

    const unsubAttendance = onSnapshot(collection(db, "attendance"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as AttendanceRecord);
      setAttendanceRecords(data);
      localStorage.setItem("sialma_attendance", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan attendance:", err);
    });

    const unsubGrades = onSnapshot(collection(db, "grades"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as GradeRecord);
      setGradeRecords(data);
      localStorage.setItem("sialma_grades", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan grades:", err);
    });

    const unsubLogs = onSnapshot(collection(db, "logs"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as SystemAuditLog);
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditLogs(data);
      localStorage.setItem("sialma_logs", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan logs:", err);
    });

    const unsubClassGroups = onSnapshot(collection(db, "class_groups"), (snap) => {
      const names = snap.docs.map(doc => (doc.data() as { name: string }).name);
      setClassGroups(names);
      localStorage.setItem("sialma_class_groups", JSON.stringify(names));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan class_groups:", err);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as UserProfile);
      setUsers(data);
      localStorage.setItem("sialma_users", JSON.stringify(data));
      
      // Synchronize logged-in active profile
      const activeProfileRaw = localStorage.getItem("sialma_active_profile");
      if (activeProfileRaw) {
        try {
          const currentProfileObj = JSON.parse(activeProfileRaw) as UserProfile;
          const foundFresh = data.find(u => u.id === currentProfileObj.id);
          if (foundFresh && JSON.stringify(foundFresh) !== JSON.stringify(currentProfileObj)) {
            setProfile(foundFresh);
            localStorage.setItem("sialma_active_profile", JSON.stringify(foundFresh));
          }
        } catch (e) {
          console.error("[SIALMA-Sync] Gagal mencocokkan profil aktif:", e);
        }
      }
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan users:", err);
    });

    const unsubMaterials = onSnapshot(collection(db, "materials"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as LearningMaterial);
      setMaterials(data);
      localStorage.setItem("sialma_materials", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan materials:", err);
    });

    const unsubAssignments = onSnapshot(collection(db, "assignments"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as Assignment);
      setAssignments(data);
      localStorage.setItem("sialma_assignments", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan assignments:", err);
    });

    const unsubSubmissions = onSnapshot(collection(db, "submissions"), (snap) => {
      const data = snap.docs.map(doc => doc.data() as AssignmentSubmission);
      setSubmissions(data);
      localStorage.setItem("sialma_submissions", JSON.stringify(data));
    }, (err) => {
      console.warn("[SIALMA-Sync] Terjadi galat pemantauan submissions:", err);
    });

    return () => {
      unsubSchedules();
      unsubAnnouncements();
      unsubSubjects();
      unsubStudents();
      unsubTeachers();
      unsubQuizzes();
      unsubAttendance();
      unsubGrades();
      unsubLogs();
      unsubClassGroups();
      unsubUsers();
      unsubMaterials();
      unsubAssignments();
      unsubSubmissions();
    };
  }, [cloudSynced]);

  // Update localStorage and sync with remote Firestore
  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));

    // Parallel background synchronizations with Cloud Firestore
    try {
      if (key === "sialma_schedules") syncListIncrementally("schedules", schedules, data, "id");
      else if (key === "sialma_announcements") syncListIncrementally("announcements", announcements, data, "id");
      else if (key === "sialma_subjects") syncListIncrementally("subjects", subjects, data, "id");
      else if (key === "sialma_students") syncListIncrementally("students", students, data, "nisn");
      else if (key === "sialma_teachers") syncListIncrementally("teachers", teachers, data, "nip");
      else if (key === "sialma_quizzes") syncListIncrementally("quizzes", quizzes, data, "id");
      else if (key === "sialma_attendance") syncListIncrementally("attendance", attendanceRecords, data, "id");
      else if (key === "sialma_grades") syncListIncrementally("grades", gradeRecords, data, "id");
      else if (key === "sialma_materials") syncListIncrementally("materials", materials, data, "id");
      else if (key === "sialma_assignments") syncListIncrementally("assignments", assignments, data, "id");
      else if (key === "sialma_submissions") syncListIncrementally("submissions", submissions, data, "id");
      else if (key === "sialma_logs") syncListIncrementally("logs", auditLogs, data, "id");
      else if (key === "sialma_class_groups") {
        const oldClassList = classGroups.map((name: string) => ({ id: name.replace(/\s+/g, '-'), name }));
        const classList = data.map((name: string) => ({ id: name.replace(/\s+/g, '-'), name }));
        syncListIncrementally("class_groups", oldClassList, classList, "id");
      }
      else if (key === "sialma_users") syncListIncrementally("users", users, data, "id");
      else if (key === "sialma_active_profile") {
        if (data && data.id) {
          saveToCloud("users", data.id, data);
        }
      }
    } catch (e) {
      console.warn("[SIALMA-Sync] Sinkronisasi cloud tertunda karena koneksi:", e);
    }
  };

  const handleLogin = (userProfile: UserProfile) => {
    setProfile(userProfile);
    setActiveModule("beranda");
    saveToStorage("sialma_active_profile", userProfile);

    // Create a login audit log
    const newLog: SystemAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: `${userProfile.name} (${userProfile.role}) berhasil masuk ke portal SIALMA.`,
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveToStorage("sialma_logs", updatedLogs);
  };

  const handleLogout = () => {
    setProfile(null);
    localStorage.removeItem("sialma_active_profile");
  };

  const handleModuleChange = (moduleKey: string) => {
    if (moduleKey === "change-role") {
      setShowRoleSwitcherModal(true);
    } else {
      setActiveModule(moduleKey);
    }
  };

  // Switch roles quickly for testing
  const quickSwitchRole = (newRole: Role) => {
    const demoProfile = demoProfiles[newRole];
    handleLogin(demoProfile);
    setShowRoleSwitcherModal(false);
  };

  // State Updates from Sub-Dashboards
  const handleSaveAttendance = (newAttendance: AttendanceRecord[]) => {
    // Merge or overwrite attendance records
    const merged = [...attendanceRecords];
    newAttendance.forEach((newRec) => {
      const idx = merged.findIndex((a) => a.id === newRec.id);
      if (idx !== -1) merged[idx] = newRec;
      else merged.push(newRec);
    });
    setAttendanceRecords(merged);
    saveToStorage("sialma_attendance", merged);

    // Create audit log
    const newLog: SystemAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: `Presensi siswa untuk kelas ${newAttendance[0]?.date} berhasil diperbarui oleh ${profile?.name}.`,
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveToStorage("sialma_logs", updatedLogs);
  };

  const handleSaveGrades = (newGrades: GradeRecord[]) => {
    const merged = [...gradeRecords];
    newGrades.forEach((res) => {
      const idx = merged.findIndex((g) => g.id === res.id);
      if (idx !== -1) merged[idx] = res;
      else merged.push(res);
    });
    setGradeRecords(merged);
    saveToStorage("sialma_grades", merged);

    // Create audit log
    const newLog: SystemAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: `Daftar nilai kurikulum resmi berhasil dimodifikasi oleh ${profile?.name}.`,
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveToStorage("sialma_logs", updatedLogs);
  };

  const handleCompleteQuiz = (quizId: string, score: number) => {
    const updated = quizzes.map((q) =>
      q.id === quizId
        ? {
            ...q,
            studentScore: score,
            completedAt: new Date().toISOString(),
            submissions: [
              ...(q.submissions || []),
              {
                studentId: profile?.id || "0045218903",
                studentName: profile?.name || "Arya Satria",
                score: score,
                completedAt: new Date().toISOString(),
              },
            ],
          }
        : q
    );
    setQuizzes(updated);
    saveToStorage("sialma_quizzes", updated);

    // Auto update students' general score average in SIALMA database
    if (profile?.role === Role.SISWA) {
      const updatedStudents = students.map((s) =>
        s.nisn === profile.id
          ? {
              ...s,
              academicScore: Math.round(((s.academicScore || 85) + score) / 2),
            }
          : s
      );
      setStudents(updatedStudents);
      saveToStorage("sialma_students", updatedStudents);
    }

    // Create audit log
    const newLog: SystemAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: `Siswa ${profile?.name} menyelesaikan Kuis #${quizId} dengan skor akhir ${score}.`,
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveToStorage("sialma_logs", updatedLogs);
  };

  const handleAddNewQuiz = (newQuiz: QuizItem) => {
    const updated = [...quizzes, newQuiz];
    setQuizzes(updated);
    saveToStorage("sialma_quizzes", updated);

    // Create audit log
    const newLog: SystemAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: `Kuis baru "${newQuiz.title}" berhasil diterbitkan oleh ${profile?.name}.`,
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveToStorage("sialma_logs", updatedLogs);
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveToStorage("sialma_active_profile", updatedProfile);

    // Also synchronize with the main users list
    const updatedUsers = users.map((u) => u.id === updatedProfile.id ? updatedProfile : u);
    setUsers(updatedUsers);
    saveToStorage("sialma_users", updatedUsers);

    // If student, synchronize with list
    if (updatedProfile.role === Role.SISWA) {
      const updatedS = students.map((s) =>
        s.nisn === updatedProfile.id ? { 
          ...s, 
          name: updatedProfile.name,
          classGroup: updatedProfile.classGroup || s.classGroup
        } : s
      );
      setStudents(updatedS);
      saveToStorage("sialma_students", updatedS);
    }

    // If teacher, synchronize with list
    if (updatedProfile.role === Role.GURU) {
      const updatedT = teachers.map((t) =>
        t.nip === updatedProfile.id ? { 
          ...t, 
          name: updatedProfile.name,
          email: updatedProfile.email,
          avatarUrl: updatedProfile.avatarUrl || t.avatarUrl
        } : t
      );
      setTeachers(updatedT);
      saveToStorage("sialma_teachers", updatedT);
    }

    // Create audit log
    const newLog: SystemAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: `Biodata profil pribadi milik ${updatedProfile.name} (${updatedProfile.role}) berhasil diperbarui.`,
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveToStorage("sialma_logs", updatedLogs);
  };

  const handleUpdateAcademicYear = (newYear: string) => {
    setAcademicYear(newYear);
    localStorage.setItem("sialma_academic_year", newYear);

    // Update current profile gradeYear
    if (profile) {
      const updatedProfile = { ...profile, gradeYear: newYear };
      setProfile(updatedProfile);
      localStorage.setItem("sialma_active_profile", JSON.stringify(updatedProfile));
    }

    // Update all users list gradeYear
    const updatedUsers = users.map(u => ({ ...u, gradeYear: newYear }));
    setUsers(updatedUsers);
    localStorage.setItem("sialma_users", JSON.stringify(updatedUsers));
    syncEntireListToCloud("users", updatedUsers, "id");

    // Also update all students list to make sure their gradeYear is consistent
    const updatedS = students.map(s => ({ ...s, gradeYear: newYear }));
    setStudents(updatedS);
    localStorage.setItem("sialma_students", JSON.stringify(updatedS));
    syncEntireListToCloud("students", updatedS, "nisn");

    // Create system log
    const newLog: SystemAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: `Tahun Ajaran resmi sistem berhasil diperbarui menjadi "${newYear}" oleh Administrator SIALMA.`,
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveToStorage("sialma_logs", updatedLogs);
  };

  const handleUpdateAcademicSemester = (newSem: string) => {
    setAcademicSemester(newSem);
    localStorage.setItem("sialma_academic_semester", newSem);

    // Create system log
    const newLog: SystemAuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: `Semester Akademik resmi sistem berhasil diperbarui menjadi "${newSem === "1" ? "1 (Ganjil)" : "2 (Genap)"}" oleh Administrator SIALMA.`,
    };
    const updatedLogs = [newLog, ...auditLogs];
    setAuditLogs(updatedLogs);
    saveToStorage("sialma_logs", updatedLogs);
  };

  // Render the unauthenticated Login view
  if (!profile) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  // Render authenticated module dashboards
  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-[#0b0f19] text-slate-150" : "bg-slate-50 text-slate-800"} flex transition-colors duration-300`}>
      {/* Sidebar Navigation */}
      <Sidebar
        profile={profile}
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        onLogout={handleLogout}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Dynamic View Section */}
      <div className="flex-1 md:ml-[260px] ml-0 pb-[84px] md:pb-0 flex flex-col min-h-screen overflow-hidden relative">
        {/* Floating Controls (Theme Toggle stays top right) */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {/* Dedicated Theme Toggler */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={`p-2 rounded-full border shadow-md flex items-center justify-center cursor-pointer transition-all duration-300 ${
              theme === "dark"
                ? "bg-[#1e293b] border-slate-800 text-yellow-300"
                : "bg-white border-slate-200 text-[#0f766e]"
            }`}
            title="Ubah Rupa Tampilan"
          >
            <span className="material-symbols-outlined text-lg">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </motion.button>
        </div>

        {/* Cloud Sync Indicator floating in bottom corner */}
        <div className={`fixed bottom-24 md:bottom-6 right-6 z-55 flex items-center gap-2 px-3.5 py-1.5 rounded-full border shadow-md text-xs font-bold backdrop-blur-md transition-all duration-300 select-none ${
          theme === "dark"
            ? "bg-[#111827]/95 border-slate-850 text-slate-350"
            : "bg-white/95 border-slate-200 text-slate-700"
        }`}>
          {isSyncing ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="font-sans font-semibold">SIALMA Cloud...</span>
            </>
          ) : cloudSynced ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-500 font-extrabold">Cloud Terkoneksi ✓</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="font-sans font-semibold">Luring (Offline)</span>
            </>
          )}
        </div>

        {profile.role === Role.SISWA && (
          <SiswaDashboard
            profile={profile}
            activeModule={activeModule}
            announcements={announcements}
            subjects={subjects}
            quizzes={quizzes.map((q) => {
              const sub = q.submissions?.find((s) => s.studentId === profile.id);
              return {
                ...q,
                studentScore: sub ? sub.score : undefined,
                completedAt: sub ? sub.completedAt : undefined,
              };
            })}
            attendanceRecords={attendanceRecords}
            gradeRecords={gradeRecords}
            schedules={schedules}
            materials={materials}
            assignments={assignments}
            submissions={submissions}
            onAddSubmission={(newSubm: AssignmentSubmission) => {
              const updated = [...submissions, newSubm];
              setSubmissions(updated);
              saveToStorage("sialma_submissions", updated);
            }}
            onCompleteQuiz={handleCompleteQuiz}
            onUpdateProfile={handleUpdateProfile}
            onModuleChange={setActiveModule}
            academicYear={academicYear}
            academicSemester={academicSemester}
            activeCurriculum={activeCurriculum}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {profile.role === Role.GURU && (
          <GuruDashboard
            profile={profile}
            activeModule={activeModule}
            announcements={announcements}
            subjects={subjects}
            classGroups={classGroups}
            quizzes={quizzes}
            students={students}
            attendanceRecords={attendanceRecords}
            gradeRecords={gradeRecords}
            schedules={schedules}
            materials={materials}
            assignments={assignments}
            submissions={submissions}
            onAddMaterial={(newMat: LearningMaterial) => {
              const updated = [...materials, newMat];
              setMaterials(updated);
              saveToStorage("sialma_materials", updated);
            }}
            onDeleteMaterial={(id: string) => {
              const updated = materials.filter(m => m.id !== id);
              setMaterials(updated);
              saveToStorage("sialma_materials", updated);
            }}
            onAddAssignment={(newAsg: Assignment) => {
              const updated = [...assignments, newAsg];
              setAssignments(updated);
              saveToStorage("sialma_assignments", updated);
            }}
            onGradeSubmission={(submId: string, score: number, feedback: string) => {
              const updated = submissions.map(s => s.id === submId ? { ...s, score, feedback } : s);
              setSubmissions(updated);
              saveToStorage("sialma_submissions", updated);
            }}
            onSaveAttendance={handleSaveAttendance}
            onSaveGrades={handleSaveGrades}
            onAddNewQuiz={handleAddNewQuiz}
            onSetQuizzes={(data) => {
              setQuizzes(data);
              saveToStorage("sialma_quizzes", data);
            }}
            onUpdateProfile={handleUpdateProfile}
            onModuleChange={handleModuleChange}
            academicYear={academicYear}
            academicSemester={academicSemester}
            activeCurriculum={activeCurriculum}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {profile.role === Role.ADMIN && (
          <AdminDashboard
            profile={profile}
            activeModule={activeModule}
            announcements={announcements}
            subjects={subjects}
            students={students}
            teachers={teachers}
            quizzes={quizzes}
            auditLogs={auditLogs}
            attendanceRecords={attendanceRecords}
            gradeRecords={gradeRecords}
            schedules={schedules}
            classGroups={classGroups}
            onSetClassGroups={(data) => {
               setClassGroups(data);
               saveToStorage("sialma_class_groups", data);
            }}
            users={users}
            onSetUsers={(data) => {
               setUsers(data);
               saveToStorage("sialma_users", data);
            }}
            onSetAnnouncements={(data) => {
               setAnnouncements(data);
               saveToStorage("sialma_announcements", data);
            }}
            onSetSubjects={(data) => {
               setSubjects(data);
               saveToStorage("sialma_subjects", data);
            }}
            onSetStudents={(data) => {
               setStudents(data);
               saveToStorage("sialma_students", data);
            }}
            onSetTeachers={(data) => {
               setTeachers(data);
               saveToStorage("sialma_teachers", data);
            }}
            onUpdateProfile={handleUpdateProfile}
            onSetSchedules={(data) => {
               setSchedules(data);
               saveToStorage("sialma_schedules", data);
            }}
            academicYear={academicYear}
            onUpdateAcademicYear={handleUpdateAcademicYear}
            academicSemester={academicSemester}
            onUpdateAcademicSemester={handleUpdateAcademicSemester}
            activeCurriculum={activeCurriculum}
            onUpdateCurriculum={handleUpdateCurriculum}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {profile.role === Role.KEPALA_SEKOLAH && (
          <KepalaSekolahDashboard
            profile={profile}
            activeModule={activeModule}
            announcements={announcements}
            subjects={subjects}
            students={students}
            teachers={teachers}
            quizzes={quizzes}
            attendanceRecords={attendanceRecords}
            gradeRecords={gradeRecords}
            schedules={schedules}
            academicYear={academicYear}
            academicSemester={academicSemester}
            activeCurriculum={activeCurriculum}
            onSetAnnouncements={(data) => {
              setAnnouncements(data);
              saveToStorage("sialma_announcements", data);
            }}
            onUpdateProfile={handleUpdateProfile}
            theme={theme}
            setTheme={setTheme}
          />
        )}
      </div>

      {/* QUICK ROLE SWITCHER MODAL OVERLAY */}
      {showRoleSwitcherModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-emerald-900">Pilih Peran Simulasi SIALMA</h3>
              <button onClick={() => setShowRoleSwitcherModal(false)}>
                <span className="material-symbols-outlined text-slate-400 hover:text-rose-700">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              SIALMA mendukung simulasi multi-role. Pilih salah satu peran di bawah ini untuk melihat tampilan dashboard yang disesuaikan secara real-time:
            </p>
            <div className="space-y-2 pt-2">
              {Object.values(Role).map((r) => (
                <button
                  key={r}
                  onClick={() => quickSwitchRole(r)}
                  className={`w-full flex items-center justify-between p-3 border rounded-xl text-left hover:bg-emerald-50 hover:border-emerald-600 transition-all select-none ${
                    profile.role === r ? "border-emerald-700 bg-emerald-50 text-emerald-950 font-bold" : "border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl text-emerald-800">
                      {r === Role.SISWA && "person"}
                      {r === Role.GURU && "co_present"}
                      {r === Role.ADMIN && "admin_panel_settings"}
                      {r === Role.KEPALA_SEKOLAH && "workspace_premium"}
                    </span>
                    <span className="text-xs font-semibold">{r}</span>
                  </div>
                  {profile.role === r && (
                    <span className="material-symbols-outlined text-emerald-700 text-base">check_circle</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
