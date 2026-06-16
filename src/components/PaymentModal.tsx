/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Wallet, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  ChevronRight,
  ArrowRight,
  Building2,
  Smartphone,
  Info
} from 'lucide-react';
import { formatRupiah } from '../data';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: string) => void;
}

const PAYMENT_METHODS = [
  { 
    id: 'qris', 
    name: 'QRIS (Semua E-Wallet & Bank)', 
    icon: <QrCode className="w-5 h-5 text-zinc-900 dark:text-white" />,
    description: 'Scan & bayar pakai GoPay, OVO, Dana, LinkAja, atau Mobile Banking.'
  },
  { 
    id: 'ewallet', 
    name: 'E-Wallet (Bayar Otomatis)', 
    icon: <Smartphone className="w-5 h-5 text-zinc-900 dark:text-white" />,
    description: 'Langsung hubungkan akun GoPay, OVO, atau Dana Anda.'
  },
  { 
    id: 'bank', 
    name: 'Virtual Account (Semua Bank)', 
    icon: <Building2 className="w-5 h-5 text-zinc-900 dark:text-white" />,
    description: 'BCA, Mandiri, BNI, BRI, dan bank lainnya.'
  },
];

export default function PaymentModal({ isOpen, onClose, onConfirm }: PaymentModalProps) {
  const [step, setStep] = useState<'amount' | 'method' | 'qris_display' | 'success'>('amount');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Helper untuk formatting rupiah otomatis di input
  const formatInputRupiah = (val: string) => {
    const number = val.replace(/[^0-9]/g, '');
    if (!number) return '';
    return new Intl.NumberFormat('id-ID').format(parseInt(number));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputRupiah(e.target.value);
    setAmount(formatted);
  };

  const getRawAmount = () => {
    return parseFloat(amount.replace(/\./g, '')) || 0;
  };

  const handleNextStep = () => {
    const rawVal = getRawAmount();
    if (step === 'amount') {
      if (rawVal < 10000) {
        alert('Minimal tabungan adalah Rp 10.000');
        return;
      }
      setStep('method');
    } else if (step === 'method') {
      if (!selectedMethod) return;
      if (selectedMethod === 'qris') {
        setStep('qris_display');
      } else {
        handleFinish();
      }
    }
  };

  const handleFinish = () => {
    onConfirm(getRawAmount(), selectedMethod || 'QRIS');
    setStep('success');
  };

  const resetAndClose = () => {
    onClose();
    setTimeout(() => {
      setStep('amount');
      setAmount('');
      setSelectedMethod(null);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={resetAndClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg max-h-[85vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] shadow-2xl relative z-10 flex flex-col overflow-hidden mx-4"
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight font-sans">Menabung Kurban</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Metode pembayaran instan & aman</p>
            </div>
          </div>
          <button 
            onClick={resetAndClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors group"
          >
            <X className="w-4 h-4 text-zinc-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 'amount' && (
              <motion.div
                key="step-amount"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col gap-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Nominal Tabungan</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors">Rp</span>
                      <input 
                        type="text"
                        placeholder="0"
                        value={amount}
                        onChange={handleAmountChange}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-700/50 rounded-2xl py-4 pl-12 pr-6 text-2xl font-mono font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white transition-all placeholder:text-zinc-200"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {[50000, 100000, 250000, 500000].map((val) => (
                      <button
                        key={val}
                        onClick={() => setAmount(formatInputRupiah(val.toString()))}
                        className="py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-all font-mono"
                      >
                        +{val/1000}rb
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-zinc-900 dark:text-white shrink-0" />
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                      Tabungan tercatat <span className="font-bold text-zinc-900 dark:text-white">Otomatis</span> tanpa perlu konfirmasi manual.
                    </p>
                  </div>

                  <button
                    onClick={handleNextStep}
                    className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl text-sm"
                  >
                    Lanjut Pilih Metode
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'method' && (
              <motion.div
                key="step-method"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="flex flex-col gap-6"
              >
                <div className="p-7 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex flex-col items-center justify-center text-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] dark:shadow-none rounded-[32px]">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono mb-1">Nominal Tabungan</p>
                  <h4 className="text-3xl font-bold text-zinc-900 dark:text-white font-mono tracking-tight">Rp {amount}</h4>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono mb-2 px-1">Metode Pembayaran</p>
                  <div className="grid grid-cols-1 gap-2">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${
                          selectedMethod === method.id 
                            ? 'border-zinc-900 dark:border-white bg-zinc-900/5 dark:bg-white/5' 
                            : 'border-zinc-50 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 bg-zinc-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <div className={`p-2 rounded-xl transition-colors ${
                            selectedMethod === method.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' : 'bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700'
                          }`}>
                            {React.cloneElement(method.icon as React.ReactElement, { className: 'w-4 h-4' })}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-zinc-900 dark:text-white">{method.name}</p>
                            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">{method.description}</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          selectedMethod === method.id ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white' : 'border-zinc-200 dark:border-zinc-700'
                        }`}>
                           {selectedMethod === method.id && <CheckCircle2 className="w-3 h-3 text-white dark:text-zinc-900" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                    <button
                      onClick={handleNextStep}
                      disabled={!selectedMethod}
                      className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-98 disabled:opacity-50 transition-all shadow-xl font-sans text-xs"
                    >
                      Konfirmasi Tabungan
                    </button>
              </motion.div>
            )}

            {step === 'qris_display' && (
              <motion.div
                key="step-qris"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="flex flex-col items-center">
                  <div className="p-4 bg-white rounded-[32px] border-2 border-zinc-50 shadow-xl">
                     <div className="w-40 h-40 bg-zinc-50 flex items-center justify-center relative overflow-hidden rounded-[24px]">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" 
                        alt="QRIS Mock" 
                        className="w-32 h-32 opacity-90"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="bg-white p-2 rounded-xl shadow-lg border border-zinc-100">
                            <QrCode className="w-5 h-5 text-zinc-900" />
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full text-center space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Scan QRIS Untuk Bayar</p>
                    <h4 className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">Rp {amount}</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                       <div className="w-2.5 h-2.5 bg-zinc-900 dark:bg-white rounded-full animate-pulse" />
                       <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Menunggu Pembayaran...</span>
                    </div>

                    <button
                      onClick={handleFinish}
                      className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl text-sm"
                    >
                      Simulasi Sukses
                    </button>
                    <button
                      onClick={() => setStep('method')}
                      className="w-full py-2 text-[10px] font-bold text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest font-mono text-center"
                    >
                      Batal Scan
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 flex flex-col items-center space-y-8 text-center"
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="w-24 h-24 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-[32px] flex items-center justify-center shadow-xl rotate-12"
                  >
                    <CheckCircle2 className="w-12 h-12" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 border-4 border-zinc-900 dark:border-white rounded-[32px]"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Tabungan Berhasil!</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px] leading-relaxed mx-auto">
                    Alhamdulillah, dana <span className="font-bold text-zinc-900 dark:text-white font-mono text-sm">Rp {amount}</span> telah kami terima. Saldo tabungan kurban Anda sudah diperbarui otomatis.
                  </p>
                </div>

                <div className="w-full max-w-[240px]">
                  <button
                    onClick={resetAndClose}
                    className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl font-sans text-xs"
                  >
                    Selesai & Lihat Dasbor
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
