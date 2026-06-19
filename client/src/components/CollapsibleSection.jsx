import { useState } from 'react';
import HelpTip from './HelpTip';

export default function CollapsibleSection({
  id,
  title,
  description,
  hint,
  defaultOpen = true,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="collapsible-section">
      <button
        type="button"
        className="collapsible-header"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="collapsible-header-text">
          <h2 className="section-title collapsible-title">{title}</h2>
          {description && <p className="section-subtitle collapsible-desc">{description}</p>}
        </div>
        <span className="collapsible-meta">
          {hint && <HelpTip text={hint} label={`About ${title}`} />}
          <span className="collapsible-chevron" aria-hidden>{open ? '−' : '+'}</span>
        </span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </section>
  );
}
