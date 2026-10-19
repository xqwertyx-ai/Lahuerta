"""Prueba de humo e2e con Playwright.

Uso: python3 tests/e2e/smoke.py [url] [carpeta_capturas]
Si no se pasa url, levanta tools/serve.mjs en un puerto libre y prueba index.html y dist/index.html.
Comprueba: arranca sin errores, portada, introducción, plano, tareas, recuerdos, eventos, cuaderno
(todas las pestañas), velocidades, guardado y carga, móvil en vertical y horizontal, y 60 FPS.
"""
import os, sys, time, json, socket, subprocess
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHOTS = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'tests', 'e2e', 'shots')
os.makedirs(SHOTS, exist_ok=True)

results = []
def check(name, cond, extra=''):
    results.append((name, bool(cond)))
    print(('  ✔ ' if cond else '  ✘ ') + name + (f'  [{extra}]' if extra else ''))

def free_port():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p

def dismiss(pg, shot=None):
    for _ in range(8):
        if not pg.locator('.modal .opts .btn').count():
            return
        if shot:
            pg.screenshot(path=shot); shot = None
        btns = pg.locator('.modal .opts .btn:not([disabled])')
        if btns.count():
            btns.first.click()
        time.sleep(0.35)

def tap_zone(pg, zx, zy):
    pg.evaluate(f"""() => {{ const g = window.__huerta; g.onTap(({zx} - g.cam.x) * g.cam.zoom, ({zy} - g.cam.y) * g.cam.zoom); }}""")

