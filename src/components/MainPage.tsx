import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface MainPageProps {
  onNavigate: (page: 'features' | 'analytics') => void;
}

const MainPage: React.FC<MainPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <div className="app">
      {/* Header matching features page */}
      <div className="page-header">
        <div className="header-spacer"></div>
        <h1 className="page-title">{t('title')}</h1>
        <div className="header-actions">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Content Section */}
      <section className="features-section">
        <div className="main-hero">
          <p className="main-subtitle">{t('subtitle')}</p>
          <p className="main-tagline">{t('main.tagline')}</p>
        </div>

        {/* Navigation Cards */}
        <div className="features-grid">
          <div 
            className="feature-card"
            onClick={() => onNavigate('features')}
          >
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">{t('main.navigation.features')}</h3>
              <p className="feature-description">Advanced AI detection capabilities</p>
            </div>
          </div>

          <div 
            className="feature-card analytics-feature"
            onClick={() => onNavigate('analytics')}
          >
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V21H21M7 14L12 9L16 13L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">{t('main.navigation.analytics')}</h3>
              <p className="feature-description">Performance insights and metrics</p>
              <span className="coming-soon-badge">{t('common.comingSoon')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="main-footer">
          <span className="version-text">v1.0.0</span>
        </div>
      </section>
    </div>
  );
};

export default MainPage; 