import { useFormatCurrency } from '../utils/formatCurrency';

export const SomeComponent = () => {
  const formatCurrency = useFormatCurrency();
  
  return (
    <div>
      <span>{formatCurrency(amount)}</span>
    </div>
  );
}; 