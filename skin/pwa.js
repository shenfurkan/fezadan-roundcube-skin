// @ts-check
// Installation is optional. Mail remains usable if workers are unavailable.
(() => {
    if (window.top !== window || !window.isSecureContext || !('serviceWorker' in navigator)) return;

    // The login plugin serves this public, fixed script before authentication.
    // A root URL avoids broadening Roundcube's static.php service-worker scope.
    navigator.serviceWorker.register('/index.php?_task=login&_action=plugin.fezadan-worker', {
        scope: '/',
        updateViaCache: 'none',
    }).catch(() => {
        console.warn('Mail: app support could not be enabled.');
    });
})();
