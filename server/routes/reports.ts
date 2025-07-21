import { RequestHandler } from "express";
import { reportService } from "../services/ReportService";
import * as fs from 'fs';
import * as path from 'path';

export const handleGenerateReport: RequestHandler = async (req, res) => {
  try {
    const { investigationId } = req.params;
    const { format = 'pdf', include_evidence = true, include_metadata = true, certification_level = 'basic' } = req.body;
    const userId = (req as any).user.userId;

    if (!investigationId) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'enquête requis'
      });
    }

    const validFormats = ['pdf', 'html', 'json'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Format de rapport non supporté'
      });
    }

    const validCertificationLevels = ['basic', 'advanced', 'forensic'];
    if (!validCertificationLevels.includes(certification_level)) {
      return res.status(400).json({
        success: false,
        message: 'Niveau de certification invalide'
      });
    }

    const result = await reportService.generateReport(investigationId, {
      format,
      include_evidence,
      include_metadata,
      certification_level
    }, userId);

    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleGetReports: RequestHandler = async (req, res) => {
  try {
    const { investigationId } = req.params;

    if (!investigationId) {
      return res.status(400).json({
        success: false,
        message: 'ID d\'enquête requis'
      });
    }

    const result = await reportService.getReports(investigationId);

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleDownloadReport: RequestHandler = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'ID de rapport requis'
      });
    }

    const result = await reportService.downloadReport(reportId);

    if (!result.success || !result.filePath) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    // Check if file exists
    if (!fs.existsSync(result.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier de rapport introuvable'
      });
    }

    // Get file info
    const fileName = path.basename(result.filePath);
    const fileExt = path.extname(fileName).toLowerCase();
    
    // Set appropriate content type
    let contentType = 'application/octet-stream';
    switch (fileExt) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.html':
        contentType = 'text/html';
        break;
      case '.json':
        contentType = 'application/json';
        break;
    }

    // Set headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fs.statSync(result.filePath).size);

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la lecture du fichier'
        });
      }
    });

  } catch (error) {
    console.error('Download report error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
};

export const handlePreviewReport: RequestHandler = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'ID de rapport requis'
      });
    }

    const result = await reportService.downloadReport(reportId);

    if (!result.success || !result.filePath) {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }

    // Check if file exists
    if (!fs.existsSync(result.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier de rapport introuvable'
      });
    }

    const fileExt = path.extname(result.filePath).toLowerCase();
    
    // Only allow preview for HTML and JSON files
    if (fileExt !== '.html' && fileExt !== '.json') {
      return res.status(400).json({
        success: false,
        message: 'Aperçu non disponible pour ce type de fichier'
      });
    }

    // Set appropriate content type for preview
    let contentType = 'text/plain';
    if (fileExt === '.html') {
      contentType = 'text/html';
    } else if (fileExt === '.json') {
      contentType = 'application/json';
    }

    res.setHeader('Content-Type', contentType);
    
    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la lecture du fichier'
        });
      }
    });

  } catch (error) {
    console.error('Preview report error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
};
