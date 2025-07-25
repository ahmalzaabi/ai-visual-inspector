import React from 'react';
import { useTranslation } from 'react-i18next';

interface MainPageProps {
  onNavigate: (page: 'features' | 'analytics') => void;
}

const MainPage: React.FC<MainPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <div className="features-page"> {/* Use same styling as features page */}
      <header className="page-header">
        <h1>{t('main.welcome')}</h1>
      </header>

      <main className="features-content">
        <div className="app-description-section">
          <h2 className="main-headline">{t('main.tagline')}</h2>
          <p className="description-text">{t('main.description')}</p>
          
          <div className="tech-highlights">
            <span className="highlight-pill">AI Models</span>
            <span className="highlight-pill">Computer Vision</span>
            <span className="highlight-pill">Real-time Detection</span>
            <span className="highlight-pill">PWA Optimized</span>
          </div>
        </div>

        <div className="feature-grid">
          <div className="nav-button" onClick={() => onNavigate('features')}>
            <div className="nav-content">
              <h3 className="nav-title">{t('navigation.features')}</h3>
              <p className="nav-description">{t('navigation.featuresDesc')}</p>
            </div>
            <div className="nav-arrow">
              <span className="arrow-symbol">→</span>
            </div>
          </div>

          <div className="nav-button" onClick={() => onNavigate('analytics')}>
            <div className="nav-content">
              <h3 className="nav-title">{t('navigation.analytics')}</h3>
              <p className="nav-description">{t('navigation.analyticsDesc')}</p>
              <span className="coming-soon-badge">{t('common.comingSoon')}</span>
            </div>
            <div className="nav-arrow">
              <span className="arrow-symbol">→</span>
            </div>
          </div>
        </div>

        <div className="app-version-info">
          <span className="version-text">v1.0.0</span>
        </div>
      </main>
    </div>
  );
};

export default MainPage; 