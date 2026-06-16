-- Schema database untuk Tabungan Kurban Digital Terintegrasi
-- Silakan jalankan kueri ini di SQL Editor dashboard Supabase Anda.

-- 1. Hapus tabel jika sudah ada sebelumnya (hati-hati, ini akan menghapus data yang ada)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Buat tabel 'users'
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT 'admin123',
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  kelas TEXT, -- Khusus siswa, misal XII-IPA-1
  nip_nis TEXT, -- NIP Guru atau NISN Siswa
  target_hewan TEXT CHECK (target_hewan IN ('kambing', 'sapi_sepertujuh', 'sapi_penuh', 'custom')),
  target_amount NUMERIC
);

-- Pastikan Row Level Security (RLS) di-nonaktifkan agar insert dari aplikasi berfungsi
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Buat tabel 'transactions'
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  user_kelas TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('setor', 'tarik')),
  date DATE NOT NULL,
  recorded_by TEXT NOT NULL,
  notes TEXT
);

-- Pastikan RLS di-nonaktifkan
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 4. Buat tabel 'notifications'
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'info', 'warning')),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE
);

-- Pastikan RLS di-nonaktifkan
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- -- 5. Masukkan Data Seed Pengguna Default (Default Users)
INSERT INTO users (id, username, password, name, role, email, created_at, nip_nis, kelas, target_hewan, target_amount) VALUES
('u-1', 'admin', 'admin123', 'Admin', 'admin', 'admin@gmail.com', '2026-01-10 08:00:00+00', '12345678', NULL, NULL, NULL);

-- 6. Masukkan Data Seed Transaksi Awal (Default Transactions)
-- Transaksi dikosongkan agar pengguna mendaftar dan menabung secara mandiri

-- 7. Masukkan Data Seed Notifikasi Awal
INSERT INTO notifications (id, title, message, type, date, read) VALUES
('nt-1', 'Sistem Siap Digunakan', 'Selamat datang di portal Tabungan Kurban Digital Terintegrasi Supabase!', 'info', '2026-06-01 08:00:00+00', false);

-- Enable Realtime (Opsional untuk Supabase Realtime di dashboard Supabase)
-- alter publication supabase_realtime add table users;
-- alter publication supabase_realtime add table transactions;
-- alter publication supabase_realtime add table notifications;
