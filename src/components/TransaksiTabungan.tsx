/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRightLeft, 
  Search, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Trash2, 
  X, 
  SlidersHorizontal,
  FolderInput,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  FileDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { User, Transaksi, Notifikasi } from '../types';
import { getTransactions, saveTransactions, formatRupiah, getUsers, saveNotificationsAsync } from '../data';

interface TransaksiProps {
  currentUser: User;
  transactions: Transaksi[];
  users: User[];
  onUpdateTransactions: (newTxs: Transaksi[]) => void;
  selectedParticipantId?: string | null; // Filter opsional dari komponen lain
  notifications?: Notifikasi[];
  onUpdateNotifications?: (newNotifs: Notifikasi[]) => void;
}

export default function TransaksiTabungan({ 
  currentUser, 
  transactions, 
  users, 
  onUpdateTransactions,
  selectedParticipantId = null,
  notifications,
  onUpdateNotifications
}: TransaksiProps) {
  
  const isAdmin = currentUser.role === 'admin';

  // State pencarian & saring
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState(''); // 'setor' | 'tarik' | ''
  const [filterUser, setFilterUser] = useState(selectedParticipantId || '');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State (Hanya Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formUserId, setFormUserId] = useState('');
  const [formType, setFormType] = useState<'setor' | 'tarik'>('setor');
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // PDF Export Modal State & Formatting Options
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('Laporan Rekapitulasi Mutasi Tabungan Kurban');
  const [pdfPaperSize, setPdfPaperSize] = useState<'a4' | 'letter'>('a4');
  const [pdfOrientation, setPdfOrientation] = useState<'p' | 'l'>('p');
  const [pdfShowSignature, setPdfShowSignature] = useState(true);
  const [pdfIncludeNotes, setPdfIncludeNotes] = useState(true);
  const [pdfFilterType, setPdfFilterType] = useState<'semua' | 'setor' | 'tarik'>('semua');

  // State for beautiful transaction deletion confirmation modal
  const [txToDelete, setTxToDelete] = useState<Transaksi | null>(null);

  // Filter transaksi berdasarkan hak akses (role)
  // Guru dan siswa hanya boleh melihat transaksinya sendiri
  const visibleTransactions = isAdmin 
    ? transactions 
    : transactions.filter(t => t.userId === currentUser.id);

  // Proses Filter & Pencarian
  const filteredTxs = visibleTransactions.filter(t => {
    const matchesSearch = t.userName.toLowerCase().includes(search.toLowerCase()) || 
                          (t.notes && t.notes.toLowerCase().includes(search.toLowerCase())) ||
                          t.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = !filterType || t.type === filterType;
    const matchesUser = !filterUser || t.userId === filterUser;

    return matchesSearch && matchesType && matchesUser;
  });

  // Urutkan transaksi (terbaru berada paling atas)
  const sortedTxs = [...filteredTxs].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Pagination
  const totalItems = sortedTxs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTxs = sortedTxs.slice(startIndex, startIndex + itemsPerPage);

  // Mengubah search filter menyetel ulang ke halaman 1
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterUser(e.target.value);
    setCurrentPage(1);
  };

  // Menambah transaksi baru (Hanya Admin)
  const handleOpenModal = () => {
    setFormUserId(selectedParticipantId || '');
    setFormType('setor');
    setFormAmount('');
    setFormNotes('Tabungan Tunai Mandiri');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserId || !formAmount || parseFloat(formAmount) <= 0) return;

    const matchedUser = users.find(u => u.id === formUserId);
    if (!matchedUser) return;

    // Tambah log baru
    const newTx: Transaksi = {
      id: `tx-${Date.now()}`,
      userId: formUserId,
      userName: matchedUser.name,
      userRole: matchedUser.role,
      userKelas: matchedUser.kelas,
      amount: parseFloat(formAmount),
      type: formType,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      recordedBy: currentUser.name,
      notes: formNotes
    };

    const updated = [newTx, ...transactions];
    onUpdateTransactions(updated);

    // Kirim notifikasi sistem
    const newNotif: Notifikasi = {
      id: `nt-${Date.now()}_usr_${formUserId}`,
      userId: formUserId, // Menargetkan pemilik saldo yang sah
      title: formType === 'setor' ? 'Tabungan Berhasil' : 'Penarikan Sukses',
      message: `${formType === 'setor' ? 'Dana tabungan' : 'Penarikan'} sebesar ${formatRupiah(parseFloat(formAmount))} atas nama ${matchedUser.name} sukses diproses oleh Admin.`,
      type: 'success',
      date: new Date().toISOString(),
      read: false
    };

    if (onUpdateNotifications && notifications) {
      onUpdateNotifications([newNotif, ...notifications]);
    } else {
      const existingNotif = JSON.parse(localStorage.getItem('tk_notifications') || '[]');
      const updatedN = [newNotif, ...existingNotif];
      localStorage.setItem('tk_notifications', JSON.stringify(updatedN));
      saveNotificationsAsync(updatedN);
    }

    setFormAmount('');
    setIsModalOpen(false);
    
    // Tampilkan notifikasi toast/alert
    setAlertMsg('Transaksi berhasil disimpan dan diverifikasi ke sistem kurban.');
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Delete Transaction Trigger
  const handleDeleteTx = (t: Transaksi) => {
    setTxToDelete(t);
  };

  const confirmDeleteTx = () => {
    if (!txToDelete) return;
    const id = txToDelete.id;
    const updated = transactions.filter(t => t.id !== id);
    onUpdateTransactions(updated);
    setAlertMsg('Transaksi berhasil dihapus dari mutasi.');
    setTimeout(() => setAlertMsg(null), 3000);
    setTxToDelete(null);
  };

  // Ekspor PDF dengan format custom
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: pdfOrientation,
      unit: 'mm',
      format: pdfPaperSize,
    });

    let y = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Kop Surat Madrasah / Sekolah SMKN 46 Jakarta
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(24, 24, 27); // Zinc 800
    doc.text('SMKN 46 JAKARTA', pageWidth / 2, y, { align: 'center' });
    y += 5.5;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122); // Zinc 500
    doc.text('B7, Jl. Cipinang Pulo No.19, RT.7/RW.14, Cipinang Besar Utara, Jatinegara, Kota Jakarta Timur, Jakarta 13410', pageWidth / 2, y, { align: 'center' });
    y += 4.5;

    // Garis Kop Surat
    doc.setDrawColor(228, 228, 231); // Zinc 200
    doc.setLineWidth(0.4);
    doc.line(15, y, pageWidth - 15, y);
    y += 9;

    // Judul Dokumen Cetak
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(24, 24, 27);
    doc.text(pdfTitle.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 9;

    // Blok metadata cetak
    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(63, 63, 70); // Zinc 700

    // Informasi Kiri
    doc.text(`Identitas Pengunduh: ${currentUser.name} (${currentUser.role === 'admin' ? 'Administrator' : 'Peserta'})`, 15, y);
    
    // Informasi Kanan
    const currentHours = String(new Date().getHours()).padStart(2, '0');
    const currentMinutes = String(new Date().getMinutes()).padStart(2, '0');
    const formattedDate = `${new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })} pukul ${currentHours}:${currentMinutes} WIB`;
    doc.text(`Tanggal Cetak: ${formattedDate}`, pageWidth - 15, y, { align: 'right' });
    y += 5;

    doc.text(`Instansi Sekolah: SMKN 46 JAKARTA`, 15, y);
    const filterText = pdfFilterType === 'semua' ? 'Semua Riwayat' : pdfFilterType === 'setor' ? 'Hanya Penyetoran (Masuk)' : 'Hanya Penarikan (Tarik)';
    doc.text(`Kriteria Saring Dokumen: ${filterText}`, pageWidth - 15, y, { align: 'right' });
    y += 10;

    // Render Table Header
    doc.setFillColor(244, 244, 245); // Zinc 100
    doc.rect(15, y, pageWidth - 30, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(39, 39, 42); // Zinc 800

    doc.text('No', 18, y + 5.5);
    doc.text('ID Transaksi', 28, y + 5.5);
    doc.text('Keterangan / Kategori', 58, y + 5.5);
    doc.text('Jenis', 115, y + 5.5);
    doc.text('Tanggal', 135, y + 5.5);
    doc.text('Nominal (Rp)', pageWidth - 18, y + 5.5, { align: 'right' });
    y += 8;

    // Filter transaksi untuk dicetak
    const exportTxs = sortedTxs.filter(t => {
      if (pdfFilterType === 'setor') return t.type === 'setor';
      if (pdfFilterType === 'tarik') return t.type === 'tarik';
      return true;
    });

    let totalSetor = 0;
    let totalTarik = 0;

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(39, 39, 42); // Zinc 800

    if (exportTxs.length === 0) {
      doc.setDrawColor(244, 244, 245);
      doc.line(15, y, pageWidth - 15, y);
      doc.text('Belum ada transaksi mutasi yang terlampir dengan kriteria saring.', pageWidth / 2, y + 7, { align: 'center' });
      y += 12;
    } else {
      exportTxs.forEach((t, index) => {
        if (t.type === 'setor') totalSetor += t.amount;
        else totalTarik += t.amount;

        // Garis batas antar baris
        doc.setDrawColor(244, 244, 245);
        doc.setLineWidth(0.25);
        doc.line(15, y, pageWidth - 15, y);

        // Auto Page Break check
        if (y > doc.internal.pageSize.getHeight() - 35) {
          doc.addPage();
          y = 15;
          // Render ulang Header Tabel di halaman baru
          doc.setFillColor(244, 244, 245);
          doc.rect(15, y, pageWidth - 30, 8, 'F');
          doc.setFont('Helvetica', 'bold');
          doc.text('No', 18, y + 5.5);
          doc.text('ID Transaksi', 28, y + 5.5);
          doc.text('Keterangan / Kategori', 58, y + 5.5);
          doc.text('Jenis', 115, y + 5.5);
          doc.text('Tanggal', 135, y + 5.5);
          doc.text('Nominal (Rp)', pageWidth - 18, y + 5.5, { align: 'right' });
          y += 8;
          doc.setFont('Helvetica', 'normal');
        }

        // Tulis sel data
        doc.text(`${index + 1}`, 18, y + 5.5);
        doc.text(t.id.toUpperCase(), 28, y + 5.5);
        
        const desc = pdfIncludeNotes && t.notes 
          ? `${isAdmin ? t.userName : t.notes}` 
          : (isAdmin ? t.userName : 'Simpanan Tabungan Kurban');
        const truncatedDesc = desc.length > 32 ? desc.substring(0, 30) + '...' : desc;
        doc.text(truncatedDesc, 58, y + 5.5);

        const typeLabel = t.type === 'setor' ? 'MASUK' : 'TARIK';
        doc.text(typeLabel, 115, y + 5.5);
        doc.text(t.date, 135, y + 5.5);
        
        const amountSign = t.type === 'setor' ? '+' : '-';
        doc.text(`${amountSign} Rp ${t.amount.toLocaleString('id-ID')}`, pageWidth - 18, y + 5.5, { align: 'right' });

        y += 7.5;
      });
    }

    // Garis penutup tabel
    doc.setDrawColor(228, 228, 231); // Zinc 200
    doc.setLineWidth(0.4);
    doc.line(15, y, pageWidth - 15, y);
    y += 6;

    // Rekapitulasi Akhir
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 15;
    }

    // Box Rekapitulasi Berwarna Lunak
    doc.setFillColor(250, 250, 250); // Zinc 50
    doc.setDrawColor(244, 244, 245);
    doc.rect(pageWidth - 95, y, 80, 18, 'FD');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(82, 82, 91); // Zinc 600
    doc.text('REKAP MUTASI:', pageWidth - 90, y + 5);

    doc.setFont('Helvetica', 'normal');
    doc.text('Total Uang Masuk:', pageWidth - 90, y + 10);
    doc.setFont('Helvetica', 'bold');
    doc.text(`+ Rp ${totalSetor.toLocaleString('id-ID')}`, pageWidth - 20, y + 10, { align: 'right' });

    doc.setDrawColor(228, 228, 231);
    doc.line(pageWidth - 90, y + 12.5, pageWidth - 20, y + 12.5);
    doc.setTextColor(24, 24, 27); // Zinc 800
    doc.text(`Saldo Akhir: Rp ${(totalSetor - totalTarik).toLocaleString('id-ID')}`, pageWidth - 90, y + 16);

    y += 30;

    // Tanda tangan
    if (pdfShowSignature) {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 20;
      }
      
      const signDay = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(39, 39, 42);
      doc.text(`Jakarta, ${signDay}`, pageWidth - 65, y);
      y += 4;
      doc.text('Pengelola Tabungan Kurban,', pageWidth - 65, y);
      
      // Draw simulated ribbon signature vector in JS PDF
      const ribX = pageWidth - 45;
      const ribY = y + 2;
      
      // Draw Ribbon (Amber/Gold 500)
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.85);
      // Left ribbon leg
      doc.line(ribX - 3, ribY + 4, ribX + 2, ribY + 12);
      // Right ribbon leg
      doc.line(ribX + 3, ribY + 4, ribX - 2, ribY + 12);
      // Ribbon top loop
      doc.line(ribX - 3, ribY + 4, ribX, ribY + 1);
      doc.line(ribX + 3, ribY + 4, ribX, ribY + 1);
      
      // Scribble signature path (Blue 500) representing the custom handdrawn signature overlaying the ribbon
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.45);
      doc.line(ribX - 10, ribY + 8, ribX + 8, ribY + 5);
      doc.line(ribX - 6, ribY + 10, ribX + 12, ribY + 3);
      doc.line(ribX - 2, ribY + 5, ribX + 15, ribY + 7);
      
      y += 18;
      
      doc.setFont('Helvetica', 'bold');
      doc.text(currentUser.role === 'admin' ? currentUser.name : 'Panitia Tabungan SMK', pageWidth - 65, y);
      y += 4;
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(113, 113, 122);
      doc.text('SMKN 46 JAKARTA', pageWidth - 65, y);
    }

    // Trigger Download PDF
    const safeTitle = pdfTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    doc.save(`${safeTitle}_export.pdf`);
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-zinc-900">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-zinc-700 dark:text-zinc-400 font-mono font-bold tracking-wider uppercase">MODUL FINANSIAL KAS</span>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-zinc-300" />
            {isAdmin ? 'Mutasi & Transaksi Tabungan' : 'Riwayat Tabungan Saya'}
          </h2>
          <p className="text-xs text-zinc-400">
            {isAdmin 
              ? 'Tinjau serta kelola tabungan kurban tunai untuk seluruh siswa dan guru.' 
              : 'Daftar lengkap seluruh tabungan kurban yang telah Anda lakukan.'
            }
          </p>
        </div>

        {/* Add Transaction Button (Hanya Boleh Diakses Admin) */}
        {isAdmin && (
          <button
            id="btn-tambah-transaksi"
            onClick={handleOpenModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi Baru</span>
          </button>
        )}
      </div>

      {/* Success alert message toast */}
      {alertMsg && (
        <div id="tx-alert-toast" className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs rounded-xl p-3 flex items-start gap-2 max-w-xl font-medium shadow-sm">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Filters ledger */}
      <div className="bg-white border border-zinc-200 p-4 rounded-2xl flex flex-col lg:flex-row gap-4 justify-between items-center shadow-sm">
        {/* Search */}
        <div className="relative w-full lg:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari transaksi, keterangan, atau kode..."
            value={search}
            onChange={handleSearchChange}
            className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-bold"
          />
        </div>

        {/* Filter Section Removed as requested */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto lg:justify-end">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Menampilkan Data Mutasi Terbaru</div>
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow cursor-pointer border border-zinc-850"
            id="btn-ekspor-pdf"
          >
            <FileDown className="w-3.5 h-3.5 text-zinc-300" />
            <span>Ekspor Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* Main Ledger Feed Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-400 font-mono">
                <th className="py-4 px-5">ID Transaksi</th>
                <th className="py-4 px-5">Keterangan</th>
                {isAdmin && <th className="py-4 px-5">Peserta</th>}
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Tanggal</th>
                <th className="py-4 px-5 text-right">Nominal (Rp)</th>
                {isAdmin && <th className="py-4 px-5 text-right">Opsi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {paginatedTxs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 5} className="py-12 text-center text-zinc-500 font-medium font-sans">
                    Belum ada riwayat menabung yang terekam.
                  </td>
                </tr>
              ) : (
                paginatedTxs.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-4 px-5 font-mono text-[10px] text-zinc-400 font-bold">
                      {t.id.toUpperCase()}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-zinc-900 text-sm">{isAdmin ? t.userName : (t.notes || 'Isi Tabungan')}</div>
                      {isAdmin && t.userKelas && (
                        <span className="text-[10px] text-zinc-700 dark:text-zinc-400 block mt-0.5">Kelas: {t.userKelas}</span>
                      )}
                      {!isAdmin && (
                        <span className="text-[10px] text-zinc-700 dark:text-zinc-400 flex items-center gap-1 mt-0.5 font-bold">
                           <CheckCircle className="w-3 h-3 text-zinc-400" />
                           Terverifikasi oleh {t.recordedBy}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${
                          t.userRole === 'guru' 
                            ? 'bg-zinc-100 text-zinc-600 border-zinc-200' 
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}>
                          {t.userRole === 'guru' ? 'Guru' : 'Siswa/i'}
                        </span>
                      </td>
                    )}
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] border-2 text-[10px] font-black uppercase tracking-wider ${
                        t.type === 'setor'
                          ? 'bg-zinc-50 text-zinc-900 border-zinc-200'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}>
                        {t.type === 'setor' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {t.type === 'setor' ? 'Masuk' : 'Tarik'}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-zinc-700 dark:text-zinc-400">{t.date}</td>
                    <td className="py-4 px-5 text-right font-mono font-bold text-sm">
                      <span className={t.type === 'setor' ? 'text-zinc-900' : 'text-zinc-700'}>
                        {t.type === 'setor' ? '+' : '-'} {formatRupiah(t.amount)}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleDeleteTx(t)}
                          title="Hapus Transaksi"
                          className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all cursor-pointer border border-transparent hover:border-zinc-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination indicators */}
        {totalPages > 1 && (
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center text-xs text-zinc-700 dark:text-zinc-400 font-sans font-medium">
            <span>
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} Mutasi Keuangan
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white hover:bg-zinc-100 rounded border border-zinc-200 text-zinc-500 hover:text-zinc-900 disabled:opacity-35 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-zinc-700">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white hover:bg-zinc-100 rounded border border-zinc-200 text-zinc-500 hover:text-zinc-900 disabled:opacity-35 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PENAMBAH MUTASI (ADMIN ONLY) */}
      <AnimatePresence>
        {isModalOpen && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-xl relative z-10"
            >
              <div className="flex justify-between items-start pb-4 border-b border-zinc-100 mb-5">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-sans flex items-center gap-2">
                    <FolderInput className="w-5 h-5 text-zinc-500" />
                    Catat Tabungan Tunai
                  </h3>
                  <p className="text-[10px] text-zinc-700 dark:text-zinc-400">Mencatat mutasi masuk/keluar ke ledger kurban</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-750 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Pilih Anggota (Siswa/Guru) */}
                <div className="space-y-1">
                  <label htmlFor="tx-form-user" className="text-[10px] font-bold text-zinc-650 dark:text-zinc-300 tracking-wider uppercase font-mono">Pilih Anggota</label>
                  <select
                     id="tx-form-user"
                     value={formUserId}
                     onChange={(e) => setFormUserId(e.target.value)}
                     required
                     className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-sans"
                  >
                    <option value="">-- Pilih Anggota Tabungan --</option>
                    {users.filter(u => u.role !== 'admin').map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'siswa' ? `Siswa Kelas ${u.kelas}` : 'Guru'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Tipe Mutasi */}
                  <div className="space-y-1">
                    <label htmlFor="tx-form-type" className="text-[10px] font-bold text-zinc-650 dark:text-zinc-300 tracking-wider uppercase font-mono">Jenis Mutasi</label>
                    <select
                      id="tx-form-type"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400 font-sans"
                    >
                      <option value="setor">Tambah Saldo (+)</option>
                      <option value="tarik">Tarik Dana (-)</option>
                    </select>
                  </div>

                  {/* Nominal Transfer */}
                  <div className="space-y-1">
                    <label htmlFor="tx-form-amount" className="text-[10px] font-bold text-zinc-650 dark:text-zinc-300 tracking-wider uppercase font-mono">Nominal (Rp)</label>
                    <input
                      id="tx-form-amount"
                      type="number"
                      placeholder="Contoh: 1000000"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      required
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 font-mono"
                    />
                  </div>
                </div>

                {/* Catatan / Keterangan (Pesan) */}
                <div className="space-y-1">
                  <label htmlFor="tx-form-notes" className="text-[10px] font-bold text-zinc-650 dark:text-zinc-450 tracking-wider uppercase font-mono">Keterangan / Catatan</label>
                  <input
                    id="tx-form-notes"
                    type="text"
                    placeholder="Contoh: Tabungan minggu ke-3"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl py-2.5 px-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-bold"
                  />
                </div>

                {/* Submit button clicks */}
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-zinc-700 hover:bg-zinc-650 border border-zinc-600 text-zinc-350 hover:text-white rounded-xl text-xs font-semibold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-zinc-105 hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs transition"
                  >
                    Simpan Transaksi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL FORMAT DAN EKSPOR PDF (CONFIRMATION & CONFIGURATION FIRST) */}
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-[#f8fafc] border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 font-sans max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <div className="flex justify-between items-start pb-5 border-b border-zinc-150 mb-6 font-sans">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-900 border border-zinc-800 text-white rounded-2xl shadow-md shadow-zinc-900/10 flex items-center justify-center">
                    <FileDown className="w-6 h-6 text-zinc-100" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                      Pratinjau Laporan Tabungan Kurban
                    </h3>
                    <p className="text-[10px] font-extrabold tracking-wider uppercase font-mono mt-0.5 text-zinc-500">
                      Tinjau format sebelum mengunduh
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all cursor-pointer border border-zinc-100 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* LEFT SIDE: CONFIGURATION CONTROLS */}
                <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4 font-sans">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-900 font-mono mb-2">
                      Format & Konfigurasi
                    </h4>
                    
                    {/* Title */}
                    <div className="space-y-1">
                      <label htmlFor="pdf-form-title" className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase font-mono">Judul Laporan</label>
                      <input
                        id="pdf-form-title"
                        type="text"
                        value={pdfTitle}
                        onChange={(e) => setPdfTitle(e.target.value)}
                        required
                        className="w-full bg-white border border-zinc-200 rounded-xl py-2 px-3 text-xs text-zinc-900 font-bold focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 transition-all font-sans"
                      />
                    </div>

                    {/* Paper & Orientation */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="pdf-form-paper" className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase font-mono">Ukuran Kertas</label>
                        <select
                          id="pdf-form-paper"
                          value={pdfPaperSize}
                          onChange={(e) => setPdfPaperSize(e.target.value as any)}
                          className="w-full bg-white border border-zinc-200 rounded-xl py-2.5 px-3 text-xs text-zinc-900 font-bold focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 transition-all font-sans"
                        >
                          <option value="a4">A4 Standar</option>
                          <option value="letter">Letter (Kuarto)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="pdf-form-orient" className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase font-mono">Orientasi</label>
                        <select
                          id="pdf-form-orient"
                          value={pdfOrientation}
                          onChange={(e) => setPdfOrientation(e.target.value as any)}
                          className="w-full bg-white border border-zinc-200 rounded-xl py-2.5 px-3 text-xs text-zinc-900 font-bold focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 transition-all font-sans"
                        >
                          <option value="p">Potret (P)</option>
                          <option value="l">Lanskap (L)</option>
                        </select>
                      </div>
                    </div>

                    {/* Checkbox Options */}
                    <div className="space-y-2.5 border-t border-zinc-250/55 pt-4">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-700 font-bold select-none hover:text-zinc-950 transition-all">
                        <input
                          type="checkbox"
                          checked={pdfShowSignature}
                          onChange={(e) => setPdfShowSignature(e.target.checked)}
                          className="rounded border-zinc-300 accent-zinc-650 bg-zinc-100 border-zinc-300 text-zinc-600 focus:ring-zinc-400 h-4 w-4 cursor-pointer"
                          style={{ accentColor: '#4b5563' }}
                        />
                        <span>Tanda Tangan Pengelola</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-700 font-bold select-none hover:text-zinc-950 transition-all">
                        <input
                          type="checkbox"
                          checked={pdfIncludeNotes}
                          onChange={(e) => setPdfIncludeNotes(e.target.checked)}
                          className="rounded border-zinc-300 accent-zinc-650 bg-zinc-100 text-zinc-600 focus:ring-zinc-400 h-4 w-4 cursor-pointer"
                          style={{ accentColor: '#4b5563' }}
                        />
                        <span>Tampilkan Deskripsi/Catatan</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Help message */}
                  <div className="bg-zinc-100/90 border border-zinc-200 p-3.5 rounded-2xl hidden lg:block font-sans">
                    <p className="text-[10px] text-zinc-500 leading-normal font-semibold">
                      Lembar di samping kanan mensimulasikan cetakan akhir di atas kertas PDF. Garis pembatas warna gelap dan rekapitulasi data saldo akan disematkan secara dinamis saat Anda mengunduh.
                    </p>
                  </div>
                </div>

                {/* RIGHT SIDE: LIVE REPORT PREVIEW SHEET */}
                <div className="lg:col-span-7 flex flex-col justify-start">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-900 font-mono mb-2 font-sans">
                    Pratinjau Dokumen Cetak (Pratinjau PDF Langsung)
                  </h4>
                  
                  {/* Printable Sheet Simulation Container with Dynamic Aspect Ratio based on Orient/Size */}
                  <div 
                    className={`bg-white rounded-2xl p-6 border border-zinc-200/85 shadow-lg relative select-none font-sans overflow-hidden text-zinc-800 flex flex-col justify-between transition-all duration-300 w-full mx-auto ${
                      pdfOrientation === 'l' 
                        ? 'aspect-[1.414/1] min-h-[300px] max-w-full' 
                        : 'aspect-[0.707/1] min-h-[460px] max-w-[400px]'
                    }`}
                  >
                    {/* Top Header Section */}
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-black text-zinc-900 tracking-tight leading-none uppercase font-sans">
                            SMKN 46 Jakarta
                          </div>
                          <div className="text-[7px] text-zinc-500 leading-tight mt-1 max-w-[240px] font-medium font-sans">
                            B7, Jl. Cipinang Pulo No.19, RT.7/RW.14, Cipinang Besar Utara, Jatinegara, Kota Jakarta Timur, Jakarta 13410
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-[7px] font-bold text-zinc-400 tracking-widest uppercase leading-none">
                            WAKTU CETAK
                          </div>
                          <div className="text-[8.5px] font-black text-zinc-700 mt-1 leading-none font-sans">
                            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pukul {String(new Date().getHours()).padStart(2, '0')}:{String(new Date().getMinutes()).padStart(2, '0')} WIB
                          </div>
                        </div>
                      </div>

                      {/* Black/Gray separator line */}
                      <div className="h-[2px] bg-zinc-900 mt-3 mb-4 w-full"></div>

                      {/* Title and Summary */}
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-center font-black text-zinc-900 text-xs tracking-tight uppercase line-clamp-2 underline decoration-zinc-900 decoration-2 underline-offset-4 font-sans_bold">
                            {pdfTitle || 'LAPORAN REKAPITULASI TABUNGAN KURBAN'}
                          </h5>
                        </div>

                        {/* Document metadata info table with 2 columns */}
                        <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-650 border border-zinc-150 rounded-xl p-2.5 bg-zinc-50 font-sans">
                          <div>
                            <span className="text-[8px] text-zinc-400 uppercase font-mono block font-bold leading-normal">Pemilik Rekening</span>
                            <span className="font-bold text-zinc-850 truncate block mt-0.5">{currentUser.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-zinc-400 uppercase font-mono block font-bold leading-normal">Format Kertas</span>
                            <span className="font-extrabold text-zinc-850 uppercase tracking-tight block mt-0.5">
                              {pdfPaperSize.toUpperCase()} / {pdfOrientation === 'p' ? 'Potret' : 'Lanskap'}
                            </span>
                          </div>
                        </div>

                        {/* Simulated mini transactions table dynamically filtered */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[8px] text-zinc-450 uppercase font-mono tracking-wider block font-bold text-zinc-500">Ringkasan Tabel Laporan (Daftar Mutasi)</span>
                          
                          <div className="border border-zinc-150 rounded-xl overflow-hidden text-[8.5px]">
                            <div className="grid grid-cols-12 bg-zinc-100 p-2 font-black text-zinc-700 border-b border-zinc-150">
                              <span className="col-span-8">Keterangan Deskripsi</span>
                              <span className="col-span-4 text-right">Nominal (Rupiah)</span>
                            </div>
                            {(() => {
                              const previewFilter = sortedTxs.filter(t => {
                                if (pdfFilterType === 'setor') return t.type === 'setor';
                                if (pdfFilterType === 'tarik') return t.type === 'tarik';
                                return true;
                              });
                              const displayedTxs = previewFilter.slice(0, 3);
                              
                              if (previewFilter.length === 0) {
                                return (
                                  <div className="p-3 text-center text-zinc-400 italic font-medium bg-white">
                                    [ Tidak ada mutasi yang sesuai kriteria saring ]
                                  </div>
                                );
                              }
                              
                              return (
                                <>
                                  {displayedTxs.map((t) => (
                                    <div key={t.id} className="grid grid-cols-12 p-2 border-b border-zinc-100 text-zinc-650 font-semibold bg-white last:border-none">
                                      <span className="col-span-8 truncate font-sans">
                                        {pdfIncludeNotes && t.notes ? t.notes : (t.type === 'setor' ? 'Setoran Tabungan Mandiri' : 'Tarikan Tabungan')}
                                      </span>
                                      <span className="col-span-4 text-right font-mono font-bold text-zinc-900">
                                        {t.type === 'setor' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  ))}
                                  {previewFilter.length > 3 && (
                                    <div className="p-1 px-2 text-center text-[7.5px] font-mono text-zinc-450 bg-zinc-50 border-t border-zinc-100 font-semibold">
                                      + {previewFilter.length - 3} mutasi lainnya disajikan di cetakan lembar kertas PDF...
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Simulated signature on the bottom */}
                    <div className="pt-4 mt-4 border-t border-dashed border-zinc-200 flex justify-between items-end font-sans">
                      <div className="text-[8px] text-zinc-400 font-mono font-medium leading-normal max-w-[190px]">
                        Dokumen laporan ini diterbitkan secara resmi dari platform digital Tabungan Kurban SMKN 46 Jakarta.
                      </div>
                      {pdfShowSignature ? (
                        <div className="text-right pr-2">
                          <div className="text-[7.5px] text-zinc-450 uppercase font-mono tracking-wider font-extrabold text-zinc-800">VERIFIKATOR SAH</div>
                          <div className="h-10 w-24 my-1.5 bg-amber-50/50 border border-amber-200/80 rounded-lg flex items-center justify-center relative overflow-hidden select-none">
                            {/* Signature Scribble loop overlay */}
                            <svg className="absolute inset-0 w-full h-full text-blue-500/80" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M 12 28 C 25 15, 30 10, 48 24 C 60 38, 70 8, 88 18" stroke="#3b82f6" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M 22 25 C 38 10, 50 32, 68 15" stroke="#3b82f6" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {/* Gold ribbon icon */}
                            <div className="text-sm text-amber-500 z-10 flex items-center justify-center filter drop-shadow font-sans mr-0.5 select-none font-bold">
                              🎗️
                            </div>
                            <span className="text-[7.5px] font-mono font-black text-amber-700/90 z-10 tracking-widest mt-0.5 uppercase">SAH</span>
                          </div>
                          <div className="text-[8.5px] font-black text-zinc-800 leading-none">
                            {currentUser.role === 'admin' ? currentUser.name : 'Panitia Kurban'}
                          </div>
                          <div className="text-[7.5px] text-zinc-450 mt-0.5 leading-none font-bold">SMKN 46 JAKARTA</div>
                        </div>
                      ) : (
                        <div className="text-[7.5px] italic text-zinc-400 font-bold">[ Tanda tangan dinonaktifkan ]</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Footer */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-5 mt-6 border-t border-zinc-200 font-sans">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-6 py-3 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 text-center font-sans"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-7 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-zinc-900/10 active:scale-95 text-center border border-zinc-850 font-sans"
                >
                  <FileDown className="w-4 h-4 text-zinc-300" />
                  <span>Unduh PDF Sekarang</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL KONFIRMASI HAPUS TRANSAKSI (Custom popup) */}
      <AnimatePresence>
        {txToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 text-zinc-900 font-sans cursor-default"
            >
              <div className="flex items-center gap-3 text-zinc-800">
                <Trash2 className="w-6 h-6 flex-shrink-0 text-zinc-905" />
                <h3 className="text-base font-black tracking-tight text-zinc-950 uppercase">Hapus Transaksi</h3>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-zinc-700 leading-relaxed font-semibold">
                  Apakah Anda yakin ingin menghapus transaksi tabungan milik <span className="text-zinc-950 font-black">"{txToDelete.userName}"</span>?
                </p>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-[11px] font-mono select-none space-y-1 text-zinc-650">
                  <div><span className="text-zinc-400">Jenis:</span> {txToDelete.type === 'setor' ? 'SETORAN (MASUK)' : 'PENARIKAN (KELUAR)'}</div>
                  <div><span className="text-zinc-400 font-sans">Jumlah:</span> {formatRupiah(txToDelete.amount)}</div>
                  <div><span className="text-zinc-400">Tanggal:</span> {new Date(txToDelete.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  {txToDelete.notes && <div><span className="text-zinc-400">Catatan:</span> {txToDelete.notes}</div>}
                </div>
                <p className="text-[10px] text-zinc-500 font-bold leading-normal">
                  Keterangan: Menghapus transaksi ini otomatis akan menyesuaikan total saldo berjalan dan mengembalikan nominal target pencapaian tabungan kurban semula.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition cursor-pointer border border-zinc-200 font-sans"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTx}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-850 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md active:scale-95"
                >
                  Ya, Hapus Transaksi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
