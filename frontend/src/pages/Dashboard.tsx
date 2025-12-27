import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Send, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardData {
  stats: {
    totalMensagens: number;
    totalGrupos: number;
    campanhasAtivas: number;
    campanhasConcluidas: number;
  };
  atividadesRecentes: any[];
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setData(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  const stats = [
    { label: 'Total de Mensagens', value: data?.stats.totalMensagens || 0, icon: <MessageSquare className="text-blue-600" />, color: 'bg-blue-50' },
    { label: 'Grupos Sincronizados', value: data?.stats.totalGrupos || 0, icon: <Users className="text-green-600" />, color: 'bg-green-50' },
    { label: 'Campanhas Ativas', value: data?.stats.campanhasAtivas || 0, icon: <Send className="text-purple-600" />, color: 'bg-purple-50' },
    { label: 'Envios Concluídos', value: data?.stats.campanhasConcluidas || 0, icon: <CheckCircle className="text-orange-600" />, color: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Atividade Recente</h3>
        {data?.atividadesRecentes && data.atividadesRecentes.length > 0 ? (
          <div className="space-y-4">
            {data.atividadesRecentes.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'concluida' ? 'bg-green-500' : 
                    item.status === 'em_andamento' ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-800">{item.nome}</p>
                    <p className="text-xs text-gray-500">Mensagem: {item.mensagem?.titulo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700 capitalize">{item.status}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                    <Clock size={12} />
                    {format(new Date(item.atualizado_em), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Nenhuma atividade registrada ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
