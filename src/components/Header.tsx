/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Menu, 
  Bell, 
  Sun, 
  Moon, 
  CheckCheck,
  CalendarCheck2,
  Trash2,
  Database
} from 'lucide-react';
import { User, Notifikasi } from '../types';
import { getNotifications, saveNotifications, saveNotificationsAsync, deleteAllNotificationsAsync } from '../data';
import { isSupabaseConfigured } from '../supabaseClient';

interface HeaderProps {
  currentUser: User;
  sidebarOpen: boolean;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  notifications: Notifikasi[];
  setNotifications: React.Dispatch<React.SetStateAction<Notifikasi[]>>;
}

export default function Header({ 
  currentUser, 
  sidebarOpen,
  setMobileSidebarOpen, 
  notifications,
  setNotifications
}: HeaderProps) {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Bahasa Indonesia formatting for current date
  const getFormatDate = () => {
    const formatted = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return formatted;
  };

  // Dynamic greeting based on current hour
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 11) return 'Selamat Pagi';
    if (hours >= 11 && hours < 15) return 'Selamat Siang';
    if (hours >= 15 && hours < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  // Filter notifikasi milik pengguna ini saja (atau notifikasi sistem 'all')
  const visibleNotifications = notifications.filter(n => {
    const match = n.id.match(/_usr_(.+)$/);
    const ownerId = match ? match[1] : n.userId;
    
    // Jika ada ID pemilik yang jelas (baik dari suffix ID maupun property userId)
    if (ownerId && ownerId !== 'all') {
      return ownerId === currentUser.id;
    }
    
    // Jika tidak ada ownerId, cek apakah ini adalah notifikasi umum/sistem yang sah
    if (n.id === 'nt-1' || n.userId === 'all') {
      return true;
    }
    
    // Sembunyikan default jika bukan notifikasi sistem/umum yang valid, demi keamanan data
    return false;
  });

  // Jumlah notifikasi belum dibaca dari yang bisa dilihat
  const unreadCount = visibleNotifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => {
      const match = n.id.match(/_usr_(.+)$/);
      const ownerId = match ? match[1] : n.userId;
      const isVisible = (ownerId && ownerId !== 'all')
        ? ownerId === currentUser.id
        : (n.id === 'nt-1' || n.userId === 'all');
        
      if (isVisible) {
        return { ...n, read: true };
      }
      return n;
    });
    setNotifications(updated);
    saveNotificationsAsync(updated);
  };

  const handleMarkSingleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveNotificationsAsync(updated);
  };

  const handleDeleteAllNotif = async () => {
    const remaining = notifications.filter(n => {
      const match = n.id.match(/_usr_(.+)$/);
      const ownerId = match ? match[1] : n.userId;
      const isVisible = (ownerId && ownerId !== 'all')
        ? ownerId === currentUser.id
        : (n.id === 'nt-1' || n.userId === 'all');
        
      return !isVisible; // Tetap simpan notifikasi yang TIDAK terlihat oleh user saat ini
    });
    setNotifications(remaining);
    saveNotificationsAsync(remaining);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
      {/* Left items: Mobile toggle and Page title info */}
      <div className="flex items-center gap-3.5">
        {!sidebarOpen && (
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-mono bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-inner">
          <CalendarCheck2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>{getFormatDate()}</span>
        </div>
      </div>

      {/* Right items: Mode toggle, Notification, Profile metadata & Logout */}
      <div className="flex items-center gap-4 relative">
        
        {/* Notifications Icon & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl hover:scale-105 transition-all shadow-sm relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-900 dark:bg-zinc-100 text-[10px] font-mono text-white dark:text-zinc-900 flex items-center justify-center font-bold border border-zinc-700 dark:border-zinc-200 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>


          {/* Dialog Notifications Dropdown Panel (Indonesian) */}
          {showNotifDropdown && (
            <>
              <div 
                onClick={() => setShowNotifDropdown(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl p-4 space-y-3 z-50 overflow-hidden">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-150 dark:border-zinc-750">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wider font-mono">Notifikasi</h4>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        title="Tandai semua dibaca"
                        className="text-[10px] text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-2 py-0.5 bg-zinc-50 dark:bg-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-600 border border-zinc-200 dark:border-zinc-700 rounded transition-all font-sans flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3 text-zinc-500" /> Dibaca
                      </button>
                    )}
                    {visibleNotifications.length > 0 && (
                      <button 
                        onClick={handleDeleteAllNotif}
                        title="Hapus semua"
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-455 hover:text-zinc-600 rounded transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2.5 divide-y divide-zinc-100 dark:divide-zinc-700 pr-1">
                  {visibleNotifications.length === 0 ? (
                    <div className="text-center py-6 text-zinc-450 text-[11px] font-medium font-sans">
                      Tidak ada notifikasi baru
                    </div>
                  ) : (
                    visibleNotifications.map((n, i) => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          const updated = notifications.map(not => not.id === n.id ? { ...not, read: true } : not);
                          setNotifications(updated);
                          saveNotifications(updated);
                        }}
                        className={`pt-2 flex flex-col gap-1 cursor-pointer group ${i === 0 ? 'pt-0' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-[11px] font-bold ${n.read ? 'text-zinc-500 dark:text-zinc-400 font-medium' : 'text-zinc-900 dark:text-white'}`}>
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-350 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal">{n.message}</p>
                        <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-mono mt-1">
                          {new Date(n.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • 2026
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Separator block */}
        <span className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />

        {/* Account Quick Badge */}
        <div className="hidden sm:flex flex-col items-end text-right min-w-0">
          <span className="text-xs font-bold text-zinc-850 dark:text-white leading-none tracking-tight">👋 {getGreeting()}, {currentUser.name}</span>
          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono font-bold uppercase mt-1 tracking-wider">
            {currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'guru' ? 'Guru' : `Siswa / ${currentUser.kelas || 'SMKN 46 Jakarta'}`}
          </span>
        </div>


      </div>
    </header>
  );
}
