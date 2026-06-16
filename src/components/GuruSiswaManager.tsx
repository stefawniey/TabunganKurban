/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  SlidersHorizontal, 
  X, 
  Check, 
  CheckCircle, 
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Users
} from 'lucide-react';
import { User, Role } from '../types';
import { formatRupiah, getHewanLabel, deleteUserAsync } from '../data';

interface ManagerProps {
  type: 'siswa' | 'guru';
  users: User[];
  onUpdateUsers: (newUsers: User[]) => void;
}

export default function GuruSiswaManager({ type, users, onUpdateUsers }: ManagerProps) {
  // States
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'targetAmount' | 'newest'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // State for beautiful deletion confirmation modal
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Form States
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNipNis, setFormNipNis] = useState('');
  const [formKelas, setFormKelas] = useState('');
  const [formHewan, setFormHewan] = useState<'domba' | 'kambing' | 'sapi_sepertujuh' | 'sapi_penuh' | 'custom'>('kambing');
  const [formTargetAmount, setFormTargetAmount] = useState('3500000');

  // Filter users based on page context (siswa vs guru)
  const currentRoleUsers = users.filter((u) => u.role === type);

  // Ambil kelas unik untuk filter dropdown (khusus siswa)
  const uniqueClasses = Array.from(
    new Set(users.filter(u => u.role === 'siswa' && u.kelas).map(u => u.kelas!))
  );

  // Filter & Search Logic
  const filteredUsers = currentRoleUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.username.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesKelas = !filterKelas || u.kelas === filterKelas;

    return matchesSearch && matchesKelas;
  });

  // Sorting Logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let check = 0;
    if (sortBy === 'name') {
      check = a.name.localeCompare(b.name);
    } else if (sortBy === 'targetAmount') {
      check = (a.targetAmount || 0) - (b.targetAmount || 0);
    } else {
      check = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortOrder === 'asc' ? check : -check;
  });

  // Pagination Logic
  const totalItems = sortedUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + itemsPerPage);

  // Kembalikan ke halaman 1 jika filter berubah
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterKelasChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterKelas(e.target.value);
    setCurrentPage(1);
  };

  // Toggle sorting
  const handleSort = (field: 'name' | 'targetAmount' | 'newest') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Membuka Modal Add
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormNipNis('');
    setFormKelas(type === 'siswa' ? 'Kelas 10' : 'Guru Walas');
    setFormHewan('kambing');
    setFormTargetAmount('3500000');
    setIsModalOpen(true);
  };

  // Membuka Modal Edit
  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormNipNis(user.nipNis || '');
    setFormKelas(user.kelas || '');
    setFormHewan(user.targetHewan || 'kambing');
    setFormTargetAmount(String(user.targetAmount || 3500000));
    setIsModalOpen(true);
  };

  // Menangani Perubahan Target Hewan saat input untuk mengisi nominal target
  const handleHewanChange = (selectedHewan: 'domba' | 'kambing' | 'sapi_sepertujuh' | 'sapi_penuh' | 'custom') => {
    setFormHewan(selectedHewan);
    if (selectedHewan === 'domba') setFormTargetAmount('2500000');
    else if (selectedHewan === 'kambing') setFormTargetAmount('3500000');
    else if (selectedHewan === 'sapi_sepertujuh') setFormTargetAmount('4000000');
    else if (selectedHewan === 'sapi_penuh') setFormTargetAmount('28000000');
  };

  // Submit Simpan Form (Add / Edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName || !formUsername || !formEmail) return;

    if (editingUser) {
      // Edit mode
      const updated = users.map((u) => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            name: formName,
            username: formUsername,
            email: formEmail,
            nipNis: formNipNis,
            kelas: formKelas,
            targetHewan: formHewan,
            targetAmount: parseFloat(formTargetAmount) || 0,
          };
        }
        return u;
      });
      onUpdateUsers(updated);
    } else {
      // Add mode
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: formName,
        username: formUsername.toLowerCase().trim(),
        password: 'password123', // password default
        role: type,
        email: formEmail,
        nipNis: formNipNis,
        kelas: formKelas,
        targetHewan: formHewan,
        targetAmount: parseFloat(formTargetAmount) || 0,
        createdAt: new Date().toISOString(),
      };
      onUpdateUsers([...users, newUser]);
    }

    setIsModalOpen(false);
  };

  // Delete User Trigger
  const handleDelete = (u: User) => {
    setUserToDelete(u);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    const id = userToDelete.id;
    const filtered = users.filter((u) => u.id !== id);
    onUpdateUsers(filtered);
    if (paginatedUsers.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
    try {
      await deleteUserAsync(id);
    } catch (err) {
      console.error("Gagal menghapus user di backend:", err);
    }
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-zinc-900">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-zinc-500 font-mono font-bold tracking-wider uppercase">MODUL ADMINISTRASI</span>
          <h2 className="text-xl md:text-2xl font-black text-zinc-900 flex items-center gap-2">
            {type === 'siswa' ? <Users className="w-6 h-6 text-zinc-500" /> : <GraduationCap className="w-6 h-6 text-zinc-500" />}
            Data {type === 'siswa' ? 'Siswa' : 'Guru & Staff'}
          </h2>
          <p className="text-xs text-zinc-500">Total terdaftar: {filteredUsers.length} dari {currentRoleUsers.length} data.</p>
        </div>

        {/* Add Button Removed */}
      </div>

      {/* Control Box: Search and Filters */}
      <div className="bg-white border border-zinc-200 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={handleSearchChange}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-900 placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
          />
        </div>

        {/* Saring */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:justify-end">
          {/* Saring */}
          {type === 'siswa' && (
            <div className="flex items-center gap-1.5 text-zinc-700 text-xs font-semibold mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Saring:</span>
            </div>
          )}

          {/* Saring Kelas */}
          {type === 'siswa' && (
            <select
              value={filterKelas}
              onChange={handleFilterKelasChange}
              className="bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-3 text-xs text-zinc-900 focus:outline-none"
            >
              <option value="">Semua Kelas</option>
              <option value="10">Kelas 10</option>
              <option value="11">Kelas 11</option>
              <option value="12">Kelas 12</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Table view */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-700 font-mono">
                <th className="py-4 px-5">
                  Nama
                </th>
                <th className="py-4 px-5">Email</th>
                <th className="py-4 px-5">{type === 'guru' ? 'Jabatan / Wali Kelas' : 'Kelas'}</th>
                <th className="py-4 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={type === 'siswa' ? 4 : 4} className="py-10 text-center text-zinc-500 font-medium font-sans">
                    Tidak ditemukan data {type} yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-zinc-900 text-sm">{u.name}</div>
                    </td>
                    <td className="py-4 px-5 text-zinc-600">{u.email}</td>
                    <td className="py-4 px-5 text-zinc-700 font-semibold">{u.kelas || '-'}</td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(u)}
                          title="Hapus"
                          className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 rounded-lg border border-transparent hover:border-zinc-200 transition-all cursor-pointer flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center text-xs text-zinc-700 font-sans font-medium">
            <span>
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} {type}
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


      {/* CRUD Add / Edit Modal Dialouge (Indonesian) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Glass Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-zinc-800 border border-zinc-700 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10 overflow-hidden"
            >
              {/* Box Top */}
              <div className="flex justify-between items-start pb-4 border-b border-zinc-700 mb-5">
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    {editingUser ? `Sunting Data ${type === 'siswa' ? 'Siswa' : 'Guru'}` : `Tambah ${type === 'siswa' ? 'Siswa' : 'Guru'} Baru`}
                  </h3>
                  <p className="text-[10px] text-zinc-400">Simpan otomatis ke penyimpanan lokal sistem</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-750 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form schema */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama lengkap */}
                  <div className="space-y-1">
                    <label htmlFor="form-fullName" className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase font-mono">Nama Lengkap</label>
                    <input
                      id="form-fullName"
                      type="text"
                      placeholder="Contoh: Muhammad Akhyar"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label htmlFor="form-usernameRef" className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase font-mono">Nama Pengguna (Login)</label>
                    <input
                      id="form-usernameRef"
                      type="text"
                      placeholder="Contoh: akhyar12"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      required
                      disabled={!!editingUser} // Username tidak boleh diganti saat edit
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 disabled:opacity-40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label htmlFor="form-emailAddress" className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase font-mono">Email Instansi</label>
                    <input
                      id="form-emailAddress"
                      type="email"
                      placeholder="Contoh: murid@sekolah.sch.id"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kelas (Khusus Siswa) */}
                  {type === 'siswa' && (
                    <div className="space-y-1">
                      <label htmlFor="form-studentKelas" className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase font-mono">Kelas Akademik</label>
                      <select
                        id="form-studentKelas"
                        value={formKelas}
                        onChange={(e) => setFormKelas(e.target.value)}
                        required
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-zinc-500 font-sans"
                      >
                        <option value="Kelas 10">Kelas 10</option>
                        <option value="Kelas 11">Kelas 11</option>
                        <option value="Kelas 12">Kelas 12</option>
                      </select>
                    </div>
                  )}

                  {/* Jabatan (Khusus Guru) */}
                  {type === 'guru' && (
                    <div className="space-y-1">
                      <label htmlFor="form-guruJabatan" className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase font-mono">Jabatan / Wali Kelas</label>
                      <select
                        id="form-guruJabatan"
                        value={formKelas}
                        onChange={(e) => setFormKelas(e.target.value)}
                        required
                        className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-zinc-500 font-sans"
                      >
                        <option value="Guru Walas">Guru Walas</option>
                        <option value="Kepsek">Kepala Sekolah (Kepsek)</option>
                        <option value="Wakepsek">Wakil Kepala Sekolah (Wakepsek)</option>
                        <option value="Guru Mapel">Guru Mata Pelajaran (Guru Mapel)</option>
                      </select>
                    </div>
                  )}

                  {/* Target Hewan */}
                  <div className="space-y-1">
                    <label htmlFor="form-targetAnimal" className="text-[10px] font-bold text-zinc-305 tracking-wider uppercase font-mono">Target Hewan Kurban</label>
                    <select
                      id="form-targetAnimal"
                      value={formHewan}
                      onChange={(e) => handleHewanChange(e.target.value as any)}
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-zinc-500 font-sans"
                    >
                      <option value="domba">1 Ekor Domba (Rp 2.5jt)</option>
                      <option value="kambing">1 Ekor Kambing (Rp 3.5jt)</option>
                      <option value="sapi_sepertujuh">1/7 Patungan Sapi (Rp 4jt)</option>
                      <option value="sapi_penuh">Sapi Utuh (Rp 28jt)</option>
                      <option value="custom">Kustom Target Nominal</option>
                    </select>
                  </div>
                </div>

                {/* Target Amount */}
                <div className="space-y-1">
                  <label htmlFor="form-idTargetVal" className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase font-mono">Target Akumulasi Nominal Tabungan (IDR)</label>
                  <input
                    id="form-idTargetVal"
                    type="number"
                    placeholder="Contoh: 3000000"
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(e.target.value)}
                    disabled={formHewan !== 'custom'} // Hanya aktif jika pilih custom
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-mono disabled:opacity-40"
                  />
                  {formHewan !== 'custom' && (
                    <span className="text-[10px] text-zinc-400 tracking-wide font-sans">
                      * Nominal target terkunci otomatis berdasarkan standar hewan kurban terpilih.
                    </span>
                  )}
                </div>

                {/* Footer Modal Clicks */}
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-zinc-700 hover:bg-zinc-650 border border-zinc-600 text-zinc-350 hover:text-white rounded-xl text-xs font-semibold transition font-sans"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-zinc-105 hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs transition font-sans"
                  >
                    {editingUser ? 'Simpan Perubahan' : 'Masukkan Data'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL KONFIRMASI HAPUS DATA GURU/SISWA (Custom popup) */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 shadow-2xl space-y-4 text-zinc-900 font-sans"
            >
              <div className="flex items-center gap-3 text-zinc-800">
                <Trash2 className="w-6 h-6 flex-shrink-0 text-zinc-905" />
                <h3 className="text-base font-black tracking-tight text-zinc-950 uppercase">Hapus Kriteria {type === 'siswa' ? 'Siswa' : 'Guru'}</h3>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-zinc-700 leading-relaxed font-semibold">
                  Apakah Anda yakin ingin menghapus data {type === 'siswa' ? 'siswa' : 'dewan guru'} <span className="text-zinc-950 font-black">"{userToDelete.name}"</span>?
                </p>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-[11px] font-mono select-none space-y-1 text-zinc-600">
                  <div><span className="text-zinc-400">Nama:</span> {userToDelete.name}</div>
                  {type === 'siswa' && (
                    <>
                      <div><span className="text-zinc-400">Kelas:</span> {userToDelete.kelas || '-'}</div>
                    </>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 font-bold leading-normal">
                  Pemberitahuan: Seluruh data keikutsertaan profil kurban serta nominal tabungan tersimpan akan terhapus secara permanen.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition cursor-pointer border border-zinc-200 font-sans animate-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-850 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md active:scale-95 font-sans"
                >
                  Ya, Hapus Permanen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
