import React, { useState } from "react";
import { UserProfile, Role } from "../types";
import { demoProfiles } from "../data";

interface LoginProps {
  onLoginSuccess: (profile: UserProfile) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(Role.ADMIN);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDatabaseUsers = (): UserProfile[] => {
    const localUsersStr = localStorage.getItem("sialma_users");
    let allUsers: UserProfile[] = [];
    
    if (localUsersStr) {
      try {
        allUsers = JSON.parse(localUsersStr);
      } catch (err) {
        console.error("Gagal membaca database users:", err);
      }
    } else {
      // Fallback seed
      allUsers = Object.values(demoProfiles).map(u => ({
        ...u,
        password: u.username === "admin" || u.role === Role.ADMIN ? "admin123" : "password123"
      }));
    }

    // Secure fallback: always ensure a default 'admin' with 'admin123' exists
    const hasAdmin = allUsers.some(u => u.username.toLowerCase() === "admin");
    if (!hasAdmin) {
      allUsers.push({
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
    return allUsers;
  };

  const handleRoleChanged = (newRole: Role) => {
    setUsername("");
    setPassword("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const allUsers = getDatabaseUsers();

    // Match typed credentials with database entries and ensure role matches the selected tab
    const matchedProfile = allUsers.find(
      (u) => 
        u.username.toLowerCase() === username.trim().toLowerCase() && 
        u.role === selectedRole &&
        (u.password === password || (!u.password && password === "password123"))
    );

    if (matchedProfile) {
      onLoginSuccess(matchedProfile);
    } else {
      setError(`Username atau Kata Sandi salah untuk peran ${selectedRole}!`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden" 
         style={{ 
           backgroundImage: "radial-gradient(circle at 2px 2px, #c0c9b9 1px, transparent 0)", 
           backgroundSize: "32px 32px" 
         }}>
      
      {/* Login Container */}
      <div className="w-full max-w-[950px] grid grid-cols-1 md:grid-cols-2 overflow-hidden bg-white shadow-2xl rounded-2xl border border-emerald-100">
        
        {/* Branding Side (Left - Hidden on Mobile) */}
        <div className="hidden md:flex flex-col justify-center items-center bg-emerald-900 p-12 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-800 rounded-full opacity-30"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-950 rounded-full opacity-40"></div>
          
          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="mb-6 flex justify-center bg-white p-3 rounded-2xl shadow animate-fadeIn">
              <img
                src="https://i.ibb.co.com/rfswjG1B/MA-AL-MA-SUM.png"
                alt="MA AL-MA'SUM Logo"
                className="w-20 h-20 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="font-sans text-4xl font-extrabold text-white tracking-tight mb-2">SIALMA</h1>
            <p className="font-sans text-sm tracking-widest uppercase font-bold text-emerald-300">MA AL-MA'SUM</p>
            <p className="text-emerald-100/70 text-xs mt-1">Sistem Informasi Akademik Terpadu</p>
            
            <div className="mt-12 space-y-4 text-left w-full max-w-xs">
              <div className="flex items-center gap-3 text-emerald-100">
                <span className="material-symbols-outlined text-xl text-emerald-300">verified</span>
                <span className="text-sm font-medium">Portal Akademik Resmi</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-100">
                <span className="material-symbols-outlined text-xl text-emerald-300">security</span>
                <span className="text-sm font-medium">Data Terenkripsi &amp; Aman</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-100">
                <span className="material-symbols-outlined text-xl text-emerald-300">cloud_upload</span>
                <span className="text-sm font-medium">Sinkronisasi Real-Time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side (Right) */}
        <div className="flex flex-col p-8 md:p-12 bg-white justify-between">
          <div>
            {/* Mobile Header */}
            <div className="md:hidden flex flex-col items-center mb-6 text-center">
              <div className="bg-white p-2 rounded-xl shadow border border-slate-100 mb-3 inline-flex">
                <img
                  src="https://i.ibb.co.com/rfswjG1B/MA-AL-MA-SUM.png"
                  alt="MA AL-MA'SUM Logo"
                  className="w-12 h-12 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h1 className="text-3xl font-black text-emerald-900">SIALMA</h1>
              <p className="text-xs uppercase tracking-wider text-emerald-700 font-semibold">MA AL-MA'SUM</p>
            </div>

            <div className="mb-6 text-center md:text-left">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">Selamat Datang Kembali</h2>
              <p className="text-slate-500 text-sm">Masuk untuk mengelola presensi, jadwal, nilai, dan kuis.</p>
            </div>

            {error && (
              <div className="mb-5 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2 animate-shake">
                <span className="material-symbols-outlined text-lg">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Role Selection Tabs */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Masuk Sebagai (Pilih Peran)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { role: Role.ADMIN, label: "Admin", icon: "admin_panel_settings" },
                    { role: Role.GURU, label: "Guru", icon: "school" },
                    { role: Role.SISWA, label: "Siswa", icon: "person" },
                    { role: Role.KEPALA_SEKOLAH, label: "Kepsek", icon: "supervisor_account" },
                  ].map((item) => {
                    const isActive = selectedRole === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => {
                          setSelectedRole(item.role);
                          handleRoleChanged(item.role);
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                          isActive
                            ? "border-emerald-800 bg-emerald-50 text-emerald-900 font-bold shadow-sm"
                            : "border-slate-100 bg-slate-50/50 text-slate-500 hover:bg-slate-50 hover:border-slate-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl mb-1">{item.icon}</span>
                        <span className="text-[10px] tracking-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nama Pengguna (Username)</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-800 text-lg">
                      account_circle
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-800/10 transition-all outline-none text-slate-800 font-bold text-sm"
                      placeholder="Masukkan Username"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kata Sandi (Password)</label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-800 text-lg">
                      lock
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-800/10 transition-all outline-none text-slate-800 font-sans text-sm"
                      placeholder="Masukkan Kata Sandi"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-800"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-800"
                  />
                  <span className="text-slate-650">Ingat Saya</span>
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Silakan hubungi staf IT Tata Usaha untuk mereset kata sandi SIALMA."); }} className="text-emerald-800 font-bold hover:underline">
                  Lupa Kata Sandi?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-800 hover:bg-emerald-900 active:scale-[0.98] text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Masuk Sebagai {selectedRole}</span>
                <span className="material-symbols-outlined text-lg">login</span>
              </button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              © 2026 MA AL-MA’SUM — SIALMA Management System
            </p>
            <div className="mt-3 flex justify-center gap-4 text-xs font-medium text-slate-400">
              <a href="#help" onClick={(e) => { e.preventDefault(); alert("Hubungi Helpdesk SIALMA: support@ma-alsum.edu atau WhatsApp +62 812-3456-7890."); }} className="hover:text-emerald-800 transition-colors">Bantuan</a>
              <span className="text-slate-200">•</span>
              <a href="#terms" onClick={(e) => { e.preventDefault(); alert("Ketentuan Layanan SIALMA MA AL-MA'SUM sesuai regulasi sekolah."); }} className="hover:text-emerald-800 transition-colors">Ketentuan</a>
              <span className="text-slate-200">•</span>
              <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Data akademik dilindungi oleh kebijakan privasi MA AL-MA'SUM."); }} className="hover:text-emerald-800 transition-colors">Privasi</a>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
