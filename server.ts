import path from 'path';
import express from 'express';
import app from './server/app.js';

const PORT = process.env.PORT || 3000;
const distPath = path.resolve(process.cwd(), 'dist');

// Serve static assets from Vite build in production
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[LFG] Server running on port ${PORT}`);
});
