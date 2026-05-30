import jwt from 'jsonwebtoken';

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

export const authMiddleware = (req, res, next) => {
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
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};
