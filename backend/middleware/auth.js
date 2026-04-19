// middleware/auth.js

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Ambil token dari header Authorization
  const authHeader = req.headers['authorization'];

  // Format header harus: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // simpan data user ke request
    next(); // lanjut ke route handler
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
};

// Middleware khusus untuk admin saja
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya untuk admin.' });
    }
    next();
  });
};

module.exports = { verifyToken, verifyAdmin };