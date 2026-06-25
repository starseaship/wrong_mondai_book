import { escapeAttr, escapeHtml } from '../utils/html.js';
import { getQuestionSkill } from '../utils/filters.js';
import { highlightText } from '../utils/highlight.js';
import { getCorrectOption, getOptionDisplayLabel, getOrderedOptions } from '../utils/questionOptions.js';
import { StatusTag } from '../components/QuestionCard.js';

export function ReviewPage(state) {
  const practice = state.practice || {};
  const availableCount = state.questions.filter(question => (question.question_options || []).length >= 2).length;

  if (!availableCount) {
    return `
      <section class="panel hero center-panel">
        <h1>暂无可刷题目</h1>
        <p>至少需要一道含 2 个以上选项的错题。</p>
        <div class="actions"><button class="btn" type="button" data-go="add">新增错题</button></div>
      </section>
    `;
  }

  if (practice.completed) {
    const accuracy = practice.answered ? Math.round((practice.correct / practice.answered) * 100) : 0;
    return `
      <section class="panel hero center-panel">
        <h1>本轮刷题完成</h1>
        <p>答题 ${practice.answered} 道，正确 ${practice.correct} 道，正确率 ${accuracy}%。</p>
        <div class="actions">
          <button class="btn" type="button" data-practice-reset>再刷一轮</button>
          <button class="btn soft" type="button" data-go="questions">回错题列表</button>
        </div>
      </section>
    `;
  }

  const question = state.questions.find(item => item.id === state.practiceQuestionId) || state.questions.find(item => item.id === state.selectedQuestionId) || state.questions[0];
  if (!question) {
    return '<section class="panel"><div class="empty-note">暂无可复习错题。</div></section>';
  }

  const answered = Boolean(practice.selectedOptionKey);
  const correctOption = getCorrectOption(question);
  const correctLabel = correctOption ? getOptionDisplayLabel(correctOption, (question.question_options || []).indexOf(correctOption)) : '';
  const progress = `${Math.min((practice.index || 0) + 1, practice.queue?.length || 1)} / ${practice.queue?.length || availableCount}`;

  const optionButtons = getOrderedOptions(question, practice.optionOrder).map(({ key, option, index }) => {
    const displayLabel = getOptionDisplayLabel(option, index);
    const isSelected = practice.selectedOptionKey === key;
    const cls = answered && option.is_correct ? 'correct' : answered && isSelected ? 'mine' : '';
    const suffix = answered && option.is_correct ? ' 正确答案' : answered && isSelected && !option.is_correct ? ' 我的答案' : '';
    return `
      <button class="option ${escapeAttr(cls)}" style="width:100%;text-align:left;cursor:${answered ? 'default' : 'pointer'}" type="button" data-practice-answer="${escapeAttr(key)}" ${answered ? 'disabled' : ''}>
        ${escapeHtml(displayLabel)}. ${escapeHtml(option.option_text || '')}<strong>${escapeHtml(suffix)}</strong>
      </button>
    `;
  }).join('');

  const feedback = answered ? `
    <div class="explain">
      <strong>${practice.isCorrect ? '答对了。' : '答错了。'}</strong>
      ${correctOption ? `<br>正确答案：${escapeHtml(correctLabel)}. ${escapeHtml(correctOption.option_text || '')}` : ''}
      ${question.ai_explanation ? `<br><br>${escapeHtml(question.ai_explanation)}` : ''}
    </div>
    <div class="actions compact-actions">
      <button class="btn compact" type="button" data-practice-next>${practice.index >= practice.queue.length - 1 ? '完成本轮' : '下一题'}</button>
      <button class="btn soft compact" type="button" data-detail="${escapeAttr(question.id)}">查看详情</button>
    </div>
  ` : '<div class="subline">选择一个答案后，会立即显示正确答案并记录复习结果。</div>';

  return `
    <section class="panel hero compact-hero">
      <h1>刷题练习</h1>
      <p>随机抽题，点击选项后立刻判断对错。</p>
      <div class="pills">
        <span class="pill">进度：${escapeHtml(progress)}</span>
        <span class="pill">已答：${practice.answered || 0}</span>
        <span class="pill">正确：${practice.correct || 0}</span>
      </div>
    </section>
    <section class="panel detail-panel">
      <div class="meta-tags"><span class="tag">${escapeHtml(question.exam_category)}</span>${question.level ? `<span class="tag lavender">${escapeHtml(question.level)}</span>` : ''}<span class="tag teal">${escapeHtml(getQuestionSkill(question))}</span>${StatusTag(question.status)}</div>
      <h2>${highlightText(question.question_text, question.target_terms)}</h2>
      <div class="full-options">${optionButtons}</div>
      ${feedback}
    </section>
  `;
}
