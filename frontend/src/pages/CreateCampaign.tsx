import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Search, Check, Users, MessageSquare, Clock } from 'lucide-react';
import api from '../services/api';

interface Message {
  id: string;
  titulo: string;
}

interface Group {
  id: string;
  nome: string;
  total_participantes: number;
  ativo: boolean;
}

const CreateCampaign: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchGroup, setSearchGroup] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    mensagem_id: '',
    grupos_ids: [] as string[],
    intervalo_segundos: 30,
    tipo_disparo: 'imediato',
    agendada_para: '',
  });

  useEffect(() => {
    fetchInitialData();
    if (isEditing) {
      fetchCampaignData();
    }
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const [msgRes, grpRes] = await Promise.all([
        api.get('/mensagens'),
        api.get('/grupos', { params: { ativo: true } })
      ]);
      setMessages(msgRes.data.data);
      setGroups(grpRes.data.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const fetchCampaignData = async () => {
    try {
      const response = await api.get(`/campanhas/${id}`);
      const campaign = response.data.data;
      setFormData({
        nome: campaign.nome,
        mensagem_id: campaign.mensagem_id,
        grupos_ids: campaign.campanhas_grupos.map((cg: any) => cg.grupo_id),
        intervalo_segundos: campaign.intervalo_segundos,
        tipo_disparo: campaign.tipo_disparo,
        agendada_para: campaign.agendada_para ? campaign.agendada_para.substring(0, 16) : '',
      });
    } catch (error) {
      console.error('Erro ao carregar campanha:', error);
      alert('Erro ao carregar dados da campanha.');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.grupos_ids.length === 0) {
      alert('Selecione pelo menos um grupo.');
      return;
    }

    try {
      setLoading(true);
      if (isEditing) {
        await api.put(`/campanhas/${id}`, formData);
      } else {
        await api.post('/campanhas', formData);
      }
      navigate('/campanhas');
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      alert('Erro ao salvar campanha.');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (id: string) => {
    setFormData(prev => ({
      ...prev,
      grupos_ids: prev.grupos_ids.includes(id)
        ? prev.grupos_ids.filter(gid => gid !== id)
        : [...prev.grupos_ids, id]
    }));
  };

  const selectAllGroups = () => {
    const filteredGroups = groups
      .filter(g => g.nome.toLowerCase().includes(searchGroup.toLowerCase()))
      .map(g => g.id);
    
    setFormData(prev => ({
      ...prev,
      grupos_ids: Array.from(new Set([...prev.grupos_ids, ...filteredGroups]))
    }));
  };

  const filteredGroups = groups.filter(g => 
    g.nome.toLowerCase().includes(searchGroup.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Editar Campanha' : 'Nova Campanha'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEditing ? 'Atualize os dados da sua campanha' : 'Configure o disparo de mensagens para seus grupos'}
          </p>
        </div>
      </div>

      {fetching ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Configurações Básicas */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-600" />
              Informações Gerais
            </h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nome da Campanha</label>
              <input 
                type="text"
                required
                placeholder="Ex: Promoção de Natal 2025"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mensagem</label>
              <select 
                required
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.mensagem_id}
                onChange={e => setFormData({...formData, mensagem_id: e.target.value})}
              >
                <option value="">Selecione uma mensagem...</option>
                {messages.map(msg => (
                  <option key={msg.id} value={msg.id}>{msg.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Seleção de Grupos */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                Selecionar Grupos ({formData.grupos_ids.length})
              </h2>
              <button 
                type="button"
                onClick={selectAllGroups}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                Selecionar Filtrados
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar grupos..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchGroup}
                onChange={e => setSearchGroup(e.target.value)}
              />
            </div>

            <div className="max-height-[400px] overflow-y-auto border rounded-lg divide-y">
              {filteredGroups.map(group => (
                <div 
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${formData.grupos_ids.includes(group.id) ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 border rounded flex items-center justify-center ${formData.grupos_ids.includes(group.id) ? 'bg-blue-600 border-blue-600' : 'bg-white'}`}>
                      {formData.grupos_ids.includes(group.id) && <Check size={14} className="text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{group.nome}</p>
                      <p className="text-xs text-gray-500">{group.total_participantes} participantes</p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredGroups.length === 0 && (
                <div className="p-8 text-center text-gray-500">Nenhum grupo encontrado.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Agendamento e Intervalo */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Configurações de Envio
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo de Disparo</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, tipo_disparo: 'imediato'})}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${formData.tipo_disparo === 'imediato' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Imediato
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, tipo_disparo: 'agendado'})}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${formData.tipo_disparo === 'agendado' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Agendado
                </button>
              </div>
            </div>

            {formData.tipo_disparo === 'agendado' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Data e Hora</label>
                <input 
                  type="datetime-local"
                  required
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.agendada_para}
                  onChange={e => setFormData({...formData, agendada_para: e.target.value})}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Intervalo entre Grupos (segundos)</label>
              <input 
                type="number"
                min="5"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.intervalo_segundos}
                onChange={e => setFormData({...formData, intervalo_segundos: parseInt(e.target.value)})}
              />
              <p className="text-[10px] text-gray-400 italic">Recomendado: 30-60 segundos para evitar bloqueios.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Salvando...' : isEditing ? 'Atualizar Campanha' : 'Criar Campanha'}
            </button>
          </div>
        </div>
      </form>
      )}
    </div>
  );
};

export default CreateCampaign;
