# 🤖 Correcteur Automatique d'Erreurs - NoSkills Iris

## Vue d'ensemble

Le script de déploiement NoSkills Iris intègre maintenant un **correcteur automatique d'erreurs intelligent** qui :
- ✨ **Corrige automatiquement** les erreurs sans intervention humaine
- 🧠 **Analyse le code source** pour identifier les causes profondes
- 🔧 **Applique les corrections** et **continue le déploiement**
- 🛡️ **Surveille en temps réel** et corrige les erreurs qui surviennent

## 🚀 Fonctionnalités

### ✅ Auto-Correction Intelligente
- **Analyse automatique** des erreurs avec ChatGPT-4
- **Suggestions de correction** contextuelles 
- **Application automatique** des corrections sûres
- **Retry intelligent** avec amélioration progressive

### 🔍 Diagnostic Avancé
- Détection automatique des problèmes système
- Vérification de l'espace disque et mémoire
- Contrôle des services et ports
- Logs détaillés pour debug

### 🛡️ Sécurité
- Validation des corrections avant application
- Limite du nombre de tentatives (3 max)
- Logs d'audit complets
- Aucune exécution de commandes dangereuses

## ⚙️ Configuration

### 1. Clé API ChatGPT (Optionnel)

```bash
# Option 1: Configuration automatique
./setup-chatgpt.sh

# Option 2: Configuration manuelle
export CHATGPT_API_KEY='sk-your-api-key-here'

# Option 3: Configuration temporaire
CHATGPT_API_KEY='sk-your-key' ./deploy.sh
```

### 2. Variables d'environnement

```bash
# Activer/désactiver l'auto-correction
AUTO_FIX_ENABLED=true

# Nombre maximum de tentatives
MAX_FIX_ATTEMPTS=3

# Fichier de logs d'erreurs
ERROR_LOG_FILE="/tmp/noskills-deployment-errors.log"
```

## 🎯 Utilisation

### Déploiement avec Auto-Correction

```bash
# Déploiement complet avec correcteur automatique
sudo ./deploy.sh

# Ou utiliser le menu interactif
sudo ./deploy.sh
# Choisir option 1: "Déploiement complet avec auto-correction"
```

### Diagnostic Automatique

```bash
# Diagnostic du système sans déploiement
sudo ./deploy.sh
# Choisir option 5: "Diagnostic automatique du système"
```

## 🔧 Fonctionnement

### 1. Détection d'Erreur
```
[1/3] Installation de Node.js
❌ Échec: Installation de Node.js
🤖 Analyse de l'erreur avec ChatGPT...
```

### 2. Analyse ChatGPT
```
🔍 Analyse: Conflit de version Node.js avec repository existant
💡 Solution: Nettoyer le cache apt et forcer la réinstallation
🎯 Confiance: high
```

### 3. Application de la Correction
```
🔧 Application de la correction automatique...
Exécution: apt clean && apt update
Exécution: apt install --reinstall nodejs
✅ Correction appliquée avec succès
🔄 Nouvelle tentative après correction...
```

### 4. Retry Intelligent
```
[2/3] Installation de Node.js
✅ Succès: Installation de Node.js
```

## 📊 Types d'Erreurs Supportées

### Système
- ✅ Conflits de paquets APT/YUM
- ✅ Problèmes de permissions
- ✅ Espace disque insuffisant
- ✅ Services non démarrés

### Application
- ✅ Erreurs de compilation NPM
- ✅ Dépendances manquantes
- ✅ Problèmes de ports
- ✅ Erreurs de configuration

### Réseau
- ✅ Timeouts de téléchargement
- ✅ Proxies et firewalls
- ✅ DNS et connectivité
- ✅ Certificats SSL

## 📋 Logs et Debug

### Fichiers de Logs
```bash
# Logs d'erreurs détaillés
/tmp/noskills-deployment-errors.log

# Logs de l'application
/var/log/noskills-iris/

# Logs système
journalctl -u nginx -f
```

### Commandes de Debug
```bash
# Afficher les logs d'erreurs
cat /tmp/noskills-deployment-errors.log

# Diagnostic complet
sudo ./deploy.sh
# Choisir option 5

# Nettoyage des fichiers temporaires
sudo ./deploy.sh
# Choisir option 7
```

## 🛠️ Options Avancées

### Mode Sans Auto-Correction
```bash
# Désactiver temporairement
AUTO_FIX_ENABLED=false ./deploy.sh

# Ou modifier dans le script
AUTO_FIX_ENABLED=false
```

### Personnalisation des Tentatives
```bash
# Modifier le nombre de tentatives
MAX_FIX_ATTEMPTS=5 ./deploy.sh
```

### Debug Verbose
```bash
# Activer les logs détaillés
set -x
./deploy.sh
```

## 💡 Conseils d'Utilisation

### ✅ Bonnes Pratiques
- Toujours faire une sauvegarde avant déploiement
- Tester d'abord sur un environnement de dev
- Vérifier les logs après correction automatique
- Garder la clé API sécurisée

### ⚠️ Limitations
- Nécessite une connexion internet pour ChatGPT
- Limité par les quotas de l'API OpenAI
- Corrections complexes peuvent nécessiter intervention manuelle
- Certain problèmes système ne sont pas auto-corrigeables

## 🆘 Dépannage

### Problème: Clé API invalide
```bash
❌ Erreur: "Invalid API key"
🔧 Solution: Vérifiez votre clé sur platform.openai.com
```

### Problème: Quota API dépassé
```bash
❌ Erreur: "Rate limit exceeded"
🔧 Solution: Attendez ou upgradez votre plan OpenAI
```

### Problème: Pas de connexion internet
```bash
❌ Erreur: "Could not connect to ChatGPT"
🔧 Solution: Vérifiez votre connexion réseau
```

## 📞 Support

En cas de problème avec le correcteur automatique :

1. Vérifiez les logs détaillés
2. Désactivez temporairement l'auto-correction
3. Utilisez le diagnostic automatique
4. Consultez la documentation d'erreur générée

---

**🎯 Le correcteur automatique d'erreurs rend le déploiement NoSkills Iris plus robuste et autonome, réduisant significativement les interventions manuelles.**
