import React, { useState, useEffect } from "react";
import { UserProfile, Announcement, SubjectItem, QuizItem, StudentItem, TeacherItem, AttendanceRecord, GradeRecord, ScheduleItem, LearningMaterial, Assignment, AssignmentSubmission } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { getSpecialSessionMeta } from "./AdminDashboard";

interface GuruDashboardProps {
  profile: UserProfile;
  activeModule: string;
  announcements: Announcement[];
  subjects: SubjectItem[];
  classGroups?: string[];
  quizzes: QuizItem[];
  students: StudentItem[];
  attendanceRecords: AttendanceRecord[];
  gradeRecords: GradeRecord[];
  schedules: ScheduleItem[];
  materials?: LearningMaterial[];
  assignments?: Assignment[];
  submissions?: AssignmentSubmission[];
  onAddMaterial?: (newMat: LearningMaterial) => void;
  onDeleteMaterial?: (id: string) => void;
  onAddAssignment?: (newAsg: Assignment) => void;
  onGradeSubmission?: (submId: string, score: number, feedback: string) => void;
  onSaveAttendance: (records: AttendanceRecord[]) => void;
  onSaveGrades: (records: GradeRecord[]) => void;
  onAddNewQuiz: (quiz: QuizItem) => void;
  onSetQuizzes?: (updatedQuizzes: QuizItem[]) => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onModuleChange?: (module: string) => void;
  academicYear?: string;
  academicSemester?: string;
  activeCurriculum?: string;
  theme?: "light" | "dark";
  setTheme?: (theme: "light" | "dark") => void;
}

