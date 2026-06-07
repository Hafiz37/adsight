// middleware/auth.js

const jwt = require('jsonwebtoken');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Middleware untuk memverifikasi token JWT dan 
 * memastikan user masih ada di database.
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

    if (!token) {
      return res.status(401).json({ 
        status: "error",
        message: 'Akses ditolak. Token tidak ditemukan.' 
      });
    }

    // 1. Verifikasi integritas token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 2. ✨ Ambil data user terbaru dari database (Fitur Code 2)
    // Ini memastikan jika user sudah dihapus/diblokir, token tidak bisa dipakai lagi
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id },
      select: {
        id: true,
        email: true,
        role: true, // Penting untuk pengecekan admin nanti
        isBanned: true,
        banReason: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        status: "error",
        message: 'User sudah tidak terdaftar.' 
      });
    }

    // Blokir jika user sedang di-ban
    if (user.isBanned) {
      return res.status(403).json({
        status: "error",
        message: `Akun Anda telah dinonaktifkan/ditangguhkan. Alasan: ${user.banReason || 'Tidak disebutkan'}`
      });
    }

    // 3. Simpan data user ke request agar bisa dipakai di controller
    req.user = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role
    };
    next();

  } catch (error) {
    // Penanganan error yang lebih spesifik (Fitur Code 2)
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        status: "error", 
        message: "Token sudah kadaluarsa. Silakan login kembali." 
      });
    }
    
    return res.status(401).json({ 
      status: "error",
      message: 'Token tidak valid.' 
    });
  }
};

/**
 * Middleware khusus untuk akses Admin saja (Fitur Code 1)
 * Digunakan setelah verifyToken
 */
const verifyAdmin = (req, res, next) => {
  // Kita tidak perlu panggil verifyToken di dalam sini lagi,
  // cukup cek req.user yang sudah diisi oleh middleware sebelumnya.
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      status: "error",
      message: 'Akses ditolak. Fitur ini hanya untuk admin.' 
    });
  }
  next();
};

module.exports = { verifyToken, verifyAdmin };