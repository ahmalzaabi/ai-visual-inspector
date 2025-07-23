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
      {/* Header with Language Switcher */}
      <header className="main-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <div className="ai-brain-icon"></div>
            </div>
            <div className="logo-text">
              <h1 className="main-title">{t('title')}</h1>
              <p className="main-subtitle">{t('subtitle')}</p>
            </div>
          </div>
          <div className="header-actions">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-animation">
            {/* Computer Vision Animation */}
            <div className="cv-container">
              <div className="detection-grid">
                <div className="detection-point point-1"></div>
                <div className="detection-point point-2"></div>
                <div className="detection-point point-3"></div>
                <div className="detection-point point-4"></div>
                <div className="scan-line horizontal"></div>
                <div className="scan-line vertical"></div>
              </div>
              <div className="neural-network">
                <div className="neural-node node-1"></div>
                <div className="neural-node node-2"></div>
                <div className="neural-node node-3"></div>
                <div className="neural-node node-4"></div>
                <div className="neural-connection conn-1"></div>
                <div className="neural-connection conn-2"></div>
                <div className="neural-connection conn-3"></div>
              </div>
              <div className="ai-core">
                <div className="core-inner">
                  <div className="processor-lines"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hero-text">
            <h2 className="hero-title">{t('main.welcome')}</h2>
            <p className="hero-description">{t('main.description')}</p>
            
            {/* Key Features Highlights */}
            <div className="hero-badges">
              <span className="hero-badge">
                <div className="badge-icon lightning-icon"></div>
                {t('main.badges.realtime')}
              </span>
              <span className="hero-badge">
                <div className="badge-icon target-icon"></div>
                {t('main.badges.accurate')}
              </span>
              <span className="hero-badge">
                <div className="badge-icon neural-icon"></div>
                {t('main.badges.intelligent')}
              </span>
              <span className="hero-badge">
                <div className="badge-icon vision-icon"></div>
                {t('main.badges.vision')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Navigation Cards */}
      <section className="main-navigation">
        <div className="nav-grid">
          {/* Features Card */}
          <div 
            className="nav-card features-card"
            onClick={() => onNavigate('features')}
          >
            <div className="nav-card-background">
              <div className="floating-icon icon-1">
                <div className="tool-icon"></div>
              </div>
              <div className="floating-icon icon-2">
                <div className="camera-icon"></div>
              </div>
              <div className="floating-icon icon-3">
                <div className="gear-icon"></div>
              </div>
            </div>
            
            <div className="nav-card-content">
              <div className="nav-icon features-icon">
                <div className="icon-layers">
                  <div className="icon-layer layer-1">
                    <div className="detection-icon"></div>
                  </div>
                  <div className="icon-layer layer-2">
                    <div className="search-icon"></div>
                  </div>
                </div>
              </div>
              
              <h3 className="nav-card-title">{t('main.navigation.features')}</h3>
              <p className="nav-card-description">{t('main.navigation.featuresDesc')}</p>
              
              <div className="nav-card-stats">
                <div className="stat-item">
                  <span className="stat-number">5</span>
                  <span className="stat-label">{t('main.stats.features')}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">AI</span>
                  <span className="stat-label">{t('main.stats.powered')}</span>
                </div>
              </div>
              
              <div className="nav-card-arrow">
                <div className="arrow-icon"></div>
              </div>
            </div>
          </div>

          {/* Analytics Card */}
          <div 
            className="nav-card analytics-card"
            onClick={() => onNavigate('analytics')}
          >
            <div className="nav-card-background">
              <div className="floating-icon icon-1">
                <div className="chart-icon"></div>
              </div>
              <div className="floating-icon icon-2">
                <div className="trend-icon"></div>
              </div>
              <div className="floating-icon icon-3">
                <div className="insight-icon"></div>
              </div>
            </div>
            
            <div className="nav-card-content">
              <div className="nav-icon analytics-icon">
                <div className="icon-layers">
                  <div className="icon-layer layer-1">
                    <div className="analytics-chart-icon"></div>
                  </div>
                  <div className="icon-layer layer-2">
                    <div className="data-icon"></div>
                  </div>
                </div>
              </div>
              
              <h3 className="nav-card-title">{t('main.navigation.analytics')}</h3>
              <p className="nav-card-description">{t('main.navigation.analyticsDesc')}</p>
              
              <div className="nav-card-stats">
                <div className="stat-item">
                  <span className="stat-number">∞</span>
                  <span className="stat-label">{t('main.stats.insights')}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label">{t('main.stats.monitoring')}</span>
                </div>
              </div>
              
              <div className="nav-card-badge coming-soon">
                {t('main.comingSoon')}
              </div>
              
              <div className="nav-card-arrow">
                <div className="arrow-icon"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="tech-section">
        <h3 className="section-title">{t('main.tech.title')}</h3>
        <div className="tech-grid">
          <div className="tech-item">
            <div className="tech-icon">
              <div className="tensorflow-icon"></div>
            </div>
            <span>{t('main.tech.ai')}</span>
          </div>
          <div className="tech-item">
            <div className="tech-icon">
              <div className="realtime-icon"></div>
            </div>
            <span>{t('main.tech.realtime')}</span>
          </div>
          <div className="tech-item">
            <div className="tech-icon">
              <div className="neural-net-icon"></div>
            </div>
            <span>{t('main.tech.models')}</span>
          </div>
          <div className="tech-item">
            <div className="tech-icon">
              <div className="vision-processing-icon"></div>
            </div>
            <span>{t('main.tech.vision')}</span>
          </div>
          <div className="tech-item">
            <div className="tech-icon">
              <div className="precision-icon"></div>
            </div>
            <span>{t('main.tech.precision')}</span>
          </div>
          <div className="tech-item">
            <div className="tech-icon">
              <div className="detection-icon"></div>
            </div>
            <span>{t('main.tech.detection')}</span>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">
              <div className="speed-icon"></div>
            </div>
            <div className="stat-content">
              <span className="stat-value">&lt; 150ms</span>
              <span className="stat-label">{t('main.stats.inferenceTime')}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <div className="accuracy-icon"></div>
            </div>
            <div className="stat-content">
              <span className="stat-value">&gt; 90%</span>
              <span className="stat-label">{t('main.stats.accuracy')}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <div className="model-icon"></div>
            </div>
            <div className="stat-content">
              <span className="stat-value">YOLO</span>
              <span className="stat-label">{t('main.stats.model')}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <div className="language-icon"></div>
            </div>
            <div className="stat-content">
              <span className="stat-value">2</span>
              <span className="stat-label">{t('main.stats.languages')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-content">
          <p className="footer-text">
            {t('main.footer.text')}
          </p>
          <div className="footer-version">
            <span>v1.0.0</span>
            <span className="separator">•</span>
            <span>{t('main.footer.poweredBy')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MainPage 