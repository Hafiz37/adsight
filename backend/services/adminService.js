// backend/src/services/adminService.js
// Business logic untuk fitur admin

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class AdminService {
  // ===== USER MANAGEMENT =====

  /**
   * Mendapatkan daftar semua user dengan pagination & meta accounts
   */
  static async getAllUsers(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const take = limit;

      const users = await prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          email: true,
          role: true,
          isBanned: true,
          banReason: true,
          bannedAt: true,
          suspendedAt: true,
          createdAt: true,
          updatedAt: true,
          metaAccounts: {
            select: {
              id: true,
              accountName: true,
              createdAt: true,
              campaigns: {
                select: {
                  id: true,
                  name: true,
                  status: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      const total = await prisma.user.count();

      return {
        success: true,
        data: users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Gagal mengambil daftar user: ${error.message}`);
    }
  }

  /**
   * Mendapatkan detail user spesifik dengan semua relasi dan audit logs
   */
  static async getUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          email: true,
          role: true,
          isBanned: true,
          banReason: true,
          bannedAt: true,
          suspendedAt: true,
          createdAt: true,
          updatedAt: true,
          metaAccounts: {
            select: {
              id: true,
              accountName: true,
              createdAt: true,
              campaigns: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  aiRecommendation: {
                    select: {
                      score: true,
                      label: true,
                      updatedAt: true
                    }
                  }
                }
              }
            }
          },
          auditLogs: {
            select: {
              id: true,
              action: true,
              resourceType: true,
              description: true,
              timestamp: true
            },
            orderBy: { timestamp: "desc" },
            take: 10
          }
        }
      });

      if (!user) {
        throw new Error(`User dengan ID ${userId} tidak ditemukan`);
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      throw new Error(`Gagal mengambil detail user: ${error.message}`);
    }
  }

  /**
   * Update role user menjadi ADMIN
   */
  static async updateUserRole(userId, newRole) {
    try {
      // Validasi role
      const validRoles = ["USER", "ADMIN"];
      if (!validRoles.includes(newRole)) {
        throw new Error(`Role tidak valid. Gunakan: ${validRoles.join(", ")}`);
      }

      const user = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { role: newRole },
        select: {
          id: true,
          email: true,
          role: true,
          updatedAt: true
        }
      });

      return {
        success: true,
        message: `Role user berhasil diubah menjadi ${newRole}`,
        data: user
      };
    } catch (error) {
      throw new Error(`Gagal update role user: ${error.message}`);
    }
  }

  /**
   * Hapus user dan semua relasi mereka
   */
  static async deleteUser(userId) {
    try {
      const user = await prisma.user.delete({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          email: true
        }
      });

      return {
        success: true,
        message: `User ${user.email} berhasil dihapus beserta semua data mereka`,
        data: user
      };
    } catch (error) {
      throw new Error(`Gagal menghapus user: ${error.message}`);
    }
  }

  /**
   * Ban atau suspend user
   */
  static async banUser(userId, isBanned, reason) {
    try {
      const user = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          isBanned: !!isBanned,
          banReason: isBanned ? reason || "Tidak ada alasan spesifik" : null,
          bannedAt: isBanned ? new Date() : null,
          suspendedAt: isBanned ? new Date() : null
        },
        select: {
          id: true,
          email: true,
          role: true,
          isBanned: true,
          banReason: true,
          bannedAt: true,
          suspendedAt: true
        }
      });

      return {
        success: true,
        message: `User ${user.email} berhasil ${isBanned ? 'dinonaktifkan/ditangguhkan' : 'diaktifkan kembali'}`,
        data: user
      };
    } catch (error) {
      throw new Error(`Gagal mengubah status ban user: ${error.message}`);
    }
  }

  /**
   * Suspend user (legacy wrapper)
   */
  static async suspendUser(userId, reason) {
    return this.banUser(userId, true, reason);
  }

  /**
   * Reset password user dan kirim email
   */
  static async resetPassword(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email }
      });

      if (!user) {
        throw new Error(`User dengan email ${email} tidak ditemukan`);
      }

      // Generate password sementara sepanjang 8 karakter
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let tempPassword = "";
      for (let i = 0; i < 8; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
        select: {
          id: true,
          email: true
        }
      });

      // Kirim email
      const MailService = require("./mailService");
      const emailResult = await MailService.sendResetPasswordEmail(user.email, tempPassword);

      return {
        success: true,
        message: `Password untuk user ${user.email} berhasil di-reset`,
        data: updatedUser,
        tempPassword, // Dikembalikan untuk keperluan testing
        emailSent: emailResult.sent,
        emailPreview: emailResult.previewUrl || null
      };
    } catch (error) {
      throw new Error(`Gagal mereset password: ${error.message}`);
    }
  }

  // ===== ANALYTICS & INSIGHTS =====

  /**
   * Mendapatkan statistik keseluruhan platform
   */
  static async getPlatformStats() {
    try {
      const totalUsers = await prisma.user.count();
      const totalAdmins = await prisma.user.count({
        where: { role: "ADMIN" }
      });
      const totalMetaAccounts = await prisma.metaAccount.count();
      const totalCampaigns = await prisma.campaign.count();

      // Kampanye dengan skor terbaik
      const topCampaigns = await prisma.campaign.findMany({
        select: {
          id: true,
          name: true,
          metaAccount: {
            select: {
              user: {
                select: { email: true }
              }
            }
          },
          aiRecommendation: {
            select: {
              score: true,
              label: true
            }
          }
        },
        orderBy: {
          aiRecommendation: {
            score: "desc"
          }
        },
        take: 5
      });

      // Audit logs terbaru
      const recentAuditLogs = await prisma.auditLog.findMany({
        select: {
          id: true,
          user: { select: { email: true } },
          action: true,
          resourceType: true,
          timestamp: true
        },
        orderBy: { timestamp: "desc" },
        take: 10
      });

      return {
        success: true,
        data: {
          totalUsers,
          totalAdmins,
          totalMetaAccounts,
          totalCampaigns,
          topCampaigns,
          recentAuditLogs
        }
      };
    } catch (error) {
      throw new Error(`Gagal mengambil statistik platform: ${error.message}`);
    }
  }

  /**
   * Mendapatkan statistik user spesifik
   */
  static async getUserStats(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: {
          email: true,
          metaAccounts: {
            select: {
              id: true,
              campaigns: true
            }
          }
        }
      });

      if (!user) {
        throw new Error("User tidak ditemukan");
      }

      const totalMetaAccounts = user.metaAccounts.length;
      const totalCampaigns = user.metaAccounts.reduce((sum, ma) => sum + ma.campaigns.length, 0);

      return {
        success: true,
        data: {
          email: user.email,
          totalMetaAccounts,
          totalCampaigns,
          createdAt: user.createdAt
        }
      };
    } catch (error) {
      throw new Error(`Gagal mengambil statistik user: ${error.message}`);
    }
  }

  // ===== AUDIT LOG =====

  /**
   * Mencatat aksi user ke audit log
   */
  static async logAudit(userId, action, resourceType, resourceId, description, ipAddress, userAgent) {
    try {
      const parsedUserId = parseInt(userId);
      await prisma.auditLog.create({
        data: {
          userId: isNaN(parsedUserId) || parsedUserId === 0 ? null : parsedUserId,
          action,
          resourceType,
          resourceId: String(resourceId),
          description,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null
        }
      });
    } catch (error) {
      console.error(`Gagal membuat audit log: ${error.message}`);
      // Jangan throw error, hanya log ke console
    }
  }

  /**
   * Mendapatkan daftar audit logs dengan filter
   */
  static async getAuditLogs(filter = {}) {
    try {
      const { userId = null, action = null, resourceType = null, limit = 50, offset = 0 } = filter;

      const where = {};
      if (userId) where.userId = parseInt(userId);
      if (action) where.action = action;
      if (resourceType) where.resourceType = resourceType;

      const auditLogs = await prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          user: { select: { email: true } },
          action: true,
          resourceType: true,
          resourceId: true,
          description: true,
          ipAddress: true,
          timestamp: true
        },
        orderBy: { timestamp: "desc" },
        skip: offset,
        take: limit
      });

      const total = await prisma.auditLog.count({ where });

      return {
        success: true,
        data: auditLogs,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Gagal mengambil audit logs: ${error.message}`);
    }
  }

  /**
   * Hapus audit logs lama (retention policy)
   */
  static async deleteOldAuditLogs(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate }
        }
      });

      return {
        success: true,
        message: `${result.count} audit logs lama berhasil dihapus`,
        deletedCount: result.count
      };
    } catch (error) {
      throw new Error(`Gagal menghapus audit logs lama: ${error.message}`);
    }
  }

  // ===== CAMPAIGN MONITORING =====

  /**
   * Mendapatkan semua kampanye dengan score terendah (perlu attention)
   */
  static async getLowScoreCampaigns(threshold = 40) {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: {
          aiRecommendation: {
            score: { lt: threshold }
          }
        },
        select: {
          id: true,
          name: true,
          metaAccount: {
            select: {
              user: { select: { email: true } }
            }
          },
          aiRecommendation: {
            select: {
              score: true,
              label: true,
              recommendations: true,
              updatedAt: true
            }
          }
        },
        orderBy: {
          aiRecommendation: { score: "asc" }
        }
      });

      return {
        success: true,
        data: campaigns,
        total: campaigns.length
      };
    } catch (error) {
      throw new Error(`Gagal mengambil kampanye dengan skor rendah: ${error.message}`);
    }
  }
}

module.exports = AdminService;