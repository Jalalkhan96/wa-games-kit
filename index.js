'use strict';
/**
 * wa-games-kit — playable games for WhatsApp bots (Baileys).
 *
 * 1) HTML games: snake, flappy, dino — single-file pages under 60 KB,
 *    sent in-chat (native rich payload) or as an .html document.
 *    The dino game supports {{PFP}}: the player's own profile photo
 *    becomes the runner sprite.
 * 2) Chat games: tic-tac-toe (with an unbeatable minimax bot) and a
 *    quiz engine — pure state machines you render as text.
 * 3) An arcade menu text tying it together.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const tictactoe = require('./lib/tictactoe');
const quiz = require('./lib/quiz');

const GAMES_DIR = path.join(__dirname, 'games');
const MAX_NATIVE_BYTES = 60 * 1024;
const HTML_PRIMITIVE = 'GenAIaeacdsnwHtmlPrimitive';

const GAMES = [
  { id: 'snake', title: 'Snake', emoji: '🐍', file: 'snake.html', command: '-snake', description: 'Classic snake — eat, grow, do not bite yourself.' },
  { id: 'flappy', title: 'Flappy Bird', emoji: '🐤', file: 'flappy.html', command: '-flappy', description: 'Tap to flap through the pipes.' },
  { id: 'dino', title: 'Dino Runner', emoji: '🦖', file: 'dino.html', command: '-dino', description: 'Endless runner — your profile photo rides the dino.' },
];

const listGames = () => GAMES.map(g => ({ ...g }));

function findGame(id) {
  const g = GAMES.find(g => g.id === String(id || '').toLowerCase());
  if (!g) throw new Error(`wa-games-kit: unknown game "${id}" — try: ${GAMES.map(g => g.id).join(', ')}`);
  return g;
}

function getGameHtml(id, opts = {}) {
  const g = findGame(id);
  let html = fs.readFileSync(path.join(GAMES_DIR, g.file), 'utf8');
  if (html.includes('{{PFP}}')) html = html.split('{{PFP}}').join(opts.pfp || '');
  return html;
}

async function getPfpDataUri(sock, jid) {
  try {
    if (!jid || typeof sock?.profilePictureUrl !== 'function') return '';
    const url = await sock.profilePictureUrl(jid, 'image');
    if (!url || typeof fetch !== 'function') return '';
    const res = await fetch(url);
    if (!res.ok) return '';
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!/^image\//i.test(contentType)) return '';
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > 2 * 1024 * 1024) return '';
    return `data:${contentType};base64,${buf.toString('base64')}`;
  } catch {
    return '';
  }
}

// ─── sending (self-contained; same routes as wa-html-kit) ───
function buildNativePayload(html, { title, trustedSources = ['nixel.dev'], meta = {} } = {}) {
  if (Buffer.byteLength(html, 'utf8') > MAX_NATIVE_BYTES) {
    throw new Error('wa-games-kit: game HTML exceeds the 60 KB native limit');
  }
  const clone = (v) => JSON.parse(JSON.stringify(v ?? {}));
  return {
    messageContextInfo: clone(meta.messageContextInfo),
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: String(title || 'GAME') }],
          unifiedResponse: {
            data: Buffer.from(JSON.stringify({
              response_id: crypto.randomUUID(),
              sections: [{
                view_model: {
                  primitive: { __typename: HTML_PRIMITIVE, payload: html, trusted_sources: trustedSources },
                  __typename: 'GenAISingleLayoutViewModel',
                },
              }],
            }), 'utf8').toString('base64'),
          },
          contextInfo: clone(meta.contextInfo),
        },
      },
    },
  };
}

async function sendGameDocument(sock, jid, id, opts = {}) {
  const g = findGame(id);
  const html = opts.html || getGameHtml(id, { pfp: opts.pfp });
  return sock.sendMessage(jid, {
    document: Buffer.from(html, 'utf8'),
    mimetype: 'text/html',
    fileName: g.file,
    caption: opts.caption || `${g.emoji} *${g.title}* — open the file to play!`,
  }, opts.quoted ? { quoted: opts.quoted } : undefined);
}

// Native in-chat play first; document fallback so the game always arrives.
// opts: { pfp?, personalize? (fetch PFP from sock), meta?, trustedSources?, caption?, quoted? }
async function sendGame(sock, jid, id, opts = {}) {
  const g = findGame(id);
  let pfp = opts.pfp;
  if (pfp === undefined && opts.personalize) pfp = await getPfpDataUri(sock, jid);
  const html = getGameHtml(id, { pfp });
  try {
    if (typeof sock?.relayMessage !== 'function') throw new Error('no relayMessage');
    const payload = buildNativePayload(html, { title: g.title, trustedSources: opts.trustedSources, meta: opts.meta });
    return await sock.relayMessage(jid, payload, opts.quoted ? { quoted: opts.quoted } : {});
  } catch {
    return sendGameDocument(sock, jid, id, { ...opts, html });
  }
}

// ─── arcade menu ───
function arcadeText(prefix = '-') {
  const lines = GAMES.map(g => `${g.emoji} *${g.title}* — ${prefix}${g.id}\n   ${g.description}`);
  return [
    '🎮 *GAME ARCADE* 🎮',
    '',
    ...lines,
    '',
    '❌⭕ *Tic-Tac-Toe* — chat game vs bot (noob / pro / elite)',
    '❓ *Quiz* — chat quiz with score',
    '',
    'Pick a game and play! 🕹️',
  ].join('\n');
}

module.exports = {
  GAMES,
  listGames,
  getGameHtml,
  getPfpDataUri,
  buildNativePayload,
  sendGame,
  sendGameDocument,
  arcadeText,
  tictactoe,
  quiz,
  MAX_NATIVE_BYTES,
};
