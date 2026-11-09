export interface GameInfo { id: string; title: string; emoji: string; file: string; command: string; description: string }
export interface SendGameOptions {
  pfp?: string; personalize?: boolean; caption?: string; quoted?: any;
  trustedSources?: string[]; meta?: { messageContextInfo?: object; contextInfo?: object };
}
export const GAMES: GameInfo[];
export const MAX_NATIVE_BYTES: number;
export function listGames(): GameInfo[];
export function getGameHtml(id: string, opts?: { pfp?: string }): string;
export function getPfpDataUri(sock: any, jid: string): Promise<string>;
export function buildNativePayload(html: string, opts?: { title?: string; trustedSources?: string[]; meta?: object }): object;
export function sendGame(sock: any, jid: string, id: string, opts?: SendGameOptions): Promise<any>;
export function sendGameDocument(sock: any, jid: string, id: string, opts?: SendGameOptions & { html?: string }): Promise<any>;
export function arcadeText(prefix?: string): string;

export namespace tictactoe {
  function checkWinner(board: (string | null)[]): string | null;
  function botPlay(board: (string | null)[], level: 'noob' | 'pro' | 'elite'): number;
  function formatBoardPremium(board: (string | null)[], themeName?: string): string;
  const THEMES: Record<string, { x: string; o: string }>;
}
export namespace quiz {
  interface QuizQuestion { q: string; options: string[]; answer: number }
  interface QuizState { questions: QuizQuestion[]; index: number; score: number; done: boolean; history: object[] }
  const SAMPLE_QUESTIONS: QuizQuestion[];
  function createQuiz(questions?: QuizQuestion[], opts?: { shuffle?: boolean; limit?: number }): QuizState;
  function current(state: QuizState): { number: number; total: number; q: string; options: string[] } | null;
  function answer(state: QuizState, choice: number | string): { correct: boolean; correctIndex: number; score: number; done: boolean };
  function formatQuestion(state: QuizState): string;
  function formatResult(state: QuizState): string;
}
