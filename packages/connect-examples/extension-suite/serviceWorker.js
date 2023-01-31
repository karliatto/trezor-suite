console.log('service worker is running extended');

/**
Event can be sent like:
```
navigator.serviceWorker.controller.postMessage({
  type: 'MESSAGE_IDENTIFIER',
});
```
 */

let getVersionPort;
let count = 0;

self.addEventListener('message', event => {
    console.log('event', event);
    if (event.data && event.data.type === 'MESSAGE_IDENTIFIER') {
        // do something
        console.log('We got MESSAGE_IDENTIFIER');
    }

    if (event.data && event.data.type === 'INIT_PORT') {
        [getVersionPort] = event.ports;
    }

    if (event.data && event.data.type === 'INCREASE_COUNT') {
        getVersionPort.postMessage({ payload: ++count });
    }
});

chrome.runtime.onMessage.addListener(message => {
    console.log('message', message);
    // if (type === 'set-name') {
    //     savedName = name;
    // }
});

// importScripts('browser-polyfill.js');
// const routeCalls = event => console.log(event);

// browser.runtime.onMessage.addListener(msg => {
//     console.log('msg', msg);
// });
