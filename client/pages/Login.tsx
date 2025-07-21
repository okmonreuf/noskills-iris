import React, { useState } from 'react';
import { Eye, Lock, User, AlertCircle, Shield, Target, Activity, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(credentials.username, credentials.password);
      
      if (!result.success) {
        setError(result.message);
      }
      // If successful, the AuthContext will handle the redirect
    } catch (error) {
      console.error('Login form error:', error);
      setError('Erreur inattendue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user types
  };

  return (
        <div className="min-h-screen bg-background intel-grid relative overflow-hidden">
      {/* Version Banner */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-primary/10 border-b border-primary/30 py-1">
        <p className="text-center text-xs font-mono text-primary tracking-wider">
          NOSKILLS INTELLIGENCE v2.0.1
        </p>
      </div>

      {/* Access Info Banner */}
      <div className="classified-banner">
        ★ VOUS AVEZ BESOIN QUE LE PROPRIÉTAIRE VOUS CRÉE UN COMPTE POUR ACCÉDER AUX SERVICES PAYANTS ★
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background opacity-90"></div>
      
      {/* Animated Surveillance Grid */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-6 pt-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="mx-auto h-20 w-20 rounded-full bg-card cyber-border flex items-center justify-center cyber-glow">
                <Eye className="h-10 w-10 text-primary" />
                <div className="absolute inset-0 border-2 border-primary rounded-full opacity-20 animate-ping"></div>
              </div>
              <div className="absolute -inset-4 border border-primary/20 rounded-full animate-pulse"></div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground tracking-wider">
                <span className="font-mono">NO</span>
                <span className="text-primary">SKILLS</span>
              </h1>
              <div className="flex items-center justify-center gap-2 text-primary font-mono text-lg tracking-widest">
                <Target className="h-4 w-4" />
                <span>INTELLIGENCE</span>
                <Target className="h-4 w-4" />
              </div>
              <p className="text-muted-foreground text-sm font-mono tracking-wide">
                SURVEILLANCE • RENSEIGNEMENT • ANALYSE
              </p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="cyber-border bg-card/95 backdrop-blur-sm shadow-cyber">
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl font-mono tracking-wide">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>ACCÈS SÉCURISÉ</span>
                </CardTitle>
                <div className="flex items-center gap-1">
                  <div className="status-indicator status-active"></div>
                  <span className="text-xs font-mono text-mission-active">SYSTÈME ACTIF</span>
                </div>
              </div>
              <CardDescription className="font-mono text-muted-foreground">
                Authentification requise pour accéder au système de renseignement
              </CardDescription>
              
                            {/* Access Status */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded border border-border/50">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-surveillance-online" />
                  <span className="text-xs font-mono">Services Premium</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-surveillance-online">COMPTE REQUIS</span>
                  <div className="w-2 h-2 bg-surveillance-online rounded-full animate-pulse"></div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="cyber-border">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-mono text-sm">
                      ERREUR D'AUTHENTIFICATION: {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                                        <Label htmlFor="username" className="text-sm font-mono tracking-wide text-foreground/90">
                      IDENTIFIANT
                    </Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="username"
                        type="text"
                                                placeholder="Votre identifiant..."
                        value={credentials.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className="pl-10 font-mono tracking-wide cyber-border bg-input/50 focus:bg-input focus:shadow-cyber transition-all"
                        required
                        disabled={isLoading}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-mono tracking-wide text-foreground/90">
                      CODE D'ACCÈS
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••••••"
                        value={credentials.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10 font-mono tracking-wide cyber-border bg-input/50 focus:bg-input focus:shadow-cyber transition-all"
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 font-mono tracking-widest text-lg cyber-glow bg-primary hover:bg-primary/90 transition-all"
                  disabled={isLoading || !credentials.username || !credentials.password}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <Scan className="h-5 w-5 animate-spin" />
                      <span>AUTHENTIFICATION<span className="loading-dots"></span></span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5" />
                      <span>ACCÉDER AU SYSTÈME</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Security Info */}
              <div className="mt-6 p-4 bg-muted/10 rounded cyber-border space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-surveillance-online rounded-full"></div>
                  <span className="font-mono text-muted-foreground">Connexion chiffrée AES-256</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 bg-surveillance-online rounded-full"></div>
                  <span className="font-mono text-muted-foreground">Authentification multi-facteurs</span>
                </div>
                
              </div>
            </CardContent>
          </Card>

                    {/* Footer */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="status-indicator status-active"></div>
                <span className="text-surveillance-online">SERVEURS OPÉRATIONNELS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="status-indicator status-completed"></div>
                <span className="text-mission-completed">ACCÈS SÉCURISÉ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional visual effects */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
    </div>
  );
}
