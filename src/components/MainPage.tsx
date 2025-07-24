import React from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

interface MainPageProps {
  onNavigate: (page: 'features' | 'analytics') => void;
}

const MainPage: React.FC<MainPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation()

  return (
    <div className="app">
      {/* Header */}
      <header className="main-header">
        <div className="header-content">
          <div className="app-info">
            <h1 className="app-title">{t('title')}</h1>
            <p className="app-subtitle">{t('subtitle')}</p>
          </div>
          <div className="header-actions">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* App Description */}
        <div className="app-description-section">
          <div className="tech-highlights">
            <div className="highlight-pill ar-pill">
              <span className="highlight-text">{t('main.techHighlights.ar')}</span>
            </div>
            <div className="highlight-pill ai-pill">
              <span className="highlight-text">{t('main.techHighlights.ai')}</span>
            </div>
            <div className="highlight-pill cv-pill">
              <span className="highlight-text">{t('main.techHighlights.cv')}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="main-navigation">
          <button 
            className="nav-button features-button"
            onClick={() => onNavigate('features')}
          >
            <span className="nav-button-text">{t('main.navigation.features')}</span>
          </button>

          <button 
            className="nav-button analytics-button"
            onClick={() => onNavigate('analytics')}
          >
            <span className="nav-button-text">{t('main.navigation.analytics')}</span>
            <span className="coming-soon-indicator">{t('main.comingSoon')}</span>
          </button>
        </div>

        {/* Version Info */}
        <div className="app-version-info">
          <span className="version-text">Version 1.0.0</span>
        </div>
      </main>
    </div>
  )
}

export default MainPage 