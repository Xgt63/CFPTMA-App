/**
 * Utilitaires pour détecter l'environnement d'exécution
 */

/**
 * Détecte si l'application s'exécute en mode développement
 */
export const isDevelopment = (): boolean => {
  // Vérifier les variables d'environnement courantes
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  
  // Vérifier si on est dans un environnement Vite
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.DEV;
  }
  
  // Fallback: vérifier l'URL et d'autres indicateurs seulement si window est disponible
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    const isDev = hostname === 'localhost' ||
                  hostname === '127.0.0.1' ||
                  hostname === '[::1]' ||
                  hostname.startsWith('192.168.') ||
                  hostname.startsWith('10.') ||
                  hostname.endsWith('.local') ||
                  window.location.port !== '';
    return isDev;
  }
  
  // Fallback par défaut en développement
  return true;
};

/**
 * Détermine si les outils de debug doivent être affichés
 * Ceci peut être plus restrictif que isDevelopment()
 */
export const shouldShowDebugTools = (): boolean => {
  // En développement, toujours afficher
  if (isDevelopment()) {
    return true;
  }
  
  // Vérifier si nous sommes dans un navigateur
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    // Permettre d'activer les debug tools via localStorage même en prod (pour les tests)
    const forceDebug = localStorage.getItem('forceDebugTools') === 'true';
    if (forceDebug) {
      console.warn('Debug tools forcés via localStorage. Ne pas utiliser en production !');
      return true;
    }
    
    // Permettre d'activer via un paramètre URL secret
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug');
    if (debugParam === 'enable') {
      console.warn('Debug tools activés via paramètre URL. Ne pas utiliser en production !');
      return true;
    }
  } catch (error) {
    console.warn('Erreur lors de la vérification des debug tools:', error);
  }
  
  return false;
};

/**
 * Obtient des informations sur l'environnement
 */
export const getEnvironmentInfo = () => {
  return {
    isDevelopment: isDevelopment(),
    shouldShowDebugTools: shouldShowDebugTools(),
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent,
    nodeEnv: typeof process !== 'undefined' ? process.env?.NODE_ENV : 'unknown'
  };
};

/**
 * Active/désactive les debug tools via localStorage
 */
export const toggleForceDebugTools = (force: boolean) => {
  if (force) {
    localStorage.setItem('forceDebugTools', 'true');
    console.log('Debug tools forcés. Rechargez la page pour voir les changements.');
  } else {
    localStorage.removeItem('forceDebugTools');
    console.log('Debug tools désactivés. Rechargez la page pour voir les changements.');
  }
};

/**
 * Log les informations d'environnement dans la console
 */
export const logEnvironmentInfo = () => {
  const info = getEnvironmentInfo();
  console.group('🔧 Informations d\'environnement');
  console.log('Développement:', info.isDevelopment);
  console.log('Debug tools:', info.shouldShowDebugTools);
  console.log('Host:', info.hostname + (info.port ? ':' + info.port : ''));
  console.log('NODE_ENV:', info.nodeEnv);
  if (info.shouldShowDebugTools && !info.isDevelopment) {
    console.warn('⚠️ Debug tools activés en production !');
  }
  console.groupEnd();
};

// Log automatique au chargement du module (utile pour debug)
if (typeof window !== 'undefined') {
  // Timeout pour éviter les problèmes de timing
  setTimeout(() => {
    if (shouldShowDebugTools()) {
      logEnvironmentInfo();
    }
  }, 100);
}