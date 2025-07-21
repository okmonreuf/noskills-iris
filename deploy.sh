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
            apt update
            apt install -y curl wget git build-essential python3 python3-pip sqlite3 nginx certbot python3-certbot-nginx ufw fail2ban
            ;;
        centos|rhel|rocky|almalinux)
            yum update -y
            yum groupinstall -y "Development Tools"
            yum install -y curl wget git python3 python3-pip sqlite nginx certbot python3-certbot-nginx firewalld fail2ban
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
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    
    case $DISTRO in
        ubuntu|debian)
            apt install -y nodejs
            ;;
        centos|rhel|rocky|almalinux)
            yum install -y nodejs npm
            ;;
    esac
    
    # Installer PM2 globalement
    npm install -g pm2
    
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
    log_title "Création de l'utilisateur système"
    
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
    log_info "Installation des dépendances NPM..."
    sudo -u iris npm install --production
    
    # Construire l'application
    log_info "Construction de l'application..."
    sudo -u iris npm run build
    
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
    
    log_success "Application démarrée"
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
        echo "1. Déploiement complet (recommandé)"
        echo "2. Mise à jour de l'application uniquement"
        echo "3. Configuration SSL uniquement"
        echo "4. Redémarrer l'application"
        echo "5. Afficher les logs"
        echo "6. Quitter"
        echo ""
        read -p "Choisissez une option [1-6]: " choice
        
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
                show_logs
                ;;
            6)
                log_info "Au revoir !"
                exit 0
                ;;
            *)
                log_error "Option invalide. Veuillez choisir entre 1 et 6."
                ;;
        esac
    done
}

# Déploiement complet
full_deployment() {
    log_title "Déploiement complet de NoSkills Iris"
    
    check_root
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
