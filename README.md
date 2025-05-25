# node-red-contrib-dynamic-websocket

A flexible Node-RED node that enables dynamic WebSocket connections at runtime. Unlike the standard WebSocket node, this node allows you to change the WebSocket URL during flow execution, making it ideal for applications that need to connect to different WebSocket endpoints based on runtime conditions.

## Features

- **Dynamic URL Configuration**: Change WebSocket connection URLs at runtime via message properties
- **Connection State Monitoring**: Separate outputs for connection status changes and successful connections
- **Persistent Connections**: Remembers the last connected URL even after Node-RED restarts
- **JSON Parsing**: Automatically parses incoming WebSocket messages as JSON when possible
- **Connection Management**: Easily close connections and clear stored URLs
- **Self-Signed Certificate Support**: Option to allow connections to WebSockets with self-signed or expired certificates
- **Advanced Reconnection Strategy**: Configurable auto-reconnect with exponential backoff
- **Authentication Support**: Basic authentication, token-based authentication, and custom headers
- **Message Transformation**: Template-based message transformation with validation and binary support

## Installation

Install directly from your Node-RED's Settings menu:

```
Menu → Manage Palette → Install → node-red-contrib-dynamic-websocket
```

Or run the following command in your Node-RED user directory:

```
npm install node-red-contrib-dynamic-websocket
```

## Usage

The node has one input and three outputs:

### Input

Send messages with the following properties to control the node:

- **msg.url**: Set a new WebSocket URL to connect to (overrides the default URL)
- **msg.close**: Set to `true` to close the current connection and clear the stored URL
- **msg.message**: The message to send through the WebSocket (will be stringified before sending)
- **msg.allowSelfSigned**: Set to `true` or `false` to override the node's configuration for accepting self-signed certificates
- **msg.reconnect**: Set to `true` to force an immediate reconnection attempt using the current URL
- **msg.autoReconnect**: Set to `true` or `false` to override the node's configuration for automatic reconnection
- **msg.reconnectAttempts**: Set to a number to override the node's configuration for maximum reconnection attempts (0 = unlimited)
- **msg.reconnectInterval**: Set to a number to override the node's configuration for reconnection interval in milliseconds
- **msg.useExponentialBackoff**: Set to `true` or `false` to override the node's configuration for using exponential backoff
- **msg.authType**: Set to `'none'`, `'basic'`, or `'token'` to override the authentication type
- **msg.username**: Set the username for basic authentication
- **msg.password**: Set the password for basic authentication
- **msg.token**: Set the token for token-based authentication
- **msg.tokenLocation**: Set to `'header'` or `'url'` to specify where to place the token
- **msg.tokenKey**: Set the key name for the token (header name or URL parameter)
- **msg.headers**: Set custom headers as an object or JSON string
- **msg.transformMessages**: Enable or disable message transformation
- **msg.messageFormat**: Set the message format (`'json'`, `'mqtt'`, `'custom'`)
- **msg.binarySupport**: Enable or disable binary data support
- **msg.validateMessages**: Enable or disable message validation
- **msg.messageTemplate**: Set the message template as an object or JSON string
- **msg.binary**: Set to `true` to send binary data (message must be a Buffer)
- **msg.skipTransform**: Set to `true` to skip transformation for this message only

### Outputs

1. **Top Output**: Received WebSocket messages
   - **msg.payload**: Data received from the WebSocket (parsed as JSON if possible)
   - **msg.payload.binary**: Set to `true` if the message is binary data (when binary support is enabled)
   - **msg.payload.data**: Contains the binary data as a Buffer (when binary support is enabled)
   - **msg.payload.length**: Size of the binary data in bytes (when binary support is enabled)

2. **Middle Output**: Connection state changes
   - **msg.state**: Current connection state ("disconnected", "error", "reconnecting", or "reconnect_failed")
   - **msg.error**: Error message (when state is "error")
   - **msg.code**: WebSocket close code (when state is "disconnected")
   - **msg.attempt**: Current reconnection attempt number (when state is "reconnecting")
   - **msg.attempts**: Total reconnection attempts made (when state is "reconnect_failed")

3. **Bottom Output**: Connection established notification
   - **msg.state**: "Connected" when a connection is successfully established

## Configuration

- **Name**: Node name displayed in the flow
- **Default URL**: Initial WebSocket URL to connect to (can be overridden at runtime)
- **Allow Self-Signed Certificates**: When enabled, allows connections to WebSockets with self-signed or expired certificates
- **Auto Reconnect**: When enabled, automatically attempts to reconnect when disconnected
- **Max Reconnect Attempts**: Maximum number of reconnection attempts (0 = unlimited)
- **Reconnect Interval (ms)**: Base time in milliseconds between reconnection attempts
- **Use Exponential Backoff**: When enabled, increases the delay between reconnection attempts
- **Authentication**: Type of authentication to use (None, Basic, or Token)
- **Username/Password**: Credentials for basic authentication
- **Token**: Authentication token for token-based authentication
- **Token Location**: Where to place the token (Header or URL parameter)
- **Token Key**: Name of the header or URL parameter for the token
- **Custom Headers**: Additional HTTP headers to include in the connection request
- **Transform Messages**: Enable template-based message transformation
- **Message Format**: Format for message transformation (JSON, MQTT, Custom)
- **Binary Support**: Enable support for binary data transmission
- **Validate Messages**: Validate messages against template before sending
- **Message Template**: Template for transforming messages with placeholders

## Examples

### Basic Usage

