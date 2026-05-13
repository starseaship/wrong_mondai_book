const stylesheetHref = '/styles-vocab-sidebar.css';
if (!document.querySelector(`link[href="${stylesheetHref}"]`)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = stylesheetHref;
  document.head.appendChild(link);
}

(async () => {
  const response = await fetch(`/main-vocab-sidebar.js?v=strict-${Date.now()}`, { cache: 'no-store' });
  let source = await response.text();

  source = source
    .replace(/^import ['"]\.\/styles-vocab-sidebar\.css['"];\s*/m, '')
    .replaceAll("from './mockData.js'", "from '/mockData.js'")
    .replaceAll("from './speech.js'", "from '/speech.js'")
    .replaceAll("from './api.js'", "from '/api.js'");

  source = source.replace(
    /const fallbackFiltered = baseFiltered\.length \? baseFiltered : state\.questions\.filter\(q => q\.exam_category === state\.filters\.exam\);\s*const finalFiltered = keyword \? fallbackFiltered\.filter\(q => questionMatchesKeyword\(q, keyword\)\) : fallbackFiltered;/,
    'const finalFiltered = keyword ? baseFiltered.filter(q => questionMatchesKeyword(q, keyword)) : baseFiltered;'
  );

  source = source.replace(
    'if (data?.length) state.questions = data.map(normalizeQuestion);',
    'if (Array.isArray(data)) state.questions = data.map(normalizeQuestion);'
  );

  if (source.includes('fallbackFiltered')) {
    console.warn('Strict filter patch did not remove fallbackFiltered.');
  }

  const blobUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  await import(blobUrl);
})().catch((error) => {
  console.error(error);
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = '<main class="app"><section class="panel hero"><h1>页面加载失败</h1><p>请刷新页面，或检查 main-vocab-sidebar-strict.js。</p></section></main>';
  }
});
