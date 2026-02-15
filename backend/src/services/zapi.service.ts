import axios from 'axios';

export class ZApiService {
  private baseUrl: string;
  private instanceId: string;
  private token: string;
  private clientToken: string;

  constructor() {
    this.baseUrl = process.env.ZAPI_BASE_URL || 'https://api.z-api.io';
    this.instanceId = process.env.ZAPI_INSTANCE_ID || '';
    this.token = process.env.ZAPI_TOKEN || '';
    this.clientToken = process.env.ZAPI_CLIENT_TOKEN || '';
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'Client-Token': this.clientToken
    };
  }

  async getGroups() {
    try {
      if (!this.instanceId || !this.token) {
        throw new Error('Credenciais da Z-API não configuradas (.env)');
      }

      // 1. Verificar Status antes de começar
      const status = await this.getInstanceStatus();
      if (!status.connected) {
        throw new Error('Sua instância do WhatsApp não está conectada na Z-API. Por favor, conecte o QR Code primeiro.');
      }

      let allGroups: any[] = [];
      let page = 1;
      const pageSize = 100;
      let hasMore = true;

      // Buscar Grupos com Paginação
      while (hasMore) {
        const url = `${this.baseUrl}/instances/${this.instanceId}/token/${this.token}/groups?page=${page}&pageSize=${pageSize}`;
        console.log(`Buscando Grupos Z-API: Pagina ${page}...`);
        
        try {
          const response = await axios.get(url, { headers: this.headers, timeout: 30000 });
          const groups = response.data;

          if (Array.isArray(groups)) {
            if (groups.length > 0) {
              allGroups = [...allGroups, ...groups];
              console.log(`Página ${page} retornou ${groups.length} grupos.`);
              if (groups.length < pageSize) {
                hasMore = false;
              } else {
                page++;
              }
            } else {
              hasMore = false;
            }
          } else {
            console.error('Resposta da Z-API não é um array:', groups);
            hasMore = false;
          }
        } catch (err: any) {
          console.error(`Erro na página ${page} da Z-API:`, err.response?.data || err.message);
          throw err; // Propaga para o catch principal
        }
      }

      // Buscar Comunidades (Z-API tem endpoint separado)
      try {
        console.log('Buscando Comunidades...');
        const communitiesUrl = `${this.baseUrl}/instances/${this.instanceId}/token/${this.token}/communities`;
        const commResponse = await axios.get(communitiesUrl, { headers: this.headers });
        if (Array.isArray(commResponse.data)) {
          const communitiesAsGroups = commResponse.data.map((c: any) => ({
            ...c,
            isGroup: true,
            phone: c.id // Transforma o 'id' da comunidade no 'phone' esperado pelo resto do sistema
          }));
          allGroups = [...allGroups, ...communitiesAsGroups];
        }
      } catch (e) {
        console.error('Erro ao buscar comunidades:', e);
      }

      return allGroups;
    } catch (error: any) {
      const zapiError = error.response?.data;
      console.error('Erro detalhado da Z-API:', JSON.stringify(zapiError || error.message));

      if (error.response?.status === 403) {
        throw new Error('Acesso negado (403). Verifique se a instância está conectada e se Token/ID estão corretos.');
      }
      
      let errorMsg = 'Falha ao buscar grupos na Z-API';
      if (typeof zapiError === 'string') {
        errorMsg = zapiError;
      } else if (zapiError && zapiError.message) {
        errorMsg = zapiError.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      throw new Error(errorMsg);
    }
  }

  async getInstanceStatus() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/instances/${this.instanceId}/token/${this.token}/status`,
        { headers: this.headers }
      );
      return response.data;
    } catch (error: any) {
      return { connected: false };
    }
  }

  async sendTextMessage(phone: string, message: string) {
    try {
      const url = `${this.baseUrl}/instances/${this.instanceId}/token/${this.token}/send-text`;
      const response = await axios.post(url, {
        phone,
        message
      }, { headers: this.headers });
      return response.data;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem via Z-API:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const zapiService = new ZApiService();
