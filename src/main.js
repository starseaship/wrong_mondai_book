import './styles.css';
import { mockQuestions, mockVocabulary, filterConfig } from './mockData.js';
import { speakWord } from './speech.js';
import { hasSupabaseConfig, listQuestionsByFilters, listVocabulary, addQuestion, updateQuestionStatus, markQuestionReviewed } from './api.js';

const app = document.getElementById('app');

let state = {
  page: 'home',
  selectedQuestionId: 'q1',
  selectedVocabId: 'v1',
  questions: [...mockQuestions],
  vocabulary: [...mockVocabulary],
  filters: {
    exam: 'JLPT',
    skill: '语法 / 文法',
    level: 'N3',
    status: 'all'
  },
  vocabFilters: {
    exam: 'all',
    status: 'all',
    query: ''
  },
  search: ''
};

const statusMeta = {
  unmastered: ['未掌握', 'pink'],
  uncertain: ['模糊', 'yellow'],
  mastered: ['已掌握', 'green'],
  all: ['全部状态', '']
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeQuestion(raw) {
  return {
    id: raw.id,
    exam_category: raw.exam_category,
    level: raw.level,
    section: raw.section,
    question_type: raw.question_type,
    status: raw.status || 'unmastered',
    source_name: raw.source_name || '',
    chapter: raw.chapter || '',
    question_text: raw.question_text || '',
    my_answer_text: raw.my_answer_text || '',
    ai_explanation: raw.ai_explanation || '',
    error_reason_tags: raw.error_reason_tags || [],
    last_reviewed_at: raw.last_reviewed_at ? new Date(raw.last_reviewed_at).toLocaleDateString() : '未复习',
    question_options: raw.question_options || [],
    vocabulary_items: raw.vocabulary_items || []
  };
}

function statusTag(status) {
  const [label, cls] = statusMeta[status] || statusMeta.unmastered;
  return `<span class="tag ${cls}">${label}</span>`;
}

function go(page, data = {}) {
  state.page = page;
  Object.assign(state, data);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function appShell(content) {
  const titleMap = {
    home: ['错题本', 'JLPT / TOEIC · PWA'],
    filter: ['标签筛选', '列表只显示普通选项，详情页再显示答案'],
    questions: ['错题本', '按题复习'],
    detail: ['错题详情', '完整选项和解析'],
    vocab: ['生词本', '点击浏览器发音'],
    add: ['新增错题', '先手动录入，之后可接 AI 分析'],
    review: ['闪卡复习', '当前题选项独立随机']
  };
  const [title, sub] = titleMap[state.page] || titleMap.home;
  return `
    <div class="topbar">
      <div class="topbar-inner">
        <div class="brand" role="button" data-go="home">
          <div class="logo"><img src="/icons/icon-192.png" alt="错题本图标"></div>
          <div>
            <div class="brand-title">${title}</div>
            <div class="brand-sub">${sub}</div>
          </div>
        </div>
        <div class="top-actions">
          <span class="pill">${hasSupabaseConfig ? 'Supabase 已配置' : 'Demo 模式'}</span>
          ${state.page !== 'home' ? '<button class="btn soft" data-go="home">首页</button>' : ''}
        </div>
      </div>
    </div>
    <main class="app">${content}</main>
    <nav class="bottom-nav">
      <button class="${state.page === 'home' ? 'active' : ''}" data-go="home">首页</button>
      <button class="${state.page === 'filter' ? 'active' : ''}" data-go="filter">筛选</button>
      <button class="${state.page === 'vocab' ? 'active' : ''}" data-go="vocab">生词</button>
      <button class="${state.page === 'add' ? 'active' : ''}" data-go="add">新增</button>
    </nav>
    <div class="toast" id="toast"></div>
  `;
}

function renderHome() {
  return appShell(`
    <section class="panel hero">
      <h1>错题复习本</h1>
      <div class="quick-grid">
        <article class="quick-card" data-go="add"><strong>新增错题</strong><span>录入题目、四个选项、答案、解析和生词。</span></article>
        <article class="quick-card" data-go="questions"><strong>查看错题本</strong><span>快速浏览题目，列表里只显示普通选项。</span></article>
        <article class="quick-card" data-go="vocab"><strong>打开生词本</strong><span>查词、发音、回到对应错题。</span></article>
        <article class="quick-card" data-go="filter"><strong>标签筛选</strong><span>JLPT / TOEIC → 分类 → 等级或 Part。</span></article>
      </div>
    </section>
  `);
}

function questionCard(q, compact = true) {
  const optionChips = (q.question_options || []).map((op, i) => {
    const label = op.label || String.fromCharCode(65 + i);
    return `<span class="option-chip">${escapeHtml(label)}. ${escapeHtml(op.option_text)}</span>`;
  }).join('');

  return `
    <article class="result-card">
      <div class="meta-tags">
        <span class="tag">${escapeHtml(q.exam_category)}</span>
        <span class="tag lavender">${escapeHtml(q.level || q.section || '')}</span>
        <span class="tag teal">${escapeHtml(q.question_type || q.section || '')}</span>
        ${statusTag(q.status)}
      </div>
      <h3>${escapeHtml(q.question_text)}</h3>
      <div class="compact-options">${optionChips}</div>
      <div class="subline">错因：${escapeHtml((q.error_reason_tags || []).join(' / ') || '未填写')} · 上次复习：${escapeHtml(q.last_reviewed_at || '未复习')}</div>
      <div class="actions" style="margin-top:12px">
        <button class="btn secondary" data-detail="${q.id}">查看详情</button>
        <button class="btn" data-review-one="${q.id}">加入本轮复习</button>
      </div>
    </article>
  `;
}

function renderQuestions() {
  const keyword = state.search.trim().toLowerCase();
  let qs = state.questions;
  if (keyword) {
    qs = qs.filter(q => [q.question_text, q.ai_explanation, q.my_answer_text, q.source_name, q.chapter, ...(q.error_reason_tags || [])].join(' ').toLowerCase().includes(keyword));
  }
  return appShell(`
    <section class="panel hero">
      <h1>错题列表</h1>
      <p>列表只显示题目和普通选项，不提前暴露正确答案。认真看解析时再点详情。</p>
    </section>
    <section class="panel">
      <div class="results-topbar">
        <div class="section-head" style="margin:0"><div><h2>全部错题</h2><p>${qs.length} 条显示结果</p></div></div>
        <div class="search-box"><span>🔎</span><input id="questionSearch" value="${escapeHtml(state.search)}" placeholder="搜索题目、解析或错因"></div>
      </div>
      <div class="result-list">${qs.map(q => questionCard(q)).join('') || '<div class="empty-note">没有找到错题。</div>'}</div>
    </section>
  `);
}

function renderFilter() {
  const cfg = filterConfig[state.filters.exam];
  const filtered = state.questions.filter(q => {
    const examOk = q.exam_category === state.filters.exam;
    const skillOk = !state.filters.skill || [q.question_type, q.section, ...(q.error_reason_tags || [])].join(' ').includes(state.filters.skill.split(' ')[0]);
    const levelOk = !state.filters.level || q.level === state.filters.level || q.section === state.filters.level;
    const statusOk = state.filters.status === 'all' || q.status === state.filters.status;
    return examOk && (skillOk || q.question_type === state.filters.skill) && levelOk && statusOk;
  });

  return appShell(`
    <section class="panel hero">
      <h1>按标签找错题</h1>
      <p>第一层选 JLPT / TOEIC，第二层选错误或能力分类，第三层选等级或 Part。列表里的选项全部普通显示。</p>
      <div class="pills">
        <span class="pill">当前：${state.filters.exam}</span>
        <span class="pill">分类：${state.filters.skill}</span>
        <span class="pill">等级 / Part：${state.filters.level}</span>
      </div>
    </section>
    <section class="layout">
      <aside class="panel">
        ${filterBlock('1', '考试类别', '先决定进入 JLPT 还是 TOEIC', ['JLPT', 'TOEIC'], state.filters.exam, 'filter-exam')}
        ${filterBlock('2', '错误 / 能力分类', '根据 JLPT / TOEIC 自动切换', cfg.skills, state.filters.skill, 'filter-skill')}
        ${filterBlock('3', '等级 / Part', 'JLPT 显示 N 级，TOEIC 显示 Part 或目标分', cfg.levels, state.filters.level, 'filter-level')}
        ${filterBlock('＋', '可选补充筛选', '状态筛选不放第一层', ['all', 'unmastered', 'uncertain', 'mastered'], state.filters.status, 'filter-status', true)}
        <div class="actions" style="margin-top:14px">
          <button class="btn" id="refreshFilter">查看符合条件的错题</button>
          <button class="btn secondary" data-go="review">直接开始复习</button>
          <button class="btn soft" id="resetFilter">重置筛选</button>
        </div>
      </aside>
      <section class="panel">
        <div class="results-topbar">
          <div class="section-head" style="margin:0"><div><h2>筛选结果</h2><p>列表里只预览四个普通选项，不显示对错</p></div></div>
          <div class="search-box"><span>🔎</span><input id="filterSearch" value="${escapeHtml(state.search)}" placeholder="在当前结果里再搜词汇"></div>
        </div>
        <div class="result-list">${(filtered.length ? filtered : state.questions.filter(q => q.exam_category === state.filters.exam)).map(q => questionCard(q)).join('')}</div>
      </section>
    </section>
  `);
}

function filterBlock(num, title, sub, items, active, kind, isStatus = false) {
  return `
    <div class="section">
      <div class="step-row"><div class="step-badge">${num}</div><div><strong>${title}</strong><div class="subline">${sub}</div></div></div>
      <div class="card-soft"><div class="filter-row">
        ${items.map(item => {
          const label = isStatus ? (statusMeta[item]?.[0] || item) : item;
          return `<button class="chip ${active === item ? 'active' : ''}" data-${kind}="${escapeHtml(item)}">${escapeHtml(label)}</button>`;
        }).join('')}
      </div></div>
    </div>`;
}

function renderQuestionDetail() {
  const q = state.questions.find(x => x.id === state.selectedQuestionId) || state.questions[0];
  const options = (q.question_options || []).map((op, i) => {
    const label = op.label || String.fromCharCode(65 + i);
    const cls = op.is_correct ? 'correct' : op.is_my_answer ? 'mine' : '';
    const note = op.is_correct ? '　正确答案' : op.is_my_answer ? '　我的答案' : '';
    return `<div class="option ${cls}">${escapeHtml(label)}. ${escapeHtml(op.option_text)}${note}</div>`;
  }).join('');
  const vocab = (q.vocabulary_items || []).map(v => `
    <div class="linked-item">
      <div class="linked-item-title">${escapeHtml(v.word)}</div>
      <div class="reading">${escapeHtml(v.reading || '')}</div>
      <div class="subline">${escapeHtml(v.meaning_zh || '')} · ${escapeHtml(v.meaning_en || '')}</div>
    </div>`).join('') || '<div class="empty-note">暂无关联生词。</div>';

  return appShell(`
    <section class="panel hero">
      <div class="meta-tags"><span class="tag">${q.exam_category}</span><span class="tag lavender">${q.level}</span><span class="tag teal">${q.question_type || q.section}</span>${statusTag(q.status)}</div>
      <h1>${escapeHtml(q.question_text)}</h1>
      <p>详情页才显示正确答案、我的答案和解析。</p>
      <div class="actions"><button class="btn secondary" data-go="${state.lastListPage || 'questions'}">返回列表</button><button class="btn" data-review-one="${q.id}">加入复习</button></div>
    </section>
    <section class="detail-layout">
      <div class="panel"><h2>完整选项</h2><div class="full-options">${options}</div></div>
      <div class="panel"><h2>AI 解析</h2><div class="explain">${escapeHtml(q.ai_explanation).replaceAll('\n','<br>')}</div></div>
      <div class="panel"><h2>相关生词 / 语法点</h2><div class="linked-list">${vocab}</div></div>
      <div class="panel"><h2>复习操作</h2><div class="actions" style="margin-top:0"><button class="btn danger" data-status="unmastered" data-qid="${q.id}">还不会</button><button class="btn secondary" data-status="uncertain" data-qid="${q.id}">有点模糊</button><button class="btn" data-status="mastered" data-qid="${q.id}">已掌握</button></div><div class="subline" style="margin-top:12px">正式版会写入 Supabase 状态和上次复习时间。</div></div>
    </section>
  `);
}

function renderVocab() {
  const { exam, status, query } = state.vocabFilters;
  const q = query.trim().toLowerCase();
  let list = state.vocabulary.filter(item => {
    const examOk = exam === 'all' || item.exam_category === exam;
    const statusOk = status === 'all' || item.status === status;
    const searchOk = !q || [item.word, item.reading, item.meaning_zh, item.meaning_en, item.example_sentence, item.note].join(' ').toLowerCase().includes(q);
    return examOk && statusOk && searchOk;
  });
  if (!list.some(v => v.id === state.selectedVocabId) && list[0]) state.selectedVocabId = list[0].id;
  const selected = state.vocabulary.find(v => v.id === state.selectedVocabId) || list[0];

  return appShell(`
    <section class="panel hero"><h1>按词复习，也能回到对应错题</h1><p>点“发音”会调用浏览器语音。英语词默认 en-US，日语词默认 ja-JP。</p><div class="pills"><span class="pill">搜索生词</span><span class="pill">点击发音</span><span class="pill">关联错题</span></div></section>
    <section class="two-col">
      <section class="panel">
        <div class="results-topbar"><div class="section-head" style="margin:0"><div><h2>生词列表</h2><p>${list.length} 个结果</p></div></div><div class="search-box"><span>🔎</span><input id="vocabSearch" value="${escapeHtml(query)}" placeholder="搜索单词 / 中文 / 英文解释"></div></div>
        <div class="filter-row">${['all','JLPT','TOEIC'].map(x => `<button class="chip ${exam === x ? 'active' : ''}" data-vocab-exam="${x}">${x === 'all' ? '全部' : x}</button>`).join('')}</div>
        <div class="filter-row">${['all','unmastered','uncertain','mastered'].map(x => `<button class="chip ${status === x ? 'active' : ''}" data-vocab-status="${x}">${statusMeta[x]?.[0] || x}</button>`).join('')}</div>
        <div class="vocab-list">${list.map(vocabCard).join('') || '<div class="empty-note">没有找到符合条件的生词。</div>'}</div>
      </section>
      <section class="panel">${selected ? vocabDetail(selected) : '<div class="empty-note">从左边点一个单词，这里会显示详细信息。</div>'}</section>
    </section>
  `);
}

function vocabCard(v) {
  const [label, cls] = statusMeta[v.status] || statusMeta.unmastered;
  return `
    <article class="vocab-card ${v.id === state.selectedVocabId ? 'active' : ''}" data-vocab-id="${v.id}">
      <div class="meta-tags"><span class="tag">${v.exam_category}</span><span class="tag ${cls}">${label}</span><span class="tag lavender">${escapeHtml(v.part_of_speech || '')}</span></div>
      <div class="word-row"><div><div class="word">${escapeHtml(v.word)}</div><div class="reading">${escapeHtml(v.reading || '')}</div></div></div>
      <div class="meaning-zh">${escapeHtml(v.meaning_zh || '')}</div><div class="meaning-en">${escapeHtml(v.meaning_en || '')}</div>
      <div class="actions" style="margin-top:10px"><button class="btn secondary" data-speak-vocab="${v.id}">🔊 发音</button><button class="btn soft" data-select-vocab="${v.id}">查看详情</button></div>
    </article>`;
}

function vocabDetail(v) {
  const linked = (v.linked_question_ids || []).map(id => state.questions.find(q => q.id === id)).filter(Boolean);
  const linkedHtml = linked.map(q => `<div class="linked-item"><div class="linked-item-title">${escapeHtml(q.question_text)}</div><div class="reading">${escapeHtml(q.exam_category)} · ${escapeHtml(q.level)} · ${escapeHtml(q.section)}</div><div class="actions" style="margin-top:10px"><button class="btn soft" data-detail="${q.id}">查看这道错题</button></div></div>`).join('') || '<div class="empty-note">暂无关联错题。</div>';
  return `
    <div class="section-head"><div><h2>生词详情</h2><p>点击按钮即可浏览器发音</p></div></div>
    <div class="meta-tags"><span class="tag">${v.exam_category}</span>${statusTag(v.status)}<span class="tag lavender">${escapeHtml(v.part_of_speech || '')}</span></div>
    <div class="detail-word"><div><div class="word">${escapeHtml(v.word)}</div><div class="reading">${escapeHtml(v.reading || '')}</div></div><button class="btn secondary" data-speak-vocab="${v.id}">🔊 点击发音</button></div>
    <div class="info-grid"><div class="info-box"><h3>中文解释</h3><div>${escapeHtml(v.meaning_zh || '')}</div></div><div class="info-box"><h3>English definition</h3><div>${escapeHtml(v.meaning_en || '')}</div></div></div>
    <div class="example-box" style="margin-top:14px"><strong>例句</strong><br>${escapeHtml(v.example_sentence || '')}<br><br><strong>记忆提示</strong><br>${escapeHtml(v.note || '')}</div>
    <div class="info-box" style="margin-top:14px"><h3>对应错题</h3><div class="linked-list">${linkedHtml}</div></div>
  `;
}

function renderAdd() {
  return appShell(`
    <section class="panel hero"><h1>新增错题</h1><p>第一版先手动录入。之后可以把 AI 整理出来的 JSON 粘进来，再自动写入 Supabase。</p></section>
    <section class="panel">
      <form id="addForm" class="form-grid">
        <div class="form-field"><label>考试类别</label><select class="select" name="exam_category"><option>JLPT</option><option>TOEIC</option></select></div>
        <div class="form-field"><label>等级 / Part</label><input class="input" name="level" placeholder="N3 / Part 5 / 700"></div>
        <div class="form-field"><label>题型</label><input class="input" name="question_type" placeholder="语法 / 文法 / 固定搭配"></div>
        <div class="form-field"><label>来源</label><input class="input" name="source_name" placeholder="教材 / 模拟题"></div>
        <div class="form-field full-span"><label>题目</label><textarea class="textarea" name="question_text" placeholder="输入题目文本"></textarea></div>
        ${['A','B','C','D'].map(x => `<div class="form-field"><label>选项 ${x}</label><input class="input" name="option_${x}" placeholder="${x}. 选项内容"></div>`).join('')}
        <div class="form-field"><label>正确答案</label><select class="select" name="correct_label"><option>A</option><option>B</option><option>C</option><option>D</option></select></div>
        <div class="form-field"><label>我的答案</label><select class="select" name="my_label"><option value="">未填写</option><option>A</option><option>B</option><option>C</option><option>D</option></select></div>
        <div class="form-field full-span"><label>解析</label><textarea class="textarea" name="ai_explanation" placeholder="AI 解析或自己的错因记录"></textarea></div>
        <div class="form-field full-span"><label>错因标签</label><input class="input" name="error_reason_tags" placeholder="用逗号分隔，例如 词义辨析, 接续判断"></div>
        <div class="form-field full-span"><button class="btn full" type="submit">保存错题</button></div>
      </form>
    </section>
  `);
}

function renderReview() {
  const q = state.questions.find(x => x.id === state.selectedQuestionId) || state.questions[0];
  const shuffled = [...(q.question_options || [])].sort(() => Math.random() - 0.5);
  return appShell(`
    <section class="panel hero"><h1>闪卡复习</h1><p>每道错题只随机排列自己的四个选项，不会和其他题混在一起。</p></section>
    <section class="panel">
      <div class="meta-tags"><span class="tag">${q.exam_category}</span><span class="tag lavender">${q.level}</span>${statusTag(q.status)}</div>
      <h2>${escapeHtml(q.question_text)}</h2>
      <div class="full-options" style="margin-top:14px">${shuffled.map((op, i) => `<div class="option">${String.fromCharCode(65+i)}. ${escapeHtml(op.option_text)}</div>`).join('')}</div>
      <div class="actions" style="margin-top:16px"><button class="btn secondary" data-detail="${q.id}">看答案和解析</button><button class="btn" data-go="review">再随机一次</button></div>
    </section>
  `);
}

function render() {
  const pageMap = { home: renderHome, filter: renderFilter, questions: renderQuestions, detail: renderQuestionDetail, vocab: renderVocab, add: renderAdd, review: renderReview };
  app.innerHTML = (pageMap[state.page] || renderHome)();
  attachEvents();
}

function attachEvents() {
  document.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => go(el.dataset.go)));
  document.querySelectorAll('[data-detail]').forEach(el => el.addEventListener('click', () => go('detail', { selectedQuestionId: el.dataset.detail, lastListPage: state.page })));
  document.querySelectorAll('[data-review-one]').forEach(el => el.addEventListener('click', () => go('review', { selectedQuestionId: el.dataset.reviewOne })));

  document.querySelectorAll('[data-filter-exam]').forEach(btn => btn.addEventListener('click', async () => {
    const exam = btn.dataset.filterExam;
    const cfg = filterConfig[exam];
    state.filters.exam = exam;
    state.filters.skill = cfg.skills[0];
    state.filters.level = cfg.levels[0];
    await maybeRefreshFilteredQuestions();
    render();
  }));
  document.querySelectorAll('[data-filter-skill]').forEach(btn => btn.addEventListener('click', async () => { state.filters.skill = btn.dataset.filterSkill; await maybeRefreshFilteredQuestions(); render(); }));
  document.querySelectorAll('[data-filter-level]').forEach(btn => btn.addEventListener('click', async () => { state.filters.level = btn.dataset.filterLevel; await maybeRefreshFilteredQuestions(); render(); }));
  document.querySelectorAll('[data-filter-status]').forEach(btn => btn.addEventListener('click', async () => { state.filters.status = btn.dataset.filterStatus; await maybeRefreshFilteredQuestions(); render(); }));

  const resetFilter = document.getElementById('resetFilter');
  if (resetFilter) resetFilter.addEventListener('click', () => { state.filters = { exam: 'JLPT', skill: '语法 / 文法', level: 'N3', status: 'all' }; render(); });
  const refreshFilter = document.getElementById('refreshFilter');
  if (refreshFilter) refreshFilter.addEventListener('click', async () => { await maybeRefreshFilteredQuestions(); showToast('已刷新筛选结果'); render(); });

  const questionSearch = document.getElementById('questionSearch');
  if (questionSearch) questionSearch.addEventListener('input', e => { state.search = e.target.value; render(); });
  const filterSearch = document.getElementById('filterSearch');
  if (filterSearch) filterSearch.addEventListener('input', e => { state.search = e.target.value; render(); });

  document.querySelectorAll('[data-status]').forEach(btn => btn.addEventListener('click', async () => {
    const id = btn.dataset.qid;
    const status = btn.dataset.status;
    const q = state.questions.find(x => x.id === id);
    if (q) q.status = status;
    try {
      await updateQuestionStatus(id, status);
      await markQuestionReviewed(id, status === 'mastered' ? 'correct' : status === 'uncertain' ? 'uncertain' : 'wrong');
      showToast('复习状态已保存');
    } catch (err) {
      showToast(hasSupabaseConfig ? `保存失败：${err.message}` : 'Demo 模式：已在本页临时更新');
    }
    render();
  }));

  document.querySelectorAll('[data-vocab-exam]').forEach(btn => btn.addEventListener('click', () => { state.vocabFilters.exam = btn.dataset.vocabExam; render(); }));
  document.querySelectorAll('[data-vocab-status]').forEach(btn => btn.addEventListener('click', () => { state.vocabFilters.status = btn.dataset.vocabStatus; render(); }));
  const vocabSearch = document.getElementById('vocabSearch');
  if (vocabSearch) vocabSearch.addEventListener('input', e => { state.vocabFilters.query = e.target.value; render(); });
  document.querySelectorAll('[data-vocab-id], [data-select-vocab]').forEach(el => el.addEventListener('click', () => {
    const id = el.dataset.vocabId || el.dataset.selectVocab;
    state.selectedVocabId = id;
    render();
  }));
  document.querySelectorAll('[data-speak-vocab]').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const item = state.vocabulary.find(v => v.id === btn.dataset.speakVocab);
    if (item) speakWord(item.word, item.speak_lang || (item.exam_category === 'JLPT' ? 'ja-JP' : 'en-US'));
  }));

  const addForm = document.getElementById('addForm');
  if (addForm) addForm.addEventListener('submit', handleAddSubmit);
}

