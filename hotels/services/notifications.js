const nodemailer = require('nodemailer');
const webPush = require('web-push');

let transporter = null;
let vapidKeys = { publicKey: null, privateKey: null };
let twilioClient = null;

function getTwilioClient() {
  if (twilioClient !== null) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  try {
    twilioClient = require('twilio')(sid, token);
  } catch (_) {
    return null;
  }
  return twilioClient;
}

/** Нормализация номера для WhatsApp: только цифры, префикс + (по умолчанию +7 для Казахстана). */
function normalizeWhatsAppPhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits.length) return null;
  if (digits.length <= 10 && digits[0] !== '7') return '+7' + digits;
  if (digits[0] === '8' && digits.length === 11) return '+7' + digits.slice(1);
  return '+' + digits;
}

function getTransporter() {
  if (transporter !== null) return transporter;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return transporter;
}

function getVapidKeys() {
  if (vapidKeys.publicKey && vapidKeys.privateKey) return vapidKeys;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return null;
  vapidKeys = { publicKey, privateKey };
  webPush.setVapidDetails(
    'mailto:' + (process.env.VAPID_MAILTO || 'noreply@visitabay.kz'),
    publicKey,
    privateKey
  );
  return vapidKeys;
}

/**
 * Отправить письмо гостю (подтверждение заявки) и владельцу (новое бронирование).
 * @param {Object} opts - { bookingId, hotelName, roomName, guestName, guestEmail, guestPhone, checkIn, checkOut, adults, children, notes }
 * @param {string|null} ownerEmail - email владельца (логин из admin_users)
 */
async function sendBookingEmails(opts, ownerEmail) {
  const transport = getTransporter();
  if (!transport) {
    console.warn('Notifications: SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Skip email.');
    return;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const dates = `${opts.checkIn} — ${opts.checkOut}`;
  const roomLine = opts.roomName ? `\nНомер: ${opts.roomName}` : '';
  const roomLineHtml = opts.roomName ? `<p><strong>Номер:</strong> ${escapeHtml(opts.roomName)}</p>` : '';

  try {
    await transport.sendMail({
      from,
      to: opts.guestEmail,
      subject: 'Заявка на бронирование принята — ' + (opts.hotelName || 'Гостиница'),
      text: `Здравствуйте, ${opts.guestName}!\n\nВаша заявка на бронирование в "${opts.hotelName || 'гостинице'}" принята.${roomLine}\nДаты: ${dates}\nГости: взрослых ${opts.adults || 1}, детей ${opts.children || 0}.\n\nМы свяжемся с вами для подтверждения.\n\nС уважением, visitabay.kz`,
      html: `<p>Здравствуйте, ${escapeHtml(opts.guestName)}!</p><p>Ваша заявка на бронирование в «${escapeHtml(opts.hotelName || 'гостинице')}» принята.</p>${roomLineHtml}<p><strong>Даты:</strong> ${escapeHtml(dates)}</p><p><strong>Гости:</strong> взрослых ${opts.adults || 1}, детей ${opts.children || 0}.</p><p>Мы свяжемся с вами для подтверждения.</p><p>С уважением, visitabay.kz</p>`,
    });
  } catch (err) {
    console.error('Notifications: failed to send email to guest:', err.message);
  }

  if (ownerEmail && ownerEmail.trim()) {
    try {
      await transport.sendMail({
        from,
        to: ownerEmail.trim(),
        subject: 'Новое бронирование — ' + (opts.hotelName || 'Ваша гостиница'),
        text: `Новая заявка на бронирование.\nГостиница: ${opts.hotelName || '—'}${opts.roomName ? '\nНомер: ' + opts.roomName : ''}\nГость: ${opts.guestName}, ${opts.guestEmail}, ${opts.guestPhone}\nДаты: ${dates}\nВзрослых: ${opts.adults || 1}, детей: ${opts.children || 0}${opts.notes ? '\nПримечание: ' + opts.notes : ''}\n\nПодтвердите или отмените в личном кабинете.`,
        html: `<p><strong>Новая заявка на бронирование</strong></p><p>Гостиница: ${escapeHtml(opts.hotelName || '—')}</p>${opts.roomName ? '<p>Номер: ' + escapeHtml(opts.roomName) + '</p>' : ''}<p>Гость: ${escapeHtml(opts.guestName)}, ${escapeHtml(opts.guestEmail)}, ${escapeHtml(opts.guestPhone)}</p><p>Даты: ${escapeHtml(dates)}</p><p>Взрослых: ${opts.adults || 1}, детей: ${opts.children || 0}</p>${opts.notes ? '<p>Примечание: ' + escapeHtml(opts.notes) + '</p>' : ''}<p>Подтвердите или отмените в <a href="#">личном кабинете</a>.</p>`,
      });
    } catch (err) {
      console.error('Notifications: failed to send email to owner:', err.message);
    }
  }
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Отправить push-уведомление подписчикам владельца.
 * @param {Object} pool - mysql pool
 * @param {number} ownerId - id владельца (admin_users.id)
 * @param {Object} payload - { title, body, url }
 */
async function sendBookingPush(pool, ownerId, payload) {
  if (!getVapidKeys()) {
    console.warn('Notifications: VAPID keys not set (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY). Skip push.');
    return;
  }
  if (!pool || !ownerId) return;
  try {
    const [rows] = await pool.query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE owner_id = ?',
      [ownerId]
    );
    if (!rows || !rows.length) return;
    const subscription = (sub) => ({
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    });
    const payloadStr = JSON.stringify(payload);
    for (const sub of rows) {
      try {
        await webPush.sendNotification(subscription(sub), payloadStr);
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await pool.query('DELETE FROM push_subscriptions WHERE owner_id = ? AND endpoint = ?', [
            ownerId,
            sub.endpoint,
          ]);
        }
      }
    }
  } catch (err) {
    console.error('Notifications: push error:', err.message);
  }
}

