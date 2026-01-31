const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Contrôles de fenêtre
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  unmaximize: () => ipcRenderer.invoke('window-unmaximize'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // Users
  getUsers: () => ipcRenderer.invoke('db-get-users'),
  createUser: (userData) => ipcRenderer.invoke('db-create-user', userData),
  updateUser: (id, userData) => ipcRenderer.invoke('db-update-user', id, userData),
  deleteUser: (id) => ipcRenderer.invoke('db-delete-user', id),
  
  // Staff
  getStaff: () => ipcRenderer.invoke('db-get-staff'),
  createStaff: (staffData) => ipcRenderer.invoke('db-create-staff', staffData),
  updateStaff: (id, staffData) => ipcRenderer.invoke('db-update-staff', id, staffData),
  deleteStaff: (id) => ipcRenderer.invoke('db-delete-staff', id),
  
  // Formation Themes
  // Compat: nouveaux canaux simples et anciens canaux "db-*"
  getThemes: () => ipcRenderer.invoke('getThemes').catch(() => ipcRenderer.invoke('db-get-themes')),
  createTheme: (themeData) => ipcRenderer.invoke('db-create-theme', themeData),
  updateTheme: (id, themeData) => ipcRenderer.invoke('db-update-theme', id, themeData),
  deleteTheme: (id) => ipcRenderer.invoke('db-delete-theme', id),
  
  // Staff trainings
  getStaffTrainings: () => ipcRenderer.invoke('db-get-staff-trainings'),
  getTrainingsByStaff: (staffId) => ipcRenderer.invoke('db-get-trainings-by-staff', staffId),
  createStaffTraining: (trainingData) => ipcRenderer.invoke('db-create-staff-training', trainingData),
  updateStaffTraining: (id, trainingData) => ipcRenderer.invoke('db-update-staff-training', id, trainingData),
  deleteStaffTraining: (id) => ipcRenderer.invoke('db-delete-staff-training', id),
  
  // Evaluations
  createEvaluation: (evaluationData) => ipcRenderer.invoke('db-create-evaluation', evaluationData),
  // Compat: nouveaux canaux simples et anciens canaux "db-*"
  getEvaluations: () => ipcRenderer.invoke('getEvaluations').catch(() => ipcRenderer.invoke('db-get-evaluations')),
  updateEvaluation: (id, evaluationData) => ipcRenderer.invoke('db-update-evaluation', id, evaluationData),
  deleteEvaluation: (id) => ipcRenderer.invoke('db-delete-evaluation', id),
  getEvaluationStats: () => ipcRenderer.invoke('db-get-evaluation-stats'),
  
  // Export/Import
  exportData: (type) => ipcRenderer.invoke('db-export-data', type),
  importData: (data) => ipcRenderer.invoke('db-import-data', data),
});