![Basic Usage Example](https://raw.githubusercontent.com/Hindurable/node-red-contrib-dynamic-websocket/main/examples/basic-usage.png)

```json
[{"id":"f6f2187d.f17ca8","type":"dynamic-websocket","z":"c9a81b70.8abed8","name":"Dynamic WebSocket","url":"ws://example.com/socket","x":380,"y":120,"wires":[["c6047a.ff4e95d8"],["9be3507a.c295"],["7bd0d71.54d6908"]]},{"id":"bb52f27.6c2b5f","type":"inject","z":"c9a81b70.8abed8","name":"Connect to URL","props":[{"p":"url","v":"ws://example.com/socket","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":170,"y":120,"wires":[["f6f2187d.f17ca8"]]},{"id":"d0702d8c.8baae","type":"inject","z":"c9a81b70.8abed8","name":"Send Message","props":[{"p":"message","v":"{\"type\":\"hello\",\"data\":\"world\"}","vt":"json"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":170,"y":160,"wires":[["f6f2187d.f17ca8"]]},{"id":"6a2e01d1.5e0e3","type":"inject","z":"c9a81b70.8abed8","name":"Close Connection","props":[{"p":"close","v":"true","vt":"bool"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":170,"y":200,"wires":[["f6f2187d.f17ca8"]]},{"id":"c6047a.ff4e95d8","type":"debug","z":"c9a81b70.8abed8","name":"Received Messages","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":600,"y":80,"wires":[]},{"id":"9be3507a.c295","type":"debug","z":"c9a81b70.8abed8","name":"Connection State","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":600,"y":120,"wires":[]},{"id":"7bd0d71.54d6908","type":"debug","z":"c9a81b70.8abed8","name":"Connected","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","statusVal":"","statusType":"auto","x":600,"y":160,"wires":[]}]
```

### Switching Between Multiple WebSockets

```json
[{"id":"f6f2187d.f17ca8","type":"dynamic-websocket","z":"c9a81b70.8abed8","name":"Dynamic WebSocket","url":"","x":380,"y":120,"wires":[["c6047a.ff4e95d8"],["9be3507a.c295"],["7bd0d71.54d6908"]]},{"id":"bb52f27.6c2b5f","type":"inject","z":"c9a81b70.8abed8","name":"Connect to Server 1","props":[{"p":"url","v":"ws://server1.example.com/socket","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":170,"y":80,"wires":[["f6f2187d.f17ca8"]]},{"id":"d0702d8c.8baae","type":"inject","z":"c9a81b70.8abed8","name":"Connect to Server 2","props":[{"p":"url","v":"ws://server2.example.com/socket","vt":"str"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":170,"y":120,"wires":[["f6f2187d.f17ca8"]]},{"id":"6a2e01d1.5e0e3","type":"inject","z":"c9a81b70.8abed8","name":"Close Connection","props":[{"p":"close","v":"true","vt":"bool"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":170,"y":160,"wires":[["f6f2187d.f17ca8"]]}]
```

### Auto-Connect Example with Secure WebSocket

```json
[{"id":"a964c1ed78f49693","type":"dynamic-websocket","z":"b01c1830d752542b","name":"","url":"","x":1920,"y":1120,"wires":[["3423a5ba22b9343a"],["9bda9fd1bd549f79"],["61af331c87b98e5f"]]},{"id":"36a89bed0f435ac7","type":"inject","z":"b01c1830d752542b","name":"Connect on Deploy","props":[{"p":"payload"}],"repeat":"","crontab":"","once":true,"onceDelay":0.1,"topic":"","payload":"","payloadType":"date","x":1390,"y":1120,"wires":[["6312880702e1ab51"]]},{"id":"6312880702e1ab51","type":"function","z":"b01c1830d752542b","name":"wss://example.org:6555","func":"msg.url ='wss://example.org:6555';\n\nreturn msg;","outputs":1,"timeout":0,"noerr":0,"initialize":"","finalize":"","libs":[],"x":1630,"y":1120,"wires":[["a964c1ed78f49693"]]},{"id":"2f9c3275df9a8c4a","type":"inject","z":"b01c1830d752542b","name":"Close","props":[{"p":"close","v":"true","vt":"bool"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":1690,"y":1160,"wires":[["a964c1ed78f49693"]]}]
```

## Node Status Indicators

- **Green dot**: Connected (shows the current URL)
- **Yellow ring**: No URL set, connection closed, or reconnecting (shows reconnection details)
- **Red ring**: Disconnected
- **Red dot**: Connection error or reconnection failed

## Technical Details

- Automatically reconnects to the last used URL after a Node-RED restart
- Uses the WebSocket protocol (ws://) or secure WebSocket protocol (wss://)
- Uses the [ws](https://www.npmjs.com/package/ws) library for WebSocket connections
- Requires Node.js 18.0.0 or newer
- Compatible with Node-RED 3.0.0 or newer

## License

MIT

## Author

Hindurable

## Changelog

### 1.0.7
- Added message transformation features:
  - Template-based message transformation with placeholder substitution
  - Support for different message formats (JSON, MQTT, Custom)
  - Binary data transmission support
  - Message validation against templates
  - Dynamic control of transformation settings via messages

### 1.0.6
- Added authentication support with multiple methods:
  - Basic authentication (username/password)
  - Token-based authentication (Bearer tokens or custom)
  - Custom headers for advanced authentication scenarios
- Added ability to place tokens in headers or URL parameters
- Added dynamic control of authentication settings via messages

### 1.0.5
- Added advanced reconnection strategy with configurable parameters
- Implemented exponential backoff for reconnection attempts
- Added option to auto-reconnect on error or disconnection

### 1.0.4
- Added option to allow connections to WebSockets with self-signed or expired certificates

### 1.0.2
- Initial public release
