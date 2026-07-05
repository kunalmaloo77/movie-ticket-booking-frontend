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

export const formatDateToMMDDYYYY = (d) => {
  // mm-dd-yyyy
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
};

export const formatDateToDDMMYYYY = (d) => {
  // mm-dd-yyyy
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars except space & hyphen
    .trim()
    .replace(/\s+/g, '-') // replace spaces with hyphen
    .replace(/-+/g, '-'); // collapse multiple hyphens
}

export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          console.error('Error in debounced function:', error);
          resolve([]); // Resolve with an empty array on error
        }
      }, delay);
    });
  };
}
