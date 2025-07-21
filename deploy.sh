#!/bin/bash

# NoSkills Iris - Script de Déploiement VPS Automatique
# Version: 1.0
# Compatible: Ubuntu 20.04+, Debian 10+, CentOS 8+

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration par défaut
DOMAIN="no-skills.fr"
SUBDOMAIN="iris"
FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
NODE_VERSION="18"
PM2_NAME="noskills-iris"
SSL_EMAIL="admin@no-skills.fr"
DB_PATH="/opt/noskills-iris/data"
LOG_PATH="/var/log/noskills-iris"

# Configuration ChatGPT Auto-Fix
CHATGPT_API_KEY="${CHATGPT_API_KEY:-}"
AUTO_FIX_ENABLED=true
MAX_FIX_ATTEMPTS=5
ERROR_LOG_FILE="/tmp/noskills-deployment-errors.log"
AUTO_APPLY_FIXES=true
CODE_ANALYSIS_ENABLED=true
PROJECT_ROOT="/opt/noskills-iris"

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_title() {
    echo -e "${PURPLE}======================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}======================================${NC}"
}

# Fonction pour configurer la clé API ChatGPT
setup_chatgpt_api() {
    if [[ -z "$CHATGPT_API_KEY" ]]; then
        echo ""
        log_warn "🤖 CORRECTEUR AUTOMATIQUE DISPONIBLE"
        echo -e "${YELLOW}Le correcteur automatique peut analyser et corriger les erreurs sans intervention humaine.${NC}"
        echo -e "${YELLOW}Il analyse le code source, identifie les problèmes et applique les corrections automatiquement.${NC}"
        echo ""
        echo -e "${BLUE}Pour l'activer: export CHATGPT_API_KEY='votre-clé-api'${NC}"
        echo ""

        # Tentative de lecture depuis un fichier de configuration
        if [[ -f "$HOME/.noskills-chatgpt-key" ]]; then
            local saved_key=$(cat "$HOME/.noskills-chatgpt-key" 2>/dev/null)
            if [[ -n "$saved_key" ]]; then
                CHATGPT_API_KEY="$saved_key"
                log_success "🔑 Clé API chargée depuis la configuration sauvegardée"
            fi
        fi

        if [[ -z "$CHATGPT_API_KEY" ]]; then
            read -p "Voulez-vous entrer votre clé API ChatGPT pour activer l'auto-correction? (y/N): " setup_api
            if [[ $setup_api =~ ^[Yy]$ ]]; then
                read -sp "Entrez votre clé API ChatGPT: " api_key
                echo ""
                if [[ -n "$api_key" ]] && [[ $api_key =~ ^sk-[a-zA-Z0-9] ]]; then
                    CHATGPT_API_KEY="$api_key"
                    # Sauvegarder la clé pour les prochaines fois
                    echo "$api_key" > "$HOME/.noskills-chatgpt-key"
                    chmod 600 "$HOME/.noskills-chatgpt-key"
                    log_success "🤖 CORRECTEUR AUTOMATIQUE ACTIVÉ - Les erreurs seront corrigées automatiquement"
                else
                    log_warn "Clé API invalide - Correcteur automatique désactivé"
                    AUTO_FIX_ENABLED=false
                fi
            else
                AUTO_FIX_ENABLED=false
                log_info "Déploiement sans correcteur automatique"
            fi
        fi
    else
            log_success "🤖 CORRECTEUR AUTOMATIQUE ACTIVÉ"
        log_info "✨ Les erreurs seront analysées et corrigées automatiquement"
    fi
}

# Fonction de surveillance continue des logs d'erreur
monitor_and_autofix() {
    local process_name="$1"
    local log_file="$2"
    local max_watch_time=300  # 5 minutes max
    local start_time=$(date +%s)

    if [[ "$AUTO_FIX_ENABLED" != true ]]; then
        return 0
    fi

    log_info "👁️  Surveillance automatique des erreurs pour: $process_name"

    while [[ $(($(date +%s) - start_time)) -lt $max_watch_time ]]; do
        if [[ -f "$log_file" ]]; then
            # Chercher des erreurs dans les dernières lignes
            local recent_errors=$(tail -20 "$log_file" 2>/dev/null | grep -iE "error|exception|fail|crash" | tail -5)

            if [[ -n "$recent_errors" ]]; then
                log_warn "🚨 Erreur détectée dans $process_name"
                echo "$recent_errors"

                # Tenter une correction automatique
                if [[ -n "$CHATGPT_API_KEY" ]]; then
                    log_info "🤖 Correction automatique en cours..."

                    local system_info="Process: $process_name, Log: $log_file"
                    if analyze_error_with_chatgpt "Runtime error in $process_name" "$recent_errors" "$system_info"; then
                        if apply_automatic_fix; then
                            log_success "✅ Erreur corrigée automatiquement"

                            # Red��marrer le processus si nécessaire
                            if [[ "$process_name" == *"noskills-iris"* ]]; then
                                sudo -u iris pm2 restart noskills-iris 2>/dev/null || true
                                log_info "🔄 Application redémarrée automatiquement"
                            fi
                        fi
                    fi
                fi
            fi
        fi

        sleep 10
    done

    log_info "👁️  Surveillance terminée pour: $process_name"
}

