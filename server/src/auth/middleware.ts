import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../env';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  password: string;
  role: 'admin';
}

// Static admin user for now (in production, this would come from database)
const ADMIN_USER: AdminUser = {
  id: 'admin-001',
  email: config.ADMIN_EMAIL,
  password: '', // Will be set in initializeAdminUser
  role: 'admin'
};

// Initialize admin user password hash
export async function initializeAdminUser(): Promise<void> {
  ADMIN_USER.password = await bcrypt.hash(config.ADMIN_PASSWORD, 12);
  logger.info(`Admin user initialized: ${ADMIN_USER.email}`);
}

// Login function
export async function authenticateAdmin(email: string, password: string): Promise<string | null> {
  try {
    if (email !== ADMIN_USER.email) {
      logger.warn(`Login attempt with invalid email: ${email}`);
      return null;
    }

    const isValid = await bcrypt.compare(password, ADMIN_USER.password);
    if (!isValid) {
      logger.warn(`Invalid password for admin user: ${email}`);
      return null;
    }

    const token = jwt.sign(
      { 
        id: ADMIN_USER.id, 
        email: ADMIN_USER.email, 
        role: ADMIN_USER.role 
      },
      config.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    logger.info(`Admin user logged in: ${email}`);
    return token;
  } catch (error) {
    logger.error('Authentication error:', error);
    return null;
  }
}

// JWT middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, config.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      logger.warn(`Invalid token attempt: ${err.message}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    const user = decoded as any;
    
    // Verify admin role
    if (user.role !== 'admin') {
      logger.warn(`Non-admin access attempt: ${user.email}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    req.user = user;
    next();
    return; // Explicit return for TypeScript
  });
  
  return; // Explicit return for TypeScript
  
  // This function doesn't return anything, it's middleware
}

// Optional: Role-based middleware (for future expansion)
export function requireRole(role: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `${role} role required`
      });
    }
    next();
    return; // Explicit return for TypeScript
  };
}
