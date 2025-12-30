'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/currency';
import {
  CreditCard,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Wallet,
  Receipt,
  User,
  Mail,
  Phone,
  Filter,
  Download,
  X,
  Check,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { swal } from '@/lib/swal';
import Swal from 'sweetalert2';

interface TrainingPaymentsClientProps {
  trainingSession: {
    id: string;
    title: string;
  };
  tranches: any[];
  stats: {
    totalExpected: number;
    totalPaid: number;
    totalTranches: number;
    paidTranches: number;
    pendingTranches: number;
    overdueTranches: number;
    excusedTranches: number;
    collectionRate: number;
  };
  trainingSessionId: string;
}

export default function TrainingPaymentsClient({ 
  trainingSession, 
  tranches, 
  stats,
  trainingSessionId
}: TrainingPaymentsClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'excused'>('all');

  // Filtrer les tranches
  const filteredTranches = tranches.filter(tranche => {
    const matchesSearch = 
      tranche.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tranche.student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isPaid = !!tranche.paidAt;
    const isOverdue = !isPaid && tranche.dueDate && new Date(tranche.dueDate) < new Date();
    const isExcused = tranche.hasExcuse;

    if (filterStatus === 'paid') return matchesSearch && isPaid;
    if (filterStatus === 'pending') return matchesSearch && !isPaid && !isOverdue;
    if (filterStatus === 'overdue') return matchesSearch && isOverdue;
    if (filterStatus === 'excused') return matchesSearch && isExcused;
    return matchesSearch;
  });

  const handleMarkAsPaid = async (tranche: any) => {
    const result = await Swal.fire({
      title: 'Enregistrer le paiement',
      text: 'Montant payé:',
      input: 'number',
      inputValue: tranche.expectedAmount,
      inputPlaceholder: 'Montant',
      showCancelButton: true,
      confirmButtonText: 'Enregistrer',
      cancelButtonText: 'Annuler',
      background: '#0a0f1a',
      color: '#e2e8f0',
      customClass: {
        popup: 'glass border border-white/10',
        title: 'text-white',
        htmlContainer: 'text-slate-300',
        confirmButton: 'bg-cyan-500 hover:bg-cyan-600',
        cancelButton: 'bg-slate-500 hover:bg-slate-600'
      }
    });

    if (!result.isConfirmed || !result.value) {
      return;
    }

    const amount = parseFloat(result.value);
    if (isNaN(amount) || amount <= 0) {
      await swal.error('Erreur', 'Montant invalide');
      return;
    }

    try {
      const res = await fetch(`/api/training-sessions/${trainingSessionId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: tranche.enrollmentId,
          trancheId: tranche.id,
          amount,
          method: 'CASH'
        })
      });

      const data = await res.json();
      if (res.ok) {
        await swal.success('Paiement enregistré', 'Le paiement a été enregistré avec succès.');
        window.location.reload();
      } else {
        await swal.error('Erreur', data.error || 'Erreur lors de l\'enregistrement du paiement');
      }
    } catch (error) {
      console.error('Error marking payment:', error);
      await swal.error('Erreur', 'Une erreur est survenue');
    }
  };

  const handleApproveExcuse = async (trancheId: string, approved: boolean) => {
    try {
      const res = await fetch(`/api/training-sessions/${trainingSessionId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trancheId,
          approved
        })
      });

      const data = await res.json();
      if (res.ok) {
        await swal.success(
          approved ? 'Excuse approuvée' : 'Excuse refusée',
          approved ? 'L\'excuse a été approuvée.' : 'L\'excuse a été refusée.'
        );
        window.location.reload();
      } else {
        await swal.error('Erreur', data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error approving excuse:', error);
      await swal.error('Erreur', 'Une erreur est survenue');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-emerald-400" />
          Gestion des paiements
        </h1>
        <p className="text-slate-400">{trainingSession.title}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-slate-400 text-sm">Total collecté</span>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{formatMoney(stats.totalPaid)}</p>
          <p className="text-xs text-slate-500 mt-1">sur {formatMoney(stats.totalExpected)}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-slate-400 text-sm">Taux de collecte</span>
          </div>
          <p className="text-3xl font-bold text-cyan-400">{stats.collectionRate.toFixed(1)}%</p>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-slate-400 text-sm">En attente</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">{stats.pendingTranches}</p>
          {stats.overdueTranches > 0 && (
            <p className="text-xs text-red-400 mt-1">{stats.overdueTranches} en retard</p>
          )}
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-slate-400 text-sm">Payées</span>
          </div>
          <p className="text-3xl font-bold text-violet-400">{stats.paidTranches}</p>
          <p className="text-xs text-slate-500 mt-1">sur {stats.totalTranches} tranches</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">Tous les statuts</option>
            <option value="paid">Payées</option>
            <option value="pending">En attente</option>
            <option value="overdue">En retard</option>
            <option value="excused">Avec excuse</option>
          </select>
        </div>
      </div>

      {/* Tranches List */}
      {filteredTranches.length > 0 ? (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Étudiant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Montant attendu
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Montant payé
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Date d'échéance
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTranches.map((tranche: any) => {
                  const isPaid = !!tranche.paidAt;
                  const isOverdue = !isPaid && tranche.dueDate && new Date(tranche.dueDate) < new Date();
                  const isExcused = tranche.hasExcuse;
                  const isPartiallyPaid = tranche.actualAmount > 0 && tranche.actualAmount < tranche.expectedAmount;

                  return (
                    <tr key={tranche.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{tranche.student.name}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <Mail className="w-3 h-3" />
                            {tranche.student.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{formatMoney(tranche.expectedAmount)}</div>
                        {tranche.expectedPercent && (
                          <div className="text-xs text-slate-500">{tranche.expectedPercent.toFixed(1)}% du total</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-medium ${
                          isPaid ? 'text-emerald-400' : 
                          isPartiallyPaid ? 'text-amber-400' : 
                          'text-slate-500'
                        }`}>
                          {formatMoney(tranche.actualAmount || 0)}
                        </div>
                        {isPartiallyPaid && (
                          <div className="text-xs text-amber-400 mt-1">Paiement partiel</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tranche.dueDate ? (
                          <div className={`text-sm ${
                            isOverdue ? 'text-red-400' : 
                            isPaid ? 'text-slate-500' : 
                            'text-slate-300'
                          }`}>
                            {new Date(tranche.dueDate).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">-</span>
                        )}
                        {tranche.paidAt && (
                          <div className="text-xs text-emerald-400 mt-1">
                            Payé le {new Date(tranche.paidAt).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isPaid ? (
                            <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Payée
                            </span>
                          ) : isOverdue ? (
                            <span className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              En retard
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              En attente
                            </span>
                          )}
                          {isExcused && (
                            <span className="px-2 py-1 rounded-lg bg-violet-500/10 text-violet-400 text-xs">
                              Excuse
                            </span>
                          )}
                        </div>
                        {isExcused && tranche.excuseReason && (
                          <div className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                            {tranche.excuseReason}
                          </div>
                        )}
                        {isExcused && tranche.excuseApproved === null && (
                          <div className="text-xs text-amber-400 mt-1">En attente d'approbation</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <button
                              onClick={() => handleMarkAsPaid(tranche)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm hover:bg-emerald-500/20 transition"
                            >
                              Marquer payé
                            </button>
                          )}
                          {isExcused && tranche.excuseApproved === null && (
                            <>
                              <button
                                onClick={() => handleApproveExcuse(tranche.id, true)}
                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                                title="Approuver l'excuse"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleApproveExcuse(tranche.id, false)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                                title="Refuser l'excuse"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-500/10 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Aucune tranche de paiement</h3>
          <p className="text-slate-400">
            {searchTerm || filterStatus !== 'all' 
              ? 'Aucune tranche ne correspond aux filtres sélectionnés.'
              : 'Aucune tranche de paiement n\'a été configurée pour cette formation.'}
          </p>
        </div>
      )}
    </div>
  );
}

