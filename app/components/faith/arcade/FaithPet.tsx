'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PetState, ArcadeEconomy } from '@/lib/faith/arcade/types';
import {
  getPetState,
  savePetState,
  addPetXp,
  getArcadeEconomy,
  addCoinsAndXp,
  applyOfflineDecay,
} from '@/lib/faith/arcade/storage';
import { FOOD_ITEMS, WARDROBE_ITEMS, FURNITURE_ITEMS } from '@/lib/faith/arcade/petShopData';
import {
  FaithLamb,
  FoodVector,
  SoapToolVector,
  ShowerheadToolVector,
  PouPillowBed,
  PouClosetVector,
  PouBedsideLamp,
  PouShopVector,
  PouFridgeVector,
} from './VectorAssets';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Coins,
  X,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  playPouHappy,
  playPouEat,
  playPouBubble,
  playPouShower,
  playPouSparkle,
  playPouLampClick,
  playPouSlide,
  playPouBallBounce,
  playPouCoin,
  unlockAudio,
} from '@/lib/faith/arcade/soundEffects';

interface FaithPetProps {
  onBack: () => void;
}

type PouRoom = 'bedroom' | 'kitchen' | 'bathroom' | 'playroom';

const ROOM_SEQUENCE: PouRoom[] = ['bedroom', 'kitchen', 'bathroom', 'playroom'];

const ROOM_TITLES: Record<PouRoom, string> = {
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  playroom: 'Game Room',
};

