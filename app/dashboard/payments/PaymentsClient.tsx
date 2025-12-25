'use client';

import { useState, useEffect } from 'react';
import { formatMoney, getCurrency } from '@/lib/currency';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Wallet,
  Receipt
} from 'lucide-react';

interface PaymentsClientProps {
  payments: any[];
  stats?: any;
  isTeacher: boolean;
}

export default function PaymentsClient({ payments, stats, isTeacher }: PaymentsClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Force re-render when currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    window.addEventListener('storage', handleCurrencyChange);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
      window.removeEventListener('storage', handleCurrencyChange);
    };
  }, []);

  if (isTeacher) {
    return <TeacherPaymentsView payments={payments} stats={stats} key={refreshKey} />;
  } else {
    return <StudentPaymentsView payments={payments} key={refreshKey} />;
  }
}

function StudentPaymentsView({ payments }: { payments: any[] }) {
  const [currency, setCurrency] = useState(() => getCurrency());
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrency(getCurrency());
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    window.addEventListener('storage', handleCurrencyChange);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
      window.removeEventListener('storage', handleCurrencyChange);
    };
  }, []);

  const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalDue = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const remaining = totalDue - totalPaid;
  const progressPercent = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  return (
    <div key={refreshKey} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mes Paiements</h1>
        <p className="text-slate-400">
          Suivez l'évolution de vos paiements par tranches 
          <span className="ml-2 px-2 py-0.5 rounded bg-white/10 text-xs">{currency.symbol}</span>
        </p>
      </div>

      {/* Summary Card */}
      <div className="glass rounded-2xl p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Wallet className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-1">Total payé</p>
            <p className="text-2xl font-bold text-emerald-400">{formatMoney(totalPaid)}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-1">Reste à payer</p>
            <p className="text-2xl font-bold text-amber-400">{formatMoney(remaining)}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <TrendingUp className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400 mb-1">Progression</p>
            <p className="text-2xl font-bold text-cyan-400">{progressPercent.toFixed(0)}%</p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progression globale</span>
            <span className="text-white">{formatMoney(totalPaid)} / {formatMoney(totalDue)}</span>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Payments by Course */}
      <div className="space-y-6">
        {payments.length > 0 ? (
          payments.map((payment) => (
            <PaymentCard key={`${payment.id}-${refreshKey}`} payment={payment} />
          ))
        ) : (
          <div className="glass rounded-2xl p-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-slate-500" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucun paiement</h3>
            <p className="text-slate-400">Vous n'avez pas encore de cours avec des paiements enregistrés.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TeacherPaymentsView({ payments, stats }: { payments: any[]; stats: any }) {
  const [currency, setCurrency] = useState(() => getCurrency());
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrency(getCurrency());
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    window.addEventListener('storage', handleCurrencyChange);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
      window.removeEventListener('storage', handleCurrencyChange);
    };
  }, []);
  
  return (
    <div key={refreshKey} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Gestion des Paiements</h1>
        <p className="text-slate-400">
          Suivez les paiements de vos étudiants
          <span className="ml-2 px-2 py-0.5 rounded bg-white/10 text-xs">Devise: {currency.symbol}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-slate-400">Total reçu</p>
          <p className="text-2xl font-bold text-emerald-400">{formatMoney(stats.totalReceived)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-slate-400">Total attendu</p>
          <p className="text-2xl font-bold text-white">{formatMoney(stats.totalExpected)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-slate-400">Paiements complets</p>
          <p className="text-2xl font-bold text-cyan-400">{stats.completedPayments}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-slate-400">En attente</p>
          <p className="text-2xl font-bold text-amber-400">{stats.pendingPayments}</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Étudiant</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Cours</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Payé / Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Tranches</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((payment) => (
                <tr key={`${payment.id}-${refreshKey}`} className="hover:bg-white/5 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center text-white text-sm font-medium">
                        {payment.student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-white">{payment.student.name}</div>
                        <div className="text-sm text-slate-500">{payment.student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{payment.classroom.title}</td>
                  <td className="px-6 py-4">
                    <div className="text-white">{formatMoney(payment.paidAmount)} / {formatMoney(payment.totalAmount)}</div>
                    <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500"
                        style={{ width: `${(payment.paidAmount / payment.totalAmount) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{payment.tranches.length}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      payment.status === 'COMPLETED' 
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : payment.status === 'PARTIAL'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {payment.status === 'COMPLETED' ? 'Complet' : 
                       payment.status === 'PARTIAL' ? 'Partiel' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PaymentCard({ payment }: { payment: any }) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = () => {
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange);
    window.addEventListener('storage', handleCurrencyChange);

    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange);
      window.removeEventListener('storage', handleCurrencyChange);
    };
  }, []);

  const progressPercent = (payment.paidAmount / payment.totalAmount) * 100;
  const remaining = payment.totalAmount - payment.paidAmount;

  return (
    <div key={refreshKey} className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white mb-1">{payment.classroom.title}</h3>
            <p className="text-slate-400 text-sm">
              Inscrit le {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            payment.status === 'COMPLETED' 
              ? 'bg-emerald-500/20 text-emerald-400'
              : payment.status === 'PARTIAL'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {payment.status === 'COMPLETED' ? (
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Payé</span>
            ) : payment.status === 'PARTIAL' ? (
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> En cours</span>
            ) : (
              <span className="flex items-center gap-1"><AlertCircle className="w-4 h-4" /> En attente</span>
            )}
          </span>
        </div>

        {/* Progress */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progression</span>
            <span className="text-white font-medium">
              {formatMoney(payment.paidAmount)} / {formatMoney(payment.totalAmount)}
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                payment.status === 'COMPLETED' 
                  ? 'bg-emerald-500' 
                  : 'bg-gradient-to-r from-cyan-500 to-violet-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {remaining > 0 && (
            <p className="text-sm text-amber-400">
              Reste à payer : {formatMoney(remaining)}
            </p>
          )}
        </div>
      </div>

      {/* Tranches History */}
      {payment.tranches.length > 0 && (
        <div className="p-6">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Historique des tranches ({payment.tranches.length})
          </h4>
          <div className="space-y-3">
            {payment.tranches.map((tranche: any, index: number) => (
              <div 
                key={tranche.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      Tranche #{payment.tranches.length - index}
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(tranche.paidAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {tranche.method && (
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10">
                          {tranche.method === 'CASH' ? 'Espèces' : 
                           tranche.method === 'MOBILE_MONEY' ? 'Mobile Money' : 
                           tranche.method === 'BANK_TRANSFER' ? 'Virement' : 'Autre'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-400">
                    +{formatMoney(tranche.amount)}
                  </div>
                  {tranche.reference && (
                    <div className="text-xs text-slate-500">Réf: {tranche.reference}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