def run(url, tag, browser):
    print(f'\n▶ {tag}: {url}')
    errors = []
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800}, has_touch=True)
    pg = ctx.new_page()
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    pg.goto(url)
    pg.wait_for_selector('.screen .btn', timeout=20000)
    check('portada visible', pg.locator('text=La Huerta del Pianista').count() > 0)
    pg.screenshot(path=f'{SHOTS}/{tag}-01-portada.png')
    pg.click('text=Nuevo cuaderno')
    pg.wait_for_selector('text=saltar', timeout=5000)
    pg.screenshot(path=f'{SHOTS}/{tag}-02-intro.png')
    pg.click('text=saltar')
    pg.wait_for_selector('.hud', timeout=10000)
    time.sleep(1)
    st = pg.evaluate("() => ({ day: __huerta.s.day, zones: Object.keys(__huerta.s.zones).length })")
    check('partida creada con 14 zonas', st['zones'] == 14)
    pg.screenshot(path=f'{SHOTS}/{tag}-03-plano.png')

    # Tocar el cortijo y encalar
    tap_zone(pg, 775, 650)
    pg.wait_for_selector('.sheet.open', timeout=3000)
    check('panel de zona abierto', pg.locator('.sheet.open h2').inner_text().strip() == 'El cortijo')
    c0 = pg.evaluate("() => __huerta.s.zones.cortijo.cons")
    pg.locator('.sheet .task').filter(has_text='Encalar').locator('button').click()
    time.sleep(0.4)
    c1 = pg.evaluate("() => __huerta.s.zones.cortijo.cons")
    check('encalar sube la conservación', c1 > c0 + 10, f'{c0:.1f} → {c1:.1f}')
    # A medias no sale nada: los recuerdos esperan a que la zona esté al 100 %
    check('sin recuerdo antes del 100 %', pg.locator('.modal').count() == 0)
    pg.evaluate("() => { const s = __huerta.s; s.zones.cortijo.cons = 99.8; s.jornales = 5; }")
    pg.locator('.sheet .task').filter(has_text='Limpiar la chimenea').locator('button').click()
    pg.wait_for_selector('.modal', timeout=3000)
    check('al 100 % aparece un recuerdo', 'Un recuerdo' in pg.locator('.modal').inner_text())
    pg.screenshot(path=f'{SHOTS}/{tag}-04-recuerdo.png')
    pg.click('text=Guardarlo en el cuaderno')
    time.sleep(0.3)
    dismiss(pg)
    pg.screenshot(path=f'{SHOTS}/{tag}-05-zona.png')

    # Tarea sin jornales suficientes → aviso
    pg.locator('.sheet .task').filter(has_text='Arreglar las tejas').locator('button').count()
    pg.click('.sheet .close')

    # Sin jornales: pasar al amanecer
    pg.evaluate("() => { __huerta.s.jornales = 0; }")
    pg.wait_for_selector('.dawn:not([hidden])', timeout=3000)
    d0 = pg.evaluate("() => __huerta.s.day")
    pg.click('.dawn')
    pg.wait_for_function(f"() => __huerta.s.day > {d0} || document.querySelector('.modal')", timeout=10000)
    dismiss(pg)
    pg.wait_for_function(f"() => __huerta.s.day > {d0}", timeout=10000)
    check('pasar al amanecer devuelve los jornales', pg.evaluate("() => __huerta.s.jornales") >= 5)

    # Velocidad y paso del tiempo
    pg.click('.speed button:nth-child(4)')
    h0 = pg.evaluate("() => __huerta.s.day * 24 + __huerta.s.hour")
    time.sleep(2)
    dismiss(pg, f'{SHOTS}/{tag}-06-evento.png')
    h1 = pg.evaluate("() => __huerta.s.day * 24 + __huerta.s.hour")
    check('el tiempo avanza a x3', h1 > h0 + 0.5, f'+{h1 - h0:.2f} h')
    pg.click('.speed button:nth-child(1)')
    time.sleep(0.2)
    h2 = pg.evaluate("() => __huerta.s.day * 24 + __huerta.s.hour")
    time.sleep(0.8)
    h3 = pg.evaluate("() => __huerta.s.day * 24 + __huerta.s.hour")
    check('la pausa detiene el tiempo', abs(h3 - h2) < 1e-6)

    # Forzar un evento y resolverlo
    pg.evaluate("() => { __huerta.s.eventQueue.push('ciervos'); }")
    pg.wait_for_selector('.modal .illus', timeout=3000)
    check('evento con ilustración', pg.locator('.modal h2').inner_text().strip() == 'Ciervos al atardecer')
    pg.screenshot(path=f'{SHOTS}/{tag}-07-ciervos.png')
    dismiss(pg)
    check('evento resuelto', pg.evaluate("() => __huerta.s.eventQueue.length") == 0)

    # Cuaderno: todas las pestañas
    dismiss(pg)
    pg.click('text=✎ Cuaderno')
    pg.wait_for_selector('.book', timeout=3000)
    for i, name in enumerate(['Diario', 'Despensa', 'Cuentas', 'Gente', 'Recuerdos', 'Huéspedes', 'Álbum', 'Ajustes']):
        pg.click(f'.book .tab:has-text("{name}")')
        time.sleep(0.25)
        ok = pg.locator('.book .page h2').count() > 0
        check(f'pestaña {name}', ok)
        pg.screenshot(path=f'{SHOTS}/{tag}-08-cuaderno-{i}-{name}.png')
    pg.click('.book .tab:has-text("Gente")')
    check('ratos libres en el cuaderno', pg.locator('text=Ratos libres').count() > 0)
    pg.click('.book .close')

    # Huerta: sembrar en un bancal
    pg.evaluate("() => { const s = __huerta.s; s.zones.huerta.unlocked = true; s.zones.huerta.cons = 60; s.jornales = 5; }")
    tap_zone(pg, 330, 680)
    pg.wait_for_selector('.sheet.open h2:has-text("La huerta")', timeout=3000)
    pg.locator('.sheet .task').filter(has_text='Bancal 1').locator('button').first.click()
    time.sleep(0.3)
    check('se siembra un bancal', pg.evaluate("() => !!__huerta.s.beds[0].crop"))
    pg.screenshot(path=f'{SHOTS}/{tag}-09-huerta.png')
    pg.click('.sheet .close')

    # Avería: el tejado se hunde, aparece el aviso, se repara a mano y pagando
    pg.evaluate("() => { const s = __huerta.s; s.damages = { tejado: { id: 'tejado', work: 0, started: false, since: s.day } }; s.materials.piedra = 5; s.materials.cal = 5; s.jornales = 5; s.money = 900; }")
    time.sleep(0.4)
    check('aviso de avería en el HUD', pg.locator('.hud .chip.alert').is_visible())
    tap_zone(pg, 775, 650)
    pg.wait_for_selector('.sheet.open .task.damage', timeout=3000)
    check('la zona averiada muestra la reparación', 'Tejado hundido' in pg.locator('.sheet .task.damage').inner_text())
    check('los cuidados quedan bloqueados', pg.locator('.sheet .why:has-text("Averiado")').count() > 0)
    pg.screenshot(path=f'{SHOTS}/{tag}-10-averia.png')
    pg.locator('.sheet .task.damage button.primary').click()
    time.sleep(0.3)
    check('reparar a mano avanza la obra', pg.evaluate("() => __huerta.s.damages.tejado && __huerta.s.damages.tejado.work") == 5)
    pg.locator('.sheet .task.damage button:has-text("Llamar")').click()
    time.sleep(0.3)
    check('un profesional lo termina', pg.evaluate("() => !__huerta.s.damages.tejado"))
    pg.click('.sheet .close')
    # Evento de contratiempo al amanecer: con jornales para elegir
    pg.evaluate("() => { const s = __huerta.s; s.jornales = 5; s.materials.herramientas = 2; s.eventQueue.push('temporal'); }")
    pg.wait_for_selector('.modal .illus', timeout=3000)
    check('contratiempo con opción de prevenir', pg.locator('.modal button:has-text("Apuntalar")').is_enabled())
    pg.screenshot(path=f'{SHOTS}/{tag}-11-temporal.png')
    pg.locator('.modal button:has-text("Apuntalar")').click()
    time.sleep(0.3)
    dismiss(pg)
    check('prevenir evita la avería', pg.evaluate("() => !__huerta.s.damages.tejado && __huerta.s.jornales <= 2"))
    pg.click('text=✎ Cuaderno')
    pg.wait_for_selector('.book', timeout=3000)
    pg.click('.book .tab:has-text("Cuentas")')
    time.sleep(0.25)
    check('cuentas: reservas y pagos', pg.locator('text=Reservas para el invierno').count() > 0 and pg.locator('text=Próximos pagos').count() > 0)
    pg.screenshot(path=f'{SHOTS}/{tag}-12-cuentas.png')
    pg.click('.book .close')

    # Guardar y recargar
    pg.evaluate("() => { __huerta.s.money = 777; window.dispatchEvent(new Event('pagehide')); }")
    pg.reload()
    pg.wait_for_selector('text=Continuar', timeout=10000)
    pg.click('text=Continuar')
    pg.wait_for_selector('.hud', timeout=8000)
    time.sleep(0.5)
    money = pg.evaluate("() => __huerta.s.money")
    check('la partida se guarda y se carga', abs(money - 777) < 0.01, str(money))

    # Rendimiento
    time.sleep(2.5)
    fps = pg.evaluate("() => __huerta.fps.value")
    check('~60 FPS en escritorio', fps >= 50, f'{fps:.0f}')
    check('sin errores de consola', not errors, '; '.join(errors[:3]))
    ctx.close()

    # Móvil vertical y horizontal
    for name, vp in (('movil-vertical', {'width': 390, 'height': 844}), ('movil-horizontal', {'width': 844, 'height': 390})):
        errs = []
        mctx = browser.new_context(viewport=vp, device_scale_factor=2, has_touch=True, is_mobile=True)
        mp = mctx.new_page()
        mp.on('pageerror', lambda e: errs.append(str(e)))
        mp.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        mp.goto(url)
        mp.wait_for_selector('.screen .btn', timeout=20000)
        mp.screenshot(path=f'{SHOTS}/{tag}-20-{name}-portada.png')
        mp.click('text=Nuevo cuaderno')
        mp.click('text=saltar')
        mp.wait_for_selector('.hud', timeout=10000)
        time.sleep(1)
        mp.screenshot(path=f'{SHOTS}/{tag}-21-{name}-plano.png')
        # Arrastrar con el dedo mueve el plano; los botones de zoom acercan y alejan
        x0 = mp.evaluate("() => __huerta.cam.x + ',' + __huerta.cam.y")
        mp.evaluate("""() => { const c = document.getElementById('map'); const mk = (x, y) => new Touch({ identifier: 1, target: c, clientX: x, clientY: y });
          c.dispatchEvent(new TouchEvent('touchstart', { touches: [mk(200, 400)], changedTouches: [mk(200, 400)], cancelable: true, bubbles: true }));
          for (let i = 1; i <= 10; i++) c.dispatchEvent(new TouchEvent('touchmove', { touches: [mk(200 - i * 12, 400 - i * 8)], changedTouches: [mk(200 - i * 12, 400 - i * 8)], cancelable: true, bubbles: true }));
          c.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [mk(80, 320)], cancelable: true, bubbles: true })); }""")
        x1 = mp.evaluate("() => __huerta.cam.x + ',' + __huerta.cam.y")
        check(f'{name}: arrastrar con el dedo mueve el plano', x0 != x1, f'{x0} → {x1}')
        # Pellizcar con dos dedos aleja el plano
        z0 = mp.evaluate("() => __huerta.cam.zoom")
        mp.evaluate("""() => { const c = document.getElementById('map'); const mk = (id, x, y) => new Touch({ identifier: id, target: c, clientX: x, clientY: y });
          const ev = (type, a, b) => c.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [a, b], changedTouches: [a, b], cancelable: true, bubbles: true }));
          ev('touchstart', mk(1, 100, 300), mk(2, 300, 300));
          for (let i = 1; i <= 8; i++) ev('touchmove', mk(1, 100 + i * 10, 300), mk(2, 300 - i * 10, 300));
          ev('touchend', mk(1, 180, 300), mk(2, 220, 300)); }""")
        z1 = mp.evaluate("() => __huerta.cam.zoom")
        check(f'{name}: pellizcar aleja el plano', z1 < z0, f'{z0:.2f} → {z1:.2f}')
        tap_zone(mp, 360, 300)  # dehesa
        mp.wait_for_selector('.sheet.open', timeout=3000)
        time.sleep(0.4)
        mp.screenshot(path=f'{SHOTS}/{tag}-22-{name}-zona.png')
        box = mp.locator('.sheet .btn').last.bounding_box()
        check(f'{name}: botones de al menos 36 px', box and box['height'] >= 36, str(box and round(box['height'])))
        hud = mp.locator('.hud').bounding_box()
        check(f'{name}: el HUD cabe en la pantalla', hud and hud['width'] <= vp['width'] + 1)
        dismiss(mp)
        mp.click('.sheet .close')
        dismiss(mp)
        mp.click('text=✎ Cuaderno')
        mp.click('.book .tab:has-text("Despensa")')
        time.sleep(0.3)
        mp.screenshot(path=f'{SHOTS}/{tag}-23-{name}-cuaderno.png')
        check(f'{name}: sin errores', not errs, '; '.join(errs[:3]))
        mctx.close()

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        if len(sys.argv) > 1 and sys.argv[1].startswith('http'):
            run(sys.argv[1], 'url', browser)
        else:
            port = free_port()
            srv = subprocess.Popen(['node', os.path.join(ROOT, 'tools', 'serve.mjs'), str(port), ROOT], stdout=subprocess.DEVNULL)
            time.sleep(0.8)
            try:
                run(f'http://127.0.0.1:{port}/index.html', 'src', browser)
                if os.path.exists(os.path.join(ROOT, 'dist', 'index.html')):
                    run(f'http://127.0.0.1:{port}/dist/index.html', 'dist', browser)
            finally:
                srv.terminate()
        browser.close()
    bad = [n for n, ok in results if not ok]
    print(f'\n{len(results) - len(bad)}/{len(results)} comprobaciones correctas')
    if bad:
        print('Fallan: ' + ', '.join(bad))
        sys.exit(1)

if __name__ == '__main__':
    main()
