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

export function showBulkResultSummary(result, title = 'Bulk show creation finished') {
  const { created_count, failed_count, total_requested, results } = result;
  const failedItems = results.filter((item) => item.status === 'FAILED');

  return MySwal.fire(
    themed({
      icon: failed_count === 0 ? 'success' : created_count === 0 ? 'error' : 'warning',
      title: <i>{title}</i>,
      html: (
        <div className="text-left">
          <p>
            {created_count} of {total_requested} shows created.
          </p>
          {failedItems.length > 0 && (
            <div className="mt-3 max-h-56 overflow-y-auto text-sm">
              <p className="font-medium">Skipped shows:</p>
              <ul className="mt-1 space-y-1">
                {failedItems.map((item) => (
                  <li key={item.start_time}>
                    {item.start_time} — {item.error.code}: {item.error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
      confirmButtonText: 'OK',
    })
  );
}
