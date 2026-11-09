'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const W = require('../index');

test('catalog lists 3 HTML games with real files under the 60 KB native limit', () => {
  const games = W.listGames();
  assert.deepStrictEqual(games.map(g => g.id), ['snake', 'flappy', 'dino']);
  for (const g of games) {
    const html = W.getGameHtml(g.id);
    assert.ok(html.includes('<!DOCTYPE html>'), g.id);
    assert.ok(Buffer.byteLength(html, 'utf8') < W.MAX_NATIVE_BYTES, `${g.id} too big`);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'games', g.file)), g.file);
  }
});

test('games are actually playable pages: canvas + input handlers present', () => {
  for (const id of ['snake', 'flappy', 'dino']) {
    const html = W.getGameHtml(id);
    assert.match(html, /<canvas/, id);
    assert.match(html, /addEventListener\('keydown'/, id);
  }
  assert.match(W.getGameHtml('snake'), /data-d="up"/);
  assert.match(W.getGameHtml('flappy'), /Space/);
});

test('unknown game throws with the valid list', () => {
  assert.throws(() => W.getGameHtml('tetris'), /unknown game.*snake/);
});

test('dino PFP placeholder is injected or blanked', () => {
  assert.ok(W.getGameHtml('dino', { pfp: 'data:image/jpeg;base64,ZZ' }).includes('data:image/jpeg;base64,ZZ'));
  assert.ok(!W.getGameHtml('dino').includes('{{PFP}}'));
  assert.ok(!W.getGameHtml('dino', {}).includes('{{PFP}}'));
});

test('sendGame: native relay first', async () => {
  const calls = [];
  const sock = {
    relayMessage: async (jid, payload) => { calls.push(['relay', jid, payload]); return { id: 'n1' }; },
    sendMessage: async () => { calls.push(['send']); return { id: 'd1' }; },
  };
  const out = await W.sendGame(sock, '1@s.whatsapp.net', 'snake');
  assert.strictEqual(out.id, 'n1');
  const data = JSON.parse(Buffer.from(calls[0][2].botForwardedMessage.message.richResponseMessage.unifiedResponse.data, 'base64').toString('utf8'));
  assert.ok(data.sections[0].view_model.primitive.payload.includes('Snake'));
});

test('sendGame: document fallback when relay fails or is missing', async () => {
  const sock = {
    relayMessage: async () => { throw new Error('rejected'); },
    sendMessage: async (jid, content) => ({ id: 'd1', content }),
  };
  const out = await W.sendGame(sock, '1@s.whatsapp.net', 'flappy');
  assert.strictEqual(out.id, 'd1');
  assert.strictEqual(out.content.mimetype, 'text/html');
  assert.strictEqual(out.content.fileName, 'flappy.html');
  const bare = { sendMessage: sock.sendMessage };
  const out2 = await W.sendGame(bare, '1@s.whatsapp.net', 'dino', { pfp: 'data:x' });
  assert.ok(out2.content.document.toString('utf8').includes('data:x'));
});

test('arcadeText lists every game with commands', () => {
  const t = W.arcadeText('-');
  assert.match(t, /GAME ARCADE/);
  assert.match(t, /-snake/);
  assert.match(t, /-flappy/);
  assert.match(t, /-dino/);
  assert.match(t, /Tic-Tac-Toe/);
});

test('tic-tac-toe engine: wins, draws, elite bot blocks and wins', () => {
  const T = W.tictactoe;
  assert.strictEqual(T.checkWinner(['X', 'X', 'X', null, null, null, null, null, null]), 'X');
  assert.strictEqual(T.checkWinner(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X']), 'Draw');
  assert.strictEqual(T.checkWinner(Array(9).fill(null)), null);
  // X threatens 0-1-2; elite O must block at 2
  assert.strictEqual(T.botPlay(['X', 'X', null, null, 'O', null, null, null, null], 'elite'), 2);
  // O can win at 2
  assert.strictEqual(T.botPlay(['O', 'O', null, 'X', 'X', null, null, null, null], 'elite'), 2);
  const board = T.formatBoardPremium(['X', null, null, null, 'O', null, null, null, null], 'neon');
  assert.match(board, /TIC TAC TOE/);
  assert.match(board, /⚡/);
});

test('quiz engine: full run scores correctly, letters accepted', () => {
  const Q = W.quiz;
  const s = Q.createQuiz(Q.SAMPLE_QUESTIONS.slice(0, 2));
  const c = Q.current(s);
  assert.strictEqual(c.number, 1);
  assert.strictEqual(c.total, 2);
  assert.match(Q.formatQuestion(s), /Question 1\/2/);
  const r1 = Q.answer(s, 'B'); // Islamabad — correct (index 1)
  assert.strictEqual(r1.correct, true);
  const r2 = Q.answer(s, 0); // JavaScript is index 2 — wrong
  assert.strictEqual(r2.correct, false);
  assert.strictEqual(r2.done, true);
  assert.strictEqual(s.score, 1);
  assert.match(Q.formatResult(s), /1\/2/);
  assert.throws(() => Q.answer(s, 0), /already finished/);
  const s2 = Q.createQuiz(Q.SAMPLE_QUESTIONS.slice(0, 1));
  assert.throws(() => Q.answer(s2, 9), /choice must be/);
});
