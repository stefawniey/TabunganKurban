/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'admin' | 'guru' | 'siswa';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: Role;
  email: string;
  createdAt: string;
  kelas?: string; // Khusus Siswa (misal: "Kelas 10", "Kelas 11")
  nipNis?: string; // NIP untuk guru, NISN untuk siswa
  targetHewan?: 'kambing' | 'sapi_sepertujuh' | 'sapi_penuh' | 'custom' | 'domba';
  targetAmount?: number; // Target tabungan dalam Rupiah, misal 3500000
}

export interface Transaksi {
  id: string;
  userId: string;
  userName: string; // Menyimpan nama siswa/guru untuk kemudahan filter/tabel
  userRole: Role;
  userKelas?: string;
  amount: number;
  type: 'setor' | 'tarik';
  date: string; // ISO String atau YYYY-MM-DD
  recordedBy: string; // Diinput oleh siapa (Nama/Username Admin)
  notes?: string;
}

export interface Notifikasi {
  id: string;
  userId?: string; // Menyimpan ID user pemilik notifikasi
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  date: string;
  read: boolean;
}

export interface SummaryLaporan {
  totalSiswa: number;
  totalGuru: number;
  totalSaldo: number;
  totalTransaksi: number;
  pencapaianTarget: number; // Persentase rata-rata target
}
