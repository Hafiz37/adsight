# AdSight

**AdSight** adalah platform **Digital Marketing Virtual Consultant** berbasis web yang membantu pengelola, pemilik bisnis, dan digital marketer untuk memonitor, menganalisis, serta mengoptimalkan kampanye **Meta (Facebook) Ads** secara cerdas. Dilengkapi dengan **AI Analysis Engine**, sistem memberikan skor performa, rekomendasi prioritas, dan laporan PDF untuk setiap kampanye — menjadikannya asisten virtual all-in-one untuk pengelolaan iklan digital.

---

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Struktur Folder](#struktur-folder)
- [Penjelasan Folder Penting](#penjelasan-folder-penting)
- [Database Schema & Migrations](#database-schema--migrations)
- [AI pada Project Ini](#ai-pada-project-ini)
- [UML](#uml)
- [Instalasi & Setup Lokal](#instalasi--setup-lokal)
- [API Documentation](#api-documentation)
- [Lisensi](#lisensi)

---

## Fitur

### 1. Autentikasi Pengguna
- **Register** — Mendaftar akun baru dengan email dan password (min 6 karakter).
- **Login** — Masuk dengan JWT token (berlaku 7 hari).
- **Proteksi Route** — Halaman tertentu hanya bisa diakses oleh pengguna yang sudah login (PrivateRoute) atau admin (AdminRoute).
- **Cek Ban** — Pengguna yang di-ban tidak bisa login; token tidak valid jika akun dinonaktifkan.

### 2. Integrasi Meta Ads (OAuth 2.0)
- **Koneksi OAuth** — Connect ke Facebook Ads via Facebook Graph API v18.0.
- **Callback Handling** — Menerima authorization code dan menukarnya dengan access token.
- **Penyimpanan Koneksi** — Menyimpan access token, account ID, dan account name ke database (upsert).
- **Multi-Akun** — Mendukung multiple ad accounts per pengguna (dibatasi unique constraint userId + accountId).
- **Putus Koneksi** — Menghapus koneksi Meta Ads dan seluruh data terkait (campaigns cascade delete).

### 3. Manajemen Kampanye
- **Ambil Kampanye** — Fetch daftar kampanye langsung dari Meta Ads API dan simpan ke database lokal.
- **Insight Detail** — Melihat metrik performa kampanye (spend, impressions, clicks, CTR, ROAS, reach) secara real-time dari Meta API.
- **Riwayat Harian** — Daily breakdown untuk grafik performa per hari (spend, CTR, ROAS) dengan fallback agregat jika data harian tidak tersedia.
- **Filter Tanggal** — Filter data insight berdasarkan rentang tanggal tertentu.
- **Status Kampanye** — Mendeteksi kampanye PAUSED dan memberikan informasi khusus.

### 4. AI-Powered Analysis
- **Microservice AI** — Python Flask (port 5001) yang menerima metrik kampanye dan mengembalikan skor serta rekomendasi.
- **Skor Performa (0-100)** — Dihitung dengan weighted average:
  - **CTR (40%)** — Click-Through Rate: `< 1%` buruk, `1-3%` cukup, `> 3%` bagus.
  - **ROAS (40%)** — Return on Ad Spend: `< 2x` buruk, `2-4x` cukup, `> 4x` bagus.
  - **Reach (20%)** — Jangkauan per spend (RPM): `< 100` buruk, `100-500` cukup, `> 500` bagus.
- **Label & Warna**:
  - **Buruk** (merah): skor `< 40`
  - **Cukup** (kuning): skor `40-69`
  - **Bagus** (hijau): skor `>= 70`
- **Rekomendasi Prioritas** — Rekomendasi otomatis berdasarkan metrik dengan level:
  - **High** — Segera perbaiki (CTR rendah, ROAS rendah, jangkauan sempit).
  - **Medium** — Rencanakan perbaikan (CTR cukup, ROAS belum optimal).
  - **Low** — Pertahankan atau optimasi lanjutan (skor bagus, scaling suggestion).
- **Kategori Rekomendasi**: Creative, Budget & Audience, Distribution, Scaling, Optimization, General.
- **Penyimpanan Hasil** — Skor dan rekomendasi disimpan ke database (tabel `ai_recommendations`) sehingga tidak perlu diproses ulang.

### 5. Dashboard Pengguna
- **Ringkasan Kampanye** — Daftar kampanye terbaru dengan metrik utama.
- **Koneksi Meta Ads** — Tombol connect/disconnect dengan modal interaktif.
- **Skor & Gauge** — Visualisasi skor AI dengan gauge meter.
- **Filter Pencarian** — Filter kampanye berdasarkan nama, status, atau tanggal.
- **Kartu Metrik** — MetricCard untuk menampilkan nilai spend, impressions, CTR, ROAS.

### 6. Laporan PDF
- **Export PDF** — Menggunakan html2canvas + jsPDF untuk menghasilkan laporan kampanye dalam format PDF.
- **Template Laporan** — ReportTemplate dengan layout profesional (logo, header, tabel metrik, grafik, rekomendasi AI, tanda tangan).

### 7. Admin Panel
- **Dashboard Admin** — Statistik platform: total users, total campaigns, total spend, average ROAS, average CTR, kampanye berperforma rendah, dan audit log terbaru.
- **Manajemen User** — CRUD user dengan pagination:
  - Lihat daftar semua user + meta accounts + campaigns.
  - Detail user dengan audit logs.
  - Update role (USER ↔ ADMIN).
  - Ban/Unban user dengan alasan.
  - Hapus user permanent (dengan cascade).
  - Reset password + kirim email notifikasi.
- **Monitoring Kampanye** — Lihat semua kampanye seluruh user dengan filter:
  - Pencarian nama, filter status, filter userId/email.
  - Filter range spend dan ROAS.
  - Sorting multi-kolom (name, status, spend, roas, ctr, reach, date).
  - Pagination.
- **Analitik Kampanye** — Agregat performa semua kampanye:
  - Total kampanye, total spend, total reach, rata-rata ROAS & CTR.
  - Breakdown status kampanye (ACTIVE, PAUSED, DELETED, ARCHIVED).
  - Distribusi skor AI (excellent >= 80, good 60-79, fair 40-59, poor < 40).
- **Audit Log** — Catatan aktivitas lengkap:
  - Filter berdasarkan userId, action, resourceType.
  - Pagination.
  - Cleanup otomatis (retention policy, default hapus log > 90 hari).

### 8. Audit Trail
Setiap aksi penting di aplikasi dicatat ke tabel `audit_logs`:
- Login, logout, registrasi.
- CRUD user oleh admin.
- View data sensitif (detail user, daftar user, audit logs).
- Ban/unban, reset password.
- Melihat dashboard, kampanye, analitik.

### 9. Email Service
- **Nodemailer** — Mengirim email reset password.
- **Ethereal Fallback** — Jika SMTP tidak dikonfigurasi, menggunakan Ethereal test email (bisa dilihat preview URL-nya).
- **JSON Transport** — Fallback terakhir jika Ethereal gagal.

---

## Teknologi yang Digunakan

### Backend (API Server)
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Node.js | - | Runtime JavaScript |
| Express | 5.x | Web framework REST API |
| Prisma | 5.x | ORM untuk database MySQL |
| MySQL | - | Database relasional |
| JSON Web Token | 9.x | Autentikasi stateless |
| bcryptjs | 3.x | Hashing password |
| Axios | 1.x | HTTP client ke Meta Graph API & AI Service |
| Nodemailer | 8.x | Email service (reset password) |
| crypto-js | 4.x | Enkripsi data (tersedia) |
| express-validator | 7.x | Validasi request (tersedia) |
| dotenv | 17.x | Environment variables |
| cors | 2.x | CORS middleware |

### Frontend (SPA)
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| React | 19.x | UI framework |
| Vite | 8.x | Build tool & dev server |
| TailwindCSS | 4.x | Utility-first CSS framework |
| React Router DOM | 7.x | Client-side routing |
| Recharts | 3.x | Charting library (grafik performa) |
| Axios | 1.x | HTTP client ke backend API |
| jsPDF | 4.x | Generate PDF laporan |
| html2canvas | 1.4.x | Capture DOM untuk PDF |

### AI Service
| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Python | - | Runtime AI engine |
| Flask | - | Web framework microservice |
| Flask-CORS | - | CORS untuk komunikasi antar service |

---

## Struktur Folder

```
adsight/
├── .gitignore
├── README.md
├── UML/                              # Diagram UML (Use Case, Class, Sequence, Activity)
│   ├── useCase.jpg
│   ├── class.jpg
│   ├── sequence.jpg
│   └── activity.jpg
│
├── backend/                          # REST API Server (Express + Prisma)
│   ├── .env                          # Environment variables
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js                     # Entry point Express
│   ├── check_admin.js                # Utility script
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema (5 models)
│   │   ├── prisma.config.ts          # Prisma configuration
│   │   └── migrations/
│   │       ├── migration_lock.toml
│   │       ├── 20260419064234_init/  # Migration awal
│   │       └── 20260425134354_add_meta_campaign_id/  # Migration add unique constraints
│   ├── controllers/
│   │   ├── authController.js         # Register & Login
│   │   ├── metaController.js         # Meta Ads integration
│   │   └── adminController.js        # Admin CRUD & analytics
│   ├── routes/
│   │   ├── authRoutes.js             # /api/auth/*
│   │   ├── metaRoutes.js             # /api/meta/*
│   │   └── adminRoutes.js            # /api/admin/*
│   ├── middleware/
│   │   ├── auth.js                   # JWT verification
│   │   └── verifyAdmin.js            # Admin role check
│   └── services/
│       ├── adminService.js           # Business logic admin
│       └── mailService.js            # Email service (Nodemailer)
│
├── frontend/                         # React SPA (Vite + TailwindCSS)
│   ├── package.json
│   ├── package-lock.json
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── src/
│       ├── main.jsx                  # React entry point
│       ├── App.jsx                   # Router configuration
│       ├── index.css                 # TailwindCSS import
│       ├── App.css                   # Additional styles
│       ├── assets/
│       │   ├── hero.png
│       │   ├── react.svg
│       │   └── vite.svg
│       ├── components/
│       │   ├── AdminLayout.jsx       # Layout halaman admin
│       │   ├── AdminRoute.jsx        # Route protector admin
│       │   ├── ConnectMetaModal.jsx  # Modal koneksi Meta Ads
│       │   ├── ErrorAlert.jsx        # Alert error
│       │   ├── ErrorBoundary.jsx     # Error boundary React
│       │   ├── ExportPDFButton.jsx   # Tombol export PDF
│       │   ├── FilterBar.jsx         # Filter pencarian
│       │   ├── LoadingSpinner.jsx    # Loading indicator
│       │   ├── MetricCard.jsx        # Kartu metrik
│       │   ├── PageAI.jsx            # AI Analysis section
│       │   ├── PageCampaigns.jsx     # Daftar kampanye
│       │   ├── PageReport.jsx        # Halaman laporan
│       │   ├── PerformanceChart.jsx  # Grafik performa (Recharts)
│       │   ├── PrivateRoute.jsx      # Route protector user
│       │   ├── RecommendationCard.jsx# Kartu rekomendasi AI
│       │   ├── ReportTemplate.jsx    # Template PDF
│       │   └── ScoreGauge.jsx        # Gauge skor AI
│       ├── hooks/
│       │   └── useFetchInsights.js   # Custom hook fetch insights
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Dashboard.jsx         # Dashboard utama
│       │   ├── Recommendations.jsx   # Halaman rekomendasi AI
│       │   └── admin/
│       │       ├── AdminDashboard.jsx
│       │       ├── UserManagement.jsx
│       │       ├── CampaignMonitoring.jsx
│       │       └── AuditLog.jsx
│       └── utils/
│           ├── adminService.js       # API client admin
│           └── exportToPDF.js        # Utility export PDF
│
└── ai-service/                       # Python Flask AI Microservice
    ├── app.py                        # Flask server (port 5001)
    └── venv/                         # Python virtual environment
```

---

## Penjelasan Folder Penting

### `backend/`
Inti dari REST API server. Menggunakan **Express** dengan arsitektur MVC.

- **`server.js`**: Entry point aplikasi, konfigurasi middleware (CORS, JSON parser), dan registrasi route groups (`/api/auth`, `/api/meta`, `/api/admin`).
- **`prisma/schema.prisma`**: Definisi kelima model database beserta relasi, enum, unique constraints, dan mapping nama tabel.
- **`controllers/`**: Handler untuk setiap endpoint — memproses request, memanggil service, dan mengembalikan response.
- **`routes/`**: Definisi endpoint dan middleware chain-nya.
- **`middleware/`**: Middleware JWT verification (verify token + cek user aktif di DB) dan admin role check.
- **`services/`**: Business logic — pemisahan concern dari controller, akses database via Prisma.

### `frontend/`
Single Page Application menggunakan React + Vite + TailwindCSS v4.

- **`src/components/`**: 17 komponen reusable — dari modal, kartu, grafik, hingga layout dan route guard.
- **`src/pages/`**: 5 halaman utama (Login, Register, Dashboard, Recommendations) + 4 halaman admin.
- **`src/hooks/`**: Custom hook `useFetchInsights` untuk fetching data kampanye dari API.
- **`src/utils/`**: Utility functions — API client untuk admin endpoints dan export PDF.

### `ai-service/`
Microservice Python Flask terpisah yang menangani perhitungan skor AI dan generasi rekomendasi.

- **`app.py`**: 2 endpoint — `POST /analyze` (menerima metrik, mengembalikan skor + rekomendasi) dan `GET /health`.

### `UML/`
Berisi diagram perancangan sistem dalam format JPEG:
- **Use Case Diagram** — Interaksi aktor (User, Admin) dengan sistem.
- **Class Diagram** — Struktur kelas/model sistem.
- **Sequence Diagram** — Alur interaksi antar objek.
- **Activity Diagram** — Alur aktivitas dalam sistem.

---

## Database Schema & Migrations

### Model-Model

#### User (`users`)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | Int (PK, autoincrement) | Primary key |
| email | String (unique) | Email pengguna |
| password | String | Password ter-hash (bcrypt) |
| role | Enum (ADMIN \| USER) | Role pengguna |
| isBanned | Boolean | Status banned |
| banReason | String? | Alasan banned |
| bannedAt | DateTime? | Waktu di-ban |
| suspendedAt | DateTime? | Waktu suspend |
| createdAt | DateTime | Auto-set saat dibuat |
| updatedAt | DateTime | Auto-update |

Relasi: `metaAccounts[]`, `auditLogs[]`

#### MetaAccount (`meta_accounts`)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | Int (PK, autoincrement) | Primary key |
| userId | Int (FK → User) | Pemilik akun |
| accessToken | Text | Token akses Meta |
| accountId | String | ID akun Meta Ads |
| accountName | String | Nama akun Meta Ads |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-update |

Unique constraint: `[userId, accountId]` — satu pengguna hanya bisa menghubungkan akun Meta yang sama sekali.
Relasi: `user`, `campaigns[]`

#### Campaign (`campaigns`)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | Int (PK, autoincrement) | Primary key |
| metaAccountId | Int (FK → MetaAccount) | Pemilik kampanye |
| metaCampaignId | String | ID kampanye dari Meta |
| name | String | Nama kampanye |
| status | Enum (ACTIVE \| PAUSED \| DELETED \| ARCHIVED) | Status kampanye |
| spend | Float | Total spend |
| ctr | Float | Click-Through Rate |
| roas | Float | Return on Ad Spend |
| reach | Int | Jangkauan |
| date | DateTime | Tanggal data |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-update |

Unique constraint: `[metaAccountId, metaCampaignId]`
Relasi: `metaAccount`, `aiRecommendation`

#### AiRecommendation (`ai_recommendations`)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | Int (PK, autoincrement) | Primary key |
| campaignId | Int (FK → Campaign, unique) | Kampanye |
| score | Int | Skor AI (0-100) |
| recommendations | Json | Array rekomendasi |
| label | String | Label performa |
| color | String | Warna label |
| createdAt | DateTime | Auto-set |
| updatedAt | DateTime | Auto-update |

Relasi: `campaign`

#### AuditLog (`audit_logs`)
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | Int (PK, autoincrement) | Primary key |
| userId | Int? (FK → User) | Pelaku aksi |
| action | String | Tipe aksi |
| resourceType | String | Tipe resource |
| resourceId | String | ID resource |
| description | Text | Deskripsi aksi |
| ipAddress | String? | IP address |
| userAgent | String? | User agent |
| timestamp | DateTime | Waktu aksi |

Indexes: `[userId]`, `[action]`, `[timestamp]`
Relasi: `user`

### Migrations

**Migration 1 — `20260419064234_init`**: Membuat seluruh tabel awal (users, meta_accounts, campaigns, ai_recommendations) dengan foreign key dan unique index untuk email.

**Migration 2 — `20260425134354_add_meta_campaign_id`**: Menambahkan kolom `metaCampaignId` di tabel campaigns, serta unique constraints `[metaAccountId, metaCampaignId]` di campaigns dan `[userId, accountId]` di meta_accounts.

### Entity Relationship Diagram (Ringkasan)

```
User 1 ──── * MetaAccount 1 ──── * Campaign 1 ──── 1 AiRecommendation
  │
  └── * AuditLog
```

---

## AI pada Project Ini

AdSight memiliki **AI Analysis Engine** yang berjalan sebagai microservice terpisah (Python/Flask) di port 5001. berikut penjelasan detail mengenai cara kerja AI pada sistem ini.

### Arsitektur AI

```
┌─────────────┐     HTTP POST /analyze     ┌──────────────┐
│  Backend     │ ──────────────────────────→ │  AI Service  │
│  (Express)   │                              │  (Flask)     │
│  Port 5000   │ ←────────────────────────── │  Port 5001   │
└─────────────┘     JSON (score + reco)      └──────────────┘
```

Backend mengirimkan metrik kampanye ke AI Service, lalu AI Service mengembalikan skor dan rekomendasi yang sudah dihitung.

### Alur Analisis AI

1. **User memicu analisis** — Bisa dilakukan secara eksplisit via endpoint `POST /api/meta/campaigns/:id/analyze` atau otomatis saat mengakses halaman rekomendasi.
2. **Backend fetch data dari Meta API** — Mengambil metrik real-time (spend, impressions, clicks, CTR, actions, action_values) dari Facebook Graph API v18.0.
3. **Backend mengirim ke AI Service** — Empat metrik dikirim: `ctr`, `roas`, `reach`, `spend`.
4. **AI Service menghitung skor** — Menggunakan weighted average dengan bobot yang sudah ditentukan.
5. **AI Service menghasilkan rekomendasi** — Berdasarkan nilai masing-masing metrik, sistem menghasilkan rekomendasi dengan level prioritas.
6. **Hasil disimpan ke database** — Skor, label, warna, dan rekomendasi disimpan di tabel `ai_recommendations` agar tidak perlu dihitung ulang.
7. **Hasil ditampilkan ke user** — Frontend menampilkan skor dalam bentuk gauge, label performa, dan daftar rekomendasi.

### Formula Perhitungan Skor

#### 1. Skor per Metrik (masing-masing 0-100)

**CTR Score** (Bobot: 40%)
| Kondisi | Rentang Skor |
|---------|-------------|
| CTR < 1% | 0-30 (linear) |
| 1% ≤ CTR ≤ 3% | 31-60 (linear) |
| CTR > 3% | 61-100 (linear, max 100) |

**ROAS Score** (Bobot: 40%)
| Kondisi | Rentang Skor |
|---------|-------------|
| ROAS < 2x | 0-30 (linear) |
| 2x ≤ ROAS ≤ 4x | 31-60 (linear) |
| ROAS > 4x | 61-100 (linear, max 100) |

**Reach Score** (Bobot: 20%) — dihitung berdasarkan RPM (Reach per 1000 spend)
| Kondisi | Rentang Skor |
|---------|-------------|
| RPM < 100 | 0-30 (linear) |
| 100 ≤ RPM ≤ 500 | 31-60 (linear) |
| RPM > 500 | 61-100 (linear, max 100) |

#### 2. Skor Akhir

```
Final Score = (CTR_Score × 0.40) + (ROAS_Score × 0.40) + (Reach_Score × 0.20)
```

#### 3. Label & Warna

| Rentang Skor | Label | Warna |
|-------------|-------|-------|
| 0 - 39 | Buruk | Merah |
| 40 - 69 | Cukup | Kuning |
| 70 - 100 | Bagus | Hijau |

### Logika Rekomendasi AI

Rekomendasi dihasilkan berdasarkan aturan bisnis berikut:

| Metrik | Kondisi | Prioritas | Kategori | Tindakan |
|--------|---------|-----------|----------|----------|
| CTR | < 1% | High | Creative | Ganti gambar/video iklan |
| CTR | 1% - 2% | Medium | Creative | Variasikan copywriting/CTA |
| ROAS | < 2x | High | Budget & Audience | Kurangi budget atau ubah target audiens |
| ROAS | 2x - 3x | Medium | Budget & Audience | Persempit target audiens (interest/lookalike) |
| RPM | < 100 | High | Distribution | Perluas target lokasi/audiens |
| RPM | 100 - 300 | Medium | Distribution | Gunakan Advantage+ Placements |
| Skor | ≥ 80 | Low | Scaling | Naikkan budget 10-20% per hari |
| Skor | 60 - 79 | Low | Optimization | Lakukan A/B testing |
| - | Tidak ada masalah | Low | General | Pantau performa secara berkala |

Rekomendasi diurutkan berdasarkan prioritas: **High → Medium → Low**.

### Kategori Rekomendasi

Ada 6 kategori rekomendasi yang digunakan:

1. **Creative** — Optimasi konten iklan (gambar, video, copywriting, CTA).
2. **Budget & Audience** — Optimalisasi anggaran dan penargetan audiens.
3. **Distribution** — Optimalisasi distribusi iklan (placement, lokasi, ukuran audiens).
4. **Scaling** — Strategi scaling saat performa sudah sangat baik.
5. **Optimization** — Fine-tuning dan A/B testing untuk performa di atas rata-rata.
6. **General** — Rekomendasi umum ketika tidak ada masalah spesifik.

### Microservice AI (Flask)

File: `ai-service/app.py`

Merupakan service mandiri yang bisa dikembangkan dan di-deploy secara terpisah. Saat ini menggunakan logika rule-based yang dapat dengan mudah ditingkatkan menjadi model machine learning di masa depan.

**Endpoint yang tersedia:**

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/analyze` | Menerima metrik → mengembalikan skor + rekomendasi |
| GET | `/health` | Cek status service |

**Contoh request:**
```json
POST http://localhost:5001/analyze
{
  "ctr": 2.5,
  "roas": 3.2,
  "reach": 15000,
  "spend": 500000
}
```

**Contoh response:**
```json
{
  "score": 75,
  "label": "Bagus",
  "color": "green",
  "breakdown": {
    "ctr_score": 55,
    "roas_score": 60,
    "reach_score": 90
  },
  "recommendations": [
    {
      "priority": "medium",
      "category": "Optimization",
      "message": "Performa di atas rata-rata - lakukan A/B testing pada elemen iklan untuk hasil lebih optimal."
    },
    {
      "priority": "low",
      "category": "Scaling",
      "message": "Performa sangat baik! Pertimbangkan menaikkan budget 10-20% per hari untuk memperluas jangkauan."
    }
  ]
}
```

### Daftar Rekomendasi Lengkap

Berikut adalah seluruh kemungkinan rekomendasi yang dihasilkan sistem berdasarkan kondisi metrik:

1. **CTR < 1%** (High — Creative): *"CTR Anda di bawah 1% - ganti gambar atau video iklan dengan konten yang lebih menarik perhatian."*
2. **CTR 1-2%** (Medium — Creative): *"CTR Anda cukup baik tapi masih bisa ditingkatkan - coba variasikan copywriting atau call-to-action."*
3. **ROAS < 2x** (High — Budget & Audience): *"ROAS di bawah 2 - kurangi budget harian atau ubah target audiens agar lebih relevan."*
4. **ROAS 2-3x** (Medium — Budget & Audience): *"ROAS belum optimal - pertimbangkan mempersempit target audiens berdasarkan interest atau lookalike."*
5. **RPM < 100** (High — Distribution): *"Jangkauan sangat rendah dibanding budget - perluas target lokasi atau perbesar ukuran audiens."*
6. **RPM 100-300** (Medium — Distribution): *"Jangkauan masih bisa ditingkatkan - coba gunakan Advantage+ Placements di Meta Ads Manager."*
7. **Skor ≥ 80** (Low — Scaling): *"Performa sangat baik! Pertimbangkan menaikkan budget 10-20% per hari untuk memperluas jangkauan."*
8. **Skor 60-79** (Low — Optimization): *"Performa di atas rata-rata - lakukan A/B testing pada elemen iklan untuk hasil lebih optimal."*
9. **Tidak ada masalah** (Low — General): *"Tidak ada rekomendasi khusus saat ini. Pantau performa iklan secara berkala."*

### Pengembangan ke Depan

Struktur AI Service saat ini menggunakan **rule-based logic** yang transparan dan mudah dipahami. ke depannya, arsitektur ini dapat ditingkatkan menjadi **machine learning model** dengan mengganti fungsi `calculate_score` dan `generate_recommendations` dengan model terlatih tanpa mengubah endpoint API — karena backend dan AI service sudah terpisah secara arsitektur (decoupled microservice).

---

## UML

Diagram UML tersedia di folder `UML/` dalam format JPEG:

| Diagram | File | Deskripsi |
|---------|------|-----------|
| Use Case | `UML/useCase.jpg` | Interaksi antara aktor (User, Admin) dengan use case sistem |
| Class | `UML/class.jpg` | Struktur kelas/model, atribut, method, dan relasi |
| Sequence | `UML/sequence.jpg` | Alur interaksi temporal antar objek (contoh: login, connect Meta, analisis AI) |
| Activity | `UML/activity.jpg` | Alur aktivitas dalam sistem dari awal hingga akhir |

### Penjelasan Singkat UML

- **Use Case Diagram**: Menggambarkan aktor utama (User dan Admin) serta fungsionalitas yang bisa mereka akses — seperti manajemen kampanye, analisis AI, export PDF (User), dan manajemen user, monitoring kampanye, audit log (Admin).
- **Class Diagram**: Menunjukkan struktur data sistem — 5 kelas utama (User, MetaAccount, Campaign, AiRecommendation, AuditLog) lengkap dengan atribut, tipe data, dan relasi antar kelas (one-to-many, one-to-one).
- **Sequence Diagram**: Menjelaskan alur komunikasi antar komponen secara berurutan — misalnya bagaimana request analisis AI mengalir dari Frontend → Backend → AI Service → Database.
- **Activity Diagram**: Menggambarkan alur kerja end-to-end — dari login, connect Meta Ads, melihat kampanye, menganalisis dengan AI, hingga export PDF.

---

## Instalasi & Setup Lokal

### Prasyarat

- **Node.js** v18+ dan npm
- **Python** 3.9+ dan pip
- **MySQL** 8.x (atau Docker dengan image MySQL)
- **Git**
- **Akun Developer Facebook** (untuk Meta Ads API — opsional untuk development)

### Langkah 1: Clone Repository

```bash
git clone https://github.com/yourusername/adsight.git
cd adsight
```

### Langkah 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env sesuai konfigurasi database dan Meta App Anda
```

Konfigurasi file `.env`:

```env
PORT=5000
DATABASE_URL="mysql://username:password@localhost:3306/adsight_db"
JWT_SECRET="your_jwt_secret_key_here"
META_APP_ID="your_meta_app_id"
META_APP_SECRET="your_meta_app_secret"
META_REDIRECT_URI="http://localhost:5000/api/meta/callback"
META_TEST_TOKEN="your_test_token"

# SMTP (opsional — jika kosong akan pakai Ethereal test)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM=""
```

### Langkah 3: Setup Database

```bash
# Pastikan MySQL sudah running dan database sudah dibuat:
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS adsight_db;"

# Jalankan migrasi Prisma
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# (Opsional) Seed admin user — jalankan script
node check_admin.js
```

Atau jika ingin membuat admin manual:

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  const hashed = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: { email: 'admin@adsight.com', password: hashed, role: 'ADMIN' }
  });
  console.log('Admin created:', admin.email);
}
main().catch(console.error);
"
```

### Langkah 4: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install
```

### Langkah 5: Setup AI Service

```bash
cd ai-service

# Buat virtual environment (jika belum ada)
python3 -m venv venv

# Aktifkan virtual environment
source venv/bin/activate   # Linux/Mac
# atau venv\Scripts\activate  # Windows

# Install dependencies
pip install flask flask-cors
```

### Langkah 6: Jalankan Aplikasi

Buka **3 terminal** secara terpisah:

**Terminal 1 — AI Service:**
```bash
cd ai-service
source venv/bin/activate
python app.py
# Server berjalan di http://localhost:5001
```

**Terminal 2 — Backend:**
```bash
cd backend
npm run dev
# Server berjalan di http://localhost:5000
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
# Aplikasi berjalan di http://localhost:5173
```

Buka browser ke `http://localhost:5173`.

### Login Default

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@adsight.com | (sesuai setup) |
| User | (registrasi sendiri) | (sesuai registrasi) |

---

## API Documentation

### Authentication

#### `POST /api/auth/register`
Mendaftarkan akun baru.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "Registrasi berhasil!",
  "user": { "id": 1, "email": "user@example.com", "role": "USER" }
}
```

#### `POST /api/auth/login`
Login dan mendapatkan JWT token.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login berhasil!",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "email": "user@example.com", "role": "USER" }
}
```

### Meta Ads Integration

Semua endpoint di bawah membutuhkan header: `Authorization: Bearer <token>`

#### `GET /api/meta/connect`
Mendapatkan URL untuk redirect ke Facebook OAuth.

#### `GET /api/meta/callback?code=...`
Callback dari Facebook setelah user menyetujui koneksi.

#### `POST /api/meta/save`
Menyimpan koneksi Meta Ads ke database.

**Body:**
```json
{
  "accessToken": "EAA...",
  "accountId": "act_123456789",
  "accountName": "My Ad Account"
}
```

#### `DELETE /api/meta/disconnect`
Memutuskan koneksi Meta Ads.

#### `GET /api/meta/account`
Mendapatkan detail akun Meta Ads yang terhubung.

#### `GET /api/meta/campaigns`
Mendapatkan daftar kampanye (fetch dari Meta API + simpan ke DB).

#### `GET /api/meta/campaigns/:metaCampaignId/insights?startDate=&endDate=`
Insight detail kampanye dari Meta API real-time.

#### `GET /api/meta/campaigns/:metaCampaignId/insights-history?startDate=&endDate=`
Daily breakdown untuk grafik performa.

#### `GET /api/meta/campaigns/:metaCampaignId/recommendations`
Mendapatkan rekomendasi AI untuk kampanye (auto-analyze jika belum ada).

#### `POST /api/meta/campaigns/:metaCampaignId/analyze`
Trigger analisis AI secara manual.

**Response:**
```json
{
  "message": "Kampanye berhasil dianalisis",
  "data": {
    "score": 75,
    "label": "Bagus",
    "color": "green",
    "recommendations": [...],
    "metrics": { "ctr": "2.50", "roas": "3.20", "reach": "15000", "spend": 500000 }
  }
}
```

### Admin Endpoints

Semua endpoint admin membutuhkan: `Authorization: Bearer <token>` + role ADMIN.

#### `GET /api/admin/dashboard`
Statistik dashboard platform.

#### `GET /api/admin/users?page=1&limit=10`
Daftar semua user (paginated).

#### `GET /api/admin/users/:id`
Detail user spesifik.

#### `PUT /api/admin/users/:id/role`
Update role user.

**Body:** `{ "newRole": "ADMIN" }`

#### `DELETE /api/admin/users/:id`
Hapus user permanent.

#### `PUT /api/admin/users/:id/ban`
Ban/Unban user.

**Body:** `{ "isBanned": true, "reason": "Melanggar aturan" }`

#### `POST /api/admin/users/reset-password`
Reset password user + kirim email.

**Body:** `{ "email": "user@example.com" }`

#### `GET /api/admin/campaigns?page=1&limit=10&search=&status=&minSpend=&maxSpend=&minRoas=&maxRoas=&sortBy=createdAt&sortOrder=desc`
Daftar semua kampanye dengan filter.

#### `GET /api/admin/campaigns/analytics?status=&userId=&email=`
Analisis agregat performa kampanye.

#### `GET /api/admin/stats/platform`
Statistik keseluruhan platform.

#### `GET /api/admin/stats/user/:userId`
Statistik user spesifik.

#### `GET /api/admin/audit-logs?page=1&limit=50&userId=&action=&resourceType=`
Daftar audit log dengan filter.

#### `DELETE /api/admin/audit-logs/cleanup`
Hapus audit log lama (retention policy).

**Body:** `{ "daysOld": 90 }`

### AI Service

#### `POST http://localhost:5001/analyze`
Menerima metrik kampanye dan mengembalikan skor serta rekomendasi.

**Body:**
```json
{
  "ctr": 2.5,
  "roas": 3.2,
  "reach": 15000,
  "spend": 500000
}
```

**Response:**
```json
{
  "score": 75,
  "label": "Bagus",
  "color": "green",
  "breakdown": {
    "ctr_score": 55,
    "roas_score": 60,
    "reach_score": 90
  },
  "recommendations": [
    {
      "priority": "medium",
      "category": "Optimization",
      "message": "Performa di atas rata-rata - lakukan A/B testing pada elemen iklan untuk hasil lebih optimal."
    }
  ]
}
```

#### `GET http://localhost:5001/health`
Cek status AI service.

---

## Lisensi

Proyek ini dilisensikan di bawah **ISC License**.

```
ISC License

Copyright (c) 2025 AdSight

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```
