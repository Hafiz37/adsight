// controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// =====================
// REGISTER
// =====================
const register = async (req, res) => {
  try {
    let { email, password } = req.body;
    
    // Normalize email
    if (email) {
      email = email.trim().toLowerCase();
    }

    // 1. Validasi input tidak kosong
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    // 2. Validasi format email sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format email tidak valid.' });
    }

    // 3. Validasi panjang password
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter.' });
    }

    // 4. Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }

    // 5. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Simpan user baru ke database
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'USER',
      },
    });

    return res.status(201).json({
      message: 'Registrasi berhasil!',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });

  } catch (error) {
    console.error('Error register:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

// =====================
// LOGIN
// =====================
const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    
    // Normalize email
    if (email) {
      email = email.trim().toLowerCase();
    }

    // 1. Validasi input tidak kosong
    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password wajib diisi.' });
    }

    // 2. Cari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // 3b. Cek jika user sedang di-ban
    if (user.isBanned) {
      return res.status(403).json({
        message: `Akun Anda telah dinonaktifkan/ditangguhkan. Alasan: ${user.banReason || 'Tidak disebutkan'}`
      });
    }

    // 4. Buat JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // token berlaku 7 hari
    );

    return res.status(200).json({
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Error login:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
};

module.exports = { register, login };