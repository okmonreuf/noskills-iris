# 🔍 NoSkills Iris - Plateforme OSINT Complète

## 🎯 Vue d'ensemble

**NoSkills Iris** est une plateforme OSINT (Open Source Intelligence) complète développée en français, conçue pour les professionnels de la cybersécurité et les enquêteurs. Elle offre des outils avancés de surveillance, d'investigation et de génération de rapports certifiés.

## ✨ Fonctionnalités Principales

### 🔐 Authentification et Sécurité
- **Système d'authentification JWT** sécurisé
- **Chiffrement AES-256** des données sensibles
- **Contrôle d'accès basé sur les rôles** (Propriétaire/Enquêteur)
- **Journalisation complète** des actions
- **Protection anti-bruteforce** avec Fail2Ban

### 🧠 Intelligence d'Enquête
- **Création d'enquêtes personnalisées** avec objectifs définis
- **Analyse automatique des cibles** (Discord, Email, IP, Noms d'utilisateur)
- **Système de permissions granulaires** pour le partage d'enquêtes
- **Tableau de bord temps réel** avec statistiques

### 🔎 Outils OSINT Intégrés (25+ outils)

#### Discord OSINT
- Recherche d'utilisateur par pseudo/ID
- Capture automatique de messages
- Historique des avatars et profils
- Analyse des serveurs fréquentés

#### Email Intelligence
- Vérification HaveIBeenPwned
- Recherche Hunter.io
- Analyse de domaine
- Validation SMTP

#### Géolocalisation IP
- Localisation géographique précise
- Informations Whois
- Scan de ports
- Analyse de réputation

#### Réseaux Sociaux
- Recherche multi-plateforme (Sherlock)
- Twitter/X, Instagram, TikTok
- LinkedIn, GitHub, Reddit
- Scraping de profils publics

#### Recherche d'Images
- Recherche inversée (Google, Yandex, TinEye)
- Analyse des métadonnées EXIF
- Détection de manipulation

#### Analyse de Fichiers
- Scanner VirusTotal intégré
- Génération de hash MD5/SHA256
- Extraction de métadonnées
- Signature numérique

### 📊 Génération de Rapports Certifiés
- **Formats multiples** : PDF, HTML, JSON
- **Certification Iris** avec clé cryptographique
- **Niveaux de certification** : Basic, Advanced, Forensic
- **Signature numérique** pour l'authenticité
- **Export sécurisé** et partage contrôlé

### 👥 Gestion Administrative (Propriétaire)
- **Création de comptes enquêteurs**
- **Gestion des permissions**
- **Surveillance des activités**
- **Contrôle des accès aux enquêtes**
- **Statistiques d'utilisation**

## 🚀 Installation et Déploiement

### Déploiement VPS Automatique

Le script `deploy.sh` automatise complètement le déploiement :

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement complet
sudo ./deploy.sh
```

### Configuration Manuelle

```bash
# 1. Installation des dépendances
npm install

# 2. Construction de l'application
npm run build

# 3. Démarrage en production
npm start
```

### Variables d'Environnement

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=votre_clé_secrète_jwt
DB_PATH=/opt/noskills-iris/data
VIRUSTOTAL_API_KEY=votre_clé_vt
HUNTER_IO_API_KEY=votre_clé_hunter
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
```

## 🔑 Première Connexion

### Identifiants par Défaut
- **Utilisateur** : `owner`
- **Mot de passe** : `iris2024!`

⚠️ **Important** : Changez ces identifiants immédiatement après la première connexion.

### Configuration Initiale
1. Connectez-vous avec les identifiants par défaut
2. Accédez à **Administration** → **Gestion des Utilisateurs**
3. Créez vos comptes enquêteurs
4. Configurez les intégrations API dans **Configuration**
5. Testez les outils OSINT avec une analyse rapide

## 📋 Guide d'Utilisation

### Créer une Nouvelle Enquête
1. **Tableau de Bord** → **Nouvelle Enquête**
2. Remplissez les informations :
   - Nom de l'enquête
   - Type de cible (Discord, Email, IP, etc.)
   - Valeur de la cible
   - Description et priorité
3. Sélectionnez les outils à activer
4. Cliquez sur **Créer l'Enquête**

### Effectuer une Analyse Rapide
1. **Tableau de Bord** → **Analyse Rapide**
2. Entrez votre cible (auto-détection du type)
3. Cliquez sur **Analyser**
4. Consultez les résultats en temps réel

### Générer un Rapport Certifié
1. Sélectionnez une enquête terminée
2. **Actions** → **Générer Rapport**
3. Choisissez le format (PDF/HTML/JSON)
4. Sélectionnez le niveau de certification
5. Téléchargez le rapport signé

### Gestion des Utilisateurs (Propriétaire)
1. **Administration** → **Gestion des Utilisateurs**
2. **Nouvel Utilisateur** pour créer un compte
3. Activez/Désactivez des comptes existants
4. Gérez les permissions d'enquête

## 🛡️ Sécurité

### Fonctionnalités de Sécurité
- **Chiffrement bout-en-bout** des données sensibles
- **Authentification à deux facteurs** (optionnelle)
- **Audit trail complet** de toutes les actions
- **Protection DDoS** via Nginx et rate limiting
- **Firewall automatique** configuré par le script de déploiement
- **Certificats SSL** Let's Encrypt automatiques

### Recommandations
- Utilisez des mots de passe forts (12+ caractères)
- Activez le mode anonyme pour les enquêtes sensibles
- Effectuez des sauvegardes régulières de la base de données
- Surveillez les logs d'activité régulièrement
- Mettez à jour le système régulièrement

## 🔧 Administration Système

### Commandes Utiles

```bash
# Statut de l'application
sudo -u iris pm2 status

# Logs en temps réel
sudo -u iris pm2 logs noskills-iris

# Redémarrer l'application
sudo -u iris pm2 restart noskills-iris

# Statut Nginx
systemctl status nginx

# Logs Nginx
tail -f /var/log/noskills-iris/nginx_access.log

# Statut base de données
ls -la /opt/noskills-iris/data/

# Sauvegarde base de données
cp /opt/noskills-iris/data/iris.db /backup/iris_$(date +%Y%m%d).db
```

### Mise à Jour

```bash
# Mise à jour automatique
sudo ./deploy.sh update

# Ou manuellement
cd /opt/noskills-iris
sudo -u iris git pull
sudo -u iris npm install --production
sudo -u iris npm run build
sudo -u iris pm2 restart noskills-iris
```

## 📊 API Reference

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/profile` - Profil utilisateur
- `POST /api/auth/logout` - Déconnexion

### Enquêtes
- `POST /api/investigations` - Créer une enquête
- `GET /api/investigations` - Lister les enquêtes
- `GET /api/investigations/:id` - Détails d'une enquête
- `PATCH /api/investigations/:id/status` - Modifier le statut

### Analyses OSINT
- `POST /api/osint/analyze` - Lancer une analyse
- `GET /api/osint/analysis/:id` - Résultats d'analyse

### Rapports
- `POST /api/investigations/:id/reports` - Générer un rapport
- `GET /api/reports/:id/download` - Télécharger un rapport

### Administration (Propriétaire uniquement)
- `POST /api/users` - Créer un utilisateur
- `GET /api/users` - Lister les utilisateurs
- `DELETE /api/users/:id` - Supprimer un utilisateur

## 🎨 Thèmes Disponibles

- **Sombre** (par défaut) : Optimisé pour les sessions longues
- **Clair** : Pour les environnements lumineux
- **Militaire** : Thème tactique vert

## 📞 Support

### Résolution de Problèmes

**Application ne démarre pas**
```bash
# Vérifier les logs
sudo -u iris pm2 logs noskills-iris
# Vérifier la base de données
ls -la /opt/noskills-iris/data/
```

**Erreur SSL**
```bash
# Renouveler le certificat
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

**Base de données corrompue**
```bash
# Restaurer depuis la sauvegarde
sudo -u iris cp /backup/iris_YYYYMMDD.db /opt/noskills-iris/data/iris.db
sudo -u iris pm2 restart noskills-iris
```

### Contact
- **Documentation** : Consultez ce README
- **Issues** : Créez une issue sur le repository
- **Sécurité** : Contactez directement l'équipe

## 📜 Licence et Conformité

### Utilisation Légale
- ✅ Investigation de cybersécurité
- ✅ Enquêtes judiciaires autorisées
- ✅ Recherche académique
- ✅ Audit de sécurité autorisé

### Restrictions
- ❌ Harcèlement ou surveillance illégale
- ❌ Collecte de données personnelles non autorisée
- ❌ Activités illégales

### Conformité RGPD
- Données chiffrées et anonymisées
- Droit à l'effacement intégré
- Audit trail complet
- Consentement explicite requis

---

**NoSkills Iris v1.0** - Développé par l'équipe NoSkills
© 2024 NoSkills - Tous droits réservés

*Plateforme OSINT professionnelle pour investigators et experts en cybersécurité*
