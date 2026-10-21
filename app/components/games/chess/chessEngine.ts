// Chess AI Engine untuk Usick One Chess Arena
// Menggunakan Piece-Square Tables (PST), Alpha-Beta Pruning, Move Ordering, dan Quiescence Search
import { Chess, Move } from "chess.js";

export type ChessDifficulty = "easy" | "medium" | "hard";

// Bobot dasar bidak catur dalam centipawns
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-Square Tables (PST) dari sudut pandang Putih (8x8)
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
 -50,-40,-30,-30,-30,-30,-40,-50,
 -40,-20,  0,  0,  0,  0,-20,-40,
 -30,  0, 10, 15, 15, 10,  0,-30,
 -30,  5, 15, 20, 20, 15,  5,-30,
 -30,  0, 15, 20, 20, 15,  0,-30,
 -30,  5, 10, 15, 15, 10,  5,-30,
 -40,-20,  0,  5,  5,  0,-20,-40,
 -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_PST = [
 -20,-10,-10,-10,-10,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5, 10, 10,  5,  0,-10,
 -10,  5,  5, 10, 10,  5,  5,-10,
 -10,  0, 10, 10, 10, 10,  0,-10,
 -10, 10, 10, 10, 10, 10, 10,-10,
 -10,  5,  0,  0,  0,  0,  5,-10,
 -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_PST = [
 -20,-10,-10, -5, -5,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
   0,  0,  5,  5,  5,  5,  0, -5,
 -10,  5,  5,  5,  5,  5,  0,-10,
 -10,  0,  5,  0,  0,  0,  0,-10,
 -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_PST_MID = [
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -20,-30,-30,-40,-40,-30,-30,-20,
 -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20
];

function getSquareIndex(row: number, col: number): number {
  return row * 8 + col;
}

function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const baseVal = PIECE_VALUES[piece.type] || 0;
      let pstVal = 0;
      const idx = piece.color === "w" ? getSquareIndex(r, c) : getSquareIndex(7 - r, c);

      switch (piece.type) {
        case "p": pstVal = PAWN_PST[idx] || 0; break;
        case "n": pstVal = KNIGHT_PST[idx] || 0; break;
        case "b": pstVal = BISHOP_PST[idx] || 0; break;
        case "r": pstVal = ROOK_PST[idx] || 0; break;
        case "q": pstVal = QUEEN_PST[idx] || 0; break;
        case "k": pstVal = KING_PST_MID[idx] || 0; break;
      }

      const totalVal = baseVal + pstVal;
      if (piece.color === "w") {
        score += totalVal;
      } else {
        score -= totalVal;
      }
    }
  }

  return score;
}

// Quiescence Search untuk menghindari Horizon Effect pada saat ada capture beruntun
function quiescence(
  chess: Chess,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  depthLeft = 2
): number {
  const standPat = evaluateBoard(chess);
  if (depthLeft === 0) return standPat;

  if (isMaximizing) {
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    // Hanya evaluasi capture moves
    const captureMoves = chess.moves({ verbose: true }).filter((m) => m.captured);
    // Move ordering capture berdasarkan nilai bidak yang dimakan
    captureMoves.sort((a, b) => (PIECE_VALUES[b.captured || "p"] || 0) - (PIECE_VALUES[a.captured || "p"] || 0));

    for (const move of captureMoves) {
      chess.move(move);
      const score = quiescence(chess, alpha, beta, false, depthLeft - 1);
      chess.undo();

      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  } else {
    if (standPat <= alpha) return alpha;
    if (beta > standPat) beta = standPat;

    const captureMoves = chess.moves({ verbose: true }).filter((m) => m.captured);
    captureMoves.sort((a, b) => (PIECE_VALUES[b.captured || "p"] || 0) - (PIECE_VALUES[a.captured || "p"] || 0));

    for (const move of captureMoves) {
      chess.move(move);
      const score = quiescence(chess, alpha, beta, true, depthLeft - 1);
      chess.undo();

      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
    return beta;
  }
}

// Minimax dengan Alpha-Beta Pruning
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  shouldAbort: () => boolean
): { score: number; move?: Move } {
  if (shouldAbort()) {
    return { score: isMaximizing ? -999999 : 999999 };
  }

  if (chess.isGameOver()) {
    if (chess.isCheckmate()) {
      return { score: isMaximizing ? -50000 - depth : 50000 + depth };
    }
    return { score: 0 }; // Stalemate / draw
  }

  if (depth <= 0) {
    return { score: quiescence(chess, alpha, beta, isMaximizing, 2) };
  }

  const legalMoves = chess.moves({ verbose: true });
  // Move ordering: prioritas capture dan check terlebih dahulu
  legalMoves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) scoreA += 1000 + (PIECE_VALUES[a.captured] || 0) - (PIECE_VALUES[a.piece] || 0);
    if (b.captured) scoreB += 1000 + (PIECE_VALUES[b.captured] || 0) - (PIECE_VALUES[b.piece] || 0);
    if (a.promotion) scoreA += 800;
    if (b.promotion) scoreB += 800;
    return scoreB - scoreA;
  });

  let bestMove: Move | undefined = legalMoves[0];

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      if (shouldAbort()) break;
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false, shouldAbort).score;
      chess.undo();

      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = move;
      }
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Beta cut-off
    }
    return { score: maxEval, move: bestMove };
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      if (shouldAbort()) break;
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true, shouldAbort).score;
      chess.undo();

      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = move;
      }
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Alpha cut-off
    }
    return { score: minEval, move: bestMove };
  }
}

let currentSearchId = 0;

export function cancelChessSearch(): void {
  currentSearchId++;
}

/**
 * Mencari langkah terbaik untuk AI catur secara asinkron tanpa memblokir thread UI.
 */
export async function findBestMove(
  fen: string,
  difficulty: ChessDifficulty,
  aiColor: "w" | "b"
): Promise<Move | null> {
  const searchId = ++currentSearchId;
  const shouldAbort = () => searchId !== currentSearchId;

  // Jeda kecil agar render UI selesai sebelum komputasi
  await new Promise((resolve) => setTimeout(resolve, 80));
  if (shouldAbort()) return null;

  const chess = new Chess(fen);
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  // Mode EASY:
  // 40% kesempatan memilih langkah acak legal, atau pencarian depth 1
  if (difficulty === "easy") {
    if (Math.random() < 0.4) {
      const randomIdx = Math.floor(Math.random() * legalMoves.length);
      return legalMoves[randomIdx];
    }
    const result = minimax(chess, 1, -Infinity, Infinity, aiColor === "w", shouldAbort);
    return shouldAbort() ? null : result.move || legalMoves[0];
  }

  // Mode MEDIUM:
  // Pencarian depth 3 dengan piece-square tables
  if (difficulty === "medium") {
    const result = minimax(chess, 3, -Infinity, Infinity, aiColor === "w", shouldAbort);
    return shouldAbort() ? null : result.move || legalMoves[0];
  }

  // Mode HARD:
  // Pencarian depth 4 + quiescence search
  const result = minimax(chess, 4, -Infinity, Infinity, aiColor === "w", shouldAbort);
  return shouldAbort() ? null : result.move || legalMoves[0];
}
