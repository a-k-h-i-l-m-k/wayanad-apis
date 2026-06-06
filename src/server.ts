import app from './app';
import { env } from './configs/env';
import { prisma } from './configs/prisma';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Wayanad Retreat API server is running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
});

// Handle uncaught exceptions globally
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (err) => {
  console.error('🔥 UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => {
    prisma.$disconnect();
    process.exit(1);
  });
});

// Handle system signals for graceful shutdowns
const gracefulShutdown = () => {
  console.log('🔄 Signal received. Shutting down server gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('💾 Database disconnected. Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