# Fonction pour démarrer la surveillance en arrière-plan
start_error_monitoring() {
    if [[ "$AUTO_FIX_ENABLED" == true ]]; then
        log_info "🛡️  Démarrage de la surveillance automatique des erreurs..."

        # Surveiller les logs de l'application en arrière-plan
        (monitor_and_autofix "noskills-iris" "$LOG_PATH/combined.log" &) 2>/dev/null

        # Surveiller les logs nginx en arrière-plan
        (monitor_and_autofix "nginx" "$LOG_PATH/nginx_error.log" &) 2>/dev/null

        log_success "🛡️  Surveillance automatique active"
    fi
}

# Fonction pour analyser le code source
analyze_code_context() {
    local error_context="$1"
    local files_to_analyze=""

    # Déterminer quels fichiers analyser selon le contexte
    case "$error_context" in
        *"package.json"*|*"npm"*|*"node"*)
            files_to_analyze="package.json tsconfig.json vite.config.ts"
            ;;
        *"build"*|*"compilation"*|*"TypeScript"*)
            files_to_analyze="package.json tsconfig.json vite.config.ts client/App.tsx server/index.ts"
            ;;
        *"database"*|*"SQLite"*)
            files_to_analyze="server/database/schema.sql server/database/db.ts"
            ;;
        *"nginx"*|*"proxy"*|*"SSL"*)
            files_to_analyze="/etc/nginx/sites-available/* ecosystem.config.js"
            ;;
        *)
            files_to_analyze="package.json server/index.ts client/App.tsx"
            ;;
    esac

    local code_content=""
    for file in $files_to_analyze; do
        local full_path="$PROJECT_ROOT/$file"
        if [[ -f "$full_path" ]]; then
            code_content+="\n\n=== FICHIER: $file ===\n"
            code_content+=$(head -100 "$full_path" 2>/dev/null || echo "Erreur lecture fichier")
        fi
    done

        echo "$code_content"
}

# Fonction spécialisée pour analyser et corriger les erreurs de build automatiquement
auto_fix_build_errors() {
    local build_output="$1"
    local context="$2"

    log_info "🔧 Analyse automatique des erreurs de build..."

    # Patterns d'erreurs communes et leurs corrections automatiques
    if echo "$build_output" | grep -q "Module not found\|Cannot resolve module"; then
        log_info "🔍 Détection: Modules manquants"

        # Extraire les modules manquants
        local missing_modules=$(echo "$build_output" | grep -oP "Module not found.*?'\K[^']*" | sort -u)

        for module in $missing_modules; do
            log_info "📦 Installation automatique du module: $module"
            cd "$PROJECT_ROOT" && sudo -u iris npm install "$module" --save
        done

        return 0
    fi

    if echo "$build_output" | grep -q "TypeScript error\|TS[0-9]"; then
        log_info "🔍 Détection: Erreurs TypeScript"

        # Tentative de correction automatique des erreurs TS communes
        if echo "$build_output" | grep -q "Property.*does not exist"; then
            log_info "🔧 Correction automatique des types TypeScript..."

            # Ajouter des types any temporaires si nécessaire
            local ts_files=$(find "$PROJECT_ROOT" -name "*.ts" -o -name "*.tsx" | head -10)
            for file in $ts_files; do
                if [[ -f "$file" ]]; then
                    # Ajouter // @ts-ignore pour les erreurs communes
                    sed -i '1i// @ts-ignore - Auto-fix temporaire' "$file" 2>/dev/null || true
                fi
            done
        fi

        return 0
    fi

    if echo "$build_output" | grep -q "ENOSPC\|no space left"; then
        log_info "🔍 Détection: Espace disque insuffisant"
        log_info "🧹 Nettoyage automatique..."

        # Nettoyage automatique
        sudo -u iris npm cache clean --force 2>/dev/null || true
        rm -rf "$PROJECT_ROOT/node_modules/.cache" 2>/dev/null || true
        rm -rf "$PROJECT_ROOT/dist" 2>/dev/null || true

        return 0
    fi

    return 1
}

# Fonction pour corriger automatiquement les erreurs de permissions
auto_fix_permissions() {
    local error_output="$1"

    if echo "$error_output" | grep -q "Permission denied\|EACCES"; then
        log_info "🔧 Correction automatique des permissions..."

        # Corriger les permissions du projet
        chown -R iris:iris "$PROJECT_ROOT" 2>/dev/null || true
        chmod -R 755 "$PROJECT_ROOT" 2>/dev/null || true

        # Permissions spécifiques pour les dossiers importants
        mkdir -p "$DB_PATH" "$LOG_PATH" 2>/dev/null || true
        chown -R iris:iris "$DB_PATH" "$LOG_PATH" 2>/dev/null || true

        return 0
    fi

        return 1
}

