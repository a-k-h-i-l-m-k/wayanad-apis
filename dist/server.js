"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./configs/env");
const prisma_1 = require("./configs/prisma");
const server = app_1.default.listen(env_1.env.PORT, () => {
    console.log(`🚀 Wayanad Retreat API server is running in [${env_1.env.NODE_ENV}] mode on port ${env_1.env.PORT}`);
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
        prisma_1.prisma.$disconnect();
        process.exit(1);
    });
});
// Handle system signals for graceful shutdowns
const gracefulShutdown = () => {
    console.log('🔄 Signal received. Shutting down server gracefully...');
    server.close(async () => {
        await prisma_1.prisma.$disconnect();
        console.log('💾 Database disconnected. Process terminated.');
        process.exit(0);
    });
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
