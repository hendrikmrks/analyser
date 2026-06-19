const DURATION_BUCKETS = [
  { key: 'short', label: 'Short (<3 min)', min: 0, max: 180000 },
  { key: 'medium', label: 'Medium (3–5 min)', min: 180000, max: 300000 },
  { key: 'long', label: 'Long (5+ min)', min: 300000, max: Infinity },
];

const POPULARITY_BUCKETS = [
  { key: 'niche', label: 'Niche (0–25)', min: 0, max: 25 },
  { key: 'moderate', label: 'Moderate (25–50)', min: 25, max: 50 },
  { key: 'popular', label: 'Popular (50–75)', min: 50, max: 75 },
  { key: 'hits', label: 'Hits (75–100)', min: 75, max: 101 },
];

const GENRE_FAMILIES = [
  { family: 'Rock & Metal', match: /rock|metal|punk|grunge|hardcore|emo|indie rock/ },
  { family: 'Hip-Hop & Rap', match: /hip hop|rap|trap|drill|grime/ },
  { family: 'Pop', match: /pop|dance pop|synth-pop|k-pop|j-pop/ },
  { family: 'Electronic', match: /electronic|house|techno|edm|trance|dubstep|ambient/ },
  { family: 'R&B & Soul', match: /r&b|soul|funk|neo-soul|motown/ },
  { family: 'Country & Folk', match: /country|folk|americana|bluegrass/ },
  { family: 'Jazz & Blues', match: /jazz|blues|swing/ },
  { family: 'Latin', match: /latin|reggaeton|salsa|bachata|urbano/ },
  { family: 'Classical', match: /classical|orchestra|baroque|opera/ },
];

const TRACK_VARIANTS = [
  { key: 'remix', label: 'Remix', pattern: /\bremix\b/i },
  { key: 'live', label: 'Live', pattern: /\blive\b/i },
  { key: 'acoustic', label: 'Acoustic', pattern: /\bacoustic\b/i },
  { key: 'feat', label: 'Feat.', pattern: /\b(feat\.|ft\.|featuring)\b/i },
  { key: 'deluxe', label: 'Deluxe/Extended', pattern: /\b(deluxe|extended|version)\b/i },
];

function analyzePopularityBuckets(tracks) {
  return POPULARITY_BUCKETS.map((bucket) => ({
    ...bucket,
    count: tracks.filter(
      (t) => (t.popularity ?? 0) >= bucket.min && (t.popularity ?? 0) < bucket.max
    ).length,
  }));
}

function analyzeReleaseTimeline(tracks) {
  const counts = {};
  for (const track of tracks) {
    const year = parseReleaseYear(track.album?.release_date);
    if (!year) continue;
    counts[year] = (counts[year] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([year, count]) => ({ year: Number(year), count }));
}

function analyzeGenreFamilies(artists) {
  const counts = {};
  for (const artist of artists) {
    const matched = new Set();
    for (const genre of artist.genres || []) {
      for (const { family, match } of GENRE_FAMILIES) {
        if (match.test(genre)) {
          matched.add(family);
          break;
        }
      }
    }
    if (matched.size === 0 && (artist.genres || []).length) {
      matched.add('Other');
    }
    matched.forEach((f) => { counts[f] = (counts[f] || 0) + 1; });
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([family, count]) => ({ family, count }));
}

function analyzeSuperfans(tracks, topArtists) {
  const artistTrackCount = {};
  const artistMeta = {};
  topArtists.forEach((a) => { artistMeta[a.id] = a; });

  for (const track of tracks) {
    const primary = track.artists?.[0];
    if (!primary) continue;
    artistTrackCount[primary.id] = (artistTrackCount[primary.id] || 0) + 1;
  }

  return Object.entries(artistTrackCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, trackCount]) => {
      const artist = artistMeta[id] || tracks.find((t) => t.artists?.[0]?.id === id)?.artists?.[0];
      return {
        id,
        name: artist?.name || 'Unknown',
        image: artist?.images?.[0]?.url || null,
        trackCount,
        genres: (artist?.genres || []).slice(0, 2),
      };
    })
    .filter((a) => a.trackCount >= 2);
}