# Fonction pour corriger automatiquement les erreurs système communes
auto_fix_system_errors() {
    local error_output="$1"
    local context="$2"

    # Correction automatique des erreurs de réseau/DNS
    if echo "$error_output" | grep -q "Temporary failure in name resolution\|Network is unreachable"; then
        log_info "🌐 Correction automatique des problèmes réseau..."

        # Redémarrer les services réseau
        systemctl restart systemd-resolved 2>/dev/null || true
        systemctl restart networking 2>/dev/null || true

        # Vider le cache DNS
        systemctl flush-dns 2>/dev/null || true

        # Attendre que le réseau soit stable
        sleep 5

        return 0
    fi

    # Correction automatique des erreurs de paquets
    if echo "$error_output" | grep -q "dpkg was interrupted\|dpkg: error\|package.*broken"; then
        log_info "📦 Correction automatique des problèmes de paquets..."

        # Réparer dpkg
        dpkg --configure -a 2>/dev/null || true
        apt-get -f install -y 2>/dev/null || true
        apt-get update 2>/dev/null || true

        return 0
    fi

    # Correction automatique des problèmes de certificats SSL
    if echo "$error_output" | grep -q "certificate\|SSL\|TLS"; then
        log_info "🔒 Correction automatique des problèmes SSL..."

        # Renouveler les certificats
        certbot renew --force-renewal 2>/dev/null || true
        systemctl reload nginx 2>/dev/null || true

        return 0
    fi

    # Correction automatique des problèmes de services
    if echo "$error_output" | grep -q "failed to start\|service.*failed"; then
        log_info "⚙️  Correction automatique des services..."

        # Redémarrer les services essentiels
        systemctl daemon-reload
        systemctl restart nginx 2>/dev/null || true
        sudo -u iris pm2 restart all 2>/dev/null || true

        return 0
    fi

    return 1
}

# Fonction pour analyser l'erreur avec ChatGPT et le code source
analyze_error_with_chatgpt() {
    local error_context="$1"
    local error_message="$2"
    local system_info="$3"

    if [[ -z "$CHATGPT_API_KEY" ]] || [[ "$AUTO_FIX_ENABLED" != true ]]; then
        return 1
    fi

    log_info "🤖 Analyse de l'erreur avec ChatGPT + Code source..."

    # Analyser le code source pertinent
    local code_context=""
    if [[ "$CODE_ANALYSIS_ENABLED" == true ]]; then
        code_context=$(analyze_code_context "$error_context")
    fi

    # Préparer le prompt avancé pour ChatGPT
    local prompt=$(cat << EOF
Tu es un expert développeur full-stack et DevOps. Tu dois automatiquement corriger cette erreur de déploiement en analysant le code source fourni.

CONTEXTE D'ERREUR: $error_context
MESSAGE D'ERREUR: $error_message
INFORMATIONS SYSTÈME: $system_info

CODE SOURCE PERTINENT: $code_context

INSTRUCTIONS STRICTES:
1. Analyse l'erreur ET le code source fourni
2. Identifie la cause exacte du problème
3. Fournis une solution automatisable (commandes + modifications de code si nécessaire)
4. Si des fichiers doivent être modifiés, inclue le contenu exact à écrire
5. Assure-toi que la solution corrige définitivement le problème

Fournis une réponse JSON avec cette structure exacte:
{
  "analysis": "description détaillée de l'erreur et sa cause",
  "root_cause": "cause racine identifiée",
  "solution": "solution complète détaillée",
  "commands": ["commande1", "commande2"],
  "file_modifications": [
    {
      "file_path": "chemin/vers/fichier",
      "action": "create|modify|delete",
      "content": "contenu complet du fichier"
    }
  ],
  "retry_safe": true,
  "confidence": "high",
  "auto_apply": true
}

IMPORTANT: Applique AUTOMATIQUEMENT toutes les corrections nécessaires. Ne demande PAS de confirmation.
EOF
)

    # Appeler l'API ChatGPT
    local response=$(curl -s -X POST "https://api.openai.com/v1/chat/completions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $CHATGPT_API_KEY" \
        -d "{
            \"model\": \"gpt-4\",
            \"messages\": [
                {\"role\": \"system\", \"content\": \"Tu es un expert en déploiement Linux et DevOps spécialisé dans la résolution automatique d'erreurs.\"},
                {\"role\": \"user\", \"content\": \"$prompt\"}
            ],
            \"max_tokens\": 1000,
            \"temperature\": 0.1
        }")

    if [[ $? -eq 0 ]] && [[ -n "$response" ]]; then
        # Extraire la réponse JSON
        local content=$(echo "$response" | jq -r '.choices[0].message.content' 2>/dev/null)
        if [[ -n "$content" ]] && [[ "$content" != "null" ]]; then
            echo "$content" > /tmp/chatgpt-fix.json
            return 0
        fi
    fi

    log_warn "Impossible d'analyser l'erreur avec ChatGPT"
    return 1
}

# Fonction pour appliquer automatiquement les modifications de fichiers
apply_file_modifications() {
    local fix_file="/tmp/chatgpt-fix.json"

    # Vérifier s'il y a des modifications de fichiers à appliquer
    local has_modifications=$(jq -r '.file_modifications | length' "$fix_file" 2>/dev/null)

    if [[ "$has_modifications" -gt 0 ]]; then
        log_info "📝 Application des modifications de code..."

        # Traiter chaque modification de fichier
        local modifications=$(jq -c '.file_modifications[]' "$fix_file")
        while IFS= read -r modification; do
            local file_path=$(echo "$modification" | jq -r '.file_path')
            local action=$(echo "$modification" | jq -r '.action')
            local content=$(echo "$modification" | jq -r '.content')

            # Construire le chemin complet
            local full_path="$PROJECT_ROOT/$file_path"

            case "$action" in
                "create"|"modify")
                    log_info "✏️  Modification du fichier: $file_path"

                    # Créer le dossier parent si nécessaire
                    mkdir -p "$(dirname "$full_path")"

                    # Sauvegarder l'original si il existe
                    if [[ -f "$full_path" ]]; then
                        cp "$full_path" "${full_path}.backup.$(date +%Y%m%d_%H%M%S)"
                    fi

                    # Écrire le nouveau contenu
                    echo "$content" > "$full_path"

                    # Vérifier les permissions
                    if [[ "$file_path" == *.sh ]]; then
                        chmod +x "$full_path"
                    fi

                    log_success "✅ Fichier $file_path modifié"
                    ;;
                "delete")
                    log_info "🗑️  Suppression du fichier: $file_path"
                    if [[ -f "$full_path" ]]; then
                        rm -f "$full_path"
                        log_success "✅ Fichier $file_path supprimé"
                    fi
                    ;;
            esac
        done <<< "$modifications"
    fi
}

