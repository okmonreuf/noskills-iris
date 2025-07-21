#!/bin/bash

# Script de configuration ChatGPT Auto-Fix
# NoSkills Iris - Correcteur automatique d'erreurs

echo "🤖 Configuration du correcteur automatique d'erreurs ChatGPT"
echo "=================================================="
echo ""

# Vérifier si une clé API existe déjà
if [[ -n "$CHATGPT_API_KEY" ]]; then
    echo "✅ Clé API ChatGPT déjà configurée"
    echo "Pour la modifier, utilisez: export CHATGPT_API_KEY='nouvelle-clé'"
    exit 0
fi

echo "Pour utiliser le correcteur automatique d'erreurs, vous avez besoin d'une clé API ChatGPT."
echo ""
echo "🔗 Obtenez votre clé API sur: https://platform.openai.com/api-keys"
echo ""

# Demander la clé API
read -sp "Entrez votre clé API ChatGPT (ou appuyez sur Entrée pour ignorer): " api_key
echo ""

if [[ -n "$api_key" ]]; then
    # Valider le format de la clé
    if [[ $api_key =~ ^sk-[a-zA-Z0-9]{48}$ ]]; then
        echo "export CHATGPT_API_KEY='$api_key'" >> ~/.bashrc
        export CHATGPT_API_KEY="$api_key"
        echo ""
        echo "✅ Clé API configurée avec succès!"
        echo "🔄 Rechargez votre terminal ou exécutez: source ~/.bashrc"
        echo ""
        echo "Le correcteur automatique sera maintenant actif lors des déploiements."
    else
        echo "❌ Format de clé API invalide. Les clés OpenAI commencent par 'sk-'"
        exit 1
    fi
else
    echo "⏭️  Configuration ignorée. Le déploiement fonctionnera sans auto-correction."
fi

echo ""
echo "🚀 Prêt pour le déploiement! Exécutez: ./deploy.sh"
