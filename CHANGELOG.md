# Changelog

All notable changes to the node-red-contrib-dynamic-websocket project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2025-05-25

### Added
- Authentication support with multiple methods:
  - Basic authentication (username/password)
  - Token-based authentication (Bearer tokens or custom)
  - Custom headers for advanced authentication scenarios
- Added ability to place tokens in headers or URL parameters
- Added dynamic control of authentication settings via messages

## [1.0.5] - 2025-05-25

### Added
- Advanced reconnection strategy with configurable parameters
  - Auto-reconnect option for automatic reconnection on disconnection
  - Configurable maximum reconnection attempts
  - Adjustable reconnection interval
  - Exponential backoff option for increasing delay between attempts
- New message properties for dynamic control of reconnection behavior
  - `msg.reconnect` to force immediate reconnection
  - `msg.autoReconnect` to override auto-reconnect setting
  - `msg.reconnectAttempts` to override maximum attempts
  - `msg.reconnectInterval` to override reconnection interval
  - `msg.useExponentialBackoff` to override exponential backoff setting
- Enhanced status messages showing reconnection progress
- Additional state information in output messages

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