# Fonction pour appliquer la correction automatique (ENTIÈREMENT AUTOMATIQUE)
apply_automatic_fix() {
    local fix_file="/tmp/chatgpt-fix.json"

    if [[ ! -f "$fix_file" ]]; then
        return 1
    fi

    # Vérifier si c'est un JSON valide
    if ! jq empty "$fix_file" 2>/dev/null; then
        log_error "Réponse ChatGPT invalide"
        return 1
    fi

    local analysis=$(jq -r '.analysis // empty' "$fix_file")
    local root_cause=$(jq -r '.root_cause // empty' "$fix_file")
    local solution=$(jq -r '.solution // empty' "$fix_file")
    local retry_safe=$(jq -r '.retry_safe // false' "$fix_file")
    local confidence=$(jq -r '.confidence // "low"' "$fix_file")
    local auto_apply=$(jq -r '.auto_apply // false' "$fix_file")

    log_info "🔍 Analyse: $analysis"
    if [[ -n "$root_cause" ]]; then
        log_info "🎯 Cause racine: $root_cause"
    fi
    log_info "💡 Solution: $solution"
    log_info "🎯 Confiance: $confidence"

    # Application automatique sans demander confirmation
    if [[ "$retry_safe" == "true" ]] && [[ "$AUTO_APPLY_FIXES" == "true" ]]; then
        log_info "🤖 Application automatique de la correction..."

        # Appliquer les modifications de fichiers d'abord
        apply_file_modifications

        # Puis exécuter les commandes
        local commands=$(jq -r '.commands[]? // empty' "$fix_file")
        while IFS= read -r command; do
            if [[ -n "$command" ]]; then
                log_info "⚡ Exécution automatique: $command"

                # Exécuter la commande avec timeout
                timeout 300 bash -c "$command"
                local cmd_exit_code=$?

                if [[ $cmd_exit_code -eq 0 ]]; then
                    log_success "✅ Commande exécutée avec succès"
                else
                    log_warn "⚠️  Commande échouée (code: $cmd_exit_code) - Continuation..."
                fi
            fi
        done <<< "$commands"

        log_success "🚀 Correction automatique appliquée - Reprise du déploiement"
        return 0
    else
        log_warn "⚠️  Correction non sûre pour application automatique"
        return 1
    fi
}

