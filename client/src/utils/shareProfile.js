export const APP_NAME = 'Analyser';

const PREFIX = 'ANALYSER1:';
const LEGACY_PREFIX = 'SPOTIFYDNA1:';

export function buildSharePayload({ profile, listeningAnalysis, diversity, stats, genres, topArtists }) {
  const mediumArtists = topArtists?.medium || [];
  return {
    v: 1,
    name: profile.displayName || 'Spotify User',
    personality: listeningAnalysis?.personality || '',
    diversity: diversity?.score ?? 0,
    mainstream: stats.avgTrackPopularity ?? 0,
    loyalty: stats.loyaltyPct ?? 0,
    freshness: stats.freshnessPct ?? 0,
    catalogAge: Math.round(stats.catalogAgeYears ?? 0),
    artistDominance: stats.artistDominance ?? 0,
    tasteEvolution: stats.tasteEvolution || '',
    topGenreFamily: listeningAnalysis?.musicDNA?.topGenreFamily || '',
    topGenres: (genres || []).slice(0, 8).map((g) => g.genre),
    topArtists: mediumArtists.slice(0, 5).map((a) => a.name),
    discoveryCount: stats.discoveryCount ?? 0,
  };
}

function toBase64Url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return decodeURIComponent(escape(atob(padded + pad)));
}

export function encodeShareCode(payload) {
  return PREFIX + toBase64Url(JSON.stringify(payload));
}

export function decodeShareCode(code, t) {
  const trimmed = (code || '').trim();
  const prefix = trimmed.startsWith(PREFIX)
    ? PREFIX
    : trimmed.startsWith(LEGACY_PREFIX)
      ? LEGACY_PREFIX
      : null;
  if (!prefix) {
    throw new Error(t('compare.invalidCode'));
  }
  const payload = JSON.parse(fromBase64Url(trimmed.slice(prefix.length)));
  if (payload.v !== 1 || !payload.name) {
    throw new Error(t('compare.corruptCode'));
  }
  return payload;
}

function jaccardSimilarity(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  if (!setA.size && !setB.size) return 100;
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union ? Math.round((intersection / union) * 100) : 0;
}

function metricSimilarity(a, b, max = 100) {
  return Math.max(0, 100 - Math.round((Math.abs(a - b) / max) * 100));
}

export function compareProfiles(self, friend, t, personalityName) {
  const genreOverlap = jaccardSimilarity(self.topGenres || [], friend.topGenres || []);
  const artistOverlap = jaccardSimilarity(self.topArtists || [], friend.topArtists || []);

  const metricPairs = [
    { key: 'mainstream', labelKey: 'metrics.mainstream.label', max: 100 },
    { key: 'diversity', labelKey: 'metrics.diversity.label', max: 100 },
    { key: 'loyalty', labelKey: 'metrics.loyalty.label', max: 100 },
    { key: 'freshness', labelKey: 'metrics.freshness.label', max: 100 },
    { key: 'artistDominance', labelKey: 'metrics.artistFocus.label', max: 100 },
  ];

  const metrics = metricPairs.map(({ key, labelKey, max }) => ({
    key,
    label: t(labelKey),
    self: self[key] ?? 0,
    friend: friend[key] ?? 0,
    diff: (self[key] ?? 0) - (friend[key] ?? 0),
  }));

  const metricScore = metricPairs.reduce(
    (sum, { key, max }) => sum + metricSimilarity(self[key] ?? 0, friend[key] ?? 0, max),
    0
  ) / metricPairs.length;

  const compatibility = Math.round(metricScore * 0.55 + genreOverlap * 0.3 + artistOverlap * 0.15);

  const sharedGenres = (self.topGenres || []).filter((g) => (friend.topGenres || []).includes(g));
  const sharedArtists = (self.topArtists || []).filter((a) => (friend.topArtists || []).includes(a));

  const insights = [];

  if (compatibility >= 75) {
    insights.push({ icon: '💚', text: t('compare.strongOverlap') });
  } else if (compatibility >= 50) {
    insights.push({ icon: '🎧', text: t('compare.balancedOverlap') });
  } else {
    insights.push({ icon: '🌶️', text: t('compare.differentProfiles') });
  }

  if (sharedGenres.length) {
    insights.push({
      icon: '🎸',
      text: t('compare.sharedGenresText', { genres: sharedGenres.slice(0, 4).join(', ') }),
    });
  }
  if (sharedArtists.length) {
    insights.push({
      icon: '🎤',
      text: t('compare.bothLove', { artists: sharedArtists.join(', ') }),
    });
  }

  const mainstreamDiff = (self.mainstream ?? 0) - (friend.mainstream ?? 0);
  if (Math.abs(mainstreamDiff) >= 15) {
    const more = mainstreamDiff > 0 ? self.name : friend.name;
    insights.push({ icon: '📻', text: t('compare.moreMainstream', { name: more }) });
  }

  const diversityDiff = (self.diversity ?? 0) - (friend.diversity ?? 0);
  if (Math.abs(diversityDiff) >= 12) {
    const more = diversityDiff > 0 ? self.name : friend.name;
    insights.push({ icon: '🌈', text: t('compare.moreEclectic', { name: more }) });
  }

  if (self.personality && friend.personality && personalityName) {
    const selfType = personalityName(self.personality);
    const friendType = personalityName(friend.personality);
    if (self.personality === friend.personality) {
      insights.push({ icon: '🎭', text: t('compare.sameType', { type: selfType }) });
    } else {
      insights.push({ icon: '🎭', text: t('compare.typeVs', { a: selfType, b: friendType }) });
    }
  }

  return {
    compatibility,
    genreOverlap,
    artistOverlap,
    metrics,
    sharedGenres,
    sharedArtists,
    insights,
  };
}

