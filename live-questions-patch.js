import { hasSupabaseConfig, listQuestionsByFilters } from './api.js';

const state = {
  loaded: false,
  loading: false,
  questions: []
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeOption(option, index, question) {
  const label = option.original_label || option.label || String.fromCharCode(65 + index);
  const mine = String(question.my_answer_text || '');
  const isMine = option.is_my_answer || mine.includes(label) || mine.includes(option.option_text || '');
  return { ...option, label, is_my_answer: isMine };
}

function normalizeQuestion(question) {
  return {
    ...question,
    question_options: (question.question_options || []).map((option, index) => normalizeOption(option, index, question))
  };
}

async function loadQuestions() {
  if (!hasSupabaseConfig || state.loading || state.loaded) return;
  state.loading = true;
  try {
    const questions = await listQuestionsByFilters({ limit: 100 });
    state.questions = Array.isArray(questions) ? questions.map(normalizeQuestion) : [];
    state.loaded = true;
  } catch (error) {
    console.warn('Failed to load live Supabase questions', error);
  } finally {
    state.loading = false;
  }
}

function statusLabel(status) {
  return {
    unmastered: '未掌握',
    uncertain: '模糊',
    mastered: '已掌握'
  }[status] || status || '未掌握';
}

function questionCard(question) {
  const options = (question.question_options || []).map(option => (
    `<span class="option-chip">${escapeHtml(option.label)}. ${escapeHtml(option.option_text)}</span>`
  )).join('');

  return `
    <article class="result-card live-question-card" data-live-question-id="${escapeHtml(question.id)}">
      <div class="meta-tags">
        <span class="tag">${escapeHtml(question.exam_category)}</span>
        <span class="tag lavender">${escapeHtml(question.level || question.section || '')}</span>
        <span class="tag teal">${escapeHtml(question.question_type || question.section || '')}</span>
        <span class="tag pink">${escapeHtml(statusLabel(question.status))}</span>
      </div>
      <h3>${escapeHtml(question.question_text)}</h3>
      <div class="compact-options">${options}</div>
      <div class="subline">来自 Supabase · ${escapeHtml((question.error_reason_tags || []).join(' / ') || '未填写')}</div>
      <div class="actions" style="margin-top:12px">
        <button class="btn secondary" data-live-detail="${escapeHtml(question.id)}">查看详情</button>
      </div>
    </article>
  `;
}

function latestPanel() {
  if (!state.questions.length) return '';
  const latest = state.questions.slice(0, 3).map(questionCard).join('');
  return `
    <section class="panel live-question-panel" data-live-question-panel>
      <div class="section-head">
        <div>
          <h2>Supabase 最新错题</h2>
          <p>这里显示数据库里的真实记录，不是本地示例数据。</p>
        </div>
      </div>
      <div class="result-list live-question-list">${latest}</div>
    </section>
  `;
}

function renderDetail(question) {
  const options = (question.question_options || []).map(option => {
    const cls = option.is_correct ? 'correct' : option.is_my_answer ? 'mine' : '';
    const note = option.is_correct ? '　正确答案' : option.is_my_answer ? '　我的答案' : '';
    return `<div class="option ${cls}">${escapeHtml(option.label)}. ${escapeHtml(option.option_text)}${note}</div>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.className = 'live-detail-overlay';
  overlay.innerHTML = `
    <div class="live-detail-backdrop" data-live-close></div>
    <section class="panel live-detail-modal">
      <div class="meta-tags">
        <span class="tag">${escapeHtml(question.exam_category)}</span>
        <span class="tag lavender">${escapeHtml(question.level || '')}</span>
        <span class="tag teal">${escapeHtml(question.question_type || question.section || '')}</span>
        <span class="tag pink">${escapeHtml(statusLabel(question.status))}</span>
      </div>
      <h2>${escapeHtml(question.question_text)}</h2>
      <h3>完整选项</h3>
      <div class="full-options">${options}</div>
      <h3>AI 解析</h3>
      <div class="explain">${escapeHtml(question.ai_explanation || '').replaceAll('\n', '<br>')}</div>
      <div class="actions" style="margin-top:16px"><button class="btn secondary" data-live-close>关闭</button></div>
    </section>
  `;
  document.body.appendChild(overlay);
}

function installStyles() {
  if (document.getElementById('liveQuestionsPatchStyles')) return;
  const style = document.createElement('style');
  style.id = 'liveQuestionsPatchStyles';
  style.textContent = `
    .live-question-panel { margin-top: 18px; }
    .live-question-card { border-color: rgba(121, 179, 174, 0.36); }
    .live-detail-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 18px; }
    .live-detail-backdrop { position: absolute; inset: 0; background: rgba(34, 40, 49, 0.42); backdrop-filter: blur(3px); }
    .live-detail-modal { position: relative; width: min(860px, 100%); max-height: min(86vh, 920px); overflow: auto; }
    .live-detail-modal h2 { margin: 12px 0 16px; }
    .live-detail-modal h3 { margin: 18px 0 10px; }
  `;
  document.head.appendChild(style);
}

function injectPanel() {
  if (!state.questions.length || document.querySelector('[data-live-question-panel]')) return;
  const app = document.querySelector('main.app');
  const hero = app?.querySelector('.panel.hero');
  if (!app || !hero) return;
  hero.insertAdjacentHTML('afterend', latestPanel());
}

function sync() {
  installStyles();
  injectPanel();
}

document.addEventListener('click', event => {
  const detailButton = event.target.closest('[data-live-detail]');
  if (detailButton) {
    const question = state.questions.find(item => item.id === detailButton.dataset.liveDetail);
    if (question) renderDetail(question);
  }

  if (event.target.closest('[data-live-close]')) {
    event.target.closest('.live-detail-overlay')?.remove();
  }
}, true);

loadQuestions().then(sync);
window.addEventListener('load', sync);
setInterval(sync, 700);