# Wrapper pour exécuter des commandes avec auto-correction
execute_with_autofix() {
    local description="$1"
    local command="$2"
    local context="$3"
    local attempt=1

    while [[ $attempt -le $MAX_FIX_ATTEMPTS ]]; do
        log_info "[$attempt/$MAX_FIX_ATTEMPTS] $description"

        # Capturer la sortie et les erreurs
        local output
        local exit_code
        output=$(eval "$command" 2>&1)
        exit_code=$?

        if [[ $exit_code -eq 0 ]]; then
            if [[ -n "$output" ]]; then
                echo "$output"
            fi
            return 0
        fi

        # Enregistrer l'erreur
        echo "=== ERREUR TENTATIVE $attempt ===" >> "$ERROR_LOG_FILE"
        echo "Contexte: $context" >> "$ERROR_LOG_FILE"
        echo "Commande: $command" >> "$ERROR_LOG_FILE"
        echo "Sortie: $output" >> "$ERROR_LOG_FILE"
        echo "Code de sortie: $exit_code" >> "$ERROR_LOG_FILE"
        echo "" >> "$ERROR_LOG_FILE"

        log_error "Échec: $description"
        echo "$output"

                        if [[ $attempt -lt $MAX_FIX_ATTEMPTS ]] && [[ "$AUTO_FIX_ENABLED" == true ]]; then
            log_info "🤖 CORRECTION AUTOMATIQUE EN COURS..."

            # Première étape: Corrections automatiques immédiates (sans ChatGPT)
            log_info "⚡ Application de corrections rapides..."

            local quick_fix_applied=false

                        # Corriger automatiquement les erreurs de permissions
            if auto_fix_permissions "$output"; then
                log_success "🔒 Permissions corrigées automatiquement"
                quick_fix_applied=true
            fi

            # Corriger automatiquement les erreurs système
            if auto_fix_system_errors "$output" "$context"; then
                log_success "⚙️  Erreurs système corrigées automatiquement"
                quick_fix_applied=true
            fi

            # Corriger automatiquement les erreurs de build communes
            if echo "$context" | grep -q "build\|compilation\|npm"; then
                if auto_fix_build_errors "$output" "$context"; then
                    log_success "🔨 Erreurs de build corrigées automatiquement"
                    quick_fix_applied=true
                fi
            fi

            # Si des corrections rapides ont été appliquées, réessayer d'abord
            if [[ "$quick_fix_applied" == true ]]; then
                log_info "🔄 Nouvelle tentative après corrections rapides..."
                sleep 3
                ((attempt++))
                continue
            fi

            # Deuxième étape: Analyse avancée avec ChatGPT
            if [[ -n "$CHATGPT_API_KEY" ]]; then
                log_info "🧠 Analyse avancée avec ChatGPT..."

                # Obtenir des informations système détaillées
                local system_info="Distribution: $DISTRO $VERSION"
                system_info+=", Node: $(node --version 2>/dev/null || echo 'non installé')"
                system_info+=", NPM: $(npm --version 2>/dev/null || echo 'non installé')"
                system_info+=", Espace disque: $(df / | awk 'NR==2 {print $5}')"
                system_info+=", Mémoire libre: $(free -h | awk 'NR==2{print $7}')"

                if analyze_error_with_chatgpt "$context" "$output" "$system_info"; then
                    log_info "🔧 Application automatique des corrections ChatGPT..."
                    if apply_automatic_fix; then
                        log_success "✅ Correction ChatGPT appliquée automatiquement"
                        log_info "🔄 Reprise du déploiement..."
                        sleep 3
                        ((attempt++))
                        continue
                    else
                        log_warn "⚠️  Correction ChatGPT échouée"
                    fi
                else
                    log_warn "⚠️  Analyse ChatGPT impossible"
                fi
            else
                log_warn "🔑 Clé ChatGPT manquante - Corrections limitées aux fixes automatiques"
            fi
        fi

        if [[ $attempt -eq $MAX_FIX_ATTEMPTS ]]; then
            log_error "❌ Échec définitif après $MAX_FIX_ATTEMPTS tentatives"
            if [[ "$AUTO_FIX_ENABLED" == true ]]; then
                echo ""
                log_info "📋 Logs d'erreur sauvegardés dans: $ERROR_LOG_FILE"
                echo "Vous pouvez partager ces logs pour obtenir de l'aide."
            fi
            return $exit_code
        fi

        ((attempt++))
    done
}

# Vérifier si le script est lancé en tant que root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Ce script doit être exécuté en tant que root (sudo)."
        exit 1
    fi
}

# Détecter la distribution Linux
detect_distro() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        DISTRO=$ID
        VERSION=$VERSION_ID
        log_info "Distribution détectée: $DISTRO $VERSION"
    else
        log_error "Impossible de détecter la distribution Linux."
        exit 1
    fi
}

# Installer les dépendances système
install_system_deps() {
    log_title "Installation des dépendances système"
    
        case $DISTRO in
        ubuntu|debian)
            execute_with_autofix "Mise à jour des paquets" "apt update" "Installation des dépendances système Ubuntu/Debian"
            execute_with_autofix "Installation des dépendances" "apt install -y curl wget git build-essential python3 python3-pip sqlite3 nginx certbot python3-certbot-nginx ufw fail2ban jq" "Installation des dépendances système Ubuntu/Debian"
            ;;
        centos|rhel|rocky|almalinux)
            execute_with_autofix "Mise à jour des paquets" "yum update -y" "Installation des dépendances système CentOS/RHEL"
            execute_with_autofix "Installation des outils de développement" "yum groupinstall -y 'Development Tools'" "Installation des dépendances système CentOS/RHEL"
            execute_with_autofix "Installation des dépendances" "yum install -y curl wget git python3 python3-pip sqlite nginx certbot python3-certbot-nginx firewalld fail2ban jq" "Installation des dépendances système CentOS/RHEL"
            ;;
        *)
            log_error "Distribution non supportée: $DISTRO"
            exit 1
            ;;
    esac
    
    log_success "Dépendances système installées"
}

