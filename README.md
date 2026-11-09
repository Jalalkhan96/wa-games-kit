<div align="center">

# 🎮 wa-games-kit

**Playable games for WhatsApp bots — HTML Snake, Flappy Bird & Dino Runner, plus tic-tac-toe and quiz chat games.**

[![npm version](https://img.shields.io/npm/v/wa-games-kit.svg)](https://www.npmjs.com/package/wa-games-kit)
[![license](https://img.shields.io/npm/l/wa-games-kit.svg)](./LICENSE)

Made by **[TEAM ABIX](https://github.com/Jalalkhan96)**

</div>

---

## 📥 Install

```bash
npm install wa-games-kit
```

## 🕹️ HTML games (playable, single-file, < 60 KB each)

| Game | Command idea | Controls |
|------|--------------|----------|
| 🐍 Snake | `-snake` | Arrows / on-screen pad / swipe |
| 🐤 Flappy Bird | `-flappy` | Tap / click / Space |
| 🦖 Dino Runner | `-dino` | Tap / click / Space — **player's own profile photo becomes the runner** |

```javascript
const W = require('wa-games-kit');

// one call: native in-chat play first, .html document fallback
await W.sendGame(sock, jid, 'snake');
await W.sendGame(sock, jid, 'dino', { personalize: true });  // fetch + inject the player's PFP
await W.sendGameDocument(sock, jid, 'flappy');               // guaranteed document route only

// raw HTML, if you want to host or send it your own way
const html = W.getGameHtml('snake');
```

**How it works:** WhatsApp has no official in-chat HTML rendering. The
native route packs the page into WhatsApp's observed rich-response HTML
payload; when a client rejects it, the same game arrives as an `.html`
document the user opens in a browser — the game always arrives playable
one way or the other. (Sender core also available standalone as
[wa-html-kit](https://www.npmjs.com/package/wa-html-kit).)

## ❌⭕ Chat games (pure engines, render as text)

```javascript
// Tic-tac-toe vs an unbeatable minimax bot (noob / pro / elite)
const board = Array(9).fill(null);
board[0] = 'X';
const botMove = W.tictactoe.botPlay(board, 'elite');
await sock.sendMessage(jid, { text: W.tictactoe.formatBoardPremium(board, 'neon') });
W.tictactoe.checkWinner(board);   // 'X' | 'O' | 'Draw' | null

// Quiz with score
const s = W.quiz.createQuiz();                    // 8 built-in questions, or pass your own
await sock.sendMessage(jid, { text: W.quiz.formatQuestion(s) });
const r = W.quiz.answer(s, 'B');                  // accepts 'A'–'D' or 0–3
await sock.sendMessage(jid, { text: W.quiz.formatResult(s) });
```

## 🎰 Arcade menu

```javascript
await sock.sendMessage(jid, { text: W.arcadeText('-') });
```

## 📖 API

- `GAMES` / `listGames()` — catalog: id, title, emoji, file, command, description
- `getGameHtml(id, { pfp })`, `getPfpDataUri(sock, jid)`
- `sendGame(sock, jid, id, { personalize, pfp, meta, trustedSources, caption, quoted })`
- `sendGameDocument(sock, jid, id, opts)`, `buildNativePayload(html, opts)`
- `arcadeText(prefix)`
- `tictactoe`: `checkWinner`, `botPlay`, `formatBoardPremium`, `THEMES`
- `quiz`: `SAMPLE_QUESTIONS`, `createQuiz`, `current`, `answer`, `formatQuestion`, `formatResult`

## License

MIT © TEAM ABIX
