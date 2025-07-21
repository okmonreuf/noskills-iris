import { getDatabase, DatabaseUtils, Investigation, Evidence } from '../database/db';

export class InvestigationService {
  private get db() {
    return getDatabase();
  }

  // Create new investigation
  async createInvestigation(data: {
    name: string;
    description?: string;
    target_type: string;
    target_value: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    created_by: string;
    tags?: string[];
  }): Promise<{ success: boolean; investigation?: Investigation; message: string }> {
    try {
      const { name, description, target_type, target_value, priority = 'medium', created_by, tags } = data;

      const investigationId = DatabaseUtils.generateId();
      const now = DatabaseUtils.now();

      const stmt = this.db.prepare(`
        INSERT INTO investigations (
          id, name, description, target_type, target_value, priority, created_by, 
          status, created_at, updated_at, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `);

      stmt.run(
        investigationId,
        name,
        description,
        target_type,
        target_value,
        priority,
        created_by,
        now,
        now,
        tags ? JSON.stringify(tags) : null
      );

      // Give creator admin permission
      this.grantPermission(investigationId, created_by, 'admin', created_by);

      const investigation = this.db.prepare('SELECT * FROM investigations WHERE id = ?').get(investigationId) as Investigation;

      return { success: true, investigation, message: 'Enquête créée avec succès' };
    } catch (error) {
      console.error('Error creating investigation:', error);
      return { success: false, message: 'Erreur lors de la création de l\'enquête' };
    }
  }

  // Get investigations for user
  async getUserInvestigations(userId: string, userRole: string): Promise<{ success: boolean; investigations?: any[]; message: string }> {
    try {
      let investigations;

      if (userRole === 'owner') {
        // Owner can see all investigations
        investigations = this.db.prepare(`
          SELECT i.*, u.username as creator_name
          FROM investigations i
          LEFT JOIN users u ON i.created_by = u.id
          ORDER BY i.updated_at DESC
        `).all();
      } else {
        // Regular users can only see investigations they have access to
        investigations = this.db.prepare(`
          SELECT DISTINCT i.*, u.username as creator_name, ip.permission_level
          FROM investigations i
          LEFT JOIN users u ON i.created_by = u.id
          LEFT JOIN investigation_permissions ip ON i.id = ip.investigation_id
          WHERE i.created_by = ? OR ip.user_id = ?
          ORDER BY i.updated_at DESC
        `).all(userId, userId);
      }

      return { success: true, investigations, message: 'Enquêtes récupérées avec succès' };
    } catch (error) {
      console.error('Error getting investigations:', error);
      return { success: false, message: 'Erreur lors de la récupération des enquêtes' };
    }
  }

  // Get single investigation with permission check
  async getInvestigation(investigationId: string, userId: string, userRole: string): Promise<{ success: boolean; investigation?: any; message: string }> {
    try {
      let investigation;

      if (userRole === 'owner') {
        investigation = this.db.prepare(`
          SELECT i.*, u.username as creator_name
          FROM investigations i
          LEFT JOIN users u ON i.created_by = u.id
          WHERE i.id = ?
        `).get(investigationId);
      } else {
        investigation = this.db.prepare(`
          SELECT i.*, u.username as creator_name, ip.permission_level
          FROM investigations i
          LEFT JOIN users u ON i.created_by = u.id
          LEFT JOIN investigation_permissions ip ON i.id = ip.investigation_id
          WHERE i.id = ? AND (i.created_by = ? OR ip.user_id = ?)
        `).get(investigationId, userId, userId);
      }

      if (!investigation) {
        return { success: false, message: 'Enquête non trouvée ou accès non autorisé' };
      }

      // Get evidence count
      const evidenceCount = this.db.prepare('SELECT COUNT(*) as count FROM evidence WHERE investigation_id = ?').get(investigationId) as { count: number };
      investigation.evidence_count = evidenceCount.count;

      return { success: true, investigation, message: 'Enquête récupérée avec succès' };
    } catch (error) {
      console.error('Error getting investigation:', error);
      return { success: false, message: 'Erreur lors de la récupération de l\'enquête' };
    }
  }

