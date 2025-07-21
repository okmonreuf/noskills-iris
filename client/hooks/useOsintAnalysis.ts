import { useState } from 'react';
import { useAuthenticatedFetch } from '@/contexts/AuthContext';

export interface OsintResult {
  tool: string;
  success: boolean;
  data: any;
  confidence: number;
  timestamp: string;
  execution_time: number;
  error?: string;
}

export interface OsintAnalysis {
  analysis_id: string;
  target: string;
  type: string;
  results?: OsintResult[];
  message: string;
}

export function useOsintAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<OsintAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const analyzeTarget = async (request: {
    target: string;
    type: 'discord' | 'email' | 'ip' | 'username' | 'phone' | 'domain' | 'url';
    tools?: string[];
    investigation_id?: string;
  }) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      
      const response = await authenticatedFetch('/api/osint/analyze', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAnalysisResults(data);
        return { success: true, analysis: data };
      } else {
        setError(data.message || 'Erreur lors de l\'analyse');
        return { success: false, message: data.message };
      }
    } catch (err) {
      const errorMessage = 'Erreur de connexion lors de l\'analyse';
      setError(errorMessage);
      console.error('Error during OSINT analysis:', err);
      return { success: false, message: errorMessage };
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAnalysis = async (analysisId: string) => {
    try {
      const response = await authenticatedFetch(`/api/osint/analysis/${analysisId}`);
      const data = await response.json();
      
      if (data.success) {
        return { success: true, analysis: data.analysis };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Error fetching analysis:', err);
      return { success: false, message: 'Erreur lors de la récupération de l\'analyse' };
    }
  };

  const clearResults = () => {
    setAnalysisResults(null);
    setError(null);
  };

  const getTargetTypeFromInput = (input: string): 'discord' | 'email' | 'ip' | 'username' | 'domain' | 'url' => {
    // Email detection
    if (input.includes('@') && input.includes('.')) {
      return 'email';
    }
    
    // IP detection
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipRegex.test(input)) {
      return 'ip';
    }
    
    // URL detection
    if (input.startsWith('http://') || input.startsWith('https://') || input.includes('www.')) {
      return 'url';
    }
    
    // Domain detection
    if (input.includes('.') && !input.includes(' ') && !input.includes('@')) {
      return 'domain';
    }
    
    // Discord user detection
    if (input.includes('#') && input.length > 5) {
      return 'discord';
    }
    
    // Default to username
    return 'username';
  };

  const performQuickAnalysis = async (input: string, investigationId?: string) => {
    const type = getTargetTypeFromInput(input);
    return await analyzeTarget({
      target: input,
      type,
      investigation_id: investigationId
    });
  };

  const formatResultsForDisplay = (results: OsintResult[]) => {
    return results.map(result => ({
      ...result,
      displayData: typeof result.data === 'object' ? 
        Object.entries(result.data).map(([key, value]) => ({
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
        })) : 
        [{ label: 'Résultat', value: String(result.data) }]
    }));
  };

  return {
    isAnalyzing,
    analysisResults,
    error,
    analyzeTarget,
    getAnalysis,
    clearResults,
    getTargetTypeFromInput,
    performQuickAnalysis,
    formatResultsForDisplay,
  };
}
