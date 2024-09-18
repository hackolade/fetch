# fetch

This is the HTTP client that must be used by both Hackolade Studio and its plugins.
It takes into account the proxies and the custom certificate authorities that are configured at the level of the operating system.
So it removes the need for the end user to deal with network settings in Hackolade Studio.

## Context

Web browsers provide natively the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
In Electron, that API was originally only available in the `renderer` process (which is basically a browser).
It is now also available in the `main` process and in `utility` processes via [net.fetch](https://www.electronjs.org/docs/latest/api/net#netfetchinput-init).

## Approach

This library returns the proper implementation of *fetch()* depending on the runtime context:

- it returns the native [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) in a browser, as well as in a Electron `renderer` process
- it returns [net.fetch](https://www.electronjs.org/docs/latest/api/net#netfetchinput-init) in the Electron `main` and `utility` processes

## Tests

> **INFO**: execute `npm run docker:test` to run the tests in Docker/Linux

We have automated tests in order to verify that this HTTP client behaves as expected in various situations:

- in both the `main` process, a `renderer` process and a `utility` process
- when connecting directly to the server
- when connecting to the server through a proxy that is configured in the operating system
- etc.

Those tests involve multiple components:

- There is a custom `server` that exposes a REST API where clients can register themselves. That server is started as a Docker container. It opens a port on the host to allow direct access.
- There is a `proxy` that is started as a Docker container. It opens a port on the host to provide access to the `server` based on its name within the Docker network. That name is only reachable within the Docker network, aka through the proxy.
- There is an Electron `app`. It queries the API of the `server` from both the `main` process, a `renderer` process and a `utility` process. Each process registers itself through the API.
- There are `tests` that queries the API of the `server` to verify that all clients could successfully register themselves, whatever the configuration of the connection.

We use Docker `compose` to orchestrate those components.
