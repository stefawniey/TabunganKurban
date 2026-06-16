/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Coins, 
  ArrowRightLeft, 
  FileSpreadsheet, 
  UserCog, 
  Wallet, 
  History, 
  UserCheck,
  LogOut 
} from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  role: Role;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  userName: string;
  onLogout: () => void;
}

export default function Sidebar({ role, activeMenu, setActiveMenu, isOpen, setIsOpen, userName, onLogout }: SidebarProps) {
  
  // Menu Item Configuration
  const menuConfig = {
    admin: [
      { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
      { id: 'data_siswa', label: 'Data Siswa', icon: Users },
      { id: 'data_guru', label: 'Data Guru', icon: GraduationCap },
      { id: 'tabungan_kurban', label: 'Tabungan Kurban', icon: Coins },
      { id: 'laporan_tabungan', label: 'Laporan Tabungan', icon: FileSpreadsheet },
    ],
    guru: [
      { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
      { id: 'riwayat_tabungan', label: 'Riwayat Tabungan', icon: History },
      { id: 'profil', label: 'Profil Saya', icon: UserCheck },
    ],
    siswa: [
      { id: 'dashboard', label: 'Dasbor', icon: LayoutDashboard },
      { id: 'riwayat_tabungan', label: 'Riwayat Tabungan', icon: History },
      { id: 'profil', label: 'Profil Saya', icon: UserCheck },
    ]
  };

  const currentMenus = menuConfig[role] || [];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Side Navigation container */}
      <aside 
        id="side-navigation"
        className={`fixed md:sticky top-0 left-0 h-screen bg-white dark:bg-zinc-900 overflow-hidden flex flex-col justify-between transition-all duration-300 ease-in-out z-50 md:z-30 shrink-0
          ${isOpen 
            ? 'translate-x-0 opacity-100' 
            : '-translate-x-full opacity-0 pointer-events-none'
          }
        `}
        style={{
          width: isOpen ? '16rem' : '0px',
          minWidth: isOpen ? '16rem' : '0px',
          padding: isOpen ? '1.5rem' : '0px',
          borderRightWidth: isOpen ? '1px' : '0px',
          borderColor: 'rgba(228, 228, 231, 0.2)', // light border-zinc-200 / border-zinc-800 style fallback
        }}
      >
        <div className="space-y-8" style={{ width: '13rem', minWidth: '13rem' }}>
          {/* Sidebar Brand Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center">
                <Coins className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
              </div>
              <div>
                <h4 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">Tabungan Kurban</h4>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono tracking-widest mt-0.5">TABUNGAN SMK</p>
              </div>
            </div>
            
            {/* Close trigger for both mobile and desktop */}
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
 
          {/* User badge on Sidebar for responsive feedback */}
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 flex items-center gap-3 shadow-inner">
            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-800 dark:text-white uppercase shadow-sm">
              {userName.substring(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{userName}</p>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono font-bold uppercase mt-0.5 tracking-wider bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 w-max">
                {role === 'admin' ? 'Admin' : role === 'guru' ? 'Guru' : 'Siswa/i'}
              </p>
            </div>
          </div>
 
          {/* Navigation Links list */}
          <nav className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-widest block px-3 mb-2 font-mono uppercase">MENU UTAMA</span>
            {currentMenus.map((menu) => {
              const Icon = menu.icon;
              const isActive = activeMenu === menu.id;
              
              return (
                <motion.button
                  key={menu.id}
                  whileHover={{ x: 5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => {
                    setActiveMenu(menu.id);
                    setIsOpen(false); // Close on mobile immediately
                  }}
                  className={`w-full py-3 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition-all relative group cursor-pointer
                    ${isActive 
                      ? 'bg-zinc-900 dark:bg-zinc-800 text-white border border-zinc-900 dark:border-zinc-700 shadow-md shadow-black/10' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
                    }
                  `}
                >
                  {/* Left indicator light for active menu */}
                  {isActive && (
                    <motion.span 
                      layoutId="sidebar-active-pill"
                      className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-zinc-500 rounded-r-lg" 
                    />
                  )}
                  
                  <Icon className={`w-4 h-4 shrink-0 transition-all ${isActive ? 'text-white scale-110' : 'text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white group-hover:scale-110'}`} />
                  <span>{menu.label}</span>
                </motion.button>
              );
            })}
          </nav>
        </div>
 
        {/* System copyright watermark */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold font-sans">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="group flex items-center justify-center gap-2 px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-900 dark:hover:bg-white border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-white dark:hover:text-zinc-900 rounded-xl transition-all shadow-sm cursor-pointer w-full"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-xs font-bold font-sans">Keluar</span>
          </motion.button>
        </div>
      </aside>
    </>
  );
}
