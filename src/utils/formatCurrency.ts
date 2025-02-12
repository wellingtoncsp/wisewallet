import { useCurrency } from '../contexts/CurrencyContext';

export const useFormatCurrency = () => {
  const { currency, currencySymbol } = useCurrency();
  
  return (value: number) => {
    return `${currencySymbol} ${value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };
}; 