import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.includes('paste_your')
);

export const supabase = hasSupabaseConfig ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

async function enrichQuestionsWithTargetTerms(questions = []) {
  if (!supabase || !Array.isArray(questions) || !questions.length) return questions;

  const ids = questions.map(question => question.id).filter(Boolean);
  if (!ids.length) return questions;

  const { data, error } = await supabase
    .from('wrong_questions')
    .select('id,target_terms,context_text')
    .in('id', ids);

  if (error || !Array.isArray(data)) {
    if (error) console.warn('Failed to enrich target_terms', error);
    return questions;
  }

  const extrasById = new Map(data.map(row => [row.id, row]));
  return questions.map(question => {
    const extra = extrasById.get(question.id);
    const rpcTerms = Array.isArray(question.target_terms) ? question.target_terms : [];
    const tableTerms = Array.isArray(extra?.target_terms) ? extra.target_terms : [];
    return {
      ...question,
      target_terms: tableTerms.length ? tableTerms : rpcTerms,
      context_text: question.context_text || extra?.context_text || ''
    };
  });
}

export async function listQuestionsByFilters(filters = {}) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('list_questions_by_filters_rpc', {
    p_exam_category: filters.examCategory ?? null,
    p_skill_group: filters.skillGroup ?? null,
    p_level: filters.level ?? null,
    p_section: filters.section ?? null,
    p_question_type: filters.questionType ?? null,
    p_status: filters.status ?? null,
    p_limit: filters.limit ?? 50
  });
  if (error) throw error;
  return enrichQuestionsWithTargetTerms(Array.isArray(data) ? data : []);
}

export async function searchRelatedQuestions(keyword, filters = {}) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('search_related_questions_rpc', {
    p_keyword: keyword,
    p_exam_category: filters.examCategory ?? null,
    p_level: filters.level ?? null,
    p_section: filters.section ?? null,
    p_question_type: filters.questionType ?? null,
    p_status: filters.status ?? null,
    p_limit: filters.limit ?? 50
  });
  if (error) throw error;
  return enrichQuestionsWithTargetTerms(Array.isArray(data) ? data : []);
}

export async function listVocabulary() {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke('study-api', {
    body: { action: 'list_vocabulary', payload: { limit: 100 } }
  });
  if (error) throw error;
  if (data?.ok === false) throw new Error(data.error || 'list_vocabulary failed');
  return data?.data ?? data ?? [];
}

export async function addQuestion(payload) {
  if (!supabase) throw new Error('Supabase env vars are not configured');
  const { data, error } = await supabase.functions.invoke('study-api', {
    body: { action: 'add_question', payload }
  });
  if (error) throw error;
  if (data?.ok === false) throw new Error(data.error || 'add_question failed');
  return data?.data ?? data;
}

export async function updateQuestionStatus(questionId, status) {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke('study-api', {
    body: { action: 'update_question_status', payload: { question_id: questionId, status } }
  });
  if (error) throw error;
  if (data?.ok === false) throw new Error(data.error || 'update_question_status failed');
  return data?.data ?? data;
}

export async function markQuestionReviewed(questionId, result = 'reviewed') {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke('study-api', {
    body: { action: 'mark_question_reviewed', payload: { question_id: questionId, result } }
  });
  if (error) throw error;
  if (data?.ok === false) throw new Error(data.error || 'mark_question_reviewed failed');
  return data?.data ?? data;
}
