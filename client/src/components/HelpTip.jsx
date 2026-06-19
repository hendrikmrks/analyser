import { useId, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';

export default function HelpTip({ text, label }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const id = useId();
  const ariaLabel = label || t('common.moreInfo');

  return (
    <span className="help-tip-wrap">
      <button
        type="button"
        className="help-tip-btn"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open && (
        <span id={id} role="tooltip" className="help-tip-popover">
          {text}
        </span>
      )}
    </span>
  );
}
