/* Service worker tối thiểu để cài đặt như ứng dụng (PWA).
   KHÔNG cache gì cả — mọi trang luôn tải bản mới nhất từ mạng,
   nên cập nhật hệ thống đến máy nhân viên ngay lập tức. */
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(clients.claim()); });
