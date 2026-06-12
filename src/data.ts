import { Role, UserProfile, Announcement, SubjectItem, StudentItem, TeacherItem, QuizItem, SystemAuditLog, GradeRecord, AttendanceRecord, ScheduleItem } from "./types";

export const demoProfiles: Record<Role, UserProfile> = {
  [Role.SISWA]: {
    id: "0045218903",
    name: "Arya Satria",
    email: "arya.satria@almasum.sch.id",
    username: "arya_satria",
    role: Role.SISWA,
    classGroup: "XII - IPA 1",
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdSLM7QDUvPvc9bf_BQpd_nSXMyJtmPciHHAgEIjgwLfvubstaw4FQP-nOXeMZNMcDkyuEGZOrKqJc5JcIulg0CmeHRKLIVU_loQy7IuFWsw_QLSSQJPklt2cBhnqJV8S1oHlB3sfRSSV_pDuRk7Z35Vz7cm_nJkf-lsFbmzzx_V0oJINJ02cw0YYzFz4P6o_IOVHZoLKENvT0esNZGQeiOHMphm1HK0kZhR3qnAMU6axgS7k4BvZGkLO-sU5k85PmwDhTgeOIyR8",
    title: "Siswa Berprestasi IPA",
    gradeYear: "2023/2024",
    biodata: "Siswa Jurusan IPA yang berdedikasi di MA AL-MA'SUM dengan minat pada fisika dan teknologi digital. Saat ini menjabat sebagai sekretaris OSIS. Tujuan akademik saya adalah melanjutkan studi Teknik Dirgantara di universitas.",
    phone: "+62 812-4029-3844",
    address: "Jl. Pendidikan No. 45, Kecamatan Malausma, Majalengka, Jawa Barat"
  },
  [Role.GURU]: {
    id: "197405121999031002",
    name: "Ahmad Fauzi, M.Pd.",
    email: "ahmad.f@masum.sch.id",
    username: "ahmad_fauzi",
    role: Role.GURU,
    classGroup: "XII - IPA 1",
    subjects: ["Matematika", "Kalkulus Lanjut"],
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5icwHFGxYosCiNHrjvMKm_MyIY_K1pgE88k2PtBVKwWTfWeL8B8NXSFGdZLXJNdJI1B-AjHknSYptUz9bdGdnMM_jbk1CzUFW1Hylo_-6kVEGas_LJEnRJ0LMVRX5o3P2wWhgcwILQ-x3dBKUSOOjYwbQls7f5FpXG1taAVa_tg9-mS9mKH1T8qbRLUeWtImzduCCOmUYEVYTKEe5lEPKERh0fItehBazU1b3qUSmJXj0gqiJh2-AIqoVLBdIqHz-xTN-VCEqXg",
    title: "Guru Senior Matematika",
    gradeYear: "2023/2024",
    biodata: "Tenaga pendidik matematika senior dengan pengalaman lebih dari 24 tahun di MA AL-MA'SUM. Berdedikasi tinggi untuk memberikan pemahaman kalkulus praktis dan analitis guna mempersiapkan siswa ke jenjang perguruan tinggi sains terbaik.",
    phone: "+62 812-3456-7890",
    address: "Jl. Raya Pendidikan No. 42, Distrik Akademik, Jawa Barat"
  },
  [Role.ADMIN]: {
    id: "ADM-9921",
    name: "Super Admin SIALMA",
    email: "admin@ma-alsum.edu",
    username: "super_admin",
    role: Role.ADMIN,
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCV76PALTNnY9-xgkMcL7gBkxiEGJ-VCbspOr_U2LJ-eWj1DHnlQcrBpHzic_GKZIGHDEqSQA1ppDFuw8EdJbpBW74XPLz9qsKLkMMANeczCe60xzLcTTV-29JhNojxqFM123B3UFzXDsh1BEea3VR9TpVEcc22PWqQQ5JAkAcbXuqLr6LpIeutCb0s3hVcu9ruuaPMA8PIRkHfZOT1z8BdBzXRHL04UvcrHAHNyg9w3uq1FycfOyDrMjlRqbF-IY0LJ3m_VhFDaR8",
    title: "Administrator Utama",
    gradeYear: "2023/2024",
    phone: "+62 800-1111-9988",
    address: "Kantor Tata Usaha MA AL-MA'SUM, Gd. Rektorat Lt. 1"
  },
  [Role.KEPALA_SEKOLAH]: {
    id: "197205121998031004",
    name: "Drs. Ahmad Mansur",
    email: "a.mansur@almasum.sch.id",
    username: "ahmad_mansur",
    role: Role.KEPALA_SEKOLAH,
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRqZQXgCJZj6suY41foJt9iIPgkQLGK9cJgxF5IADUTscOR575Ays3FTw2xtdSC80iyBRq_aIpayFaDiZaUpeZjHYXVJIziHqNxbHCyAvA81IImKj_gEjEO94Bhyg5pc2YwecDz1xc2TFdulwcnNOwfZ-HbcqLe690UyUgWSxBjYFPAD6DePV3MUqCognsYh82AlEhOnw2jDjbYO8QLOUpjUy0QqtXg4Yas5bLaxRp_vqrX0q2Qdrflln8wfow_IrA861qYeYx_0Q",
    title: "Kepala Sekolah",
    gradeYear: "2023/2024",
    npsn: "20210459",
    phone: "+62 811-9003-8821",
    address: "Jl. Pendidikan No. 45, Kecamatan Malausma, Majalengka, Jawa Barat"
  }
};

