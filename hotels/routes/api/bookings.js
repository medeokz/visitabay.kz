const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { requireAuth } = require('../../middleware/auth');
const { sendBookingEmails, sendBookingPush, sendBookingWhatsApp } = require('../../services/notifications');

function isAdmin(req) {
  return req.session?.admin?.role === 'admin';
}
function isOwner(req) {
  return req.session?.admin?.role === 'owner';
}

async function canAccessBooking(req, booking) {
  if (isAdmin(req)) return true;
  if (isOwner(req)) {
    const [rows] = await pool.query(
      'SELECT id FROM hotels WHERE id = ? AND owner_id = ?',
      [booking.hotel_id, req.session.admin.id]
    );
    return rows.length > 0;
  }
  return false;
}

// Создать бронирование (публично)
router.post('/', async (req, res) => {
  try {
    const {
      hotel_id,
      room_id,
      guest_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      adults = 1,
      children = 0,
      notes,
    } = req.body;
    if (
      !hotel_id ||
      !guest_name?.trim() ||
      !guest_email?.trim() ||
      !guest_phone?.trim() ||
      !check_in ||
      !check_out
    ) {
      return res.status(400).json({
        error: 'Заполните: отель, имя, email, телефон, даты заезда и выезда',
      });
    }
    const [hotelRows] = await pool.query('SELECT id FROM hotels WHERE id = ?', [
      hotel_id,
    ]);
    if (!hotelRows.length) {
      return res.status(400).json({ error: 'Гостиница не найдена' });
    }
    const roomId = room_id != null && room_id !== '' ? parseInt(room_id, 10) : null;
    let roomName = null;
    if (roomId != null && !isNaN(roomId)) {
      const [roomRows] = await pool.query(
        'SELECT id, name FROM hotel_rooms WHERE id = ? AND hotel_id = ?',
        [roomId, hotel_id]
      );
      if (!roomRows.length) {
        return res.status(400).json({ error: 'Выбранный номер не найден' });
      }
      roomName = roomRows[0].name || null;
    }
    const inDate = new Date(check_in);
    const outDate = new Date(check_out);
    if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
      return res.status(400).json({ error: 'Некорректные даты' });
    }
    if (outDate <= inDate) {
      return res.status(400).json({
        error: 'Дата выезда должна быть позже даты заезда',
      });
    }
    const [r] = await pool.query(
      `INSERT INTO bookings (hotel_id, room_id, guest_name, guest_email, guest_phone, check_in, check_out, adults, children, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        hotel_id,
        roomId,
        guest_name.trim(),
        guest_email.trim(),
        guest_phone.trim(),
        check_in,
        check_out,
        parseInt(adults, 10) || 1,
        parseInt(children, 10) || 0,
        notes?.trim() || null,
      ]
    );
    const bookingId = r.insertId;
    const [hotelInfo] = await pool.query(
      'SELECT h.name AS hotel_name, h.owner_id, h.phone AS hotel_phone FROM hotels h WHERE h.id = ?',
      [hotel_id]
    );
    const hotelName = hotelInfo[0]?.hotel_name || '';
    const ownerId = hotelInfo[0]?.owner_id || null;
    const ownerPhone = hotelInfo[0]?.hotel_phone || null;
    let ownerEmail = null;
    if (ownerId) {
      const [ownerRows] = await pool.query('SELECT login FROM admin_users WHERE id = ?', [ownerId]);
      ownerEmail = ownerRows[0]?.login || null;
    }
    const emailOpts = {
      bookingId,
      hotelName,
      guestName: guest_name.trim(),
      guestEmail: guest_email.trim(),
      guestPhone: guest_phone.trim(),
      checkIn: check_in,
      checkOut: check_out,
      roomName,
      adults: parseInt(adults, 10) || 1,
      children: parseInt(children, 10) || 0,
      notes: notes?.trim() || null,
    };
    sendBookingEmails(emailOpts, ownerEmail).catch((err) => console.error('Booking email error:', err));
    sendBookingWhatsApp(emailOpts, ownerPhone).catch((err) => console.error('Booking WhatsApp error:', err));
    if (ownerId) {
      sendBookingPush(pool, ownerId, {
        title: 'Новое бронирование',
        body: `${hotelName}${roomName ? ' (' + roomName + ')' : ''}: ${guest_name.trim()}, ${check_in} — ${check_out}`,
        url: '/owner/bookings',
      }).catch((err) => console.error('Booking push error:', err));
    }
    res.status(201).json({ id: bookingId, message: 'Заявка отправлена' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания бронирования' });
  }
});

// Список бронирований (админ — все, хозяин — по своим отелям)
router.get('/', requireAuth, async (req, res) => {
  try {
    let sql = `
      SELECT b.*, h.name AS hotel_name, r.name AS room_name
      FROM bookings b
      JOIN hotels h ON h.id = b.hotel_id
      LEFT JOIN hotel_rooms r ON r.id = b.room_id
    `;
    const params = [];
    if (isOwner(req)) {
      sql += ' WHERE h.owner_id = ?';
      params.push(req.session.admin.id);
    }
    sql += ' ORDER BY b.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка загрузки' });
  }
});

// Изменить статус (подтвердить/отменить)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const [bookings] = await pool.query(
      'SELECT * FROM bookings WHERE id = ?',
      [req.params.id]
    );
    if (!bookings.length) return res.status(404).json({ error: 'Не найдено' });
    const allowed = await canAccessBooking(req, bookings[0]);
    if (!allowed) return res.status(403).json({ error: 'Нет доступа' });
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Недопустимый статус' });
    }
    await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [
      status,
      req.params.id,
    ]);
    res.json({ message: 'Обновлено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

module.exports = router;
