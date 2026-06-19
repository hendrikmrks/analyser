const express = require('express');
const crypto = require('crypto');
const { buildAuthUrl, exchangeCodeForTokens } = require('../spotify');

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || 'http://127.0.0.1:5173';

router.get('/login', (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex');
    req.session.oauthState = state;
    req.session.save((err) => {
      if (err) {
        return res.redirect(`${CLIENT_URL}?error=${encodeURIComponent('Session could not be saved')}`);
      }
      res.redirect(buildAuthUrl(state));
    });
  } catch (err) {
    res.redirect(`${CLIENT_URL}?error=${encodeURIComponent(err.message)}`);
  }
});

router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${CLIENT_URL}?error=${encodeURIComponent(error)}`);
  }

  if (!code || !req.session.oauthState || state !== req.session.oauthState) {
    return res.redirect(`${CLIENT_URL}?error=${encodeURIComponent('Invalid OAuth state')}`);
  }

  delete req.session.oauthState;

  try {
    const tokens = await exchangeCodeForTokens(code);
    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token;
    req.session.tokenExpiry = Date.now() + tokens.expires_in * 1000;
    req.session.save((err) => {
      if (err) {
        return res.redirect(`${CLIENT_URL}?error=${encodeURIComponent('Session could not be saved')}`);
      }
      res.redirect(CLIENT_URL);
    });
  } catch (err) {
    res.redirect(`${CLIENT_URL}?error=${encodeURIComponent(err.message)}`);
  }
});

router.get('/status', (req, res) => {
  res.json({ authenticated: !!req.session.accessToken });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

module.exports = router;
