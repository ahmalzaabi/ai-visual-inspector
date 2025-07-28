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
            <span>Intelligent Visual Inspection</span>
          </div>
          <div className="status-item">
            <div className="status-dot active"></div>
            <span>Computer Vision</span>
          </div>
          <div className="status-item">
            <div className="status-dot active"></div>
            <span>Machine Learning</span>
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
              <div className="card-icon missions-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="4" width="24" height="24" rx="4" stroke="var(--accent-primary)" strokeWidth="2" fill="rgba(0, 122, 255, 0.1)"/>
                  <path d="M10 16l4 4 8-8" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="nav-card-title">{t('main.navigation.missions')}</h3>
              <div className="card-tech-pattern">
                <div className="tech-line t-1"></div>
                <div className="tech-line t-2"></div>
              </div>
            </div>
          </div>

          <div 
            className="vertical-nav-card analytics-card ai-card"
            onClick={() => onNavigate('admin')}
          >
            <div className="card-glow-effect"></div>
            <div className="nav-card-content">
              <div className="card-icon analytics-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M4 28L4 4" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 28L28 28" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round"/>
                  <rect x="7" y="20" width="3" height="8" fill="var(--accent-primary)" rx="1"/>
                  <rect x="12" y="16" width="3" height="12" fill="var(--accent-primary)" rx="1"/>
                  <rect x="17" y="12" width="3" height="16" fill="var(--accent-primary)" rx="1"/>
                  <rect x="22" y="18" width="3" height="10" fill="var(--accent-primary)" rx="1"/>
                </svg>
              </div>
              <h3 className="nav-card-title">{t('main.navigation.analytics')}</h3>
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