import { getDatabase, DatabaseUtils, User, ActivityLog } from '../database/db';
import { Request, Response, NextFunction } from 'express';

export class AuthService {
  private get db() {
    return getDatabase();
  }

  // Register new user (only by owner)
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role?: 'investigator';
    full_name?: string;
    created_by: string;
  }): Promise<{ success: boolean; user?: Partial<User>; message: string }> {
    try {
      const { username, email, password, role = 'investigator', full_name, created_by } = userData;

      // Check if creator is owner
      const creator = this.db.prepare('SELECT role FROM users WHERE id = ?').get(created_by) as { role: string } | undefined;
      if (!creator || creator.role !== 'owner') {
        return { success: false, message: 'Seul le propriétaire peut créer des comptes' };
      }

      // Check if user exists
      const existingUser = this.db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
      if (existingUser) {
        return { success: false, message: 'Un utilisateur avec ce nom ou email existe déjà' };
      }

      // Create user
      const userId = DatabaseUtils.generateId();
      const passwordHash = DatabaseUtils.hashPassword(password);

      const stmt = this.db.prepare(`
        INSERT INTO users (id, username, email, password_hash, role, full_name, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(userId, username, email, passwordHash, role, full_name, created_by);

      // Log activity
      this.logActivity({
        user_id: created_by,
        action: 'user_created',
        target_type: 'user',
        target_id: userId,
        details: JSON.stringify({ username, email, role })
      });

      const newUser = this.db.prepare('SELECT id, username, email, role, full_name, created_at FROM users WHERE id = ?').get(userId) as Partial<User>;

      return { success: true, user: newUser, message: 'Utilisateur créé avec succès' };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: 'Erreur lors de la création de l\'utilisateur' };
    }
  }

  // Login user
  async login(credentials: {
    username: string;
    password: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<{ success: boolean; token?: string; user?: Partial<User>; message: string }> {
    try {
      const { username, password, ip_address, user_agent } = credentials;

      // Find user
      const user = this.db.prepare('SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1').get(username, username) as User | undefined;
      
      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé ou inactif' };
      }

      // Verify password
      if (!DatabaseUtils.verifyPassword(password, user.password_hash)) {
        return { success: false, message: 'Mot de passe incorrect' };
      }

      // Update last login
      this.db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(DatabaseUtils.now(), user.id);

      // Generate token
      const token = DatabaseUtils.generateToken({
        userId: user.id,
        username: user.username,
        role: user.role
      });

      // Log activity
      this.logActivity({
        user_id: user.id,
        action: 'login',
        ip_address,
        user_agent
      });

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar_url: user.avatar_url
      };

      return { success: true, token, user: userResponse, message: 'Connexion réussie' };
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, message: 'Erreur lors de la connexion' };
    }
  }

  // Get all users (owner only)
  async getAllUsers(requesterId: string): Promise<{ success: boolean; users?: Partial<User>[]; message: string }> {
    try {
      // Check if requester is owner
      const requester = this.db.prepare('SELECT role FROM users WHERE id = ?').get(requesterId) as { role: string } | undefined;
      if (!requester || requester.role !== 'owner') {
        return { success: false, message: 'Accès non autorisé' };
      }

      const users = this.db.prepare(`
        SELECT id, username, email, role, full_name, is_active, created_at, last_login 
        FROM users 
        ORDER BY created_at DESC
      `).all() as Partial<User>[];

      return { success: true, users, message: 'Utilisateurs récupérés avec succès' };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, message: 'Erreur lors de la récupération des utilisateurs' };
    }
  }

  // Delete user (owner only)
  async deleteUser(userId: string, requesterId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if requester is owner
      const requester = this.db.prepare('SELECT role FROM users WHERE id = ?').get(requesterId) as { role: string } | undefined;
      if (!requester || requester.role !== 'owner') {
        return { success: false, message: 'Accès non autorisé' };
      }

      // Don't allow deleting self
      if (userId === requesterId) {
        return { success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' };
      }

      // Get user info before deletion
      const user = this.db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as { username: string } | undefined;
      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }

      // Delete user
      this.db.prepare('DELETE FROM users WHERE id = ?').run(userId);

      // Log activity
      this.logActivity({
        user_id: requesterId,
        action: 'user_deleted',
        target_type: 'user',
        target_id: userId,
        details: JSON.stringify({ username: user.username })
      });

      return { success: true, message: 'Utilisateur supprimé avec succès' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Erreur lors de la suppression de l\'utilisateur' };
    }
  }

  // Toggle user active status (owner only)
  async toggleUserStatus(userId: string, requesterId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if requester is owner
      const requester = this.db.prepare('SELECT role FROM users WHERE id = ?').get(requesterId) as { role: string } | undefined;
      if (!requester || requester.role !== 'owner') {
        return { success: false, message: 'Accès non autorisé' };
      }

      // Don't allow disabling self
      if (userId === requesterId) {
        return { success: false, message: 'Vous ne pouvez pas désactiver votre propre compte' };
      }

      // Toggle status
      const user = this.db.prepare('SELECT is_active, username FROM users WHERE id = ?').get(userId) as { is_active: number; username: string } | undefined;
      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }

      const newStatus = user.is_active ? 0 : 1;
      this.db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, userId);

      // Log activity
      this.logActivity({
        user_id: requesterId,
        action: newStatus ? 'user_activated' : 'user_deactivated',
        target_type: 'user',
        target_id: userId,
        details: JSON.stringify({ username: user.username })
      });

      return { success: true, message: `Utilisateur ${newStatus ? 'activé' : 'désactivé'} avec succès` };
    } catch (error) {
      console.error('Error toggling user status:', error);
      return { success: false, message: 'Erreur lors de la modification du statut' };
    }
  }

  // Log activity
  private logActivity(activity: Partial<ActivityLog>) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO activity_logs (id, user_id, action, target_type, target_id, details, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        DatabaseUtils.generateId(),
        activity.user_id || null,
        activity.action,
        activity.target_type || null,
        activity.target_id || null,
        activity.details || null,
        activity.ip_address || null,
        activity.user_agent || null,
        DatabaseUtils.now()
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Middleware for authentication
  authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token d\'accès requis' });
    }

    try {
      const decoded = DatabaseUtils.verifyToken(token);
      (req as any).user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ success: false, message: 'Token invalide' });
    }
  }

  // Middleware for owner-only routes
  requireOwner(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    if (!user || user.role !== 'owner') {
      return res.status(403).json({ success: false, message: 'Accès réservé au propriétaire' });
    }
    next();
  }
}

export const authService = new AuthService();
