import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Helper to parse cookies manually to avoid external cookie-parser dependency
const getCookie = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, ...val] = cookie.trim().split('=');
    acc[key] = val.join('=');
    return acc;
  }, {});
  return cookies[name] || null;
};

export const authMiddleware = async (req, res, next) => {
  let token = getCookie(req.headers.cookie, 'token');
  
  if (!token && req.headers.authorization) {
    if (req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check status in DB
    const dbUser = await User.findById(decoded.id);
    if (!dbUser) {
      return res.status(401).json({ error: 'Session user not found. Please log in again.' });
    }

    if (dbUser.status === 'inactive') {
      return res.status(401).json({ error: 'Your account is deactivated. Please contact an admin.' });
    }

    if (dbUser.status === 'suspended') {
      if (dbUser.suspendedUntil && dbUser.suspendedUntil > new Date()) {
        return res.status(401).json({ 
          error: `Your account is suspended until ${new Date(dbUser.suspendedUntil).toLocaleDateString()}. Reason: ${dbUser.suspensionReason || 'No reason specified'}` 
        });
      } else {
        // Expired suspension, clear it
        dbUser.status = 'active';
        dbUser.suspendedUntil = null;
        dbUser.suspensionReason = null;
        await dbUser.save();
      }
    }

    req.user = {
      id: dbUser._id,
      role: dbUser.role,
      email: dbUser.email,
      name: dbUser.name
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};
