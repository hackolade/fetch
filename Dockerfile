# syntax=docker/dockerfile:1.8

ARG NODEJS_MAJOR_VERSION=18
FROM node:${NODEJS_MAJOR_VERSION} AS node-runtime

# Install pre-requisites for running Electron in Docker
FROM node-runtime AS electron-runtime

ARG TARGETARCH
ENV ROOT_UID=0
ENV UID=${ROOT_UID}
ENV XDG_RUNTIME_DIR=/run/user/${UID}
ENV DBUS_SESSION_BUS_ADDRESS=unix:path=${XDG_RUNTIME_DIR}/bus
ENV DISPLAY=":99"

SHELL [ "/bin/bash", "-e", "-o", "pipefail", "-c"  ]

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
        xauth \
        xvfb
EOF

# Install NPM dependencies
FROM electron-runtime AS hck-fetch-runtime
COPY ./package.json ./package-lock.json /src/hck/
WORKDIR /src/hck
RUN --mount=type=cache,id=npm-cache,target=/root/.npm <<EOF
    mkdir node_modules
    npm ci --no-audit --no-fund --no-progress
EOF

# Embed source code
FROM hck-fetch-runtime AS hck-fetch
ENTRYPOINT [ "/src/hck/entrypoint.sh" ]
COPY ./ /src/hck/
RUN <<EOF
    chmod +x /src/hck/entrypoint.sh
    npm run build
EOF

# Start test application
FROM hck-fetch AS hck-fetch-test-app
CMD [ "/src/hck/node_modules/electron/dist/electron", "--no-sandbox", "/src/hck/test/resources/electron-app/main.js" ]
