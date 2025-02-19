import { useState } from 'react';
import { useAlerts } from '../contexts/AlertContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertType, Alert } from '../types/alert';

const ALERT_TYPES: Record<AlertType, { label: string; color: string }> = {
  budget_exceeded: { label: 'Orçamento Excedido', color: 'red' },
  budget_warning: { label: 'Alerta de Orçamento', color: 'yellow' },
  goal_milestone: { label: 'Marco de Meta', color: 'green' },
  goal_achieved: { label: 'Meta Alcançada', color: 'green' },
  share_invite: { label: 'Convite Compartilhado', color: 'blue' },
  saving_tip: { label: 'Dica de Economia', color: 'blue' },
  spending_pattern: { label: 'Padrão de Gastos', color: 'purple' },
  saving_streak: { label: 'Sequência de Economia', color: 'green' },
  transaction_large: { label: 'Transação Grande', color: 'yellow' },
  monthly_summary: { label: 'Resumo Mensal', color: 'blue' }
};

export default function Notifications() {
  const { alerts, markAllAsRead, markAsRead } = useAlerts();
  const [selectedType, setSelectedType] = useState<AlertType | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filteredAlerts = alerts.filter(alert => {
    if (showUnreadOnly && alert.read) return false;
    if (selectedType !== 'all' && alert.type !== selectedType) return false;
    return true;
  });

  const handleAlertClick = async (alert: Alert) => {
    if (!alert.read) {
      await markAsRead(alert.id);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Centro de Notificações</h1>
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Marcar todas como lidas
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2 rounded-full ${
              selectedType === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'
            }`}
          >
            Todas
          </button>
          {Object.entries(ALERT_TYPES).map(([type, { label, color }]) => (
            <button
              key={type}
              onClick={() => setSelectedType(type as AlertType)}
              className={`px-4 py-2 rounded-full ${
                selectedType === type ? `bg-${color}-100 text-${color}-700` : 'bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-gray-700">Mostrar apenas não lidas</span>
          </label>
        </div>

        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma notificação encontrada
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  !alert.read ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100'
                } hover:bg-gray-50`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                    <span className="text-xl">{alert.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm px-2 py-1 rounded-full bg-${ALERT_TYPES[alert.type].color}-100 text-${ALERT_TYPES[alert.type].color}-700`}>
                        {ALERT_TYPES[alert.type].label}
                      </span>
                      {!alert.read && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                          Novo
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 mt-1">{alert.title}</h3>
                    <p className="text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {format(alert.createdAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 