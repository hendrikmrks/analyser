import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useMetricHelpers } from '../hooks/useMetricHelpers';
import {
  buildSharePayload,
  decodeShareCode,
  compareProfiles,
  encodeShareCode,
} from '../utils/shareProfile';

function CompareBar({ label, self, friend, selfName, friendName, max = 100 }) {
  const selfPct = Math.min(100, Math.round((self / max) * 100));
  const friendPct = Math.min(100, Math.round((friend / max) * 100));

  return (
    <div className="compare-bar-item">
      <div className="compare-bar-label">{label}</div>
      <div className="compare-bar-row">
        <span className="compare-name compare-name-self">{selfName.split(' ')[0]}</span>
        <div className="compare-bar-track">
          <div className="compare-bar-self" style={{ width: `${selfPct}%` }} />
        </div>
        <span className="compare-value">{self}</span>
      </div>
      <div className="compare-bar-row">
        <span className="compare-name compare-name-friend">{friendName.split(' ')[0]}</span>
        <div className="compare-bar-track">
          <div className="compare-bar-friend" style={{ width: `${friendPct}%` }} />
        </div>
        <span className="compare-value">{friend}</span>
      </div>
    </div>
  );
}

function CompatibilityRing({ score, label }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="compat-ring-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <defs>
          <linearGradient id="compatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1db954" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <circle className="compat-ring-bg" cx="65" cy="65" r={radius} />
        <circle
          className="compat-ring-fill"
          cx="65"
          cy="65"
          r={radius}
          stroke="url(#compatGradient)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="compat-score">{score}%</div>
      <div className="compat-label">{label}</div>
    </div>
  );
}

export default function FriendCompare({
  profile,
  listeningAnalysis,
  diversity,
  stats,
  genres,
  topArtists,
  initialCode = '',
}) {
  const { t } = useI18n();
  const { personalityName } = useMetricHelpers();
  const [code, setCode] = useState(initialCode);
  const [friend, setFriend] = useState(null);
  const [error, setError] = useState(null);

  const self = buildSharePayload({
    profile,
    listeningAnalysis,
    diversity,
    stats,
    genres,
    topArtists,
  });

  useEffect(() => {
    if (initialCode) tryCompare(initialCode);
  }, [initialCode]);

  function tryCompare(inputCode) {
    setError(null);
    try {
      const trimmed = (inputCode || '').trim();
      if (trimmed === encodeShareCode(self)) {
        setError(t('compare.ownCode'));
        setFriend(null);
        return;
      }
      const decoded = decodeShareCode(trimmed, t);
      setFriend(decoded);
      setCode(trimmed);
    } catch (err) {
      setError(err.message);
      setFriend(null);
    }
  }

  const comparison = friend ? compareProfiles(self, friend, t, personalityName) : null;

  return (
    <div className="card compare-section">
      <h2 className="section-title">{t('compare.title')}</h2>
      <p className="section-subtitle">{t('compare.subtitle')}</p>

      <div className="compare-input-row">
        <textarea
          className="share-code-input"
          placeholder={t('compare.placeholder')}
          value={code}
          rows={3}
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="button" className="btn-primary compare-btn" onClick={() => tryCompare(code)}>
          {t('compare.button')}
        </button>
      </div>

      {error && <p className="compare-error">{error}</p>}

      {comparison && friend && (
        <div className="compare-results">
          <div className="compare-header">
            <CompatibilityRing score={comparison.compatibility} label={t('compare.compatibility')} />
            <div className="compare-names">
              <div className="compare-vs">
                <span className="compare-pill compare-pill-self">{self.name}</span>
                <span className="compare-vs-text">{t('compare.vs')}</span>
                <span className="compare-pill compare-pill-friend">{friend.name}</span>
              </div>
              <div className="compare-overlap-stats">
                <span>{t('compare.genreOverlap', { pct: comparison.genreOverlap })}</span>
                <span>{t('compare.artistOverlap', { pct: comparison.artistOverlap })}</span>
              </div>
            </div>
          </div>

          <div className="compare-insights">
            {comparison.insights.map((item, i) => (
              <div key={i} className="insight-card compare-insight">
                <span className="insight-icon">{item.icon}</span>
                <div className="insight-text">{item.text}</div>
              </div>
            ))}
          </div>

          <h3 className="sub-title">{t('compare.metricBreakdown')}</h3>
          <div className="compare-bars">
            {comparison.metrics.map((m) => (
              <CompareBar
                key={m.key}
                label={m.label}
                self={m.self}
                friend={m.friend}
                selfName={self.name}
                friendName={friend.name}
              />
            ))}
          </div>

          {(comparison.sharedGenres.length > 0 || comparison.sharedArtists.length > 0) && (
            <div className="grid-2 compare-shared">
              {comparison.sharedGenres.length > 0 && (
                <div>
                  <h4 className="sub-title">{t('compare.sharedGenres')}</h4>
                  <div className="variant-tags">
                    {comparison.sharedGenres.map((g) => (
                      <span key={g} className="variant-tag">{g}</span>
                    ))}
                  </div>
                </div>
              )}
              {comparison.sharedArtists.length > 0 && (
                <div>
                  <h4 className="sub-title">{t('compare.sharedArtists')}</h4>
                  <div className="variant-tags">
                    {comparison.sharedArtists.map((a) => (
                      <span key={a} className="variant-tag variant-tag-artist">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
