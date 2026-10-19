// Nota sujeta con clip: una zona de la finca, su estado y sus tareas.
import { h, clear, bar, btn, fmtNum } from './dom.js';
import { ZONE_BY_ID } from '../data/zones.js';
import { ANIMALS, PRODUCTS } from '../data/products.js';
import { ITEMS } from '../data/items.js';
import { SEASONS } from '../data/seasons.js';
import { VOLUNTEER_BY_ID } from '../data/volunteers.js';
import {
  taskBlocker, taskJornales, taskSkillBonus, doTask, unlockBlocker, unlockZone, unlockCostLabel, unlockTotal, unlockRequirement, taskGain,
  costLabel, seasonIndex, hasSkill, skillName, assignVolunteer, buyAnimal, animalBlocker, infoOf,
} from '../sim/index.js';
import { drawIcon } from '../art/illus.js';
import { CROPS, RECIPES, SOW_JORNALES, HARVEST_JORNALES } from '../data/crops.js';
import { beds, seasonalCrops, sow, sowBlocker, harvest, harvestBlocker, harvestAmount, recipeBlocker, recipeJornales, cook, ingredientLabel } from '../sim/index.js';
import { sfx } from '../audio/ambience.js';
import { damageOf, pendingItems, zoneFull, TRACTOR, tractorState, tractorBlocker, repairTractor, tractorProCost, tractorProBlocker, tractorToWorkshop, tractorCostLabel, stopped } from '../sim/index.js';
import { repairCard } from './troubles.js';

export class ZonePanel {
  constructor(root, game) {
    this.game = game;
    this.el = h('aside', { class: 'sheet paper', 'aria-live': 'polite' });
    root.append(this.el);
    this.zone = null;
    this.key = '';
  }

  open(id) {
    this.zone = id;
    this.key = '';
    this.el.classList.add('open');
    this.update(this.game.s, true);
    this.el.scrollTop = 0;
  }

  close() {
    this.zone = null;
    this.el.classList.remove('open');
  }

  get isOpen() { return !!this.zone; }

  update(s, force = false) {
    if (!this.zone) return;
    const st = s.zones[this.zone];
    const key = [this.zone, Math.round(st.cons), st.weeds == null ? '' : Math.round(st.weeds / 2), st.unlocked, s.jornales, Math.round(s.money),
      JSON.stringify(s.materials), s.volunteers.map((v) => v.id + v.zone).join(), s.weather, s.day, JSON.stringify(s.animals), s.items.length, JSON.stringify(s.damages || {}), JSON.stringify(s.tractor || {}), (s.beds || []).map((b) => b.crop + (b.ready ?? '')).join()].join('|');
    if (!force && key === this.key) return;
    this.key = key;
    this.render(s);
  }

