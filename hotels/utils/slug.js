/**
 * Транслитерация кириллицы (RU/KZ) в латиницу и формирование ЧПУ.
 * @param {string} name - Название отеля
 * @param {number} [id] - ID для уникальности (добавляется в конец)
 * @returns {string} slug вида "gostinitsa-baykonur" или "gostinitsa-baykonur-3"
 */
const cyrToLat = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  і: 'i', ё: 'e', ғ: 'g', қ: 'k', ң: 'n', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', ә: 'a', ҭ: 't'
};

function transliterate(str) {
  if (!str || typeof str !== 'string') return '';
  let out = '';
  const s = str.toLowerCase();
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (cyrToLat[c]) out += cyrToLat[c];
    else if (/[a-z0-9]/.test(c)) out += c;
    else if (/\s/.test(c)) out += '-';
    else if (c === '-' || c === '_') out += '-';
    else if (/[а-яёәғқңөұүһіҭ]/i.test(c)) out += cyrToLat[c.toLowerCase()] || '';
  }
  return out;
}

function slugify(text) {
  let s = transliterate(text);
  s = s.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return s || 'hotel';
}

function hotelSlug(name, id) {
  const base = slugify(name);
  if (id != null && id !== '') return base ? `${base}-${id}` : String(id);
  return base || 'hotel';
}

module.exports = { hotelSlug, slugify, transliterate };
