import React from 'react';
import { useTranslation } from 'react-i18next';

interface AnalyticsPageProps {
  onBack: () => void;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="analytics-page">
      <header className="page-header">
        <button onClick={onBack} className="back-button">
          ← {t('common.back')}
        </button>
        <h1>{t('analytics.title')}</h1>
      </header>

      <main className="analytics-content">
        <div className="coming-soon">
          <h2>{t('analytics.comingSoon')}</h2>
          <p>{t('analytics.placeholder')}</p>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsPage; 