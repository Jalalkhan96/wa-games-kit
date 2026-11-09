'use strict';
/**
 * Tiny quiz engine for chat games — no rendering, just state.
 * questions: [{ q, options: [..], answer: index }]
 */

const SAMPLE_QUESTIONS = [
  { q: 'What is the capital of Pakistan?', options: ['Karachi', 'Islamabad', 'Lahore', 'Peshawar'], answer: 1 },
  { q: 'Which language runs in the browser?', options: ['Python', 'C++', 'JavaScript', 'Rust'], answer: 2 },
  { q: '2 + 2 × 2 = ?', options: ['8', '6', '4', '2'], answer: 1 },
  { q: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], answer: 2 },
  { q: 'Water is made of hydrogen and…?', options: ['Carbon', 'Oxygen', 'Nitrogen', 'Helium'], answer: 1 },
  { q: 'How many players are on a cricket team on the field?', options: ['9', '10', '11', '12'], answer: 2 },
  { q: 'Which is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], answer: 3 },
  { q: 'What does "CPU" stand for?', options: ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Processing Utility'], answer: 0 },
];

function createQuiz(questions = SAMPLE_QUESTIONS, opts = {}) {
  if (!Array.isArray(questions) || !questions.length) throw new Error('wa-games-kit quiz: questions must be a non-empty array');
  const qs = opts.shuffle
    ? [...questions].sort(() => Math.random() - 0.5)
    : [...questions];
  return { questions: qs.slice(0, opts.limit || qs.length), index: 0, score: 0, done: false, history: [] };
}

function current(state) {
  if (!state || state.done) return null;
  const q = state.questions[state.index];
  return { number: state.index + 1, total: state.questions.length, q: q.q, options: [...q.options] };
}

function answer(state, choice) {
  if (!state || state.done) throw new Error('wa-games-kit quiz: quiz is already finished');
  const q = state.questions[state.index];
  const idx = typeof choice === 'string' && /^[a-d]$/i.test(choice.trim())
    ? choice.trim().toLowerCase().charCodeAt(0) - 97
    : Number(choice);
  if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) {
    throw new Error(`wa-games-kit quiz: choice must be 0-${q.options.length - 1} or a letter a-${'abcd'[q.options.length - 1]}`);
  }
  const correct = idx === q.answer;
  if (correct) state.score++;
  state.history.push({ q: q.q, picked: idx, correct });
  state.index++;
  if (state.index >= state.questions.length) state.done = true;
  return { correct, correctIndex: q.answer, score: state.score, done: state.done };
}

function formatQuestion(state) {
  const c = current(state);
  if (!c) return '🏁 Quiz finished!';
  const letters = ['A', 'B', 'C', 'D', 'E'];
  return `❓ *Question ${c.number}/${c.total}*\n\n${c.q}\n\n` +
    c.options.map((o, i) => `${letters[i]}. ${o}`).join('\n') +
    `\n\nReply with A, B, C or D`;
}

function formatResult(state) {
  const total = state.questions.length;
  const pct = Math.round((state.score / total) * 100);
  const medal = pct === 100 ? '🏆' : pct >= 70 ? '🥇' : pct >= 40 ? '🥈' : '💪';
  return `${medal} *Quiz finished!*\n\nScore: *${state.score}/${total}* (${pct}%)`;
}

module.exports = { SAMPLE_QUESTIONS, createQuiz, current, answer, formatQuestion, formatResult };
