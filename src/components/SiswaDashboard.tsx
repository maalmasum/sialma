import React, { useState, useEffect } from "react";
import { UserProfile, Announcement, SubjectItem, QuizItem, AttendanceRecord, GradeRecord, ScheduleItem, LearningMaterial, Assignment, AssignmentSubmission } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { getSpecialSessionMeta } from "./AdminDashboard";

interface SiswaDashboardProps {
  profile: UserProfile;
  activeModule: string;
  announcements: Announcement[];
  subjects: SubjectItem[];
  quizzes: QuizItem[];
  attendanceRecords: AttendanceRecord[];
  gradeRecords: GradeRecord[];
  schedules: ScheduleItem[];
  materials?: LearningMaterial[];
  assignments?: Assignment[];
  submissions?: AssignmentSubmission[];
  onAddSubmission?: (newSubm: AssignmentSubmission) => void;
  onCompleteQuiz: (quizId: string, score: number) => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onModuleChange?: (module: string) => void;
  academicYear?: string;
  academicSemester?: string;
  activeCurriculum?: string;
  theme?: "light" | "dark";
  setTheme?: (theme: "light" | "dark") => void;
}

const isQuizExpired = (quiz: QuizItem) => {
  if (!quiz.createdAt) return false;
  const createdTime = new Date(quiz.createdAt).getTime();
  const endTime = createdTime + quiz.durationMinutes * 60 * 1000;
  return Date.now() > endTime;
};

const QuizTimerCountdown = ({ quiz }: { quiz: QuizItem }) => {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!quiz.createdAt) {
      setSecondsLeft(null);
      return;
    }

    const calculateRemaining = () => {
      const createdTime = new Date(quiz.createdAt!).getTime();
      const endTime = createdTime + quiz.durationMinutes * 60 * 1000;
      const now = Date.now();
      const diff = Math.max(0, Math.floor((endTime - now) / 1000));
      setSecondsLeft(diff);
    };

    calculateRemaining();
    const timer = setInterval(calculateRemaining, 1000);
    return () => clearInterval(timer);
  }, [quiz]);

  if (!quiz.createdAt) {
    return (
      <span className="flex items-center gap-1 text-rose-700 font-bold text-[10px] uppercase bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
        <span className="material-symbols-outlined text-[13px]">timer</span>
        Aktif
      </span>
    );
  }

  if (secondsLeft === null) return null;

  if (secondsLeft <= 0) {
    return (
      <span className="flex items-center gap-1 text-slate-500 font-bold text-[10px] uppercase bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
        <span className="material-symbols-outlined text-[13px]">block</span>
        Ditutup
      </span>
    );
  }

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return (
    <span className="flex items-center gap-1 text-amber-700 font-bold font-mono text-[10px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-150 animate-pulse">
      <span className="material-symbols-outlined text-[11px]">timer</span>
      SISA: {m}:{s.toString().padStart(2, "0")}
    </span>
  );
};

