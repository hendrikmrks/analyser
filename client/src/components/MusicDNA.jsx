import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { useMetricHelpers } from '../hooks/useMetricHelpers';
import HelpTip from './HelpTip';

const HIGHLIGHT_KEYS = new Set([
  'listeningType',
  'topGenreFamily',
  'mainstreamScore',
  'diversity',
  'artistLoyalty',
  'newDiscoveries',
]);

function DnaTile({ tile, dna, t, helpers }) {
  const hintKey = `dna.tiles.${tile.key}`;
  const label = t(hintKey);

  function explain() {
    switch (tile.key) {
      case 'listeningType':
        return helpers.personalityDesc(dna.personality);
      case 'topGenreFamily':
        return dna.topGenreFamily
          ? t('dna.genreFamilyExplain', { family: dna.topGenreFamily })
          : t('dna.genreFamilyMixed');
      case 'mainstreamScore':
        return helpers.explainMainstream(dna.mainstreamScore);
      case 'diversity':
        return helpers.explainDiversity(Number(dna.diversityScore) || 0);
      case 'artistLoyalty':
        return helpers.explainLoyalty(dna.loyalty);
      case 'newDiscoveries':
        return helpers.explainDiscoveries(dna.discoveries);
      case 'tasteEvolution':
        return helpers.tasteEvolutionExplain(dna.evolution);
      case 'listeningRhythm':
        return dna.rhythm ? helpers.rhythmLabel(dna.rhythm) : t('dna.rhythmFallback');
      case 'artistFocus':
        return helpers.explainArtistFocus(dna.dominance);
      case 'freshReleases':
        return helpers.explainFreshness(dna.freshnessPct);
      case 'catalogAge':
        return helpers.explainCatalogAge(dna.catalogAge);
      default:
        return '';
    }
  }

  const hints = {
    listeningType: t('personalityDesc.fallback'),
    topGenreFamily: t('listening.broadStylesDesc'),
    mainstreamScore: t('metrics.mainstream.hint'),
    diversity: t('metrics.diversity.hint'),
    artistLoyalty: t('metrics.loyalty.hint'),
    newDiscoveries: t('metrics.discoveries.hint'),
    tasteEvolution: t('metrics.tasteEvolution.hint'),
    listeningRhythm: t('listening.whenYouListenHint'),
    artistFocus: t('metrics.artistFocus.hint'),
    freshReleases: t('metrics.freshness.hint'),
    catalogAge: t('metrics.catalogAge.hint'),
  };

  return (
    <div className="dna-tile">
      <span className="dna-tile-icon">{tile.icon}</span>
      <div className="dna-tile-value">{tile.display}</div>
      <div className="dna-tile-label-row">
        <span className="dna-tile-label">{label}</span>
        <HelpTip text={hints[tile.key] || label} label={label} />
      </div>
      <p className="dna-tile-hint">{explain()}</p>
    </div>
  );
}

export default function MusicDNA({ dna }) {
  const { t } = useI18n();
  const helpers = useMetricHelpers();
  const [showAll, setShowAll] = useState(false);
  if (!dna) return null;

  const tiles = [
    { key: 'listeningType', display: helpers.personalityName(dna.personality), icon: '🎭' },
    { key: 'topGenreFamily', display: dna.topGenreFamily || t('dna.mixedShort'), icon: '🎸' },
    { key: 'mainstreamScore', display: `${dna.mainstreamScore}/100`, icon: '📻' },
    { key: 'diversity', display: dna.diversityScore, icon: '🌈' },
    { key: 'artistLoyalty', display: `${dna.loyalty}%`, icon: '🔁' },
    { key: 'newDiscoveries', display: dna.discoveries, icon: '🔭' },
    {
      key: 'tasteEvolution',
      display: helpers.tasteEvolutionLabel(dna.evolution),
      icon: '🧬',
    },
    {
      key: 'listeningRhythm',
      display: dna.rhythm ? helpers.rhythmLabel(dna.rhythm) : '—',
      icon: '🕐',
    },
    { key: 'artistFocus', display: `${dna.dominance}/100`, icon: '🎯' },
    { key: 'freshReleases', display: `${dna.freshnessPct}%`, icon: '🆕' },
    {
      key: 'catalogAge',
      display: `${dna.catalogAge}${t('dna.catalogSuffix')}`,
      icon: '📼',
    },
  ];

  const highlights = tiles.filter((tile) => HIGHLIGHT_KEYS.has(tile.key));
  const extras = tiles.filter((tile) => !HIGHLIGHT_KEYS.has(tile.key));

  return (
    <div className="card music-dna-card">
      <h2 className="section-title">{t('dna.title')}</h2>
      <p className="section-subtitle">{t('dna.subtitle')}</p>
      <div className="dna-grid">
        {highlights.map((tile) => (
          <DnaTile key={tile.key} tile={tile} dna={dna} t={t} helpers={helpers} />
        ))}
      </div>
      {extras.length > 0 && (
        <>
          <button type="button" className="dna-toggle" onClick={() => setShowAll((v) => !v)}>
            {showAll ? t('dna.showFewer') : t('dna.showMore', { count: extras.length })}
          </button>
          {showAll && (
            <div className="dna-grid dna-grid-extra">
              {extras.map((tile) => (
                <DnaTile key={tile.key} tile={tile} dna={dna} t={t} helpers={helpers} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
