/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { User, Transaksi, Notifikasi, Role } from './types';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

// ==========================================
// DB Mappers (snake_case <-> camelCase)
// ==========================================

export function mapUserFromDb(row: any): User {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    name: row.name,
    role: row.role as Role,
    email: row.email,
    createdAt: row.created_at || new Date().toISOString(),
    kelas: row.kelas || undefined,
    nipNis: row.nip_nis || undefined,
    targetHewan: row.target_hewan || undefined,
    targetAmount: row.target_amount ? Number(row.target_amount) : undefined,
  };
}

export function mapUserToDb(user: User): any {
  return {
    id: user.id,
    username: user.username,
    password: user.password || 'admin123',
    name: user.name,
    role: user.role,
    email: user.email,
    created_at: user.createdAt || new Date().toISOString(),
    kelas: user.kelas || null,
    nip_nis: user.nipNis || null,
    target_hewan: user.targetHewan || null,
    target_amount: user.targetAmount || null,
  };
}

export function mapTransactionFromDb(row: any): Transaksi {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userRole: row.user_role as Role,
    userKelas: row.user_kelas || undefined,
    amount: Number(row.amount),
    type: row.type as 'setor' | 'tarik',
    date: row.date,
    recordedBy: row.recorded_by,
    notes: row.notes || undefined,
  };
}

export function mapTransactionToDb(tx: Transaksi): any {
  return {
    id: tx.id,
    user_id: tx.userId,
    user_name: tx.userName,
    user_role: tx.userRole,
    user_kelas: tx.userKelas || null,
    amount: tx.amount,
    type: tx.type,
    date: tx.date,
    recorded_by: tx.recordedBy,
    notes: tx.notes || null,
  };
}

export function mapNotificationFromDb(row: any): Notifikasi {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    title: row.title,
    message: row.message,
    type: row.type as 'success' | 'info' | 'warning',
    date: row.date || new Date().toISOString(),
    read: row.read === true,
  };
}

export function mapNotificationToDb(notif: Notifikasi): any {
  const row: any = {
    id: notif.id,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    date: notif.date || new Date().toISOString(),
    read: notif.read,
  };
  if (notif.userId) {
    row.user_id = notif.userId;
  }
  return row;
}