  render(s) {
    const z = ZONE_BY_ID[this.zone];
    const st = s.zones[z.id];
    const g = this.game;
    const scroll = this.el.scrollTop;
    clear(this.el);
    this.el.append(
      h('div', { class: 'clip' }),
      btn('✕', () => g.ui.closeZone(), { cls: 'icon small close' }),
      h('h2', {}, z.name),
      h('p', { class: 'desc' }, z.desc),
    );
    if (!st.unlocked) {
      const u = z.unlock || {};
      const total = unlockTotal(z.id);
      const work = st.unlockWork || 0;
      const why = unlockBlocker(s, z.id);
      const req = unlockRequirement(s, z.id);
      this.el.append(
        h('p', {}, work ? 'Ya has empezado a recuperarla. Poco a poco vuelve al papel.' : 'Esta parte de la finca se ha borrado del cuaderno. Hay que volver a dibujarla: es un trabajo de varios días.'),
        h('div', { class: 'task' },
          h('div', { class: 'info' },
            h('div', { class: 'name' }, u.text || 'Recuperar la zona'),
            h('div', { class: 'meta' }, unlockCostLabel(z.id)),
            work ? h('div', {}, h('div', { class: 'statline small' }, h('span', {}, 'Trabajo hecho'), h('span', {}, `${work} / ${total} jornales`)), bar(work / total * 100, 'green')) : null,
            req ? h('div', { class: 'why' }, req) : (why ? h('div', { class: 'why' }, why) : null)),
          btn(work ? `Seguir (−${Math.min(Math.floor(s.jornales), total - work) || 0})` : 'Empezar', () => {
            const r = unlockZone(s, z.id);
            g.afterAction(r, z.id);
          }, { cls: 'primary', disabled: why })),
      );
      if (work && s.volunteers.length) this._assign(s, z);
      else if (s.volunteers.length) this.el.append(h('p', { class: 'small muted' }, 'Cuando empieces, podrás encargar el trabajo a un voluntario.'));
      return;
    }
    // Avería: lo primero
    const dmg = damageOf(s, z.id);
    if (dmg) {
      this.el.append(h('div', { class: 'section' }, h('h3', {}, 'Averiado'), h('div', { class: 'tasks' }, repairCard(g, s, dmg.id)),
        h('p', { class: 'small muted' }, 'Puedes encargar la reparación a un voluntario: pondrá sus jornales cada mañana.')));
    }
    // Estado
    const consTxt = st.cons >= 85 ? 'Cuidada y con color' : st.cons >= 70 ? 'Restaurada' : st.cons >= 45 ? 'Aguanta' : st.cons >= 25 ? 'Se va borrando' : 'Casi borrada';
    this.el.append(
      h('div', { class: 'statline' }, h('span', {}, 'Conservación'), h('span', {}, `${Math.round(st.cons)} · ${consTxt}`)),
      bar(st.cons, st.cons >= 70 ? 'green' : ''),
    );
    if (st.weeds != null) {
      this.el.append(
        h('div', { class: 'statline' }, h('span', {}, 'Maleza'), h('span', {}, `${Math.round(st.weeds)}${st.weeds > 60 ? ' · ¡ojo con el fuego!' : ''}`)),
        bar(st.weeds, 'weed'),
      );
    }
    // Tareas
    const tasks = h('div', { class: 'tasks' });
    for (const t of z.tasks) {
      const why = taskBlocker(s, z.id, t);
      const j = taskJornales(s, t);
      const skilled = taskSkillBonus(s, t);
      const eff = [];
      if (t.effect?.cons) { const gn = taskGain(s, z.id, t); eff.push(gn >= 0.5 ? `+${Math.round(gn)} conservación` : 'ya está al máximo'); }
      if (t.effect?.weeds) eff.push(`${t.effect.weeds} maleza`);
      if (t.effect?.mood) eff.push(`+${t.effect.mood} ánimo`);
      if (t.gain) eff.push(...Object.entries(t.gain).map(([k, v]) => `+${v} ${PRODUCTS[k]?.name.toLowerCase() || k}`));
      if (t.gainScaled) eff.push(...Object.keys(t.gainScaled).map((k) => `da ${PRODUCTS[k].name.toLowerCase()}`));
      if (t.gainPerAnimal) eff.push(...Object.keys(t.gainPerAnimal).filter((k) => k !== 'animal').map((k) => `da ${PRODUCTS[k].name.toLowerCase()}`));
      const who = skilled ? s.volunteers.find((v) => infoOf(v).skill === t.skill) : null;
      tasks.append(h('div', { class: 'task' },
        h('div', { class: 'info' },
          h('div', { class: 'name' }, t.name),
          h('div', { class: 'meta' }, costLabel({ jornales: j, ...(t.cost || {}) }) + (eff.length ? ' → ' + eff.join(', ') : '')),
          who ? h('div', { class: 'meta' }, `✓ ${VOLUNTEER_BY_ID[who.id].name} sabe de esto: lo hacéis mejor`) : (t.skill ? h('div', { class: 'meta tiny' }, `Mejor con alguien que sepa de ${skillName(t.skill)}`) : null),
          why ? h('div', { class: 'why' }, why) : null),
        btn('Hacer', () => {
          const r = doTask(s, z.id, t.id);
          g.afterAction(r, z.id);
        }, { disabled: why })));
    }
    if (z.beds) this._beds(s);
    if (z.id === TRACTOR.zone && tractorState(s).found) this._tractor(s);
    this.el.append(h('div', { class: 'section' }, h('h3', {}, 'Cuidados'), tasks));
    if (z.id === 'cortijo') this._kitchen(s);

    // Producción
    if (z.produce) {
      const si = seasonIndex(s);
      const items = [];
      for (const [k, arr] of Object.entries(z.produce)) {
        if (!Array.isArray(arr)) continue;
        const names = PRODUCTS[k].name;
        const now = arr[si] > 0;
        items.push(h('span', { class: 'pill' }, `${names}${now ? ' · ahora' : ' · ' + arr.map((v, i) => (v > 0 ? SEASONS[i].name.toLowerCase() : null)).filter(Boolean).join(', ')}`));
      }
      this.el.append(h('div', { class: 'section' }, h('h3', {}, 'Da'), h('div', { class: 'pills' }, items),
        h('p', { class: 'small muted' }, 'Cuanto mejor cuidada, más produce.')));
    }

    // Animales
    const animals = Object.entries(ANIMALS).filter(([, a]) => a.zone === z.id);
    if (animals.length) {
      const box = h('div', { class: 'tasks' });
      for (const [k, a] of animals) {
        const why = animalBlocker(s, k);
        box.append(h('div', { class: 'task' },
          h('div', { class: 'info' },
            h('div', { class: 'name' }, `${a.name}: ${s.animals[k] || 0}`),
            k === 'cerdos' && s.animals.cerdos ? h('div', { class: 'meta' }, `Montanera: ${Math.round(s.montanera * 100)} % (engordan con bellota en otoño e invierno)`) : null,
            h('div', { class: 'meta' }, `Comprar ${a.unit}: ${a.price} €`),
            why ? h('div', { class: 'why' }, why) : null),
          btn('Comprar', () => { const r = buyAnimal(s, k); g.afterAction(r, z.id, 'coins'); }, { disabled: why })));
      }
      this.el.append(h('div', { class: 'section' }, h('h3', {}, 'Animales'), box));
    }

    if (s.volunteers.length) this._assign(s, z);

    // Recuerdos de la zona
    const found = ITEMS.filter((it) => it.zone === z.id && s.items.includes(it.id));
    const pending = pendingItems(s, z.id).length;
    if (found.length || pending) {
      const box = h('div', {});
      for (const it of found) {
        const cv = h('canvas', { class: 'icon-cv' });
        drawIcon(cv, it.icon, 44);
        box.append(h('div', { class: 'row', style: { marginBottom: '6px' } }, cv, h('span', { class: 'small' }, it.name)));
      }
      if (pending) {
        const when = zoneFull(s, z.id) ? 'Irán apareciendo, de uno en uno, en los próximos días.' : 'Aparecerán cuando la zona esté al 100 %.';
        box.append(h('p', { class: 'small muted' }, (pending === 1 ? 'Aquí todavía hay algo olvidado. ' : `Aquí todavía hay ${pending} cosas olvidadas. `) + when));
      }
      this.el.append(h('div', { class: 'section' }, h('h3', {}, 'Recuerdos'), box));
    }
    this.el.scrollTop = scroll;
  }

