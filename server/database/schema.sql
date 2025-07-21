-- NoSkills Iris Database Schema

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'investigator' CHECK (role IN ('owner', 'investigator')),
    full_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    created_by TEXT,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Investigations table
CREATE TABLE IF NOT EXISTS investigations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    target_type TEXT NOT NULL,
    target_value TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'suspended', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_by TEXT NOT NULL,
    assigned_to TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    tags TEXT, -- JSON array of tags
    metadata TEXT, -- JSON object for additional data
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Investigation permissions (who can access what investigation)
CREATE TABLE IF NOT EXISTS investigation_permissions (
    id TEXT PRIMARY KEY,
    investigation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    permission_level TEXT DEFAULT 'read' CHECK (permission_level IN ('read', 'write', 'admin')),
    granted_by TEXT NOT NULL,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id),
    UNIQUE(investigation_id, user_id)
);

-- Evidence table
CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY,
    investigation_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('screenshot', 'text', 'file', 'metadata', 'url', 'image', 'document')),
    title TEXT NOT NULL,
    content TEXT, -- JSON or text content
    file_path TEXT, -- Path to stored file if applicable
    file_hash TEXT, -- SHA256 hash for integrity
    source_tool TEXT, -- Which OSINT tool generated this
    source_url TEXT, -- Original URL if applicable
    confidence_score INTEGER DEFAULT 50, -- 0-100 confidence
    verified BOOLEAN DEFAULT 0,
    verified_by TEXT,
    verified_at DATETIME,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT, -- JSON object for additional data
    tags TEXT, -- JSON array of tags
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- OSINT Analysis results
CREATE TABLE IF NOT EXISTS osint_analyses (
    id TEXT PRIMARY KEY,
    investigation_id TEXT,
    target TEXT NOT NULL,
    target_type TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    results TEXT, -- JSON results
    error_message TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    created_by TEXT NOT NULL,
    execution_time INTEGER, -- milliseconds
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    investigation_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT, -- JSON or HTML content
    format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'html', 'json')),
    file_path TEXT,
    file_hash TEXT, -- SHA256 hash for integrity
    certification_key TEXT, -- Iris certification key
    generated_by TEXT NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT, -- JSON object for additional data
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- Activity logs for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT, -- 'user', 'investigation', 'evidence', etc.
    target_id TEXT,
    details TEXT, -- JSON object with action details
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- System settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_by TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_investigations_created_by ON investigations(created_by);
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_evidence_investigation_id ON evidence(investigation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(type);
CREATE INDEX IF NOT EXISTS idx_osint_analyses_investigation_id ON osint_analyses(investigation_id);
CREATE INDEX IF NOT EXISTS idx_osint_analyses_status ON osint_analyses(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Insert default owner account (password: iris2024!)
INSERT OR IGNORE INTO users (
    id, 
    username, 
    email, 
    password_hash, 
    role, 
    full_name, 
    is_active
) VALUES (
        'owner-001',
    'Yupi',
    'admin@no-skills.fr',
        '$2a$12$rI8kQ8mHSVJzN8kL5VuOZe.L7qJ9nK4dF8pR6gN2hX5wE3tY7zB1m', -- 1616Dh!dofly
    'owner',
    'Intelligence Administrator',
    1
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value, description) VALUES 
('app_name', 'NoSkills Iris', 'Application name'),
('certification_key', 'IRIS-CERT-2024-NSK', 'Default certification key for documents'),
('max_file_size', '100MB', 'Maximum file upload size'),
('session_timeout', '24h', 'User session timeout'),
('default_theme', 'dark', 'Default UI theme');