function analyzeAlbumChampions(tracks) {
  const albums = {};
  for (const track of tracks) {
    const album = track.album;
    if (!album?.id) continue;
    if (!albums[album.id]) {
      albums[album.id] = {
        id: album.id,
        name: album.name,
        artist: track.artists?.[0]?.name,
        image: album.images?.[0]?.url,
        releaseDate: album.release_date,
        count: 0,
      };
    }
    albums[album.id].count++;
  }
  return Object.values(albums)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function analyzeFeaturedArtists(tracks) {
  const featured = {};
  for (const track of tracks) {
    const artists = track.artists || [];
    for (let i = 1; i < artists.length; i++) {
      const a = artists[i];
      featured[a.id] = featured[a.id] || { id: a.id, name: a.name, count: 0 };
      featured[a.id].count++;
    }
  }
  return Object.values(featured)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function analyzeTrackVariants(tracks) {
  return TRACK_VARIANTS.map(({ key, label, pattern }) => ({
    key,
    label,
    count: tracks.filter((t) => pattern.test(t.name || '')).length,
    examples: tracks
      .filter((t) => pattern.test(t.name || ''))
      .slice(0, 3)
      .map((t) => t.name),
  })).filter((v) => v.count > 0);
}

function jaccardDistance(setA, setB) {
  const a = new Set(setA);
  const b = new Set(setB);
  if (!a.size && !b.size) return 0;
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union ? Math.round((1 - intersection / union) * 100) : 0;
}

function computeTasteEvolution(shortArtists, longArtists) {
  const shortGenres = shortArtists.flatMap((a) => a.genres || []);
  const longGenres = longArtists.flatMap((a) => a.genres || []);
  const genreShift = jaccardDistance(shortGenres, longGenres);

  const shortIds = shortArtists.map((a) => a.id);
  const longIds = longArtists.map((a) => a.id);
  const artistShift = jaccardDistance(shortIds, longIds);

  let labelKey = 'steadyTaste';
  if (genreShift >= 50) labelKey = 'majorEvolution';
  else if (genreShift >= 30) labelKey = 'evolvingPalette';
  else if (genreShift <= 10) labelKey = 'rockSolidIdentity';

  return { genreShift, artistShift, labelKey };
}

function computeArtistMomentum(shortArtists, longArtists) {
  const longRank = {};
  longArtists.forEach((a, i) => { longRank[a.id] = i + 1; });

  const climbing = [];
  const falling = [];

  shortArtists.forEach((a, i) => {
    const shortRank = i + 1;
    const prev = longRank[a.id];
    if (prev == null) {
      climbing.push({ ...formatArtist(a), shortRank, longRank: null, delta: 'new' });
    } else {
      const delta = prev - shortRank;
      if (delta >= 5) climbing.push({ ...formatArtist(a), shortRank, longRank: prev, delta });
      if (delta <= -5) falling.push({ ...formatArtist(a), shortRank, longRank: prev, delta });
    }
  });

  return {
    climbing: climbing.slice(0, 6),
    falling: falling.slice(0, 6),
  };
}

function formatArtist(a) {
  return {
    id: a.id,
    name: a.name,
    image: a.images?.[0]?.url,
    genres: (a.genres || []).slice(0, 2),
  };
}

function computeArtistDominance(tracks) {
  if (!tracks.length) return 0;
  const counts = {};
  tracks.forEach((t) => {
    const id = t.artists?.[0]?.id;
    if (id) counts[id] = (counts[id] || 0) + 1;
  });
  const values = Object.values(counts).sort((a, b) => a - b);
  const n = values.length;
  if (n <= 1) return 0;
  let sum = 0;
  values.forEach((v, i) => { sum += (2 * (i + 1) - n - 1) * v; });
  const gini = sum / (n * values.reduce((s, v) => s + v, 0));
  return Math.round(Math.abs(gini) * 100);
}

function analyzeListeningRhythm(recentItems) {
  let weekend = 0;
  let weekday = 0;
  const monthCounts = {};
  const bingeSessions = [];
  let currentBinge = null;

  const sorted = [...recentItems]
    .filter((i) => i.played_at && i.track)
    .sort((a, b) => new Date(a.played_at) - new Date(b.played_at));

  for (const item of sorted) {
    const date = new Date(item.played_at);
    const day = date.getDay();
    if (day === 0 || day === 6) weekend++;
    else weekday++;

    const month = date.toLocaleString('en-US', { month: 'short' });
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  }

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const albumId = curr.track.album?.id;
    const prevAlbumId = prev.track.album?.id;
    const gap = new Date(curr.played_at) - new Date(prev.played_at);

    if (albumId && albumId === prevAlbumId && gap < 30 * 60 * 1000) {
      if (!currentBinge || currentBinge.albumId !== albumId) {
        currentBinge = {
          albumId,
          album: curr.track.album.name,
          artist: curr.track.artists?.[0]?.name,
          image: curr.track.album.images?.[0]?.url,
          tracks: [prev.track.name, curr.track.name],
          start: prev.played_at,
        };
        bingeSessions.push(currentBinge);
      } else {
        currentBinge.tracks.push(curr.track.name);
      }
    } else if (gap >= 30 * 60 * 1000) {
      currentBinge = null;
    }
  }

  const total = weekend + weekday;
  const weekendPct = total ? Math.round((weekend / total) * 100) : 0;
  let rhythmKey = 'balancedListener';
  if (weekendPct >= 60) rhythmKey = 'weekendWarrior';
  else if (weekendPct <= 35) rhythmKey = 'weekdayGrinder';

  return {
    weekendPct,
    weekdayPct: 100 - weekendPct,
    rhythmKey,
    monthCounts: Object.entries(monthCounts).map(([month, count]) => ({ month, count })),
    bingeSessions: bingeSessions
      .filter((b) => b.tracks.length >= 3)
      .sort((a, b) => b.tracks.length - a.tracks.length)
      .slice(0, 5),
  };
}

function buildMusicDNA({ personality, metrics, diversity, comparison, rhythm, dominance, tasteEvolution }) {
  return {
    personality,
    topGenreFamily: null,
    mainstreamScore: metrics.mainstreamScore,
    diversityScore: diversity.score,
    loyalty: comparison.loyalty,
    discoveries: comparison.discoveryCount,
    evolution: tasteEvolution.labelKey,
    evolutionScore: tasteEvolution.genreShift,
    rhythm: rhythm?.rhythmKey || null,
    dominance,
    freshnessPct: Math.round(metrics.freshnessPct * 100),
    catalogAge: metrics.catalogAgeYears,
  };
}

function parseReleaseYear(releaseDate) {
  if (!releaseDate) return null;
  const year = parseInt(releaseDate.slice(0, 4), 10);
  return Number.isFinite(year) ? year : null;
}

function yearToDecade(year) {
  if (!year || year < 1960) return 'Pre-1960';
  if (year >= 2020) return '2020s';
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

function weightedPopularity(items, getPopularity) {
  if (!items.length) return 0;
  let sum = 0;
  let weight = 0;
  items.forEach((item, i) => {
    const w = items.length - i;
    sum += (getPopularity(item) ?? 0) * w;
    weight += w;
  });
  return weight ? Math.round(sum / weight) : 0;
}

function analyzeGenres(artists) {
  const counts = {};
  for (const artist of artists) {
    for (const genre of artist.genres || []) {
      counts[genre] = (counts[genre] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([genre, count]) => ({ genre, count }));
}

function analyzeDecades(tracks) {
  const counts = {};
  for (const track of tracks) {
    const year = parseReleaseYear(track.album?.release_date);
    const decade = yearToDecade(year);
    counts[decade] = (counts[decade] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([decade, count]) => ({ decade, count }));
}

function analyzeDurationBuckets(tracks) {
  return DURATION_BUCKETS.map((bucket) => ({
    ...bucket,
    count: tracks.filter(
      (t) => t.duration_ms >= bucket.min && t.duration_ms < bucket.max
    ).length,
  }));
}

function analyzeAlbumTypes(tracks) {
  const counts = {};
  for (const track of tracks) {
    const type = track.album?.album_type || 'unknown';
    counts[type] = (counts[type] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));
}

function avgDuration(tracks) {
  if (!tracks.length) return 0;
  return tracks.reduce((s, t) => s + (t.duration_ms || 0), 0) / tracks.length;
}

function avgCollaborators(tracks) {
  if (!tracks.length) return 0;
  const total = tracks.reduce((s, t) => s + (t.artists?.length || 1), 0);
  return Math.round((total / tracks.length) * 10) / 10;
}

function explicitRatio(tracks) {
  if (!tracks.length) return 0;
  return tracks.filter((t) => t.explicit).length / tracks.length;
}

function freshnessIndex(tracks) {
  const currentYear = new Date().getFullYear();
  const recent = tracks.filter((t) => {
    const year = parseReleaseYear(t.album?.release_date);
    return year && currentYear - year <= 2;
  });
  return tracks.length ? recent.length / tracks.length : 0;
}

function catalogAge(tracks) {
  const currentYear = new Date().getFullYear();
  const years = tracks
    .map((t) => parseReleaseYear(t.album?.release_date))
    .filter(Boolean);
  if (!years.length) return 0;
  const avgYear = years.reduce((s, y) => s + y, 0) / years.length;
  return Math.round(currentYear - avgYear);
}

function uniqueArtists(tracks) {
  const set = new Set();
  tracks.forEach((t) => t.artists?.forEach((a) => set.add(a.id)));
  return set.size;
}

function findExtremes(tracks) {
  if (!tracks.length) return {};
  const byPop = [...tracks].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  const byDuration = [...tracks].sort((a, b) => (b.duration_ms ?? 0) - (a.duration_ms ?? 0));
  const oldest = [...tracks].sort((a, b) => {
    const ya = parseReleaseYear(a.album?.release_date) || 9999;
    const yb = parseReleaseYear(b.album?.release_date) || 9999;
    return ya - yb;
  });
  const newest = [...tracks].sort((a, b) => {
    const ya = parseReleaseYear(a.album?.release_date) || 0;
    const yb = parseReleaseYear(b.album?.release_date) || 0;
    return yb - ya;
  });

  return {
    mostPopular: formatTrack(byPop[0]),
    leastPopular: formatTrack(byPop[byPop.length - 1]),
    longest: formatTrack(byDuration[0]),
    shortest: formatTrack(byDuration[byDuration.length - 1]),
    oldest: formatTrack(oldest[0]),
    newest: formatTrack(newest[0]),
  };
}

function formatTrack(track) {
  if (!track) return null;
  return {
    id: track.id,
    name: track.name,
    artists: (track.artists || []).map((a) => a.name).join(', '),
    image: track.album?.images?.[0]?.url || null,
    popularity: track.popularity,
    duration_ms: track.duration_ms,
    releaseDate: track.album?.release_date,
    explicit: track.explicit,
  };
}

function computeDiversityScore(artists) {
  if (!artists.length) return { score: 0, uniqueGenres: 0, uniqueArtists: 0 };
  const uniqueGenres = new Set();
  artists.forEach((a) => (a.genres || []).forEach((g) => uniqueGenres.add(g)));
  const score = Math.min(
    100,
    Math.round((uniqueGenres.size / artists.length) * 40 + artists.length * 1.5)
  );
  return { score, uniqueGenres: uniqueGenres.size, uniqueArtists: artists.length };
}

function compareArtistOverlap(shortArtists, longArtists) {
  const shortIds = new Set(shortArtists.map((a) => a.id));
  const longIds = new Set(longArtists.map((a) => a.id));
  const overlap = [...shortIds].filter((id) => longIds.has(id)).length;
  const loyalty = shortIds.size ? Math.round((overlap / shortIds.size) * 100) : 0;

  const newDiscoveriesAll = shortArtists.filter((a) => !longIds.has(a.id));
  const newDiscoveries = newDiscoveriesAll
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url,
      genres: (a.genres || []).slice(0, 2),
      popularity: a.popularity,
    }));

  const faded = longArtists
    .filter((a) => !shortIds.has(a.id))
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      name: a.name,
      image: a.images?.[0]?.url,
      genres: (a.genres || []).slice(0, 2),
    }));

  return { loyalty, overlap, newDiscoveries, faded, discoveryCount: newDiscoveriesAll.length };
}

