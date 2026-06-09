import './main-vocab-sidebar.js';
import { applyStrictDomQuestionFilters, cardTags } from './questionFilters.js';

const listState = {
  exam: 'all',
  sort: 'created-desc'
};

function activeValue(selector, key) {
  const el = document.querySelector(`${selector}.active`);
  return el?.dataset?.[key] || '';
}

function difficultyScore(tags) {
  const level = tags.find(tag => /^N[1-5]$/.test(tag) || /^(500|600|700|800)$/.test(tag)) || '';
  if (/^N[1-5]$/.test(level)) {
    return 1000 - Number(level.slice(1)) * 100;
  }
  if (/^(500|600|700|800)$/.test(level)) {
    return Number(level);
  }
  return 0;
}

function ensureQuestionListTools() {
  const resultList = document.querySelector('.result-list');
  const title = Array.from(document.querySelectorAll('h1')).find(el => el.textContent.trim() === '错题列表');
  const topbar = document.querySelector('.results-topbar');
  if (!resultList || !title || !topbar || document.querySelector('.question-list-tools')) return;

  const tools = document.createElement('div');
  tools.className = 'question-list-tools card-soft';
  tools.innerHTML = `
    <div class="question-tool-group">
      <div class="subline">考试筛选</div>
      <div class="filter-row compact-tool-row">
        <button class="chip active" data-question-exam="all">全部</button>
        <button class="chip" data-question-exam="JLPT">JLPT</button>
        <button class="chip" data-question-exam="TOEIC">TOEIC</button>
      </div>
    </div>
    <div class="question-tool-group">
      <div class="subline">排序</div>
      <select class="select question-sort-select" id="questionSortSelect">
        <option value="created-desc">加入时间：新 → 旧</option>
        <option value="created-asc">加入时间：旧 → 新</option>
        <option value="difficulty-desc">难度：高 → 低</option>
        <option value="difficulty-asc">难度：低 → 高</option>
      </select>
    </div>
  `;
  topbar.insertAdjacentElement('afterend', tools);
}

function applyQuestionListTools() {
  ensureQuestionListTools();

  const resultList = document.querySelector('.result-list');
  const isQuestionList = Array.from(document.querySelectorAll('h1')).some(el => el.textContent.trim() === '错题列表');
  if (!resultList || !isQuestionList) return;

  const cards = Array.from(resultList.querySelectorAll('.result-card'));
  cards.forEach((card, index) => {
    if (!card.dataset.originalIndex) card.dataset.originalIndex = String(index);
  });

  const sorted = [...cards].sort((a, b) => {
    if (listState.sort === 'created-desc') return Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
    if (listState.sort === 'created-asc') return Number(b.dataset.originalIndex) - Number(a.dataset.originalIndex);
    const diff = difficultyScore(cardTags(b)) - difficultyScore(cardTags(a));
    if (listState.sort === 'difficulty-desc') return diff;
    if (listState.sort === 'difficulty-asc') return -diff;
    return 0;
  });

  sorted.forEach(card => resultList.appendChild(card));

  const count = applyStrictDomQuestionFilters({
    resultList,
    exam: listState.exam,
    level: '',
    status: '',
    emptyClassName: 'question-list-empty',
    emptyText: '没有找到符合当前考试筛选的错题。',
    countText: value => `${value} 条显示结果`
  });

  const heading = Array.from(document.querySelectorAll('.section-head h2')).find(el => el.textContent.includes('全部错题') || el.textContent.includes('JLPT 错题') || el.textContent.includes('TOEIC 错题'));
  if (heading) heading.textContent = listState.exam === 'all' ? '全部错题' : `${listState.exam} 错题`;
  const countLine = heading?.parentElement?.querySelector('p');
  if (countLine) countLine.textContent = `${count} 条显示结果`;

  document.querySelectorAll('[data-question-exam]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.questionExam === listState.exam);
  });
  const select = document.getElementById('questionSortSelect');
  if (select && select.value !== listState.sort) select.value = listState.sort;
}

function applyFilterFix() {
  const resultList = document.querySelector('.result-list');
  const isFilterPage = document.querySelector('[data-filter-level]') && document.querySelector('.filter-result-copy');
  if (!resultList || !isFilterPage) return;

  applyStrictDomQuestionFilters({
    resultList,
    exam: activeValue('[data-filter-exam]', 'filterExam'),
    level: activeValue('[data-filter-level]', 'filterLevel'),
    status: activeValue('[data-filter-status]', 'filterStatus'),
    countElement: document.querySelector('.filter-result-copy')
  });
}

function installToolStyles() {
  if (document.getElementById('questionToolStyles')) return;
  const style = document.createElement('style');
  style.id = 'questionToolStyles';
  style.textContent = `
    .question-list-tools {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 12px;
      margin: 0 0 12px;
      box-shadow: none;
    }
    .question-tool-group { display: grid; gap: 7px; }
    .compact-tool-row { gap: 7px; }
    .question-sort-select { min-width: 220px; }
    @media (max-width: 700px) {
      .question-list-tools { display: grid; align-items: stretch; }
      .question-sort-select { min-width: 0; }
    }
  `;
  document.head.appendChild(style);
}

function addMissingAnswerChoice() {
  const answerSelect = document.querySelector('select[name="my_label"]');
  if (!answerSelect) return;
  if (Array.from(answerSelect.options).some(option => option.value === 'B')) return;
  const cOption = Array.from(answerSelect.options).find(option => option.value === 'C');
  answerSelect.add(new Option('B', 'B'), cOption || undefined);
}

function runEnhancements() {
  installToolStyles();
  applyFilterFix();
  applyQuestionListTools();
  addMissingAnswerChoice();
}

function scheduleEnhancements() {
  requestAnimationFrame(runEnhancements);
}

document.addEventListener('click', event => {
  const examButton = event.target.closest('[data-question-exam]');
  if (examButton) {
    listState.exam = examButton.dataset.questionExam;
    scheduleEnhancements();
  }
  scheduleEnhancements();
}, true);

document.addEventListener('change', event => {
  if (event.target.id === 'questionSortSelect') {
    listState.sort = event.target.value;
    scheduleEnhancements();
  }
}, true);

window.addEventListener('input', scheduleEnhancements, true);
window.addEventListener('load', scheduleEnhancements);
setInterval(runEnhancements, 400);
scheduleEnhancements();