export default function FaithPet({ onBack }: FaithPetProps) {
  const [pet, setPet] = useState<PetState | null>(null);
  const [economy, setEconomy] = useState<ArcadeEconomy | null>(null);

  // Sound SFX state
  const [isMuted, setIsMuted] = useState(false);

  const sfx = {
    happy: () => {
      unlockAudio();
      if (!isMuted) playPouHappy();
    },
    eat: () => {
      unlockAudio();
      if (!isMuted) playPouEat();
    },
    bubble: () => {
      unlockAudio();
      if (!isMuted) playPouBubble();
    },
    shower: () => {
      unlockAudio();
      if (!isMuted) playPouShower();
    },
    sparkle: () => {
      unlockAudio();
      if (!isMuted) playPouSparkle();
    },
    lamp: () => {
      unlockAudio();
      if (!isMuted) playPouLampClick();
    },
    slide: () => {
      unlockAudio();
      if (!isMuted) playPouSlide();
    },
    bounce: () => {
      unlockAudio();
      if (!isMuted) playPouBallBounce();
    },
    coin: () => {
      unlockAudio();
      if (!isMuted) playPouCoin();
    },
  };

  // Active Room & Slide Direction
  const [currentRoom, setCurrentRoom] = useState<PouRoom>('bedroom');
  const [slideDirection, setSlideDirection] = useState<'right' | 'left' | 'none'>('none');

  // Interactive Modals (Closet / Shop)
  const [activeModal, setActiveModal] = useState<'none' | 'closet' | 'shop'>('none');

  // Lamb States
  const [speech, setSpeech] = useState<string | null>(null);
  const [isJumping, setIsJumping] = useState(false);
  const [isWalking, setIsWalking] = useState(true);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isMouthOpen, setIsMouthOpen] = useState(false);
  const [isChewing, setIsChewing] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [heartParticles, setHeartParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  // Bedroom Lamp & Sleep State
  const [isLampOn, setIsLampOn] = useState(true);

  // Kitchen Feeding State
  const [isFridgeOpen, setIsFridgeOpen] = useState(false);
  const [feedingFood, setFeedingFood] = useState<string | null>(null);
  const [crumbs, setCrumbs] = useState<{ id: number; x: number; y: number }[]>([]);

  // Bathroom Interactive Soap & Shower
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const [isShowering, setIsShowering] = useState(false);
  const [isSparkleClean, setIsSparkleClean] = useState(false);

  // Playroom Ball Catch Mini-game
  const [isPlayingBall, setIsPlayingBall] = useState(false);
  const [ballScore, setBallScore] = useState(0);
  const [ballTimeLeft, setBallTimeLeft] = useState(15);
  const [balls, setBalls] = useState<{ id: number; x: number; y: number }[]>([]);

  // Touch Swipe coordinates
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ballTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load & Background / Foreground Synchronization
  useEffect(() => {
    const refreshFromStorage = () => {
      const refreshedPet = getPetState();
      setPet(refreshedPet);
      setEconomy(getArcadeEconomy());
      setIsLampOn(!refreshedPet.isSleeping);
    };

    refreshFromStorage();

    const handleEconomyUpdate = () => setEconomy(getArcadeEconomy());
    const handlePetUpdate = () => {
      const p = getPetState();
      setPet(p);
      setIsLampOn(!p.isSleeping);
    };

    // When user minimizes browser, switches app, locks phone, or returns:
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Returned from background / unlocked phone -> recalculate offline decay immediately
        refreshFromStorage();
      } else {
        // Going to background -> stamp current timestamp
        setPet((prev) => {
          if (!prev) return prev;
          const stamped = { ...prev, lastInteraction: Date.now() };
          savePetState(stamped);
          return stamped;
        });
      }
    };

    const handleFocus = () => {
      refreshFromStorage();
    };

    window.addEventListener('faith_arcade_economy_updated', handleEconomyUpdate);
    window.addEventListener('faith_arcade_pet_updated', handlePetUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);

    return () => {
      window.removeEventListener('faith_arcade_economy_updated', handleEconomyUpdate);
      window.removeEventListener('faith_arcade_pet_updated', handlePetUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
    };
  }, []);

  // 2. ACTIVE REAL-TIME STAT DECAY & RECOVERY LOOP (User explicitly requested indicators to drop!)
  useEffect(() => {
    const decayInterval = setInterval(() => {
      setPet((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, lastInteraction: Date.now() };

        if (!isLampOn) {
          // SLEEPING: Rapidly recharge energy (+4% per 2s)
          if (updated.energy < 100) {
            updated.energy = Math.min(100, updated.energy + 4);
          }
          // Hunger drops slightly while sleeping
          updated.hunger = Math.max(5, updated.hunger - 0.2);
        } else {
          // AWAKE: Active decay in real-time
          // Hunger drops 1% every 8s
          updated.hunger = Math.max(5, Math.round((updated.hunger - 0.8) * 10) / 10);
          // Energy drops 0.6% every 8s
          updated.energy = Math.max(5, Math.round((updated.energy - 0.6) * 10) / 10);
          // Cleanliness drops 0.5% every 8s
          updated.cleanliness = Math.max(5, Math.round((updated.cleanliness - 0.5) * 10) / 10);

          // If hungry or dirty, happiness drops
          if (updated.hunger < 35 || updated.cleanliness < 35) {
            updated.happiness = Math.max(5, Math.round((updated.happiness - 1) * 10) / 10);
          }
        }

        savePetState(updated);
        return updated;
      });
    }, 8000);

    return () => clearInterval(decayInterval);
  }, [isLampOn]);

  // Fast Energy Recovery ticker when Lamp is OFF
  useEffect(() => {
    if (isLampOn) return;
    const fastEnergyInterval = setInterval(() => {
      setPet((prev) => {
        if (!prev || prev.energy >= 100) return prev;
        const updated = { ...prev, energy: Math.min(100, prev.energy + 3) };
        savePetState(updated);
        return updated;
      });
    }, 1500);

    return () => clearInterval(fastEnergyInterval);
  }, [isLampOn]);

  // 3. Idle Lamb Blinking loop
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 160);
      }
    }, 3200);

    return () => clearInterval(blinkInterval);
  }, []);

  // 4. Cursor / Touch tracking for pupils
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stageRef.current || !isLampOn) return;
    const rect = stageRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);

    setEyeOffset({
      x: Math.max(-6, Math.min(6, deltaX * 6)),
      y: Math.max(-5, Math.min(5, deltaY * 5)),
    });
  };

  // Speech bubble
  const triggerSpeech = useCallback((text: string, duration = 2500) => {
    if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    setSpeech(text);
    speechTimeoutRef.current = setTimeout(() => {
      setSpeech(null);
    }, duration);
  }, []);

  // 5. ROOM SLIDE NAVIGATION (Buttons & Swipe Gestures)
  const changeRoom = (direction: 'next' | 'prev') => {
    sfx.slide();
    const currentIdx = ROOM_SEQUENCE.indexOf(currentRoom);
    let newIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (newIdx >= ROOM_SEQUENCE.length) newIdx = 0;
    if (newIdx < 0) newIdx = ROOM_SEQUENCE.length - 1;

    setSlideDirection(direction === 'next' ? 'right' : 'left');
    setCurrentRoom(ROOM_SEQUENCE[newIdx]);
    setIsFridgeOpen(false);

    setTimeout(() => {
      setSlideDirection('none');
    }, 300);
  };

  // Touch Swipe Handlers (Slide left/right to change room!)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Must be a predominantly horizontal swipe of at least 45px
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45) {
      if (diffX < 0) {
        // Swiped Left -> Go Next Room
        changeRoom('next');
      } else {
        // Swiped Right -> Go Prev Room
        changeRoom('prev');
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Pet tap interaction
  const handlePetTap = (e: React.MouseEvent) => {
    if (!pet) return;

    if (!isLampOn) {
      triggerSpeech('Mbeee... Aku sedang tidur nyenyak... Zzz...');
      return;
    }

    // In Bathroom: tap lathers soap bubbles!
    if (currentRoom === 'bathroom') {
      handleAddSoapBubbles(e);
      return;
    }

    // Play happy squeak
    sfx.happy();

    // Spawn heart particle
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHeartParticles((prev) => [...prev, { id: Date.now() + Math.random(), x, y }]);
    setTimeout(() => {
      setHeartParticles((prev) => prev.slice(1));
    }, 900);

    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 400);

    // Boost happiness
    const updated = {
      ...pet,
      happiness: Math.min(100, pet.happiness + 4),
    };
    addPetXp(updated, 2);

    if (pet.hunger < 35) {
      triggerSpeech('Mbeee... Perutku lapar, yuk ke Kitchen! 🍎');
    } else if (pet.cleanliness < 35) {
      triggerSpeech('Bulu wolku agak kotor, yuk ke Bathroom! 🚿');
    } else if (pet.happiness > 80) {
      const happyQuotes = [
        'Mbeee! Aku senang sekali bersamamu!',
        'Damai sejahtera besertamu!',
        'Kamu sahabat terbaikku!',
        'Hari yang penuh sukacita!',
      ];
      triggerSpeech(happyQuotes[Math.floor(Math.random() * happyQuotes.length)]);
    } else {
      triggerSpeech('Mbeee! Senang bertemu lagi!');
    }
  };

  // ==========================================
  // BEDROOM: POU LAMP TOGGLE (LIGHT / DARK)
  // ==========================================
  const handleToggleLamp = () => {
    if (!pet) return;
    sfx.lamp();
    const newLampState = !isLampOn;
    setIsLampOn(newLampState);

    const updated = {
      ...pet,
      isSleeping: !newLampState,
      sleepStartedAt: !newLampState ? Date.now() : null,
    };
    savePetState(updated);

    if (!newLampState) {
      triggerSpeech('Lampu dimatikan... Selamat tidur domba manis! Zzz...');
    } else {
      triggerSpeech('Lampu dinyalakan! Selamat pagi!');
    }
  };

  // ==========================================
  // KITCHEN: POU FEEDING CHOMP
  // ==========================================
  const handleFeedFood = (foodId: string) => {
    if (!pet || !economy) return;
    if (!isLampOn) {
      triggerSpeech('Nyalakan lampu kamar dulu ya...');
      return;
    }

    const food = FOOD_ITEMS.find((f) => f.id === foodId);
    if (!food) return;

    const count = pet.foodInventory[foodId] || 0;

    if (count <= 0) {
      if (economy.coins < food.price) {
        triggerSpeech(`Koin kurang! Butuh ${food.price} koin. Mainkan kuis untuk dapat koin.`);
        return;
      }
      addCoinsAndXp(-food.price, 0);
    } else {
      pet.foodInventory[foodId] = count - 1;
    }

    // Feeding motion & chomp sound
    setIsMouthOpen(true);
    setFeedingFood(foodId);
    sfx.eat();

    setTimeout(() => {
      setFeedingFood(null);
      setIsMouthOpen(false);
      setIsChewing(true);

      // Crumbs
      setCrumbs([
        { id: 1, x: 52, y: 68 },
        { id: 2, x: 62, y: 70 },
        { id: 3, x: 56, y: 72 },
      ]);
      setTimeout(() => setCrumbs([]), 600);

      setTimeout(() => {
        setIsChewing(false);
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 400);

        const newHunger = Math.min(100, pet.hunger + food.hungerBoost);
        const newHappiness = Math.min(100, pet.happiness + food.happinessBoost);

        const updated = {
          ...pet,
          hunger: newHunger,
          happiness: newHappiness,
        };

        addPetXp(updated, 8);
        triggerSpeech(`Nyam nyam! Lezat sekali! (+${food.hungerBoost}% Lapar)`);
      }, 500);
    }, 450);
  };

  // ==========================================
  // BATHROOM: SOAP SUDS & SHOWERHEAD RINSE
  // ==========================================
  const handleAddSoapBubbles = (e: React.MouseEvent) => {
    if (!pet || !isLampOn) return;
    sfx.bubble();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setBubbles((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), x, y, size: Math.floor(Math.random() * 16) + 16 },
    ]);

    if (bubbles.length >= 5) {
      triggerSpeech('Busa sabun sudah banyak! Tap shower di bawah untuk membilas!');
    }
  };

  const handleShowerRinse = () => {
    if (!pet || bubbles.length === 0) return;
    setIsShowering(true);
    sfx.shower();

    setTimeout(() => {
      setBubbles([]);
      setIsShowering(false);
      setIsSparkleClean(true);
      sfx.sparkle();
      setTimeout(() => setIsSparkleClean(false), 2000);

      const newClean = Math.min(100, pet.cleanliness + 35);
      const newHappy = Math.min(100, pet.happiness + 15);
      const updated = {
        ...pet,
        cleanliness: newClean,
        happiness: newHappy,
      };
      addPetXp(updated, 15);

      triggerSpeech('Bulu wol domba kembali bersih berseri dan wangi!');
      setIsJumping(true);
      setTimeout(() => setIsJumping(false), 500);
    }, 1300);
  };

  // ==========================================
  // PLAYROOM: BALL CATCH MINI-GAME
  // ==========================================
  const startBallCatch = () => {
    if (!pet) return;
    if (!isLampOn) {
      triggerSpeech('Nyalakan lampu kamar dulu ya!');
      return;
    }
    if (pet.energy < 10) {
      triggerSpeech('Energi terlalu rendah! Tidurkan di Bedroom sejenak ya...');
      return;
    }

    setIsPlayingBall(true);
    setBallScore(0);
    setBallTimeLeft(15);
    setBalls([]);
  };

  useEffect(() => {
    if (!isPlayingBall) return;

    ballTimerRef.current = setInterval(() => {
      setBallTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(ballTimerRef.current!);
          finishBallCatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const spawnInterval = setInterval(() => {
      setBalls((prev) => {
        if (prev.length >= 4) return prev;
        return [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x: Math.floor(Math.random() * 70) + 15,
            y: Math.floor(Math.random() * 55) + 20,
          },
        ];
      });
    }, 900);

    return () => {
      if (ballTimerRef.current) clearInterval(ballTimerRef.current);
      clearInterval(spawnInterval);
    };
  }, [isPlayingBall]);

  const handleCatchBall = (ballId: number) => {
    sfx.bounce();
    setBalls((prev) => prev.filter((b) => b.id !== ballId));
    setBallScore((prev) => prev + 1);
  };

  const finishBallCatch = () => {
    setIsPlayingBall(false);
    if (!pet) return;

    const coinsEarned = Math.max(5, ballScore * 3);
    const xpEarned = Math.max(10, ballScore * 4);

    sfx.coin();
    addCoinsAndXp(coinsEarned, xpEarned);

    const updated = {
      ...pet,
      happiness: Math.min(100, pet.happiness + 25),
      energy: Math.max(5, pet.energy - 10),
    };
    addPetXp(updated, xpEarned);

    triggerSpeech(`Hebat! Berhasil menangkap ${ballScore} bola! (+${coinsEarned} Koin)`);
  };

  // WARDROBE & DECOR EQUIP
  const handleEquipWardrobe = (item: typeof WARDROBE_ITEMS[0]) => {
    if (!pet || !economy) return;
    const isUnlocked = pet.unlockedWardrobe.includes(item.id) || item.isUnlockedByDefault;

    if (!isUnlocked) {
      if (economy.coins < item.price) {
        triggerSpeech(`Koin kurang! Butuh ${item.price} koin.`);
        return;
      }
      sfx.coin();
      addCoinsAndXp(-item.price, 0);
      pet.unlockedWardrobe.push(item.id);
    }

    const updated = { ...pet };
    if (item.type === 'hat') {
      updated.equippedHat = updated.equippedHat === item.id ? null : item.id;
    } else if (item.type === 'glasses') {
      updated.equippedGlasses = updated.equippedGlasses === item.id ? null : item.id;
    } else if (item.type === 'accessory') {
      updated.equippedAccessory = updated.equippedAccessory === item.id ? null : item.id;
    }

    savePetState(updated);
    triggerSpeech(`Penampilan domba jadi semakin keren!`);
  };

  const handleEquipFurniture = (item: typeof FURNITURE_ITEMS[0]) => {
    if (!pet || !economy) return;
    const isUnlocked = pet.unlockedFurniture.includes(item.id) || item.isUnlockedByDefault;

    if (!isUnlocked) {
      if (economy.coins < item.price) {
        triggerSpeech(`Koin kurang! Butuh ${item.price} koin.`);
        return;
      }
      sfx.coin();
      addCoinsAndXp(-item.price, 0);
      pet.unlockedFurniture.push(item.id);
    }

    const updated = { ...pet };
    if (item.type === 'bed') {
      updated.equippedBed = item.id;
    } else if (item.type === 'plant') {
      updated.equippedPlant = updated.equippedPlant === item.id ? null : item.id;
    } else if (item.type === 'wall') {
      updated.equippedWall = updated.equippedWall === item.id ? null : item.id;
    } else if (item.type === 'toy') {
      updated.equippedToy = updated.equippedToy === item.id ? null : item.id;
    }

    savePetState(updated);
    triggerSpeech(`Dekorasi kamar berhasil dipasang!`);
  };

  if (!pet || !economy) return null;

  // Status conditions
  let currentMood: 'happy' | 'neutral' | 'hungry' | 'sleepy' | 'dirty' = 'happy';
  if (pet.hunger < 35) currentMood = 'hungry';
  else if (pet.cleanliness < 35) currentMood = 'dirty';
  else if (pet.energy < 30) currentMood = 'sleepy';
  else if (pet.happiness < 40) currentMood = 'neutral';

  const dirtLevel = pet.cleanliness < 25 ? 3 : pet.cleanliness < 50 ? 2 : pet.cleanliness < 75 ? 1 : 0;

  return (
    <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full select-none animate-page-enter">
      {/* 1. TOP STATUS BAR (POU AUTHENTIC STATUS METERS) */}
      <div className="p-3 bg-white border-b border-[#EAEAEB] shadow-xs">
        <div className="flex items-center justify-between gap-2">
          {/* Back & Audio Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onBack}
              className="p-1 text-[#71717A] hover:text-[#111113] active:scale-95 transition-all"
              aria-label="Kembali"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                unlockAudio();
                if (!nextMuted) {
                  playPouHappy();
                  triggerSpeech('🔊 Suara aktif!');
                }
              }}
              className="p-1 text-[#71717A] hover:text-[#111113] active:scale-95 transition-all"
              title={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
              aria-label={isMuted ? 'Nyalakan Suara' : 'Bisukan Suara'}
            >
              {isMuted ? <VolumeX size={17} className="text-[#EF4444]" /> : <Volume2 size={17} className="text-[#111113]" />}
            </button>
          </div>

          {/* Left: Coins Pill with + Button (Pou style) */}
          <div className="flex items-center gap-1 bg-[#FAFAFA] border-2 border-[#111113] rounded-full px-2.5 py-0.5 shadow-xs">
            <Coins size={14} className="text-[#111113]" />
            <span className="text-xs font-black text-[#111113]">{economy.coins}</span>
          </div>

          {/* Center: 4 Pou-style Status Meters */}
          <div className="flex items-center gap-1.5">
            {/* Hunger (Food) */}
            <div className="w-10 h-9 bg-white border-2 border-[#111113] rounded-lg flex flex-col justify-between p-0.5 shadow-xs">
              <div className="flex items-center justify-center pt-0.5">
                <span className="text-[10px] font-black text-[#111113]">🍗</span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-2 rounded-xs overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    pet.hunger > 50 ? 'bg-[#22C55E]' : pet.hunger > 25 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                  }`}
                  style={{ width: `${pet.hunger}%` }}
                />
              </div>
            </div>

            {/* Cleanliness (Cross / Sponge) */}
            <div className="w-10 h-9 bg-white border-2 border-[#111113] rounded-lg flex flex-col justify-between p-0.5 shadow-xs">
              <div className="flex items-center justify-center pt-0.5">
                <span className="text-[10px] font-black text-[#111113]">🧼</span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-2 rounded-xs overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    pet.cleanliness > 50 ? 'bg-[#22C55E]' : pet.cleanliness > 25 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                  }`}
                  style={{ width: `${pet.cleanliness}%` }}
                />
              </div>
            </div>

            {/* Happiness (Lamb Face) */}
            <div className="w-10 h-9 bg-white border-2 border-[#111113] rounded-lg flex flex-col justify-between p-0.5 shadow-xs">
              <div className="flex items-center justify-center pt-0.5">
                <span className="text-[10px] font-black text-[#111113]">😊</span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-2 rounded-xs overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    pet.happiness > 50 ? 'bg-[#22C55E]' : pet.happiness > 25 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                  }`}
                  style={{ width: `${pet.happiness}%` }}
                />
              </div>
            </div>

            {/* Energy (Lightning) */}
            <div className="w-10 h-9 bg-white border-2 border-[#111113] rounded-lg flex flex-col justify-between p-0.5 shadow-xs">
              <div className="flex items-center justify-center pt-0.5">
                <span className="text-[10px] font-black text-[#111113]">⚡</span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-2 rounded-xs overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    pet.energy > 50 ? 'bg-[#22C55E]' : pet.energy > 25 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
                  }`}
                  style={{ width: `${pet.energy}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Level Pill (Egg Shape from screenshot) */}
          <div className="w-8 h-8 rounded-full border-2 border-[#111113] bg-white flex items-center justify-center font-black text-xs text-[#111113] shadow-xs">
            {pet.level}
          </div>
        </div>

        {/* 2. POU ROOM NAVIGATION HEADER (Arrows + Room Title) */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#EAEAEB]">
          <button
            onClick={() => changeRoom('prev')}
            className="w-8 h-8 rounded-lg border-2 border-[#111113] bg-white flex items-center justify-center font-black text-sm active:scale-95 shadow-xs"
            title="Kamar Sebelumnya"
          >
            <ChevronLeft size={18} strokeWidth={3} />
          </button>

          {/* Bubble font styled room title */}
          <span className="text-sm font-black tracking-tight text-[#111113]">
            {ROOM_TITLES[currentRoom]}
          </span>

          <button
            onClick={() => changeRoom('next')}
            className="w-8 h-8 rounded-lg border-2 border-[#111113] bg-white flex items-center justify-center font-black text-sm active:scale-95 shadow-xs"
            title="Kamar Berikutnya"
          >
            <ChevronRight size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* 3. CENTER ROOM STAGE (SWIPEABLE / SLIDEABLE + REAL POU SCENERY) */}
      <div
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`relative flex-1 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
          slideDirection === 'right'
            ? 'animate-slide-from-right'
            : slideDirection === 'left'
            ? 'animate-slide-from-left'
            : ''
        } ${
          !isLampOn
            ? 'bg-[#14141E]' // Night Dark
            : currentRoom === 'bedroom'
            ? 'bg-[#FEF08A]' // Authentic Pou Warm Yellow Bedroom Wall!
            : currentRoom === 'bathroom'
            ? 'bg-[#E0F2FE]' // Bathroom Sky Blue Tile
            : currentRoom === 'kitchen'
            ? 'bg-[#FEF3C7]' // Kitchen Warm Amber
            : 'bg-[#E2E8F0]' // Game Room Slate
        }`}
      >
        {/* ROOM CEILING AMBIENT (STARS / MOON WHEN SLEEPING) */}
        {!isLampOn ? (
          <div className="absolute top-4 left-6 z-0 flex items-center gap-2">
            <span className="text-amber-200 text-xl animate-pulse">🌙</span>
            <span className="text-white/60 text-xs">✨</span>
          </div>
        ) : currentRoom === 'bedroom' && (
          <div className="absolute top-4 left-6 z-0 opacity-40">
            <span className="text-amber-700 text-xs font-bold tracking-widest uppercase">
              • Faith Home •
            </span>
          </div>
        )}

        {/* FLOATING SLEEP ZZZ PARTICLES */}
        {!isLampOn && (
          <div className="absolute top-20 right-20 text-neutral-300 font-extrabold text-sm animate-pulse z-20 flex flex-col items-center">
            <span className="text-xs">z</span>
            <span className="text-sm -mr-3">Z</span>
            <span className="text-base -mr-6 text-white">Z</span>
          </div>
        )}

        {/* SPEECH BUBBLE */}
        {speech && (
          <div className="absolute top-10 z-30 animate-scale-in">
            <div className="relative bg-white border-2 border-[#111113] shadow-md px-3.5 py-1.5 rounded-2xl text-xs font-black text-[#111113] max-w-[220px] text-center">
              {speech}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-[#111113] rotate-45" />
            </div>
          </div>
        )}

        {/* KITCHEN FEEDING ITEM MOTION */}
        {feedingFood && (
          <div className="absolute z-30 pointer-events-none animate-bounce" style={{ top: '38%' }}>
            <FoodVector type={feedingFood} size={42} />
          </div>
        )}

        {/* CRUMBS PARTICLES */}
        {crumbs.map((c) => (
          <div
            key={c.id}
            className="absolute w-2 h-2 bg-amber-800 rounded-full animate-ping z-30"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
          />
        ))}

        {/* PLAYROOM BALL CATCH OVERLAY */}
        {isPlayingBall && (
          <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-xs flex flex-col justify-between p-4">
            <div className="flex items-center justify-between text-white font-bold">
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
                Waktu: {ballTimeLeft}s
              </span>
              <span className="text-xs bg-white text-black px-3 py-1 rounded-full">
                Skor: {ballScore}
              </span>
            </div>

            <div className="relative flex-1 w-full">
              {balls.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleCatchBall(b.id)}
                  className="absolute p-2 active:scale-125 transition-transform"
                  style={{ left: `${b.x}%`, top: `${b.y}%` }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shadow-md border-2 border-white flex items-center justify-center animate-bounce">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-white/80 pb-2 font-medium">
              Tap bola melayang untuk menangkapnya!
            </p>
          </div>
        )}

        {/* CENTER STAGE: PET ON BED (BEDROOM) OR FLOOR */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* IN BEDROOM: POU AUTHENTIC FLUFFY WHITE PILLOW BED RIGHT UNDER THE LAMB! */}
          {currentRoom === 'bedroom' && (
            <div className="absolute top-10 pointer-events-none z-0">
              <PouPillowBed size={260} />
            </div>
          )}

          {/* IN KITCHEN: DINING PLATE / TABLE SURFACE UNDER LAMB */}
          {currentRoom === 'kitchen' && (
            <div className="absolute -bottom-4 w-48 h-6 bg-[#D4A373] border-2 border-[#111113] rounded-2xl z-0" />
          )}

          {/* IN BATHROOM: FLOOR DRAIN */}
          {currentRoom === 'bathroom' && (
            <div className="absolute -bottom-8 right-0 w-14 h-7 rounded-full border-2 border-[#111113] bg-[#94A3B8]/30 flex items-center justify-center z-0">
              <div className="w-8 h-2.5 rounded-full border border-[#475569]" />
            </div>
          )}

          {/* THE FAITH LAMB MASCOT (WITH WALKING ANIMATION & INTERACTION) */}
          <div
            onClick={handlePetTap}
            className="relative z-10 cursor-pointer pt-4"
          >
            {/* Heart Particles */}
            {heartParticles.map((p) => (
              <div
                key={p.id}
                className="absolute pointer-events-none text-rose-500 font-bold text-lg animate-float-up z-30"
                style={{ left: p.x, top: p.y }}
              >
                ♥
              </div>
            ))}

            {/* Sparkle Clean Star Burst */}
            {isSparkleClean && (
              <div className="absolute -top-6 text-amber-500 font-black text-2xl animate-ping z-30">
                ✨
              </div>
            )}

            {/* Faith Lamb Mascot with Walking / Waddling Support */}
            <FaithLamb
              stage={pet.stage}
              mood={currentMood}
              isBlinking={isBlinking}
              isMouthOpen={isMouthOpen}
              isChewing={isChewing}
              isSleeping={!isLampOn}
              isJumping={isJumping}
              isWalking={isWalking && isLampOn}
              equippedHat={pet.equippedHat}
              equippedGlasses={pet.equippedGlasses}
              equippedAccessory={pet.equippedAccessory}
              eyeOffsetX={eyeOffset.x}
              eyeOffsetY={eyeOffset.y}
              dirtLevel={dirtLevel}
            />

            {/* Soap Suds Bubbles on Lamb (Bathroom) */}
            {bubbles.map((b) => (
              <div
                key={b.id}
                className="absolute rounded-full bg-white/85 border border-blue-300 backdrop-blur-xs animate-pulse pointer-events-none flex items-center justify-center shadow-xs"
                style={{
                  left: b.x - b.size / 2,
                  top: b.y - b.size / 2,
                  width: b.size,
                  height: b.size,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white absolute top-1 left-1" />
              </div>
            ))}
          </div>
        </div>

        {/* SHOWER STREAMING WATER ANIMATION */}
        {isShowering && (
          <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center bg-blue-500/15 backdrop-blur-xs animate-pulse">
            <ShowerheadToolVector size={68} />
            <span className="text-xs font-black text-blue-900 mt-2 bg-white/95 px-3 py-1 rounded-full border border-blue-200 shadow-xs">
              Membilas bulu domba hingga bersih...
            </span>
          </div>
        )}
      </div>

      {/* 4. REAL POU FLOOR BASE WITH ICON BUTTONS (AUTHENTIC POU BOTTOM ROW) */}
      <div
        className={`border-t-4 border-[#111113] p-2.5 transition-colors ${
          !isLampOn
            ? 'bg-[#0E0E17]' // Night Floor
            : 'bg-[#849B35]' // Authentic Pou Olive-Green Floorboard!
        }`}
      >
        {/* BEDROOM FLOOR ROW: Closet | Lamp | Shop */}
        {currentRoom === 'bedroom' && (
          <div className="flex items-end justify-around max-w-xs mx-auto animate-page-enter">
            {/* Closet */}
            <button
              onClick={() => setActiveModal(activeModal === 'closet' ? 'none' : 'closet')}
              className="flex flex-col items-center active:scale-95 transition-transform"
            >
              <PouClosetVector size={48} />
              <span className="text-[11px] font-black text-white mt-1 drop-shadow-xs">
                Closet
              </span>
            </button>

            {/* Lamp (Click to Toggle Light/Dark) */}
            <button
              onClick={handleToggleLamp}
              className="flex flex-col items-center active:scale-95 transition-transform"
            >
              <PouBedsideLamp isOn={isLampOn} size={54} />
              <span className="text-[11px] font-black text-white mt-1 drop-shadow-xs">
                {isLampOn ? 'Lamp' : 'Lights On'}
              </span>
            </button>

            {/* Shop */}
            <button
              onClick={() => setActiveModal(activeModal === 'shop' ? 'none' : 'shop')}
              className="flex flex-col items-center active:scale-95 transition-transform"
            >
              <PouShopVector size={48} />
              <span className="text-[11px] font-black text-white mt-1 drop-shadow-xs">
                Shop
              </span>
            </button>
          </div>
        )}

        {/* KITCHEN FLOOR ROW: Fridge | Feed Quick | Food Shop */}
        {currentRoom === 'kitchen' && (
          <div className="flex items-end justify-around max-w-xs mx-auto animate-page-enter">
            {/* Fridge */}
            <button
              onClick={() => setIsFridgeOpen(!isFridgeOpen)}
              className="flex flex-col items-center active:scale-95 transition-transform"
            >
              <PouFridgeVector size={48} />
              <span className="text-[11px] font-black text-white mt-1 drop-shadow-xs">
                Fridge
              </span>
            </button>

            {/* Food Platter / Quick Feed */}
            <div className="flex items-center gap-1.5 bg-white/20 p-1.5 rounded-2xl backdrop-blur-xs border border-white/30">
              {FOOD_ITEMS.slice(0, 3).map((food) => (
                <button
                  key={food.id}
                  onClick={() => handleFeedFood(food.id)}
                  className="p-1 rounded-xl bg-white border border-[#111113] active:scale-95 transition-transform"
                  title={food.name}
                >
                  <FoodVector type={food.id} size={24} />
                </button>
              ))}
            </div>

            {/* Shop */}
            <button
              onClick={() => setActiveModal('shop')}
              className="flex flex-col items-center active:scale-95 transition-transform"
            >
              <PouShopVector size={48} />
              <span className="text-[11px] font-black text-white mt-1 drop-shadow-xs">
                Shop
              </span>
            </button>
          </div>
        )}

        {/* BATHROOM FLOOR ROW: Soap Tool | Shower Rinse Tool */}
        {currentRoom === 'bathroom' && (
          <div className="flex items-end justify-around max-w-xs mx-auto animate-page-enter">
            {/* Soap */}
            <div className="flex flex-col items-center">
              <div className="p-1.5 rounded-2xl bg-white border-2 border-[#111113] shadow-xs flex items-center justify-center">
                <SoapToolVector size={42} />
              </div>
              <span className="text-[11px] font-black text-white mt-1 drop-shadow-xs">
                Soap (Tap Lamb)
              </span>
            </div>

            {/* Shower Tool */}
            <button
              onClick={handleShowerRinse}
              disabled={bubbles.length === 0}
              className={`flex flex-col items-center active:scale-95 transition-transform ${
                bubbles.length > 0 ? 'opacity-100' : 'opacity-60'
              }`}
            >
              <div className="p-1.5 rounded-2xl bg-white border-2 border-[#111113] shadow-xs flex items-center justify-center">
                <ShowerheadToolVector size={42} />
              </div>
              <span className="text-[11px] font-black text-white mt-1 drop-shadow-xs">
                Shower ({bubbles.length})
              </span>
            </button>
          </div>
        )}

        {/* PLAYROOM FLOOR ROW: Game Start | Shop */}
        {currentRoom === 'playroom' && (
          <div className="flex items-end justify-around max-w-xs mx-auto animate-page-enter">
            {/* Mini Game Play */}
            <button
              onClick={startBallCatch}
              className="flex flex-col items-center active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#111113] flex items-center justify-center shadow-xs">
                <Play size={20} className="fill-[#111113] text-[#111113]" />
              </div>
              <span className="text-[11px] font-black text-white mt-1 drop-shadow-xs">
                Ball Game
              </span>
            </button>

            {/* Toggle Walking / Resting Animation */}
            <button
              onClick={() => setIsWalking(!isWalking)}
              className="flex flex-col items-center active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#111113] flex items-center justify-center shadow-xs">
                <span className="text-xs font-black">{isWalking ? '🚶' : '🧍'}</span>
              </div>
              <span className="text-[11px] font-black text-white mt-1 drop-shadow-xs">
                {isWalking ? 'Jalan' : 'Diam'}
              </span>
            </button>
          </div>
        )}

        {/* KITCHEN FRIDGE DRAWER (IF OPENED) */}
        {isFridgeOpen && currentRoom === 'kitchen' && (
          <div className="mt-2 p-2 bg-white rounded-2xl border-2 border-[#111113] animate-page-enter">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#111113]">
                Isi Kulkas (Fridge)
              </span>
              <button
                onClick={() => setIsFridgeOpen(false)}
                className="text-[#71717A] hover:text-black"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {FOOD_ITEMS.map((f) => {
                const count = pet.foodInventory[f.id] || 0;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleFeedFood(f.id)}
                    className="p-1 rounded-xl border border-[#EAEAEB] hover:bg-[#FAFAFA] flex flex-col items-center active:scale-95"
                    title={f.name}
                  >
                    <FoodVector type={f.id} size={24} />
                    <span className="text-[9px] font-bold text-[#111113] mt-0.5">{count}x</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CLOSET / WARDROBE MODAL (IF OPENED IN BEDROOM) */}
        {activeModal === 'closet' && (
          <div className="mt-2 p-2.5 bg-white rounded-2xl border-2 border-[#111113] animate-page-enter">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#111113]">
                Closet Domba (Topi & Aksesoris)
              </span>
              <button
                onClick={() => setActiveModal('none')}
                className="text-[#71717A] hover:text-black"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-0.5">
              {WARDROBE_ITEMS.map((item) => {
                const isUnlocked = pet.unlockedWardrobe.includes(item.id) || item.isUnlockedByDefault;
                const isEquipped =
                  pet.equippedHat === item.id ||
                  pet.equippedGlasses === item.id ||
                  pet.equippedAccessory === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleEquipWardrobe(item)}
                    className={`p-1.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                      isEquipped
                        ? 'bg-[#FAFAFA] border-2 border-black'
                        : isUnlocked
                        ? 'bg-white border-[#EAEAEB]'
                        : 'bg-[#FAFAFA] border-[#EAEAEB] opacity-80'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold text-[#111113] line-clamp-1">{item.name}</span>
                    <span className="text-[9px] font-bold mt-1 text-[#111113]">
                      {isEquipped ? 'Pakai' : isUnlocked ? 'Milikmu' : `${item.price}k`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SHOP MODAL (IF OPENED) */}
        {activeModal === 'shop' && (
          <div className="mt-2 p-2.5 bg-white rounded-2xl border-2 border-[#111113] animate-page-enter">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#111113]">
                Shop Perabotan & Makanan
              </span>
              <button
                onClick={() => setActiveModal('none')}
                className="text-[#71717A] hover:text-black"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-0.5">
              {FURNITURE_ITEMS.map((f) => {
                const isUnlocked = pet.unlockedFurniture.includes(f.id) || f.isUnlockedByDefault;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleEquipFurniture(f)}
                    className="p-1.5 rounded-xl border border-[#EAEAEB] bg-[#FAFAFA] flex flex-col items-center text-center active:scale-95"
                  >
                    <span className="text-[10px] font-bold text-[#111113] line-clamp-1">{f.name}</span>
                    <span className="text-[9px] font-bold text-[#71717A] mt-1">
                      {isUnlocked ? 'Terpasang' : `${f.price} Koin`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
