import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './config/logger';

// Import routes
import dashboardRoutes from './routes/dashboard.routes';
import infraRoutes from './routes/infra.routes';
import secopsRoutes from './routes/secops.routes';
import finopsRoutes from './routes/finops.routes';
import reportsRoutes from './routes/reports.routes';
import sopRoutes from './routes/sop.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/dashboard`, dashboardRoutes);
app.use(`${apiPrefix}/infra`, infraRoutes);
app.use(`${apiPrefix}/secops`, secopsRoutes);
app.use(`${apiPrefix}/finops`, finopsRoutes);
app.use(`${apiPrefix}/reports`, reportsRoutes);
app.use(`${apiPrefix}/sop`, sopRoutes);
app.use(`${apiPrefix}/admin`, adminRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
