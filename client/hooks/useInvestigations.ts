import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '@/contexts/AuthContext';

export interface Investigation {
  id: string;
  name: string;
  description?: string;
  target_type: string;
  target_value: string;
  status: 'pending' | 'active' | 'completed' | 'suspended' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_by: string;
  creator_name?: string;
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  evidence_count?: number;
  tags?: string;
  metadata?: string;
}

export function useInvestigations() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/investigations');
      const data = await response.json();
      
      if (data.success) {
        setInvestigations(data.investigations || []);
        setError(null);
      } else {
        setError(data.message || 'Erreur lors du chargement des enquêtes');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Error fetching investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  const createInvestigation = async (investigationData: {
    name: string;
    description?: string;
    target_type: string;
    target_value: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    tags?: string[];
  }) => {
    try {
      const response = await authenticatedFetch('/api/investigations', {
        method: 'POST',
        body: JSON.stringify(investigationData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchInvestigations(); // Refresh list
        return { success: true, investigation: data.investigation };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Error creating investigation:', err);
      return { success: false, message: 'Erreur lors de la création de l\'enquête' };
    }
  };

  const updateInvestigationStatus = async (investigationId: string, status: Investigation['status']) => {
    try {
      const response = await authenticatedFetch(`/api/investigations/${investigationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchInvestigations(); // Refresh list
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Error updating investigation status:', err);
      return { success: false, message: 'Erreur lors de la mise à jour' };
    }
  };

  const deleteInvestigation = async (investigationId: string) => {
    try {
      const response = await authenticatedFetch(`/api/investigations/${investigationId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchInvestigations(); // Refresh list
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Error deleting investigation:', err);
      return { success: false, message: 'Erreur lors de la suppression' };
    }
  };

  const getInvestigation = async (investigationId: string) => {
    try {
      const response = await authenticatedFetch(`/api/investigations/${investigationId}`);
      const data = await response.json();
      
      if (data.success) {
        return { success: true, investigation: data.investigation };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      console.error('Error fetching investigation:', err);
      return { success: false, message: 'Erreur lors du chargement de l\'enquête' };
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  return {
    investigations,
    loading,
    error,
    fetchInvestigations,
    createInvestigation,
    updateInvestigationStatus,
    deleteInvestigation,
    getInvestigation,
  };
}
