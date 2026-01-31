import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2, Minimize2 } from 'lucide-react';
import { electronService } from '../services/electronService';
import { useAppConfig } from '../contexts/AppConfigContext';

interface TitleBarProps {
  title?: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ title }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [forceShow] = useState(true); // Force l'affichage pour test
  const { labels } = useAppConfig();
  const displayTitle = title || labels.appName;

  useEffect(() => {
    // En mode dev, créer une fausse API electronAPI pour les tests
    if (process.env.NODE_ENV === 'development' && !((window as any).electronAPI)) {
      (window as any).electronAPI = {
        minimize: async () => console.log('Mock: Window minimized'),
        maximize: async () => console.log('Mock: Window maximized'),
        unmaximize: async () => console.log('Mock: Window restored'),
        close: async () => console.log('Mock: Window closed'),
        isMaximized: async () => false
      };
      console.log('TitleBar: Mock electronAPI créée pour les tests');
    }
    
    // Détecter Electron avec plusieurs méthodes
    const isElectronEnv = electronService.getIsElectron() || 
                         !!(window && (window as any).require) ||
                         !!(window && (window as any).electronAPI) ||
                         navigator.userAgent.toLowerCase().indexOf('electron') > -1;
    
    setIsElectron(isElectronEnv);
    console.log('TitleBar: Détection Electron:', { isElectronEnv, hasElectronAPI: !!(window as any).electronAPI });
    
    if (isElectronEnv) {
      // Check initial maximized state
      checkMaximizedState();
      
      // Listen for maximize/unmaximize events from main process
      const handleWindowMaximized = (event: any, maximized: boolean) => {
        setIsMaximized(maximized);
      };
      
      // Listen for window state changes
      const handleResize = () => {
        setTimeout(checkMaximizedState, 100);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Listen for IPC events if available
      if ((window as any).require) {
        const { ipcRenderer } = (window as any).require('electron');
        ipcRenderer.on('window-maximized', handleWindowMaximized);
        
        return () => {
          window.removeEventListener('resize', handleResize);
          ipcRenderer.removeListener('window-maximized', handleWindowMaximized);
        };
      } else {
        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }
    }
  }, []);

  const checkMaximizedState = async () => {
    if (electronService.getIsElectron()) {
      try {
        const maximized = await electronService.isMaximized();
        console.log('TitleBar: Vérification état maximisé:', maximized);
        setIsMaximized(maximized);
      } catch (error) {
        console.error('TitleBar: Erreur vérification état maximisé:', error);
      }
    }
  };

  const handleMinimize = async () => {
    console.log('TitleBar: Tentative de minimisation', { isElectron, hasElectronAPI: !!(window as any).electronAPI });
    if (isElectron) {
      try {
        await electronService.minimizeWindow();
        console.log('TitleBar: Minimisation réussie');
      } catch (error) {
        console.error('TitleBar: Erreur minimisation:', error);
      }
    } else {
      console.log('Test: Minimize window');
    }
  };

  const handleMaximize = async () => {
    console.log('TitleBar: Tentative de maximize/restore', { 
      isElectron, 
      isMaximized, 
      hasElectronAPI: !!(window as any).electronAPI 
    });
    if (isElectron) {
      try {
        if (isMaximized) {
          console.log('TitleBar: Restauration de la fenêtre...');
          await electronService.restoreWindow();
          // Forçage immédiat de l'état puis vérification
          setIsMaximized(false);
          setTimeout(checkMaximizedState, 50);
          setTimeout(checkMaximizedState, 200);
        } else {
          console.log('TitleBar: Maximisation de la fenêtre...');
          await electronService.maximizeWindow();
          // Forçage immédiat de l'état puis vérification
          setIsMaximized(true);
          setTimeout(checkMaximizedState, 50);
          setTimeout(checkMaximizedState, 200);
        }
        console.log('TitleBar: Opération maximize/restore réussie');
      } catch (error) {
        console.error('TitleBar: Erreur maximize/restore:', error);
      }
    } else {
      // Test mode: simulate toggle
      setIsMaximized(!isMaximized);
      console.log('Test: Toggle maximize/restore - now', !isMaximized ? 'maximized' : 'restored');
    }
  };

  const handleClose = async () => {
    console.log('TitleBar: Tentative de fermeture', { isElectron, hasElectronAPI: !!(window as any).electronAPI });
    if (isElectron) {
      try {
        await electronService.closeWindow();
        console.log('TitleBar: Fermeture réussie');
      } catch (error) {
        console.error('TitleBar: Erreur fermeture:', error);
      }
    } else {
      console.log('Test: Close window (would close app in Electron)');
    }
  };

  // Only render if we're in Electron or in development mode for testing
  if (!isElectron && !forceShow) {
    return null;
  }

  return (
    <div 
      className="electron-titlebar flex items-center justify-between bg-gradient-to-r from-[#0011ef] to-[#ff05f2] text-white h-10 px-4 w-full relative z-50 shadow-lg"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Left side - App title */}
      <div className="flex items-center space-x-3" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="w-5 h-5 bg-white/20 rounded-lg flex items-center justify-center shadow-sm">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <span className="text-sm font-semibold tracking-wide">{displayTitle}</span>
        {process.env.NODE_ENV === 'development' && (
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
            {isElectron ? 'Electron' : 'Web'}
          </span>
        )}
      </div>

      {/* Right side - Window controls */}
      <div className="electron-titlebar-buttons flex items-center" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* Minimize button */}
        <button
          onClick={handleMinimize}
          className="w-10 h-8 flex items-center justify-center hover:bg-white/15 transition-all duration-200 rounded-md"
          title="Minimiser"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Maximize/Restore button */}
        <button
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center hover:bg-white/15 transition-all duration-200 rounded-md"
          title={isMaximized ? "Restaurer" : "Agrandir"}
        >
          {isMaximized ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="w-10 h-8 flex items-center justify-center hover:bg-red-500 hover:shadow-lg transition-all duration-200 rounded-md"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};