export const initialAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    title: "Pemberitahuan Libur Nasional & Cuti Bersama Maulid Nabi",
    content: "Sehubungan dengan perayaan Maulid Nabi Muhammad SAW, kegiatan belajar mengajar akan diliburkan mulai tanggal 25-26 Oktober. Kelas pengganti akan diatur oleh kurikulum masing-masing.",
    target: "SEMUA",
    date: "2026-06-04T09:00:00Z",
    author: "Admin Sekolah",
    icon: "event_note"
  },
  {
    id: "ann-2",
    title: "Pemberitahuan Persiapan Penilaian Akhir Semester Ganjil",
    content: "Diberitahukan kepada seluruh siswa kelas X, XI, XII bahwa jadwal pengayaan dan try out PAS Ganjil akan dilaksanakan awal minggu depan. Silakan mempersiapkan diri.",
    target: "SISWA",
    date: "2026-06-03T14:30:00Z",
    author: "Kurikulum MA",
    icon: "campaign"
  },
  {
    id: "ann-3",
    title: "Pembaruan Prosedur Pengujian & Input Nilai Raport Ganjil",
    content: "Diberitahukan kepada bapak/ibu guru pengampu bahwa sistem input nilai KKM terbaru semester ganjil sudah aktif. Batas pengisian adalah tanggal 10 Desember.",
    target: "GURU",
    date: "2026-06-02T10:15:00Z",
    author: "IT Support SIALMA",
    icon: "payments"
  }
];

