'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { swal } from '@/lib/swal';

interface DeleteTrainingSessionButtonProps {
  trainingSessionId: string;
}

export default function DeleteTrainingSessionButton({ trainingSessionId }: DeleteTrainingSessionButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const result = await swal.delete(
      'Êtes-vous sûr ?',
      'Supprimer cette formation et toutes ses données (modules, cours, inscriptions) ? Cette action est irréversible.'
    );

    if (!result.isConfirmed) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/training-sessions/${trainingSessionId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await swal.success('Supprimé !', 'La formation a été supprimée avec succès.');
        router.refresh();
      } else {
        const data = await res.json();
        await swal.error('Erreur', data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting training session:', error);
      await swal.error('Erreur', 'Une erreur est survenue lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50"
      title="Supprimer la formation"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

