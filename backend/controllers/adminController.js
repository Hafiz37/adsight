// backend/src/controllers/adminController.js
// Handlers untuk semua admin endpoints

const AdminService = require("../services/adminService");

class AdminController {
  // ===== USER MANAGEMENT =====

  /**
   * GET /api/admin/users
   * Mendapatkan daftar semua user dengan pagination
   */
  static async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (isNaN(page) || page < 1) {
        return res.status(400).json({
          status: "error",
          message: "Parameter 'page' harus berupa integer positif"
        });
      }

      if (isNaN(limit) || limit < 1) {
        return res.status(400).json({
          status: "error",
          message: "Parameter 'limit' harus berupa integer positif"
        });
      }

      const result = await AdminService.getAllUsers(page, limit);

      // Log audit
      await AdminService.logAudit(
        req.user.id,
        "VIEW_USERS",
        "User",
        "all",
        `Melihat daftar user halaman ${page}`,
        req.ip,
        req.get("user-agent")
      );

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
   * GET /api/admin/users/:id
   * Mendapatkan detail user tertentu
   */
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const parsedId = parseInt(id);

      if (isNaN(parsedId)) {
        return res.status(400).json({
          status: "error",
          message: "User ID harus berupa integer"
        });
      }

      const result = await AdminService.getUserById(parsedId);

      // Log audit
      await AdminService.logAudit(
        req.user.id,
        "VIEW_USER_DETAIL",
        "User",
        parsedId,
        `Melihat detail user dengan ID ${parsedId}`,
        req.ip,
        req.get("user-agent")
      );

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
   * PUT /api/admin/users/:id/role
   * Update role user (USER atau ADMIN)
   * Body: { newRole: "USER" | "ADMIN" }
   */
  static async updateUserRole(req, res) {
    try {
      const { id } = req.params;
      const parsedId = parseInt(id);
      const { newRole } = req.body;

      if (isNaN(parsedId)) {
        return res.status(400).json({
          status: "error",
          message: "User ID harus berupa integer"
        });
      }

      if (!newRole || !["USER", "ADMIN"].includes(newRole)) {
        return res.status(400).json({
          status: "error",
          message: "Parameter 'newRole' tidak valid. Gunakan 'USER' atau 'ADMIN'"
        });
      }

      const result = await AdminService.updateUserRole(parsedId, newRole);

      // Log audit
      await AdminService.logAudit(
        req.user.id,
        "UPDATE_ROLE",
        "User",
        parsedId,
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
   * DELETE /api/admin/users/:id
   * Hapus user dan semua data mereka (HATI-HATI!)
   */
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const parsedId = parseInt(id);

      if (isNaN(parsedId)) {
        return res.status(400).json({
          status: "error",
          message: "User ID harus berupa integer"
        });
      }

      // Validasi: admin tidak boleh hapus dirinya sendiri
      if (parsedId === req.user.id) {
        return res.status(400).json({
          status: "error",
          message: "Anda tidak bisa menghapus akun admin Anda sendiri"
        });
      }

      const result = await AdminService.deleteUser(parsedId);

      // Log audit
      await AdminService.logAudit(
        req.user.id,
        "DELETE_USER",
        "User",
        parsedId,
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
   * PUT /api/admin/users/:id/ban
   * Ban atau suspend user
   * Body: { isBanned: boolean, reason?: string }
   */
  static async banUser(req, res) {
    try {
      const { id } = req.params;
      const parsedId = parseInt(id);
      const { isBanned, reason = "" } = req.body;

      if (isNaN(parsedId)) {
        return res.status(400).json({
          status: "error",
          message: "User ID harus berupa integer"
        });
      }

      if (typeof isBanned !== "boolean") {
        return res.status(400).json({
          status: "error",
          message: "Parameter 'isBanned' harus berupa boolean"
        });
      }

      if (parsedId === req.user.id) {
        return res.status(400).json({
          status: "error",
          message: "Anda tidak bisa menangguhkan akun Anda sendiri"
        });
      }

      const result = await AdminService.banUser(parsedId, isBanned, reason);

      // Log audit
      await AdminService.logAudit(
        req.user.id,
        isBanned ? "BAN_USER" : "UNBAN_USER",
        "User",
        parsedId,
        isBanned ? `User ditangguhkan. Alasan: ${reason}` : "User diaktifkan kembali",
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
   * POST /api/admin/users/reset-password
   * Reset password user & send email
   * Body: { email: string }
   */
  static async resetPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: "error",
          message: "Parameter 'email' wajib disediakan"
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: "error",
          message: "Format email tidak valid"
        });
      }

      const result = await AdminService.resetPassword(email);

      // Log audit
      await AdminService.logAudit(
        req.user.id,
        "RESET_PASSWORD",
        "User",
        result.data.id,
        `Password direset oleh admin ${req.user.email}. Email reset terkirim: ${result.emailSent}`,
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
   * POST /api/admin/users/:id/suspend (legacy wrapper)
   * Body: { reason: "string" }
   */
  static async suspendUser(req, res) {
    req.body.isBanned = true;
    return this.banUser(req, res);
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