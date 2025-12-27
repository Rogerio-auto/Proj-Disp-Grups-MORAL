import React, { useState, useEffect } from 'react';
import { Lock, Shield, Smartphone, Globe, Save } from 'lucide-react';
import api from '../services/api';

const Settings: React.FC = () => {
  const [zapiSettings, setZapiSettings] = useState<any>(null);
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      setZapiSettings(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    try {
      await api.post('/settings/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      alert('Senha atualizada com sucesso!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao atualizar senha.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
        <p className="text-sm text-gray-500">Gerencie sua conta e integrações do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar de Navegação Interna */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium">
            <Shield size={18} /> Segurança
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
            <Smartphone size={18} /> Z-API
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Alterar Senha */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Lock size={20} className="text-blue-600" />
                Alterar Senha de Acesso
              </h2>
            </div>
            <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Senha Atual</label>
                <input 
                  type="password" 
                  required
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={passwords.currentPassword}
                  onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nova Senha</label>
                  <input 
                    type="password" 
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={passwords.newPassword}
                    onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={passwords.confirmPassword}
                    onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save size={18} /> Atualizar Senha
                </button>
              </div>
            </form>
          </div>

          {/* Configurações Z-API (Somente Leitura por enquanto) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Smartphone size={20} className="text-blue-600" />
                Integração Z-API
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase">Instance ID</p>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded border">{zapiSettings?.zapi_instance_id || '...'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium uppercase">Base URL</p>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded border">{zapiSettings?.zapi_base_url || '...'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium uppercase">Token</p>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded border">{zapiSettings?.zapi_token || '...'}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
                <Globe className="text-blue-600 shrink-0" size={20} />
                <p className="text-xs text-blue-700 leading-relaxed">
                  As credenciais da Z-API são gerenciadas via variáveis de ambiente (.env) para maior segurança. 
                  Para alterá-las, entre em contato com o administrador do servidor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
