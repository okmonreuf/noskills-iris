# NoSkills OSINT - Plateforme d'Intelligence Open Source

## 🔍 Description

NoSkills OSINT est une plateforme complète d'investigation en ligne (OSINT) développée en français, conçue pour les professionnels de la cybersécurité, enquêteurs, et chercheurs. Cette application offre une suite d'outils intégrés pour mener des enquêtes approfondies sur Discord, les réseaux sociaux, et l'internet en général.

## ✨ Fonctionnalités Principales

### 🧠 Intelligence d'Enquête Assistée
- Analyse automatisée des cibles (noms, pseudos, IP, emails, identifiants Discord)
- Suggestions d'actions basées sur l'IA
- Proposition d'hypothèses et déclenchement automatique des outils adaptés

### 🔎 Outils OSINT Intégrés

#### Discord OSINT
- Recherche d'utilisateur par pseudo ou ID
- Capture automatique de messages Discord
- Historique des avatars et pseudos
- Analyse de serveurs Discord

#### Recherche Email
- Intégration HaveIBeenPwned
- Recherche Hunter.io
- Vérification de domaine
- Validation SMTP

#### Analyse IP
- Géolocalisation précise
- Recherche Whois
- Scan de ports
- Historique et réputation

#### Réseaux Sociaux
- Recherche multi-plateforme (Sherlock)
- Twitter/X OSINT
- Instagram, TikTok, Telegram
- Scraping de profils publics

#### Recherche d'Images
- Recherche inversée (Google, Yandex, TinEye)
- Analyse EXIF des métadonnées

#### Analyse de Fichiers
- Scanner VirusTotal intégré
- Génération de hash MD5/SHA256
- Extraction de métadonnées
- Signature numérique

### 📁 Gestion Manuelle des Preuves
- Création de dossiers d'enquête personnalisés
- Ajout manuel de preuves et captures
- Horodatage automatique
- Chiffrement AES-256 des données sensibles

### 🧰 Interface Utilisateur Moderne
- **Thèmes**: Sombre (par défaut), Clair, Militaire
- **Navigation par onglets**:
  - Tableau de Bord: Vue d'ensemble des enquêtes
  - Nouvelle Enquête: Formulaire de création
  - Outils OSINT: Accès direct aux outils
  - Résultats: Consultation des preuves
  - Configuration: Paramètres et sécurité

### 🔐 Sécurité et Confidentialité
- Stockage local chiffré AES-256
- Protection par mot de passe
- Mode anonyme (Tor/VPN)
- Journal d'audit intégré
- Signature numérique des rapports

### 🌐 Intégrations
- Webhook Discord pour notifications
- API VirusTotal
- API Hunter.io
- Intégration avec les principaux services OSINT

## 🚀 Installation et Déploiement

### Prérequis
- Node.js 18+
- npm ou yarn

### Installation Locale
```bash
git clone [votre-repo]
cd nosills-osint
npm install
npm run dev
```

### Déploiement VPS (no-skills.com)
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t noskills-osint .
docker run -p 8080:8080 noskills-osint
```

## 📊 Utilisation

### Démarrer une Nouvelle Enquête
1. Cliquez sur "Nouvelle Enquête"
2. Remplissez les informations de base:
   - Nom de l'enquête
   - Type de cible (Discord, Email, IP, etc.)
   - Valeur de la cible
   - Objectif de l'enquête
3. Sélectionnez les outils à activer
4. Cliquez sur "Démarrer l'Enquête"

### Utiliser les Outils OSINT
1. Accédez à l'onglet "Outils OSINT"
2. Utilisez l'analyse rapide ou sélectionnez un outil spécifique
3. Entrez votre cible et lancez l'analyse
4. Consultez les résultats dans l'onglet "Résultats"

### Gestion des Preuves
- Toutes les preuves sont automatiquement ajoutées au dossier de l'enquête
- Captures d'écran horodatées
- Métadonnées préservées
- Export possible en PDF/HTML

## 🛠 Configuration Technique

### Structure du Projet
```
client/                 # Interface React
├── pages/             # Pages principales
├── components/ui/     # Composants UI (shadcn)
└── global.css         # Thèmes OSINT

server/                # API Express
├── routes/            # Routes API
└── index.ts           # Configuration serveur

shared/                # Types partagés
└── osint.ts           # Types OSINT
```

### API Endpoints
- `POST /api/osint/analyze` - Lancer une analyse
- `GET /api/osint/analysis/:id` - Récupérer les résultats
- `GET /api/osint/investigations` - Lister les enquêtes

### Personnalisation des Thèmes
Les thèmes sont configurés dans `client/global.css`:
- **Sombre**: Thème par défaut optimisé pour les enquêtes
- **Clair**: Version claire pour environnements lumineux
- **Militaire**: Thème vert militaire pour opérations tactiques

## 🔧 Configuration Avancée

### Variables d'Environnement
```env
VIRUSTOTAL_API_KEY=votre_clé_vt
HUNTER_IO_API_KEY=votre_clé_hunter
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
ENCRYPTION_KEY=votre_clé_chiffrement
```

### Modules Externes
Le système supporte l'ajout de modules Python externes:
- Sherlock
- Holehe
- Socialscan
- Modules personnalisés

## 📈 Statistiques et Monitoring

Le tableau de bord affiche en temps réel:
- Nombre d'enquêtes actives
- Preuves collectées (24h)
- Outils disponibles
- Menaces détectées

## 🔒 Sécurité

### Bonnes Pratiques
- Utilisez des mots de passe forts
- Activez le chiffrement AES-256
- Configurez le mode anonyme si nécessaire
- Vérifiez régulièrement les journaux d'audit

### Conformité Légale
- Respectez les lois locales sur la collecte de données
- Obtenez les autorisations nécessaires avant investigation
- Documentez toutes les actions pour usage judiciaire

## 🆘 Support et Contribution

Pour toute question ou contribution:
- Créez une issue sur le repository
- Contactez l'équipe no-skills.com
- Consultez la documentation technique

## 📄 Licence

Développé par l'équipe NoSkills pour no-skills.com
Tous droits réservés - Usage professionnel uniquement

---

**Avertissement**: Cet outil est destiné à un usage légal et éthique uniquement. Les utilisateurs sont responsables de respecter les lois et régulations applicables dans leur juridiction.
