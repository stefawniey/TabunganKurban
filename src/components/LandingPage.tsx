/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Coins, 
  Target, 
  ShieldCheck, 
  ArrowRight, 
  Calendar, 
  CircleDollarSign, 
  UserCheck, 
  TrendingUp, 
  Gem,
  CheckCircle2,
  Users
} from 'lucide-react';
import { getTransactionsAsync, formatRupiah, getUsersAsync } from '../data';
import { User, Transaksi } from '../types';

interface LandingPageProps {
  onNavigate: (route: string) => void;
  currentUser: any;
}

export default function LandingPage({ onNavigate, currentUser }: LandingPageProps) {
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [usersData, txData] = await Promise.all([
          getUsersAsync(),
          getTransactionsAsync()
        ]);
        setAllUsers(usersData);
        setTransactions(txData);
      } catch (err) {
        console.error('Gagal memuat stats landing page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Filter hanya pengguna yang memiliki transaksi (dengan id yang valid/masih ada)
  const allUserIds = new Set(allUsers.map(u => u.id));
  const validTransactions = transactions.filter(t => allUserIds.has(t.userId));

  // Hitung data langsung untuk landing page berdasarkan filter user yang valid
  const totalTabungan = validTransactions.reduce((sum, t) => {
    return t.type === 'setor' ? sum + t.amount : sum - t.amount;
  }, 0);

  const participantIds = new Set(validTransactions.map(t => t.userId));
  const activeParticipants = allUsers.filter(u => participantIds.has(u.id));
  
  const totalSiswa = activeParticipants.filter(u => u.role === 'siswa').length;
  const totalGuru = activeParticipants.filter(u => u.role === 'guru').length;

  // Rata-rata pencapaian target kurban
  const usersWithTarget = allUsers.filter(u => u.targetAmount && u.targetAmount > 0);
  let aggregateTargetPercent = 0;
  if (usersWithTarget.length > 0) {
    const totalTargets = usersWithTarget.reduce((sum, u) => sum + (u.targetAmount || 0), 0);
    const totalGathered = usersWithTarget.reduce((sum, u) => {
      const userTxs = transactions.filter(t => t.userId === u.id);
      const userBalance = userTxs.reduce((s, t) => t.type === 'setor' ? s + t.amount : s - t.amount, 0);
      return sum + Math.min(userBalance, u.targetAmount || 0);
    }, 0);
    aggregateTargetPercent = Math.round((totalGathered / totalTargets) * 100);
  } else {
    aggregateTargetPercent = 0; // Better to show 0 if no data
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 flex flex-col font-sans selection:bg-zinc-200">
      {/* Background soft shadow to give elegant modern feel */}
      <div className="absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-zinc-100/50 to-transparent pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-zinc-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
            <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 shadow-sm flex items-center justify-center">
              <Coins className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-950">
                Tabungan Kurban
              </h1>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest block -mt-1">TABUNGAN KURBAN SMK</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <button 
                onClick={() => onNavigate('/app')}
                className="group flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 transition-all font-medium rounded-xl text-sm cursor-pointer shadow-sm"
              >
                Masuk Dasbor <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => {
                    const el = document.getElementById('benefits');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-zinc-600 hover:text-zinc-900 transition-all text-sm font-semibold cursor-pointer"
                >
                  Tentang Web
                </button>
                <button 
                  onClick={() => onNavigate('/login')}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white transition-all font-medium rounded-xl text-sm shadow-sm cursor-pointer"
                >
                  Masuk Akun
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        <section id="hero-section" className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            {/* Tagline */}
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 border border-zinc-250 text-xs text-zinc-650 rounded-full font-mono shadow-sm">
              <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse"></span>
              {loading ? 'Sinkronisasi Cloud Datastore...' : (
                activeParticipants.length > 0 
                  ? `Sistem Terintegrasi: ${activeParticipants.length} Partisipan Telah Berpartisipasi`
                  : 'Sistem Terintegrasi: Menunggu Partisipasi Perdana'
              )}
            </span>

            {/* Headline */}
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.15]">
              Wujudkan Ibadah Kurban dengan{' '}
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-clip-text text-transparent">
                Perencanaan Cerdas & Terbuka
              </span>
            </h2>

            {/* Subheadline */}
            <p className="text-sm md:text-base text-zinc-650 leading-relaxed max-w-2xl mx-auto font-medium">
              Sistem tabungan kurban digital yang modern bagi Siswa dan Guru SMK. 
              Memantau target, mengamankan tabungan tunai, serta menyajikan visualisasi data yang presisi, 
              adil, dan terpercaya untuk menyambut Hari Raya Idul Adha.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6">
              <motion.button 
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                onClick={() => onNavigate('/login')}
                className="w-full sm:w-auto group flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer"
              >
                Mulai Menabung Sekarang <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                onClick={() => {
                  const el = document.getElementById('benefits');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-zinc-100 text-zinc-750 font-semibold rounded-xl border border-zinc-300 transition-all text-sm cursor-pointer shadow-sm"
              >
                Pelajari Manfaat
              </motion.button>
            </div>
          </motion.div>

          {/* Interactive Live Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20">
            {/* Stat 1: Total Tabungan */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              placeholder=""
              whileHover={{ y: -8, scale: 1.02, boxShadow: "0 12px 24px -10px rgba(0,0,0,0.06)" }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="bg-white border border-zinc-200 p-6 rounded-2xl text-left shadow-sm relative h-full flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="p-3 bg-zinc-150 rounded-xl border border-zinc-200 text-zinc-700">
                    <CircleDollarSign className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] text-zinc-650 font-mono font-bold bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200">DATA TERKINI</span>
                </div>
                <h3 className="text-xs font-semibold text-zinc-500 tracking-wider uppercase font-mono">Total Dana Terhimpun</h3>
                <p className="text-2xl md:text-3xl font-extrabold text-zinc-900 mt-2 font-mono tracking-tight">
                  {loading ? '---' : (totalTabungan > 0 ? formatRupiah(totalTabungan) : '-')}
                </p>
              </div>
              <p className="text-[11px] text-zinc-500 mt-4 border-t border-zinc-150 pt-3">
                Akumulasi seluruh tabungan kurban dari partisipan sekolah.
              </p>
            </motion.div>

            {/* Stat 2: Target Completion */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, scale: 1.02, boxShadow: "0 12px 24px -10px rgba(0,0,0,0.06)" }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="bg-white border border-zinc-200 p-6 rounded-2xl text-left shadow-sm relative h-full flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="p-3 bg-zinc-150 rounded-xl border border-zinc-200 text-zinc-700">
                    <Target className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] text-zinc-650 font-mono font-bold bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200">RANGKUMAN</span>
                </div>
                <h3 className="text-xs font-semibold text-zinc-500 tracking-wider uppercase font-mono">Pencapaian Target Tabungan</h3>
                <p className="text-2xl md:text-3xl font-extrabold text-zinc-900 mt-2 font-mono tracking-tight">
                  {aggregateTargetPercent}%
                </p>
              </div>
              <div>
                <div className="h-1.5 w-full bg-zinc-200 rounded-full mt-4 overflow-hidden border border-zinc-250">
                  <div className="h-full bg-gradient-to-r from-zinc-850 to-zinc-400 rounded-full" style={{ width: `${aggregateTargetPercent}%` }}></div>
                </div>
                <p className="text-[11px] text-zinc-500 mt-2.5">
                  Progres rata-rata pencapaian target tabungan kurban partisipan aktif.
                </p>
              </div>
            </motion.div>

            {/* Stat 3: Total Users */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ y: -8, scale: 1.02, boxShadow: "0 12px 24px -10px rgba(0,0,0,0.06)" }}
              transition={{ type: "spring", stiffness: 350, damping: 22 }}
              className="bg-white border border-zinc-200 p-6 rounded-2xl text-left shadow-sm relative h-full flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="p-3 bg-zinc-150 rounded-xl border border-zinc-200 text-zinc-700">
                    <Users className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] text-zinc-650 font-mono font-bold bg-zinc-100 px-2.5 py-1 rounded border border-zinc-200">PARTISIPASI</span>
                </div>
                <h3 className="text-xs font-semibold text-zinc-500 tracking-wider uppercase font-mono">Partisipasi Aktif</h3>
                <p className="text-2xl md:text-3xl font-extrabold text-zinc-900 mt-2 font-mono tracking-tight">
                  {loading ? '--' : activeParticipants.length} <span className="text-xs text-zinc-500 font-normal">Partisipan Aktif</span>
                </p>
              </div>
              <p className="text-[11px] text-zinc-500 mt-4 border-t border-zinc-150 pt-3 flex justify-between">
                <span>Siswa: {totalSiswa} orang</span>
                <span>Guru: {totalGuru} orang</span>
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-24 bg-zinc-100 border-y border-zinc-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Manfaat Sistem Tabungan Digital Kurban</h2>
              <p className="text-sm text-zinc-650 max-w-xl mx-auto font-medium">
                Meninggalkan pembukuan konvensional, beralih ke keterbukaan, akurasi, dan proses menabung yang asyik bagi seluruh warga sekolah.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-white border border-zinc-200 p-8 rounded-2xl relative overflow-hidden group hover:border-zinc-300 hover:shadow-md transition-all">
                <div className="p-3 bg-zinc-100 rounded-xl border border-zinc-250 group-hover:bg-zinc-200 text-zinc-800 w-fit transition-all mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-3 font-sans">Keamanan Terjamin</h3>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  Tabungan kurban dicatat sistem dengan pengawasan ketat admin. Sistem hak akses bertingkat mencegah penyalahgunaan data tabungan.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-zinc-200 p-8 rounded-2xl relative overflow-hidden group hover:border-zinc-300 hover:shadow-md transition-all">
                <div className="p-3 bg-zinc-100 rounded-xl border border-zinc-250 group-hover:bg-zinc-200 text-zinc-800 w-fit transition-all mb-6">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-3 font-sans">Perkembangan Seketika</h3>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  Siswa dan guru dapat memantau akumulasi tabungan secara interaktif dengan indikator pencapaian target kurban (25%, 50%, 100%).
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-zinc-200 p-8 rounded-2xl relative overflow-hidden group hover:border-zinc-300 hover:shadow-md transition-all">
                <div className="p-3 bg-zinc-100 rounded-xl border border-zinc-250 group-hover:bg-zinc-200 text-zinc-800 w-fit transition-all mb-6">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-3 font-sans">Transparansi Laporan</h3>
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  Cetak dan saring laporan bulanan, semesteran, bahkan saring per kelas secara instan. Menabung kurban jadi terorganisasi matang.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 max-w-5xl mx-auto px-6 text-center">
          <div className="p-8 md:p-14 bg-zinc-100 border border-zinc-200 rounded-3xl relative overflow-hidden shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 to-transparent pointer-events-none" />
            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900">Mulai Tabungan Kurban Digital Hari Ini</h2>
              <p className="text-xs md:text-sm text-zinc-600 font-medium">
                Sambut hari besar Idul Adha dengan perencanaan finansial lunas dwi bulanan yang terpercaya bagi guru dan murid di instansi kami.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => onNavigate('/login')}
                  className="px-8 py-4 bg-zinc-900 hover:bg-zinc-850 text-white font-bold transition-all rounded-xl text-sm shadow-md cursor-pointer relative inline-flex items-center gap-2"
                >
                  Masuk Ke Tabungan <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-10 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-xs">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-zinc-600" />
            <span className="font-semibold text-zinc-650 font-mono tracking-tight">TABUNGAN KURBAN DIGITAL</span>
          </div>
          <p>© 2026 Tabungan Kurban. Semua Hak Dilindungi. Dibuat dengan Standar Industri Modern.</p>
        </div>
      </footer>
    </div>
  );
}