function compareGenreShift(shortGenres, longGenres) {
  const shortTop = new Set(shortGenres.slice(0, 5).map((g) => g.genre));
  const longTop = new Set(longGenres.slice(0, 5).map((g) => g.genre));
  const emerging = [...shortTop].filter((g) => !longTop.has(g));
  const declining = [...longTop].filter((g) => !shortTop.has(g));
  return { emerging, declining };
}

function analyzeRecentlyPlayed(recentItems) {
  const tracks = recentItems.map((i) => i.track).filter(Boolean);
  const artistCounts = {};
  const albumCounts = {};
  const hourCounts = Array(24).fill(0);

  for (const item of recentItems) {
    if (!item.track) continue;
    item.track.artists?.forEach((a) => {
      artistCounts[a.id] = artistCounts[a.id] || { name: a.name, count: 0 };
      artistCounts[a.id].count++;
    });
    const albumId = item.track.album?.id;
    if (albumId) {
      albumCounts[albumId] = albumCounts[albumId] || {
        name: item.track.album.name,
        artist: item.track.artists?.[0]?.name,
        image: item.track.album.images?.[0]?.url,
        count: 0,
      };
      albumCounts[albumId].count++;
    }
    if (item.played_at) {
      const hour = new Date(item.played_at).getHours();
      hourCounts[hour]++;
    }
  }

  const topArtists = Object.values(artistCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const onRepeat = Object.values(albumCounts)
    .filter((a) => a.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  return {
    total: tracks.length,
    uniqueArtists: Object.keys(artistCounts).length,
    uniqueTracks: new Set(tracks.map((t) => t.id)).size,
    repeatRate: tracks.length
      ? Math.round((1 - new Set(tracks.map((t) => t.id)).size / tracks.length) * 100)
      : 0,
    topArtists,
    onRepeat,
    hourCounts,
    peakHour: peakHour >= 0 ? peakHour : null,
  };
}

function detectPersonality(metrics) {
  const {
    mainstreamScore,
    diversity,
    explicitPct,
    freshnessPct,
    catalogAgeYears,
    avgCollab,
    avgDurationMs,
    discoveryCount,
  } = metrics;

  if (mainstreamScore >= 75 && diversity.uniqueGenres <= 8) return 'chartCurator';
  if (mainstreamScore <= 35) return 'undergroundExplorer';
  if (freshnessPct >= 0.5) return 'newReleaseHunter';
  if (catalogAgeYears >= 15) return 'nostalgiaArchivist';
  if (explicitPct >= 0.4) return 'unfilteredRaw';
  if (diversity.uniqueGenres >= 12) return 'genreBoundaryBreaker';
  if (discoveryCount >= 8) return 'constantDiscoverer';
  if (avgCollab >= 2.2) return 'collaborationCollector';
  if (avgDurationMs >= 240000) return 'deepListeningDevotee';
  if (avgDurationMs <= 180000) return 'snackableStreamer';
  return 'balancedListener';
}

function generateInsights(data) {
  const insights = [];
  const { comparison, recentlyPlayed, metrics, extremes, personality } = data;

  insights.push({
    icon: '🎭',
    id: 'personality',
    params: { personalityKey: personality },
  });

  if (metrics.mainstreamScore >= 70) {
    insights.push({
      icon: '📻',
      id: 'mainstreamHigh',
      params: { score: metrics.mainstreamScore },
    });
  } else if (metrics.mainstreamScore <= 40) {
    insights.push({
      icon: '💎',
      id: 'mainstreamLow',
      params: { score: metrics.mainstreamScore },
    });
  }

  if (comparison.discoveryCount > 0) {
    insights.push({
      icon: '🔭',
      id: 'newDiscoveries',
      params: { count: comparison.discoveryCount },
    });
  }

  if (comparison.loyalty >= 60) {
    insights.push({
      icon: '🔁',
      id: 'loyalty',
      params: { pct: comparison.loyalty },
    });
  }

  if (metrics.freshnessPct >= 0.35) {
    insights.push({
      icon: '🆕',
      id: 'freshCatalog',
      params: { pct: Math.round(metrics.freshnessPct * 100) },
    });
  }

  if (metrics.catalogAgeYears >= 10) {
    insights.push({
      icon: '📼',
      id: 'timeTraveler',
      params: { years: metrics.catalogAgeYears },
    });
  }

  if (extremes.leastPopular?.name) {
    insights.push({
      icon: '🌟',
      id: 'deepestCut',
      params: {
        track: extremes.leastPopular.name,
        artist: extremes.leastPopular.artists,
        popularity: extremes.leastPopular.popularity,
      },
    });
  }

  if (recentlyPlayed?.peakHour != null) {
    insights.push({
      icon: '🕐',
      id: 'peakHour',
      params: { hour: recentlyPlayed.peakHour },
    });
  }

  if (comparison.genreShift?.emerging?.length) {
    insights.push({
      icon: '🎸',
      id: 'risingGenres',
      params: { genres: comparison.genreShift.emerging.slice(0, 3).join(', ') },
    });
  }

  if (metrics.explicitPct >= 0.3) {
    insights.push({
      icon: '🔥',
      id: 'explicitHeavy',
      params: { pct: Math.round(metrics.explicitPct * 100) },
    });
  }

  if (data.tasteEvolution?.genreShift >= 30) {
    insights.push({
      icon: '🧬',
      id: 'tasteEvolution',
      params: {
        labelKey: data.tasteEvolution.labelKey,
        pct: data.tasteEvolution.genreShift,
      },
    });
  }

  if (data.rhythm?.rhythmKey === 'weekendWarrior') {
    insights.push({
      icon: '🎉',
      id: 'weekendWarrior',
      params: { pct: data.rhythm.weekendPct },
    });
  }

  if (data.rhythm?.bingeSessions?.length) {
    const top = data.rhythm.bingeSessions[0];
    insights.push({
      icon: '📀',
      id: 'albumBinge',
      params: { count: top.tracks.length, album: top.album },
    });
  }

  if (data.momentum?.climbing?.length) {
    insights.push({
      icon: '🚀',
      id: 'artistsRising',
      params: {
        count: data.momentum.climbing.length,
        name: data.momentum.climbing[0].name,
      },
    });
  }

  if (data.dominance >= 60) {
    insights.push({
      icon: '🎯',
      id: 'focusedListener',
      params: { score: data.dominance },
    });
  }

  return insights;
}

function buildRangeAnalysis(tracks, artists, label) {
  if (!tracks.length && !artists.length) return null;

  const genres = analyzeGenres(artists);
  const decades = analyzeDecades(tracks);
  const durationBuckets = analyzeDurationBuckets(tracks);
  const albumTypes = analyzeAlbumTypes(tracks);
  const extremes = findExtremes(tracks);
  const popularityBuckets = analyzePopularityBuckets(tracks);
  const releaseTimeline = analyzeReleaseTimeline(tracks);
  const genreFamilies = analyzeGenreFamilies(artists);

  return {
    label,
    trackCount: tracks.length,
    artistCount: artists.length,
    genres,
    genreFamilies,
    decades,
    releaseTimeline,
    durationBuckets,
    popularityBuckets,
    albumTypes,
    extremes,
    superfans: analyzeSuperfans(tracks, artists),
    albumChampions: analyzeAlbumChampions(tracks),
    featuredArtists: analyzeFeaturedArtists(tracks),
    trackVariants: analyzeTrackVariants(tracks),
    metrics: {
      mainstreamScore: weightedPopularity(tracks, (t) => t.popularity),
      artistPopularity: weightedPopularity(artists, (a) => a.popularity),
      avgDurationMs: avgDuration(tracks),
      avgCollaborators: avgCollaborators(tracks),
      explicitPct: explicitRatio(tracks),
      freshnessPct: freshnessIndex(tracks),
      catalogAgeYears: catalogAge(tracks),
      uniqueTrackArtists: uniqueArtists(tracks),
      artistDominance: computeArtistDominance(tracks),
    },
  };
}

function buildFullListeningAnalysis({
  shortArtists,
  mediumArtists,
  longArtists,
  shortTracks,
  mediumTracks,
  longTracks,
  recentlyPlayedItems,
}) {
  const short = buildRangeAnalysis(shortTracks, shortArtists, '4 weeks');
  const medium = buildRangeAnalysis(mediumTracks, mediumArtists, '6 months');
  const long = buildRangeAnalysis(longTracks, longArtists, 'All time');

  const diversity = computeDiversityScore(mediumArtists);
  const comparison = {
    ...compareArtistOverlap(shortArtists, longArtists),
    genreShift: compareGenreShift(
      analyzeGenres(shortArtists),
      analyzeGenres(longArtists)
    ),
    popularityShift: (short?.metrics.mainstreamScore ?? 0) - (long?.metrics.mainstreamScore ?? 0),
    freshnessShift: (short?.metrics.freshnessPct ?? 0) - (long?.metrics.freshnessPct ?? 0),
  };

  const recentlyPlayed = recentlyPlayedItems.length
    ? analyzeRecentlyPlayed(recentlyPlayedItems)
    : null;

  const metrics = {
    mainstreamScore: medium?.metrics.mainstreamScore ?? 0,
    diversity,
    explicitPct: medium?.metrics.explicitPct ?? 0,
    freshnessPct: medium?.metrics.freshnessPct ?? 0,
    catalogAgeYears: medium?.metrics.catalogAgeYears ?? 0,
    avgCollab: medium?.metrics.avgCollaborators ?? 0,
    avgDurationMs: medium?.metrics.avgDurationMs ?? 0,
    discoveryCount: comparison.discoveryCount,
  };

  const personality = detectPersonality(metrics);
  const tasteEvolution = computeTasteEvolution(shortArtists, longArtists);
  const artistMomentum = computeArtistMomentum(shortArtists, longArtists);
  const artistDominance = medium?.metrics.artistDominance ?? 0;
  const listeningRhythm = recentlyPlayedItems.length
    ? analyzeListeningRhythm(recentlyPlayedItems)
    : null;

  const genreFamilies = analyzeGenreFamilies(mediumArtists);
  const musicDNA = buildMusicDNA({
    personality,
    metrics,
    diversity,
    comparison,
    rhythm: listeningRhythm,
    dominance: artistDominance,
    tasteEvolution,
  });
  musicDNA.topGenreFamily = genreFamilies[0]?.family || null;

  const insights = generateInsights({
    medium,
    comparison,
    recentlyPlayed,
    metrics,
    extremes: medium?.extremes ?? {},
    personality,
    tasteEvolution,
    rhythm: listeningRhythm,
    momentum: artistMomentum,
    dominance: artistDominance,
  });

  return {
    personality,
    diversity,
    primary: medium,
    byTimeRange: { short, medium, long },
    comparison,
    recentlyPlayed,
    listeningRhythm,
    tasteEvolution,
    artistMomentum,
    musicDNA,
    insights,
    metrics: { ...metrics, artistDominance },
    totalTracksAnalyzed: mediumTracks.length + shortTracks.length + longTracks.length,
  };
}

module.exports = {
  buildFullListeningAnalysis,
  analyzeGenres,
  computeDiversityScore,
};