export const initialSubjects: SubjectItem[] = [
  {
    id: "sub-1",
    code: "MTK-01",
    name: "Matematika Peminatan",
    teacherId: "197405121999031002",
    teacherName: "Ahmad Fauzi, M.Pd.",
    teacherAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5icwHFGxYosCiNHrjvMKm_MyIY_K1pgE88k2PtBVKwWTfWeL8B8NXSFGdZLXJNdJI1B-AjHknSYptUz9bdGdnMM_jbk1CzUFW1Hylo_-6kVEGas_LJEnRJ0LMVRX5o3P2wWhgcwILQ-x3dBKUSOOjYwbQls7f5FpXG1taAVa_tg9-mS9mKH1T8qbRLUeWtImzduCCOmUYEVYTKEe5lEPKERh0fItehBazU1b3qUSmJXj0gqiJh2-AIqoVLBdIqHz-xTN-VCEqXg",
    classGroup: "XII - IPA 1",
    category: "Wajib",
    hoursPerWeek: 4
  },
  {
    id: "sub-2",
    code: "FIS-02",
    name: "Fisika Dasar & Mekanika",
    teacherId: "198205122010011005",
    teacherName: "Bambang S.T, M.Pd",
    teacherAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYbfqrNPi-C8RLtKwkBaGd_x_QzZ6DbZGmffWCMGqnrz_1XgGGh6LR_ay208cARUrKaz8BMhItCHUP1XRfx7KdZuH8jbKFWzD9ROOXxP74koVghT0t_MpTKFssH7BBSq9d6jb0t303K7cB4iTEkRV5IHVrPAVoI_KNewOl36PVX6IM7OHbrQf-TxMCnoLghf6Zk3OzG6VYdnjcdoVwPVILToaXpgU2pWXFrs3JfVknGaRriXLLPpLwsSCebPv6-surBVJr_1M8HZI",
    classGroup: "XII - IPA 1",
    category: "Peminatan",
    hoursPerWeek: 3
  },
  {
    id: "sub-3",
    code: "BIO-01",
    name: "Biologi Molekuler",
    teacherId: "198506042012012001",
    teacherName: "Dra. Hj. Nurjanah",
    teacherAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCn7wnIEBiBZUn7sISh9HcuvrAaJbFfdL1TEfU1Iwm7tOZNXhVEwSgREU1HMNocCkkkoBI6e186O-Bapj8ZRD_l3FMhoEvm8hY7N5a2CjL9G7BWVxfWH5h-oIrLaHTEjJHb2IpBGCu_vNSBekJ_tOP8rKdCXxC2NGu1MGuPNrIHgPHxE2AVT54FxXsNkjA5Z5urtXA276sq8NmBC2wRz0MPRXnM8Pn_E7HaS0qHPT8mBnpIL61_ByFh00FzCtO8ubwVbUcPQcsDhc0",
    classGroup: "XII - IPA 1",
    category: "Wajib",
    hoursPerWeek: 3
  },
  {
    id: "sub-4",
    code: "AGM-01",
    name: "Studi Al-Quran & Teologi",
    teacherId: "199011232015011002",
    teacherName: "Budiman, S.Ag",
    teacherAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAc0w7AkDpIdV74KafHFqzLhIp-xnZRzO7bcbJv8hLZT_fQSEUg0vjtAxdcKwUrUJu7-ZnT3lCj_sCuR3DoODTPLXfEEJed5Iwenblrm314x0fz1VkF94vEmYXocRzoEakm0F3xxGnRVCleErqrSDziZYwAMKxXKD6ipzaIa6PHNPbIbmnhHTtH4Rh-y-87SoBZbjS_VFH3GZ_HJjOVPMC0nhwC2NyfuckAEGX2vA-fZl7swEN3e0WCM-83tsPXtmNQEqKEyEKetNk",
    classGroup: "XII - IPA 1",
    category: "Wajib",
    hoursPerWeek: 2
  }
];

export const initialStudents: StudentItem[] = [
  { nisn: "0045218903", name: "Arya Satria", classGroup: "XII - IPA 1", gender: "Laki-laki", status: "AKTIF", academicScore: 92 },
  { nisn: "0045218904", name: "Bunga Melati", classGroup: "XII - IPA 1", gender: "Perempuan", status: "AKTIF", academicScore: 88 },
  { nisn: "0045218905", name: "Cahyo Ardiansyah", classGroup: "XII - IPA 1", gender: "Laki-laki", status: "AKTIF", academicScore: 78 },
  { nisn: "0045218906", name: "Dian Zulkarnaen", classGroup: "XII - IPA 1", gender: "Laki-laki", status: "AKTIF", academicScore: 65 },
  { nisn: "0045218907", name: "Eka Fitriani", classGroup: "XII - IPA 1", gender: "Perempuan", status: "AKTIF", academicScore: 85 },
  { nisn: "0045218908", name: "Siti Aminah", classGroup: "XII - IPA 1", gender: "Perempuan", status: "AKTIF", academicScore: 95 }
];

