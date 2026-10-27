/* ありがとドロップ Service Worker：アプリ本体をキャッシュして、すばやく・オフラインでも開けるように */
var VERSION='arigaame-172ccbfc83';
var SHELL=['./','./index.html','./config.js','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./icons/favicon-32.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(VERSION).then(function(c){return c.addAll(SHELL)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==VERSION}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
function fromNetwork(req,cache){
  return fetch(req).then(function(res){ if(res&&(res.ok||res.type==='opaque')) cache.put(req,res.clone()); return res; });
}
self.addEventListener('fetch',function(e){
  var req=e.request; if(req.method!=='GET') return;
  var u=new URL(req.url);
  var same=u.origin===self.location.origin, font=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!same&&!font) return; /* API などはそのままネットへ */
  e.respondWith(caches.open(VERSION).then(function(cache){
    /* config.js は設定変更がすぐ反映されるようネット優先 */
    if(same&&/config\.js$/.test(u.pathname)) return fromNetwork(req,cache).catch(function(){return cache.match(req)});
    /* ページ本体（index.html）はネット優先：更新がすぐ届くように。オフライン時だけキャッシュ */
    if(same&&(req.mode==='navigate'||/(\/|index\.html)$/.test(u.pathname))) return fetch(req,{cache:'no-store'}).then(function(res){ if(res&&res.ok) cache.put('./index.html',res.clone()); return res; }).catch(function(){return cache.match('./index.html')});
    /* それ以外はキャッシュで即表示しつつ裏で更新（stale-while-revalidate） */
    return cache.match(req,{ignoreSearch:same}).then(function(hit){
      var net=fromNetwork(req,cache).catch(function(){return hit||(req.mode==='navigate'?cache.match('./index.html'):undefined)});
      return hit||net;
    });
  }));
});
