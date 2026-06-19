import { LOCALES, useI18n } from '../i18n/I18nProvider';

export default function LanguageSelect({ className = '' }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className={`language-select ${className}`}>
      <span className="sr-only">{t('common.language')}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        aria-label={t('common.language')}
      >
        {LOCALES.map((loc) => (
          <option key={loc.code} value={loc.code}>
            {loc.label}
          </option>
        ))}
      </select>
    </label>
  );
}