export const initialTeachers: TeacherItem[] = [
  {
    nip: "197405121999031002",
    name: "Ahmad Fauzi, M.Pd.",
    email: "ahmad.f@masum.sch.id",
    subject: "Matematika",
    classGroup: "XII - IPA 1",
    status: "Aktif",
    rating: 4.9,
    teachingHours: 24,
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAm5icwHFGxYosCiNHrjvMKm_MyIY_K1pgE88k2PtBVKwWTfWeL8B8NXSFGdZLXJNdJI1B-AjHknSYptUz9bdGdnMM_jbk1CzUFW1Hylo_-6kVEGas_LJEnRJ0LMVRX5o3P2wWhgcwILQ-x3dBKUSOOjYwbQls7f5FpXG1taAVa_tg9-mS9mKH1T8qbRLUeWtImzduCCOmUYEVYTKEe5lEPKERh0fItehBazU1b3qUSmJXj0gqiJh2-AIqoVLBdIqHz-xTN-VCEqXg"
  },
  {
    nip: "198205122010011005",
    name: "Bambang S.T, M.Pd",
    email: "bambang.s@masum.sch.id",
    subject: "Fisika",
    classGroup: "XII - IPA 2",
    status: "Aktif",
    rating: 4.7,
    teachingHours: 18,
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYbfqrNPi-C8RLtKwkBaGd_x_QzZ6DbZGmffWCMGqnrz_1XgGGh6LR_ay208cARUrKaz8BMhItCHUP1XRfx7KdZuH8jbKFWzD9ROOXxP74koVghT0t_MpTKFssH7BBSq9d6jb0t303K7cB4iTEkRV5IHVrPAVoI_KNewOl36PVX6IM7OHbrQf-TxMCnoLghf6Zk3OzG6VYdnjcdoVwPVILToaXpgU2pWXFrs3JfVknGaRriXLLPpLwsSCebPv6-surBVJr_1M8HZI"
  },
  {
    nip: "198506042012012001",
    name: "Dra. Hj. Nurjanah",
    email: "nurjanah@masum.sch.id",
    subject: "Biologi",
    classGroup: "-",
    status: "Aktif",
    rating: 4.6,
    teachingHours: 16,
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCn7wnIEBiBZUn7sISh9HcuvrAaJbFfdL1TEfU1Iwm7tOZNXhVEwSgREU1HMNocCkkkoBI6e186O-Bapj8ZRD_l3FMhoEvm8hY7N5a2CjL9G7BWVxfWH5h-oIrLaHTEjJHb2IpBGCu_vNSBekJ_tOP8rKdCXxC2NGu1MGuPNrIHgPHxE2AVT54FxXsNkjA5Z5urtXA276sq8NmBC2wRz0MPRXnM8Pn_E7HaS0qHPT8mBnpIL61_ByFh00FzCtO8ubwVbUcPQcsDhc0"
  },
  {
    nip: "199011232015011002",
    name: "Budiman, S.Ag",
    email: "budiman@masum.sch.id",
    subject: "Fiqih & Teologi",
    classGroup: "-",
    status: "Cuti",
    rating: 4.5,
    teachingHours: 10,
    avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAc0w7AkDpIdV74KafHFqzLhIp-xnZRzO7bcbJv8hLZT_fQSEUg0vjtAxdcKwUrUJu7-ZnT3lCj_sCuR3DoODTPLXfEEJed5Iwenblrm314x0fz1VkF94vEmYXocRzoEakm0F3xxGnRVCleErqrSDziZYwAMKxXKD6ipzaIa6PHNPbIbmnhHTtH4Rh-y-87SoBZbjS_VFH3GZ_HJjOVPMC0nhwC2NyfuckAEGX2vA-fZl7swEN3e0WCM-83tsPXtmNQEqKEyEKetNk"
  }
];

