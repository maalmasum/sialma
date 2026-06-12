import React from "react";
import { Role, UserProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  profile: UserProfile;
  activeModule: string;
  onModuleChange: (moduleName: string) => void;
  onLogout: () => void;
  theme?: "light" | "dark";
  setTheme?: (theme: "light" | "dark") => void;
}

export default function Sidebar({ profile, activeModule, onModuleChange, onLogout, theme = "light", setTheme }: SidebarProps) {
  // Determine menu items based on role
  const getMenuItems = () => {
    switch (profile.role) {
      case Role.SISWA:
        return [
          { key: "beranda", label: "Beranda", icon: "home" },
          { key: "jadwal", label: "Jadwal Pelajaran", icon: "calendar_month" },
          { key: "materi_tugas", label: "Materi & Tugas", icon: "menu_book" },
          { key: "presensi", label: "Riwayat Presensi", icon: "how_to_reg" },
          { key: "nilai", label: "Laporan Nilai", icon: "grade" },
          { key: "kuis", label: "Kuis Siswa", icon: "quiz" },
          { key: "pengaturan", label: "Profil & Pengaturan", icon: "settings" },
        ];
      case Role.GURU:
        return [
          { key: "beranda", label: "Beranda Guru", icon: "home" },
          { key: "jadwal", label: "Jadwal Mengajar", icon: "calendar_month" },
          { key: "materi_tugas", label: "Materi & Tugas (E-Learning)", icon: "menu_book" },
          { key: "presensi", label: "Presensi Siswa", icon: "how_to_reg" },
          { key: "nilai", label: "Input Nilai", icon: "grade" },
          { key: "rekap", label: "Rekap & Rapot", icon: "assessment" },
          { key: "kuis", label: "Manajemen Kuis", icon: "quiz" },
          { key: "pengaturan", label: "Profil & Pengaturan", icon: "settings" },
        ];
      case Role.ADMIN:
        return [
          { key: "beranda", label: "Beranda Admin", icon: "home" },
          { key: "siswa", label: "Manajemen Siswa", icon: "group" },
          { key: "guru", label: "Manajemen Guru", icon: "person_celebrate" },
          { key: "kelas", label: "Manajemen Kelas & Rombel", icon: "meeting_room" },
          { key: "users", label: "Manajemen Pengguna", icon: "manage_accounts" },
          { key: "mapel", label: "Manajemen Mapel", icon: "book" },
          { key: "jadwal", label: "Jadwal Kelas", icon: "calendar_month" },
          { key: "kuis", label: "Kuis", icon: "quiz" },
          { key: "pengumuman", label: "Pengumuman", icon: "campaign" },
          { key: "laporan", label: "Laporan Kehadiran & Keakademikan", icon: "assessment" },
          { key: "pengaturan", label: "Pengaturan Sistem", icon: "settings" },
        ];
      case Role.KEPALA_SEKOLAH:
        return [
          { key: "beranda", label: "Beranda Kepsek", icon: "home" },
          { key: "jadwal", label: "Pengawasan Jadwal", icon: "calendar_month" },
          { key: "monitoring-guru", label: "Monitoring Guru", icon: "co_present" },
          { key: "monitoring-akademik", label: "Monitoring Akademik", icon: "auto_stories" },
          { key: "laporan-institusi", label: "Laporan Kehadiran & Mutu", icon: "analytics" },
          { key: "pengaturan", label: "Profil & Pengaturan", icon: "settings" },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const getShortLabel = (key: string, originalLabel: string): string => {
    switch (key) {
      case "beranda": return "Beranda";
      case "jadwal": return "Jadwal";
      case "materi_tugas": return "E-Learning";
      case "presensi": return "Presensi";
      case "nilai": return "Nilai";
      case "rekap": return "Rekap";
      case "kuis": return "Kuis";
      case "pengaturan": return "Profil";
      case "siswa": return "Siswa";
      case "guru": return "Guru";
      case "kelas": return "Kelas";
      case "users": return "Pengguna";
      case "mapel": return "Mapel";
      case "pengumuman": return "Pengumuman";
      case "laporan": return "Laporan";
      case "monitoring-guru": return "Mon Guru";
      case "monitoring-akademik": return "Mon Akad";
      case "laporan-institusi": return "Laporan";
      default: return originalLabel.split(" ")[0];
    }
  };

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-screen w-[260px] flex-col py-5 z-55 transition-colors duration-300 ${
        theme === "dark"
          ? "bg-[#0b0f19] border-r border-[#1e293b] text-slate-100 shadow-[4px_0_24px_rgba(4,120,87,0.15)]"
          : "bg-linear-to-b from-white via-slate-50 to-emerald-50/15 border-r border-slate-200/80 shadow-[4px_0_24px_rgba(4,120,87,0.02)]"
      }`}>
        {/* Institution Logo & Branding Header */}
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3.5">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.05 }}
              className={`p-1 px-1.5 rounded-xl border ${
                theme === "dark" 
                  ? "bg-slate-900 border-emerald-504/20" 
                  : "bg-gradient-to-br from-emerald-50 to-emerald-500/10 border-emerald-500/15"
              }`}
            >
              <img
                src="https://i.ibb.co.com/rfswjG1B/MA-AL-MA-SUM.png"
                alt="Logo MA AL-MA'SUM"
                className="w-9 h-9 object-contain shrink-0"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="overflow-hidden">
              <h1 className={`font-sans text-xl font-black bg-gradient-to-r bg-clip-text text-transparent leading-none select-none ${
                theme === "dark" ? "from-emerald-400 to-teal-300" : "from-emerald-950 to-emerald-800"
              }`}>SIALMA</h1>
              <p className={`text-[10px] tracking-widest font-extrabold uppercase mt-1 select-none ${
                theme === "dark" ? "text-emerald-400" : "text-emerald-700"
              }`}>MA AL-MA'SUM</p>
            </div>
          </div>
          <div className={`h-px mt-4 mb-2 ${theme === "dark" ? "bg-slate-800" : "bg-linear-to-r from-slate-200/80 via-slate-100 to-transparent"}`} />
          <p className="font-sans text-[9px] font-bold text-slate-400 tracking-widest uppercase pl-1 select-none">PORTAL INTEGRASI AKADEMIK</p>
        </div>

        {/* Navigation Links List */}
        <nav className="flex-1 px-3.5 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeModule === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onModuleChange(item.key)}
                className={`w-full flex justify-start items-center text-left gap-4 px-4 py-3 rounded-xl text-xs font-semibold relative transition-smooth group ${
                  isActive
                    ? theme === "dark"
                      ? "text-emerald-300 font-bold shadow-[0_2px_12px_rgba(16,185,129,0.15)] bg-slate-950/40"
                      : "text-emerald-950 font-bold shadow-[0_2px_12px_rgba(16,185,129,0.06)]"
                    : theme === "dark"
                    ? "text-slate-400 hover:text-emerald-300"
                    : "text-slate-600 hover:text-emerald-900"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="desktopActivePill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl border-l-4 border-emerald-500"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
                <span className={`material-symbols-outlined text-xl transition-all relative z-10 z-[1] ${
                  isActive 
                    ? theme === "dark" ? "text-emerald-400 scale-105" : "text-emerald-800 scale-105"
                    : theme === "dark" ? "text-slate-500 group-hover:text-emerald-400 group-hover:scale-110" : "text-slate-400 group-hover:text-emerald-700 group-hover:scale-110"
                }`}>
                  {item.icon}
                </span>
                <span className="relative z-10 z-[1] select-none tracking-wide text-[13px]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Account Widget */}
        <div className={`px-3.5 mt-auto pt-4 border-t space-y-2 ${theme === "dark" ? "border-slate-800" : "border-slate-100/90"}`}>
          <div className={`p-3 rounded-xl flex items-center gap-3 border shadow-sm ${
            theme === "dark" 
              ? "bg-[#111827] border-slate-800 text-white" 
              : "bg-gradient-to-br from-slate-50 to-slate-100/30 border-slate-200/55"
          }`}>
            <motion.img
              whileHover={{ scale: 1.05 }}
              alt="Profil"
              className={`w-10 h-10 rounded-full border-2 shrink-0 object-cover ${
                theme === "dark" ? "border-emerald-500/50" : "border-emerald-200"
              }`}
              src={profile.avatarUrl}
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <p className={`text-xs font-bold truncate select-none ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>{profile.name}</p>
              <p className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wide truncate mt-0.5 select-none">
                {profile.role === Role.SISWA ? `KELAS ${profile.classGroup}` : profile.title || profile.role}
               </p>
            </div>
          </div>

          {/* Signout */}
          <div className="pt-1">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onLogout}
              className={`w-full flex items-center justify-start gap-4 px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${
                theme === "dark" 
                  ? "bg-rose-950/20 hover:bg-rose-950/45 text-rose-400 border-rose-900/30"
                  : "bg-rose-50 hover:bg-rose-100/80 text-rose-700 border-rose-200/50"
              }`}
            >
              <span className="material-symbols-outlined text-sm font-black text-rose-600">logout</span>
              <span className="tracking-wide text-[13px] select-none">Koneksi Keluar</span>
            </motion.button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar Navigation (Stunning Premium Dark/Glass Bar - NOT White) */}
      <div className="md:hidden fixed bottom-3 left-4 right-4 h-[72px] bg-gradient-to-r from-slate-950/95 via-emerald-950/95 to-zinc-950/95 backdrop-blur-xl border border-emerald-500/20 flex items-center overflow-x-auto z-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] justify-start px-4 py-2 gap-3.5 rounded-2xl scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {menuItems.map((item) => {
          const isActive = activeModule === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onModuleChange(item.key)}
              className={`flex flex-col items-center justify-center flex-shrink-0 min-w-[76px] h-[54px] px-1 rounded-xl relative transition-all ${
                isActive
                  ? "text-emerald-305 font-black"
                  : "text-slate-400 font-medium hover:text-slate-200"
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="mobileActiveIndicator"
                  className="absolute inset-0 bg-gradient-to-b from-emerald-500/15 to-teal-500/5 border border-emerald-500/30 rounded-xl"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              {isActive && (
                <motion.div 
                  layoutId="mobileDot"
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
              <span className={`material-symbols-outlined text-xl relative z-10 z-[1] ${
                isActive ? "text-emerald-400 scale-110 shadow-emerald-400/20" : "text-slate-500 hover:text-slate-300"
              }`}>
                {item.icon}
              </span>
              <span className={`text-[10px] tracking-tight mt-0.5 font-sans relative z-10 z-[1] select-none text-[10.5px] ${
                isActive ? "text-emerald-300 font-bold" : "text-slate-400"
              }`}>
                {getShortLabel(item.key, item.label)}
              </span>
            </button>
          );
        })}
        {/* Logout Button directly in the mobile bottom bar scroll list */}
        <button
          onClick={onLogout}
          className="flex flex-col items-center justify-center flex-shrink-0 min-w-[76px] h-[54px] px-1 rounded-xl text-rose-455 hover:bg-rose-500/10 transition-all font-black relative"
        >
          <span className="material-symbols-outlined text-xl text-rose-500">logout</span>
          <span className="text-[10px] tracking-tight mt-0.5 font-sans">Keluar</span>
        </button>
      </div>
    </>
  );
}
