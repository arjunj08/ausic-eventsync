import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// 1. Get Audit Logs with search filters (GET /api/audit-logs)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { module, action, userId, startDate, endDate } = req.query;
    const filter = {};

    if (module) filter.module = module;
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(200); // safety cap
      
    res.json(logs);
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ error: 'Failed to retrieve audit log records' });
  }
});

// 2. Export Audit Logs as CSV (GET /api/audit-logs/export)
router.get('/export', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { module, startDate, endDate } = req.query;
    const filter = {};

    if (module) filter.module = module;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 });

    let csvContent = 'Timestamp,User ID,User Name,Role,Action,Module,Description,IP Address,User Agent\n';

    logs.forEach(log => {
      const time = log.createdAt ? log.createdAt.toISOString() : '';
      const uId = log.userId ? String(log.userId) : 'system';
      const name = `"${(log.userName || 'System').replace(/"/g, '""')}"`;
      const role = `"${(log.userRole || 'system').replace(/"/g, '""')}"`;
      const action = `"${log.action.replace(/"/g, '""')}"`;
      const mod = `"${log.module.replace(/"/g, '""')}"`;
      const desc = `"${log.description.replace(/"/g, '""')}"`;
      const ip = `"${(log.ipAddress || '').replace(/"/g, '""')}"`;
      const ua = `"${(log.userAgent || '').replace(/"/g, '""')}"`;

      csvContent += `${time},${uId},${name},${role},${action},${mod},${desc},${ip},${ua}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-log-export.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export audit logs to CSV format' });
  }
});

export default router;