/**
 * Отправить уведомление в WhatsApp гостю и хозяину (номер гостиницы или владельца).
 * @param {Object} opts - { hotelName, roomName, guestName, guestPhone, checkIn, checkOut, adults, children }
 * @param {string|null} ownerPhone - телефон владельца/гостиницы (куда слать уведомление хозяину)
 */
async function sendBookingWhatsApp(opts, ownerPhone) {
  const client = getTwilioClient();
  const from = process.env.TWILIO_WHATSAPP_FROM; // например whatsapp:+14155238886
  if (!client || !from || !from.startsWith('whatsapp:')) {
    console.warn('Notifications: WhatsApp not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM). Skip WhatsApp.');
    return;
  }
  const dates = `${opts.checkIn} — ${opts.checkOut}`;
  const guestMsg =
    `Здравствуйте, ${opts.guestName}! Ваша заявка на бронирование в «${opts.hotelName || 'гостинице'}»${opts.roomName ? ' (номер: ' + opts.roomName + ')' : ''} принята. Даты: ${dates}. Мы свяжемся с вами для подтверждения. visitabay.kz`;
  const ownerMsg =
    `Новое бронирование. Гостиница: ${opts.hotelName || '—'}${opts.roomName ? ', номер: ' + opts.roomName : ''}. Гость: ${opts.guestName}, ${opts.guestPhone}. Даты: ${dates}. Подтвердите в личном кабинете.`;

  const toGuest = normalizeWhatsAppPhone(opts.guestPhone);
  if (toGuest) {
    try {
      await client.messages.create({
        body: guestMsg,
        from,
        to: 'whatsapp:' + toGuest,
      });
    } catch (err) {
      console.error('Notifications: WhatsApp to guest failed:', err.message);
    }
  }

  const toOwner = normalizeWhatsAppPhone(ownerPhone);
  if (toOwner && toOwner !== toGuest) {
    try {
      await client.messages.create({
        body: ownerMsg,
        from,
        to: 'whatsapp:' + toOwner,
      });
    } catch (err) {
      console.error('Notifications: WhatsApp to owner failed:', err.message);
    }
  }
}

function getVapidPublicKey() {
  const keys = getVapidKeys();
  return keys ? keys.publicKey : null;
}

module.exports = {
  sendBookingEmails,
  sendBookingPush,
  sendBookingWhatsApp,
  getVapidPublicKey,
};
