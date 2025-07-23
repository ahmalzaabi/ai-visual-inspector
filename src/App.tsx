import { useState, useEffect } from 'react'
import MainPage from './components/MainPage'
import FeaturesPage from './components/FeaturesPage'
import AnalyticsPage from './components/AnalyticsPage'
import { mlService } from './services/mlService'
import './App.css'

type PageType = 'main' | 'features' | 'analytics'

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('main')

  // Initialize ML services
  useEffect(() => {
    const initML = async () => {
      try {
        await mlService.initialize();
        const stats = mlService.getPerformanceStats();
        console.log('🤖 ESP32 ML Service initialized:', stats);
      } catch (error) {
        console.warn('⚠️ ML Service initialization failed:', error);
      }
    };
    
    initML();
  }, []);

  const handleNavigation = (page: PageType) => {
    setCurrentPage(page)
  }

  const handleBackToMain = () => {
    setCurrentPage('main')
  }

  return (
    <>
      {currentPage === 'main' && (
        <MainPage onNavigate={handleNavigation} />
      )}
      
      {currentPage === 'features' && (
        <FeaturesPage onBack={handleBackToMain} />
      )}
      
      {currentPage === 'analytics' && (
        <AnalyticsPage onBack={handleBackToMain} />
      )}
    </>
  )
}

export default App
