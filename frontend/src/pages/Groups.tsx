import React, { useState, useEffect } from 'react';
import { RefreshCw, Search, Users, CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api';

interface Group {
  id: string;
  grupo_id_zapi: string;
  nome: string;
  foto_url: string | null;
  total_participantes: number;
  ativo: boolean;
  sincronizado_em: string;
}

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/grupos', {
        params: { search }
      });
      setGroups(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await api.post('/grupos/sincronizar');
      await fetchGroups();
      alert('Grupos sincronizados com sucesso!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao sincronizar grupos. Verifique as credenciais da Z-API.');
    } finally {
      setSyncing(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.patch(`/grupos/${id}/status`, { ativo: !currentStatus });
      setGroups(groups.map(g => g.id === id ? { ...g, ativo: !currentStatus } : g));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Grupos</h1>
          <p className="text-sm text-gray-500">Gerencie os grupos do WhatsApp sincronizados via Z-API</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing}
          className={`bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors ${syncing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Grupos'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar grupos por nome..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchGroups()}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button 
            onClick={fetchGroups}
            className="bg-white border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
          >
            Filtrar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-gray-600 text-sm uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Grupo</th>
                <th className="px-6 py-4">Participantes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Última Sincronia</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando grupos...</td></tr>
              ) : groups.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhum grupo encontrado. Clique em sincronizar.</td></tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {group.foto_url ? (
                          <img src={group.foto_url} alt={group.nome} className="w-10 h-10 rounded-full object-cover border" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Users size={20} />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{group.nome}</p>
                          <p className="text-xs text-gray-400 font-mono">{group.grupo_id_zapi}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {group.total_participantes} membros
                    </td>
                    <td className="px-6 py-4">
                      {group.ativo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 size={12} /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle size={12} /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(group.sincronizado_em).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => toggleStatus(group.id, group.ativo)}
                        className={`text-sm font-medium ${group.ativo ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {group.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Groups;
