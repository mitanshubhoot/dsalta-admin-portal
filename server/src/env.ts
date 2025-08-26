import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

// Load .env from parent directory (admin-activity-portal/)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  
  // Database
  DATABASE_URL: Joi.string().required().description('PostgreSQL connection string'),
  
  // JWT
  JWT_SECRET: Joi.string().required().description('JWT secret for token signing'),
  JWT_EXPIRES_IN: Joi.string().default('24h').description('JWT expiration time'),
  
  // Admin Credentials
  ADMIN_EMAIL: Joi.string().email().required().description('Admin user email'),
  ADMIN_PASSWORD: Joi.string().min(6).required().description('Admin user password'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000).description('Rate limit window in ms'),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100).description('Max requests per window'),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000').description('CORS allowed origin'),
}).unknown();

const { error, value: env } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export interface Config {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ADMIN_EMAIL: string;
  ADMIN_PASSWORD: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  LOG_LEVEL: string;
  CORS_ORIGIN: string;
}

export const config: Config = env;
