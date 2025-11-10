const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

console.log("=== SERVER STARTING ===");
console.log("Environment PORT:", process.env.PORT);
console.log("Using PORT:", PORT);
console.log("Node version:", process.version);

app.get("/", (req, res) => {
  res.send("<h1>✅ Hello World!</h1><p>Railway is working!</p><p>Port: " + PORT + "</p>");
});

app.get("/test", (req, res) => {
  res.json({ 
    status: "working", 
    port: PORT,
    env_port: process.env.PORT,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`Server address:`, server.address());
});

server.on('error', (err) => {
  console.error("❌ Server error:", err);
});
