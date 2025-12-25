import Swal from 'sweetalert2';

const swalConfig = {
  background: '#0a0f1a',
  color: '#e2e8f0',
  customClass: {
    popup: 'glass border border-white/10',
    title: 'text-white',
    htmlContainer: 'text-slate-300',
    confirmButton: 'bg-cyan-500 hover:bg-cyan-600',
    cancelButton: 'bg-slate-500 hover:bg-slate-600'
  }
};

export const swal = {
  success: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#06b6d4',
      ...swalConfig
    });
  },

  error: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#ef4444',
      ...swalConfig,
      customClass: {
        ...swalConfig.customClass,
        confirmButton: 'bg-red-500 hover:bg-red-600'
      }
    });
  },

  warning: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonColor: '#f59e0b',
      ...swalConfig,
      customClass: {
        ...swalConfig.customClass,
        confirmButton: 'bg-amber-500 hover:bg-amber-600'
      }
    });
  },

  confirm: (title: string, text?: string, confirmText = 'Oui, continuer', cancelText = 'Annuler') => {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      ...swalConfig,
      customClass: {
        ...swalConfig.customClass,
        confirmButton: 'bg-red-500 hover:bg-red-600',
        cancelButton: 'bg-slate-500 hover:bg-slate-600'
      }
    });
  },

  delete: (title: string, text?: string) => {
    return Swal.fire({
      title,
      text: text || 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      ...swalConfig,
      customClass: {
        ...swalConfig.customClass,
        confirmButton: 'bg-red-500 hover:bg-red-600',
        cancelButton: 'bg-slate-500 hover:bg-slate-600'
      }
    });
  }
};

