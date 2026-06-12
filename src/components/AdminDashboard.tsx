import React, { useState, useEffect } from "react";
import { read, utils, writeFile } from "xlsx";
import { UserProfile, Announcement, SubjectItem, StudentItem, TeacherItem, QuizItem, SystemAuditLog, GradeRecord, AttendanceRecord, ScheduleItem } from "../types";

export const getSpecialSessionMeta = (subjectId: string) => {
  if (!subjectId) return null;
  const match = subjectId.match(/^(istirahat|upacara|kultum|wk)(?:-(.+))?$/);
  if (!match) return null;
  const type = match[1];
  const classGroup = match[2] || "Semua Kelas";
  
  if (type === "istirahat") {
    return {
      type,
      label: "ISTIRAHAT",
      icon: "coffee",
      classGroup,
      badgeStyle: "bg-amber-100 text-amber-900 border-amber-200",
      cardStyle: "bg-amber-50/20 border-amber-200/80 hover:bg-amber-50/30 hover:border-amber-400",
      themeColor: "text-amber-700",
      attendee: "Seluruh Pendidik & Siswa",
      categoryName: "Rehat"
    };
  }
  if (type === "upacara") {
    return {
      type,
      label: "UPACARA BENDERA",
      icon: "flag",
      classGroup,
      badgeStyle: "bg-rose-100 text-rose-900 border-rose-200",
      cardStyle: "bg-rose-50/20 border-rose-200/80 hover:bg-rose-50/30 hover:border-rose-400",
      themeColor: "text-rose-700",
      attendee: "Seluruh Pendidik & Siswa",
      categoryName: "Upacara"
    };
  }
  if (type === "kultum") {
    return {
      type,
      label: "KULTUM / KEAGAMAAN",
      icon: "self_improvement",
      classGroup,
      badgeStyle: "bg-indigo-100 text-indigo-900 border-indigo-200",
      cardStyle: "bg-indigo-50/20 border-indigo-200/80 hover:bg-indigo-50/30 hover:border-indigo-400",
      themeColor: "text-indigo-700",
      attendee: "Seluruh Pendidik & Siswa",
      categoryName: "Keagamaan"
    };
  }
  if (type === "wk") {
    return {
      type,
      label: "JAM WALI KELAS (WK)",
      icon: "supervisor_account",
      classGroup,
      badgeStyle: "bg-teal-100 text-teal-900 border-teal-200",
      cardStyle: "bg-teal-50/20 border-teal-200/80 hover:bg-teal-50/30 hover:border-teal-400",
      themeColor: "text-teal-700",
      attendee: "Wali Kelas & Siswa",
      categoryName: "Wali Kelas"
    };
  }
  return null;
};

interface AdminDashboardProps {
  profile: UserProfile;
  activeModule: string;
  announcements: Announcement[];
  subjects: SubjectItem[];
  students: StudentItem[];
  teachers: TeacherItem[];
  quizzes: QuizItem[];
  auditLogs: SystemAuditLog[];
  attendanceRecords: AttendanceRecord[];
  gradeRecords: GradeRecord[];
  schedules: ScheduleItem[];
  classGroups: string[];
  onSetClassGroups: (classGroups: string[]) => void;
  users: UserProfile[];
  onSetUsers: (users: UserProfile[]) => void;
  onSetAnnouncements: (announcements: Announcement[]) => void;
  onSetSubjects: (subjects: SubjectItem[]) => void;
  onSetStudents: (students: StudentItem[]) => void;
  onSetTeachers: (teachers: TeacherItem[]) => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onSetSchedules: (schedules: ScheduleItem[]) => void;
  academicYear?: string;
  onUpdateAcademicYear?: (academicYear: string) => void;
  academicSemester?: string;
  onUpdateAcademicSemester?: (semester: string) => void;
  activeCurriculum?: string;
  onUpdateCurriculum?: (curriculum: string) => void;
  theme?: "light" | "dark";
  setTheme?: (theme: "light" | "dark") => void;
}

