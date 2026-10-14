import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try loading .env from backend directory, cwd, or parent
const candidatePaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'backend/.env'),
];

for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

interface Config {
  port: number;
  nodeEnv: string;
  mongodbUri: string;
  frontendUrl: string;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === 'test') {
      return 'mongodb://localhost:27017/test_db';
    }
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      if (key === 'MONGODB_URI') {
        return 'mongodb://127.0.0.1:27017/causalfunnel_analytics';
      }
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: getRequiredEnv('MONGODB_URI'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
