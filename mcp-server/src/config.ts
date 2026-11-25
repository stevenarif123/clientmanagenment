import dotenv from 'dotenv';
dotenv.config();

export interface ClientHubConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
}

export function getClientHubConfig(override?: Partial<ClientHubConfig>): ClientHubConfig {
  const baseUrl = (
    override?.baseUrl ||
    process.env.CLIENTHUB_BASE_URL ||
    'https://stevenarif.my.id/client'
  ).replace(/\/+$/, '');

  const apiKey = override?.apiKey || process.env.CLIENTHUB_API_KEY || '';
  const username = override?.username || process.env.CLIENTHUB_USERNAME || 'admin';
  const password = override?.password || process.env.CLIENTHUB_PASSWORD || '';

  return {
    baseUrl,
    apiKey,
    username,
    password,
  };
}
