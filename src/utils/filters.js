export const filterConfig = {
  exams: ['JLPT', 'TOEIC', 'EJU', 'TOEFL', 'IELTS', 'School'],
  skills: ['语法 / 文法', '词汇 / Vocabulary', '阅读 / Reading', '听力 / Listening', '写作 / Writing', '口语 / Speaking'],
  levels: ['N5', 'N4', 'N3', 'N2', 'N1', 'A1', 'A2', 'B1', 'B2', 'C1', 'TOEIC 500', 'TOEIC 700', 'EJU 基础', 'EJU 进阶'],
  statuses: ['all', 'unmastered', 'uncertain', 'mastered']
};

export const statusMeta = {
  unmastered: ['未掌握', 'pink'],
  uncertain: ['模糊', 'yellow'],
  mastered: ['已掌握', 'green'],
  all: ['全部状态', '']
};

export function getStatusLabel(status) {
  return statusMeta[status]?.[0] || status || '未填写';
}

export function getStatusColor(status) {
  return statusMeta[status]?.[1] || '';
}

export function matchesSearch(item, query, fields = []) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return true;
  return fields.some(field => String(item?.[field] || '').toLowerCase().includes(normalized));
}

export function firstItemId(items) {
  return Array.isArray(items) && items.length ? items[0].id : null;
}
