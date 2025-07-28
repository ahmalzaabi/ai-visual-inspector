import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface MainPageProps {
  onNavigate: (page: 'missions' | 'admin') => void;
}

const MainPage: React.FC<MainPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation();

  return (
    <div className="main-page-container">
      {/* Language Switcher - Floating */}
      <div className="floating-language-switcher">
        <LanguageSwitcher />
      </div>

      {/* Online-Only Mode Banner */}
      <div className="online-only-banner">
        🌐 Online-Only Mode Active (Like Google MediaPipe) - Faster & More Reliable!
      </div>

      {/* Main Content with Title */}
      <div className="main-content-centered">
        <h1 className="main-hero-title">{t('title')}</h1>
        
        {/* Vertical Navigation Cards */}
        <div className="vertical-navigation">
          <div 
            className="vertical-nav-card missions-card"
            onClick={() => onNavigate('missions')}
          >
            <div className="nav-card-content">
              <h3 className="nav-card-title">{t('main.navigation.missions')}</h3>
            </div>
          </div>

          <div 
            className="vertical-nav-card admin-card"
            onClick={() => onNavigate('admin')}
          >
            <div className="nav-card-content">
              <h3 className="nav-card-title">{t('main.navigation.admin')}</h3>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="main-footer">
          <span className="version-text">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default MainPage; 