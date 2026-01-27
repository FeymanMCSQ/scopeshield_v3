const CONFIG = {
    // host_permissions in manifest.json must match these
    LOCALHOST: 'http://localhost:3000',
    PRODUCTION: 'https://scopeshield-v3-web.vercel.app',

    // Change this to switch environments
    // Options: 'LOCALHOST', 'PRODUCTION'
    ENV: 'PRODUCTION'
};

// Helper getter
function getApiUrl() {
    return CONFIG[CONFIG.ENV];
}
