import { escapeAttr, escapeHtml } from '../utils/html.js';
import { StatusTag } from './QuestionCard.js';

export function VocabCard(item) {
  return `
    <article class="vocab-card ${item.isActive ? 'active' : ''}" data-select-vocab="${escapeAttr(item.id)}">
      <div class="meta-tags">
        <span class="tag">${escapeHtml(item.exam_category)}</span>
        ${StatusTag(item.status)}
        <span class="tag lavender">${escapeHtml(item.part_of_speech || '')}</span>
      </div>
      <div class="word-row">
        <div>
          <div class="word">${escapeHtml(item.word)}</div>
          <div class="reading">${escapeHtml(item.reading || '')}</div>
        </div>
      </div>
      <div class="meaning-zh">${escapeHtml(item.meaning_zh || '')}</div>
      <div class="meaning-en">${escapeHtml(item.meaning_en || '')}</div>
      <div class="actions">
        <button class="btn secondary" type="button" data-speak-vocab="${escapeAttr(item.id)}">发音</button>
        <button class="btn soft" type="button" data-select-vocab="${escapeAttr(item.id)}">查看详情</button>
      </div>
    </article>
  `;
}

export function VocabDetail(item, linkedQuestions = []) {
  if (!item) {
    return '<div class="empty-note">请选择一个生词。</div>';
  }

  const linkedHtml = linkedQuestions.length
    ? linkedQuestions.map(question => `
      <div class="linked-item">
        <div class="linked-item-title">${escapeHtml(question.question_text)}</div>
        <div class="reading">${escapeHtml(question.exam_category)} · ${escapeHtml(question.level || question.section || '')}</div>
        <div class="actions"><button class="btn soft" type="button" data-detail="${escapeAttr(question.id)}">查看这道错题</button></div>
      </div>
    `).join('')
    : '<div class="empty-note">暂无关联错题。</div>';

  return `
    <div class="section-head">
      <div>
        <h2>生词详情</h2>
        <p>点击按钮即可调用浏览器发音。</p>
      </div>
    </div>
    <div class="meta-tags">
      <span class="tag">${escapeHtml(item.exam_category)}</span>
      ${StatusTag(item.status)}
      <span class="tag lavender">${escapeHtml(item.part_of_speech || '')}</span>
    </div>
    <div class="detail-word">
      <div>
        <div class="word">${escapeHtml(item.word)}</div>
        <div class="reading">${escapeHtml(item.reading || '')}</div>
      </div>
      <button class="btn secondary" type="button" data-speak-vocab="${escapeAttr(item.id)}">发音</button>
    </div>
    <div class="info-grid">
      <div class="info-box"><h3>中文解释</h3><div>${escapeHtml(item.meaning_zh || '')}</div></div>
      <div class="info-box"><h3>English definition</h3><div>${escapeHtml(item.meaning_en || '')}</div></div>
    </div>
    <div class="example-box">
      <strong>例句</strong><br>${escapeHtml(item.example_sentence || '')}<br><br>
      <strong>记忆提示</strong><br>${escapeHtml(item.note || '')}
    </div>
    <div class="info-box">
      <h3>对应错题</h3>
      <div class="linked-list">${linkedHtml}</div>
    </div>
  `;
}
