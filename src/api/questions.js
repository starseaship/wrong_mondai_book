import { getSupabase } from './supabaseClient.js';
import { statusToReviewResult } from '../utils/reviewStatus.js';

function toStudyApiPayload(payload = {}) {
  const { options = [], vocabulary_items = [], vocabulary = [], ...question } = payload;

  return {
    question: {
      exam_category: question.exam_category,
      level: question.level,
      section: question.section,
      question_type: question.question_type,
      source_name: question.source_name,
      chapter: question.chapter,
      question_text: question.question_text,
      context_text: question.context_text,
      my_answer_text: question.my_answer_text,
      ai_explanation: question.ai_explanation,
      error_reason_tags: question.error_reason_tags,
      target_terms: question.target_terms,
      status: question.status,
      source_method: question.source_method || 'manual'
    },
    options: options.map(option => ({
      option_text: option.option_text,
      original_label: option.original_label || option.label || null,
      label: option.label || option.original_label || null,
      is_correct: Boolean(option.is_correct),
      is_my_answer: Boolean(option.is_my_answer)
    })),
    vocabulary: vocabulary.length ? vocabulary : vocabulary_items
  };
}

async function throwFunctionError(error) {
  if (!error) return;

  const response = error.context;
  if (response && typeof response.clone === 'function') {
    try {
      const body = await response.clone().json();
      if (body?.error) throw new Error(body.error);
      if (body?.message) throw new Error(body.message);
    } catch (innerError) {
      if (innerError instanceof Error && (innerError.message?.startsWith('{') || innerError.message?.includes(' is required') || innerError.message?.includes(' is invalid'))) {
        throw innerError;
      }
    }
  }

  throw error;
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
  return Array.isArray(data) ? data : [];
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
  return Array.isArray(data) ? data : [];
}

export async function addQuestion(payload) {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('study-api', {
    body: { action: 'add_question', payload: toStudyApiPayload(payload) }
  });

  if (error) await throwFunctionError(error);
  if (data?.ok === false) throw new Error(data.error || 'add_question failed');
  return data?.data ?? data;
}

export async function updateQuestion(questionId, payload) {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('study-api', {
    body: { action: 'update_question', payload: { id: questionId, ...toStudyApiPayload(payload) } }
  });

  if (error) await throwFunctionError(error);
  if (data?.ok === false) throw new Error(data.error || 'update_question failed');
  return data?.data ?? data;
}

export async function updateQuestionStatus(questionId, status) {
  return markQuestionReviewed(questionId, statusToReviewResult(status), status);
}

export async function markQuestionReviewed(questionId, result = 'reviewed', newStatus = null) {
  const supabase = getSupabase();
  const payload = { id: questionId, result };
  if (newStatus) payload.new_status = newStatus;

  const { data, error } = await supabase.functions.invoke('study-api', {
    body: { action: 'mark_question_reviewed', payload }
  });

  if (error) await throwFunctionError(error);
  if (data?.ok === false) throw new Error(data.error || 'mark_question_reviewed failed');
  return data?.data ?? data;
}
