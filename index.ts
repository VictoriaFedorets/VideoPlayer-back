import dotenv from 'dotenv';
import { createApp } from './src/server.ts';
import { initPrismaConnection } from './src/db/initPrismaConnection.ts';
import { env } from './src/utils/env.ts';

dotenv.config();

const bootstrap = async (): Promise<void> => {
  try {
    await initPrismaConnection();

    const app = createApp();
    const PORT = Number(env('PORT', '3000'));

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

bootstrap();
