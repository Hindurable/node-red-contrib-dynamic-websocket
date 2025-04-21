# node-red-contrib-dynamic-websocket

A flexible Node-RED node that enables dynamic WebSocket connections at runtime. Unlike the standard WebSocket node, this node allows you to change the WebSocket URL during flow execution, making it ideal for applications that need to connect to different WebSocket endpoints based on runtime conditions.

## Features

- **Dynamic URL Configuration**: Change WebSocket connection URLs at runtime via message properties
- **Connection State Monitoring**: Separate outputs for connection status changes and successful connections
- **Persistent Connections**: Remembers the last connected URL even after Node-RED restarts
- **JSON Parsing**: Automatically parses incoming WebSocket messages as JSON when possible
- **Connection Management**: Easily close connections and clear stored URLs

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

### Outputs

1. **Top Output**: Received WebSocket messages
   - **msg.payload**: Data received from the WebSocket (parsed as JSON if possible)

2. **Middle Output**: Connection state changes
   - **msg.state**: Current connection state ("disconnected" or "error")
   - **msg.error**: Error message (when state is "error")

3. **Bottom Output**: Connection established notification
   - **msg.state**: "Connected" when a connection is successfully established

## Configuration

- **Name**: Node name displayed in the flow
- **Default URL**: Initial WebSocket URL to connect to (can be overridden at runtime)

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
- **Yellow ring**: No URL set or connection closed
- **Red ring**: Disconnected
- **Red dot**: Connection error

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

### 1.0.2
- Initial public release
