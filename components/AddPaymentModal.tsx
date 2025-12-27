'use client';

import { useState } from 'react';
import { X, Plus, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatMoney } from '@/lib/currency';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: string;
    studentId: string;
    classroomId: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    classroom?: { title: string };
    student?: { name: string };
  };
  onSuccess?: () => void;
}

export default function AddPaymentModal({
  isOpen,
  onClose,
  payment,
  onSuccess
}: AddPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    method: 'CASH' as 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'OTHER',
    reference: '',
    receivedBy: '',
    notes: '',
    expectedAmount: '', // Montant attendu (optionnel)
    hasExcuse: false,
    excuseReason: ''
  });

  const remainingAmount = payment.totalAmount - payment.paidAmount;
  const maxAmount = remainingAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount);
      
      if (!amount || amount <= 0) {
        setError('Le montant doit être supérieur à 0');
        setLoading(false);
        return;
      }

      if (amount > maxAmount) {
        setError(`Le montant ne peut pas dépasser ${formatMoney(maxAmount)}`);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          amount: amount,
          method: formData.method,
          reference: formData.reference || undefined,
          receivedBy: formData.receivedBy || undefined,
          notes: formData.notes || undefined,
          expectedAmount: formData.expectedAmount ? parseFloat(formData.expectedAmount) : undefined,
          hasExcuse: formData.hasExcuse,
          excuseReason: formData.hasExcuse ? formData.excuseReason : undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajout du paiement');
      }

      setSuccess(true);
      
      // Reset form
      setFormData({
        amount: '',
        method: 'CASH',
        reference: '',
        receivedBy: '',
        notes: '',
        expectedAmount: '',
        hasExcuse: false,
        excuseReason: ''
      });

      // Callback après 1.5s pour laisser voir le message de succès
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setSuccess(false);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout du paiement');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-cyan-500/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Ajouter un Paiement
            </h2>
            <p className="text-sm text-slate-400">
              {payment.classroom?.title || 'Cours'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Info */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 mb-1">Montant total</p>
              <p className="text-white font-semibold">{formatMoney(payment.totalAmount)}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Déjà payé</p>
              <p className="text-emerald-400 font-semibold">{formatMoney(payment.paidAmount)}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Reste à payer</p>
              <p className="text-amber-400 font-semibold">{formatMoney(remainingAmount)}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Statut</p>
              <p className={`font-semibold ${
                payment.status === 'COMPLETED' ? 'text-emerald-400' :
                payment.status === 'PARTIAL' ? 'text-amber-400' :
                'text-slate-400'
              }`}>
                {payment.status === 'COMPLETED' ? 'Complet' :
                 payment.status === 'PARTIAL' ? 'Partiel' : 'En attente'}
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-emerald-400">Paiement ajouté avec succès !</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Montant <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxAmount}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder={`Max: ${formatMoney(maxAmount)}`}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
                disabled={loading || success}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                Max: {formatMoney(maxAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Méthode de paiement <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              required
              disabled={loading || success}
            >
              <option value="CASH">Espèces</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="BANK_TRANSFER">Virement bancaire</option>
              <option value="OTHER">Autre</option>
            </select>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Référence (optionnel)
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Numéro de transaction, référence..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={loading || success}
            />
          </div>

          {/* Received By */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Reçu par (optionnel)
            </label>
            <input
              type="text"
              value={formData.receivedBy}
              onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
              placeholder="Nom de la personne qui a reçu le paiement"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={loading || success}
            />
          </div>

          {/* Expected Amount (for excuse system) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Montant attendu (optionnel)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.expectedAmount}
              onChange={(e) => setFormData({ ...formData, expectedAmount: e.target.value })}
              placeholder="Si différent du montant payé"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={loading || success}
            />
            <p className="text-xs text-slate-500 mt-1">
              Utilisé pour le système d'excuse si le paiement est partiel
            </p>
          </div>

          {/* Has Excuse */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasExcuse"
              checked={formData.hasExcuse}
              onChange={(e) => setFormData({ ...formData, hasExcuse: e.target.checked })}
              className="w-4 h-4 rounded bg-white/5 border-white/10 text-cyan-500 focus:ring-cyan-500"
              disabled={loading || success}
            />
            <label htmlFor="hasExcuse" className="text-sm text-slate-300">
              Paiement partiel avec excuse
            </label>
          </div>

          {/* Excuse Reason */}
          {formData.hasExcuse && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Raison de l'excuse <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.excuseReason}
                onChange={(e) => setFormData({ ...formData, excuseReason: e.target.value })}
                placeholder="Expliquez pourquoi le paiement est partiel..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                required={formData.hasExcuse}
                disabled={loading || success}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notes supplémentaires..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              disabled={loading || success}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || success}
              className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold hover:from-cyan-600 hover:to-violet-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ajout en cours...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Ajouté !
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Ajouter le paiement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

