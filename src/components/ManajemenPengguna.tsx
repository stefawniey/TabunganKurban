/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCog, 
  Search, 
  Plus, 
  ShieldCheck, 
  KeyRound, 
  Trash2, 
  X, 
  GraduationCap, 
  Users,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { User, Role } from '../types';
import { deleteUserAsync } from '../data';
import { formatRupiah } from '../data';

interface UserMgmtProps {
  users: User[];
  onUpdateUsers: (newUsers: User[]) => void;
  currentUser: User;
}

export default function ManajemenPengguna({ users, onUpdateUsers, currentUser }: UserMgmtProps) {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  
  // Modal states for creating/editing credentials
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<Role>('siswa');
  const [formEmail, setFormEmail] = useState('');

  // Password visibility flag
  const [showPwd, setShowPwd] = useState<Record<string, boolean>>({});

  // State for beautiful deletion confirmation modal
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Filters users based on username/name/role
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.username.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const togglePasswordVisibility = (userId: string) => {
    setShowPwd(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleOpenAddModal = () => {
    setTargetUser(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('password123'); // Default password
    setFormRole('siswa');
    setFormEmail('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: User) => {
    setTargetUser(u);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormPassword(u.password || 'password123');
    setFormRole(u.role);
    setFormEmail(u.email);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUsername || !formPassword || !formEmail) return;

    if (targetUser) {
      // Edit mode
      const updated = users.map(u => {
        if (u.id === targetUser.id) {
          return {
            ...u,
            name: formName,
            username: formUsername.toLowerCase().trim(),
            password: formPassword,
            role: formRole,
            email: formEmail,
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
        password: formPassword,
        role: formRole,
        email: formEmail,
        createdAt: new Date().toISOString(),
      };
      onUpdateUsers([...users, newUser]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteUser = (u: User) => {
    if (u.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri demi keselamatan otoritas.');
      return;
    }
    setUserToDelete(u);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const id = userToDelete.id;

    const filtered = users.filter(u => u.id !== id);
    onUpdateUsers(filtered);
    try {
      await deleteUserAsync(id);
    } catch (err) {
      console.error("Gagal menghapus ke Supabase:", err);
    }
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] text-zinc-500 font-mono font-bold tracking-wider uppercase">MODUL LOGISTIK KEAMANAN</span>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <UserCog className="w-6 h-6 text-zinc-300" />
            Manajemen Pengguna & Akun
          </h2>
          <p className="text-xs text-zinc-400">Atur hak akses pendaftaran, verifikasi sandi, serta berikan kredensial login.</p>
        </div>

        {/* Add user controller */}
        <button
          id="btn-tambah-user-mgmt"
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Control bar saring */}
      <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari user pengelola..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* Filter Role */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="w-full md:w-auto bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none"
        >
          <option value="">Semua Hak Akses</option>
          <option value="admin">Admin</option>
          <option value="guru">Dewan Guru</option>
          <option value="siswa">Peserta Siswa</option>
        </select>
      </div>

      {/* List of accounts table */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-700/40 text-[10px] font-bold uppercase tracking-wider text-zinc-300 font-mono">
                <th className="py-4 px-5">Nama Profil</th>
                <th className="py-4 px-5">Kredensial Login</th>
                <th className="py-4 px-5">Peran Otoritas</th>
                <th className="py-4 px-5">Sandi Tersimpan</th>
                <th className="py-4 px-5 text-right">Tindakan Keamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700 text-xs">
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentUser.id;
                const isViewing = !!showPwd[u.id];

                return (
                  <tr key={u.id} className="hover:bg-zinc-700/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-zinc-900 dark:text-white text-sm flex items-center gap-1.5">
                        {u.name}
                        {isSelf && (
                          <span className="text-[9px] bg-zinc-700 text-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-600 px-1.5 py-0.5 rounded font-mono uppercase">AKUN SAYA</span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500">{u.email}</div>
                    </td>
                    <td className="py-4 px-5 font-mono">
                      <span className="bg-zinc-700 px-2.5 py-1 border border-zinc-600 rounded font-semibold text-zinc-300">
                        {u.username}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                        u.role === 'admin' 
                          ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' 
                          : u.role === 'guru'
                            ? 'bg-zinc-100/10 text-zinc-300 border-zinc-650'
                            : 'bg-zinc-700 text-zinc-400 border-zinc-600'
                      }`}>
                        {u.role === 'admin' ? 'ADMIN' : u.role === 'guru' ? 'GURU' : 'SISWA'}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="text-zinc-400">
                          {isViewing ? (u.password || 'password123') : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="p-1 hover:bg-zinc-700 rounded text-zinc-500 hover:text-white transition-all"
                        >
                          {isViewing ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {!isSelf ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[10px] border border-zinc-800 font-bold transition-all cursor-pointer"
                          >
                            Set Password
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-zinc-500 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg border border-transparent hover:border-zinc-200 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-zinc-500">Root Otoritas</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD DIALOG MODAL USER CREATION / ENCRYPTION (Indonesian) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark glass overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal sheet */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-zinc-800 border border-zinc-700 rounded-3xl p-6 md:p-8 shadow-2xl relative z-10"
            >
              <div className="flex justify-between items-start pb-4 border-b border-zinc-700 mb-5">
                <div>
                  <h3 className="text-base font-bold text-white font-sans flex items-center gap-1.5">
                    <KeyRound className="w-5 h-5 text-zinc-350" />
                    {targetUser ? 'Ubah Sandi & Info' : 'Buat Akun Akses'}
                  </h3>
                  <p className="text-[10px] text-zinc-400">Kredensial login ke Sistem Tabungan Kurban</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama Pengguna Asli */}
                <div className="space-y-1">
                  <label htmlFor="user-form-name" className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase font-mono">Nama Pembuat Profil</label>
                  <input
                    id="user-form-name"
                    type="text"
                    placeholder="Contoh: Pak Herman Staff"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label htmlFor="user-form-email" className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase font-mono">Surel (Email)</label>
                    <input
                      id="user-form-email"
                      type="email"
                      placeholder="herman@gmail.id"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label htmlFor="user-form-username" className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase font-mono">Nama Pengguna (Username)</label>
                    <input
                      id="user-form-username"
                      type="text"
                      placeholder="herman_staff"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      required
                      disabled={!!targetUser} // Username can't change
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Password Setting */}
                <div className="space-y-1">
                  <label htmlFor="user-form-password" className="text-[10px] font-bold text-zinc-300 tracking-wider uppercase font-mono">Kata Sandi Akses</label>
                  <input
                    id="user-form-password"
                    type="text"
                    placeholder="Masukkan sandi unik minimal 6 karakter"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono"
                  />
                </div>

                {/* Role Otoritas */}
                <div className="space-y-1">
                  <label htmlFor="user-form-role" className="text-[10px] font-bold text-zinc-350 tracking-wider uppercase font-mono">Hak Akses Sistem</label>
                  <select
                    id="user-form-role"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full bg-zinc-700 border border-zinc-600 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-zinc-500"
                  >
                    <option value="admin">Administrator Kurban</option>
                    <option value="guru">Dewan Guru / Staf Sekolah</option>
                    <option value="siswa">Peserta Siswa</option>
                  </select>
                </div>

                {/* Buttons triggers */}
                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 text-zinc-355 hover:text-white rounded-xl text-xs font-semibold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-xs transition"
                  >
                    Simpan Akun
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL KONFIRMASI HAPUS AKUN (Custom popup) */}
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
                <h3 className="text-base font-black tracking-tight text-zinc-950 uppercase">Konfirmasi Hapus Akun</h3>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs text-zinc-700 leading-relaxed font-semibold">
                  Apakah Anda yakin ingin menghapus akun <span className="text-zinc-950 font-black">"{userToDelete.name}"</span>?
                </p>
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-[11px] font-mono select-none space-y-1 text-zinc-650">
                  <div><span className="text-zinc-400">Username:</span> {userToDelete.username}</div>
                  <div><span className="text-zinc-400">Email:</span> {userToDelete.email || '-'}</div>
                  <div><span className="text-zinc-400">Peran:</span> {userToDelete.role.toUpperCase()}</div>
                </div>
                <p className="text-[10px] text-zinc-500 font-bold leading-normal">
                  Peringatan: Seluruh data target tabungan kurban, nominal rupiah yang terkumpul, dan kredensial login akun ini akan terhapus secara permanen dari basis data!
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl text-xs transition cursor-pointer border border-zinc-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteUser}
                  className="px-5 py-2 bg-zinc-900 hover:bg-zinc-850 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md active:scale-95"
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
