// Bridge runner: mirrors a site (html, css, js, fonts, images, videos), takes screenshots, and downloads listed URLs.
// Reads bridge/manifest.json, writes into bridge/out/.
const fs = require('fs');
const path = require('path');
let chromium=null; try { chromium = require('playwright').chromium; } catch { console.log('playwright not installed, downloads only'); }

const ROOT = path.join(__dirname, 'out');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

function ensure(p) { fs.mkdirSync(path.dirname(p), { recursive: true }); }

async function fetchBuf(url, headers = {}) {
  const r = await fetch(url, { headers: { 'user-agent': UA, ...headers }, redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  const ct = r.headers.get('content-type') || '';
  return { buf: Buffer.from(await r.arrayBuffer()), ct };
}

function localPathFor(base, url) {
  const u = new URL(url);
  let p = u.pathname;
  if (p.endsWith('/')) p += 'index.html';
  if (u.hostname !== new URL(base).hostname) p = '/_ext/' + u.hostname + p;
  return p;
}

async function mirror(site) {
  const base = site.url;
  const outDir = path.join(ROOT, site.out);
  const seen = new Set();
  const queue = [base, ...(site.extraPages || [])];
  const log = [];
  let total = 0;
  const maxBytes = (site.maxMB || 400) * 1024 * 1024;
  const allowExt = /\.(html?|css|js|json|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|mp4|webm|mov|m4v|pdf|avif)(\?|$)/i;
  while (queue.length) {
    const url = queue.shift();
    const clean = url.split('#')[0];
    if (seen.has(clean)) continue;
    seen.add(clean);
    let u;
    try { u = new URL(clean); } catch { continue; }
    const sameOrigin = u.hostname === new URL(base).hostname;
    const isFontHost = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
    if (!sameOrigin && !isFontHost) continue;
    if (!sameOrigin && !isFontHost) continue;
    if (sameOrigin && !allowExt.test(u.pathname) && !u.pathname.endsWith('/') && path.extname(u.pathname) !== '') continue;
    try {
      const { buf, ct } = await fetchBuf(clean);
      total += buf.length;
      if (total > maxBytes) { log.push(`STOP size cap at ${clean}`); break; }
      let lp = localPathFor(base, clean);
      if (isFontHost && u.hostname === 'fonts.googleapis.com') lp = '/_ext/fonts.googleapis.com/' + encodeURIComponent(u.pathname + u.search) + '.css';
      const dest = path.join(outDir, lp);
      ensure(dest);
      fs.writeFileSync(dest, buf);
      log.push(`${buf.length}\t${ct.split(';')[0]}\t${clean}`);
      if (/text\/html|text\/css|javascript/.test(ct) || /\.(html?|css|js)$/i.test(u.pathname)) {
        const text = buf.toString('utf8');
        const found = new Set();
        const re = /(?:href|src|poster|data-src|data-video|data-bg)=["']([^"'#]+)["']|url\((['"]?)([^)'"]+)\2\)|srcset=["']([^"']+)["']|["'](assets\/[^"'\s]+)["']/gi;
        let m;
        while ((m = re.exec(text))) {
          const cands = [];
          if (m[1]) cands.push(m[1]);
          if (m[3]) cands.push(m[3]);
          if (m[4]) m[4].split(',').forEach(s => cands.push(s.trim().split(/\s+/)[0]));
          if (m[5]) cands.push(m[5]);
          for (const c of cands) {
            if (!c || c.startsWith('data:') || c.startsWith('mailto:') || c.startsWith('tel:') || c.startsWith('javascript:')) continue;
            try { found.add(new URL(c, clean).href); } catch {}
          }
        }
        for (const f of found) if (!seen.has(f.split('#')[0])) queue.push(f);
      }
    } catch (e) {
      log.push(`ERR\t${clean}\t${e.message}`);
    }
  }
  ensure(path.join(outDir, '_mirror.log'));
  fs.writeFileSync(path.join(outDir, '_mirror.log'), log.join('\n'));
  console.log(`mirror ${base}: ${seen.size} urls, ${(total / 1e6).toFixed(1)} MB`);
}

async function shots(site, browser) {
  for (const s of site.shots || []) {
    const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height || 900 }, deviceScaleFactor: s.dpr || 2, userAgent: UA, isMobile: !!s.mobile, hasTouch: !!s.mobile });
    const page = await ctx.newPage();
    try {
      await page.goto(s.url, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(3000);
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < Math.min(h, 40000); y += 600) { await page.evaluate(yy => window.scrollTo(0, yy), y); await page.waitForTimeout(150); }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1500);
      const dest = path.join(ROOT, s.out);
      ensure(dest);
      if (s.fullPage) await page.screenshot({ path: dest, fullPage: true });
      // viewport-by-viewport segments
      if (s.segments) {
        const vh = s.height || 900;
        const n = Math.ceil(Math.min(h, 40000) / vh);
        for (let i = 0; i < n; i++) {
          await page.evaluate(yy => window.scrollTo(0, yy), i * vh);
          await page.waitForTimeout(700);
          await page.screenshot({ path: dest.replace(/\.png$/, `_seg${String(i).padStart(2, '0')}.png`) });
        }
      }
      // dump computed style summary
      if (s.styles) {
        const info = await page.evaluate(() => {
          const out = { fonts: {}, colors: {}, links: [] };
          document.querySelectorAll('link[rel=stylesheet]').forEach(l => out.links.push(l.href));
          const els = document.querySelectorAll('h1,h2,h3,h4,p,a,button,span,li,div');
          let n = 0;
          for (const el of els) {
            if (n++ > 4000) break;
            const cs = getComputedStyle(el);
            const f = cs.fontFamily + ' | ' + cs.fontWeight + ' | ' + cs.fontStyle;
            out.fonts[f] = (out.fonts[f] || 0) + 1;
            for (const k of ['color', 'backgroundColor', 'borderColor']) {
              const v = cs[k]; if (v && v !== 'rgba(0, 0, 0, 0)') out.colors[v] = (out.colors[v] || 0) + 1;
            }
          }
          out.bodyBg = getComputedStyle(document.body).backgroundColor;
          return out;
        });
        fs.writeFileSync(dest.replace(/\.png$/, '_styles.json'), JSON.stringify(info, null, 1));
      }
      console.log(`shot ${s.url} -> ${s.out} (h=${h})`);
    } catch (e) { console.log(`shot ERR ${s.url}: ${e.message}`); }
    await ctx.close();
  }
}