// Beautiful Mobile Schedule Selector - Solves overlap overlap issues completely
const MobileStudentSchedule = ({
  schedules,
  subjects,
  studentClassGroup
}: {
  schedules: ScheduleItem[];
  subjects: SubjectItem[];
  studentClassGroup?: string;
}) => {
  const days: Array<"SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU"> = [
    "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"
  ];
  
  const daysIndonesian = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
  const todayDayIndex = new Date().getDay();
  const initialDay = days.includes(daysIndonesian[todayDayIndex] as any) 
    ? (daysIndonesian[todayDayIndex] as any) 
    : "SENIN";

  const [selectedDay, setSelectedDay] = useState<"SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU">(initialDay);

  const filteredSchs = schedules.filter((sch) => {
    if (sch.day !== selectedDay) return false;
    const specialMeta = getSpecialSessionMeta(sch.subjectId);
    if (specialMeta) {
      if (specialMeta.classGroup === "Semua Kelas") return true;
      return specialMeta.classGroup === studentClassGroup;
    }
    const sub = subjects.find(sub => sub.id === sch.subjectId);
    return sub && sub.classGroup === studentClassGroup;
  });

  return (
    <div className="md:hidden space-y-4">
      {/* Day pills selector container with horizontal scrolling */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {days.map(d => {
          const isActive = selectedDay === d;
          return (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all ${
                isActive
                  ? "bg-emerald-800 text-white shadow-md shadow-emerald-850/10"
                  : "bg-white text-slate-650 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* List of sessions for the selected day */}
      <div className="space-y-3">
        {filteredSchs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 italic text-xs">
            Tidak ada mata pelajaran dijadwalkan pada hari {selectedDay}.
          </div>
        ) : (
          filteredSchs
            .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
            .map(sch => {
              const specialMeta = getSpecialSessionMeta(sch.subjectId);
              const sub = specialMeta ? null : subjects.find(s => s.id === sch.subjectId);
              const displayName = specialMeta ? specialMeta.label : (sub ? sub.name : "Mata Pelajaran");
              const displayTeacher = specialMeta ? specialMeta.attendee : (sub ? sub.teacherName : "Guru belum diplot");
              const displayRoom = sch.room || (specialMeta ? "Selasar / Sekolah" : "Ruang Kelas");
              const iconName = specialMeta ? specialMeta.icon : "meeting_room";
              
              const cardBg = specialMeta ? specialMeta.cardStyle : "bg-white border-slate-200";
              const textTheme = specialMeta ? specialMeta.themeColor : "text-[#002e2c]";
              const badgeStyle = specialMeta ? specialMeta.badgeStyle : "bg-emerald-50 text-emerald-800 border-emerald-150";

              return (
                <div key={sch.id} className={`border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 ${cardBg}`}>
                  <div className="space-y-1 min-w-0">
                    <p className={`font-extrabold text-sm truncate leading-tight flex items-center gap-1.5 ${textTheme}`}>
                      {specialMeta && <span className="material-symbols-outlined text-[16px]">{iconName}</span>}
                      {displayName}
                    </p>
                    <p className="text-[10.5px] text-slate-505 font-bold truncate">
                      {displayTeacher}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 p-1 px-2 rounded-md font-mono">
                        {displayRoom}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-black tracking-widest p-1 px-2.5 rounded-lg border font-sans ${badgeStyle}`}>
                      {sch.timeSlot}
                    </span>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

// Beautiful Student Feedback Form - Extracted to enforce the Rules of Hooks unconditionally
const StudentFeedbackForm = () => {
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!feedbackMsg.trim()) return;
      setSubmitted(true);
      setFeedbackMsg("");
      setTimeout(() => setSubmitted(false), 5000);
    }} className="space-y-3 pt-1">
      <textarea
        value={feedbackMsg}
        onChange={(e) => setFeedbackMsg(e.target.value)}
        placeholder="Tuliskan komitmen belajar Anda, tanggapan mengenai nilai, atau pesan tindak lanjut..."
        rows={3}
        className="w-full text-xs p-3.5 border border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none leading-relaxed text-slate-800"
      />
      <div className="flex justify-between items-center">
        <AnimatePresence>
          {submitted && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-emerald-700 font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
              Umpan balik berhasil dikirim dan diarsipkan ke sistem wali kelas!
            </motion.span>
          )}
        </AnimatePresence>
        <button
          type="submit"
          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2 rounded-xl border border-emerald-700 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-1 ml-auto shadow-sm"
        >
          <span className="material-symbols-outlined text-xs">send</span>
          Kirim Tanggapan
        </button>
      </div>
    </form>
  );
};

const MaterialItemCard = ({ 
  mat, 
  subjects 
}: { 
  mat: LearningMaterial; 
  subjects: SubjectItem[];
  key?: string;
}) => {
  const [progress, setProgress] = useState(-1);
  const sub = subjects.find(s => s.id === mat.subjectId);
  const displaySubject = sub ? sub.name : mat.subjectId;

  const handleDownload = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);

          // REAL file download generation and execution in student's browser device absolute storage
          try {
            const fileTitle = mat.fileName || `${mat.title.toLowerCase().replace(/\s+/g, '_')}_modul.pdf`;
            const displayTitle = mat.title;
            const subjectLabel = displaySubject;
            const author = mat.authorName;

            const contentText = `------------------------------------------------------------
MODUL PEMBELAJARAN MADRASAH ALIYAH AL-MA'SUM MALAUSMA
SIALMA DIGITAL LIBRARY (E-LEARNING ACADEMICS)
------------------------------------------------------------

[INFORMASI BERKAS]
Judul Berkas  : ${displayTitle}
Nama Berkas   : ${fileTitle}
Mata Pelajaran: ${subjectLabel}
Pengunggah/Guru: ${author}
Verifikasi Akademik: MA Al-Ma'sum Malausma Certified

[MATERI RINGKAS & SILABUS INTEL]
Siswa diimbau untuk membaca serta mempraktikkan isi materi bab ini secara sungguh-sungguh.
Silakan kerjakan tugas penugasan terstruktur yang bersangkutan melalui Dashboard Siswa Anda.

Hak Cipta © 2526 MA Al-Ma'sum Malausma. Semua Hak Dilindungi Undang-Undang.`;

            const blob = new Blob([contentText], { type: "text/plain;charset=utf-8" });
            const downloadUrl = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = downloadUrl;
            anchor.download = fileTitle;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(downloadUrl);
          } catch (e) {
            console.error("Browser download engine crash:", e);
          }

          setTimeout(() => setProgress(-1), 3000);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  return (
    <div id={`mat-${mat.id}`} className="p-4 rounded-2xl border border-slate-150 hover:border-sky-500/30 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3 relative overflow-hidden">
      <div className="space-y-1">
        <span className="inline-block text-[10px] font-bold text-sky-850 bg-sky-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-sky-200/50">
          {displaySubject}
        </span>
        <h5 className="font-extrabold text-[#002e2c] text-sm mt-1.5">{mat.title}</h5>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">PENGUNGGAH: {mat.authorName}</p>
      </div>
      
      <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
        <span className="inline-flex items-center gap-1 font-mono text-slate-500">
          <span className="material-symbols-outlined text-sm text-slate-400">description</span>
          {mat.fileName || "modul_pdf"} • 4.8 MB
        </span>
      </div>

      <div className="pt-1 select-none">
        {progress === -1 ? (
          <button
            id={`btn-download-${mat.id}`}
            onClick={handleDownload}
            className="w-full bg-sky-50 hover:bg-sky-100 text-sky-850 border border-sky-200/40 hover:border-sky-300 font-bold text-xs py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm font-black text-sky-600">downloading</span>
            Unduh Bahan Pelajaran
          </button>
        ) : (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-bold text-sky-800">
              <span>{progress === 100 ? "✓ Selesai Terunduh!" : "Mempersiapkan Unduhan..."}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-sky-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AssignmentItemCard = ({
  asg,
  mySubm,
  profile,
  onAddSubmission,
  subjects,
}: {
  asg: Assignment;
  mySubm?: AssignmentSubmission;
  profile: UserProfile;
  onAddSubmission?: (newSubm: AssignmentSubmission) => void;
  subjects: SubjectItem[];
  key?: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("");

  const sub = subjects.find(s => s.id === asg.subjectId);
  const displaySubject = sub ? sub.name : asg.subjectId;

  const handleSimulateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) {
      alert("Silakan pilih file jawaban Anda terlebih dahulu!");
      return;
    }
    setLoading(true);

    setTimeout(() => {
      if (onAddSubmission) {
        onAddSubmission({
          id: "subm-" + Date.now(),
          assignmentId: asg.id,
          studentId: profile.id,
          studentName: profile.name,
          fileUrl: "sialma://attachments/jawaban_" + Date.now() + ".pdf",
          fileName: fileName,
          submittedAt: new Date().toISOString()
        });
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div id={`asg-${asg.id}`} className="p-5 border border-slate-200 hover:border-slate-300 rounded-2xl bg-slate-50/20 hover:bg-slate-50/50 transition-all space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="space-y-0.5">
          <span className="inline-block text-[10px] font-black text-[#0f766e] bg-emerald-50 border border-emerald-100/55 px-2 py-0.5 rounded uppercase tracking-wider">
            {displaySubject}
          </span>
          <h5 className="font-extrabold text-[#002e2c] text-sm mt-1.5">{asg.title}</h5>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Batas Waktu: {asg.dueDate} WIB</p>
        </div>
        <div className="self-start sm:self-auto uppercase font-bold text-[10px] tracking-wider">
          {mySubm ? (
            <span className="p-1 px-2.5 text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
              ✓ Sudah dikumpul
            </span>
          ) : (
            <span className="p-1 px-2.5 text-amber-800 bg-amber-50 rounded-lg border border-amber-200">
              ● Belum Kumpul
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-650 leading-relaxed font-semibold">
        {asg.description}
      </p>

      {mySubm ? (
        <div className="p-4 bg-emerald-50/55 border border-emerald-100 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-emerald-950 font-extrabold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm font-bold text-emerald-600">done_all</span>
              Berkas Jawaban Terunggah:
            </p>
            <span className="text-[10px] text-slate-400 font-semibold">{new Date(mySubm.submittedAt).toLocaleDateString("id-ID")}</span>
          </div>
          <p className="text-xs text-slate-650 font-mono italic pl-5 truncate max-w-xs">
            {mySubm.fileName || "jawaban_siswa.pdf"}
          </p>
          
          <div className="border-t border-emerald-100/40 mt-2 pt-2 flex flex-col gap-1">
            {typeof mySubm.score !== "undefined" ? (
              <>
                <div className="flex justify-between items-center bg-white p-2 px-3 rounded-lg border border-emerald-250">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase">Nilai Guru:</span>
                  <span className="text-sm font-black font-mono text-emerald-950">{mySubm.score} / 100</span>
                </div>
                {mySubm.feedback && (
                  <p className="text-xs text-slate-600 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/40 mt-1 leading-relaxed">
                    <span className="font-bold text-[#0f766e]">Komentar Guru:</span> "{mySubm.feedback}"
                  </p>
                )}
              </>
            ) : (
              <span className="text-[10.5px] italic text-slate-500 pl-5">Menunggu penilaian dan komentar umpan balik guru pengampu...</span>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <form onSubmit={handleSubmitTask} className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Unggah Dokumen Jawaban (PDF / Word)</span>
              <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-xl relative overflow-hidden">
                <input
                  id={`file-input-${asg.id}`}
                  type="file"
                  onChange={handleSimulateSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer text-[0px]"
                />
                <button
                  type="button"
                  id={`btn-choose-${asg.id}`}
                  className="bg-[#0f766e] text-white hover:bg-slate-900 font-bold text-[10px] px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Pilih File
                </button>
                <span className="text-xs text-slate-600 truncate font-mono">
                  {fileName || "Tidak ada berkas dipilih"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan pengerjaan singkat (misal: Selesai dikerjakan pak)"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 outline-none mt-1 text-slate-800 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              id={`btn-submit-${asg.id}`}
              className="w-full bg-[#111827] hover:bg-slate-900 text-white font-black text-xs py-2.5 rounded-xl border border-slate-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">cloud_upload</span>
              {loading ? "Mengirim data ke cloud..." : "Kirim Jawaban Tugas Sekarang"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default function SiswaDashboard({
  profile,
  activeModule,
  announcements,
  subjects,
  quizzes,
  attendanceRecords,
  gradeRecords,
  schedules = [],
  materials = [],
  assignments = [],
  submissions = [],
  onAddSubmission,
  onCompleteQuiz,
  onUpdateProfile,
  onModuleChange,
  academicYear,
  academicSemester = "1",
  activeCurriculum = "Kurikulum Merdeka",
  theme: globalTheme,
  setTheme: globalSetTheme,
}: SiswaDashboardProps) {
  // States for Quiz Session
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(0);

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

  // States for Settings
  const [name, setName] = useState(profile.name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [bio, setBio] = useState(profile.biodata || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [address, setAddress] = useState(profile.address || "");

  // Dynamic synchronization of props to local settings state
  useEffect(() => {
    setName(profile.name || "");
    setEmail(profile.email || "");
    setAvatarUrl(profile.avatarUrl || "");
    setBio(profile.biodata || "");
    setPhone(profile.phone || "");
    setAddress(profile.address || "");
  }, [profile]);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const theme = globalTheme || "light";
  const setTheme = globalSetTheme || (() => {});
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Stats
  const myGrades = gradeRecords.filter((g) => g.nisn === profile.id);
  const myAttendance = attendanceRecords.filter((a) => a.nisn === profile.id);
  const myQuizzes = quizzes; // All quizzes for class XII-IPA 1

  const totalSessions = myAttendance.length;
  const attendedSessions = myAttendance.filter((a) => a.status === "H").length;
  const sickSessions = myAttendance.filter((a) => a.status === "S").length;
  const permSessions = myAttendance.filter((a) => a.status === "I").length;
  const absentSessions = myAttendance.filter((a) => a.status === "A").length;
  const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 98.2;

  // Real-time digital clock
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const timeStr = now.toLocaleTimeString("id-ID", { hour12: false });
      setCurrentTime(`${dateStr}, ${timeStr} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Quiz Timer countdown
  useEffect(() => {
    if (!activeQuiz || quizTimeRemaining <= 0) return;
    const timer = setTimeout(() => {
      setQuizTimeRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeQuiz, quizTimeRemaining]);

  // Handle automatic quiz submit on timeout
  useEffect(() => {
    if (activeQuiz && quizTimeRemaining === 0) {
      handleQuizSubmit();
    }
  }, [quizTimeRemaining]);

  const closeQuiz = () => {
    askConfirm(
      "Keluar dari Kuis",
      "Apakah Anda yakin ingin keluar dari pengerjaan kuis? Jawaban sementara tidak akan dikirim.",
      () => {
        setActiveQuiz(null);
      }
    );
  };

  const startQuiz = (quiz: QuizItem) => {
    if (isQuizExpired(quiz)) {
      alert("Maaf, waktu aktif pengerjaan kuis ini telah habis!");
      return;
    }
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setQuizAnswers({});
    setQuizTimeRemaining(quiz.durationMinutes * 60);
  };

  const handleQuizAnswer = (questionId: string, optionIndex: number) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleQuizSubmit = () => {
    if (!activeQuiz) return;
    let correctCount = 0;
    activeQuiz.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });
    const finalScore = Math.round((correctCount / activeQuiz.questions.length) * 100);
    onCompleteQuiz(activeQuiz.id, finalScore);
    setActiveQuiz(null);
    alert(`Luar biasa! Anda telah menyelesaikan kuis "${activeQuiz.title}". Nilai Anda: ${finalScore}/100.`);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name,
      email,
      avatarUrl,
      biodata: bio,
      phone,
      address,
    });
    showToast("Profil berhasil diperbarui!");
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      alert("Silakan isi password lama dan baru!");
      return;
    }
    setOldPassword("");
    setNewPassword("");
    showToast("Password berhasil diperbarui!");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Render specific module
  return (
    <div className="flex-1 min-h-screen flex flex-col relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-slate-900 text-white px-6 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-bounce z-[200]">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 w-full z-45 bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center h-[64px] px-4 sm:px-6 md:px-8 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="font-sans text-base md:text-xl font-bold text-emerald-900 truncate">
            {activeModule === "beranda" && "Dashboard Siswa"}
            {activeModule === "jadwal" && "Jadwal Pelajaran"}
            {activeModule === "presensi" && "Riwayat Presensi"}
            {activeModule === "nilai" && "Laporan Nilai Akademik"}
            {activeModule === "kuis" && "E-Evaluation & Kuis"}
            {activeModule === "pengaturan" && "Profil & Preferensi"}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <div className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs font-extrabold">
            <span className="material-symbols-outlined text-[15px] text-emerald-700">calendar_month</span>
            <span>TA: {academicYear || "2026/2027"} ({academicSemester === "1" ? "Ganjil" : "Genap"}) • {activeCurriculum}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl digital-clock-pod text-xs sm:text-sm shrink-0">
            <span className="material-symbols-outlined text-[15px] text-emerald-400 animate-pulse">schedule</span>
            <span className="tracking-wide hidden md:inline text-xs">{currentTime}</span>
            <span className="tracking-wide md:hidden text-xs">
              {(() => {
                try {
                  const parts = currentTime.split(",");
                  if (parts.length >= 3) {
                    const dayMonth = parts[1].trim().replace(" 2026", "").replace(" 2027", "");
                    const timeOnly = parts[2].trim().substring(0, 5);
                    const shortDay = parts[0].trim().substring(0, 3);
                    return `${shortDay}, ${dayMonth} • ${timeOnly}`;
                  }
                } catch (e) {}
                return currentTime.includes(",") ? currentTime.split(",").pop()?.trim() || currentTime : currentTime;
              })()}
            </span>
          </div>
          <div className="relative">
            <button className="text-slate-500 hover:text-emerald-800 transition-colors p-1" onClick={() => alert("Tidak ada notifikasi baru hari ini.")}>
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Areas */}
      <div className="p-4 sm:p-6 md:p-8 flex-1">
        {/* Module: BERANDA */}
        {activeModule === "beranda" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div 
                whileHover={{ scale: 1.005 }}
                className="lg:col-span-2 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center text-white shadow-xl border border-emerald-800"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute -left-10 bottom-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <span className="text-[10px] tracking-widest text-[#acf59a] font-extrabold uppercase bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/20">MA AL-MA'SUM MALAUSMA</span>
                  <h3 className="text-3xl font-black mt-3 mb-2 tracking-tight">
                    {(() => {
                      const hours = new Date().getHours();
                      if (hours < 11) return "Selamat Pagi";
                      if (hours < 15) return "Selamat Siang";
                      if (hours < 19) return "Selamat Sore";
                      return "Selamat Malam";
                    })()}, {profile.name}! 👋
                  </h3>
                  <p className="text-base text-emerald-100/95 font-medium flex flex-wrap gap-2 items-center">
                    <span>Siswa Kelas {profile.classGroup} • Tahun Ajaran {profile.gradeYear || academicYear}</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span className="font-extrabold text-[11px] bg-emerald-950/45 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-500/20">{activeCurriculum}</span>
                  </p>
                  <p className="text-xs text-emerald-200/80 italic mt-6 border-l-2 border-emerald-400 pl-4">
                    "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan, Anda dapat mengubah dunia." — Nelson Mandela
                  </p>
                </div>
              </motion.div>

              {/* Attendance Tracker */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="bg-white border border-slate-200/80 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">RASIO KEHADIRAN</p>
                    <h4 className="text-emerald-950 text-3.5xl font-black mt-1 tracking-tight">{attendanceRate.toFixed(1)}%</h4>
                  </div>
                  <span className="material-symbols-outlined text-emerald-900 bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">how_to_reg</span>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${attendanceRate}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="bg-gradient-to-r from-emerald-700 to-teal-500 h-full"
                    ></motion.div>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mt-2.5 leading-relaxed">
                    {attendedSessions} dari {totalSessions} total sesi terabsen. Pertahankan kehadiran teladan!
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Timetables & Quizzes Bento */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Daily Subjects schedule */}
              <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4.5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-800 font-bold">event_note</span>
                    {(() => {
                      const daysIndonesian = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
                      const todayDayName = daysIndonesian[new Date().getDay()];
                      return (
                        <h3 className="text-sm font-bold text-slate-800">
                          Mata Pelajaran Hari Ini ({todayDayName})
                        </h3>
                      );
                    })()}
                  </div>
                  <span className="text-xs text-emerald-950 font-bold bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full shrink-0">
                    {new Date().toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 flex-1">
                  {(() => {
                    const daysIndonesian = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
                    const todayDayName = daysIndonesian[new Date().getDay()];

                    const studentSchedules = (schedules || []).filter((sch) => {
                      if (sch.day.toUpperCase() !== todayDayName) return false;
                      const specialMeta = getSpecialSessionMeta(sch.subjectId);
                      if (specialMeta) {
                        if (specialMeta.classGroup === "Semua Kelas") return true;
                        return specialMeta.classGroup === profile.classGroup;
                      }
                      const sub = subjects.find((s) => s.id === sch.subjectId);
                      return sub && sub.classGroup === profile.classGroup;
                    });

                    if (studentSchedules.length === 0) {
                      return (
                        <div className="p-8 text-center text-slate-400 italic text-xs flex flex-col items-center justify-center py-12">
                          <span className="material-symbols-outlined text-slate-300 text-3xl mb-1 mt-4 animate-bounce">calendar_today</span>
                          <span className="font-semibold text-slate-500">Tidak ada jadwal pelajaran kelas aktif hari ini ({todayDayName}).</span>
                          <p className="text-[10px] text-slate-400 mt-1">Gunakan hari ini untuk mengulang pelajaran mandiri atau bersantai!</p>
                        </div>
                      );
                    }

                    return studentSchedules.map((sch, i) => {
                      const specialMeta = getSpecialSessionMeta(sch.subjectId);
                      const sub = specialMeta ? null : subjects.find(s => s.id === sch.subjectId);
                      if (!specialMeta && !sub) return null;
                      
                      const displayName = specialMeta ? specialMeta.label : sub?.name;
                      const displayTeacherInfo = specialMeta ? specialMeta.attendee : `Guru: ${sub?.teacherName}`;
                      const displayRoom = sch.room || (specialMeta ? "Selasar / Sekolah" : "Ruang Kelas");
                      const iconName = specialMeta ? specialMeta.icon : "meeting_room";
                      const textTheme = specialMeta ? specialMeta.themeColor : "text-slate-900";
                      const badgeStyle = specialMeta 
                        ? specialMeta.badgeStyle 
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-100";
                      const badgeLabel = specialMeta ? specialMeta.categoryName : (sub?.category || "Wajib");

                      return (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          key={sch.id} 
                          className="flex items-center gap-6 px-6 py-4 hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="text-center min-w-[100px]">
                            <p className="font-bold text-slate-800 text-sm font-sans">{sch.timeSlot}</p>
                            <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">WIB</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold text-sm truncate flex items-center gap-1.5 ${textTheme}`}>
                              {specialMeta && <span className="material-symbols-outlined text-[16px]">{iconName}</span>}
                              {displayName}
                            </h4>
                            <p className="text-xs text-slate-500 truncate font-medium">
                              {displayRoom} • {displayTeacherInfo}
                            </p>
                          </div>
                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase shrink-0 border ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Quiz list panel */}
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-800 font-bold font-black">feedback</span>
                    <h3 className="text-sm font-bold text-slate-800">Kuis Aktif</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4 flex-1">
                  {(() => {
                    const activeQuizzes = myQuizzes.filter(q => q.status === "Aktif" && typeof q.studentScore === "undefined" && !isQuizExpired(q));
                    if (activeQuizzes.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <span className="material-symbols-outlined text-slate-300 text-4xl">check_circle</span>
                          <p className="text-xs text-slate-500 mt-2 font-medium">Semua tugas &amp; kuis telah dikerjakan!</p>
                        </div>
                      );
                    }
                    return activeQuizzes.map((quiz) => (
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        key={quiz.id} 
                        className="p-4 bg-amber-50/30 border border-amber-200/60 rounded-xl space-y-3 shadow-none hover:shadow-xs transition-all"
                      >
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[9px] font-bold text-amber-800 uppercase tracking-widest">{quiz.subject}</p>
                            <QuizTimerCountdown quiz={quiz} />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 leading-tight mt-0.5">{quiz.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 font-medium">Durasi: {quiz.durationMinutes} menit • {quiz.questionsCount} Soal</p>
                        </div>
                        <button 
                          onClick={() => startQuiz(quiz)}
                          className="w-full bg-emerald-800 hover:bg-emerald-900 border border-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <span>Mulai Ujian</span>
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </motion.div>
                    ));
                  })()}

                  <hr className="border-slate-100" />
                  
                  {/* Digital library launcher */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-gradient-to-br from-emerald-800 to-teal-900 rounded-xl relative overflow-hidden text-white shadow-md border border-emerald-700/30"
                  >
                    <div className="relative z-10">
                      <h4 className="font-bold text-sm tracking-tight">E-Library Portal</h4>
                      <p className="text-[10px] text-emerald-100 opacity-90 mt-1 leading-relaxed">Akses gratis ke 1.200+ buku digital kurikulum MA.</p>
                      <button 
                        onClick={() => alert("Membuka katalog perpustakaan digital MA AL-MA'SUM...")}
                        className="mt-3 bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-[10px] px-3 py-1.5 rounded-lg inline-flex cursor-pointer shadow-xs transition-colors"
                      >
                        Buka Katalog
                      </button>
                    </div>
                    <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-7xl text-white/5 pointer-events-none">menu_book</span>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* E-Learning Integration Section (Materi & Tugas Kebutuhan) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Materi E-Learning Baru */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-800 bg-emerald-50 p-1 rounded-lg">library_books</span>
                    Materi Ajar E-Learning Baru ({profile.classGroup})
                  </h4>
                  <button 
                    onClick={() => onModuleChange && onModuleChange("materi_tugas")}
                    className="text-emerald-850 hover:text-emerald-950 font-bold text-xs flex items-center gap-0.5 transition-all text-emerald-800 cursor-pointer bg-transparent border-none"
                  >
                    <span>Lihat Semua</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>

                <div className="space-y-3.5">
                  {(() => {
                    const classMaterials = (materials || []).filter(
                      m => m.classGroup === profile.classGroup && (!m.semester || m.semester === academicSemester)
                    ).slice(0, 3);

                    if (classMaterials.length === 0) {
                      return (
                        <div className="p-6 text-center text-slate-405 italic text-xs">
                          Belum ada modul dibagikan untuk kelas Anda.
                        </div>
                      );
                    }

                    return classMaterials.map((mat) => {
                      const sub = subjects.find(s => s.id === mat.subjectId || s.name === mat.subjectId);
                      const displayTitle = mat.title;
                      const fileTitle = mat.fileName || `${mat.title.toLowerCase().replace(/\s+/g, '_')}_modul.pdf`;
                      const subjectLabel = sub ? sub.name : mat.subjectId;

                      const startLocalDownload = () => {
                        try {
                          const contentText = `------------------------------------------------------------
MODUL PEMBELAJARAN MADRASAH ALIYAH AL-MA'SUM MALAUSMA
SIALMA DIGITAL LIBRARY (E-LEARNING ACADEMICS)
------------------------------------------------------------

[INFORMASI BERKAS]
Judul Berkas  : ${displayTitle}
Nama Berkas   : ${fileTitle}
Mata Pelajaran: ${subjectLabel}
Pengunggah/Guru: ${mat.authorName}
Verifikasi Akademik: MA Al-Ma'sum Malausma Certified

[MATERI RINGKAS & SILABUS INTEL]
Siswa diimbau untuk membaca serta mempraktikkan isi materi bab ini secara sungguh-sungguh.
Silakan kerjakan tugas penugasan terstruktur yang bersangkutan melalui Dashboard Siswa Anda.

Hak Cipta © 2026 MA Al-Ma'sum Malausma. Semua Hak Dilindungi Undang-Undang.`;

                          const blob = new Blob([contentText], { type: "text/plain;charset=utf-8" });
                          const downloadUrl = URL.createObjectURL(blob);
                          const anchor = document.createElement("a");
                          anchor.href = downloadUrl;
                          anchor.download = fileTitle;
                          document.body.appendChild(anchor);
                          anchor.click();
                          document.body.removeChild(anchor);
                          URL.revokeObjectURL(downloadUrl);
                        } catch (e) {
                          console.error("Browser download failure:", e);
                        }
                      };

                      return (
                        <div key={mat.id} className="flex justify-between items-center p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-150 transition-all gap-4">
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] bg-sky-50 text-sky-800 border border-sky-150 font-bold uppercase py-0.5 px-2 rounded">
                              {subjectLabel}
                            </span>
                            <h5 className="font-bold text-slate-800 text-xs truncate mt-1">{mat.title}</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">Oleh: {mat.authorName}</p>
                          </div>
                          <button 
                            onClick={startLocalDownload}
                            className="bg-emerald-800 hover:bg-emerald-950 text-white p-2 rounded-lg flex items-center transition-all cursor-pointer font-bold gap-1 text-[10px] border-none shrink-0"
                            title="Unduh Berkas ke Penyimpanan"
                          >
                            <span className="material-symbols-outlined text-[13px] font-black">download</span>
                            <span>Unduh</span>
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Tugas Terstruktur Pending */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-800 bg-emerald-50 p-1 rounded-lg">assignment</span>
                    Tugas &amp; Pekerjaan Rumah Terstruktur ({profile.classGroup})
                  </h4>
                  <button 
                    onClick={() => onModuleChange && onModuleChange("materi_tugas")}
                    className="text-emerald-850 hover:text-emerald-950 font-bold text-xs flex items-center gap-0.5 transition-all text-emerald-800 cursor-pointer bg-transparent border-none"
                  >
                    <span>Lihat Semua</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>

                <div className="space-y-3.5">
                  {(() => {
                    const classAssignments = (assignments || []).filter(
                      a => a.classGroup === profile.classGroup && (!a.semester || a.semester === academicSemester)
                    ).slice(0, 3);

                    if (classAssignments.length === 0) {
                      return (
                        <div className="p-6 text-center text-slate-405 italic text-xs">
                          Tidak ada tugas terstruktur aktif saat ini.
                        </div>
                      );
                    }

                    return classAssignments.map((asg) => {
                      const sub = subjects.find(s => s.id === asg.subjectId || s.name === asg.subjectId);
                      const mySubm = (submissions || []).find(
                        s => s.assignmentId === asg.id && s.studentId === profile.id
                      );
                      const isSubmitted = !!mySubm;

                      return (
                        <div key={asg.id} className="flex justify-between items-center p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-150 transition-all gap-4">
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] bg-emerald-50 text-emerald-850 border border-emerald-150 font-bold uppercase py-0.5 px-2 rounded">
                              {sub ? sub.name : asg.subjectId}
                            </span>
                            <h5 className="font-bold text-slate-800 text-xs truncate mt-1">{asg.title}</h5>
                            <p className="text-[10px] text-slate-405 mt-0.5 font-medium">Tenggat: {new Date(asg.dueDate).toLocaleDateString("id-ID")}</p>
                          </div>
                          <div>
                            {isSubmitted ? (
                              <span className="text-[9px] bg-emerald-50 text-emerald-850 font-extrabold px-2.5 py-1 rounded-full border border-emerald-150 flex items-center gap-0.5 select-none shrink-0">
                                <span className="material-symbols-outlined text-[11px] font-black">check</span>
                                Selesai
                              </span>
                            ) : (
                              <button 
                                onClick={() => onModuleChange && onModuleChange("materi_tugas")}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold p-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-all shrink-0 border-none"
                              >
                                <span className="material-symbols-outlined text-xs">upload</span>
                                Kumpul
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* School announcements list */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-800 font-bold font-black">campaign</span>
                Pengumuman Resmi Sekolah
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {announcements.filter(a => a.target === "SEMUA" || a.target === "SISWA").map((ann, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -2, borderColor: "#047857" }}
                    key={ann.id} 
                    className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/80 transition-all flex gap-3.5"
                  >
                    <span className="material-symbols-outlined text-emerald-900 bg-emerald-50 p-2.5 rounded-xl shrink-0 h-fit border border-emerald-100">
                      {ann.icon}
                    </span>
                    <div>
                      <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">{ann.author}</p>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-tight">{ann.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1.5 font-medium">{ann.content}</p>
                      <span className="text-[10px] text-slate-400 block mt-2 font-semibold">Diterbitkan: {new Date(ann.date).toLocaleDateString("id-ID")}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Module: JADWAL */}
        {activeModule === "jadwal" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Kalender Pelajaran Mingguan</h3>
                <p className="text-xs text-slate-500 font-medium">Jadwal Kelas {profile.classGroup} semester ganjil</p>
              </div>
              <button 
                onClick={() => alert("Dokumen Jadwal PDF berhasil digenerate dan dikirim ke download manager.")}
                className="bg-emerald-800 hover:bg-emerald-900 text-white border border-emerald-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm hover:-translate-y-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Cetak &amp; Unduh Jadwal.pdf</span>
              </button>
            </div>

            {/* Desktop View: Grid (Hidden on Mobile) */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-500">
                <div className="p-4">WAKTU</div>
                <div className="p-4 border-l border-slate-200">SENIN</div>
                <div className="p-4 border-l border-slate-200">SELASA</div>
                <div className="p-4 border-l border-slate-200 bg-emerald-50 text-emerald-900 font-extrabold">RABU</div>
                <div className="p-4 border-l border-slate-200">KAMIS</div>
                <div className="p-4 border-l border-slate-200">JUMAT</div>
                <div className="p-4 border-l border-slate-200 bg-amber-50/50 text-amber-950 font-bold">SABTU</div>
              </div>
              
              <div className="divide-y divide-slate-100">
                {(() => {
                  const defaultSlots = ["07:30 - 09:00", "09:15 - 10:45", "11:15 - 12:45"];
                  
                  // Get active student schedules (including class-specific breaks and general breaks)
                  const mySchedules = schedules.filter((sch) => {
                    const specialMeta = getSpecialSessionMeta(sch.subjectId);
                    if (specialMeta) {
                      if (specialMeta.classGroup === "Semua Kelas") return true;
                      return specialMeta.classGroup === profile.classGroup;
                    }
                    const sub = subjects.find(s => s.id === sch.subjectId);
                    return sub && sub.classGroup === profile.classGroup;
                  });

                  const uniqueActiveSlots = Array.from(new Set(mySchedules.map(s => s.timeSlot))).sort((a, b) => a.localeCompare(b));
                  
                  if (uniqueActiveSlots.length === 0) {
                    return (
                      <div className="p-12 text-center text-slate-400 italic text-xs flex flex-col items-center justify-center min-h-[200px]">
                        <span className="material-symbols-outlined text-slate-350 text-4xl mb-2 text-slate-400">calendar_today</span>
                        <span className="font-semibold text-slate-600 block text-sm">Belum Ada Jadwal Pelajaran Aktif</span>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                          Tidak ada jadwal pelajaran atau waktu istirahat yang diplot untuk kelas Anda ({profile.classGroup || "Tidak Terdaftar"}). Semua sesi yang dikonfigurasi melalui Administrator akan tayang otomatis di sini secara real-time.
                        </p>
                      </div>
                    );
                  }

                  return uniqueActiveSlots.map((slot) => {
                    return (
                      <div key={slot} className="grid grid-cols-7 text-xs text-slate-600 items-stretch">
                        <div className="p-4 font-sans text-center font-bold bg-slate-50 flex items-center justify-center border-r border-slate-100">{slot}</div>
                        {(["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"] as const).map((day) => {
                          const sch = mySchedules.find(s => s.day === day && s.timeSlot === slot);
                          if (!sch) {
                            return <div key={day} className="p-2 border-l border-slate-200 bg-slate-50/10 flex items-center justify-center text-slate-350 italic text-[10px]">Kosong</div>;
                          }
                          
                          const specialMeta = getSpecialSessionMeta(sch.subjectId);
                          if (specialMeta) {
                            const iconName = specialMeta.icon;
                            // Add extra custom classes to fit inside the cell nicely
                            return (
                              <div key={day} className={`p-2 border-l border-slate-200 flex items-center justify-center ${specialMeta.cardStyle}`}>
                                <div className="text-center flex flex-col justify-center items-center w-full h-full min-h-[60px]">
                                  <span className="material-symbols-outlined text-[15px]">{iconName}</span>
                                  <span className="font-extrabold text-[10px] leading-tight block mt-0.5 uppercase">{specialMeta.label}</span>
                                  <span className="text-[9px] font-bold mt-0.5 truncate max-w-full opacity-80">{sch.room || "Selasar Sekolah"}</span>
                                </div>
                              </div>
                            );
                          }

                          const sub = subjects.find(s => s.id === sch.subjectId);
                          return (
                            <div key={day} className={`p-2 border-l border-slate-200 ${day === "RABU" ? "bg-emerald-50/30" : ""} ${day === "SABTU" ? "bg-amber-50/10" : ""}`}>
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full justify-between min-h-[60px]">
                                <span className="font-bold text-emerald-950 leading-tight block">{sub ? sub.name : "Subjek"}</span>
                                <span className="text-[10px] text-slate-550 mt-1 block font-semibold truncate">
                                  {sub ? sub.teacherName.split(",")[0] : "Guru"} • {sch.room}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Mobile View: Beautiful Day Tab Selector & List (Displays on Mobile, avoids overlapping completely) */}
            <MobileStudentSchedule schedules={schedules} subjects={subjects} studentClassGroup={profile.classGroup} />
          </motion.div>
        )}

        {/* Module: PRESENSI */}
        {activeModule === "presensi" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <motion.div 
                whileHover={{ y: -3 }}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Hadir</p>
                  <h3 className="text-3xl font-black text-emerald-900 mt-1 tracking-tight">{attendedSessions} Sesi</h3>
                </div>
                <div className="mt-4 text-emerald-800 text-xs font-bold flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                  <span className="material-symbols-outlined text-[15px] text-emerald-700">check_circle</span>
                  <span>Tepat waktu / Terverifikasi</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -3 }}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Sakit (S)</p>
                  <h3 className="text-3xl font-black text-amber-900 mt-1 tracking-tight">{sickSessions} Hari</h3>
                </div>
                <div className="mt-4 text-amber-800 text-xs font-bold flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                  <span className="material-symbols-outlined text-[15px] text-amber-700">medical_services</span>
                  <span>Surat Dokter Terunggah</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -3 }}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Izin (I)</p>
                  <h3 className="text-3xl font-black text-blue-900 mt-1 tracking-tight">{permSessions} Hari</h3>
                </div>
                <div className="mt-4 text-blue-800 text-xs font-bold flex items-center gap-1.5 bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100/60">
                  <span className="material-symbols-outlined text-[15px] text-blue-700">info</span>
                  <span>Disertai Surat Izin Resmi</span>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -3 }}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-l-rose-500"
              >
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Alfa (Tanpa Keterangan)</p>
                  <h3 className="text-3xl font-black text-rose-900 mt-1 tracking-tight">{absentSessions} Hari</h3>
                </div>
                <div className="mt-4 text-rose-800 text-xs font-bold flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                  <span className="material-symbols-outlined text-[15px] text-rose-700">cancel</span>
                  <span>Catatan Presensi Luar Biasa</span>
                </div>
              </motion.div>
            </div>

            {/* Daily logs listing */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-800">Scan Log Presensi Harian Mata Pelajaran</h4>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Semester Ganjil
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-505 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Tanggal</th>
                      <th className="px-6 py-4">Mata Pelajaran</th>
                      <th className="px-6 py-4">Waktu Presensi</th>
                      <th className="px-6 py-4">Status Kehadiran</th>
                      <th className="px-6 py-4">Catatan / Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {(() => {
                      // Let's combine myAttendance and any static demo entries for consistent aesthetic fullness
                      const dynamicRecords = [...myAttendance];
                      
                      // If empty or small, make sure we have a nice fallback or demo seeds
                      if (dynamicRecords.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                              Belum ada catatan presensi pelajaran yang tersedia untuk Anda.
                            </td>
                          </tr>
                        );
                      }

                      return dynamicRecords.map((record) => {
                        const dateObj = new Date(record.date);
                        const formattedDate = !isNaN(dateObj.getTime())
                          ? dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                          : record.date;
                        
                        const sub = subjects.find(s => s.id === record.subjectId);
                        const subjectName = sub ? sub.name : "Studi Umum";

                        let badgeStyle = "bg-emerald-50 text-emerald-900 border border-emerald-200";
                        let statusText = "HADIR";
                        let nominalTime = "07:30 WIB";

                        if (record.status === "H") {
                          badgeStyle = "bg-emerald-50 text-emerald-800 border border-emerald-200";
                          statusText = "HADIR";
                          nominalTime = "07:22 WIB";
                        } else if (record.status === "I") {
                          badgeStyle = "bg-sky-50 text-sky-950 border border-sky-200";
                          statusText = "IZIN";
                          nominalTime = "Disetujui Guru";
                        } else if (record.status === "S") {
                          badgeStyle = "bg-amber-50 text-amber-950 border border-amber-200";
                          statusText = "SAKIT";
                          nominalTime = "Surat Dokter";
                        } else if (record.status === "A") {
                          badgeStyle = "bg-rose-50 text-rose-950 border border-rose-200";
                          statusText = "ALFA (ALPA)";
                          nominalTime = "-";
                        }

                        return (
                          <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">{formattedDate}</td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">{subjectName}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{sub ? sub.code : "GEN-01"}</p>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600">{nominalTime}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${badgeStyle}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                              {record.note || "-"}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Module: NILAI */}
        {activeModule === "nilai" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Header with Semester Context */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-teal-950 p-6 rounded-2xl text-white shadow-md border border-emerald-800">
              <div>
                <h3 className="text-xl font-black tracking-tight">IP & Laporan Hasil Akhir Belajar</h3>
                <p className="text-xs text-emerald-200 mt-1 font-medium">Tahun Ajaran {academicYear} • Semester {academicSemester === "1" ? "Ganjil (1)" : "Genap (2)"}</p>
              </div>
              <span className="text-xs font-black bg-[#acf59a] text-slate-900 px-4 py-2 rounded-xl uppercase tracking-wider self-start sm:self-auto shadow-sm">
                Semester Aktif: {academicSemester === "1" ? "Ganjil" : "Genap"}
              </span>
            </div>

            {/* GPA insight (IP out of 100!) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Scale of 100 IP meter */}
              <motion.div 
                whileHover={{ scale: 1.01 }}
                className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">INDEKS PRESTASI (IP) BELAJAR</p>
                  {(() => {
                    // Filter grade records matching student id and current semester
                    const filteredRecords = gradeRecords.filter(g => g.nisn === profile.id && (!g.semester || g.semester === academicSemester));
                    let overallAvg = 88.5; // robust default fallback
                    if (filteredRecords.length > 0) {
                      const sum = filteredRecords.reduce((acc, g) => {
                        const final = (g.assignmentScore * 0.4) + (g.utsScore * 0.25) + (g.uasScore * 0.35);
                        return acc + final;
                      }, 0);
                      overallAvg = parseFloat((sum / filteredRecords.length).toFixed(1));
                    }
                    
                    let predikat = "Memuaskan";
                    let accentColor = "text-[#0f766e] bg-emerald-50 border-emerald-100";
                    if (overallAvg >= 90) {
                      predikat = "Sangat Memuaskan (Istimewa)";
                      accentColor = "text-purple-950 bg-purple-50 border-purple-100";
                    } else if (overallAvg >= 80) {
                      predikat = "Sangat Baik (A)";
                      accentColor = "text-blue-950 bg-blue-50 border-blue-100";
                    } else if (overallAvg >= 70) {
                      predikat = "Baik (B)";
                      accentColor = "text-teal-950 bg-teal-50 border-teal-100";
                    }

                    return (
                      <>
                        <div className="flex items-baseline gap-1.5 mt-2">
                          <span className="text-5xl font-black text-slate-900 tracking-tight">{overallAvg.toFixed(1)}</span>
                          <span className="text-slate-500 font-bold">/ 100.0</span>
                        </div>
                        <div className="mt-4">
                          <p className="text-[10px] font-bold text-slate-400 tracking-wider">PREDIKAT AKADEMIK</p>
                          <div className={`mt-1 flex items-center gap-1.5 font-extrabold text-xs px-2.5 py-2 rounded-lg border uppercase ${accentColor}`}>
                            <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                            <span>{predikat}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>

              {/* Wali Kelas comment */}
              <div className="lg:col-span-2 bg-[#0d2a23] text-emerald-50 p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden border border-emerald-800">
                <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-r from-purple-500 to-pink-500"></div>
                <div className="relative z-10 space-y-2">
                  <h4 className="font-extrabold text-sm text-[#acf59a] tracking-wider uppercase">Catatan & Umpan Balik Wali Kelas</h4>
                  <p className="font-serif italic leading-relaxed text-[13.5px] opacity-95">
                    "Ananda {profile.name} menunjukkan motivasi belajar yang luar biasa di Kelas {profile.classGroup}. Penalarannya, kedisiplinan mengumpulkan tugas e-learning, serta kesopanan kepada guru sangat patut dicontoh. Di Semester {academicSemester === "1" ? "Ganjil" : "Genap"} ini, pertahankan prestasi akademis untuk mendaftar seleksi perguruan tinggi negeri jalur raport!"
                  </p>
                </div>
                <p className="text-xs text-emerald-300 italic font-semibold mt-4">— Drs. H. Mulyadi (Wali Kelas Hari Ini)</p>
              </div>
            </div>

            {/* Simplistic Grades Table Overview */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4.5 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informasi Pokok Mata Pelajaran &amp; Nilai</h4>
                <p className="text-[11px] font-bold text-[#0f766e]">Skala Maksimal: 100</p>
              </div>
              <div className="divide-y divide-slate-100">
                {(() => {
                  const filteredGrades = gradeRecords.filter(g => g.nisn === profile.id && (!g.semester || g.semester === academicSemester));
                  
                  if (filteredGrades.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-400 italic text-xs py-10">
                        Belum ada laporan nilai untuk semester ini.
                      </div>
                    );
                  }

                  return filteredGrades.map((grade) => {
                    const finalScore = (grade.assignmentScore * 0.4) + (grade.utsScore * 0.25) + (grade.uasScore * 0.35);
                    const sub = subjects.find(s => s.id === grade.subjectId);
                    const subjectName = () => {
                      if (grade.subjectId === "sub-1") return "Matematika Peminatan";
                      if (grade.subjectId === "sub-2") return "Bahasa Inggris Wajib";
                      if (grade.subjectId === "sub-3") return "Fisika Modern";
                      return sub ? sub.name : "Mata Pelajaran Umum";
                    };

                    let scoreBadge = "text-emerald-700 bg-emerald-50 border-emerald-100";
                    if (finalScore >= 90) {
                      scoreBadge = "text-purple-750 bg-purple-50 border-purple-100";
                    } else if (finalScore >= 80) {
                      scoreBadge = "text-blue-750 bg-blue-50 border-blue-100";
                    }

                    return (
                      <div key={grade.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-extrabold text-[#002e2c] text-[14.5px] leading-tight">{subjectName()}</p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">KODE: {sub ? sub.code : "GEN-01"} • Pengampu: {sub ? sub.teacherName : "Drs. Ahmad Fauzi"}</p>
                        </div>
                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-widest">NILAI AKHIR</span>
                            <span className="text-lg font-black font-mono text-slate-800">{finalScore.toFixed(1)}</span>
                          </div>
                          <div className={`px-3 py-1.5 rounded-xl border font-black text-sm uppercase text-center min-w-[50px] ${scoreBadge}`}>
                            {grade.grade}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Interactive Student Feedback Section */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-800 font-black">forum</span>
                Umpan Balik &amp; Tanggapan Siswa
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl font-medium">
                Punya tanggapan atau ingin mengajukan bimbingan akademik dengan wali kelas Drs. H. Mulyadi? Kirim pesan, umpan balik atau tanggapan belajar Anda di bawah ini:
              </p>
              <StudentFeedbackForm />
            </div>
          </motion.div>
        )}

        {/* Module: MATERI & TUGAS (E-LEARNING) */}
        {activeModule === "materi_tugas" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Header banner */}
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-6 rounded-3xl text-white shadow-md border border-emerald-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
              <div>
                <span className="text-[10px] bg-white/20 text-sky-100 font-extrabold uppercase px-2.5 py-1 rounded-full border border-white/10 tracking-widest">Portal E-Learning MA Al-Ma'sum</span>
                <h3 className="text-2xl font-black mt-2 tracking-tight">Materi Belajar &amp; Tugas</h3>
                <p className="text-xs text-sky-100 mt-1 font-medium">Unduh bahan ajar, kumpulkan tugas terstruktur, dan pantau umpan balik akademik secara real-time.</p>
              </div>
              <div className="text-right text-xs bg-black/20 p-3 rounded-2xl border border-white/5 select-none">
                <span className="font-bold text-sky-200">SEMESTER AKTIF: </span>
                <span className="font-black text-amber-300">{academicSemester === "1" ? "1 (GANJIL)" : "2 (GENAP)"}</span>
              </div>
            </div>

            {/* Main Interactive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left hand Column: Materi Pembelajaran (Modules) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-sky-700 bg-sky-50 p-1.5 rounded-xl border border-sky-100">cloud_download</span>
                    Modul &amp; Bahan Belajar Digital
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-5">
                    Modul pelajaran dibagikan oleh guru untuk didownload dan dipelajari secara mandiri.
                  </p>

                  <div className="space-y-4">
                    {(() => {
                      const filteredMaterials = (materials || []).filter(
                        m => m.classGroup === profile.classGroup && (!m.semester || m.semester === academicSemester)
                      );

                      if (filteredMaterials.length === 0) {
                        return (
                          <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                            <span className="material-symbols-outlined text-slate-300 text-3xl">menu_book</span>
                            <p className="text-xs text-slate-400 mt-2 font-medium">Belum ada modul dibagikan untuk semester ini.</p>
                          </div>
                        );
                      }

                      return filteredMaterials.map((mat) => (
                        <MaterialItemCard key={mat.id} mat={mat} subjects={subjects} />
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Right hand Column: Tugas Terstruktur & submissions */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#0f766e] bg-emerald-50 p-1.5 rounded-xl border border-emerald-100">assignment_turned_in</span>
                    Tugas &amp; Kuis Terstruktur 
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Klik tugas aktif di bawah untuk mengupload jawaban atau meninjau feedback penilaian guru.
                  </p>

                  <div className="space-y-4">
                    {(() => {
                      const filteredAssignments = (assignments || []).filter(
                        a => a.classGroup === profile.classGroup && (!a.semester || a.semester === academicSemester)
                      );

                      if (filteredAssignments.length === 0) {
                        return (
                          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                            <span className="material-symbols-outlined text-slate-300 text-4xl">task_alt</span>
                            <p className="text-xs text-slate-400 mt-2 font-medium">Bagus! Tidak ada tugas terstruktur semester ini.</p>
                          </div>
                        );
                      }

                      return filteredAssignments.map((asg) => {
                        const mySubm = (submissions || []).find(
                          s => s.assignmentId === asg.id && s.studentId === profile.id
                        );

                        return (
                          <AssignmentItemCard
                            key={asg.id}
                            asg={asg}
                            mySubm={mySubm}
                            profile={profile}
                            onAddSubmission={onAddSubmission}
                            subjects={subjects}
                          />
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* Module: KUIS */}
        {activeModule === "kuis" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* Active Quiz Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myQuizzes.map((quiz) => {
                const isCompleted = typeof quiz.studentScore !== "undefined";
                return (
                  <motion.div 
                    whileHover={{ y: -4 }}
                    key={quiz.id} 
                    className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all duration-300 ${
                      isCompleted 
                        ? "border-slate-200 opacity-95 hover:shadow-md" 
                        : "border-slate-200 border-t-4 border-t-emerald-800 hover:shadow-lg hover:border-emerald-700/25"
                    }`}
                  >
                    <div className="p-6 flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase tracking-wider">
                          {quiz.subject}
                        </span>
                        {isCompleted ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-bold text-xs uppercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            Tuntas
                          </span>
                        ) : (
                          <QuizTimerCountdown quiz={quiz} />
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 text-base leading-snug">{quiz.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{quiz.questionsCount} Soal Pilihan Ganda • {quiz.durationMinutes} menit ujian</p>
                      </div>

                      <div className="space-y-2 text-xs text-slate-500 pt-2 border-t border-slate-50">
                        {isCompleted ? (
                          <>
                            <div className="flex justify-between">
                              <span>Skor Diperoleh:</span>
                              <span className="font-bold text-emerald-800 text-sm font-mono">{quiz.studentScore}/100</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Selesai Pada:</span>
                              <span>{quiz.completedAt ? new Date(quiz.completedAt).toLocaleDateString("id-ID") : "05 Juni 2026"}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span>Batas Pengerjaan:</span>
                              <span className="font-medium text-slate-700">{new Date(quiz.dueDate).toLocaleDateString("id-ID")}, 23:59</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status Pengerjaan:</span>
                              <span className="text-rose-705 font-bold">BELUM DIKERJAKAN</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                      {isCompleted ? (
                        <button 
                          onClick={() => alert(`Anda meraih skor ${quiz.studentScore}/100 pada kuis ini. Modul ulasan jawaban sedang diproduksi oleh dewan kurikulum.`)}
                          className="px-4 py-2 border border-emerald-700 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          Tinjau Hasil &amp; Ulasan
                        </button>
                      ) : (
                        <button 
                          disabled={isQuizExpired(quiz)}
                          onClick={() => startQuiz(quiz)}
                          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.98] ${
                            isQuizExpired(quiz)
                              ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                              : "bg-emerald-800 hover:bg-emerald-900 text-white"
                          }`}
                        >
                          {isQuizExpired(quiz) ? "Waktu Aktif Habis" : "Kerjakan Sekarang"}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Module: PENGATURAN */}
        {activeModule === "pengaturan" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8 max-w-4xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Profile Bio Details Form */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800">Modifikasi Informasi Biodata Siswa</h3>
                </div>
                <form onSubmit={handleProfileSave} className="p-6 space-y-4">
                  {/* Photo Edit Segment */}
                  <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <img 
                      src={avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256"} 
                      alt="Avatar Preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-emerald-800"
                    />
                    <div className="flex-grow space-y-1 w-full">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubah Foto Profil</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoUpload}
                          className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="Atau tempel tautan URL foto..."
                          className="flex-grow text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-emerald-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama Lengkap</label>
                    <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium text-sm outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/10 transition-all" value={name} onChange={(e) => setName(e.target.value)} type="text" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Institusi Resmi</label>
                    <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium text-sm outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/10 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} type="text" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nomor Telepon Seluler</label>
                      <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/10 outline-none transition-all" value={phone} onChange={(e) => setPhone(e.target.value)} type="text" placeholder="+62..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Kelas Akademik</label>
                      <input disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-500 text-sm cursor-not-allowed" value={profile.classGroup} type="text" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Biografi Minat Akademik</label>
                    <textarea rows={3} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/10 outline-none transition-all" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tuliskan aspirasi belajarmu..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Alamat Domisili Rumah</label>
                    <textarea rows={2} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/10 outline-none transition-all" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jalan, No Rumah, Kelurahan, Kec..." />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm">
                      Perbarui Data Profil
                    </button>
                  </div>
                </form>
              </div>

              {/* Security & Display Settings Side Panel */}
              <div className="lg:col-span-4 space-y-6 flex flex-col">
                {/* Security change password */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 flex-1">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <span className="material-symbols-outlined text-emerald-800">security</span>
                    <h4>Ganti Sandi</h4>
                  </div>
                  <form onSubmit={handlePasswordSave} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-0.5">Sandi Lama</label>
                      <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} type="password" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-0.5">Sandi Baru</label>
                      <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="Min. 8 karakter" />
                    </div>
                    <button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-2.5 rounded-lg transition-all active:scale-[0.98]">
                      Save Password
                    </button>
                  </form>
                </div>

                {/* Display formats */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <span className="material-symbols-outlined text-emerald-800">palette</span>
                    <h4>Rupa Tampilan</h4>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs text-slate-400">Preferensi Rupa Antarmuka SIALMA</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setTheme("light")}
                        className={`p-2 rounded-lg border text-center font-bold text-xs flex flex-col items-center gap-1.5 ${
                          theme === "light" ? "border-emerald-800 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-500"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">light_mode</span>
                        <span>Terang</span>
                      </button>
                      <button 
                        onClick={() => setTheme("dark")}
                        className={`p-2 rounded-lg border text-center font-bold text-xs flex flex-col items-center gap-1.5 ${
                          theme === "dark" ? "border-emerald-800 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-500"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">dark_mode</span>
                        <span>Gelap</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </div>

      {/* Footer Element */}
      <footer className="w-full py-6 mt-auto bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center px-8 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">© 2026 MA AL-MA’SUM Malausma — Sistem Informasi Akademik SIALMA</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#help" onClick={(e) => { e.preventDefault(); alert("Silakan email helpdesk kami di support@ma-alsum.edu atau langsung hubungi staf BK Tata Usaha."); }} className="hover:text-emerald-800 transition-colors">Help Desk SIALMA</a>
          <span>•</span>
          <a href="#tos" onClick={(e) => { e.preventDefault(); alert("SIALMA tunduk pada aturan kedisplinan akademik sekolah."); }} className="hover:text-emerald-800 transition-colors">EULA Syarat</a>
          <span>•</span>
          <a href="#help" onClick={(e) => { e.preventDefault(); alert("Dokumen Panduan Penggunaan Siswa SIALMA sedang diunduh..."); }} className="hover:text-emerald-800 transition-colors">Buku Panduan PDF</a>
        </div>
      </footer>

      {/* Full-screen Interactive Quiz Overlay Page */}
      {activeQuiz && (
        <div className="fixed inset-0 bg-slate-900/95 z-[150] flex flex-col animate-fadeIn">
          {/* Quiz Header Bar */}
          <header className="h-16 bg-slate-800 border-b border-slate-700 px-8 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={closeQuiz}
                className="p-1.5 hover:bg-slate-700 rounded-full transition-colors flex items-center text-slate-300 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{activeQuiz.subject}</span>
                <h3 className="font-bold text-sm tracking-tight">{activeQuiz.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="px-4 py-1.5 bg-rose-500/20 text-rose-300 font-mono text-sm font-bold rounded-lg flex items-center gap-1.5 ring-1 ring-rose-500/30">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                <span>{formatTime(quizTimeRemaining)}</span>
              </div>
              <button 
                onClick={handleQuizSubmit}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md active:scale-95"
              >
                Kirim Pembahasan
              </button>
            </div>
          </header>

          <div className="flex-grow flex overflow-hidden">
            {/* Sidebar question nav */}
            <aside className="w-64 border-r border-slate-700 bg-slate-800 p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between select-none">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4">Navigasi Butir Soal</p>
                <div className="grid grid-cols-4 gap-2">
                  {activeQuiz.questions.map((q, idx) => {
                    const isAnswered = typeof quizAnswers[q.id] !== "undefined";
                    const isCurrent = idx === currentQuestionIndex;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-10 h-10 rounded-lg border text-sm font-bold transition-all ${
                          isCurrent
                            ? "bg-emerald-700 border-emerald-600 text-white shadow-md ring-2 ring-emerald-500/50"
                            : isAnswered
                            ? "bg-slate-700 border-slate-600 text-emerald-300 font-bold"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-700"></div>
                  <span className="text-slate-300 font-medium">Sedang Aktif / Terjawab</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border border-slate-700 bg-slate-800"></div>
                  <span className="text-slate-400">Belum Terjawab</span>
                </div>
              </div>
            </aside>

            {/* Main Question view */}
            <div className="flex-1 overflow-y-auto p-12 bg-slate-900 text-slate-100 flex items-center justify-center">
              <div className="w-full max-w-2xl space-y-6">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">
                  {/* Current question progression */}
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-2">
                    PERTANYAAN {currentQuestionIndex + 1} DARI {activeQuiz.questions.length}
                  </span>
                  <h4 className="text-lg font-bold leading-normal mb-8 text-slate-50">
                    {activeQuiz.questions[currentQuestionIndex].questionText}
                  </h4>

                  <div className="space-y-3">
                    {activeQuiz.questions[currentQuestionIndex].options.map((opt, optIdx) => {
                      const questionId = activeQuiz.questions[currentQuestionIndex].id;
                      const isSelected = quizAnswers[questionId] === optIdx;
                      return (
                        <label 
                          key={optIdx}
                          className={`w-full flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all select-none ${
                            isSelected
                              ? "bg-emerald-905 bg-white/5 border-emerald-600 text-emerald-200"
                              : "border-slate-700/60 bg-transparent text-slate-350 hover:border-slate-500 hover:bg-white/[0.02]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${questionId}`}
                            checked={isSelected}
                            onChange={() => handleQuizAnswer(questionId, optIdx)}
                            className="form-radio h-5 w-5 text-emerald-700 border-slate-600 focus:ring-emerald-600"
                          />
                          <span className="text-sm font-medium">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2 font-bold"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span>Kembali</span>
                  </button>

                  {currentQuestionIndex === activeQuiz.questions.length - 1 ? (
                    <button
                      onClick={handleQuizSubmit}
                      className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 rounded-xl text-white font-bold transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                    >
                      <span>Selesai &amp; Kirim Kuis</span>
                      <span className="material-symbols-outlined">check_circle</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQuestionIndex((prev) => Math.min(activeQuiz.questions.length - 1, prev + 1))}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all inline-flex items-center gap-2 font-bold font-sans"
                    >
                      <span>Selanjutnya</span>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
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
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
