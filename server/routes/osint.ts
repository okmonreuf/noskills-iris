import { RequestHandler } from "express";
import { osintService } from "../services/OsintService";

export const handleOsintAnalysis: RequestHandler = async (req, res) => {
  try {
    const { target, type, tools, investigation_id } = req.body;
    const userId = (req as any).user.userId;
    
    if (!target || !type) {
      return res.status(400).json({
        success: false,
        message: 'Cible et type requis'
      });
    }

    const validTypes = ['discord', 'email', 'ip', 'username', 'phone', 'domain', 'url'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type d\'analyse non supporté'
      });
    }

    const result = await osintService.analyzeTarget({
      target,
      type,
      tools: tools || [],
      investigation_id
    }, userId);

    res.json(result);
    
  } catch (error) {
    console.error('OSINT Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleGetAnalysis: RequestHandler = async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    if (!analysisId) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'analyse requis'
      });
    }

    const result = await osintService.getAnalysis(analysisId);
    res.json(result);
    
  } catch (error) {
    console.error('Get Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleListInvestigations: RequestHandler = async (req, res) => {
  try {
    // This is now handled by the investigations service
    // This endpoint is kept for backward compatibility
    res.json({
      success: true,
      message: 'Utilisez /api/investigations pour les enquêtes',
      redirect: '/api/investigations'
    });
    
  } catch (error) {
    console.error('List Investigations Error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};
