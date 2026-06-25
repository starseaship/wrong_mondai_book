import { escapeAttr, escapeHtml } from '../utils/html.js';
import { filterConfig, getQuestionSkill, skillOptions } from '../utils/filters.js';
import { DISPLAY_LABELS, getCorrectLabel, getMyLabel, getOptionValue } from '../utils/questionOptions.js';

function selectOptions(items, active) {
  return items.map(item => `<option value="${escapeAttr(item)}" ${active === item ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('');
}

export function QuestionForm({ question = null, mode = 'add' } = {}) {
  const isEdit = mode === 'edit';
  const formId = isEdit ? 'editForm' : 'addForm';
  const title = isEdit ? '编辑错题' : '新增错题';
  const buttonText = isEdit ? '保存修改' : '保存错题';
  const skill = skillOptions.includes(question?.section) ? question.section : getQuestionSkill(question || {});
  const tags = (question?.error_reason_tags || []).join(', ');

  return `
    <section class="panel hero compact-hero"><h1>${title}</h1><p>${isEdit ? '修改后会覆盖当前错题内容。' : '保存后会写入 Supabase。'}</p></section>
    <section class="panel form-panel">
      <form id="${formId}" class="form-grid">
        ${isEdit ? `<input type="hidden" name="id" value="${escapeAttr(question?.id || '')}">` : ''}
        <div class="form-field"><label>考试类别</label><select class="select" name="exam_category" required>${selectOptions(filterConfig.exams, question?.exam_category || 'JLPT')}</select></div>
        <div class="form-field"><label>等级 / Part</label><input class="input" name="level" value="${escapeAttr(question?.level || '')}" placeholder="N3 / Part 5 / 700"></div>
        <div class="form-field"><label>能力分类</label><select class="select" name="section" required>${selectOptions(skillOptions, skillOptions.includes(skill) ? skill : '语法 / 文法')}</select></div>
        <div class="form-field"><label>题型标签</label><input class="input" name="question_type" value="${escapeAttr(question?.question_type || '')}" placeholder="例：漢字書き選択 / Part 5"></div>
        <div class="form-field full-span"><label>来源</label><input class="input" name="source_name" value="${escapeAttr(question?.source_name || '')}" placeholder="教材 / 模拟题 / 课堂"></div>
        <div class="form-field full-span"><label>题目</label><textarea class="textarea" name="question_text" placeholder="输入题目文本" required>${escapeHtml(question?.question_text || '')}</textarea></div>
        ${DISPLAY_LABELS.map(label => `<div class="form-field"><label>选项 ${label}</label><input class="input" name="option_${label}" value="${escapeAttr(getOptionValue(question, label))}" placeholder="${label}. 选项内容"></div>`).join('')}
        <div class="form-field"><label>正确答案</label><select class="select" name="correct_label">${selectOptions(DISPLAY_LABELS, getCorrectLabel(question))}</select></div>
        <div class="form-field"><label>我的答案</label><select class="select" name="my_label"><option value="">未填写</option>${selectOptions(DISPLAY_LABELS, getMyLabel(question))}</select></div>
        <div class="form-field full-span"><label>解析</label><textarea class="textarea" name="ai_explanation" placeholder="AI 解析或自己的错因记录">${escapeHtml(question?.ai_explanation || '')}</textarea></div>
        <div class="form-field full-span"><label>错因标签</label><input class="input" name="error_reason_tags" value="${escapeAttr(tags)}" placeholder="用逗号分隔，例如 词义辨析, 接续判断"></div>
        <div class="form-field full-span form-actions">
          ${isEdit ? `<button class="btn soft" type="button" data-detail="${escapeAttr(question?.id || '')}">取消</button>` : ''}
          <button class="btn full" type="submit">${buttonText}</button>
        </div>
      </form>
    </section>
  `;
}
