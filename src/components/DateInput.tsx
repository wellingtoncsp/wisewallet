import React, { InputHTMLAttributes } from 'react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const DateInput: React.FC<DateInputProps> = ({ value, onChange, ...props }) => {
  const date = value ? parse(value, 'yyyy-MM-dd', new Date()) : null;

  const handleChange = (date: Date | null) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    }
  };

  return (
    <ReactDatePicker
      selected={date}
      onChange={handleChange}
      dateFormat="dd/MM/yyyy"
      locale={ptBR}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      placeholderText="Selecione uma data"
      {...props}
    />
  );
}; 