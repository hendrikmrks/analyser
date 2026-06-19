const express = require('express');
const { refreshAccessToken } = require('../spotify');
const { buildFullListeningAnalysis } = require('../listeningAnalysis');

const router = express.Router();
const SPOTIFY_API = 'https://api.spotify.com/v1';

async function getValidToken(req) {
  if (!req.session.accessToken) return null;

  if (req.session.tokenExpiry && Date.now() > req.session.tokenExpiry - 60000) {
    if (!req.session.refreshToken) return null;
    try {
      const tokens = await refreshAccessToken(req.session.refreshToken);
      req.session.accessToken = tokens.access_token;
      req.session.tokenExpiry = Date.now() + tokens.expires_in * 1000;
      if (tokens.refresh_token) {
        req.session.refreshToken = tokens.refresh_token;
      }
    } catch {
      req.session.destroy(() => {});
      return null;
    }
  }

  return req.session.accessToken;
}

async function spotifyFetch(token, endpoint) {
  const response = await fetch(`${SPOTIFY_API}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spotify API error (${response.status}): ${text}`);
  }

  return response.json();
}

function requireAuth(handler) {
  return async (req, res) => {
    const token = await getValidToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
      const data = await handler(token, req);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  };
}

router.get('/profile', requireAuth(async (token) => {
  const profile = await spotifyFetch(token, '/me');

  const [topArtistsShort, topArtistsMedium, topArtistsLong] = await Promise.all([
    spotifyFetch(token, '/me/top/artists?limit=50&time_range=short_term'),
    spotifyFetch(token, '/me/top/artists?limit=50&time_range=medium_term'),
    spotifyFetch(token, '/me/top/artists?limit=50&time_range=long_term'),
  ]);

  const [topTracksShort, topTracksMedium, topTracksLong] = await Promise.all([
    spotifyFetch(token, '/me/top/tracks?limit=50&time_range=short_term'),
    spotifyFetch(token, '/me/top/tracks?limit=50&time_range=medium_term'),
    spotifyFetch(token, '/me/top/tracks?limit=50&time_range=long_term'),
  ]);

  const shortArtists = topArtistsShort.items || [];
  const mediumArtists = topArtistsMedium.items || [];
  const longArtists = topArtistsLong.items || [];
  const shortTracks = topTracksShort.items || [];
  const mediumTracks = topTracksMedium.items || [];
  const longTracks = topTracksLong.items || [];

  let recentlyPlayed = { items: [] };
  try {
    recentlyPlayed = await spotifyFetch(token, '/me/player/recently-played?limit=50');
  } catch {
    // optional — may fail for some accounts
  }

  const recentItems = recentlyPlayed.items || [];
  const recentTracks = recentItems
    .map((i) => i.track)
    .filter((track) => track?.id);

  const listeningAnalysis = buildFullListeningAnalysis({
    shortArtists,
    mediumArtists,
    longArtists,
    shortTracks,
    mediumTracks,
    longTracks,
    recentlyPlayedItems: recentItems,
  });

  return {
    profile: {
      id: profile.id,
      displayName: profile.display_name,
      email: profile.email,
      country: profile.country,
      followers: profile.followers?.total || 0,
      image: profile.images?.[0]?.url || null,
      product: profile.product,
      uri: profile.uri,
    },
    topArtists: {
      short: shortArtists,
      medium: mediumArtists,
      long: longArtists,
    },
    topTracks: {
      short: shortTracks,
      medium: mediumTracks,
      long: longTracks,
    },
    recentlyPlayed: recentTracks,
    genres: listeningAnalysis.primary?.genres || [],
    listeningAnalysis,
    diversity: listeningAnalysis.diversity,
    stats: {
      avgArtistPopularity: listeningAnalysis.primary?.metrics.artistPopularity ?? 0,
      avgTrackPopularity: listeningAnalysis.metrics.mainstreamScore,
      totalTopTracks: mediumTracks.length,
      explicitRatio: listeningAnalysis.metrics.explicitPct,
      catalogAgeYears: listeningAnalysis.metrics.catalogAgeYears,
      freshnessPct: Math.round(listeningAnalysis.metrics.freshnessPct * 100),
      discoveryCount: listeningAnalysis.comparison.discoveryCount,
      loyaltyPct: listeningAnalysis.comparison.loyalty,
      artistDominance: listeningAnalysis.metrics.artistDominance ?? 0,
      tasteEvolution: listeningAnalysis.tasteEvolution?.labelKey,
      analyzedTracks: listeningAnalysis.totalTracksAnalyzed,
    },
  };
}));

module.exports = router;
