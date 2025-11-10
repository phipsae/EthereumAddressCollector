const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1><p>Railway is working!</p>');
});

app.get('/test', (req, res) => {
  res.json({ status: 'working', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

