const express = require('express');
const cors = require('cors');
require('dotenv').config();
const adminRoutes = require("./routes/adminRoutes");

const authRoutes = require('./routes/authRoutes');
const metaRoutes = require('./routes/metaRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/meta', metaRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AdSight Backend berjalan!' });
});

app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});