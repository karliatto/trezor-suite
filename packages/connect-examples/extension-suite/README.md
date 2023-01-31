## Options

1. Version of popup that includes connect core

    - Pros
        - WebUSB would work, no need to have bridge
        - Simpler, it does not require communication with iframe to talk to device
    - Cons
        - Load time
        - It is not persistent so if user closes the popup window all is gone

2. Service worker with connect started by popup

    - Pros
        - Service workers are persistent so even if the popup tab is closed the connection can stay alive.
    - Cons
        - WebUSB does not work, it requires bridge

3. New trezor browser extension with a service worker that includes connect

    - Pros
        -
    - Const
        - Development support
        -

## TODOs

-   create document