  // Update investigation status
  async updateInvestigationStatus(
    investigationId: string, 
    status: Investigation['status'], 
    userId: string, 
    userRole: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check permission
      const hasPermission = await this.checkPermission(investigationId, userId, userRole, 'write');
      if (!hasPermission) {
        return { success: false, message: 'Permission insuffisante' };
      }

      const now = DatabaseUtils.now();
      let updateFields = 'status = ?, updated_at = ?';
      let values = [status, now];

      if (status === 'active') {
        updateFields += ', started_at = ?';
        values.push(now);
      } else if (status === 'completed') {
        updateFields += ', completed_at = ?';
        values.push(now);
      }

      values.push(investigationId);

      this.db.prepare(`UPDATE investigations SET ${updateFields} WHERE id = ?`).run(...values);

      return { success: true, message: 'Statut de l\'enquête mis à jour' };
    } catch (error) {
      console.error('Error updating investigation status:', error);
      return { success: false, message: 'Erreur lors de la mise à jour du statut' };
    }
  }

  // Grant permission to user for investigation
  async grantPermission(
    investigationId: string, 
    targetUserId: string, 
    permissionLevel: 'read' | 'write' | 'admin',
    grantedBy: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if investigation exists
      const investigation = this.db.prepare('SELECT id FROM investigations WHERE id = ?').get(investigationId);
      if (!investigation) {
        return { success: false, message: 'Enquête non trouvée' };
      }

      // Check if user exists
      const user = this.db.prepare('SELECT id FROM users WHERE id = ?').get(targetUserId);
      if (!user) {
        return { success: false, message: 'Utilisateur non trouvé' };
      }

      // Insert or update permission
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO investigation_permissions 
        (id, investigation_id, user_id, permission_level, granted_by, granted_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        DatabaseUtils.generateId(),
        investigationId,
        targetUserId,
        permissionLevel,
        grantedBy,
        DatabaseUtils.now()
      );

      return { success: true, message: 'Permission accordée avec succès' };
    } catch (error) {
      console.error('Error granting permission:', error);
      return { success: false, message: 'Erreur lors de l\'attribution de la permission' };
    }
  }

  // Check if user has permission for investigation
  private async checkPermission(
    investigationId: string, 
    userId: string, 
    userRole: string, 
    requiredLevel: 'read' | 'write' | 'admin'
  ): Promise<boolean> {
    try {
      // Owner has all permissions
      if (userRole === 'owner') return true;

      // Check if user is creator
      const investigation = this.db.prepare('SELECT created_by FROM investigations WHERE id = ?').get(investigationId) as { created_by: string } | undefined;
      if (investigation && investigation.created_by === userId) return true;

      // Check explicit permissions
      const permission = this.db.prepare(`
        SELECT permission_level FROM investigation_permissions 
        WHERE investigation_id = ? AND user_id = ?
      `).get(investigationId, userId) as { permission_level: string } | undefined;

      if (!permission) return false;

      // Check permission hierarchy
      const levels = { 'read': 1, 'write': 2, 'admin': 3 };
      const userLevel = levels[permission.permission_level as keyof typeof levels] || 0;
      const requiredLevelNum = levels[requiredLevel];

      return userLevel >= requiredLevelNum;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  // Delete investigation (admin only)
  async deleteInvestigation(investigationId: string, userId: string, userRole: string): Promise<{ success: boolean; message: string }> {
    try {
      const hasPermission = await this.checkPermission(investigationId, userId, userRole, 'admin');
      if (!hasPermission) {
        return { success: false, message: 'Permission insuffisante' };
      }

      // Delete investigation (cascade will handle related records)
      this.db.prepare('DELETE FROM investigations WHERE id = ?').run(investigationId);

      return { success: true, message: 'Enquête supprimée avec succès' };
    } catch (error) {
      console.error('Error deleting investigation:', error);
      return { success: false, message: 'Erreur lors de la suppression de l\'enquête' };
    }
  }

  // Add evidence to investigation
  async addEvidence(data: {
    investigation_id: string;
    type: Evidence['type'];
    title: string;
    content?: string;
    file_path?: string;
    source_tool?: string;
    source_url?: string;
    confidence_score?: number;
    created_by: string;
    tags?: string[];
  }, userRole: string): Promise<{ success: boolean; evidence?: Evidence; message: string }> {
    try {
      const { investigation_id, type, title, content, file_path, source_tool, source_url, confidence_score = 50, created_by, tags } = data;

      // Check permission
      const hasPermission = await this.checkPermission(investigation_id, created_by, userRole, 'write');
      if (!hasPermission) {
        return { success: false, message: 'Permission insuffisante' };
      }

      const evidenceId = DatabaseUtils.generateId();
      const now = DatabaseUtils.now();

      const stmt = this.db.prepare(`
        INSERT INTO evidence (
          id, investigation_id, type, title, content, file_path, source_tool, 
          source_url, confidence_score, created_by, created_at, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        evidenceId,
        investigation_id,
        type,
        title,
        content,
        file_path,
        source_tool,
        source_url,
        confidence_score,
        created_by,
        now,
        tags ? JSON.stringify(tags) : null
      );

      const evidence = this.db.prepare('SELECT * FROM evidence WHERE id = ?').get(evidenceId) as Evidence;

      return { success: true, evidence, message: 'Preuve ajoutée avec succès' };
    } catch (error) {
      console.error('Error adding evidence:', error);
      return { success: false, message: 'Erreur lors de l\'ajout de la preuve' };
    }
  }

  // Get evidence for investigation
  async getEvidence(investigationId: string, userId: string, userRole: string): Promise<{ success: boolean; evidence?: Evidence[]; message: string }> {
    try {
      // Check permission
      const hasPermission = await this.checkPermission(investigationId, userId, userRole, 'read');
      if (!hasPermission) {
        return { success: false, message: 'Permission insuffisante' };
      }

      const evidence = this.db.prepare(`
        SELECT e.*, u.username as creator_name
        FROM evidence e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.investigation_id = ?
        ORDER BY e.created_at DESC
      `).all(investigationId) as Evidence[];

      return { success: true, evidence, message: 'Preuves récupérées avec succès' };
    } catch (error) {
      console.error('Error getting evidence:', error);
      return { success: false, message: 'Erreur lors de la récupération des preuves' };
    }
  }
}

export const investigationService = new InvestigationService();
