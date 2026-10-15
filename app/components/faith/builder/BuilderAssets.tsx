'use client';

import React from 'react';

// =========================================================================
// CUSTOM VECTOR ASSETS FOR CHURCH BUILDER (100% SVG - NO EMOJIS)
// Cozy, clean, classic simulation style designed specifically for Faith Hub
// =========================================================================

// --- 1. RESOURCE BADGE ICONS ---

export function BuilderCoinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6.5" fill="#FCD34D" stroke="#D97706" strokeWidth="1" />
      <path d="M12 8V16M10 10H13.5C14.3 10 14.5 11 13.5 11.5H10.5C9.5 12 9.7 13 10.5 13H14" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function BuilderWoodIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Three stacked rustic logs */}
      <rect x="4" y="13" width="13" height="6" rx="3" fill="#92400E" stroke="#78350F" strokeWidth="1.2" />
      <circle cx="17" cy="16" r="3" fill="#D97706" stroke="#78350F" strokeWidth="1.2" />
      <circle cx="17" cy="16" r="1.5" stroke="#92400E" strokeWidth="0.8" />

      <rect x="7" y="7" width="13" height="6" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="1.2" />
      <circle cx="20" cy="10" r="3" fill="#FBBF24" stroke="#78350F" strokeWidth="1.2" />
      <circle cx="20" cy="10" r="1.5" stroke="#B45309" strokeWidth="0.8" />
    </svg>
  );
}

export function BuilderFaithStarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L14.2 8.3L20.5 10.5L14.2 12.7L12 19L9.8 12.7L3.5 10.5L9.8 8.3L12 2Z"
        fill="#6366F1"
        stroke="#4338CA"
        strokeWidth="1.2"
      />
      <circle cx="12" cy="10.5" r="2.5" fill="#C7D2FE" />
      <path d="M12 8.5V12.5M10.5 10H13.5" stroke="#312E81" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function BuilderCommunityIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="8" r="3" fill="#111113" />
      <path d="M4 18C4 15 6 13.5 9 13.5C12 13.5 14 15 14 18" stroke="#111113" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16.5" cy="9.5" r="2.5" fill="#52525B" />
      <path d="M14 17.5C14.3 15.5 15.5 14.5 17 14.5C19 14.5 20.5 15.8 20.5 18" stroke="#52525B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// --- 2. GROUND & TILES ---

export function GrassTile({ x = 0, y = 0 }: { x?: number; y?: number }) {
  const isAlt = (x + y) % 2 === 0;
  return (
    <div
      className={`w-full h-full relative transition-colors duration-500 border border-emerald-900/10 ${
        isAlt ? 'bg-[#5FA052]' : 'bg-[#559348]'
      }`}
    >
      {/* Subtle grass tufts */}
      {(x + y) % 3 === 0 && (
        <svg className="absolute bottom-1 right-1 w-2.5 h-2.5 opacity-40" viewBox="0 0 10 10">
          <path d="M2 9L3 5M5 9L6 4M8 9L7 6" stroke="#22541C" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )}
      {(x * 2 + y) % 5 === 0 && (
        <div className="absolute top-1 left-1.5 w-1 h-1 rounded-full bg-white/70 shadow-xs" />
      )}
    </div>
  );
}

export function CobblestonePathTile() {
  return (
    <div className="w-full h-full bg-[#9CA3AF] relative border border-[#6B7280]/30 p-0.5 grid grid-cols-2 grid-rows-2 gap-0.5">
      <div className="bg-[#D1D5DB] rounded-xs shadow-xs" />
      <div className="bg-[#E5E7EB] rounded-xs shadow-xs" />
      <div className="bg-[#E5E7EB] rounded-xs shadow-xs" />
      <div className="bg-[#D1D5DB] rounded-xs shadow-xs" />
    </div>
  );
}

export function BrickPathTile() {
  return (
    <div className="w-full h-full bg-[#B45309] relative border border-[#78350F]/40 p-0.5 flex flex-col justify-between">
      <div className="h-1.5 bg-[#D97706] rounded-xs w-full" />
      <div className="h-1.5 bg-[#F59E0B] rounded-xs w-full" />
      <div className="h-1.5 bg-[#D97706] rounded-xs w-full" />
    </div>
  );
}

// --- 3. CUSTOM BUILDINGS VECTOR TILES ---

