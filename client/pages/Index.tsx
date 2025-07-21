import React, { useState, useEffect } from 'react';
import { Shield, Search, FileText, Settings, Eye, Target, Zap, Database, Globe, Users, Lock, AlertTriangle, ExternalLink, Plus, Play, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestigations } from '@/hooks/useInvestigations';
import { useOsintAnalysis } from '@/hooks/useOsintAnalysis';
import { toast } from '@/hooks/use-toast';
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

export default function Index() {
  const [activeTheme, setActiveTheme] = useState('dark');
  const [currentInvestigation, setCurrentInvestigation] = useState('');
  const [quickAnalysisTarget, setQuickAnalysisTarget] = useState('');
  const [newInvestigationData, setNewInvestigationData] = useState({
    name: '',
    description: '',
    target_type: 'discord',
    target_value: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
  });

  const { user, logout } = useAuth();
  const { investigations, loading, createInvestigation, updateInvestigationStatus, fetchInvestigations } = useInvestigations();
  const { performQuickAnalysis, isAnalyzing, analysisResults, formatResultsForDisplay } = useOsintAnalysis();

  const themeOptions = [
    { id: 'dark', name: 'Sombre', class: 'dark' },
    { id: 'light', name: 'Clair', class: '' },
    { id: 'military', name: 'Militaire', class: 'military' }
  ];

  const handleThemeChange = (theme: string) => {
    setActiveTheme(theme);
    const themeClass = themeOptions.find(t => t.id === theme)?.class || '';
    document.documentElement.className = themeClass;
  };

  const osintTools = [
    {
      category: 'Discord',
      tools: [
        { name: 'Recherche Utilisateur', icon: Users, status: 'active' },
        { name: 'Capture Messages', icon: FileText, status: 'active' },
        { name: 'Historique Profils', icon: Database, status: 'active' }
      ]
    },
    {
      category: 'Réseaux Sociaux',
      tools: [
        { name: 'Twitter/X OSINT', icon: Globe, status: 'active' },
        { name: 'Instagram', icon: Eye, status: 'active' },
        { name: 'TikTok', icon: Target, status: 'active' },
        { name: 'Telegram', icon: Users, status: 'active' }
      ]
    },
    {
      category: 'Investigation',
      tools: [
        { name: 'Recherche Email', icon: Search, status: 'active' },
        { name: 'Recherche IP', icon: Globe, status: 'active' },
        { name: 'Recherche Image', icon: Eye, status: 'active' },
        { name: 'Analyse Fichiers', icon: FileText, status: 'active' }
      ]
    }
  ];

    // Calculate statistics from real data
  const stats = {
    activeInvestigations: investigations.filter(inv => inv.status === 'active').length,
    totalEvidence: investigations.reduce((sum, inv) => sum + (inv.evidence_count || 0), 0),
    completedInvestigations: investigations.filter(inv => inv.status === 'completed').length,
    pendingInvestigations: investigations.filter(inv => inv.status === 'pending').length
  };

  const handleQuickAnalysis = async () => {
    if (!quickAnalysisTarget.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une cible pour l'analyse",
        variant: "destructive"
      });
      return;
    }

    const result = await performQuickAnalysis(quickAnalysisTarget);
    if (result.success) {
      toast({
        title: "Analyse terminée",
        description: result.analysis?.message || "Analyse OSINT terminée avec succès",
      });
    } else {
      toast({
        title: "Erreur d'analyse",
        description: result.message || "Erreur lors de l'analyse OSINT",
        variant: "destructive"
      });
    }
  };

  const handleCreateInvestigation = async () => {
    if (!newInvestigationData.name || !newInvestigationData.target_value) {
      toast({
        title: "Erreur",
        description: "Nom et cible requis",
        variant: "destructive"
      });
      return;
    }

    const result = await createInvestigation(newInvestigationData);
    if (result.success) {
      toast({
        title: "Enquête créée",
        description: "Nouvelle enquête créée avec succès",
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
        title: "Erreur",
        description: result.message || "Erreur lors de la création",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (investigationId: string, newStatus: string) => {
    const result = await updateInvestigationStatus(investigationId, newStatus as any);
    if (result.success) {
      toast({
        title: "Statut mis à jour",
        description: "Le statut de l'enquête a été mis à jour",
      });
    } else {
      toast({
        title: "Erreur",
        description: result.message || "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès",
    });
  };

  return (
    <div className="min-h-screen bg-background osint-grid">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 glow">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">NoSkills Iris</h1>
                <p className="text-sm text-muted-foreground">Plateforme de Surveillance et d'Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={activeTheme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Thème" />
                </SelectTrigger>
                <SelectContent>
                  {themeOptions.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
                            <div className="flex items-center gap-4">
                <Link to="/tools">
                  <Button variant="outline" className="glow">
                    <Zap className="h-4 w-4 mr-2" />
                    Outils OSINT
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-osint-success" />
                  <span className="text-sm text-osint-success font-medium">Sécurisé</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Tableau de Bord
            </TabsTrigger>
            <TabsTrigger value="new-investigation" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Nouvelle Enquête
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Outils OSINT
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Résultats
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enquêtes Actives</CardTitle>
                  <Target className="h-4 w-4 text-osint-info" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">+1 cette semaine</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Preuves Collectées</CardTitle>
                  <Database className="h-4 w-4 text-osint-evidence" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-xs text-muted-foreground">Dernières 24h</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Outils Disponibles</CardTitle>
                  <Zap className="h-4 w-4 text-osint-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Tous opérationnels</p>
                </CardContent>
              </Card>
              
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Menaces Détectées</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-osint-threat" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">Niveau moyen</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Investigations */}
            <Card>
              <CardHeader>
                <CardTitle>Enquêtes Récentes</CardTitle>
                <CardDescription>Dernières investigations et leur statut</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvestigations.map((investigation, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{investigation.name}</h4>
                          <p className="text-sm text-muted-foreground">{investigation.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={investigation.status === 'Terminé' ? 'default' : investigation.status === 'En cours' ? 'secondary' : 'outline'}>
                          {investigation.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{investigation.evidence} preuves</span>
                        <Button variant="outline" size="sm">Ouvrir</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* OSINT Tools Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {osintTools.map((category, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.tools.map((tool, toolIndex) => (
                        <div key={toolIndex} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <tool.icon className="h-4 w-4 text-primary" />
                            <span className="text-sm">{tool.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {tool.status === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* New Investigation Tab */}
          <TabsContent value="new-investigation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Créer une Nouvelle Enquête</CardTitle>
                <CardDescription>
                  Configurez les paramètres de votre enquête OSINT
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="investigation-name">Nom de l'Enquête</Label>
                      <Input 
                        id="investigation-name" 
                        placeholder="Ex: Investigation_Discord_User_002"
                        value={currentInvestigation}
                        onChange={(e) => setCurrentInvestigation(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="target-type">Type de Cible</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discord-user">Utilisateur Discord</SelectItem>
                          <SelectItem value="email">Adresse Email</SelectItem>
                          <SelectItem value="ip">Adresse IP</SelectItem>
                          <SelectItem value="username">Nom d'utilisateur</SelectItem>
                          <SelectItem value="phone">Numéro de téléphone</SelectItem>
                          <SelectItem value="domain">Nom de domaine</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="target-value">Valeur de la Cible</Label>
                      <Input 
                        id="target-value" 
                        placeholder="Ex: username#1234, email@domain.com, 192.168.1.1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="investigation-purpose">Objectif de l'Enquête</Label>
                      <Textarea 
                        id="investigation-purpose"
                        placeholder="Décrivez l'objectif et le contexte de cette enquête..."
                        className="h-24"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priorité</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Niveau de priorité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-4">Outils à Activer</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['Discord OSINT', 'Email Lookup', 'IP Analysis', 'Social Media', 'Image Search', 'File Analysis'].map((tool) => (
                      <div key={tool} className="flex items-center space-x-2">
                        <Switch id={tool} defaultChecked />
                        <Label htmlFor={tool} className="text-sm">{tool}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Button className="flex-1 glow">
                    <Search className="h-4 w-4 mr-2" />
                    Démarrer l'Enquête
                  </Button>
                  <Button variant="outline">Sauvegarder en Brouillon</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {osintTools.map((category, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{category.category}</CardTitle>
                    <CardDescription>Outils spécialisés pour {category.category.toLowerCase()}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {category.tools.map((tool, toolIndex) => (
                      <Button 
                        key={toolIndex} 
                        variant="outline" 
                        className="w-full justify-start"
                        disabled={tool.status !== 'active'}
                      >
                        <tool.icon className="h-4 w-4 mr-2" />
                        {tool.name}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Résultats et Preuves</CardTitle>
                <CardDescription>
                  Consultez les preuves collectées lors de vos enquêtes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune enquête active. Démarrez une nouvelle enquête pour voir les résultats ici.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>Configuration de la sécurité et de la confidentialité</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Chiffrement AES-256</Label>
                      <p className="text-sm text-muted-foreground">Chiffrer les données localement</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mode Anonyme</Label>
                      <p className="text-sm text-muted-foreground">Utiliser via Tor/VPN</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Journal d'Audit</Label>
                      <p className="text-sm text-muted-foreground">Enregistrer toutes les actions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Intégrations</CardTitle>
                  <CardDescription>Configuration des intégrations externes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="discord-webhook">Webhook Discord</Label>
                    <Input 
                      id="discord-webhook" 
                      type="url"
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="vt-api-key">Clé API VirusTotal</Label>
                    <Input 
                      id="vt-api-key" 
                      type="password"
                      placeholder="Votre clé API VirusTotal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hunter-api-key">Clé API Hunter.io</Label>
                    <Input 
                      id="hunter-api-key" 
                      type="password"
                      placeholder="Votre clé API Hunter.io"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
