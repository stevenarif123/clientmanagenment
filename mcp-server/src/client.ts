import axios, { AxiosInstance } from 'axios';
import { ClientHubConfig } from './config.js';

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getClientHubClient(config: ClientHubConfig): Promise<AxiosInstance> {
  const apiBase = `${config.baseUrl}/api`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // If API Key is present, use X-API-Key
  if (config.apiKey) {
    headers['X-API-Key'] = config.apiKey;
    const instance = axios.create({
      baseURL: apiBase.endsWith('/') ? apiBase : `${apiBase}/`,
      headers,
      timeout: 15000,
    });
    instance.interceptors.request.use((reqConfig) => {
      if (reqConfig.url?.startsWith('/')) {
        reqConfig.url = reqConfig.url.substring(1);
      }
      return reqConfig;
    });
    return instance;
  }

  // Otherwise, authenticate via session token
  const now = Date.now();
  if (!cachedToken || now > tokenExpiresAt) {
    if (!config.password) {
      throw new Error(
        'CLIENTHUB_API_KEY atau CLIENTHUB_PASSWORD harus diisi untuk mengakses ClientHub.'
      );
    }

    try {
      const loginRes = await axios.post(`${apiBase}/auth/login`, {
        username: config.username || 'admin',
        password: config.password,
      });

      if (loginRes.data?.success && loginRes.data?.data?.token) {
        cachedToken = loginRes.data.data.token;
        // Cache token for 24 hours
        tokenExpiresAt = now + 24 * 3600 * 1000;
      } else {
        throw new Error(loginRes.data?.message || 'Login to ClientHub failed');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Gagal login ke ClientHub API';
      throw new Error(`Autentikasi ClientHub gagal: ${msg}`);
    }
  }

  headers['Authorization'] = `Bearer ${cachedToken}`;

  const instance = axios.create({
    baseURL: apiBase.endsWith('/') ? apiBase : `${apiBase}/`,
    headers,
    timeout: 15000,
  });

  instance.interceptors.request.use((reqConfig) => {
    if (reqConfig.url?.startsWith('/')) {
      reqConfig.url = reqConfig.url.substring(1);
    }
    return reqConfig;
  });

  return instance;
}
