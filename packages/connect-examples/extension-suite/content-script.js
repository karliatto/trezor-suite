console.log('test!!!!!!!!!!!');

const button = document.querySelector('button');
button.addEventListener('click', () => {
    console.log('sending postMessage');
    chrome.runtime.sendMessage({
        message: 'this is a message',
    });
});
