export type AlertType = 
  | 'share_invite'      // Convites de compartilhamento
  | 'saving_tip'        // Sugestões de economia
  | 'budget_warning'    // Orçamento próximo do limite
  | 'budget_exceeded'   // Orçamento ultrapassado
  | 'goal_milestone'    // Meta parcial alcançada
  | 'goal_achieved'     // Meta totalmente alcançada
  | 'spending_pattern'  // Padrões de gastos identificados
  | 'saving_streak'     // Sequência de economia
  | 'transaction_large' // Transação grande detectada
  | 'monthly_summary';  // Resumo mensal

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  icon?: string;
  createdAt: Date;
  read: boolean;
  walletId: string;
  data?: any;
} 