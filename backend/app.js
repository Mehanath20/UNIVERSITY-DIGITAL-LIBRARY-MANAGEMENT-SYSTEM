import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import holdRoutes from './routes/holdRoutes.js';
import finePaymentRoutes from './routes/finePaymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import membershipRoutes from './routes/membershipRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '..', 'frontend');

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false // Allows loading Bootstrap CDN and frontend scripts seamlessly
}));

// Cross-Origin Resource Sharing
app.use(cors());

// Request Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter for Authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});

// API Routes Mounting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/members', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/holds', holdRoutes);
app.use('/api/fines', finePaymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/membership-plans', membershipRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Serve static frontend assets
app.use(express.static(frontendPath));

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Digital Library Management System API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for root or SPA route navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 handler for unmatched routes
app.use(notFound);

// Centralized error handler
app.use(errorHandler);

export default app;
