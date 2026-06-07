// backend/src/routes/adminRoutes.js
// Routes untuk fitur admin dengan 9+ endpoints

const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/adminController");
const { verifyToken } = require("../middleware/auth");
const verifyAdmin = require("../middleware/verifyAdmin");

/**
 * MIDDLEWARE PROTECTION
 * Semua route admin harus:
 * 1. Terverifikasi token (verifyToken)
 * 2. Memiliki role ADMIN (verifyAdmin)
 */

// ===== USER MANAGEMENT ENDPOINTS =====

/**
 * ENDPOINT 1: GET /api/admin/users
 * Deskripsi: Mendapatkan daftar semua user dengan meta accounts mereka
 * Auth: JWT + ADMIN role
 * Response: Array of users dengan metaAccounts dan campaigns
 */
router.get("/users", verifyToken, verifyAdmin, AdminController.getAllUsers);

/**
 * ENDPOINT 2: GET /api/admin/users/:userId
 * Deskripsi: Mendapatkan detail user spesifik dengan audit logs mereka
 * Auth: JWT + ADMIN role
 * Params: userId (integer)
 * Response: User object dengan metaAccounts, campaigns, dan recent auditLogs
 */
router.get("/users/:userId", verifyToken, verifyAdmin, AdminController.getUserById);

/**
 * ENDPOINT 3: PUT /api/admin/users/:userId/role
 * Deskripsi: Update role user (USER → ADMIN atau sebaliknya)
 * Auth: JWT + ADMIN role
 * Params: userId (integer)
 * Body: { newRole: "USER" | "ADMIN" }
 * Response: Updated user object
 */
router.put("/users/:userId/role", verifyToken, verifyAdmin, AdminController.updateUserRole);

/**
 * ENDPOINT 4: DELETE /api/admin/users/:userId
 * Deskripsi: Menghapus user dan semua data relasi mereka (PERMANENT!)
 * Auth: JWT + ADMIN role
 * Params: userId (integer)
 * Response: Deleted user email
 * WARNING: Aksi ini tidak bisa di-undo!
 */
router.delete("/users/:userId", verifyToken, verifyAdmin, AdminController.deleteUser);

/**
 * ENDPOINT 5: POST /api/admin/users/:userId/suspend
 * Deskripsi: Suspend user (soft delete, tidak menghapus data)
 * Auth: JWT + ADMIN role
 * Params: userId (integer)
 * Body: { reason: "string" }
 * Response: Suspended user
 */
router.post("/users/:userId/suspend", verifyToken, verifyAdmin, AdminController.suspendUser);

// ===== ANALYTICS & INSIGHTS ENDPOINTS =====

/**
 * ENDPOINT 6: GET /api/admin/stats/platform
 * Deskripsi: Mendapatkan statistik keseluruhan platform
 *           - Total users, admins, metaAccounts, campaigns
 *           - Top 5 kampanye dengan skor tertinggi
 *           - 10 recent audit logs
 * Auth: JWT + ADMIN role
 * Response: Platform statistics
 */
router.get("/stats/platform", verifyToken, verifyAdmin, AdminController.getPlatformStats);

/**
 * ENDPOINT 7: GET /api/admin/stats/user/:userId
 * Deskripsi: Mendapatkan statistik user spesifik
 * Auth: JWT + ADMIN role
 * Params: userId (integer)
 * Response: User stats (total metaAccounts, campaigns, created date)
 */
router.get("/stats/user/:userId", verifyToken, verifyAdmin, AdminController.getUserStats);

// ===== AUDIT LOG ENDPOINTS =====

/**
 * ENDPOINT 8: GET /api/admin/audit-logs
 * Deskripsi: Mendapatkan audit logs dengan filter
 * Auth: JWT + ADMIN role
 * Query params:
 *   - userId: filter by user ID (optional)
 *   - action: filter by action type (optional)
 *   - resourceType: filter by resource type (optional)
 *   - limit: jumlah records per halaman (default: 50)
 *   - offset: skip records (default: 0)
 * Response: Array of audit logs dengan pagination
 * Example: GET /api/admin/audit-logs?action=LOGIN&limit=20&offset=0
 */
router.get("/audit-logs", verifyToken, verifyAdmin, AdminController.getAuditLogs);

/**
 * ENDPOINT 9: DELETE /api/admin/audit-logs/cleanup
 * Deskripsi: Menghapus audit logs yang lebih tua dari X hari
 *           (implementasi retention policy)
 * Auth: JWT + ADMIN role
 * Body: { daysOld: 90 }
 * Response: Count of deleted records
 * Default: Hapus audit logs lebih tua dari 90 hari
 */
router.delete("/audit-logs/cleanup", verifyToken, verifyAdmin, AdminController.cleanupOldAuditLogs);

// ===== CAMPAIGN MONITORING ENDPOINT =====

/**
 * ENDPOINT 10: GET /api/admin/campaigns/low-score
 * Deskripsi: Mendapatkan kampanye dengan skor rendah (perlu attention)
 * Auth: JWT + ADMIN role
 * Query params:
 *   - threshold: skor minimum (default: 40)
 * Response: Array of campaigns dengan skor di bawah threshold
 * Example: GET /api/admin/campaigns/low-score?threshold=50
 */
router.get("/campaigns/low-score", verifyToken, verifyAdmin, AdminController.getLowScoreCampaigns);

module.exports = router;