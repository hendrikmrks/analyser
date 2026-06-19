import { useI18n } from '../i18n/I18nProvider';

export default function PageNav() {
  const { t } = useI18n();

  const links = [
    { id: 'summary', label: t('nav.summary') },
    { id: 'analysis', label: t('nav.analysis') },
    { id: 'charts', label: t('nav.charts') },
    { id: 'share', label: t('nav.share') },
  ];

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="page-nav" aria-label={t('nav.summary')}>
      {links.map((link) => (
        <button
          key={link.id}
          type="button"
          className="page-nav-link"
          onClick={() => scrollTo(link.id)}
        >
          {link.label}
        </button>
      ))}
    </nav>
  );
}
