# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2026-08-26

### Fixed

- Added `types` to package `exports` map
- Added missing default export to `index.d.ts`

### Changed

- Bumped Electron dev dependency from 36.2.0 to 43.4.1 to align with Hackolade Studio and close Dependabot advisories

## [1.3.0] - 2025-05-14

### Fixed

- Migrated from SWC to esbuild in order to generate a dedicated entrypoint for browser deployments without any reference to Electron

## [1.2.1] - 2025-03-20

### Fixed

- Moved default export to barrel file for making this library a drop-in replacement of node-fetch

## [1.2.0] - 2025-03-20

### Added

- Added default export for making this library a drop-in replacement of node-fetch

## [1.1.1] - 2025-03-06

### Fixed

- Added `.js` extension to relative imports and exports for compliance with ESM requirement
- Added _package.json_ with `{ "type": "module" }` in ESM build
- Preserved dynamic import of _electron_ in both CommonJS and ESM builds