export const initialQuizzes: QuizItem[] = [
  {
    id: "quiz-1",
    title: "Soal Limit Trigonometri Lanjut",
    subject: "Matematika Peminatan",
    classGroup: "XII - IPA 1",
    questionsCount: 3,
    durationMinutes: 45,
    dueDate: "2026-06-08T23:59:00Z",
    status: "Aktif",
    questions: [
      {
        id: "q-1-1",
        questionText: "Berapakah nilai lim (x -> 0) dari (sin 5x) / (3x)?",
        options: ["A. 5/3", "B. 3/5", "C. 0", "D. 1"],
        correctIndex: 0
      },
      {
        id: "q-1-2",
        questionText: "Berapakah nilai lim (x -> 0) dari (1 - cos 2x) / (x^2)?",
        options: ["A. 0", "B. 1", "C. 2", "D. 4"],
        correctIndex: 2
      },
      {
        id: "q-1-3",
        questionText: "Nilai dari lim (x -> pi/4) dari (sin x - cos x) / (tan x - 1) adalah?",
        options: ["A. sqrt(2)", "B. 1/sqrt(2)", "C. -1/sqrt(2)", "D. -sqrt(2)"],
        correctIndex: 1
      }
    ]
  },
  {
    id: "quiz-2",
    title: "Kuis Reading Comprehension: Scientific Journal",
    subject: "Bahasa Inggris Lanjutan",
    classGroup: "XII - IPA 1",
    questionsCount: 2,
    durationMinutes: 30,
    dueDate: "2026-06-10T14:00:00Z",
    status: "Aktif",
    questions: [
      {
        id: "q-2-1",
        questionText: "What is the primary objective of a scientific abstract?",
        options: [
          "A. To provide detailed methodology",
          "B. To summarize the research briefly",
          "C. To list all visual diagram credentials",
          "D. To cite multiple historical reviews"
        ],
        correctIndex: 1
      },
      {
        id: "q-2-2",
        questionText: "Which section in a research paper usually explains the 'How' of the result?",
        options: ["A. Abstract", "B. Methodology", "C. Discussion", "D. References"],
        correctIndex: 1
      }
    ]
  }
];

export const initialAttendanceRecords: AttendanceRecord[] = [
  { id: "att-1", nisn: "0045218903", studentName: "Arya Satria", status: "H", date: "2026-06-05", subjectId: "sub-1" },
  { id: "att-2", nisn: "0045218904", studentName: "Bunga Melati", status: "S", date: "2026-06-05", subjectId: "sub-1", note: "Demam ringan" },
  { id: "att-3", nisn: "0045218905", studentName: "Cahyo Ardiansyah", status: "H", date: "2026-06-05", subjectId: "sub-1" },
  { id: "att-4", nisn: "0045218906", studentName: "Dian Zulkarnaen", status: "A", date: "2026-06-05", subjectId: "sub-1" },
  { id: "att-5", nisn: "0045218907", studentName: "Eka Fitriani", status: "H", date: "2026-06-05", subjectId: "sub-1" },
  { id: "att-6", nisn: "0045218908", studentName: "Siti Aminah", status: "H", date: "2026-06-05", subjectId: "sub-1" }
];

export const initialGradeRecords: GradeRecord[] = [
  { id: "g-1", nisn: "0045218903", studentName: "Arya Satria", subjectId: "sub-1", assignmentScore: 92, utsScore: 88, uasScore: 94, finalScore: 92.2, grade: "A", note: "Pemikiran analitis kalkulus yang luar biasa" },
  { id: "g-2", nisn: "0045218904", studentName: "Bunga Melati", subjectId: "sub-1", assignmentScore: 85, utsScore: 82, uasScore: 88, finalScore: 85.3, grade: "A-", note: "Pertahankan ketekunan belajarmu" },
  { id: "g-3", nisn: "0045218905", studentName: "Cahyo Ardiansyah", subjectId: "sub-1", assignmentScore: 78, utsScore: 75, uasScore: 80, finalScore: 77.95, grade: "B-", note: "Perbanyak latihan soal limit fungsi" },
  { id: "g-4", nisn: "0045218906", studentName: "Dian Zulkarnaen", subjectId: "sub-1", assignmentScore: 65, utsScore: 60, uasScore: 67, finalScore: 64.45, grade: "C-", note: "Perlu bimbingan dan jam tambahan belajar" },
  { id: "g-5", nisn: "0045218907", studentName: "Eka Fitriani", subjectId: "sub-1", assignmentScore: 85, utsScore: 80, uasScore: 84, finalScore: 83.4, grade: "B+", note: "Kemajuan belajar stabil dan konsisten" },
  { id: "g-6", nisn: "0045218908", studentName: "Siti Aminah", subjectId: "sub-1", assignmentScore: 98, utsScore: 95, uasScore: 97, finalScore: 96.9, grade: "A", note: "Sangat teliti dan memahami konsep teoretis" }
];

