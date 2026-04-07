import React from 'react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px',
  border: '1px solid var(--pb-border)', borderRadius: 'var(--pb-r)',
  fontFamily: "'DM Sans', sans-serif", fontSize: 13.5,
  color: 'var(--pb-text)', background: 'var(--pb-bg)', outline: 'none',
  transition: 'border-color .15s', appearance: 'none', cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%239a9a94' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};

interface MonthYearPickerProps {
  /** Value in "YYYY-MM" format */
  value: string;
  onChange: (value: string) => void;
}

export function MonthYearPicker({ value, onChange }: MonthYearPickerProps) {
  const [year, month] = value ? value.split('-') : ['', ''];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  const handleChange = (newYear: string, newMonth: string) => {
    if (newYear && newMonth) {
      onChange(`${newYear}-${newMonth}`);
    } else if (newYear || newMonth) {
      onChange(`${newYear || year || ''}-${newMonth || month || ''}`);
    } else {
      onChange('');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      <select
        value={month || ''}
        onChange={(e) => handleChange(year || '', e.target.value)}
        style={selectStyle}
      >
        <option value="">Month</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
        ))}
      </select>
      <select
        value={year || ''}
        onChange={(e) => handleChange(e.target.value, month || '')}
        style={selectStyle}
      >
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </select>
    </div>
  );
}
