import { getDatabase, DatabaseUtils } from '../database/db';
import jsPDF from 'jspdf';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportData {
  investigation: any;
  evidence: any[];
  analysis_results?: any[];
  metadata?: any;
}

export interface ReportOptions {
  format: 'pdf' | 'html' | 'json';
  include_evidence: boolean;
  include_metadata: boolean;
  certification_level: 'basic' | 'advanced' | 'forensic';
}

export class ReportService {
  private get db() {
    return getDatabase();
  }

  // Generate complete investigation report
  async generateReport(
    investigationId: string, 
    options: ReportOptions,
    userId: string
  ): Promise<{
    success: boolean;
    report_id?: string;
    file_path?: string;
    certification_key?: string;
    message: string;
  }> {
    try {
      // Get investigation data
      const investigation = this.db.prepare('SELECT * FROM investigations WHERE id = ?').get(investigationId);
      if (!investigation) {
        return { success: false, message: 'Enquête non trouvée' };
      }

      // Get evidence
      const evidence = options.include_evidence ? 
        this.db.prepare('SELECT * FROM evidence WHERE investigation_id = ? ORDER BY created_at DESC').all(investigationId) : [];

      // Get analysis results
      const analysisResults = this.db.prepare('SELECT * FROM osint_analyses WHERE investigation_id = ? ORDER BY started_at DESC').all(investigationId);

      const reportData: ReportData = {
        investigation,
        evidence,
        analysis_results: analysisResults,
        metadata: options.include_metadata ? {
          generated_at: new Date().toISOString(),
          generated_by: userId,
          certification_level: options.certification_level,
          software_version: '1.0.0',
          platform: 'NoSkills Iris'
        } : undefined
      };

      // Generate report based on format
      let filePath: string;
      let reportContent: string | Buffer;

      switch (options.format) {
        case 'pdf':
          ({ filePath, content: reportContent } = await this.generatePDFReport(reportData, options));
          break;
        case 'html':
          ({ filePath, content: reportContent } = await this.generateHTMLReport(reportData, options));
          break;
        case 'json':
          ({ filePath, content: reportContent } = await this.generateJSONReport(reportData, options));
          break;
        default:
          return { success: false, message: 'Format de rapport non supporté' };
      }

      // Generate certification
      const certificationKey = this.generateCertificationKey(reportContent, options.certification_level);
      const fileHash = this.generateFileHash(reportContent);

      // Save report to database
      const reportId = DatabaseUtils.generateId();
      const stmt = this.db.prepare(`
        INSERT INTO reports (
          id, investigation_id, title, summary, format, file_path, 
          file_hash, certification_key, generated_by, generated_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        reportId,
        investigationId,
        `Rapport - ${investigation.name}`,
        this.generateSummary(reportData),
        options.format,
        filePath,
        fileHash,
        certificationKey,
        userId,
        DatabaseUtils.now(),
        JSON.stringify(options)
      );

      return {
        success: true,
        report_id: reportId,
        file_path: filePath,
        certification_key: certificationKey,
        message: 'Rapport généré avec succès'
      };

    } catch (error) {
      console.error('Error generating report:', error);
      return { success: false, message: 'Erreur lors de la génération du rapport' };
    }
  }

  // Generate PDF report
  private async generatePDFReport(data: ReportData, options: ReportOptions): Promise<{ filePath: string; content: Buffer }> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header with Iris logo and certification
    this.addPDFHeader(doc, data, options);
    yPosition = 60;

    // Investigation summary
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉSUMÉ DE L\'ENQUÊTE', 20, yPosition);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nom: ${data.investigation.name}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Type de cible: ${data.investigation.target_type}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Valeur: ${data.investigation.target_value}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Statut: ${data.investigation.status}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Créé le: ${new Date(data.investigation.created_at).toLocaleDateString('fr-FR')}`, 20, yPosition);
    yPosition += 15;

    if (data.investigation.description) {
      doc.text('Description:', 20, yPosition);
      yPosition += 7;
      const descLines = doc.splitTextToSize(data.investigation.description, pageWidth - 40);
      doc.text(descLines, 20, yPosition);
      yPosition += descLines.length * 7 + 10;
    }

    // Evidence section
    if (data.evidence.length > 0) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PREUVES COLLECTÉES', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      data.evidence.forEach((evidence, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${evidence.title}`, 20, yPosition);
        yPosition += 7;

        doc.setFont('helvetica', 'normal');
        doc.text(`Type: ${evidence.type}`, 25, yPosition);
        yPosition += 5;
        doc.text(`Source: ${evidence.source_tool || 'Manuel'}`, 25, yPosition);
        yPosition += 5;
        doc.text(`Confiance: ${evidence.confidence_score}%`, 25, yPosition);
        yPosition += 5;
        doc.text(`Date: ${new Date(evidence.created_at).toLocaleString('fr-FR')}`, 25, yPosition);
        yPosition += 10;

        if (evidence.content) {
          try {
            const content = typeof evidence.content === 'string' ? evidence.content : JSON.stringify(evidence.content, null, 2);
            const contentLines = doc.splitTextToSize(content.substring(0, 200) + (content.length > 200 ? '...' : ''), pageWidth - 50);
            doc.text(contentLines, 25, yPosition);
            yPosition += contentLines.length * 5 + 10;
          } catch (e) {
            doc.text('Contenu non affichable', 25, yPosition);
            yPosition += 10;
          }
        }
      });
    }

    // Analysis results
    if (data.analysis_results && data.analysis_results.length > 0) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RÉSULTATS D\'ANALYSE OSINT', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      data.analysis_results.forEach((analysis, index) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.text(`Analyse ${index + 1}: ${analysis.tool_name}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Cible: ${analysis.target}`, 25, yPosition);
        yPosition += 5;
        doc.text(`Statut: ${analysis.status}`, 25, yPosition);
        yPosition += 5;
        doc.text(`Temps d'exécution: ${analysis.execution_time || 0}ms`, 25, yPosition);
        yPosition += 10;
      });
    }

    // Footer with certification
    this.addPDFFooter(doc, data, options);

    // Generate file path
    const fileName = `rapport_${data.investigation.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'data', 'reports', fileName);

    // Ensure directory exists
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Save PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, pdfBuffer);

    return { filePath, content: pdfBuffer };
  }

  // Add PDF header with Iris branding
  private addPDFHeader(doc: jsPDF, data: ReportData, options: ReportOptions) {
    const pageWidth = doc.internal.pageSize.width;

    // Background rectangle for header
    doc.setFillColor(30, 58, 138); // Blue color
    doc.rect(0, 0, pageWidth, 45, 'F');

    // NoSkills Iris title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('NoSkills Iris', 20, 20);

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Plateforme de Surveillance et d\'Intelligence', 20, 30);

    // Certification badge
    doc.setFontSize(10);
    doc.text(`Certification: ${options.certification_level.toUpperCase()}`, pageWidth - 80, 20);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 80, 30);

    // Eye symbol (simplified)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.ellipse(pageWidth - 25, 20, 8, 5);
    doc.circle(pageWidth - 25, 20, 3);

    // Reset text color
    doc.setTextColor(0, 0, 0);
  }

  // Add PDF footer with certification
  private addPDFFooter(doc: jsPDF, data: ReportData, options: ReportOptions) {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Go to last page for footer
    const pageCount = doc.getNumberOfPages();
    doc.setPage(pageCount);

    // Certification section
    const yPos = pageHeight - 40;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos, pageWidth - 40, 30, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICATION IRIS', 25, yPos + 8);

    doc.setFont('helvetica', 'normal');
    doc.text('Ce rapport a été généré et certifié par la plateforme NoSkills Iris.', 25, yPos + 15);
    doc.text(`Niveau de certification: ${options.certification_level}`, 25, yPos + 20);
    doc.text(`ID du rapport: ${data.metadata?.report_id || 'N/A'}`, 25, yPos + 25);

    // Certification hash (simplified)
    const certHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 16);
    doc.text(`Hash de vérification: ${certHash}`, pageWidth - 120, yPos + 15);

    // Page numbers
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i}/${pageCount}`, pageWidth - 30, pageHeight - 10);
    }
  }

  // Generate HTML report
  private async generateHTMLReport(data: ReportData, options: ReportOptions): Promise<{ filePath: string; content: string }> {
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport NoSkills Iris - ${data.investigation.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 30px; margin: -40px -40px 40px -40px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .certification { background: #f0f9ff; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
        .evidence-item { background: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .metadata { font-size: 0.9em; color: #6b7280; }
        .footer { background: #f9fafb; padding: 20px; margin: 40px -40px -40px -40px; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e5e7eb; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; }
        .status-active { background: #dcfce7; color: #166534; }
        .status-completed { background: #dbeafe; color: #1d4ed8; }
        .status-pending { background: #fef3c7; color: #92400e; }
        pre { background: #f1f5f9; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 NoSkills Iris</h1>
            <p>Rapport d'Investigation OSINT</p>
        </div>

        <div class="certification">
            <h3>🔒 Certification Iris</h3>
            <p><strong>Niveau:</strong> ${options.certification_level.toUpperCase()}</p>
            <p><strong>Généré le:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            <p><strong>Plateforme:</strong> NoSkills Iris v1.0</p>
            <p><strong>Clé de certification:</strong> <code>IRIS-${crypto.randomBytes(8).toString('hex').toUpperCase()}</code></p>
        </div>

        <div class="section">
            <h2>📋 Résumé de l'Enquête</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Nom:</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.investigation.name}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Type de cible:</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.investigation.target_type}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Valeur:</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.investigation.target_value}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Statut:</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><span class="status-badge status-${data.investigation.status}">${data.investigation.status}</span></td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Créé le:</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date(data.investigation.created_at).toLocaleString('fr-FR')}</td></tr>
            </table>
            ${data.investigation.description ? `<p><strong>Description:</strong><br>${data.investigation.description}</p>` : ''}
        </div>

        ${data.evidence.length > 0 ? `
        <div class="section">
            <h2>🔍 Preuves Collectées (${data.evidence.length})</h2>
            ${data.evidence.map((evidence, index) => `
                <div class="evidence-item">
                    <h4>${index + 1}. ${evidence.title}</h4>
                    <div class="metadata">
                        <strong>Type:</strong> ${evidence.type} | 
                        <strong>Source:</strong> ${evidence.source_tool || 'Manuel'} | 
                        <strong>Confiance:</strong> ${evidence.confidence_score}% | 
                        <strong>Date:</strong> ${new Date(evidence.created_at).toLocaleString('fr-FR')}
                    </div>
                    ${evidence.content ? `<pre>${typeof evidence.content === 'string' ? evidence.content.substring(0, 500) : JSON.stringify(evidence.content, null, 2).substring(0, 500)}</pre>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${data.analysis_results && data.analysis_results.length > 0 ? `
        <div class="section">
            <h2>📊 Résultats d'Analyse OSINT</h2>
            ${data.analysis_results.map((analysis, index) => `
                <div class="evidence-item">
                    <h4>Analyse ${index + 1}: ${analysis.tool_name}</h4>
                    <p><strong>Cible:</strong> ${analysis.target}</p>
                    <p><strong>Statut:</strong> ${analysis.status}</p>
                    <p><strong>Temps d'exécution:</strong> ${analysis.execution_time || 0}ms</p>
                    ${analysis.results ? `<pre>${JSON.stringify(JSON.parse(analysis.results), null, 2).substring(0, 1000)}</pre>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>Ce rapport a été généré automatiquement par <strong>NoSkills Iris</strong></p>
            <p>Certification de niveau <strong>${options.certification_level}</strong> | Hash de vérification: ${crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 16)}</p>
            <p>© 2024 NoSkills - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>`;

    const fileName = `rapport_${data.investigation.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.html`;
    const filePath = path.join(process.cwd(), 'data', 'reports', fileName);

    // Ensure directory exists
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, html, 'utf8');

    return { filePath, content: html };
  }

  // Generate JSON report
  private async generateJSONReport(data: ReportData, options: ReportOptions): Promise<{ filePath: string; content: string }> {
    const report = {
      report_metadata: {
        generated_at: new Date().toISOString(),
        platform: 'NoSkills Iris',
        version: '1.0.0',
        certification_level: options.certification_level,
        format: 'json'
      },
      investigation: data.investigation,
      evidence: data.evidence,
      analysis_results: data.analysis_results,
      certification: {
        key: this.generateCertificationKey(JSON.stringify(data), options.certification_level),
        hash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),
        signature: `IRIS-${crypto.randomBytes(16).toString('hex').toUpperCase()}`
      }
    };

    const content = JSON.stringify(report, null, 2);
    const fileName = `rapport_${data.investigation.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
    const filePath = path.join(process.cwd(), 'data', 'reports', fileName);

    // Ensure directory exists
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, 'utf8');

    return { filePath, content };
  }

  // Generate certification key
  private generateCertificationKey(content: string | Buffer, level: string): string {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const timestamp = Date.now().toString(36);
    const levelCode = level.substring(0, 3).toUpperCase();
    
    return `IRIS-${levelCode}-${timestamp}-${hash.substring(0, 12).toUpperCase()}`;
  }

  // Generate file hash
  private generateFileHash(content: string | Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Generate summary
  private generateSummary(data: ReportData): string {
    return `Rapport d'enquête OSINT pour "${data.investigation.name}". ` +
           `${data.evidence.length} preuves collectées. ` +
           `Cible: ${data.investigation.target_type} (${data.investigation.target_value}). ` +
           `Statut: ${data.investigation.status}.`;
  }

  // Get all reports for investigation
  async getReports(investigationId: string): Promise<{ success: boolean; reports?: any[]; message: string }> {
    try {
      const reports = this.db.prepare(`
        SELECT r.*, u.username as generated_by_name
        FROM reports r
        LEFT JOIN users u ON r.generated_by = u.id
        WHERE r.investigation_id = ?
        ORDER BY r.generated_at DESC
      `).all(investigationId);

      return { success: true, reports, message: 'Rapports récupérés avec succès' };
    } catch (error) {
      console.error('Error getting reports:', error);
      return { success: false, message: 'Erreur lors de la récupération des rapports' };
    }
  }

  // Download report file
  async downloadReport(reportId: string): Promise<{ success: boolean; filePath?: string; message: string }> {
    try {
      const report = this.db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId);
      if (!report) {
        return { success: false, message: 'Rapport non trouvé' };
      }

      if (!fs.existsSync(report.file_path)) {
        return { success: false, message: 'Fichier du rapport introuvable' };
      }

      return { success: true, filePath: report.file_path, message: 'Rapport prêt au téléchargement' };
    } catch (error) {
      console.error('Error downloading report:', error);
      return { success: false, message: 'Erreur lors du téléchargement' };
    }
  }
}

export const reportService = new ReportService();
