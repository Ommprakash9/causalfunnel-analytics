import { config } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { createApp } from './app';

async function main(): Promise<void> {
  await connectDatabase();

  const app = createApp(config.frontendUrl);

  const server = app.listen(config.port, () => {
    console.log(`✓ Server running on port ${config.port}`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  Frontend URL: ${config.frontendUrl}`);
    console.log(`  Health check: http://localhost:${config.port}/api/health`);
    console.log(`  Tracker SDK: http://localhost:${config.port}/tracker.js`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('✓ Server closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
