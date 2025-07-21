import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleOsintAnalysis, handleGetAnalysis, handleListInvestigations } from "./routes/osint";
import {
  handleLogin, handleCreateUser, handleGetUsers, handleDeleteUser,
  handleToggleUserStatus, handleGetProfile, handleLogout
} from "./routes/auth";
import {
  handleCreateInvestigation, handleGetInvestigations, handleGetInvestigation,
  handleUpdateInvestigationStatus, handleDeleteInvestigation, handleGrantPermission,
  handleAddEvidence, handleGetEvidence
} from "./routes/investigations";
import {
  handleGenerateReport, handleGetReports, handleDownloadReport, handlePreviewReport
} from "./routes/reports";
import { authService } from "./services/AuthService";
import { initializeDatabase } from "./database/db";

export function createServer() {
  const app = express();

  // Initialize database
  try {
    initializeDatabase();
    console.log('🎯 NoSkills Iris database initialized');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

      // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "NoSkills Iris API v1.0 - Operational" });
  });

  app.get("/api/demo", handleDemo);

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", authService.authenticateToken.bind(authService), handleLogout);
  app.get("/api/auth/profile", authService.authenticateToken.bind(authService), handleGetProfile);

  // User management routes (owner only)
  app.post("/api/users", authService.authenticateToken.bind(authService), authService.requireOwner.bind(authService), handleCreateUser);
  app.get("/api/users", authService.authenticateToken.bind(authService), authService.requireOwner.bind(authService), handleGetUsers);
  app.delete("/api/users/:userId", authService.authenticateToken.bind(authService), authService.requireOwner.bind(authService), handleDeleteUser);
  app.patch("/api/users/:userId/toggle", authService.authenticateToken.bind(authService), authService.requireOwner.bind(authService), handleToggleUserStatus);

  // Investigation routes
  app.post("/api/investigations", authService.authenticateToken.bind(authService), handleCreateInvestigation);
  app.get("/api/investigations", authService.authenticateToken.bind(authService), handleGetInvestigations);
  app.get("/api/investigations/:investigationId", authService.authenticateToken.bind(authService), handleGetInvestigation);
  app.patch("/api/investigations/:investigationId/status", authService.authenticateToken.bind(authService), handleUpdateInvestigationStatus);
  app.delete("/api/investigations/:investigationId", authService.authenticateToken.bind(authService), handleDeleteInvestigation);
  app.post("/api/investigations/:investigationId/permissions", authService.authenticateToken.bind(authService), handleGrantPermission);

    // Evidence routes
  app.post("/api/investigations/:investigationId/evidence", authService.authenticateToken.bind(authService), handleAddEvidence);
  app.get("/api/investigations/:investigationId/evidence", authService.authenticateToken.bind(authService), handleGetEvidence);

  // Report routes
  app.post("/api/investigations/:investigationId/reports", authService.authenticateToken.bind(authService), handleGenerateReport);
  app.get("/api/investigations/:investigationId/reports", authService.authenticateToken.bind(authService), handleGetReports);
  app.get("/api/reports/:reportId/download", authService.authenticateToken.bind(authService), handleDownloadReport);
  app.get("/api/reports/:reportId/preview", authService.authenticateToken.bind(authService), handlePreviewReport);

  // OSINT API routes
  app.post("/api/osint/analyze", authService.authenticateToken.bind(authService), handleOsintAnalysis);
  app.get("/api/osint/analysis/:analysisId", authService.authenticateToken.bind(authService), handleGetAnalysis);
  app.get("/api/osint/legacy-investigations", authService.authenticateToken.bind(authService), handleListInvestigations);

  return app;
}
