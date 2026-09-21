import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/apiRouter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API routes
app.use('/api', apiRouter);

// Serve static assets from dist in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hot Wok Asian Cuisine server listening on port ${PORT}`);
});