  // Bancales de la huerta
  _beds(s) {
    const g = this.game;
    const box = h('div', { class: 'tasks' });
    const crops = seasonalCrops(s);
    beds(s).forEach((b, i) => {
      if (!b.crop) {
        const why = crops.length ? null : 'Ahora no es tiempo de sembrar nada';
        box.append(h('div', { class: 'task' },
          h('div', { class: 'info' },
            h('div', { class: 'name' }, `Bancal ${i + 1}: vacío`),
            h('div', { class: 'meta' }, crops.length ? `Siembra de temporada (${SOW_JORNALES} jornal):` : why),
            h('div', { class: 'row', style: { marginTop: '4px' } }, crops.map((c) => btn(c.name, () => {
              g.afterAction(sow(s, i, c.id), 'huerta');
            }, { cls: 'small', disabled: sowBlocker(s, i, c.id) }))))));
      } else {
        const c = CROPS[b.crop];
        const ready = b.ready != null;
        box.append(h('div', { class: 'task' },
          h('div', { class: 'info' },
            h('div', { class: 'name' }, `Bancal ${i + 1}: ${c.name.toLowerCase()}${ready ? ' · ¡listas!' : ''}`),
            ready
              ? h('div', { class: 'meta' }, `Darán unas ${Math.round(harvestAmount(s, i))}. ${s.day - b.ready > 2 ? 'Recógelas pronto o se pasarán.' : ''}`)
              : h('div', {}, bar(b.growth * 100, 'green'), h('div', { class: 'meta' }, `Creciendo (${Math.round(b.growth * 100)} %). El agua y una huerta cuidada lo adelantan.`))),
          ready ? btn(`Recoger (${HARVEST_JORNALES})`, () => g.afterAction(harvest(s, i), 'huerta'), { disabled: harvestBlocker(s, i) }) : null));
      }
    });
    this.el.append(h('div', { class: 'section' }, h('h3', {}, 'Bancales'),
      h('p', { class: 'small muted' }, `Agua del pozo y la alberca: ${Math.round(s.water)} %. Cada estación tiene sus cultivos.`), box));
  }

