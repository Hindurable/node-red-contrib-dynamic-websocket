module.exports = function(RED) {
    function DynamicWebSocketNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        var WebSocket = require('ws');
        var ws = null;
        var reconnectTimeout = null;
        var reconnectAttempts = 0;

        // Load the stored URL from persistent storage
        node.url = node.context().get('storedUrl') || config.url || "";
        node.allowSelfSigned = config.allowSelfSigned || false;
        
        // Reconnection settings
        node.autoReconnect = config.autoReconnect || false;
        node.reconnectAttempts = config.reconnectAttempts || 0; // 0 = unlimited
        node.reconnectInterval = config.reconnectInterval || 5000; // Default: 5 seconds
        node.useExponentialBackoff = config.useExponentialBackoff || false;
        
        // Authentication settings
        node.authType = config.authType || 'none';
        node.username = config.username || '';
        node.password = config.password || '';
        node.token = config.token || '';
        node.tokenLocation = config.tokenLocation || 'header';
        node.tokenKey = config.tokenKey || 'Authorization';
        
        // Custom headers - parse from JSON if provided
        try {
            node.headers = config.headers ? JSON.parse(config.headers) : {};
        } catch (e) {
            node.warn("Invalid headers JSON: " + e.message);
            node.headers = {};
        }
        
        // Message transformation settings
        node.transformMessages = config.transformMessages || false;
        node.messageFormat = config.messageFormat || 'json';
        node.binarySupport = config.binarySupport || false;
        node.validateMessages = config.validateMessages || false;
        
        // Message template - parse from JSON if provided
        try {
            node.messageTemplate = config.messageTemplate ? JSON.parse(config.messageTemplate) : {};
        } catch (e) {
            node.warn("Invalid message template JSON: " + e.message);
            node.messageTemplate = {};
        }

        function calculateReconnectDelay() {
            // Calculate delay with exponential backoff if enabled
            if (node.useExponentialBackoff) {
                // Cap the exponent to avoid extremely long delays
                const exponent = Math.min(reconnectAttempts, 10);
                // Base delay * 2^attempt with some randomization to avoid thundering herd
                return Math.floor(node.reconnectInterval * Math.pow(1.5, exponent) * (0.8 + Math.random() * 0.4));
            } else {
                return node.reconnectInterval;
            }
        }

        function scheduleReconnect() {
            // Clear any existing reconnect timeout
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }

            // Check if we've exceeded the maximum number of attempts
            if (node.reconnectAttempts > 0 && reconnectAttempts >= node.reconnectAttempts) {
                node.status({fill:"red", shape:"dot", text:"reconnect failed after " + reconnectAttempts + " attempts"});
                node.send([null, {state: "reconnect_failed", attempts: reconnectAttempts}, null]);
                reconnectAttempts = 0;
                return;
            }

            // Calculate delay with exponential backoff if enabled
            const delay = calculateReconnectDelay();
            
            node.status({fill:"yellow", shape:"ring", text:"reconnecting in " + Math.floor(delay/1000) + "s (attempt " + (reconnectAttempts + 1) + ")"});
            
            reconnectTimeout = setTimeout(function() {
                reconnectAttempts++;
                node.status({fill:"yellow", shape:"ring", text:"reconnecting... attempt " + reconnectAttempts});
                node.send([null, {state: "reconnecting", attempt: reconnectAttempts}, null]);
                connectWebSocket(node.url);
            }, delay);
        }

        function connectWebSocket(url) {
            // Clear any existing reconnect timeout
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }

            if (!url) {
                node.status({fill:"yellow", shape:"ring", text:"No URL set"});
                return;
            }

            node.url = url;
            // Store the URL in persistent storage
            node.context().set('storedUrl', url);

            // Create WebSocket with options for self-signed certificates and authentication
            const wsOptions = {};
            const headers = {};
            
            // Handle self-signed certificates
            if (node.allowSelfSigned) {
                wsOptions.rejectUnauthorized = false;
            }
            
            // Handle authentication
            if (node.authType === 'basic') {
                // Basic authentication
                const auth = 'Basic ' + Buffer.from(node.username + ':' + node.password).toString('base64');
                headers['Authorization'] = auth;
            } else if (node.authType === 'token') {
                // Token-based authentication
                if (node.tokenLocation === 'header') {
                    // Add token to headers
                    const tokenValue = node.tokenKey.toLowerCase() === 'authorization' && !node.token.startsWith('Bearer ') 
                        ? 'Bearer ' + node.token 
                        : node.token;
                    headers[node.tokenKey] = tokenValue;
                } else if (node.tokenLocation === 'url' && url.indexOf('?') === -1) {
                    // Add token to URL as query parameter
                    url = url + '?' + encodeURIComponent(node.tokenKey) + '=' + encodeURIComponent(node.token);
                } else if (node.tokenLocation === 'url') {
                    // Add token to existing URL query parameters
                    url = url + '&' + encodeURIComponent(node.tokenKey) + '=' + encodeURIComponent(node.token);
                }
            }
            
            // Add custom headers
            if (node.headers && typeof node.headers === 'object') {
                Object.assign(headers, node.headers);
            }
            
            // Set headers in options
            if (Object.keys(headers).length > 0) {
                wsOptions.headers = headers;
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
                    node.send([null, {state: "disconnected", code: code}, null]);
                    
                    // Auto reconnect if enabled and it wasn't a normal closure
                    if (node.autoReconnect && code !== 1000 && node.url) {
                        scheduleReconnect();
                    }
                } else {
                    // Reset reconnect attempts on normal closure
                    reconnectAttempts = 0;
                }
            });

            ws.on('error', function(error) {
                node.status({fill:"red", shape:"dot", text:"error"});
                node.error("WebSocket error: " + error);
                node.send([null, {state: "error", error: error.toString()}, null]);
                
                // The 'close' event will be triggered after the error event
                // Auto-reconnect will be handled there
            });

            ws.on('message', function(data) {
                let payload;
                
                // Handle binary data if enabled
                if (node.binarySupport && data instanceof Buffer) {
                    payload = {
                        binary: true,
                        data: data,
                        length: data.length
                    };
                } else {
                    // Try to parse as JSON if not binary or binary not enabled
                    try {
                        payload = JSON.parse(data);
                    } catch (e) {
                        payload = data;
                    }
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
                node.log("Received msg.url: " + msg.url);
                // Allow dynamic override of self-signed certificate option
                if (msg.allowSelfSigned !== undefined) {
                    node.allowSelfSigned = msg.allowSelfSigned;
                }
                
                // Allow dynamic override of reconnection settings
                if (msg.autoReconnect !== undefined) {
                    node.autoReconnect = msg.autoReconnect;
                }
                if (msg.reconnectAttempts !== undefined) {
                    node.reconnectAttempts = msg.reconnectAttempts;
                }
                if (msg.reconnectInterval !== undefined) {
                    node.reconnectInterval = msg.reconnectInterval;
                }
                if (msg.useExponentialBackoff !== undefined) {
                    node.useExponentialBackoff = msg.useExponentialBackoff;
                }
                
                // Allow dynamic override of authentication settings
                if (msg.authType !== undefined) {
                    node.authType = msg.authType;
                }
                if (msg.username !== undefined) {
                    node.username = msg.username;
                }
                if (msg.password !== undefined) {
                    node.password = msg.password;
                }
                if (msg.token !== undefined) {
                    node.token = msg.token;
                }
                if (msg.tokenLocation !== undefined) {
                    node.tokenLocation = msg.tokenLocation;
                }
                if (msg.tokenKey !== undefined) {
                    node.tokenKey = msg.tokenKey;
                }
                if (msg.headers !== undefined) {
                    if (typeof msg.headers === 'object') {
                        node.headers = msg.headers;
                    } else if (typeof msg.headers === 'string') {
                        try {
                            node.headers = JSON.parse(msg.headers);
                        } catch (e) {
                            node.warn("Invalid headers JSON in message: " + e.message);
                        }
                    }
                }
                
                // Allow dynamic override of message transformation settings
                if (msg.transformMessages !== undefined) {
                    node.transformMessages = msg.transformMessages;
                }
                if (msg.messageFormat !== undefined) {
                    node.messageFormat = msg.messageFormat;
                }
                if (msg.binarySupport !== undefined) {
                    node.binarySupport = msg.binarySupport;
                }
                if (msg.validateMessages !== undefined) {
                    node.validateMessages = msg.validateMessages;
                }
                if (msg.messageTemplate !== undefined) {
                    if (typeof msg.messageTemplate === 'object') {
                        node.messageTemplate = msg.messageTemplate;
                    } else if (typeof msg.messageTemplate === 'string') {
                        try {
                            node.messageTemplate = JSON.parse(msg.messageTemplate);
                        } catch (e) {
                            node.warn("Invalid message template JSON in message: " + e.message);
                        }
                    }
                }
                
                // Update the node URL and store it persistently before connecting
                node.url = msg.url;
                node.context().set('storedUrl', msg.url);
                
                // Reset reconnect attempts when connecting to a new URL
                reconnectAttempts = 0;
                connectWebSocket(msg.url);
            } else if (msg.reconnect === true) {
                // Force a reconnection if we have a URL
                if (node.url) {
                    reconnectAttempts = 0;
                    connectWebSocket(node.url);
                }
            } else if (msg.close === true) {
                // Clear any reconnection timeout
                if (reconnectTimeout) {
                    clearTimeout(reconnectTimeout);
                    reconnectTimeout = null;
                }
                
                if (ws) {
                    ws.close(1000);  // Use 1000 to indicate normal closure
                }
                node.url = "";
                node.context().set('storedUrl', "");
                reconnectAttempts = 0;
                node.status({fill:"yellow", shape:"ring", text:"closed"});
            } else if (msg.message) {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    // Handle message transformation if enabled
                    if (node.transformMessages && !msg.skipTransform) {
                        let transformedMessage = transformMessage(msg.message);
                        if (transformedMessage !== null) {
                            // Handle binary data if enabled
                            if (node.binarySupport && msg.binary === true && Buffer.isBuffer(transformedMessage)) {
                                ws.send(transformedMessage);
                            } else {
                                ws.send(JSON.stringify(transformedMessage));
                            }
                        }
                    } else {
                        // Handle binary data if enabled
                        if (node.binarySupport && msg.binary === true && Buffer.isBuffer(msg.message)) {
                            ws.send(msg.message);
                        } else {
                            ws.send(JSON.stringify(msg.message));
                        }
                    }
                } else {
                    node.warn("WebSocket is not open. Cannot send message.");
                }
            }
            done();
        });

        node.on('close', function(done) {
            // Clear any reconnection timeout
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
            
            if (ws) {
                ws.close();
            }
            done();
        });
    }

    // Function to transform messages based on selected format and template
    function transformMessage(message) {
        try {
            // Skip transformation for null or undefined messages
            if (message === null || message === undefined) {
                return null;
            }
            
            // Apply template if available
            if (Object.keys(node.messageTemplate).length > 0) {
                let result = JSON.parse(JSON.stringify(node.messageTemplate)); // Clone template
                
                // Simple placeholder replacement for string values
                function replaceValues(obj, data) {
                    for (let key in obj) {
                        if (typeof obj[key] === 'string' && obj[key].startsWith('$')) {
                            const placeholder = obj[key].substring(1); // Remove $ prefix
                            if (data[placeholder] !== undefined) {
                                obj[key] = data[placeholder];
                            }
                        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                            replaceValues(obj[key], data);
                        }
                    }
                    return obj;
                }
                
                result = replaceValues(result, message);
                
                // Validate message if validation is enabled
                if (node.validateMessages) {
                    // Implement validation logic based on message format
                    // For now, just check if required fields are present
                    let valid = true;
                    for (let key in result) {
                        if (result[key] === undefined || result[key] === null) {
                            valid = false;
                            node.warn("Message validation failed: Missing required field '" + key + "'");
                            break;
                        }
                    }
                    if (!valid) {
                        return null;
                    }
                }
                
                return result;
            } else {
                // No template, just return the original message
                return message;
            }
        } catch (e) {
            node.warn("Message transformation failed: " + e.message);
            return null;
        }
    }
    
    RED.nodes.registerType("dynamic-websocket", DynamicWebSocketNode, {
        defaults: {
            name: {value: ""},
            url: {value: ""},
            allowSelfSigned: {value: false},
            autoReconnect: {value: false},
            reconnectAttempts: {value: 0},
            reconnectInterval: {value: 5000},
            useExponentialBackoff: {value: false},
            authType: {value: "none"},
            username: {value: ""},
            password: {value: "", type: "password"},
            token: {value: "", type: "password"},
            tokenLocation: {value: "header"},
            tokenKey: {value: "Authorization"},
            headers: {value: ""},
            transformMessages: {value: false},
            messageFormat: {value: "json"},
            binarySupport: {value: false},
            validateMessages: {value: false},
            messageTemplate: {value: ""}
        }
    });
}
