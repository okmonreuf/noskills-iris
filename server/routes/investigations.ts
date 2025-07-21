import { RequestHandler } from "express";
import { investigationService } from "../services/InvestigationService";

export const handleCreateInvestigation: RequestHandler = async (req, res) => {
  try {
    const { name, description, target_type, target_value, priority, tags } = req.body;
    const created_by = (req as any).user.userId;

    if (!name || !target_type || !target_value) {
      return res.status(400).json({
        success: false,
        message: 'Nom, type de cible et valeur de cible requis'
      });
    }

    const result = await investigationService.createInvestigation({
      name,
      description,
      target_type,
      target_value,
      priority,
      created_by,
      tags
    });

    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Create investigation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleGetInvestigations: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    const result = await investigationService.getUserInvestigations(userId, userRole);

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get investigations error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleGetInvestigation: RequestHandler = async (req, res) => {
  try {
    const { investigationId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!investigationId) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'enquête requis'
      });
    }

    const result = await investigationService.getInvestigation(investigationId, userId, userRole);

    const statusCode = result.success ? 200 : 404;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get investigation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleUpdateInvestigationStatus: RequestHandler = async (req, res) => {
  try {
    const { investigationId } = req.params;
    const { status } = req.body;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!investigationId || !status) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'enquête et statut requis'
      });
    }

    const validStatuses = ['pending', 'active', 'completed', 'suspended', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const result = await investigationService.updateInvestigationStatus(investigationId, status, userId, userRole);

    const statusCode = result.success ? 200 : 403;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Update investigation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleDeleteInvestigation: RequestHandler = async (req, res) => {
  try {
    const { investigationId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!investigationId) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'enquête requis'
      });
    }

    const result = await investigationService.deleteInvestigation(investigationId, userId, userRole);

    const statusCode = result.success ? 200 : 403;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Delete investigation error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleGrantPermission: RequestHandler = async (req, res) => {
  try {
    const { investigationId } = req.params;
    const { userId: targetUserId, permissionLevel } = req.body;
    const grantedBy = (req as any).user.userId;

    if (!investigationId || !targetUserId || !permissionLevel) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'enquête, ID utilisateur et niveau de permission requis'
      });
    }

    const validLevels = ['read', 'write', 'admin'];
    if (!validLevels.includes(permissionLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Niveau de permission invalide'
      });
    }

    const result = await investigationService.grantPermission(investigationId, targetUserId, permissionLevel, grantedBy);

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Grant permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleAddEvidence: RequestHandler = async (req, res) => {
  try {
    const { investigationId } = req.params;
    const { type, title, content, source_tool, source_url, confidence_score, tags } = req.body;
    const created_by = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!investigationId || !type || !title) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'enquête, type et titre requis'
      });
    }

    const validTypes = ['screenshot', 'text', 'file', 'metadata', 'url', 'image', 'document'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de preuve invalide'
      });
    }

    const result = await investigationService.addEvidence({
      investigation_id: investigationId,
      type,
      title,
      content,
      source_tool,
      source_url,
      confidence_score,
      created_by,
      tags
    }, userRole);

    const statusCode = result.success ? 201 : 403;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Add evidence error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleGetEvidence: RequestHandler = async (req, res) => {
  try {
    const { investigationId } = req.params;
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    if (!investigationId) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'enquête requis'
      });
    }

    const result = await investigationService.getEvidence(investigationId, userId, userRole);

    const statusCode = result.success ? 200 : 403;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get evidence error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};
