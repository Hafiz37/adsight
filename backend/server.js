// server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import route auth
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware global
app.use(cors());
app.use(express.json());

// Daftarkan route auth
app.use('/api/auth', authRoutes);

// Route test
app.get('/', (req, res) => {
  res.json({ message: 'AdSight Backend berjalan!' });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});