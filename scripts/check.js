const assert = require('assert');
const { buildFullListeningAnalysis } = require('../server/listeningAnalysis');

function mockArtist(id, name, genres = ['rock'], popularity = 50) {
  return { id, name, genres, popularity, images: [{ url: 'https://example.com/a.jpg' }] };
}

function mockTrack(id, name, opts = {}) {
  return {
    id,
    name,
    popularity: opts.popularity ?? 50,
    duration_ms: opts.duration_ms ?? 210000,
    explicit: opts.explicit ?? false,
    artists: opts.artists ?? [{ id: 'a1', name: 'Artist' }],
    album: {
      release_date: opts.release_date ?? '2023-06-01',
      album_type: opts.album_type ?? 'album',
      images: [{ url: 'https://example.com/t.jpg' }],
      name: 'Album',
    },
  };
}

async function run() {
  const shortArtists = [
    mockArtist('a1', 'New Artist', ['hyperpop'], 30),
    mockArtist('a2', 'Star', ['pop'], 90),
  ];
  const longArtists = [mockArtist('a2', 'Star', ['pop'], 90)];

  const mediumTracks = [
    mockTrack('t1', 'Hit', { popularity: 85, release_date: '2024-01-01' }),
    mockTrack('t2', 'Deep Cut', { popularity: 25, release_date: '1998-03-01', duration_ms: 360000 }),
  ];

  const result = buildFullListeningAnalysis({
    shortArtists,
    mediumArtists: shortArtists,
    longArtists,
    shortTracks: mediumTracks,
    mediumTracks,
    longTracks: mediumTracks,
    recentlyPlayedItems: [
      { played_at: '2024-06-01T20:00:00.000Z', track: mediumTracks[0] },
      { played_at: '2024-06-01T21:00:00.000Z', track: mediumTracks[0] },
    ],
  });

  assert.ok(result.personality);
  assert.ok(result.primary);
  assert.ok(result.insights.length > 0);
  assert.strictEqual(result.comparison.discoveryCount, 1);
  assert.ok(result.recentlyPlayed.repeatRate > 0);
  assert.ok(result.musicDNA);
  assert.ok(result.tasteEvolution?.labelKey);
  assert.ok(result.artistMomentum);
  assert.ok(result.primary.genreFamilies?.length >= 0);
  assert.ok(result.primary.releaseTimeline?.length >= 0);

  console.log('All checks passed.');
}

run().catch((err) => {
  console.error('Check failed:', err);
  process.exit(1);
});
