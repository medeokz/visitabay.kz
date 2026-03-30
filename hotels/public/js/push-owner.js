(function () {
  var base = typeof window.BASE_PATH !== 'undefined' ? window.BASE_PATH : '';
  function api(path) { return base + path; }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  function registerAndSubscribe() {
    navigator.serviceWorker.register(base + '/sw.js', { scope: '/' })
      .then(function (reg) {
        return fetch(api('/api/push/vapid-public-key'))
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data.publicKey) return Promise.reject(new Error('No VAPID key'));
            return reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(data.publicKey),
            });
          })
          .then(function (sub) {
            var payload = sub.toJSON ? sub.toJSON() : {
              endpoint: sub.endpoint,
              keys: { p256dh: b64(sub.getKey('p256dh')), auth: b64(sub.getKey('auth')) },
            };
            return fetch(api('/api/push/subscribe'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ subscription: payload }),
            });
          })
          .then(function (r) {
            if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || 'Ошибка'); });
            return r.json();
          });
      })
      .then(function () {
        if (window.onPushSubscribed) window.onPushSubscribed();
      })
      .catch(function (err) {
        console.warn('Push subscribe error:', err);
        if (window.onPushSubscribeError) window.onPushSubscribeError(err);
      });
  }

  function urlBase64ToUint8Array(base64String) {
    var padding = '===='.slice((base64String.length % 4));
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(base64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function b64(buf) {
    var binary = '';
    var bytes = new Uint8Array(buf);
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  if (Notification.permission === 'default') {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-push-enable';
    btn.textContent = 'Включить уведомления о новых бронированиях';
    btn.style.cssText = 'margin: 0.5rem 0; padding: 0.4rem 0.8rem; font-size: 0.9rem; cursor: pointer;';
    btn.onclick = function () {
      Notification.requestPermission().then(function (p) {
        if (p === 'granted') registerAndSubscribe();
      });
    };
    var header = document.querySelector('.admin-header');
    if (header) header.appendChild(btn);
  } else if (Notification.permission === 'granted') {
    registerAndSubscribe();
  }
})();
