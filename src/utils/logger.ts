/**
 * Utilitaire de logging respectueux de l'environnement
 */

import { isDevelopment } from './environment';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment()) {
      console.log(...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment()) {
      console.info(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment()) {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    // Les erreurs sont toujours loggées
    console.error(...args);
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment()) {
      console.debug(...args);
    }
  }
};

// Helper pour logguer seulement en développement
export const devLog = (...args: any[]) => {
  if (isDevelopment()) {
    console.log(...args);
  }
};