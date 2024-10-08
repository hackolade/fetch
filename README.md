# fetch

This is the HTTP client that must be used by both [Hackolade Studio](https://hackolade.com/) and its plugins.
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

## Release process

1. Open a pull request to bump the semantic `version` in [package.json](./package.json).
1. Set the title of your pull request to `Release v<major>.<minor>.<patch>`.
1. Document the content of the release in the description of your pull request.
1. Merge the pull request into the branch that you plan to release (`develop` typically).
1. Trigger [the release workflow](https://github.com/hackolade/fetch/actions/workflows/release.yml) from the GitHub *Actions* for that branch. It will publish the library to the NPM registry as [@hackolade/fetch](https://www.npmjs.com/package/@hackolade/fetch). It will also create a [GitHub release](https://github.com/hackolade/fetch/releases) with the same description as the pull request you created.

## Tests components

We need to test that this library behaves as expected in various situations, whatever the OS of the user:

- in both the `main` process, a `renderer` process and a `utility` process
- when connecting directly to a server (aka when no proxy is involved)
- when connecting to a server that uses a self-signed certificate whose authority has been installed in the trust store of the OS
- when connecting to a server through a proxy that has been configured at the level of the OS
- when connecting to a server through a proxy that requires basic authentication
- when connecting to a server through the proxy returned by a [PAC file](https://en.wikipedia.org/wiki/Proxy_auto-config)
- when connecting to a server through a proxy that performs [HTTPS inspection](https://www.cloudflare.com/en-gb/learning/security/what-is-https-inspection) using a self-signed certificate

In order to perform those tests, we have prepared multiple components:

|Component|URL|Description|
|-|-|-|
|`server`|On your host (direct access): <br> http://127.0.0.1:8080 <br> https://127.0.0.1:4443 <br><br> In Docker network (access through proxy): http://server:8080 <br> https://server:4443|This server exposes the following REST endpoint: <br> `PUT /initiators/:connectionType/:initiator` <br> It allows clients to register themselves using arbitrary routes: <br> `/initiators/direct/main`, `initiators/proxy/renderer`, etc. <br><br> This server also exposes the following REST endpoint: <br> `GET /initiators/:connectionType/:initiator` <br> It can be used to check if a given client managed to reach the server to register itself.|
|`app`|NA|This is an Electron application. It contacts the server from both the *main* process, a *renderer* process and a *utility* process. Each process registers itself as a distinct `:initiator`: `main`, `renderer` and `utility` respectively. The base URL of the endpoint - including the `:connectionType` - is passed to the application through an environment variable, making it possible to start different instances of the application to cover different cases (e.g. direct connection, connection through a proxy).|
|`proxy`|http://127.0.0.1:3128|This is a proxy that does not require authentication.|
|`proxy-basic-auth`|http://127.0.0.1:3129|This is a proxy that requires basic authentication. You can use `user1` as both username and password.|
|`proxy-https-inspection`|http://127.0.0.1:3130|This is a proxy that performs HTTPS inspection using a self-signed certificate.|
|PAC file|http://127.0.0.1:8081/proxy.pac|This is a PAC file that leads to using the proxy that does not require authentication.|
|`tests`|NA|This is a set of tests that query the REST API of the server to verify that all clients could successfully register themselves, whatever the context of the connection.|

![diagram](./doc/test-components.drawio.svg)

## Test pre-requisites

Follow the instructions below prior to executing the tests:

- Install the latest version of `node`: see instructions [here](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs).
- Install **and start** the `docker` engine for your operating system: see instructions [here](https://docs.docker.com/engine/install/).
- Run `npm install` in this repository in order to install the dependencies.
- Connect to our internal Docker registry: see instructions [here](https://app.gitbook.com/o/HBtg1gLTy0nw4NaX0MaV/s/bfdwYZ4RTsNHasAMVAKe/faq/connect-to-azure-docker-registry).

## Test automation

You can run the command below to execute the automated tests.

```sh
npm run docker:test
```

:warning: Those tests validate the behavior of the library in Docker/Linux. Validating the behavior of the library in MacOS and Windows involve manual steps that are documented below.

## Test overview

See next sections for more details...

||Linux|MacOS|Windows|Notes|
|-|-|-|-|-|
|Direct connection|:white_check_mark:|:white_check_mark:|:white_check_mark:||
|Self-signed certificate (OS integration)|:white_check_mark:|:white_check_mark:|:white_check_mark:||
|Proxy (OS integration)|:white_check_mark:|:white_check_mark:|:white_check_mark:||
|Proxy with basic auth (OS integration)|:white_check_mark:|:white_check_mark:|:white_check_mark:|Requires Electron 32+|
|PAC file (OS integration)|:warning:|:white_check_mark:|:white_check_mark:|Not natively supported by the Linux OS|
|Proxy with HTTPS inspection (OS integration)|:white_check_mark:|:white_check_mark:|:white_check_mark:||

## Test direct connection

In this case, the app connects directly to the server. There is no intermediate proxy involved.

:white_check_mark: **Linux**: this case is covered by the automated tests.

:white_check_mark: **MacOS**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Start the application with `npm run test:app:direct`. It should render all connections with a green background.

:white_check_mark: **Windows**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Start the application with `npm run test:app:direct`. It should render all connections with a green background.

## Test connection involving a self-signed certificate

For a certificate to be considered valid, it must be signed by a trusted certificate authority (CA), such as *GlobalSign* or *DigiCert*.
Obtaining such a certificate used to cost some money (this is not true anymore thanks to *[Let's Encrypt](https://letsencrypt.org/)*, a nonprofit certificate authority).
That's why some organizations generated their own self-signed certificates, typically for internal use.
Those certificates are free.
However, they are unsafe and prevent HTTPS connections from being established.
To be able to use self-signed certificates, an organization must add itself to the list of trusted certificate authorities in the OS of all its users.

:white_check_mark: **Linux**: this case is covered by the automated tests. Note that the custom certificate authority must be added to the *NSS Shared DB* (see instructions [here](https://chromium.googlesource.com/chromium/src/+/master/docs/linux/cert_management.md)).

:white_check_mark: **MacOS**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Open the MacOS *Keychain Access*.
1. Click on *File* > *Import Items*.
1. Select the certificate [./test/resources/certs/gen/rootCA.crt](./test/resources/certs/gen/rootCA.crt).
1. Locate the certificate that you just imported in your keychain (search for *Hackolade-Test-Root-CA*) and double click on it.
1. Expand the *Trust* section of the details dialog and choose to *Always Trust* the certificate for SSL.
1. Close the details dialog to apply your changes.
1. Start the application with `npm run test:app:cert`. It should render all connections with a green background.
1. [Optional] You can remove the certificate from your keychain.

:white_check_mark: **Windows**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Using the file explorer, double click on the certificate [./test/resources/certs/gen/rootCA.crt](./test/resources/certs/gen/rootCA.crt).
1. Click on *Install certificate* in the details dialog.
1. Click on *Next* until you have the option to select a store. Browser the available stores and select *Trusted Root Certification Authorities* (*Autorités de certification racines de confiance* in French).
1. Click on *Next* until you complete the installation process.
1. Start the application with `npm run test:app:cert`. It should render all connections with a green background.
1. [Optional] You can remove the certificate using the *Windows Certificate Manager* (search for `certmgr.msc` in the *Start* menu).

## Test connection through a proxy

In this case, the app connects to the server through a proxy.

:white_check_mark: **Linux**: this case is covered by the automated tests. Note that the proxy is configured through the environment variables `HTTP_PROXY` and `HTTPS_PROXY`, which is the standard way of configuring proxies in Linux.

:white_check_mark: **MacOS**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Open the MacOS *System Settings*.
1. Select *Network* in the left menu.
1. Navigate to the details of your network connection.
1. In the details dialog, select *Proxies*.
1. Enable *Web proxy (HTTP)* and provide the following settings:
    - Server: *127.0.0.1*
    - Port: *3128*
    - No authentication required
1. Click on *OK* to apply your changes.
1. Start the application with `npm run test:app:proxy`. It should render all connections with a green background.
1. Turn off the proxy.

:white_check_mark: **Windows**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Open the *Settings* app by pressing *Windows+I*.
1. Select *Network & Internet* in the left menu.
1. Navigate to the *Proxy* section.
1. Configure a proxy manually with the following settings:
    - Server: *127.0.0.1*
    - Port: *3128*
1. Click on *Save* to apply your changes.
1. Start the application with `npm run test:app:proxy`. It should render all connections with a green background.
1. Turn off the proxy.

## Test connection through a proxy that requires basic authentication

In this case, the app connects to the server through a proxy that requires a username and a password. Even though the credentials might have been set at the level of the operating system, the user needs to provide them interactively to the Electron application. Note that this is also the case for other apps such as Slack or Docker Desktop.

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

:white_check_mark: **Linux**: this case is covered by the automated tests. Note that the proxy is configured through the environment variables `HTTP_PROXY` and `HTTPS_PROXY`, which is the standard way of configuring proxies in Linux.

:white_check_mark: **MacOS**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Open the MacOS *System Settings*.
1. Select *Network* in the left menu.
1. Navigate to the details of your network connection.
1. In the details dialog, select *Proxies*.
1. Enable *Web proxy (HTTP)* and provide the following settings:
    - Server: *127.0.0.1*
    - Port: *3129*
    - Username: *user1*
    - Password: *user1*
1. Click on *OK* to apply your changes.
1. Start the application with `npm run test:app:proxy-basic-auth`. It should render all connections with a green background. Note that you won't be prompted for credentials because we hardcoded them.
1. Turn off the proxy.

:white_check_mark: **Windows**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Open the *Settings* app by pressing *Windows+I*.
1. Select *Network & Internet* in the left menu.
1. Navigate to the *Proxy* section.
1. Configure a proxy manually with the following settings:
    - Server: *127.0.0.1*
    - Port: *3129*
1. Click on *Save* to apply your changes.
1. Open the Windows *Start* menu and search for *Credential Manager* (*Gestionnaire d'identification* in French).
1. In the credential manager, click on *Windows Credentials* (*Information d'identification Windows* in French).
1. Click on *Add a Windows credential* (*Ajouter des informations d'identification Windows*) and provide the following settings:
    - Network address: *127.0.0.1:3129*
    - User name: *user1*
    - Password: *user1*
1. Click on *OK* to apply your changes.
1. Start the application with `npm run test:app:proxy-basic-auth`. It should render all connections with a green background. Note that you won't be prompted for credentials because we hardcoded them.
1. Turn off the proxy. Delete the Windows credential that you created.

## Test connection through a proxy configured via a PAC file

:warning: **Linux**: PAC files are not natively supported by Linux, aka you cannot set `HTTP_PROXY` or `HTTPS_PROXY` to the URL of a PAC file. Linux requires the application itself to provide support for PAC files. That's because PAC files were originally meant to be used by browsers (see [here](https://en.wikipedia.org/wiki/Proxy_auto-config)). That's why they are JavaScript files.

:white_check_mark: **MacOS**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Open the MacOS *System Settings*.
1. Select *Network* in the left menu.
1. Navigate to the details of your network connection.
1. In the details dialog, select *Proxies*.
1. Enable *Auto proxy configuration* and provide the following URL: *http://127.0.0.1:8081/proxy.pac*.
1. Click on *OK* to apply your changes.
1. Start the application with `npm run test:app:proxy-pac-file`. It should render all connections with a green background.
1. Turn off the proxy.

:white_check_mark: **Windows**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Open the *Settings* app by pressing *Windows+I*.
1. Select *Network & Internet* in the left menu.
1. Navigate to the *Proxy* section.
1. Choose to use an installation script and provide the following URL: *http://127.0.0.1:8081/proxy.pac*.
1. Click on *Save* to apply your changes.
1. Start the application with `npm run test:app:proxy-pac-file`. It should render all connections with a green background.
1. Turn off the proxy.

## Test connection through a proxy that performs HTTPS inspection

[HTTPS inspection](https://www.cloudflare.com/en-gb/learning/security/what-is-https-inspection) is the process of checking encrypted web traffic. It relies on a proxy that sets up two separate encrypted connections:

- there is a first HTTPS connection between the client and the proxy where the proxy impersonates the server
- there is a second HTTPS connection between the proxy and the server where the proxy impersonates the client

Note that the proxy can use a self-signed certificate. This means that establishing the connection with a server can require a custom certificate authority even though the server uses a valid certificate.

:white_check_mark: **Linux**: this case is covered by the automated tests.

:white_check_mark: **MacOS**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Open the MacOS *Keychain Access*.
1. Click on *File* > *Import Items*.
1. Select the certificate [./test/resources/certs/gen/rootCA.crt](./test/resources/certs/gen/rootCA.crt).
1. Locate the certificate that you just imported in your keychain (search for *Hackolade-Test-Root-CA*) and double click on it.
1. Expand the *Trust* section of the details dialog and choose to *Always Trust* the certificate for SSL.
1. Close the details dialog to apply your changes.
1. Start the application with `test:app:proxy-https-inspection`. It should render all connections with a green background.
1. [Optional] You can remove the certificate from your keychain.

:white_check_mark: **Windows**: follow the instructions below.

1. Start the server with `npm run docker:server`.
1. Using the file explorer, double click on the certificate [./test/resources/certs/gen/rootCA.crt](./test/resources/certs/gen/rootCA.crt).
1. Click on *Install certificate* in the details dialog.
1. Click on *Next* until you have the option to select a store. Browser the available stores and select *Trusted Root Certification Authorities* (*Autorités de certification racines de confiance* in French).
1. Click on *Next* until you complete the installation process.
1. Start the application with `test:app:proxy-https-inspection`. It should render all connections with a green background.
1. [Optional] You can remove the certificate using the *Windows Certificate Manager* (search for `certmgr.msc` in the *Start* menu).
