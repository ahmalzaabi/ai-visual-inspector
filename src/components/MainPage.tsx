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
      {/* AI Neural Network Background */}
      <div className="ai-background">
        <div className="neural-network">
          <div className="node node-1"></div>
          <div className="node node-2"></div>
          <div className="node node-3"></div>
          <div className="node node-4"></div>
          <div className="node node-5"></div>
          <div className="connection conn-1"></div>
          <div className="connection conn-2"></div>
          <div className="connection conn-3"></div>
          <div className="connection conn-4"></div>
        </div>
        <div className="floating-particles">
          <div className="particle p-1"></div>
          <div className="particle p-2"></div>
          <div className="particle p-3"></div>
          <div className="particle p-4"></div>
          <div className="particle p-5"></div>
          <div className="particle p-6"></div>
        </div>
      </div>

      {/* Language Switcher - Floating */}
      <div className="floating-language-switcher">
        <LanguageSwitcher />
      </div>

      {/* Main Content with Title */}
      <div className="main-content-centered">
        {/* AI Tech Header */}
        <div className="ai-tech-header">
          <div className="ai-circuit-pattern">
            <div className="circuit-line c-1"></div>
            <div className="circuit-line c-2"></div>
            <div className="circuit-dot cd-1"></div>
            <div className="circuit-dot cd-2"></div>
          </div>
          <div className="scanning-beam"></div>
        </div>

        <h1 className="main-hero-title ai-enhanced-title">
          <span className="title-gradient">{t('title')}</span>
          <div className="title-underline"></div>
        </h1>

        {/* AI Status Indicators */}
        <div className="ai-status-bar">
          <div className="status-item">
            <div className="status-dot active"></div>
            <span>TensorFlow.js</span>
          </div>
          <div className="status-item">
            <div className="status-dot active"></div>
            <span>WebGL Accelerated</span>
          </div>
          <div className="status-item">
            <div className="status-dot active"></div>
            <span>Real-time Detection</span>
          </div>
        </div>
        
        {/* Enhanced Vertical Navigation Cards */}
        <div className="vertical-navigation ai-enhanced">
          <div 
            className="vertical-nav-card missions-card ai-card"
            onClick={() => onNavigate('missions')}
          >
            <div className="card-glow-effect"></div>
            <div className="nav-card-content">
              <div className="card-icon">
                <div className="icon-circuit">
                  <div className="icon-core"></div>
                  <div className="icon-rings">
                    <div className="ring r-1"></div>
                    <div className="ring r-2"></div>
                  </div>
                </div>
              </div>
              <h3 className="nav-card-title">{t('main.navigation.missions')}</h3>
              <div className="card-tech-pattern">
                <div className="tech-line t-1"></div>
                <div className="tech-line t-2"></div>
              </div>
            </div>
          </div>

          <div 
            className="vertical-nav-card admin-card ai-card"
            onClick={() => onNavigate('admin')}
          >
            <div className="card-glow-effect"></div>
            <div className="nav-card-content">
              <div className="card-icon">
                <div className="icon-circuit">
                  <div className="icon-core"></div>
                  <div className="icon-rings">
                    <div className="ring r-1"></div>
                    <div className="ring r-2"></div>
                  </div>
                </div>
              </div>
              <h3 className="nav-card-title">{t('main.navigation.admin')}</h3>
              <div className="card-tech-pattern">
                <div className="tech-line t-1"></div>
                <div className="tech-line t-2"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Footer with AI Elements */}
        <div className="main-footer ai-footer">
          <div className="footer-tech-line"></div>
          <span className="version-text">
            <span className="version-label">AI Visual Inspector</span>
            <span className="version-number">v1.0.0</span>
          </span>
          <div className="footer-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default MainPage; 