'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { swal } from '@/lib/swal';

interface DeleteClassroomButtonProps {
  classroomId: string;
}

export default function DeleteClassroomButton({ classroomId }: DeleteClassroomButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const result = await swal.delete(
      'Êtes-vous sûr ?',
      'Supprimer ce cours et toutes ses données ?'
    );

    if (!result.isConfirmed) {
      return;
    }

    setDeleting(true);
    try {
      const formData = new FormData();
      formData.append('classroomId', classroomId);

      const res = await fetch('/api/classrooms/delete', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        await swal.success('Supprimé !', 'Le cours a été supprimé avec succès.');
        router.refresh();
      } else {
        const data = await res.json();
        await swal.error('Erreur', data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting classroom:', error);
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
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

