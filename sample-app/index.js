const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

let healthy = true;

app.get('/health', (req, res) => {
  res.status(500).json({ status: 'unhealthy' });
});

app.get('/break', (req, res) => {
  healthy = false;
  res.json({ message: 'now unhealthy' });
});

app.listen(PORT, () => {
  console.log(`sample-app listening on ${PORT}`);
});