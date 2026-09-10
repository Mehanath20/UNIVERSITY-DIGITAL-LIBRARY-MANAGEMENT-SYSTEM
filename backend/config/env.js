import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_library',
  USE_MEMORY_DB: process.env.USE_MEMORY_DB !== 'false',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  FINE_DEFAULT_RATE: Number(process.env.FINE_DEFAULT_RATE) || 5,
  MAX_FINE_AMOUNT: Number(process.env.MAX_FINE_AMOUNT) || 500,
  HOLD_EXPIRY_DAYS: Number(process.env.HOLD_EXPIRY_DAYS) || 3
};
