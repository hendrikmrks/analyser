const API = '/api';

export async function checkAuth() {
  const res = await fetch(`${API}/auth/status`, { credentials: 'include' });
  if (!res.ok) throw new Error('Could not reach the server');
  return res.json();
}

export async function fetchProfile() {
  const res = await fetch(`${API}/profile`, { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Could not load profile');
  }
  return res.json();
}

export async function logout() {
  await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
}

export function formatDuration(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export const FEATURE_COLORS = {
  danceability: '#1db954',
  energy: '#f59e0b',
  valence: '#a855f7',
  acousticness: '#3b82f6',
  instrumentalness: '#ec4899',
  speechiness: '#ef4444',
  tempo: '#06b6d4',
  liveness: '#84cc16',
};

export const FEATURE_LABELS = {
  danceability: 'Danceability',
  energy: 'Energy',
  valence: 'Positivity',
  acousticness: 'Acoustic',
  instrumentalness: 'Instrumental',
  speechiness: 'Vocals',
  tempo: 'Tempo',
  liveness: 'Live feel',
};
