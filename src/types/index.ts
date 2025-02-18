export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  date: Date;
  description: string;
  category: string;
  userId: string;
  walletId: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  userId: string;
  walletId: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline: Date;
  priority: number;
  userId: string;
  walletId: string;
  completed?: boolean;
} 