import { getSupabase } from './supabaseClient.js';
import { imageVocabulary } from '../data/imageVocabulary.js';

const readingClassVocabulary = imageVocabulary.map(item => ({
  ...item,
  exam_category: '阅读课'
}));

function mergeVocabulary(primary = [], fallback = []) {
  const seen = new Set();
  const combined = [];

  for (const item of [...fallback, ...primary]) {
    const key = `${String(item.word || '').trim().toLowerCase()}::${String(item.reading || '').trim().toLowerCase()}`;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    combined.push(item);
  }

  return combined;
}

export async function listVocabulary({ limit = 120 } = {}) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.functions.invoke('study-api', {
      body: { action: 'list_vocabulary', payload: { limit } }
    });

    if (error) throw error;
    if (data?.ok === false) throw new Error(data.error || 'list_vocabulary failed');
    return mergeVocabulary(data?.data ?? data ?? [], readingClassVocabulary);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('listVocabulary fell back to local reading-class vocabulary:', error);
    }

    if (readingClassVocabulary.length) return readingClassVocabulary;
    throw error;
  }
}
