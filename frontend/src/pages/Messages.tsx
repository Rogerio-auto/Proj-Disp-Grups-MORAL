import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, MessageSquare, Bold, Italic, Strikethrough, Code, Eye, Type, Paperclip, X, Music, Image as ImageIcon, FileText, Film } from 'lucide-react';
import api from '../services/api';

interface Message {
  id: string;
  titulo: string;
  conteudo: string;
  criado_em: string;
  tem_midia: boolean;
  midias?: {
    url: string;
    tipo: string;
    nome_arquivo: string;
  }[];
}

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Form state
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await api.get('/mensagens');
      setMessages(response.data.data);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview(null);
      }

      // Se for áudio, limpa o conteúdo pois áudio vai sozinho
      if (selectedFile.type.startsWith('audio/')) {
        setConteudo('');
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isAudio = file?.type.startsWith('audio/');

  const applyFormatting = (prefix: string, suffix: string = prefix) => {
    if (isAudio) return; // Não permite formatar se for áudio
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const newText = 
      text.substring(0, start) + 
      prefix + selectedText + suffix + 
      text.substring(end);

    setConteudo(newText);
    
    // Devolver o foco e ajustar a seleção
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  const formatWhatsAppPreview = (text: string) => {
    return text
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/~(.*?)~/g, '<del>$1</del>')
      .replace(/```(.*?)```/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('conteudo', isAudio ? '' : conteudo);
      if (file) {
        formData.append('file', file);
      }
      
      if (editingId) {
        await api.put(`/mensagens/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/mensagens', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchMessages();
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setConteudo('');
    setFile(null);
    setFilePreview(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (msg: Message) => {
    setEditingId(msg.id);
    setTitulo(msg.titulo);
    setConteudo(msg.conteudo);
    setFile(null);
    setFilePreview(null);
    if (msg.midias && msg.midias.length > 0) {
      const midia = msg.midias[0];
      if (midia.tipo === 'image') {
        setFilePreview(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${midia.url}`);
      }
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta mensagem?')) {
      try {
        await api.delete(`/mensagens/${id}`);
        fetchMessages();
      } catch (error) {
        console.error('Erro ao excluir mensagem:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Mensagens</h1>
        <button 
          onClick={() => {
            setEditingId(null);
            setTitulo('');
            setConteudo('');
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Nova Mensagem
        </button>
      </div>

      {/* Listagem */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar mensagens..." 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhuma mensagem encontrada.</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${msg.midias && msg.midias.length > 0 ? 'bg-gray-100' : 'bg-blue-50 text-blue-600'}`}>
                    {msg.midias && msg.midias.length > 0 ? (
                      msg.midias[0].tipo === 'image' ? <ImageIcon size={20} className="text-green-600" /> :
                      msg.midias[0].tipo === 'video' ? <Film size={20} className="text-purple-600" /> :
                      msg.midias[0].tipo === 'audio' ? <Music size={20} className="text-orange-600" /> :
                      <Paperclip size={20} className="text-blue-600" />
                    ) : (
                      <MessageSquare size={20} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{msg.titulo}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {msg.midias && msg.midias.length > 0 && (
                        <span className="text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded mr-2 uppercase">
                          {msg.midias[0].tipo}
                        </span>
                      )}
                      {msg.conteudo || (msg.midias && msg.midias.length > 0 ? 'Sem legenda' : 'Sem conteúdo')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(msg)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(msg.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? 'Editar Mensagem' : 'Nova Mensagem'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título da Mensagem</label>
                <input 
                  type="text" 
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Promoção de Natal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mídia (Opcional)</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600"
                  >
                    <Paperclip size={18} />
                    Anexar Arquivo
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,video/*,audio/*,application/pdf"
                  />
                  {file && (
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                      <span className="text-xs font-medium text-blue-700 truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <button type="button" onClick={removeFile} className="text-blue-400 hover:text-blue-600">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {isAudio && (
                  <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                    <Music size={12} /> Áudios são enviados sem legenda no WhatsApp.
                  </p>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Conteúdo</label>
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button 
                      type="button"
                      onClick={() => setPreviewMode(false)}
                      className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${!previewMode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <Type size={14} /> Editor
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPreviewMode(true)}
                      className={`px-3 py-1 text-xs rounded-md flex items-center gap-1 transition-colors ${previewMode ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <Eye size={14} /> Preview
                    </button>
                  </div>
                </div>

                {!previewMode ? (
                  <div className={`border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 ${isAudio ? 'bg-gray-50 opacity-60' : ''}`}>
                    <div className="bg-gray-50 border-b p-2 flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => applyFormatting('*')}
                        disabled={isAudio}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50" 
                        title="Negrito (*)"
                      >
                        <Bold size={18} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => applyFormatting('_')}
                        disabled={isAudio}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50" 
                        title="Itálico (_)"
                      >
                        <Italic size={18} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => applyFormatting('~')}
                        disabled={isAudio}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50" 
                        title="Tachado (~)"
                      >
                        <Strikethrough size={18} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => applyFormatting('```')}
                        disabled={isAudio}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-50" 
                        title="Monoespaçado (```)"
                      >
                        <Code size={18} />
                      </button>
                    </div>
                    <textarea 
                      ref={textareaRef}
                      value={conteudo}
                      onChange={(e) => setConteudo(e.target.value)}
                      rows={8}
                      disabled={isAudio}
                      className="w-full px-4 py-2 outline-none resize-none disabled:bg-transparent"
                      placeholder={isAudio ? "Áudios não permitem legenda..." : "Digite o texto que será enviado no WhatsApp..."}
                      required={!isAudio}
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-[#e5ddd5] min-h-[240px] max-h-[400px] overflow-y-auto">
                    <div className="max-w-[85%] bg-white p-3 rounded-lg shadow-sm relative">
                      {filePreview && (
                        <div className="mb-2 rounded overflow-hidden">
                          <img src={filePreview} alt="Preview" className="w-full h-auto" />
                        </div>
                      )}
                      {file && !filePreview && (
                        <div className="mb-2 p-3 bg-gray-100 rounded flex items-center gap-3">
                          {file.type.startsWith('video/') ? <Film size={24} /> : file.type.startsWith('audio/') ? <Music size={24} /> : <FileText size={24} />}
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                      )}
                      <div 
                        className="whatsapp-preview text-gray-800 whitespace-pre-wrap text-sm"
                        dangerouslySetInnerHTML={{ __html: formatWhatsAppPreview(conteudo) }}
                      />
                      <span className="text-[10px] text-gray-400 float-right mt-1">12:00</span>
                    </div>
                  </div>
                )}
                {!isAudio && (
                  <p className="text-xs text-gray-400 mt-2">
                    Dica: Use *negrito*, _itálico_, ~tachado~ ou ```monoespaçado```.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar Mensagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
