/**
 * Импорт баз отдыха Алаколь из Excel (формат гос. перечня 2026, лист «Лист1»).
 * По умолчанию: файл «Алаколь*2026*.xlsx» в Downloads; таблица alakol_bases очищается и заполняется заново.
 *
 * Usage:
 *   node scripts/import-alakol-xlsx.js
 *   node scripts/import-alakol-xlsx.js "C:\\path\\file.xlsx"
 *   node scripts/import-alakol-xlsx.js --append   (не удалять существующие записи)
 */
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = require("../../hotels/config/db");
const { hotelSlug } = require("../../hotels/utils/slug");

const APPEND = process.argv.includes("--append");

function findDefaultXlsx() {
  const downloads = path.join(process.env.USERPROFILE || "", "Downloads");
  const files = fs.readdirSync(downloads).filter((f) => f.toLowerCase().endsWith(".xlsx"));
  const hit =
    files.find((f) => /алаколь|alakol/i.test(f) && /2026/i.test(f)) ||
    files.find((f) => /2026/i.test(f));
  if (!hit) {
    console.error("В папке Downloads не найден xlsx (ожидалось имя вроде «Алаколь новый 2026 (1).xlsx»).");
    process.exit(1);
  }
  return path.join(downloads, hit);
}

function cleanStr(v) {
  if (v == null) return "";
  return String(v)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function normalizePhone(v) {
  const s = cleanStr(v).replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  return s || null;
}

function formatPrice(raw) {
  const s = cleanStr(raw);
  if (!s) return null;
  const n = parseInt(s.replace(/\D/g, ""), 10);
  if (Number.isNaN(n)) return `${s} ₸/сутки`;
  return `от ${n.toLocaleString("ru-RU")} ₸/сутки`;
}

function rowToRecord(row, keys, sortOrder) {
  const longKey = keys.numKey;
  const numCell = cleanStr(row[longKey]);
  const name = cleanStr(row.__EMPTY);
  const taj = cleanStr(row.__EMPTY_1);
  const beds = cleanStr(row.__EMPTY_2);
  const priceRaw = cleanStr(row.__EMPTY_3);
  const workdays = cleanStr(row.__EMPTY_4);
  const phone = normalizePhone(row.__EMPTY_5);

  if (!name) return null;
  if (name === "Демалыс үйінің атауы") return null;
  if (numCell === "№") return null;

  const bits = [];
  if (taj) bits.push(`ТАЖ / данных владельца: ${taj}`);
  if (beds) bits.push(`Төсек орын (вместимость): ${beds}`);
  if (workdays) bits.push(`Жұмыс күндері (по таблице): ${workdays}`);
  if (numCell && /^\d+$/.test(numCell)) bits.push(`№ в перечне: ${numCell}`);

  return {
    sort_order: sortOrder,
    name: name.slice(0, 255),
    location: "Алаколь",
    price: formatPrice(priceRaw),
    phone,
    address: null,
    description: bits.length ? bits.join("\n") : null,
    image_url: null,
    image_urls: null,
    map_link: null,
    latitude: null,
    longitude: null,
    is_published: 1
  };
}

async function main() {
  const argPath = process.argv.find((a) => a.toLowerCase().endsWith(".xlsx") && !a.startsWith("--"));
  const xlsxPath = argPath ? path.resolve(argPath) : findDefaultXlsx();
  console.log("Файл:", xlsxPath);

  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheetName = wb.SheetNames.includes("Лист1") ? "Лист1" : wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  if (!rows.length) {
    console.error("Пустой лист");
    process.exit(1);
  }

  const numKey = Object.keys(rows[0]).find((k) => !k.startsWith("__EMPTY"));
  if (!numKey) {
    console.error("Не удалось определить колонку с номером");
    process.exit(1);
  }
  const keys = { numKey };

  const records = [];
  let order = 0;
  for (const row of rows) {
    const rec = rowToRecord(row, keys, order);
    if (!rec) continue;
    order += 1;
    records.push(rec);
  }

  console.log("Строк данных к импорту:", records.length);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (!APPEND) {
      await conn.query("DELETE FROM alakol_bases");
      console.log("Таблица alakol_bases очищена.");
    } else {
      console.log("Режим --append: существующие строки не удаляются.");
    }

    const insertSql = `INSERT INTO alakol_bases (
      name, slug, location, price, phone, address, description,
      image_url, image_urls, map_link, latitude, longitude, sort_order, is_published
    ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    let inserted = 0;
    for (const rec of records) {
      const vals = [
        rec.name,
        rec.location,
        rec.price,
        rec.phone,
        rec.address,
        rec.description,
        rec.image_url,
        rec.image_urls,
        rec.map_link,
        rec.latitude,
        rec.longitude,
        rec.sort_order,
        rec.is_published
      ];
      const [r] = await conn.query(insertSql, vals);
      const id = r.insertId;
      const slug = hotelSlug(rec.name, id);
      await conn.query("UPDATE alakol_bases SET slug = ? WHERE id = ?", [slug, id]);
      inserted += 1;
    }

    await conn.commit();
    console.log("Готово, импортировано записей:", inserted);
  } catch (e) {
    await conn.rollback();
    console.error(e);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

main();
