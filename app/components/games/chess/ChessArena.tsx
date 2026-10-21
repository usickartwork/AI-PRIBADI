"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Chess, Square, Move, PieceSymbol, Color } from "chess.js";
import { ChessPieceIcon } from "./ChessPieces";
import {
  ChessDifficulty,
  findBestMove,
  cancelChessSearch,
} from "./chessEngine";
import { playChessSound } from "./chessAudio";
import {
  loadChessPreferences,
  saveChessPreferences,
  ChessPreferences,
} from "../common/gameStorage";

interface ChessArenaProps {
  isDark: boolean;
  onBackToHub: () => void;
}

const BOARD_THEMES: Record<
  "emerald" | "classic" | "midnight" | "slate",
  { light: string; dark: string; name: string }
> = {
  emerald: { light: "#eeeed2", dark: "#4a7c59", name: "Emerald" },
  classic: { light: "#f0d9b5", dark: "#b58863", name: "Classic Wood" },
  midnight: { light: "#e2e8f0", dark: "#334155", name: "Midnight Zinc" },
  slate: { light: "#e4e4e7", dark: "#52525b", name: "Modern Slate" },
};

export const ChessArena: React.FC<ChessArenaProps> = ({ isDark, onBackToHub }) => {
  const [prefs, setPrefs] = useState<ChessPreferences>(loadChessPreferences);
  const [chessInstance] = useState<Chess>(() => new Chess());
  const [, setBoardTick] = useState<number>(0);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState<Color>(() =>
    prefs.playerColor === "random" ? (Math.random() < 0.5 ? "w" : "b") : prefs.playerColor
  );
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [gameOverResult, setGameOverResult] = useState<string | null>(null);
  const [promotionPending, setPromotionPending] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // Timer states (in seconds)
  const [playerTime, setPlayerTime] = useState<number>(0);
  const [aiTime, setAiTime] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Save prefs when changed
  useEffect(() => {
    saveChessPreferences(prefs);
  }, [prefs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelChessSearch();
    };
  }, []);

  // Timer interval
  useEffect(() => {
    if (prefs.timerMinutes === 0 || !timerRunning || gameOverResult) return;

    const interval = setInterval(() => {
      const turn = chessInstance.turn();
      const isPlayerTurn = turn === boardOrientation;

      if (isPlayerTurn) {
        setPlayerTime((prev) => {
          if (prev <= 1) {
            setGameOverResult("Waktu habis! Anda kalah waktu.");
            playChessSound("gameover", prefs.soundEnabled);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setAiTime((prev) => {
          if (prev <= 1) {
            setGameOverResult("Waktu AI habis! Anda menang waktu.");
            playChessSound("gameover", prefs.soundEnabled);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [chessInstance, boardOrientation, prefs.timerMinutes, timerRunning, gameOverResult, prefs.soundEnabled]);

  // Periksa kondisi game over
  const checkGameEnd = useCallback(() => {
    if (chessInstance.isGameOver()) {
      if (chessInstance.isCheckmate()) {
        const winnerColor = chessInstance.turn() === "w" ? "Hitam" : "Putih";
        const isPlayerWinner = (winnerColor === "Putih" && boardOrientation === "w") || (winnerColor === "Hitam" && boardOrientation === "b");
        const msg = isPlayerWinner ? `Checkmate! Selamat, Anda Menang! 🎉` : `Checkmate! AI Menang. Coba lagi! ♟️`;
        setGameOverResult(msg);

        // Update stats
        setPrefs((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            wins: isPlayerWinner ? prev.stats.wins + 1 : prev.stats.wins,
            losses: !isPlayerWinner ? prev.stats.losses + 1 : prev.stats.losses,
          },
        }));
      } else if (chessInstance.isStalemate()) {
        setGameOverResult("Permainan berakhir Seri (Stalemate / Pat).");
        setPrefs((prev) => ({ ...prev, stats: { ...prev.stats, draws: prev.stats.draws + 1 } }));
      } else if (chessInstance.isThreefoldRepetition()) {
        setGameOverResult("Permainan berakhir Seri (3x Pengulangan Posisi).");
        setPrefs((prev) => ({ ...prev, stats: { ...prev.stats, draws: prev.stats.draws + 1 } }));
      } else if (chessInstance.isInsufficientMaterial()) {
        setGameOverResult("Permainan berakhir Seri (Materi tidak mencukupi).");
        setPrefs((prev) => ({ ...prev, stats: { ...prev.stats, draws: prev.stats.draws + 1 } }));
      } else {
        setGameOverResult("Permainan berakhir Seri (Draw).");
        setPrefs((prev) => ({ ...prev, stats: { ...prev.stats, draws: prev.stats.draws + 1 } }));
      }
      playChessSound("gameover", prefs.soundEnabled);
      return true;
    }
    return false;
  }, [chessInstance, boardOrientation, prefs.soundEnabled]);

  // AI melangkah
  const triggerAiMove = useCallback(
    async (aiColor: Color) => {
      setIsAiThinking(true);
      try {
        const bestMove = await findBestMove(
          chessInstance.fen(),
          prefs.difficulty,
          aiColor
        );

        if (!bestMove) {
          setIsAiThinking(false);
          return;
        }

        const moveResult = chessInstance.move(bestMove);
        if (moveResult) {
          setBoardTick((t) => t + 1);
          setLastMove({ from: moveResult.from, to: moveResult.to });
          setMoveHistory(chessInstance.history());

          if (moveResult.captured) {
            playChessSound("capture", prefs.soundEnabled);
          } else {
            playChessSound("move", prefs.soundEnabled);
          }

          if (chessInstance.inCheck()) {
            playChessSound("check", prefs.soundEnabled);
          }

          checkGameEnd();
        }
      } catch (err) {
        console.error("Chess AI error:", err);
      } finally {
        setIsAiThinking(false);
      }
    },
    [chessInstance, prefs.difficulty, prefs.soundEnabled, checkGameEnd]
  );

  // Eksekusi move pemain
  const executePlayerMove = useCallback(
    (moveObj: { from: Square; to: Square; promotion?: PieceSymbol }) => {
      try {
        const res = chessInstance.move(moveObj);
        if (res) {
          setBoardTick((t) => t + 1);
          setLastMove({ from: res.from, to: res.to });
          setSelectedSquare(null);
          setLegalMoves([]);
          setMoveHistory(chessInstance.history());

          if (res.captured) {
            playChessSound("capture", prefs.soundEnabled);
          } else {
            playChessSound("move", prefs.soundEnabled);
          }

          if (chessInstance.inCheck()) {
            playChessSound("check", prefs.soundEnabled);
          }

          const ended = checkGameEnd();
          if (!ended) {
            const aiColor = boardOrientation === "w" ? "b" : "w";
            triggerAiMove(aiColor);
          }
        }
      } catch (e) {
        console.error("Illegal move attempt:", e);
      }
    },
    [chessInstance, boardOrientation, prefs.soundEnabled, checkGameEnd, triggerAiMove]
  );

  // Player klik petak
  const handleSquareClick = useCallback(
    (sq: Square) => {
      if (gameOverResult || isAiThinking) return;

      const playerColor = boardOrientation;
      if (chessInstance.turn() !== playerColor) return;

      const pieceOnSquare = chessInstance.get(sq);

      // Jika sedang memilih bidak pertama
      if (!selectedSquare) {
        if (pieceOnSquare && pieceOnSquare.color === playerColor) {
          setSelectedSquare(sq);
          const moves = chessInstance.moves({ square: sq, verbose: true });
          setLegalMoves(moves);
        }
        return;
      }

      // Jika klik petak bidak sendiri yang lain, ganti pilihan
      if (pieceOnSquare && pieceOnSquare.color === playerColor) {
        if (sq === selectedSquare) {
          setSelectedSquare(null);
          setLegalMoves([]);
        } else {
          setSelectedSquare(sq);
          setLegalMoves(chessInstance.moves({ square: sq, verbose: true }));
        }
        return;
      }

      // Periksa apakah petak tujuan adalah legal move
      const targetMove = legalMoves.find((m) => m.to === sq);
      if (!targetMove) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      // Cek apakah promosi pion
      const movingPiece = chessInstance.get(selectedSquare);
      const isPromotion =
        movingPiece?.type === "p" &&
        ((playerColor === "w" && sq.endsWith("8")) ||
          (playerColor === "b" && sq.endsWith("1")));

      if (isPromotion) {
        setPromotionPending({ from: selectedSquare, to: sq });
        return;
      }

      // Eksekusi move pemain biasa
      executePlayerMove({ from: selectedSquare, to: sq });
    },
    [
      chessInstance,
      boardOrientation,
      gameOverResult,
      isAiThinking,
      selectedSquare,
      legalMoves,
      executePlayerMove,
    ]
  );

  const initGame = useCallback((colorOverride?: Color) => {
    cancelChessSearch();
    chessInstance.reset();
    setBoardTick((t) => t + 1);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setIsAiThinking(false);
    setGameOverResult(null);
    setPromotionPending(null);
    setMoveHistory([]);

    const chosenColor = colorOverride || (prefs.playerColor === "random" ? (Math.random() < 0.5 ? "w" : "b") : prefs.playerColor);
    setBoardOrientation(chosenColor);

    if (prefs.timerMinutes > 0) {
      setPlayerTime(prefs.timerMinutes * 60);
      setAiTime(prefs.timerMinutes * 60);
      setTimerRunning(true);
    } else {
      setTimerRunning(false);
    }

    // Jika AI bermain putih, AI melangkah pertama
    if (chosenColor === "b") {
      triggerAiMove("w");
    }
  }, [chessInstance, prefs.playerColor, prefs.timerMinutes, triggerAiMove]);

  // Tangani konfirmasi promosi pion
  const handlePromotionSelect = (promotionPiece: PieceSymbol) => {
    if (!promotionPending) return;
    executePlayerMove({
      from: promotionPending.from,
      to: promotionPending.to,
      promotion: promotionPiece,
    });
    setPromotionPending(null);
  };

  // Undo move (1 giliran penuh: langkah pemain & balasan AI)
  const handleUndo = useCallback(() => {
    if (isAiThinking || moveHistory.length === 0) return;
    cancelChessSearch();

    // Jika giliran pemain, AI sudah melangkah: undo 2 langkah (langkah AI + langkah pemain)
    if (chessInstance.turn() === boardOrientation) {
      chessInstance.undo();
      chessInstance.undo();
    } else {
      // AI belum melangkah: undo 1 langkah pemain
      chessInstance.undo();
    }

    setBoardTick((t) => t + 1);
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setMoveHistory(chessInstance.history());
    setGameOverResult(null);
    playChessSound("move", prefs.soundEnabled);
  }, [chessInstance, isAiThinking, moveHistory.length, boardOrientation, prefs.soundEnabled]);

  // Flip board manual
  const handleFlipBoard = () => {
    setBoardOrientation((prev) => (prev === "w" ? "b" : "w"));
  };

  // Status check posisi Raja
  const inCheck = chessInstance.inCheck();
  const currentTurn = chessInstance.turn();
  const isPlayerTurn = currentTurn === boardOrientation;

  // Format detik ke MM:SS
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Matriks papan catur 8x8 sesuai orientasi
  const boardRows = useMemo(() => {
    const rows = [8, 7, 6, 5, 4, 3, 2, 1];
    const cols = ["a", "b", "c", "d", "e", "f", "g", "h"];

    const rOrdered = boardOrientation === "w" ? rows : [...rows].reverse();
    const cOrdered = boardOrientation === "w" ? cols : [...cols].reverse();

    return rOrdered.map((r) => cOrdered.map((c) => `${c}${r}` as Square));
  }, [boardOrientation]);

  const activeTheme = BOARD_THEMES[prefs.boardTheme] || BOARD_THEMES.emerald;

  return (
    <div className={`flex flex-col h-full w-full overflow-y-auto ${isDark ? "bg-[#121215] text-zinc-100" : "bg-[#fafafc] text-zinc-900"}`}>
      {/* Top Header Bar */}
      <div className={`sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl ${isDark ? "bg-[#121215]/80 border-white/10" : "bg-white/80 border-black/10"}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition border ${
              isDark ? "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700/60" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Game Hub</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight">Chess Arena</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isDark ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                Offline
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Challenge your mind against Usick One Chess AI</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setPrefs((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            title={prefs.soundEnabled ? "Mute Suara" : "Nyalakan Suara"}
            className={`p-2 rounded-xl border text-xs cursor-pointer transition ${
              isDark ? "bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/60 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700"
            }`}
          >
            {prefs.soundEnabled ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          {/* New Game Button */}
          <button
            onClick={() => initGame()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs ${
              isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 p-3 sm:p-6 max-w-6xl mx-auto w-full">
        {/* Left/Center: Papan Catur */}
        <div className="flex flex-col items-center w-full max-w-[460px] sm:max-w-[500px]">
          {/* Opponent Info Bar */}
          <div className={`w-full flex items-center justify-between px-3 py-2 mb-2 rounded-xl border ${isDark ? "bg-zinc-900/70 border-white/10" : "bg-white border-black/10"}`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${boardOrientation === "w" ? "bg-zinc-800 text-white" : "bg-zinc-200 text-black"}`}>
                {boardOrientation === "w" ? "♟" : "♙"}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">Usick AI</span>
                  <span className="text-[10px] text-zinc-400 capitalize">({prefs.difficulty})</span>
                  {isAiThinking && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Berpikir...
                    </span>
                  )}
                </div>
              </div>
            </div>
            {prefs.timerMinutes > 0 && (
              <div className={`text-xs font-mono font-bold px-2 py-1 rounded-md border ${aiTime < 30 ? "text-red-400 border-red-500/30 bg-red-500/10 animate-pulse" : isDark ? "bg-zinc-800 text-zinc-200 border-zinc-700" : "bg-zinc-100 text-zinc-800 border-zinc-300"}`}>
                ⏱ {formatTimer(aiTime)}
              </div>
            )}
          </div>

          {/* The Chessboard Grid */}
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-zinc-800/80 select-none">
            <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
              {boardRows.map((row, rIdx) =>
                row.map((sq, cIdx) => {
                  const isSquareLight = (rIdx + cIdx) % 2 === 0;
                  const squareColor = isSquareLight ? activeTheme.light : activeTheme.dark;
                  const piece = chessInstance.get(sq);
                  const isSelected = selectedSquare === sq;
                  const isLastMoveSquare = lastMove?.from === sq || lastMove?.to === sq;
                  const legalTarget = legalMoves.find((m) => m.to === sq);
                  const isKingInCheck = inCheck && piece?.type === "k" && piece.color === currentTurn;

                  return (
                    <div
                      key={sq}
                      onClick={() => handleSquareClick(sq)}
                      style={{ backgroundColor: squareColor }}
                      className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${
                        isSelected ? "ring-4 ring-amber-400 z-10" : ""
                      }`}
                    >
                      {/* Last move highlight */}
                      {isLastMoveSquare && (
                        <div className="absolute inset-0 bg-yellow-400/30 pointer-events-none" />
                      )}

                      {/* King in check red glow */}
                      {isKingInCheck && (
                        <div className="absolute inset-0 bg-red-600/50 animate-pulse pointer-events-none rounded-sm" />
                      )}

                      {/* Piece Icon */}
                      {piece && (
                        <div className="w-full h-full flex items-center justify-center z-5">
                          <ChessPieceIcon type={piece.type} color={piece.color} />
                        </div>
                      )}

                      {/* Legal Move Indicator */}
                      {legalTarget && (
                        <div className="absolute z-10 pointer-events-none flex items-center justify-center">
                          {piece ? (
                            // Target capture ring
                            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border-4 border-red-500/80 animate-pulse" />
                          ) : (
                            // Target dot
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-zinc-900/40 shadow-xs" />
                          )}
                        </div>
                      )}

                      {/* Coordinate Labels on Edges */}
                      {cIdx === 0 && (
                        <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-60 pointer-events-none">
                          {sq[1]}
                        </span>
                      )}
                      {rIdx === 7 && (
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-60 pointer-events-none">
                          {sq[0]}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Promotion Modal Overlay */}
            {promotionPending && (
              <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4">
                <div className={`p-4 rounded-2xl border shadow-xl flex flex-col items-center ${isDark ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300 text-black"}`}>
                  <p className="text-xs font-bold mb-3">Pilih Promosi Pion:</p>
                  <div className="flex gap-2">
                    {(["q", "r", "b", "n"] as PieceSymbol[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePromotionSelect(p)}
                        className={`w-14 h-14 p-1.5 rounded-xl border flex items-center justify-center cursor-pointer transition hover:scale-105 ${
                          isDark ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700" : "bg-zinc-100 border-zinc-300 hover:bg-zinc-200"
                        }`}
                      >
                        <ChessPieceIcon type={p} color={boardOrientation} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Player Info Bar */}
          <div className={`w-full flex items-center justify-between px-3 py-2 mt-2 rounded-xl border ${isDark ? "bg-zinc-900/70 border-white/10" : "bg-white border-black/10"}`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${boardOrientation === "w" ? "bg-zinc-200 text-black" : "bg-zinc-800 text-white"}`}>
                {boardOrientation === "w" ? "♙" : "♟"}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">Anda</span>
                  {isPlayerTurn && !gameOverResult && (
                    <span className="text-[10px] text-emerald-400 font-medium">● Giliran Anda</span>
                  )}
                </div>
              </div>
            </div>
            {prefs.timerMinutes > 0 && (
              <div className={`text-xs font-mono font-bold px-2 py-1 rounded-md border ${playerTime < 30 ? "text-red-400 border-red-500/30 bg-red-500/10 animate-pulse" : isDark ? "bg-zinc-800 text-zinc-200 border-zinc-700" : "bg-zinc-100 text-zinc-800 border-zinc-300"}`}>
                ⏱ {formatTimer(playerTime)}
              </div>
            )}
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center justify-center gap-2 mt-3 w-full">
            <button
              onClick={handleUndo}
              disabled={isAiThinking || moveHistory.length === 0}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed ${
                isDark ? "bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-200" : "bg-white border-black/10 hover:bg-zinc-100 text-zinc-800"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>Undo</span>
            </button>
            <button
              onClick={handleFlipBoard}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                isDark ? "bg-zinc-900 border-white/10 hover:bg-zinc-800 text-zinc-200" : "bg-white border-black/10 hover:bg-zinc-100 text-zinc-800"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span>Putar Papan</span>
            </button>
          </div>
        </div>

        {/* Right: Controls & History Panel */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          {/* Game Over Banner */}
          {gameOverResult && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-center animate-fade-in">
              <p className="text-sm font-bold mb-2">{gameOverResult}</p>
              <button
                onClick={() => initGame()}
                className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Main Lagi
              </button>
            </div>
          )}

          {/* Difficulty & Preferences Card */}
          <div className={`p-4 rounded-2xl border ${isDark ? "bg-zinc-900/60 border-white/10" : "bg-white border-black/10"}`}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Pengaturan Catur</h2>

            {/* Tingkat Kesulitan */}
            <div className="mb-3">
              <label className="text-[11px] text-zinc-400 font-medium block mb-1.5">Tingkat Kesulitan AI:</label>
              <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl border bg-zinc-800/40 dark:border-zinc-800 border-zinc-200">
                {(["easy", "medium", "hard"] as ChessDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setPrefs((prev) => ({ ...prev, difficulty: diff }))}
                    className={`py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                      prefs.difficulty === diff
                        ? isDark ? "bg-zinc-700 text-white shadow-xs" : "bg-white text-black shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Pilihan Warna Pemain */}
            <div className="mb-3">
              <label className="text-[11px] text-zinc-400 font-medium block mb-1.5">Bermain Sebagai:</label>
              <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl border bg-zinc-800/40 dark:border-zinc-800 border-zinc-200">
                {[
                  { id: "w", label: "Putih" },
                  { id: "b", label: "Hitam" },
                  { id: "random", label: "Acak" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const col = item.id as "w" | "b" | "random";
                      setPrefs((prev) => ({ ...prev, playerColor: col }));
                      initGame(col === "random" ? (Math.random() < 0.5 ? "w" : "b") : col);
                    }}
                    className={`py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      prefs.playerColor === item.id
                        ? isDark ? "bg-zinc-700 text-white shadow-xs" : "bg-white text-black shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tema Papan Catur */}
            <div className="mb-3">
              <label className="text-[11px] text-zinc-400 font-medium block mb-1.5">Warna Papan:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(BOARD_THEMES) as Array<keyof typeof BOARD_THEMES>).map((key) => {
                  const theme = BOARD_THEMES[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setPrefs((prev) => ({ ...prev, boardTheme: key }))}
                      className={`flex items-center gap-2 p-1.5 rounded-xl border text-left text-xs cursor-pointer transition ${
                        prefs.boardTheme === key
                          ? isDark ? "border-white/40 bg-zinc-800" : "border-black/40 bg-zinc-100"
                          : isDark ? "border-zinc-800 hover:bg-zinc-800/40" : "border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="w-4 h-4 rounded-sm flex overflow-hidden border border-black/20">
                        <div className="w-1/2 h-full" style={{ backgroundColor: theme.light }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: theme.dark }} />
                      </div>
                      <span className="text-[11px] truncate">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timer Selection */}
            <div>
              <label className="text-[11px] text-zinc-400 font-medium block mb-1.5">Waktu / Timer:</label>
              <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl border bg-zinc-800/40 dark:border-zinc-800 border-zinc-200 text-center">
                {([0, 3, 5, 10] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setPrefs((prev) => ({ ...prev, timerMinutes: t }));
                      if (t > 0) {
                        setPlayerTime(t * 60);
                        setAiTime(t * 60);
                        setTimerRunning(true);
                      } else {
                        setTimerRunning(false);
                      }
                    }}
                    className={`py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      prefs.timerMinutes === t
                        ? isDark ? "bg-zinc-700 text-white shadow-xs" : "bg-white text-black shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {t === 0 ? "Off" : `${t}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Move History Panel */}
          <div className={`p-4 rounded-2xl border flex flex-col flex-1 min-h-[160px] max-h-[240px] ${isDark ? "bg-zinc-900/60 border-white/10" : "bg-white border-black/10"}`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Riwayat Langkah</h2>
              <span className="text-[10px] text-zinc-500">{moveHistory.length} langkah</span>
            </div>
            <div className="flex-1 overflow-y-auto text-xs space-y-1 font-mono pr-1">
              {moveHistory.length === 0 ? (
                <p className="text-zinc-500 text-[11px] italic">Belum ada langkah.</p>
              ) : (
                Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => {
                  const whiteMove = moveHistory[i * 2];
                  const blackMove = moveHistory[i * 2 + 1];
                  return (
                    <div key={i} className="flex items-center justify-between py-0.5 px-1.5 rounded hover:bg-zinc-800/30">
                      <span className="text-zinc-500 w-6">{i + 1}.</span>
                      <span className="w-16 font-semibold">{whiteMove}</span>
                      <span className="w-16 text-zinc-400">{blackMove || ""}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Player Stats Card */}
          <div className={`p-3 rounded-xl border flex items-center justify-around text-center ${isDark ? "bg-zinc-900/40 border-white/10" : "bg-zinc-50 border-black/10"}`}>
            <div>
              <p className="text-[10px] text-zinc-400">Menang</p>
              <p className="text-xs font-bold text-emerald-400">{prefs.stats.wins}</p>
            </div>
            <div className="h-6 w-px bg-zinc-700/40" />
            <div>
              <p className="text-[10px] text-zinc-400">Kalah</p>
              <p className="text-xs font-bold text-red-400">{prefs.stats.losses}</p>
            </div>
            <div className="h-6 w-px bg-zinc-700/40" />
            <div>
              <p className="text-[10px] text-zinc-400">Seri</p>
              <p className="text-xs font-bold text-zinc-300">{prefs.stats.draws}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessArena;
