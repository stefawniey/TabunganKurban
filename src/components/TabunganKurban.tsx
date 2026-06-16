/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Coins, 
  Target, 
  SlidersHorizontal,
  FolderDot,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { User, Transaksi } from '../types';
import { getUserBalance, formatRupiah, getHewanLabel } from '../data';

interface TabunganKurbanProps {
  users: User[];
  transactions: Transaksi[];
  onNavigateToRecords: (userId: string) => void;
}

export default function TabunganKurban({ users, transactions, onNavigateToRecords }: TabunganKurbanProps) {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterMilestone, setFilterMilestone] = useState(''); // '25', '50', '100', 'under_25'

  // Hitung data untuk semua pengguna non-admin
  const usersWithBalance = users
    .filter(u => u.role !== 'admin')
    .map(u => {
      const balance = getUserBalance(u.id, transactions);
      const target = u.targetAmount || 3500000;
      const pct = Math.min(Math.round((balance / target) * 100), 100);
      return {
        ...u,
        balance,
        target,
        pct,
      };
    });

  // Filter Data Tabungan
  const filteredTabungan = usersWithBalance.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.username.toLowerCase().includes(search.toLowerCase()) ||
                          (u.kelas && u.kelas.toLowerCase().includes(search.toLowerCase())) ||
                          (u.nipNis && u.nipNis.includes(search));
    
    const matchesRole = !filterRole || u.role === filterRole;
    
    let matchesMilestone = true;
    if (filterMilestone === '100') {
      matchesMilestone = u.pct >= 100;
    } else if (filterMilestone === '50') {
      matchesMilestone = u.pct >= 50 && u.pct < 100;
    } else if (filterMilestone === '25') {
      matchesMilestone = u.pct >= 25 && u.pct < 50;
    } else if (filterMilestone === 'under_25') {
      matchesMilestone = u.pct < 25;
    }

    return matchesSearch && matchesRole && matchesMilestone;
  });

  // Menentukan warna badge status kurban
  const getProgressStyles = (pct: number) => {
    if (pct >= 100) {
      return {
        label: 'Selesai 100% (Lunas)',
        bg: 'bg-zinc-900 text-white font-bold',
        bar: 'bg-zinc-900'
      };
    } else if (pct >= 50) {
      return {
        label: 'Progress Sedia 50%+',
        bg: 'bg-zinc-700 text-white font-bold',
        bar: 'bg-zinc-700'
      };
    } else if (pct >= 25) {
      return {
        label: 'Awal 25%+',
        bg: 'bg-zinc-200 text-zinc-900',
        bar: 'bg-zinc-400'
      };
    } else {
      return {
        label: 'Rendah (<25%)',
        bg: 'bg-zinc-100 text-zinc-900',
        bar: 'bg-zinc-300'
      };
    }
  };

  // Kalkulasi rekap agregat widget untuk tabungan kurban
  const totalTerhimpunSiswa = usersWithBalance
    .filter(u => u.role === 'siswa')
    .reduce((sum, u) => sum + u.balance, 0);

  const totalTerhimpunGuru = usersWithBalance
    .filter(u => u.role === 'guru')
    .reduce((sum, u) => sum + u.balance, 0);

  const totalBelumLunasCount = usersWithBalance.filter(u => u.pct < 100).length;
  const totalLunasCount = usersWithBalance.filter(u => u.pct >= 100).length;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Upper Widgets Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Widget 1 */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-350 font-bold font-mono tracking-wider uppercase">TABUNGAN SISWA</span>
          <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white mt-1">{formatRupiah(totalTerhimpunSiswa)}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">Ditinjau dari seluruh kelas murid</p>
        </div>

        {/* Widget 2 */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-350 font-bold font-mono tracking-wider uppercase">TABUNGAN GURU</span>
          <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white mt-1">{formatRupiah(totalTerhimpunGuru)}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">Ditinjau dari simpanan guru / staff</p>
        </div>

        {/* Widget 3 */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-350 font-bold font-mono tracking-wider uppercase">TARGET LUNAS</span>
          <p className="text-lg font-bold font-mono text-zinc-800 dark:text-zinc-200 mt-1">{totalLunasCount} Peserta</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">✓ Siap untuk disembelih kurbannya</p>
        </div>

        {/* Widget 4 */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-350 font-bold font-mono tracking-wider uppercase">SEDANG MENGANGSUR</span>
          <p className="text-lg font-bold font-mono text-amber-650 dark:text-amber-500 mt-1">{totalBelumLunasCount} Peserta</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2">Sedang berproses menyisir target</p>
        </div>
      </div>
      {/* Title */}
      <div>
        <span className="text-[10px] text-zinc-450 dark:text-zinc-400 font-mono font-bold tracking-wider uppercase">MODUL PENGAWASAN</span>
        <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
          <Coins className="w-6 h-6 text-zinc-650 dark:text-zinc-300" />
          Progres Tabungan Kurban Peserta
        </h2>
        <p className="text-xs text-zinc-550 dark:text-zinc-400">Daftar pencapaian status kurban seluruh siswa, guru, dan staf sekolah.</p>
      </div>

      {/* Filters Area */}
      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-550 dark:text-zinc-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nama, kelas, atau sasaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-450 dark:focus:border-zinc-500"
          />
        </div>


      </div>

      {/* Grid of Users targets (Indonesian, high fidelity visual bento cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTabungan.length === 0 ? (
          <div className="md:col-span-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-10 rounded-2xl text-center text-zinc-400 text-xs font-semibold font-sans">
            Tidak ditemukan data tabungan yang sesuai penyaringan Anda.
          </div>
        ) : (
          filteredTabungan.map((u) => {
            const styles = getProgressStyles(u.pct);

            return (
              <div 
                key={u.id}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 hover:border-zinc-350 dark:hover:border-zinc-600 transition-all flex flex-col justify-between space-y-4 shadow-sm"
              >
                {/* Header Card */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{u.name}</h4>
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-550 font-mono font-bold uppercase mt-1 inline-block">
                      {u.role === 'siswa' ? `SISWA • ${u.kelas}` : `GURU • ${u.kelas || 'Dewan Guru'}`}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${styles.bg}`}>
                    {styles.label}
                  </span>
                </div>

                {/* Mid info, target animal and money */}
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-855 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 block font-semibold">Hewan Sasaran</span>
                    <span className="font-bold text-zinc-805 dark:text-zinc-200">{getHewanLabel(u.targetHewan)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block font-semibold">Terkumpul</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white text-sm">{formatRupiah(u.balance)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                    <span>Target: {formatRupiah(u.target)}</span>
                    <span className="font-bold text-zinc-400">{u.pct}%</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-250 dark:border-zinc-700/40">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${u.pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${styles.bar}`}
                    />
                  </div>
                </div>

                {/* Milestone Indicators Checkboxes */}
                <div className="flex justify-between items-center pt-2.5 border-t border-zinc-100 dark:border-zinc-700/80 text-[10px] text-zinc-500 dark:text-zinc-400">
                  <div className="flex gap-2">
                    <span className={`flex items-center gap-1 ${u.pct >= 25 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-450 dark:text-zinc-600'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> 25%
                    </span>
                    <span className={`flex items-center gap-1 ${u.pct >= 50 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-450 dark:text-zinc-600'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> 50%
                    </span>
                    <span className={`flex items-center gap-1 ${u.pct >= 100 ? 'text-zinc-900 dark:text-zinc-100 font-bold' : 'text-zinc-450 dark:text-zinc-600'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
