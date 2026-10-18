// Tarjeta de una avería: qué ha pasado, cuánto falta y cómo arreglarlo (a mano o pagando).
import { h, bar, btn } from './dom.js';
import { DAMAGES, repairBlocker, repair, hireBlocker, hireRepair, proTotal, repairCostLabel, repairLeft } from '../sim/index.js';

export function repairCard(game, s, id, after) {
  const def = DAMAGES[id];
  const d = s.damages[id];
  const left = repairLeft(s, id);
  const why = repairBlocker(s, id);
  const whyPro = hireBlocker(s, id);
  const put = Math.min(Math.floor(s.jornales), left);
  return h('div', { class: 'task damage' },
    h('div', { class: 'info' },
      h('div', { class: 'name' }, `⚠ ${def.name}`),
      h('div', { class: 'small' }, def.text),
      h('div', { class: 'meta' }, repairCostLabel(s, id) + (def.zone ? ' · mientras, la zona no produce ni se puede cuidar' : '')),
      d.work ? h('div', {}, h('div', { class: 'statline small' }, h('span', {}, 'Reparación'), h('span', {}, `${d.work} / ${def.work} jornales`)), bar(d.work / def.work * 100, 'green')) : null,
      !d.started && s.day - d.since > 2 && def.worse ? h('div', { class: 'why' }, 'Cada día sin empezar, va a peor.') : null,
      why ? h('div', { class: 'why' }, why) : null),
    h('div', { class: 'col' },
      btn(d.work ? `Seguir (−${put || 0})` : `Reparar (−${put || 0})`, () => {
        game.afterAction(repair(s, id), def.zone || null, 'tools');
        after && after();
      }, { cls: 'primary', disabled: why }),
      btn(`Llamar a alguien · ${proTotal(s, id)} €`, () => {
        game.afterAction(hireRepair(s, id), def.zone || null, 'coins');
        after && after();
      }, { cls: 'small', disabled: whyPro })));
}
