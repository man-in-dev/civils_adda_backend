import { verifyToken } from '../config/jwt.js';
import User from '../models/User.js';

// Optional authentication middleware - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = await User.findById(decoded.userId).select('-password');
      } catch (error) {
        // Invalid token - continue without user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    // Continue without user on error
    req.user = null;
    next();
  }
};

