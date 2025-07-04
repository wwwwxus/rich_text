const { WebSocketServer } = require("ws");
const Y = require("yjs");
const {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  Awareness,
} = require("y-protocols/awareness");

// 存储文档实例和awareness
const docs = new Map();
const awarenessMap = new Map();

// 存储连接的客户端信息
const clients = new Map();

// 获取或创建文档
function getYDoc(docname) {
  let doc = docs.get(docname);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(docname, doc);

    // 为每个文档创建awareness
    const awareness = new Awareness(doc);
    awarenessMap.set(docname, awareness);
  }
  return doc;
}

// 获取文档的awareness
function getAwareness(docname) {
  return awarenessMap.get(docname);
}

// 创建WebSocket服务器
function createWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  console.log("Y.js WebSocket 服务器已启动");

  wss.on("connection", (ws, req) => {
    const clientId = Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    console.log(`新的客户端连接: ${clientId}`);

    // 解析房间名称
    const url = new URL(req.url, `http://${req.headers.host}`);
    // const roomname = url.searchParams.get("room") || "collaborative-document";
    // if (!roomname) {
    // 如果没有 ?room=xxx，则用路径作为房间名
    // 去掉开头的斜杠
    roomname = url.pathname.replace(/^\//, "") || "collaborative-document";
    console.log(roomname);
    // }

    // 获取或创建文档和awareness
    const doc = getYDoc(roomname);
    const awareness = getAwareness(roomname);

    // 存储客户端信息
    clients.set(ws, {
      id: clientId,
      connectedAt: new Date(),
      lastHeartbeat: Date.now(),
      roomname: roomname,
      doc: doc,
      awareness: awareness,
    });

    // 设置WebSocket连接超时
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
      if (clients.has(ws)) {
        clients.get(ws).lastHeartbeat = Date.now();
      }
    });

    // 处理消息
    ws.on("message", (message) => {
      try {
        const data = new Uint8Array(message);

        if (data[0] === 0) {
          // 同步步骤1 - 发送状态向量
          const stateVector = Y.encodeStateVector(doc);
          const update = Y.encodeStateAsUpdate(doc, stateVector);
          if (update.length > 0) {
            ws.send(new Uint8Array([0, ...update]));
          }
        } else if (data[0] === 1) {
          // 文档更新
          Y.applyUpdate(doc, data.slice(1));

          // 广播更新到同房间的其他客户端
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
              const clientInfo = clients.get(client);
              if (clientInfo && clientInfo.roomname === roomname) {
                client.send(message);
              }
            }
          });
        } else if (data[0] === 2) {
          // 同步步骤2
          Y.applyUpdate(doc, data.slice(1));
        } else if (data[0] === 121) {
          // Awareness 更新 (queryAwareness)
          const awarenessUpdate = encodeAwarenessUpdate(
            awareness,
            Array.from(awareness.getStates().keys())
          );
          ws.send(new Uint8Array([122, ...awarenessUpdate]));
        } else if (data[0] === 122) {
          // Awareness 更新 (awarenessUpdate)
          applyAwarenessUpdate(awareness, data.slice(1), ws);

          // 广播awareness更新到同房间的其他客户端
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
              const clientInfo = clients.get(client);
              if (clientInfo && clientInfo.roomname === roomname) {
                client.send(message);
              }
            }
          });
        }
      } catch (error) {
        console.error(`处理消息时出错 ${clientId}:`, error);
      }
    });

    // 发送初始状态
    const stateVector = Y.encodeStateVector(doc);
    const update = Y.encodeStateAsUpdate(doc, stateVector);
    if (update.length > 0) {
      ws.send(new Uint8Array([0, ...update]));
    }

    // 发送当前awareness状态
    const awarenessUpdate = encodeAwarenessUpdate(
      awareness,
      Array.from(awareness.getStates().keys())
    );
    if (awarenessUpdate.length > 0) {
      ws.send(new Uint8Array([122, ...awarenessUpdate]));
    }

    ws.on("close", (code, reason) => {
      console.log(
        `客户端断开连接: ${clientId}, code: ${code}, reason: ${reason}`
      );

      if (clients.has(ws)) {
        const clientInfo = clients.get(ws);

        // 清理awareness状态
        if (clientInfo.awareness) {
          const awarenessUpdate = encodeAwarenessUpdate(
            clientInfo.awareness,
            [clientInfo.awareness.clientID],
            new Map()
          );

          // 广播awareness清理到其他客户端
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === 1) {
              const otherClientInfo = clients.get(client);
              if (
                otherClientInfo &&
                otherClientInfo.roomname === clientInfo.roomname
              ) {
                client.send(new Uint8Array([122, ...awarenessUpdate]));
              }
            }
          });
        }

        clients.delete(ws);
      }
    });

    ws.on("error", (error) => {
      console.error(`WebSocket 连接错误 ${clientId}:`, error);
      if (clients.has(ws)) {
        clients.delete(ws);
      }
    });
  });

  // 心跳检测，每30秒检查一次
  const heartbeatInterval = setInterval(() => {
    const now = Date.now();
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        console.log("清理无响应的连接");
        if (clients.has(ws)) {
          clients.delete(ws);
        }
        return ws.terminate();
      }

      // 检查是否超过5分钟没有心跳
      const clientInfo = clients.get(ws);
      if (clientInfo && now - clientInfo.lastHeartbeat > 300000) {
        console.log(`清理超时连接: ${clientInfo.id}`);
        clients.delete(ws);
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });

    console.log(
      `当前WebSocket连接数: ${clients.size}`,
      clients.keys(),
      clients.values()
    );
  }, 30000);

  wss.on("error", (error) => {
    console.error("WebSocket 服务器错误:", error);
  });

  // 清理函数
  const cleanup = () => {
    console.log("正在关闭WebSocket服务器...");
    clearInterval(heartbeatInterval);
    wss.close(() => {
      console.log("WebSocket服务器已关闭");
    });
  };

  return { wss, cleanup };
}

module.exports = { createWebSocketServer };
