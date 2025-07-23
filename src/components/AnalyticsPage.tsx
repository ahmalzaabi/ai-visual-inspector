import React from 'react'
import { useTranslation } from 'react-i18next'

interface AnalyticsPageProps {
  onBack: () => void;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onBack }) => {
  const { t } = useTranslation()

  return (
    <div className="app">
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-back" onClick={onBack}>
          ← {t('actions.back')}
        </button>
        <h1 className="page-title">{t('analytics.title')}</h1>
      </div>

      {/* Main Content */}
      <div className="analytics-container">
        {/* Coming Soon Section */}
        <div className="coming-soon-card">
          <div className="coming-soon-icon">📊</div>
          <h2 className="coming-soon-title">{t('analytics.comingSoon')}</h2>
          <p className="coming-soon-description">{t('analytics.description')}</p>
        </div>

        {/* Feature Preview Cards */}
        <div className="analytics-preview-grid">
          <div className="preview-card">
            <div className="preview-icon">📈</div>
            <h3>{t('analytics.features.performance')}</h3>
            <p>{t('analytics.features.performanceDesc')}</p>
            <div className="preview-badge">Coming Soon</div>
          </div>

          <div className="preview-card">
            <div className="preview-icon">🎯</div>
            <h3>{t('analytics.features.accuracy')}</h3>
            <p>{t('analytics.features.accuracyDesc')}</p>
            <div className="preview-badge">Coming Soon</div>
          </div>

          <div className="preview-card">
            <div className="preview-icon">⏱️</div>
            <h3>{t('analytics.features.efficiency')}</h3>
            <p>{t('analytics.features.efficiencyDesc')}</p>
            <div className="preview-badge">Coming Soon</div>
          </div>

          <div className="preview-card">
            <div className="preview-icon">📋</div>
            <h3>{t('analytics.features.reports')}</h3>
            <p>{t('analytics.features.reportsDesc')}</p>
            <div className="preview-badge">Coming Soon</div>
          </div>

          <div className="preview-card">
            <div className="preview-icon">🔍</div>
            <h3>{t('analytics.features.insights')}</h3>
            <p>{t('analytics.features.insightsDesc')}</p>
            <div className="preview-badge">Coming Soon</div>
          </div>

          <div className="preview-card">
            <div className="preview-icon">📤</div>
            <h3>{t('analytics.features.export')}</h3>
            <p>{t('analytics.features.exportDesc')}</p>
            <div className="preview-badge">Coming Soon</div>
          </div>
        </div>

        {/* Roadmap Section */}
        <div className="roadmap-section">
          <h3 className="roadmap-title">{t('analytics.roadmap.title')}</h3>
          <div className="roadmap-timeline">
            <div className="roadmap-item">
              <div className="roadmap-marker active"></div>
              <div className="roadmap-content">
                <h4>{t('analytics.roadmap.phase1')}</h4>
                <p>{t('analytics.roadmap.phase1Desc')}</p>
                <span className="roadmap-status">✅ {t('analytics.roadmap.completed')}</span>
              </div>
            </div>

            <div className="roadmap-item">
              <div className="roadmap-marker in-progress"></div>
              <div className="roadmap-content">
                <h4>{t('analytics.roadmap.phase2')}</h4>
                <p>{t('analytics.roadmap.phase2Desc')}</p>
                <span className="roadmap-status">🔄 {t('analytics.roadmap.inProgress')}</span>
              </div>
            </div>

            <div className="roadmap-item">
              <div className="roadmap-marker"></div>
              <div className="roadmap-content">
                <h4>{t('analytics.roadmap.phase3')}</h4>
                <p>{t('analytics.roadmap.phase3Desc')}</p>
                <span className="roadmap-status">📅 {t('analytics.roadmap.planned')}</span>
              </div>
            </div>

            <div className="roadmap-item">
              <div className="roadmap-marker"></div>
              <div className="roadmap-content">
                <h4>{t('analytics.roadmap.phase4')}</h4>
                <p>{t('analytics.roadmap.phase4Desc')}</p>
                <span className="roadmap-status">🔮 {t('analytics.roadmap.future')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <h3>{t('analytics.contact.title')}</h3>
          <p>{t('analytics.contact.description')}</p>
          <div className="contact-actions">
            <button className="btn btn-primary" onClick={() => window.location.href = 'mailto:support@aiinspector.com'}>
              📧 {t('analytics.contact.email')}
            </button>
            <button className="btn btn-secondary" onClick={() => window.open('https://github.com/yourusername/ai-visual-inspector/issues', '_blank')}>
              💡 {t('analytics.contact.feedback')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage 