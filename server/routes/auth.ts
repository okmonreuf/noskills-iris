import { RequestHandler } from "express";
import { authService } from "../services/AuthService";

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    const result = await authService.login({
      username,
      password,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    const statusCode = result.success ? 200 : 401;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleCreateUser: RequestHandler = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    const created_by = (req as any).user.userId;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur, email et mot de passe requis'
      });
    }

    const result = await authService.createUser({
      username,
      email,
      password,
      full_name,
      created_by
    });

    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleGetUsers: RequestHandler = async (req, res) => {
  try {
    const requesterId = (req as any).user.userId;

    const result = await authService.getAllUsers(requesterId);

    const statusCode = result.success ? 200 : 403;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleDeleteUser: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = (req as any).user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    const result = await authService.deleteUser(userId, requesterId);

    const statusCode = result.success ? 200 : 403;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleToggleUserStatus: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = (req as any).user.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID utilisateur requis'
      });
    }

    const result = await authService.toggleUserStatus(userId, requesterId);

    const statusCode = result.success ? 200 : 403;
    res.status(statusCode).json(result);
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleGetProfile: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    res.json({
      success: true,
      user: {
        id: user.userId,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

export const handleLogout: RequestHandler = async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};
