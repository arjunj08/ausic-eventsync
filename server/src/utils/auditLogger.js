import AuditLog from '../models/AuditLog.js';

export const logActivity = async (req, userId, userName, userRole, action, module, description, metadata = {}) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '') : '';
    const userAgent = req ? (req.headers['user-agent'] || '') : '';

    const log = new AuditLog({
      userId,
      userName,
      userRole,
      action,
      module,
      description,
      ipAddress,
      userAgent,
      metadata
    });
    await log.save();

    // Check for suspicious login activity: 5+ failed logins for the same email in the last 15 minutes
    if (action === 'login_failed') {
      const windowLimit = new Date(Date.now() - 15 * 60 * 1000); // 15 mins
      const email = metadata.email;
      if (email) {
        const failedCount = await AuditLog.countDocuments({
          action: 'login_failed',
          'metadata.email': email,
          createdAt: { $gte: windowLimit }
        });

        if (failedCount >= 5) {
          const io = req ? req.app.get('io') : null;
          if (io) {
            io.emit('suspicious-activity-alert', {
              email,
              failedCount,
              message: `⚠️ SECURITY WARNING: 5+ failed login attempts detected for account ${email}`
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Audit logger failed:', err);
  }
};
