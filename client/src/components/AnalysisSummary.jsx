import { useTranslatedInsights } from '../i18n/translateInsight';
import { useMetricHelpers } from '../hooks/useMetricHelpers';

export default function AnalysisSummary({ profileName, listeningAnalysis, diversity, stats }) {
  const helpers = useMetricHelpers();
  const { t, personalityName, personalityDesc, buildPlainSummary } = helpers;
  const translatedInsights = useTranslatedInsights(listeningAnalysis?.insights);

  if (!listeningAnalysis?.primary) return null;

  const summary = buildPlainSummary({ profileName, listeningAnalysis, diversity, stats });
  const topInsights = translatedInsights.slice(0, 3);

  return (
    <section id="summary" className="card analysis-summary">
      <p className="summary-greeting">{summary.greeting}</p>
      {summary.personalityKey && (
        <div className="summary-personality">
          <span className="summary-personality-type">
            🎵 {personalityName(summary.personalityKey)}
          </span>
          <p className="summary-personality-desc">
            {personalityDesc(summary.personalityKey)}
          </p>
        </div>
      )}
      <ul className="summary-bullets">
        {summary.paragraphs.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {topInsights.length > 0 && (
        <>
          <h3 className="sub-title">{t('summary.quickHighlights')}</h3>
          <div className="summary-highlights">
            {topInsights.map((insight, i) => (
              <div key={i} className="summary-highlight-item">
                <span className="insight-icon">{insight.icon}</span>
                <div>
                  <strong>{insight.title}</strong>
                  <p>{insight.text}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="summary-footnote">{t('summary.footnote')}</p>
    </section>
  );
}
