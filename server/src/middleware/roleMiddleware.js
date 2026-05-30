export const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}` });
    }
  };
};

export const adminOnly = roleMiddleware(['admin']);
export const memberOnly = roleMiddleware(['member']);
export const anyRole = roleMiddleware(['admin', 'member']);
