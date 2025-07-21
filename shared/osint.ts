export interface OsintAnalysisRequest {
  target: string;
  type: 'discord' | 'email' | 'ip' | 'username' | 'phone' | 'domain';
  tools: string[];
  investigationId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface OsintAnalysisResponse {
  success: boolean;
  analysisId: string;
  target: string;
  type: string;
  status: 'initiated' | 'running' | 'completed' | 'failed';
  results?: {
    tool: string;
    data: any;
    timestamp: string;
    confidence?: number;
  }[];
  message: string;
  error?: string;
}

export interface Investigation {
  id: string;
  name: string;
  date: string;
  status: 'En cours' | 'Terminé' | 'En attente' | 'Suspendu';
  evidence_count: number;
  target_type: string;
  target_value: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by?: string;
  description?: string;
  tags?: string[];
}

export interface InvestigationsResponse {
  success: boolean;
  investigations: Investigation[];
  total: number;
  message?: string;
}

export interface Evidence {
  id: string;
  investigation_id: string;
  type: 'screenshot' | 'text' | 'file' | 'metadata' | 'url';
  content: any;
  source: string;
  tool_used: string;
  timestamp: string;
  hash?: string;
  verified: boolean;
  tags?: string[];
}

export interface OsintTool {
  id: string;
  name: string;
  category: 'discord' | 'email' | 'ip' | 'social' | 'image' | 'file' | 'general';
  description: string;
  input_type: 'text' | 'email' | 'url' | 'file' | 'number';
  status: 'active' | 'inactive' | 'maintenance';
  api_required: boolean;
  rate_limited: boolean;
}

export interface OsintReport {
  id: string;
  investigation_id: string;
  title: string;
  summary: string;
  findings: {
    category: string;
    items: any[];
  }[];
  evidence_ids: string[];
  generated_at: string;
  format: 'pdf' | 'html' | 'json';
  signed: boolean;
  hash?: string;
}
