export enum Role {
  SISWA = "Siswa",
  GURU = "Guru",
  ADMIN = "Admin",
  KEPALA_SEKOLAH = "Kepala Sekolah",
}

export interface UserProfile {
  id: string; // NIK or NISN
  name: string;
  email: string;
  role: Role;
  username: string;
  avatarUrl: string;
  classGroup?: string; // e.g. "XII - IPA 1"
  subjects?: string[]; // e.g. ["Matematika", "Fisika"]
  title?: string; // e.g. "Guru Senior Matematika", "Kepala Sekolah"
  gradeYear?: string; // e.g. "2023/2024"
  biodata?: string;
  phone?: string;
  address?: string;
  npsn?: string;
  password?: string; // custom stored password
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target: "SEMUA" | "GURU" | "SISWA";
  date: string; // ISO string or simple display string
  author: string;
  icon: string;
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string;
  classGroup: string;
  category: "Wajib" | "Peminatan" | "Muatan Lokal";
  hoursPerWeek: number;
}

export interface StudentItem {
  nisn: string;
  name: string;
  classGroup: string;
  gender: "Laki-laki" | "Perempuan";
  status: "AKTIF" | "NON-AKTIF";
  academicScore?: number;
}

export interface TeacherItem {
  nip: string;
  name: string;
  email: string;
  subject: string;
  classGroup: string; // Wali Kelas of this class, or "-"
  status: "Aktif" | "Cuti";
  rating: number;
  teachingHours: number;
  avatarUrl: string;
}

export interface AttendanceRecord {
  id: string;
  nisn: string;
  studentName: string;
  status: "H" | "I" | "S" | "A"; // Hadir, Izin, Sakit, Alfa
  date: string; // YYYY-MM-DD
  subjectId: string;
  note?: string;
  semester?: string; // "1" for Ganjil, "2" for Genap
}

export interface GradeRecord {
  id: string;
  nisn: string;
  studentName: string;
  subjectId: string;
  assignmentScore: number;
  utsScore: number;
  uasScore: number;
  finalScore: number;
  grade: string;
  note?: string;
  semester?: string; // "1" for Ganjil, "2" for Genap
}

export interface QuizItem {
  id: string;
  title: string;
  subject: string;
  classGroup: string;
  questionsCount: number;
  durationMinutes: number;
  dueDate: string;
  status: "Aktif" | "Tertutup";
  createdAt?: string;
  questions: QuizQuestion[];
  studentScore?: number;
  completedAt?: string;
  submissions?: Array<{
    studentId: string;
    studentName: string;
    score: number;
    completedAt: string;
  }>;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  level: "INFO" | "WARNING" | "ERROR";
  message: string;
}

export interface ScheduleItem {
  id: string;
  day: "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU";
  timeSlot: string; // e.g. "07:30 - 09:00"
  subjectId: string; // references SubjectItem's ID
  room: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classGroup: string;
  semester: string; // "1" or "2"
  fileUrl?: string;
  fileName?: string;
  uploadedAt: string;
  authorName: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classGroup: string;
  semester: string; // "1" or "2"
  dueDate: string;
  uploadedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  score?: number;
  feedback?: string;
}
