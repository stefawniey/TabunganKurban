/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  FileSpreadsheet, 
  Download, 
  SlidersHorizontal, 
  Calendar, 
  CheckCircle, 
  School, 
  Printer, 
  FileCheck2,
  X,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { User, Transaksi } from '../types';
import { getUserBalance, formatRupiah, getHewanLabel } from '../data';

interface LaporanTabunganProps {
  users: User[];
  transactions: Transaksi[];
}

export default function LaporanTabungan({ users, transactions }: LaporanTabunganProps) {
  // Load current user from session if available for print signature
  const savedSession = localStorage.getItem('tk_current_user');
  let currentUserName = "Administrator";
  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession);
      currentUserName = parsed.name || currentUserName;
    } catch (e) {}
  }

  // States Saring
  const [filterKelas, setFilterKelas] = useState('');
  const [filterBulan, setFilterBulan] = useState(''); // '1' (Jan), '2' (Feb), ..., '6' (Jun)
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [previewDocOpen, setPreviewDocOpen] = useState(false);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [pdfTitle, setPdfTitle] = useState('LAPORAN REKAPITULASI GURU & SISWA');
  const [pdfPaperSize, setPdfPaperSize] = useState<'a4' | 'letter'>('a4');
  const [pdfOrientation, setPdfOrientation] = useState<'p' | 'l'>('p');
  const [pdfShowSignature, setPdfShowSignature] = useState(true);
  const [pdfIncludeNotes, setPdfIncludeNotes] = useState(true);

  // Ambil kelas unik untuk dropdown
  const uniqueClasses = Array.from(
    new Set(users.filter(u => u.role === 'siswa' && u.kelas).map(u => u.kelas!))
  );

  // Bulan Indonesian Mapping
  const bulanList = [
    { value: '0', label: 'Januari' },
    { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' },
    { value: '3', label: 'April' },
    { value: '4', label: 'Mei' },
    { value: '5', label: 'Juni' },
  ];

  // Logic Saringan
  // 1. Dapatkan daftar pengguna non-admin yang cocok dengan saring kelas
  const filteredUsers = users.filter((u) => {
    if (u.role === 'admin') return false;
    if (filterKelas && u.role === 'siswa' && u.kelas !== filterKelas) return false;
    // Jika saring kelas diaktifkan, sembunyikan guru karena guru tidak memiliki atribut kelas
    if (filterKelas && u.role === 'guru') return false;
    return true;
  });

  // 2. Dapatkan transaksi yang mencakup pengguna tersaring, dan cocok saringnya bulan
  const reportTransactions = transactions.filter((t) => {
    // Apakah transaksi milik pengguna dalam filteredUsers?
    const hasUser = filteredUsers.some(u => u.id === t.userId);
    if (!hasUser) return false;

    // Apakah cocok dengan saring bulan?
    if (filterBulan) {
      const txMonth = new Date(t.date).getMonth(); // 0 = Jan, 5 = Jun
      if (txMonth !== parseInt(filterBulan)) return false;
    }

    return true;
  });

  // Hitung Agregasi Keuangan untuk Saring Terpilih
  const totalDanaMasuk = reportTransactions
    .filter(t => t.type === 'setor')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDanaKeluar = reportTransactions
    .filter(t => t.type === 'tarik')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSaldoBersih = totalDanaMasuk - totalDanaKeluar;

  // hitung rata-rata target kurban dari filtered users
  let avgCompletionPct = 0;
  if (filteredUsers.length > 0) {
    const totalTargets = filteredUsers.reduce((sum, u) => sum + (u.targetAmount || 3500000), 0);
    const totalDeposited = filteredUsers.reduce((sum, u) => {
      // Hanya menghitung setoran yang ada di sistem
      const userTxs = transactions.filter(t => t.userId === u.id);
      const userBalance = userTxs.reduce((s, t) => t.type === 'setor' ? s + t.amount : s - t.amount, 0);
      return sum + Math.min(userBalance, u.targetAmount || 3500000);
    }, 0);
    avgCompletionPct = Math.round((totalDeposited / totalTargets) * 100);
  }

  // Real Ekspor PDF menggunakan jsPDF
  const handleSimulateExport = () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
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
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 50); // Darker grey
      doc.text('B7, Jl. Cipinang Pulo No.19, RT.7/RW.14, Cipinang Besar Utara, Jatinegara, Kota Jakarta Timur, Jakarta 13410', pageWidth / 2, y, { align: 'center' });
      y += 4.5;

      // Garis Kop Surat
      doc.setDrawColor(228, 228, 231); // Zinc 200
      doc.setLineWidth(0.4);
      doc.line(15, y, pageWidth - 15, y);
      y += 9;

      // Judul Dokumen Cetak
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(24, 24, 27);
      doc.text(pdfTitle.toUpperCase(), pageWidth / 2, y, { align: 'center' });
      y += 7;

      // Blok metadata cetak
      doc.setFontSize(8);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(40, 40, 40); // Darker grey

      // Informasi Kiri
      const saringKelasText = filterKelas ? `Kelas ${filterKelas}` : 'Semua Kelas & Guru';
      doc.text(`Identitas Pengunduh: ${currentUserName} (Administrator)`, 15, y);
      
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

      doc.text(`Kriteria Saringan: ${saringKelasText}`, 15, y);
      const isFilteredBulanStr = filterBulan ? bulanList[parseInt(filterBulan)].label : 'Semua Bulan';
      doc.text(`Periode Bulan: ${isFilteredBulanStr} 2026`, pageWidth - 15, y, { align: 'right' });
      y += 10;

      // Render Table Header (gray background as requested)
      doc.setFillColor(244, 244, 245); // Zinc 100
      doc.rect(15, y, pageWidth - 30, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(39, 39, 42); // Zinc 800

      doc.text('No', 18, y + 5.5);
      doc.text('Kode Transaksi', 26, y + 5.5);
      doc.text('Nama Peserta', 55, y + 5.5);
      doc.text('Situasi / Kelas', 105, y + 5.5);
      doc.text('Jenis', 135, y + 5.5);
      doc.text('Nominal (Rp)', pageWidth - 18, y + 5.5, { align: 'right' });
      y += 8;

      doc.setFont('Helvetica', 'normal');

      if (reportTransactions.length === 0) {
        doc.setDrawColor(244, 244, 245);
        doc.line(15, y, pageWidth - 15, y);
        doc.text('Belum ada transaksi mutasi yang terlampir dengan kriteria saring.', pageWidth / 2, y + 7, { align: 'center' });
        y += 12;
      } else {
        reportTransactions.forEach((tx, index) => {
          // Alternating row background (gray stripes)
          if (index % 2 === 0) {
            doc.setFillColor(249, 250, 251); // Gray 50
            doc.rect(15, y, pageWidth - 30, 7.5, 'F');
          }

          // Auto Page Break check
          if (y > doc.internal.pageSize.getHeight() - 35) {
            doc.addPage();
            y = 15;
            // Render Header Tabel di halaman baru
            doc.setFillColor(244, 244, 245);
            doc.rect(15, y, pageWidth - 30, 8, 'F');
            doc.setFont('Helvetica', 'bold');
            doc.text('No', 18, y + 5.5);
            doc.text('Kode Transaksi', 26, y + 5.5);
            doc.text('Nama Peserta', 55, y + 5.5);
            doc.text('Situasi / Kelas', 105, y + 5.5);
            doc.text('Jenis', 135, y + 5.5);
            doc.text('Nominal (Rp)', pageWidth - 18, y + 5.5, { align: 'right' });
            y += 8;
            doc.setFont('Helvetica', 'normal');
          }

          doc.text(`${index + 1}`, 18, y + 5.5);
          doc.text(tx.id.toUpperCase(), 26, y + 5.5);
          
          const maxNameLen = 22;
          const participantName = tx.userName.length > maxNameLen ? tx.userName.substring(0, maxNameLen - 2) + '..' : tx.userName;
          doc.text(participantName, 55, y + 5.5);
          
          const roleLabel = tx.userRole === 'guru' ? 'Dewan Guru' : tx.userKelas;
          doc.text(roleLabel, 105, y + 5.5);
          
          const directionLabel = tx.type === 'setor' ? 'MASUK' : 'TARIK';
          doc.text(directionLabel, 135, y + 5.5);
          
          const directSign = tx.type === 'setor' ? '+' : '-';
          doc.text(`${directSign} Rp ${tx.amount.toLocaleString('id-ID')}`, pageWidth - 18, y + 5.5, { align: 'right' });

          y += 7;
        });
      }

      // Garis penutup tabel
      doc.setDrawColor(228, 228, 231); // Zinc 200
      doc.setLineWidth(0.3);
      doc.line(15, y, pageWidth - 15, y);
      y += 6;

      // Rekapitulasi Akhir Box
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 15;
      }

      doc.setFillColor(255, 255, 255); // Changed to white
      doc.setDrawColor(200, 200, 200); // Light grey border
      doc.rect(pageWidth - 95, y, 80, 20, 'FD');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(82, 82, 91); // Zinc 600
      doc.text('REKAP DANA LAPORAN:', pageWidth - 90, y + 4.5);

      doc.setFont('Helvetica', 'normal');
      doc.text('Total Dana Masuk:', pageWidth - 90, y + 9.5);
      doc.setFont('Helvetica', 'bold');
      doc.text(`+ Rp ${totalDanaMasuk.toLocaleString('id-ID')}`, pageWidth - 20, y + 9.5, { align: 'right' });

      doc.setDrawColor(228, 228, 231);
      doc.line(pageWidth - 90, y + 11.5, pageWidth - 20, y + 11.5);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(39, 39, 42);
      doc.text('Total Penarikan:', pageWidth - 90, y + 14.5);
      doc.text(`- Rp ${totalDanaKeluar.toLocaleString('id-ID')}`, pageWidth - 20, y + 14.5, { align: 'right' });
      
      doc.line(pageWidth - 90, y + 16, pageWidth - 20, y + 16);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Saldo Akhir Bersih: Rp ${totalSaldoBersih.toLocaleString('id-ID')}`, pageWidth - 90, y + 18.5);

      y += 24;

      // Tanda tangan
      if (pdfShowSignature) {
        if (y > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          y = 20;
        }

        const signDay = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(39, 39, 42);
        
        // Signature placeholder
        // Left Sign: Kepsek (Removed as requested)


        doc.setFontSize(7.5);
        doc.text('VERIFIKATOR SAH', pageWidth - 25, y, { align: 'right' });
        
        // Ribbon Signature (simulated)
        const ribX = pageWidth - 35;
        const ribY = y + 2;

        // Draw Amber Box background
        doc.setFillColor(255, 251, 235); // Amber 50
        doc.setDrawColor(245, 158, 11); // Amber 500
        doc.setLineWidth(0.1);
        doc.roundedRect(ribX - 12, ribY - 1, 25, 14, 2, 2, 'FD'); // Amber Box

        // Draw Ribbon (Amber 500)
        doc.setDrawColor(245, 158, 11); // Amber 500
        doc.setLineWidth(0.85);
        // Left ribbon leg
        doc.line(ribX - 3, ribY + 4, ribX + 2, ribY + 12);
        // Right ribbon leg
        doc.line(ribX + 3, ribY + 4, ribX - 2, ribY + 12);
        // Ribbon top loop
        doc.line(ribX - 3, ribY + 4, ribX, ribY + 1);
        doc.line(ribX + 3, ribY + 4, ribX, ribY + 1);
        
        // Scribble signature path (Blue 500 - as user original liked blue)
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.45);
        doc.line(ribX - 10, ribY + 8, ribX + 8, ribY + 5);
        doc.line(ribX - 6, ribY + 10, ribX + 12, ribY + 3);
        doc.line(ribX - 2, ribY + 5, ribX + 15, ribY + 7);
        
        // Text
        doc.setTextColor(39, 39, 42); // Zinc 800
        doc.setFont('Helvetica', 'bold');
        doc.text('Panitia Tabungan SMK', pageWidth - 25, y + 18, { align: 'right' });
        doc.text('SMKN 46 JAKARTA', pageWidth - 25, y + 21, { align: 'right' });
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
      }

      // Simpan file
      doc.save(`laporan_tabungan_kurban_admin_${new Date().getFullYear()}.pdf`);

      setIsExporting(false);
      setExportSuccess(true);
      setIsExportModalOpen(false);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (error) {
      console.error(error);
      setIsExporting(false);
    }
  };

  // Trigger Print Browser secara langsung untuk keaslian cetak PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-zinc-500 font-mono font-bold tracking-wider uppercase">ARSIP ADMINISTRASI</span>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-zinc-300" />
            Laporan Tabungan Berkala
          </h2>
          <p className="text-xs text-zinc-400">Buat laporan tabungan kurban berdasarkan kelas dan periode bulan.</p>
        </div>

        {/* Buttons to trigger document print view */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            id="btn-export-pdf"
            onClick={() => setIsExportModalOpen(true)}
            disabled={isExporting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {isExporting ? (
              <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExporting ? 'Mengekspor...' : 'Ekspor Laporan (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Success notification alerts */}
      {exportSuccess && (
        <div id="export-success-banner" className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-xs rounded-xl p-3 flex items-start gap-2 max-w-xl font-medium shadow-sm">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500" />
          <div>
            <span className="font-bold">Ekspor Berhasil!</span>
            <p className="text-[11px] text-zinc-550 dark:text-zinc-400 mt-0.5">Sistem telah mempersiapkan formulir laporan kurban <code className="bg-zinc-200 dark:bg-zinc-950 px-1 py-0.5 rounded font-mono">laporan_kurban_2026.pdf</code> untuk diunduh.</p>
          </div>
        </div>
      )}

      {/* Saring dan Panel */}

      {/* Aggregate Widgets for Specific Saring (Indonesian visual bento layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Total Tabungan */}
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-zinc-400 font-bold font-mono uppercase tracking-wider block">Total Tabungan Terlapor</span>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-1">{formatRupiah(totalDanaMasuk)}</p>
          <p className="text-[10px] text-zinc-500 mt-2">Akumulasi uang masuk dalam saringan ini</p>
        </div>

        {/* Saldo Akhir Bersih */}
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm">
          <span className="text-[10px] text-zinc-400 font-bold font-mono uppercase tracking-wider block">Saldo Bersih Terhimpun</span>
          <p className="text-xl font-bold font-mono text-zinc-900 mt-1">{formatRupiah(totalSaldoBersih)}</p>
          <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-2">
            <span>Rata-rata Target:</span>
            <span className="font-mono text-zinc-900 font-bold">{avgCompletionPct}%</span>
          </div>
        </div>
      </div>

      {/* Table representing report matching list */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center text-xs font-semibold text-zinc-500 font-mono">
          <span>TABEL RINCIAN MUTASI ( {reportTransactions.length} baris terekam )</span>
          <span className="text-zinc-500">Mata Uang Rupiah (IDR)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                <th className="py-3 px-5">Kode Transaksi</th>
                <th className="py-3 px-5">Peserta</th>
                <th className="py-3 px-5">Jenis</th>
                <th className="py-3 px-5">Tanggal</th>
                <th className="py-3 px-5">Deskripsi Mutasi</th>
                <th className="py-3 px-5 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {reportTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium font-sans">
                    <Inbox className="w-8 h-8 text-zinc-500 mx-auto mb-2 opacity-50" />
                    Tidak ditemukan kecocokan mutasi untuk penyaringan Kelas "{filterKelas || 'Semua'}" pada Bulan "{filterBulan ? bulanList[parseInt(filterBulan)].label : 'Semua'}".
                  </td>
                </tr>
              ) : (
                reportTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-700/25 transition-colors">
                    <td className="py-3 px-5 font-mono text-[10px] text-zinc-500">{t.id.toUpperCase()}</td>
                    <td className="py-3 px-5">
                      <div className="font-bold text-zinc-900">{t.userName}</div>
                      <div className="text-[10px] text-zinc-500">
                        {t.userRole === 'siswa' ? `Siswa - ${t.userKelas}` : 'Guru / Staff'}
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        t.type === 'setor' ? 'text-zinc-800 bg-zinc-100 border border-zinc-200' : 'text-zinc-700 bg-zinc-100 border border-zinc-200'
                      }`}>
                        {t.type === 'setor' ? 'MASUK' : 'TARIK'}
                      </span>
                    </td>
                    <td className="py-3 px-5 font-mono text-zinc-500">{t.date}</td>
                    <td className="py-3 px-5 text-zinc-600">{t.notes || '-'}</td>
                    <td className="py-3 px-5 text-right font-mono font-bold text-zinc-900">
                      {formatRupiah(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DOCUMENT PREVIEW DIALOUGE - RENDERS printable paper document */}
      <AnimatePresence>
        {previewDocOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Dark background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewDocOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Document sheet wrapper */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-white text-zinc-900 p-6 md:p-10 rounded-2xl shadow-2xl relative z-10 my-8 overflow-hidden font-sans border border-zinc-250 select-none print:m-0 print:p-0 print:rounded-none print:shadow-none"
            >
              {/* Doc tools header (non-printable) */}
              <div className="flex justify-between items-center pb-4 border-b border-zinc-200 mb-6 print:hidden">
                <span className="text-xs font-bold text-zinc-500 tracking-wider font-mono uppercase bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200">Pratinjau Kertas Laporan</span>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transitioncursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Dokumen
                  </button>
                  <button
                    onClick={() => setPreviewDocOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-650 rounded-lg interaction-all hover:bg-zinc-100 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PRINTABLE DOKUMEN LAPORAN - White paper theme */}
              <div id="printable-area" className="space-y-6">
                
                {/* Scholastic Header (Kop Surat) */}
                <div className="flex items-center justify-between border-b-4 border-zinc-800 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-zinc-100 rounded-xl border border-zinc-300">
                      <School className="w-10 h-10 text-zinc-800" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-extrabold tracking-tight uppercase">PEMERINTAH PROVINSI DKI JAKARTA</h3>
                      <h4 className="text-md font-bold tracking-tight -mt-0.5 text-zinc-700">SMK NEGERI 46 JAKARTA</h4>
                      <p className="text-[10px] text-zinc-500 font-medium">Jl. Cipinang Pulo No.19, Jatinegara, Jakarta Timur | Telp: (021) 8195127</p>
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-zinc-400 hidden sm:block">
                    <span className="block font-bold text-zinc-800">LEMBAR ASLI</span>
                    <span>No. Dokumen: HB-KRB-2026-03</span>
                  </div>
                </div>

                {/* Doc Title */}
                <div className="text-center space-y-1 py-2">
                  <h2 className="text-md md:text-lg font-black tracking-wide uppercase underline">LAPORAN REKAPITULASI TABUNGAN KURBAN DIGITAL</h2>
                  <p className="text-xs font-medium text-zinc-600">
                    Saringan Kelas: <span className="font-bold text-zinc-900">{filterKelas || 'Semua Kelas & Guru'}</span> | Periode Bulan: <span className="font-bold text-zinc-900">{filterBulan ? bulanList[parseInt(filterBulan)].label : 'Semua Bulan (Jan-Jun)'} 2026</span>
                  </p>
                </div>

                {/* Doc brief totals */}
                <div className="grid grid-cols-3 gap-4 border border-zinc-200 p-4 rounded-xl bg-zinc-50 text-xs">
                  <div>
                    <span className="text-zinc-500 block font-semibold text-[10px] uppercase">Jumlah Dana Terkumpul</span>
                    <span className="text-sm font-bold text-zinc-900 font-mono">{formatRupiah(totalDanaMasuk)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block font-semibold text-[10px] uppercase">Dana Penarikan Sisa</span>
                    <span className="text-sm font-bold text-zinc-900 font-mono">{formatRupiah(totalDanaKeluar)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block font-semibold text-[10px] uppercase">Saldo Bersih Yayasan</span>
                    <span className="text-sm font-black text-zinc-900 font-mono">{formatRupiah(totalSaldoBersih)}</span>
                  </div>
                </div>

                {/* Detailed Document Table list inside whitespace */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 border-b border-zinc-200 text-[10px] font-bold text-zinc-700 uppercase font-mono">
                        <th className="py-2.5 px-4">KODE TX</th>
                        <th className="py-2.5 px-4">NAMA PESERTA</th>
                        <th className="py-2.5 px-4">SITUASI / KELAS</th>
                        <th className="py-2.5 px-4">KETERANGAN</th>
                        <th className="py-2.5 px-4 text-right">JUMLAH (Rp)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {reportTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500 font-medium">
                            Tidak ada data untuk dicetak dalam kriteria saring ini.
                          </td>
                        </tr>
                      ) : (
                        reportTransactions.map((tx) => (
                          <tr key={tx.id} className="text-[11px] hover:bg-zinc-550/5">
                            <td className="py-2 px-4 font-mono text-[9px] text-zinc-500">{tx.id.toUpperCase()}</td>
                            <td className="py-2 px-4 font-bold text-zinc-900">{tx.userName}</td>
                            <td className="py-2 px-4 text-zinc-650">{tx.userRole === 'guru' ? 'Dewan Guru' : tx.userKelas}</td>
                            <td className="py-2 px-4 text-zinc-650 truncate max-w-[170px]">{tx.notes || 'Tanpa catatan'}</td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-zinc-900">{formatRupiah(tx.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Sign Board layout (Tanda Tangan lembar resmi) */}
                <div className="grid grid-cols-1 gap-8 pt-10 text-xs">

                  {/* Ribbon Verified Signature */}
                  <div className="flex flex-col items-center">
                      <div className="text-[8px] text-zinc-400 font-mono font-medium leading-normal max-w-[190px] text-center mb-4">
                        Dokumen laporan ini diterbitkan secara resmi dari platform digital Tabungan Kurban SMKN 46 Jakarta.
                      </div>
                      <div className="text-right pr-2">
                        <div className="text-[7.5px] text-zinc-450 uppercase font-mono tracking-wider font-extrabold text-zinc-800">VERIFIKATOR SAH</div>
                  <div className="h-10 w-24 my-1.5 bg-zinc-100 border border-zinc-200 rounded-lg flex items-center justify-center relative overflow-hidden select-none">
                    <svg className="absolute inset-0 w-full h-full text-blue-500/80" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 12 28 C 25 15, 30 10, 48 24 C 60 38, 70 8, 88 18" stroke="#3b82f6" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 22 25 C 38 10, 50 32, 68 15" stroke="#3b82f6" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-sm text-zinc-500 z-10 flex items-center justify-center filter drop-shadow font-sans mr-0.5 select-none font-bold">
                      🎗️
                    </div>
                    <span className="text-[7.5px] font-mono font-black text-zinc-700 z-10 tracking-widest mt-0.5 uppercase">SAH</span>
                  </div>
                  <div className="text-[8.5px] font-black text-zinc-800 leading-none">Panitia Tabungan SMK</div>
                  <div className="text-[7.5px] text-zinc-450 mt-0.5 leading-none font-bold">SMKN 46 JAKARTA</div>
                </div>
                  </div>
                </div>

                {/* Fine print watermark footer */}
                <div className="border-t border-dashed border-zinc-200 pt-3 text-[9px] text-zinc-400 font-medium text-center">
                  * Laporan dicetak otomatis oleh Sistem Tabungan Kurban Digital Terintegrasi. Segala perubahan nominal tanpa pengesahan fisik bendahara tidak dianggap sah.
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Ekspor PDF Interaktif (Sejalan dengan yang ada di akun siswa / guru) */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 print:hidden overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-4xl bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 font-sans max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <div className="flex justify-between items-start pb-5 border-b border-zinc-200 mb-6 font-sans">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white border border-zinc-200 text-zinc-950 rounded-2xl shadow-md flex items-center justify-center">
                    <Download className="w-6 h-6 text-zinc-950" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                      Pratinjau Hasil Laporan Kurban (Admin)
                    </h3>
                    <p className="text-[10px] font-extrabold tracking-wider uppercase font-mono mt-0.5 text-zinc-500">
                      Tinjau format & kriteria sebelum mengunduh PDF
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all cursor-pointer border border-zinc-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* LEFT SIDE: CONFIGURATION CONTROLS */}
                <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4 font-sans text-zinc-700">
                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 font-mono mb-2">
                      Format & Konfigurasi Laporan
                    </h4>
                    
                    {/* Title input */}
                    <div className="space-y-1">
                      <label htmlFor="admin-pdf-title" className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono">Judul Laporan Resmi</label>
                      <input
                        id="admin-pdf-title"
                        type="text"
                        value={pdfTitle}
                        onChange={(e) => setPdfTitle(e.target.value)}
                        required
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-xs text-zinc-900 font-bold focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all font-sans"
                      />
                    </div>

                    {/* Paper & Orientation */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="admin-pdf-paper" className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono">Ukuran Kertas</label>
                        <select
                          id="admin-pdf-paper"
                          value={pdfPaperSize}
                          onChange={(e) => setPdfPaperSize(e.target.value as any)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3 text-xs text-zinc-900 font-bold focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all font-sans"
                        >
                          <option value="a4">A4 Standar</option>
                          <option value="letter">Letter (Kuarto)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="admin-pdf-orient" className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase font-mono">Orientasi</label>
                        <select
                          id="admin-pdf-orient"
                          value={pdfOrientation}
                          onChange={(e) => setPdfOrientation(e.target.value as any)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3 text-xs text-zinc-900 font-bold focus:outline-none focus:border-zinc-300 focus:ring-1 focus:ring-zinc-300 transition-all font-sans"
                        >
                          <option value="p">Potret (P)</option>
                          <option value="l">Lanskap (L)</option>
                        </select>
                      </div>
                    </div>

                    {/* Checkbox Options */}
                    <div className="space-y-2.5 border-t border-zinc-800 pt-4">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-700 font-bold select-none hover:text-zinc-900 transition-all">
                        <input
                          type="checkbox"
                          checked={pdfShowSignature}
                          onChange={(e) => setPdfShowSignature(e.target.checked)}
                          className="rounded border-zinc-300 accent-zinc-800 bg-zinc-50 text-zinc-800 h-4 w-4 cursor-pointer"
                        />
                        <span>Sertakan Kolom Tanda Tangan Sah</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-700 font-bold select-none hover:text-zinc-900 transition-all">
                        <input
                          type="checkbox"
                          checked={pdfIncludeNotes}
                          onChange={(e) => setPdfIncludeNotes(e.target.checked)}
                          className="rounded border-zinc-300 accent-zinc-800 bg-zinc-50 text-zinc-800 h-4 w-4 cursor-pointer"
                        />
                        <span>Tampilkan Catatan Mutasi</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Help message */}
                  <div className="bg-white border border-zinc-100 p-4 rounded-2xl hidden lg:block font-sans">
                    <p className="text-[10px] text-zinc-500 leading-normal font-semibold">
                      Pratinjau di sebelah kanan mensimulasikan tata letak cetakan kertas fisik. Saring kriteria dewan guru maupun kelas saat ini akan dihasilkan secara dinamis ke dokumen akhir.
                    </p>
                  </div>
                </div>

                {/* RIGHT SIDE: LIVE REPORT PREVIEW SHEET */}
                <div className="lg:col-span-7 flex flex-col justify-start">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 font-mono mb-2 font-sans">
                    Kertas Simulasi Laporan (Pratinjau PDF Instan)
                  </h4>
                  
                  {/* Printable Sheet Simulation */}
                  <div 
                    className={`bg-white rounded-2xl p-6 border border-zinc-200 shadow-lg relative select-none font-sans overflow-hidden text-zinc-800 flex flex-col justify-between transition-all duration-300 w-full mx-auto ${
                      pdfOrientation === 'l' 
                        ? 'aspect-[1.414/1] min-h-[290px] max-w-full' 
                        : 'aspect-[0.707/1] min-h-[440px] max-w-[390px]'
                    }`}
                  >
                    <div>
                      {/* Kop */}
                      <div className="flex justify-between items-start border-b-2 border-zinc-850 pb-2">
                        <div className="flex items-center gap-1.5">
                          <School className="w-5 h-5 text-zinc-800" />
                          <div>
                            <div className="text-[9px] font-black tracking-tight leading-none text-zinc-900 uppercase font-sans">
                              SMKN 46 JAKARTA
                            </div>
                            <div className="text-[6px] text-zinc-550 leading-tight mt-0.5 max-w-[200px]">
                              Jl. Cipinang Pulo No.19, Jatinegara, Jakarta Timur
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[7.5px] font-bold text-zinc-800 font-mono">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                      </div>

                      {/* Title and metadata */}
                      <div className="space-y-3 pt-3">
                        <h5 className="text-center font-black text-zinc-900 text-[10px] tracking-tight uppercase line-clamp-1">
                          {pdfTitle || 'LAPORAN REKAPITULASI TABUNGAN GURU & SISWA'}
                        </h5>

                        <div className="grid grid-cols-2 gap-1.5 text-[8px] text-zinc-650 border border-zinc-200 rounded-xl p-2 bg-zinc-50 font-sans">
                          <div>
                            <span className="text-[7px] text-zinc-400 uppercase font-mono block font-bold">Kriteria Saring Kelas</span>
                            <span className="font-bold text-zinc-800 truncate block mt-0.5">{filterKelas || 'Semua Kelas & Guru'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[7px] text-zinc-400 uppercase font-mono block font-bold">Periode Bulan</span>
                            <span className="font-bold text-zinc-800 block mt-0.5">
                              {filterBulan ? bulanList[parseInt(filterBulan)].label : 'Semua Bulan'} 2026
                            </span>
                          </div>
                        </div>

                        {/* Transactions Preview Table */}
                        <div className="space-y-1">
                          <span className="text-[7px] text-zinc-450 uppercase font-mono tracking-wider block font-bold font-sans">Cuplikan Transaksi ({reportTransactions.length} baris)</span>
                          
                          <div className="border border-zinc-200 rounded-xl overflow-hidden text-[8px]">
                            <div className="grid grid-cols-12 bg-zinc-100 p-1.5 font-bold text-zinc-700 border-b border-zinc-200">
                              <span className="col-span-6">Nama / Kelas</span>
                              <span className="col-span-3">Jenis</span>
                              <span className="col-span-3 text-right">Nominal</span>
                            </div>
                            
                            {reportTransactions.length === 0 ? (
                              <div className="p-2 text-center text-zinc-400 italic bg-white">
                                [ Belum ada mutasi yang saring cocok ]
                              </div>
                            ) : (
                              <>
                                {reportTransactions.slice(0, 3).map((tx) => (
                                  <div key={tx.id} className="grid grid-cols-12 p-1.5 border-b border-zinc-100 text-zinc-600 bg-white last:border-none">
                                    <span className="col-span-6 truncate font-sans">
                                      {tx.userName}
                                    </span>
                                    <span className="col-span-3">
                                      {tx.type === 'setor' ? 'MASUK' : 'TARIK'}
                                    </span>
                                    <span className="col-span-3 text-right font-mono font-bold text-zinc-900">
                                      {tx.type === 'setor' ? '+' : '-'} Rp{tx.amount.toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                ))}
                                {reportTransactions.length > 3 && (
                                  <div className="p-0.5 px-2 text-center text-[7px] font-mono text-zinc-550 bg-zinc-50 border-t border-zinc-100 font-bold">
                                    + {reportTransactions.length - 3} mutasi lainnya disajikan lengkap di cetakan PDF...
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Signature Signatures */}
                    <div className="pt-3 border-t border-dashed border-zinc-200 flex justify-between items-end font-sans">
                      <div className="text-[7px] text-zinc-400 font-mono font-medium max-w-[150px]">
                        Verifikasi digital terpusat dari platform administrator SMKN 46 Jakarta.
                      </div>
                      {pdfShowSignature ? (
                        <div className="text-right pr-2">
                          <div className="text-[7.5px] text-zinc-450 uppercase font-mono tracking-wider font-extrabold text-zinc-800">VERIFIKATOR SAH</div>
                          <div className="h-10 w-24 my-1.5 bg-amber-50/50 border border-amber-200/80 rounded-lg flex items-center justify-center relative overflow-hidden select-none">
                            <svg className="absolute inset-0 w-full h-full text-blue-500/80" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M 12 28 C 25 15, 30 10, 48 24 C 60 38, 70 8, 88 18" stroke="#3b82f6" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M 22 25 C 38 10, 50 32, 68 15" stroke="#3b82f6" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="text-sm text-amber-500 z-10 flex items-center justify-center filter drop-shadow font-sans mr-0.5 select-none font-bold">
                              🎗️
                            </div>
                            <span className="text-[7.5px] font-mono font-black text-amber-700/90 z-10 tracking-widest mt-0.5 uppercase">SAH</span>
                          </div>
                          <div className="text-[8.5px] font-black text-zinc-800 leading-none">Panitia Tabungan SMK</div>
                          <div className="text-[7.5px] text-zinc-450 mt-0.5 leading-none font-bold">SMKN 46 JAKARTA</div>
                        </div>
                      ) : (
                        <div className="text-[7px] italic text-zinc-400 font-bold">[ Tanda tangan dinonaktifkan ]</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Footer */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-5 mt-6 border-t border-zinc-800 font-sans">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 text-center font-sans border border-zinc-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSimulateExport}
                  disabled={isExporting}
                  className="px-7 py-2.5 bg-white hover:bg-zinc-100 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 text-center border border-zinc-200 font-sans disabled:opacity-50"
                >
                  {isExporting ? (
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-zinc-950" />
                  )}
                  <span>{isExporting ? 'Mengekspor...' : 'Unduh PDF Sekarang'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
