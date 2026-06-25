import { escapeAttr, escapeHtml, nl2br } from '../utils/html.js';
import { getQuestionSkill, getStatusColor, getStatusLabel } from '../utils/filters.js';
import { highlightText } from '../utils/highlight.js';

export function StatusTag(status) {
  const color = getStatusColor(status);
  return `<span class="tag ${escapeAttr(color)}">${escapeHtml(getStatusLabel(status))}</span>`;
}

function SkillTag(question) {
  const skill = getQuestionSkill(question);
  return skill && skill !== '未分类' ? `<span class="tag teal">${escapeHtml(skill)}</span>` : '';
}

function TypeTag(question) {
  return question.question_type ? `<span class="tag mint">${escapeHtml(question.question_type)}</span>` : '';
}

export function QuestionCard(question) {
  const options = (question.question_options || [])
    .map((option, index) => {
      const label = option.label || option.original_label || String.fromCharCode(65 + index);
      return `<span class="option-chip">${escapeHtml(label)}. ${escapeHtml(option.option_text || '')}</span>`;
    })
    .join('');

  return `
    <article class="result-card">
      <div class="meta-tags">
        <span class="tag">${escapeHtml(question.exam_category)}</span>
        ${question.level ? `<span class="tag lavender">${escapeHtml(question.level)}</span>` : ''}
        ${SkillTag(question)}
        ${TypeTag(question)}
        ${StatusTag(question.status)}
      </div>
      <h3>${highlightText(question.question_text, question.target_terms)}</h3>
      <div class="compact-options">${options}</div>
      <div class="subline">错因：${escapeHtml((question.error_reason_tags || []).join(' / ') || '未填写')} · 上次复习：${escapeHtml(question.last_reviewed_at || '未复习')}</div>
      <div class="actions compact-actions">
        <button class="btn secondary compact" type="button" data-detail="${escapeAttr(question.id)}">详情</button>
        <button class="btn soft compact" type="button" data-edit="${escapeAttr(question.id)}">编辑</button>
        <button class="btn compact" type="button" data-review-one="${escapeAttr(question.id)}">复习</button>
      </div>
    </article>
  `;
}

export function QuestionDetail(question, lastListPage = 'questions') {
  if (!question) {
    return '<section class="panel"><div class="empty-note">没有找到这道错题。</div></section>';
  }

  const options = (question.question_options || [])
    .map((option, index) => {
      const label = option.label || option.original_label || String.fromCharCode(65 + index);
      const cls = option.is_correct ? 'correct' : option.is_my_answer ? 'mine' : '';
      const note = option.is_correct ? ' 正确答案' : option.is_my_answer ? ' 我的答案' : '';
      return `<div class="option ${escapeAttr(cls)}">${escapeHtml(label)}. ${escapeHtml(option.option_text || '')}<strong>${escapeHtml(note)}</strong></div>`;
    })
    .join('') || '<div class="empty-note">暂无选项。</div>';

  const vocab = (question.vocabulary_items || [])
    .map(item => `
      <div class="linked-item">
        <div class="linked-item-title">${escapeHtml(item.word || '')}</div>
        <div class="reading">${escapeHtml(item.reading || '')}</div>
        <div class="subline">${escapeHtml(item.meaning_zh || '')} · ${escapeHtml(item.meaning_en || '')}</div>
      </div>
    `)
    .join('') || '<div class="empty-note">暂无关联生词。</div>';

  return `
    <section class="panel hero detail-hero">
      <div class="meta-tags">
        <span class="tag">${escapeHtml(question.exam_category)}</span>
        ${question.level ? `<span class="tag lavender">${escapeHtml(question.level)}</span>` : ''}
        ${SkillTag(question)}
        ${TypeTag(question)}
        ${StatusTag(question.status)}
      </div>
      <h1>${highlightText(question.question_text, question.target_terms)}</h1>
      <p>详情页显示正确答案、我的答案、解析和关联生词。</p>
      <div class="actions compact-actions">
        <button class="btn secondary compact" type="button" data-go="${escapeAttr(lastListPage)}">返回列表</button>
        <button class="btn soft compact" type="button" data-edit="${escapeAttr(question.id)}">编辑</button>
        <button class="btn compact" type="button" data-review-one="${escapeAttr(question.id)}">加入复习</button>
      </div>
    </section>
    <section class="detail-layout compact-detail-layout">
      <div class="panel detail-panel"><h2>完整选项</h2><div class="full-options">${options}</div></div>
      <div class="panel detail-panel"><h2>解析</h2><div class="explain">${nl2br(question.ai_explanation || '')}</div></div>
      <div class="panel detail-panel"><h2>相关生词 / 语法点</h2><div class="linked-list">${vocab}</div></div>
      <div class="panel detail-panel">
        <h2>复习操作</h2>
        <div class="actions compact-actions">
          <button class="btn danger compact" type="button" data-status="unmastered" data-qid="${escapeAttr(question.id)}">还不会</button>
          <button class="btn secondary compact" type="button" data-status="uncertain" data-qid="${escapeAttr(question.id)}">有点模糊</button>
          <button class="btn compact" type="button" data-status="mastered" data-qid="${escapeAttr(question.id)}">已掌握</button>
        </div>
        <div class="subline">复习结果会写入 Supabase。</div>
      </div>
    </section>
  `;
}
