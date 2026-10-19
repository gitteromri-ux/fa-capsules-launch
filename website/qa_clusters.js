const pw = require('/home/user/node_modules/playwright');
(async () => {
  const out = {};
  const browser = await pw.chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR: ' + e.message));
  // block media so the page settles
  await page.route('**/*', r => r.request().resourceType() === 'media' ? r.abort() : r.continue());
  page.setDefaultNavigationTimeout(30000);
  page.setDefaultTimeout(10000);

  async function shootSection(name, w) {
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in-view','is-visible','revealed','show','active')));
    await page.evaluate(() => document.getElementById('courses').scrollIntoView());
    await page.waitForTimeout(500);
    const bb = await page.locator('#courses').boundingBox();
    await page.screenshot({ path: name, clip: { x: 0, y: Math.max(0, bb.y), width: w, height: Math.min(bb.height, 1100) } });
  }

  // ---------- 1280 ----------
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:8066/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  out.clusterCards = await page.locator('.cls-card').count();
  out.default_FA_visible = await page.locator('#cls-track-fa').isVisible();
  out.default_LSF_visible = await page.locator('#cls-track-lsf').isVisible();
  await shootSection('/home/user/workspace/v3_clusters_default_1280.png', 1280);

  // open FA
  await page.evaluate(() => document.getElementById('cls-btn-fa').click());
  await page.waitForTimeout(700);
  out.fa_visible = await page.locator('#cls-track-fa').isVisible();
  out.fa_cards = await page.locator('#cls-track-fa .cls-course').count();
  out.fa_imgs = await page.locator('#cls-track-fa .cls-course-media img').evaluateAll(els => els.map(e => ({ src: e.getAttribute('src'), w: e.naturalWidth })));
  out.fa_rail = await page.locator('#fa-rail').evaluate(r => ({ sw: Math.round(r.scrollWidth), cw: Math.round(r.clientWidth) }));
  out.fa_rail_scrollable = out.fa_rail.sw > out.fa_rail.cw + 2;
  out.fa_next_disabled = await page.locator('#cls-track-fa .cls-arrow-next').evaluate(b => b.disabled);
  await shootSection('/home/user/workspace/v3_clusters_fa_1280.png', 1280);

  // FA arrow scroll test (only if enabled)
  if (!out.fa_next_disabled) {
    const b = await page.locator('#fa-rail').evaluate(r => r.scrollLeft);
    await page.evaluate(() => document.querySelector('#cls-track-fa .cls-arrow-next').click());
    await page.waitForTimeout(700);
    const a = await page.locator('#fa-rail').evaluate(r => r.scrollLeft);
    out.fa_arrow_scroll = { before: b, after: a, moved: a > b };
  }

  // swap to LSF
  await page.evaluate(() => document.getElementById('cls-btn-lsf').click());
  await page.waitForTimeout(800);
  out.swap_LSF_visible = await page.locator('#cls-track-lsf').isVisible();
  out.swap_FA_visible = await page.locator('#cls-track-fa').isVisible();
  out.lsf_cards = await page.locator('#cls-track-lsf .cls-course').count();
  out.lsf_imgs = await page.locator('#cls-track-lsf .cls-course-media img').evaluateAll(els => els.map(e => ({ src: e.getAttribute('src'), w: e.naturalWidth })));
  out.lsf_rail = await page.locator('#lsf-rail').evaluate(r => ({ sw: Math.round(r.scrollWidth), cw: Math.round(r.clientWidth) }));
  out.lsf_rail_scrollable = out.lsf_rail.sw > out.lsf_rail.cw + 2;
  await shootSection('/home/user/workspace/v3_clusters_lsf_1280.png', 1280);

  // toggle close LSF
  await page.evaluate(() => document.getElementById('cls-btn-lsf').click());
  await page.waitForTimeout(800);
  out.toggle_close_LSF_visible = await page.locator('#cls-track-lsf').isVisible();

  // overflow at 1280
  out.overflow_1280 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));

  // ---------- 390 ----------
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:8066/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  out.m_default_FA_visible = await page.locator('#cls-track-fa').isVisible();
  await page.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('in-view','is-visible','revealed','show','active')));
  await page.evaluate(() => document.getElementById('courses').scrollIntoView());
  await page.waitForTimeout(500);
  { const bb = await page.locator('#courses').boundingBox(); await page.screenshot({ path: '/home/user/workspace/v3_clusters_default_390.png', clip: { x: 0, y: Math.max(0, bb.y), width: 390, height: Math.min(bb.height, 900) } }); }

  await page.evaluate(() => document.getElementById('cls-btn-fa').click());
  await page.waitForTimeout(700);
  out.m_fa_visible = await page.locator('#cls-track-fa').isVisible();
  out.m_fa_cards = await page.locator('#cls-track-fa .cls-course').count();
  out.m_fa_rail = await page.locator('#fa-rail').evaluate(r => ({ sw: Math.round(r.scrollWidth), cw: Math.round(r.clientWidth) }));
  out.m_fa_rail_scrollable = out.m_fa_rail.sw > out.m_fa_rail.cw + 2;
  await page.evaluate(() => document.getElementById('courses').scrollIntoView());
  await page.waitForTimeout(400);
  { const bb = await page.locator('#courses').boundingBox(); await page.screenshot({ path: '/home/user/workspace/v3_clusters_fa_390.png', clip: { x: 0, y: Math.max(0, bb.y), width: 390, height: Math.min(bb.height, 1100) } }); }

  await page.evaluate(() => document.getElementById('cls-btn-lsf').click());
  await page.waitForTimeout(800);
  out.m_lsf_visible = await page.locator('#cls-track-lsf').isVisible();
  out.m_lsf_cards = await page.locator('#cls-track-lsf .cls-course').count();
  await page.evaluate(() => document.getElementById('courses').scrollIntoView());
  await page.waitForTimeout(400);
  { const bb = await page.locator('#courses').boundingBox(); await page.screenshot({ path: '/home/user/workspace/v3_clusters_lsf_390.png', clip: { x: 0, y: Math.max(0, bb.y), width: 390, height: Math.min(bb.height, 1100) } }); }

  out.overflow_390 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));

  // culture fold position check: is #culture before #courses and right after hero?
  out.section_order = await page.evaluate(() => Array.from(document.querySelectorAll('section')).map(s => s.id || s.className.split(' ')[0]).slice(0, 6));

  out.errors = errs;
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})();
