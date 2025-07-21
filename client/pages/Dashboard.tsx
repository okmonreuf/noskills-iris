import React, { useState } from 'react';
import { 
  Shield, Search, FileText, Settings, Eye, Target, Zap, Database, Globe, Users, Lock, 
  AlertTriangle, ExternalLink, Plus, Play, CheckCircle, Clock, User, LogOut, Activity,
  Scan, Radar, Satellite, Monitor, Brain, Crosshair, Radio, Signal, Cpu, Network
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestigations } from '@/hooks/useInvestigations';
import { useOsintAnalysis } from '@/hooks/useOsintAnalysis';
import { toast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [activeTheme, setActiveTheme] = useState('intelligence');
  const [quickAnalysisTarget, setQuickAnalysisTarget] = useState('');
  const [newInvestigationData, setNewInvestigationData] = useState({
    name: '',
    description: '',
    target_type: 'discord',
    target_value: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  const { user, logout } = useAuth();
  const { investigations, loading, createInvestigation, updateInvestigationStatus } = useInvestigations();
  const { performQuickAnalysis, isAnalyzing, analysisResults } = useOsintAnalysis();

  const themeOptions = [
    { id: 'intelligence', name: 'Intelligence', class: '' },
    { id: 'tactical', name: 'Tactique', class: 'tactical' },
    { id: 'stealth', name: 'Furtif', class: 'stealth' }
  ];

  const handleThemeChange = (theme: string) => {
    setActiveTheme(theme);
    const themeClass = themeOptions.find(t => t.id === theme)?.class || '';
    document.documentElement.className = themeClass;
  };

  // Calculate statistics from real data
  const stats = {
    activeInvestigations: investigations.filter(inv => inv.status === 'active').length,
    totalEvidence: investigations.reduce((sum, inv) => sum + (inv.evidence_count || 0), 0),
    completedInvestigations: investigations.filter(inv => inv.status === 'completed').length,
    pendingInvestigations: investigations.filter(inv => inv.status === 'pending').length
  };

  const intelligenceTools = [
    {
      category: 'SURVEILLANCE NUMÉRIQUE',
      icon: Monitor,
      color: 'text-intel-unclassified',
      tools: [
        { name: 'Localisation Discord', icon: Radio, status: 'active', classification: 'RESTREINT' },
        { name: 'Interception Messages', icon: Signal, status: 'active', classification: 'SECRET' },
        { name: 'Profilage Historique', icon: Database, status: 'active', classification: 'CONFIDENTIEL' },
        { name: 'Analyse Comportementale', icon: Brain, status: 'active', classification: 'RESTREINT' }
      ]
    },
    {
      category: 'RENSEIGNEMENT SOCIAL',
      icon: Network,
      color: 'text-intel-restricted',
      tools: [
        { name: 'Infiltration Twitter/X', icon: Satellite, status: 'active', classification: 'SECRET' },
        { name: 'Reconnaissance Instagram', icon: Eye, status: 'active', classification: 'CONFIDENTIEL' },
        { name: 'Surveillance TikTok', icon: Scan, status: 'active', classification: 'RESTREINT' },
        { name: 'Écoute Telegram', icon: Radio, status: 'active', classification: 'SECRET' }
      ]
    },
    {
      category: 'CYBER-INVESTIGATION',
      icon: Cpu,
      color: 'text-intel-secret',
      tools: [
        { name: 'Traçage Email', icon: Search, status: 'active', classification: 'CONFIDENTIEL' },
        { name: 'Géolocalisation IP', icon: Globe, status: 'active', classification: 'RESTREINT' },
        { name: 'Reconnaissance Inverse', icon: Crosshair, status: 'active', classification: 'SECRET' },
        { name: 'Analyse Forensique', icon: FileText, status: 'active', classification: 'CLASSIFIÉ' }
      ]
    }
  ];

  const handleQuickAnalysis = async () => {
    if (!quickAnalysisTarget.trim()) {
      toast({
        title: "ERREUR OPÉRATIONNELLE",
        description: "Cible manquante pour l'analyse de renseignement",
        variant: "destructive"
      });
      return;
    }

    const result = await performQuickAnalysis(quickAnalysisTarget);
    if (result.success) {
      toast({
        title: "ANALYSE TERMINÉE",
        description: result.analysis?.message || "Collecte de renseignement réussie",
      });
    } else {
      toast({
        title: "ÉCHEC ANALYSE",
        description: result.message || "Erreur dans la collecte de renseignement",
        variant: "destructive"
      });
    }
  };

  const handleCreateInvestigation = async () => {
    if (!newInvestigationData.name || !newInvestigationData.target_value) {
      toast({
        title: "DONNÉES INSUFFISANTES",
        description: "Nom de mission et cible requis",
        variant: "destructive"
      });
      return;
    }

    const result = await createInvestigation(newInvestigationData);
    if (result.success) {
      toast({
        title: "MISSION CRÉÉE",
        description: "Nouvelle opération d'intelligence initiée",
      });
      setNewInvestigationData({
        name: '',
        description: '',
        target_type: 'discord',
        target_value: '',
        priority: 'medium'
      });
    } else {
      toast({
        title: "ÉCHEC CRÉATION",
        description: result.message || "Erreur lors de l'initialisation",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (investigationId: string, newStatus: string) => {
    const result = await updateInvestigationStatus(investigationId, newStatus as any);
    if (result.success) {
      toast({
        title: "STATUT MISSION MIS À JOUR",
        description: "Statut opérationnel modifié avec succès",
      });
    } else {
      toast({
        title: "ERREUR MISE À JOUR",
        description: result.message || "Impossible de modifier le statut",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "DÉCONNEXION SÉCURISÉE",
      description: "Session fermée - Accès révoqué",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-mission-active';
      case 'completed': return 'bg-mission-completed';
      case 'pending': return 'bg-mission-pending';
      case 'suspended': return 'bg-mission-compromised';
      default: return 'bg-mission-archived';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'ACTIF';
      case 'completed': return 'TERMINÉ';
      case 'pending': return 'EN ATTENTE';
      case 'suspended': return 'SUSPENDU';
      case 'cancelled': return 'ANNULÉ';
      default: return status.toUpperCase();
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'CLASSIFIÉ': return 'text-intel-classified';
      case 'SECRET': return 'text-intel-secret';
      case 'CONFIDENTIEL': return 'text-intel-confidential';
      case 'RESTREINT': return 'text-intel-restricted';
      default: return 'text-intel-unclassified';
    }
  };

  return (
    <div className="min-h-screen bg-background intel-grid">
      {/* Classification Banner */}
      <div className="classified-banner">
        ★ RESTRICTED ACCESS ★ NOSKILLS INTELLIGENCE SYSTEM ★ NIVEAU SÉCURITÉ: SECRET ★
      </div>

      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur cyber-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10 cyber-glow">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground font-mono tracking-wider">
                  <span className="text-primary">NO</span>SKILLS <span className="text-accent">INTELLIGENCE</span>
                </h1>
                <p className="text-sm text-muted-foreground font-mono">CENTRE DE COMMANDEMENT • SURVEILLANCE • ANALYSE</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm font-mono">
                <span className="text-muted-foreground">AGENT:</span> <span className="font-medium text-primary">{user?.username}</span>
                {user?.role === 'owner' && (
                  <span className="ml-2 px-2 py-1 bg-intel-classified/20 text-intel-classified rounded text-xs font-mono border border-intel-classified/30">
                    COMMANDANT
                  </span>
                )}
              </div>
              
              <Select value={activeTheme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-32 cyber-border font-mono">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id} className="font-mono">
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Link to="/tools">
                <Button variant="outline" className="cyber-glow border-primary/50 text-primary hover:bg-primary/10 font-mono">
                  <Zap className="h-4 w-4 mr-2" />
                  ARSENAL
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </Link>
              
              {user?.role === 'owner' && (
                <Link to="/admin">
                  <Button variant="outline" className="border-intel-classified/50 text-intel-classified hover:bg-intel-classified/10 font-mono">
                    <Shield className="h-4 w-4 mr-2" />
                    COMMANDEMENT
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </Link>
              )}
              
              <Button variant="outline" onClick={handleLogout} className="font-mono">
                <LogOut className="h-4 w-4 mr-2" />
                DÉCONNEXION
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 cyber-border bg-card/50">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 font-mono">
              <Radar className="h-4 w-4" />
              CENTRE OPS
            </TabsTrigger>
            <TabsTrigger value="quick-analysis" className="flex items-center gap-2 font-mono">
              <Scan className="h-4 w-4" />
              ANALYSE RAPIDE
            </TabsTrigger>
            <TabsTrigger value="new-investigation" className="flex items-center gap-2 font-mono">
              <Target className="h-4 w-4" />
              NOUVELLE MISSION
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2 font-mono">
              <Satellite className="h-4 w-4" />
              ARSENAL
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 font-mono">
              <Settings className="h-4 w-4" />
              CONFIGURATION
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="cyber-border bg-card/50 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-mono tracking-wide">MISSIONS ACTIVES</CardTitle>
                  <Target className="h-4 w-4 text-mission-active" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono text-mission-active">{stats.activeInvestigations}</div>
                  <p className="text-xs text-muted-foreground font-mono">{stats.pendingInvestigations} EN ATTENTE</p>
                </CardContent>
              </Card>
              
              <Card className="cyber-border bg-card/50 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-mono tracking-wide">RENSEIGNEMENTS</CardTitle>
                  <Database className="h-4 w-4 text-evidence-digital" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono text-evidence-digital">{stats.totalEvidence}</div>
                  <p className="text-xs text-muted-foreground font-mono">{investigations.length} DOSSIERS TOTAL</p>
                </CardContent>
              </Card>
              
              <Card className="cyber-border bg-card/50 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-mono tracking-wide">OUTILS DÉPLOYÉS</CardTitle>
                  <Cpu className="h-4 w-4 text-surveillance-online" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono text-surveillance-online">25</div>
                  <p className="text-xs text-muted-foreground font-mono">TOUS OPÉRATIONNELS</p>
                </CardContent>
              </Card>
              
              <Card className="cyber-border bg-card/50 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-mono tracking-wide">MISSIONS RÉUSSIES</CardTitle>
                  <CheckCircle className="h-4 w-4 text-mission-completed" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono text-mission-completed">{stats.completedInvestigations}</div>
                  <p className="text-xs text-muted-foreground font-mono">TAUX DE SUCCÈS</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Operations */}
            <Card className="cyber-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-mono tracking-wide">OPÉRATIONS RÉCENTES</CardTitle>
                <CardDescription className="font-mono">Dernières missions de renseignement</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Scan className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-muted-foreground font-mono">CHARGEMENT DES DONNÉES<span className="loading-dots"></span></p>
                  </div>
                ) : investigations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-mono">AUCUNE MISSION. INITIEZ VOTRE PREMIÈRE OPÉRATION.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {investigations.slice(0, 5).map((investigation) => (
                      <div key={investigation.id} className="flex items-center justify-between p-4 border border-border/50 rounded cyber-border bg-muted/5 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded bg-primary/10">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium font-mono">{investigation.name}</h4>
                            <p className="text-sm text-muted-foreground font-mono">
                              <span className="text-accent">{investigation.target_type.toUpperCase()}:</span> {investigation.target_value}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">{new Date(investigation.created_at).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className={`${getStatusColor(investigation.status)} text-white border-transparent font-mono`}>
                            {getStatusText(investigation.status)}
                          </Badge>
                          <span className="text-sm text-muted-foreground font-mono">{investigation.evidence_count || 0} INTEL</span>
                          <Select onValueChange={(value) => handleStatusChange(investigation.id, value)} defaultValue={investigation.status}>
                            <SelectTrigger className="w-32 cyber-border font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending" className="font-mono">EN ATTENTE</SelectItem>
                              <SelectItem value="active" className="font-mono">ACTIF</SelectItem>
                              <SelectItem value="completed" className="font-mono">TERMINÉ</SelectItem>
                              <SelectItem value="suspended" className="font-mono">SUSPENDU</SelectItem>
                              <SelectItem value="cancelled" className="font-mono">ANNULÉ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Intelligence Tools Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {intelligenceTools.map((category, index) => (
                <Card key={index} className="cyber-border bg-card/50 backdrop-blur">
                  <CardHeader>
                    <CardTitle className={`text-lg font-mono tracking-wide flex items-center gap-2 ${category.color}`}>
                      <category.icon className="h-5 w-5" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.tools.map((tool, toolIndex) => (
                        <Link key={toolIndex} to="/tools" className="block">
                          <Button 
                            variant="outline" 
                            className="w-full justify-between cyber-border hover:cyber-glow transition-all"
                            disabled={tool.status !== 'active'}
                          >
                            <div className="flex items-center gap-2">
                              <tool.icon className="h-4 w-4 text-primary" />
                              <span className="font-mono text-sm">{tool.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs font-mono ${getClassificationColor(tool.classification)}`}>
                                {tool.classification}
                              </Badge>
                              <ExternalLink className="h-3 w-3" />
                            </div>
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Quick Analysis Tab */}
          <TabsContent value="quick-analysis" className="space-y-6">
            <Card className="cyber-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono tracking-wide">
                  <Scan className="h-5 w-5 text-primary" />
                  ANALYSE DE RENSEIGNEMENT RAPIDE
                </CardTitle>
                <CardDescription className="font-mono">
                  Déploiement automatique des outils d'analyse avec détection de cible
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Cible: Discord, email, IP, identifiant, URL..."
                      value={quickAnalysisTarget}
                      onChange={(e) => setQuickAnalysisTarget(e.target.value)}
                      className="text-lg font-mono cyber-border bg-input/50"
                    />
                  </div>
                  <Button 
                    onClick={handleQuickAnalysis}
                    disabled={!quickAnalysisTarget.trim() || isAnalyzing}
                    className="px-8 cyber-glow font-mono"
                  >
                    {isAnalyzing ? (
                      <>
                        <Scan className="h-4 w-4 mr-2 animate-spin" />
                        ANALYSE<span className="loading-dots"></span>
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        DÉPLOYER
                      </>
                    )}
                  </Button>
                </div>

                {analysisResults && (
                  <div className="mt-6 p-4 border border-border rounded-lg cyber-border bg-muted/20">
                    <h4 className="font-medium mb-2 font-mono text-primary">RÉSULTATS D'ANALYSE</h4>
                    <p className="text-sm text-muted-foreground mb-4 font-mono">{analysisResults.message}</p>
                    {analysisResults.results && analysisResults.results.length > 0 && (
                      <div className="space-y-2">
                        {analysisResults.results.map((result, index) => (
                          <div key={index} className="p-3 bg-card rounded border cyber-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium font-mono">{result.tool}</span>
                              <Badge variant={result.success ? "default" : "destructive"} className="font-mono">
                                {result.success ? `${result.confidence}% FIABILITÉ` : 'ÉCHEC'}
                              </Badge>
                            </div>
                            {result.success && (
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto font-mono">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Investigation Tab */}
          <TabsContent value="new-investigation" className="space-y-6">
            <Card className="cyber-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="font-mono tracking-wide">INITIER NOUVELLE MISSION</CardTitle>
                <CardDescription className="font-mono">
                  Configuration des paramètres opérationnels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="investigation-name" className="font-mono">NOM DE CODE</Label>
                      <Input 
                        id="investigation-name" 
                        placeholder="Ex: OPERATION_BLACKBIRD_001"
                        value={newInvestigationData.name}
                        onChange={(e) => setNewInvestigationData(prev => ({ ...prev, name: e.target.value }))}
                        className="font-mono cyber-border"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="target-type" className="font-mono">TYPE DE CIBLE</Label>
                      <Select value={newInvestigationData.target_type} onValueChange={(value) => setNewInvestigationData(prev => ({ ...prev, target_type: value }))}>
                        <SelectTrigger className="cyber-border font-mono">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discord" className="font-mono">UTILISATEUR DISCORD</SelectItem>
                          <SelectItem value="email" className="font-mono">ADRESSE EMAIL</SelectItem>
                          <SelectItem value="ip" className="font-mono">ADRESSE IP</SelectItem>
                          <SelectItem value="username" className="font-mono">IDENTIFIANT</SelectItem>
                          <SelectItem value="phone" className="font-mono">NUMÉRO TÉLÉPHONE</SelectItem>
                          <SelectItem value="domain" className="font-mono">DOMAINE</SelectItem>
                          <SelectItem value="url" className="font-mono">URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="target-value" className="font-mono">VALEUR CIBLE</Label>
                      <Input 
                        id="target-value" 
                        placeholder="Ex: username#1234, email@domain.com"
                        value={newInvestigationData.target_value}
                        onChange={(e) => setNewInvestigationData(prev => ({ ...prev, target_value: e.target.value }))}
                        className="font-mono cyber-border"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="investigation-description" className="font-mono">BRIEFING MISSION</Label>
                      <Textarea 
                        id="investigation-description"
                        placeholder="Objectifs, contexte et directives opérationnelles..."
                        className="h-24 font-mono cyber-border"
                        value={newInvestigationData.description}
                        onChange={(e) => setNewInvestigationData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="priority" className="font-mono">NIVEAU PRIORITÉ</Label>
                      <Select value={newInvestigationData.priority} onValueChange={(value: any) => setNewInvestigationData(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger className="cyber-border font-mono">
                          <SelectValue placeholder="Niveau" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low" className="font-mono">ROUTINE</SelectItem>
                          <SelectItem value="medium" className="font-mono">STANDARD</SelectItem>
                          <SelectItem value="high" className="font-mono">PRIORITAIRE</SelectItem>
                          <SelectItem value="urgent" className="font-mono">CRITIQUE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    onClick={handleCreateInvestigation}
                    className="flex-1 cyber-glow font-mono"
                    disabled={!newInvestigationData.name || !newInvestigationData.target_value}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    INITIER MISSION
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="text-center py-12">
              <Link to="/tools">
                <Button className="cyber-glow font-mono text-lg px-8 py-4">
                  <Satellite className="h-5 w-5 mr-3" />
                  ACCÉDER À L'ARSENAL COMPLET
                  <ExternalLink className="h-5 w-5 ml-3" />
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="cyber-border bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="font-mono">SÉCURITÉ OPÉRATIONNELLE</CardTitle>
                  <CardDescription className="font-mono">Configuration protocoles de sécurité</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-mono">CHIFFREMENT AES-256</Label>
                      <p className="text-sm text-muted-foreground font-mono">Protection données locales</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-mono">MODE FURTIF</Label>
                      <p className="text-sm text-muted-foreground font-mono">Utilisation via Tor/VPN</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-mono">AUDIT COMPLET</Label>
                      <p className="text-sm text-muted-foreground font-mono">Enregistrement toutes actions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="cyber-border bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="font-mono">INTÉGRATIONS EXTERNES</CardTitle>
                  <CardDescription className="font-mono">Configuration APIs et services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="discord-webhook" className="font-mono">WEBHOOK DISCORD</Label>
                    <Input 
                      id="discord-webhook" 
                      type="url"
                      placeholder="https://discord.com/api/webhooks/..."
                      className="font-mono cyber-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vt-api-key" className="font-mono">CLÉ API VIRUSTOTAL</Label>
                    <Input 
                      id="vt-api-key" 
                      type="password"
                      placeholder="••••••••••••••••••••"
                      className="font-mono cyber-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hunter-api-key" className="font-mono">CLÉ API HUNTER.IO</Label>
                    <Input 
                      id="hunter-api-key" 
                      type="password"
                      placeholder="••••••••���•••••••••••"
                      className="font-mono cyber-border"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom classification banner */}
      <div className="classified-banner">
        ★ SYSTÈME NOSKILLS ★ USAGE AUTORISÉ UNIQUEMENT ★ SURVEILLANCE ACTIVE ★
      </div>
    </div>
  );
}
