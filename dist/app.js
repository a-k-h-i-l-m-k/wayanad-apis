"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const swagger_1 = require("./configs/swagger");
const env_1 = require("./configs/env");
const app = (0, express_1.default)();
// 1. Core middlewares
app.use((0, cors_1.default)({
    origin: '*', // Adjust origins according to production deployment needs
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
if (env_1.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
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
(0, swagger_1.setupSwagger)(app);
// 4. API Routes
app.use('/api/v1', routes_1.default);
// 5. Fallback 404 Route handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`,
    });
});
// 6. Global error handler middleware
app.use(error_middleware_1.errorMiddleware);
exports.default = app;
