import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { electronService } from '../services/electronService';
import { DatabaseService } from '../services/database';

interface ElectronMenuHandlerProps {
  children: React.ReactNode;
}

export const ElectronMenuHandler: React.FC<ElectronMenuHandlerProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Only set up handlers if we're in Electron
    if (!electronService.getIsElectron()) {
      return;
    }

    // Menu navigation handler
    const handleNavigation = (event: CustomEvent) => {
      const { page } = event.detail;
      
      switch (page) {
        case 'dashboard':
          navigate('/dashboard');
          break;
        case 'statistics':
          navigate('/statistics');
          break;
        case 'ai-insights':
          // Navigate to statistics with AI insights tab
          navigate('/statistics');
          // We could add a query param or state to auto-select AI tab
          setTimeout(() => {
            const aiTabButton = document.querySelector('[data-tab="ai-insights"]') as HTMLElement;
            if (aiTabButton) {
              aiTabButton.click();
            }
          }, 100);
          break;
        default:
          break;
      }
    };

    // New evaluation handler
    const handleNewEvaluation = () => {
      navigate('/evaluation');
    };

    // Export data handler
    const handleExportData = () => {
      // Navigate to statistics and trigger export
      navigate('/statistics');
      setTimeout(() => {
        const exportButton = document.querySelector('[data-export-button]') as HTMLElement;
        if (exportButton) {
          exportButton.click();
        } else {
          // Fallback: log message
          console.log('Export: Veuillez aller dans l\'onglet Statistiques pour exporter les données');
        }
      }, 100);
    };

    // AI Analysis handler
    const handleRunAiAnalysis = () => {
      navigate('/statistics');
      setTimeout(() => {
        const aiTabButton = document.querySelector('[data-tab="ai-insights"]') as HTMLElement;
        if (aiTabButton) {
          aiTabButton.click();
          // Try to trigger AI analysis
          const analysisButton = document.querySelector('[data-ai-analysis]') as HTMLElement;
          if (analysisButton) {
            analysisButton.click();
          }
        }
      }, 100);
    };

    // Generate report handler
    const handleGenerateReport = () => {
      // Same as export data for now
      handleExportData();
    };

    // Clear data handler
    const handleClearData = async () => {
      try {
        // Clear local storage
        localStorage.removeItem('staff_data');
        localStorage.removeItem('evaluation_data');
        localStorage.removeItem('theme_data');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('data_sync_version');
        
        // Clear database if available
        try {
          await DatabaseService.clearAllData();
        } catch (error) {
          console.warn('Could not clear database:', error);
        }

        // Log confirmation and restart
        console.log('Données effacées - Toutes les données ont été supprimées.');

        // Restart the app after a delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Erreur: Une erreur est survenue lors de la suppression des données');
      }
    };

    // Set up event listeners
    window.addEventListener('electron-navigate', handleNavigation as EventListener);
    window.addEventListener('electron-new-evaluation', handleNewEvaluation);
    window.addEventListener('electron-export-data', handleExportData);
    window.addEventListener('electron-run-ai-analysis', handleRunAiAnalysis);
    window.addEventListener('electron-generate-report', handleGenerateReport);
    window.addEventListener('electron-clear-data', handleClearData);

    // Cleanup
    return () => {
      window.removeEventListener('electron-navigate', handleNavigation as EventListener);
      window.removeEventListener('electron-new-evaluation', handleNewEvaluation);
      window.removeEventListener('electron-export-data', handleExportData);
      window.removeEventListener('electron-run-ai-analysis', handleRunAiAnalysis);
      window.removeEventListener('electron-generate-report', handleGenerateReport);
      window.removeEventListener('electron-clear-data', handleClearData);
    };
  }, [navigate]);

  return <>{children}</>;
};