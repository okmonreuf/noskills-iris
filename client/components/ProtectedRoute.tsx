import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Eye } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOwner?: boolean;
}

export default function ProtectedRoute({ children, requireOwner = false }: ProtectedRouteProps) {
  const { isAuthenticated, isOwner, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background osint-grid">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center glow mb-4">
            <Eye className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-xl font-bold text-foreground">NoSkills Iris</h1>
          <p className="text-muted-foreground mt-2">Vérification des permissions...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Check owner requirement
  if (requireOwner && !isOwner()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background osint-grid">
        <div className="text-center max-w-md">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Eye className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Accès Restreint</h1>
          <p className="text-muted-foreground mt-2">
            Cette section est réservée au propriétaire du système.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Contactez l'administrateur si vous pensez qu'il s'agit d'une erreur.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
