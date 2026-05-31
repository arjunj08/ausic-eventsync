import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const verifyTeamLead = (req, res, next) => {
  if (req.userRole !== 'team_lead' && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Team lead or admin access required' });
  }
  next();
};
