import { useTranslation } from 'react-i18next';
import './FeatureCard.css';

interface FeatureCardProps {
  icon: React.ReactNode;
  feature: string;
  description: string;
  isActive?: boolean;
  onClick: () => void;
}

const FeatureCard = ({ icon, feature, description, isActive = false, onClick }: FeatureCardProps) => {
  const { t } = useTranslation();

  return (
    <div 
      className={`feature-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="feature-icon">
        {icon}
      </div>
      <div className="feature-content">
        <h3 className="feature-title">{feature}</h3>
        <p className="feature-description">{description}</p>
        <div className="feature-action">
          <span className="action-text">{t('actions.start')}</span>
          <span className="action-arrow">→</span>
        </div>
      </div>
      <div className="feature-glow"></div>
    </div>
  );
};

export default FeatureCard; 