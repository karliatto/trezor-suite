console.log('service worker is running extended');

/**
Event can be sent like:
```
navigator.serviceWorker.controller.postMessage({
  type: 'MESSAGE_IDENTIFIER',
});
```
 */
self.addEventListener('message', event => {
    console.log('event', event);
    if (event.data && event.data.type === 'MESSAGE_IDENTIFIER') {
        // do something
        console.log('We got MESSAGE_IDENTIFIER');
    }
});