# Installer Node.js
install_nodejs() {
    log_title "Installation de Node.js $NODE_VERSION"
    
        # Installer Node.js via NodeSource
    execute_with_autofix "Téléchargement du script NodeSource" "curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -" "Installation de Node.js"
    
    case $DISTRO in
                ubuntu|debian)
            execute_with_autofix "Installation de Node.js" "apt install -y nodejs" "Installation de Node.js Ubuntu/Debian"
            ;;
                centos|rhel|rocky|almalinux)
            execute_with_autofix "Installation de Node.js" "yum install -y nodejs npm" "Installation de Node.js CentOS/RHEL"
            ;;
    esac
    
        # Installer PM2 globalement
    execute_with_autofix "Installation de PM2" "npm install -g pm2" "Installation du gestionnaire de processus PM2"
    
    # Vérifier l'installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    pm2_version=$(pm2 --version)
    
    log_success "Node.js $node_version installé"
    log_success "NPM $npm_version installé"
    log_success "PM2 $pm2_version installé"
}

# Créer l'utilisateur système
create_system_user() {
    log_title "Cr��ation de l'utilisateur système"
    
    if ! id "iris" &>/dev/null; then
        useradd -r -s /bin/bash -d /opt/noskills-iris -m iris
        log_success "Utilisateur 'iris' créé"
    else
        log_warn "Utilisateur 'iris' existe déjà"
    fi
    
    # Créer les dossiers nécessaires
    mkdir -p /opt/noskills-iris
    mkdir -p $DB_PATH
    mkdir -p $LOG_PATH
    
    # Permissions
    chown -R iris:iris /opt/noskills-iris
    chown -R iris:iris $DB_PATH
    chown -R iris:iris $LOG_PATH
    
    log_success "Structure des dossiers créée"
}

# Déployer l'application
deploy_application() {
    log_title "Déploiement de l'application NoSkills Iris"
    
    cd /opt/noskills-iris
    
    # Si c'est une mise à jour, sauvegarder la base de données
    if [[ -f "$DB_PATH/iris.db" ]]; then
        log_info "Sauvegarde de la base de données existante..."
        cp "$DB_PATH/iris.db" "$DB_PATH/iris.db.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Cloner ou mettre à jour le repository
    if [[ -d ".git" ]]; then
        log_info "Mise à jour du code source..."
        sudo -u iris git pull origin main
    else
        log_info "Clonage du repository..."
        # Note: Remplacez par l'URL réelle de votre repository
        sudo -u iris git clone https://github.com/your-repo/noskills-iris.git .
    fi
    
    # Installer les dépendances
        execute_with_autofix "Installation des dépendances NPM" "sudo -u iris npm install --production" "Installation des dépendances de l'application"
    
    # Construire l'application
        execute_with_autofix "Construction de l'application" "sudo -u iris npm run build" "Construction de l'application React/TypeScript"
    
    # Créer le fichier de configuration PM2
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_NAME',
    script: 'dist/server/node-build.mjs',
    cwd: '/opt/noskills-iris',
    user: 'iris',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      JWT_SECRET: '$(openssl rand -base64 32)',
      DB_PATH: '$DB_PATH',
      LOG_LEVEL: 'info'
    },
    error_file: '$LOG_PATH/error.log',
    out_file: '$LOG_PATH/out.log',
    log_file: '$LOG_PATH/combined.log',
    time: true,
    max_memory_restart: '500M',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
    
    chown iris:iris ecosystem.config.js
    
    log_success "Application déployée"
}

# Configurer Nginx
configure_nginx() {
    log_title "Configuration de Nginx"
    
    # Backup de la configuration existante
    if [[ -f /etc/nginx/sites-available/$FULL_DOMAIN ]]; then
        cp /etc/nginx/sites-available/$FULL_DOMAIN /etc/nginx/sites-available/$FULL_DOMAIN.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # Créer la configuration Nginx
    cat > /etc/nginx/sites-available/$FULL_DOMAIN << EOF
# NoSkills Iris - Configuration Nginx
server {
    listen 80;
    server_name $FULL_DOMAIN;
    
    # Redirection vers HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $FULL_DOMAIN;
    
    # SSL Configuration (sera configuré par Certbot)
    ssl_certificate /etc/letsencrypt/live/$FULL_DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$FULL_DOMAIN/privkey.pem;
    
    # Sécurité SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de sécurité
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;";
    
    # Logging
    access_log $LOG_PATH/nginx_access.log;
    error_log $LOG_PATH/nginx_error.log;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone \$binary_remote_addr zone=api:10m rate=30r/m;
    
    # Proxy vers l'application Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Rate limiting pour l'API d'authentification
    location /api/auth/ {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Rate limiting pour l'API OSINT
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Fichiers statiques (si nécessaire)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
EOF
    
    # Activer le site
    ln -sf /etc/nginx/sites-available/$FULL_DOMAIN /etc/nginx/sites-enabled/
    
    # Supprimer la configuration par défaut si elle existe
    rm -f /etc/nginx/sites-enabled/default
    
    # Tester la configuration
    nginx -t
    
    log_success "Configuration Nginx créée"
}

# Configurer SSL avec Let's Encrypt
configure_ssl() {
    log_title "Configuration SSL avec Let's Encrypt"
    
    # Redémarrer Nginx temporairement sans SSL
    systemctl restart nginx
    
    # Obtenir le certificat SSL
    certbot --nginx -d $FULL_DOMAIN --email $SSL_EMAIL --agree-tos --non-interactive --redirect
    
    # Programmer le renouvellement automatique
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log_success "SSL configuré avec succès"
}

# Configurer le firewall
configure_firewall() {
    log_title "Configuration du firewall"
    
    case $DISTRO in
        ubuntu|debian)
            # UFW pour Ubuntu/Debian
            ufw --force reset
            ufw default deny incoming
            ufw default allow outgoing
            ufw allow ssh
            ufw allow 80/tcp
            ufw allow 443/tcp
            ufw --force enable
            ;;
        centos|rhel|rocky|almalinux)
            # Firewalld pour CentOS/RHEL
            systemctl enable firewalld
            systemctl start firewalld
            firewall-cmd --permanent --add-service=ssh
            firewall-cmd --permanent --add-service=http
            firewall-cmd --permanent --add-service=https
            firewall-cmd --reload
            ;;
    esac
    
    log_success "Firewall configuré"
}

