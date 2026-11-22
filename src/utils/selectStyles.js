export function getSelectStyles(isDark) {
  return {
    control: (base, state) => ({
      ...base,
      borderRadius: '0.25rem',
      borderColor: isDark ? '#52525b' : '#000000',
      backgroundColor: isDark ? '#27272a' : '#ffffff',
      paddingTop: '0.175rem',
      paddingBottom: '0.175rem',
      boxShadow: state.isFocused ? '0 0 0 2px #71717a' : 'none',
      '&:hover': { borderColor: isDark ? '#71717a' : '#000000' },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0.175rem 0.75rem',
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDark ? '#27272a' : '#ffffff',
      border: `1px solid ${isDark ? '#52525b' : '#e4e4e7'}`,
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? isDark ? '#3f3f46' : '#fafafa'
        : isDark ? '#27272a' : '#ffffff',
      color: isDark ? '#f4f4f5' : '#18181b',
      cursor: 'default',
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? '#f4f4f5' : '#18181b',
    }),
    input: (base) => ({
      ...base,
      color: isDark ? '#f4f4f5' : '#18181b',
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? '#a1a1aa' : '#71717a',
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: isDark ? '#3f3f46' : '#e4e4e7',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: isDark ? '#f4f4f5' : '#18181b',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: isDark ? '#a1a1aa' : '#71717a',
      ':hover': {
        backgroundColor: isDark ? '#52525b' : '#d4d4d8',
        color: isDark ? '#f4f4f5' : '#18181b',
      },
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: isDark ? '#52525b' : '#e4e4e7',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: isDark ? '#a1a1aa' : '#71717a',
      ':hover': { color: isDark ? '#f4f4f5' : '#18181b' },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: isDark ? '#a1a1aa' : '#71717a',
      ':hover': { color: isDark ? '#f4f4f5' : '#18181b' },
    }),
  };
}
