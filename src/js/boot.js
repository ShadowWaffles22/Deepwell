// ----- boot -----
setPhone(detectPhone());
loadSave();renderTitle();setView('title');
try{if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
