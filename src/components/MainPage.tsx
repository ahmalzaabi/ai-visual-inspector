import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface MainPageProps {
  onNavigate: (page: 'features' | 'analytics') => void;
}

const MainPage: React.FC<MainPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <div className="app ai-tech-theme">
      {/* Modern AI Header */}
      <header className="ai-header">
        <div className="header-actions">
          <LanguageSwitcher />
        </div>
      </header>

      {/* Centered AI Tech Main */}
      <main className="ai-main">
        {/* Centered Title Section */}
        <div className="ai-hero-section">
          <div className="ai-title-container">
            <h1 className="ai-title">{t('title')}</h1>
            <p className="ai-subtitle">{t('subtitle')}</p>
          </div>
          
          <div className="ai-description">
            <p className="ai-tagline">{t('main.tagline')}</p>
          </div>
        </div>

        {/* Modern Navigation Cards */}
        <div className="ai-navigation">
          <div 
            className="ai-nav-card features-card"
            onClick={() => onNavigate('features')}
          >
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="card-content">
              <h3 className="card-title">{t('main.navigation.features')}</h3>
              <p className="card-description">Advanced AI detection capabilities</p>
            </div>
            <div className="card-arrow">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div 
            className="ai-nav-card analytics-card"
            onClick={() => onNavigate('analytics')}
          >
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V21H21M7 14L12 9L16 13L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="card-content">
              <h3 className="card-title">{t('main.navigation.analytics')}</h3>
              <p className="card-description">Performance insights and metrics</p>
              <span className="coming-soon-badge">{t('main.comingSoon')}</span>
            </div>
            <div className="card-arrow">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ai-footer">
          <span className="version-text">v1.0.0</span>
        </div>
      </main>
    </div>
  );
};

export default MainPage; 