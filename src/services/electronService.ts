// Service to handle Electron-specific functionality
declare global {
  interface Window {
    require?: any;
    electronAPI?: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      unmaximize: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      close: () => Promise<void>;
    };
  }
}

class ElectronService {
  private isElectron: boolean;
  private ipcRenderer: any;

  constructor() {
    this.isElectron = this.detectElectron();
    
    if (this.isElectron) {
      try {
        const electron = window.require('electron');
        this.ipcRenderer = electron.ipcRenderer;
        this.setupMenuHandlers();
      } catch (error) {
        console.warn('Failed to initialize Electron IPC:', error);
        this.isElectron = false;
      }
    }
  }

  private detectElectron(): boolean {
    return !!(window && (window.electronAPI || (window.require && window.require('electron'))));
  }

  public getIsElectron(): boolean {
    return this.isElectron;
  }

  private setupMenuHandlers(): void {
    if (!this.ipcRenderer) return;

    // Handle menu navigation
    this.ipcRenderer.on('menu-navigate', (event: any, page: string) => {
      const navigateEvent = new CustomEvent('electron-navigate', { detail: { page } });
      window.dispatchEvent(navigateEvent);
    });

    // Handle new evaluation
    this.ipcRenderer.on('menu-new-evaluation', () => {
      const newEvalEvent = new CustomEvent('electron-new-evaluation');
      window.dispatchEvent(newEvalEvent);
    });

    // Handle export data
    this.ipcRenderer.on('menu-export-data', () => {
      const exportEvent = new CustomEvent('electron-export-data');
      window.dispatchEvent(exportEvent);
    });

    // Handle AI analysis
    this.ipcRenderer.on('menu-run-ai-analysis', () => {
      const aiEvent = new CustomEvent('electron-run-ai-analysis');
      window.dispatchEvent(aiEvent);
    });

    // Handle generate report
    this.ipcRenderer.on('menu-generate-report', () => {
      const reportEvent = new CustomEvent('electron-generate-report');
      window.dispatchEvent(reportEvent);
    });

    // Handle clear data
    this.ipcRenderer.on('menu-clear-data', () => {
      const clearEvent = new CustomEvent('electron-clear-data');
      window.dispatchEvent(clearEvent);
    });
  }

  // File operations
  public async showSaveDialog(options: any): Promise<any> {
    if (!this.isElectron || !this.ipcRenderer) {
      throw new Error('Electron not available');
    }
    
    return await this.ipcRenderer.invoke('show-save-dialog', options);
  }

  public async writeFile(filePath: string, data: any): Promise<any> {
    if (!this.isElectron || !this.ipcRenderer) {
      throw new Error('Electron not available');
    }
    
    return await this.ipcRenderer.invoke('write-file', filePath, data);
  }

  public async showOpenDialog(options: any): Promise<any> {
    if (!this.isElectron || !this.ipcRenderer) {
      throw new Error('Electron not available');
    }
    
    return await this.ipcRenderer.invoke('show-open-dialog', options);
  }

  public async readFile(filePath: string): Promise<any> {
    if (!this.isElectron || !this.ipcRenderer) {
      throw new Error('Electron not available');
    }
    
    return await this.ipcRenderer.invoke('read-file', filePath);
  }

  // Enhanced file save with native dialog
  public async saveFileWithDialog(
    data: ArrayBuffer | string,
    defaultFileName: string = 'export.xlsx',
    filters: any[] = [
      { name: 'Excel Files', extensions: ['xlsx'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  ): Promise<boolean> {
    try {
      const saveResult = await this.showSaveDialog({
        defaultPath: defaultFileName,
        filters: filters
      });

      if (!saveResult.canceled && saveResult.filePath) {
        const writeResult = await this.writeFile(saveResult.filePath, data);
        return writeResult.success;
      }
      
      return false;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }

  // Notification system basique
  public showNotification(title: string, body: string): void {
    console.log(`📢 ${title}: ${body}`);
  }

  // Raccourcis pour différents types de notifications
  public showSuccess(title: string, message: string): void {
    console.log(`✅ ${title}: ${message}`);
  }

  public showError(title: string, message: string): void {
    console.error(`❌ ${title}: ${message}`);
  }

  public showWarning(title: string, message: string): void {
    console.warn(`⚠️ ${title}: ${message}`);
  }

  public showInfo(title: string, message: string): void {
    console.info(`ℹ️ ${title}: ${message}`);
  }

  // Window controls
  public async minimizeWindow(): Promise<void> {
    try {
      if (window.electronAPI) {
        await window.electronAPI.minimize();
      } else if (this.isElectron && this.ipcRenderer) {
        await this.ipcRenderer.invoke('window-minimize');
      }
    } catch (error) {
      console.error('Erreur minimisation:', error);
    }
  }

  public async maximizeWindow(): Promise<void> {
    try {
      if (window.electronAPI) {
        await window.electronAPI.maximize();
      } else if (this.isElectron && this.ipcRenderer) {
        await this.ipcRenderer.invoke('window-maximize');
      }
    } catch (error) {
      console.error('Erreur maximisation:', error);
    }
  }

  public async restoreWindow(): Promise<void> {
    try {
      if (window.electronAPI) {
        await window.electronAPI.unmaximize();
      } else if (this.isElectron && this.ipcRenderer) {
        await this.ipcRenderer.invoke('window-unmaximize');
      }
    } catch (error) {
      console.error('Erreur restauration:', error);
    }
  }

  public async closeWindow(): Promise<void> {
    try {
      if (window.electronAPI) {
        await window.electronAPI.close();
      } else if (this.isElectron && this.ipcRenderer) {
        await this.ipcRenderer.invoke('window-close');
      }
    } catch (error) {
      console.error('Erreur fermeture:', error);
    }
  }

  public async isMaximized(): Promise<boolean> {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.isMaximized();
      } else if (this.isElectron && this.ipcRenderer) {
        return await this.ipcRenderer.invoke('window-is-maximized');
      }
    } catch (error) {
      console.error('Erreur vérification maximisé:', error);
    }
    return false;
  }

  // Development helpers
  public openDevTools(): void {
    if (this.isElectron && this.ipcRenderer) {
      this.ipcRenderer.send('open-dev-tools');
    }
  }

  public reloadApp(): void {
    if (this.isElectron && this.ipcRenderer) {
      this.ipcRenderer.send('reload-app');
    } else {
      window.location.reload();
    }
  }
}

// Create singleton instance
const electronService = new ElectronService();

// Export service
export { electronService };

// Export types for TypeScript
export interface ElectronFileFilter {
  name: string;
  extensions: string[];
}

export interface ElectronSaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: ElectronFileFilter[];
  showsTagField?: boolean;
}

export interface ElectronOpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: ElectronFileFilter[];
  properties?: Array<
    'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles' |
    'createDirectory' | 'promptToCreate' | 'noResolveAliases' | 'treatPackageAsDirectory'
  >;
}