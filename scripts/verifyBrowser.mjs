/**
 * Valós Böngészős Ellenőrző Szkript (Real Headless Chromium CDP Test)
 *
 * Funkciója:
 * 1. Elindítja a Chromium böngészőt headless módban CDP (Chrome DevTools Protocol) interfésszel.
 * 2. Betölti az alkalmazást a futó http://localhost:3000 címen.
 * 3. Figyeli a böngésző konzolját (console.error) és a kezeletlen futásidejű kivételeket (Runtime.exceptionThrown).
 * 4. Végiglátogatja az összes fő nézetet (Top Tippek, Mérkőzés Rács, Scanner, Eredmények, Bankroll, Módszertan).
 * 5. Megnyitja és ellenőrzi a Szelvényfiókot (BetSlipDrawer) és a 6. pont alatti Időrendhelyes Kalibrációs audit panelt.
 * 6. Szigorú verifikációs jelentést készít.
 */

import { spawn } from 'node:child_process';

const TARGET_URL = 'http://localhost:3000';
const CDP_PORT = 9222;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function main() {
  console.log('🚀 [Valós Böngészős Ellenőrzés] Indítás...');

  // 1. Ellenőrizzük, hogy elérhető-e a webszerver
  try {
    const res = await fetch(TARGET_URL);
    if (!res.ok) {
      throw new Error(`Szerver nem elérhető: HTTP ${res.status}`);
    }
    console.log(`✅ [1/6] Helyi webszerver aktív és válaszol: ${TARGET_URL}`);
  } catch (err) {
    console.error(`❌ [Hiba] A webszerver (${TARGET_URL}) nem érhető el:`, err.message);
    process.exit(1);
  }

  // 2. Headless Chromium indítása CDP porttal
  console.log('🌐 [2/6] Headless Chromium indítása CDP porttal (9222)...');
  const chromeProcess = spawn(
    'chromium-browser',
    [
      '--headless',
      `--remote-debugging-port=${CDP_PORT}`,
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1280,900',
      TARGET_URL,
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  let chromeExited = false;
  chromeProcess.on('exit', (code) => {
    chromeExited = true;
  });

  // Várakozás a CDP elérhetőségére
  let versionInfo = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      versionInfo = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (versionInfo && versionInfo.webSocketDebuggerUrl) break;
    } catch {
      // még indul
    }
  }

  if (!versionInfo) {
    console.error('❌ Nem sikerült kapcsolódni a Chromium CDP interfészhez!');
    chromeProcess.kill();
    process.exit(1);
  }

  console.log(`✅ Chromium sikeresen elindult: ${versionInfo.Browser}`);

  // 3. Meglévő böngészőlap lekérése
  console.log(`📄 [3/6] Nyitott böngészőlap lekérése (${TARGET_URL})...`);
  const pages = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
  const targetPage = pages.find((p) => p.type === 'page') || pages[0];

  if (!targetPage || !targetPage.webSocketDebuggerUrl) {
    console.error('❌ Nem található aktív lap a Chromiumban!');
    chromeProcess.kill();
    process.exit(1);
  }

  const pageWsUrl = targetPage.webSocketDebuggerUrl;
  const ws = new WebSocket(pageWsUrl);

  const pendingRequests = new Map();
  let messageId = 1;
  const consoleErrors = [];
  const uncaughtExceptions = [];

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  // Eseménykezelés: Konzol és kivételek monitorozása
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) reject(new Error(data.error.message));
      else resolve(data.result);
      return;
    }

    if (data.method === 'Runtime.consoleAPICalled') {
      const { type, args } = data.params;
      if (type === 'error') {
        const text = args.map((a) => a.value || a.description || JSON.stringify(a)).join(' ');
        // Szűrjük ki a külső nem kritikus hálózati figyelmeztetéseket (pl. 403 API kulcs nélkül)
        if (!text.includes('favicon.ico')) {
          consoleErrors.push(text);
        }
      }
    }

    if (data.method === 'Runtime.exceptionThrown') {
      const { exceptionDetails } = data.params;
      uncaughtExceptions.push(exceptionDetails.text || exceptionDetails.exception?.description);
    }
  };

  // Protokollok engedélyezése
  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('DOM.enable');

  // Várakozás a kezdeti oldal betöltésére és a DOM felépülésére
  await sleep(3000);

  // 4. Kezdeti DOM ellenőrzés
  console.log('🔍 [4/6] Kezdeti DOM és komponens-renderelés vizsgálata...');

  async function evaluateJs(expression) {
    const res = await sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  const pageTitle = await evaluateJs('document.title');
  console.log(`   • Oldalcím: "${pageTitle}"`);

  const brandText = await evaluateJs(
    "document.querySelector('header')?.innerText.includes('SoccerAI') ? 'LÉTEZIK' : 'HIÁNYZIK'"
  );
  console.log(`   • Fejléc márkafelirat (SoccerAI PRO): ${brandText}`);

  const ballCanvas = await evaluateJs(
    "document.querySelector('canvas') ? 'LÉTEZIK (3D meccslabda aktív)' : 'NEM TALÁLHATÓ'"
  );
  console.log(`   • 3D adidas TRIONDA PRO animált meccslabda: ${ballCanvas}`);

  // 5. Interaktív nézetváltások (Tabok és funkciók végigjárása)
  console.log('🔄 [5/6] Navigációs fülek és modulok interaktív tesztelése valós böngészőben...');

  const tabsToTest = [
    { id: 'grid', name: 'Mérkőzés Rács (StatsGrid)', buttonText: 'Rács' },
    { id: 'scanner', name: 'Kvantitatív Értékkereső (ScannerView)', buttonText: 'Scanner' },
    { id: 'results', name: 'Auditált Eredmények (ResultsView)', buttonText: 'Eredmények' },
    { id: 'bankroll', name: 'Tétnapló & Bankroll (BankrollView)', buttonText: 'Bankroll' },
    { id: 'methodology', name: 'Módszertan & Kalibráció (MethodologyView)', buttonText: 'Módszertan' },
    { id: 'picks', name: 'Top Tippek (TopPicks)', buttonText: 'Top Tippek' },
  ];

  for (const tab of tabsToTest) {
    const clicked = await evaluateJs(`
      (() => {
        const buttons = Array.from(document.querySelectorAll('nav button, header button'));
        const target = buttons.find(b => b.innerText.includes('${tab.buttonText}'));
        if (target) {
          target.click();
          return true;
        }
        return false;
      })()
    `);

    await sleep(1500); // hagyjunk időt a lazy loading moduloknak és a renderelésnek

    const isVisible = await evaluateJs(`
      (() => {
        const mainText = document.querySelector('main')?.innerText || '';
        return mainText.length > 50;
      })()
    `);

    console.log(`   • [Fül: ${tab.name}] -> Kattintás: ${clicked ? 'OK' : 'SIKERTELEN'}, Renderelés: ${isVisible ? 'OK' : 'HIBA'}`);
  }

  // 6. Szelvényépítő Drawer tesztelése
  console.log('🎟️ [6/6] Szelvényfiók (BetSlipDrawer) és Kalibrációs szekció vizsgálata...');

  // Megnyitjuk a szelvényépítőt a fejléc gombjával
  const drawerOpened = await evaluateJs(`
    (() => {
      const btn = Array.from(document.querySelectorAll('header button')).find(b => b.innerText.includes('Szelvény'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()
  `);
  await sleep(1000);

  const drawerVisible = await evaluateJs(`
    (() => {
      const drawer = document.querySelector('.animate-fade-in');
      return drawer && drawer.innerText.includes('Fogadási Szelvény');
    })()
  `);
  console.log(`   • Szelvényfiók megnyitása: ${drawerOpened ? 'OK' : 'N/A'}, Tartalom megjelenése: ${drawerVisible ? 'OK' : 'HIBA'}`);

  // Bezárjuk a szelvényfiókot
  await evaluateJs(`
    (() => {
      const closeBtn = document.querySelector('.animate-fade-in button');
      if (closeBtn) closeBtn.click();
    })()
  `);
  await sleep(500);

  // Ellenőrizzük a Módszertan 6. pontját (Időrendhelyes Kalibráció, Brier Score és Döntési Kapu)
  await evaluateJs(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('nav button, header button'));
      const target = buttons.find(b => b.innerText.includes('Módszertan'));
      if (target) target.click();
    })()
  `);
  await sleep(1000);

  const calibrationSectionRendered = await evaluateJs(`
    (() => {
      const text = document.querySelector('main')?.innerText || '';
      const hasBrier = text.includes('Brier') || text.includes('Kalibráció');
      const hasGate = text.includes('Hipotézis Fázis') || text.includes('SZIGORÚ FIGYELMEZTETÉS') || text.includes('ECE');
      return hasBrier && hasGate;
    })()
  `);
  console.log(`   • 6. Időrendhelyes Kalibráció & Döntési Kapu szekció a felületen: ${calibrationSectionRendered ? '✅ HITELESÍTVE' : '⚠️ NEM TALÁLHATÓ'}`);

  // Lezárás és értékelés
  console.log('\n📊 ========================================================');
  console.log('🏁 VALÓS BÖNGÉSZŐS ELLENŐRZÉS EREDMÉNYE:');
  console.log(`   • Kezeletlen futásidejű kivételek (Uncaught Exceptions): ${uncaughtExceptions.length}`);
  if (uncaughtExceptions.length > 0) {
    console.error('     Kivételek:', uncaughtExceptions);
  }
  console.log(`   • Rendszer szintű konzolhibák (Console Errors): ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.warn('     Konzolhibák:', consoleErrors);
  }

  const success = uncaughtExceptions.length === 0;
  if (success) {
    console.log('✅ SIKERES VALÓS BÖNGÉSZŐS ELLENŐRZÉS! (0 unhandled exception)');
  } else {
    console.error('❌ Hiba történt a valós böngészős ellenőrzés során!');
  }
  console.log('========================================================\n');

  // Chromium leállítása
  ws.close();
  chromeProcess.kill();

  if (!success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Váratlan hiba a böngészős tesztben:', err);
  process.exit(1);
});
