import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { setupSwagger } from './configs/swagger';
import { env } from './configs/env';

const app = express();

// 1. Core middlewares
// Reflect the request origin instead of using '*'. A wildcard origin combined
// with `credentials: true` is rejected by browsers, which would block the admin
// dashboard's authenticated (cookie-bearing) requests. Reflecting the origin
// keeps credentialed CORS working from any front-end during development.
app.use(cors({
  origin: (_origin, callback) => callback(null, true),
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
