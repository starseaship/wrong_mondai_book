export const examFilterConfig = {
  JLPT: {
    skills: ['语法 / 文法', '词汇 / Vocabulary', '阅读 / Reading', '听力 / Listening'],
    levels: ['N5', 'N4', 'N3', 'N2', 'N1']
  },
  TOEIC: {
    skills: ['语法 / 文法', '词汇 / Vocabulary', '阅读 / Reading', '听力 / Listening'],
    levels: ['Part 1', 'Part 2', 'Part 3', 'Part 4', 'Part 5', 'Part 6', 'Part 7', 'TOEIC 500', 'TOEIC 700']
  },
  EJU: {
    skills: ['语法 / 文法', '词汇 / Vocabulary', '阅读 / Reading', '听力 / Listening'],
    levels: ['基础', '进阶', '模拟题']
  },
  School: {
    skills: ['语法 / 文法', '词汇 / Vocabulary', '阅读 / Reading', '听力 / Listening'],
    levels: ['基础', '进阶', '复习']
  },
  阅读课: {
    skills: ['语法 / 文法', '词汇 / Vocabulary', '阅读 / Reading', '听力 / Listening'],
    levels: ['Chapter 3', 'Chapter 3.7', '复习']
  }
};

export const skillOptions = ['语法 / 文法', '词汇 / Vocabulary', '阅读 / Reading', '听力 / Listening'];

export const filterConfig = {
  exams: Object.keys(examFilterConfig),
  statuses: ['all', 'unmastered', 'uncertain', 'mastered']
};

export const statusMeta = {
  unmastered: ['未掌握', 'pink'],
  uncertain: ['模糊', 'yellow'],
  mastered: ['已掌握', 'green'],
  all: ['全部状态', '']
};

const skillKeywordRules = [
  {
    skill: '语法 / 文法',
    keywords: ['语法', '文法', 'grammar', '接续', '接続', '活用', '助词', '助詞', '句型']
  },
  {
    skill: '词汇 / Vocabulary',
    keywords: ['词汇', '語彙', 'vocabulary', '単語', '单词', '漢字', '汉字', '読み', '读音', '書き', '同义', '反义']
  },
  {
    skill: '阅读 / Reading',
    keywords: ['阅读', '読解', '读解', 'reading', '長文', '文章', '内容理解']
  },
  {
    skill: '听力 / Listening',
    keywords: ['听力', '聴解', '听解', 'listening', '听读解', '聴読解']
  }
];

export function getStatusLabel(status) {
  return statusMeta[status]?.[0] || status || '未填写';
}

export function getStatusColor(status) {
  return statusMeta[status]?.[1] || '';
}

export function getExamConfig(exam) {
  return examFilterConfig[exam] || examFilterConfig.JLPT;
}

export function matchesSearch(item, query, fields = []) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return true;
  return fields.some(field => String(item?.[field] || '').toLowerCase().includes(normalized));
}

export function firstItemId(items) {
  return Array.isArray(items) && items.length ? items[0].id : null;
}

export function getQuestionSkill(question = {}) {
  const rawSection = String(question.section || '').trim();
  if (skillOptions.includes(rawSection)) return rawSection;

  const text = [
    question.section,
    question.question_type,
    question.source_name,
    question.chapter,
    ...(question.error_reason_tags || [])
  ].join(' ').toLowerCase();

  const matched = skillKeywordRules.find(rule =>
    rule.keywords.some(keyword => text.includes(keyword.toLowerCase()))
  );

  return matched?.skill || rawSection || '未分类';
}

export function questionMatchesSkill(question = {}, skill = '') {
  if (!skill) return true;
  if (getQuestionSkill(question) === skill) return true;

  const text = [
    question.section,
    question.question_type,
    ...(question.error_reason_tags || [])
  ].join(' ').toLowerCase();

  const rule = skillKeywordRules.find(item => item.skill === skill);
  return Boolean(rule?.keywords.some(keyword => text.includes(keyword.toLowerCase())));
}
