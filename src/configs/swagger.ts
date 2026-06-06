import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { env } from './env';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wayanad Retreat API Ecosystem',
      version: '1.0.0',
      description: 'Unified backend services for Wayanad Retreat PMS, Booking Engine, Operations, and CMS Builder.',
      contact: {
        name: 'Akhil M K',
        email: 'info@wayanadretreat.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Bearer Access Token in the format: Bearer <JWT>',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/modules/**/*.routes.ts', 
    './src/modules/**/*.routes.js',
    './src/routes/*.ts',
    './src/routes/*.js'
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`📖 API Docs available at http://localhost:${env.PORT}/api-docs`);
};
