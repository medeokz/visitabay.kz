#!/usr/bin/env bash
# Синхронизация клона репозитория → httpdocs (Plesk).
# ВАЖНО: в Git нет ядра DLE (engine/, index.php и т.д.). С --delete без protect
# эти каталоги были бы удалены с сервера — отсюда был Fatal error на plugins.class.php.
#
# Использование (на сервере):
#   bash express-migration/scripts/rsync-repo-to-httpdocs.sh /var/www/vhosts/visitabay.kz/visitabay-repo
#
# Переменные:
#   HTTPDOCS — каталог сайта (по умолчанию /var/www/vhosts/visitabay.kz/httpdocs)
set -euo pipefail

REPO_ROOT="${1:-${REPO_ROOT:-}}"
HTTPDOCS="${HTTPDOCS:-/var/www/vhosts/visitabay.kz/httpdocs}"

if [[ -z "$REPO_ROOT" ]] || [[ ! -d "$REPO_ROOT" ]]; then
  echo "Usage: HTTPDOCS=/path/to/httpdocs $0 /path/to/visitabay-repo-clone" >&2
  exit 1
fi

# Не трогаем на приёмнике при --delete (ядро DLE и точки входа не в Git):
# см. `man rsync` — правило protect.
PROTECT=(
  "protect engine/"
  "protect index.php"
  "protect admin.php"
  "protect cron.php"
  "protect install.php"
)

FILTER_ARGS=()
for r in "${PROTECT[@]}"; do
  FILTER_ARGS+=(--filter "$r")
done

rsync -a --delete "${FILTER_ARGS[@]}" \
  --exclude uploads \
  --exclude express-migration/.env \
  "$REPO_ROOT/" "$HTTPDOCS/"

echo "OK: rsync from $REPO_ROOT → $HTTPDOCS"
echo "Далее: cd $HTTPDOCS/express-migration && npm ci --omit=dev"
echo "       bash $HTTPDOCS/express-migration/scripts/plesk-httpdocs-symlinks.sh $HTTPDOCS"
