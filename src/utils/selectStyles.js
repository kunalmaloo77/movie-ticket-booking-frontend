export function getSelectStyles(isDark) {
  return {
    control: (base, state) => ({
      ...base,
      borderRadius: '0.25rem',
      borderColor: isDark ? '#4b5563' : '#000000',
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      paddingTop: '0.175rem',
      paddingBottom: '0.175rem',
      boxShadow: state.isFocused ? '0 0 0 2px #6b7280' : 'none',
      '&:hover': { borderColor: isDark ? '#6b7280' : '#000000' },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0.175rem 0.75rem',
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? isDark ? '#374151' : '#f9fafb'
        : isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#f3f4f6' : '#111827',
      cursor: 'default',
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#f3f4f6' : '#111827',
    }),
    input: (base) => ({
      ...base,
      color: isDark ? '#f3f4f6' : '#111827',
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? '#9ca3af' : '#6b7280',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDark ? '#374151' : '#e5e7eb',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDark ? '#f3f4f6' : '#111827',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isDark ? '#9ca3af' : '#6b7280',
      ':hover': {
        backgroundColor: isDark ? '#4b5563' : '#d1d5db',
        color: isDark ? '#f3f4f6' : '#111827',
      },
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: isDark ? '#9ca3af' : '#6b7280',
      ':hover': { color: isDark ? '#f3f4f6' : '#111827' },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: isDark ? '#9ca3af' : '#6b7280',
      ':hover': { color: isDark ? '#f3f4f6' : '#111827' },
    }),
  };
}
