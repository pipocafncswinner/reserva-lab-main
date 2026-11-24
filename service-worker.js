const CACHE = 'reserva-salas-v3';
const ARQUIVOS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalação: guarda os arquivos no cache para funcionar offline
self.addEventListener('install', function (evento) {
  evento.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ARQUIVOS);
    })
  );
  self.skipWaiting();
});

// Ativação: apaga caches de versões antigas
self.addEventListener('activate', function (evento) {
  evento.waitUntil(
    caches.keys().then(function (nomes) {
      return Promise.all(
        nomes
          .filter(function (nome) {
            return nome !== CACHE;
          })
          .map(function (nome) {
            return caches.delete(nome);
          })
      );
    })
  );
  self.clients.claim();
});

// Requisições: responde do cache e, se não tiver, busca na rede
self.addEventListener('fetch', function (evento) {
  if (evento.request.method !== 'GET') {
    return;
  }
  evento.respondWith(
    caches.match(evento.request).then(function (resposta) {
      return resposta || fetch(evento.request);
    })
  );
});
