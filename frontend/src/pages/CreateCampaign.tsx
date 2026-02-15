import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Search, Check, Users, MessageSquare, Clock, PlusCircle, Trash2 } from 'lucide-react';
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

  // Novo estado para criação de mensagem integrada
  const [createMsgMode, setCreateMsgMode] = useState<'select' | 'new'>('select');
  const [newMessages, setNewMessages] = useState<Array<{ titulo: string, conteudo: string, file: File | null }>>([
    { titulo: '', conteudo: '', file: null }
  ]);

  const [formData, setFormData] = useState({
    nome: '',
    mensagem_id: '',
    mensagens_ids: [] as string[],
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
        mensagem_id: campaign.mensagem_id || '',
        mensagens_ids: campaign.campanhas_mensagens?.map((cm: any) => cm.mensagem_id) || (campaign.mensagem_id ? [campaign.mensagem_id] : []),
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

    if (createMsgMode === 'select' && formData.mensagens_ids.length === 0) {
      alert('Selecione pelo menos uma mensagem salva ou crie uma nova.');
      return;
    }

    if (createMsgMode === 'new') {
      const emptyMsg = newMessages.find(m => !m.titulo);
      if (emptyMsg) {
        alert('Dê um título para todas as novas mensagens.');
        return;
      }
    }

    try {
      setLoading(true);
      
      const submitData = new FormData();
      submitData.append('nome', formData.nome);
      submitData.append('grupos_ids', JSON.stringify(formData.grupos_ids));
      submitData.append('intervalo_segundos', String(formData.intervalo_segundos));
      submitData.append('tipo_disparo', formData.tipo_disparo);
      if (formData.agendada_para) submitData.append('agendada_para', formData.agendada_para);

      if (createMsgMode === 'new') {
        submitData.append('criar_nova_mensagem', 'true');
        // Envia as mensagens como JSON (exceto os arquivos)
        const msgsMeta = newMessages.map(m => ({ titulo: m.titulo, conteudo: m.conteudo }));
        submitData.append('novas_mensagens', JSON.stringify(msgsMeta));
        
        // Envia os arquivos separadamente com uma convenção de nomes
        newMessages.forEach((m, idx) => {
          if (m.file) {
            submitData.append(`file_${idx}`, m.file);
          }
        });

        // Se houver outras mensagens selecionadas além da nova
        if (formData.mensagens_ids.length > 0) {
          submitData.append('mensagens_ids', JSON.stringify(formData.mensagens_ids));
        }
      } else {
        submitData.append('mensagens_ids', JSON.stringify(formData.mensagens_ids));
      }

      if (isEditing) {
        await api.put(`/campanhas/${id}`, submitData);
      } else {
        await api.post('/campanhas', submitData);
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
      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={() => navigate(-1)} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="sm:size-6" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            {isEditing ? 'Editar Campanha' : 'Nova Campanha'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
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

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Mensagens do Disparo</label>
                  <p className="text-[10px] text-gray-400">Adicione até 3 mensagens para rodízio (Anti-ban)</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setCreateMsgMode('select')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${createMsgMode === 'select' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Selecionar Salvas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMsgMode('new')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${createMsgMode === 'new' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Criar Nova
                  </button>
                </div>
              </div>

              {createMsgMode === 'select' ? (
                <div className="space-y-3">
                  {formData.mensagens_ids.map((selectedId, index) => (
                    <div key={index} className="flex gap-2">
                      <select 
                        required={createMsgMode === 'select'}
                        className="flex-1 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={selectedId}
                        onChange={e => {
                          const newIds = [...formData.mensagens_ids];
                          newIds[index] = e.target.value;
                          setFormData({...formData, mensagens_ids: newIds});
                        }}
                      >
                        <option value="">Selecione uma mensagem...</option>
                        {messages.map(msg => (
                          <option key={msg.id} value={msg.id} disabled={formData.mensagens_ids.includes(msg.id) && msg.id !== selectedId}>
                            {msg.titulo}
                          </option>
                        ))}
                      </select>
                      <button 
                        type="button"
                        onClick={() => {
                          const newIds = formData.mensagens_ids.filter((_, i) => i !== index);
                          setFormData({...formData, mensagens_ids: newIds});
                        }}
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  
                  {formData.mensagens_ids.length < 3 && (
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, mensagens_ids: [...formData.mensagens_ids, '']})}
                      className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <PlusCircle size={18} />
                      Adicionar Slot de Mensagem
                    </button>
                  )}
                  
                  {formData.mensagens_ids.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      Nenhuma mensagem selecionada. Clique no botão acima para adicionar.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {newMessages.map((msg, idx) => (
                    <div key={idx} className="space-y-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 relative">
                      {newMessages.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => setNewMessages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase">Título da Mensagem {idx + 1}</label>
                        <input 
                          type="text"
                          placeholder="Identificação interna da mensagem"
                          className="w-full p-2 border rounded-md text-sm outline-none focus:border-blue-500"
                          value={msg.titulo}
                          onChange={e => {
                            const newMsgs = [...newMessages];
                            newMsgs[idx].titulo = e.target.value;
                            setNewMessages(newMsgs);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase">Conteúdo (Texto)</label>
                        <textarea 
                          placeholder="Texto que será enviado no WhatsApp..."
                          rows={4}
                          className="w-full p-2 border rounded-md text-sm outline-none focus:border-blue-500 resize-none"
                          value={msg.conteudo}
                          onChange={e => {
                            const newMsgs = [...newMessages];
                            newMsgs[idx].conteudo = e.target.value;
                            setNewMessages(newMsgs);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600 uppercase">Anexo (Opcional)</label>
                        <input 
                          type="file"
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          onChange={e => {
                            const newMsgs = [...newMessages];
                            newMsgs[idx].file = e.target.files?.[0] || null;
                            setNewMessages(newMsgs);
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {newMessages.length < 3 && (
                    <button 
                      type="button"
                      onClick={() => setNewMessages(prev => [...prev, { titulo: '', conteudo: '', file: null }])}
                      className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <PlusCircle size={18} />
                      Adicionar Outra Mensagem Nova
                    </button>
                  )}

                  {formData.mensagens_ids.length > 0 && (
                    <div className="p-2 bg-blue-50 rounded border border-blue-100">
                      <p className="text-[11px] text-blue-700">
                        <Check size={12} className="inline mr-1" />
                        Estas novas mensagens serão adicionadas às <strong>{formData.mensagens_ids.length}</strong> mensagens já selecionadas.
                      </p>
                    </div>
                  )}
                </div>
              )}
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
