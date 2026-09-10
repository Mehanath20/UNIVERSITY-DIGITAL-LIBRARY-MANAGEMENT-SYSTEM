import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    // Attempt standard connection to MONGODB_URI
    const safeUri = ENV.MONGODB_URI.replace(/:\/\/([^:@]+):([^@]+)@/, '://$1:********@');
    console.log(`[Database] Attempting connection to MongoDB: ${safeUri}...`);
    await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (primaryError) {
    console.warn(`[Database] Could not connect to primary MongoDB instance (${primaryError.message}).`);

    // Never hide a real deployment configuration problem behind temporary storage.
    if (ENV.NODE_ENV === 'production' || ENV.USE_MEMORY_DB === false) {
      throw primaryError;
    }

    console.log('[Database] Initiating embedded MongoDB Memory Server for automatic zero-config operation...');

    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'digital_library'
        }
      });
      const uri = mongoMemoryServer.getUri();
      console.log(`[Database] Embedded MongoDB Memory Server started at: ${uri}`);
      await mongoose.connect(uri);
      console.log(`[Database] Connected to embedded MongoDB successfully!`);
      return mongoose.connection;
    } catch (fallbackError) {
      console.error(`[Database] Failed to launch embedded MongoDB:`, fallbackError);
      throw fallbackError;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('[Database] Disconnected from MongoDB.');
  } catch (error) {
    console.error('[Database] Error during disconnect:', error.message);
  }
};
