import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/auisc-eventsync',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
