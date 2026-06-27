import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const isDark = () => document.documentElement.classList.contains('dark');

const themed = (opts) => ({
  background: isDark() ? '#111827' : '#ffffff',
  color: isDark() ? '#f3f4f6' : '#111827',
  confirmButton: isDark()
    ? "swal-confirm-btn-dark"
    : "swal-confirm-btn-light",  ...opts,
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

export function showError(message, title = 'Something went wrong') {
  return MySwal.fire(
    themed({
      icon: 'error',
      title: <i>{title}</i>,
      text: message || 'Please try again.',
    })
  );
}

export default MySwal;
