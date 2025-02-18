export const transactionCategories = [
  { id: 'food', label: 'Alimentação' },
  { id: 'housing', label: 'Moradia' },
  { id: 'transport', label: 'Transporte' },
  { id: 'health', label: 'Saúde' },
  { id: 'education', label: 'Educação' },
  { id: 'leisure', label: 'Lazer' },
  { id: 'shopping', label: 'Compras' },
  { id: 'bills', label: 'Contas' },
  { id: 'salary', label: 'Salário' },
  { id: 'investments', label: 'Investimentos' },
  { id: 'others', label: 'Outros' }
];

// Função auxiliar para obter o label da categoria
export const getCategoryLabel = (categoryId: string): string => {
  const category = transactionCategories.find(cat => cat.id === categoryId);
  return category?.label || categoryId;
};