export function buildShareText(payload, t, personalityName) {
  const typeLabel = payload.personality && personalityName
    ? personalityName(payload.personality)
    : payload.personality;
  const lines = [
    t('share.shareTextTitle', { name: payload.name }),
    typeLabel ? t('share.shareTextType', { type: typeLabel }) : null,
    t('share.shareTextStats', { diversity: payload.diversity, mainstream: payload.mainstream }),
    payload.topGenreFamily ? t('share.shareTextFamily', { family: payload.topGenreFamily }) : null,
    payload.topArtists?.length
      ? t('share.shareTextArtists', { artists: payload.topArtists.slice(0, 3).join(', ') })
      : null,
    '',
    t('share.shareTextFooter'),
  ].filter(Boolean);
  return lines.join('\n');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawShareImage(payload, initials = '?') {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a0a0f');
  bg.addColorStop(0.5, '#12121a');
  bg.addColorStop(1, '#1a1028');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(29, 185, 84, 0.12)';
  ctx.beginPath();
  ctx.arc(W * 0.85, H * 0.15, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
  ctx.beginPath();
  ctx.arc(W * 0.12, H * 0.88, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1db954';
  ctx.font = '600 28px Inter, system-ui, sans-serif';
  ctx.fillText(APP_NAME, 72, 72);

  roundRect(ctx, 72, 120, 120, 120, 60);
  const avatarGrad = ctx.createLinearGradient(72, 120, 192, 240);
  avatarGrad.addColorStop(0, '#1db954');
  avatarGrad.addColorStop(1, '#a855f7');
  ctx.fillStyle = avatarGrad;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 42px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(initials.slice(0, 2), 132, 198);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#f5f5f7';
  ctx.font = 'bold 52px Inter, system-ui, sans-serif';
  ctx.fillText(payload.name, 220, 175);

  if (payload.personality) {
    ctx.font = '500 26px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#1db954';
    ctx.fillText(`🎵 ${payload.personality}`, 220, 220);
  }

  const stats = [
    ['Diversity', payload.diversity],
    ['Mainstream', payload.mainstream],
    ['Loyalty', `${payload.loyalty}%`],
    ['Freshness', `${payload.freshness}%`],
    ['Focus', payload.artistDominance],
    ['Discoveries', payload.discoveryCount],
  ];

  stats.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 72 + col * 480;
    const sy = 300 + row * 110;

    roundRect(ctx, x, sy, 440, 88, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(29,185,84,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#8b8b9e';
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    ctx.fillText(label.toUpperCase(), x + 24, sy + 34);
    ctx.fillStyle = '#f5f5f7';
    ctx.font = 'bold 36px Inter, system-ui, sans-serif';
    ctx.fillText(String(value), x + 24, sy + 72);
  });

  let y = 680;
  if (payload.topGenreFamily) {
    ctx.fillStyle = '#8b8b9e';
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    ctx.fillText('TOP GENRE FAMILY', 72, y);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 34px Inter, system-ui, sans-serif';
    ctx.fillText(payload.topGenreFamily, 72, y + 44);
    y += 90;
  }

  if (payload.topArtists?.length) {
    ctx.fillStyle = '#8b8b9e';
    ctx.font = '500 22px Inter, system-ui, sans-serif';
    ctx.fillText('TOP ARTISTS', 72, y);
    ctx.fillStyle = '#f5f5f7';
    ctx.font = '500 28px Inter, system-ui, sans-serif';
    ctx.fillText(payload.topArtists.slice(0, 5).join(' · '), 72, y + 44);
  }

  ctx.fillStyle = 'rgba(139,139,158,0.8)';
  ctx.font = '400 20px Inter, system-ui, sans-serif';
  ctx.fillText(`Generated with ${APP_NAME}`, 72, H - 48);

  return canvas;
}

export function downloadShareImage(payload, initials) {
  const canvas = drawShareImage(payload, initials);
  const link = document.createElement('a');
  link.download = `${(payload.name || 'music-dna').replace(/[^\w-]+/g, '-').toLowerCase()}-analyser.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
