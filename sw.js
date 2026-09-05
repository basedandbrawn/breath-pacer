/* Breath — offline shell.
   Everything the pacer needs is cached on first load, so it opens in a
   basement gym or in airplane mode. Cached copies are served at once and
   refreshed quietly in the background; a new version is picked up on the
   next launch. */
var CACHE = "breath-v4";
var SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-180.png", "./icon-192.png", "./icon-512.png",
  "./fonts/rajdhani-600.woff2", "./fonts/rajdhani-700.woff2", "./fonts/space-grotesk.woff2"
];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request, {ignoreSearch:true}).then(function(hit){
    var net = fetch(e.request).then(function(res){
      if(res && res.ok){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copy); }); }
      return res;
    }).catch(function(){ return hit; });
    return hit || net;
  }));
});
