import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface MainPageProps {
  onNavigate: (page: 'missions' | 'admin') => void;
}

const MainPage: React.FC<MainPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <div className="app">
      {/* Header matching features page */}
      <div className="page-header">
        <div className="header-spacer"></div>
        <h1 className="main-title">{t('title')}</h1>
        <div className="header-actions">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Content Section */}
      <section className="features-section">
        <div className="main-content">
          {/* Navigation Cards */}
          <div className="features-grid">
          <div 
            className="feature-card"
            onClick={() => onNavigate('missions')}
          >
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="feature-content">
              <h3 className="feature-title">{t('main.navigation.missions')}</h3>
            </div>
          </div>

          <div 
            className="feature-card analytics-feature"
            onClick={() => onNavigate('admin')}
          >
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
                                     <div className="feature-content">
              <h3 className="feature-title">{t('main.navigation.admin')}</h3>
            </div>
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