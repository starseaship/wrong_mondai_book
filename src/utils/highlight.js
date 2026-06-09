import { escapeHtml } from './html.js';

function termCandidates(value) {
  if (!value) return [];

  if (typeof value === 'string') {
    return value
      .split(/[、,，\n\t　]+/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'object') {
    return [
      value.term,
      value.target,
      value.word,
      value.text,
      value.surface,
      value.reading,
      value.label
    ].flatMap(termCandidates);
  }

  return [];
}

export function normalizeTargetTerms(targetTerms = []) {
  const source = Array.isArray(targetTerms) ? targetTerms : [targetTerms];
  const seen = new Set();

  return source
    .flatMap(termCandidates)
    .map(term => term.trim())
    .filter(term => {
      if (!term || seen.has(term)) return false;
      seen.add(term);
      return true;
    })
    .sort((a, b) => b.length - a.length);
}

export function highlightText(text = '', targetTerms = []) {
  const rawText = String(text ?? '');
  const terms = normalizeTargetTerms(targetTerms);

  if (!rawText || !terms.length) {
    return escapeHtml(rawText);
  }

  const lowerText = rawText.toLocaleLowerCase();
  const lowerTerms = terms.map(term => ({ raw: term, lower: term.toLocaleLowerCase() }));
  const parts = [];
  let cursor = 0;

  while (cursor < rawText.length) {
    let nextIndex = -1;
    let nextTerm = null;

    for (const term of lowerTerms) {
      const index = lowerText.indexOf(term.lower, cursor);
      if (index === -1) continue;
      if (nextIndex === -1 || index < nextIndex || (index === nextIndex && term.lower.length > nextTerm.lower.length)) {
        nextIndex = index;
        nextTerm = term;
      }
    }

    if (nextIndex === -1 || !nextTerm) {
      parts.push(escapeHtml(rawText.slice(cursor)));
      break;
    }

    if (nextIndex > cursor) {
      parts.push(escapeHtml(rawText.slice(cursor, nextIndex)));
    }

    const matched = rawText.slice(nextIndex, nextIndex + nextTerm.raw.length);
    parts.push(`<mark class="target-term">${escapeHtml(matched)}</mark>`);
    cursor = nextIndex + nextTerm.raw.length;
  }

  return parts.join('');
}
