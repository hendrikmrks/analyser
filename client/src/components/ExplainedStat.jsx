import HelpTip from './HelpTip';

export default function ExplainedStat({ value, label, hint, interpretation, compact }) {
  return (
    <div className={`stat-card explained-stat ${compact ? 'explained-stat-compact' : ''}`}>
      <div className="explained-stat-top">
        <div className={`stat-value ${String(value).length > 8 ? 'stat-value-sm' : ''}`}>{value}</div>
        <div className="stat-label-row">
          <span className="stat-label">{label}</span>
          {hint && <HelpTip text={hint} label={`About ${label}`} />}
        </div>
      </div>
      {interpretation && <p className="stat-interpretation">{interpretation}</p>}
    </div>
  );
}
