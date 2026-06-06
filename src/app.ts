import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { setupSwagger } from './configs/swagger';
import { env } from './configs/env';

const app = express();

// 1. Core middlewares
app.use(cors({
  origin: '*', // Adjust origins according to production deployment needs
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 2. Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Wayanad Retreat PMS & Booking API is operational',
    timestamp: new Date().toISOString(),
  });
});

// 3. API Docs
setupSwagger(app);

// 4. API Routes
app.use('/api/v1', routes);

// 5. Fallback 404 Route handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// 6. Global error handler middleware
app.use(errorMiddleware);

export default app;
