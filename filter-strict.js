function getActiveFilterValue(selector) {
  return document.querySelector(`${selector}.active`)?.dataset?.[selector.replace('[data-', '').replace(']', '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())] || '';
}

const statusLabelMap = {
  unmastered: '未掌握',
  uncertain: '模糊',
  mastered: '已掌握',
  all: ''
};

function getDatasetValue(selector, key) {
  return document.querySelector(`${selector}.active`)?.dataset?.[key] || '';
}

function applyStrictLevelFilter() {
  const filterPage = document.querySelector('[data-filter-level]');
  const resultsTitle = [...document.querySelectorAll('h2')].find(el => el.textContent.trim() === '筛选结果');
  if (!filterPage || !resultsTitle) return;

  const resultList = document.querySelector('.result-list');
  if (!resultList) return;

  const activeExam = getDatasetValue('[data-filter-exam]', 'filterExam');
  const activeLevel = getDatasetValue('[data-filter-level]', 'filterLevel');
  const activeStatus = getDatasetValue('[data-filter-status]', 'filterStatus');
  const statusLabel = statusLabelMap[activeStatus] || '';

  let visibleCount = 0;
  const cards = [...resultList.querySelectorAll('.result-card')];

  cards.forEach(card => {
    const tags = [...card.querySelectorAll('.meta-tags .tag')].map(tag => tag.textContent.trim()).filter(Boolean);
    const examOk = !activeExam || tags.includes(activeExam);
    const levelOk = !activeLevel || tags.includes(activeLevel);
    const statusOk = !statusLabel || tags.includes(statusLabel);
    const shouldShow = examOk && levelOk && statusOk;

    card.hidden = !shouldShow;
    card.style.display = shouldShow ? '' : 'none';
    if (shouldShow) visibleCount += 1;
  });

  let empty = resultList.querySelector('.strict-filter-empty');
  if (!visibleCount) {
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'empty-note strict-filter-empty';
      resultList.appendChild(empty);
    }
    empty.textContent = '没有找到符合当前等级 / Part 的错题。';
  } else if (empty) {
    empty.remove();
  }

  const copy = document.querySelector('.filter-result-copy');
  if (copy) {
    copy.textContent = `列表里只预览四个普通选项，不显示对错。当前显示 ${visibleCount} 条结果。`;
  }
}

let scheduled = false;
function scheduleStrictFilter() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    applyStrictLevelFilter();
  });
}

new MutationObserver(scheduleStrictFilter).observe(document.body, { childList: true, subtree: true });
document.addEventListener('click', scheduleStrictFilter, true);
document.addEventListener('input', scheduleStrictFilter, true);
window.addEventListener('load', scheduleStrictFilter);
scheduleStrictFilter();
