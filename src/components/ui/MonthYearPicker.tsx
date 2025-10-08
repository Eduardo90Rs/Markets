import React from 'react';
import { Calendar } from 'lucide-react';

interface MonthYearPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  label = 'Período',
}) => {
  const currentYear = value.getFullYear();
  const currentMonth = value.getMonth();

  // Gerar anos de 2020 até 2099
  const years = Array.from({ length: 80 }, (_, i) => 2020 + i);

  const months = [
    { value: 0, label: 'Janeiro' },
    { value: 1, label: 'Fevereiro' },
    { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Maio' },
    { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' },
    { value: 10, label: 'Novembro' },
    { value: 11, label: 'Dezembro' },
  ];

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    const newDate = new Date(newYear, currentMonth, 1);
    onChange(newDate);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    const newDate = new Date(currentYear, newMonth, 1);
    onChange(newDate);
  };

  return (
    <div className="flex items-center gap-3">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}:
        </label>
      )}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-400" />

        {/* Select de Mês */}
        <select
          value={currentMonth}
          onChange={handleMonthChange}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
        >
          {months.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>

        {/* Select de Ano */}
        <select
          value={currentYear}
          onChange={handleYearChange}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none cursor-pointer"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
