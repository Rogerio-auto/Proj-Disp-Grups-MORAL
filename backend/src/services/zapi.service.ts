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
        throw new Error('Configuração da Z-API ausente no arquivo .env (Instance ID ou Token)');
      }

      const url = `${this.baseUrl}/instances/${this.instanceId}/token/${this.token}/groups`;
      console.log('Chamando Z-API:', url);

      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error: any) {
      const zapiError = error.response?.data;
      console.error('Erro detalhado da Z-API:', zapiError || error.message);

      if (error.response?.status === 403) {
        throw new Error('Erro 403: Acesso negado. Verifique se a instância está conectada ao WhatsApp e se o Token/Instance ID estão corretos no .env.');
      }
      
      const errorMsg = zapiError?.message || error.message;
      throw new Error(errorMsg || 'Falha ao buscar grupos na Z-API');
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