// SMALL CHURCH (2x2)
export function TileSmallChurch({ level = 1, isNight = false }: { level?: number; isNight?: boolean }) {
  return (
    <div className="w-full h-full relative flex items-center justify-center p-1 select-none pointer-events-none">
      <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
        {/* Foundation stone */}
        <rect x="18" y="76" width="64" height="8" rx="2" fill="#6B7280" stroke="#374151" strokeWidth="1.5" />
        
        {/* Main wooden wall body */}
        <rect x="22" y="42" width="56" height="34" rx="2" fill="#E5D0BA" stroke="#78350F" strokeWidth="1.5" />
        {/* Wood siding horizontal planks */}
        <line x1="22" y1="50" x2="78" y2="50" stroke="#CBB196" strokeWidth="1" />
        <line x1="22" y1="58" x2="78" y2="58" stroke="#CBB196" strokeWidth="1" />
        <line x1="22" y1="66" x2="78" y2="66" stroke="#CBB196" strokeWidth="1" />

        {/* Steeple tower in back/center */}
        <rect x="42" y="16" width="16" height="26" fill="#D7C1A8" stroke="#78350F" strokeWidth="1.5" />
        <polygon points="40,16 50,2 60,16" fill="#991B1B" stroke="#78350F" strokeWidth="1.5" />
        
        {/* Golden Cross on Steeple */}
        <path d="M50 0V8M47 3H53" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />

        {/* Main Gabled Roof (Red Terracotta shingles) */}
        <polygon points="14,44 50,22 86,44" fill="#B91C1C" stroke="#78350F" strokeWidth="2" />
        <polygon points="18,42 50,25 82,42" fill="#DC2626" />

        {/* Stained Glass Window over door */}
        <path
          d="M45 46 A5 5 0 0 1 55 46 V54 H45 Z"
          fill={isNight ? '#FDE047' : '#60A5FA'}
          stroke="#78350F"
          strokeWidth="1.2"
        />
        {isNight && (
          <circle cx="50" cy="50" r="8" fill="#FDE047" opacity="0.4" className="animate-pulse" />
        )}
        <line x1="50" y1="41" x2="50" y2="54" stroke="#78350F" strokeWidth="0.8" />
        <line x1="45" y1="47" x2="55" y2="47" stroke="#78350F" strokeWidth="0.8" />

        {/* Double Wooden Doors */}
        <path d="M42 60 A8 8 0 0 1 58 60 V76 H42 Z" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
        <line x1="50" y1="52" x2="50" y2="76" stroke="#451A03" strokeWidth="1.2" />
        <circle cx="47" cy="67" r="1" fill="#FBBF24" />
        <circle cx="53" cy="67" r="1" fill="#FBBF24" />

        {/* Level badge star */}
        {level > 1 && (
          <g transform="translate(68, 62)">
            <circle cx="6" cy="6" r="6" fill="#111113" stroke="#FBBF24" strokeWidth="1.2" />
            <text x="6" y="8.5" fontSize="7" fontWeight="bold" fill="#FBBF24" textAnchor="middle">
              {level}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// CHAPEL (2x2)
export function TileChapel({ level = 1, isNight = false }: { level?: number; isNight?: boolean }) {
  return (
    <div className="w-full h-full relative flex items-center justify-center p-1 select-none pointer-events-none">
      <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
        {/* Stone foundation */}
        <rect x="15" y="78" width="70" height="7" fill="#4B5563" rx="1.5" />
        {/* Stone block body */}
        <rect x="20" y="44" width="60" height="34" fill="#9CA3AF" stroke="#374151" strokeWidth="1.5" />
        
        {/* Bell Tower */}
        <rect x="22" y="18" width="20" height="26" fill="#9CA3AF" stroke="#374151" strokeWidth="1.5" />
        <polygon points="19,18 32,5 45,18" fill="#374151" stroke="#1F2937" strokeWidth="1.5" />
        {/* Bell */}
        <path d="M30 25C30 22 34 22 34 25V28H30V25Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
        {/* Cross on top of bell tower */}
        <path d="M32 2V6M30 4H34" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />

        {/* Roof Slate Gray */}
        <polygon points="38,44 65,26 92,44" fill="#374151" stroke="#1F2937" strokeWidth="2" />
        <polygon points="42,42 65,28 88,42" fill="#4B5563" />

        {/* Arch Stained Glass Windows */}
        <path d="M52 50 A4 4 0 0 1 60 50 V60 H52 Z" fill={isNight ? '#FDE047' : '#A78BFA'} stroke="#374151" strokeWidth="1" />
        <path d="M68 50 A4 4 0 0 1 76 50 V60 H68 Z" fill={isNight ? '#FDE047' : '#A78BFA'} stroke="#374151" strokeWidth="1" />

        {/* Arched Stone Doorway */}
        <path d="M56 64 A6 6 0 0 1 72 64 V78 H56 Z" fill="#78350F" stroke="#374151" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// MAIN CHURCH / CATHEDRAL (2x2)
export function TileMainChurch({ level = 1, isNight = false }: { level?: number; isNight?: boolean }) {
  return (
    <div className="w-full h-full relative flex items-center justify-center p-1 select-none pointer-events-none">
      <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
        {/* Marble steps */}
        <rect x="12" y="80" width="76" height="6" fill="#D1D5DB" stroke="#6B7280" strokeWidth="1" />
        {/* Grand facade */}
        <rect x="18" y="38" width="64" height="42" fill="#F3F4F6" stroke="#4B5563" strokeWidth="1.5" />

        {/* Twin Spires */}
        <rect x="18" y="20" width="14" height="20" fill="#E5E7EB" stroke="#4B5563" strokeWidth="1.2" />
        <polygon points="16,20 25,4 34,20" fill="#1E3A8A" stroke="#1E293B" strokeWidth="1.5" />
        <path d="M25 1V5M23 3H27" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />

        <rect x="68" y="20" width="14" height="20" fill="#E5E7EB" stroke="#4B5563" strokeWidth="1.2" />
        <polygon points="66,20 75,4 84,20" fill="#1E3A8A" stroke="#1E293B" strokeWidth="1.5" />
        <path d="M75 1V5M73 3H77" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />

        {/* Central Triangle Pediment & Grand Cross */}
        <polygon points="32,38 50,22 68,38" fill="#E5E7EB" stroke="#4B5563" strokeWidth="1.5" />
        <path d="M50 14V22M47 17H53" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" />

        {/* Large Rose Window */}
        <circle cx="50" cy="46" r="8" fill={isNight ? '#FDE047' : '#60A5FA'} stroke="#1E3A8A" strokeWidth="1.2" />
        <circle cx="50" cy="46" r="3" fill="#F87171" />

        {/* Triple Arched Doors */}
        <path d="M42 64 A8 8 0 0 1 58 64 V80 H42 Z" fill="#92400E" stroke="#451A03" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// FELLOWSHIP HALL (2x2)
export function TileFellowshipHall({ isNight = false }: { isNight?: boolean }) {
  return (
    <div className="w-full h-full relative flex items-center justify-center p-1 select-none pointer-events-none">
      <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
        <rect x="16" y="45" width="68" height="35" rx="2" fill="#FED7AA" stroke="#9A3412" strokeWidth="1.5" />
        <polygon points="12,46 50,24 88,46" fill="#C2410C" stroke="#7C2D12" strokeWidth="2" />
        
        {/* Welcome Banner */}
        <rect x="30" y="38" width="40" height="7" rx="1.5" fill="#111113" />
        <text x="50" y="43" fill="#FFFFFF" fontSize="4.5" fontWeight="bold" textAnchor="middle">
          FELLOWSHIP
        </text>

        {/* Big Windows */}
        <rect x="22" y="52" width="12" height="12" rx="1" fill={isNight ? '#FEF08A' : '#BFDBFE'} stroke="#9A3412" strokeWidth="1" />
        <rect x="66" y="52" width="12" height="12" rx="1" fill={isNight ? '#FEF08A' : '#BFDBFE'} stroke="#9A3412" strokeWidth="1" />
        
        {/* Center Double Glass Door */}
        <rect x="42" y="54" width="16" height="26" fill="#E0F2FE" stroke="#9A3412" strokeWidth="1.5" />
        <line x1="50" y1="54" x2="50" y2="80" stroke="#9A3412" strokeWidth="1" />
      </svg>
    </div>
  );
}

// FAITH CAFE (2x2)
export function TileCafe({ isNight = false }: { isNight?: boolean }) {
  return (
    <div className="w-full h-full relative flex items-center justify-center p-1 select-none pointer-events-none">
      <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-md">
        <rect x="18" y="42" width="64" height="38" fill="#FDF4FF" stroke="#86198F" strokeWidth="1.5" />
        {/* Striped Canopy Awning */}
        <polygon points="14,44 14,34 86,34 86,44" fill="#C026D3" stroke="#86198F" strokeWidth="1.5" />
        <path d="M14 44 Q23 48 32 44 Q41 48 50 44 Q59 48 68 44 Q77 48 86 44" fill="#C026D3" stroke="#86198F" strokeWidth="1.5" />
        {/* White stripes */}
        <rect x="23" y="34" width="9" height="10" fill="#FFFFFF" />
        <rect x="41" y="34" width="9" height="10" fill="#FFFFFF" />
        <rect x="59" y="34" width="9" height="10" fill="#FFFFFF" />
        <rect x="77" y="34" width="9" height="10" fill="#FFFFFF" />

        {/* Coffee Cup Sign */}
        <circle cx="50" cy="24" r="8" fill="#701A75" stroke="#FDF4FF" strokeWidth="1.5" />
        <path d="M46 22H53V26C53 28 51 28 49.5 28C48 28 46 28 46 26V22Z" fill="#FDF4FF" />
        <path d="M53 23H55C55.5 23 56 23.5 56 24C56 24.5 55.5 25 55 25H53" stroke="#FDF4FF" strokeWidth="0.8" />

        {/* Cafe Front Window with interior lights */}
        <rect x="24" y="52" width="22" height="16" fill={isNight ? '#FEF08A' : '#FCE7F3'} stroke="#86198F" strokeWidth="1" />
        {/* Door */}
        <rect x="54" y="50" width="18" height="30" fill="#E879F9" stroke="#86198F" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// PRAYER GARDEN (2x2)
export function TilePrayerGarden() {
  return (
    <div className="w-full h-full relative flex items-center justify-center p-1 select-none pointer-events-none">
      <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-sm">
        {/* Stone gravel circular courtyard */}
        <circle cx="50" cy="50" r="42" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="3 2" />
        <circle cx="50" cy="50" r="32" fill="#D1D5DB" />
        
        {/* Center Stone Cross */}
        <rect x="47" y="24" width="6" height="32" fill="#4B5563" rx="1" />
        <rect x="38" y="32" width="24" height="6" fill="#4B5563" rx="1" />
        <circle cx="50" cy="56" r="10" fill="#9CA3AF" stroke="#4B5563" strokeWidth="1" />

        {/* Flower bushes surrounding */}
        <circle cx="22" cy="30" r="6" fill="#F472B6" />
        <circle cx="24" cy="32" r="5" fill="#DB2777" />
        <circle cx="78" cy="30" r="6" fill="#A78BFA" />
        <circle cx="76" cy="32" r="5" fill="#7C3AED" />

        {/* Wooden Bench */}
        <rect x="36" y="70" width="28" height="6" rx="2" fill="#92400E" stroke="#78350F" strokeWidth="1" />
        <line x1="39" y1="76" x2="39" y2="82" stroke="#451A03" strokeWidth="1.5" />
        <line x1="61" y1="76" x2="61" y2="82" stroke="#451A03" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// PLAYGROUND (2x2)
export function TilePlayground() {
  return (
    <div className="w-full h-full relative flex items-center justify-center p-1 select-none pointer-events-none">
      <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-sm">
        {/* Sandbox */}
        <rect x="14" y="18" width="72" height="64" rx="6" fill="#FDE68A" stroke="#D97706" strokeWidth="2" />
        
        {/* Swingset */}
        <line x1="22" y1="30" x2="22" y2="70" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="30" x2="50" y2="70" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
        <line x1="20" y1="32" x2="52" y2="32" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
        {/* Swing ropes & seat */}
        <line x1="32" y1="34" x2="32" y2="58" stroke="#78350F" strokeWidth="1.2" />
        <line x1="40" y1="34" x2="40" y2="58" stroke="#78350F" strokeWidth="1.2" />
        <rect x="30" y="58" width="12" height="3" rx="1" fill="#2563EB" />

        {/* Slide */}
        <path d="M60 68 L76 36 L82 36" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" fill="none" />
        <line x1="82" y1="36" x2="82" y2="70" stroke="#16A34A" strokeWidth="3" />
      </svg>
    </div>
  );
}

// PARKING AREA (2x2)
export function TileParking() {
  return (
    <div className="w-full h-full relative flex items-center justify-center p-1 select-none pointer-events-none">
      <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-sm">
        {/* Asphalt */}
        <rect x="10" y="10" width="80" height="80" rx="4" fill="#374151" stroke="#1F2937" strokeWidth="2" />
        {/* White parking bay stripes */}
        <line x1="18" y1="28" x2="44" y2="28" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="18" y1="50" x2="44" y2="50" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="18" y1="72" x2="44" y2="72" stroke="#FFFFFF" strokeWidth="2" />

        <line x1="56" y1="28" x2="82" y2="28" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="56" y1="50" x2="82" y2="50" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="56" y1="72" x2="82" y2="72" stroke="#FFFFFF" strokeWidth="2" />

        {/* Parked Cute Sedan Car */}
        <g transform="translate(20, 32)">
          <rect x="2" y="2" width="20" height="12" rx="3" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
          <rect x="6" y="4" width="7" height="8" rx="1" fill="#93C5FD" />
          <circle cx="5" cy="2" r="1.5" fill="#111113" />
          <circle cx="19" cy="2" r="1.5" fill="#111113" />
          <circle cx="5" cy="14" r="1.5" fill="#111113" />
          <circle cx="19" cy="14" r="1.5" fill="#111113" />
        </g>
      </svg>
    </div>
  );
}

// 1x1 TILES:
export function TileOakTree() {
  return (
    <div className="w-full h-full relative flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 50 50" className="w-full h-full filter drop-shadow-sm">
        {/* Trunk */}
        <rect x="22" y="30" width="6" height="14" rx="1" fill="#78350F" stroke="#451A03" strokeWidth="1" />
        {/* Foliage Canopy */}
        <circle cx="25" cy="22" r="16" fill="#15803D" />
        <circle cx="20" cy="18" r="11" fill="#22C55E" />
        <circle cx="30" cy="18" r="11" fill="#16A34A" />
        <circle cx="25" cy="14" r="9" fill="#4ADE80" />
      </svg>
    </div>
  );
}

export function TilePineTree() {
  return (
    <div className="w-full h-full relative flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 50 50" className="w-full h-full filter drop-shadow-sm">
        <rect x="23" y="36" width="4" height="10" fill="#78350F" />
        <polygon points="25,4 12,24 38,24" fill="#065F46" />
        <polygon points="25,12 10,32 40,32" fill="#047857" />
        <polygon points="25,20 8,38 42,38" fill="#059669" />
      </svg>
    </div>
  );
}

export function TileBench() {
  return (
    <div className="w-full h-full relative flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 50 50" className="w-full h-full filter drop-shadow-sm">
        <rect x="8" y="20" width="34" height="6" rx="1.5" fill="#92400E" stroke="#78350F" strokeWidth="1" />
        <rect x="8" y="28" width="34" height="4" rx="1" fill="#B45309" stroke="#78350F" strokeWidth="0.8" />
        <line x1="12" y1="20" x2="12" y2="38" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
        <line x1="38" y1="20" x2="38" y2="38" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function TileStreetLamp({ isNight = false }: { isNight?: boolean }) {
  return (
    <div className="w-full h-full relative flex items-center justify-center select-none pointer-events-none">
      {/* Night Halo Glow */}
      {isNight && (
        <div className="absolute inset-0 bg-yellow-300/30 rounded-full blur-md animate-pulse" />
      )}
      <svg viewBox="0 0 50 50" className="w-full h-full relative z-10 filter drop-shadow-sm">
        <line x1="25" y1="14" x2="25" y2="42" stroke="#111113" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="21" y="42" width="8" height="4" rx="1" fill="#111113" />
        
        {/* Lantern Head */}
        <polygon points="20,14 25,6 30,14" fill="#111113" />
        <polygon points="21,14 25,18 29,14" fill={isNight ? '#FEF08A' : '#E5E7EB'} stroke="#111113" strokeWidth="0.8" />
        {isNight && (
          <circle cx="25" cy="14" r="3" fill="#FACC15" />
        )}
      </svg>
    </div>
  );
}

export function TileCrossMonument() {
  return (
    <div className="w-full h-full relative flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 50 50" className="w-full h-full filter drop-shadow-md">
        <rect x="16" y="38" width="18" height="6" rx="1.5" fill="#4B5563" stroke="#1F2937" strokeWidth="1" />
        <rect x="22" y="10" width="6" height="28" rx="1" fill="#9CA3AF" stroke="#374151" strokeWidth="1.2" />
        <rect x="15" y="16" width="20" height="6" rx="1" fill="#9CA3AF" stroke="#374151" strokeWidth="1.2" />
        <circle cx="25" cy="19" r="2" fill="#FBBF24" />
      </svg>
    </div>
  );
}

export function TileFlowerBed() {
  return (
    <div className="w-full h-full relative flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 50 50" className="w-full h-full filter drop-shadow-xs">
        <circle cx="16" cy="20" r="5" fill="#EF4444" />
        <circle cx="16" cy="20" r="2" fill="#FDE047" />

        <circle cx="34" cy="20" r="5" fill="#EC4899" />
        <circle cx="34" cy="20" r="2" fill="#FDE047" />

        <circle cx="25" cy="30" r="6" fill="#8B5CF6" />
        <circle cx="25" cy="30" r="2.5" fill="#FDE047" />

        <circle cx="18" cy="32" r="4" fill="#F59E0B" />
        <circle cx="32" cy="32" r="4" fill="#3B82F6" />
      </svg>
    </div>
  );
}

export function TileFountain() {
  return (
    <div className="w-full h-full relative flex items-center justify-center select-none pointer-events-none">
      <svg viewBox="0 0 50 50" className="w-full h-full filter drop-shadow-md">
        <circle cx="25" cy="25" r="18" fill="#6B7280" stroke="#374151" strokeWidth="1.5" />
        <circle cx="25" cy="25" r="14" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
        <circle cx="25" cy="25" r="7" fill="#6B7280" />
        <circle cx="25" cy="25" r="5" fill="#BAE6FD" className="animate-ping" />
        <circle cx="25" cy="25" r="3" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

// 1x1 ROOMS
export function TileRoomGeneric({ label, color, isNight = false }: { label: string; color: string; isNight?: boolean }) {
  return (
    <div className="w-full h-full relative flex items-center justify-center p-0.5 select-none pointer-events-none">
      <svg viewBox="0 0 50 50" className="w-full h-full filter drop-shadow-sm">
        <rect x="6" y="16" width="38" height="28" rx="2" fill={color} stroke="#111113" strokeWidth="1.5" />
        <polygon points="4,18 25,6 46,18" fill="#111113" />
        <rect x="12" y="24" width="8" height="8" rx="1" fill={isNight ? '#FEF08A' : '#FFFFFF'} stroke="#111113" strokeWidth="1" />
        <rect x="26" y="24" width="10" height="18" fill="#92400E" stroke="#111113" strokeWidth="1.2" />
        <text x="25" y="15" fill="#FFFFFF" fontSize="4.5" fontWeight="bold" textAnchor="middle">
          {label}
        </text>
      </svg>
    </div>
  );
}

// --- 4. NPC PIXEL VECTOR CHARACTER ---
export function BuilderNPCAvatar({
  role = 'visitor',
  facing = 'right',
  hairColor = '#451A03',
  shirtColor = '#3B82F6',
}: {
  role?: string;
  facing?: 'left' | 'right';
  hairColor?: string;
  shirtColor?: string;
}) {
  return (
    <div
      className={`w-6 h-7 relative transition-transform duration-300 ${
        facing === 'left' ? '-scale-x-100' : 'scale-x-100'
      }`}
    >
      <svg viewBox="0 0 24 28" className="w-full h-full filter drop-shadow-xs">
        {/* Head */}
        <circle cx="12" cy="8" r="5" fill="#FDE047" stroke="#78350F" strokeWidth="0.8" />
        {/* Hair */}
        <path d="M7 7C7 4 10 3 12 3C15 3 17 4 17 7C16 6 14 5 12 5C10 5 8 6 7 7Z" fill={hairColor} />
        {/* Eyes */}
        <circle cx="14" cy="8" r="0.8" fill="#111113" />
        
        {/* Body / Shirt */}
        <rect x="8" y="13" width="8" height="8" rx="2" fill={shirtColor} stroke="#111113" strokeWidth="0.8" />
        {role === 'pastor' && (
          <path d="M11 13H13V15H11Z" fill="#FFFFFF" />
        )}

        {/* Legs / Walking */}
        <line x1="10" y1="21" x2="10" y2="26" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="21" x2="14" y2="26" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