  // El tractor Pascuali (aparece con la huerta al 100 %)
  _tractor(s) {
    const g = this.game;
    const t = tractorState(s);
    let body;
    if (t.ready) {
      const broken = stopped(s, 'tractor');
      body = h('p', { class: 'small' + (broken ? '' : ' tractor-ok') }, broken
        ? 'El Pascuali está averiado: míralo en «Cuentas» del cuaderno. Mientras, todo a mano.'
        : '✓ Funciona. Cavar, segar el heno, varear la bellota, desbrozar la dehesa y rehacer muros cuestan un jornal menos.');
    } else {
      const why = tractorBlocker(s);
      const whyPro = tractorProBlocker(s);
      const put = Math.min(Math.floor(s.jornales), TRACTOR.work - t.work);
      body = h('div', { class: 'task' },
        h('div', { class: 'info' },
          h('div', { class: 'name' }, 'Ponerlo en marcha'),
          h('div', { class: 'small' }, 'Estaba bajo una lona detrás del cobertizo: polvo, óxido y las ruedas medio deshinchadas.'),
          h('div', { class: 'meta' }, t.started ? `${TRACTOR.work} jornales de trabajo` : tractorCostLabel()),
          t.work ? h('div', {}, h('div', { class: 'statline small' }, h('span', {}, 'Arreglo'), h('span', {}, `${t.work} / ${TRACTOR.work} jornales`)), bar(t.work / TRACTOR.work * 100, 'green')) : null,
          why ? h('div', { class: 'why' }, why) : null),
        h('div', { class: 'col' },
          btn(`${t.work ? 'Seguir' : 'Arreglar'} (−${put || 0})`, () => g.afterAction(repairTractor(s), 'huerta', 'tools'), { cls: 'primary', disabled: why }),
          btn(`Al taller · ${tractorProCost(s)} €`, () => g.afterAction(tractorToWorkshop(s), 'huerta', 'coins'), { cls: 'small', disabled: whyPro })));
    }
    this.el.append(h('div', { class: 'section' }, h('h3', {}, TRACTOR.name), body));
  }

  // La cocina del cortijo
  _kitchen(s) {
    const g = this.game;
    const box = h('div', { class: 'tasks' });
    for (const r of RECIPES) {
      const why = recipeBlocker(s, r.id);
      const ins = Object.entries(r.in).map(([k, n]) => `${n} ${ingredientLabel(k)}`).join(' + ');
      const outs = Object.entries(r.out).map(([k, n]) => `${n} ${PRODUCTS[k].name.toLowerCase()}`).join(' + ');
      box.append(h('div', { class: 'task' },
        h('div', { class: 'info' },
          h('div', { class: 'name' }, r.name),
          h('div', { class: 'meta' }, `${recipeJornales(s, r)} jornal${recipeJornales(s, r) > 1 ? 'es' : ''} · ${ins} → ${outs}`),
          why ? h('div', { class: 'why' }, why) : null),
        btn('Hacer', () => g.afterAction(cook(s, r.id), 'cortijo'), { disabled: why })));
    }
    this.el.append(h('div', { class: 'section' }, h('h3', {}, 'La cocina'),
      h('p', { class: 'small muted' }, 'Lo fresco se estropea a los pocos días; en conserva aguanta y se vende mejor. Quien sabe de cocina saca más.'), box));
  }

  _assign(s, z) {
    const g = this.game;
    const box = h('div', { class: 'pills' });
    for (const v of s.volunteers) {
      const info = VOLUNTEER_BY_ID[v.id];
      const here = v.zone === z.id;
      const star = z.tasks.some((t) => t.skill === info.skill) ? ' ★' : '';
      box.append(btn(`${here ? '✓ ' : ''}${info.name}${star}`, () => {
        assignVolunteer(s, v.id, here ? null : z.id);
        sfx('pen');
        g.toast(here ? `${info.name} vuelve a ayudarte donde haga falta.` : `${info.name} se encarga de ${z.name.toLowerCase()}. ${s.zones[z.id].unlocked ? 'La cuidará cada mañana.' : 'Seguirá con el trabajo cada mañana.'}`);
        this.update(s, true);
        g.hud.update(s);
      }, { cls: 'small' + (here ? ' on' : '') }));
    }
    this.el.append(h('div', { class: 'section' }, h('h3', {}, 'Encargar a…'),
      h('p', { class: 'small muted' }, 'Quien se encarga de una zona trabaja en ella sola cada mañana con sus jornales (★ = es su oficio). Mientras, no suma jornales a los tuyos.'), box));
  }
}

export { fmtNum };
