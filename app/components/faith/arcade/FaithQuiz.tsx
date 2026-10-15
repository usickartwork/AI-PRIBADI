'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QuizQuestion, QuizPowerUps, QuizResult } from '@/lib/faith/arcade/types';
import { getRandomQuizQuestions, getDailyQuizQuestions } from '@/lib/faith/arcade/quizData';
import { addCoinsAndXp, getArcadeEconomy, saveArcadeEconomy } from '@/lib/faith/arcade/storage';
import {
  Flame,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Trophy,
  Coins,
  Star,
  Award,
} from 'lucide-react';

interface FaithQuizProps {
  onBack: () => void;
  isDaily?: boolean;
}

const QUESTION_DURATION = 15; // 15 seconds per question

export default function FaithQuiz({ onBack, isDaily = false }: FaithQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // Powerups: 1 use per game
  const [powerUps, setPowerUps] = useState<QuizPowerUps>({
    fiftyFifty: 1,
    extraTime: 1,
    doubleScore: 1,
  });
  const [isDoubleScoreActive, setIsDoubleScoreActive] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);

  // Answer interaction state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [bonusEarned, setBonusEarned] = useState<number | null>(null);

  // Result state
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize questions
  const startQuiz = useCallback(() => {
    let qList: QuizQuestion[];
    if (isDaily) {
      const today = new Date().toISOString().split('T')[0];
      qList = getDailyQuizQuestions(today, 10);
    } else {
      qList = getRandomQuizQuestions(10);
    }

    setQuestions(qList);
    setCurrentIndex(0);
    setTimeLeft(QUESTION_DURATION);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setCorrectCount(0);
    setPowerUps({ fiftyFifty: 1, extraTime: 1, doubleScore: 1 });
    setIsDoubleScoreActive(false);
    setHiddenOptions([]);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(null);
    setBonusEarned(null);
    setIsComplete(false);
    setResult(null);
  }, [isDaily]);

  useEffect(() => {
    startQuiz();
  }, [startQuiz]);

  const currentQ = questions[currentIndex];

  // Timer countdown
  useEffect(() => {
    if (isAnswered || isComplete || !currentQ) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAnswered, isComplete, currentQ]);

  // Handle timeout (treated as incorrect)
  const handleTimeOut = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setIsCorrect(false);
    setSelectedOption(-1);
    setCombo(0);

    setTimeout(() => {
      moveToNextQuestion();
    }, 1800);
  };

  // Handle player selecting an answer
  const handleSelectAnswer = (optionIdx: number) => {
    if (isAnswered || isComplete) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIdx);
    setIsAnswered(true);

    const isRight = optionIdx === currentQ.correctIndex;
    setIsCorrect(isRight);

    if (isRight) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > bestCombo) {
        setBestCombo(newCombo);
      }
      setCorrectCount((prev) => prev + 1);

      // Base score = 100
      let baseScore = 100;
      const speedBonus = Math.floor((timeLeft / QUESTION_DURATION) * 50);
      const comboBonus = (newCombo - 1) * 20;

      let roundScore = baseScore + speedBonus + comboBonus;
      if (isDoubleScoreActive) {
        roundScore *= 2;
        setIsDoubleScoreActive(false);
      }

      setScore((prev) => prev + roundScore);
      setBonusEarned(roundScore);
    } else {
      setCombo(0);
      setIsDoubleScoreActive(false);
      setBonusEarned(null);
    }

    setTimeout(() => {
      moveToNextQuestion();
    }, 1600);
  };

  // Advance to next question or complete quiz
  const moveToNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(QUESTION_DURATION);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(null);
      setBonusEarned(null);
      setHiddenOptions([]);
    } else {
      finishQuiz();
    }
  };

  // Finish quiz and award rewards
  const finishQuiz = () => {
    setIsComplete(true);

    const accuracy = Math.round((correctCount / questions.length) * 100);

    let coins = Math.max(10, Math.floor(score / 10));
    let xp = 50 + correctCount * 10;

    if (isDaily) {
      coins += 50;
      xp += 100;

      const today = new Date().toISOString().split('T')[0];
      const economy = getArcadeEconomy();
      if (economy.dailyChallengeDoneDate !== today) {
        economy.dailyChallengeDoneDate = today;
        economy.dailyStreak = (economy.dailyStreak || 0) + 1;
        saveArcadeEconomy(economy);
      }
    }

    addCoinsAndXp(coins, xp);

    setResult({
      score,
      correctCount,
      totalQuestions: questions.length,
      accuracy,
      bestCombo,
      coinsEarned: coins,
      xpEarned: xp,
      isDailyChallenge: isDaily,
    });
  };

  // Power-up: 50/50
  const useFiftyFifty = () => {
    if (powerUps.fiftyFifty <= 0 || isAnswered || !currentQ) return;
    const incorrectIndices = [0, 1, 2, 3].filter((idx) => idx !== currentQ.correctIndex);
    const toHide = incorrectIndices.sort(() => 0.5 - Math.random()).slice(0, 2);
    setHiddenOptions(toHide);
    setPowerUps((prev) => ({ ...prev, fiftyFifty: prev.fiftyFifty - 1 }));
  };

  // Power-up: Extra Time (+5s)
  const useExtraTime = () => {
    if (powerUps.extraTime <= 0 || isAnswered) return;
    setTimeLeft((prev) => Math.min(QUESTION_DURATION + 5, prev + 5));
    setPowerUps((prev) => ({ ...prev, extraTime: prev.extraTime - 1 }));
  };

  // Power-up: Double Score
  const useDoubleScore = () => {
    if (powerUps.doubleScore <= 0 || isAnswered || isDoubleScoreActive) return;
    setIsDoubleScoreActive(true);
    setPowerUps((prev) => ({ ...prev, doubleScore: prev.doubleScore - 1 }));
  };

  if (!currentQ && !isComplete) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="w-7 h-7 border-2 border-[#111113] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-[#71717A]">Menyiapkan soal kuis...</p>
      </div>
    );
  }

  // RESULT SCREEN (Clean Editorial, Zero Emojis)
  if (isComplete && result) {
    return (
      <div className="flex-1 flex flex-col justify-between p-6 max-w-md mx-auto w-full animate-page-enter">
        <div className="text-center pt-4">
          <div className="w-14 h-14 rounded-2xl bg-[#111113] dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Trophy size={28} />
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-[#71717A] dark:text-[#A1A1AA] bg-[#F4F4F6] dark:bg-[#1E1E24] px-3 py-1 rounded-full">
            {isDaily ? 'Daily Challenge Selesai' : 'Kuis Selesai'}
          </span>

          <h2 className="text-3xl font-extrabold text-[#111113] dark:text-white mt-2 tracking-tight">
            {result.score.toLocaleString()}{' '}
            <span className="text-sm text-[#71717A] dark:text-[#A1A1AA] font-medium">PTS</span>
          </h2>
          <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] mt-1 font-medium">
            {result.correctCount} dari {result.totalQuestions} Soal Terjawab Benar
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] rounded-2xl p-3.5 text-center shadow-xs">
              <span className="text-[10px] font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider block mb-1">
                Akurasi
              </span>
              <span className="text-xl font-bold text-[#111113] dark:text-white">{result.accuracy}%</span>
            </div>

            <div className="bg-white dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] rounded-2xl p-3.5 text-center shadow-xs">
              <span className="text-[10px] font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider block mb-1">
                Best Combo
              </span>
              <div className="flex items-center justify-center gap-1">
                <Flame size={18} className="text-[#111113] dark:text-white" />
                <span className="text-xl font-bold text-[#111113] dark:text-white">x{result.bestCombo}</span>
              </div>
            </div>
          </div>

          {/* Rewards Card */}
          <div className="mt-4 bg-[#111113] dark:bg-[#18181D] rounded-2xl p-4 text-white text-left shadow-xs border border-[#27272A] dark:border-[#26262B]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Hadiah Diperoleh
              </span>
              <Award size={15} className="text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-2.5">
                <Coins size={18} className="text-white" />
                <div>
                  <span className="text-[11px] text-neutral-400 block leading-tight">Koin Hub</span>
                  <span className="text-base font-bold text-white">+{result.coinsEarned}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-2.5">
                <Star size={18} className="text-white" />
                <div>
                  <span className="text-[11px] text-neutral-400 block leading-tight">XP Rohani</span>
                  <span className="text-base font-bold text-white">+{result.xpEarned}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-6 pb-2">
          {!isDaily && (
            <button
              onClick={startQuiz}
              className="w-full bg-[#111113] dark:bg-white text-white dark:text-black font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs hover:bg-[#27272A] dark:hover:bg-neutral-200 active:scale-[0.98] transition-all text-xs cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>Main Lagi (Play Again)</span>
            </button>
          )}

          <button
            onClick={onBack}
            className="w-full bg-white dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] text-[#111113] dark:text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#F4F4F6] dark:hover:bg-[#222228] active:scale-[0.98] transition-all text-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Faith Arcade</span>
          </button>
        </div>
      </div>
    );
  }

  // ACTIVE GAMEPLAY SCREEN (Clean Editorial, Zero Emojis)
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full select-none animate-page-enter">
      {/* TOP BAR: Header, Question Progress, Score, Timer, Combo */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-[#71717A] hover:text-[#111113] dark:text-[#A1A1AA] dark:hover:text-white rounded-full active:scale-95 transition-all cursor-pointer"
            aria-label="Kembali"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {isDaily && (
              <span className="text-[10px] font-bold tracking-wider uppercase bg-[#111113] dark:bg-white text-white dark:text-black px-2.5 py-0.5 rounded-full">
                Daily
              </span>
            )}
            <span className="text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA]">
              Soal {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-sm text-[#111113] dark:text-white">
            <span>{score.toLocaleString()}</span>
            <span className="text-[10px] text-[#A1A1AA] uppercase">PTS</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#EAEAEB] dark:bg-[#26262B] h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className="bg-[#111113] dark:bg-white h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Timer Bar & Combo Badge */}
        <div className="flex items-center justify-between gap-3 mb-4">
          {/* Combo indicator */}
          <div className="flex items-center gap-1.5 min-w-[100px]">
            {combo > 1 ? (
              <div className="flex items-center gap-1 bg-[#111113] dark:bg-white text-white dark:text-black px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
                <Flame size={13} className="text-amber-400 fill-amber-400" />
                <span>COMBO x{combo}</span>
              </div>
            ) : (
              <span className="text-xs text-[#A1A1AA] font-medium">Fokus & Cepat</span>
            )}
          </div>

          {/* Countdown timer pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              timeLeft <= 4
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 animate-bounce'
                : 'bg-white dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] text-[#111113] dark:text-white'
            }`}
          >
            <Clock size={12} />
            <span>{timeLeft}s</span>
          </div>
        </div>
      </div>

      {/* CENTER: Question & Category */}
      <div className="my-auto py-2">
        <div className="text-center mb-5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-[#71717A] dark:text-[#A1A1AA] bg-white dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] px-3 py-1 rounded-full inline-block mb-3">
            {currentQ.category}
          </span>
          <h3 className="text-lg md:text-xl font-bold text-[#111113] dark:text-white leading-snug px-1">
            {currentQ.question}
          </h3>
        </div>

        {/* 4 CHOICES (Large tactile buttons) */}
        <div className="grid grid-cols-1 gap-2.5">
          {currentQ.options.map((option, idx) => {
            const isHidden = hiddenOptions.includes(idx);
            const isSelected = selectedOption === idx;
            const isCorrectAnswer = idx === currentQ.correctIndex;

            if (isHidden) {
              return (
                <div
                  key={idx}
                  className="h-14 border border-dashed border-[#EAEAEB] dark:border-[#26262B] rounded-2xl flex items-center justify-center opacity-30 select-none pointer-events-none"
                >
                  <span className="text-xs text-[#A1A1AA]">50/50 Dieliminasi</span>
                </div>
              );
            }

            let buttonStyle = 'bg-white dark:bg-[#18181D] border-[#EAEAEB] dark:border-[#26262B] text-[#111113] dark:text-white hover:border-black dark:hover:border-white';
            let badgeStyle = 'bg-[#F4F4F6] dark:bg-[#24242B] text-[#71717A] dark:text-[#A1A1AA]';

            if (isAnswered) {
              if (isCorrectAnswer) {
                buttonStyle = 'bg-[#111113] dark:bg-white border-[#111113] dark:border-white text-white dark:text-black shadow-md scale-[1.01]';
                badgeStyle = 'bg-[#27272A] dark:bg-neutral-200 text-white dark:text-black';
              } else if (isSelected && !isCorrectAnswer) {
                buttonStyle = 'bg-rose-600 border-rose-600 text-white shadow-sm';
                badgeStyle = 'bg-rose-800 text-white';
              } else {
                buttonStyle = 'bg-[#FAFAFA] dark:bg-[#141418] border-[#EAEAEB] dark:border-[#202026] text-[#A1A1AA] dark:text-[#55555E] opacity-50';
              }
            }

            const optionLetters = ['A', 'B', 'C', 'D'];

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectAnswer(idx)}
                className={`w-full text-left p-3.5 rounded-2xl border-2 font-medium flex items-center gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer ${buttonStyle}`}
              >
                <span
                  className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${badgeStyle}`}
                >
                  {optionLetters[idx]}
                </span>
                <span className="text-[14px] leading-tight flex-1 font-semibold">
                  {option}
                </span>

                {isAnswered && isCorrectAnswer && (
                  <CheckCircle2 size={18} className="text-white dark:text-black shrink-0 animate-scale-in" />
                )}
                {isAnswered && isSelected && !isCorrectAnswer && (
                  <XCircle size={18} className="text-white shrink-0 animate-scale-in" />
                )}
              </button>
            );
          })}
        </div>

        {/* FEEDBACK BANNER */}
        {isAnswered && (
          <div className="mt-4 p-3 rounded-2xl animate-page-enter text-center">
            {isCorrect ? (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#111113] dark:text-white block">
                  Jawaban Benar {bonusEarned ? `(+${bonusEarned} PTS)` : ''}
                </span>
                <p className="text-[12px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 line-clamp-1">
                  {currentQ.verseRef}: {currentQ.explanation}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                  Kurang Tepat
                </span>
                <p className="text-[12px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 line-clamp-1">
                  Jawaban: {currentQ.options[currentQ.correctIndex]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM: Power-Ups Bar */}
      <div className="pt-2">
        <div className="flex items-center justify-between bg-white dark:bg-[#18181D] border border-[#EAEAEB] dark:border-[#26262B] rounded-2xl px-3.5 py-2">
          <span className="text-[11px] font-bold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
            Power-Up
          </span>

          <div className="flex items-center gap-2">
            {/* 50/50 */}
            <button
              onClick={useFiftyFifty}
              disabled={powerUps.fiftyFifty <= 0 || isAnswered || hiddenOptions.length > 0}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                powerUps.fiftyFifty > 0 && !isAnswered && hiddenOptions.length === 0
                  ? 'bg-[#FAFAFA] dark:bg-[#202026] border border-[#EAEAEB] dark:border-[#2C2C32] text-[#111113] dark:text-white active:scale-95 shadow-xs hover:border-black dark:hover:border-white cursor-pointer'
                  : 'opacity-40 text-[#A1A1AA] cursor-not-allowed'
              }`}
              title="Hilangkan 2 pilihan salah"
            >
              <span>50/50</span>
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">({powerUps.fiftyFifty})</span>
            </button>

            {/* Extra Time */}
            <button
              onClick={useExtraTime}
              disabled={powerUps.extraTime <= 0 || isAnswered}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                powerUps.extraTime > 0 && !isAnswered
                  ? 'bg-[#FAFAFA] dark:bg-[#202026] border border-[#EAEAEB] dark:border-[#2C2C32] text-[#111113] dark:text-white active:scale-95 shadow-xs hover:border-black dark:hover:border-white cursor-pointer'
                  : 'opacity-40 text-[#A1A1AA] cursor-not-allowed'
              }`}
              title="+5 Detik Waktu"
            >
              <Clock size={12} />
              <span>+5s</span>
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">({powerUps.extraTime})</span>
            </button>

            {/* Double Score */}
            <button
              onClick={useDoubleScore}
              disabled={powerUps.doubleScore <= 0 || isAnswered || isDoubleScoreActive}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                powerUps.doubleScore > 0 && !isAnswered && !isDoubleScoreActive
                  ? 'bg-[#FAFAFA] dark:bg-[#202026] border border-[#EAEAEB] dark:border-[#2C2C32] text-[#111113] dark:text-white active:scale-95 shadow-xs hover:border-black dark:hover:border-white cursor-pointer'
                  : isDoubleScoreActive
                  ? 'bg-[#111113] dark:bg-white text-white dark:text-black animate-pulse'
                  : 'opacity-40 text-[#A1A1AA] cursor-not-allowed'
              }`}
              title="2x Score Ronde Ini"
            >
              <Zap size={12} className={isDoubleScoreActive ? 'text-amber-400 fill-amber-400' : ''} />
              <span>2X</span>
              <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA]">({powerUps.doubleScore})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

