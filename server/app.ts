import express from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes.js';

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LFG Online Interview System API',
    brand: 'Legend Flow Global',
    time: new Date().toISOString(),
  });
});

// Mount all API endpoints
app.use('/api', apiRoutes);

export default app;
