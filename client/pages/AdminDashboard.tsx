import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Trash2, ToggleLeft, ToggleRight, Shield, Key, Eye, 
  UserCheck, UserX, Search, Filter, Download, FileText, Settings,
  AlertTriangle, CheckCircle, Clock, Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { useAuth, useAuthenticatedFetch } from '@/contexts/AuthContext';
import { useInvestigations } from '@/hooks/useInvestigations';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'owner' | 'investigator';
  full_name?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'investigator' as 'investigator'
  });

  const { user: currentUser, logout } = useAuth();
  const { investigations } = useInvestigations();
  const authenticatedFetch = useAuthenticatedFetch();

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors du chargement des utilisateurs",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create user
  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: "Erreur",
        description: "Tous les champs obligatoires doivent être remplis",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await authenticatedFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Utilisateur créé",
          description: "Nouvel utilisateur créé avec succès"
        });
        setShowCreateDialog(false);
        setNewUser({
          username: '',
          email: '',
          password: '',
          full_name: '',
          role: 'investigator'
        });
        fetchUsers();
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de la création",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  // Toggle user status
  const handleToggleUserStatus = async (userId: string) => {
    try {
      const response = await authenticatedFetch(`/api/users/${userId}/toggle`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Statut modifié",
          description: data.message
        });
        fetchUsers();
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de la modification",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await authenticatedFetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Utilisateur supprimé",
          description: data.message
        });
        fetchUsers();
      } else {
        toast({
          title: "Erreur",
          description: data.message || "Erreur lors de la suppression",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      });
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    investigators: users.filter(u => u.role === 'investigator').length,
    recentLogins: users.filter(u => u.last_login && new Date(u.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = () => {
    logout();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès"
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
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">NoSkills Iris - Administration</h1>
                <p className="text-sm text-muted-foreground">Gestion des utilisateurs et du système</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{currentUser?.username}</span>
                <span className="ml-2 px-2 py-1 bg-destructive/10 text-destructive rounded text-xs">Propriétaire</span>
              </div>
              
              <Link to="/">
                <Button variant="outline">
                  <Target className="h-4 w-4 mr-2" />
                  Tableau de Bord
                </Button>
              </Link>
              
              <Button variant="outline" onClick={handleLogout}>
                <Shield className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs Total</CardTitle>
              <Users className="h-4 w-4 text-osint-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{stats.activeUsers} actifs</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enquêteurs</CardTitle>
              <UserCheck className="h-4 w-4 text-osint-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.investigators}</div>
              <p className="text-xs text-muted-foreground">Rôle enquêteur</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enquêtes Actives</CardTitle>
              <Target className="h-4 w-4 text-osint-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{investigations.filter(i => i.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">En cours</p>
            </CardContent>
          </Card>
          
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connexions Récentes</CardTitle>
              <Clock className="h-4 w-4 text-osint-evidence" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentLogins}</div>
              <p className="text-xs text-muted-foreground">7 derniers jours</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gestion des Utilisateurs</CardTitle>
                <CardDescription>Créez, modifiez et gérez les comptes utilisateurs</CardDescription>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="glow">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel Utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un Nouvel Utilisateur</DialogTitle>
                    <DialogDescription>
                      Ajoutez un nouveau compte enquêteur à la plateforme
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="new-username">Nom d'utilisateur *</Label>
                      <Input
                        id="new-username"
                        value={newUser.username}
                        onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="nom_utilisateur"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-email">Email *</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="utilisateur@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">Mot de passe *</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Mot de passe sécurisé"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-fullname">Nom complet</Label>
                      <Input
                        id="new-fullname"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Prénom Nom"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateUser}>
                      Créer l'Utilisateur
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="owner">Propriétaire</SelectItem>
                  <SelectItem value="investigator">Enquêteur</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Chargement des utilisateurs...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun utilisateur trouvé.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded ${user.is_active ? 'bg-osint-success/10' : 'bg-muted'}`}>
                        {user.is_active ? (
                          <UserCheck className="h-4 w-4 text-osint-success" />
                        ) : (
                          <UserX className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{user.username}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.full_name && (
                          <p className="text-xs text-muted-foreground">{user.full_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={user.role === 'owner' ? 'destructive' : 'secondary'}>
                        {user.role === 'owner' ? 'Propriétaire' : 'Enquêteur'}
                      </Badge>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        {user.last_login && (
                          <p className="text-xs text-muted-foreground">
                            Dernière connexion: {new Date(user.last_login).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {user.id !== currentUser?.id && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleUserStatus(user.id)}
                            >
                              {user.is_active ? (
                                <>
                                  <ToggleRight className="h-4 w-4 mr-1" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-4 w-4 mr-1" />
                                  Activer
                                </>
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir supprimer l'utilisateur "{user.username}" ? 
                                    Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
