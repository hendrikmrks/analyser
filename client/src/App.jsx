import { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Profile from './components/Profile';
import { checkAuth, fetchProfile, logout } from './api';
import { useI18n } from './i18n/I18nProvider';

export default function App() {
  const { t } = useI18n();
  const [state, setState] = useState('loading');
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [compareCode, setCompareCode] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    const urlCompare = params.get('compare') || '';
    if (urlCompare) setCompareCode(urlCompare);
    if (urlError) {
      setError(decodeURIComponent(urlError));
      window.history.replaceState({}, '', '/');
    }
    init();
  }, []);

  useEffect(() => {
    if (state === 'profile' && window.location.search.includes('compare=')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('compare');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [state]);

  async function init() {
    try {
      const { authenticated } = await checkAuth();
      if (!authenticated) {
        setState('landing');
        return;
      }
      const data = await fetchProfile();
      setProfileData(data);
      setError(null);
      setState('profile');
    } catch (err) {
      setError(err.message);
      setState('landing');
    }
  }

  async function handleLogout() {
    await logout();
    setProfileData(null);
    setState('landing');
  }

  if (state === 'loading') {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="loading-text">{t('common.loading')}</p>
      </div>
    );
  }

  if (state === 'profile' && profileData) {
    return (
      <Profile
        data={profileData}
        onLogout={handleLogout}
        initialCompareCode={compareCode}
      />
    );
  }

  return <Landing error={error} />;
}
