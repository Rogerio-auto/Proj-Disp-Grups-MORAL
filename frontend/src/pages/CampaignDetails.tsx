import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Users, CheckCircle2, Info, Edit, Trash2, PlayCircle } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CampaignDetail {
  id: string;
  nome: string;
  status: string;
  tipo_disparo: string;
  intervalo_segundos: number;
  agendada_para: string | null;
  criado_em: string;
  mensagem_id: string;
  mensagem: {
    titulo: string;
    conteudo: string;
  };
  campanhas_grupos: {
    id: string;
    status: string;
    erro_mensagem: string | null;
    enviado_em: string | null;
    grupo: {
      nome: string;
      grupo_id_zapi: string;
    };
  }[];
}

const CampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const response = await api.get(`/campanhas/${id}`);
      setCampaign(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      alert('Campanha não encontrada.');
      navigate('/campanhas');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setUpdating(true);
      await api.patch(`/campanhas/${id}/status`, { status: newStatus });
      await fetchDetails();
    } catch (error) {
      alert('Erro ao atualizar status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de campanha?')) return;
    try {
      await api.delete(`/campanhas/${id}`);
      navigate('/campanhas');
    } catch (error) {
      alert('Erro ao excluir campanha.');
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!campaign) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/campanhas')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{campaign.nome}</h1>
            <p className="text-sm text-gray-500">Gerenciamento do registro da campanha</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link 
            to={`/campanhas/editar/${campaign.id}`}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 border"
          >
            <Edit size={18} />
            <span className="text-sm font-medium">Editar</span>
          </Link>
          <button 
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 border border-red-100"
          >
            <Trash2 size={18} />
            <span className="text-sm font-medium">Excluir</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status e Ações Rápidas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">Status Atual:</div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                campaign.status === 'concluida' ? 'bg-green-100 text-green-700' :
                campaign.status === 'em_andamento' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {campaign.status}
              </span>
            </div>
            
            <div className="flex gap-2">
              {campaign.status === 'rascunho' && (
                <button 
                  onClick={() => handleStatusChange('em_andamento')}
                  disabled={updating}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                >
                  <PlayCircle size={18} />
                  Ativar Campanha
                </button>
              )}
              {campaign.status === 'em_andamento' && (
                <button 
                  onClick={() => handleStatusChange('concluida')}
                  disabled={updating}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={18} />
                  Marcar como Concluída
                </button>
              )}
              {(campaign.status === 'em_andamento' || campaign.status === 'concluida') && (
                <button 
                  onClick={() => handleStatusChange('rascunho')}
                  disabled={updating}
                  className="text-gray-600 border px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 disabled:opacity-50"
                >
                  Voltar para Rascunho
                </button>
              )}
            </div>
          </div>
          {/* Conteúdo da Mensagem */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-600" />
              Mensagem Selecionada
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-bold text-gray-800 mb-2">{campaign.mensagem.titulo}</h3>
              <div className="text-gray-600 whitespace-pre-wrap text-sm">
                {campaign.mensagem.conteudo}
              </div>
            </div>
          </div>

          {/* Lista de Grupos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Grupos Destinatários ({campaign.campanhas_grupos.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Nome do Grupo</th>
                    <th className="px-6 py-3">ID Z-API</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {campaign.campanhas_grupos.map((cg) => (
                    <tr key={cg.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{cg.grupo.nome}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{cg.grupo.grupo_id_zapi}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 uppercase">
                          {cg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar de Informações */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Info size={20} className="text-blue-600" />
              Configurações
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo:</span>
                <span className="font-medium capitalize">{campaign.tipo_disparo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Intervalo:</span>
                <span className="font-medium">{campaign.intervalo_segundos}s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Criada em:</span>
                <span className="font-medium">
                  {format(new Date(campaign.criado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>
              {campaign.agendada_para && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Agendada:</span>
                  <span className="font-medium text-blue-600">
                    {format(new Date(campaign.agendada_para), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="text-xs text-gray-400 italic">
                * Esta campanha está salva no banco de dados para fins de registro e gerenciamento.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