async function maybeRefreshFilteredQuestions() {
  if (!hasSupabaseConfig) return;
  try {
    const data = await listQuestionsByFilters({
      examCategory: state.filters.exam,
      skillGroup: state.filters.skill,
      level: state.filters.level,
      status: state.filters.status === 'all' ? null : state.filters.status,
      limit: 50
    });
    if (data?.length) state.questions = data.map(normalizeQuestion);
  } catch (err) {
    console.warn(err);
  }
}

async function handleAddSubmit(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const labels = ['A','B','C','D'];
  const correct = form.get('correct_label');
  const mine = form.get('my_label');
  const payload = {
    exam_category: form.get('exam_category'),
    level: form.get('level'),
    section: form.get('level'),
    question_type: form.get('question_type'),
    source_name: form.get('source_name'),
    question_text: form.get('question_text'),
    ai_explanation: form.get('ai_explanation'),
    my_answer_text: mine ? form.get(`option_${mine}`) : '',
    error_reason_tags: String(form.get('error_reason_tags') || '').split(',').map(x => x.trim()).filter(Boolean),
    options: labels.map(label => ({
      label,
      option_text: form.get(`option_${label}`),
      is_correct: label === correct,
      is_my_answer: label === mine
    })).filter(x => x.option_text),
    vocabulary_items: []
  };

  try {
    if (hasSupabaseConfig) await addQuestion(payload);
    const local = normalizeQuestion({ id: `local-${Date.now()}`, ...payload, question_options: payload.options, status: 'unmastered' });
    state.questions.unshift(local);
    state.selectedQuestionId = local.id;
    showToast(hasSupabaseConfig ? '错题已保存到 Supabase' : 'Demo 模式：已临时加入本页');
    go('detail', { selectedQuestionId: local.id });
  } catch (err) {
    showToast(`保存失败：${err.message}`);
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

async function init() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(console.warn));
  }

  if (hasSupabaseConfig) {
    try {
      const vocab = await listVocabulary();
      if (Array.isArray(vocab) && vocab.length) state.vocabulary = vocab.map(v => ({
        id: v.id,
        exam_category: v.exam_category || 'JLPT',
        status: v.status || 'unmastered',
        word: v.word,
        reading: v.reading,
        meaning_zh: v.meaning_zh,
        meaning_en: v.meaning_en,
        part_of_speech: v.part_of_speech,
        example_sentence: v.ai_example_sentence || v.example_sentence,
        note: v.note,
        speak_lang: v.exam_category === 'JLPT' ? 'ja-JP' : 'en-US',
        linked_question_ids: []
      }));
    } catch (err) {
      console.warn(err);
    }
  }
  render();
}

init();
