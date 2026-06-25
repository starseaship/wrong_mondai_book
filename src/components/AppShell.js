import { escapeHtml } from '../utils/html.js';

const titleMap = {
  home: ['错题本', '真实 Supabase 数据'],
  questions: ['错题列表', '按题复习'],
  filter: ['标签筛选', '按考试、能力和状态查找'],
  detail: ['错题详情', '完整选项和解析'],
  edit: ['编辑错题', '修改并保存'],
  vocab: ['生词本', '按词复习'],
  add: ['新增错题', '写入 Supabase'],
  review: ['刷题练习', '选择答案并记录复习']
};

export function AppShell(state, content) {
  const [title, subtitle] = titleMap[state.page] || titleMap.home;

  return `
    <div class="topbar">
      <div class="topbar-inner">
        <button class="brand" type="button" data-go="home">
          <span class="logo"><img src="/icons/icon-192.png" alt="错题本图标"></span>
          <span>
            <span class="brand-title">${escapeHtml(title)}</span>
            <span class="brand-sub">${escapeHtml(subtitle)}</span>
          </span>
        </button>
        <div class="top-actions">
          <span class="pill">Supabase</span>
          ${state.page !== 'home' ? '<button class="btn soft" type="button" data-go="home">首页</button>' : ''}
        </div>
      </div>
    </div>
    <main class="app">${content}</main>
    <nav class="bottom-nav" aria-label="主要导航">
      <button type="button" class="${state.page === 'home' ? 'active' : ''}" data-go="home">首页</button>
      <button type="button" class="${state.page === 'questions' || state.page === 'filter' || state.page === 'detail' || state.page === 'edit' ? 'active' : ''}" data-go="questions">错题</button>
      <button type="button" class="${state.page === 'review' ? 'active' : ''}" data-go="review">刷题</button>
      <button type="button" class="${state.page === 'vocab' ? 'active' : ''}" data-go="vocab">生词</button>
      <button type="button" class="${state.page === 'add' ? 'active' : ''}" data-go="add">新增</button>
    </nav>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
  `;
}
