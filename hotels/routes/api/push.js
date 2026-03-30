const express = require('express');
const router = express.Router();
const pool = require('../../config/db');
const { requireOwner } = require('../../middleware/auth');
const { getVapidPublicKey } = require('../../services/notifications');

// Публичный ключ VAPID для подписки на push (нужен на клиенте)
router.get('/vapid-public-key', (req, res) => {
  const key = getVapidPublicKey();
  if (!key) return res.status(503).json({ error: 'Push notifications not configured' });
  res.json({ publicKey: key });
});

// Сохранить подписку владельца (только для role=owner)
router.post('/subscribe', requireOwner, async (req, res) => {
  try {
    const subscription = req.body?.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }
    const ownerId = req.session.admin.id;
    await pool.query(
      `INSERT INTO push_subscriptions (owner_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth)`,
      [ownerId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

module.exports = router;
