import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../config/firebase.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    try {
      // Try Firebase token first (longer tokens, starts with 'eyJ')
      if (token.length > 500) {
        try {
          const decodedToken = await verifyFirebaseToken(token);
          
          // Find or create user based on Firebase UID
          let user = await User.findByFirebaseUid(decodedToken.uid);
          
          if (!user) {
            // Create new user from Firebase data
            user = await User.create({
              firebaseUid: decodedToken.uid,
              email: decodedToken.email,
              name: decodedToken.name || decodedToken.email.split('@')[0],
              avatar: '🚀'
            });
            console.log('✅ Created new user:', user.email);
          }
          
          req.user = user;
          return next();
        } catch (firebaseError) {
          console.error('❌ Firebase token verification failed:', firebaseError.message);
          return res.status(401).json({
            success: false,
            message: 'Firebase authentication failed: ' + firebaseError.message
          });
        }
      }
      
      // JWT token authentication
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('❌ Auth error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

// Generate JWT Token
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};
