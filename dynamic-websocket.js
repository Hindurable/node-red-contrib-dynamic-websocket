module.exports = function(RED) {
    function DynamicWebSocketNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var WebSocket = require('ws');
        var ws = null;

        // Load the stored URL from persistent storage
        node.url = node.context().get('storedUrl') || config.url || "";
        node.allowSelfSigned = config.allowSelfSigned || false;

        function connectWebSocket(url) {
            if (ws) {
                ws.close();
            }

            if (!url) {
                node.status({fill:"yellow", shape:"ring", text:"No URL set"});
                return;
            }

            node.url = url;
            // Store the URL in persistent storage
            node.context().set('storedUrl', url);

            // Create WebSocket with options for self-signed certificates if enabled
            const wsOptions = {};
            if (node.allowSelfSigned) {
                wsOptions.rejectUnauthorized = false;
            }
            ws = new WebSocket(url, wsOptions);

            ws.on('open', function() {
                node.status({fill:"green", shape:"dot", text:url});
                node.send([null, null, {state: "Connected"}]);
            });

            ws.on('close', function(code) {
                node.status({fill:"red", shape:"ring", text:"disconnected"});
                // Only send state message if it wasn't closed by msg.close
                if (code !== 1000) {
                    node.send([null, {state: "disconnected"}, null]);
                }
            });

            ws.on('error', function(error) {
                node.status({fill:"red", shape:"dot", text:"error"});
                node.error("WebSocket error: " + error);
                node.send([null, {state: "error", error: error.toString()}, null]);
            });

            ws.on('message', function(data) {
                let payload;
                try {
                    payload = JSON.parse(data);
                } catch (e) {
                    payload = data;
                }
                node.send([{payload: payload}, null, null]);
            });
        }

        // Connect on startup if URL is set
        if (node.url) {
            connectWebSocket(node.url);
        }

        node.on('input', function(msg, send, done) {
            if (msg.url) {
                // Allow dynamic override of self-signed certificate option
                if (msg.allowSelfSigned !== undefined) {
                    node.allowSelfSigned = msg.allowSelfSigned;
                }
                connectWebSocket(msg.url);
            } else if (msg.close === true) {
                if (ws) {
                    ws.close(1000);  // Use 1000 to indicate normal closure
                }
                node.url = "";
                node.context().set('storedUrl', "");
                node.status({fill:"yellow", shape:"ring", text:"closed"});
            } else if (msg.message) {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(msg.message));
                } else {
                    node.warn("WebSocket is not open. Cannot send message.");
                }
            }
            done();
        });

        node.on('close', function(done) {
            if (ws) {
                ws.close();
            }
            done();
        });
    }

    RED.nodes.registerType("dynamic-websocket", DynamicWebSocketNode, {
        defaults: {
            name: {value: ""},
            url: {value: ""},
            allowSelfSigned: {value: false}
        }
    });
}
