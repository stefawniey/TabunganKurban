/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getUsers, 
  saveUsers, 
  getTransactions, 
  saveTransactions, 
  getNotifications, 
  saveNotifications, 
  initializeStorage,
  getUsersAsync,
  saveUsersAsync,
  getTransactionsAsync,
  saveTransactionsAsync,
  getNotificationsAsync,
  saveNotificationsAsync,
  ensureUserSyncedAsync,
  clearAllDataAsync
} from './data';
import { User, Transaksi, Notifikasi } from './types';
import { LogOut } from 'lucide-react';

// Importing Custom Panels
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import GuruSiswaManager from './components/GuruSiswaManager';
import TabunganKurban from './components/TabunganKurban';
import TransaksiTabungan from './components/TransaksiTabungan';
import LaporanTabungan from './components/LaporanTabungan';
import ManajemenPengguna from './components/ManajemenPengguna';
import Profil from './components/Profil';

export default function App() {
  // Initialize storage once on boot
  useEffect(() => {
    initializeStorage();
    if (!localStorage.getItem('tk_hard_reset_v1')) {
      clearAllDataAsync().then(() => {
        localStorage.setItem('tk_hard_reset_v1', 'true');
        // reload location to ensure clean state
        window.location.reload();
      });
    }
  }, []);

  // Application state controllers
  const [currentRoute, setCurrentRoute] = useState<'/' | '/login' | '/app'>('/');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Real-time local database states
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [notifications, setNotifications] = useState<Notifikasi[]>([]);
  
  // Layout States
  const [activeMenu, setActiveMenu] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  // Load database from localStorage on startup and refresh from Supabase
  useEffect(() => {
    // 1. Render immediately using local memory cache for instant performance
    setUsers(getUsers());
    setTransactions(getTransactions());
    setNotifications(getNotifications());

    // 2. Refresh from the live Supabase Database in background
    const syncDb = async () => {
      try {
        const freshUsers = await getUsersAsync();
        let verifiedUsers = [...freshUsers];

        // Membaca session login saat ini langsung dari localStorage secara sinkron
        const savedUserStr = localStorage.getItem('tk_current_user');
        if (savedUserStr) {
          try {
            const activeUser: User = JSON.parse(savedUserStr);
            // SELF-HEALING: Jika user yang aktif saat ini login tapi tidak terdaftar di Supabase
            // (misal karena database di-reset atau sync tertinggal), paksa upsert kembali demi keutuhan data referensial.
            if (!freshUsers.some(u => u.id === activeUser.id)) {
              console.warn(`User aktif ${activeUser.name} tidak terdaftar di database Supabase. Melakukan sinkronisasi mandiri...`);
              await ensureUserSyncedAsync(activeUser);
              verifiedUsers.push(activeUser);
              saveUsers(verifiedUsers);
            }
          } catch (_) {}
        }

        setUsers(verifiedUsers);

        const freshTxs = await getTransactionsAsync();
        setTransactions(freshTxs);

        const freshNotifs = await getNotificationsAsync();
        setNotifications(freshNotifs);
      } catch (err) {
        console.error('Failed to run background database synchronization:', err);
      }
    };
    syncDb();

    // Check if user session is already active (persistent login)
    const savedSession = localStorage.getItem('tk_current_user');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setCurrentUser(parsed);
        setCurrentRoute('/app');
      } catch (e) {
        localStorage.removeItem('tk_current_user');
      }
    }
  }, []);

  // Reload and sync latest state whenever route changes to keep panels completely up to date
  useEffect(() => {
    // Reload local files instantly for zero-latency UI updates
    setUsers(getUsers());
    setTransactions(getTransactions());
    setNotifications(getNotifications());

    const syncDb = async () => {
      try {
        const freshUsers = await getUsersAsync();
        let verifiedUsers = [...freshUsers];
        
        const savedUserStr = localStorage.getItem('tk_current_user');
        if (savedUserStr) {
          try {
            const activeUser: User = JSON.parse(savedUserStr);
            if (!freshUsers.some(u => u.id === activeUser.id)) {
              await ensureUserSyncedAsync(activeUser);
              verifiedUsers.push(activeUser);
              saveUsers(verifiedUsers);
            }
          } catch (_) {}
        }
        setUsers(verifiedUsers);

        const freshTxs = await getTransactionsAsync();
        setTransactions(freshTxs);

        const freshNotifs = await getNotificationsAsync();
        setNotifications(freshNotifs);
      } catch (err) {
        console.error('Failed to run background synchronization on route change:', err);
      }
    };
    syncDb();
  }, [currentRoute]);

  // Synchronizers
  const handleUpdateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    saveUsersAsync(newUsers); // Persist live to Supabase/Local
  };

  const handleUpdateTransactions = (newTxs: Transaksi[]) => {
    setTransactions(newTxs);
    saveTransactionsAsync(newTxs); // Persist live to Supabase/Local
  };

  const handleUpdateNotifications = (newNotifs: Notifikasi[]) => {
    setNotifications(newNotifs);
    saveNotificationsAsync(newNotifs); // Persist live to Supabase/Local
  };

  const handleUpdateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('tk_current_user', JSON.stringify(updatedUser));
    
    // Also update in the global users list
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    handleUpdateUsers(updatedUsers);
  };

  const handleUpdateTarget = (type: 'domba' | 'kambing' | 'sapi_sepertujuh' | 'sapi_penuh' | 'custom', amount: number) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      targetHewan: type,
      targetAmount: amount
    };
    handleUpdateCurrentUser(updatedUser);

    // Create notification
    const notif: Notifikasi = {
      id: `nt-target-${Date.now()}_usr_${currentUser.id}`,
      userId: currentUser.id,
      title: 'Target Diperbarui',
      message: `Anda baru saja mengubah target kurban Anda menjadi ${type.replace('_', ' ')}. Semangat menabung!`,
      type: 'info',
      date: new Date().toISOString(),
      read: false
    };
    const updatedNotif = [notif, ...notifications];
    setNotifications(updatedNotif);
    saveNotificationsAsync(updatedNotif);
  };

  // Quick Action Deposit (misal dari dashboard shortcut)
  const handleAddTransactionQuick = (userId: string, amount: number, type: 'setor' | 'tarik', notes: string) => {
    let matchedUser = users.find(u => u.id === userId);
    if (!matchedUser && currentUser && currentUser.id === userId) {
      matchedUser = currentUser;
    }
    if (!matchedUser) return;

    const newTx: Transaksi = {
      id: `tx-${Date.now()}`,
      userId,
      userName: matchedUser.name,
      userRole: matchedUser.role,
      userKelas: matchedUser.kelas,
      amount,
      type,
      date: new Date().toISOString().split('T')[0],
      recordedBy: currentUser ? currentUser.name : 'Sistem Admin',
      notes
    };

    const updatedTxs = [newTx, ...transactions];
    handleUpdateTransactions(updatedTxs);

    // Tambah notifikasi real-time
    const newNotif: Notifikasi = {
      id: `nt-${Date.now()}_usr_${userId}`,
      userId: userId, // Diarahkan khusus ke nasabah / penabung terkait
      title: 'Tabungan Berhasil',
      message: `Dana kurban Rp ${amount.toLocaleString('id-ID')} atas nama ${matchedUser.name} sukses tercatat dwi-bulanan.`,
      type: 'success',
      date: new Date().toISOString(),
      read: false
    };

    const updatedNotif = [newNotif, ...notifications];
    setNotifications(updatedNotif);
    saveNotificationsAsync(updatedNotif);
  };

  const handleNavigate = (route: string) => {
    if (route === '/' || route === '/login' || route === '/app') {
      setCurrentRoute(route as any);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('tk_current_user', JSON.stringify(user));
    setCurrentRoute('/app');
    setActiveMenu('dashboard');

    // Buat sapaan notifikasi baru
    const loginNotif: Notifikasi = {
      id: `nt-log-${Date.now()}_usr_${user.id}`,
      userId: user.id, // Hanya untuk user yang sedang login ini
      title: 'Login Berhasil',
      message: `Halo ${user.name}, Anda berhasil masuk ke Sistem Tabungan Kurban dengan peran ${user.role === 'admin' ? 'Administrator' : user.role === 'guru' ? 'Guru' : 'Siswa'}.`,
      type: 'info',
      date: new Date().toISOString(),
      read: false
    };
    const updatedNotif = [loginNotif, ...notifications];
    setNotifications(updatedNotif);
    saveNotificationsAsync(updatedNotif);
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tk_current_user');
    setCurrentRoute('/');
    setShowLogoutModal(false);
  };

  // Navigasi instan dari komponen anak ke tab mutasi dengan filter anak tertentu
  const [selectedLedgerUserId, setSelectedLedgerUserId] = useState<string | null>(null);
  
  const handleNavigateToLedgerRecords = (userId: string) => {
    setSelectedLedgerUserId(userId);
    setActiveMenu('transaksi_tabungan');
  };

  // Render the current panel inside /app workspace
  const renderActivePanel = () => {
    if (!currentUser) return null;

    switch (activeMenu) {
      case 'dashboard':
        return (
          <Dashboard 
            currentUser={currentUser}
            onNavigateToMenu={(menu) => {
              setSelectedLedgerUserId(null); // set default
              setActiveMenu(menu);
            }}
            transactions={transactions}
            users={users}
            onAddTransactionQuick={handleAddTransactionQuick}
            onUpdateTarget={handleUpdateTarget}
          />
        );
      
      // Admin menus
      case 'data_siswa':
        if (currentUser.role !== 'admin') return <UnauthorizedPanel />;
        return (
          <GuruSiswaManager 
            type="siswa" 
            users={users} 
            onUpdateUsers={handleUpdateUsers} 
          />
        );
      
      case 'data_guru':
        if (currentUser.role !== 'admin') return <UnauthorizedPanel />;
        return (
          <GuruSiswaManager 
            type="guru" 
            users={users} 
            onUpdateUsers={handleUpdateUsers} 
          />
        );
      
      case 'tabungan_kurban':
        if (currentUser.role !== 'admin') return <UnauthorizedPanel />;
        return (
          <TabunganKurban 
            users={users}
            transactions={transactions}
            onNavigateToRecords={handleNavigateToLedgerRecords}
          />
        );
      
      case 'transaksi_tabungan':
        const txProps = {
          currentUser,
          transactions,
          users,
          onUpdateTransactions: handleUpdateTransactions,
          selectedParticipantId: selectedLedgerUserId,
          notifications,
          onUpdateNotifications: handleUpdateNotifications
        };
        return <TransaksiTabungan {...txProps} />;
      
      case 'laporan_tabungan':
        if (currentUser.role !== 'admin') return <UnauthorizedPanel />;
        return <LaporanTabungan users={users} transactions={transactions} />;
      
      case 'manajemen_pengguna':
        if (currentUser.role !== 'admin') return <UnauthorizedPanel />;
        return (
          <ManajemenPengguna 
            users={users} 
            onUpdateUsers={handleUpdateUsers} 
            currentUser={currentUser}
          />
        );

      // Guru / Siswa menus
      case 'riwayat_tabungan':
        return (
          <TransaksiTabungan 
            currentUser={currentUser}
            transactions={transactions}
            users={users}
            onUpdateTransactions={handleUpdateTransactions}
            notifications={notifications}
            onUpdateNotifications={handleUpdateNotifications}
          />
        );
      
      case 'profil':
        return (
          <Profil 
            currentUser={currentUser}
            users={users}
            onUpdateUsers={handleUpdateUsers}
            onUpdateCurrentUser={handleUpdateCurrentUser}
          />
        );

      default:
        return <div className="text-center py-20 text-zinc-500">Menu kerja belum diimplementasi.</div>;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-350 select-none bg-zinc-50 text-zinc-900`}>
      <AnimatePresence mode="wait">
        
        {/* RENDER LANDING PAGE */}
        {currentRoute === '/' && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LandingPage onNavigate={handleNavigate} currentUser={currentUser} />
          </motion.div>
        )}

        {/* RENDER HALAMAN LOGIN */}
        {currentRoute === '/login' && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Login 
              onLoginSuccess={handleLoginSuccess} 
              onNavigate={handleNavigate} 
            />
          </motion.div>
        )}

        {/* RENDER SECURE INTERFACE WORKSPACE */}
        {currentRoute === '/app' && currentUser && (
          <motion.div 
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen relative"
          >
            {/* Sidebar Navigation Drawer */}
            <Sidebar 
              role={currentUser.role}
              activeMenu={activeMenu}
              setActiveMenu={(menu) => {
                setSelectedLedgerUserId(null); // Reset deep linked locks
                setActiveMenu(menu);
              }}
              isOpen={mobileSidebarOpen}
              setIsOpen={setMobileSidebarOpen}
              userName={currentUser.name}
              onLogout={handleLogout}
            />

            {/* Central content frame layout */}
            <div className="flex-1 flex flex-col min-w-0">
              
              {/* Central workspace Header */}
              <Header 
                currentUser={currentUser} 
                sidebarOpen={mobileSidebarOpen}
                setMobileSidebarOpen={setMobileSidebarOpen}
                notifications={notifications}
                setNotifications={setNotifications}
              />

              {/* Working board stage canvas panel */}
              <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-16 overflow-x-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMenu}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="w-full"
                  >
                    {renderActivePanel()}
                  </motion.div>
                </AnimatePresence>
              </main>

            </div>

            {/* CUSTOM LOGOUT CONFIRMATION MODAL */}
            <AnimatePresence>
              {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-700/50 text-zinc-800 dark:text-zinc-200 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                        <LogOut className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Keluar dari Sistem?</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Pastikan semua data tabungan hari ini telah tersimpan dengan benar sebelum meninggalkan dasbor.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                       <button 
                        onClick={() => setShowLogoutModal(false)}
                        className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-650 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={confirmLogout}
                        className="px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Ya, Keluar
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Security Guard panel
function UnauthorizedPanel() {
  return (
    <div className="text-center py-20 space-y-4">
      <div className="w-16 h-16 bg-zinc-500/10 text-zinc-450 border border-zinc-500/20 rounded-full flex items-center justify-center mx-auto text-xl font-bold">!</div>
      <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-sans">Akses Pengawasan Ditolak</h3>
      <p className="text-xs text-zinc-400 max-w-md mx-auto">Anda tidak memiliki hak otentikasi administrator kurban untuk melihat lembar panel kerja ini. Hubungi operator sistem.</p>
    </div>
  );
}
