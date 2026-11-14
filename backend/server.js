import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import todoRoutes from './routes/todos.js';

const app = express();
app.use(express.json());

// Serverless functions (Vercel) start fresh often, so we reuse one connection
// per running instance instead of opening a new one on every request.
let connecting = null;
function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = mongoose.connect(process.env.MONGODB_URI).catch((err) => {
      connecting = null; // allow a retry on the next request
      throw err;
    });
  }
  return connecting;
}

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/todos', todoRoutes);

// Express 5 forwards errors from async handlers here automatically.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

export default app;

// Locally we start a real server. On Vercel, the platform calls the exported app.
if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}
