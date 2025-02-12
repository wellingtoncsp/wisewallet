import React, { InputHTMLAttributes } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

interface CurrencyInputProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, ...props }) => {
  const { currencySymbol } = useCurrency();
  
  return (
    <div className="relative mt-1">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
        {currencySymbol}
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        {...props}
      />
    </div>
  );
}; 