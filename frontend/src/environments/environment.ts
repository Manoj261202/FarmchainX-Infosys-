export const environment = {
  production: false,
  apiUrl: '/api',

  // Optional configurations
  enableDebugMode: true,
  enableConsoleLogging: true,

  // Feature flags
  features: {
    qrScanner: true,
    aiQualityCheck: true,
    notifications: true,
  },
};
