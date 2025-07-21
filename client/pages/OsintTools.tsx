import React, { useState } from 'react';
import { 
  Shield, Search, FileText, Eye, Target, Zap, Database, Globe, Users, Lock, 
  ArrowLeft, Play, Download, Share, Copy, CheckCircle, XCircle, Clock,
  MessageSquare, Hash, Mail, MapPin, Image, File, Twitter, Instagram,
  Phone, Calendar, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

export default function OsintTools() {
  const [activeQuery, setActiveQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const toolCategories = [
    {
      name: 'Discord OSINT',
      icon: MessageSquare,
      color: 'text-blue-400',
      tools: [
        { name: 'Recherche par Pseudo', desc: 'Trouvez un utilisateur par son nom d\'affichage', input: 'text' },
        { name: 'Recherche par ID', desc: 'Recherche directe par ID Discord', input: 'number' },
        { name: 'Analyse de Serveur', desc: 'Informations sur un serveur Discord', input: 'url' },
        { name: 'Historique d\'Avatar', desc: 'Historique des photos de profil', input: 'text' },
        { name: 'Capture de Message', desc: 'Capture et archivage de messages', input: 'url' }
      ]
    },
    {
      name: 'Recherche Email',
      icon: Mail,
      color: 'text-green-400',
      tools: [
        { name: 'HaveIBeenPwned', desc: 'Vérifier les fuites de données', input: 'email' },
        { name: 'Hunter.io', desc: 'Recherche d\'emails professionnels', input: 'text' },
        { name: 'Vérification Domaine', desc: 'Analyser le domaine de l\'email', input: 'email' },
        { name: 'SMTP Validation', desc: 'Vérifier la validité de l\'email', input: 'email' }
      ]
    },
    {
      name: 'Analyse IP',
      icon: MapPin,
      color: 'text-red-400',
      tools: [
        { name: 'Géolocalisation', desc: 'Localiser une adresse IP', input: 'text' },
        { name: 'Whois Lookup', desc: 'Informations sur le propriétaire', input: 'text' },
        { name: 'Scan de Ports', desc: 'Scanner les ports ouverts', input: 'text' },
        { name: 'Historique IP', desc: 'Historique et réputation', input: 'text' }
      ]
    },
    {
      name: 'Réseaux Sociaux',
      icon: Users,
      color: 'text-purple-400',
      tools: [
        { name: 'Sherlock', desc: 'Recherche multi-plateforme', input: 'text' },
        { name: 'Twitter OSINT', desc: 'Analyse de profils Twitter', input: 'text' },
        { name: 'Instagram Scan', desc: 'Informations sur les profils IG', input: 'text' },
        { name: 'TikTok Research', desc: 'Recherche sur TikTok', input: 'text' }
      ]
    },
    {
      name: 'Recherche d\'Images',
      icon: Image,
      color: 'text-yellow-400',
      tools: [
        { name: 'Google Images', desc: 'Recherche inversée Google', input: 'file' },
        { name: 'Yandex Images', desc: 'Recherche inversée Yandex', input: 'file' },
        { name: 'TinEye', desc: 'Recherche inversée TinEye', input: 'file' },
        { name: 'Analyse EXIF', desc: 'Métadonnées des images', input: 'file' }
      ]
    },
    {
      name: 'Analyse de Fichiers',
      icon: File,
      color: 'text-orange-400',
      tools: [
        { name: 'VirusTotal', desc: 'Scanner les malwares', input: 'file' },
        { name: 'Hash Analysis', desc: 'Générer MD5/SHA256', input: 'file' },
        { name: 'Metadata Extraction', desc: 'Extraire les métadonnées', input: 'file' },
        { name: 'File Signature', desc: 'Signature numérique', input: 'file' }
      ]
    }
  ];

  const recentScans = [
    { tool: 'Discord User Lookup', target: 'username#1234', status: 'completed', time: '2 min ago', results: 15 },
    { tool: 'Email OSINT', target: 'test@example.com', status: 'running', time: '5 min ago', results: 8 },
    { tool: 'IP Geolocation', target: '192.168.1.1', status: 'failed', time: '10 min ago', results: 0 }
  ];

  const handleQuickScan = () => {
    if (!activeQuery.trim()) return;
    
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate scanning process
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background osint-grid">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 glow">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                                <div>
                  <h1 className="text-lg font-bold text-foreground">NoSkills Iris - Outils</h1>
                  <p className="text-sm text-muted-foreground">Suite complète d'outils de surveillance et d'investigation</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-osint-success border-osint-success">
                {toolCategories.reduce((acc, cat) => acc + cat.tools.length, 0)} Outils Disponibles
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Scan Section */}
      <div className="container mx-auto px-6 py-6">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Analyse Rapide
            </CardTitle>
            <CardDescription>
              Démarrez une analyse rapide avec détection automatique du type de cible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Pseudo Discord, email, IP, nom d'utilisateur..."
                  value={activeQuery}
                  onChange={(e) => setActiveQuery(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button 
                onClick={handleQuickScan}
                disabled={!activeQuery.trim() || isScanning}
                className="px-8 glow"
              >
                {isScanning ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Analyse...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Analyser
                  </>
                )}
              </Button>
            </div>
            
            {isScanning && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression de l'analyse</span>
                  <span>{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {toolCategories.map((category, index) => (
            <Card key={index} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <category.icon className={`h-5 w-5 ${category.color}`} />
                  {category.name}
                </CardTitle>
                <CardDescription>
                  {category.tools.length} outils disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.tools.map((tool, toolIndex) => (
                    <div key={toolIndex} className="flex items-center justify-between p-2 rounded border border-border/30 hover:border-primary/30 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{tool.name}</h4>
                        <p className="text-xs text-muted-foreground">{tool.desc}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Play className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Analyses Récentes
            </CardTitle>
            <CardDescription>
              Historique de vos dernières analyses OSINT
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScans.map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded ${
                      scan.status === 'completed' ? 'bg-osint-success/10' :
                      scan.status === 'running' ? 'bg-osint-info/10' :
                      'bg-osint-threat/10'
                    }`}>
                      {scan.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-osint-success" />
                      ) : scan.status === 'running' ? (
                        <Clock className="h-4 w-4 text-osint-info animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 text-osint-threat" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">{scan.tool}</h4>
                      <p className="text-sm text-muted-foreground">{scan.target}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant={
                        scan.status === 'completed' ? 'default' :
                        scan.status === 'running' ? 'secondary' : 'destructive'
                      }>
                        {scan.status === 'completed' ? 'Terminé' :
                         scan.status === 'running' ? 'En cours' : 'Échec'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{scan.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{scan.results} résultats</p>
                    </div>
                    <Button variant="outline" size="sm" disabled={scan.status !== 'completed'}>
                      Voir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
