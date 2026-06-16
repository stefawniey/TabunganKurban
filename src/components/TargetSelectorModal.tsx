/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Target, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { formatRupiah } from '../data';

interface TargetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'domba' | 'kambing' | 'sapi_sepertujuh' | 'sapi_penuh' | 'custom', amount: number) => void;
  currentTarget: string | undefined;
}

const TARGET_OPTIONS = [
  { 
    id: 'domba', 
    name: '1 Ekor Domba', 
    amount: 2500000,
    description: 'Target kurban perorangan dengan domba.'
  },
  { 
    id: 'kambing', 
    name: '1 Ekor Kambing', 
    amount: 3500000,
    description: 'Target standar untuk kurban perorangan.'
  },
  { 
    id: 'sapi_sepertujuh', 
    name: '1/7 Patungan Sapi', 
    amount: 4000000,
    description: 'Bergabung dengan 6 orang lainnya untuk 1 ekor sapi.'
  },
  { 
    id: 'sapi_penuh', 
    name: '1 Ekor Sapi Utuh', 
    amount: 28000000,
    description: 'Kurban keluarga atau pribadi dengan 1 ekor sapi penuh.'
  },
  { 
    id: 'custom', 
    name: 'Target Kustom', 
    amount: 1000000,
    description: 'Tentukan target nominal tabungan Anda sendiri.'
  },
];

export default function TargetSelectorModal({ isOpen, onClose, onSelect, currentTarget }: TargetSelectorModalProps) {
  const [isCustomMode, setIsCustomMode] = React.useState(false);
  const [customAmount, setCustomAmount] = React.useState('1.000.000');

  // Helper untuk formatting rupiah otomatis di input
  const formatInputRupiah = (val: string) => {
    const number = val.replace(/[^0-9]/g, '');
    if (!number) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(number));
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputRupiah(e.target.value);
    setCustomAmount(formatted);
  };

  const getRawAmount = () => {
    return parseFloat(customAmount.replace(/\./g, '')) || 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[80vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] shadow-2xl relative z-10 mx-4 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/30 dark:bg-zinc-900/30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl shadow-md">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
                {isCustomMode ? 'Set Target Kustom' : 'Pilih Target Ibadah Kurban'}
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium">
                {isCustomMode ? 'Tentukan sendiri nominal tabungan kurban Anda' : 'Tentukan pencapaian tabungan kurban Anda tahun ini'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all group"
          >
            <X className="w-4 h-4 text-zinc-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {!isCustomMode ? (
              <motion.div 
                key="selection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {TARGET_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (option.id === 'custom') {
                        setIsCustomMode(true);
                      } else {
                        onSelect(option.id as any, option.amount);
                        onClose();
                      }
                    }}
                    className={`group w-full p-5 rounded-[24px] border-2 flex items-center gap-4 transition-all text-left relative ${
                      currentTarget === option.id 
                        ? 'border-zinc-900 dark:border-white bg-white dark:bg-zinc-900 shadow-xl z-10' 
                        : 'border-zinc-50 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 bg-zinc-50/50'
                    }`}
                  >
                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center shadow-sm transition-all group-hover:scale-105 ${
                      currentTarget === option.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-white dark:bg-zinc-800 text-zinc-400 border border-zinc-100 dark:border-zinc-700'
                    }`}>
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                         <p className={`text-base font-bold truncate ${currentTarget === option.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>{option.name}</p>
                         {currentTarget === option.id && <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-white" />}
                      </div>
                      <p className={`text-sm font-bold font-mono ${currentTarget === option.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'}`}>
                        {option.id === 'custom' ? 'Mulai Rp 500rb' : formatRupiah(option.amount)}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed mt-1 line-clamp-1">{option.description}</p>
                    </div>

                    <div className={`shrink-0 transition-opacity ${currentTarget === option.id ? 'opacity-100' : 'opacity-0'}`}>
                       <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4" />
                       </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="custom-input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-md mx-auto space-y-6 py-4"
              >
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Masukkan Nominal Target Kustom</label>
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400 group-focus-within:text-zinc-900 transition-colors">Rp</span>
                    <input 
                      type="text"
                      autoFocus
                      placeholder="0"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-700/50 rounded-2xl py-5 pl-14 pr-6 text-2xl font-mono font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 transition-all placeholder:text-zinc-200"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsCustomMode(false)}
                    className="flex-1 py-4 rounded-xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 transition-all text-sm font-sans"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      onSelect('custom', getRawAmount());
                      onClose();
                      setIsCustomMode(false);
                    }}
                    className="flex-[2] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl text-sm font-sans"
                  >
                    Simpan Target
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-[20px] border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4">
            <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm shrink-0 text-zinc-400">
              <Info className="w-4 h-4" />
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
              Target ini membantu Anda melacak progres tabungan secara visual di dasbor. Anda bisa mengubahnya kapan saja sesuai kemampuan menyisihkan dana.
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
