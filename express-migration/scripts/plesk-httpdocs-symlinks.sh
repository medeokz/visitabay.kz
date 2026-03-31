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

# Если в Plesk «Document root» = express-migration/public, Apache/Nginx раздаёт
# только файлы из этой папки — симлинки в httpdocs выше не помогают.
# Дублируем те же привязки внутри public/.
PUBLIC_DIR="$HTTPDOCS/express-migration/public"
if [[ -d "$PUBLIC_DIR" ]]; then
  cd "$PUBLIC_DIR"
  mklink "visitabay" "../../hotels/public/visitabay"
  mklink "css" "../../hotels/public/css"
  mklink "js" "../../hotels/public/js"
  mkdir -p assets
  # Путь относительно public/assets/ (не public/): на 1 уровень глубже, чем visitabay/css.
  mklink "assets/templates" "../../../templates"
  # Express монтирует ../public как /assets/migration → на диске нужно public/assets/migration/css/...
  ln -sfn "$(realpath .)" "assets/migration"
  echo "OK: $PUBLIC_DIR/assets/migration -> (this public dir)"
else
  echo "SKIP: нет каталога $PUBLIC_DIR"
fi

echo "Готово. В браузере откройте (должен быть 200, не 404):"
echo "  https://ВАШ-ДОМЕН/visitabay/css/styles.css"
echo "  https://ВАШ-ДОМЕН/assets/templates/visitabay/css/swiper.min.css"
echo "  https://ВАШ-ДОМЕН/assets/migration/css/migration.css"
echo ""
echo "Если в Apache error_log: AH00037 … public/assets/templates — Apache (SymLinksIfOwnerMatch)"
echo "не проходит по symlink: чаще всего разный владелец httpdocs/templates и express-migration/public."
echo "Исправление (подставьте system user подписки из Plesk):"
echo "  chown -R visitabay.kz_XXXXX:psacln $HTTPDOCS"
echo "  find $HTTPDOCS -type d -exec chmod 755 {} \\;"
echo "  find $HTTPDOCS -type f -exec chmod 644 {} \\;"
echo "  chmod 600 $HTTPDOCS/express-migration/.env"
