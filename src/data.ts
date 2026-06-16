/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Transaksi, Notifikasi } from './types';
import { 
  supabase, 
  isSupabaseConfigured, 
  mapUserFromDb, 
  mapUserToDb, 
  mapTransactionFromDb, 
  mapTransactionToDb, 
  mapNotificationFromDb, 
  mapNotificationToDb 
} from './supabaseClient';

export const DEFAULT_USERS: User[] = [
  {
    id: 'u-1',
    username: 'admin',
    password: 'admin123',
    name: 'Admin',
    role: 'admin',
    email: 'admin@gmail.com',
    nipNis: '12345678',
    createdAt: '2026-01-10T08:00:00Z',
  }
];

export const DEFAULT_TRANSAKSI: Transaksi[] = [];

export const DEFAULT_NOTIFIKASI: Notifikasi[] = [
  {
    id: 'nt-1',
    title: 'Sistem Terintegrasi',
    message: 'Selamat datang di aplikasi Tabungan Kurban Digital Terintegrasi!',
    type: 'info',
    date: '2026-06-01T08:00:00Z',
    read: false,
  }
];

// Helper Functions untuk mengelola localStorage
export function initializeStorage() {
  if (!localStorage.getItem('tk_initialized_v8')) {
    localStorage.setItem('tk_users', JSON.stringify([DEFAULT_USERS[0]]));
    localStorage.setItem('tk_transactions', JSON.stringify([]));
    localStorage.setItem('tk_notifications', JSON.stringify([]));
    localStorage.setItem('tk_initialized_v8', 'true');
  }
}

export function getUsers(): User[] {
  initializeStorage();
  const users: User[] = JSON.parse(localStorage.getItem('tk_users') || '[]');
  const hasAdmin = users.some(u => u.role === 'admin' || u.username === 'admin' || u.email === 'admin@gmail.com');
  if (!hasAdmin) {
    const updatedUsers = [DEFAULT_USERS[0], ...users];
    saveUsers(updatedUsers);
    return updatedUsers;
  }
  return users;
}

export function saveUsers(users: User[]) {
  localStorage.setItem('tk_users', JSON.stringify(users));
}

export function getTransactions(): Transaksi[] {
  initializeStorage();
  return JSON.parse(localStorage.getItem('tk_transactions') || '[]');
}

export function saveTransactions(transactions: Transaksi[]) {
  localStorage.setItem('tk_transactions', JSON.stringify(transactions));
}

export function getNotifications(): Notifikasi[] {
  initializeStorage();
  return JSON.parse(localStorage.getItem('tk_notifications') || '[]');
}

export function saveNotifications(notifications: Notifikasi[]) {
  localStorage.setItem('tk_notifications', JSON.stringify(notifications));
}

// ==========================================================
// ASYNCHRONOUS DATABASE UTILITIES (Supabase with Local Fallback)
// ==========================================================

export async function getUsersAsync(): Promise<User[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        let users = data.map(mapUserFromDb);
        const hasAdmin = users.some(u => u.role === 'admin' || u.username === 'admin' || u.email === 'admin@gmail.com');
        if (!hasAdmin) {
          users = [DEFAULT_USERS[0], ...users];
          await saveUsersAsync(users);
        } else {
          saveUsers(users); // Sync cache
        }
        return users;
      } else if (data && data.length === 0) {
        // Seed Supabase if empty but local has data
        const localUsers = getUsers();
        if (localUsers.length > 0) {
          await saveUsersAsync(localUsers);
          return localUsers;
        }
      }
    } catch (err) {
      console.error('Gagal mengambil data users dari Supabase, menggunakan lokal:', err);
    }
  }
  return getUsers();
}

export async function saveUsersAsync(users: User[]): Promise<void> {
  saveUsers(users); // Sync cache
  if (isSupabaseConfigured() && supabase) {
    try {
      const mapped = users.map(mapUserToDb);
         const { error } = await supabase.from('users').upsert(mapped);
      if (error) throw error;
    } catch (err) {
      console.error('Gagal memperbarui data users ke Supabase:', err);
    }
  }
}

export async function deleteUserAsync(id: string): Promise<void> {
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Gagal menghapus user dari Supabase:', err);
    }
  }
}

export async function getTransactionsAsync(): Promise<Transaksi[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('transactions').select('*');
      if (error) throw error;
      if (data) {
        const dbTxs = data.map(mapTransactionFromDb);
        const localTxs = getTransactions();
        const dbIds = new Set(dbTxs.map(t => t.id));
        const unsyncedTxs = localTxs.filter(t => !dbIds.has(t.id));
        
        const merged = [...unsyncedTxs, ...dbTxs];
        merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        saveTransactions(merged); // Sync cache
        
        if (unsyncedTxs.length > 0) {
          saveTransactionsAsync(merged);
        }
        return merged;
      }
    } catch (err) {
      console.error('Gagal mengambil data transaksi dari Supabase, menggunakan lokal:', err);
    }
  }
  return getTransactions();
}

