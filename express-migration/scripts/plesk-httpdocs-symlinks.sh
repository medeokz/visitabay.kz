#!/usr/bin/env bash
# Plesk + Nginx часто раздаёт статику из DocumentRoot до Phusion Passenger.
# Тогда URL вида /visitabay/css/*.css не доходят до Express и дают 404.
# Этот скрипт создаёт симлинки в httpdocs на реальные каталоги проекта.
#
# Использование:
#   bash scripts/plesk-httpdocs-symlinks.sh /var/www/vhosts/visitabay.kz/httpdocs
set -euo pipefail

HTTPDOCS="${1:-}"
if [[ -z "$HTTPDOCS" || ! -d "$HTTPDOCS" ]]; then
  echo "Usage: $0 /path/to/httpdocs"
  exit 1
fi

cd "$HTTPDOCS"

mklink() {
  local name="$1"
  local target="$2"
  if [[ ! -e "$target" ]]; then
    echo "SKIP: target missing: $target"
    return 0
  fi
  if [[ -e "$name" && ! -L "$name" ]]; then
    echo "WARN: $name exists and is not a symlink — не трогаю. Удалите/переименуйте вручную при необходимости."
    return 0
  fi
  mkdir -p "$(dirname "$name")"
  ln -sfn "$(realpath "$target")" "$name"
  echo "OK: $name -> $target"
}

# Шаблон visitabay (swiper, картинки, js в themeBase)
mklink "assets/templates" "templates"

# Стили/скрипты модуля hotels (пути /visitabay/..., /css/...)
mklink "visitabay" "hotels/public/visitabay"
mklink "css" "hotels/public/css"
mklink "js" "hotels/public/js"

# Кастомные стили express-migration (путь /assets/migration/...)
mklink "assets/migration" "express-migration/public"

echo "Готово. В браузере откройте (должен быть 200, не 404):"
echo "  https://ВАШ-ДОМЕН/visitabay/css/styles.css"
echo "  https://ВАШ-ДОМЕН/assets/templates/visitabay/css/swiper.min.css"
echo "  https://ВАШ-ДОМЕН/assets/migration/css/migration.css"
