require('dotenv').config();

function validateEnv() {
  const warnings = [];
  const errors = [];

  if (!process.env.SPOTIFY_CLIENT_ID) errors.push('SPOTIFY_CLIENT_ID is missing');
  if (!process.env.SPOTIFY_CLIENT_SECRET) errors.push('SPOTIFY_CLIENT_SECRET is missing');
  if (!process.env.SPOTIFY_REDIRECT_URI) errors.push('SPOTIFY_REDIRECT_URI is missing');

  const clientUrl = process.env.CLIENT_URL || 'http://127.0.0.1:5173';
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (redirectUri?.includes('localhost')) {
    errors.push(
      'SPOTIFY_REDIRECT_URI must not use "localhost". Spotify requires http://127.0.0.1:PORT/api/auth/callback'
    );
  }

  if (redirectUri && clientUrl) {
    try {
      const redirect = new URL(redirectUri);
      const client = new URL(clientUrl);

      if (redirect.hostname === 'localhost' || client.hostname === 'localhost') {
        errors.push('Use 127.0.0.1 instead of localhost for Spotify OAuth');
      }

      if (redirect.origin !== client.origin) {
        warnings.push(
          `SPOTIFY_REDIRECT_URI (${redirect.origin}) should match CLIENT_URL (${client.origin}) for session cookies`
        );
      }

      if (redirect.pathname !== '/api/auth/callback') {
        warnings.push('SPOTIFY_REDIRECT_URI path should be /api/auth/callback');
      }

      const isLoopback = redirect.hostname === '127.0.0.1' || redirect.hostname === '[::1]';
      if (!isLoopback && redirect.protocol !== 'https:') {
        errors.push('Non-loopback redirect URIs must use https://');
      }
    } catch {
      errors.push('SPOTIFY_REDIRECT_URI or CLIENT_URL is not a valid URL');
    }
  }

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'dev-secret-change-me') {
    warnings.push('Set a strong SESSION_SECRET in .env');
  }

  return { warnings, errors };
}

module.exports = { validateEnv };