// Beautiful Mobile Teacher Schedule - Solves overlap overlap issues completely
const MobileTeacherSchedule = ({
  schedules,
  subjects,
  profile,
  setSelectedClass,
  setSelectedSubjectId,
  onModuleChange
}: {
  schedules: ScheduleItem[];
  subjects: SubjectItem[];
  profile: UserProfile;
  setSelectedClass: (cls: string) => void;
  setSelectedSubjectId: (id: string) => void;
  onModuleChange?: (module: string) => void;
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

  const teacherSchedules = schedules.filter((sch) => {
    if (sch.day !== selectedDay) return false;
    const specialMeta = getSpecialSessionMeta(sch.subjectId);
    if (specialMeta) return true;
    const sub = subjects.find((s) => s.id === sch.subjectId);
    return sub && sub.teacherId === profile.id;
  });

  return (
    <div className="md:hidden space-y-4 font-sans">
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
                  : "bg-white text-slate-655 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* List of teaching sessions for the selected day */}
      <div className="space-y-3">
        {teacherSchedules.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 italic text-xs">
            Tidak ada jadwal mengajar pada hari {selectedDay}.
          </div>
        ) : (
          teacherSchedules
            .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
            .map(sch => {
              const specialMeta = getSpecialSessionMeta(sch.subjectId);
              const sub = specialMeta ? null : subjects.find(s => s.id === sch.subjectId);
              const displayName = specialMeta ? specialMeta.label : (sub ? sub.name : "Mata Pelajaran");
              const displayClass = specialMeta ? specialMeta.classGroup : (sub ? sub.classGroup : "Kelas");
              const displayRoom = sch.room || (specialMeta ? "Selasar / Sekolah" : "Ruang Kelas");
              const iconName = specialMeta ? specialMeta.icon : "meeting_room";
              
              const cardBg = specialMeta ? specialMeta.cardStyle : "bg-white active:bg-slate-50 border-slate-200/80 hover:border-emerald-700 cursor-pointer";
              const textTheme = specialMeta ? specialMeta.themeColor : "text-[#002e2c]";
              const badgeStyle = specialMeta ? specialMeta.badgeStyle : "bg-emerald-50 text-emerald-800 border-emerald-150";

              return (
                <div 
                  key={sch.id} 
                  onClick={() => {
                    if (sub) {
                      setSelectedClass(sub.classGroup);
                      setSelectedSubjectId(sub.id);
                      if (onModuleChange) onModuleChange("presensi");
                    }
                  }}
                  className={`border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 transition-all ${
                    specialMeta ? `${cardBg} cursor-default` : cardBg
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <p className={`font-extrabold text-sm truncate leading-tight flex items-center gap-1.5 ${textTheme}`}>
                      {specialMeta && <span className="material-symbols-outlined text-[16px]">{iconName}</span>}
                      {displayName}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold p-1 px-2.5 rounded-md ${specialMeta ? badgeStyle : "bg-emerald-50 text-emerald-855"}`}>
                        {displayClass}
                      </span>
                      <span className="text-[10px] text-slate-450 font-mono font-bold bg-slate-100 p-1 px-2 rounded-md">
                        {displayRoom}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-black tracking-widest p-1 px-2.5 rounded-lg border font-sans ${badgeStyle}`}>
                      {sch.timeSlot}
                    </span>
                    {!specialMeta && (
                      <span className="text-[9px] text-emerald-700 font-extrabold block mt-2 hover:underline">
                        Input Presensi &rarr;
                      </span>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};

// Beautiful, isolated Material Upload Form (E-Learning) to respect the Rules of Hooks perfectly
interface MaterialUploadFormProps {
  allowedSubjects: SubjectItem[];
  allowedClasses: string[];
  profileName: string;
  academicSemester: string;
  onAddMaterial?: (newMat: LearningMaterial) => void;
}
const MaterialUploadForm = ({
  allowedSubjects,
  allowedClasses,
  profileName,
  academicSemester,
  onAddMaterial
}: MaterialUploadFormProps) => {
  const [modTitle, setModTitle] = useState("");
  const [modSub, setModSub] = useState(
    allowedSubjects[0] ? translateSubjectCodeToName(allowedSubjects[0].name) : "Matematika Peminatan"
  );
  const [modClass, setModClass] = useState(allowedClasses[0] || "XII - IPA 1");
  const [fileName, setFileName] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePubMod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTitle.trim() || !fileName.trim()) {
      alert("Harap lengkapi judul modul dan nama file modul!");
      return;
    }

    const matchingSubject = allowedSubjects.find(
      (sub) =>
        translateSubjectCodeToName(sub.name) === modSub &&
        normalizeClassGroup(sub.classGroup) === normalizeClassGroup(modClass)
    ) || allowedSubjects.find((sub) => translateSubjectCodeToName(sub.name) === modSub) || allowedSubjects[0];

    if (onAddMaterial) {
      onAddMaterial({
        id: "mat-" + Date.now(),
        title: modTitle,
        description: "Modul diktat bahan ajar SIALMA",
        subjectId: matchingSubject ? matchingSubject.id : "sub-1",
        classGroup: modClass,
        authorName: profileName,
        fileName: fileName.endsWith(".pdf") ? fileName : fileName + ".pdf",
        semester: academicSemester,
        uploadedAt: new Date().toISOString()
      });
    }

    setModTitle("");
    setFileName("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
      <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
        <span className="material-symbols-outlined text-emerald-800 bg-emerald-50 p-1 rounded-lg">library_books</span>
        Publikasikan Modul Pelajaran Baru
      </h4>
      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
        Siswa pada kelas sasaran akan dapat mengunduh materi ini secara langsung di portal e-learning mereka.
      </p>

      <form onSubmit={handlePubMod} className="space-y-4 pt-1">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase">Judul Modul:</label>
          <input
            type="text"
            required
            value={modTitle}
            onChange={(e) => setModTitle(e.target.value)}
            placeholder="Contoh: Modul Limit Trigonometri Dasar"
            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-semibold"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Mata Pelajaran:</label>
            <select
              value={modSub}
              onChange={(e) => setModSub(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:border-emerald-500 outline-none"
            >
              {Array.from(new Set(allowedSubjects.map((s) => translateSubjectCodeToName(s.name)))).map((translatedName) => (
                <option key={translatedName} value={translatedName}>{translatedName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Target Rombel:</label>
            <select
              value={modClass}
              onChange={(e) => setModClass(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:border-emerald-500 outline-none"
            >
              {allowedClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase block">Berkas Pendukung (.pdf):</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Ketikkan atau pilih nama berkas (misal: modul_1.pdf)"
              className="flex-1 text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-mono"
            />
            <label className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs px-4 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all select-none shrink-0">
              <span className="material-symbols-outlined text-sm font-black text-slate-600">upload_file</span>
              <span>Pilih File</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) {
                    setFileName(selectedFile.name);
                  }
                }}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {success && (
            <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 animate-pulse">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Modul dipublikasikan!
            </span>
          )}
          <button
            type="submit"
            className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs px-5 py-3 rounded-xl border border-emerald-700 transition-all cursor-pointer ml-auto flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm font-black">publish</span>
            Rilis Modul Ajar
          </button>
        </div>
      </form>
    </div>
  );
};

// Beautiful, isolated Assignment Publish Form (E-Learning) to respect the Rules of Hooks perfectly
interface AssignmentPublishFormProps {
  allowedSubjects: SubjectItem[];
  allowedClasses: string[];
  academicSemester: string;
  onAddAssignment?: (newAsg: Assignment) => void;
}
const AssignmentPublishForm = ({
  allowedSubjects,
  allowedClasses,
  academicSemester,
  onAddAssignment
}: AssignmentPublishFormProps) => {
  const [asgTitle, setAsgTitle] = useState("");
  const [asgDesc, setAsgDesc] = useState("");
  const [asgSub, setAsgSub] = useState(
    allowedSubjects[0] ? translateSubjectCodeToName(allowedSubjects[0].name) : "Matematika Peminatan"
  );
  const [asgClass, setAsgClass] = useState(allowedClasses[0] || "XII - IPA 1");
  const [asgDue, setAsgDue] = useState("2026-06-15");
  const [success, setSuccess] = useState(false);

  const handlePubAsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle.trim() || !asgDesc.trim()) {
      alert("Harap lengkapi judul dan petunjuk pengerjaan tugas akademik!");
      return;
    }

    const matchingSubject = allowedSubjects.find(
      (sub) =>
        translateSubjectCodeToName(sub.name) === asgSub &&
        normalizeClassGroup(sub.classGroup) === normalizeClassGroup(asgClass)
    ) || allowedSubjects.find((sub) => translateSubjectCodeToName(sub.name) === asgSub) || allowedSubjects[0];

    if (onAddAssignment) {
      onAddAssignment({
        id: "asg-" + Date.now(),
        title: asgTitle,
        description: asgDesc,
        subjectId: matchingSubject ? matchingSubject.id : "sub-1",
        classGroup: asgClass,
        dueDate: asgDue,
        semester: academicSemester,
        uploadedAt: new Date().toISOString()
      });
    }

    setAsgTitle("");
    setAsgDesc("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
      <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
        <span className="material-symbols-outlined text-sky-700 bg-sky-50 p-1 rounded-lg">assignment</span>
        Buat Penugasan Terstruktur Baru
      </h4>
      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
        Berikan tugas mandiri dengan tenggat (deadline) dan deskripsi soal yang disesuaikan per kelas.
      </p>

      <form onSubmit={handlePubAsg} className="space-y-4 pt-1">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase">Nama Penugasan:</label>
          <input
            type="text"
            required
            value={asgTitle}
            onChange={(e) => setAsgTitle(e.target.value)}
            placeholder="Contoh: Latihan 3 - Persamaan Diferensial Integral"
            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-semibold"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Mata Pelajaran:</label>
            <select
              value={asgSub}
              onChange={(e) => setAsgSub(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:border-emerald-500 outline-none"
            >
              {Array.from(new Set(allowedSubjects.map((s) => translateSubjectCodeToName(s.name)))).map((translatedName) => (
                <option key={translatedName} value={translatedName}>{translatedName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Target Rombel:</label>
            <select
              value={asgClass}
              onChange={(e) => setAsgClass(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:border-emerald-500 outline-none"
            >
              {allowedClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase">Batas Waktu (Due):</label>
            <input
              type="date"
              required
              value={asgDue}
              onChange={(e) => setAsgDue(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50 font-semibold text-slate-800 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase">Petunjuk Teknis / Keterangan Penugasan:</label>
          <textarea
            required
            value={asgDesc}
            onChange={(e) => setAsgDesc(e.target.value)}
            placeholder="Jelaskan instruksi penugasan, halaman buku cetak, format pengumpulan berkas..."
            rows={2}
            className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-slate-800 font-medium"
          />
        </div>

        <div className="flex items-center gap-3">
          {success && (
            <span className="text-[11px] text-[#0f766e] font-bold flex items-center gap-1 animate-pulse">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Tugas dilaunching!
            </span>
          )}
          <button
            type="submit"
            className="bg-black hover:bg-slate-900 text-white font-bold text-xs px-5 py-3 rounded-xl border border-slate-800 transition-all cursor-pointer ml-auto flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm font-black">campaign</span>
            Publikasikan Tugas
          </button>
        </div>
      </form>
    </div>
  );
};

// Beautiful Submission Grading Form - Extracted to prevent IIFE nested hook runtime compilation issues
interface SubmissionGradingFormProps {
  submissionId: string;
  onGradeSubmission?: (submId: string, score: number, feedback: string) => void;
}
const SubmissionGradingForm = ({ submissionId, onGradeSubmission }: SubmissionGradingFormProps) => {
  const [score, setScore] = useState(80);
  const [fdb, setFdb] = useState("");
  const [saving, setSaving] = useState(false);

  const handleApplyGrade = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      if (onGradeSubmission) {
        onGradeSubmission(submissionId, score, fdb);
      }
      setSaving(false);
    }, 700);
  };

  return (
    <form onSubmit={handleApplyGrade} className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-455 font-black uppercase shrink-0">Input Nilai:</span>
        <input
          type="number"
          min={0}
          max={100}
          value={score}
          onChange={(e) => setScore(parseInt(e.target.value) || 0)}
          className="w-16 text-xs p-1 bg-white border border-slate-250 text-center rounded focus:border-emerald-500 outline-none font-mono font-bold"
        />
        <span className="text-xs text-slate-400">/ 100</span>
      </div>
      <input
        type="text"
        placeholder="Umpan balik (Komentar ajar)..."
        value={fdb}
        onChange={(e) => setFdb(e.target.value)}
        className="w-full text-[11px] p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-505 font-medium"
      />
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-[#002e2c] hover:bg-slate-900 text-white font-bold text-[10px] py-1.5 rounded-lg border border-teal-900 transition-colors cursor-pointer"
      >
        {saving ? "Menyimpan..." : "Kirim Penilaian Berkas"}
      </button>
    </form>
  );
};

export const normalizeClassGroup = (cg: string): string => {
  if (!cg) return "";
  return cg
    .trim()
    .toUpperCase()
    .replace(/^KELAS\s*/i, "")
    .replace(/\s+/g, "")
    .replace(/-/g, "");
};

export const translateSubjectCodeToName = (rawNameOrCode: string): string => {
  if (!rawNameOrCode) return "";
  const cleaned = rawNameOrCode.trim().toUpperCase();
  
  if (cleaned.startsWith("PJ")) {
    return "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)";
  }
  if (cleaned.startsWith("TX") || cleaned.startsWith("TI")) {
    return "Teknologi Informasi & Komunikasi (TIK)";
  }
  if (cleaned.startsWith("MTK") || cleaned.startsWith("MAT")) {
    return "Matematika";
  }
  if (cleaned.startsWith("FIS")) {
    return "Fisika";
  }
  if (cleaned.startsWith("BIO")) {
    return "Biologi";
  }
  if (cleaned.startsWith("KIM")) {
    return "Kimia";
  }
  if (cleaned.startsWith("IND") || cleaned.startsWith("BIN")) {
    return "Bahasa Indonesia";
  }
  if (cleaned.startsWith("ING") || cleaned.startsWith("BIG")) {
    return "Bahasa Inggris";
  }
  if (cleaned.startsWith("SEJ")) {
    return "Sejarah";
  }
  if (cleaned.startsWith("GEO")) {
    return "Geografi";
  }
  if (cleaned.startsWith("EKO")) {
    return "Ekonomi";
  }
  if (cleaned.startsWith("SOS")) {
    return "Sosiologi";
  }
  if (cleaned.startsWith("FIQ") || cleaned.startsWith("FKH") || cleaned.startsWith("FIK")) {
    return "Fikih";
  }
  if (cleaned.startsWith("AA") || cleaned.startsWith("AKI")) {
    return "Akidah Akhlak";
  }
  if (cleaned.startsWith("QH") || cleaned.startsWith("QUR")) {
    return "Al-Qur'an Hadits";
  }
  if (cleaned.startsWith("SKI")) {
    return "Sejarah Kebudayaan Islam (SKI)";
  }
  if (cleaned.startsWith("ARB")) {
    return "Bahasa Arab";
  }
  if (cleaned.startsWith("PKN") || cleaned.startsWith("PPK")) {
    return "Pendidikan Pancasila dan Kewarganegaraan (PPKn)";
  }
  if (cleaned.startsWith("SBD") || cleaned.startsWith("SEN")) {
    return "Seni Budaya";
  }
  if (cleaned.startsWith("PKY") || cleaned.startsWith("PRK")) {
    return "Prakarya & Kewirausahaan";
  }
  return rawNameOrCode;
};

export default function GuruDashboard({
  profile,
  activeModule,
  announcements,
  subjects,
  classGroups = [],
  quizzes,
  students,
  attendanceRecords,
  gradeRecords,
  schedules = [],
  materials = [],
  assignments = [],
  submissions = [],
  onAddMaterial,
  onDeleteMaterial,
  onAddAssignment,
  onGradeSubmission,
  onSaveAttendance,
  onSaveGrades,
  onAddNewQuiz,
  onSetQuizzes,
  onUpdateProfile,
  onModuleChange,
  academicYear,
  academicSemester = "1",
  activeCurriculum = "Kurikulum Merdeka",
  theme: globalTheme,
  setTheme: globalSetTheme,
}: GuruDashboardProps) {
  // Filter subjects taught by this teacher
  const teacherSubjects = React.useMemo(() => {
    const specificMatches = subjects.filter(
      (sub) =>
        (profile.id && sub.teacherId === profile.id) ||
        (profile.name && sub.teacherName === profile.name) ||
        (profile.subjects && (
          profile.subjects.includes(sub.name) ||
          profile.subjects.some(ps => sub.name.toLowerCase().includes(ps.toLowerCase()))
        ))
    );

    if (specificMatches.length > 0) {
      return specificMatches;
    }

    return subjects.filter(
      (sub) =>
        sub.teacherId === profile.id ||
        sub.teacherName === profile.name ||
        sub.teacherName?.toLowerCase().includes("guru") ||
        (profile.subjects && profile.subjects.includes(sub.name))
    );
  }, [subjects, profile]);

  const allowedSubjects = React.useMemo(() => {
    return teacherSubjects.length > 0 ? teacherSubjects : subjects;
  }, [teacherSubjects, subjects]);

  // Get distinct classes associated with the teacher's allowed subjects ONLY to match the classes they actually teach
  const teacherClasses = React.useMemo(() => {
    return Array.from(new Set(allowedSubjects.map((sub) => sub.classGroup))).sort();
  }, [allowedSubjects]);

  const allowedClasses = React.useMemo(() => {
    return teacherClasses.length > 0 ? teacherClasses : ["XII - IPA 1"];
  }, [teacherClasses]);

  // Local Attendance Input State
  const [selectedClass, setSelectedClass] = useState("XII - IPA 1");
  const [attendanceDate, setAttendanceDate] = useState("2026-06-05");
  const [selectedSubjectName, setSelectedSubjectName] = useState("");

  // Get allowed classes for the currently selected subject name
  const allowedClassesForSelectedSubject = React.useMemo(() => {
    if (!selectedSubjectName) return allowedClasses;
    const filtered = allowedSubjects.filter((s) => translateSubjectCodeToName(s.name) === selectedSubjectName);
    const classes = Array.from(new Set<string>(filtered.map((s) => s.classGroup))).sort();
    return classes.length > 0 ? classes : allowedClasses;
  }, [allowedSubjects, selectedSubjectName, allowedClasses]);

  // Derive selectedSubjectId from selectedSubjectName and selectedClass
  const selectedSubjectId = React.useMemo(() => {
    if (!selectedSubjectName || !selectedClass) return "sub-1";
    const exactMatch = allowedSubjects.find(
      (s) => translateSubjectCodeToName(s.name) === selectedSubjectName && normalizeClassGroup(s.classGroup) === normalizeClassGroup(selectedClass)
    );
    if (exactMatch) return exactMatch.id;
    const fallbackMap = allowedSubjects.find((s) => translateSubjectCodeToName(s.name) === selectedSubjectName);
    return fallbackMap ? fallbackMap.id : "sub-1";
  }, [allowedSubjects, selectedSubjectName, selectedClass]);

  // Backward compatible setter
  const setSelectedSubjectId = (id: string) => {
    const sub = allowedSubjects.find((s) => s.id === id);
    if (sub) {
      setSelectedSubjectName(translateSubjectCodeToName(sub.name));
      setSelectedClass(sub.classGroup);
    }
  };

  const currentSubject = React.useMemo(() => {
    return allowedSubjects.find((s) => s.id === selectedSubjectId) || null;
  }, [allowedSubjects, selectedSubjectId]);

  const [localAttendance, setLocalAttendance] = useState<Record<string, { status: "H" | "I" | "S" | "A"; note: string }>>({});

  // Sync state defaults with allowed subjects and classes using translated subject names
  useEffect(() => {
    if (allowedSubjects.length > 0) {
      const uniqueNames = Array.from(new Set<string>(allowedSubjects.map((s) => translateSubjectCodeToName(s.name))));
      if (!selectedSubjectName || !uniqueNames.includes(selectedSubjectName)) {
        setSelectedSubjectName(uniqueNames[0]);
      }
    }
  }, [allowedSubjects, selectedSubjectName]);

  // Handle default selection for selectedClass on initial load
  useEffect(() => {
    if (allowedClasses.length > 0 && (!selectedClass || !allowedClasses.includes(selectedClass))) {
      setSelectedClass(allowedClasses[0]);
    }
  }, [allowedClasses, selectedClass]);


  // Local Grades Input State
  const [localGrades, setLocalGrades] = useState<Record<string, { assignment: number; uts: number; uas: number; note: string }>>({});

  // Local New Quiz State
  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [newQuizSubject, setNewQuizSubject] = useState("");
  const [newQuizDuration, setNewQuizDuration] = useState(45);
  const [newQuizDueDate, setNewQuizDueDate] = useState("2026-06-12");
  const [newQuizClassGroup, setNewQuizClassGroup] = useState("");

  // Local Rekap State
  const [rekapClassGroup, setRekapClassGroup] = useState("");
  const [rekapSubject, setRekapSubject] = useState("");
  const [rekapPeriod, setRekapPeriod] = useState<"1_MINGGU" | "1_BULAN" | "1_SEMESTER">("1_SEMESTER");
  const [rekapMonth, setRekapMonth] = useState<string>(() => {
    const m = new Date().getMonth() + 1;
    return m < 10 ? `0${m}` : `${m}`;
  });

  // Setup default values on mount or when allowedSubjects/allowedClasses are first populated
  useEffect(() => {
    if (allowedClasses.length > 0 && !rekapClassGroup) {
      setRekapClassGroup(allowedClasses[0]);
    }
  }, [allowedClasses, rekapClassGroup]);

  useEffect(() => {
    if (allowedSubjects.length > 0 && rekapClassGroup && !rekapSubject) {
      const firstSubForClass = allowedSubjects.find(
        (s) => normalizeClassGroup(s.classGroup) === normalizeClassGroup(rekapClassGroup)
      );
      if (firstSubForClass) {
        setRekapSubject(firstSubForClass.name);
      } else {
        setRekapSubject(allowedSubjects[0].name);
      }
    }
  }, [allowedSubjects, rekapClassGroup, rekapSubject]);

  // Dynamic quiz questions drafting states
  const [draftQuestions, setDraftQuestions] = useState<Array<{
    id: string;
    questionText: string;
    options: string[];
    correctIndex: number;
  }>>([]);
  const [currentDraftQuestion, setCurrentDraftQuestion] = useState("");
  const [currentDraftOptA, setCurrentDraftOptA] = useState("");
  const [currentDraftOptB, setCurrentDraftOptB] = useState("");
  const [currentDraftOptC, setCurrentDraftOptC] = useState("");
  const [currentDraftOptD, setCurrentDraftOptD] = useState("");
  const [currentDraftOptE, setCurrentDraftOptE] = useState("");
  const [currentDraftCorrect, setCurrentDraftCorrect] = useState(0);

  // Expanded Quiz inspection / grading State
  const [selectedQuizDetails, setSelectedQuizDetails] = useState<QuizItem | null>(null);

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

  // Sync quiz subject / class group fields with allowed lists
  useEffect(() => {
    if (allowedSubjects.length > 0) {
      const uniqueNames = Array.from(new Set<string>(allowedSubjects.map((s) => translateSubjectCodeToName(s.name))));
      const isCurrentSubValid = uniqueNames.includes(newQuizSubject);
      if (!isCurrentSubValid) {
        setNewQuizSubject(uniqueNames[0]);
      }
    }
  }, [allowedSubjects, newQuizSubject]);

  useEffect(() => {
    if (allowedClasses.length > 0 && !allowedClasses.includes(newQuizClassGroup)) {
      setNewQuizClassGroup(allowedClasses[0]);
    }
  }, [allowedClasses, newQuizClassGroup]);

  // Settings
  const [name, setName] = useState(profile.name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [title, setTitle] = useState(profile.title || "Guru");
  const [bio, setBio] = useState(profile.biodata || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [address, setAddress] = useState(profile.address || "");

  // Sync inputs dynamically with changes in profile prop
  useEffect(() => {
    setName(profile.name || "");
    setEmail(profile.email || "");
    setAvatarUrl(profile.avatarUrl || "");
    setTitle(profile.title || "Guru");
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
  const classStudents = students.filter((s) => normalizeClassGroup(s.classGroup) === normalizeClassGroup(selectedClass));
  const totalClassesCount = 4; // XII-IPA 1, XII-IPA 2, XI-IPA 3, X-IPA 4
  const classAverageScore = 84.5;
  const taughtQuizzesCount = quizzes.length;

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

  // Initialize local attendance/grades with database or seed records
  useEffect(() => {
    const records: Record<string, { status: "H" | "I" | "S" | "A"; note: string }> = {};
    classStudents.forEach((student) => {
      const existing = attendanceRecords.find(
        (a) => a.nisn === student.nisn && a.date === attendanceDate && a.subjectId === selectedSubjectId
      );
      records[student.nisn] = {
        status: existing ? existing.status : "H",
        note: existing?.note || "",
      };
    });
    setLocalAttendance(records);
  }, [selectedClass, attendanceDate, selectedSubjectId, attendanceRecords]);

  useEffect(() => {
    const grades: Record<string, { assignment: number; uts: number; uas: number; note: string }> = {};
    classStudents.forEach((student) => {
      const existing = gradeRecords.find(
        (g) => g.nisn === student.nisn && g.subjectId === selectedSubjectId
      );
      grades[student.nisn] = {
        assignment: existing ? existing.assignmentScore : 80,
        uts: existing ? existing.utsScore : 80,
        uas: existing ? existing.uasScore : 82,
        note: existing?.note || "",
      };
    });
    setLocalGrades(grades);
  }, [selectedClass, selectedSubjectId, gradeRecords]);

  const handleAttendanceChange = (nisn: string, status: "H" | "I" | "S" | "A") => {
    setLocalAttendance((prev) => ({
      ...prev,
      [nisn]: {
        ...prev[nisn],
        status,
      },
    }));
  };

  const handleAttendanceNote = (nisn: string, note: string) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [nisn]: {
        ...prev[nisn],
        note,
      },
    }));
  };

  const submitAttendance = () => {
    const updatedRecords: AttendanceRecord[] = classStudents.map((student) => ({
      id: `att-${student.nisn}-${attendanceDate}-${selectedSubjectId}`,
      nisn: student.nisn,
      studentName: student.name,
      status: localAttendance[student.nisn]?.status || "H",
      date: attendanceDate,
      subjectId: selectedSubjectId,
      note: localAttendance[student.nisn]?.note || "",
      semester: academicSemester || "1",
    }));
    onSaveAttendance(updatedRecords);
    showToast("Presensi berhasil disimpan!");
  };

  const handleGradeChange = (nisn: string, field: "assignment" | "uts" | "uas", value: number) => {
    setLocalGrades((prev) => ({
      ...prev,
      [nisn]: {
        ...prev[nisn],
        [field]: value,
      },
    }));
  };

  const handleGradeNote = (nisn: string, note: string) => {
    setLocalGrades((prev) => ({
      ...prev,
      [nisn]: {
        ...prev[nisn],
        note,
      },
    }));
  };

  const calculateGrade = (final: number) => {
    if (final >= 90) return "A";
    if (final >= 85) return "A-";
    if (final >= 80) return "B+";
    if (final >= 75) return "B";
    if (final >= 70) return "B-";
    if (final >= 60) return "C";
    return "D";
  };

  const submitGrades = () => {
    const updatedRecords: GradeRecord[] = classStudents.map((student) => {
      const lg = localGrades[student.nisn] || { assignment: 80, uts: 80, uas: 82, note: "" };
      const finalScore = lg.assignment * 0.4 + lg.uts * 0.25 + lg.uas * 0.35;
      return {
        id: `g-${student.nisn}-${selectedSubjectId}`,
        nisn: student.nisn,
        studentName: student.name,
        subjectId: selectedSubjectId,
        assignmentScore: lg.assignment,
        utsScore: lg.uts,
        uasScore: lg.uas,
        finalScore: Math.round(finalScore * 100) / 100,
        grade: calculateGrade(finalScore),
        note: lg.note,
      };
    });
    onSaveGrades(updatedRecords);
    showToast("Daftar nilai berhasil diperbarui!");
  };

  const downloadRekapAbsensi = (e: React.MouseEvent) => {
    e.preventDefault();
    const studentsInClass = students.filter(s => normalizeClassGroup(s.classGroup) === normalizeClassGroup(rekapClassGroup));
    const matchedSubject = allowedSubjects.find(s => (s.name === rekapSubject || translateSubjectCodeToName(s.name) === rekapSubject) && normalizeClassGroup(s.classGroup) === normalizeClassGroup(rekapClassGroup));
    const targetSubjectId = matchedSubject?.id || "";
    
    // Header for the CSV columns
    let csvContent = "\uFEFF"; // Add UTF-8 BOM so Excel decodes accents correctly!
    csvContent += "No,NISN,Nama Siswa,Kelas,Mata Pelajaran,Hadir (H),Izin (I),Sakit (S),Alfa (A),Persentase Kehadiran\n";
    
    studentsInClass.forEach((student, index) => {
      const studentRecords = attendanceRecords.filter(rec => {
        const recSubject = subjects.find(s => s.id === rec.subjectId);
        const matchesSubject = rec.subjectId === targetSubjectId || 
          (recSubject !== undefined && (recSubject.name === rekapSubject || translateSubjectCodeToName(recSubject.name) === rekapSubject) && normalizeClassGroup(recSubject.classGroup) === normalizeClassGroup(rekapClassGroup));

        if (rec.nisn !== student.nisn || !matchesSubject) return false;
        if (rekapPeriod === "1_MINGGU") {
          const recordDate = new Date(rec.date);
          const now = new Date();
          const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return recordDate >= cutoff && recordDate <= now;
        } else if (rekapPeriod === "1_BULAN") {
          if (!rec.date) return false;
          const parts = rec.date.split("-");
          return parts[1] === rekapMonth;
        } else {
          return !rec.semester || rec.semester === academicSemester;
        }
      });
      
      const total = studentRecords.length;
      const h = studentRecords.filter(r => r.status === "H").length;
      const i = studentRecords.filter(r => r.status === "I").length;
      const s = studentRecords.filter(r => r.status === "S").length;
      const a = studentRecords.filter(r => r.status === "A").length;
      const pct = total > 0 ? Math.round((h / total) * 100) : 100;
      
      const row = [
        index + 1,
        `"${student.nisn}"`,
        `"${student.name}"`,
        `"${rekapClassGroup}"`,
        `"${translateSubjectCodeToName(rekapSubject)}"`,
        h,
        i,
        s,
        a,
        `"${pct}%"`
      ].join(",");
      csvContent += row + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Absensi_${rekapClassGroup.replace(/\s+/g, "_")}_${rekapSubject.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Rekap Absensi Berhasil Diunduh!");
  };

  const downloadRekapNilai = (e: React.MouseEvent) => {
    e.preventDefault();
    const studentsInClass = students.filter(s => normalizeClassGroup(s.classGroup) === normalizeClassGroup(rekapClassGroup));
    const matchedSubject = allowedSubjects.find(s => (s.name === rekapSubject || translateSubjectCodeToName(s.name) === rekapSubject) && normalizeClassGroup(s.classGroup) === normalizeClassGroup(rekapClassGroup));
    const targetSubjectId = matchedSubject?.id || "";
    
    let csvContent = "\uFEFF"; // Add UTF-8 BOM so Excel decodes accents correctly!
    csvContent += "No,NISN,Nama Siswa,Kelas,Mata Pelajaran,Nilai Tugas,Nilai UTS,Nilai UAS,Nilai Akhir,Predikat,Kelulusan\n";
    
    studentsInClass.forEach((student, index) => {
      const studentGrade = gradeRecords.find(g => {
        const recSubject = subjects.find(s => s.id === g.subjectId);
        const matchesSubject = g.subjectId === targetSubjectId || 
          (recSubject !== undefined && (recSubject.name === rekapSubject || translateSubjectCodeToName(recSubject.name) === rekapSubject) && normalizeClassGroup(recSubject.classGroup) === normalizeClassGroup(rekapClassGroup));
        return g.nisn === student.nisn && matchesSubject && (!g.semester || g.semester === academicSemester);
      });
      
      const t = studentGrade?.assignmentScore ?? 0;
      const uts = studentGrade?.utsScore ?? 0;
      const uas = studentGrade?.uasScore ?? 0;
      const fn = studentGrade?.finalScore ?? 0;
      const pred = studentGrade?.grade ?? "E";
      const status = fn >= 75 ? "LULUS" : "REMEDIAL";
      
      const row = [
        index + 1,
        `"${student.nisn}"`,
        `"${student.name}"`,
        `"${rekapClassGroup}"`,
        `"${translateSubjectCodeToName(rekapSubject)}"`,
        t,
        uts,
        uas,
        fn,
        `"${pred}"`,
        `"${status}"`
      ].join(",");
      csvContent += row + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Nilai_${rekapClassGroup.replace(/\s+/g, "_")}_${rekapSubject.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Rekap Nilai Berhasil Diunduh!");
  };

  const parseQuizImportText = (text: string) => {
    const lines = text.split(/\r?\n/);
    const imported: any[] = [];
    let currentQ: any = null;

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // New question detection: e.g. "Soal: ..." or "1. ..." or "Q: ..."
      const questionMatch = trimmed.match(/^(?:Soal\s*:\s*|Q\s*:\s*|\d+[\.\)\s]+)(.*)/i);
      if (questionMatch) {
         if (currentQ && currentQ.questionText && currentQ.options.length >= 2) {
           imported.push(currentQ);
         }
         currentQ = {
           id: `q-imported-${Date.now()}-${imported.length + 1}-${Math.floor(Math.random() * 1000)}`,
           questionText: questionMatch[1].trim(),
           options: [],
           correctIndex: 0,
         };
         continue;
      }

      // Check for Option pattern: A. ..., B) ..., Option A: ..., etc. Matches option prefix up to E
      const optionMatch = trimmed.match(/^([A-E])[\.\)\s:]+(.*)/i);
      if (optionMatch && currentQ) {
         const letter = optionMatch[1].toUpperCase();
         const optionVal = optionMatch[2].trim();
         currentQ.options.push(`${letter}. ${optionVal}`);
         continue;
      }

      // Check for Correct option key: "Jawaban: A" or "Kunci: A"
      const ansMatch = trimmed.match(/^(?:Jawaban|Kunci|Kunci Jawaban|Correct|Answer)\s*[:\s\-]+\s*([A-E])/i);
      if (ansMatch && currentQ) {
         const letter = ansMatch[1].toUpperCase();
         const letterIndex = ["A", "B", "C", "D", "E"].indexOf(letter);
         if (letterIndex >= 0) {
           currentQ.correctIndex = letterIndex;
         }
         continue;
      }

      // Append text if still on question text block (before options are inserted)
      if (currentQ && currentQ.options.length === 0) {
         currentQ.questionText += " " + trimmed;
      }
    }

    if (currentQ && currentQ.questionText && currentQ.options.length >= 2) {
       imported.push(currentQ);
    }

    // Secondary fallback: CSV layout from Excel: "Question","A","B","C","D","E","CorrectOption"
    if (imported.length === 0) {
       for (let line of lines) {
         const trimmed = line.trim();
         if (!trimmed) continue;
         const cols = trimmed.split(/[\t,]/);
         if (cols.length >= 5) {
           const cleanCols = cols.map(c => c.replace(/^["']|["']$/g, "").trim());
           if (cleanCols[0].toLowerCase().includes("soal") || cleanCols[0].toLowerCase().includes("question")) {
             continue; // Skip header
           }
           const qText = cleanCols[0];
           const optA = cleanCols[1];
           const optB = cleanCols[2];
           const optC = cleanCols[3];
           const optD = cleanCols[4];
           const optE = cleanCols[5] || "";
           const correctStr = (cleanCols[6] || cleanCols[5] || "A").toUpperCase();
           const correctId = ["A", "B", "C", "D", "E"].indexOf(correctStr[0]) >= 0 
             ? ["A", "B", "C", "D", "E"].indexOf(correctStr[0]) 
             : 0;

           const opts = [`A. ${optA}`, `B. ${optB}`, `C. ${optC}`, `D. ${optD}`];
           if (optE) opts.push(`E. ${optE}`);

           imported.push({
             id: `q-csv-${Date.now()}-${imported.length + 1}-${Math.floor(Math.random() * 1000)}`,
             questionText: qText,
             options: opts,
             correctIndex: correctId,
           });
         }
       }
    }

    return imported;
  };

  const [importText, setImportText] = useState("");
  const [showImportArea, setShowImportArea] = useState(false);

  const handleImportBatchQuestions = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!importText.trim()) {
      alert("Harap masukkan atau tempel teks soal terlebih dahulu!");
      return;
    }
    const parsed = parseQuizImportText(importText);
    if (parsed.length === 0) {
      alert("Gagal membaca soal dari teks. Harap pastikan format sesuai panduan!");
      return;
    }
    setDraftQuestions([...draftQuestions, ...parsed]);
    setImportText("");
    setShowImportArea(false);
    showToast(`Berhasil mengimpor ${parsed.length} soal kuis ke draf!`);
  };

  const handleCsvFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseQuizImportText(text);
        if (parsed.length === 0) {
          alert("Gagal mengimpor file kuis. Pastikan file format .csv / .txt yang valid!");
          return;
        }
        setDraftQuestions([...draftQuestions, ...parsed]);
        showToast(`Berhasil mengimpor ${parsed.length} soal dari file!`);
      }
    };
    reader.readAsText(file);
  };

  const handleAddDraftQuestion = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!currentDraftQuestion.trim()) {
      alert("Teks soal tidak boleh kosong!");
      return;
    }
    if (!currentDraftOptA.trim() || !currentDraftOptB.trim() || !currentDraftOptC.trim() || !currentDraftOptD.trim()) {
      alert("Pilihan jawaban A, B, C, D wajib diisi! Opsi E opsional.");
      return;
    }
    const opts = [
      `A. ${currentDraftOptA.trim()}`,
      `B. ${currentDraftOptB.trim()}`,
      `C. ${currentDraftOptC.trim()}`,
      `D. ${currentDraftOptD.trim()}`,
    ];
    if (currentDraftOptE.trim()) {
      opts.push(`E. ${currentDraftOptE.trim()}`);
    }
    
    // Correct index check
    if (currentDraftCorrect === 4 && !currentDraftOptE.trim()) {
      alert("Harap isi Opsi E jika memilih Kunci Jawaban E!");
      return;
    }

    const newQ = {
      id: `q-${Date.now()}-${draftQuestions.length + 1}`,
      questionText: currentDraftQuestion.trim(),
      options: opts,
      correctIndex: currentDraftCorrect,
    };
    setDraftQuestions([...draftQuestions, newQ]);
    
    // Clear draft form
    setCurrentDraftQuestion("");
    setCurrentDraftOptA("");
    setCurrentDraftOptB("");
    setCurrentDraftOptC("");
    setCurrentDraftOptD("");
    setCurrentDraftOptE("");
    setCurrentDraftCorrect(0);
    showToast("Soal berhasil dimasukkan ke draf kuis!");
  };

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) {
      alert("Masukkan Judul Kuis!");
      return;
    }
    const finalQuestions = draftQuestions.length > 0 ? draftQuestions : [
      {
        id: `q-${Date.now()}-1`,
        questionText: "Contoh Soal Evaluasi: Turunan dari fungsi trigonometri sin(x) adalah...",
        options: ["A. cos(x)", "B. -cos(x)", "C. tan(x)", "D. sec(x)"],
        correctIndex: 0,
      }
    ];

    const newQuiz: QuizItem = {
      id: `quiz-${Date.now()}`,
      title: newQuizTitle,
      subject: newQuizSubject,
      classGroup: newQuizClassGroup,
      questionsCount: finalQuestions.length,
      durationMinutes: newQuizDuration,
      dueDate: `${newQuizDueDate}T23:59:00Z`,
      status: "Aktif",
      createdAt: new Date().toISOString(),
      questions: finalQuestions,
      submissions: [],
    };
    
    onAddNewQuiz(newQuiz);
    setNewQuizTitle("");
    setDraftQuestions([]);
    showToast(`Kuis "${newQuiz.title}" berhasil diterbitkan!`);
  };

  const handleGradeSubmission = (studentId: string, customScore: number) => {
    if (!selectedQuizDetails || !onSetQuizzes) return;
    const updatedQuizzes = quizzes.map((q) => {
      if (q.id === selectedQuizDetails.id) {
        const updatedSubmissions = (q.submissions || []).map((sub) => {
          if (sub.studentId === studentId) {
            return { ...sub, score: customScore };
          }
          return sub;
        });
        const exists = (q.submissions || []).some((sub) => sub.studentId === studentId);
        if (!exists) {
          updatedSubmissions.push({
            studentId,
            studentName: students.find((s) => s.nisn === studentId)?.name || "Siswa",
            score: customScore,
            completedAt: new Date().toISOString(),
          });
        }
        return {
          ...q,
          submissions: updatedSubmissions,
        };
      }
      return q;
    });

    onSetQuizzes(updatedQuizzes);
    const found = updatedQuizzes.find((q) => q.id === selectedQuizDetails.id);
    if (found) {
      setSelectedQuizDetails(found);
    }
    showToast("Nilai pengerjaan kuis siswa berhasil diperbarui!");
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name,
      email,
      avatarUrl,
      title,
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
            {activeModule === "beranda" && "Evaluasi Kinerja Guru"}
            {activeModule === "jadwal" && "Jadwal Mengajar"}
            {activeModule === "presensi" && "Input Presensi Siswa Resmi"}
            {activeModule === "nilai" && "Input Nilai Rapot Siswa"}
            {activeModule === "kuis" && "Manajemen Bank Soal & Kuis"}
            {activeModule === "pengaturan" && "Profil & Preferensi Guru"}
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
            <button className="text-slate-500 hover:text-emerald-800 transition-colors p-1" onClick={() => alert("Tidak ada notifikasi pemberitahuan baru.")}>
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
            {/* Welcome message */}
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
                  {/* Dynamic Teacher Role Title & Active Curriculum Integration */}
                  {(() => {
                    const translateSubjectCodeToName = (rawNameOrCode: string): string => {
                      if (!rawNameOrCode) return "";
                      const cleaned = rawNameOrCode.trim().toUpperCase();
                      
                      if (cleaned.startsWith("PJ")) {
                        return "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)";
                      }
                      if (cleaned.startsWith("TX") || cleaned.startsWith("TI")) {
                        return "Teknologi Informasi & Komunikasi (TIK)";
                      }
                      if (cleaned.startsWith("MTK") || cleaned.startsWith("MAT")) {
                        return "Matematika";
                      }
                      if (cleaned.startsWith("FIS")) {
                        return "Fisika";
                      }
                      if (cleaned.startsWith("BIO")) {
                        return "Biologi";
                      }
                      if (cleaned.startsWith("KIM")) {
                        return "Kimia";
                      }
                      if (cleaned.startsWith("IND") || cleaned.startsWith("BIN")) {
                        return "Bahasa Indonesia";
                      }
                      if (cleaned.startsWith("ING") || cleaned.startsWith("BIG")) {
                        return "Bahasa Inggris";
                      }
                      if (cleaned.startsWith("SEJ")) {
                        return "Sejarah";
                      }
                      if (cleaned.startsWith("GEO")) {
                        return "Geografi";
                      }
                      if (cleaned.startsWith("EKO")) {
                        return "Ekonomi";
                      }
                      if (cleaned.startsWith("SOS")) {
                        return "Sosiologi";
                      }
                      if (cleaned.startsWith("FIQ") || cleaned.startsWith("FKH") || cleaned.startsWith("FIK")) {
                        return "Fikih";
                      }
                      if (cleaned.startsWith("AA") || cleaned.startsWith("AKI")) {
                        return "Akidah Akhlak";
                      }
                      if (cleaned.startsWith("QH") || cleaned.startsWith("QUR")) {
                        return "Al-Qur'an Hadits";
                      }
                      if (cleaned.startsWith("SKI")) {
                        return "Sejarah Kebudayaan Islam (SKI)";
                      }
                      if (cleaned.startsWith("ARB")) {
                        return "Bahasa Arab";
                      }
                      if (cleaned.startsWith("PKN") || cleaned.startsWith("PPK")) {
                        return "Pendidikan Pancasila dan Kewarganegaraan (PPKn)";
                      }
                      if (cleaned.startsWith("SBD") || cleaned.startsWith("SEN")) {
                        return "Seni Budaya";
                      }
                      if (cleaned.startsWith("PKY") || cleaned.startsWith("PRK")) {
                        return "Prakarya & Kewirausahaan";
                      }
                      return rawNameOrCode;
                    };

                    const teacherActualSubjects = subjects.filter(
                      (sub) => sub.teacherId === profile.id || sub.teacherName === profile.name
                    );
                    const listSubjectNames = teacherActualSubjects.length > 0
                      ? teacherActualSubjects.map(s => s.name)
                      : (profile.subjects && profile.subjects.length > 0 ? profile.subjects : ["Akademik"]);

                    const translatedNames = listSubjectNames.map(name => translateSubjectCodeToName(name));
                    const distinctSubjectNames = Array.from(new Set(translatedNames));
                    const displaySubjectsName = distinctSubjectNames.join(" & ");
                    const isWaliKelas = profile.classGroup && profile.classGroup !== "-";
                    return (
                      <div className="space-y-2 mt-2">
                        <p className="text-sm text-[#acf59a] font-bold">
                          Guru {displaySubjectsName} {isWaliKelas ? `& Wali Kelas Kelas ${profile.classGroup}` : ""} • Semester {academicSemester === "1" ? "Ganjil" : "Genap"} • TA {academicYear}
                        </p>
                        <div className="flex gap-2 items-center flex-wrap pt-1">
                          <span className="text-[10px] bg-emerald-950/50 text-emerald-300 font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-500/20 uppercase tracking-wider">
                            {activeCurriculum}
                          </span>
                          <span className="text-[10.5px] bg-[#acf59a]/15 text-[#acf59a] font-bold px-2.5 py-0.5 rounded-md border border-[#acf59a]/20">
                            {isWaliKelas ? `Unit Wali Kelas: ${profile.classGroup}` : "Bukan Wali Kelas (Guru Khusus Mapel)"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  <p className="text-xs text-emerald-200/80 italic mt-6 border-l-2 border-emerald-400 pl-4">
                    "Pendidikan adalah cara terbaik bagi jiwa seorang murid untuk bertumbuh mekar."
                  </p>
                </div>
              </motion.div>

              {/* Attendance Tracker */}
              <motion.div 
                whileHover={{ y: -3 }}
                className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-500"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">INDEKS MONITORING</p>
                    <h4 className="text-emerald-950 text-3.5xl font-black mt-1 tracking-tight">96.4%</h4>
                  </div>
                  <span className="material-symbols-outlined text-emerald-900 bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">co_present</span>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "96.4%" }}
                      transition={{ duration: 0.8 }}
                      className="bg-gradient-to-r from-emerald-700 to-teal-500 h-full"
                    ></motion.div>
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mt-2.5 leading-relaxed">
                    Tingkat kedisiplinan mengajar sangat teladan di atas target kurikulum nasional (95%).
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Teaching schedules and counseling intervention */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Daily Teaching schedules */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-800">event_note</span>
                    {(() => {
                      const daysIndonesian = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
                      const todayDayName = daysIndonesian[new Date().getDay()];
                      return (
                        <h3 className="text-sm font-bold text-slate-800">
                          Jadwal Mengajar Hari Ini ({todayDayName})
                        </h3>
                      );
                    })()}
                  </div>
                </div>
                <div className="divide-y divide-slate-100 flex-1">
                  {(() => {
                    const daysIndonesian = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
                    const todayDayName = daysIndonesian[new Date().getDay()];

                    const teacherSchedules = schedules.filter((sch) => {
                      if (sch.day.toUpperCase() !== todayDayName) return false;
                      const specialMeta = getSpecialSessionMeta(sch.subjectId);
                      if (specialMeta) return true;
                      const sub = subjects.find((s) => s.id === sch.subjectId);
                      return sub && sub.teacherId === profile.id;
                    });

                    if (teacherSchedules.length === 0) {
                      return (
                        <div className="p-8 text-center text-slate-400 italic text-xs flex flex-col items-center justify-center py-12">
                          <span className="material-symbols-outlined text-slate-300 text-3xl mb-1">event_busy</span>
                          <span className="font-semibold text-slate-500">Tidak ada jadwal pelajaran mengajar aktif untuk hari {todayDayName}.</span>
                        </div>
                      );
                    }

                    return teacherSchedules.map((sch) => {
                      const specialMeta = getSpecialSessionMeta(sch.subjectId);
                      const sub = specialMeta ? null : subjects.find((s) => s.id === sch.subjectId);
                      
                      const displayName = specialMeta ? specialMeta.label : (sub ? sub.name : "Mata Pelajaran");
                      const displayClass = specialMeta ? specialMeta.classGroup : `Kelas ${sub ? sub.classGroup : "Kelas"}`;
                      const displayRoom = sch.room || (specialMeta ? "Selasar / Sekolah" : "Ruang Kelas");
                      const iconName = specialMeta ? specialMeta.icon : "meeting_room";
                      
                      const cardBg = specialMeta ? specialMeta.cardStyle : "cursor-pointer hover:bg-emerald-50/30";
                      const textTheme = specialMeta ? specialMeta.themeColor : "text-slate-800 group-hover:text-emerald-800 transition-colors";
                      const badgeStyle = specialMeta ? specialMeta.badgeStyle : (sub?.category === "Wajib" ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-amber-50 text-amber-800 border-amber-100");
                      const badgeLabel = specialMeta ? specialMeta.categoryName : (sub?.category || "UTAMA");

                      return (
                        <button 
                          key={sch.id}
                          disabled={!!specialMeta}
                          onClick={() => {
                            if (sub) {
                              setSelectedClass(sub.classGroup);
                              setSelectedSubjectId(sub.id);
                              if (onModuleChange) onModuleChange("presensi");
                              showToast(`Mengalihkan ke Presensi: ${sub.name} (${sub.classGroup})`);
                            }
                          }}
                          className={`w-full flex items-center text-left gap-6 px-6 py-4 transition-colors group select-none outline-none border-none ${
                            specialMeta ? `${cardBg} cursor-default` : "cursor-pointer"
                          }`}
                        >
                          <div className="text-center min-w-[80px]">
                            <p className="font-bold text-slate-800 text-sm">{sch.timeSlot}</p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">{sch.day}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold text-sm truncate uppercase tracking-tight flex items-center gap-1.5 ${textTheme}`}>
                              {specialMeta && <span className="material-symbols-outlined text-[16px]">{iconName}</span>}
                              {displayName}
                            </h4>
                            <p className="text-xs text-slate-500 truncate">
                              {displayClass} • {displayRoom}
                            </p>
                            {!specialMeta && (
                              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-1 transition-all opacity-70 group-hover:opacity-100">
                                <span className="material-symbols-outlined text-[12px]">how_to_reg</span>
                                Klik untuk Isi Absen Siswa
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 border ${badgeStyle}`}>
                            {badgeLabel}
                          </span>
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Attention Intervention alerts */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 text-rose-800">
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                    Butuh Tindak Lanjut Absensi
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Terdapat beberapa siswa di kelas perwalian Anda (XII-IPA 1) yang absen dalam beberapa sesi berturut-turut:
                  </p>
                  <div className="space-y-2.5">
                    <div className="p-3 bg-red-50 border border-red-150 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-red-950">Dian Zulkarnaen</p>
                        <p className="text-[10px] text-red-750">Absen (Alfa) 3 kali berturut-turut</p>
                      </div>
                      <button onClick={() => alert("Mengirimkan notifikasi peringatan otomatis ke nomor orang tua siswa...")} className="bg-red-800 text-white font-bold text-[9px] px-2.5 py-1 rounded">NOTIFIKASI</button>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4 text-center">
                  <button onClick={() => alert("Membuka aplikasi bimbingan konseling SIALMA...")} className="text-xs font-bold text-emerald-800 hover:underline">Kelola Konseling Siswa &rarr;</button>
                </div>
              </div>
            </div>
            {/* Announcements Section */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col mt-8">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-800">campaign</span>
                  <h3 className="text-sm font-bold text-slate-800">Papan Pengumuman Resmi Madrasah</h3>
                </div>
                <span className="text-[10px] bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-100 font-bold uppercase">
                  Penting &amp; Terbaru
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                {announcements && announcements.length > 0 ? (
                  announcements.map((a) => (
                    <div key={a.id} className="p-6 hover:bg-slate-50/40 transition-colors">
                      <div className="flex items-start gap-4 justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-amber-500/10 text-amber-800 px-2 py-0.5 rounded">
                              {a.target || "Penting"}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400">
                              {new Date(a.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm mt-1">{a.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed mt-1">{a.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-xs">Tidak ada pengumuman hari ini.</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Module: JADWAL */}
        {activeModule === "jadwal" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Jadwal Pengajaran Mingguan</h3>
                <p className="text-xs text-slate-500 font-medium">{profile.name} — Kalender Mengajar Semester Ganjil Terintegrasi</p>
              </div>
              <button 
                onClick={() => alert("Mengunduh cetakan jadwal mengajar format PDF...")} 
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer hover:-translate-y-0.5 border border-emerald-700"
              >
                Cetak Jadwal.pdf
              </button>
            </div>

            {/* Desktop View: Grid (Hidden on Mobile) */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center text-xs font-bold text-slate-500">
                <div className="p-4">WAKTU</div>
                <div className="p-4 border-l border-slate-200">SENIN</div>
                <div className="p-4 border-l border-slate-200">SELASA</div>
                <div className="p-4 border-l border-slate-200">RABU</div>
                <div className="p-4 border-l border-slate-200 bg-emerald-50 text-emerald-900 font-black">KAMIS</div>
                <div className="p-4 border-l border-slate-200">JUMAT</div>
                <div className="p-4 border-l border-slate-200 bg-amber-50/50 text-amber-950 font-bold">SABTU</div>
              </div>

              <div className="divide-y divide-slate-100 text-xs text-slate-700 bg-white">
                {(() => {
                  const teacherSchedules = schedules.filter((sch) => {
                    const specialMeta = getSpecialSessionMeta(sch.subjectId);
                    if (specialMeta) return true;
                    const sub = subjects.find((s) => s.id === sch.subjectId);
                    return sub && sub.teacherId === profile.id;
                  });
                  
                  const uniqueActiveSlots = Array.from(new Set(teacherSchedules.map(s => s.timeSlot))).sort();
                  
                  if (uniqueActiveSlots.length === 0) {
                    return (
                      <div className="p-12 text-center text-slate-400 italic text-xs flex flex-col items-center justify-center min-h-[220px]">
                        <span className="material-symbols-outlined text-slate-350 text-4xl mb-2 text-slate-400">calendar_today</span>
                        <span className="font-semibold text-slate-600 block text-sm">Belum Ada Sesi Mengajar Aktif</span>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                          Tidak ada jadwal mengajar atau waktu istirahat yang diplot untuk Anda saat ini. Semua jadwal baru yang ditetapkan oleh Administrator akan tayang otomatis di sini secara real-time.
                        </p>
                      </div>
                    );
                  }

                  return uniqueActiveSlots.map((slot) => (
                    <div key={slot} className="grid grid-cols-7 items-stretch">
                      <div className="p-4 font-sans text-center font-bold bg-slate-50 flex items-center justify-center border-r border-slate-100">{slot}</div>
                      {(["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"] as const).map((day) => {
                        const sch = teacherSchedules.find(s => s.day === day && s.timeSlot === slot);
                        if (!sch) {
                          return (
                            <div key={day} className="p-2 border-l border-slate-200 flex items-center justify-center text-slate-350 italic text-[10px] bg-slate-50/5">
                              Sesi Kosong
                            </div>
                          );
                        }
                        
                        const specialMeta = getSpecialSessionMeta(sch.subjectId);
                        if (specialMeta) {
                          const iconName = specialMeta.icon;
                          return (
                            <div key={day} className={`p-2 border-l border-slate-200 flex items-center justify-center ${specialMeta.cardStyle}`}>
                              <div className="text-center flex flex-col justify-center items-center w-full h-full min-h-[70px]">
                                <span className="material-symbols-outlined text-[15px]">{iconName}</span>
                                <span className="font-extrabold text-[10px] leading-tight block mt-0.5 uppercase">{specialMeta.label}</span>
                                <span className="text-[9px] font-bold mt-0.5 truncate max-w-full opacity-80">{sch.room || "Selasar Sekolah"}</span>
                              </div>
                            </div>
                          );
                        }

                        const sub = subjects.find((s) => s.id === sch.subjectId);
                        return (
                          <div key={day} className={`p-2 border-l border-slate-200 flex flex-col justify-between ${day === "KAMIS" ? "bg-emerald-50/20" : ""} ${day === "SABTU" ? "bg-amber-50/10" : ""}`}>
                            <button
                              onClick={() => {
                                  if (sub) {
                                    setSelectedClass(sub.classGroup);
                                    setSelectedSubjectId(sub.id);
                                    if (onModuleChange) onModuleChange("presensi");
                                    showToast(`Mengalihkan ke Presensi: ${sub.name} (${sub.classGroup})`);
                                  }
                              }}
                              className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full justify-between min-h-[70px] text-left hover:border-emerald-700 hover:ring-2 hover:ring-emerald-800/10 cursor-pointer transition-all group w-full"
                              title="Klik untuk membuka presensi kelas ini"
                            >
                              <span className="font-bold text-emerald-950 leading-tight block group-hover:text-emerald-800 transition-colors">{sub ? sub.name : "Subjek"}</span>
                              <div className="flex items-center justify-between w-full mt-1.5">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                                  {sub ? sub.classGroup : "Kelas"} • {sch.room}
                                </span>
                                <span className="material-symbols-outlined text-[13px] text-slate-300 group-hover:text-emerald-800 group-hover:translate-x-0.5 transition-all">
                                  arrow_forward
                                </span>
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Mobile View: Beautiful Day Tab Selector & List (No Overlapping) */}
            <MobileTeacherSchedule 
              schedules={schedules} 
              subjects={subjects} 
              profile={profile} 
              setSelectedClass={setSelectedClass}
              setSelectedSubjectId={setSelectedSubjectId}
              onModuleChange={onModuleChange}
            />
          </motion.div>
        )}

        {/* Module: PRESENSI */}
        {activeModule === "presensi" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Filter selection header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mata Pelajaran</label>
                  <select 
                    value={selectedSubjectName} 
                    onChange={(e) => setSelectedSubjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/10"
                  >
                    {Array.from(new Set<string>(allowedSubjects.map((s) => s.name))).map((name) => (
                      <option key={name} value={name}>
                        {translateSubjectCodeToName(name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kelas Terpilih</label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/10"
                  >
                    {allowedClasses.map((cl) => (
                      <option key={cl} value={cl}>
                        Kelas {cl}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tanggal Sesi</label>
                  <input 
                    type="date" 
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/10"
                  />
                </div>
                <div>
                  <button onClick={submitAttendance} className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-4 rounded-lg select-none text-xs transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Simpan Presensi</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Marking List */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Isi Presensi Kehadiran Siswa</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Berikan tanda status kehadiran untuk setiap murid.</p>
                </div>
                <button onClick={() => {
                  const records: Record<string, { status: "H" | "I" | "S" | "A"; note: string }> = {};
                  classStudents.forEach((student) => {
                    records[student.nisn] = { status: "H", note: "" };
                  });
                  setLocalAttendance(records);
                }} className="text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1 rounded-full hover:bg-emerald-100">Semua Hadir</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center">No</th>
                      <th className="px-6 py-4">Nama Siswa</th>
                      <th className="px-6 py-4 text-center">Hadir (H)</th>
                      <th className="px-6 py-4 text-center">Izin (I)</th>
                      <th className="px-6 py-4 text-center">Sakit (S)</th>
                      <th className="px-6 py-4 text-center">Alfa (A)</th>
                      <th className="px-6 py-4 min-w-[200px]">Catatan Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {classStudents.map((student, idx) => {
                      const selection = localAttendance[student.nisn] || { status: "H", note: "" };
                      return (
                        <tr key={student.nisn} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{student.name}</p>
                            <p className="text-xs text-slate-400">NISN: {student.nisn}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="radio" 
                              name={`attendance-${student.nisn}`}
                              checked={selection.status === "H"}
                              onChange={() => handleAttendanceChange(student.nisn, "H")}
                              className="w-5 h-5 text-emerald-700 border-slate-300 focus:ring-emerald-600"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="radio" 
                              name={`attendance-${student.nisn}`}
                              checked={selection.status === "I"}
                              onChange={() => handleAttendanceChange(student.nisn, "I")}
                              className="w-5 h-5 text-blue-700 border-slate-300 focus:ring-blue-600"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="radio" 
                              name={`attendance-${student.nisn}`}
                              checked={selection.status === "S"}
                              onChange={() => handleAttendanceChange(student.nisn, "S")}
                              className="w-5 h-5 text-amber-700 border-slate-300 focus:ring-amber-600"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="radio" 
                              name={`attendance-${student.nisn}`}
                              checked={selection.status === "A"}
                              onChange={() => handleAttendanceChange(student.nisn, "A")}
                              className="w-5 h-5 text-rose-700 border-slate-300 focus:ring-rose-600"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input 
                              type="text" 
                              value={selection.note}
                              onChange={(e) => handleAttendanceNote(student.nisn, e.target.value)}
                              placeholder="Keterangan sakit/kegiatan..."
                              className="w-full bg-transparent border-b border-slate-200 focus:border-emerald-800 focus:ring-0 outline-none text-xs py-1"
                            />
                          </td>
                        </tr>
                      );
                    })}
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
            className="space-y-6"
          >
            {/* Filter Selection Header for Grades */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mata Pelajaran</label>
                  <select 
                    value={selectedSubjectName} 
                    onChange={(e) => setSelectedSubjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold outline-none focus:border-emerald-800"
                  >
                    {Array.from(new Set<string>(allowedSubjects.map((s) => s.name))).map((name) => (
                      <option key={name} value={name}>
                        {translateSubjectCodeToName(name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kelas Terpilih</label>
                  <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold outline-none focus:border-emerald-800"
                  >
                    {allowedClasses.map((cl) => (
                      <option key={cl} value={cl}>
                        Kelas {cl}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button onClick={submitGrades} className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-3 px-4 rounded-lg text-xs transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Submit &amp; Simpan Semua Nilai</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grades Marking Sheet List */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h4 className="text-sm font-bold text-slate-800 font-sans">Input Form Kehadiran &amp; Penilaian UTS / UAS</h4>
                <p className="text-xs text-slate-500 mt-0.5">Input angka berkisar antara 0 - 100.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-center w-12">No</th>
                      <th className="px-6 py-4">Siswa (XII-IPA 1)</th>
                      <th className="px-6 py-4 text-center w-28">Tugas (40%)</th>
                      <th className="px-6 py-4 text-center w-28">UTS (25%)</th>
                      <th className="px-6 py-4 text-center w-28">UAS (35%)</th>
                      <th className="px-6 py-4 text-center w-28">Rata-rata</th>
                      <th className="px-6 py-4">Umpan Balik / Catatan Guru</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {classStudents.map((student, idx) => {
                      const score = localGrades[student.nisn] || { assignment: 80, uts: 80, uas: 82, note: "" };
                      const totalAverage = score.assignment * 0.4 + score.uts * 0.25 + score.uas * 0.35;
                      return (
                        <tr key={student.nisn} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            {student.name}
                            <p className="text-[10px] text-slate-400 font-mono">NISN: {student.nisn}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input 
                              type="number" 
                              value={score.assignment}
                              min={0}
                              max={100}
                              onChange={(e) => handleGradeChange(student.nisn, "assignment", parseInt(e.target.value) || 0)}
                              className="w-16 bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-bold text-xs"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input 
                              type="number" 
                              value={score.uts}
                              min={0}
                              max={100}
                              onChange={(e) => handleGradeChange(student.nisn, "uts", parseInt(e.target.value) || 0)}
                              className="w-16 bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-bold text-xs"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input 
                              type="number" 
                              value={score.uas}
                              min={0}
                              max={100}
                              onChange={(e) => handleGradeChange(student.nisn, "uas", parseInt(e.target.value) || 0)}
                              className="w-16 bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-bold text-xs"
                            />
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-emerald-800 font-mono text-xs bg-emerald-50/20">{totalAverage.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <input 
                              type="text" 
                              value={score.note}
                              onChange={(e) => handleGradeNote(student.nisn, e.target.value)}
                              placeholder="Tulis umpan balik..."
                              className="w-full bg-transparent border-b border-slate-200 focus:border-slate-400 outline-none text-xs py-1"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Module: REKAP */}
        {activeModule === "rekap" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="space-y-6 max-w-5xl"
          >
            {/* Filter Panel */}
            <div className="bg-gradient-to-r from-emerald-50/50 via-teal-50/50 to-cyan-50/50 border border-emerald-200/60 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-emerald-950 flex items-center gap-1.5 font-sans">
                    <span className="material-symbols-outlined text-emerald-800 font-bold">analytics</span>
                    Rekapitulasi Absensi &amp; Nilai Rapot Per Kelas
                  </h3>
                  <p className="text-xs text-emerald-800/80">
                    Pilih target kelas dan mata pelajaran untuk memantau rekam jejak sekaligus mengekspor berkas Rapot.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-black text-emerald-800/75">Pilih Kelas</span>
                    <select 
                      value={rekapClassGroup} 
                      onChange={(e) => setRekapClassGroup(e.target.value)}
                      className="bg-white border border-emerald-200 text-emerald-950 rounded-xl px-3 py-1.5 text-xs font-bold outline-none ring-offset-background focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      {allowedClasses.map((cl) => (
                        <option key={cl} value={cl}>Kelas {cl}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-black text-emerald-800/75">Pilih Mata Pelajaran</span>
                    <select 
                      value={rekapSubject} 
                      onChange={(e) => setRekapSubject(e.target.value)}
                      className="bg-white border border-emerald-200 text-emerald-950 rounded-xl px-3 py-1.5 text-xs font-bold outline-none ring-offset-background focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      {Array.from(new Set<string>(allowedSubjects.map((s) => translateSubjectCodeToName(s.name)))).map((translatedName) => (
                        <option key={translatedName} value={translatedName}>{translatedName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-black text-emerald-800/75">Pilih Periode</span>
                    <select 
                      value={rekapPeriod} 
                      onChange={(e) => setRekapPeriod(e.target.value as any)}
                      className="bg-white border border-emerald-200 text-emerald-950 rounded-xl px-3 py-1.5 text-xs font-bold outline-none ring-offset-background focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="1_MINGGU">1 Minggu</option>
                      <option value="1_BULAN">Per Bulan</option>
                      <option value="1_SEMESTER">1 Semester</option>
                    </select>
                  </div>
                  {rekapPeriod === "1_BULAN" && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-black text-emerald-800/75">Pilih Bulan</span>
                      <select 
                        value={rekapMonth} 
                        onChange={(e) => setRekapMonth(e.target.value)}
                        className="bg-white border border-emerald-200 text-emerald-950 rounded-xl px-3 py-1.5 text-xs font-bold outline-none ring-offset-background focus:ring-1 focus:ring-emerald-500 cursor-pointer w-32"
                      >
                        <option value="01">Januari</option>
                        <option value="02">Februari</option>
                        <option value="03">Maret</option>
                        <option value="04">April</option>
                        <option value="05">Mei</option>
                        <option value="06">Juni</option>
                        <option value="07">Juli</option>
                        <option value="08">Agustus</option>
                        <option value="09">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bento Quick Statistics */}
            {(() => {
              const studentsInClass = students.filter(s => normalizeClassGroup(s.classGroup) === normalizeClassGroup(rekapClassGroup));
              const totalStudents = studentsInClass.length;
              const matchedSubject = allowedSubjects.find(s => (s.name === rekapSubject || translateSubjectCodeToName(s.name) === rekapSubject) && normalizeClassGroup(s.classGroup) === normalizeClassGroup(rekapClassGroup));
              const targetSubjectId = matchedSubject?.id || "";

              let sumAttendancePct = 0;
              let sumFinalGrades = 0;
              let passCount = 0;

              studentsInClass.forEach(st => {
                const recs = attendanceRecords.filter(r => {
                  const recSubject = subjects.find(s => s.id === r.subjectId);
                  const matchesSubject = r.subjectId === targetSubjectId || 
                    (recSubject !== undefined && (recSubject.name === rekapSubject || translateSubjectCodeToName(recSubject.name) === rekapSubject) && normalizeClassGroup(recSubject.classGroup) === normalizeClassGroup(rekapClassGroup));

                  if (r.nisn !== st.nisn || !matchesSubject) return false;
                  if (rekapPeriod === "1_MINGGU") {
                    const recordDate = new Date(r.date);
                    const now = new Date();
                    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return recordDate >= cutoff && recordDate <= now;
                  } else if (rekapPeriod === "1_BULAN") {
                    if (!r.date) return false;
                    const parts = r.date.split("-");
                    return parts[1] === rekapMonth;
                  } else {
                    return !r.semester || r.semester === academicSemester;
                  }
                });
                const h = recs.filter(r => r.status === "H").length;
                const attendPct = recs.length > 0 ? (h / recs.length) * 100 : 100;
                sumAttendancePct += attendPct;

                const gr = gradeRecords.find(g => {
                  const recSubject = subjects.find(s => s.id === g.subjectId);
                  const matchesSubject = g.subjectId === targetSubjectId || 
                    (recSubject !== undefined && (recSubject.name === rekapSubject || translateSubjectCodeToName(recSubject.name) === rekapSubject) && normalizeClassGroup(recSubject.classGroup) === normalizeClassGroup(rekapClassGroup));
                  return g.nisn === st.nisn && matchesSubject;
                });
                const fn = gr?.finalScore ?? 0;
                sumFinalGrades += fn;
                if (fn >= 75) passCount++;
              });

              const avgAttendance = totalStudents > 0 ? Math.round(sumAttendancePct / totalStudents) : 100;
              const avgGrade = totalStudents > 0 ? Math.round((sumFinalGrades / totalStudents) * 10) / 10 : 0;
              const passPct = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-sky-50 shadow-xs border border-sky-200/70 text-sky-900 space-y-1">
                    <p className="text-[10px] uppercase font-extrabold tracking-wider text-sky-850">Total Peserta Siswa</p>
                    <p className="text-2xl font-black">{totalStudents}</p>
                    <div className="text-[10px] text-sky-800 font-medium">Dalam Kelas {rekapClassGroup}</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 shadow-xs border border-amber-200/70 text-amber-900 space-y-1">
                    <p className="text-[10px] uppercase font-extrabold tracking-wider text-amber-850">Rata Kehadiran</p>
                    <p className="text-2xl font-black">{avgAttendance}%</p>
                    <div className="text-[10px] text-amber-800 font-medium">Mapel {rekapSubject} ({rekapPeriod === "1_MINGGU" ? "1 Minggu" : rekapPeriod === "1_BULAN" ? "Bulanan" : "1 Semester"})</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 shadow-xs border border-indigo-200/70 text-indigo-900 space-y-1">
                    <p className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-850">Rata Nilai Akhir</p>
                    <p className="text-2xl font-black">{avgGrade} / 100</p>
                    <div className="text-[10px] text-indigo-800 font-medium">Sesuai KKM &amp; Tugas</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 shadow-xs border border-emerald-200/70 text-emerald-950 space-y-1">
                    <p className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-850">Tuntas KKM</p>
                    <p className="text-2xl font-black">{passPct}%</p>
                    <div className="text-[10px] text-emerald-800 font-medium">{passCount} dari {totalStudents} Lulus KKM (75)</div>
                  </div>
                </div>
              );
            })()}

            {/* TWIN BLOCKS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Box 1: Rekap Absensi */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-800">event_note</span>
                    <span className="text-xs font-extrabold text-slate-800">REKAP ABSENSI KELAS ({rekapPeriod === "1_MINGGU" ? "1 MINGGU" : rekapPeriod === "1_BULAN" ? "BULANAN" : "1 SEMESTER"})</span>
                  </div>
                  <button
                    onClick={downloadRekapAbsensi}
                    className="text-[11px] font-bold bg-[#b45309] hover:bg-[#92400e] text-white rounded-lg px-3 py-1.5 inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">download</span>
                    <span>Download Excel</span>
                  </button>
                </div>
                <div className="p-4 flex-1 overflow-x-auto text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-450 uppercase font-black tracking-wider text-[9px] bg-slate-50/50">
                        <th className="py-2.5 px-2">No</th>
                        <th className="py-2.5 px-2">Nama</th>
                        <th className="py-2.5 px-2 text-center">H</th>
                        <th className="py-2.5 px-2 text-center">I</th>
                        <th className="py-2.5 px-2 text-center">S</th>
                        <th className="py-2.5 px-2 text-center">A</th>
                        <th className="py-2.5 px-2 text-right">Rasio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const list = students.filter(s => normalizeClassGroup(s.classGroup) === normalizeClassGroup(rekapClassGroup));
                        const matchedSubject = allowedSubjects.find(s => (s.name === rekapSubject || translateSubjectCodeToName(s.name) === rekapSubject) && normalizeClassGroup(s.classGroup) === normalizeClassGroup(rekapClassGroup));
                        const targetSubjectId = matchedSubject?.id || "";
                        if (list.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400"> Tidak ada siswa di kelas ini </td>
                            </tr>
                          );
                        }
                        return list.map((st, i) => {
                          const recs = attendanceRecords.filter(r => {
                            const recSubject = subjects.find(s => s.id === r.subjectId);
                            const matchesSubject = r.subjectId === targetSubjectId || 
                              (recSubject !== undefined && (recSubject.name === rekapSubject || translateSubjectCodeToName(recSubject.name) === rekapSubject) && normalizeClassGroup(recSubject.classGroup) === normalizeClassGroup(rekapClassGroup));

                            if (r.nisn !== st.nisn || !matchesSubject) return false;
                            if (rekapPeriod === "1_MINGGU") {
                              const recordDate = new Date(r.date);
                              const now = new Date();
                              const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                              return recordDate >= cutoff && recordDate <= now;
                            } else if (rekapPeriod === "1_BULAN") {
                              if (!r.date) return false;
                              const parts = r.date.split("-");
                              return parts[1] === rekapMonth;
                            } else {
                              return !r.semester || r.semester === academicSemester;
                            }
                          });
                          const h = recs.filter(r => r.status === "H").length;
                          const iz = recs.filter(r => r.status === "I").length;
                          const s = recs.filter(r => r.status === "S").length;
                          const a = recs.filter(r => r.status === "A").length;
                          const total = recs.length;
                          const pct = total > 0 ? Math.round((h / total) * 100) : 100;
                          return (
                            <tr key={st.nisn} className="border-b border-slate-100 hover:bg-slate-50/40">
                              <td className="py-2 px-2 font-mono">{i + 1}</td>
                              <td className="py-2 px-2 font-bold text-slate-800 truncate max-w-[130px]" title={st.name}>{st.name}</td>
                              <td className="py-2 px-2 text-center font-bold text-emerald-800">{h}</td>
                              <td className="py-2 px-2 text-center font-bold text-sky-800">{iz}</td>
                              <td className="py-2 px-2 text-center font-bold text-amber-800">{s}</td>
                              <td className="py-2 px-2 text-center font-bold text-rose-800">{a}</td>
                              <td className="py-2 px-2 text-right">
                                <span className={`px-1.5 py-0.5 rounded-full font-mono font-bold ${
                                  pct >= 90 ? "bg-emerald-50 text-emerald-800" : pct >= 75 ? "bg-amber-50 text-amber-805" : "bg-rose-50 text-rose-800"
                                }`}>{pct}%</span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Box 2: Rekap Nilai & Rapot */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-800">military_tech</span>
                    <span className="text-xs font-extrabold text-slate-800">REKAP NILAI AKADEMIK</span>
                  </div>
                  <button
                    onClick={downloadRekapNilai}
                    className="text-[11px] font-bold bg-[#4338ca] hover:bg-[#3730a3] text-white rounded-lg px-3 py-1.5 inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">download</span>
                    <span>Download Excel</span>
                  </button>
                </div>
                <div className="p-4 flex-1 overflow-x-auto text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-450 uppercase font-black tracking-wider text-[9px] bg-slate-50/50">
                        <th className="py-2.5 px-2">No</th>
                        <th className="py-2.5 px-2">Nama</th>
                        <th className="py-2.5 px-2 text-center">Tgs</th>
                        <th className="py-2.5 px-2 text-center">UTS</th>
                        <th className="py-2.5 px-2 text-center">UAS</th>
                        <th className="py-2.5 px-2 text-center">NA</th>
                        <th className="py-2.5 px-2 text-right">Lulus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const list = students.filter(s => normalizeClassGroup(s.classGroup) === normalizeClassGroup(rekapClassGroup));
                        const matchedSubject = allowedSubjects.find(s => (s.name === rekapSubject || translateSubjectCodeToName(s.name) === rekapSubject) && normalizeClassGroup(s.classGroup) === normalizeClassGroup(rekapClassGroup));
                        const targetSubjectId = matchedSubject?.id || "";
                        if (list.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400"> Tidak ada siswa di kelas ini </td>
                            </tr>
                          );
                        }
                        return list.map((st, i) => {
                          const gr = gradeRecords.find(g => {
                            const recSubject = subjects.find(s => s.id === g.subjectId);
                            const matchesSubject = g.subjectId === targetSubjectId || 
                              (recSubject !== undefined && (recSubject.name === rekapSubject || translateSubjectCodeToName(recSubject.name) === rekapSubject) && normalizeClassGroup(recSubject.classGroup) === normalizeClassGroup(rekapClassGroup));
                            return g.nisn === st.nisn && matchesSubject;
                          });
                          const t = gr?.assignmentScore ?? 0;
                          const uts = gr?.utsScore ?? 0;
                          const uas = gr?.uasScore ?? 0;
                          const fn = gr?.finalScore ?? 0;
                          const status = fn >= 75 ? "LULUS" : "REMED";
                          return (
                            <tr key={st.nisn} className="border-b border-slate-100 hover:bg-slate-50/40">
                              <td className="py-2 px-2 font-mono">{i + 1}</td>
                              <td className="py-2 px-2 font-bold text-slate-800 truncate max-w-[130px]" title={st.name}>{st.name}</td>
                              <td className="py-2 px-2 text-center font-bold text-slate-700">{t}</td>
                              <td className="py-2 px-2 text-center font-bold text-slate-700">{uts}</td>
                              <td className="py-2 px-2 text-center font-bold text-slate-700">{uas}</td>
                              <td className="py-2 px-2 text-center font-black text-amber-800 bg-amber-50/30 font-mono text-xs">{fn}</td>
                              <td className="py-2 px-2 text-right font-bold">
                                <span className={`px-2 py-0.5 rounded-md ${
                                  status === "LULUS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                }`}>{status}</span>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Module: MATERI & TUGAS (E-LEARNING TEACHER PORTAL) */}
        {activeModule === "materi_tugas" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            {/* Header banner */}
            <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-6 rounded-3xl text-white shadow-md border border-emerald-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in_school">
              <div>
                <span className="text-[10px] bg-white/20 text-[#acf59a] font-extrabold uppercase px-2.5 py-1 rounded-full border border-white/10 tracking-widest">Portal Manajemen E-Learning SIALMA</span>
                <h3 className="text-2xl font-black mt-2 tracking-tight">Materi &amp; Tugas (E-Learning)</h3>
                <p className="text-xs text-emerald-100 mt-1 font-medium">Unggah materi diktat (modul), publikasikan penugasan terstruktur, dan lakukan penilaian langsung terhadap berkas kumpul siswa.</p>
              </div>
              <div className="text-right text-xs bg-black/25 p-3 rounded-2xl border border-white/5 select-none">
                <span className="font-bold text-slate-350">SEMESTER: </span>
                <span className="font-black text-amber-300">{academicSemester === "1" ? "1 (GANJIL)" : "2 (GENAP)"}</span>
              </div>
            </div>

            {/* Quick Interactive Forms Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Form A: Upload Module */}
              <MaterialUploadForm
                allowedSubjects={allowedSubjects}
                allowedClasses={allowedClasses}
                profileName={profile.name}
                academicSemester={academicSemester}
                onAddMaterial={onAddMaterial}
              />

              {/* Form B: Create Structed Assignment */}
              <AssignmentPublishForm
                allowedSubjects={allowedSubjects}
                allowedClasses={allowedClasses}
                academicSemester={academicSemester}
                onAddAssignment={onAddAssignment}
              />

            </div>

            {/* Submissions Monitoring & Inline Grading Segment */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="px-6 py-4.5 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">Pemantauan Kumpulan &amp; Jawaban Tugas Siswa</h4>
                  <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Semester {academicSemester === "1" ? "Ganjil" : "Genap"}</p>
                </div>
                <span className="text-[10.5px] font-extrabold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-150">
                  Total Masuk: {(submissions || []).length} Berkas
                </span>
              </div>

              {/* Submissions List Grid */}
              {(() => {
                const subms = (submissions || []).filter(subm => {
                  const asg = assignments.find(a => a.id === subm.assignmentId);
                  return asg && allowedClasses.includes(asg.classGroup);
                });

                if (subms.length === 0) {
                  return (
                    <div className="p-12 text-center text-slate-400 italic text-xs">
                      <span className="material-symbols-outlined text-4xl block text-slate-200 mb-1.5 font-black">folder_open</span>
                      Belum ada siswa yang mengumpulkan tugas e-learning saat ini.
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-slate-100">
                    {subms.map((subm) => {
                      const asg = assignments.find(a => a.id === subm.assignmentId);
                      const isGraded = typeof subm.score !== "undefined";

                      return (
                        <div key={subm.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black text-[#0f766e] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">
                                {asg ? asg.classGroup : "Umum"}
                              </span>
                              <span className="text-[10px] font-black text-sky-850 bg-sky-50 px-2 py-0.5 rounded border border-sky-150">
                                {asg ? asg.title : "Tugas Umum"}
                              </span>
                            </div>
                            <h5 className="font-extrabold text-slate-800 text-sm leading-tight mt-1">{subm.studentName}</h5>
                            <p className="text-xs text-slate-550 flex items-center gap-1.5 font-medium">
                              <span className="material-symbols-outlined text-sm text-[14px]">attachment</span>
                              File: <span className="font-mono text-slate-600 bg-slate-105 p-0.5 px-1.5 rounded">{subm.fileName}</span> • Diserahkan: {new Date(subm.submittedAt).toLocaleDateString("id-ID")}
                            </p>
                          </div>

                          {/* Inline Grading Form */}
                          <div className="w-full md:w-auto bg-slate-50 p-4 rounded-2xl border border-slate-200/80 min-w-[280px]">
                            {isGraded ? (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                  <span>STATUS NILAI:</span>
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-150 rounded">SUDAH DINILAI</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-1 bg-white p-2 border rounded-xl justify-center">
                                  <span className="text-xl font-black text-slate-800 font-mono">{subm.score}</span>
                                  <span className="text-slate-400 font-semibold text-xs">/ 100</span>
                                </div>
                                {subm.feedback && (
                                  <p className="text-[10.5px] text-slate-500 italic max-w-[240px] truncate mt-1">Feedback: "{subm.feedback}"</p>
                                )}
                              </div>
                            ) : (
                              /* Action Grade */
                              <SubmissionGradingForm
                                submissionId={subm.id}
                                onGradeSubmission={onGradeSubmission}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* Module: KUIS */}
        {activeModule === "kuis" && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="space-y-8 max-w-5xl"
          >
            {/* Create New Quiz Form */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Buat &amp; Publikasi Kuis Baru</h3>
              </div>
              <form onSubmit={handleCreateQuiz} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Judul Evaluasi Kuis</label>
                    <input 
                      type="text" 
                      required 
                      value={newQuizTitle} 
                      onChange={(e) => setNewQuizTitle(e.target.value)}
                      placeholder="Contoh: Trigonometri Lanjut Bab 3"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-emerald-805"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Durasi Pengerjaan (Menit)</label>
                    <input 
                      type="number" 
                      required 
                      value={newQuizDuration} 
                      onChange={(e) => setNewQuizDuration(parseInt(e.target.value) || 45)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-emerald-805"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Mata Pelajaran Pengampu</label>
                    <select 
                      value={newQuizSubject} 
                      onChange={(e) => setNewQuizSubject(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    >
                      {Array.from(new Set(allowedSubjects.map((s) => translateSubjectCodeToName(s.name)))).map((translatedName) => (
                        <option key={translatedName} value={translatedName}>
                          {translatedName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Peruntukan Target Kelas</label>
                    <select 
                      value={newQuizClassGroup} 
                      onChange={(e) => setNewQuizClassGroup(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm file:border-slate-200 outline-none"
                    >
                      {allowedClasses.map((cl) => (
                        <option key={cl} value={cl}>
                          Kelas {cl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Batas Akhir (Tanggal)</label>
                    <input 
                      type="date" 
                      required 
                      value={newQuizDueDate}
                      onChange={(e) => setNewQuizDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* INTERACTIVE QUESTION DRAFTSMAN */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <span className="material-symbols-outlined text-[18px] text-emerald-800 font-bold">edit_note</span>
                      Draf Soal Kuis Ke-{draftQuestions.length + 1}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setShowImportArea(!showImportArea)}
                        className="text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-xs">upload_file</span>
                        <span>Impor Massal (Excel/Word)</span>
                      </button>
                      <span className="text-xs font-black text-emerald-850 bg-emerald-100 px-3.5 py-1 rounded-lg">
                        {draftQuestions.length} Soal Ter-draft
                      </span>
                    </div>
                  </div>

                  {/* Mass Import Option Slide Area */}
                  {showImportArea && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3 text-xs"
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-bold text-amber-900 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">info</span>
                          Panel Integrasi Uploader Bank Soal Massal
                        </p>
                        <span className="text-[10px] text-amber-700 font-bold">Mendukung Excel (.csv) &amp; Copy-Paste Word</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-slate-600 font-bold">1. Unggah File Ekspor Excel (.csv/.txt)</label>
                          <input 
                            type="file" 
                            accept=".csv,.txt"
                            onChange={handleCsvFileImport}
                            className="w-full text-xs text-slate-500 bg-white border border-amber-250 rounded-lg p-2 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-450">Format Kolom Excel: <code className="bg-white px-1 py-0.5 rounded border border-slate-100">Soal, OpsiA, OpsiB, OpsiC, OpsiD, OpsiE, Kunci(A/B/C/D/E)</code></p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-slate-600 font-bold">2. Atau Tempel Soal dari MS Word / Text</label>
                          <textarea
                            rows={3}
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="Contoh format tempel:&#10;Soal: Berapa jumlah sudut segitiga?&#10;A. 180&#10;B. 90&#10;C. 360&#10;D. 120&#10;E. 45&#10;Jawaban: A"
                            className="w-full bg-white border border-amber-250 rounded-lg p-2 text-[11px] outline-none font-mono focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
                          />
                          <button 
                            type="button"
                            onClick={handleImportBatchQuestions}
                            className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-3 py-1.5 rounded-lg w-full flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[15px]">flash_on</span>
                            Proses &amp; Masukkan Draf Soal
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Pertanyaan / Soal</label>
                      <textarea
                        rows={2}
                        value={currentDraftQuestion}
                        onChange={(e) => setCurrentDraftQuestion(e.target.value)}
                        placeholder="Contoh: Berapakah hasil turunan dari fungsi f(x) = 5x^3 - 2x?"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-emerald-800"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Pilihan Jawaban A*</label>
                        <input
                          type="text"
                          value={currentDraftOptA}
                          onChange={(e) => setCurrentDraftOptA(e.target.value)}
                          placeholder="Ketik opsi jawaban A"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Pilihan Jawaban B*</label>
                        <input
                          type="text"
                          value={currentDraftOptB}
                          onChange={(e) => setCurrentDraftOptB(e.target.value)}
                          placeholder="Ketik opsi jawaban B"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Pilihan Jawaban C*</label>
                        <input
                          type="text"
                          value={currentDraftOptC}
                          onChange={(e) => setCurrentDraftOptC(e.target.value)}
                          placeholder="Ketik opsi jawaban C"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Pilihan Jawaban D*</label>
                        <input
                          type="text"
                          value={currentDraftOptD}
                          onChange={(e) => setCurrentDraftOptD(e.target.value)}
                          placeholder="Ketik opsi jawaban D"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-800"
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Pilihan Jawaban E (Opsi Kelima - Baru)</label>
                        <input
                          type="text"
                          value={currentDraftOptE}
                          onChange={(e) => setCurrentDraftOptE(e.target.value)}
                          placeholder="Ketik opsi jawaban E (opsional)"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-800"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-end justify-between pt-3 border-t border-slate-100">
                      <div className="w-full sm:w-1/2">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Opsi Yang Benar (Kunci)*</label>
                        <select
                          value={currentDraftCorrect}
                          onChange={(e) => setCurrentDraftCorrect(parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-800"
                        >
                          <option value={0}>A (Opsi Jawaban Pertama)</option>
                          <option value={1}>B (Opsi Jawaban Kedua)</option>
                          <option value={2}>C (Opsi Jawaban Ketiga)</option>
                          <option value={3}>D (Opsi Jawaban Keempat)</option>
                          <option value={4}>E (Opsi Jawaban Kelima)</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddDraftQuestion}
                        className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-805 border border-emerald-300 text-xs font-bold px-4 py-2.5 rounded-lg transition-transform active:scale-[0.98] inline-flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px] font-bold">add_circle</span>
                        <span>Pasang Draf Soal</span>
                      </button>
                    </div>
                  </div>

                  {draftQuestions.length > 0 && (
                    <div className="border-t border-slate-200/80 pt-3 space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Butir Soal Dalam Draft saat ini:</p>
                      <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1.5">
                        {draftQuestions.map((q, qidx) => (
                          <div key={q.id} className="flex justify-between items-start p-2.5 bg-white border border-slate-100 rounded-lg">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-800">{qidx + 1}. {q.questionText}</p>
                              <p className="text-[10px] text-emerald-800 font-medium">Opsi Benar: {q.options[q.correctIndex]}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDraftQuestions(draftQuestions.filter((dq) => dq.id !== q.id));
                                showToast("Soal dihapus dari draf!");
                              }}
                              className="text-rose-600 hover:bg-rose-50 p-1 rounded-full text-xs"
                              title="Hapus Soal"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex justify-end">
                  <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer">
                    Terbitkan Kuis Sekarang
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Quizzes Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-800">Daftar Kuis Terbit</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-bold text-xs text-slate-500">Judul Kuis</th>
                      <th className="px-6 py-4 font-bold text-xs text-slate-500">Mata Pelajaran</th>
                      <th className="px-6 py-4 font-bold text-xs text-slate-500">Target Kelas</th>
                      <th className="px-6 py-4 font-bold text-xs text-slate-500">Durasi</th>
                      <th className="px-6 py-4 font-bold text-xs text-slate-500">Batas Waktu</th>
                      <th className="px-6 py-4 font-bold text-xs text-slate-500">Butir Soal</th>
                      <th className="px-6 py-4 font-bold text-xs text-slate-500">Status</th>
                      <th className="px-6 py-4 font-bold text-xs text-slate-500 text-center">Aksi / Sesi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {quizzes.map((quiz) => (
                      <tr key={quiz.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-800">{quiz.title}</td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500">{quiz.subject}</td>
                        <td className="px-6 py-4 text-xs font-bold text-emerald-800">
                          <span className="bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{quiz.classGroup}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{quiz.durationMinutes} mnt</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{new Date(quiz.dueDate).toLocaleDateString("id-ID")}</td>
                        <td className="px-6 py-4 font-mono text-xs">{quiz.questionsCount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            quiz.status === "Aktif" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-slate-200 text-slate-500"
                          }`}>
                            {quiz.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedQuizDetails(quiz)}
                              className="bg-emerald-50/50 hover:bg-emerald-55 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 hover:border-emerald-300 flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                              <span>Periksa Hasil ({quiz.submissions?.length || 0})</span>
                            </button>
                            <button
                              onClick={() => {
                                askConfirm(
                                  "Hapus Kuis",
                                  `Apakah Anda yakin ingin menghapus kuis "${quiz.title}"? Tindakan ini akan menghapus kuis beserta seluruh hasil pengerjaan siswa secara permanen.`,
                                  () => {
                                    if (onSetQuizzes) {
                                      onSetQuizzes(quizzes.filter(q => q.id !== quiz.id));
                                      if (selectedQuizDetails?.id === quiz.id) {
                                        setSelectedQuizDetails(null);
                                      }
                                    }
                                  }
                                );
                              }}
                              className="text-rose-600 hover:bg-rose-50 border border-rose-150 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                              title="Hapus Kuis"
                            >
                              <span className="material-symbols-outlined text-sm block">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QUIZ SUBMISSIONS INSPECTOR BOARD */}
            {selectedQuizDetails && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2 font-sans">
                      <span className="material-symbols-outlined text-emerald-400">group</span>
                      <span>Hasil &amp; Penilaian Kuis: {selectedQuizDetails.title}</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 font-sans">
                      Kelas: {selectedQuizDetails.classGroup} • Mata Pelajaran: {selectedQuizDetails.subject}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedQuizDetails(null)}
                    className="text-slate-300 hover:text-white p-1"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100/50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">No</th>
                          <th className="px-6 py-4">Nama Siswa</th>
                          <th className="px-6 py-4">Status Pengerjaan (Selesai/Tanggal)</th>
                          <th className="px-6 py-4 font-mono text-center">Nilai Evaluasi Otomatis</th>
                          <th className="px-6 py-4 text-center">Ubah / Sesuaikan Nilai</th>
                          <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {students
                          .filter((s) => s.classGroup === selectedQuizDetails.classGroup)
                          .map((student, sidx) => {
                            const sub = (selectedQuizDetails.submissions || []).find(
                              (item) => item.studentId === student.nisn
                            );
                            const tempInputId = `manual-score-${student.nisn}`;
                            return (
                              <tr key={student.nisn} className="hover:bg-slate-50/40">
                                <td className="px-6 py-4 font-mono text-xs text-slate-400">{sidx + 1}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">
                                  {student.name}
                                  <p className="text-[10px] text-slate-400 font-mono">NISN: {student.nisn}</p>
                                </td>
                                <td className="px-6 py-4">
                                  {sub ? (
                                    <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                      <span>Selesai ({new Date(sub.completedAt).toLocaleDateString("id-ID")})</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
                                      <span className="material-symbols-outlined text-[13px]">pending</span>
                                      <span>Belum Mengerjakan</span>
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-slate-800 font-mono">
                                  {sub ? `${sub.score} / 100` : "-"}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <input
                                    type="number"
                                    id={tempInputId}
                                    defaultValue={sub ? sub.score : 80}
                                    min={0}
                                    max={100}
                                    className="w-16 bg-slate-50 border border-slate-200 focus:border-emerald-800 rounded-lg p-1 text-center font-bold text-xs outline-none"
                                  />
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => {
                                      const inputEl = document.getElementById(tempInputId) as HTMLInputElement;
                                      const val = parseInt(inputEl?.value) || 0;
                                      handleGradeSubmission(student.nisn, val);
                                    }}
                                    className="bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 mx-auto cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-xs">save</span>
                                    <span>Simpan Nilai</span>
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
              {/* Profile Details Form */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800">Modifikasi Informasi Biodata Pendidik</h3>
                </div>
                <form onSubmit={handleProfileSave} className="p-6 space-y-4">
                  {/* Photo Edit Segment */}
                  <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <img 
                      src={avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256"} 
                      alt="Avatar Preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-emerald-805"
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
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama Lengkap &amp; Gelar</label>
                    <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium text-sm outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/10 transition-all" value={name} onChange={(e) => setName(e.target.value)} type="text" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Institusi Resmi</label>
                    <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium text-sm outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/10 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} type="text" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nomor Telepon Seluler</label>
                      <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={phone} onChange={(e) => setPhone(e.target.value)} type="text" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Posisi / Jabatan Pendidik</label>
                      <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={title} onChange={(e) => setTitle(e.target.value)} type="text" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Biografi Profesional</label>
                    <textarea rows={3} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={bio} onChange={(e) => setBio(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Alamat Kantor / Komuter</label>
                    <textarea rows={2} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm px-6 py-2 rounded-xl transition-all">
                      Perbarui Data Profil
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Change password and theme options */}
              <div className="lg:col-span-4 space-y-6 flex flex-col">
                {/* Security change password */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 flex-1">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <span className="material-symbols-outlined text-emerald-850">security</span>
                    <h4>Ganti Sandi</h4>
                  </div>
                  <form onSubmit={handlePasswordSave} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-0.5">Sandi Lama</label>
                      <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} type="password" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-0.5">Sandi Baru</label>
                      <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" />
                    </div>
                    <button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-2 rounded-lg">
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
          <a href="#help" onClick={(e) => { e.preventDefault(); alert("Silakan hubungi helpdesk kami di support@ma-alsum.edu."); }} className="hover:text-emerald-800 transition-colors">Help Desk</a>
          <span>•</span>
          <a href="#tos" onClick={(e) => { e.preventDefault(); alert("SIALMA tunduk pada undang-undang hak cipta dan regulasi yayasan."); }} className="hover:text-emerald-800 transition-colors">Ketentuan</a>
          <span>•</span>
          <a href="#help" onClick={(e) => { e.preventDefault(); alert("Dokumen Panduan Guru sedang diunduh..."); }} className="hover:text-emerald-800 transition-colors">Buku Panduan PDF</a>
        </div>
      </footer>

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
