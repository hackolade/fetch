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

We have automated tests in order to verify that this library behaves as expected in various situations:

- in both the `main` process, a `renderer` process and a `utility` process
- when connecting directly to a server
- when connecting to a server that uses a self-signed certificate
- when connecting to a server through a proxy that is configured in the operating system
- when connecting to a server through a proxy that requires basic authentication

Those tests involve multiple components:

- There is a `server` that exposes a REST API where clients can register themselves. It opens a port on the host to allow direct access.
- There are `proxies` with various configurations. They each open a different port on the host to provide access to the `server` based on its name within the Docker network. That name is only reachable within the Docker network, aka through one of the proxies.
- There is an Electron `app`. It queries the API of the `server` from both the `main` process, a `renderer` process and a `utility` process. Each process registers itself through the API of the `server`.
- There are `tests` that queries the API of the `server` to verify that all clients could successfully register themselves, whatever the context of the connection.

We use Docker `compose` to orchestrate those components.

![diagram](./doc/test-components.drawio.svg)

## Observations

### :white_check_mark: Direct connection

Connecting directly to a server works as expected from all Electron processes.

### :white_check_mark: Connection involving a self-signed certificate

> **CONTEXT:** for a certificate to be considered valid, it must be signed by a trusted certificate authority (CA), such as *GlobalSign* or *DigiCert*.
Obtaining such a certificate used to cost some money (this is not true anymore thanks to *[Let's Encrypt](https://letsencrypt.org/)*, a nonprofit certificate authority).
That's why some organizations generated their own self-signed certificates, typically for internal use.
Those certificates are free. However, they are invalid by default and prevent HTTPS connections from being securely established.
To be able to use self-signed certificates, an organization must add itself to the list of trusted certificate authorities in the OS of all its users.

Connecting to a server that uses a self-signed certificate works as expected from all Electron processes.
Of course it requires the [root CA file](./test/resources/certs/gen/rootCA.crt) to be properly installed in the user's operating system.

- MacOS: double-click on the root CA file and follow the instructions to add it to the *Keychain*
- Windows: double-click on the root CA file and follow the instructions
- Linux: see instructions [here](https://chromium.googlesource.com/chromium/src/+/master/docs/linux/cert_management.md) to add the root CA to the *NSS Shared DB*

### :white_check_mark: Connection through a proxy

Connecting to the server through the proxy that is configured in the operating system works as expected from all Electron processes.

### :white_check_mark: Connection through a proxy with basic auth

Connecting to the server through the proxy that is configured in the operating system requires some attention when basic authentication is involved.
Even though the credentials might have been set at the level of the operating system, the user needs to provide them interactively to Electron.
This is the case for apps such as Slack or Docker Desktop.

The `main` process must handle the [login](https://www.electronjs.org/docs/latest/api/app#event-login) event and prompt the user for the proxy credentials.

```js
const { app } = require('electron');

app.on('login', (event, webContents, details, authInfo, callback) => {
  // Prevent the default behavior since it cancels all authentications.
  event.preventDefault();

  // Prompt the user for credentials
  // ...

  callback(username, password);
});
```

The `login` handler will be called automatically for both the `main` process and a `renderer` process.
For a `utility` process, the option [respondToAuthRequestsFromMainProcess](https://www.electronjs.org/docs/latest/api/utility-process#utilityprocessforkmodulepath-args-options) must be set to `true` when creating it.

```js
const { utilityProcess } = require('electron');

utilityProcess.fork(..., { respondToAuthRequestsFromMainProcess: true });
```
