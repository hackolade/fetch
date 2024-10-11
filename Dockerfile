# syntax=docker/dockerfile:1.10

ARG NODEJS_MAJOR_VERSION=20
FROM hackolade.azurecr.io/node:${NODEJS_MAJOR_VERSION} AS node-runtime

# Install pre-requisites for running Electron in Docker
FROM node-runtime AS electron-runtime

ARG TARGETARCH
ENV ROOT_UID=0
ENV UID=${ROOT_UID}
ENV XDG_RUNTIME_DIR=/run/user/${UID}
ENV DBUS_SESSION_BUS_ADDRESS=unix:path=${XDG_RUNTIME_DIR}/bus
ENV DISPLAY=":99"
ENV DEBUG=hck-fetch*

SHELL [ "/bin/bash", "-e", "-o", "pipefail", "-c"  ]
ENTRYPOINT [ "/src/hck/entrypoint.sh" ]
RUN --mount=type=cache,id=apt-cache-${TARGETARCH},sharing=locked,target=/var/cache/apt \
    --mount=type=cache,id=apt-lib-${TARGETARCH},sharing=locked,target=/var/lib/apt <<EOF

    DBUS_DIRS=("/var/run/dbus" "$XDG_RUNTIME_DIR")
    mkdir -p ${DBUS_DIRS[@]}
    chmod 700 $XDG_RUNTIME_DIR

    apt-get update
    apt-get -yq --no-install-suggests --no-install-recommends install \
        libasound2 \
        libgbm1 \
        libgtk-3-0 \
        libnss3 \
        libnss3-tools \
        xauth \
        xvfb
EOF

# Install NPM dependencies and embed source code
FROM electron-runtime AS hck-fetch-runtime
WORKDIR /src/hck
COPY ./package.json ./package-lock.json /src/hck/
RUN --mount=type=cache,id=npm-cache,target=/root/.npm <<EOF
    mkdir node_modules
    npm ci --no-audit --no-fund --no-progress
EOF
COPY ./ /src/hck/
RUN <<EOF
    chmod +x /src/hck/entrypoint.sh
    npm run build
EOF

# Start test application
FROM hck-fetch-runtime AS hck-fetch-test-app
CMD [ "/src/hck/node_modules/electron/dist/electron", "--no-sandbox", "/src/hck/test/resources/app-electron/main.js" ]

# Install root CA in order to accept self-signed certificates
# See https://chromium.googlesource.com/chromium/src/+/master/docs/linux/cert_management.md
COPY ./test/resources/certs/gen/rootCA.crt /usr/local/share/ca-certificates/
RUN <<EOF
    NSS_DB_LOCATION="$HOME/.pki/nssdb"
    mkdir -p "$NSS_DB_LOCATION"
    certutil -d "$NSS_DB_LOCATION" -N
    certutil \
        -d "sql:$NSS_DB_LOCATION" \
        -A \
        -t "C,," \
        -n localhost \
        -i /usr/local/share/ca-certificates/rootCA.crt
EOF

# Start test server
FROM hck-fetch-runtime AS hck-fetch-test-server
ENTRYPOINT [ "npm", "run", "test:server" ]

# Start tests
FROM hck-fetch-runtime AS hck-fetch-tests
ENTRYPOINT [ "npm", "run", "test" ]

# Extend Squid image to log to stdout
FROM hackolade.azurecr.io/squid-proxy:latest AS hck-fetch-test-proxy
COPY ./test/resources/certs/gen/rootCA.pem /etc/squid/ssl_cert/rootCA.pem
RUN chown -R proxy:proxy /apps /etc/squid
USER proxy
