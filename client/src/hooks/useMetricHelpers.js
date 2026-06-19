import { useI18n } from '../i18n/I18nProvider';

export function useMetricHelpers() {
  const { t } = useI18n();

  function personalityName(key) {
    return t(`personality.${key}`) || t('personality.fallback');
  }

  function personalityDesc(key) {
    return t(`personalityDesc.${key}`) || t('personalityDesc.fallback');
  }

  function tasteEvolutionLabel(key) {
    return t(`tasteEvolution.${key}`) || key;
  }

  function tasteEvolutionExplain(key) {
    const map = {
      steadyTaste: 'explainSteadyTaste',
      majorEvolution: 'explainMajorEvolution',
      evolvingPalette: 'explainEvolvingPalette',
      rockSolidIdentity: 'explainRockSolidIdentity',
    };
    return t(`tasteEvolution.${map[key] || 'explainFallback'}`);
  }

  function rhythmLabel(key) {
    return key ? t(`rhythm.${key}`) : null;
  }

  function explainDiversity(score) {
    if (score >= 75) return t('metrics.diversity.veryHigh');
    if (score >= 50) return t('metrics.diversity.high');
    if (score >= 30) return t('metrics.diversity.mid');
    return t('metrics.diversity.low');
  }

  function explainMainstream(score) {
    if (score >= 75) return t('metrics.mainstream.veryHigh');
    if (score >= 50) return t('metrics.mainstream.high');
    if (score >= 30) return t('metrics.mainstream.mid');
    return t('metrics.mainstream.low');
  }

  function explainLoyalty(pct) {
    if (pct >= 75) return t('metrics.loyalty.veryHigh');
    if (pct >= 50) return t('metrics.loyalty.high');
    return t('metrics.loyalty.low');
  }

  function explainDiscoveries(count) {
    if (count >= 8) return t('metrics.discoveries.many');
    if (count >= 3) return t('metrics.discoveries.some');
    if (count >= 1) return t('metrics.discoveries.few');
    return t('metrics.discoveries.none');
  }

  function explainFreshness(pct) {
    if (pct >= 50) return t('metrics.freshness.high');
    if (pct >= 25) return t('metrics.freshness.mid');
    return t('metrics.freshness.low');
  }

  function explainArtistFocus(score) {
    if (score >= 70) return t('metrics.artistFocus.high');
    if (score >= 40) return t('metrics.artistFocus.mid');
    return t('metrics.artistFocus.low');
  }

  function explainCatalogAge(years) {
    if (years >= 15) return t('metrics.catalogAge.old');
    if (years >= 8) return t('metrics.catalogAge.mid');
    return t('metrics.catalogAge.new');
  }

  function explainRepeatRate(pct) {
    if (pct >= 50) return t('metrics.repeatRate.high');
    if (pct >= 25) return t('metrics.repeatRate.mid');
    return t('metrics.repeatRate.low');
  }

  function explainExplicit(pct) {
    return pct >= 0.4 ? t('metrics.explicit.high') : t('metrics.explicit.low');
  }

  function translateBucket(key) {
    return t(`buckets.${key}`) || key;
  }

  function buildPlainSummary({ profileName, listeningAnalysis, diversity, stats }) {
    const firstName = (profileName || t('common.you')).split(' ')[0];
    const pKey = listeningAnalysis?.personality;
    const lines = [];

    if (pKey) lines.push(personalityDesc(pKey));
    lines.push(explainMainstream(stats.avgTrackPopularity ?? 0));
    lines.push(explainDiversity(diversity?.score ?? 0));
    if (stats.tasteEvolution) {
      lines.push(tasteEvolutionExplain(stats.tasteEvolution));
    }

    return {
      greeting: t('summary.greeting', { name: firstName }),
      personalityKey: pKey,
      paragraphs: lines.filter(Boolean),
    };
  }

  return {
    t,
    personalityName,
    personalityDesc,
    tasteEvolutionLabel,
    tasteEvolutionExplain,
    rhythmLabel,
    explainDiversity,
    explainMainstream,
    explainLoyalty,
    explainDiscoveries,
    explainFreshness,
    explainArtistFocus,
    explainCatalogAge,
    explainRepeatRate,
    explainExplicit,
    translateBucket,
    buildPlainSummary,
  };
}
