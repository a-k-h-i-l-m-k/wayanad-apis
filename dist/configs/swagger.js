"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const env_1 = require("./env");
const options = {
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
                url: `http://localhost:${env_1.env.PORT}/api/v1`,
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
const swaggerSpec = (0, swagger_jsdoc_1.default)(options);
const setupSwagger = (app) => {
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
    console.log(`📖 API Docs available at http://localhost:${env_1.env.PORT}/api-docs`);
};
exports.setupSwagger = setupSwagger;
