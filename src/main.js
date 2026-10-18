// Arranque de La Huerta del Pianista.
import { Game } from './engine/game.js';

const game = new Game();
game.boot().catch((e) => {
  console.error(e);
  document.getElementById('ui').innerHTML = '<div class="screen paper"><h1>Se ha emborronado la página</h1><p>Recarga para volver a intentarlo.</p></div>';
});

// Versión instalable: el service worker guarda una copia para jugar sin conexión
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !location.hostname.match(/^(localhost|127\.)/)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