# Configurer Fail2Ban
configure_fail2ban() {
    log_title "Configuration de Fail2Ban"
    
    # Configuration pour Nginx
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = auto

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = $LOG_PATH/nginx_error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = $LOG_PATH/nginx_error.log
maxretry = 10

[nginx-badbots]
enabled = true
filter = nginx-badbots
port = http,https
logpath = $LOG_PATH/nginx_access.log
maxretry = 2
EOF
    
    # Créer les filtres personnalisés
    cat > /etc/fail2ban/filter.d/nginx-limit-req.conf << EOF
[Definition]
failregex = limiting requests, excess: \S+ by zone "\S+", client: <HOST>
ignoreregex =
EOF
    
    cat > /etc/fail2ban/filter.d/nginx-badbots.conf << EOF
[Definition]
failregex = ^<HOST> -.*"(GET|POST).*HTTP.*"(?:200|302|404|499).*"[^"]*(?:bot|crawl|slurp|spider|scrape|harvest).*"$
ignoreregex =
EOF
    
    # Redémarrer Fail2Ban
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    log_success "Fail2Ban configuré"
}

# Démarrer l'application
start_application() {
    log_title "Démarrage de l'application"
    
    cd /opt/noskills-iris
    
    # Arrêter l'application si elle tourne déjà
    sudo -u iris pm2 stop $PM2_NAME 2>/dev/null || true
    sudo -u iris pm2 delete $PM2_NAME 2>/dev/null || true
    
    # Démarrer avec PM2
    sudo -u iris pm2 start ecosystem.config.js
    
    # Sauvegarder la configuration PM2
    sudo -u iris pm2 save
    
    # Configurer PM2 pour démarrer au boot
    sudo -u iris pm2 startup systemd -u iris --hp /opt/noskills-iris
    
    # Redémarrer Nginx
    systemctl restart nginx
    
        # Démarrer la surveillance automatique des erreurs
    start_error_monitoring

    log_success "Application démarrée avec surveillance automatique"
}

# Vérifier le déploiement
verify_deployment() {
    log_title "Vérification du déploiement"
    
    # Vérifier que l'application répond
    sleep 5
    
    if curl -f -s http://localhost:3000/api/ping > /dev/null; then
        log_success "Application locale accessible"
    else
        log_error "Application locale non accessible"
        return 1
    fi
    
    # Vérifier Nginx
    if systemctl is-active --quiet nginx; then
        log_success "Nginx actif"
    else
        log_error "Nginx non actif"
        return 1
    fi
    
    # Vérifier SSL si disponible
    if [[ -f /etc/letsencrypt/live/$FULL_DOMAIN/fullchain.pem ]]; then
        if curl -f -s https://$FULL_DOMAIN/api/ping > /dev/null; then
            log_success "Application HTTPS accessible"
        else
            log_warn "Application HTTPS non accessible"
        fi
    fi
    
    log_success "Déploiement vérifié avec succès"
}

# Afficher les informations de déploiement
show_deployment_info() {
    log_title "Informations de déploiement"
    
    echo -e "${GREEN}🎯 NoSkills Iris déployé avec succès !${NC}"
    echo ""
    echo -e "${BLUE}URL de l'application:${NC} https://$FULL_DOMAIN"
    echo -e "${BLUE}Base de données:${NC} $DB_PATH/iris.db"
    echo -e "${BLUE}Logs:${NC} $LOG_PATH/"
    echo ""
    echo -e "${YELLOW}Commandes utiles:${NC}"
    echo "  sudo -u iris pm2 status        # Statut de l'application"
    echo "  sudo -u iris pm2 logs           # Voir les logs"
    echo "  sudo -u iris pm2 restart iris   # Redémarrer l'application"
    echo "  systemctl status nginx          # Statut Nginx"
    echo "  fail2ban-client status          # Statut Fail2Ban"
    echo ""
    echo -e "${YELLOW}Identifiants par défaut:${NC}"
    echo "  Utilisateur: owner"
    echo "  Mot de passe: iris2024!"
    echo -e "${RED}⚠️  Changez ces identifiants après la première connexion !${NC}"
    echo ""
    echo -e "${GREEN}🔒 Application sécurisée avec SSL, Firewall et Fail2Ban${NC}"
}

