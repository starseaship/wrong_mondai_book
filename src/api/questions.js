import { getSupabase } from './supabaseClient.js';

async function enrichQuestionsWithTargetTerms(questions = []) {
  if (!Array.isArray(questions) || !questions.length) return [];

  const ids = questions.map(question => question.id).filter(Boolean);
  if (!ids.length) return questions;

  const supabase = getSupabase();
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
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('list_questions_by_filters_rpc', {
    p_exam_category: filters.examCategory ?? null,
    p_skill_group: filters.skillGroup ?? null,
    p_level: filters.level ?? null,
    p_section: filters.section ?? null,
    p_question_type: filters.questionType ?? null,
    p_status: filters.status === 'all' ? null : filters.status ?? null,
    p_limit: filters.limit ?? 80
  });

  if (error) throw error;
  return enrichQuestionsWithTargetTerms(Array.isArray(data) ? data : []);
}

export async function searchRelatedQuestions(keyword, filters = {}) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('search_related_questions_rpc', {
    p_keyword: keyword,
    p_exam_category: filters.examCategory ?? null,
    p_level: filters.level ?? null,
    p_section: filters.section ?? null,
    p_question_type: filters.questionType ?? null,
    p_status: filters.status === 'all' ? null : filters.status ?? null,
    p_limit: filters.limit ?? 80
  });

  if (error) throw error;
  return enrichQuestionsWithTargetTerms(Array.isArray(data) ? data : []);
}

export async function addQuestion(payload) {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('study-api', {
    body: { action: 'add_question', payload }
  });

  if (error) throw error;
  if (data?.ok === false) throw new Error(data.error || 'add_question failed');
  return data?.data ?? data;
}

export async function updateQuestionStatus(questionId, status) {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('study-api', {
    body: { action: 'update_question_status', payload: { question_id: questionId, status } }
  });

  if (error) throw error;
  if (data?.ok === false) throw new Error(data.error || 'update_question_status failed');
  return data?.data ?? data;
}

export async function markQuestionReviewed(questionId, result = 'reviewed') {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('study-api', {
    body: { action: 'mark_question_reviewed', payload: { question_id: questionId, result } }
  });

  if (error) throw error;
  if (data?.ok === false) throw new Error(data.error || 'mark_question_reviewed failed');
  return data?.data ?? data;
}
