import { useState, useEffect } from 'react'
import MainPage from './components/MainPage'
import FeaturesPage from './components/FeaturesPage'
import AnalyticsPage from './components/AnalyticsPage'
import './App.css'

type PageType = 'main' | 'features' | 'analytics'

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('main')

  // ML services will initialize on demand
  useEffect(() => {
    console.log('🚀 AI Visual Inspector loaded - ESP32 model will load when needed');
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
