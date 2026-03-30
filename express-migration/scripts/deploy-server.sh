#!/usr/bin/env bash
# Запускать НА СЕРВЕРЕ после git pull (Plesk, путь подставьте свой).
set -euo pipefail

HTTPDOCS="${HTTPDOCS:-/var/www/vhosts/visitabay.kz/httpdocs}"

cd "$HTTPDOCS"
git pull origin main

cd "$HTTPDOCS/express-migration"
npm ci --omit=dev

bash "$HTTPDOCS/express-migration/scripts/plesk-httpdocs-symlinks.sh" "$HTTPDOCS" || true

echo ""
echo "Готово. В Plesk: Node.js → Restart App (или перезагрузка домена)."
