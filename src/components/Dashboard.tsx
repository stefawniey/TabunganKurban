/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Wallet, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  Trophy, 
  CheckCircle2, 
  Check,
  Target,
  BookmarkCheck,
  TrendingDown,
  TrendingUp,
  CircleAlert,
  ArrowRightLeft,
  PlusCircle,
  Info
} from 'lucide-react';
import { User, Transaksi } from '../types';
import { 
  getUserBalance, 
  formatRupiah, 
  getTransactions, 
  getUsers, 
  getHewanLabel 
} from '../data';
import { 
  CircularTargetGauge, 
  ElegantBarChart,
  InteractiveJourneyChart
} from './Charts';
import PaymentModal from './PaymentModal';
import TargetSelectorModal from './TargetSelectorModal';

interface DashboardProps {
  currentUser: User;
  onNavigateToMenu: (menu: string) => void;
  transactions: Transaksi[];
  users: User[];
  onAddTransactionQuick: (userId: string, amount: number, type: 'setor' | 'tarik', notes: string) => void;
  onUpdateTarget?: (type: 'domba' | 'kambing' | 'sapi_sepertujuh' | 'sapi_penuh' | 'custom', amount: number) => void;
}

export default function Dashboard({ 
  currentUser, 
  onNavigateToMenu, 
  transactions, 
  users, 
  onAddTransactionQuick,
  onUpdateTarget
}: DashboardProps) {
  
  // States untuk quick action deposit admin
  const [quickUserId, setQuickUserId] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickNotes, setQuickNotes] = useState('Tabungan Tunai Mandiri');
  const [quickSuccess, setQuickSuccess] = useState(false);

  // States untuk Payment Modal (Siswa/Guru)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);

  // Filter untuk mendapatkan rekap
  const onlyStudents = users.filter(u => u.role === 'siswa');
  const onlyTeachers = users.filter(u => u.role === 'guru');

  // Total tabungan terkumpul hanya dari user yang masih aktif
  const validUserIds = new Set(users.map(u => u.id));
  const validTransactions = transactions.filter(t => validUserIds.has(t.userId));

  const totalDanaTerkumpul = validTransactions.reduce((sum, t) => {
    return t.type === 'setor' ? sum + t.amount : sum - t.amount;
  }, 0);

  // Hitung saldo masing-masing user untuk perbandingan
  const usersWithBalanced = users.map(u => {
    const val = getUserBalance(u.id, transactions);
    return { ...u, balance: val };
  });

  // Ranking Peserta teratas (berdasarkan nominal tabungan tertinggi)
  const rankingPeserta = usersWithBalanced
    .filter(u => u.role === 'siswa' || u.role === 'guru')
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5) // Ambil 5 besar
    .map(u => ({
      label: u.name,
      amount: u.balance,
      count: transactions.filter(t => t.userId === u.id).length
    }));


  // Riwayat Transaksi Pendek (3 baris terakhir)
  const shortHistory = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Penanganan Dashboard Guru / Siswa (Personal)
  const myBalance = getUserBalance(currentUser.id, transactions);
  const myTarget = currentUser.targetHewan ? (currentUser.targetAmount || 3500000) : 0;
  const myProgressPercent = myTarget > 0 ? Math.min(Math.round((myBalance / myTarget) * 100), 100) : 0;

  // Mengelompokkan riwayat personal Guru / Siswa
  const myTransactions = transactions
    .filter(t => t.userId === currentUser.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Definisikan target checklist
  const milestones = [
    { label: 'Target 25%', value: 25, reached: myProgressPercent >= 25 },
    { label: 'Target 50%', value: 50, reached: myProgressPercent >= 50 },
    { label: 'Target 100%', value: 100, reached: myProgressPercent >= 100 }
  ];

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUserId || !quickAmount || parseFloat(quickAmount) <= 0) return;

    onAddTransactionQuick(quickUserId, parseFloat(quickAmount), 'setor', quickNotes);
    setQuickSuccess(true);
    setQuickAmount('');
    setTimeout(() => setQuickSuccess(false), 3000);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <div className="space-y-8 font-sans w-full">
      
      {/* Welcome Banner */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-lg transition-shadow"
      >
        <div className="space-y-1.5 relative z-10">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-700">
            DASBOR TABUNGAN
          </span>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white">
            Selamat Datang, {currentUser.name}!
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl">
            {currentUser.role === 'admin' 
              ? 'Kelola tabungan kurban sekolah secara Waktu Nyata, saksikan tren mingguan, input tabungan, serta verifikasi kelengkapan target hewan kurban peserta.'
              : currentUser.targetHewan 
                ? `Pantau progres tabungan kurban Anda secara mandiri dwi pekanan. Target hewan Anda adalah ${getHewanLabel(currentUser.targetHewan)}.`
                : 'Pantau progres tabungan kurban Anda secara mandiri dwi pekanan. Silakan tentukan target hewan kurban Anda terlebih dahulu.'
            }
          </p>
        </div>
        <div className="shrink-0 relative z-10 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl hidden md:flex items-center gap-3 shadow-sm">
          <button 
            onClick={handleRefresh}
            title="Refresh Data"
            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 transition-all cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-zinc-900 dark:text-zinc-100 group-hover:rotate-12 transition-transform" />
          </button>
          <div>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono block">Status Server</span>
            <button 
              onClick={handleRefresh}
              className="text-xs font-bold text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer block"
            >
              Segarkan & Sinkronisasi
            </button>
          </div>
        </div>
      </motion.div>

      {/* RENDER VIEW BERDASARKAN ROLE */}
      <AnimatePresence mode="wait">
        {currentUser.role === 'admin' ? (
          /* TAMPILAN ADMINISTRATOR */
          <motion.div 
            key="admin-dash"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
          
          {/* Quick Metrics Widget Cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex flex-wrap justify-center gap-6"
          >
            
            {/* Card 1: Total Saldo */}
            <motion.div 
               variants={itemVariants}
               whileHover={{ scale: 1.05, y: -5 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
               className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl relative overflow-hidden group w-full sm:w-64 cursor-default shadow-sm dark:shadow-none">
              <div className="absolute right-3 top-3 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-colors">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono font-bold uppercase tracking-wider">Total Kas Tabungan</span>
              <p className="text-xl font-bold font-mono text-zinc-900 dark:text-white mt-1.5">
                {totalDanaTerkumpul > 0 ? formatRupiah(totalDanaTerkumpul) : '-'}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700 font-sans">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                <span>Dana tabungan terkumpul</span>
              </div>
            </motion.div>

            {/* Card 2: Jumlah Siswa */}
            <motion.div 
               variants={itemVariants}
               whileHover={{ scale: 1.05, y: -5 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
               className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl relative overflow-hidden group w-full sm:w-64 cursor-pointer shadow-sm dark:shadow-none"
               onClick={() => onNavigateToMenu('data_siswa')}
            >
              <div className="absolute right-3 top-3 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono font-bold uppercase tracking-wider">Partisipan Siswa</span>
              <p className="text-xl font-bold font-mono text-zinc-900 dark:text-white mt-1.5">{onlyStudents.length} Siswa</p>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                <span>Kelola Data Siswa</span>
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </motion.div>

            {/* Card 3: Jumlah Guru */}
            <motion.div 
               variants={itemVariants}
               whileHover={{ scale: 1.05, y: -5 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
               className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 rounded-2xl relative overflow-hidden group w-full sm:w-64 cursor-pointer shadow-sm dark:shadow-none"
               onClick={() => onNavigateToMenu('data_guru')}
            >
              <div className="absolute right-3 top-3 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-zinc-900 transition-colors">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono font-bold uppercase tracking-wider">Partisipan Guru</span>
              <p className="text-xl font-bold font-mono text-zinc-900 dark:text-white mt-1.5">{onlyTeachers.length} Guru</p>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                <span>Kelola Data Guru</span>
                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </motion.div>

          </motion.div>

          {/* Charts, Trends and Leaderboards Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Student Leaderboard Ranking (Tinggi Tabungan) */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-12 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-6 rounded-3xl shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <Trophy className="w-4 h-4 text-zinc-400 dark:text-zinc-300 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider font-mono">Peringkat Tabungan Tertinggi</h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Peserta teratas memenuhi target kurban</p>
                </div>
              </div>
              
              <div className="pt-2">
                <ElegantBarChart data={rankingPeserta} />
              </div>
            </motion.div>

            {/* Analisis Hewan Kurban */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-12 bg-zinc-50 border border-zinc-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow"
            >
                <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-zinc-400" />
                  Estimasi Analisis Hewan Kurban {totalDanaTerkumpul > 0 ? `(Dana Terkumpul: ${formatRupiah(totalDanaTerkumpul)})` : ''}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Domba', price: 2500000, icon: <Sparkles className="w-4 h-4" /> },
                    { label: 'Kambing', price: 3000000, icon: <Sparkles className="w-4 h-4" /> },
                    { label: 'Sapi', price: 21000000, icon: <Sparkles className="w-4 h-4" /> },
                  ].map((item) => {
                    const count = Math.floor(totalDanaTerkumpul / item.price);
                    const remaining = totalDanaTerkumpul % item.price;
                    return (
                        <motion.div 
                           key={item.label}
                           whileHover={{ scale: 1.02 }}
                           className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 group relative overflow-hidden">
                           <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-20 transition-opacity">
                             <Coins className="w-16 h-16" />
                           </div>
                           <p className="text-xs text-zinc-500 font-mono uppercase flex items-center gap-1.5">
                             {item.icon}
                             {item.label}
                           </p>
                           <p className="text-xl font-black text-zinc-900 mt-1">{count} <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Ekor</span></p>
                           <p className="text-[10px] text-zinc-650 dark:text-zinc-400 mt-1">Sisa Dana: {formatRupiah(remaining)}</p>
                        </motion.div>
                    );
                  })}
                </div>
            </motion.div>

          </div>

          {/* Ledger feeds and Swift Deposit Form Removed */}

          </motion.div>
        ) : (
          /* TAMPILAN GURU & SISWA */
          <motion.div 
            key="student-dash"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8"
          >
          
          {/* Main Stat & Circular target visualization block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                       {/* Left Box: Stats detail */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[40px] shadow-2xl shadow-zinc-200/50 dark:shadow-none flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
            >
              <div className="space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] font-mono block">Konfigurasi Tabungan</span>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                        <Target className="w-5 h-5 text-zinc-900 dark:text-white shrink-0" />
                      </div>
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight"> {getHewanLabel(currentUser.targetHewan)}</h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsTargetModalOpen(true)}
                    className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all font-mono cursor-pointer ${
                      currentUser.targetHewan 
                        ? 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-900 dark:hover:bg-white text-zinc-600 dark:text-zinc-400 hover:text-white dark:hover:text-zinc-900' 
                        : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-md animate-pulse'
                    }`}
                  >
                    {currentUser.targetHewan ? 'Ganti Target' : 'Pilih Target'}
                  </button>
                </div>

                {/* Progress bar container */}
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Saldo Terkumpul</span>
                      <p className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tighter font-mono">{formatRupiah(myBalance)}</p>
                    </div>
                    <button 
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="flex items-center gap-3 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[24px] font-bold text-sm hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-zinc-300/50 dark:shadow-none group"
                    >
                      <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                      Mulai Menabung
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 font-mono px-1">
                      <span>Progres Ibadah</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-900 dark:text-zinc-100 font-bold">{myProgressPercent}%</span>
                        <span className="text-zinc-300 dark:text-zinc-700">|</span>
                        <span className="text-zinc-500 dark:text-zinc-400 font-mono">{formatRupiah(myBalance)} / {currentUser.targetHewan ? formatRupiah(myTarget) : '-'}</span>
                      </div>
                    </div>
                  <div className="h-8 w-full bg-zinc-50 dark:bg-zinc-800/50 rounded-full p-1.5 border-2 border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-inner relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${myProgressPercent}%` }}
                      transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-zinc-900 dark:bg-white flex items-center justify-end pr-3 shadow-lg relative overflow-hidden"
                    >
                      <motion.div 
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                      />
                      <Sparkles className="w-3 h-3 text-white/50 dark:text-zinc-400/50" />
                    </motion.div>
                  </div>
                  {!currentUser.targetHewan && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl flex items-center gap-3">
                      <Info className="w-4 h-4 text-zinc-500 shrink-0" />
                      <p className="text-[11px] text-zinc-650 dark:text-zinc-400 leading-relaxed font-semibold">
                        Sistem mendeteksi Anda belum menentukan target hewan kurban Anda. Silakan klik tombol <strong className="text-zinc-950 dark:text-white font-bold">Pilih Target</strong> untuk menetapkan target ibadah kurban Anda.
                      </p>
                    </div>
                  )}
                </div>
              </div>

                {/* Target Milestones check labels */}
                <div className="relative">
                  <div className="absolute inset-0 bg-linear-to-r from-zinc-50/50 via-transparent to-zinc-50/50 dark:from-zinc-900/50 dark:to-zinc-900/50 pointer-events-none rounded-3xl" />
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="flex gap-4 p-2 bg-zinc-50/30 dark:bg-zinc-800/20 rounded-[32px] border border-zinc-100 dark:border-zinc-800 overflow-x-auto no-scrollbar"
                  >
                    {milestones.map((milestone, idx) => (
                      <motion.div 
                        key={idx}
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                        className={`flex-1 min-w-[120px] p-5 rounded-[24px] border-2 text-center transition-all relative overflow-hidden group/m ${
                          milestone.reached 
                            ? 'bg-white dark:bg-zinc-800 border-zinc-900 dark:border-white shadow-xl shadow-zinc-200/50 dark:shadow-none' 
                            : 'bg-zinc-100/30 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-800/50'
                        }`}
                      >
                        {milestone.reached && (
                          <div className="absolute top-0 left-0 w-full h-1 bg-zinc-900 dark:bg-white" />
                        )}
                        <div className={`w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all ${
                          milestone.reached ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-450'
                        }`}>
                           <BookmarkCheck className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-bold block leading-tight uppercase tracking-tighter ${
                           milestone.reached ? 'text-zinc-900 dark:text-white' : 'text-zinc-650 dark:text-zinc-400'
                        }`}>{milestone.label}</span>
                        <div className="mt-2 flex items-center justify-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${milestone.reached ? 'bg-zinc-900 dark:bg-white animate-pulse' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                          <span className={`text-[9px] font-bold font-mono tracking-widest ${milestone.reached ? 'text-zinc-900 dark:text-zinc-200' : 'text-zinc-650 dark:text-zinc-400'}`}>
                            {milestone.reached ? 'TERCAPAI' : 'BELUM'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>

              <div id="saving-motivation" className="border-t border-zinc-100 dark:border-zinc-700 pt-6 mt-6 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-zinc-500 dark:text-zinc-350 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-200">Menabung Lebih Mudah, Beribadah Lebih Tenang</p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed font-medium">
                    Sistem otomatis mengalkulasi sisa tabungan tersimpan. Untuk melakukan pengisian saldo tunai, silakan hubungi Bendahara atau Admin Sekolah dengan membawa buku tabungan Anda.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right Box: Saving Progress & Journey Visuals */}
            <motion.div 
              variants={itemVariants}
              className="lg:col-span-5 flex flex-col gap-6"
            >
              {/* Achievement Card */}
              <div className="bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200 p-8 rounded-[40px] shadow-2xl dark:shadow-none flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy className="w-32 h-32 text-white dark:text-zinc-900" />
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <CircularTargetGauge 
                    percentage={myProgressPercent} 
                    label="PROGRES" 
                    size={140}
                  />
                </div>
              </div>

                {/* Trend & Journey Card */}
              <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 p-6 rounded-[32px] shadow-xl shadow-zinc-200/50 dark:shadow-none flex flex-col group">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Grafik Perjalanan</h4>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">Tren Menabung Bulanan</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-full text-[9px] font-bold font-mono border border-zinc-200 dark:border-zinc-700">
                    <TrendingUp className="w-3 h-3" />
                    <span>AKTIF</span>
                  </div>
                </div>

                {/* Interactive Recharts Component */}
                <div className="h-48 w-full mt-2">
                  <InteractiveJourneyChart />
                </div>

                <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
                     <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Data Terkoneksi Langsung</span>
                   </div>
                   <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-black font-mono tracking-tighter">Jan — Jun 2026</p>
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <PaymentModal 
      isOpen={isPaymentModalOpen}
      onClose={() => setIsPaymentModalOpen(false)}
      onConfirm={(amount, method) => {
        onAddTransactionQuick(currentUser.id, amount, 'setor', `Tabungan via ${method.toUpperCase()}`);
      }}
    />

    <TargetSelectorModal 
      isOpen={isTargetModalOpen}
      onClose={() => setIsTargetModalOpen(false)}
      currentTarget={currentUser.targetHewan}
      onSelect={(type, amount) => {
        if (onUpdateTarget) onUpdateTarget(type, amount);
      }}
    />

    </div>
  );
}

// Helper to prevent some undefined react types
function onlySId(val: any) {
  return '';
}
