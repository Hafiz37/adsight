// backend/src/controllers/adminController.js
// Handlers untuk semua admin endpoints

const AdminService = require("../services/adminService");

class AdminController {
  // ===== USER MANAGEMENT =====

  /**
   * GET /api/admin/users
   * Mendapatkan daftar semua user
   */
  static async getAllUsers(req, res) {
    try {
      const result = await AdminService.getAllUsers();
      return res.status(200).json({
        status: "success",
        message: "Daftar user berhasil diambil",
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  /**
   * GET /api/admin/users/:userId
   * Mendapatkan detail user spesifik
   */
  static async getUserById(req, res) {
    try {
      const { userId } = req.params;
      const result = await AdminService.getUserById(userId);
      return res.status(200).json({
        status: "success",
        message: "Detail user berhasil diambil",
        ...result
      });
    } catch (error) {
      return res.status(404).json({
        status: "error",
        message: error.message
      });
    }
  }

  /**
   * PUT /api/admin/users/:userId/role
   * Update role user (USER atau ADMIN)
   * Body: { newRole: "USER" | "ADMIN" }
   */
  static async updateUserRole(req, res) {
    try {
      const { userId } = req.params;
      const { newRole } = req.body;

      if (!newRole) {
        return res.status(400).json({
          status: "error",
          message: "Parameter 'newRole' harus disediakan"
        });
      }

      const result = await AdminService.updateUserRole(userId, newRole);

      // Log audit
      await AdminService.logAudit(
        req.user.id,
        "UPDATE_PROFILE",
        "User",
        userId,
        `Role diubah menjadi ${newRole}`,
        req.ip,
        req.get("user-agent")
      );

      return res.status(200).json({
        status: "success",
        ...result
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/admin/users/:userId
   * Hapus user dan semua data mereka (HATI-HATI!)
   */
  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      // Validasi: admin tidak boleh hapus dirinya sendiri
      if (parseInt(userId) === req.user.id) {
        return res.status(400).json({
          status: "error",
          message: "Anda tidak bisa menghapus akun admin Anda sendiri"
        });
      }

      const result = await AdminService.deleteUser(userId);

      // Log audit
      await AdminService.logAudit(
        req.user.id,
        "DELETE_USER",
        "User",
        userId,
        `User dihapus oleh admin ${req.user.email}`,
        req.ip,
        req.get("user-agent")
      );

      return res.status(200).json({
        status: "success",
        ...result
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
  }

  /**
   * POST /api/admin/users/:userId/suspend
   * Suspend user (soft delete)
   * Body: { reason: "string" }
   */
  static async suspendUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason = "No reason provided" } = req.body;

      if (parseInt(userId) === req.user.id) {
        return res.status(400).json({
          status: "error",
          message: "Anda tidak bisa suspend akun Anda sendiri"
        });
      }

      const result = await AdminService.suspendUser(userId, reason);

      return res.status(200).json({
        status: "success",
        ...result
      });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error.message
      });
    }
  }

  // ===== ANALYTICS & INSIGHTS =====

  /**
   * GET /api/admin/stats/platform
   * Mendapatkan statistik keseluruhan platform
   */
  static async getPlatformStats(req, res) {
    try {
      const result = await AdminService.getPlatformStats();
      return res.status(200).json({
        status: "success",
        message: "Statistik platform berhasil diambil",
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  /**
   * GET /api/admin/stats/user/:userId
   * Mendapatkan statistik user spesifik
   */
  static async getUserStats(req, res) {
    try {
      const { userId } = req.params;
      const result = await AdminService.getUserStats(userId);
      return res.status(200).json({
        status: "success",
        message: "Statistik user berhasil diambil",
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  // ===== AUDIT LOGS =====

  /**
   * GET /api/admin/audit-logs
   * Mendapatkan daftar audit logs dengan filter
   * Query: ?userId=1&action=LOGIN&limit=50&offset=0
   */
  static async getAuditLogs(req, res) {
    try {
      const filter = {
        userId: req.query.userId || null,
        action: req.query.action || null,
        resourceType: req.query.resourceType || null,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const result = await AdminService.getAuditLogs(filter);
      return res.status(200).json({
        status: "success",
        message: "Audit logs berhasil diambil",
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/admin/audit-logs/cleanup
   * Hapus audit logs yang lebih tua dari X hari
   * Body: { daysOld: 90 }
   */
  static async cleanupOldAuditLogs(req, res) {
    try {
      const { daysOld = 90 } = req.body;

      const result = await AdminService.deleteOldAuditLogs(daysOld);

      // Log aksi cleanup
      await AdminService.logAudit(
        req.user.id,
        "UPDATE_CAMPAIGN",
        "AuditLog",
        "system",
        `Audit logs cleanup: ${result.deletedCount} records dihapus`,
        req.ip,
        req.get("user-agent")
      );

      return res.status(200).json({
        status: "success",
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }

  // ===== CAMPAIGN MONITORING =====

  /**
   * GET /api/admin/campaigns/low-score
   * Mendapatkan kampanye dengan skor rendah
   * Query: ?threshold=40
   */
  static async getLowScoreCampaigns(req, res) {
    try {
      const threshold = parseInt(req.query.threshold) || 40;
      const result = await AdminService.getLowScoreCampaigns(threshold);
      return res.status(200).json({
        status: "success",
        message: "Kampanye dengan skor rendah berhasil diambil",
        ...result
      });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error.message
      });
    }
  }
}

module.exports = AdminController;