async function downloads() {
  for (const d of manifest.downloads || []) {
    try {
      const { buf } = await fetchBuf(d.url);
      const dest = path.join(ROOT, d.out); ensure(dest);
      if (/\.css$/.test(d.out)) {
        let css = buf.toString('utf8');
        const urls = [...css.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)].map(m => m[2]);
        for (const u of new Set(urls)) {
          try {
            const abs = new URL(u, d.url).href;
            const fname = path.basename(new URL(abs).pathname);
            const { buf: fb } = await fetchBuf(abs);
            const fdest = path.join(path.dirname(dest), 'files', fname); ensure(fdest); fs.writeFileSync(fdest, fb);
            css = css.split(u).join('files/' + fname);
            console.log(`dl font ${fname} ${fb.length}`);
          } catch (e) { console.log(`dl font ERR ${u}: ${e.message}`); }
        }
        fs.writeFileSync(dest, css);
      } else fs.writeFileSync(dest, buf);
      console.log(`dl ${d.out} ${buf.length}`);
    } catch (e) { console.log(`dl ERR ${d.out}: ${e.message}`); }
  }
}

(async () => {
  fs.mkdirSync(ROOT, { recursive: true });
  for (const site of manifest.sites || []) if (site.mirror) await mirror(site);
  await downloads();
  if (chromium && (manifest.sites || []).length) {
    const browser = await chromium.launch();
    for (const site of manifest.sites || []) await shots(site, browser);
    await browser.close();
  }
  fs.writeFileSync(path.join(ROOT, '_done_' + Date.now() + '.txt'), 'ok');
})();
