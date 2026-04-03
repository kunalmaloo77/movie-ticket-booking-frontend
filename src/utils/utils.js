export const formatDateTime = (dateTimeStr) => {
  const date = new Date(dateTimeStr);
  if (isNaN(date)) return 'Invalid date';

  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
