import React from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

interface MainPageProps {
  onNavigate: (page: 'features' | 'analytics') => void;
}

const MainPage: React.FC<MainPageProps> = ({ onNavigate }) => {
  const { t } = useTranslation()

  return (
    <div className="native-app">
      {/* Native App Header */}
      <header className="native-header">
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
      <main className="native-main">
        {/* Central Logo/Animation */}
        <div className="app-logo-section">
          <div className="tech-fusion-logo">
            <div className="fusion-core">
              <div className="ai-ring ring-1">
                <div className="neural-dot dot-1"></div>
                <div className="neural-dot dot-2"></div>
                <div className="neural-dot dot-3"></div>
                <div className="neural-dot dot-4"></div>
              </div>
              <div className="ai-ring ring-2">
                <div className="vision-sensor sensor-1"></div>
                <div className="vision-sensor sensor-2"></div>
                <div className="vision-sensor sensor-3"></div>
                <div className="vision-sensor sensor-4"></div>
                <div className="vision-sensor sensor-5"></div>
                <div className="vision-sensor sensor-6"></div>
              </div>
              <div className="ai-ring ring-3">
                <div className="ar-element element-1"></div>
                <div className="ar-element element-2"></div>
                <div className="ar-element element-3"></div>
              </div>
              <div className="fusion-center">
                <div className="ai-core-pulse"></div>
                <div className="ml-processor"></div>
              </div>
            </div>
            <div className="data-streams">
              <div className="stream stream-1"></div>
              <div className="stream stream-2"></div>
              <div className="stream stream-3"></div>
              <div className="stream stream-4"></div>
            </div>
          </div>
        </div>

        {/* App Description */}
        <div className="app-description-section">
          <h2 className="main-headline">{t('main.welcome')}</h2>
          <p className="description-text">{t('main.description')}</p>
          
          <div className="tech-highlights">
            <div className="highlight-pill">
              <span className="highlight-text">{t('main.techHighlights.ai')}</span>
            </div>
            <div className="highlight-pill">
              <span className="highlight-text">{t('main.techHighlights.cv')}</span>
            </div>
            <div className="highlight-pill">
              <span className="highlight-text">{t('main.techHighlights.ar')}</span>
            </div>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="native-navigation">
          <div className="nav-option features-option" onClick={() => onNavigate('features')}>
            <div className="nav-content">
              <h3 className="nav-title">{t('main.navigation.features')}</h3>
              <p className="nav-description">{t('main.navigation.featuresDesc')}</p>
            </div>
            <div className="nav-arrow">
              <span className="arrow-symbol">›</span>
            </div>
          </div>

          <div className="nav-option analytics-option" onClick={() => onNavigate('analytics')}>
            <div className="nav-content">
              <h3 className="nav-title">{t('main.navigation.analytics')}</h3>
              <p className="nav-description">{t('main.navigation.analyticsDesc')}</p>
              <div className="coming-soon-badge">
                <span>{t('main.comingSoon')}</span>
              </div>
            </div>
            <div className="nav-arrow">
              <span className="arrow-symbol">›</span>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="app-version-info">
          <span className="version-text">Version 1.0.0 • {t('main.footer.poweredBy')}</span>
        </div>
      </main>
    </div>
  )
}

export default MainPage 