export const initialLogs: SystemAuditLog[] = [
  { id: "log-1", timestamp: "2026-06-05T09:34:12Z", level: "INFO", message: "Otentikasi berhasil untuk pengguna: super_admin_1 (IP: 192.168.1.45)" },
  { id: "log-2", timestamp: "2026-06-05T09:35:45Z", level: "INFO", message: "Pembaruan kalender akademik untuk periode 2026/2027-GANJIL" },
  { id: "log-3", timestamp: "2026-06-05T09:38:02Z", level: "WARNING", message: "Koneksi terputus ke server cadangan wilayah AP-SOUTHEAST-1" },
  { id: "log-4", timestamp: "2026-06-05T09:40:11Z", level: "INFO", message: "Optimasi database berkala selesai dalam 1.4 detik" },
  { id: "log-5", timestamp: "2026-06-05T09:41:22Z", level: "INFO", message: "Superadmin mengubah parameter 'Skala Penilaian'" },
  { id: "log-6", timestamp: "2026-06-05T09:42:01Z", level: "INFO", message: "Cache dibersihkan untuk preferensi sistem" }
];

export const initialSchedules: ScheduleItem[] = [];

export const initialMaterials = [
  {
    id: "mat-1",
    title: "Modul 1: Kalkulus Limit & Turunan",
    description: "Modul pembelajaran ringkas untuk materi limit fungsi aljabar dan pengenalan konsep dasar kalkulus turunan.",
    subjectId: "sub-1",
    classGroup: "XII - IPA 1",
    semester: "1",
    fileName: "kalkulus_limit_turunan.pdf",
    fileUrl: "https://example.com/kalkulus_limit_turunan.pdf",
    uploadedAt: "2026-06-01T08:00:00Z",
    authorName: "Ahmad Fauzi, M.Pd."
  },
  {
    id: "mat-2",
    title: "Modul 2: Fisika Mekanika Fluida",
    description: "Modul mandiri Fluida Statis & Dinamis, hukum Bernoulli, serta contoh penerapan fisika dalam kehidupan sehari-hari.",
    subjectId: "sub-2",
    classGroup: "XII - IPA 1",
    semester: "1",
    fileName: "mekanika_fluida_dasar.pdf",
    fileUrl: "https://example.com/mekanika_fluida_dasar.pdf",
    uploadedAt: "2026-06-03T10:15:00Z",
    authorName: "Bambang S.T, M.Pd"
  }
];

export const initialAssignments = [
  {
    id: "asg-1",
    title: "Tugas Kalkulus: Turunan Implisit",
    description: "Selesaikan 3 soal turunan implisit yang tertera pada slide terakhir Modul 1. Tulis penjelasan pengerjaan secara sistematis berpola.",
    subjectId: "sub-1",
    classGroup: "XII - IPA 1",
    semester: "1",
    dueDate: "2026-06-20T23:59:00Z",
    uploadedAt: "2026-06-05T09:00:00Z"
  }
];

export const initialSubmissions = [
  {
    id: "subm-1",
    assignmentId: "asg-1",
    studentId: "0045218903",
    studentName: "Arya Satria",
    fileUrl: "https://example.com/arya_satria_kalkulus.pdf",
    fileName: "arya_satria_kalkulus.pdf",
    submittedAt: "2026-06-07T14:20:00Z",
    score: 95,
    feedback: "Algoritma pengerjaan runut dan sangat bersih. Pertahankan pembuktian limitnya!"
  }
];