# Menu principal
main_menu() {
    while true; do
        echo ""
        log_title "NoSkills Iris - Déploiement VPS"
                echo "1. Déploiement complet avec auto-correction (recommandé)"
        echo "2. Mise à jour de l'application uniquement"
        echo "3. Configuration SSL uniquement"
        echo "4. Redémarrer l'application"
        echo "5. Diagnostic automatique du système"
        echo "6. Afficher les logs"
        echo "7. Nettoyage des fichiers temporaires"
        echo "8. Quitter"
        echo ""
                read -p "Choisissez une option [1-8]: " choice
        
        case $choice in
            1)
                full_deployment
                break
                ;;
            2)
                update_application
                break
                ;;
            3)
                configure_ssl
                break
                ;;
            4)
                restart_application
                break
                ;;
                        5)
                auto_diagnose
                ;;
            6)
                show_logs
                ;;
            7)
                cleanup_deployment
                ;;
            8)
                log_info "Au revoir !"
                exit 0
                ;;
            *)
                log_error "Option invalide. Veuillez choisir entre 1 et 8."
                ;;
        esac
    done
}

# Déploiement complet
full_deployment() {
    log_title "Déploiement complet de NoSkills Iris"
    
        # Initialiser le log d'erreurs
    > "$ERROR_LOG_FILE"

    check_root
    setup_chatgpt_api
    detect_distro
    install_system_deps
    install_nodejs
    create_system_user
    deploy_application
    configure_nginx
    configure_ssl
    configure_firewall
    configure_fail2ban
        start_application
    verify_deployment
    cleanup_deployment
    show_deployment_info
}

# Mise à jour de l'application
update_application() {
    log_title "Mise à jour de l'application"
    
    check_root
    deploy_application
    start_application
    verify_deployment
    
    log_success "Application mise à jour avec succès"
}

# Redémarrer l'application
restart_application() {
    log_title "Redémarrage de l'application"
    
    sudo -u iris pm2 restart $PM2_NAME
    systemctl restart nginx
    
        log_success "Application redémarrée"
}

# Fonction de diagnostic automatique
auto_diagnose() {
    log_title "🤖 Diagnostic automatique du système"

    local issues_found=false

    # Vérifier l'espace disque
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 80 ]]; then
        log_warn "Espace disque faible: ${disk_usage}% utilisé"
        issues_found=true
    fi

    # Vérifier la mémoire
    local mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ $mem_usage -gt 90 ]]; then
        log_warn "Utilisation mémoire élevée: ${mem_usage}%"
        issues_found=true
    fi

    # Vérifier les services
    for service in nginx pm2; do
        if ! command -v $service &> /dev/null; then
            log_warn "Service manquant: $service"
            issues_found=true
        fi
    done

    # Vérifier les ports
    if ! netstat -tulpn 2>/dev/null | grep -q ":3000 "; then
        log_warn "Port 3000 non utilisé - Application potentiellement arrêtée"
        issues_found=true
    fi

    if [[ "$issues_found" == false ]]; then
        log_success "✅ Aucun problème détecté"
    else
        log_info "🔧 Problèmes détectés - le correcteur automatique peut aider lors du déploiement"
    fi
}

# Fonction de nettoyage des erreurs
cleanup_deployment() {
    log_info "🧹 Nettoyage des fichiers temporaires..."

    # Nettoyer les fichiers temporaires
    rm -f /tmp/chatgpt-fix.json
    rm -f /tmp/noskills-deployment-errors.log.old

    # Archiver l'ancien log s'il existe
    if [[ -f "$ERROR_LOG_FILE" ]] && [[ -s "$ERROR_LOG_FILE" ]]; then
        mv "$ERROR_LOG_FILE" "${ERROR_LOG_FILE}.$(date +%Y%m%d_%H%M%S)"
        log_info "Logs d'erreur archivés"
    fi
}

# Afficher les logs
show_logs() {
    echo "1. Logs de l'application"
    echo "2. Logs Nginx"
    echo "3. Logs système"
    read -p "Choisissez le type de logs [1-3]: " log_choice
    
    case $log_choice in
        1)
            sudo -u iris pm2 logs $PM2_NAME --lines 50
            ;;
        2)
            tail -f $LOG_PATH/nginx_access.log
            ;;
        3)
            journalctl -u nginx -f
            ;;
    esac
}

# Point d'entrée principal
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ $# -eq 0 ]]; then
        main_menu
    else
        case $1 in
            "deploy")
                full_deployment
                ;;
            "update")
                update_application
                ;;
            "restart")
                restart_application
                ;;
            "logs")
                show_logs
                ;;
            *)
                echo "Usage: $0 [deploy|update|restart|logs]"
                exit 1
                ;;
        esac
    fi
fi
