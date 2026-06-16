/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  KeyRound, 
  Target, 
  ShieldCheck, 
  CheckCircle2, 
  School, 
  Sparkles,
  Inbox
} from 'lucide-react';
import { User as UserType } from '../types';
import { getHewanLabel, formatRupiah } from '../data';

interface ProfilProps {
  currentUser: UserType;
  users: UserType[];
  onUpdateUsers: (newUsers: UserType[]) => void;
  onUpdateCurrentUser: (user: UserType) => void;
}

export default function Profil({ currentUser, users, onUpdateUsers, onUpdateCurrentUser }: ProfilProps) {
  // Profil form states
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState(currentUser.password || 'password123');
  const [targetHewan, setTargetHewan] = useState(currentUser.targetHewan || '');
  const [success, setSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Tentukan targetAmount berdasarkan hewan kurban
    let targetAmount = 0;
    if (targetHewan === 'domba') targetAmount = 2500000;
    else if (targetHewan === 'kambing') targetAmount = 3500000;
    else if (targetHewan === 'sapi_sepertujuh') targetAmount = 4000000;
    else if (targetHewan === 'sapi_penuh') targetAmount = 28000000;
    else if (targetHewan === 'custom') targetAmount = currentUser.targetAmount || 3500000;

    const updatedUser: UserType = {
      ...currentUser,
      name,
      email,
      password,
      targetHewan,
      targetAmount,
    };

    // Update users database
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    onUpdateUsers(updatedUsers);
    
    // Update logged in state
    onUpdateCurrentUser(updatedUser);

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in font-sans">
      
      {/* Title block */}
      <div>
        <span className="text-[10px] text-zinc-650 dark:text-zinc-400 font-mono font-bold tracking-wider uppercase">KONFIGURASI PENGGUNA</span>
        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
          Pengaturan Profil Saya
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">Sunting informasi dasar, ganti sandi keamanan, atau tentukan target hewan kurban Anda.</p>
      </div>

      {/* Profile Form Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Form Edit inputs */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-3xl p-6 md:p-8 shadow-sm">
          <form onSubmit={handleSave} className="space-y-5">
            {success && (
              <div id="profil-success-alert" className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl p-3 flex items-start gap-2 font-medium shadow-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500" />
                <span>Kredensial profil dan preferensi kurban berhasil disimpan! Indikator target tabungan Anda otomatis terkalibrasi.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label htmlFor="pform-fullName" className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 tracking-wider uppercase font-mono">Nama Lengkap Anda</label>
                <input
                  id="pform-fullName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-3.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 font-medium"
                />
              </div>

              {/* Username (Locked) */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-450 tracking-wider uppercase font-mono">Nama Pengguna (Tidak Dapat Dirubah)</label>
                <input
                  type="text"
                  value={currentUser.username}
                  disabled
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-3.5 text-xs text-zinc-900 dark:text-zinc-400 font-mono focus:outline-none cursor-not-allowed border-dashed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="pform-emailAddress" className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 tracking-wider uppercase font-mono">Alamat Email Aktif</label>
                <input
                  id="pform-emailAddress"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-3.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="pform-userPwd" className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 tracking-wider uppercase font-mono">Ganti Kunci Sandi Keamanan</label>
                <input
                  id="pform-userPwd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-3.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 font-mono"
                />
              </div>
            </div>

            {/* Target hewan kurban */}
            {currentUser.role !== 'admin' && (
              <div className="space-y-2 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                <div>
                  <label htmlFor="pform-userAnimal" className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 tracking-wider uppercase font-mono">Pilih / Ganti Target Hewan Kurban</label>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-400">Sesuaikan dengan kesanggupan tabungan kurban dwi-mingguan Anda</p>
                </div>
                
                <select
                  id="pform-userAnimal"
                  value={targetHewan}
                  onChange={(e) => setTargetHewan(e.target.value as any)}
                  required
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-3 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 font-sans"
                >
                  <option value="" disabled>-- Pilih Target Hewan Kurban Anda --</option>
                  <option value="domba">1 Ekor Domba (Rp 2.500.000)</option>
                  <option value="kambing">1 Ekor Kambing (Rp 3.500.000)</option>
                  <option value="sapi_sepertujuh">1/7 Kelompok Patungan Sapi (Rp 4.000.000)</option>
                  <option value="sapi_penuh">1 Sapi Utuh Mandiri (Rp 28.000.000)</option>
                  <option value="custom">Target Kustom / Lainnya</option>
                </select>
              </div>
            )}

            {/* Save trigger button */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <button
                id="btn-save-personal-profil"
                type="submit"
                className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-850 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold rounded-xl text-xs transition shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Simpan Perubahan Kredensial</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Visual Info Card */}
        <div className="lg:col-span-4 bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-700 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">Kartu Induk Peserta</h4>
            
            <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 mx-auto flex items-center justify-center text-lg font-bold text-white shadow-md">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h5 className="font-extrabold text-white text-sm">{currentUser.name}</h5>
                <span className="text-[10px] text-zinc-400 font-mono tracking-wider font-bold">
                  {currentUser.role === 'siswa' ? `SISWA AKADEMI` : currentUser.role === 'guru' ? 'STAFF DEWAN GURU' : 'SUPER ADMIN'}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-3 border-b border-zinc-800/80 text-zinc-300">
                <span>Sekolah / Instansi:</span>
                <span className="font-bold text-zinc-100 font-sans">SMKN 46 Jakarta</span>
              </div>
              {currentUser.role === 'siswa' && (
                <div className="flex justify-between py-3 border-b border-zinc-800/80 text-zinc-300">
                  <span>Kelas Belajar:</span>
                  <span className="font-bold text-zinc-100">{currentUser.kelas || '-'}</span>
                </div>
              )}
              {currentUser.role !== 'admin' && (
                <div className="flex justify-between py-3 border-b border-zinc-800/80 text-zinc-300">
                  <span>Nominal Sasaran:</span>
                  <span className="font-bold text-zinc-100 font-mono">{currentUser.targetHewan ? formatRupiah(currentUser.targetAmount || 3500000) : '-'}</span>
                </div>
              )}
              <div className="flex justify-between py-3 text-zinc-300">
                <span>Status Tabungan:</span>
                <span className="font-bold text-zinc-400 flex items-center gap-1.5 pt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-500"></span>
                  </span>
                  Aktif Berjalan
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
