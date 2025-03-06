# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-03-06

### Fixed

- Added `.js` extension to relative imports and exports for compliance with ESM requirement
- Added _package.json_ with `{ "type": "module" }` in ESM build
- Preserved dynamic import of _electron_ in both CommonJS and ESM builds
