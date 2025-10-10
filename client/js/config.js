// KingChat Configuration with Environment Support
const API_CONFIG = {
    development: {
        API_BASE_URL: 'http://localhost:5001/api',
        WS_URL: 'http://localhost:5001',
        DEBUG: true
    },
    production: {
        API_BASE_URL: `${window.location.origin}/api`,
        WS_URL: window.location.origin,
        DEBUG: false
    }
};

// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '0.0.0.0';

const environment = isDevelopment ? 'development' : 'production';
const currentConfig = API_CONFIG[environment];

// Final configuration
const CONFIG = {
    API_BASE_URL: currentConfig.API_BASE_URL,
    WS_URL: currentConfig.WS_URL,
    APP_NAME: 'KingChat',
    VERSION: '1.0.0',
    DEBUG: currentConfig.DEBUG,
    ENVIRONMENT: environment
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

console.log('🔧 Config loaded:', CONFIG);
console.log('🌍 Environment:', environment);