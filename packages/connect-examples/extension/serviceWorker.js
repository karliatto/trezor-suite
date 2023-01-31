console.log('service worker is running');

// Importing and using functionality from external files is also possible.
importScripts('serviceWorkerUtils.js');

// chrome.action.disable();

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     console.log('tabId', tabId);
//     console.log('changeInfo', changeInfo);
//     console.log('tab', tab);
// });

// If this is the first encounter of the service worker with this page
// the service worker will install and if successful it will activate.
self.addEventListener('install', event => {
    // Installed
    console.log('event install', event);
});

// Once activated the service worker will control all pages that load within its scope
// and intercept corresponding network request.
// However the pages in your app that are open will not be under the service worker's
// scope since the service worker was not loaded when the page was opened.
// To put currently open pages under service worker control, you must
// reload the page or pages. Until then, requests from this page,
//  will bypass the service worker and operate just like they normally would.
self.addEventListener('activate', event => {
    // Activated
    console.log('event activate', event);
});

self.addEventListener('message', event => {
    // Message
    console.log('event message', event);
});

// Fetch event is every time resources are requested.
self.addEventListener('fetch', event => {
    // fetch
    console.log('event fetch', event);
    event.respondWith(caches.match(event.request));
});

self.addEventListener('sync', event => {
    // sync
    console.log('event sync', event);
    if (event.tag === 'foo') {
        event.waitUntil(() => console.log('waiting'));
    }
});

// Push events are initiated by your back-end servers through a
// browser's push service.
const options = {};
self.addEventListener('push', event => {
    // push
    console.log('event push', event);
    event.waitUntil(self.registration.showNotification('Hello!', options));
});
