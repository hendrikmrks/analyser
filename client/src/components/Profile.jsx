import { useState } from 'react';
import { formatDuration } from '../api';
import { useI18n } from '../i18n/I18nProvider';
import { useMetricHelpers } from '../hooks/useMetricHelpers';
import ListeningDeepDive from './ListeningDeepDive';
import ShareCard from './ShareCard';
import FriendCompare from './FriendCompare';
import AnalysisSummary from './AnalysisSummary';
import ExplainedStat from './ExplainedStat';
import PageNav from './PageNav';
import HelpTip from './HelpTip';
import LanguageSelect from './LanguageSelect';

function DiversityRing({ score, interpretation }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="diversity-ring-wrap">
      <div className="diversity-ring">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <defs>
            <linearGradient id="diversityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1db954" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <circle className="diversity-ring-bg" cx="70" cy="70" r={radius} />
          <circle
            className="diversity-ring-fill"
            cx="70"
            cy="70"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="diversity-score">{score}</div>
      </div>
      {interpretation && <p className="diversity-interpretation">{interpretation}</p>}
    </div>
  );
}

function ArtistList({ artists = [], t }) {
  return (
    <div className="artist-list">
      {artists.slice(0, 10).map((artist, i) => (
        <div key={artist.id} className="artist-item">
          <span className="artist-rank">{i + 1}</span>
          {artist.images?.[0] && (
            <img src={artist.images[0].url} alt="" className="artist-img" />
          )}
          <div className="artist-info">
            <div className="artist-name">{artist.name}</div>
            <div className="artist-genres">
              {(artist.genres || []).slice(0, 2).join(', ') || t('profile.genreUnavailable')}
            </div>
          </div>
          <div
            className="popularity-bar"
            title={t('profile.popularityTitle', { score: artist.popularity })}
          >
            <div className="popularity-fill" style={{ width: `${artist.popularity}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackList({ tracks = [], t }) {
  return (
    <div className="track-list">
      {tracks.slice(0, 10).map((track, i) => (
        <div key={track.id} className="track-item">
          <span className="artist-rank">{i + 1}</span>
          {track.album?.images?.[0] && (
            <img src={track.album.images[0].url} alt="" className="track-img" />
          )}
          <div className="track-info">
            <div className="track-name">{track.name}</div>
            <div className="track-artist">
              {track.artists?.map((a) => a.name).join(', ') || t('charts.unknownArtist')}
            </div>
          </div>
          <span className="track-duration">{formatDuration(track.duration_ms)}</span>
        </div>
      ))}
    </div>
  );
}

function GenreBars({ genres, t }) {
  const max = genres[0]?.count || 1;
  return (
    <div className="genre-bars">
      {genres.slice(0, 10).map((g) => (
        <div key={g.genre} className="genre-bar-item">
          <div className="genre-bar-header">
            <span className="genre-bar-name">{g.genre}</span>
            <span className="genre-bar-count">{g.count} {t('common.artists')}</span>
          </div>
          <div className="genre-bar-track">
            <div className="genre-bar-fill" style={{ width: `${(g.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Profile({ data, onLogout, initialCompareCode = '' }) {
  const { t } = useI18n();
  const {
    personalityName,
    personalityDesc,
    explainDiversity,
    explainMainstream,
    explainLoyalty,
  } = useMetricHelpers();
  const [artistRange, setArtistRange] = useState('medium');
  const [trackRange, setTrackRange] = useState('medium');
  const {
    profile,
    topArtists,
    topTracks,
    genres,
    listeningAnalysis,
    diversity,
    stats,
  } = data;

  const personalityKey = listeningAnalysis?.personality;

  const initials = (profile.displayName || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const rangeTabs = [
    { key: 'short', label: t('ranges.short') },
    { key: 'medium', label: t('ranges.medium') },
    { key: 'long', label: t('ranges.long') },
  ];

  return (
    <div className="profile-page">
      <nav className="navbar">
        <div className="navbar-brand">{t('common.appName')}</div>
        <div className="navbar-actions">
          <LanguageSelect />
          <button className="btn-ghost" onClick={onLogout}>
            {t('common.logout')}
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-inner">
          {profile.image ? (
            <img src={profile.image} alt="" className="hero-avatar" />
          ) : (
            <div className="hero-avatar-placeholder">{initials}</div>
          )}
          <div className="hero-info">
            <h1>{profile.displayName || t('common.spotifyUser')}</h1>
            <div className="hero-meta">
              {profile.country && <span>🌍 {profile.country}</span>}
              <span>👥 {t('profile.followers', { count: profile.followers.toLocaleString() })}</span>
              <span>💎 {profile.product === 'premium' ? t('profile.premium') : t('profile.free')}</span>
            </div>
            {personalityKey && (
              <>
                <div className="personality-badge">🎵 {personalityName(personalityKey)}</div>
                <p className="personality-desc">{personalityDesc(personalityKey)}</p>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="content">
        <PageNav />

        <AnalysisSummary
          profileName={profile.displayName}
          listeningAnalysis={listeningAnalysis}
          diversity={diversity}
          stats={stats}
        />

        <div className="at-a-glance">
          <h2 className="at-a-glance-title">
            {t('summary.atAGlance')}
            <HelpTip text={t('summary.atAGlanceHint')} />
          </h2>
          <div className="stats-grid">
            <ExplainedStat
              value={diversity.score}
              label={t('metrics.diversity.label')}
              hint={t('metrics.diversity.hint')}
              interpretation={explainDiversity(diversity.score)}
            />
            <ExplainedStat
              value={stats.avgTrackPopularity}
              label={t('metrics.mainstream.label')}
              hint={t('metrics.mainstream.hint')}
              interpretation={explainMainstream(stats.avgTrackPopularity)}
            />
            <ExplainedStat
              value={`${stats.loyaltyPct}%`}
              label={t('metrics.loyalty.label')}
              hint={t('metrics.loyalty.hint')}
              interpretation={explainLoyalty(stats.loyaltyPct)}
            />
            <ExplainedStat
              value={stats.analyzedTracks}
              label={t('metrics.tracksAnalyzed.label')}
              hint={t('metrics.tracksAnalyzed.hint')}
              interpretation={t('metrics.tracksAnalyzed.explain')}
            />
          </div>
        </div>

        <ListeningDeepDive
          listeningAnalysis={listeningAnalysis}
          profileName={profile.displayName}
        />

        <section id="charts" className="charts-section">
          <h2 className="section-title">{t('sections.chartsTitle')}</h2>
          <p className="section-subtitle">{t('sections.chartsDesc')}</p>

          <div className="grid-2">
            <div className="card">
              <h3 className="card-title">{t('charts.topArtists')}</h3>
              <p className="card-desc">{t('charts.topArtistsDesc')}</p>
              <div className="tabs">
                {rangeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`tab ${artistRange === tab.key ? 'active' : ''}`}
                    onClick={() => setArtistRange(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <ArtistList artists={topArtists[artistRange] || []} t={t} />
            </div>

            <div className="card">
              <h3 className="card-title">{t('charts.topTracks')}</h3>
              <p className="card-desc">{t('charts.topTracksDesc')}</p>
              <div className="tabs">
                {rangeTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`tab ${trackRange === tab.key ? 'active' : ''}`}
                    onClick={() => setTrackRange(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <TrackList tracks={topTracks[trackRange] || topTracks.medium || []} t={t} />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">{t('profile.genreBreakdown')}</h3>
            <p className="card-desc">{t('profile.genreBreakdownDesc')}</p>
            {genres.length > 0 ? (
              <GenreBars genres={genres} t={t} />
            ) : (
              <p className="empty-hint">{t('profile.noGenres')}</p>
            )}
          </div>

          <div className="card diversity-card">
            <DiversityRing
              score={diversity.score}
              interpretation={explainDiversity(diversity.score)}
            />
            <div className="diversity-copy">
              <h3 className="card-title">{t('profile.diversityScore')}</h3>
              <p className="diversity-label">{t('metrics.diversity.hint')}</p>
            </div>
          </div>
        </section>

        <section id="share" className="share-compare-section">
          <ShareCard
            profile={profile}
            listeningAnalysis={listeningAnalysis}
            diversity={diversity}
            stats={stats}
            genres={genres}
            topArtists={topArtists}
          />
          <FriendCompare
            profile={profile}
            listeningAnalysis={listeningAnalysis}
            diversity={diversity}
            stats={stats}
            genres={genres}
            topArtists={topArtists}
            initialCode={initialCompareCode}
          />
        </section>
      </div>
    </div>
  );
}
