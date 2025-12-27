import React, { useState, useEffect } from 'react';
import { Plus, Play, Clock, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Campaign {
  id: string;
  nome: string;
  status: 'rascunho' | 'agendada' | 'em_andamento' | 'concluida' | 'cancelada' | 'pausada';
  total_grupos: number;
  grupos_processados: number;
  agendada_para: string | null;
  criado_em: string;
  mensagem: {
    titulo: string;
  };
}

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campanhas');
      setCampaigns(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      rascunho: 'bg-gray-100 text-gray-600',
      agendada: 'bg-blue-100 text-blue-600',
      em_andamento: 'bg-yellow-100 text-yellow-600 animate-pulse',
      concluida: 'bg-green-100 text-green-600',
      cancelada: 'bg-red-100 text-red-600',
      pausada: 'bg-orange-100 text-orange-600',
    };
    
    const labels = {
      rascunho: 'Rascunho',
      agendada: 'Agendada',
      em_andamento: 'Enviando',
      concluida: 'Concluída',
      cancelada: 'Cancelada',
      pausada: 'Pausada',
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Campanhas</h1>
          <p className="text-sm text-gray-500">Gerencie e acompanhe seus disparos para grupos</p>
        </div>
        <Link 
          to="/campanhas/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nova Campanha
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-gray-300">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Nenhuma campanha criada</h3>
          <p className="text-gray-500 mt-1">Comece criando sua primeira campanha de disparos.</p>
          <Link 
            to="/campanhas/nova"
            className="mt-4 inline-flex items-center text-blue-600 font-medium hover:underline"
          >
            Criar campanha agora
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{campaign.nome}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Eye size={14} /> {campaign.mensagem.titulo}
                    </p>
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progresso</span>
                      <span>{campaign.grupos_processados} / {campaign.total_grupos} grupos</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${(campaign.grupos_processados / campaign.total_grupos) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {campaign.agendada_para 
                        ? format(new Date(campaign.agendada_para), "dd/MM 'às' HH:mm", { locale: ptBR })
                        : format(new Date(campaign.criado_em), "dd/MM/yyyy", { locale: ptBR })
                      }
                    </div>
                    <Link 
                      to={`/campanhas/${campaign.id}`}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Campaigns;
