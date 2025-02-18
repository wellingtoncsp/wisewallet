import React, { InputHTMLAttributes } from 'react';
import { darkModeClasses as dm } from '../styles/darkMode';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input: React.FC<InputProps> = (props) => (
  <input
    className={`w-full rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 ${dm.input}`}
    {...props}
  />
); 