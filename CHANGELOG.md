# Changelog

All notable changes to the node-red-contrib-dynamic-websocket project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2025-05-23

### Added
- Option to allow connections to WebSockets with self-signed or expired certificates
  - Added checkbox in node configuration UI
  - Added support for dynamic override via `msg.allowSelfSigned`

## [1.0.3] - 2025-05-01

### Fixed
- Fixed issue with WebSocket reconnection after Node-RED restart

## [1.0.2] - 2025-04-15

### Added
- Initial public release
- Dynamic WebSocket URL configuration
- Connection state monitoring
- Persistent connections
- JSON parsing for WebSocket messages
- Connection management
