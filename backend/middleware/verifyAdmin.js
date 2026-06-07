// backend/src/middleware/verifyAdmin.js
// Middleware untuk mengecek apakah user adalah ADMIN

const verifyAdmin = (req, res, next) => {
  try {
    // Pastikan token sudah di-verify oleh auth middleware sebelumnya
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Token tidak valid. Silakan login terlebih dahulu."
      });
    }

    // Cek apakah role adalah ADMIN
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        status: "error",
        message: "Anda tidak memiliki izin akses. Hanya admin yang bisa mengakses fitur ini."
      });
    }

    // Jika admin, lanjut ke endpoint selanjutnya
    next();
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan saat verifikasi admin.",
      error: error.message
    });
  }
};

module.exports = verifyAdmin;