export default function AdminDashboard({
  profile,
  activeModule,
  announcements,
  subjects,
  students,
  teachers,
  quizzes,
  auditLogs,
  attendanceRecords,
  gradeRecords,
  schedules = [],
  classGroups = [],
  onSetClassGroups,
  users = [],
  onSetUsers,
  onSetAnnouncements,
  onSetSubjects,
  onSetStudents,
  onSetTeachers,
  onUpdateProfile,
  onSetSchedules,
  academicYear = "2023/2024",
  onUpdateAcademicYear,
  academicSemester = "1",
  onUpdateAcademicSemester,
  activeCurriculum = "Kurikulum Merdeka",
  onUpdateCurriculum,
  theme,
  setTheme,
}: AdminDashboardProps) {

  // Global Time state
  const [digitalTime, setDigitalTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const timeStr = now.toLocaleTimeString("id-ID", { hour12: false });
      setDigitalTime(`${dateStr}, ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter out any dummy records of students that do not exist in the active list
  const validAttendanceRecords = React.useMemo(() => {
    return attendanceRecords.filter((r) => {
      return students.some((s) => s.nisn === r.nisn || s.name.toLowerCase() === r.studentName.toLowerCase());
    });
  }, [attendanceRecords, students]);

  const validGradeRecords = React.useMemo(() => {
    return gradeRecords.filter((g) => {
      return students.some((s) => s.nisn === g.nisn || s.name.toLowerCase() === g.studentName.toLowerCase());
    });
  }, [gradeRecords, students]);

  // CRUD States for SISWA
  const [siswaSearch, setSiswaSearch] = useState("");
  const [selectedSiswaClass, setSelectedSiswaClass] = useState("Semua Kelas");
  const [isSiswaModalOpen, setIsSiswaModalOpen] = useState(false);
  const [siswaEditIdx, setSiswaEditIdx] = useState<string | null>(null);
  const [formSiswaNisn, setFormSiswaNisn] = useState("");
  const [formSiswaName, setFormSiswaName] = useState("");
  const [formSiswaClass, setFormSiswaClass] = useState("XII - IPA 1");
  const [formSiswaGender, setFormSiswaGender] = useState<"Laki-laki" | "Perempuan">("Laki-laki");
  const [formSiswaStatus, setFormSiswaStatus] = useState<"AKTIF" | "NON-AKTIF">("AKTIF");

  // CRUD States for GURU
  const [guruSearch, setGuruSearch] = useState("");
  const [selectedGuruSubject, setSelectedGuruSubject] = useState("Semua");
  const [isGuruModalOpen, setIsGuruModalOpen] = useState(false);
  const [guruEditIdx, setGuruEditIdx] = useState<string | null>(null);
  const [formGuruNip, setFormGuruNip] = useState("");
  const [formGuruName, setFormGuruName] = useState("");
  const [formGuruEmail, setFormGuruEmail] = useState("");
  const [formGuruSubject, setFormGuruSubject] = useState("Matematika");
  const [formGuruWali, setFormGuruWali] = useState("-");
  const [formGuruStatus, setFormGuruStatus] = useState<"Aktif" | "Cuti">("Aktif");

  // CRUD States for MAPEL (SUBJECTS)
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectEditIdx, setSubjectEditIdx] = useState<string | null>(null);
  const [formSubCode, setFormSubCode] = useState("");
  const [formSubName, setFormSubName] = useState("");
  const [formSubTeacherId, setFormSubTeacherId] = useState("");
  const [formSubClass, setFormSubClass] = useState("XII - IPA 1");
  const [formSubCategory, setFormSubCategory] = useState<"Wajib" | "Peminatan" | "Muatan Lokal">("Wajib");
  const [formSubHours, setFormSubHours] = useState(4);

  // CRUD States for ANNOUNCEMENTS
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [formAnnTitle, setFormAnnTitle] = useState("");
  const [formAnnContent, setFormAnnContent] = useState("");
  const [formAnnTarget, setFormAnnTarget] = useState<"SEMUA" | "GURU" | "SISWA">("SEMUA");

  // CRUD States for SCHEDULES
  const [scheduleClassFilter, setScheduleClassFilter] = useState("Semua Kelas");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleEditId, setScheduleEditId] = useState<string | null>(null);
  const [formScheduleDay, setFormScheduleDay] = useState("SENIN");
  const [formScheduleTimeSlot, setFormScheduleTimeSlot] = useState("07:30 - 09:00");
  const [formScheduleSubjectId, setFormScheduleSubjectId] = useState("");
  const [formScheduleRoom, setFormScheduleRoom] = useState("");

  // ELEMEN SELEKSI MASSAL / BULK SELECTION STATES
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [selectedStudentNisns, setSelectedStudentNisns] = useState<string[]>([]);
  const [selectedGuruNips, setSelectedGuruNips] = useState<string[]>([]);
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // CUSTOM SAFE CONFIRMATION DIALOG STATE
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const askConfirm = (title: string, message: string, onConfirmCallback: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirmCallback();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleOpenAddSchedule = () => {
    setScheduleEditId(null);
    setFormScheduleDay("SENIN");
    setFormScheduleTimeSlot("07:30 - 09:00");
    setFormScheduleSubjectId(subjects[0]?.id || "");
    setFormScheduleRoom("Ruang 302");
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (sch: ScheduleItem) => {
    setScheduleEditId(sch.id);
    setFormScheduleDay(sch.day);
    setFormScheduleTimeSlot(sch.timeSlot);
    setFormScheduleSubjectId(sch.subjectId);
    setFormScheduleRoom(sch.room);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formScheduleSubjectId) {
      alert("Harap buat / pilih Kompetensi Kompetisi Mata Pelajaran terlebih dahulu.");
      return;
    }
    if (scheduleEditId) {
      const updated = schedules.map(s => s.id === scheduleEditId ? {
        ...s,
        day: formScheduleDay,
        timeSlot: formScheduleTimeSlot,
        subjectId: formScheduleSubjectId,
        room: formScheduleRoom
      } : s);
      onSetSchedules(updated);
    } else {
      const newSch: ScheduleItem = {
        id: `sch-${Date.now()}`,
        day: formScheduleDay,
        timeSlot: formScheduleTimeSlot,
        subjectId: formScheduleSubjectId,
        room: formScheduleRoom
      };
      onSetSchedules([...schedules, newSch]);
    }
    setIsScheduleModalOpen(false);
  };

  const handleDeleteSchedule = (id: string) => {
    askConfirm(
      "Konfirmasi Hapus Jadwal",
      "Apakah Anda yakin ingin menghapus jadwal pelajaran ini?",
      () => {
        const filtered = schedules.filter(s => s.id !== id);
        onSetSchedules(filtered);
      }
    );
  };

  // School Identity state
  const [schoolName, setSchoolName] = useState("MA AL-MA’SUM");
  const [schoolNpsn, setSchoolNpsn] = useState("20210459");
  const [schoolAccreditation, setSchoolAccreditation] = useState("A (Sangat Baik)");
  const [schoolAddress, setSchoolAddress] = useState("Jl. Raya Pendidikan No. 42, Distrik Akademik, Jawa Barat, Indonesia");

  // Report Filter states
  const [reportClass, setReportClass] = useState("Semua Kelas");
  const [reportStatus, setReportStatus] = useState("Semua Status");
  const [reportType, setReportType] = useState("kehadiran"); // "kehadiran" | "akademik"

  // General state feedback elements
  const toastActive = (msg: string) => {
    alert(msg);
  };

  // CRUD States for KELAS
  const [classSearch, setClassSearch] = useState("");
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classEditIdx, setClassEditIdx] = useState<number | null>(null); // index in classGroups
  const [formClassName, setFormClassName] = useState("");

  // CRUD States for USERS
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserRoleFilter, setSelectedUserRoleFilter] = useState("Semua Peran");
  const [selectedUserClassFilter, setSelectedUserClassFilter] = useState("Semua Kelas");
  const [userTab, setUserTab] = useState<"siswa" | "staff">("siswa");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userEditIdx, setUserEditIdx] = useState<string | null>(null); // username of user being edited
  const [formUserID, setFormUserID] = useState(""); // NIK or NISN
  const [formUserName, setFormUserName] = useState("");
  const [formUserEmail, setFormUserEmail] = useState("");
  const [formUserUsername, setFormUserUsername] = useState("");
  const [formUserRole, setFormUserRole] = useState<string>("Siswa");
  const [formUserClassGroup, setFormUserClassGroup] = useState("");
  const [formUserTitle, setFormUserTitle] = useState("");
  const [formUserPhone, setFormUserPhone] = useState("");
  const [formUserAddress, setFormUserAddress] = useState("");
  const [formUserPassword, setFormUserPassword] = useState("");

  // States for EXCEL/CSV BATCH IMPORT
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error" | "info" | null; message: string }>({ type: null, message: "" });
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "ID_NISN_NIP": "1234567890",
        "Nama_Lengkap": "Budi Santoso",
        "Email": "budi.santoso@ma-alsum.edu",
        "Username": "budis",
        "Peran_Akses": "Siswa",
        "Kelas_Grup": "XII - IPA 1",
        "Password_Akun": "password123",
        "No_Telepon": "08123456789",
        "Alamat_Lengkap": "Jl. Mawar No. 10, Jakarta"
      },
      {
        "ID_NISN_NIP": "198754124501",
        "Nama_Lengkap": "Drs. H. Ahmad Yani",
        "Email": "ahmadyani@ma-alsum.edu",
        "Username": "ahmadyani",
        "Peran_Akses": "Guru",
        "Kelas_Grup": "XII - IPA 1",
        "Password_Akun": "password123",
        "No_Telepon": "08987654321",
        "Alamat_Lengkap": "Jl. Melati No. 5, Bogor"
      }
    ];

    const worksheet = utils.json_to_sheet(templateData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Format_Import_SIALMA");

    worksheet["!cols"] = Array(9).fill({ wch: 22 });

    writeFile(workbook, "SIALMA_Format_Import_Pengguna.xlsx");
    toastActive("Unduhan Form Contoh Excel SIALMA dimulai!");
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus({ type: "info", message: "Membaca berkas unggahan..." });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstream = evt.target?.result;
        if (!bstream) {
          throw new Error("Gagal membaca berkas.");
        }

        const workbook = read(bstream, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson: any[] = utils.sheet_to_json(worksheet, { header: 1 });

        if (rawJson.length < 2) {
          throw new Error("Berkas kosong atau tidak memiliki baris data di luar header!");
        }

        const headers = rawJson[0].map((h: any) => String(h || "").trim().toLowerCase());
        const dataRows = rawJson.slice(1);

        const idxID = headers.findIndex((h: string) => h.includes("id") || h.includes("nisn") || h.includes("nip"));
        const idxNama = headers.findIndex((h: string) => h.includes("nama") || h.includes("name") || h.includes("lengkap"));
        const idxEmail = headers.findIndex((h: string) => h.includes("email") || h.includes("surel"));
        const idxUsername = headers.findIndex((h: string) => h.includes("username") || h.includes("pengguna"));
        const idxPeran = headers.findIndex((h: string) => h.includes("peran") || h.includes("role") || h.includes("akses"));
        const idxKelas = headers.findIndex((h: string) => h.includes("kelas") || h.includes("class") || h.includes("grup"));
        const idxPassword = headers.findIndex((h: string) => h.includes("password") || h.includes("sandi") || h.includes("akun"));
        const idxTelepon = headers.findIndex((h: string) => h.includes("telepon") || h.includes("phone") || h.includes("hp"));
        const idxAlamat = headers.findIndex((h: string) => h.includes("alamat") || h.includes("address") || h.includes("domisili"));

        if (idxID === -1 || idxNama === -1 || idxUsername === -1 || idxPeran === -1) {
          throw new Error("Format kolom salah! Silakan unduh file contoh. Pastikan ada kolom ID_NISN_NIP, Nama_Lengkap, Username, dan Peran_Akses.");
        }

        const newUsers = [...users];
        const newStudents = [...students];
        const newTeachers = [...teachers];

        let successCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;

        for (const row of dataRows) {
          if (!row || row.length === 0) continue;

          const rawId = String(row[idxID] || "").trim();
          const name = String(row[idxNama] || "").trim();
          const email = String(row[idxEmail] || (rawId ? `${rawId.toLowerCase()}@ma-alsum.edu` : "")).trim();
          const origUsername = String(row[idxUsername] || "").trim();
          const classGroup = String(row[idxKelas] || "XII - IPA 1").trim();
          const password = String(row[idxPassword] || "password123").trim();
          const phone = idxTelepon !== -1 ? String(row[idxTelepon] || "").trim() : "";
          const address = idxAlamat !== -1 ? String(row[idxAlamat] || "").trim() : "";

          const rawRole = String(row[idxPeran] || "").trim().toLowerCase();
          let role: any = "Siswa";
          if (rawRole.includes("guru") || rawRole.includes("teacher")) {
            role = "Guru";
          } else if (rawRole.includes("admin") || rawRole.includes("operator")) {
            role = "Admin";
          } else if (rawRole.includes("kepala") || rawRole.includes("kepsek")) {
            role = "Kepala Sekolah";
          }

          if (!rawId || !name || !origUsername || !role) {
            errorCount++;
            continue;
          }

          const username = origUsername.toLowerCase();
          const isDuplicate = newUsers.some((u) => u.username === username || u.id === rawId);

          if (isDuplicate) {
            duplicateCount++;
            continue;
          }

          let avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCV76PALTNnY9-xgkMcL7gBkxiEGJ-VCbspOr_U2LJ-eWj1DHnlQcrBpHzic_GKZIGHDEqSQA1ppDFuw8EdJbpBW74XPLz9qsKLkMMANeczCe60xzLcTTV-29JhNojxqFM123B3UFzXDsh1BEea3VR9TpVEcc22PWqQQ5JAkAcbXuqLr6LpIeutCb0s3hVcu9ruuaPMA8PIRkHfZOT1z8BdBzXRHL04UvcrHAHNyg9w3uq1FycfOyDrMjlRqbF-IY0LJ3m_VhFDaR8";
          if (role === "Siswa") {
            avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBdSLM7QDUvPvc9bf_BQpd_nSXMyJtmPciHHAgEIjgwLfvubstaw4FQP-nOXeMZNMcDkyuEGZOrKqJc5JcIulg0CmeHRKLIVU_loQy7IuFWsw_QLSSQJPklt2cBhnqJV8S1oHlB3sfRSSV_pDuRk7Z35Vz7cm_nJkf-lsFbmzzx_V0oJINJ02cw0YYzFz4P6o_IOVHZoLKENvT0esNZGQeiOHMphm1HK0kZhR3qnAMU6axgS7k4BvZGkLO-sU5k85PmwDhTgeOIyR8";
          } else if (role === "Guru") {
            avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5icwHFGxYosCiNHrjvMKm_MyIY_K1pgE88k2PtBVKwWTfWeL8B8NXSFGdZLXJNdJI1B-AjHknSYptUz9bdGdnMM_jbk1CzUFW1Hylo_-6kVEGas_LJEnRJ0LMVRX5o3P2wWhgcwILQ-x3dBKUSOOjYwbQls7f5FpXG1taAVa_tg9-mS9mKH1T8qbRLUeWtImzduCCOmUYEVYTKEe5lEPKERh0fItehBazU1b3qUSmJXj0gqiJh2-AIqoVLBdIqHz-xTN-VCEqXg";
          } else if (role === "Kepala Sekolah") {
            avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDRqZQXgCJZj6suY41foJt9iIPgkQLGK9cJgxF5IADUTscOR575Ays3FTw2xtdSC80iyBRq_aIpayFaDiZaUpeZjHYXVJIziHqNxbHCyAvA81IImKj_gEjEO94Bhyg5pc2YwecDz1xc2TFdulwcnNOwfZ-HbcqLe690UyUgWSxBjYFPAD6DePV3MUqCognsYh82AlEhOnw2jDjbYO8QLOUpjUy0QqtXg4Yas5bLaxRp_vqrX0q2Qdrflln8wfow_IrA861qYeYx_0Q";
          }

          const newUserObj: UserProfile = {
            id: rawId,
            name,
            email,
            username,
            role,
            avatarUrl,
            classGroup: (role === "Siswa" || role === "Guru") ? classGroup : undefined,
            title: (role === "Guru") ? "Guru Pengampu" : (role === "Kepala Sekolah" ? "Kepala Sekolah" : undefined),
            phone: phone || undefined,
            address: address || undefined,
            password: password || "password123",
          };

          newUsers.push(newUserObj);

          if (role === "Siswa") {
            const hasS = newStudents.some(s => s.nisn === rawId);
            if (!hasS) {
              newStudents.push({
                nisn: rawId,
                name,
                classGroup,
                gender: "Laki-laki",
                status: "AKTIF",
                academicScore: 80,
              });
            }
          } else if (role === "Guru") {
            const hasT = newTeachers.some(t => t.nip === rawId);
            if (!hasT) {
              newTeachers.push({
                nip: rawId,
                name,
                email,
                subject: "Guru Pengampu",
                classGroup: "-",
                status: "Aktif",
                rating: 4.8,
                teachingHours: 20,
                avatarUrl,
              });
            }
          }

          successCount++;
        }

        if (successCount > 0) {
          onSetUsers(newUsers);
          onSetStudents(newStudents);
          onSetTeachers(newTeachers);

          localStorage.setItem("sialma_users", JSON.stringify(newUsers));
          localStorage.setItem("sialma_students", JSON.stringify(newStudents));
          localStorage.setItem("sialma_teachers", JSON.stringify(newTeachers));

          setImportStatus({
            type: "success",
            message: `Selesai! Berhasil terunggah ${successCount} baris pengguna baru. (${duplicateCount} akun dilewati karena duplikat/sudah ada, ${errorCount} data tidak valid).`
          });
          toastActive(`Sukses batch import ${successCount} data pengguna!`);
        } else {
          setImportStatus({
            type: "info",
            message: `Selesai memproses. Tidak ada pengguna baru yang diimpor. (${duplicateCount} dilewati karena sudah ada, ${errorCount} tidak valid).`
          });
        }
      } catch (err: any) {
        setImportStatus({
          type: "error",
          message: err.message || "Gagal memproses unggahan file."
        });
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  // States & Functions for Subject Excel Import
  const [isSubjectImportModalOpen, setIsSubjectImportModalOpen] = useState(false);
  const [subjectImportStatus, setSubjectImportStatus] = useState<{ type: "success" | "error" | "info" | null; message: string }>({ type: null, message: "" });
  const [isSubjectImporting, setIsSubjectImporting] = useState(false);

  const handleDownloadSubjectTemplate = () => {
    const templateData = [
      {
        "Kode_Mapel": "MP-FIS-101",
        "Mata_Pelajaran": "Fisika",
        "NIP_Guru": "197908122005012001",
        "Nama_Guru": "Budi Raharjo, M.Si",
        "Kelas": "XII - IPA 1",
        "Kategori": "Wajib",
        "Jam_Per_Minggu": 3
      },
      {
        "Kode_Mapel": "MP-BIO-102",
        "Mata_Pelajaran": "Biologi Dasar",
        "NIP_Guru": "198305042010021003",
        "Nama_Guru": "Siti Aminah, S.Pd",
        "Kelas": "XII - IPA 1",
        "Kategori": "Peminatan",
        "Jam_Per_Minggu": 4
      }
    ];

    const worksheet = utils.json_to_sheet(templateData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Format_Mapel_SIALMA");
    worksheet["!cols"] = Array(7).fill({ wch: 18 });
    writeFile(workbook, "SIALMA_Format_Import_Mapel.xlsx");
    toastActive("Berkas Format Excel Mata Pelajaran berhasil diunduh!");
  };

  const handleExcelSubjectImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubjectImporting(true);
    setSubjectImportStatus({ type: "info", message: "Membaca berkas mata pelajaran..." });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstream = evt.target?.result;
        if (!bstream) {
          throw new Error("Gagal membaca berkas.");
        }

        const workbook = read(bstream, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson: any[] = utils.sheet_to_json(worksheet, { header: 1 });

        if (rawJson.length < 2) {
          throw new Error("Berkas kosong atau tidak memiliki baris data di luar header!");
        }

        const headers = rawJson[0].map((h: any) => String(h || "").trim().toLowerCase());
        const dataRows = rawJson.slice(1);

        const idxKode = headers.findIndex((h: string) => h.includes("kode") || h.includes("code"));
        const idxMapel = headers.findIndex((h: string) => {
          const lower = h.toLowerCase();
          if (lower.includes("kode") || lower.includes("code")) return false;
          return lower.includes("pelajaran") || lower.includes("mapel") || lower.includes("subject") || lower.includes("nama");
        });
        const idxNip = headers.findIndex((h: string) => h.includes("nip"));
        const idxGuru = headers.findIndex((h: string) => h.includes("guru") || h.includes("teacher") || h.includes("pendidik"));
        const idxKelas = headers.findIndex((h: string) => h.includes("kelas") || h.includes("class") || h.includes("group"));
        const idxKategori = headers.findIndex((h: string) => h.includes("kategori") || h.includes("category"));
        const idxJam = headers.findIndex((h: string) => h.includes("jam") || h.includes("hour") || h.includes("beban"));

        if (idxMapel === -1 || idxKelas === -1) {
          throw new Error("Format kolom salah! Pastikan ada kolom Mata_Pelajaran dan Kelas di berkas Anda.");
        }

        let successCount = 0;
        let errorCount = 0;
        const newSubjects = [...subjects];

        for (const row of dataRows) {
          if (!row || row.length === 0) continue;

          let rawKode = idxKode !== -1 ? String(row[idxKode] || "").trim().toUpperCase() : "";
          const rawMapel = String(row[idxMapel] || "").trim();
          const rawNip = idxNip !== -1 ? String(row[idxNip] || "").trim() : "";
          const rawGuru = idxGuru !== -1 ? String(row[idxGuru] || "").trim() : "";
          const rawKelas = String(row[idxKelas] || "XII - IPA 1").trim();
          const rawKategori = idxKategori !== -1 ? String(row[idxKategori] || "Wajib").trim() : "Wajib";
          const rawJam = idxJam !== -1 ? parseInt(String(row[idxJam] || "3").trim(), 10) : 3;

          if (!rawMapel || !rawKelas) {
            errorCount++;
            continue;
          }

          if (!rawKode) {
            rawKode = `MP-${rawMapel.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
          }

          // Match teacher
          let matchedTeacher = teachers.find(t => 
            (rawNip && t.nip === rawNip) || 
            (rawGuru && t.name.toLowerCase().includes(rawGuru.toLowerCase()))
          );

          if (!matchedTeacher && teachers.length > 0) {
            matchedTeacher = teachers[0]; // fallback
          }

          const teacherId = matchedTeacher ? matchedTeacher.nip : "temp-nip";
          const teacherName = matchedTeacher ? matchedTeacher.name : (rawGuru || "Guru Pengampu");
          const teacherAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5icwHFGxYosCiNHrjvMKm_MyIY_K1pgE88k2PtBVKwWTfWeL8B8NXSFGdZLXJNdJI1B-AjHknSYptUz9bdGdnMM_jbk1CzUFW1Hylo_-6kVEGas_LJEnRJ0LMVRX5o3P2wWhgcwILQ-x3dBKUSOOjYwbQls7f5FpXG1taAVa_tg9-mS9mKH1T8qbRLUeWtImzduCCOmUYEVYTKEe5lEPKERh0fItehBazU1b3qUSmJXj0gqiJh2-AIqoVLBdIqHz-xTN-VCEqXg";

          // Parse Category
          let category: "Wajib" | "Peminatan" | "Muatan Lokal" = "Wajib";
          const catLower = rawKategori.toLowerCase();
          if (catLower.includes("peminatan") || catLower.includes("minat")) {
            category = "Peminatan";
          } else if (catLower.includes("lokal") || catLower.includes("muatan")) {
            category = "Muatan Lokal";
          }

          // Check for existing mapel in current class to avoid duplicating
          const duplicateIndex = newSubjects.findIndex(s => 
            s.name.toLowerCase() === rawMapel.toLowerCase() && 
            s.classGroup === rawKelas
          );

          const updatedMapel: SubjectItem = {
            id: duplicateIndex !== -1 ? newSubjects[duplicateIndex].id : `subj-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            code: rawKode,
            name: rawMapel,
            teacherId,
            teacherName,
            teacherAvatar,
            classGroup: rawKelas,
            category,
            hoursPerWeek: isNaN(rawJam) ? 3 : rawJam
          };

          if (duplicateIndex !== -1) {
            newSubjects[duplicateIndex] = updatedMapel;
          } else {
            newSubjects.push(updatedMapel);
          }
          successCount++;
        }

        onSetSubjects(newSubjects);
        localStorage.setItem("sialma_subjects", JSON.stringify(newSubjects));

        setSubjectImportStatus({
          type: "success",
          message: `Berhasil! Sukses memproses ${successCount} mata pelajaran baru ke kurikulum SIALMA.`
        });
        toastActive(`Sukses batch import ${successCount} mata pelajaran!`);

      } catch (err: any) {
        setSubjectImportStatus({ type: "error", message: `Gagal membaca berkas mata pelajaran: ${err.message}` });
      } finally {
        setIsSubjectImporting(false);
        e.target.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleExportSubjects = () => {
    const data = subjects.map((sub) => ({
      "Kode Mata Pelajaran": sub.code,
      "Mata Pelajaran": sub.name,
      "Guru Pengampu": sub.teacherName,
      "NIP Guru": sub.teacherId,
      "Kelas Terkait": sub.classGroup,
      "Kategori": sub.category,
      "Durasi KBM (Jam/Minggu)": sub.hoursPerWeek,
    }));
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Master_Kurikulum_Mapel");
    worksheet["!cols"] = Array(7).fill({ wch: 18 });
    writeFile(workbook, "SIALMA_Mata_Pelajaran_Kurikulum.xlsx");
    toastActive("Daftar Kurikulum Mapel XLSX berhasil diunduh!");
  };

  // States & Functions for Schedule Excel Import and all exports
  const [isScheduleImportModalOpen, setIsScheduleImportModalOpen] = useState(false);
  const [scheduleImportStatus, setScheduleImportStatus] = useState<{ type: "success" | "error" | "info" | null; message: string }>({ type: null, message: "" });
  const [isScheduleImporting, setIsScheduleImporting] = useState(false);

  const handleDownloadScheduleTemplate = () => {
    const templateData = [
      {
        "Hari": "SENIN",
        "Waktu_Mulai": "07:30",
        "Waktu_Selesai": "09:00",
        "Mata_Pelajaran": "Fisika",
        "Kelas": "XII - IPA 1",
        "Ruangan": "Lab Fisika Lt 2"
      },
      {
        "Hari": "SENIN",
        "Waktu_Mulai": "09:15",
        "Waktu_Selesai": "10:45",
        "Mata_Pelajaran": "Matematika",
        "Kelas": "XII - IPA 1",
        "Ruangan": "Kelas XII IPA 1"
      },
      {
        "Hari": "SELASA",
        "Waktu_Mulai": "07:30",
        "Waktu_Selesai": "09:00",
        "Mata_Pelajaran": "Kimia",
        "Kelas": "XII - IPA 2",
        "Ruangan": "Lab Kimia"
      },
      {
        "Hari": "SELASA",
        "Waktu_Mulai": "09:15",
        "Waktu_Selesai": "10:45",
        "Mata_Pelajaran": "Biologi",
        "Kelas": "XII - IPA 2",
        "Ruangan": "Lab Biologi"
      },
      {
        "Hari": "RABU",
        "Waktu_Mulai": "07:30",
        "Waktu_Selesai": "09:00",
        "Mata_Pelajaran": "Bahasa Indonesia",
        "Kelas": "XI - IPS 1",
        "Ruangan": "Kelas XI IPS 1"
      },
      {
        "Hari": "KAMIS",
        "Waktu_Mulai": "11:15",
        "Waktu_Selesai": "12:45",
        "Mata_Pelajaran": "Sejarah",
        "Kelas": "XI - IPS 1",
        "Ruangan": "Kelas XI IPS 1"
      },
      {
        "Hari": "JUMAT",
        "Waktu_Mulai": "08:00",
        "Waktu_Selesai": "09:30",
        "Mata_Pelajaran": "Pendidikan Agama",
        "Kelas": "XII - IPA 1",
        "Ruangan": "Masjid Al-Ma'sum"
      },
      {
        "Hari": "SABTU",
        "Waktu_Mulai": "07:30",
        "Waktu_Selesai": "09:00",
        "Mata_Pelajaran": "Ke-NU-an",
        "Kelas": "XII - IPA 1",
        "Ruangan": "Kelas XII IPA 1"
      }
    ];

    const worksheet = utils.json_to_sheet(templateData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Format_Jadwal_SIALMA");
    worksheet["!cols"] = Array(6).fill({ wch: 18 });
    writeFile(workbook, "SIALMA_Format_Import_Jadwal.xlsx");
    toastActive("Berkas Format Excel Jadwal Pelajaran berhasil diunduh!");
  };

  const handleExcelScheduleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScheduleImporting(true);
    setScheduleImportStatus({ type: "info", message: "Membaca berkas jadwal..." });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstream = evt.target?.result;
        if (!bstream) {
          throw new Error("Gagal membaca berkas.");
        }

        const workbook = read(bstream, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawJson: any[] = utils.sheet_to_json(worksheet, { header: 1 });

        if (rawJson.length < 2) {
          throw new Error("Berkas kosong atau tidak memiliki baris data di luar header!");
        }

        const headers = rawJson[0].map((h: any) => 
          String(h || "").trim().toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ")
        );
        const dataRows = rawJson.slice(1);

        const idxHari = headers.findIndex((h: string) => h.includes("hari") || h.includes("day"));
        const idxMulai = headers.findIndex((h: string) => h.includes("mulai") || h.includes("start") || h.includes("begin") || h.includes("waktu"));
        const idxSelesai = headers.findIndex((h: string) => h.includes("selesai") || h.includes("end"));
        const idxMapel = headers.findIndex((h: string) => {
          const lower = h.toLowerCase();
          if (lower.includes("kode") || lower.includes("code")) return false;
          return lower.includes("mapel") || lower.includes("pelajaran") || lower.includes("subject") || lower.includes("mata");
        });
        const idxKelas = headers.findIndex((h: string) => h.includes("kelas") || h.includes("class") || h.includes("group"));
        const idxRuangan = headers.findIndex((h: string) => h.includes("ruang") || h.includes("room"));

        if (idxHari === -1 || idxMapel === -1 || idxKelas === -1) {
          throw new Error(`Format kolom salah! Kami mendeteksi header berikut: [${headers.join(", ")}]. Pastikan spreadsheet memiliki minimal kolom 'Hari', 'Mata Pelajaran', dan 'Kelas'.`);
        }

        const newSchedules = [...schedules];
        const newSubjects = [...subjects];
        let successCount = 0;
        let errorCount = 0;

        const formatExcelTime = (val: any): string => {
          if (val === undefined || val === null) return "";
          const str = String(val).trim();
          if (!str) return "";
          const num = Number(str);
          if (!isNaN(num) && num > 0 && num < 1) {
            const totalMinutes = Math.round(num * 24 * 60);
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
          }
          const cleaned = str.replace(/\./g, ":");
          const match = cleaned.match(/(\d{1,2}):(\d{2})/);
          if (match) {
            const hours = String(Number(match[1])).padStart(2, "0");
            const mins = match[2];
            return `${hours}:${mins}`;
          }
          return str;
        };

        for (const row of dataRows) {
          if (!row || row.length === 0 || row.every((c: any) => c === null || c === undefined || String(c).trim() === "")) continue;

          let rawHari = String(row[idxHari] || "").trim().toUpperCase();
          const rawMulai = idxMulai !== -1 ? formatExcelTime(row[idxMulai]) || "07:30" : "07:30";
          const rawSelesai = idxSelesai !== -1 ? formatExcelTime(row[idxSelesai]) || "09:00" : "09:00";
          const rawMapel = String(row[idxMapel] || "").trim();
          const rawKelas = String(row[idxKelas] || "XII - IPA 1").trim();
          const rawRuangan = idxRuangan !== -1 ? String(row[idxRuangan] || `Kelas ${rawKelas}`).trim() : `Kelas ${rawKelas}`;

          // Validate Day
          const validDays = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
          if (!validDays.includes(rawHari)) {
            if (rawHari === "MONDAY") rawHari = "SENIN";
            else if (rawHari === "TUESDAY") rawHari = "SELASA";
            else if (rawHari === "WEDNESDAY") rawHari = "RABU";
            else if (rawHari === "THURSDAY") rawHari = "KAMIS";
            else if (rawHari === "FRIDAY") rawHari = "JUMAT";
            else if (rawHari === "SATURDAY") rawHari = "SABTU";
            else {
              errorCount++;
              continue;
            }
          }

          if (!rawMapel || !rawKelas) {
            errorCount++;
            continue;
          }

          // Search or create matching SubjectItem
          let matchedSub = newSubjects.find(s => 
            s.name.toLowerCase() === rawMapel.toLowerCase() && 
            s.classGroup === rawKelas
          );

          if (!matchedSub) {
            const defaultTeacher = teachers[0] || { nip: "temp-nip", name: "Guru Pengampu" };
            matchedSub = {
              id: `subj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              code: `MP-${rawMapel.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
              name: rawMapel,
              teacherId: defaultTeacher.nip,
              teacherName: defaultTeacher.name,
              teacherAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5icwHFGxYosCiNHrjvMKm_MyIY_K1pgE88k2PtBVKwWTfWeL8B8NXSFGdZLXJNdJI1B-AjHknSYptUz9bdGdnMM_jbk1CzUFW1Hylo_-6kVEGas_LJEnRJ0LMVRX5o3P2wWhgcwILQ-x3dBKUSOOjYwbQls7f5FpXG1taAVa_tg9-mS9mKH1T8qbRLUeWtImzduCCOmUYEVYTKEe5lEPKERh0fItehBazU1b3qUSmJXj0gqiJh2-AIqoVLBdIqHz-xTN-VCEqXg",
              classGroup: rawKelas,
              category: "Wajib",
              hoursPerWeek: 3
            };
            newSubjects.push(matchedSub);
          }

          const timeSlot = `${rawMulai} - ${rawSelesai}`;
          
          // Check duplicate day and slot for this class group to avoid overlapping
          const isOverlap = newSchedules.some(s => 
            s.day === rawHari && 
            s.timeSlot === timeSlot && 
            newSubjects.find(sub => sub.id === s.subjectId)?.classGroup === rawKelas
          );

          if (isOverlap) {
            // Overlapping slot, overwrite it to prevent duplicates causing "berantakan"
            const overlapIndex = newSchedules.findIndex(s => 
              s.day === rawHari && 
              s.timeSlot === timeSlot && 
              newSubjects.find(sub => sub.id === s.subjectId)?.classGroup === rawKelas
            );
            if (overlapIndex !== -1) {
              newSchedules[overlapIndex] = {
                ...newSchedules[overlapIndex],
                subjectId: matchedSub.id,
                room: rawRuangan
              };
              successCount++;
              continue;
            }
          }

          const newSchObj: ScheduleItem = {
            id: `sch-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            day: rawHari as any,
            timeSlot,
            subjectId: matchedSub.id,
            room: rawRuangan
          };

          newSchedules.push(newSchObj);
          successCount++;
        }

        onSetSubjects(newSubjects);
        onSetSchedules(newSchedules);

        localStorage.setItem("sialma_subjects", JSON.stringify(newSubjects));
        localStorage.setItem("sialma_schedules", JSON.stringify(newSchedules));

        setScheduleImportStatus({
          type: "success",
          message: `Berhasil memetakan jadwal! Terimport ${successCount} slot pelajaran. ${errorCount > 0 ? `Sebanyak ${errorCount} baris data dilewati karena format bermasalah.` : ""}`
        });

        toastActive(`Sukses batch import ${successCount} jadwal pelajaran!`);

      } catch (err: any) {
        setScheduleImportStatus({ type: "error", message: `Gagal membaca berkas jadwal: ${err.message}` });
      } finally {
        setIsScheduleImporting(false);
        e.target.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  // HANDLERS UNTUK AKSI SELEKSI & OPERASI MASSAL (BULK OPERATIONS)
  const handleBulkDeleteSchedules = () => {
    if (selectedScheduleIds.length === 0) return;
    askConfirm(
      "Konfirmasi Hapus Massal Jadwal",
      `Apakah Anda yakin ingin menghapus ${selectedScheduleIds.length} jadwal pelajaran sekaligus? Tindakan ini bersifat permanen.`,
      () => {
        const remaining = schedules.filter(s => !selectedScheduleIds.includes(s.id));
        onSetSchedules(remaining);
        localStorage.setItem("sialma_schedules", JSON.stringify(remaining));
        setSelectedScheduleIds([]);
        toastActive("Berhasil menghapus jadwal pelajaran terpilih secara massal!");
      }
    );
  };

  const handleBulkChangeStudentStatus = (status: "AKTIF" | "NON-AKTIF") => {
    if (selectedStudentNisns.length === 0) return;
    askConfirm(
      "Ubah Status Massal Siswa",
      `Apakah Anda yakin ingin mengubah status ${selectedStudentNisns.length} siswa terpilih menjadi ${status}?`,
      () => {
        const updated = students.map(s => selectedStudentNisns.includes(s.nisn) ? { ...s, status } : s);
        onSetStudents(updated);
        localStorage.setItem("sialma_students", JSON.stringify(updated));
        setSelectedStudentNisns([]);
        toastActive(`Status ${status} berhasil diterapkan ke semua siswa terpilih!`);
      }
    );
  };

  const handleBulkDeleteStudents = () => {
    if (selectedStudentNisns.length === 0) return;
    askConfirm(
      "Hapus Massal Siswa",
      `Apakah Anda yakin ingin menghapus ${selectedStudentNisns.length} siswa secara massal? Tindakan ini akan menghapus data mereka secara permanen dari sistem.`,
      () => {
        const remaining = students.filter(s => !selectedStudentNisns.includes(s.nisn));
        onSetStudents(remaining);
        localStorage.setItem("sialma_students", JSON.stringify(remaining));
        setSelectedStudentNisns([]);
        toastActive("Berhasil menghapus siswa terpilih secara massal!");
      }
    );
  };

  const handleBulkChangeGuruStatus = (status: "Aktif" | "Cuti") => {
    if (selectedGuruNips.length === 0) return;
    askConfirm(
      "Ubah Kepegawaian Massal",
      `Apakah Anda yakin ingin mengubah status kepegawaian ${selectedGuruNips.length} Guru terpilih menjadi ${status}?`,
      () => {
        const updated = teachers.map(t => selectedGuruNips.includes(t.nip) ? { ...t, status } : t);
        onSetTeachers(updated);
        localStorage.setItem("sialma_teachers", JSON.stringify(updated));
        setSelectedGuruNips([]);
        toastActive(`Status Kepegawaian ${status} berhasil diterapkan ke semua guru terpilih!`);
      }
    );
  };

  const handleBulkDeleteGuru = () => {
    if (selectedGuruNips.length === 0) return;
    askConfirm(
      "Hapus Massal Guru",
      `Apakah Anda yakin ingin menghapus ${selectedGuruNips.length} data guru yang dipilih? Tindakan ini menghapus draf mengajar mereka pula.`,
      () => {
        const remaining = teachers.filter(t => !selectedGuruNips.includes(t.nip));
        onSetTeachers(remaining);
        localStorage.setItem("sialma_teachers", JSON.stringify(remaining));
        setSelectedGuruNips([]);
        toastActive("Berhasil menghapus data guru terpilih secara massal.");
      }
    );
  };

  const handleBulkResetUserPasswords = () => {
    if (selectedUsernames.length === 0) return;
    askConfirm(
      "Reset Sandi Akun Pengguna Massal",
      `Apakah Anda yakin ingin mereset password ${selectedUsernames.length} akun pengguna terpilih menjadi "123" untuk memudahkan akses login baru?`,
      () => {
        const updated = users.map(u => 
          selectedUsernames.includes(u.username) && u.username !== "admin" 
            ? { ...u, password: "123" } 
            : u
        );
        onSetUsers(updated);
        localStorage.setItem("sialma_users", JSON.stringify(updated));
        setSelectedUsernames([]);
        toastActive("Berhasil mereset sandi pengguna terpilih ke '123'!");
      }
    );
  };

  const handleBulkDeleteUsers = () => {
    const validSelections = selectedUsernames.filter(un => un !== "admin");
    if (validSelections.length === 0) {
      toastActive("Tidak ada akun dapat dilepas (Akun super administrator dilindungi).");
      setSelectedUsernames([]);
      return;
    }
    askConfirm(
      "Hapus Massal Akun Pengguna",
      `Apakah Anda yakin ingin menghapus ${validSelections.length} akun pengguna sekaligus secara massal dari madrasah?`,
      () => {
        const remaining = users.filter(u => !validSelections.includes(u.username));
        onSetUsers(remaining);
        localStorage.setItem("sialma_users", JSON.stringify(remaining));
        setSelectedUsernames([]);
        toastActive("Berhasil menghapus akun pengguna terpilih secara massal!");
      }
    );
  };

  const handleExportStudents = () => {
    const data = students.map((s) => ({
      "NISN": s.nisn,
      "Nama Lengkap": s.name,
      "Kelas": s.classGroup,
      "Jenis Kelamin": s.gender,
      "Status": s.status,
      "Skor Akademik": s.academicScore,
    }));
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Daftar_Siswa");
    worksheet["!cols"] = Array(6).fill({ wch: 18 });
    writeFile(workbook, "SIALMA_Daftar_Siswa.xlsx");
    toastActive("Siswa XLSX berhasil diunduh!");
  };

  const handleExportTeachers = () => {
    const data = teachers.map((t) => ({
      "NIP/ID": t.nip,
      "Nama Lengkap": t.name,
      "Email": t.email,
      "Mata Pelajaran": t.subject || "-",
      "Kelas Perwalian": t.classGroup || "-",
      "Status Kepegawaian": t.status || "Aktif",
    }));
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Daftar_Guru");
    worksheet["!cols"] = Array(6).fill({ wch: 20 });
    writeFile(workbook, "SIALMA_Daftar_Guru.xlsx");
    toastActive("Guru XLSX berhasil diunduh!");
  };

  const handleDownloadTeacherTemplate = () => {
    const templateData = [
      {
        NIP: "197405121999031002",
        Nama_Lengkap: "Ahmad Fauzi, M.Pd.",
        Email: "ahmad.f@masum.sch.id",
        Mata_Pelajaran: "Matematika",
        Wali_Kelas: "XII - IPA 1"
      },
      {
        NIP: "198506042012012001",
        Nama_Lengkap: "Dra. Hj. Nurjanah",
        Email: "nurjanah@ma-alsum.sch.id",
        Mata_Pelajaran: "Biologi",
        Wali_Kelas: "-"
      }
    ];
    const worksheet = utils.json_to_sheet(templateData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Format_Import_Guru");
    writeFile(workbook, "SIALMA_Format_Import_Guru.xlsx");
    toastActive("Berkas Format Excel Guru berhasil diunduh!");
  };

  const handleImportTeachersExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson = utils.sheet_to_json<any>(sheet);
        
        if (rawJson.length === 0) {
          alert("Berkas excel kosong atau tidak valid!");
          return;
        }

        const importedTeachers: TeacherItem[] = [];
        const importedUsers: UserProfile[] = [];
        
        rawJson.forEach((row: any, idx: number) => {
          const nip = String(row.NIP || row.nip || `GUR-${Date.now() + idx}`).trim();
          const name = String(row.Nama_Lengkap || row.nama || row.Nama || "Guru Baru").trim();
          const email = String(row.Email || row.email || `${nip}@ma-alsum.sch.id`).trim();
          const subject = String(row.Mata_Pelajaran || row.subject || row.mapel || "Umum").trim();
          const classGroup = String(row.Wali_Kelas || row.classGroup || row.kelas || "-").trim();
          
          if (!nip || nip === "undefined") return;

          importedTeachers.push({
            nip,
            name,
            email,
            subject,
            classGroup,
            status: "Aktif",
            rating: 5.0,
            teachingHours: 24,
            avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5icwHFGxYosCiNHrjvMKm_MyIY_K1pgE88k2PtBVKwWTfWeL8B8NXSFGdZLXJNdJI1B-AjHknSYptUz9bdGdnMM_jbk1CzUFW1Hylo_-6kVEGas_LJEnRJ0LMVRX5o3P2wWhgcwILQ-x3dBKUSOOjYwbQls7f5FpXG1taAVa_tg9-mS9mKH1T8qbRLUeWtImzduCCOmUYEVYTKEe5lEPKERh0fItehBazU1b3qUSmJXj0gqiJh2-AIqoVLBdIqHz-xTN-VCEqXg"
          });

          importedUsers.push({
            id: nip,
            name,
            email,
            username: nip,
            role: "Guru" as any,
            avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5icwHFGxYosCiNHrjvMKm_MyIY_K1pgE88k2PtBVKwWTfWeL8B8NXSFGdZLXJNdJI1B-AjHknSYptUz9bdGdnMM_jbk1CzUFW1Hylo_-6kVEGas_LJEnRJ0LMVRX5o3P2wWhgcwILQ-x3dBKUSOOjYwbQls7f5FpXG1taAVa_tg9-mS9mKH1T8qbRLUeWtImzduCCOmUYEVYTKEe5lEPKERh0fItehBazU1b3qUSmJXj0gqiJh2-AIqoVLBdIqHz-xTN-VCEqXg",
            classGroup,
            subjects: [subject],
            password: "123",
            title: `Guru ${subject}`
          });
        });

        onSetTeachers([...teachers, ...importedTeachers]);
        onSetUsers([...users, ...importedUsers]);
        
        toastActive(`Sukses mengimpor ${importedTeachers.length} Guru Baru! Password default: 123`);
      } catch (err: any) {
        alert("Gagal membaca atau mengurai berkas excel. Pastikan format kolom sesuai template: NIP, Nama_Lengkap, Email, Mata_Pelajaran, Wali_Kelas");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleExportSchedules = () => {
    const data = schedules.map((sch) => {
      const specialMeta = getSpecialSessionMeta(sch.subjectId);
      const sub = specialMeta ? null : subjects.find(s => s.id === sch.subjectId);
      const subName = specialMeta ? specialMeta.label : (sub ? sub.name : "-");
      const cls = specialMeta ? specialMeta.classGroup : (sub ? sub.classGroup : "-");
      const teacher = specialMeta ? specialMeta.attendee : (sub ? sub.teacherName : "-");
      return {
        "Hari": sch.day,
        "Waktu": sch.timeSlot,
        "Mata Pelajaran": subName,
        "Kelas": cls,
        "Guru Pengaruh": teacher,
        "Ruangan/Sektor": sch.room,
      };
    });
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Jadwal_Pelajaran");
    worksheet["!cols"] = Array(6).fill({ wch: 18 });
    writeFile(workbook, "SIALMA_Jadwal_Pelajaran.xlsx");
    toastActive("Jadwal XLSX berhasil diunduh!");
  };

  const handleExportAttendance = () => {
    const data = validAttendanceRecords.map((r) => {
      const student = students.find(s => s.nisn === r.nisn || s.name === r.studentName);
      const subName = subjects.find(s => s.id === r.subjectId)?.name || "Matematika Peminatan";
      return {
        "Nama Siswa": r.studentName,
        "NISN": r.nisn,
        "Kelas": student ? student.classGroup : "XII - IPA 1",
        "Mata Pelajaran": subName,
        "Tanggal": new Date(r.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'numeric', year: 'numeric' }),
        "Status": r.status === "H" ? "Hadir" : r.status === "S" ? "Sakit" : r.status === "I" ? "Izin" : "Alpha",
        "Keterangan/Catatan": r.note || "-",
      };
    });
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Laporan_Kehadiran");
    worksheet["!cols"] = Array(7).fill({ wch: 18 });
    writeFile(workbook, "SIALMA_Rekap_Presensi.xlsx");
    toastActive("Laporan Kehadiran XLSX berhasil diunduh!");
  };

  const handleExportGrades = () => {
    const data = validGradeRecords.map((g) => {
      const studentObj = students.find(s => s.nisn === g.nisn || s.name === g.studentName);
      const classGroup = studentObj ? studentObj.classGroup : "XII - IPA 1";
      const subName = subjects.find(s => s.id === g.subjectId)?.name || "Matematika Peminatan";
      return {
        "Nama Siswa": g.studentName,
        "Mata Pelajaran": subName,
        "Sektor Kelas": classGroup,
        "Tugas": g.assignmentScore,
        "UTS": g.utsScore,
        "UAS": g.uasScore,
        "Nilai Akhir": g.finalScore,
        "Grade Keberhasilan": g.grade,
        "Rekomendasi Tindakan": g.note || "Tuntas",
      };
    });
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Laporan_Akademik");
    worksheet["!cols"] = Array(9).fill({ wch: 18 });
    writeFile(workbook, "SIALMA_Rekap_Nilai_Rapor.xlsx");
    toastActive("Siswa Akademik Nilai XLSX berhasil diunduh!");
  };

  const handleOpenClassModal = (className?: string, index?: number) => {
    if (className !== undefined && index !== undefined) {
      setClassEditIdx(index);
      setFormClassName(className);
    } else {
      setClassEditIdx(null);
      setFormClassName("");
    }
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formClassName.trim();
    if (!cleanName) {
      alert("Nama kelas tidak boleh kosong!");
      return;
    }

    if (classEditIdx !== null) {
      // Edit
      const oldName = classGroups[classEditIdx];
      if (cleanName !== oldName && classGroups.includes(cleanName)) {
        alert("Kelas dengan nama tersebut sudah terdaftar!");
        return;
      }
      const updated = [...classGroups];
      updated[classEditIdx] = cleanName;
      onSetClassGroups(updated);

      // Cascade update to students and teachers
      const updatedStudents = students.map(s => s.classGroup === oldName ? { ...s, classGroup: cleanName } : s);
      onSetStudents(updatedStudents);

      const updatedTeachers = teachers.map(t => t.classGroup === oldName ? { ...t, classGroup: cleanName } : t);
      onSetTeachers(updatedTeachers);

      toastActive(`Kelas "${oldName}" berhasil diubah menjadi "${cleanName}".`);
    } else {
      // Add
      if (classGroups.includes(cleanName)) {
        alert("Kelas dengan nama tersebut sudah terdaftar!");
        return;
      }
      const updated = [...classGroups, cleanName];
      onSetClassGroups(updated);
      toastActive(`Kelas "${cleanName}" berhasil ditambahkan!`);
    }
    setIsClassModalOpen(false);
  };

  const handleDeleteClass = (className: string) => {
    const studentCount = students.filter(s => s.classGroup === className).length;
    if (studentCount > 0) {
      alert(`Tidak bisa menghapus kelas ini karena masih memiliki ${studentCount} orang siswa terdaftar.`);
      return;
    }
    askConfirm(
      "Konfirmasi Hapus Kelas",
      `Apakah Anda yakin ingin menghapus kelas "${className}"?`,
      () => {
        const filtered = classGroups.filter(c => c !== className);
        onSetClassGroups(filtered);
        toastActive(`Kelas "${className}" telah dihapus.`);
      }
    );
  };

  const handleOpenUserModal = (usr?: UserProfile) => {
    if (usr) {
      setUserEditIdx(usr.username);
      setFormUserID(usr.id);
      setFormUserName(usr.name);
      setFormUserEmail(usr.email);
      setFormUserUsername(usr.username);
      setFormUserRole(usr.role);
      setFormUserClassGroup(usr.classGroup || classGroups[0] || "XII - IPA 1");
      setFormUserTitle(usr.title || "");
      setFormUserPhone(usr.phone || "");
      setFormUserAddress(usr.address || "");
      setFormUserPassword(usr.password || "password123");
    } else {
      setUserEditIdx(null);
      setFormUserID("");
      setFormUserName("");
      setFormUserEmail("");
      setFormUserUsername("");
      setFormUserRole("Siswa");
      setFormUserClassGroup(classGroups[0] || "XII - IPA 1");
      setFormUserTitle("Siswa SIALMA");
      setFormUserPhone("");
      setFormUserAddress("");
      setFormUserPassword("password123");
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserUsername || !formUserName || !formUserEmail || !formUserID) {
      alert("Harap lengkapi field wajib: ID (NIP/NISN), Nama Lengkap, Email, dan Username!");
      return;
    }

    const cleanUsername = formUserUsername.trim().toLowerCase();

    // Check duplicate usernames
    const isDuplicateUser = users.some(u => u.username.toLowerCase() === cleanUsername && u.username !== userEditIdx);
    if (isDuplicateUser) {
      alert("Username tersebut sudah terdaftar! Gunakan username lain.");
      return;
    }

    // Default Avatar matching role
    let customAvatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCV76PALTNnY9-xgkMcL7gBkxiEGJ-VCbspOr_U2LJ-eWj1DHnlQcrBpHzic_GKZIGHDEqSQA1ppDFuw8EdJbpBW74XPLz9qsKLkMMANeczCe60xzLcTTV-29JhNojxqFM123B3UFzXDsh1BEea3VR9TpVEcc22PWqQQ5JAkAcbXuqLr6LpIeutCb0s3hVcu9ruuaPMA8PIRkHfZOT1z8BdBzXRHL04UvcrHAHNyg9w3uq1FycfOyDrMjlRqbF-IY0LJ3m_VhFDaR8"; // Admin style fallback
    if (formUserRole === "Siswa") {
      customAvatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuBdSLM7QDUvPvc9bf_BQpd_nSXMyJtmPciHHAgEIjgwLfvubstaw4FQP-nOXeMZNMcDkyuEGZOrKqJc5JcIulg0CmeHRKLIVU_loQy7IuFWsw_QLSSQJPklt2cBhnqJV8S1oHlB3sfRSSV_pDuRk7Z35Vz7cm_nJkf-lsFbmzzx_V0oJINJ02cw0YYzFz4P6o_IOVHZoLKENvT0esNZGQeiOHMphm1HK0kZhR3qnAMU6axgS7k4BvZGkLO-sU5k85PmwDhTgeOIyR8";
    } else if (formUserRole === "Guru") {
      customAvatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5icwHFGxYosCiNHrjvMKm_MyIY_K1pgE88k2PtBVKwWTfWeL8B8NXSFGdZLXJNdJI1B-AjHknSYptUz9bdGdnMM_jbk1CzUFW1Hylo_-6kVEGas_LJEnRJ0LMVRX5o3P2wWhgcwILQ-x3dBKUSOOjYwbQls7f5FpXG1taAVa_tg9-mS9mKH1T8qbRLUeWtImzduCCOmUYEVYTKEe5lEPKERh0fItehBazU1b3qUSmJXj0gqiJh2-AIqoVLBdIqHz-xTN-VCEqXg";
    } else if (formUserRole === "Kepala Sekolah") {
      customAvatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuDRqZQXgCJZj6suY41foJt9iIPgkQLGK9cJgxF5IADUTscOR575Ays3FTw2xtdSC80iyBRq_aIpayFaDiZaUpeZjHYXVJIziHqNxbHCyAvA81IImKj_gEjEO94Bhyg5pc2YwecDz1xc2TFdulwcnNOwfZ-HbcqLe690UyUgWSxBjYFPAD6DePV3MUqCognsYh82AlEhOnw2jDjbYO8QLOUpjUy0QqtXg4Yas5bLaxRp_vqrX0q2Qdrflln8wfow_IrA861qYeYx_0Q";
    }

    const newUser: UserProfile = {
      id: formUserID.trim(),
      name: formUserName.trim(),
      email: formUserEmail.trim(),
      username: cleanUsername,
      role: formUserRole as any,
      avatarUrl: customAvatarUrl,
      classGroup: formUserRole === "Siswa" || formUserRole === "Guru" ? formUserClassGroup : undefined,
      title: formUserTitle.trim() || undefined,
      phone: formUserPhone.trim() || undefined,
      address: formUserAddress.trim() || undefined,
      password: formUserPassword.trim() || "password123",
    };

    if (userEditIdx) {
      // Edit mode
      const updatedUsers = users.map(u => u.username === userEditIdx ? newUser : u);
      onSetUsers(updatedUsers);

      // Synchronize with core lists
      if (formUserRole === "Siswa") {
        const updatedStudents = students.map(s => s.nisn === formUserID ? {
          ...s,
          name: formUserName,
          classGroup: formUserClassGroup,
        } : s);
        onSetStudents(updatedStudents);
      } else if (formUserRole === "Guru") {
        const updatedTeachers = teachers.map(t => t.nip === formUserID ? {
          ...t,
          name: formUserName,
          email: formUserEmail,
          classGroup: formUserClassGroup,
        } : t);
        onSetTeachers(updatedTeachers);
      }

      toastActive(`Data pengguna "${formUserName}" berhasil diperbarui.`);
    } else {
      // Add mode
      onSetUsers([...users, newUser]);

      // Dynamic automatic dual-write cascade
      if (formUserRole === "Siswa") {
        const isStudentExist = students.some(s => s.nisn === formUserID);
        if (!isStudentExist) {
          const newStud: StudentItem = {
            nisn: formUserID.trim(),
            name: formUserName.trim(),
            classGroup: formUserClassGroup,
            gender: "Laki-laki", // default standard
            status: "AKTIF",
            academicScore: 80,
          };
          onSetStudents([...students, newStud]);
        }
      } else if (formUserRole === "Guru") {
        const isTeacherExist = teachers.some(t => t.nip === formUserID);
        if (!isTeacherExist) {
          const newTeach: TeacherItem = {
            nip: formUserID.trim(),
            name: formUserName.trim(),
            email: formUserEmail.trim(),
            subject: formUserTitle || "Guru Pengampu",
            classGroup: "-",
            status: "Aktif",
            rating: 4.8,
            teachingHours: 20,
            avatarUrl: customAvatarUrl,
          };
          onSetTeachers([...teachers, newTeach]);
        }
      }

      toastActive(`Akun pengguna baru untuk "${formUserName}" (${formUserRole}) berhasil ditambahkan dan dibuat serentak!`);
    }

    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (usr: UserProfile) => {
    askConfirm(
      "Konfirmasi Hapus Pengguna",
      `Apakah Anda yakin ingin menghapus akun pengguna "${usr.name}" (${usr.role})? Data terkait seperti profil siswa/guru juga akan disesuaikan secara otomatis.`,
      () => {
        const filtered = users.filter(u => u.username !== usr.username);
        onSetUsers(filtered);

        if (usr.role === "Siswa") {
          const updatedS = students.filter(s => s.nisn !== usr.id);
          onSetStudents(updatedS);
        } else if (usr.role === "Guru") {
          const updatedT = teachers.filter(t => t.nip !== usr.id);
          onSetTeachers(updatedT);
        }

        toastActive(`Akun pengguna "${usr.name}" berhasil dihapus.`);
      }
    );
  };

  // Student Actions
  const handleOpenSiswaModal = (siswa?: StudentItem) => {
    if (siswa) {
      setSiswaEditIdx(siswa.nisn);
      setFormSiswaNisn(siswa.nisn);
      setFormSiswaName(siswa.name);
      setFormSiswaClass(siswa.classGroup);
      setFormSiswaGender(siswa.gender);
      setFormSiswaStatus(siswa.status);
    } else {
      setSiswaEditIdx(null);
      setFormSiswaNisn("");
      setFormSiswaName("");
      setFormSiswaClass("XII - IPA 1");
      setFormSiswaGender("Laki-laki");
      setFormSiswaStatus("AKTIF");
    }
    setIsSiswaModalOpen(true);
  };

  const handleSaveSiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSiswaNisn || !formSiswaName) {
      alert("Silakan isi NISN dan Nama Lengkap!");
      return;
    }

    if (siswaEditIdx) {
      // Edit
      if (formSiswaNisn !== siswaEditIdx) {
        const isExisting = students.some((s) => s.nisn === formSiswaNisn);
        if (isExisting) {
          alert("Siswa dengan NISN tersebut sudah ada!");
          return;
        }
      }
      const updated = students.map((s) =>
        s.nisn === siswaEditIdx
          ? { ...s, nisn: formSiswaNisn, name: formSiswaName, classGroup: formSiswaClass, gender: formSiswaGender, status: formSiswaStatus }
          : s
      );
      onSetStudents(updated);
      toastActive("Data siswa berhasil diperbarui!");
    } else {
      // Add
      const isExisting = students.some((s) => s.nisn === formSiswaNisn);
      if (isExisting) {
        alert("Siswa dengan NISN tersebut sudah ada!");
        return;
      }
      const newStud: StudentItem = {
        nisn: formSiswaNisn,
        name: formSiswaName,
        classGroup: formSiswaClass,
        gender: formSiswaGender,
        status: formSiswaStatus,
        academicScore: 80,
      };
      onSetStudents([...students, newStud]);
      toastActive("Siswa baru berhasil ditambahkan!");
    }
    setIsSiswaModalOpen(false);
  };

  const handleDeleteSiswa = (nisn: string) => {
    askConfirm(
      "Konfirmasi Hapus Siswa",
      "Apakah Anda yakin ingin menghapus data siswa ini?",
      () => {
        const filtered = students.filter((s) => s.nisn !== nisn);
        onSetStudents(filtered);
        toastActive("Data siswa berhasil dihapus.");
      }
    );
  };

  // Teacher Actions
  const handleOpenGuruModal = (guru?: TeacherItem) => {
    if (guru) {
      setGuruEditIdx(guru.nip);
      setFormGuruNip(guru.nip);
      setFormGuruName(guru.name);
      setFormGuruEmail(guru.email);
      setFormGuruSubject(guru.subject);
      setFormGuruWali(guru.classGroup);
      setFormGuruStatus(guru.status);
    } else {
      setGuruEditIdx(null);
      setFormGuruNip("");
      setFormGuruName("");
      setFormGuruEmail("");
      setFormGuruSubject("Matematika");
      setFormGuruWali("-");
      setFormGuruStatus("Aktif");
    }
    setIsGuruModalOpen(true);
  };

  const handleSaveGuru = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGuruNip || !formGuruName || !formGuruEmail) {
      alert("Harap isi NIP, Nama, dan Email!");
      return;
    }

    if (guruEditIdx) {
      if (formGuruNip !== guruEditIdx) {
        const isExisting = teachers.some((g) => g.nip === formGuruNip);
        if (isExisting) {
          alert("Guru dengan NIP tersebut sudah terdaftar!");
          return;
        }
      }
      const updated = teachers.map((g) =>
        g.nip === guruEditIdx
          ? { ...g, nip: formGuruNip, name: formGuruName, email: formGuruEmail, subject: formGuruSubject, classGroup: formGuruWali, status: formGuruStatus }
          : g
      );
      onSetTeachers(updated);
      toastActive("Data guru berhasil diperbarui!");
    } else {
      const isExisting = teachers.some((g) => g.nip === formGuruNip);
      if (isExisting) {
        alert("Guru dengan NIP tersebut sudah terdaftar!");
        return;
      }
      const newTeach: TeacherItem = {
        nip: formGuruNip,
        name: formGuruName,
        email: formGuruEmail,
        subject: formGuruSubject,
        classGroup: formGuruWali,
        status: formGuruStatus,
        rating: 4.5,
        teachingHours: 18,
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ0rRe-9-Gdi5tmulipXvYFD1dltsvm-9vR6OHV9TPsEzkUFmOQpTnISGpHL4GSQPOt0w_lxByz_D4T2HL93R6P603vdfXOkC5A_JUiXCfFz4MvjHHszLcreOGnHf8AqJoKEDH509jEQqrh9s-Vs_RxRYgmUpIFwzprdcYxGenpn2t-532tY75115ylDI76Ri1sXWf0AsAEWwLh50HT3VtW3S_A4tR_8fUk1p9QE36KX3hwl9g0sIpZRkjTgea_alRcPNASTq_hm0",
      };
      onSetTeachers([...teachers, newTeach]);
      toastActive("Tenaga pendidik baru berhasil terdaftar!");
    }
    setIsGuruModalOpen(false);
  };

  const handleDeleteGuru = (nip: string) => {
    askConfirm(
      "Konfirmasi Hapus Guru",
      "Apakah Anda yakin ingin menghapus data guru ini?",
      () => {
        const filtered = teachers.filter((g) => g.nip !== nip);
        onSetTeachers(filtered);
        toastActive("Data guru berhasil dihapus.");
      }
    );
  };

  // Subject Actions
  const handleOpenSubjectModal = (sub?: SubjectItem) => {
    if (sub) {
      setSubjectEditIdx(sub.id);
      setFormSubCode(sub.code);
      setFormSubName(sub.name);
      setFormSubTeacherId(sub.teacherId);
      setFormSubClass(sub.classGroup);
      setFormSubCategory(sub.category);
      setFormSubHours(sub.hoursPerWeek);
    } else {
      setSubjectEditIdx(null);
      setFormSubCode("");
      setFormSubName("");
      setFormSubTeacherId(teachers[0]?.nip || "");
      setFormSubClass("XII - IPA 1");
      setFormSubCategory("Wajib");
      setFormSubHours(3);
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubCode || !formSubName) {
      alert("Harap isi Kode dan Nama Mata Pelajaran!");
      return;
    }

    const assignedTeacher = teachers.find((g) => g.nip === formSubTeacherId) || {
      name: "Belum Ditentukan",
      avatarUrl: "",
    };

    if (subjectEditIdx) {
      const updated = subjects.map((s) =>
        s.id === subjectEditIdx
          ? {
              ...s,
              code: formSubCode,
              name: formSubName,
              teacherId: formSubTeacherId,
              teacherName: assignedTeacher.name,
              teacherAvatar: assignedTeacher.avatarUrl,
              classGroup: formSubClass,
              category: formSubCategory,
              hoursPerWeek: formSubHours,
            }
          : s
      );
      onSetSubjects(updated);
      toastActive("Mata pelajaran berhasil dimodifikasi!");
    } else {
      const newSub: SubjectItem = {
        id: `sub-${Date.now()}`,
        code: formSubCode,
        name: formSubName,
        teacherId: formSubTeacherId,
        teacherName: assignedTeacher.name,
        teacherAvatar: assignedTeacher.avatarUrl,
        classGroup: formSubClass,
        category: formSubCategory,
        hoursPerWeek: formSubHours,
      };
      onSetSubjects([...subjects, newSub]);
      toastActive("Mata pelajaran baru berhasil didaftarkan!");
    }
    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = (id: string) => {
    askConfirm(
      "Konfirmasi Hapus Mata Pelajaran",
      "Apakah Anda yakin ingin menghapus mata pelajaran ini?",
      () => {
        const filtered = subjects.filter((s) => s.id !== id);
        onSetSubjects(filtered);
        localStorage.setItem("sialma_subjects", JSON.stringify(filtered));
        toastActive("Mata pelajaran berhasil dihapus.");
      }
    );
  };

  const handleBulkDeleteSubjects = () => {
    if (selectedSubjectIds.length === 0) return;
    askConfirm(
      "Hapus Massal Mata Pelajaran",
      `Apakah Anda yakin ingin menghapus ${selectedSubjectIds.length} mata pelajaran yang dipilih?`,
      () => {
        const remaining = subjects.filter(s => !selectedSubjectIds.includes(s.id));
        onSetSubjects(remaining);
        localStorage.setItem("sialma_subjects", JSON.stringify(remaining));
        setSelectedSubjectIds([]);
        toastActive("Berhasil menghapus mata pelajaran terpilih secara massal.");
      }
    );
  };

  // Announcement Actions
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAnnTitle || !formAnnContent) {
      alert("Silakan isi Judul dan Konten Pengumuman!");
      return;
    }
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: formAnnTitle,
      content: formAnnContent,
      target: formAnnTarget,
      date: new Date().toISOString(),
      author: "Super Admin",
      icon: formAnnTarget === "GURU" ? "payments" : formAnnTarget === "SISWA" ? "sports_soccer" : "event_note",
    };
    onSetAnnouncements([newAnn, ...announcements]);
    setFormAnnTitle("");
    setFormAnnContent("");
    setIsAnnModalOpen(false);
    toastActive("Pengumuman baru telah diterbitkan!");
  };

  const handleDeleteAnnouncement = (id: string) => {
    askConfirm(
      "Hapus Pengumuman",
      "Apakah Anda yakin ingin menarik/menghapus pengumuman ini?",
      () => {
        const filtered = announcements.filter((a) => a.id !== id);
        onSetAnnouncements(filtered);
        toastActive("Pengumuman berhasil ditarik.");
      }
    );
  };

  // Filtering lists
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(siswaSearch.toLowerCase()) || s.nisn.includes(siswaSearch);
    const matchesClass = selectedSiswaClass === "Semua Kelas" || s.classGroup.includes(selectedSiswaClass);
    return matchesSearch && matchesClass;
  });

  const sortedFilteredStudents = [...filteredStudents].sort((a, b) => {
    const classCompare = a.classGroup.localeCompare(b.classGroup);
    if (classCompare !== 0) return classCompare;
    return a.name.localeCompare(b.name, "id");
  });

  const filteredTeachers = teachers.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(guruSearch.toLowerCase()) || g.nip.includes(guruSearch);
    const matchesSub = selectedGuruSubject === "Semua" || g.subject.includes(selectedGuruSubject);
    return matchesSearch && matchesSub;
  });

  return (
    <div className="flex-grow min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 w-full z-45 bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center h-[64px] px-4 sm:px-6 md:px-8 shrink-0">
        <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
          <span className="font-sans text-base md:text-xl font-bold text-emerald-900 uppercase tracking-wide">SIALMA</span>
          <div className="h-6 w-px bg-slate-200"></div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest hidden md:block truncate">MA AL-MA'SUM — Kontrol Admin</p>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <div className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs font-extrabold">
            <span className="material-symbols-outlined text-[15px] text-emerald-700">calendar_month</span>
            <span>TA: {academicYear} (Ganjil)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl digital-clock-pod text-xs sm:text-sm shrink-0">
            <span className="material-symbols-outlined text-[15px] text-emerald-400 animate-pulse">schedule</span>
            <span className="tracking-wide hidden md:inline text-xs">{digitalTime} WIB</span>
            <span className="tracking-wide md:hidden text-xs">
              {(() => {
                try {
                  const parts = digitalTime.split(",");
                  if (parts.length >= 3) {
                    const dayMonth = parts[1].trim().replace(" 2026", "").replace(" 2027", "");
                    const timeOnly = parts[2].trim().substring(0, 5);
                    const shortDay = parts[0].trim().substring(0, 3);
                    return `${shortDay}, ${dayMonth} • ${timeOnly}`;
                  }
                } catch (e) {}
                return digitalTime.includes(",") ? digitalTime.split(",").pop()?.trim() || digitalTime : digitalTime;
              })()}
            </span>
          </div>
          <button className="text-slate-500 hover:text-emerald-800 transition-colors p-1" onClick={() => alert("Snapshot backup harian SIALMA berhasil dikonfirmasi.")}>
            <span className="material-symbols-outlined text-xl">backup</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="p-4 sm:p-6 md:p-8 flex-grow">
        
        {/* Module: BERANDA */}
        {activeModule === "beranda" && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Siswa</p>
                  <h3 className="text-3xl font-extrabold text-[#054e06] mt-1">{students.length}</h3>
                  <p className="text-[10px] text-emerald-700 font-bold mt-1 inline-flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">trending_up</span> +3 Baru
                  </p>
                </div>
                <span className="material-symbols-outlined text-emerald-900 bg-emerald-50 p-3 rounded-lg text-3xl">group</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Guru</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{teachers.length}</h3>
                  <p className="text-[10px] text-slate-450 mt-1">Status aktif semester ini</p>
                </div>
                <span className="material-symbols-outlined text-slate-600 bg-slate-100 p-3 rounded-lg text-3xl">school</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mata Pelajaran</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{subjects.length}</h3>
                  <p className="text-[10px] text-slate-450 mt-1">Kurikulum 2024</p>
                </div>
                <span className="material-symbols-outlined text-slate-600 bg-slate-100 p-3 rounded-lg text-3xl">book</span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Kuis Terbit</p>
                  <h3 className="text-3xl font-extrabold text-orange-950 mt-1">{quizzes.length}</h3>
                  <p className="text-[10px] text-orange-650 font-bold mt-1 animate-pulse">Live / Aktif</p>
                </div>
                <span className="material-symbols-outlined text-orange-700 bg-orange-50 p-3 rounded-lg text-3xl">assessment</span>
              </div>
            </div>

            {/* Quick Actions & Recent Activities Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                  <span className="material-symbols-outlined text-emerald-850">bolt</span>
                  Aksi Administrator Cepat
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => handleOpenSiswaModal()} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-emerald-900 hover:text-white transition-all text-left">
                    <span className="material-symbols-outlined text-emerald-850">person_add</span>
                    <span className="text-xs font-bold font-sans">Tambah Siswa Baru</span>
                  </button>
                  <button onClick={() => handleOpenGuruModal()} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-emerald-900 hover:text-white transition-all text-left">
                    <span className="material-symbols-outlined text-emerald-850">person_celebrate</span>
                    <span className="text-xs font-bold font-sans">Tambah Guru Baru</span>
                  </button>
                  <button onClick={() => setIsAnnModalOpen(true)} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-emerald-900 hover:text-white transition-all text-left">
                    <span className="material-symbols-outlined text-emerald-850">campaign</span>
                    <span className="text-xs font-bold font-sans">Kirim Pengumuman Baru</span>
                  </button>
                </div>
              </div>

              {/* Recent Audit Logs (Simulated) */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm h-full flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center text-slate-800">
                  <h4 className="text-sm font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-slate-600">history</span>
                    Umpan Balik Audit Sektor SIALMA
                  </h4>
                  <span className="text-xs text-slate-400">Terbaru</span>
                </div>
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-56 custom-scrollbar text-xs">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 hover:bg-slate-50/50 flex justify-between items-center">
                      <div className="flex gap-3">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          log.level === "ERROR" ? "bg-red-500" : log.level === "WARNING" ? "bg-amber-500" : "bg-emerald-550"
                        }`}></span>
                        <div>
                          <p className="font-bold text-slate-805 leading-snug">{log.message}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold shrink-0">{log.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module: SISWA (STUDENTS CRUD) */}
        {activeModule === "siswa" && (
          <div className="space-y-6 animate-fadeIn font-sans">
            {/* Header info matching Manajemen Kelas */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl font-bold">school</span>
                  Manajemen Siswa &amp; Akademi Madrasah
                </h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-xl font-medium">
                  Atur seluruh data pendaftaran siswa baru, pencarian profil, pembaruan biodata, sanksi pelanggaran, koordinasi bimbingan wali kelas, ekspor-impor excel masal.
                </p>
              </div>
            </div>

            {/* Search filter row */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input 
                    type="text" 
                    value={siswaSearch} 
                    onChange={(e) => {
                      setSiswaSearch(e.target.value);
                      setSelectedStudentNisns([]); // Reset selection on search change
                    }}
                    placeholder="Cari siswa atau NISN..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
                <select 
                  value={selectedSiswaClass} 
                  onChange={(e) => {
                    setSelectedSiswaClass(e.target.value);
                    setSelectedStudentNisns([]); // Reset selection on class filter change
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold text-slate-600 outline-none"
                >
                  <option value="Semua Kelas">Semua Kelas</option>
                  {classGroups.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2.5 flex-wrap items-center">
                <button 
                  onClick={handleExportStudents}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-250 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">download</span>
                  <span>Ekspor Siswa XLSX</span>
                </button>
                <button 
                  onClick={() => {
                    setImportStatus({ type: null, message: "" });
                    setIsImportModalOpen(true);
                  }}
                  className="bg-emerald-50 text-emerald-900 border border-emerald-250 hover:bg-emerald-100 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer text-center"
                >
                  <span className="material-symbols-outlined text-[17px] text-emerald-800">upload_file</span>
                  <span>Unggah Batch Siswa (Excel/CSV)</span>
                </button>
                <button 
                  onClick={() => handleOpenSiswaModal()}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all inline-flex items-center gap-1 shadow-sm shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Pendaftaran Siswa Baru</span>
                </button>
              </div>
            </div>

            {/* Panel Seleksi & Aksi Massal Siswa */}
            <div className={`p-4 rounded-2xl border transition-all duration-300 font-sans flex flex-col sm:flex-row items-center justify-between gap-4 ${
              selectedStudentNisns.length > 0 
                ? "bg-amber-50/80 border-amber-250 shadow-xs" 
                : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`material-symbols-outlined text-lg ${selectedStudentNisns.length > 0 ? "text-amber-800" : "text-slate-400"}`}>
                  check_box
                </span>
                <p className="text-xs font-bold text-slate-700">
                  Status Seleksi: <span className={`text-sm ${selectedStudentNisns.length > 0 ? "text-amber-950 font-extrabold" : "text-slate-500 font-medium"}`}>
                    {selectedStudentNisns.length > 0 ? `${selectedStudentNisns.length} Siswa Terpilih` : "Belum Ada Siswa Terpilih"}
                  </span>
                </p>
                <div className="h-4 w-px bg-slate-300/60 hidden sm:block"></div>
                <button 
                  onClick={() => {
                    const allNisns = sortedFilteredStudents.map(s => s.nisn);
                    setSelectedStudentNisns(allNisns);
                    toastActive(`Berhasil memilih seluruh (${allNisns.length}) siswa.`);
                  }}
                  className="bg-white hover:bg-slate-100 text-emerald-800 border border-slate-250 text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all"
                >
                  Seleksi Semua Siswa
                </button>
                <button 
                  onClick={() => {
                    setSelectedStudentNisns([]);
                    toastActive("Pilihan seleksi dibatalkan.");
                  }}
                  disabled={selectedStudentNisns.length === 0}
                  className="bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 disabled:opacity-50 border border-slate-250 text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Batal Seleksi
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Tindakan Massal:</span>
                <button
                  onClick={() => {
                    if (selectedStudentNisns.length === 0) {
                      alert("Silakan seleksi siswa terlebih dahulu!");
                      return;
                    }
                    handleBulkChangeStudentStatus("AKTIF");
                  }}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">person_check</span>
                  <span>Aktifkan</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedStudentNisns.length === 0) {
                      alert("Silakan seleksi siswa terlebih dahulu!");
                      return;
                    }
                    handleBulkChangeStudentStatus("NON-AKTIF");
                  }}
                  className="bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">person_off</span>
                  <span>Nonaktifkan</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedStudentNisns.length === 0) {
                      alert("Silakan seleksi siswa terlebih dahulu!");
                      return;
                    }
                    handleBulkDeleteStudents();
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Hapus Massal</span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center">
                        <input 
                          type="checkbox"
                          checked={sortedFilteredStudents.length > 0 && sortedFilteredStudents.every(s => selectedStudentNisns.includes(s.nisn))}
                          onChange={() => {
                            const allNisns = sortedFilteredStudents.map(s => s.nisn);
                            const allSelected = allNisns.every(n => selectedStudentNisns.includes(n));
                            if (allSelected) {
                              setSelectedStudentNisns(selectedStudentNisns.filter(n => !allNisns.includes(n)));
                            } else {
                              setSelectedStudentNisns(Array.from(new Set([...selectedStudentNisns, ...allNisns])));
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-705 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                        />
                      </th>
                      <th className="px-6 py-4">NISN</th>
                      <th className="px-6 py-4">Nama Lengkap</th>
                      <th className="px-6 py-4">Kelas Perwalian</th>
                      <th className="px-6 py-4">Jenis Kelamin</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-705">
                    {sortedFilteredStudents.map((stud) => {
                      const isSelected = selectedStudentNisns.includes(stud.nisn);
                      return (
                        <tr 
                          key={stud.nisn} 
                          className={`hover:bg-slate-50/50 group transition-colors ${
                            isSelected ? "bg-emerald-50/20" : ""
                          }`}
                        >
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedStudentNisns(selectedStudentNisns.filter(n => n !== stud.nisn));
                                } else {
                                  setSelectedStudentNisns([...selectedStudentNisns, stud.nisn]);
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                            />
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-705">{stud.nisn}</td>
                          <td className="px-6 py-4 font-bold text-slate-850">{stud.name}</td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{stud.classGroup}</td>
                          <td className="px-6 py-4 text-slate-500">{stud.gender}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              stud.status === "AKTIF" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-500"
                            }`}>
                              {stud.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-1.5 opacity-100 md:opacity-20 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleOpenSiswaModal(stud)} className="p-1 text-emerald-800 hover:bg-emerald-50 rounded" title="Edit Siswa">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button onClick={() => handleDeleteSiswa(stud.nisn)} className="p-1 text-rose-700 hover:bg-rose-50 rounded" title="Hapus Siswa">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Module: GURU (TEACHERS CRUD) */}
        {activeModule === "guru" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header info matching Manajemen Kelas */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl font-bold">badge</span>
                  Manajemen Pendidik &amp; Tenaga Kependidikan (Guru)
                </h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-xl font-medium">
                  Atur daftar pengampu guru bidang studi akademik, nomor induk pegawai (NIP), penugasan walikelas terintegrasi, serta log audit jam mengajar mingguan madrasah.
                </p>
              </div>
            </div>

            {/* Search filter row */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input 
                    type="text" 
                    value={guruSearch} 
                    onChange={(e) => {
                      setGuruSearch(e.target.value);
                      setSelectedGuruNips([]); // Reset selection on search change
                    }}
                    placeholder="Cari guru atau NIP..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
                <select 
                  value={selectedGuruSubject} 
                  onChange={(e) => {
                    setSelectedGuruSubject(e.target.value);
                    setSelectedGuruNips([]); // Reset selection on subject filter change
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold text-slate-600 outline-none"
                >
                  <option value="Semua">Semua Mata Pelajaran</option>
                  {(() => {
                    const subjectNames = new Set<string>();
                    subjects.forEach(s => s.name && subjectNames.add(s.name));
                    teachers.forEach(t => {
                      if (t.subject && t.subject !== "Guru Pengampu" && t.subject !== "Guru") {
                        subjectNames.add(t.subject);
                      }
                    });
                    return Array.from(subjectNames).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ));
                  })()}
                </select>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <button 
                  onClick={handleDownloadTeacherTemplate}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">download_sheet</span>
                  <span>Template Guru XLSX</span>
                </button>
                <label className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-[17px]">upload_file</span>
                  <span>Impor Guru XLSX</span>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="hidden" 
                    onChange={handleImportTeachersExcel} 
                  />
                </label>
                <button 
                  onClick={handleExportTeachers}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">download</span>
                  <span>Ekspor Guru XLSX</span>
                </button>
                <button 
                  onClick={() => handleOpenGuruModal()}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all inline-flex items-center gap-1 shadow-sm shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Tambah Tenaga Pendidik</span>
                </button>
              </div>
            </div>

            {/* Panel Seleksi & Aksi Massal Guru */}
            <div className={`p-4 rounded-2xl border transition-all duration-300 font-sans flex flex-col sm:flex-row items-center justify-between gap-4 ${
              selectedGuruNips.length > 0 
                ? "bg-amber-50/80 border-amber-250 shadow-xs" 
                : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`material-symbols-outlined text-lg ${selectedGuruNips.length > 0 ? "text-amber-800" : "text-slate-400"}`}>
                  check_box
                </span>
                <p className="text-xs font-bold text-slate-700">
                  Status Seleksi: <span className={`text-sm ${selectedGuruNips.length > 0 ? "text-amber-950 font-extrabold" : "text-slate-500 font-medium"}`}>
                    {selectedGuruNips.length > 0 ? `${selectedGuruNips.length} Guru Terpilih` : "Belum Ada Guru Terpilih"}
                  </span>
                </p>
                <div className="h-4 w-px bg-slate-300/60 hidden sm:block"></div>
                <button 
                  onClick={() => {
                    const allNips = filteredTeachers.map(t => t.nip);
                    setSelectedGuruNips(allNips);
                    toastActive(`Berhasil memilih seluruh (${allNips.length}) guru.`);
                  }}
                  className="bg-white hover:bg-slate-100 text-emerald-800 border border-slate-250 text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all"
                >
                  Seleksi Semua Guru
                </button>
                <button 
                  onClick={() => {
                    setSelectedGuruNips([]);
                    toastActive("Pilihan seleksi guru dibatalkan.");
                  }}
                  disabled={selectedGuruNips.length === 0}
                  className="bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 disabled:opacity-50 border border-slate-250 text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Batal Seleksi
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Tindakan Massal:</span>
                <button
                  onClick={() => {
                    if (selectedGuruNips.length === 0) {
                      alert("Silakan seleksi guru terlebih dahulu!");
                      return;
                    }
                    handleBulkChangeGuruStatus("Aktif");
                  }}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">person_check</span>
                  <span>Aktifkan</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedGuruNips.length === 0) {
                      alert("Silakan seleksi guru terlebih dahulu!");
                      return;
                    }
                    handleBulkChangeGuruStatus("Cuti");
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">person_off</span>
                  <span>Set Cuti</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedGuruNips.length === 0) {
                      alert("Silakan seleksi guru terlebih dahulu!");
                      return;
                    }
                    handleBulkDeleteGuru();
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Hapus Massal</span>
                </button>
              </div>
            </div>

            {/* Teachers database tables */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center">
                        <input 
                          type="checkbox"
                          checked={filteredTeachers.length > 0 && filteredTeachers.every(t => selectedGuruNips.includes(t.nip))}
                          onChange={() => {
                            const allNips = filteredTeachers.map(t => t.nip);
                            const allSelected = allNips.every(n => selectedGuruNips.includes(n));
                            if (allSelected) {
                              setSelectedGuruNips(selectedGuruNips.filter(n => !allNips.includes(n)));
                            } else {
                              setSelectedGuruNips(Array.from(new Set([...selectedGuruNips, ...allNips])));
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                        />
                      </th>
                      <th className="px-6 py-4">NIP</th>
                      <th className="px-6 py-4">Nama Lengkap &amp; Gelar</th>
                      <th className="px-6 py-4">Mata Pelajaran</th>
                      <th className="px-6 py-4">Wali Kelas</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-705">
                    {filteredTeachers.map((guru) => {
                      const isSelected = selectedGuruNips.includes(guru.nip);
                      return (
                        <tr 
                          key={guru.nip} 
                          className={`hover:bg-slate-50/50 group transition-colors ${
                            isSelected ? "bg-emerald-50/20" : ""
                          }`}
                        >
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedGuruNips(selectedGuruNips.filter(n => n !== guru.nip));
                                } else {
                                  setSelectedGuruNips([...selectedGuruNips, guru.nip]);
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                            />
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700 tracking-tight">{guru.nip}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{guru.name}</p>
                            <p className="text-xs text-slate-400">{guru.email}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">{guru.subject}</td>
                          <td className="px-6 py-4 text-slate-500">{guru.classGroup}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              guru.status === "Aktif" ? "bg-emerald-50 text-emerald-850" : "bg-amber-105 text-amber-700 bg-amber-50"
                            }`}>
                              {guru.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-1.5 opacity-100 md:opacity-20 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleOpenGuruModal(guru)} className="p-1 text-emerald-800 hover:bg-emerald-50 rounded">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button onClick={() => handleDeleteGuru(guru.nip)} className="p-1 text-rose-700 hover:bg-rose-50 rounded">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Module: MAPEL (SUBJECTS CRUD) */}
        {activeModule === "mapel" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Subject actions head bar matching Manajemen Kelas */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl font-bold">book</span>
                  Daftar Kurikulum &amp; Mata Pelajaran
                </h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-xl font-medium">
                  Atur seluruh kelompok mata pelajaran wajib, peminatan pemfokusan studi, kualifikasi kurikulum MA Al-Ma'sum, alokasi jam tatap muka mingguan, dan integrasi uploader excel.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Manajemen Pelajaran Aktif</h3>
                <p className="text-xs text-slate-500">Mata pelajaran wajib, muatan lokal, dan peminatan di MA AL-MA'SUM</p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <button 
                  onClick={() => {
                    setSubjectImportStatus({ type: null, message: "" });
                    setIsSubjectImportModalOpen(true);
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-emerald-800">upload_file</span>
                  <span>Unggah Mapel (Excel)</span>
                </button>
                <button 
                  onClick={handleExportSubjects}
                  className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Ekspor Mapel XLSX</span>
                </button>
                <button 
                  onClick={() => handleOpenSubjectModal()}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Tambah Mata Pelajaran</span>
                </button>
              </div>
            </div>

            {/* Panel Seleksi & Aksi Massal Mapel */}
            {(() => {
              const sortedSubjects = [...subjects].sort((a, b) => a.classGroup.localeCompare(b.classGroup));
              const isAllChecked = sortedSubjects.length > 0 && sortedSubjects.every(s => selectedSubjectIds.includes(s.id));
              
              return (
                <>
                  <div className={`p-4 rounded-2xl border transition-all duration-300 font-sans flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    selectedSubjectIds.length > 0 
                      ? "bg-amber-50/80 border-amber-250 shadow-xs" 
                      : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`material-symbols-outlined text-lg ${selectedSubjectIds.length > 0 ? "text-amber-800" : "text-slate-400"}`}>
                        check_box
                      </span>
                      <p className="text-xs font-bold text-slate-700">
                        Status Seleksi: <span className={`text-sm ${selectedSubjectIds.length > 0 ? "text-amber-950 font-extrabold" : "text-slate-500 font-medium"}`}>
                          {selectedSubjectIds.length > 0 ? `${selectedSubjectIds.length} Mapel Terpilih` : "Belum Ada Mapel Terpilih"}
                        </span>
                      </p>
                      <div className="h-4 w-px bg-slate-300/60 hidden sm:block"></div>
                      <button 
                        onClick={() => {
                          const allIds = sortedSubjects.map(s => s.id);
                          setSelectedSubjectIds(allIds);
                          toastActive(`Berhasil memilih seluruh (${allIds.length}) mata pelajaran.`);
                        }}
                        className="bg-white hover:bg-slate-100 text-emerald-800 border border-slate-250 text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all"
                      >
                        Seleksi Semua Mapel
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedSubjectIds([]);
                          toastActive("Pilihan seleksi mata pelajaran dibatalkan.");
                        }}
                        disabled={selectedSubjectIds.length === 0}
                        className="bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 disabled:opacity-50 border border-slate-250 text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Batal Seleksi
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Tindakan Massal:</span>
                      <button
                        onClick={() => {
                          if (selectedSubjectIds.length === 0) {
                            alert("Silakan pilih minimal 1 mata pelajaran terlebih dahulu!");
                            return;
                          }
                          handleBulkDeleteSubjects();
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        <span>Hapus Massal</span>
                      </button>
                    </div>
                  </div>

                  {/* Subjects table list */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                          <tr>
                            <th className="px-6 py-4 w-12 text-center">
                              <input 
                                type="checkbox"
                                checked={isAllChecked}
                                onChange={() => {
                                  const allIds = sortedSubjects.map(s => s.id);
                                  if (isAllChecked) {
                                    setSelectedSubjectIds(selectedSubjectIds.filter(id => !allIds.includes(id)));
                                  } else {
                                    setSelectedSubjectIds(Array.from(new Set([...selectedSubjectIds, ...allIds])));
                                  }
                                }}
                                className="rounded border-slate-300 text-emerald-705 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                              />
                            </th>
                            <th className="px-6 py-4 w-28">Kode Mapel</th>
                            <th className="px-6 py-4">Mata Pelajaran</th>
                            <th className="px-6 py-4">Guru Pengampu</th>
                            <th className="px-6 py-4">Beban Kelas</th>
                            <th className="px-6 py-4">Kategori</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                          {sortedSubjects.map((sub) => {
                            const isSelected = selectedSubjectIds.includes(sub.id);
                            return (
                              <tr 
                                key={sub.id} 
                                className={`hover:bg-slate-50/50 group transition-colors ${
                                  isSelected ? "bg-emerald-50/20" : ""
                                }`}
                              >
                                <td className="px-6 py-4 text-center">
                                  <input 
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== sub.id));
                                      } else {
                                        setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                                      }
                                    }}
                                    className="rounded border-slate-300 text-emerald-705 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                                  />
                                </td>
                                <td className="px-6 py-4 font-sans text-emerald-900 font-bold">{sub.code}</td>
                                <td className="px-6 py-4">
                                  <p className="font-bold text-slate-800">{sub.name}</p>
                                  <p className="text-xs text-slate-400">{sub.hoursPerWeek} Jam / Minggu</p>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{sub.teacherName}</td>
                                <td className="px-6 py-4 text-slate-500">{sub.classGroup}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    sub.category === "Wajib" ? "bg-emerald-50 text-emerald-800" : sub.category === "Peminatan" ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-500"
                                  }`}>
                                    {sub.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex justify-center gap-1.5 opacity-100 md:opacity-20 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenSubjectModal(sub)} className="p-1 text-emerald-800 hover:bg-emerald-50 rounded">
                                      <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDeleteSubject(sub.id)} className="p-1 text-rose-700 hover:bg-rose-50 rounded">
                                      <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Module: JADWAL */}
        {activeModule === "jadwal" && (
          <div className="space-y-6 animate-fadeIn text-slate-800">
            {/* Header Workspace */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-800 p-2 bg-emerald-50 rounded-xl">calendar_month</span>
                  <h3 className="text-lg font-bold text-slate-900 font-sans">Kurikulum &amp; Jadwal Pelajaran Real-Time</h3>
                </div>
                <p className="text-xs text-slate-500 max-w-xl">
                  Kelola master jadwal pelajaran KBM mingguan di MA Al-Ma’sum. Jadwal yang Anda tambahkan, sesuaikan, atau hapus di sini otomatis terintegrasi di portal Siswa dan Guru yang bersangkutan secara real-time.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <button 
                  onClick={() => {
                    setScheduleImportStatus({ type: null, message: "" });
                    setIsScheduleImportModalOpen(true);
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-emerald-800">upload_file</span>
                  <span>Unggah Jadwal (Excel)</span>
                </button>
                <button 
                  onClick={handleExportSchedules}
                  className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Ekspor Jadwal XLSX</span>
                </button>
                <button 
                  onClick={handleOpenAddSchedule}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span>Buat Jadwal Baru</span>
                </button>
              </div>
                        {/* Filter and Bulk Actions panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Filter Kelas:</span>
                  <select 
                    value={scheduleClassFilter} 
                    onChange={(e) => {
                      setScheduleClassFilter(e.target.value);
                      setSelectedScheduleIds([]); // Clear selection when switching classes
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-4 py-2 text-slate-705 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 focus:bg-white"
                  >
                    <option value="Semua Kelas">Semua Kelas</option>
                    {classGroups.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-slate-500 text-xs flex gap-4 font-semibold">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block"></span> Terintegrasi Siswa</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-600 rounded-full inline-block"></span> Sinkronisasi Guru</span>
              </div>
            </div>

            {/* Panel Seleksi & Aksi Massal Jadwal */}
            <div className={`p-4 rounded-2xl border transition-all duration-300 font-sans flex flex-col sm:flex-row items-center justify-between gap-4 ${
              selectedScheduleIds.length > 0 
                ? "bg-amber-50/80 border-amber-250 shadow-xs" 
                : "bg-slate-50 border-slate-200"
            }`}>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={`material-symbols-outlined text-lg ${selectedScheduleIds.length > 0 ? "text-amber-800" : "text-slate-400"}`}>
                  check_box
                </span>
                <p className="text-xs font-bold text-slate-705">
                  Status Seleksi: <span className={`text-sm ${selectedScheduleIds.length > 0 ? "text-amber-950 font-extrabold" : "text-slate-500 font-medium"}`}>
                    {selectedScheduleIds.length > 0 ? `${selectedScheduleIds.length} Jadwal Terpilih` : "Belum Ada Jadwal Terpilih"}
                  </span>
                </p>
                <div className="h-4 w-px bg-slate-300/60 hidden sm:block"></div>
                <button 
                  onClick={() => {
                    const visibleSchedules = schedules.filter((sch) => {
                      const specialMeta = getSpecialSessionMeta(sch.subjectId);
                      if (specialMeta) {
                        if (specialMeta.classGroup === "Semua Kelas") return true;
                        if (scheduleClassFilter !== "Semua Kelas" && specialMeta.classGroup !== scheduleClassFilter) return false;
                        return true;
                      }
                      const sub = subjects.find(s => s.id === sch.subjectId);
                      if (!sub) return false;
                      if (scheduleClassFilter !== "Semua Kelas" && sub.classGroup !== scheduleClassFilter) return false;
                      return true;
                    });
                    const visibleIds = visibleSchedules.map(sch => sch.id);
                    setSelectedScheduleIds(visibleIds);
                    toastActive(`Berhasil memilih seluruh (${visibleIds.length}) jadwal.`);
                  }}
                  className="bg-white hover:bg-slate-100 text-emerald-800 border border-slate-250 text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all"
                >
                  Seleksi Semua Jadwal
                </button>
                <button 
                  onClick={() => {
                    setSelectedScheduleIds([]);
                    toastActive("Pilihan seleksi jadwal dibatalkan.");
                  }}
                  disabled={selectedScheduleIds.length === 0}
                  className="bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 disabled:opacity-50 border border-slate-250 text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  Batal Seleksi
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Tindakan Massal:</span>
                <button
                  onClick={() => {
                    if (selectedScheduleIds.length === 0) {
                      alert("Silakan pilih minimal 1 jadwal terlebih dahulu!");
                      return;
                    }
                    handleBulkDeleteSchedules();
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Hapus Massal</span>
                </button>
              </div>
            </div>  </div>

            {/* Weekly Scheduler Grid View */}
            <div className="space-y-4">
              {(["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"] as const).map((day) => {
                const daySchedules = schedules.filter((sch) => {
                  if (sch.day !== day) return false;
                  
                  const specialMeta = getSpecialSessionMeta(sch.subjectId);
                  if (specialMeta) {
                    if (specialMeta.classGroup === "Semua Kelas") return true;
                    if (scheduleClassFilter !== "Semua Kelas" && specialMeta.classGroup !== scheduleClassFilter) return false;
                    return true;
                  }
                  
                  const sub = subjects.find(s => s.id === sch.subjectId);
                  if (!sub) return false;
                  if (scheduleClassFilter !== "Semua Kelas" && sub.classGroup !== scheduleClassFilter) return false;
                  return true;
                });

                return (
                  <div key={day} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-slate-350">
                    <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-black text-emerald-950 uppercase tracking-widest font-sans flex items-center gap-1.5">
                        <span className="w-1.5 h-3.5 bg-emerald-850 rounded-xs"></span>
                        {day}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-sm">
                        {daySchedules.length} Sesi Terjadwal
                      </span>
                    </div>

                    <div className="p-5 space-y-6">
                      {daySchedules.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 italic text-xs flex flex-col items-center justify-center gap-1.5">
                          <span className="material-symbols-outlined text-[18px]">calendar_view_day</span>
                          <span>Tidak ada sesi mengajar aktif terjadwal untuk hari {day} ({scheduleClassFilter}).</span>
                        </div>
                      ) : (
                        (() => {
                          const uniqueSlots = Array.from(new Set(daySchedules.map(sch => sch.timeSlot))).sort((a, b) => a.localeCompare(b));
                          return uniqueSlots.map((slot) => {
                            const slotSchedules = daySchedules.filter(sch => sch.timeSlot === slot).sort((a, b) => {
                              const metaA = getSpecialSessionMeta(a.subjectId);
                              const metaB = getSpecialSessionMeta(b.subjectId);
                              const classA = metaA ? metaA.classGroup : (subjects.find(s => s.id === a.subjectId)?.classGroup || "");
                              const classB = metaB ? metaB.classGroup : (subjects.find(s => s.id === b.subjectId)?.classGroup || "");
                              return classA.localeCompare(classB);
                            });

                            return (
                              <div key={slot} className="border-b last:border-0 border-slate-100 pb-5 last:pb-0 space-y-3">
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-xl">
                                  <span className="material-symbols-outlined text-xs text-emerald-850 font-bold">schedule</span>
                                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wide font-sans">
                                    WAKTU: <span className="text-amber-805 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-sm">{slot}</span>
                                  </span>
                                  <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-md ml-auto">
                                    {slotSchedules.length} Sesi Kelas
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                  {slotSchedules.map((sch) => {
                                    const specialMeta = getSpecialSessionMeta(sch.subjectId);
                                    const sub = specialMeta ? null : subjects.find(s => s.id === sch.subjectId);
                                    const isSelected = selectedScheduleIds.includes(sch.id);
                                    
                                    const displayClassGroup = specialMeta ? specialMeta.classGroup : (sub?.classGroup || "Semua Kelas");
                                    const displayName = specialMeta ? specialMeta.label : (sub?.name || "Mata Pelajaran");
                                    const displayTeacher = specialMeta ? specialMeta.attendee : (sub?.teacherName || "Tidak ditugaskan");
                                    const displayRoom = sch.room || (specialMeta ? "Selasar / Sekolah" : "Ruang Kelas");
                                    const iconName = specialMeta ? specialMeta.icon : "meeting_room";
                                    
                                    const cardBgStyle = isSelected 
                                      ? "bg-emerald-50/30 border-emerald-500 shadow-sm animate-pulse-subtle" 
                                      : specialMeta 
                                        ? specialMeta.cardStyle
                                        : "bg-slate-50/50 border-slate-200 hover:border-emerald-200 hover:bg-slate-50/30";
                                        
                                    const badgeStyle = specialMeta 
                                      ? specialMeta.badgeStyle 
                                      : "bg-emerald-50 text-emerald-900 border-emerald-100";

                                    return (
                                      <div 
                                        key={sch.id} 
                                        className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${cardBgStyle}`}
                                      >
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-center gap-2">
                                              <input 
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {
                                                  if (isSelected) {
                                                    setSelectedScheduleIds(selectedScheduleIds.filter(id => id !== sch.id));
                                                  } else {
                                                    setSelectedScheduleIds([...selectedScheduleIds, sch.id]);
                                                  }
                                                }}
                                                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                                              />
                                              <span className={`text-[9px] border font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${badgeStyle}`}>
                                                Kelas: {displayClassGroup}
                                              </span>
                                            </div>
                                          </div>
                                          <h4 className={`font-bold text-sm font-sans tracking-tight leading-snug pl-1 flex items-center gap-1.5 ${
                                            specialMeta ? specialMeta.themeColor : "text-slate-900"
                                          }`}>
                                            {specialMeta && <span className="material-symbols-outlined text-[16px]">{iconName}</span>}
                                            {displayName}
                                          </h4>
                                          <div className="text-[11px] text-slate-600 font-medium pl-1">
                                            {specialMeta ? "Pendidik: " : "Guru: "}<span className="text-indigo-900 font-bold">{displayTeacher}</span>
                                          </div>
                                          <div className="text-[11px] text-slate-550 flex items-center gap-1 pl-1">
                                            <span className="material-symbols-outlined text-sm text-slate-400">{specialMeta ? "restaurant" : "meeting_room"}</span>
                                            <span>Ruang: <span className="font-semibold text-slate-700">{displayRoom}</span></span>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-2.5 pl-1">
                                          <button
                                            onClick={() => handleOpenEditSchedule(sch)}
                                            className="text-emerald-850 hover:text-emerald-950 font-bold text-xs inline-flex items-center gap-1"
                                          >
                                            <span className="material-symbols-outlined text-[14px]">edit</span>
                                            <span>Ubah</span>
                                          </button>
                                          <button
                                            onClick={() => handleDeleteSchedule(sch.id)}
                                            className="text-rose-700 hover:text-rose-900 font-bold text-xs inline-flex items-center gap-1"
                                          >
                                            <span className="material-symbols-outlined text-[14px]">delete</span>
                                            <span>Hapus</span>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          });
                        })()
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Add/Edit Lesson Schedule */}
            {isScheduleModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
                <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
                  <div className="px-6 py-4.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-slate-800">
                    <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-wider text-slate-800">
                      <span className="material-symbols-outlined text-emerald-850 text-lg">calendar_month</span>
                      <span>{scheduleEditId ? "Perbaiki Jadwal KBM" : "Tambah Jadwal Baru"}</span>
                    </h3>
                    <button 
                      onClick={() => setIsScheduleModalOpen(false)}
                      className="text-slate-400 hover:text-slate-700 flex items-center"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Hari</label>
                      <select
                        value={formScheduleDay}
                        onChange={(e) => setFormScheduleDay(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-4 py-3 text-slate-705 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 focus:bg-white"
                      >
                        <option value="SENIN">SENIN</option>
                        <option value="SELASA">SELASA</option>
                        <option value="RABU">RABU</option>
                        <option value="KAMIS">KAMIS</option>
                        <option value="JUMAT">JUMAT</option>
                        <option value="SABTU">SABTU</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Waktu Kegiatan / Slot Jam</label>
                      <input
                        type="text"
                        value={formScheduleTimeSlot}
                        onChange={(e) => setFormScheduleTimeSlot(e.target.value)}
                        placeholder="Contoh: 07:30 - 09:00 WIB"
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-4 py-3 text-slate-705 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Kompetensi Mapel &amp; Kelas</label>
                      <select
                        value={formScheduleSubjectId}
                        onChange={(e) => setFormScheduleSubjectId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-4 py-3 text-slate-705 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 focus:bg-white"
                        required
                      >
                        <option value="">-- Pilih Mata Pelajaran / Sesi Istirahat --</option>
                        <optgroup label="Sesi Khusus (Non-Mapel)">
                          <option value="istirahat">☕ ISTIRAHAT (Semua Kelas)</option>
                          {Array.from(new Set(subjects.map(s => s.classGroup))).sort().map((cls) => (
                            <option key={`istirahat-${cls}`} value={`istirahat-${cls}`}>
                              ☕ ISTIRAHAT (Khusus Kelas {cls})
                            </option>
                          ))}
                          <option value="upacara">🇮🇩 UPACARA BENDERA (Semua Kelas)</option>
                          {Array.from(new Set(subjects.map(s => s.classGroup))).sort().map((cls) => (
                            <option key={`upacara-${cls}`} value={`upacara-${cls}`}>
                              🇮🇩 UPACARA BENDERA (Khusus Kelas {cls})
                            </option>
                          ))}
                          <option value="kultum">🕌 KULTUM / KEAGAMAAN (Semua Kelas)</option>
                          {Array.from(new Set(subjects.map(s => s.classGroup))).sort().map((cls) => (
                            <option key={`kultum-${cls}`} value={`kultum-${cls}`}>
                              🕌 KULTUM / KEAGAMAAN (Khusus Kelas {cls})
                            </option>
                          ))}
                          <option value="wk">👥 JAM WALI KELAS (WK) (Semua Kelas)</option>
                          {Array.from(new Set(subjects.map(s => s.classGroup))).sort().map((cls) => (
                            <option key={`wk-${cls}`} value={`wk-${cls}`}>
                              👥 JAM WALI KELAS (WK) (Khusus Kelas {cls})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Mata Pelajaran Utama">
                          {subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name} [{sub.classGroup}] — {sub.teacherName.split(",")[0]}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Ruangan / Tempat</label>
                      <input
                        type="text"
                        value={formScheduleRoom}
                        onChange={(e) => setFormScheduleRoom(e.target.value)}
                        placeholder="Contoh: Ruang 302 / Lab Fisika"
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-4 py-3 text-slate-705 focus:outline-hidden focus:ring-2 focus:ring-emerald-800 focus:bg-white"
                        required
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setIsScheduleModalOpen(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer"
                      >
                        Simpan Jadwal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Module: KUIS */}
        {activeModule === "kuis" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">Evaluasi Kuis SIALMA</h3>
              <p className="text-xs text-slate-505 mt-1">Pantau kuis yang telah diterbitkan oleh masing-masing guru pengampu mata pelajaran.</p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-sm text-slate-700 p-6 space-y-4">
                {quizzes.map(q => (
                  <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-widest">{q.subject}</p>
                      <h4 className="font-bold text-slate-800 text-sm mt-0.5">{q.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">Kelas: {q.classGroup} • {q.questionsCount} Pertanyaan Ujian</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="bg-emerald-50 text-emerald-850 font-bold text-xs uppercase px-2.5 py-1 rounded-full border border-emerald-100">{q.status}</span>
                      <button onClick={() => alert(`Kuis "${q.title}" sedang berjalan. Pendidik dapat meninjau statistik evaluasi melalui tab penilaian.`)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg select-none">Monitor</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Module: PENGUMUMAN */}
        {activeModule === "pengumuman" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Create Announcement */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-slate-800">
                <h4 className="text-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-emerald-850">add_comment</span>
                  Buat Pengumuman Baru Resmi SIALMA
                </h4>
              </div>
              <form onSubmit={handleSaveAnnouncement} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-3 space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Judul Bulletin Pengumuman</label>
                    <input 
                      type="text" 
                      required 
                      value={formAnnTitle}
                      onChange={(e) => setFormAnnTitle(e.target.value)}
                      placeholder="Contoh: Rapat Wali murid, Ujian Pengayaan..."
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Target Pengguna</label>
                    <select 
                      value={formAnnTarget}
                      onChange={(e) => setFormAnnTarget(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700"
                    >
                      <option value="SEMUA">Semua Sivitas</option>
                      <option value="GURU">Khusus Guru</option>
                      <option value="SISWA">Khusus Siswa</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Isi Konten Message Bulletin</label>
                    <textarea 
                      required 
                      value={formAnnContent}
                      onChange={(e) => setFormAnnContent(e.target.value)}
                      rows={3}
                      placeholder="Tuliskan detail pengumuman dewan pengurus..."
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all">
                    Terbitkan Pengumuman Resmi
                  </button>
                </div>
              </form>
            </div>

            {/* List Announcements */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 text-slate-800">
                <h4 className="text-sm font-bold">Daftar Bulletin Terbit</h4>
              </div>
              <div className="divide-y divide-slate-100 text-slate-700">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-6 flex justify-between items-center hover:bg-slate-50/30 transition-colors">
                    <div className="flex gap-4">
                      <span className="material-symbols-outlined text-emerald-900 bg-emerald-50 p-2.5 rounded-xl shrink-0 h-fit">
                        {ann.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-50 text-emerald-850 font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">{ann.target} TARGET</span>
                          <span className="text-[10px] text-slate-405">{new Date(ann.date).toLocaleDateString("id-ID")}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 mt-1 leading-snug">{ann.title}</h4>
                        <p className="text-xs text-slate-550 leading-relaxed mt-1">{ann.content}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Module: LAPORAN */}
        {activeModule === "laporan" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header / Tab Switcher */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Pusat Laporan Kehadiran &amp; Akademik Siswa</h3>
                <p className="text-xs text-slate-550">Analisis tingkat kehadiran harian, statistik raport/nilai, dan performa akademis MA AL-MA'SUM tanpa data finansial/SPP.</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setReportType("kehadiran")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${reportType === "kehadiran" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600 hover:text-slate-850"}`}
                >
                  Statistik Kehadiran
                </button>
                <button 
                  onClick={() => setReportType("akademik")}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${reportType === "akademik" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-600 hover:text-slate-855"}`}
                >
                  Distribusi Nilai (Mutu Akademik)
                </button>
              </div>
            </div>

            {/* Attendance View */}
            {reportType === "kehadiran" && (
              <div className="space-y-6">
                {/* Stats Summary Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                    <span className="material-symbols-outlined text-emerald-800 bg-emerald-100/40 p-2 rounded-xl text-xl">how_to_reg</span>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-3">Persentase Kehadiran</p>
                    <p className="text-2xl font-black text-emerald-950 mt-1">
                      {validAttendanceRecords.length > 0 
                        ? `${Math.round((validAttendanceRecords.filter(r => r.status === "H").length / validAttendanceRecords.length) * 100)}%`
                        : "94.2%"}
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-1 font-semibold">Sangat Baik (Batas Minimal: 92%)</p>
                  </div>

                  <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                    <span className="material-symbols-outlined text-amber-805 bg-amber-100/40 p-2 rounded-xl text-xl">medical_services</span>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-3">Sakit (S)</p>
                    <p className="text-2xl font-black text-amber-950 mt-1">
                      {validAttendanceRecords.filter(r => r.status === "S").length} Orang
                    </p>
                    <p className="text-[11px] text-amber-800 mt-1 font-semibold">Surat Dokter Terverifikasi</p>
                  </div>

                  <div className="bg-sky-50/50 p-5 rounded-2xl border border-sky-100">
                    <span className="material-symbols-outlined text-sky-800 bg-sky-100/40 p-2 rounded-xl text-xl">assignment_late</span>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-3">Izin Resmi (I)</p>
                    <p className="text-2xl font-black text-sky-950 mt-1">
                      {validAttendanceRecords.filter(r => r.status === "I").length} Orang
                    </p>
                    <p className="text-[11px] text-sky-850 mt-1 font-semibold">Penyeliaan Wali Kelas</p>
                  </div>

                  <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100">
                    <span className="material-symbols-outlined text-rose-800 bg-rose-100/40 p-2 rounded-xl text-xl">block</span>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-3">Mangkir / Alpha (A)</p>
                    <p className="text-2xl font-black text-rose-950 mt-1">
                      {validAttendanceRecords.filter(r => r.status === "A").length} Orang
                    </p>
                    <p className="text-[11px] text-rose-800 mt-1 font-semibold">Memerlukan Bimbingan BK</p>
                  </div>
                </div>

                {/* Filters and List */}
                <div className="bg-white border border-slate-205 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                      <span className="material-symbols-outlined text-emerald-800 text-lg">list_alt</span>
                      Buku Rekap Kehadiran Jurnal
                    </h4>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <select 
                        value={reportClass} 
                        onChange={(e) => setReportClass(e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-705 outline-none focus:border-emerald-800"
                      >
                        <option value="Semua Kelas">Semua Kelas</option>
                        {classGroups.map((c) => (
                          <option key={c} value={c}>Kelas {c}</option>
                        ))}
                      </select>
                      <select 
                        value={reportStatus} 
                        onChange={(e) => setReportStatus(e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-705 outline-none focus:border-emerald-800"
                      >
                        <option value="Semua Status">Semua Presensi</option>
                        <option value="H">Hadir (H)</option>
                        <option value="S">Sakit (S)</option>
                        <option value="I">Izin (I)</option>
                        <option value="A">Alpha (A)</option>
                      </select>
                      <button 
                        onClick={handleExportAttendance}
                        className="text-xs bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        Ekspor XLSX
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto text-sm text-slate-700">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase">Nama Siswa</th>
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase">Mata Pelajaran Penguji</th>
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase">Tanggal Jurnal</th>
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase text-center">Status</th>
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase">Keterangan Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {validAttendanceRecords
                          .filter(r => {
                            const student = students.find(s => s.nisn === r.nisn || s.name === r.studentName);
                            // Ensure student actually exists
                            if (!student) return false;
                            const matchesClass = reportClass === "Semua Kelas" || student.classGroup === reportClass;
                            const matchesStatus = reportStatus === "Semua Status" || r.status === reportStatus;
                            return matchesClass && matchesStatus;
                          })
                          .map((r, idx) => {
                            const student = students.find(s => s.nisn === r.nisn || s.name === r.studentName);
                            const classGroup = student ? student.classGroup : "XII - IPA 1";
                            return (
                              <tr key={r.id || idx} className="hover:bg-slate-50/40 transition-colors">
                                <td className="px-6 py-3.5">
                                  <p className="font-bold text-slate-800 text-sm">{r.studentName}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{classGroup} • NISN {r.nisn}</p>
                                </td>
                                <td className="px-6 py-3.5">
                                  <span className="text-xs bg-slate-105 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                                    {subjects.find(s => s.id === r.subjectId)?.name || "Matematika Peminatan"}
                                  </span>
                                </td>
                                <td className="px-6 py-3.5 text-xs font-mono text-slate-500">{new Date(r.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                                <td className="px-6 py-3.5 text-center">
                                  <span className={`inline-block w-6 h-6 leading-6 rounded-full text-[10px] font-bold text-center ${
                                    r.status === "H" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                                    r.status === "S" ? "bg-amber-50 text-amber-800 border border-amber-100" :
                                    r.status === "I" ? "bg-sky-50 text-sky-800 border border-sky-100" :
                                    "bg-rose-50 text-rose-800 border border-rose-100"
                                  }`}>
                                    {r.status}
                                  </span>
                                </td>
                                <td className="px-6 py-3.5 text-xs text-slate-500 italic font-medium">{r.note || "Hadir tepat waktu"}</td>
                              </tr>
                            );
                          })}
                        {validAttendanceRecords.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">Tidak ada rekaman data presensi sistem ganjil.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Academic / Grades View */}
            {reportType === "akademik" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Class average statistics */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Raport Madrasah</h4>
                      <p className="text-3xl font-black text-emerald-850 mt-2">
                        {validGradeRecords.length > 0
                          ? (validGradeRecords.reduce((acc, curr) => acc + curr.finalScore, 0) / validGradeRecords.length).toFixed(2)
                          : "84.37"}
                      </p>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-4 text-xs text-slate-500 font-medium">
                      Berdasarkan akumulasi nilai seluruh guru pengampu semester ganjil.
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nilai Tertinggi (Prestasi)</h4>
                      <p className="text-3xl font-black text-amber-600 mt-2">
                        {validGradeRecords.length > 0
                          ? Math.max(...validGradeRecords.map(g => g.finalScore)).toFixed(1)
                          : "96.9"}
                      </p>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-4 text-xs text-slate-500 font-medium">
                      Dicapai oleh siswa: <span className="font-bold text-slate-700">Siti Aminah</span> (XII - IPA 1)
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Siswa Butuh Remedial (&lt; 75)</h4>
                      <p className="text-3xl font-black text-rose-700 mt-2">
                        {validGradeRecords.filter(g => g.finalScore < 75).length} Siswa
                      </p>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-4 text-xs text-slate-500 font-medium">
                      Rasio: <span className="font-bold text-rose-700">{Math.round((validGradeRecords.filter(g => g.finalScore < 75).length / Math.max(1, validGradeRecords.length)) * 100)}%</span> dari total seluruh siswa.
                    </div>
                  </div>
                </div>

                {/* Grade list table */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                      <span className="material-symbols-outlined text-emerald-805 text-lg">school</span>
                      Lembar Rekap Ketuntasan Akademik Terintegrasi
                    </h4>
                    <button 
                      onClick={handleExportGrades}
                      className="text-xs bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span>
                      Ekspor Raport Keseluruhan
                    </button>
                  </div>

                  <div className="overflow-x-auto text-sm text-slate-700">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase">Nama Lengkap Siswa</th>
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase">Mata Pelajaran</th>
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase text-center">Tugas</th>
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase text-center">UTS</th>
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase text-center">UAS</th>
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase text-center">Nilai Akhir</th>
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase text-center">Ketuntasan (A/B/C)</th>
                          <th className="px-6 py-3 font-bold text-xs text-slate-500 uppercase">Rekomendasi Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-705">
                        {validGradeRecords.map((g, idx) => (
                          <tr key={g.id || idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-6 py-3.5 font-bold text-slate-800">{g.studentName}</td>
                            <td className="px-6 py-3.5 text-xs font-semibold text-emerald-900">
                              {subjects.find(s => s.id === g.subjectId)?.name || "Matematika Peminatan"}
                            </td>
                            <td className="px-6 py-3.5 text-center font-mono text-xs">{g.assignmentScore}</td>
                            <td className="px-6 py-3.5 text-center font-mono text-xs">{g.utsScore}</td>
                            <td className="px-6 py-3.5 text-center font-mono text-xs">{g.uasScore}</td>
                            <td className="px-6 py-3.5 text-center font-mono text-xs font-bold text-emerald-800">{g.finalScore.toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                                g.finalScore >= 80 ? "bg-emerald-50 text-emerald-800 border border-emerald-100" :
                                g.finalScore >= 75 ? "bg-amber-50 text-amber-800 border border-amber-100" :
                                "bg-rose-50 text-rose-800 border border-rose-100"
                              }`}>
                                {g.grade}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-xs text-slate-500 italic font-medium max-w-xs truncate">{g.note || "Tuntas secara penuh"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Module: PENGATURAN */}
        {activeModule === "pengaturan" && (
          <div className="space-y-8 animate-fadeIn max-w-4xl">
            {/* School Identity Information */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-800">Identitas Resmi Institusi Pendidikan</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Nama Lembaga Madrasah</label>
                    <input 
                      type="text" 
                      value={schoolName} 
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:border-emerald-800 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">NPSN Nasional</label>
                    <input 
                      type="text" 
                      value={schoolNpsn} 
                      onChange={(e) => setSchoolNpsn(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:border-emerald-800 outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Sertifikasi Akreditasi BAN-S/M</label>
                    <input 
                      type="text" 
                      value={schoolAccreditation} 
                      onChange={(e) => setSchoolAccreditation(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Alamat Kantor Rektorat &amp; Kelas</label>
                    <input 
                      type="text" 
                      value={schoolAddress} 
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#b45309] uppercase">Tahun Ajaran Aktif (Sistem SIALMA)</label>
                    <input 
                      type="text" 
                      id="systemAcademicYearInput"
                      placeholder="Contoh: 2025/2026 atau 2026/2027" 
                      defaultValue={academicYear}
                      className="w-full bg-[#fffbeb] border border-[#f59e0b] focus:border-amber-600 rounded-lg px-3 py-2 text-amber-955 font-bold text-sm outline-none"
                    />
                    <p className="text-[10px] text-[#78350f]">Sinkronisasi tahun ajaran aktif sistem secara global.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#b45309] uppercase">Semester Aktif (Sistem SIALMA)</label>
                    <select
                      id="systemAcademicSemesterInput"
                      defaultValue={academicSemester}
                      className="w-full bg-[#fffbeb] border border-[#f59e0b] focus:border-amber-600 rounded-lg px-3 py-2.5 text-amber-955 font-bold text-sm outline-none cursor-pointer"
                    >
                      <option value="1">1 (Ganjil)</option>
                      <option value="2">2 (Genap)</option>
                    </select>
                    <p className="text-[10px] text-[#78350f]">Ganti semester akademik untuk rekap presensi &amp; raport.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#b45309] uppercase">Kurikulum Aktif (Sistem SIALMA)</label>
                    <input 
                      type="text" 
                      id="systemActiveCurriculumInput"
                      placeholder="Contoh: Kurikulum Merdeka atau K-13" 
                      defaultValue={activeCurriculum}
                      className="w-full bg-[#fffbeb] border border-[#f59e0b] focus:border-amber-600 rounded-lg px-3 py-2 text-amber-955 font-bold text-sm outline-none"
                    />
                    <p className="text-[10px] text-[#78350f]">Ganti kurikulum aktif madrasah yang fleksibel terpadu.</p>
                  </div>
                </div>
                <div className="pt-2 flex justify-end font-bold">
                  <button 
                    onClick={() => {
                      const inputYear = document.getElementById("systemAcademicYearInput") as HTMLInputElement;
                      const inputSem = document.getElementById("systemAcademicSemesterInput") as HTMLSelectElement;
                      const inputCur = document.getElementById("systemActiveCurriculumInput") as HTMLInputElement;
                      
                      if (inputYear && onUpdateAcademicYear) {
                        onUpdateAcademicYear(inputYear.value);
                      }
                      if (inputSem && onUpdateAcademicSemester) {
                        onUpdateAcademicSemester(inputSem.value);
                      }
                      if (inputCur && onUpdateCurriculum) {
                        onUpdateCurriculum(inputCur.value);
                      }
                      toastActive("Identitas sekolah, Tahun Ajaran, Semester, dan Kurikulum Baru SIALMA berhasil diperbarui secara terintegrasi!");
                    }} 
                    className="bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    Perbarui Identitas &amp; Periode Aktif
                  </button>
                </div>
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Pengaturan Akun & Profil Pribadi Admin</h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Terintegrasi SIALMA</span>
              </div>
              <div className="p-6 space-y-6">
                {/* Profile Photo Display & Input */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                  <img 
                    src={profile.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCV76PALTNnY9-xgkMcL7gBkxiEGJ-VCbspOr_U2LJ-eWj1DHnlQcrBpHzic_GKZIGHDEqSQA1ppDFuw8EdJbpBW74XPLz9qsKLkMMANeczCe60xzLcTTV-29JhNojxqFM123B3UFzXDsh1BEea3VR9TpVEcc22PWqQQ5JAkAcbXuqLr6LpIeutCb0s3hVcu9ruuaPMA8PIRkHfZOT1z8BdBzXRHL04UvcrHAHNyg9w3uq1FycfOyDrMjlRqbF-IY0LJ3m_VhFDaR8"} 
                    alt="Current Avatar" 
                    className="w-20 h-20 rounded-full border-4 border-slate-100 shadow-sm object-cover shrink-0" 
                  />
                  <div className="space-y-2 w-full">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Tautan / URL Foto Profil Baru</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        id="adminAvatarUrlInput"
                        placeholder="https://example.com/foto.jpg" 
                        defaultValue={profile.avatarUrl}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-705 text-xs focus:border-emerald-800 outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const input = document.getElementById("adminAvatarUrlInput") as HTMLInputElement;
                          if (input && input.value) {
                            onUpdateProfile({
                              ...profile,
                              avatarUrl: input.value
                            });
                            toastActive("Foto profil baru sukses diterapkan!");
                          } else {
                            alert("Silakan masukkan tautan foto profil yang valid.");
                          }
                        }}
                        className="bg-emerald-805 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 text-white font-bold text-[11px] px-4 py-2 rounded-lg cursor-pointer shrink-0 transition-colors"
                      >
                        Terapkan
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">Anda juga dapat memasukkan URL gambar web eksternal lainnya.</p>
                  </div>
                </div>

                {/* Identity Form */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const updated: any = {
                      ...profile,
                      name: String(fd.get("name")),
                      username: String(fd.get("username")).toLowerCase(),
                      email: String(fd.get("email")),
                      phone: String(fd.get("phone")),
                      address: String(fd.get("address")),
                    };
                    const pwd = String(fd.get("password"));
                    if (pwd) updated.password = pwd;
                    
                    onUpdateProfile(updated);
                    toastActive("Biodata profil dan sistem koordinasi SIALMA diperbarui!");
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase">Nama Lengkap</label>
                      <input 
                        type="text" 
                        name="name" 
                        required 
                        defaultValue={profile.name}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-705 text-sm focus:border-emerald-800 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase">Username Sistem</label>
                      <input 
                        type="text" 
                        name="username" 
                        required 
                        defaultValue={profile.username}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-rose-800 text-sm focus:border-emerald-800 outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase">Email</label>
                      <input 
                        type="email" 
                        name="email" 
                        required 
                        defaultValue={profile.email}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-705 text-sm focus:border-emerald-800 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase">No. Handphone / WhatsApp</label>
                      <input 
                        type="text" 
                        name="phone" 
                        defaultValue={profile.phone || ""}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-705 text-sm focus:border-emerald-800 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase">Alamat Rumah Domisili</label>
                      <input 
                        type="text" 
                        name="address" 
                        defaultValue={profile.address || ""}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-705 text-sm focus:border-emerald-800 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase">Kata Sandi Baru (Ubah jika perlu)</label>
                      <input 
                        type="password" 
                        name="password" 
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-705 text-sm focus:border-emerald-800 outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button 
                      type="submit" 
                      className="bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Perbarui Data Profil Saya
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Module: KELAS */}
        {activeModule === "kelas" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header info */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl">meeting_room</span>
                  Manajemen Kelas & Rombongan Belajar (Rombel)
                </h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-xl">
                  Konfigurasikan kelompok ruang kelas akademik, kapasitas siswa, penugasan Wali Kelas terintegrasi, serta update masal penempatan siswa-siswi MA Al-Ma'sum.
                </p>
              </div>
              <button
                onClick={() => handleOpenClassModal()}
                className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1 shadow-sm transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Tambah Kelas Baru
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <span className="material-symbols-outlined text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl text-2xl float-right">meeting_room</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Rombel</p>
                <h3 className="text-3xl font-black text-slate-800 mt-2">{classGroups.length} <span className="text-xs font-semibold text-slate-400">Kelas</span></h3>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <span className="material-symbols-outlined text-emerald-850 bg-teal-50 px-3 py-2 rounded-xl text-2xl float-right">group</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kepadatan Rata-Rata</p>
                <h3 className="text-3xl font-black text-slate-800 mt-2">
                  {Math.round(students.length / Math.max(1, classGroups.length))} <span className="text-xs font-semibold text-slate-400">Siswa/Kelas</span>
                </h3>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <span className="material-symbols-outlined text-amber-600 bg-amber-50 px-3 py-2 rounded-xl text-2xl float-right">gavel</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Wali Kelas Terisi</p>
                <h3 className="text-3xl font-black text-slate-800 mt-2">
                  {classGroups.filter(c => teachers.some(t => t.classGroup === c)).length} <span className="text-xs font-semibold text-slate-400">dari {classGroups.length}</span>
                </h3>
              </div>
            </div>

            {/* List Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input
                    type="text"
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    placeholder="Cari kelas akademik..."
                    className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="overflow-x-auto text-xs text-slate-700">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 font-bold text-slate-400 uppercase">
                      <th className="px-6 py-3">Nama Kelas Akademik</th>
                      <th className="px-6 py-3">Guru Wali Kelas</th>
                      <th className="px-6 py-3 text-center">Jumlah Siswa Terdaftar</th>
                      <th className="px-6 py-3">Jenjang Kelas</th>
                      <th className="px-6 py-3 text-right">Aksi Manajemen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classGroups
                      .filter(c => c.toLowerCase().includes(classSearch.toLowerCase()))
                      .map((c, idx) => {
                        const classStudents = students.filter(s => s.classGroup === c);
                        const assignedWali = teachers.find(t => t.classGroup === c);
                        const isGradeX = c.toUpperCase().startsWith("X ");
                        const isGradeXI = c.toUpperCase().startsWith("XI ");
                        const isGradeXII = c.toUpperCase().startsWith("XII ");
                        let gradeLevel = "Jenjang X";
                        if (isGradeXI) gradeLevel = "Jenjang XI";
                        else if (isGradeXII) gradeLevel = "Jenjang XII";

                        return (
                          <tr key={c} className="hover:bg-slate-50/40 font-medium text-slate-600">
                            <td className="px-6 py-4 font-bold text-slate-800 text-sm flex items-center gap-2">
                              <span className="material-symbols-outlined text-emerald-800 text-lg">meeting_room</span>
                              {c}
                            </td>
                            <td className="px-6 py-4">
                              {assignedWali ? (
                                <div className="flex items-center gap-2">
                                  <img src={assignedWali.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5icwHFGxYosCiNHrjvMKm_MyIY_K1pgE88k2PtBVKwWTfWeL8B8NXSFGdZLXJNdJI1B-AjHknSYptUz9bdGdnMM_jbk1CzUFW1Hylo_-6kVEGas_LJEnRJ0LMVRX5o3P2wWhgcwILQ-x3dBKUSOOjYwbQls7f5FpXG1taAVa_tg9-mS9mKH1T8qbRLUeWtImzduCCOmUYEVYTKEe5lEPKERh0fItehBazU1b3qUSmJXj0gqiJh2-AIqoVLBdIqHz-xTN-VCEqXg"} alt="Wali" className="w-5 h-5 rounded-full object-cover border border-slate-100 shrink-0" />
                                  <span className="font-bold text-emerald-900">{assignedWali.name}</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Belum ditentukan</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-700">
                              <span className="bg-emerald-50 text-emerald-850 px-2 py-0.5 rounded-full font-mono text-xs border border-emerald-100">
                                {classStudents.length} Siswa
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider">{gradeLevel}</td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => handleOpenClassModal(c, idx)}
                                className="text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-2 py-1 rounded transition-colors cursor-pointer"
                                title="Ubah Nama Kelas"
                              >
                                Ubah
                              </button>
                              <button
                                onClick={() => handleDeleteClass(c)}
                                className="text-rose-600 hover:bg-rose-50 border border-rose-100 px-2 py-1 rounded font-bold transition-colors cursor-pointer"
                                title="Hapus Kelas Rombel"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Module: USERS */}
        {activeModule === "users" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header with action */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl">manage_accounts</span>
                  Sistem Autentikasi & Akun Pengguna SIALMA
                </h2>
                <p className="text-xs text-emerald-100 mt-1 max-w-xl">
                  Registrasikan akun guru pengampu, siswa-siswi kelas, operator tata usaha, dan jajaran pimpinan MA Al-Ma'sum yang terhubung secara instan dan aman.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setImportStatus({ type: null, message: "" });
                    setIsImportModalOpen(true);
                  }}
                  className="bg-emerald-700/60 hover:bg-emerald-700 text-emerald-50 border border-emerald-600/30 hover:text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer animate-pulse"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  Unggah Batch Excel / CSV
                </button>

                <button
                  onClick={() => handleOpenUserModal()}
                  className="bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Buat Akun Pengguna Baru
                </button>
                       {/* Custom Tabs to separate users into: Siswa vs Staff (Guru, Admin, Kepsek) */}
            <div className="flex border-b border-slate-105 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm gap-1.5 font-sans">
              <button
                onClick={() => {
                  setUserTab("siswa");
                  setSelectedUsernames([]); // Clear selections
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  userTab === "siswa"
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span className="material-symbols-outlined text-sm">school</span>
                <span>Akun Siswa</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${userTab === "siswa" ? "bg-emerald-950/40 text-emerald-101" : "bg-slate-100 text-slate-500"}`}>
                  {users.filter(u => u.role === "Siswa").length}
                </span>
              </button>
              <button
                onClick={() => {
                  setUserTab("staff");
                  setSelectedUsernames([]); // Clear selections
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  userTab === "staff"
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                <span>Akun Tenaga Pendidik &amp; Kependidikan (Guru, Admin, Kepsek)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${userTab === "staff" ? "bg-emerald-950/40 text-emerald-101" : "bg-slate-100 text-slate-500"}`}>
                  {users.filter(u => u.role !== "Siswa").length}
                </span>
              </button>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setSelectedUsernames([]); // Reset selection on search change
                    }}
                    placeholder="Cari pengguna berdasarkan nama, username, email..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white outline-none focus:border-emerald-700 font-sans"
                  />
                </div>
                
                {/* Filter Perkelas (Class Filter Dropdown) */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Kelas:</span>
                  <select
                    value={selectedUserClassFilter}
                    onChange={(e) => {
                      setSelectedUserClassFilter(e.target.value);
                      setSelectedUsernames([]); // Reset selection on class filter change
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer font-sans"
                  >
                    <option value="Semua Kelas">Semua Kelas</option>
                    {classGroups.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Sub-Role Filter (Only active on Staff tab) */}
                {userTab === "staff" && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-sans">Peran:</span>
                    <select
                      value={selectedUserRoleFilter}
                      onChange={(e) => {
                        setSelectedUserRoleFilter(e.target.value);
                        setSelectedUsernames([]); // Reset selection on role filter change
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer font-sans"
                    >
                      <option value="Semua Peran">Semua Peran Staf</option>
                      <option value="Guru">Guru</option>
                      <option value="Admin">Administrator</option>
                      <option value="Kepala Sekolah">Kepala Sekolah</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Panel Seleksi & Aksi Massal Pengguna */}
            {(() => {
              const displayedUsers = users.filter(u => {
                // 1. Check tab role
                if (userTab === "siswa") {
                  if (u.role !== "Siswa") return false;
                } else {
                  if (u.role === "Siswa") return false;
                  if (selectedUserRoleFilter !== "Semua Peran" && u.role !== selectedUserRoleFilter) {
                    return false;
                  }
                }

                // 2. Class filter
                if (selectedUserClassFilter !== "Semua Kelas" && u.classGroup !== selectedUserClassFilter) {
                  return false;
                }

                // 3. Search query
                const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                  u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                  u.email.toLowerCase().includes(userSearch.toLowerCase());
                return matchesSearch;
              });

              const isAllChecked = displayedUsers.length > 0 && displayedUsers.every(u => selectedUsernames.includes(u.username));

              return (
                <>
                  <div className={`p-4 rounded-2xl border transition-all duration-300 font-sans flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    selectedUsernames.length > 0 
                      ? "bg-amber-50/80 border-amber-250 shadow-xs" 
                      : "bg-slate-50 border-slate-200"
                  }`}>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`material-symbols-outlined text-lg ${selectedUsernames.length > 0 ? "text-amber-800" : "text-slate-400"}`}>
                        check_box
                      </span>
                      <p className="text-xs font-bold text-slate-700">
                        Status Seleksi: <span className={`text-sm ${selectedUsernames.length > 0 ? "text-amber-950 font-extrabold" : "text-slate-500 font-medium"}`}>
                          {selectedUsernames.length > 0 ? `${selectedUsernames.length} Akun Terpilih` : "Belum Ada Akun Terpilih"}
                        </span>
                      </p>
                      <div className="h-4 w-px bg-slate-300/60 hidden sm:block"></div>
                      <button 
                        onClick={() => {
                          const displayedUsernames = displayedUsers.map(u => u.username);
                          setSelectedUsernames(displayedUsernames);
                          toastActive(`Berhasil memilih seluruh (${displayedUsernames.length}) akun.`);
                        }}
                        className="bg-white hover:bg-slate-100 text-emerald-800 border border-slate-250 text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all"
                      >
                        Seleksi Semua Akun
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUsernames([]);
                          toastActive("Pilihan seleksi akun dibatalkan.");
                        }}
                        disabled={selectedUsernames.length === 0}
                        className="bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 disabled:opacity-50 border border-slate-250 text-[10px] font-black tracking-wide uppercase px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        Batal Seleksi
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Tindakan Massal:</span>
                      <button
                        onClick={() => {
                          if (selectedUsernames.length === 0) {
                            alert("Silakan seleksi akun terlebih dahulu!");
                            return;
                          }
                          handleBulkResetUserPasswords();
                        }}
                        className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">lock_reset</span>
                        <span>Reset Sandi '123'</span>
                      </button>
                      <button
                        onClick={() => {
                          if (selectedUsernames.length === 0) {
                            alert("Silakan seleksi akun terlebih dahulu!");
                            return;
                          }
                          handleBulkDeleteUsers();
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        <span>Hapus Massal</span>
                      </button>
                    </div>
                  </div>

                  {/* Users list Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto text-xs text-slate-705 font-medium">
                      <table className="w-full text-left border-collapse font-sans">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100 font-bold text-slate-400 uppercase">
                            <th className="px-6 py-4 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={isAllChecked}
                                onChange={() => {
                                  const displayedUsernames = displayedUsers.map(u => u.username);
                                  if (isAllChecked) {
                                    setSelectedUsernames(selectedUsernames.filter(un => !displayedUsernames.includes(un)));
                                  } else {
                                    setSelectedUsernames(Array.from(new Set([...selectedUsernames, ...displayedUsernames])));
                                  }
                                }}
                                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                              />
                            </th>
                            <th className="px-6 py-4">Nama Lengkap &amp; Username</th>
                            <th className="px-6 py-4">Alamat Surat Elektronik (Email)</th>
                            <th className="px-6 py-4">NIP / NISN / ID</th>
                            <th className="px-6 py-4">Peran Sistem</th>
                            <th className="px-6 py-4 font-bold">Rincian Informasi</th>
                            <th className="px-6 py-4 text-right font-bold">Aksi Operator</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayedUsers.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">
                                Belum ada akun pengguna yang sesuai dengan filter ini.
                              </td>
                            </tr>
                          ) : (
                            displayedUsers.map((u) => {
                              let roleBadge = "bg-orange-50 text-orange-850 border-orange-100";
                              if (u.role === "Guru") roleBadge = "bg-emerald-50 text-emerald-800 border-emerald-100";
                              else if (u.role === "Admin") roleBadge = "bg-blue-50 text-blue-800 border-blue-100";
                              else if (u.role === "Kepala Sekolah") roleBadge = "bg-purple-50 text-purple-800 border-purple-100";

                              const isSelected = selectedUsernames.includes(u.username);

                              return (
                                <tr key={u.username} className={`hover:bg-slate-50/40 text-slate-655 ${isSelected ? "bg-emerald-50/20" : ""}`}>
                                  <td className="px-6 py-4 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {
                                        if (isSelected) {
                                          setSelectedUsernames(selectedUsernames.filter(un => un !== u.username));
                                        } else {
                                          setSelectedUsernames([...selectedUsernames, u.username]);
                                        }
                                      }}
                                      className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                                    />
                                  </td>
                                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                                    <img src={u.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCV76PALTNnY9-xgkMcL7gBkxiEGJ-VCbspOr_U2LJ-eWj1DHnlQcrBpHzic_GKZIGHDEqSQA1ppDFuw8EdJbpBW74XPLz9qsKLkMMANeczCe60xzLcTTV-29JhNojxqFM123B3UFzXDsh1BEea3VR9TpVEcc22PWqQQ5JAkAcbXuqLr6LpIeutCb0s3hVcu9ruuaPMA8PIRkHfZOT1z8BdBzXRHL04UvcrHAHNyg9w3uq1FycfOyDrMjlRqbF-IY0LJ3m_VhFDaR8"} alt="User" referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-slate-100 object-cover shrink-0" />
                                    <div>
                                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{u.name}</h4>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 inline-block font-sans">@{u.username}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-semibold text-slate-500 font-sans">{u.email}</td>
                                  <td className="px-6 py-4 font-bold text-slate-700 font-sans tracking-tight">{u.id}</td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border uppercase ${roleBadge}`}>
                                      {u.role}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 font-medium text-slate-500">
                                    {u.role === "Siswa" && (
                                      <span className="text-slate-600 font-bold block">Kelas: {u.classGroup || "Semua"}</span>
                                    )}
                                    {u.role === "Guru" && (
                                      <>
                                        <span className="text-slate-700 font-bold block">{u.title || "Guru Bidang Studi"}</span>
                                        <span className="text-[10px] text-slate-400 block">Wali Rombel: {u.classGroup || "-"}</span>
                                      </>
                                    )}
                                    {u.role === "Admin" && <span className="italic text-slate-500">Tata Usaha &amp; Sistem</span>}
                                    {u.role === "Kepala Sekolah" && <span className="font-bold text-emerald-800">Direktorat Madrasah</span>}
                                    <span className="text-[10px] text-slate-550 bg-slate-100 rounded-md px-1.5 py-0.5 mt-1 inline-block font-bold font-sans">
                                      🔑 Sandi: {u.password || "password123"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-2">
                                    <button
                                      onClick={() => handleOpenUserModal(u)}
                                      className="text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-100/50 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer font-sans"
                                    >
                                      Ubah Akun
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u)}
                                      className="text-rose-600 hover:bg-rose-50 border border-rose-100 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer font-sans"
                                      disabled={u.username === "admin"} // protect seed admin
                                    >
                                      {u.username === "admin" ? "Sistem" : "Hapus"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}        </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Element */}
      <footer className="w-full py-6 mt-auto bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center px-8 text-xs text-slate-500 shrink-0">
        <p className="font-semibold text-slate-400">© 2026 MA AL-MA’SUM Malausma — Sistem Informasi Akademik SIALMA</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#help" onClick={(e) => { e.preventDefault(); alert("Admin SIALMA Support Email: support@ma-alsum.edu."); }} className="hover:text-emerald-800 transition-colors">Admin Support</a>
          <span>•</span>
          <a href="#version" onClick={(e) => { e.preventDefault(); alert("SIALMA Engine v4.2.1-Stable, didukung Node.js & React."); }} className="hover:text-emerald-800 transition-colors">SIALMA v4.2</a>
        </div>
      </footer>

      {/* CRUD Modal: SISWA */}
      {isSiswaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-emerald-900">
                {siswaEditIdx ? "Ubah Data Siswa SIALMA" : "Pendaftaran Siswa Baru"}
              </h3>
              <button onClick={() => setIsSiswaModalOpen(false)}>
                <span className="material-symbols-outlined text-slate-400 hover:text-rose-700">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveSiswa} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">NISN Unik Siswa</label>
                <input 
                  type="text" 
                  value={formSiswaNisn}
                  onChange={(e) => setFormSiswaNisn(e.target.value)}
                  placeholder="Contoh: 0045218903"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold select-all"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Nama Lengkap Siswa</label>
                <input 
                  type="text" 
                  required
                  value={formSiswaName}
                  onChange={(e) => setFormSiswaName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi Prasetyo"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Kelas Akademik</label>
                  <select 
                    value={formSiswaClass}
                    onChange={(e) => setFormSiswaClass(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-700"
                  >
                    {classGroups.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Status Belajar</label>
                  <select 
                    value={formSiswaStatus}
                    onChange={(e) => setFormSiswaStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-700"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="NON-AKTIF">NON-AKTIF</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Jenis Kelamin</label>
                <select 
                  value={formSiswaGender}
                  onChange={(e) => setFormSiswaGender(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-750 font-semibold"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsSiswaModalOpen(false)} className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 font-bold hover:bg-rose-100/50 cursor-pointer text-xs">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 text-white font-bold rounded-lg shadow cursor-pointer text-xs">Simpan Siswa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Modal: GURU */}
      {isGuruModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-emerald-950">
                {guruEditIdx ? "Ubah Data Tenaga Pendidik" : "Tambah Guru Pengampu Baru"}
              </h3>
              <button onClick={() => setIsGuruModalOpen(false)}>
                <span className="material-symbols-outlined text-slate-405">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveGuru} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-0.5">NIP Guru</label>
                <input 
                  type="text" 
                  value={formGuruNip}
                  onChange={(e) => setFormGuruNip(e.target.value)}
                  placeholder="Contoh: 198205122010..."
                  className="w-full bg-white border border-slate-200 p-2 text-slate-700 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-0.5">Nama &amp; Gelar Pendidik</label>
                <input 
                  type="text" 
                  required
                  value={formGuruName}
                  onChange={(e) => setFormGuruName(e.target.value)}
                  placeholder="Contoh: Dra. Hindayati, M.Pd."
                  className="w-full bg-white border border-slate-200 p-2 text-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-0.5">Alamat Email Resmi</label>
                <input 
                  type="email" 
                  required
                  value={formGuruEmail}
                  onChange={(e) => setFormGuruEmail(e.target.value)}
                  placeholder="hinda@almasum.sch.id"
                  className="w-full bg-white border border-slate-200 p-2 text-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-0.5">Bidang Pengajaran</label>
                  <input 
                    type="text" 
                    value={formGuruSubject}
                    onChange={(e) => setFormGuruSubject(e.target.value)}
                    placeholder="Matematika"
                    className="w-full bg-white border border-slate-202 p-2 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-0.5">Wali Kelas</label>
                  <input 
                    type="text" 
                    value={formGuruWali}
                    onChange={(e) => setFormGuruWali(e.target.value)}
                    placeholder="XII-IPA 1"
                    className="w-full bg-white border border-slate-202 p-2 text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-0.5">Status Jabatan</label>
                <select 
                  value={formGuruStatus}
                  onChange={(e) => setFormGuruStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 p-2 text-slate-750"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Cuti">Cuti</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setIsGuruModalOpen(false)} className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg font-bold text-rose-700 cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold cursor-pointer border border-emerald-700">Simpan Guru</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Modal: SUBJECTS */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 text-slate-800">
              <h3 className="text-base font-bold">
                {subjectEditIdx ? "Ubah Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
              </h3>
              <button onClick={() => setIsSubjectModalOpen(false)}>
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Kode Mapel</label>
                  <input 
                    type="text" 
                    required 
                    value={formSubCode}
                    onChange={(e) => setFormSubCode(e.target.value)}
                    placeholder="Contoh: MTK-01"
                    className="w-full bg-white border border-slate-200 p-2 text-slate-705"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Kategori Kurikulum</label>
                  <select 
                    value={formSubCategory}
                    onChange={(e) => setFormSubCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 p-2 text-slate-705"
                  >
                    <option value="Wajib">Wajib Hari Raya</option>
                    <option value="Peminatan">Peminatan Utama</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Nama Mata Pelajaran</label>
                <input 
                  type="text" 
                  required
                  value={formSubName}
                  onChange={(e) => setFormSubName(e.target.value)}
                  placeholder="Contoh: Matematika Peminatan Gasal"
                  className="w-full bg-white border border-slate-200 p-2 text-slate-705"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Beban Rombel Kelas</label>
                <select 
                  value={formSubClass}
                  onChange={(e) => setFormSubClass(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-2 text-slate-705"
                  required
                >
                  {classGroups.map((c) => (
                    <option key={c} value={c}>Kelas {c}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Guru Pengampu</label>
                  <select 
                    value={formSubTeacherId}
                    onChange={(e) => setFormSubTeacherId(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2 text-slate-705"
                  >
                    {teachers.map((g) => (
                      <option key={g.nip} value={g.nip}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Beban SKS Jam / Pekan</label>
                  <input 
                    type="number" 
                    required
                    value={formSubHours}
                    onChange={(e) => setFormSubHours(parseInt(e.target.value) || 3)}
                    className="w-full bg-white border border-slate-202 p-2 text-slate-705 text-center"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 cursor-pointer font-bold">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-lg font-bold cursor-pointer border border-emerald-700">Simpan Kurikulum</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulletin Create Modal */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Terbitkan Pengumuman Baru SIALMA</h3>
              <button onClick={() => setIsAnnModalOpen(false)}>
                <span className="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-400 uppercase mb-1 font-bold">Judul Headline bulletin</label>
                <input 
                  type="text" 
                  required
                  value={formAnnTitle}
                  onChange={(e) => setFormAnnTitle(e.target.value)}
                  placeholder="Masukkan judul informasi..."
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-705"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-400 uppercase mb-1 font-bold">Target Audience</label>
                <select 
                  value={formAnnTarget}
                  onChange={(e) => setFormAnnTarget(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 p-2 text-slate-705"
                >
                  <option value="SEMUA">Semua Staf &amp; Siswa</option>
                  <option value="GURU">Khusus Guru Pengampu</option>
                  <option value="SISWA">Khusus Siswa &amp; Perwakilan Wali</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 uppercase mb-1 font-bold">Konten Lampir bulletin detail</label>
                <textarea 
                  required
                  value={formAnnContent}
                  onChange={(e) => setFormAnnContent(e.target.value)}
                  rows={4}
                  placeholder="Detail bulletin pengumuman pengurus..."
                  className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-705"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAnnModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-650 rounded-lg">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-800 text-white rounded-lg font-bold">Publikasi bulletin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Modal: KELAS */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 z-[150] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xl text-emerald-800">meeting_room</span>
                {classEditIdx !== null ? "Ubah Informasi Kelas" : "Tambah Ruang Kelas Baru"}
              </h3>
              <button onClick={() => setIsClassModalOpen(false)}>
                <span className="material-symbols-outlined text-slate-400 hover:text-rose-600 cursor-pointer">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveClass} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Nama Kelas / Rombel</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: XII - IPA 3 atau XII - IPS 4"
                  value={formClassName}
                  onChange={(e) => setFormClassName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold focus:border-emerald-800 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">
                  * Nama kelas akan dijadikan sebagai basis grup kelas siswa dan wali kelas.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                <button type="button" onClick={() => setIsClassModalOpen(false)} className="px-3.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg">Batal</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-800 text-white rounded-lg cursor-pointer">Simpan Kelas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRUD Modal: USER ACCOUNT */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 z-[150] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scaleUp my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-sm font-bold text-emerald-990 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xl text-emerald-800">manage_accounts</span>
                {userEditIdx ? "Sunting Profil & Akun Pengguna" : "Registrasi Akun SIALMA Baru"}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)}>
                <span className="material-symbols-outlined text-slate-400 hover:text-rose-600 cursor-pointer">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Peran Akses (Role)*</label>
                  <select
                    value={formUserRole}
                    onChange={(e) => {
                      const selRole = e.target.value;
                      setFormUserRole(selRole);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-700 cursor-pointer"
                    disabled={!!userEditIdx}
                  >
                    <option value="Siswa">Siswa (Student)</option>
                    <option value="Guru">Guru (Teacher)</option>
                    <option value="Admin">Administrator (Operator)</option>
                    <option value="Kepala Sekolah">Kepala Sekolah (Keptek)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">NIP / NISN / No. ID*</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 1989042183 / 00124589"
                    value={formUserID}
                    onChange={(e) => setFormUserID(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-bold unicode-bidi outline-none select-all"
                    disabled={!!userEditIdx}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Nama Lengkap*</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dr. Herman Sanjaya"
                    value={formUserName}
                    onChange={(e) => setFormUserName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:border-emerald-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Username* (Huruf Kecil, Unik)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: hermansanjaya"
                    value={formUserUsername}
                    onChange={(e) => setFormUserUsername(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:border-emerald-800 outline-none"
                    disabled={!!userEditIdx}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Alamat Email Resmi*</label>
                  <input
                    type="email"
                    required
                    placeholder="Contoh: user@ma-alsum.edu"
                    value={formUserEmail}
                    onChange={(e) => setFormUserEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:border-emerald-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Kata Sandi (Password)*</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan Kata Sandi"
                    value={formUserPassword}
                    onChange={(e) => setFormUserPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:border-emerald-800 outline-none"
                  />
                </div>
              </div>

              {(formUserRole === "Siswa" || formUserRole === "Guru") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Grup Kelas Akademik</label>
                    <select
                      value={formUserClassGroup}
                      onChange={(e) => setFormUserClassGroup(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 font-bold text-slate-700 cursor-pointer"
                    >
                      {classGroups.map(classItem => (
                        <option key={classItem} value={classItem}>{classItem}</option>
                      ))}
                      <option value="-">Tanpa Kelas / Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold uppercase mb-1">Gelar / Spesialisasi</label>
                    <input
                      type="text"
                      placeholder={formUserRole === "Guru" ? "Contoh: Guru Fisika / Wali Kelas" : "Contoh: Siswa Aktif"}
                      value={formUserTitle}
                      onChange={(e) => setFormUserTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:border-emerald-800 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812-3456-7890"
                    value={formUserPhone}
                    onChange={(e) => setFormUserPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:border-emerald-800 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold uppercase mb-1">Alamat Domisili</label>
                  <input
                    type="text"
                    placeholder="Contoh: Komplek Cibiru Permai No. 12"
                    value={formUserAddress}
                    onChange={(e) => setFormUserAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:border-emerald-800 outline-none"
                  />
                </div>
              </div>

              {!userEditIdx && (
                <div className="p-3 bg-emerald-50 text-emerald-850 rounded-xl leading-relaxed text-[10px] border border-emerald-100/55">
                  <strong>Catatan Otomatis:</strong> Mendaftarkan user bersangkutan dengan role <strong>{formUserRole}</strong> juga akan otomatis melakukan sinkronisasi dengan database list kesiswaan (Student DB) / keguruan (Teacher DB) terpadu. Password default akun adalah sama dengan username akses.
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg cursor-pointer">Batal</button>
                <button type="submit" className="px-5 py-2 bg-emerald-800 hover:bg-emerald-950 border border-emerald-700 text-white rounded-lg cursor-pointer">Kirim &amp; Daftarkan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEL IMPORT MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 z-[150] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scaleUp my-8">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-sm font-bold text-emerald-990 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xl text-emerald-800 font-bold">database</span>
                Unggah Batch Pengguna via Excel / CSV
              </h3>
              <button onClick={() => setIsImportModalOpen(false)}>
                <span className="material-symbols-outlined text-slate-400 hover:text-rose-600 cursor-pointer">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="text-slate-600">
                Gunakan fasilitas ini untuk menambahkan daftar siswa, guru, administrator, atau kepala sekolah secara massal. Sistem akan otomatis mendeteksi kecocokan data dan menyinkronkan ke database kesiswaan/kurikulum SIALMA Cloud.
              </p>

              <div className="p-3 bg-sky-50 text-sky-900 rounded-xl space-y-2 border border-sky-150">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sky-600 text-lg shrink-0">info</span>
                  <div>
                    <strong className="block text-[11px] uppercase font-bold text-sky-950">Aturan Kolom Berkas:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px]">
                      <li>Kolom wajib: <code className="font-mono bg-sky-100 text-sky-950 px-1 rounded">ID_NISN_NIP</code>, <code className="font-mono bg-sky-100 text-sky-950 px-1 rounded">Nama_Lengkap</code>, <code className="font-mono bg-sky-100 text-sky-950 px-1 rounded">Username</code>, dan <code className="font-mono bg-sky-100 text-sky-950 px-1 rounded">Peran_Akses</code>.</li>
                      <li>Peran Akses yang valid: <strong>Siswa</strong>, <strong>Guru</strong>, <strong>Admin</strong>, atau <strong>Kepala Sekolah</strong>.</li>
                      <li>Jika kolom Kelas dikosongkan untuk Siswa/Guru, default kelas diisi dengan <strong>XII - IPA 1</strong>.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Download Template Button */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-dashed border-emerald-300 flex flex-col items-center text-center space-y-2">
                <p className="font-semibold text-slate-700">Format belum siap?</p>
                <p className="text-[10px] text-slate-400">Unduh format Excel resmi SIALMA yang telah dikonfigurasikan dengan standard schema database</p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="bg-white border border-emerald-500/30 hover:border-emerald-600 hover:bg-emerald-50 text-emerald-800 font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all text-[11px]"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Unduh Contoh excel (.xlsx)
                </button>
              </div>

              {/* Upload Input Area */}
              <div className="space-y-1.5">
                <label className="block text-slate-400 font-bold uppercase mb-0.5">Pilih File XLSX / XLS / CSV</label>
                <div className="relative border border-slate-200 hover:border-emerald-800 rounded-xl p-4 bg-slate-50 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[100px]">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelImport}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    disabled={isImporting}
                  />
                  <span className="material-symbols-outlined text-3xl text-emerald-700 mb-1">cloud_upload</span>
                  <p className="font-bold text-slate-700 text-[11px]">
                    {isImporting ? "Sedang memproses..." : "Klik atau seret File spreadsheet Anda ke sini"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mendukung extensi .xlsx, .xls atau .csv</p>
                </div>
              </div>

              {/* Status Box */}
              {importStatus.type && (
                <div className={`p-3 rounded-xl border leading-relaxed text-[11px] ${
                  importStatus.type === "success" 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
                    : importStatus.type === "error" 
                    ? "bg-rose-50 border-rose-200 text-rose-950" 
                    : "bg-sky-50 border-sky-200 text-sky-950"
                }`}>
                  <div className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-base mt-0.5 shrink-0">
                      {importStatus.type === "success" ? "check_circle" : importStatus.type === "error" ? "cancel" : "cached"}
                    </span>
                    <span className="font-semibold font-sans">{importStatus.message}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs font-bold border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg cursor-pointer hover:bg-slate-50"
                disabled={isImporting}
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL SCHEDULE IMPORT MODAL */}
      {isScheduleImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 z-[150] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scaleUp my-8 font-sans">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-sm font-bold text-emerald-990 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="material-symbols-outlined text-xl text-emerald-800 font-bold">calendar_month</span>
                Unggah Batch Jadwal via Excel / CSV
              </h3>
              <button onClick={() => setIsScheduleImportModalOpen(false)}>
                <span className="material-symbols-outlined text-slate-400 hover:text-rose-600 cursor-pointer">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="text-slate-600">
                Gunakan menu ini untuk meluncurkan jadwal kegiatan belajar mengajar (KBM) massal seluruh kelas di MA Al-Ma'sum Malausma. Data mata pelajaran baru otomatis terdaftar jika tidak ditemukan kecocokan kode master pelajaran.
              </p>

              <div className="p-3 bg-emerald-50/50 text-emerald-950 rounded-xl space-y-2 border border-emerald-150">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-800 text-lg shrink-0">info</span>
                  <div>
                    <strong className="block text-[11px] uppercase font-bold text-emerald-950">Aturan Kolom Berkas Jadwal:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-emerald-900">
                      <li>Kolom wajib: <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Hari</code>, <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Mata_Pelajaran</code>, dan <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Kelas</code>.</li>
                      <li>Kolom pendukung opsional: <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Waktu_Mulai</code>, <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Waktu_Selesai</code>, dan <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Ruangan</code>.</li>
                      <li>Pilihan Hari yang valid: <strong>SENIN, SELASA, RABU, KAMIS, JUMAT, SABTU</strong>.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Download Template Button */}
              <div className="bg-sky-50/30 p-4 rounded-xl border border-dashed border-sky-300 flex flex-col items-center text-center space-y-2">
                <p className="font-semibold text-slate-700">Gunakan format terstandarisasi?</p>
                <p className="text-[10px] text-slate-400">Unduh format excel jadwal resmi kurikulum SIALMA untuk mempercepat pemetaan data</p>
                <button
                  type="button"
                  onClick={handleDownloadScheduleTemplate}
                  className="bg-white border border-sky-500/30 hover:border-sky-650 hover:bg-sky-50 text-sky-800 font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all text-[11px]"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Unduh Format Contoh Jadwal (.xlsx)
                </button>
              </div>

              {/* Upload Input Area */}
              <div className="space-y-1.5">
                <label className="block text-slate-450 font-bold uppercase mb-0.5">Pilih File XLSX / XLS / CSV Jadwal</label>
                <div className="relative border border-slate-200 hover:border-emerald-800 rounded-xl p-4 bg-slate-50 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[100px]">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelScheduleImport}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    disabled={isScheduleImporting}
                  />
                  <span className="material-symbols-outlined text-3xl text-emerald-700 mb-1">calendar_view_day</span>
                  <p className="font-bold text-slate-700 text-[11px]">
                    {isScheduleImporting ? "Sedang memproses..." : "Klik atau seret File jadwal (.xlsx / .csv) Anda ke sini"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mendukung format spreadsheet universal</p>
                </div>
              </div>

              {/* Status Box */}
              {scheduleImportStatus.type && (
                <div className={`p-3 rounded-xl border leading-relaxed text-[11px] ${
                  scheduleImportStatus.type === "success" 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
                    : scheduleImportStatus.type === "error" 
                    ? "bg-rose-50 border-rose-200 text-rose-950" 
                    : "bg-sky-50 border-sky-200 text-sky-950"
                }`}>
                  <div className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-base mt-0.5 shrink-0">
                      {scheduleImportStatus.type === "success" ? "check_circle" : scheduleImportStatus.type === "error" ? "cancel" : "cached"}
                    </span>
                    <span className="font-semibold font-sans">{scheduleImportStatus.message}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs font-bold border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsScheduleImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg cursor-pointer hover:bg-slate-50"
                disabled={isScheduleImporting}
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL SUBJECT IMPORT MODAL */}
      {isSubjectImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/65 z-[150] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scaleUp my-8 font-sans">
            <div className="flex justify-between items-center border-b border-slate-150 pb-3">
              <h3 className="text-sm font-bold text-emerald-990 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="material-symbols-outlined text-xl text-emerald-800 font-bold">menu_book</span>
                Unggah Batch Mata Pelajaran via Excel / CSV
              </h3>
              <button onClick={() => setIsSubjectImportModalOpen(false)}>
                <span className="material-symbols-outlined text-slate-400 hover:text-rose-600 cursor-pointer">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="text-slate-600">
                Gunakan menu ini untuk menambahkan mata pelajaran (kurikulum) baru ke dalam sistem SIALMA secara instan. Nilai default akan digunakan untuk guru pengampu jika tidak dicocokkan berdasarkan NIP atau Nama Guru yang tepat.
              </p>

              <div className="p-3 bg-emerald-50/50 text-emerald-950 rounded-xl space-y-2 border border-emerald-150">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-800 text-lg shrink-0">info</span>
                  <div>
                    <strong className="block text-[11px] uppercase font-bold text-emerald-950">Panduan Kolom Spreadsheet:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-emerald-900">
                      <li>Kolom wajib: <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Mata_Pelajaran</code> dan <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Kelas</code>.</li>
                      <li>Kolom tambahan opsional: <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Kode_Mapel</code>, <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">NIP_Guru</code>, <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Nama_Guru</code>, <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Kategori</code> (Wajib / Peminatan / Muatan Lokal), dan <code className="font-mono bg-emerald-100 text-emerald-950 px-1 rounded">Jam_Per_Minggu</code>.</li>
                      <li>Jika nama mata pelajaran dan kelas sudah terdaftar, data akan otomatis diperbarui (update) tanpa duplikasi!</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Download Template Button */}
              <div className="bg-sky-50/30 p-4 rounded-xl border border-dashed border-sky-300 flex flex-col items-center text-center space-y-2">
                <p className="font-semibold text-slate-700">Belum memiliki format yang cocok?</p>
                <p className="text-[10px] text-slate-400">Gunakan berkas excel berformat kurikulum SIALMA demi kelancaran import data</p>
                <button
                  type="button"
                  onClick={handleDownloadSubjectTemplate}
                  className="bg-white border border-sky-500/30 hover:border-sky-650 hover:bg-sky-50 text-sky-800 font-bold px-4 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all text-[11px]"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  Unduh Format Contoh Mapel (.xlsx)
                </button>
              </div>

              {/* Upload Input Area */}
              <div className="space-y-1.5">
                <label className="block text-slate-450 font-bold uppercase mb-0.5">Pilih Berkas Format Mapel</label>
                <div className="relative border border-slate-200 hover:border-emerald-800 rounded-xl p-4 bg-slate-50 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[100px]">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelSubjectImport}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    disabled={isSubjectImporting}
                  />
                  <span className="material-symbols-outlined text-3xl text-emerald-700 mb-1">upload_file</span>
                  <p className="font-bold text-slate-700 text-[11px]">
                    {isSubjectImporting ? "Sedang memproses..." : "Klik atau seret berkas kurikulum mapel Anda ke sini"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Mendukung format spreadsheet XLSX, XLS, CSV</p>
                </div>
              </div>

              {/* Status Box */}
              {subjectImportStatus.type && (
                <div className={`p-3 rounded-xl border leading-relaxed text-[11px] ${
                  subjectImportStatus.type === "success" 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950" 
                    : subjectImportStatus.type === "error" 
                    ? "bg-rose-50 border-rose-200 text-rose-950" 
                    : "bg-sky-50 border-sky-200 text-sky-950"
                }`}>
                  <div className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-base mt-0.5 shrink-0">
                      {subjectImportStatus.type === "success" ? "check_circle" : subjectImportStatus.type === "error" ? "cancel" : "cached"}
                    </span>
                    <span className="font-semibold font-sans">{subjectImportStatus.message}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs font-bold border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSubjectImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg cursor-pointer hover:bg-slate-50"
                disabled={isSubjectImporting}
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM SAFE REUSABLE CONFIRM MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/65 z-[300] flex items-center justify-center p-4 backdrop-blur-sm animate-scaleUp">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 font-sans border-t-4 border-rose-600">
            <div className="flex items-center gap-3 text-rose-700">
              <span className="material-symbols-outlined text-4xl">warning</span>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight">
                  {confirmModal.title}
                </h3>
                <p className="text-[11px] text-slate-450 uppercase font-bold mt-0.5">Tindakan ini permanen</p>
              </div>
            </div>

            <p className="text-slate-650 text-xs leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex justify-end gap-3 pt-2 text-xs font-bold border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4.5 py-2.5 border border-slate-200 text-slate-500 rounded-xl cursor-pointer hover:bg-slate-50 transition-all font-semibold"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer shadow-sm hover:shadow transition-all font-semibold"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
