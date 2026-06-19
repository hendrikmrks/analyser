import { useState } from 'react';
import { formatDuration } from '../api';
import { useI18n } from '../i18n/I18nProvider';
import { useMetricHelpers } from '../hooks/useMetricHelpers';
import { useTranslatedInsights } from '../i18n/translateInsight';
import MusicDNA from './MusicDNA';
import HelpTip from './HelpTip';
import ExplainedStat from './ExplainedStat';
import CollapsibleSection from './CollapsibleSection';

function InsightGrid({ insights }) {
  if (!insights?.length) return null;
  return (
    <div className="insights-grid">
      {insights.map((insight, i) => (
        <div key={i} className="insight-card">
          <span className="insight-icon">{insight.icon}</span>
          <div>
            <div className="insight-title">{insight.title}</div>
            <div className="insight-text">{insight.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, description, hint, children }) {
  return (
    <div className="card section-card">
      <div className="section-card-header">
        <div>
          <h3 className="card-title">{title}</h3>
          {description && <p className="card-desc">{description}</p>}
        </div>
        {hint && <HelpTip text={hint} label={title} />}
      </div>
      {children}
    </div>
  );
}

function BarList({
  items,
  labelKey,
  countKey,
  maxItems = 10,
  countLabel,
  t,
  helpers,
  translateKeys = false,
}) {
  if (!items?.length) {
    return <p className="empty-hint">{t('common.noData')}</p>;
  }
  const max = items[0]?.[countKey] || 1;
  return (
    <div className="genre-bars">
      {items.slice(0, maxItems).map((item) => {
        const name = translateKeys && item.key
          ? helpers.translateBucket(item.key)
          : item[labelKey];
        return (
          <div key={name} className="genre-bar-item">
            <div className="genre-bar-header">
              <span className="genre-bar-name">{name}</span>
              <span className="genre-bar-count">{item[countKey]} {countLabel}</span>
            </div>
            <div className="genre-bar-track">
              <div
                className="genre-bar-fill"
                style={{ width: `${(item[countKey] / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineChart({ timeline, t }) {
  if (!timeline?.length) return <p className="empty-hint">{t('listening.noReleaseDates')}</p>;
  const max = Math.max(...timeline.map((entry) => entry.count), 1);
  return (
    <>
      <p className="chart-caption">{t('listening.releaseTimelineCaption')}</p>
      <div className="timeline-chart">
        {timeline.map((entry) => (
          <div
            key={entry.year}
            className="timeline-bar-wrap"
            title={`${entry.year}: ${entry.count} ${t('common.tracks')}`}
          >
            <div
              className="timeline-bar-fill"
              style={{ height: `${(entry.count / max) * 100}%` }}
            />
            <span className="timeline-year">
              {entry.year % 5 === 0 || entry.count === max ? entry.year : ''}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function ExtremeCard({ icon, label, track }) {
  if (!track) return null;
  return (
    <div className="extreme-card">
      <span className="extreme-icon">{icon}</span>
      <div>
        <div className="extreme-label">{label}</div>
        <div className="extreme-track">{track.name}</div>
        <div className="extreme-artist">{track.artists}</div>
      </div>
    </div>
  );
}

function MomentumPanel({ momentum, t }) {
  if (!momentum?.climbing?.length && !momentum?.falling?.length) return null;
  return (
    <div className="grid-2">
      <SectionCard
        title={t('listening.onTheRise')}
        description={t('listening.onTheRiseDesc')}
      >
        {momentum.climbing?.length ? (
          <div className="discovery-list">
            {momentum.climbing.map((a) => (
              <div key={a.id} className="discovery-item">
                {a.image && <img src={a.image} alt="" className="artist-img" />}
                <div className="artist-info">
                  <div className="artist-name">{a.name}</div>
                  <div className="artist-genres">
                    {a.delta === 'new'
                      ? t('listening.newInFavorites')
                      : t('listening.movedUp', { count: a.delta })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-hint">{t('listening.noClimbers')}</p>
        )}
      </SectionCard>
      <SectionCard
        title={t('listening.takingBreak')}
        description={t('listening.takingBreakDesc')}
      >
        {momentum.falling?.length ? (
          <div className="discovery-list">
            {momentum.falling.map((a) => (
              <div key={a.id} className="discovery-item">
                {a.image && <img src={a.image} alt="" className="artist-img" />}
                <div className="artist-info">
                  <div className="artist-name">{a.name}</div>
                  <div className="artist-genres">
                    {t('listening.dropped', { count: Math.abs(a.delta) })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-hint">{t('listening.stillInRotation')}</p>
        )}
      </SectionCard>
    </div>
  );
}

function DiscoveryPanel({ comparison, t }) {
  if (!comparison) return null;
  return (
    <div className="grid-2">
      <SectionCard
        title={t('listening.newFaces')}
        description={t('listening.newFacesDesc')}
      >
        {comparison.newDiscoveries?.length ? (
          <div className="discovery-list">
            {comparison.newDiscoveries.map((a) => (
              <div key={a.id} className="discovery-item">
                {a.image && <img src={a.image} alt="" className="artist-img" />}
                <div className="artist-info">
                  <div className="artist-name">{a.name}</div>
                  <div className="artist-genres">
                    {(a.genres || []).slice(0, 2).join(', ') || t('listening.recentlyAdded')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-hint">{t('listening.recentMatchesUsual')}</p>
        )}
      </SectionCard>
      <SectionCard
        title={t('listening.oldFavoritesQuiet')}
        description={t('listening.oldFavoritesQuietDesc')}
      >
        {comparison.faded?.length ? (
          <div className="discovery-list">
            {comparison.faded.map((a) => (
              <div key={a.id} className="discovery-item">
                {a.image && <img src={a.image} alt="" className="artist-img" />}
                <div className="artist-info">
                  <div className="artist-name">{a.name}</div>
                  <div className="artist-genres">{(a.genres || []).slice(0, 2).join(', ')}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-hint">{t('listening.stillAllTime')}</p>
        )}
      </SectionCard>
    </div>
  );
}

function RhythmPanel({ rhythm, t, helpers }) {
  if (!rhythm) return null;
  return (
    <SectionCard
      title={t('listening.whenYouListen')}
      description={t('listening.whenYouListenDesc')}
      hint={t('listening.whenYouListenHint')}
    >
      <p className="rhythm-callout">{helpers.rhythmLabel(rhythm.rhythmKey)}</p>
      <div className="weekend-split">
        <div className="weekend-bar">
          <div className="weekend-fill weekend" style={{ width: `${rhythm.weekendPct}%` }} />
        </div>
        <div className="mode-labels">
          <span>{t('listening.weekend', { pct: rhythm.weekendPct })}</span>
          <span>{t('listening.weekday', { pct: rhythm.weekdayPct })}</span>
        </div>
      </div>
      {rhythm.bingeSessions?.length > 0 && (
        <>
          <h4 className="sub-title">{t('listening.albumDeepDives')}</h4>
          <p className="chart-caption">{t('listening.albumDeepDivesDesc')}</p>
          <div className="discovery-list">
            {rhythm.bingeSessions.map((b) => (
              <div key={b.albumId} className="discovery-item">
                {b.image && <img src={b.image} alt="" className="track-img" />}
                <div className="artist-info">
                  <div className="artist-name">{b.album}</div>
                  <div className="artist-genres">
                    {b.artist} · {t('listening.tracksInRow', { count: b.tracks.length })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}

function RecentlyPlayedPanel({ recentlyPlayed, t, helpers }) {
  if (!recentlyPlayed?.total) return null;
  const maxHour = Math.max(...recentlyPlayed.hourCounts, 1);

  return (
    <SectionCard
      title={t('listening.lastSession')}
      description={t('listening.lastSessionDesc', { count: recentlyPlayed.total })}
    >
      <div className="stats-grid audio-stats">
        <ExplainedStat
          value={recentlyPlayed.uniqueArtists}
          label={t('listening.differentArtists')}
          hint={t('listening.differentArtistsHint')}
          compact
        />
        <ExplainedStat
          value={recentlyPlayed.uniqueTracks}
          label={t('listening.differentSongs')}
          hint={t('listening.differentSongsHint')}
          compact
        />
        <ExplainedStat
          value={`${recentlyPlayed.repeatRate}%`}
          label={t('metrics.repeatRate.label')}
          hint={t('metrics.repeatRate.hint')}
          interpretation={helpers.explainRepeatRate(recentlyPlayed.repeatRate)}
          compact
        />
      </div>
      {recentlyPlayed.onRepeat?.length > 0 && (
        <>
          <h4 className="sub-title">{t('listening.albumsOnRepeat')}</h4>
          <div className="discovery-list">
            {recentlyPlayed.onRepeat.map((a) => (
              <div key={a.name} className="discovery-item">
                {a.image && <img src={a.image} alt="" className="track-img" />}
                <div className="artist-info">
                  <div className="artist-name">{a.name}</div>
                  <div className="artist-genres">
                    {a.artist} · {t('listening.albumTrackCount', { count: a.count })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <h4 className="sub-title">{t('listening.favoriteTime')}</h4>
      <p className="chart-caption">
        {recentlyPlayed.peakHour != null
          ? t('listening.listenMostAt', { hour: recentlyPlayed.peakHour })
          : t('listening.playTimesByHour')}
      </p>
      <div className="hour-chart">
        {recentlyPlayed.hourCounts.map((count, hour) => (
          <div
            key={hour}
            className="hour-bar-wrap"
            title={`${hour}:00 — ${count} ${t('common.tracks')}`}
          >
            <div
              className="hour-bar-fill"
              style={{ height: `${(count / maxHour) * 100}%` }}
            />
            <span className="hour-label">{hour % 6 === 0 ? `${hour}h` : ''}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SuperfanPanel({ superfans, albumChampions, featuredArtists, t }) {
  if (!superfans?.length && !albumChampions?.length && !featuredArtists?.length) return null;
  return (
    <div className="grid-2">
      {superfans?.length > 0 && (
        <SectionCard
          title={t('listening.superfanArtists')}
          description={t('listening.superfanArtistsDesc')}
        >
          <div className="discovery-list">
            {superfans.map((a) => (
              <div key={a.id} className="discovery-item">
                {a.image && <img src={a.image} alt="" className="artist-img" />}
                <div className="artist-info">
                  <div className="artist-name">{a.name}</div>
                  <div className="artist-genres">
                    {t('listening.songsInTop', { count: a.trackCount })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      {albumChampions?.length > 0 && (
        <SectionCard
          title={t('listening.mostPlayedAlbums')}
          description={t('listening.mostPlayedAlbumsDesc')}
        >
          <div className="discovery-list">
            {albumChampions.map((a) => (
              <div key={a.id} className="discovery-item">
                {a.image && <img src={a.image} alt="" className="track-img" />}
                <div className="artist-info">
                  <div className="artist-name">{a.name}</div>
                  <div className="artist-genres">
                    {a.artist} · {t('listening.topTracksCount', { count: a.count })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      {featuredArtists?.length > 0 && (
        <SectionCard
          title={t('listening.guestArtists')}
          description={t('listening.guestArtistsDesc')}
        >
          <div className="discovery-list">
            {featuredArtists.map((a) => (
              <div key={a.id} className="discovery-item">
                <div className="artist-info">
                  <div className="artist-name">{a.name}</div>
                  <div className="artist-genres">
                    {t('listening.featuredAppearances', { count: a.count })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function RangeAnalysis({ analysis, rangeLabel, t, helpers }) {
  const {
    metrics, genres, genreFamilies, decades, durationBuckets,
    extremes, popularityBuckets, releaseTimeline, trackVariants,
  } = analysis;

  return (
    <>
      <p className="range-intro">
        {(() => {
          const marker = '__RANGE__';
          const [before = '', after = ''] = t('listening.rangeIntro', { range: marker }).split(marker);
          return (
            <>
              {before}
              <strong>{rangeLabel}</strong>
              {after}
            </>
          );
        })()}
      </p>
      <div className="stats-grid audio-stats">
        <ExplainedStat
          value={metrics.mainstreamScore}
          label={t('metrics.mainstream.label')}
          hint={t('metrics.mainstream.hint')}
          interpretation={helpers.explainMainstream(metrics.mainstreamScore)}
          compact
        />
        <ExplainedStat
          value={`${Math.round(metrics.explicitPct * 100)}%`}
          label={t('metrics.explicit.label')}
          hint={t('metrics.explicit.hint')}
          interpretation={helpers.explainExplicit(metrics.explicitPct)}
          compact
        />
        <ExplainedStat
          value={formatDuration(metrics.avgDurationMs)}
          label={t('metrics.avgLength.label')}
          hint={t('metrics.avgLength.hint')}
          compact
        />
        <ExplainedStat
          value={metrics.artistDominance}
          label={t('metrics.artistFocus.label')}
          hint={t('metrics.artistFocus.hint')}
          interpretation={helpers.explainArtistFocus(metrics.artistDominance)}
          compact
        />
      </div>

      <div className="grid-2">
        <SectionCard
          title={t('listening.releaseTimeline')}
          description={t('listening.releaseTimelineDesc')}
        >
          <TimelineChart timeline={releaseTimeline} t={t} />
        </SectionCard>
        <SectionCard
          title={t('listening.hitVsGem')}
          description={t('listening.hitVsGemDesc')}
        >
          <BarList
            items={popularityBuckets}
            labelKey="label"
            countKey="count"
            countLabel={t('common.tracks')}
            t={t}
            helpers={helpers}
            translateKeys
          />
        </SectionCard>
      </div>

      <div className="grid-2">
        <SectionCard
          title={t('listening.broadStyles')}
          description={t('listening.broadStylesDesc')}
        >
          <BarList
            items={genreFamilies}
            labelKey="family"
            countKey="count"
            countLabel={t('common.tags')}
            t={t}
            helpers={helpers}
          />
        </SectionCard>
        <SectionCard
          title={t('listening.favoriteDecades')}
          description={t('listening.favoriteDecadesDesc')}
        >
          <BarList
            items={decades}
            labelKey="decade"
            countKey="count"
            countLabel={t('common.tracks')}
            t={t}
            helpers={helpers}
          />
        </SectionCard>
      </div>

      <div className="grid-2">
        <SectionCard
          title={t('listening.songLength')}
          description={t('listening.songLengthDesc')}
        >
          <BarList
            items={durationBuckets}
            labelKey="label"
            countKey="count"
            countLabel={t('common.tracks')}
            t={t}
            helpers={helpers}
            translateKeys
          />
        </SectionCard>
        <SectionCard
          title={t('listening.specificGenres')}
          description={t('listening.specificGenresDesc')}
        >
          <BarList
            items={genres}
            labelKey="genre"
            countKey="count"
            countLabel={t('common.artists')}
            t={t}
            helpers={helpers}
          />
        </SectionCard>
      </div>

      {trackVariants?.length > 0 && (
        <SectionCard
          title={t('listening.specialVersions')}
          description={t('listening.specialVersionsDesc')}
        >
          <div className="variant-tags">
            {trackVariants.map((v) => (
              <span key={v.key} className="variant-tag">
                {helpers.translateBucket(v.key)} ({v.count})
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      <SuperfanPanel
        superfans={analysis.superfans}
        albumChampions={analysis.albumChampions}
        featuredArtists={analysis.featuredArtists}
        t={t}
      />

      <SectionCard
        title={t('listening.standoutTracks')}
        description={t('listening.standoutTracksDesc')}
      >
        <div className="extremes-grid">
          <ExtremeCard icon="🔥" label={t('listening.biggestHit')} track={extremes.mostPopular} />
          <ExtremeCard icon="💎" label={t('listening.mostUnderground')} track={extremes.leastPopular} />
          <ExtremeCard icon="⏱️" label={t('listening.longestSong')} track={extremes.longest} />
          <ExtremeCard icon="⚡" label={t('listening.shortestSong')} track={extremes.shortest} />
          <ExtremeCard icon="📼" label={t('listening.oldestRelease')} track={extremes.oldest} />
          <ExtremeCard icon="🆕" label={t('listening.newestRelease')} track={extremes.newest} />
        </div>
      </SectionCard>
    </>
  );
}

export default function ListeningDeepDive({ listeningAnalysis, profileName }) {
  const { t } = useI18n();
  const helpers = useMetricHelpers();
  const translatedInsights = useTranslatedInsights(listeningAnalysis?.insights);
  const [range, setRange] = useState('medium');

  const RANGE_OPTIONS = [
    { key: 'short', label: t('ranges.short'), desc: t('ranges.shortDesc') },
    { key: 'medium', label: t('ranges.medium'), desc: t('ranges.mediumDesc') },
    { key: 'long', label: t('ranges.long'), desc: t('ranges.longDesc') },
  ];

  if (!listeningAnalysis?.primary) {
    return (
      <div className="card audio-unavailable">
        <h2 className="section-title">{t('nav.analysis')}</h2>
        <p>{t('listening.unavailable')}</p>
      </div>
    );
  }

  const analysis = listeningAnalysis.byTimeRange?.[range] || listeningAnalysis.primary;
  const activeRange = RANGE_OPTIONS.find((r) => r.key === range) || RANGE_OPTIONS[1];
  const te = listeningAnalysis.tasteEvolution;

  return (
    <div id="analysis" className="audio-deep-dive">
      <MusicDNA dna={listeningAnalysis.musicDNA} profileName={profileName} />

      <CollapsibleSection
        title={t('listening.allInsights')}
        description={t('listening.allInsightsDesc')}
        hint={t('listening.allInsightsHint')}
        defaultOpen
      >
        <InsightGrid insights={translatedInsights} />
      </CollapsibleSection>

      <div className="stats-grid key-stats">
        <ExplainedStat
          value={`${listeningAnalysis.comparison.loyalty}%`}
          label={t('metrics.loyalty.label')}
          hint={t('metrics.loyalty.hint')}
          interpretation={helpers.explainLoyalty(listeningAnalysis.comparison.loyalty)}
        />
        <ExplainedStat
          value={listeningAnalysis.comparison.discoveryCount}
          label={t('metrics.discoveries.label')}
          hint={t('metrics.discoveries.hint')}
          interpretation={helpers.explainDiscoveries(listeningAnalysis.comparison.discoveryCount)}
        />
        <ExplainedStat
          value={`${Math.round(listeningAnalysis.metrics.freshnessPct * 100)}%`}
          label={t('metrics.freshness.label')}
          hint={t('metrics.freshness.hint')}
          interpretation={helpers.explainFreshness(
            Math.round(listeningAnalysis.metrics.freshnessPct * 100)
          )}
        />
        <ExplainedStat
          value={listeningAnalysis.metrics.artistDominance ?? 0}
          label={t('metrics.artistFocus.label')}
          hint={t('metrics.artistFocus.hint')}
          interpretation={helpers.explainArtistFocus(
            listeningAnalysis.metrics.artistDominance ?? 0
          )}
        />
      </div>

      <CollapsibleSection
        id="changes"
        title={t('sections.changesTitle')}
        description={t('sections.changesDesc')}
        defaultOpen
      >
        {te && (
          <div className="evolution-banner">
            <strong>{helpers.tasteEvolutionLabel(te.labelKey)}</strong>
            <span>
              {helpers.tasteEvolutionExplain(te.labelKey)}
              {' '}
              {t('listening.evolutionGenreDiff', { pct: te.genreShift })}
            </span>
          </div>
        )}
        <MomentumPanel momentum={listeningAnalysis.artistMomentum} t={t} />
        <DiscoveryPanel comparison={listeningAnalysis.comparison} t={t} />
      </CollapsibleSection>

      <CollapsibleSection
        id="habits"
        title={t('sections.habitsTitle')}
        description={t('sections.habitsDesc')}
        defaultOpen
      >
        <RhythmPanel rhythm={listeningAnalysis.listeningRhythm} t={t} helpers={helpers} />
        <RecentlyPlayedPanel
          recentlyPlayed={listeningAnalysis.recentlyPlayed}
          t={t}
          helpers={helpers}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="breakdown"
        title={t('sections.breakdownTitle')}
        description={t('sections.breakdownDesc')}
        defaultOpen={false}
      >
        <div className="range-picker">
          <p className="range-picker-label">{t('listening.chooseWindow')}</p>
          <div className="tabs audio-tabs">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`tab ${range === option.key ? 'active' : ''}`}
                onClick={() => setRange(option.key)}
                title={option.desc}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="range-picker-desc">{activeRange.desc}</p>
        </div>

        {analysis ? (
          <RangeAnalysis
            analysis={analysis}
            rangeLabel={activeRange.label}
            t={t}
            helpers={helpers}
          />
        ) : (
          <p className="empty-hint">{t('listening.noRangeData')}</p>
        )}
      </CollapsibleSection>
    </div>
  );
}
