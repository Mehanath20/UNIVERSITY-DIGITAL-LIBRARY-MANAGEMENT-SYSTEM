import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed initial catalog & credentials if database is empty
    const User = (await import('./models/User.js')).default;
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('[Startup] Database is empty. Seeding default catalog, plans, and accounts...');
      const { seedMembershipPlans } = await import('./seed/seedMembershipPlans.js');
      const { seedUsers } = await import('./seed/seedAdmin.js');
      const { seedBooks } = await import('./seed/seedBooks.js');
      await seedMembershipPlans();
      await seedUsers();
      await seedBooks();
      console.log('[Startup] Initial data seeded successfully!');
    }

    const server = app.listen(ENV.PORT, () => {
      console.log(`====================================================`);
      console.log(`  DIGITAL LIBRARY MANAGEMENT SYSTEM (DLMS)`);
      console.log(`  Environment : ${ENV.NODE_ENV}`);
      console.log(`  Server Port : http://localhost:${ENV.PORT}`);
      console.log(`  API Health  : http://localhost:${ENV.PORT}/api/health`);
      console.log(`====================================================`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('[Server] Fatal error on startup:', error);
    process.exit(1);
  }
};

startServer();
