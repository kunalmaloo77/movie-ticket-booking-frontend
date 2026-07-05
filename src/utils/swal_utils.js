import MySwal from './swal';

const isDark = () => document.documentElement.classList.contains('dark');

const themed = (opts) => ({
  background: isDark() ? '#111827' : '#ffffff',
  color: isDark() ? '#f3f4f6' : '#111827',
  confirmButton: isDark() ? 'swal-confirm-btn-dark' : 'swal-confirm-btn-light',
  ...opts,
});

export function showSuccess(message, title = 'Success') {
  return MySwal.fire(
    themed({
      icon: 'success',
      title: <i>{title}</i>,
      text: message,
      timer: 2500,
      timerProgressBar: true,
    })
  );
}

export async function showConfirm(
  message,
  { title = 'Are you sure?', confirmText = 'Confirm', danger = false } = {}
) {
  const result = await MySwal.fire(
    themed({
      icon: 'warning',
      title: <i>{title}</i>,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      confirmButtonColor: danger ? '#dc2626' : undefined,
    })
  );
  return result.isConfirmed;
}

export function showError(message, title = 'Something went wrong') {
  return MySwal.fire(
    themed({
      icon: 'error',
      title: <i>{title}</i>,
      text: message || 'Please try again.',
    })
  );
}
