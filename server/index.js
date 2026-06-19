require('dotenv').config();
const https = require('https');
const http = require('http');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const { getHttpsOptions, certsExist } = require('./https');
const { validateEnv } = require('./validateEnv');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;
const USE_HTTPS = process.env.USE_HTTPS !== 'false';
const isHttps = USE_HTTPS && certsExist();
const CLIENT_URL = process.env.CLIENT_URL || 'http://127.0.0.1:5173';
const cookieSecure = CLIENT_URL.startsWith('https://');

const { warnings, errors } = validateEnv();
for (const msg of warnings) console.warn(`Warning: ${msg}`);
if (errors.length) {
  errors.forEach((msg) => console.error(`Error: ${msg}`));
  process.exit(1);
}

app.set('trust proxy', 1);
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: cookieSecure,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  },
}));

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

if (isHttps) {
  const options = getHttpsOptions();
  const server = https.createServer(options, app);
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop other processes or run: npm run predev`);
      process.exit(1);
    }
    throw err;
  });
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at https://localhost:${PORT}`);
    console.log(`           and https://127.0.0.1:${PORT}`);
  });
} else {
  const server = http.createServer(app);
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop other processes or run: npm run predev`);
      process.exit(1);
    }
    throw err;
  });
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
    console.log(`Open the app at ${CLIENT_URL}`);
    if (USE_HTTPS) {
      console.warn('Note: No SSL certificates found. Run "npm run setup:certs".');
    }
  });
}
