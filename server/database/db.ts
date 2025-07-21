import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

let db: Database.Database;

export function initializeDatabase() {
  try {
    // Create database connection
    db = new Database(join(process.cwd(), 'data', 'iris.db'));
    
    console.log('📊 Database connected successfully');
    
    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');
    
    // Read and execute schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');
    
    // Execute schema in transaction
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    db.transaction(() => {
      for (const statement of statements) {
        if (statement.trim()) {
          db.exec(statement);
        }
      }
    })();
    
    console.log('✅ Database schema initialized');
    
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    console.log('📊 Database connection closed');
  }
}

// Utility functions for database operations
export class DatabaseUtils {
  static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static now(): string {
    return new Date().toISOString();
  }
  
  static hashPassword(password: string): string {
    const bcrypt = require('bcryptjs');
    return bcrypt.hashSync(password, 12);
  }
  
  static verifyPassword(password: string, hash: string): boolean {
    const bcrypt = require('bcryptjs');
    return bcrypt.compareSync(password, hash);
  }
  
  static generateToken(payload: any): string {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'iris-secret-key-2024-noskills';
    return jwt.sign(payload, secret, { expiresIn: '24h' });
  }
  
  static verifyToken(token: string): any {
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'iris-secret-key-2024-noskills';
    return jwt.verify(token, secret);
  }
}

// Type definitions
export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'owner' | 'investigator';
  full_name?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  created_by?: string;
}

export interface Investigation {
  id: string;
  name: string;
  description?: string;
  target_type: string;
  target_value: string;
  status: 'pending' | 'active' | 'completed' | 'suspended' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: string;
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  tags?: string;
  metadata?: string;
}

export interface Evidence {
  id: string;
  investigation_id: string;
  type: 'screenshot' | 'text' | 'file' | 'metadata' | 'url' | 'image' | 'document';
  title: string;
  content?: string;
  file_path?: string;
  file_hash?: string;
  source_tool?: string;
  source_url?: string;
  confidence_score: number;
  verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_by: string;
  created_at: string;
  metadata?: string;
  tags?: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
