# Development Roadmap

This document outlines the planned features and improvements for the node-red-contrib-dynamic-websocket project. The roadmap is organized by priority and expected release timeline.

## Short-term (Next 1-3 months)

### Protocol Subprotocol Support
- Add ability to specify WebSocket subprotocols
- Support for MQTT over WebSockets
- Add configuration option in UI for subprotocol selection

### Heartbeat/Keep-Alive
- Implement configurable heartbeat mechanism to keep connections alive
- Add ping/pong support with customizable intervals
- Detect stale connections and automatically reconnect
- Add UI configuration for heartbeat settings

## Medium-term (3-6 months)

### Connection Pooling
- Ability to maintain multiple connections to different endpoints
- Share connections between multiple nodes for efficiency
- Add connection management dashboard
- Implement connection reuse policies

### Proxy Support
- Add ability to connect through HTTP/HTTPS proxies
- Support for corporate environments with proxy requirements
- Add UI configuration for proxy settings
- Support for proxy authentication

### Enhanced Debugging
- More detailed logging options with configurable verbosity
- Visual connection status with timing information
- Traffic monitoring capabilities
- Add debug mode with extended information

## Long-term (6+ months)

### Message Queue
- Queue messages when connection is down
- Automatically send queued messages when connection is restored
- Configurable queue size and behavior
- Add persistence options for queued messages

### Security Enhancements
- Support for client certificates
- More granular TLS/SSL configuration options
- Option to validate server certificate against specific CA
- Add security audit features

### Performance Metrics
- Track and display connection statistics
- Monitor message throughput and latency
- Export metrics for monitoring systems
- Add performance optimization options

### Multiple Output Formats
- Option to output raw binary data
- Support for different encoding formats
- Add automatic format detection
- Add conversion utilities between formats

## Community Requested Features

This section will be updated based on user feedback and feature requests from the community. If you have a feature request, please submit it as an issue on the GitHub repository.

## Contributing

We welcome contributions to help implement features on this roadmap. If you're interested in working on any of these features, please check the GitHub repository's issues and pull request guidelines.

---

*Note: This roadmap is subject to change based on community feedback, priorities, and available resources. Last updated: May 25, 2025*