export async function saveTransactionsAsync(txs: Transaksi[]): Promise<void> {
  saveTransactions(txs); // Sync cache
  if (isSupabaseConfigured() && supabase) {
    try {
      const promises = txs.map(async (tx) => {
        try {
          const mapped = mapTransactionToDb(tx);
          let { error } = await supabase.from('transactions').upsert(mapped);
          
          // Jika terjadi kesalahan foreign key (kode 23503), pulihkan data user terlebih dahulu lalu ulangi
          if (error && (error.code === '23503' || String(error.message).toLowerCase().includes('foreign key'))) {
            console.warn(`Foreign key issue syncing transaction ${tx.id}. Recreating user ${tx.userId} on Supabase...`);
            const localUsers = getUsers();
            const txUser = localUsers.find(u => u.id === tx.userId);
            
            if (txUser) {
              const mappedUser = mapUserToDb(txUser);
              const { error: userError } = await supabase.from('users').upsert(mappedUser);
              if (!userError) {
                const retryRes = await supabase.from('transactions').upsert(mapped);
                error = retryRes.error;
              }
            } else {
              // Jika user tidak ditemukan di cache lokal, buat record user minimal agar transaksi berhasil disimpan
              const fallbackUser: User = {
                id: tx.userId,
                username: tx.userName.toLowerCase().replace(/\s+/g, ''),
                name: tx.userName,
                role: tx.userRole,
                email: `${tx.userName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
                createdAt: new Date().toISOString(),
                kelas: tx.userKelas
              };
              const mappedUser = mapUserToDb(fallbackUser);
              const { error: userError } = await supabase.from('users').upsert(mappedUser);
              if (!userError) {
                const retryRes = await supabase.from('transactions').upsert(mapped);
                error = retryRes.error;
              }
            }
          }
          
          if (error) {
            console.warn(`Foreign key / RLS error during transaction ${tx.id} sync:`, error);
          }
        } catch (innerErr) {
          console.error(`Internal error syncing transaction ${tx.id}:`, innerErr);
        }
      });
      await Promise.all(promises);
    } catch (err) {
      console.error('Gagal memperbarui transaksi ke Supabase:', err);
    }
  }
}

export async function deleteTransactionAsync(id: string): Promise<void> {
  const txs = getTransactions().filter(t => t.id !== id);
  saveTransactions(txs);
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Gagal menghapus transaksi dari Supabase:', err);
    }
  }
}

export async function getNotificationsAsync(): Promise<Notifikasi[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('notifications').select('*');
      if (error) throw error;
      if (data) {
        const dbNotifs = data.map(mapNotificationFromDb);
        const localNotifs = getNotifications();
        const dbIds = new Set(dbNotifs.map(n => n.id));
        const unsyncedNotifs = localNotifs.filter(n => !dbIds.has(n.id));
        
        const merged = [...unsyncedNotifs, ...dbNotifs];
        merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        saveNotifications(merged); // Sync cache
        
        if (unsyncedNotifs.length > 0) {
          saveNotificationsAsync(merged);
        }
        return merged;
      }
    } catch (err) {
      console.error('Gagal mengambil notifikasi dari Supabase, menggunakan lokal:', err);
    }
  }
  return getNotifications();
}

export async function saveNotificationsAsync(notifs: Notifikasi[]): Promise<void> {
  saveNotifications(notifs); // Sync cache
  if (isSupabaseConfigured() && supabase) {
    try {
      const promises = notifs.map(async (notif) => {
        try {
          const mapped = mapNotificationToDb(notif);
          const { error } = await supabase.from('notifications').upsert(mapped);
          if (error) {
            console.warn(`Error during notification ${notif.id} sync:`, error);
          }
        } catch (innerErr) {
          console.error(`Internal error syncing notification ${notif.id}:`, innerErr);
        }
      });
      await Promise.all(promises);
    } catch (err) {
      console.error('Gagal memperbarui notifikasi ke Supabase:', err);
    }
  }
}

export async function deleteAllNotificationsAsync(): Promise<void> {
  saveNotifications([]); // Sync cache
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('notifications').delete().neq('id', 'dummy');
      if (error) throw error;
    } catch (err) {
      console.error('Gagal menghapus semua notifikasi dari Supabase:', err);
    }
  }
}

export async function clearAllDataAsync(): Promise<void> {
  saveUsers([DEFAULT_USERS[0]]);
  saveTransactions([]);
  saveNotifications([]);
  
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('users').delete().neq('username', 'admin');
      await supabase.from('transactions').delete().neq('id', 'dummy');
      await supabase.from('notifications').delete().neq('id', 'dummy');
    } catch (err) {
      console.error('Gagal hard reset data Supabase:', err);
    }
  }
}

export async function ensureUserSyncedAsync(user: User): Promise<void> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const mapped = mapUserToDb(user);
      await supabase.from('users').upsert(mapped);
    } catch (err) {
      console.error('Gagal menyinkronkan user aktif secara mandiri:', err);
    }
  }
}

// Menghitung total tabungan per user
export function getUserBalance(userId: string, txs: Transaksi[]): number {
  return txs
    .filter((t) => t.userId === userId)
    .reduce((sum, t) => {
      if (t.type === 'setor') {
        return sum + t.amount;
      } else {
        return sum - t.amount;
      }
    }, 0);
}

// Format Rupiah helper
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Label target kurban helper
export function getHewanLabel(type?: 'kambing' | 'sapi_sepertujuh' | 'sapi_penuh' | 'custom' | 'domba'): string {
  switch (type) {
    case 'domba':
      return '1 Ekor Domba';
    case 'kambing':
      return '1 Ekor Kambing';
    case 'sapi_sepertujuh':
      return '1/7 Patungan Sapi';
    case 'sapi_penuh':
      return '1 Ekor Sapi Utuh';
    case 'custom':
      return 'Tabungan Kurban Kustom';
    default:
      return 'Belum Memilih Target';
  }
}
