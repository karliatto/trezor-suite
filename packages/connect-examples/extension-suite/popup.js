const messageChannel = new MessageChannel();

// This is going to be triggered when popup opens
navigator.serviceWorker.ready.then(registration => {
    console.log('ServiceWorker was registered we can communicate with it');
    console.log('registration', registration);
    navigator.serviceWorker.controller.postMessage({
        type: 'MESSAGE_IDENTIFIER',
    });

    // First we initialize the channel by sending
    // the port to the Service Worker (this also
    // transfers the ownership of the port)
    navigator.serviceWorker.controller.postMessage(
        {
            type: 'INIT_PORT',
        },
        [messageChannel.port2],
    );

    // Listen to the response
    messageChannel.port1.onmessage = event => {
        // Print the result
        console.log(event.data.payload);
    };

    // Then we send our first message
    navigator.serviceWorker.controller.postMessage({
        type: 'INCREASE_COUNT',
    });
});

const button = document.querySelector('button');
button.addEventListener('click', () => {
    console.log('button was clicked');
    navigator.serviceWorker.controller.postMessage({
        type: 'INCREASE_COUNT',
    });
});
