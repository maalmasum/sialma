import React, { useState, useEffect } from "react";
import { UserProfile, Announcement, SubjectItem, StudentItem, TeacherItem, QuizItem, SystemAuditLog, GradeRecord, AttendanceRecord, ScheduleItem } from "../types";
import { getSpecialSessionMeta } from "./AdminDashboard";

interface KepalaSekolahDashboardProps {
  profile: UserProfile;
  activeModule: string;
  announcements: Announcement[];
  subjects: SubjectItem[];
  students: StudentItem[];
  teachers: TeacherItem[];
  quizzes: QuizItem[];
  attendanceRecords: AttendanceRecord[];
  gradeRecords: GradeRecord[];
  onSetAnnouncements: (announcements: Announcement[]) => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  schedules?: ScheduleItem[];
  activeCurriculum?: string;
  academicYear?: string;
  academicSemester?: string;
  theme?: "light" | "dark";
  setTheme?: (theme: "light" | "dark") => void;
}

export default function KepalaSekolahDashboard({
  profile,
  activeModule,
  announcements,
  subjects,
  students,
  teachers,
  quizzes,
  attendanceRecords,
  gradeRecords,
  onSetAnnouncements,
  onUpdateProfile,
  schedules = [],
  activeCurriculum = "Kurikulum Merdeka",
  academicYear = "2023/2024",
  academicSemester = "1",
  theme,
  setTheme,
}: KepalaSekolahDashboardProps) {

  // Dynamically calculate teaching hours based on subjects managed by the admin
  const getTeacherTeachingHours = (guru: any) => {
    const teacherSubjects = subjects.filter(
      (s) => s.teacherId === guru.nip || s.teacherName === guru.name
    );
    if (teacherSubjects.length > 0) {
      return teacherSubjects.reduce((sum, s) => sum + (s.hoursPerWeek || 0), 0);
    }
    return guru.teachingHours || 0;
  };

  // Time state
  const [clockString, setClockString] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const timeStr = now.toLocaleTimeString("id-ID", { hour12: false });
      setClockString(`${dateStr}, ${timeStr} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Persetujuan Pengumuman (Acceptance approvals simulation)
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: "p-1", title: "Rapat Kurikulum Akhir Semester Genap", author: "Kurikulum MA", time: "2 jam yang lalu", type: "Rapat" },
    { id: "p-2", title: "Libur Nasional Maulid Nabi Muhammad", author: "Tata Usaha", time: "4 jam yang lalu", type: "Libur" },
  ]);

  // Profile Settings
  const [name, setName] = useState(profile.name || "");
  const [email, setEmail] = useState(profile.email || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || "");
  const [bio, setBio] = useState(profile.biodata || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [address, setAddress] = useState(profile.address || "");

  // Dynamically sync inputs with changes in the profile prop
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
  const [isThemeDark, setIsThemeDark] = useState(false);

  // Kinerja Review State
  const [selectedGuruForReview, setSelectedGuruForReview] = useState<TeacherItem | null>(null);
  const [performanceFormReview, setPerformanceFormReview] = useState("");
  const [performanceFormRating, setPerformanceFormRating] = useState(5);
  const [customReviewsMap, setCustomReviewsMap] = useState<Record<string, { text: string; rating: number }>>({});

  const handleSavePerformanceReview = () => {
    if (!selectedGuruForReview) return;
    setCustomReviewsMap(prev => ({
      ...prev,
      [selectedGuruForReview.nip]: {
        text: performanceFormReview,
        rating: performanceFormRating
      }
    }));
    alert(`Review kinerja untuk ${selectedGuruForReview.name} berhasil disimpan dan disingkronkan ke log tata usaha.`);
    setSelectedGuruForReview(null);
    setPerformanceFormReview("");
  };

  const handleApprovalAction = (id: string, action: "Setuju" | "Tolak", title: string) => {
    setPendingApprovals((prev) => prev.filter((p) => p.id !== id));
    if (action === "Setuju") {
      // Simulate adding to announcements List
      const newAnn: Announcement = {
        id: `ann-app-${Date.now()}`,
        title,
        content: `Pemberitahuan resmi mengenai ${title} yang telah disetujui langsung oleh Kepala Sekolah Drs. Ahmad Mansur.`,
        target: "SEMUA",
        date: new Date().toISOString(),
        author: "Kepala Sekolah",
        icon: "verified",
      };
      onSetAnnouncements([newAnn, ...announcements]);
      alert(`Pengumuman "${title}" berhasil disetujui dan langsung dipublikasikan.`);
    } else {
      alert(`Permohonan "${title}" telah dikembalikan untuk direvisi.`);
    }
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
    alert("Profil Kepala Sekolah berhasil diperbarui!");
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
      alert("Harap isi password lama dan baru!");
      return;
    }
    setOldPassword("");
    setNewPassword("");
    alert("Password akun Kepala Sekolah berhasil diubah.");
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col relative text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 w-full z-45 bg-white/85 backdrop-blur-md border-b border-slate-200 flex justify-between items-center h-[64px] px-4 sm:px-6 md:px-8 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="font-sans text-base md:text-xl font-bold text-emerald-900 truncate">
            {activeModule === "beranda" && "Dashboard Pengawasan Kepala Sekolah"}
            {activeModule === "jadwal" && "Monitoring Ruang & Jadwal Kelas"}
            {activeModule === "monitoring-guru" && "Oversight & Kinerja Guru"}
            {activeModule === "monitoring-akademik" && "Monitoring Grafik Akademik"}
            {activeModule === "laporan-institusi" && "Laporan Kehadiran & Mutu Madrasah"}
            {activeModule === "pengaturan" && "Profil & Preferensi Kepsek"}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          <div className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-900 px-3.5 py-1.5 rounded-full border border-emerald-200 text-xs font-extrabold">
            <span className="material-symbols-outlined text-[15px] text-emerald-700">calendar_month</span>
            <span>TA: {academicYear} ({academicSemester === "1" ? "Ganjil" : "Genap"}) • {activeCurriculum}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl digital-clock-pod text-xs sm:text-sm shrink-0">
            <span className="material-symbols-outlined text-[15px] text-emerald-400 animate-pulse">schedule</span>
            <span className="tracking-wide hidden md:inline text-xs">{clockString}</span>
            <span className="tracking-wide md:hidden text-xs">
              {(() => {
                try {
                  const parts = clockString.split(",");
                  if (parts.length >= 3) {
                    const dayMonth = parts[1].trim().replace(" 2026", "").replace(" 2027", "");
                    const timeOnly = parts[2].trim().substring(0, 5);
                    const shortDay = parts[0].trim().substring(0, 3);
                    return `${shortDay}, ${dayMonth} • ${timeOnly}`;
                  }
                } catch (e) {}
                return clockString.includes(",") ? clockString.split(",").pop()?.trim() || clockString : clockString;
              })()}
            </span>
          </div>
          <button className="text-slate-500 hover:text-emerald-800 p-1" onClick={() => alert("Koneksi SIALMA ke Server Terenkripsi OK.")}>
            <span className="material-symbols-outlined text-xl">shield</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 md:p-8 flex-grow">
        
        {/* Module: BERANDA */}
        {activeModule === "beranda" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Welcome banner with Academic Year */}
            <div className="bg-emerald-900 p-8 rounded-2xl relative overflow-hidden flex flex-col justify-center text-white shadow-md">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl"></div>
              <div className="relative z-10-1">
                <span className="text-[10px] tracking-widest text-[#acf59a] font-extrabold uppercase">MA AL-MA'SUM MALAUSMA</span>
                <h3 className="text-3xl font-black mt-1 mb-2">
                  {(() => {
                    const hours = new Date().getHours();
                    if (hours < 11) return "Selamat Pagi";
                    if (hours < 15) return "Selamat Siang";
                    if (hours < 19) return "Selamat Sore";
                    return "Selamat Malam";
                  })()}, {profile.name}!
                </h3>
                <p className="text-sm text-emerald-100/95 font-medium flex items-center gap-2 flex-wrap">
                  <span>Kepala Sekolah • Tahun Ajaran {academicYear}</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="font-extrabold text-[11px] bg-emerald-950/45 text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">{activeCurriculum}</span>
                </p>
                <p className="text-xs text-emerald-200/80 italic mt-6 border-l-2 border-emerald-305/40 pl-4">
                  "Kepemimpinan yang visioner mendorong akselerasi mutu pendidikan menuju ekosistem madrasah yang unggul dan berprestasi."
                </p>
              </div>
            </div>

            {/* Top statistics overview bento */}
            {(() => {
              const totalCivitas = students.length + teachers.length + 1; // 1 represents the Principal
              const allFinalGrades = gradeRecords.map(g => g.finalScore);
              const calculatedAvgGrade = allFinalGrades.length > 0 
                ? Math.round((allFinalGrades.reduce((sum, val) => sum + val, 0) / allFinalGrades.length) * 10) / 10 
                : 82.5;
              
              const totalTeacherHours = teachers.reduce((sum, t) => sum + getTeacherTeachingHours(t), 0);
              const avgTeacherHrs = teachers.length > 0 ? Math.round(totalTeacherHours / teachers.length) : 24;

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Civitas Akademika</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{totalCivitas.toLocaleString("id-ID")}</h3>
                      <p className="text-[10px] text-emerald-700 font-bold mt-1 inline-flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">how_to_reg</span> {students.length} Siswa, {teachers.length} Guru
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-emerald-900 bg-emerald-50 p-3 rounded-lg text-3xl">groups</span>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rerata Nilai Madrasah</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{calculatedAvgGrade}</h3>
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-emerald-800 h-full" style={{ width: `${Math.min(calculatedAvgGrade, 100)}%` }}></div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-emerald-900 bg-emerald-50 p-3 rounded-lg text-3xl">analytics</span>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rerata Beban Kinerja Guru</p>
                      <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{avgTeacherHrs} Jam</h3>
                      <p className="text-[10px] text-slate-500 mt-1">Sesuai Standar Akademik</p>
                    </div>
                    <span className="material-symbols-outlined text-emerald-900 bg-emerald-50 p-3 rounded-lg text-3xl">assignment_ind</span>
                  </div>

                  <div className="bg-emerald-900 text-white p-6 rounded-2xl shadow-md relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Akreditasi BAN-S/M</p>
                      <h3 className="text-3xl font-black mt-1">A+</h3>
                    </div>
                    <p className="text-[10px] text-emerald-100 font-medium">Sertifikat Berlaku s/d 2028</p>
                    <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-7xl text-white/5">workspace_premium</span>
                  </div>
                </div>
              );
            })()}

            {/* Middle Section - Approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Approvals (Persetujuan Pengumuman) */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-800">gavel</span>
                      Butuh Persetujuan Kepala Sekolah ({pendingApprovals.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {pendingApprovals.length === 0 ? (
                      <div className="text-center p-8">
                        <span className="material-symbols-outlined text-slate-350 text-4xl">check_box</span>
                        <p className="text-xs text-slate-500 mt-2">Semua draf dan cuti permohonan diselesaikan.</p>
                      </div>
                    ) : (
                      pendingApprovals.map((req) => (
                        <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex gap-4 items-center">
                            <span className="material-symbols-outlined text-emerald-800 bg-emerald-50 p-2.5 rounded-lg shrink-0">campaign</span>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{req.title}</p>
                              <p className="text-slate-455 text-[11px] mt-0.5">Diajukan oleh: {req.author} • {req.time}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button 
                              onClick={() => handleApprovalAction(req.id, "Setuju", req.title)}
                              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-950 text-white font-bold rounded-lg transition-transform active:scale-95"
                            >
                              Setujui
                            </button>
                            <button 
                              onClick={() => handleApprovalAction(req.id, "Tolak", req.title)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-transform active:scale-95"
                            >
                              Tolak
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                  <button onClick={() => alert("Mengalihkan ke modul kearsipan dinas SIALMA...")} className="text-xs font-bold text-emerald-800 hover:underline">Lihat Kearsipan Dokumen &rarr;</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module: JADWAL (OVERVIEW) */}
        {activeModule === "jadwal" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Ruangan &amp; Utilisasi Jadwal Mingguan</h3>
                <p className="text-xs text-slate-500">Cek utilisasi ruang kelas reguler serta ruangan khusus lab.</p>
              </div>
              <button onClick={() => alert("Mengunduh monitoring cetakan master jadwal SIALMA...")} className="bg-emerald-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl">Ekspor Jadwal Sekolah</button>
            </div>
            {/* Timetable Grid View */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 font-sans">Master Jadwal Aktif SIALMA MA Al-Ma'sum ({activeCurriculum})</h4>
                  <p className="text-[11px] text-slate-500 font-sans">Menampilkan {schedules.length} slot penugasan kelas yang tersinkronisasi dari admin.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className="text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full uppercase">
                    Status: Sinkron &amp; Aktif
                  </span>
                </div>
              </div>

              {schedules.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs font-sans">
                  <span className="material-symbols-outlined text-amber-500 text-5xl mb-3 block">warning</span>
                  <p className="font-bold text-slate-700">Belum ada data jadwal pelajaran yang diinput di menu admin.</p>
                  <p className="mt-1">Silakan lakukan input jadwal melalui akun administrator untuk sinkronisasi otomatis.</p>
                </div>
              ) : (
                <div className="p-6 space-y-6 font-sans">
                  {/* Render day cards */}
                  {["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"].map((hari) => {
                    const daySchs = schedules.filter(s => s.day === hari);
                    if (daySchs.length === 0) return null;
                    return (
                      <div key={hari} className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                          <span className="w-2 h-5 bg-emerald-700 rounded-full inline-block"></span>
                          <h5 className="font-extrabold text-xs text-slate-700 tracking-wider uppercase">{hari}</h5>
                          <span className="text-[10px] bg-slate-200/80 text-slate-600 font-extrabold px-1.5 py-0.5 rounded-full">
                            {daySchs.length} Sesi Kelas
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {daySchs.map((sch) => {
                            const specialMeta = getSpecialSessionMeta(sch.subjectId);
                            const sub = specialMeta ? null : subjects.find(s => s.id === sch.subjectId);
                            const subName = specialMeta ? specialMeta.label : (sub ? sub.name : "Mata Pelajaran Tidak Diketahui");
                            const cls = specialMeta ? specialMeta.classGroup : (sub ? sub.classGroup : "-");
                            const teacher = specialMeta ? specialMeta.attendee : (sub ? sub.teacherName : "Guru belum diplot");
                            const cardBg = specialMeta ? specialMeta.cardStyle : "bg-white border-slate-150 hover:border-emerald-600";
                            const badgeColor = specialMeta ? specialMeta.badgeStyle : "bg-emerald-50 text-emerald-800 border-emerald-100";
                            const iconName = specialMeta ? specialMeta.icon : "meeting_room";
                            return (
                              <div key={sch.id} className={`border p-4 rounded-xl shadow-xs relative transition-all ${cardBg}`}>
                                <span className={`absolute top-3.5 right-3.5 font-extrabold text-[9px] px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                  {specialMeta ? specialMeta.categoryName : `Ruang: ${sch.room}`}
                                </span>
                                <div className="space-y-1">
                                  <p className={`text-[10px] font-extrabold ${specialMeta ? specialMeta.themeColor : "text-[#b45309]"}`}>{sch.timeSlot}</p>
                                  <h6 className={`font-bold text-xs leading-snug line-clamp-1 flex items-center gap-1 mt-0.5 ${
                                    specialMeta ? specialMeta.themeColor : "text-slate-800"
                                  }`}>
                                    {specialMeta && <span className="material-symbols-outlined text-[14px]">{iconName}</span>}
                                    {subName}
                                  </h6>
                                  <p className="text-[11px] font-medium text-slate-500">Kelas: {cls}</p>
                                  <p className="text-[11px] font-medium italic mt-1 flex items-center gap-1 text-slate-400">
                                    <span className="material-symbols-outlined text-[12px]">{specialMeta ? "restaurant" : "person"}</span>
                                    {teacher}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Module: MONITORING GURU */}
        {activeModule === "monitoring-guru" && (
          <div className="space-y-6 animate-fadeIn font-sans">
            {/* Overview Header banner */}
            <div className="bg-gradient-to-r from-teal-900 to-emerald-850 p-6 rounded-2xl text-white shadow-xs">
              <h3 className="text-lg font-black flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-300">supervised_user_circle</span>
                Panel Monitoring &amp; Supervisi Kinerja Dewan Guru
              </h3>
              <p className="text-xs text-emerald-100/90 mt-1 max-w-3xl">
                Lakukan pengawasan jam mengajar, rekap kuis, evaluasi nilai siswa, dan berikan feedback apresiasi maupun pembinaan bulanan kepada dewan guru.
              </p>
            </div>

            {/* Overview Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {teachers.map((guru) => {
                const teacherReview = customReviewsMap[guru.nip];
                const finalRating = teacherReview ? teacherReview.rating : guru.rating;
                
                // Live metrics calculated from state
                const teacherSubjects = subjects.filter(s => s.teacherName === guru.name);
                const teacherSubjectIds = teacherSubjects.map(s => s.id);
                const teacherSubjectNames = teacherSubjects.map(s => s.name);
                const teacherQuizCount = quizzes.filter(q => teacherSubjectNames.includes(q.subject)).length;
                const teacherGradesCount = gradeRecords.filter(g => teacherSubjectIds.includes(g.subjectId)).length;

                return (
                  <div key={guru.nip} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden">
                    {teacherReview && (
                      <span className="absolute top-2 right-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Telah Direview</span>
                    )}
                    <div className="space-y-4">
                      <div className="flex gap-3 items-start">
                        <img alt={guru.name} className="w-12 h-12 rounded-full object-cover shrink-0 border border-emerald-100 shadow-xs" src={guru.avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"} />
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 truncate text-sm">{guru.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">NIP: {guru.nip}</p>
                          <p className="text-[10px] text-emerald-800 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">Mapel: {guru.subject}</p>
                        </div>
                      </div>

                      {/* Calculated Metrics */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px] font-bold border border-slate-100">
                        <div className="text-slate-550">
                          E-Quiz Aktif: <span className="text-slate-800 font-extrabold">{teacherQuizCount} Kuis</span>
                        </div>
                        <div className="text-slate-550">
                          Murid Graded: <span className="text-slate-800 font-extrabold">{teacherGradesCount} Siswa</span>
                        </div>
                        <div className="text-slate-550">
                          Wali Kelas: <span className="text-slate-800 font-extrabold">{guru.classGroup !== "-" ? `Kelas ${guru.classGroup}` : "-"}</span>
                        </div>
                        <div className="text-slate-550">
                          Status: <span className="text-emerald-700 font-extrabold">{guru.status}</span>
                        </div>
                      </div>

                      {/* Review details */}
                      {teacherReview && (
                        <div className="bg-amber-50/70 border border-amber-150 p-3 rounded-xl text-[11px] text-slate-700 space-y-1">
                          <p className="font-extrabold text-amber-900 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-amber-700 font-bold">rate_review</span>
                            Catatan Kepala Sekolah:
                          </p>
                          <p className="italic">"{teacherReview.text}"</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                      {(() => {
                        const compiledHours = getTeacherTeachingHours(guru);
                        const teacherSubjects = subjects.filter(s => s.teacherId === guru.nip || s.teacherName === guru.name);
                        return (
                          <div className="space-y-2 w-full">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <p className="text-slate-500">Beban Tugas: <span className="text-slate-800 font-extrabold">{compiledHours} Jam / Minggu</span></p>
                              <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                <span>{finalRating} / 5.0</span>
                              </div>
                            </div>
                            {teacherSubjects.length > 0 && (
                              <div className="text-[10px] text-slate-500 font-medium bg-slate-50 p-2 rounded-xl space-y-0.5 border border-slate-100/50">
                                <p className="font-extrabold text-slate-600 uppercase text-[8px] tracking-wider mb-1">Rincian Jam Mengajar (Admin):</p>
                                {teacherSubjects.map((sub, sIdx) => (
                                  <div key={sub.id || sIdx} className="flex justify-between gap-2">
                                    <span className="truncate max-w-[150px] font-bold text-slate-700">{sub.name} ({sub.classGroup})</span>
                                    <span className="font-bold text-slate-800 shrink-0">{sub.hoursPerWeek} Jam</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      
                      <button 
                        onClick={() => {
                          setSelectedGuruForReview(guru);
                          setPerformanceFormReview(teacherReview ? teacherReview.text : "");
                          setPerformanceFormRating(teacherReview ? teacherReview.rating : Math.round(guru.rating));
                        }} 
                        className="w-full bg-[#1e4620] hover:bg-[#143016] text-white font-extrabold text-xs py-2 rounded-xl select-none transition-colors border border-emerald-900 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">edit_note</span>
                        <span>Evaluasi &amp; Terdokumentasi</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Dialog Backdrop Overlay */}
            {selectedGuruForReview && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <img alt={selectedGuruForReview.name} className="w-10 h-10 rounded-full object-cover border border-emerald-100 shadow-xs" src={selectedGuruForReview.avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"} />
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">Review Kinerja Dewan Guru</h4>
                        <p className="text-xs text-slate-400 font-medium">{selectedGuruForReview.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedGuruForReview(null)} 
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>

                  <hr className="border-slate-100 my-3" />

                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-450 tracking-wider">Penilaian Kinerja (Rating)</label>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            type="button"
                            onClick={() => setPerformanceFormRating(star)}
                            className="text-amber-400 focus:outline-none transition-transform hover:scale-110"
                          >
                            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: star <= performanceFormRating ? "'FILL' 1" : "'FILL' 0" }}>
                              star
                            </span>
                          </button>
                        ))}
                        <span className="text-xs text-slate-500 font-bold ml-2">Rating: {performanceFormRating}.0 / 5.0</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] uppercase font-black text-slate-450 tracking-wider">Catatan Pembinaan / Rekomendasi Apresiasi</label>
                      <textarea
                        rows={4}
                        value={performanceFormReview}
                        onChange={(e) => setPerformanceFormReview(e.target.value)}
                        placeholder="Tuliskan apresiasi kinerja mengajar atau masukan taktis pengembangan kurikulum untuk guru..."
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 font-semibold leading-relaxed focus:bg-white focus:border-emerald-600 outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 mt-6">
                    <button 
                      onClick={() => setSelectedGuruForReview(null)} 
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-xs py-2 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleSavePerformanceReview} 
                      className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">save</span>
                      <span>Simpan Review</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Module: MONITORING AKADEMIK */}
        {activeModule === "monitoring-akademik" && (
          <div className="space-y-6 animate-fadeIn font-sans">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-2xl text-white shadow-xs">
              <h3 className="text-lg font-black flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-300">analytics</span>
                Distribusi Performa Nilai Siswa Madrasah
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                Visualisasi dan peninjauan rata-rata pencapaian akademis per mata pelajaran serta pemetaan siswa berprestasi langsung dari database akademik SIALMA.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(() => {
                // Group grades by subject to find averages
                const subjectNames = Array.from(new Set(subjects.map(s => s.name)));
                const dataList = subjectNames.map((name) => {
                  const sRecords = gradeRecords.filter(g => {
                    const subj = subjects.find(sub => sub.id === g.subjectId);
                    return subj?.name === name;
                  });
                  const sumObj = sRecords.reduce((acc, curr) => acc + curr.finalScore, 0);
                  const avg = sRecords.length > 0 ? Math.round((sumObj / sRecords.length) * 10) / 10 : 75;
                  return { name, avg, totalGrades: sRecords.length };
                });

                return (
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-1.5 font-sans">
                      <span className="material-symbols-outlined text-indigo-700">analytics</span>
                      Nilai Rata-rata per Mata Pelajaran Aktif ({activeCurriculum})
                    </h4>
                    <div className="space-y-5">
                      {dataList.length === 0 ? (
                        <p className="text-xs text-slate-500">Belum ada nilai terinput dari guru mapel.</p>
                      ) : (
                        dataList.map((item) => (
                          <div key={item.name} className="space-y-1 font-sans">
                            <div className="flex justify-between items-center text-xs font-semibold">
                              <span className="text-slate-600 font-bold">{item.name} <span className="text-[10px] text-slate-400 font-bold">({item.totalGrades} Nilai)</span></span>
                              <span className="font-extrabold text-emerald-800">{item.avg} / 100</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                              <div className="bg-emerald-700 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(item.avg, 100)}%` }}></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Top performer card list */}
              {(() => {
                // Get top performing students dynamically from grade records
                const studentAvgs = students.map(st => {
                  const sGrades = gradeRecords.filter(g => g.nisn === st.nisn);
                  const sum = sGrades.reduce((acc, curr) => acc + curr.finalScore, 0);
                  const avg = sGrades.length > 0 ? Math.round((sum / sGrades.length) * 10) / 10 : 0;
                  return { name: st.name, classGroup: st.classGroup, avg };
                }).filter(st => st.avg > 0).sort((a,b) => b.avg - a.avg).slice(0, 4);

                return (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between font-sans">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5 font-sans">
                        <span className="material-symbols-outlined text-amber-500">workspace_premium</span>
                        Siswa Dengan Rerata Tertinggi (Sekolah)
                      </h4>
                      <div className="space-y-3.5 text-xs">
                        {studentAvgs.length === 0 ? (
                          <div className="p-8 text-center text-slate-405">Belum ada pengisian nilai akademik dari guru.</div>
                        ) : (
                          studentAvgs.map((item, idx) => (
                            <div key={item.name} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 relative overflow-hidden font-sans">
                              <span className="absolute top-0 left-0 bg-amber-500 text-white text-[9px] font-black px-1.5 rounded-br-lg">#{idx + 1}</span>
                              <div className="pl-3 mt-1 min-w-0">
                                <p className="font-bold text-slate-800 truncate">{item.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Kelas: {item.classGroup}</p>
                              </div>
                              <span className="bg-emerald-50 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-100 font-mono ml-2 shrink-0">{item.avg}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <button onClick={() => alert("Mengunduh kompilasi transkrip beasiswa berprestasi MA AL-MA'SUM...")} className="w-full mt-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 font-bold text-xs py-2 rounded-lg cursor-pointer transition-colors">Cetak Sertifikat Prestasi</button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Module: LAPORAN INSTITUSI */}
        {activeModule === "laporan-institusi" && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                <span className="material-symbols-outlined text-emerald-800 bg-emerald-50 p-3 rounded-2xl text-2xl">co_present</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Persentase Kehadiran Guru</h4>
                  <p className="text-2xl font-black text-slate-800 mt-1">98.5%</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Kehadiran pendidik sangat konsisten</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                <span className="material-symbols-outlined text-indigo-805 bg-indigo-50 p-3 rounded-2xl text-2xl">how_to_reg</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kehadiran Rata-Rata Siswa</h4>
                  <p className="text-2xl font-black text-indigo-950 mt-1">
                    {attendanceRecords.length > 0
                      ? `${Math.round((attendanceRecords.filter(r => r.status === "H").length / attendanceRecords.length) * 100)}%`
                      : "94.2%"}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Batas aman kurikulum madrasah</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-3 rounded-2xl text-2xl">grade</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Nilai Akhir</h4>
                  <p className="text-2xl font-black text-amber-700 mt-1">
                    {gradeRecords.length > 0
                      ? (gradeRecords.reduce((acc, curr) => acc + curr.finalScore, 0) / gradeRecords.length).toFixed(1)
                      : "84.4"}
                  </p>
                  <p className="text-slate-500 text-[10px] mt-0.5">Predikat Akumulasi: Sangat Baik</p>
                </div>
              </div>
            </div>

            {/* Attendance & Mutu Analysis */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Evaluasi Mutu &amp; Kehadiran Madrasah</h3>
                <p className="text-xs text-slate-500 mt-1">Halaman pelaporan berkala bagi kepala sekolah untuk memantau performa pembelajaran tanpa data-data SPP/keuangan.</p>
              </div>

              <div className="border-t border-slate-100 pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance Summary */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-indigo-900 text-sm">pie_chart</span>
                    Rasio Presentasi Kehadiran Siswa
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs text-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-600">Hadir (H)</span>
                      <span className="font-bold font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                        {attendanceRecords.filter(r => r.status === "H").length} Kali
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-600">Sakit (S)</span>
                      <span className="font-bold font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        {attendanceRecords.filter(r => r.status === "S").length} Kali
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-600">Izin (I)</span>
                      <span className="font-bold font-mono bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                        {attendanceRecords.filter(r => r.status === "I").length} Kali
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-600">Mangkir / Tanpa Keterangan (A)</span>
                      <span className="font-bold font-mono bg-rose-100 text-rose-950 px-2 py-0.5 rounded">
                        {attendanceRecords.filter(r => r.status === "A").length} Kali
                      </span>
                    </div>
                  </div>
                </div>

                {/* Academic Performance Summary */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-600 text-sm">stars</span>
                    Rekapitulasi Mutu Nilai Kelas
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                    <p className="font-medium leading-relaxed">
                      Statistik ketuntasan KKM menunjukkan bahwa <span className="font-bold text-emerald-900">
                        {gradeRecords.filter(g => g.finalScore >= 75).length} dari {gradeRecords.length} siswa ({Math.round((gradeRecords.filter(g => g.finalScore >= 75).length / Math.max(1, gradeRecords.length)) * 100)}%)
                      </span> telah melampaui nilai ketuntasan standar madrasah (KKM &gt;= 75).
                    </p>
                    <p className="text-slate-500 text-[11px] leading-relaxed mt-2 italic">
                      Catatan Kepala Sekolah: Direkomendasikan bagi bapak/ibu wali kelas XII - IPA 1 untuk mengadakan klinik pengayaan materi kalkulus sebelum masa ujian akhir semester dimulai.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end border-t border-slate-100">
                <button 
                  onClick={() => alert("Mengunduh rekaman analitik mutu kelulusan MA AL-MA'SUM format Excel...")} 
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition-colors shadow-sm"
                >
                  Ekspor Laporan Mutu &amp; Kehadiran (.xlsx)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Module: PENGATURAN */}
        {activeModule === "pengaturan" && (
          <div className="space-y-8 animate-fadeIn max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Profile Bio Details Form */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800">Modifikasi Portofolio Kepala Sekolah</h3>
                </div>
                <form onSubmit={handleProfileSave} className="p-6 space-y-4">
                  {/* Photo Edit Segment */}
                  <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <img 
                      src={avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256"} 
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
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Resmi</label>
                    <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium text-sm outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800/10 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} type="text" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nomor Telepon Pribadi</label>
                      <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={phone} onChange={(e) => setPhone(e.target.value)} type="text" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Biografi Kepemimpinan Sekolah</label>
                    <textarea rows={3} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={bio} onChange={(e) => setBio(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Alamat Dinas Rumah Kepala Sekolah</label>
                    <textarea rows={2} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm px-6 py-2 rounded-xl transition-all">
                      Perbarui Data Profil
                    </button>
                  </div>
                </form>
              </div>

              {/* Security settings */}
              <div className="lg:col-span-4 space-y-6 flex flex-col">
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
                      <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm outline-none" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" />
                    </div>
                    <button type="submit" className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold py-2 rounded-lg">
                      Save Password
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Element */}
      <footer className="w-full py-6 mt-auto bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center px-8 text-xs text-slate-500 shrink-0">
        <p className="font-semibold text-slate-400">© 2026 MA AL-MA’SUM Malausma — Sistem Informasi Akademik SIALMA</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#help" onClick={(e) => { e.preventDefault(); alert("Silakan email helpdesk kami di support@ma-alsum.edu."); }} className="hover:text-emerald-800 transition-colors">Help Desk SIALMA</a>
          <span>•</span>
          <a href="#tos" onClick={(e) => { e.preventDefault(); alert("SIALMA tunduk pada aturan kedisplinan akademik sekolah."); }} className="hover:text-emerald-800 transition-colors">EULA Syarat</a>
        </div>
      </footer>
    </div>
  );
}
