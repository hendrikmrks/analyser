import { useI18n } from '../i18n/I18nProvider';
import { useMetricHelpers } from '../hooks/useMetricHelpers';

export function translateInsight(insight, t, helpers) {
  if (!insight) return null;
  if (insight.title && insight.text) {
    return { icon: insight.icon, title: insight.title, text: insight.text };
  }
  if (!insight.id) return null;

  const params = { ...(insight.params || {}) };

  if (params.personalityKey) {
    params.personality = helpers.personalityName(params.personalityKey);
    params.description = helpers.personalityDesc(params.personalityKey);
  }
  if (params.labelKey) {
    params.label = helpers.tasteEvolutionLabel(params.labelKey);
  }

  return {
    icon: insight.icon,
    title: t(`insights.${insight.id}.title`, params),
    text: t(`insights.${insight.id}.text`, params),
  };
}

export function translateInsights(insights, t, helpers) {
  return (insights || [])
    .map((insight) => translateInsight(insight, t, helpers))
    .filter(Boolean);
}

export function useTranslatedInsights(insights) {
  const { t } = useI18n();
  const helpers = useMetricHelpers();
  return translateInsights(insights, t, helpers);
}
