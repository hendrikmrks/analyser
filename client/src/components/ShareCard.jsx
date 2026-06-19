import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useMetricHelpers } from '../hooks/useMetricHelpers';
import {
  buildSharePayload,
  encodeShareCode,
  buildShareText,
  downloadShareImage,
} from '../utils/shareProfile';

function ShareCardPreview({ payload, initials, imageUrl, t, personalityName }) {
  return (
    <div className="share-card-preview">
      <div className="share-card-glow" />
      <div className="share-card-inner">
        <div className="share-card-brand">{t('common.appName')}</div>
        <div className="share-card-header">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="share-card-avatar" crossOrigin="anonymous" />
          ) : (
            <div className="share-card-avatar-placeholder">{initials}</div>
          )}
          <div>
            <div className="share-card-name">{payload.name}</div>
            {payload.personality && (
              <div className="share-card-personality">
                🎵 {personalityName(payload.personality)}
              </div>
            )}
          </div>
        </div>
        <div className="share-card-stats">
          {[
            [t('metrics.diversity.label'), payload.diversity],
            [t('metrics.mainstream.label'), payload.mainstream],
            [t('metrics.loyalty.label'), `${payload.loyalty}%`],
            [t('metrics.freshness.label'), `${payload.freshness}%`],
            [t('metrics.artistFocus.label'), payload.artistDominance],
            [t('metrics.discoveries.label'), payload.discoveryCount],
          ].map(([label, value]) => (
            <div key={label} className="share-stat">
              <span className="share-stat-label">{label}</span>
              <span className="share-stat-value">{value}</span>
            </div>
          ))}
        </div>
        {payload.topGenreFamily && (
          <div className="share-card-footer">
            <span className="share-stat-label">{t('dna.tiles.topGenreFamily')}</span>
            <span className="share-genre-family">{payload.topGenreFamily}</span>
          </div>
        )}
        {payload.topArtists?.length > 0 && (
          <div className="share-card-artists">
            {payload.topArtists.slice(0, 5).join(' · ')}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShareCard({ profile, listeningAnalysis, diversity, stats, genres, topArtists }) {
  const { t } = useI18n();
  const { personalityName } = useMetricHelpers();
  const [copied, setCopied] = useState(null);
  const payload = buildSharePayload({
    profile,
    listeningAnalysis,
    diversity,
    stats,
    genres,
    topArtists,
  });
  const shareCode = encodeShareCode(payload);
  const codeRef = useRef(null);

  const initials = (profile.displayName || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function copyText(text, kind) {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleShare() {
    const text = buildShareText(payload, t, personalityName);
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('share.shareTextTitle', { name: payload.name }),
          text,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copyText(text, 'share');
  }

  return (
    <div className="card share-section">
      <h2 className="section-title">{t('share.title')}</h2>
      <p className="section-subtitle">{t('share.subtitle')}</p>

      <ShareCardPreview
        payload={payload}
        initials={initials}
        imageUrl={profile.image}
        t={t}
        personalityName={personalityName}
      />

      <div className="share-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => downloadShareImage(payload, initials)}
        >
          {t('share.downloadPng')}
        </button>
        <button type="button" className="btn-secondary" onClick={handleShare}>
          {copied === 'share' ? t('share.copied') : t('share.shareSummary')}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const url = `${window.location.origin}${window.location.pathname}?compare=${encodeURIComponent(shareCode)}`;
            copyText(url, 'link');
          }}
        >
          {copied === 'link' ? t('share.linkCopied') : t('share.copyLink')}
        </button>
        <button type="button" className="btn-secondary" onClick={() => copyText(shareCode, 'code')}>
          {copied === 'code' ? t('share.codeCopied') : t('share.copyCode')}
        </button>
      </div>

      <div className="share-code-box">
        <label className="share-code-label">{t('share.yourCode')}</label>
        <textarea
          ref={codeRef}
          readOnly
          className="share-code-input"
          value={shareCode}
          rows={3}
          onFocus={(e) => e.target.select()}
        />
        <p className="share-code-hint">{t('share.codeHint')}</p>
      </div>
    </div>
  );
}
