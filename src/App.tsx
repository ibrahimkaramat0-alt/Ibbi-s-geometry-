/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Trophy, Skull, Volume2, VolumeX, LayoutGrid, ChevronRight, CheckCircle2, Lock, Flame, Info, Settings2, Target } from 'lucide-react';

// --- Constants ---
const GRAVITY = 0.6;
const JUMP_FORCE = -10;
const SPEED = 5.8;
const PLAYER_SIZE = 40;
const OBSTACLE_SIZE = 40;
const GROUND_Y = 400;
const HITBOX_PADDING = 10; 

type GameState = 'START' | 'LEVEL_SELECT' | 'PLAYING' | 'DYING' | 'GAMEOVER' | 'WIN' | 'RANKED_INFO' | 'CUSTOMIZE' | 'FETCHING_RESULTS';

interface Obstacle {
  type: 'SPIKE' | 'BLOCK' | 'PORTAL' | 'SLAB';
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const RANK_DATA = [
  { name: "Bronze 1", points: 0, color: "#92400e", stripe: 1 },
  { name: "Bronze 2", points: 200, color: "#92400e", stripe: 2 },
  { name: "Bronze 3", points: 400, color: "#92400e", stripe: 3 },
  { name: "Silver 1", points: 600, color: "#94a3b8", stripe: 1 },
  { name: "Silver 2", points: 700, color: "#94a3b8", stripe: 2 },
  { name: "Gold 2", points: 800, color: "#fbbf24", stripe: 2 },
  { name: "Gold 3", points: 1100, color: "#fbbf24", stripe: 3 },
  { name: "Platinum 1", points: 1200, color: "#38bdf8", stripe: 1 },
  { name: "Platinum 2", points: 1300, color: "#38bdf8", stripe: 2 },
  { name: "Platinum 3", points: 1400, color: "#38bdf8", stripe: 3 },
  { name: "Diamond 1", points: 1500, color: "#22d3ee", stripe: 1 },
  { name: "Diamond 2", points: 1530, color: "#22d3ee", stripe: 2 },
  { name: "Diamond 3", points: 1560, color: "#22d3ee", stripe: 3 },
  { name: "Elite", points: 1600, color: "#c026d3", icon: "💎💎\n💎💎" },
  { name: "Champion", points: 1800, color: "#facc15", icon: "🏆" },
  { name: "Super Ibbi", points: 2200, color: "#f43f5e", icon: "🕶️" },
  { name: "Roblox Ibad", points: 2800, color: "#fde047", icon: "🎮" },
  { name: "YBTG IBBI", points: 3400, color: "#38bdf8", icon: "🕶️🕶️" },
  { name: "Infinity People", points: 10000, color: "#ffffff", icon: "∞" },
  { name: "Fake Killscreen", points: 20000, color: "#ef4444", icon: "💀", bgColor: "#ef4444" },
  { name: "IBBI OG", points: 28000, color: "#3b82f6", icon: "👑" },
  { name: "Rhino Bini", points: 31000, color: "#fb7185", icon: "🦏" },
  { name: "Claopop", points: 36000, color: "#38bdf8", icon: "🎷" },
  { name: "Empire N", points: 41000, color: "#f59e0b", icon: "🏰" },
  { name: "IDKWTC", points: 43000, color: "#f472b6", icon: "❓" },
  { name: "Mad Gar", points: 46000, color: "#4ade80", icon: "👺" },
  { name: "Hidden OC", points: 75000, color: "#fbbf24", icon: "🏆", hidden: true },
  { name: "ADMIN TIME", points: 100000, color: "#ffffff", icon: "🚨", hidden: true },
];

const RANKS = RANK_DATA.map(r => r.name);

// --- Level Data ---
const STATIC_LEVELS = [
  {
    name: "Stereo Fame",
    difficulty: "Easy",
    color: "#38bdf8",
    width: 6000,
        obstacles: [
           { type: 'SPIKE', x: 800, y: GROUND_Y - 40, w: 40, h: 40 },
           { type: 'SPIKE', x: 840, y: GROUND_Y - 40, w: 40, h: 40 },
           { type: 'SPIKE', x: 1200, y: GROUND_Y - 40, w: 40, h: 40 },
           { type: 'BLOCK', x: 1400, y: GROUND_Y - 40, w: 80, h: 40 },
           { type: 'BLOCK', x: 1600, y: GROUND_Y - 40, w: 80, h: 40 },
           { type: 'SPIKE', x: 1600, y: GROUND_Y - 80, w: 40, h: 40 },
           { type: 'SPIKE', x: 2000, y: GROUND_Y - 40, w: 40, h: 40 },
           { type: 'SPIKE', x: 2040, y: GROUND_Y - 40, w: 40, h: 40 },
           { type: 'BLOCK', x: 2300, y: GROUND_Y - 40, w: 40, h: 40 },
           { type: 'BLOCK', x: 2450, y: GROUND_Y - 80, w: 40, h: 40 },
           { type: 'BLOCK', x: 2600, y: GROUND_Y - 120, w: 40, h: 40 },
           { type: 'BLOCK', x: 2750, y: GROUND_Y - 80, w: 40, h: 40 },
           { type: 'SPIKE', x: 2790, y: GROUND_Y - 40, w: 40, h: 40 },
           { type: 'BLOCK', x: 3000, y: GROUND_Y - 40, w: 120, h: 40 },
           { type: 'SPIKE', x: 3040, y: GROUND_Y - 80, w: 40, h: 40 },
           { type: 'BLOCK', x: 3400, y: GROUND_Y - 40, w: 200, h: 40 },
           { type: 'BLOCK', x: 3750, y: GROUND_Y - 60, w: 40, h: 40 },
           { type: 'BLOCK', x: 4000, y: GROUND_Y - 40, w: 80, h: 80 },
           { type: 'SPIKE', x: 4000, y: GROUND_Y - 120, w: 40, h: 40 },
           { type: 'SPIKE', x: 4400, y: GROUND_Y - 40, w: 40, h: 40 },
           { type: 'SPIKE', x: 4800, y: GROUND_Y - 40, w: 80, h: 40 },
           { type: 'SPIKE', x: 5000, y: GROUND_Y - 40, w: 40, h: 40 },
           { type: 'SPIKE', x: 5040, y: GROUND_Y - 40, w: 40, h: 40 },
           { type: 'SPIKE', x: 5080, y: GROUND_Y - 40, w: 40, h: 40 },
        ] as Obstacle[]
  },
  {
    name: "Flash Track",
    difficulty: "Medium",
    color: "#f43f5e",
    width: 7000,
    obstacles: [
       { type: 'SPIKE', x: 600, y: GROUND_Y - 40, w: 40, h: 40 },
       { type: 'BLOCK', x: 1000, y: GROUND_Y - 40, w: 40, h: 80 },
       { type: 'SPIKE', x: 1400, y: GROUND_Y - 40, w: 80, h: 40 },
       { type: 'BLOCK', x: 1800, y: GROUND_Y - 80, w: 120, h: 40 },
       { type: 'BLOCK', x: 2200, y: GROUND_Y - 120, w: 120, h: 40 },
       { type: 'SPIKE', x: 2240, y: GROUND_Y - 160, w: 40, h: 40 },
       { type: 'SPIKE', x: 4000, y: GROUND_Y - 40, w: 120, h: 40 },
       { type: 'SPIKE', x: 4500, y: GROUND_Y - 40, w: 40, h: 40 },
       { type: 'BLOCK', x: 4800, y: GROUND_Y - 40, w: 80, h: 40 },
       { type: 'SPIKE', x: 5200, y: GROUND_Y - 40, w: 120, h: 40 },
       { type: 'BLOCK', x: 5600, y: GROUND_Y - 80, w: 40, h: 40 },
       { type: 'SPIKE', x: 6000, y: GROUND_Y - 40, w: 40, h: 40 },
       { type: 'SPIKE', x: 6400, y: GROUND_Y - 40, w: 120, h: 40 },
       { type: 'SPIKE', x: 6800, y: GROUND_Y - 40, w: 40, h: 40 },
    ] as Obstacle[]
  },
  {
    name: "Electro Core",
    difficulty: "Hard",
    color: "#a855f7",
    width: 8000,
    obstacles: [
       { type: 'SPIKE', x: 600, y: GROUND_Y - 40, w: 120, h: 40 },
       { type: 'BLOCK', x: 1000, y: GROUND_Y - 40, w: 40, h: 40 },
       { type: 'BLOCK', x: 1040, y: GROUND_Y - 80, w: 40, h: 40 },
       { type: 'BLOCK', x: 1080, y: GROUND_Y - 120, w: 40, h: 40 },
       { type: 'SPIKE', x: 1120, y: GROUND_Y - 40, w: 40, h: 40 },
       { type: 'SPIKE', x: 1500, y: GROUND_Y - 40, w: 120, h: 40 },
       { type: 'BLOCK', x: 2000, y: GROUND_Y - 40, w: 80, h: 80 },
       { type: 'SPIKE', x: 2500, y: GROUND_Y - 40, w: 40, h: 40 },
       { type: 'BLOCK', x: 3000, y: GROUND_Y - 120, w: 120, h: 40 },
       { type: 'SPIKE', x: 3500, y: GROUND_Y - 40, w: 120, h: 40 },
       { type: 'BLOCK', x: 4000, y: GROUND_Y - 40, w: 40, h: 40 },
       { type: 'SPIKE', x: 4040, y: GROUND_Y - 80, w: 40, h: 40 },
       { type: 'BLOCK', x: 4500, y: GROUND_Y - 40, w: 200, h: 40 },
       { type: 'SPIKE', x: 5000, y: GROUND_Y - 40, w: 40, h: 40 },
       { type: 'SPIKE', x: 5500, y: GROUND_Y - 40, w: 120, h: 40 },
       { type: 'BLOCK', x: 6000, y: GROUND_Y - 80, w: 40, h: 40 },
       { type: 'SPIKE', x: 6500, y: GROUND_Y - 40, w: 40, h: 40 },
       { type: 'SPIKE', x: 7000, y: GROUND_Y - 40, w: 120, h: 40 },
       { type: 'BLOCK', x: 7500, y: GROUND_Y - 40, w: 80, h: 40 },
       { type: 'SPIKE', x: 7800, y: GROUND_Y - 40, w: 40, h: 40 },
    ] as Obstacle[]
  },
  {
    name: "Insane",
    difficulty: "Insane",
    color: "#f97316",
    width: 9000,
    mode: 'SHIP',
    obstacles: [
       { type: 'SPIKE', x: 800, y: GROUND_Y - 40, w: 200, h: 40 },
       { type: 'BLOCK', x: 1200, y: 150, w: 80, h: 40 },
       { type: 'SPIKE', x: 1200, y: 110, w: 40, h: 40 },
       { type: 'BLOCK', x: 1600, y: GROUND_Y - 120, w: 120, h: 40 },
       { type: 'SPIKE', x: 2000, y: 50, w: 40, h: 100 },
       { type: 'SPIKE', x: 2500, y: GROUND_Y - 150, w: 40, h: 40 },
       { type: 'BLOCK', x: 3000, y: 200, w: 200, h: 40 },
       { type: 'SPIKE', x: 3400, y: 50, w: 40, h: 40 },
       { type: 'SPIKE', x: 3400, y: GROUND_Y - 40, w: 40, h: 40 },
       { type: 'BLOCK', x: 4000, y: 150, w: 40, h: 120 },
       { type: 'SPIKE', x: 4500, y: GROUND_Y - 120, w: 40, h: 40 },
       { type: 'SPIKE', x: 5000, y: 100, w: 40, h: 40 },
       { type: 'SPIKE', x: 5500, y: 300, w: 40, h: 40 },
       { type: 'BLOCK', x: 6000, y: 100, w: 100, h: 40 },
       { type: 'SPIKE', x: 6500, y: 200, w: 40, h: 40 },
       { type: 'BLOCK', x: 7000, y: 300, w: 120, h: 40 },
       { type: 'SPIKE', x: 7500, y: 50, w: 40, h: 40 },
       { type: 'BLOCK', x: 8000, y: 150, w: 40, h: 150 },
       { type: 'SPIKE', x: 8500, y: GROUND_Y - 40, w: 200, h: 40 },
       { type: 'SPIKE', x: 8800, y: 100, w: 40, h: 40 },
    ] as Obstacle[]
  }
];

const DIFFICULTIES = ['Easy', 'Normal', 'Hard', 'Harder', 'Master', 'Demon', 'Insane', 'Pro 1', 'Pro 2', 'Pro 3'];
const DIFF_COLORS = ['#38bdf8', '#3b82f6', '#eab308', '#fb7185', '#be123c', '#ef4444', '#a855f7', '#f43f5e', '#fb7185', '#881337'];

const generateProceduralLevel = (tierIdx: number, seed: number) => {
  const obstacles: Obstacle[] = [];
  const difficulty = tierIdx + 1;
  let curX = 600;
  const width = 10000 + tierIdx * 2000;
  
  // Add 5 hidden coins in each ranked level
  for (let i = 0; i < 5; i++) {
    const coinX = 500 + (width / 5) * i + Math.random() * (width / 6);
    obstacles.push({ type: 'PORTAL', x: coinX, y: GROUND_Y - 100 - Math.random() * 150, w: 30, h: 30 } as any);
  }

  while (curX < width - 100) {
    const r = Math.random();
    if (r < 0.25) {
      // Spikes
      const count = 1 + Math.floor(Math.random() * Math.min(3, difficulty));
      for(let i=0; i<count; i++) {
        obstacles.push({ type: 'SPIKE', x: curX + i*40, y: GROUND_Y - 40, w: 40, h: 40 });
      }
      curX += count * 40 + 100 + Math.random() * 40;
    } else if (r < 0.6) {
      // Blocks / Slabs
      const isSlab = Math.random() > 0.6;
      const height = isSlab ? Math.floor(Math.random() * 2) + 1 : 1; 
      const len = 2 + Math.floor(Math.random() * 3);
      
      for(let i=0; i<len; i++) {
        obstacles.push({ 
          type: isSlab ? 'SLAB' : 'BLOCK', 
          x: curX + i*40, 
          y: GROUND_Y - height * 80, 
          w: 40, 
          h: isSlab ? 20 : 40 
        });
      }
      curX += len * 40 + 200;
    } else {
      // Small gaps and stairs
      const steps = Math.min(3, difficulty);
      for(let i=0; i<steps; i++) {
        obstacles.push({ type: 'BLOCK', x: curX + i*80, y: GROUND_Y - (i+1)*40, w: 40, h: (i+1)*40 });
      }
      curX += steps * 80 + 250;
    }
  }
  
  return {
    name: `Trial ${seed + 1} (${DIFFICULTIES[tierIdx]})`,
    color: DIFF_COLORS[tierIdx],
    difficulty: DIFFICULTIES[tierIdx],
    width,
    obstacles
  };
};

// --- App Component ---
export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('START');
  const [currentLevel, setCurrentLevel] = useState<any>(STATIC_LEVELS[0]);
  const [attempts, setAttempts] = useState(0);
  const [currentTier, setCurrentTier] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPractice, setIsPractice] = useState(false);
  const [isRanked, setIsRanked] = useState(false);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('ibbi_name') || 'Player1');
  const [playerIcon, setPlayerIcon] = useState('🕶️');
  const [playerColor, setPlayerColor] = useState('#fbbf24');
  const [adminStep, setAdminStep] = useState(0);
  const [adminMsg, setAdminMsg] = useState('');
  const [checkpoints, setCheckpoints] = useState<{x: number, y: number}[]>([]);
  const [resultsData, setResultsData] = useState({ oldRank: '', newRank: '', points: 0, percentGain: 0 });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [showRankList, setShowRankList] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [redeemVal, setRedeemVal] = useState('');
  const [hasGoldOC, setHasGoldOC] = useState(() => localStorage.getItem('ibbi_gold_oc') === 'true');
  const [hasSkeleton, setHasSkeleton] = useState(() => localStorage.getItem('ibbi_skeleton') === 'true');
  const [hasPS5, setHasPS5] = useState(() => localStorage.getItem('ibbi_ps5') === 'true');
  const [hasKhadui, setHasKhadui] = useState(() => localStorage.getItem('ibbi_khadui') === 'true');
  const [hasIbbi9, setHasIbbi9] = useState(() => localStorage.getItem('ibbi_ibbi9') === 'true');
  const [hasKnife, setHasKnife] = useState(() => localStorage.getItem('ibbi_knife') === 'true');
  const [hasIBI, setHasIBI] = useState(() => localStorage.getItem('ibbi_ibi') === 'true');
  const [hasBanana, setHasBanana] = useState(() => localStorage.getItem('ibbi_banana') === 'true');
  const [hasMoon, setHasMoon] = useState(() => localStorage.getItem('ibbi_moon') === 'true');
  const [has1nun1, setHas1nun1] = useState(() => localStorage.getItem('ibbi_1nun1') === 'true');
  const [hasPlane24, setHasPlane24] = useState(() => localStorage.getItem('ibbi_plane24') === 'true');
  const [hasIbadRblx, setHasIbadRblx] = useState(() => localStorage.getItem('ibbi_ibadrblx') === 'true');
  const [hasSuess, setHasSuess] = useState(() => localStorage.getItem('ibbi_suess') === 'true');
  const [hasSeenDescription, setHasSeenDescription] = useState(() => localStorage.getItem('ibbi_saw_desc') === 'true');
  const [showDescription, setShowDescription] = useState(false);
  const [ownedFlags, setOwnedFlags] = useState<string[]>(() => JSON.parse(localStorage.getItem('ibbi_flags') || '[]'));
  const [currentSkin, setCurrentSkin] = useState(() => localStorage.getItem('ibbi_skin') || 'DEFAULT');
  const [rankedCoins, setRankedCoins] = useState(() => Number(localStorage.getItem('ibbi_coins') || 0));
  const [shopItems, setShopItems] = useState<any[]>([]);
  const [shopTimer, setShopTimer] = useState(300); // 5 minutes in seconds
  const [deathMsg, setDeathMsg] = useState('');
  const [simulatedPlayers, setSimulatedPlayers] = useState([]);

  // Persistent State
  const [completedStereo, setCompletedStereo] = useState(() => localStorage.getItem('ibbi_stereo') === 'true');
  const [rankPoints, setRankPoints] = useState(() => Number(localStorage.getItem('ibbi_rp') || 0));

  // User-requested reset (v3)
  useEffect(() => {
    if (localStorage.getItem('ibbi_reset_v3') !== 'true') {
      setHasGoldOC(false); setHasSkeleton(false); setHasPS5(false); setHasKhadui(false);
      setHasIbbi9(false); setHasKnife(false); setHasIBI(false); setHasBanana(false);
      setHasMoon(false); setHas1nun1(false); setHasPlane24(false); setHasIbadRblx(false); setHasSuess(false); setHasSeenDescription(false);
      setOwnedFlags([]); setRankedCoins(20); setCurrentSkin('DEFAULT'); setRankPoints(0);
      
      const keys = [
        'ibbi_gold_oc', 'ibbi_skeleton', 'ibbi_ps5', 'ibbi_khadui', 'ibbi_ibbi9', 
        'ibbi_knife', 'ibbi_ibi', 'ibbi_banana', 'ibbi_moon', 'ibbi_1nun1', 
        'ibbi_plane24', 'ibbi_ibadrblx', 'ibbi_suess', 'ibbi_saw_desc', 'ibbi_skin', 'ibbi_flags'
      ];
      keys.forEach(k => localStorage.setItem(k, 'false'));
      localStorage.setItem('ibbi_coins', '20');
      localStorage.setItem('ibbi_flags', '[]');
      localStorage.setItem('ibbi_skin', 'DEFAULT');
      localStorage.setItem('ibbi_rp', '0');
      localStorage.setItem('ibbi_reset_v3', 'true');
    }
  }, []);

  const restockShop = useCallback(() => {
    const allFlags = [
      { id: 'flag_china', name: 'China Flag', icon: '🇨🇳', price: 4 },
      { id: 'flag_england', name: 'England Flag', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', price: 4 },
      { id: 'flag_russia', name: 'Russia Flag', icon: '🇷🇺', price: 4 },
      { id: 'flag_india', name: 'India Flag', icon: '🇮🇳', price: 4 },
      { id: 'flag_australia', name: 'Australia Flag', icon: '🇦🇺', price: 4 },
      { id: 'flag_italy', name: 'Italy Flag', icon: '🇮🇹', price: 6 },
      { id: 'flag_libya', name: 'Libya Flag', icon: '🇱🇾', price: 4 },
    ];
    const specials = [
      { id: 'khadui', name: 'KHADUI', icon: '🇰', price: 8 },
      { id: 'ibbi9', name: 'ibbi 9', icon: '🇵🇰', price: 6 },
      { id: 'ibi', name: 'IBI', icon: '👤', price: 6 },
      { id: 'banana', name: 'Banana', icon: '🍌', price: 6 },
      { id: 'moon', name: 'Moon SN', icon: '🌙', price: 12 },
      { id: '1nun1', name: '1nun1', icon: '🔱', price: 8 },
      { id: 'plane', name: 'Plane24', icon: '🛩️', price: 30 },
    ];

    // Pick 3 random flags
    const shuffledFlags = [...allFlags].sort(() => 0.5 - Math.random());
    const selectedFlags = shuffledFlags.slice(0, 2);

    // Pick 2 random special
    const shuffledSpecials = [...specials].sort(() => 0.5 - Math.random());
    const selectedSpecials = shuffledSpecials.slice(0, 3);

    setShopItems([...selectedFlags, ...selectedSpecials]);
    setShopTimer(300);
  }, []);

  useEffect(() => {
    restockShop();
    const interval = setInterval(() => {
      setShopTimer(prev => {
        if (prev <= 1) {
          restockShop();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restockShop]);

  const validateName = (name: string) => {
    const hasNumber = /[0-9]/.test(name);
    return name.length >= 3 && name.length <= 38 && hasNumber;
  };

  const getCurrentRank = (points: number) => {
    if (points === 0) return "Unranked";
    let foundRank = RANK_DATA[0].name;
    for (let i = RANK_DATA.length - 1; i >= 0; i--) {
      if (points >= RANK_DATA[i].points) {
        return RANK_DATA[i].name;
      }
    }
    return foundRank;
  };

  const currentRank = useMemo(() => getCurrentRank(rankPoints), [rankPoints]);

  // Mock Global Leaderboard
  const leaderboard = useMemo(() => {
    const list = [...simulatedPlayers];
    
     // Special request: ibbi84 and ibad10 are admins with 100,000 points
     const lowerPName = playerName.toLowerCase();
     const isAdmin = lowerPName === 'ibbi84' || lowerPName === 'ibad10';
     const activeName = isAdmin ? `ADMIN (${playerName})` : playerName;
     
     let adminScore = rankPoints;
     if (isAdmin) adminScore = 100000;
 
     list.push({ name: activeName, score: adminScore });
     
     // Always show pinned admin if player is not admin
     if (!isAdmin) {
       list.push({ name: "ADMIN (ibbi84)", score: 100000 });
     }

    const uniqueList = Array.from(new Map(list.map(item => [item.name, item])).values());

    return uniqueList.map(p => ({
      ...p,
      rank: getCurrentRank(p.score)
    })).sort((a,b) => b.score - a.score);
  }, [playerName, rankPoints, simulatedPlayers, currentRank]);

  const levelProgressStr = useMemo(() => {
    if (isRanked) return "Ranked Selection";
    return "Adventure";
  }, [isRanked]);

  const player = useRef({
    x: 100,
    y: GROUND_Y - PLAYER_SIZE,
    vy: 0,
    rotation: 0,
    isJumping: false,
    jumpCount: 0,
    dead: false,
    holdingJump: false,
  });

  const levelObstacles = useRef<Obstacle[]>([]);
  const particles = useRef<Particle[]>([]);
  const cameraX = useRef(0);
  const frameId = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const levelWidth = useRef(6000);
  const startTime = useRef(0);

  const initLevel = useCallback((lvl: any) => {
    levelObstacles.current = lvl.obstacles;
    levelWidth.current = lvl.width;
    setCurrentLevel(lvl);
  }, []);

  const resetGame = useCallback(() => {
    // If practice mode and has checkpoints, respawn at last one
    const lastCheckpoint = checkpoints[checkpoints.length - 1];
    
    player.current = {
      x: (isPractice && lastCheckpoint) ? lastCheckpoint.x : 100,
      y: (isPractice && lastCheckpoint) ? lastCheckpoint.y : GROUND_Y - PLAYER_SIZE,
      vy: 0,
      rotation: 0,
      isJumping: false,
      jumpCount: 0,
      dead: false,
      holdingJump: player.current.holdingJump,
    };
    cameraX.current = player.current.x - 150;
    particles.current = [];
    if (!isPractice || !lastCheckpoint) {
      setProgress(0);
      setAttempts(prev => prev + 1);
    }
    setGameState('PLAYING');
    startTime.current = Date.now();
  }, [isPractice, checkpoints]);

  const addCheckpoint = () => {
    if (!isPractice || player.current.dead) return;
    setCheckpoints(prev => [...prev, { x: player.current.x, y: player.current.y }]);
    spawnParticles(player.current.x, player.current.y, '#22d3ee', 20); // Blue particles for checkpoint
  };

  const jump = useCallback(() => {
    if (player.current.dead) return;

    if (currentLevel.mode === 'SHIP') {
      // Rocket mode: upward impulse
      player.current.vy = -6;
      return;
    }

    if (player.current.jumpCount < 2) {
      player.current.vy = JUMP_FORCE;
      player.current.isJumping = true;
      player.current.jumpCount++;
      spawnParticles(player.current.x, player.current.y + PLAYER_SIZE, '#fff', 5);
    }
  }, [currentLevel]);

  const spawnParticles = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      (particles.current as any).push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color
      });
    }
  };

  const handleDeath = () => {
    player.current.dead = true;
    setGameState('DYING');
    spawnParticles(player.current.x + PLAYER_SIZE/2, player.current.y + PLAYER_SIZE/2, '#fbbf24', 30);
    
    // Choose clue
    const clues = [
      "type in gold OC to obtain new skin",
      "do the clues to get admin",
      "we will stop making updates on February 30th 🤔",
      "checkout IBBI OG to get a code",
      "on April 21st new code will drop!",
      "collect coins to buy flags in the shop",
      "type cmd for 3 coins",
      "type in the code 1441 for 1 coin",
      "do nake of the game"
    ];
    setDeathMsg(clues[Math.floor(Math.random() * clues.length)]);

    setTimeout(() => {
      setGameState('GAMEOVER');
    }, isPractice ? 500 : 2000);
  };

  const calculateRankPoints = () => {
    if (!isRanked) return;
    
    // Attempt-based base points
    let basePoints = 0;
    if (attempts <= 10) basePoints = 400;
    else if (attempts <= 20) basePoints = 250;
    else if (attempts <= 50) basePoints = 120;
    else if (attempts <= 100) basePoints = 80;
    else if (attempts <= 200) basePoints = 50;
    else basePoints = 25;

    // Tier multipliers: T1:1, T2:1.5, T3:2, T4:2.5, T5:3, T6:3.5, T7:4
    const multiplier = 1 + (currentTier * 0.5);
    const pointsToGain = Math.floor(basePoints * multiplier);

    const oldRP = rankPoints;
    const newRP = rankPoints + pointsToGain;
    
    setResultsData({
      oldRank: getCurrentRank(oldRP),
      newRank: getCurrentRank(newRP),
      points: pointsToGain,
      percentGain: Math.floor((pointsToGain / (400 * multiplier)) * 100)
    });

    setRankPoints(newRP);
    localStorage.setItem('ibbi_rp', newRP.toString());
    setGameState('FETCHING_RESULTS');
    
    setTimeout(() => {
      setGameState('WIN');
    }, 4000); 
  };

  const update = (time: number) => {
    if (gameState !== 'PLAYING' && gameState !== 'DYING') {
       lastTime.current = 0;
       return;
    }

    if (!lastTime.current) lastTime.current = time;
    const dt = (time - lastTime.current) / 16.67; 
    lastTime.current = time;

    cameraX.current = player.current.x - 150;

    particles.current = particles.current.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= 0.02 * dt;
      return p.life > 0;
    });

    if (gameState === 'DYING') {
      draw();
      frameId.current = requestAnimationFrame(update);
      return;
    }

    player.current.x += SPEED * dt;

    if (currentLevel.mode === 'SHIP' || currentSkin === 'PLANE24') {
      if (player.current.holdingJump) {
        player.current.vy -= (currentSkin === 'PLANE24' ? 0.8 : 0.6) * dt;
      } else {
        player.current.vy += 0.5 * dt;
      }
      // Physics damping
      player.current.vy *= 0.95; 
      player.current.y += player.current.vy * dt;
      player.current.rotation = player.current.vy * 0.1;
      
      // Top boundary
      if (player.current.y < 0) {
        player.current.y = 0;
        player.current.vy = 0;
      }
    } else {
      player.current.vy += GRAVITY * dt;
      player.current.y += player.current.vy * dt;

      if (player.current.isJumping) {
        player.current.rotation += 0.15 * dt;
      } else {
        const targetRot = Math.round(player.current.rotation / (Math.PI / 2)) * (Math.PI / 2);
        player.current.rotation += (targetRot - player.current.rotation) * 0.2 * dt;
      }
    }

    if (player.current.y > GROUND_Y - PLAYER_SIZE) {
      player.current.y = GROUND_Y - PLAYER_SIZE;
      player.current.vy = 0;
      if (player.current.isJumping && currentLevel.mode !== 'SHIP') spawnParticles(player.current.x, GROUND_Y, '#fff', 3);
      player.current.isJumping = false;
      player.current.jumpCount = 0;
      
      // HOLD TO SLAM/SPAM JUMP
      if (player.current.holdingJump && currentLevel.mode !== 'SHIP') jump();
    }

    const pX = player.current.x + HITBOX_PADDING;
    const pY = player.current.y + HITBOX_PADDING;
    const pW = PLAYER_SIZE - HITBOX_PADDING * 2;
    const pH = PLAYER_SIZE - HITBOX_PADDING * 2;
    
    for (let i = 0; i < levelObstacles.current.length; i++) {
        const obs = levelObstacles.current[i];
        if (
          pX < obs.x + obs.w - HITBOX_PADDING &&
          pX + pW > obs.x + HITBOX_PADDING &&
          pY < obs.y + obs.h - HITBOX_PADDING &&
          pY + pH > obs.y + HITBOX_PADDING
        ) {
          if (obs.type === 'SPIKE') {
            handleDeath();
            return;
          } else if (obs.type === 'BLOCK' || obs.type === 'SLAB') {
             const forgiveness = obs.type === 'SLAB' ? 15 : 25;
             if (player.current.vy > 0 && player.current.y + PLAYER_SIZE <= obs.y + forgiveness) {
               player.current.y = obs.y - PLAYER_SIZE;
               player.current.vy = 0;
               player.current.isJumping = false;
               player.current.jumpCount = 0;
               if (player.current.holdingJump && currentLevel.mode !== 'SHIP') jump();
             } else {
               handleDeath();
               return;
             }
          } else if (obs.type === 'PORTAL') {
             // It's a coin!
             spawnParticles(obs.x, obs.y, '#fbbf24', 15);
             levelObstacles.current.splice(i, 1);
             setRankedCoins(prev => {
                const NewC = prev + 1;
                localStorage.setItem('ibbi_coins', NewC.toString());
                return NewC;
             });
             i--;
          }
        }
    }

    if (player.current.x > levelWidth.current) {
      if (currentLevel.name === "Stereo Fame") {
        setCompletedStereo(true);
        localStorage.setItem('ibbi_stereo', 'true');
      }
      calculateRankPoints();
      setGameState('WIN');
      return;
    }

    setProgress(Math.min(100, Math.floor((player.current.x / levelWidth.current) * 100)));
    draw();
    frameId.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext('2d')) return;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX.current, 0);

    // Ground
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cameraX.current, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    ctx.strokeStyle = currentLevel.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cameraX.current, GROUND_Y);
    ctx.lineTo(cameraX.current + canvas.width, GROUND_Y);
    ctx.stroke();

    // Obstacles
    levelObstacles.current.forEach(obs => {
      if (obs.x + obs.w < cameraX.current || obs.x > cameraX.current + canvas.width) return;
      if (obs.type === 'SPIKE') {
        ctx.fillStyle = '#ff0000'; // Pure Red for killing stuff
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.h);
        ctx.lineTo(obs.x + obs.w / 2, obs.y);
        ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      } else {
        ctx.fillStyle = currentLevel.color;
        if (obs.type === 'SLAB') {
          ctx.fillRect(obs.x, obs.y, obs.w, 15);
          ctx.strokeStyle = '#fff';
          ctx.strokeRect(obs.x, obs.y, obs.w, 15);
        } else if (obs.type === 'PORTAL') {
          // It's a coin 🪙
          ctx.beginPath();
          ctx.arc(obs.x + 15, obs.y + 15, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#fbbf24';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = '#92400e';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('$', obs.x + 15, obs.y + 20);
        } else {
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeStyle = '#fff';
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }
      }
    });

    // Checkpoints (Diamonds)
    checkpoints.forEach(cp => {
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.fillText('💎', cp.x - cameraX.current, cp.y + 20);
    });

    // Draw Background Text for Stereo Fame
    if (currentLevel.name === "Stereo Fame") {
        ctx.save();
        ctx.font = 'bold 32px Inter';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; // Red-ish faded
        ctx.textAlign = 'center';
        ctx.fillText('COMPLETE TO PLAY RANKED', 1000 - cameraX.current, 200);
        ctx.restore();
    }

    // Player
    if (gameState === 'DYING') {
       ctx.font = '80px serif';
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.fillText('💀', player.current.x + PLAYER_SIZE/2, player.current.y + PLAYER_SIZE/2);
    } else if (!player.current.dead) {
      ctx.save();
      ctx.translate(player.current.x + PLAYER_SIZE/2, player.current.y + PLAYER_SIZE/2);
      ctx.rotate(player.current.rotation);
      ctx.shadowBlur = 15;
      
      if (currentSkin === 'GOLD_OC') {
        const goldSkinColor = '#fbbf24';
        const spikeColor = '#3b82f6';
        ctx.shadowColor = goldSkinColor;
        ctx.fillStyle = goldSkinColor;
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        // "Blue spikes" as visual flourish
        ctx.fillStyle = spikeColor;
        ctx.beginPath(); ctx.moveTo(-20, -20); ctx.lineTo(-15, -25); ctx.lineTo(-10, -20); ctx.fill();
        ctx.beginPath(); ctx.moveTo(20, -20); ctx.lineTo(15, -25); ctx.lineTo(10, -20); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-20, 20); ctx.lineTo(-15, 25); ctx.lineTo(-10, 20); ctx.fill();
        ctx.beginPath(); ctx.moveTo(20, 20); ctx.lineTo(15, 25); ctx.lineTo(10, 20); ctx.fill();
      } else if (currentSkin === 'SKELETON') {
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff';
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠️', 0, 0);
      } else if (currentSkin === 'PS5') {
        ctx.shadowColor = '#3b82f6';
        ctx.fillStyle = '#1e1b4b'; // Deep blue/purple
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎮', 0, 0);
      } else if (currentSkin === 'KHADUI') {
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#000000'; // Black skin
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('K', 0, -5);
        ctx.font = '16px serif';
        ctx.fillText('d', 0, 10);
      } else if (currentSkin === 'IBI') {
        ctx.shadowColor = '#fff';
        ctx.fillStyle = playerColor;
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        // Stick figure on head
        ctx.beginPath();
        ctx.arc(0, -PLAYER_SIZE/2 - 5, 3, 0, Math.PI * 2); // head
        ctx.moveTo(0, -PLAYER_SIZE/2 - 2);
        ctx.lineTo(0, -PLAYER_SIZE/2 + 2); // body
        ctx.moveTo(0, -PLAYER_SIZE/2);
        ctx.lineTo(-4, -PLAYER_SIZE/2 + 1); // arms
        ctx.moveTo(0, -PLAYER_SIZE/2);
        ctx.lineTo(4, -PLAYER_SIZE/2 + 1);
        ctx.stroke();
      } else if (currentSkin === 'SUESS') {
        ctx.shadowColor = '#fff';
        ctx.fillStyle = playerColor;
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        // Cat face
        ctx.font = '24px serif';
        ctx.fillText('🐱', 0, 0);
        // Pong hat (white rectangle on top)
        ctx.fillStyle = '#fff';
        ctx.fillRect(-15, -PLAYER_SIZE/2 - 10, 30, 5);
      } else if (currentSkin === 'BANANA') {
        ctx.shadowColor = '#facc15';
        ctx.fillStyle = playerColor;
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.font = '20px serif';
        ctx.fillText('🍌', 0, -PLAYER_SIZE/2);
      } else if (currentSkin === 'MOON') {
        ctx.shadowColor = '#f3f4f6';
        ctx.fillStyle = '#f3f4f6';
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_SIZE/2, 0.2, Math.PI * 1.8);
        ctx.lineTo(0,0);
        ctx.fill();
      } else if (currentSkin === '1NUN1') {
        ctx.shadowColor = '#facc15';
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        // Yellow spikes
        ctx.fillStyle = '#facc15';
        for(let i=0; i<3; i++) {
          ctx.beginPath();
          ctx.moveTo(-10 + i * 10, -PLAYER_SIZE/2);
          ctx.lineTo(-5 + i * 10, -PLAYER_SIZE/2 - 10);
          ctx.lineTo(0 + i * 10, -PLAYER_SIZE/2);
          ctx.fill();
        }
        // Blue pole
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(-2, -PLAYER_SIZE/2 - 15, 4, 15);
      } else if (currentSkin === 'IBADRBLX') {
        ctx.shadowColor = '#3b82f6';
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('10', 0, 0);
      } else if (currentSkin === 'PLANE24') {
        ctx.shadowColor = '#e11d48';
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.fillStyle = '#e11d48';
        // Wings
        ctx.beginPath();
        ctx.moveTo(-PLAYER_SIZE, 0);
        ctx.lineTo(PLAYER_SIZE, 0);
        ctx.lineTo(0, -5);
        ctx.fill();
        ctx.font = '20px serif';
        ctx.fillText('🛩️', 0, 0);
      } else if (currentSkin === 'KNIFE') {
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#000000';
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('888', 0, 0);
      } else if (currentSkin.startsWith('FLAG_')) {
        const flag = currentSkin.split('_')[1];
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff';
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(flag, 0, 0);
      } else {
        ctx.shadowColor = playerColor;
        ctx.fillStyle = playerColor;
        ctx.fillRect(-PLAYER_SIZE/2, -PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);
      }

      // Face
      if (currentSkin === 'DEFAULT') {
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(playerIcon, 0, 0);
      }

      ctx.restore();
    }
    ctx.restore();
  };

  useEffect(() => {
    if (gameState === 'PLAYING' || gameState === 'DYING') {
      lastTime.current = 0;
      frameId.current = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(frameId.current);
  }, [gameState]);

  useEffect(() => {
    const handleIn = (e: any) => { 
      if (gameState === 'PLAYING') {
        player.current.holdingJump = true;
        jump();
      }
    };
    const handleUp = (e: any) => {
      player.current.holdingJump = false;
    };
    window.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') handleIn(e); });
    window.addEventListener('keyup', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') handleUp(e); });
    return () => {
      window.removeEventListener('keydown', handleIn);
      window.removeEventListener('keyup', handleUp);
    };
  }, [gameState, jump]);

  return (
    <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center font-sans select-none overflow-hidden touch-none"
         onTouchStart={(e) => { 
           if(gameState === 'PLAYING') { 
            e.preventDefault(); 
            player.current.holdingJump = true;
            jump(); 
           } 
         }}
         onTouchEnd={() => { player.current.holdingJump = false; }}>
      
      {/* World Leaderboard (Right Side) */}
      <AnimatePresence>
        {(showLeaderboard && (gameState === 'START' || gameState === 'LEVEL_SELECT')) && (
          <motion.div initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x:300 }} className="fixed right-0 top-0 bottom-0 w-64 bg-black/40 backdrop-blur-3xl border-l border-white/10 z-[210] p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-black text-xl italic tracking-tighter">Leaderboard</h3>
              <button 
                onClick={() => setShowLeaderboard(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-white/40 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto pr-2">
              {leaderboard.map((u, i) => (
                <div key={i} id={u.name === (playerName === 'ibbi84admin10' ? 'winner99' : playerName) ? 'player-lb-pos' : undefined} className={`p-4 rounded-2xl border ${u.name === (playerName === 'ibbi84admin10' ? 'winner99' : playerName) ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/5'} transition-all`}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-white font-black text-sm truncate max-w-[100px]">{u.name}</p>
                    {u.score === 100000 && <span className="text-[8px] bg-red-500 text-white px-1 rounded">ADMIN</span>}
                    <p className="text-white/30 text-[10px] font-bold">#{i+1}</p>
                  </div>
                  <p className="text-blue-400 text-[8px] font-black uppercase tracking-widest">{u.score === 0 ? "Unranked" : u.rank}</p>
                  <p className="text-white/60 text-xs font-mono">{u.score} RP</p>
                </div>
              ))}
            </div>
            <button 
              onClick={() => document.getElementById('player-lb-pos')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className="mt-4 w-full bg-blue-500 py-2 rounded-xl text-white font-black text-[10px] uppercase tracking-widest"
            >
              Find You
            </button>
            <p className="mt-auto text-white/20 text-[8px] font-bold text-center uppercase tracking-[0.2em] pt-4 border-t border-white/5">Global Server Status: Online</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="absolute top-8 inset-x-8 flex justify-between items-start z-10 pr-72">
        <div className="flex flex-col gap-2">
           <div className="flex gap-4">
              {!showLeaderboard && (gameState === 'START' || gameState === 'LEVEL_SELECT') && (
                <button 
                  onClick={() => setShowLeaderboard(true)}
                  className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  Leaderboard
                </button>
              )}
              <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20 flex flex-col justify-center">
                <p className="text-white/50 text-[8px] uppercase tracking-widest font-black">Rank</p>
                <p className="text-blue-400 text-xl font-black italic">{currentRank}</p>
              </div>
              
              {(gameState === 'START' || gameState === 'LEVEL_SELECT') && (
                <button 
                  onClick={() => setShowRankList(true)}
                  className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20 flex flex-col justify-center hover:bg-white/20 transition-all"
                >
                  <p className="text-white/50 text-[8px] uppercase tracking-widest font-black">View</p>
                  <p className="text-white text-[12px] font-black uppercase italic">Tiers</p>
                </button>
              )}
              <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20">
                <p className="text-white/50 text-[8px] uppercase tracking-widest font-black">Progress</p>
                <p className="text-white text-xl font-black font-mono">{progress}%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex flex-col gap-1">
                 <div className="flex items-center gap-3">
                    <input 
                      value={playerName} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlayerName(val);
                        localStorage.setItem('ibbi_name', val);
                      }}
                      placeholder="Name (needs #)"
                      className="bg-transparent text-white font-bold outline-none w-32 text-sm"
                    />
                    <button onClick={() => setGameState('CUSTOMIZE')} className="text-xl">🕶️</button>
                 </div>
                 {!validateName(playerName) && <p className="text-red-500 text-[8px] font-black uppercase">3-38 chars & must have numbers!</p>}
              </div>
           </div>
           {isPractice && <div className="text-blue-400 font-bold text-xs uppercase tracking-widest">Practice Mode Active</div>}
        </div>

        <div className="flex gap-4">
          <button onClick={() => { setGameState('LEVEL_SELECT'); setCheckpoints([]); }} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white active:scale-95"><LayoutGrid/></button>
          
          {isPractice && (
            <button 
              onClick={addCheckpoint} 
              className="p-4 bg-cyan-500 hover:bg-cyan-400 rounded-2xl transition-all text-white active:scale-95 flex items-center gap-2 font-bold"
            >
              <Target size={20}/> 💎 Checkpoint
            </button>
          )}

          <button onClick={() => { setIsPractice(!isPractice); setCheckpoints([]); }} className={`p-4 rounded-2xl transition-all active:scale-95 ${isPractice ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/50'}`}><Target size={24}/></button>
          <button onClick={() => setIsMuted(!isMuted)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white active:scale-95">{isMuted ? <VolumeX/> : <Volume2/>}</button>
        </div>
      </div>

      {/* Main Game Container */}
      <div className="relative">
        <canvas ref={canvasRef} width={850} height={600} className="rounded-3xl shadow-2xl border-8 border-white/5" />
      </div>

      <AnimatePresence mode="wait">
          {gameState === 'START' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl">
              <div className="absolute top-8 left-8 flex flex-col items-start gap-1">
                 <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">Current Status</p>
                 <div className="bg-blue-600/20 border border-blue-500/30 px-6 py-2 rounded-2xl backdrop-blur-md">
                    <p className="text-blue-400 text-3xl font-black italic uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(37,99,235,0.5)]">{currentRank}</p>
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1 italic">{rankPoints} RP</p>
                 </div>
              </div>

              <h1 className="text-8xl font-black text-white mb-2 italic tracking-tighter text-center uppercase">ibbi's <br/><span className="text-blue-500">geometry 84</span></h1>
              <p className="text-white/30 mb-8 uppercase tracking-[0.6em] text-xs font-black">Spiritual Successor</p>
              
              <div className="flex flex-col gap-6 w-full max-w-2xl px-8">
                {/* Profile Section */}
                <div className="bg-white/5 border border-white/10 rounded-[40px] p-6 flex items-center justify-between gap-4">
                   <div className="flex flex-col flex-1">
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Player Profile</p>
                      <input 
                        value={playerName} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setPlayerName(val);
                          localStorage.setItem('ibbi_name', val);
                        }}
                        placeholder="Enter Name..."
                        className="bg-transparent text-white text-3xl font-black outline-none w-full italic uppercase"
                      />
                      {!validateName(playerName) && <p className="text-red-500 text-[10px] font-black uppercase mt-1">Needs numbers & 3-38 chars</p>}
                   </div>
                   <button onClick={() => setGameState('CUSTOMIZE')} className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-4xl hover:bg-white/20 transition-all border border-white/5">
                      {playerIcon}
                   </button>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setIsRanked(false); setIsPractice(false); setGameState('LEVEL_SELECT'); }} className="py-6 bg-white text-black rounded-[32px] font-black text-xl hover:scale-105 active:scale-95 transition-all">NORMAL</button>
                  <button onClick={() => { if(!completedStereo) { setGameState('RANKED_INFO'); return; } setIsRanked(true); setIsPractice(false); setGameState('LEVEL_SELECT'); }} className={`py-6 rounded-[32px] font-black text-xl transition-all flex items-center justify-center gap-2 ${completedStereo ? 'bg-blue-600 text-white hover:scale-105 active:scale-95' : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}`}>
                       {completedStereo ? <Flame fill="white"/> : <Lock size={20} className="text-white/20"/>} {completedStereo ? 'RANKED' : 'LOCKED'}
                  </button>
                </div>

                {/* Secondary Hub Actions */}
                <div className="grid grid-cols-4 gap-3">
                   <button onClick={() => setGameState('CUSTOMIZE')} className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
                      <Settings2 size={24} className="text-white group-hover:rotate-90 transition-all"/>
                      <span className="text-white font-black text-[10px] uppercase">Closet</span>
                   </button>
                   <button onClick={() => setShowRankList(true)} className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
                      <Trophy size={24} className="text-yellow-500 group-hover:scale-110 transition-all"/>
                      <span className="text-white font-black text-[10px] uppercase">Ranks</span>
                   </button>
                   <button onClick={() => setShowLeaderboard(true)} className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
                      <LayoutGrid size={24} className="text-blue-400 group-hover:scale-110 transition-all"/>
                      <span className="text-white font-black text-[10px] uppercase">Top List</span>
                   </button>
                   <button onClick={() => setShowShop(true)} className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group">
                      <span className="text-2xl group-hover:animate-bounce">🛒</span>
                      <span className="text-white font-black text-[10px] uppercase">Shop</span>
                   </button>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setShowRedeem(true)} className="flex-1 py-4 bg-blue-500 text-white rounded-3xl font-black text-sm hover:scale-105 active:scale-95 transition-all uppercase italic tracking-tighter">Enter Promo Code</button>
                </div>
              </div>

              <div className="mt-12 text-center flex flex-col items-center gap-6">
                 {hasIbbi9 && !hasSeenDescription && (
                    <button 
                      onClick={() => setShowDescription(true)}
                      className="px-16 py-6 bg-amber-500 text-white rounded-[40px] font-black text-3xl hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-amber-500/40 animate-bounce uppercase italic tracking-tighter"
                    >
                      Description
                    </button>
                 )}
                 {!completedStereo && <p className="text-red-500/60 text-[10px] uppercase font-black tracking-[0.3em] animate-pulse mb-6">Complete "Stereo Fame" to play Ranked</p>}
                 <p className="text-white/20 text-[10px] uppercase font-black tracking-[0.3em]">on april 21st new code will drop</p>
              </div>
            </motion.div>
          )}

          {showDescription && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-12">
               <div className="bg-white/5 border border-white/10 p-12 rounded-[50px] max-w-lg text-center relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-3 bg-amber-500 group-hover:bg-amber-400 transition-colors" />
                  <button 
                    onClick={() => {
                      setShowDescription(false);
                      setHasSeenDescription(true);
                      localStorage.setItem('ibbi_saw_desc', 'true');
                    }}
                    className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all font-black text-xl"
                  >
                    X
                  </button>
                  <h2 className="text-6xl font-black text-white mb-6 uppercase italic tracking-tighter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">1nun1 INTEL</h2>
                  <div className="space-y-6 text-white/70">
                    <p className="text-2xl font-bold leading-tight">The <span className="text-amber-500 italic">1nun1</span> is a legendary item featuring a high-voltage yellow cube with yellow spikes and a titanium blue pole on top.</p>
                    <div className="bg-white/10 p-8 rounded-[40px] mt-8 border border-white/10 shadow-inner">
                       <p className="text-amber-500 font-black text-4xl mb-3 tracking-tighter">SELLS FOR: 4 COINS</p>
                       <div className="h-px bg-white/20 w-1/2 mx-auto mb-3" />
                       <p className="text-white font-bold uppercase tracking-widest text-sm">GIVES: LEGENDARY STATUS & POWERFUL STYLE</p>
                    </div>
                  </div>
               </div>
            </motion.div>
          )}

          {gameState === 'CUSTOMIZE' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-3xl p-12 overflow-y-auto">
               <h2 className="text-4xl font-black text-white mb-2 italic">THE CLOSET</h2>
               <p className="text-yellow-500 font-black text-sm mb-8 animate-bounce flex items-center gap-2">💰 {rankedCoins} COINS</p>
               
               <div className="w-full max-w-lg">
                 <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Select Skin</p>
                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    <button onClick={() => { setCurrentSkin('DEFAULT'); localStorage.setItem('ibbi_skin', 'DEFAULT'); }} className={`p-4 rounded-2xl border-2 transition-all ${currentSkin === 'DEFAULT' ? 'border-blue-500 bg-blue-500/20' : 'border-white/10 bg-white/5'}`}>
                       <p className="text-white font-bold text-xs uppercase">Default</p>
                    </button>
                    {hasGoldOC && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('GOLD_OC'); localStorage.setItem('ibbi_skin', 'GOLD_OC'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === 'GOLD_OC' ? 'border-yellow-500 bg-yellow-500/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-yellow-500 font-bold text-xs uppercase">Gold OC</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHasGoldOC(false); 
                          localStorage.setItem('ibbi_gold_oc', 'false');
                          setRankedCoins(c => c + 2);
                          localStorage.setItem('ibbi_coins', (rankedCoins + 2).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 2</button>
                      </div>
                    )}
                    {hasSkeleton && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('SKELETON'); localStorage.setItem('ibbi_skin', 'SKELETON'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === 'SKELETON' ? 'border-purple-500 bg-purple-500/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-purple-500 font-bold text-xs uppercase">Skeleton</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHasSkeleton(false); 
                          localStorage.setItem('ibbi_skeleton', 'false');
                          setRankedCoins(c => c + 3);
                          localStorage.setItem('ibbi_coins', (rankedCoins + 3).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 3</button>
                      </div>
                    )}
                    {hasPS5 && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('PS5'); localStorage.setItem('ibbi_skin', 'PS5'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === 'PS5' ? 'border-blue-400 bg-blue-400/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-blue-400 font-bold text-xs uppercase">PS5 RL</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHasPS5(false); 
                          localStorage.setItem('ibbi_ps5', 'false');
                          setRankedCoins(c => c + 1);
                          localStorage.setItem('ibbi_coins', (rankedCoins + 1).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 1</button>
                      </div>
                    )}
                    {hasKhadui && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('KHADUI'); localStorage.setItem('ibbi_skin', 'KHADUI'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === 'KHADUI' ? 'border-white bg-white/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-white font-bold text-xs uppercase">Khadui</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHasKhadui(false); 
                          localStorage.setItem('ibbi_khadui', 'false');
                          const reward = 2; // Bought for 4, sell for 2
                          setRankedCoins(c => c + reward);
                          localStorage.setItem('ibbi_coins', (rankedCoins + reward).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 2</button>
                      </div>
                    )}
                    {hasIbbi9 && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('FLAG_🇵🇰'); localStorage.setItem('ibbi_skin', 'FLAG_🇵🇰'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === 'FLAG_🇵🇰' ? 'border-green-500 bg-green-500/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-green-500 font-bold text-xs uppercase">ibbi 9</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHasIbbi9(false); 
                          localStorage.setItem('ibbi_ibbi9', 'false');
                          const reward = 1; // Bought for 3, sell for 1
                          setRankedCoins(c => c + reward);
                          localStorage.setItem('ibbi_coins', (rankedCoins + reward).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 1</button>
                      </div>
                    )}
                    {hasKnife && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('KNIFE'); localStorage.setItem('ibbi_skin', 'KNIFE'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === 'KNIFE' ? 'border-amber-400 bg-amber-400/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-amber-400 font-bold text-xs uppercase">888 Head</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHasKnife(false); 
                          localStorage.setItem('ibbi_knife', 'false');
                          const reward = 1; 
                          setRankedCoins(c => c + reward);
                          localStorage.setItem('ibbi_coins', (rankedCoins + reward).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 1</button>
                      </div>
                    )}
                     {hasPlane24 && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('PLANE24'); localStorage.setItem('ibbi_skin', 'PLANE24'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === 'PLANE24' ? 'border-rose-500 bg-rose-500/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-rose-500 font-bold text-xs uppercase">Plane24</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHasPlane24(false); 
                          localStorage.setItem('ibbi_plane24', 'false');
                          const reward = 5; 
                          setRankedCoins(c => c + reward);
                          localStorage.setItem('ibbi_coins', (rankedCoins + reward).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 5</button>
                      </div>
                    )}
                    {has1nun1 && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('1NUN1'); localStorage.setItem('ibbi_skin', '1NUN1'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === '1NUN1' ? 'border-amber-400 bg-amber-400/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-amber-400 font-bold text-xs uppercase">1nun1</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHas1nun1(false); 
                          localStorage.setItem('ibbi_1nun1', 'false');
                          const reward = 4; 
                          setRankedCoins(c => c + reward);
                          localStorage.setItem('ibbi_coins', (rankedCoins + reward).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 4</button>
                      </div>
                    )}
                    {hasIBI && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('IBI'); localStorage.setItem('ibbi_skin', 'IBI'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === 'IBI' ? 'border-cyan-400 bg-cyan-400/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-cyan-400 font-bold text-xs uppercase">IBI</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHasIBI(false); 
                          localStorage.setItem('ibbi_ibi', 'false');
                          const reward = 1; 
                          setRankedCoins(c => c + reward);
                          localStorage.setItem('ibbi_coins', (rankedCoins + reward).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 1</button>
                      </div>
                    )}
                    {hasIbadRblx && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('IBADRBLX'); localStorage.setItem('ibbi_skin', 'IBADRBLX'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === 'IBADRBLX' ? 'border-blue-500 bg-blue-500/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-blue-500 font-bold text-xs uppercase">IBADRBLX</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHasIbadRblx(false); 
                          localStorage.setItem('ibbi_ibadrblx', 'false');
                          const reward = 6; 
                          setRankedCoins(c => c + reward);
                          localStorage.setItem('ibbi_coins', (rankedCoins + reward).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 6</button>
                      </div>
                    )}
                    {hasBanana && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('BANANA'); localStorage.setItem('ibbi_skin', 'BANANA'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === 'BANANA' ? 'border-yellow-400 bg-yellow-400/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-yellow-400 font-bold text-xs uppercase">Banana</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHasBanana(false); 
                          localStorage.setItem('ibbi_banana', 'false');
                          const reward = 1; 
                          setRankedCoins(c => c + reward);
                          localStorage.setItem('ibbi_coins', (rankedCoins + reward).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 1</button>
                      </div>
                    )}
                    {hasMoon && (
                      <div className="relative group">
                        <button onClick={() => { setCurrentSkin('MOON'); localStorage.setItem('ibbi_skin', 'MOON'); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === 'MOON' ? 'border-white bg-white/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-white font-bold text-xs uppercase">Moon SN</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          setHasMoon(false); 
                          localStorage.setItem('ibbi_moon', 'false');
                          const reward = 3; 
                          setRankedCoins(c => c + reward);
                          localStorage.setItem('ibbi_coins', (rankedCoins + reward).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 3</button>
                      </div>
                    )}
                    {ownedFlags.map((f, i) => (
                      <div key={`${f}-${i}`} className="relative group">
                        <button onClick={() => { setCurrentSkin(`FLAG_${f}`); localStorage.setItem('ibbi_skin', `FLAG_${f}`); }} className={`w-full p-4 rounded-2xl border-2 transition-all ${currentSkin === `FLAG_${f}` ? 'border-blue-500 bg-blue-500/20' : 'border-white/10 bg-white/5'}`}>
                           <p className="text-white font-bold text-xs uppercase">{f}</p>
                        </button>
                        <button onClick={(e) => { 
                          e.stopPropagation(); 
                          const newFlags = ownedFlags.filter((_, idx) => idx !== i);
                          setOwnedFlags(newFlags);
                          localStorage.setItem('ibbi_flags', JSON.stringify(newFlags));
                          const reward = 1; 
                          setRankedCoins(c => c + reward);
                          localStorage.setItem('ibbi_coins', (rankedCoins + reward).toString());
                          setCurrentSkin('DEFAULT');
                        }} className="absolute -top-2 -right-2 bg-red-600 text-white w-10 h-6 px-1 rounded-full text-[8px] font-black shadow-xl border border-white/20">SELL 1</button>
                      </div>
                    ))}
                 </div>

                 {currentSkin === 'DEFAULT' && (
                   <>
                     <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Emoji Head</p>
                     <div className="grid grid-cols-4 gap-4 mb-8">
                        {['🕶️', '👑', '🔥', '⚡', '🌈', '💎', '🚀', '🐱'].map((icon, i) => (
                          <button 
                            key={`${icon}-${i}`} 
                            onClick={() => { setPlayerIcon(icon); }}
                            className={`w-16 h-16 rounded-2xl text-3xl flex items-center justify-center transition-all ${playerIcon === icon ? 'bg-blue-500 scale-110 shadow-lg shadow-blue-500/50' : 'bg-white/5 hover:bg-white/10'}`}
                          >
                            {icon}
                          </button>
                        ))}
                     </div>

                     <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Cube Color</p>
                     <div className="grid grid-cols-4 gap-4 mb-8">
                        {['#fbbf24', '#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#06b6d4', '#f472b6', '#ffffff'].map((c, i) => (
                          <button 
                            key={`${c}-${i}`} 
                            onClick={() => setPlayerColor(c)}
                            className={`w-12 h-12 rounded-full border-4 transition-all ${playerColor === c ? 'scale-110 shadow-lg' : 'opacity-40 border-transparent'}`}
                            style={{ backgroundColor: c, borderColor: playerColor === c ? 'white' : 'transparent' }}
                          />
                        ))}
                     </div>
                   </>
                 )}
               </div>

               <button onClick={() => setGameState('START')} className="mt-12 px-12 py-4 bg-white text-black rounded-2xl font-black italic uppercase">Save Style</button>
               <button onClick={() => setGameState('START')} className="mt-8 text-yellow-400 font-bold uppercase tracking-widest hover:underline">Go Back</button>
            </motion.div>
          )}

          {gameState === 'RANKED_INFO' && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl p-12 text-center">
               <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6"><Lock size={40} className="text-blue-500"/></div>
               <h2 className="text-4xl font-black text-white mb-4 uppercase italic">Ranked Locked</h2>
               <p className="text-white/60 mb-8 max-w-sm">Prove your worth first! Complete <span className="text-white font-bold">Stereo Fame</span> in normal mode to unlock the competitive ranked ladder.</p>
               <button onClick={() => setGameState('START')} className="px-8 py-4 bg-white text-black rounded-2xl font-black mb-8">HUB</button>
               <button onClick={() => setGameState('START')} className="text-yellow-400 font-bold uppercase tracking-widest hover:underline">Go Back</button>
            </motion.div>
          )}

          {showRankList && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-12">
               <div className="w-full max-w-4xl h-full flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Global Rank Tiers</h2>
                     <button onClick={() => setShowRankList(false)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold uppercase tracking-widest transition-all">Close</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {RANK_DATA.map((r, i) => (
                       <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-6">
                          <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-col gap-1" style={{ backgroundColor: r.bgColor || `${r.color}30`, border: `2px solid ${r.color}` }}>
                             {r.stripe ? (
                               <div className="flex flex-col gap-1">
                                 {Array.from({ length: r.stripe }).map((_, si) => (
                                   <div key={si} className="w-8 h-1 bg-black rounded-full" />
                                 ))}
                               </div>
                             ) : (
                               <div className="text-white font-bold text-center leading-tight whitespace-pre">{r.icon}</div>
                             )}
                          </div>
                          <div>
                            <p className="text-white font-black text-lg">{r.name}</p>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{r.points}+ RP</p>
                            {r.name === "Fake Killscreen" && <p className="text-red-500 text-[8px] font-bold italic mt-1 uppercase">new rank droping on april 29th</p>}
                          </div>
                       </div>
                     ))}
                     <div className="col-span-full mt-8 p-8 bg-blue-500/10 border-2 border-dashed border-blue-500/40 rounded-3xl text-center">
                        <p className="text-blue-400 font-black text-xl mb-2 italic">NEW 5 RANKS COMING SOON</p>
                        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">Expected Drop: 4th May</p>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {gameState === 'LEVEL_SELECT' && (
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl p-12">
               <div className="flex justify-between w-full max-w-4xl mb-8 items-end">
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{isRanked ? (rankPoints >= 10000 ? 'Pro Infinity Realm' : 'The Crucible (Ranked)') : 'Adventure Select'}</h2>
                  <button onClick={() => setGameState('START')} className="text-white/40 hover:text-white transition-all text-xs font-bold uppercase tracking-widest">Back to Hub</button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl overflow-y-auto max-h-[70vh] p-4">
                  {!isRanked ? (
                    STATIC_LEVELS.map((lvl, i) => (
                      <button key={i} onClick={() => { initLevel(lvl); resetGame(); }} className="p-8 rounded-3xl border-2 border-white/10 hover:border-white/40 transition-all text-left relative overflow-hidden active:scale-95 group" style={{ backgroundColor: `${lvl.color}10` }}>
                        <div className="flex justify-between items-start mb-4">
                           <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-white/10"><ChevronRight size={24} style={{ color: lvl.color }}/></div>
                           {i === 0 && completedStereo && <CheckCircle2 className="text-green-500" size={20}/>}
                        </div>
                        <p className="text-white font-black text-xl mb-1">{lvl.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: lvl.color }}>{lvl.difficulty}</p>
                      </button>
                    ))
                  ) : (
                    (rankPoints >= 10000 ? [0,1,2,3,4,5,6,7,8,9] : [0,1,2,3,4,5,6]).map((tier) => (
                      <button key={tier} onClick={() => { 
                        setCurrentTier(tier);
                        const lvl = generateProceduralLevel(tier, Math.floor(rankPoints/100));
                        lvl.width += 2000; // Longer levels
                        initLevel(lvl); 
                        resetGame(); 
                      }} className="p-8 rounded-3xl border-2 border-white/10 hover:border-white/40 transition-all text-left relative active:scale-95 group" style={{ backgroundColor: `${DIFF_COLORS[tier]}10` }}>
                         <div className="flex justify-between items-start mb-4">
                           <div className="p-3 rounded-2xl bg-white/5"><Flame size={24} style={{ color: DIFF_COLORS[tier] }}/></div>
                        </div>
                        <p className="text-white font-black text-xl mb-1">{DIFFICULTIES[tier]}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: DIFF_COLORS[tier] }}>Ranked Tier {tier + 1}</p>
                      </button>
                    ))
                  )}
               </div>
               <button onClick={() => setGameState('START')} className="mt-8 text-yellow-400 font-bold uppercase tracking-widest hover:underline">Go Back</button>
            </motion.div>
          )}

          {gameState === 'GAMEOVER' && (
            <motion.div initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-xl">
              <Skull size={64} className="text-white mb-6" />
              <h2 className="text-6xl font-black text-white mb-2 uppercase italic tracking-tighter text-center">FAILURE</h2>
              <p className="text-white/60 mb-10 font-mono text-xl">{progress}% • ATTEMPT {attempts}</p>
              
              <div className="flex flex-col gap-4 w-64 items-center">
                <button onClick={resetGame} className="w-full py-5 bg-white text-black rounded-3xl font-black active:scale-95 transition-all">RETRY</button>
                <button onClick={() => setGameState('LEVEL_SELECT')} className="w-full py-5 bg-white/10 text-white rounded-3xl font-black border border-white/10 active:scale-95 transition-all">MENU</button>
              </div>

              <div className="absolute bottom-8 px-8 text-center w-full">
                <p className="text-black font-black text-sm uppercase italic tracking-tighter opacity-80">{deathMsg}</p>
              </div>
            </motion.div>
          )}

          {showShop && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-3xl">
                <div className="bg-white/5 border border-white/10 p-12 rounded-[40px] text-center w-full max-w-4xl shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20">
                      <motion.div initial={{ width: '100%' }} animate={{ width: 0 }} transition={{ duration: 300, ease: 'linear' }} key={shopTimer} className="h-full bg-amber-500 shadow-[0_0_10px_#f59e0b]"/>
                   </div>
                   
                   <div className="flex justify-between items-center mb-8">
                      <div>
                        <h2 className="text-white font-black text-4xl italic uppercase tracking-tighter text-left">THE SHOP</h2>
                        <p className="text-amber-500 font-bold text-[10px] text-left uppercase tracking-widest">Restocking in {Math.floor(shopTimer/60)}:{(shopTimer%60).toString().padStart(2, '0')}</p>
                      </div>
                      <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10">
                        <p className="text-amber-500 font-black text-xl italic">💰 {rankedCoins} <span className="text-[10px] uppercase font-bold text-white/40">coins</span></p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                      {shopItems.map((item) => {
                        const isOwned = (item.id === 'khadui' && hasKhadui) || 
                                        (item.id === 'ibbi9' && hasIbbi9) || 
                                        (item.id === 'ibi' && hasIBI) ||
                                        (item.id === 'banana' && hasBanana) ||
                                        (item.id === 'moon' && hasMoon) ||
                                        (item.id === '1nun1' && has1nun1) ||
                                        (item.id === 'plane' && hasPlane24) ||
                                        (item.id.startsWith('flag_') && ownedFlags.includes(item.icon));
                        
                        return (
                          <div key={item.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl group hover:border-amber-500/50 transition-all">
                             <div className="text-5xl mb-4 scale-90 group-hover:scale-100 transition-all">{item.icon}</div>
                             <p className="text-white font-black uppercase text-xs mb-1 tracking-widest">{item.name}</p>
                             <div className="flex justify-center items-center gap-2">
                                <p className="text-amber-500 font-black italic">{item.price} Coins</p>
                             </div>
                             <button 
                               onClick={() => {
                                 if (isOwned) {
                                   // Logic to sell from shop
                                   if (item.id === 'khadui') { setHasKhadui(false); localStorage.setItem('ibbi_khadui', 'false'); setRankedCoins(c => c + 2); localStorage.setItem('ibbi_coins', (rankedCoins + 2).toString()); }
                                   else if (item.id === 'ibbi9') { setHasIbbi9(false); localStorage.setItem('ibbi_ibbi9', 'false'); setRankedCoins(c => c + 1); localStorage.setItem('ibbi_coins', (rankedCoins + 1).toString()); }
                                   else if (item.id === 'ibi') { setHasIBI(false); localStorage.setItem('ibbi_ibi', 'false'); setRankedCoins(c => c + 1); localStorage.setItem('ibbi_coins', (rankedCoins + 1).toString()); }
                                   else if (item.id === 'banana') { setHasBanana(false); localStorage.setItem('ibbi_banana', 'false'); setRankedCoins(c => c + 1); localStorage.setItem('ibbi_coins', (rankedCoins + 1).toString()); }
                                   else if (item.id === 'moon') { setHasMoon(false); localStorage.setItem('ibbi_moon', 'false'); setRankedCoins(c => c + 3); localStorage.setItem('ibbi_coins', (rankedCoins + 3).toString()); }
                                   else if (item.id === '1nun1') { setHas1nun1(false); localStorage.setItem('ibbi_1nun1', 'false'); setRankedCoins(c => c + 4); localStorage.setItem('ibbi_coins', (rankedCoins + 4).toString()); }
                                   else if (item.id === 'plane') { setHasPlane24(false); localStorage.setItem('ibbi_plane24', 'false'); setRankedCoins(c => c + 5); localStorage.setItem('ibbi_coins', (rankedCoins + 5).toString()); }
                                   else if (item.id.startsWith('flag_')) {
                                     const newFlags = ownedFlags.filter(of => of !== item.icon);
                                     setOwnedFlags(newFlags);
                                     localStorage.setItem('ibbi_flags', JSON.stringify(newFlags));
                                     setRankedCoins(c => c + 1);
                                     localStorage.setItem('ibbi_coins', (rankedCoins + 1).toString());
                                   }
                                   setCurrentSkin('DEFAULT');
                                   return;
                                 }
                                 setRankedCoins(c => c - item.price);
                                 localStorage.setItem('ibbi_coins', (rankedCoins - item.price).toString());
                                 if (item.id === 'khadui') { setHasKhadui(true); localStorage.setItem('ibbi_khadui', 'true'); }
                                 else if (item.id === 'ibbi9') { setHasIbbi9(true); localStorage.setItem('ibbi_ibbi9', 'true'); }
                                 else if (item.id === 'ibi') { setHasIBI(true); localStorage.setItem('ibbi_ibi', 'true'); }
                                 else if (item.id === 'banana') { setHasBanana(true); localStorage.setItem('ibbi_banana', 'true'); }
                                 else if (item.id === 'moon') { setHasMoon(true); localStorage.setItem('ibbi_moon', 'true'); }
                                 else if (item.id === '1nun1') { setHas1nun1(true); localStorage.setItem('ibbi_1nun1', 'true'); }
                                 else if (item.id === 'plane') { setHasPlane24(true); localStorage.setItem('ibbi_plane24', 'true'); }
                                 else if (item.id.startsWith('flag_')) {
                                   const newFlags = [...ownedFlags, item.icon];
                                   setOwnedFlags(newFlags);
                                   localStorage.setItem('ibbi_flags', JSON.stringify(newFlags));
                                 }
                               }}
                               className={`mt-4 w-full py-3 rounded-xl font-black uppercase text-[10px] transition-all ${isOwned ? 'bg-red-600 text-white hover:bg-red-700' : rankedCoins >= item.price ? 'bg-white text-black hover:scale-105' : 'bg-red-500/20 text-red-400 opacity-50'}`}
                             >
                               {isOwned ? `SELL ${item.id === 'plane' ? 5 : item.id === '1nun1' ? 4 : item.id === 'moon' ? 3 : item.id === 'khadui' ? 2 : 1}` : rankedCoins >= item.price ? 'PURCHASE' : 'BROKE'}
                             </button>
                          </div>
                        );
                      })}
                   </div>

                   <button onClick={() => setShowShop(false)} className="px-12 py-3 text-white/40 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-all">Close Store</button>
                </div>
             </motion.div>
          )}

          {showRedeem && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-3xl">
                <div className="bg-white/5 border border-white/10 p-12 rounded-[40px] text-center w-full max-w-md shadow-2xl">
                   <h2 className="text-white font-black text-3xl mb-8 italic uppercase tracking-tighter">REDEEM CODES</h2>
                   <input 
                     type="text" 
                     placeholder="Enter Code..." 
                     className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-white font-bold outline-none mb-6 focus:border-blue-500 transition-all text-center uppercase"
                     value={redeemVal}
                     onChange={(e) => setRedeemVal(e.target.value.toUpperCase())}
                   />
                   <div className="flex flex-col gap-3">
                     <button onClick={() => {
                        if (redeemVal === 'GOLD OC') {
                           setHasGoldOC(true);
                           localStorage.setItem('ibbi_gold_oc', 'true');
                           setGameState('CUSTOMIZE');
                           setShowRedeem(false);
                           setCurrentSkin('GOLD_OC');
                           localStorage.setItem('ibbi_skin', 'GOLD_OC');
                        } else if (redeemVal === 'IBBI OG') {
                           setHasSkeleton(true);
                           localStorage.setItem('ibbi_skeleton', 'true');
                           setGameState('CUSTOMIZE');
                           setShowRedeem(false);
                        } else if (redeemVal === 'PS5 RL') {
                           setHasPS5(true);
                           localStorage.setItem('ibbi_ps5', 'true');
                           setGameState('CUSTOMIZE');
                           setShowRedeem(false);
                           setCurrentSkin('PS5');
                           localStorage.setItem('ibbi_skin', 'PS5');
                        } else if (redeemVal === 'vvv888') {
                           setHasKnife(true);
                           localStorage.setItem('ibbi_knife', 'true');
                           setGameState('CUSTOMIZE');
                           setShowRedeem(false);
                           setCurrentSkin('KNIFE');
                           localStorage.setItem('ibbi_skin', 'KNIFE');
                        } else if (redeemVal === 'THE 1NUN1') {
                           setHas1nun1(true);
                           localStorage.setItem('ibbi_1nun1', 'true');
                           setGameState('CUSTOMIZE');
                           setShowRedeem(false);
                           setCurrentSkin('1NUN1');
                           localStorage.setItem('ibbi_skin', '1NUN1');
                        } else if (redeemVal === 'CMD') {
                           setRankedCoins(c => c + 3);
                           localStorage.setItem('ibbi_coins', (rankedCoins + 3).toString());
                           alert("CMD Activated: +3 Sigma Coins");
                           setShowRedeem(false);
                        } else if (redeemVal === '1441' || redeemVal === '141') {
                           setRankedCoins(c => c + 1);
                           localStorage.setItem('ibbi_coins', (rankedCoins + 1).toString());
                           alert("Code Activated: +1 Coin");
                           setShowRedeem(false);
                        } else if (redeemVal === 'IBADRBLX') {
                           if (rankedCoins >= 7) {
                              setRankedCoins(c => c - 7);
                              localStorage.setItem('ibbi_coins', (rankedCoins - 7).toString());
                              setHasIbadRblx(true);
                              localStorage.setItem('ibbi_ibadrblx', 'true');
                              setGameState('CUSTOMIZE');
                              setShowRedeem(false);
                              setCurrentSkin('IBADRBLX');
                              localStorage.setItem('ibbi_skin', 'IBADRBLX');
                           } else {
                              alert("Need 7 Coins to use this code!");
                           }
                        } else if (redeemVal === 'SUESS') {
                           setHasSuess(true);
                           localStorage.setItem('ibbi_suess', 'true');
                           setGameState('CUSTOMIZE');
                           setShowRedeem(false);
                           setCurrentSkin('SUESS');
                           localStorage.setItem('ibbi_skin', 'SUESS');
                        } else {
                           alert("Invalid Code");
                        }
                     }} className="w-full py-4 bg-white text-black rounded-2xl font-black transition-all active:scale-95">ACTIVATE</button>
                     <button onClick={() => setShowRedeem(false)} className="w-full py-4 text-white/40 font-bold uppercase tracking-widest text-xs hover:text-white transition-all">Cancel</button>
                   </div>
                </div>
             </motion.div>
          )}

          {gameState === 'FETCHING_RESULTS' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl text-center">
                <div className="w-24 h-24 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                <h2 className="text-4xl font-black text-white italic animate-pulse">FETCHING RESULTS...</h2>
                <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 animate-bounce">
                  <p className="text-blue-400 font-bold text-xs uppercase tracking-[0.3em]">subscribe to ibbithesigma called ibbi og</p>
                </div>
                <p className="text-white/20 mt-4 tracking-widest font-bold uppercase text-[10px]">Verifying with Global Server</p>
             </motion.div>
          )}

          {gameState === 'WIN' && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-emerald-950/95 backdrop-blur-2xl p-12 text-center">
              <Trophy size={80} className="text-emerald-400 mb-6 animate-bounce" />
              <h2 className="text-7xl font-black text-white mb-2 uppercase italic tracking-tighter">LEGENDARY</h2>
              <p className="text-white/60 mb-6 font-mono text-xl">100% COMPLETE • {attempts} ATTEMPTS</p>
              
              {isRanked && (
                <div className="mb-10 w-full max-w-md bg-white/5 p-8 rounded-3xl border border-white/10">
                   <div className="flex justify-between items-center mb-6">
                      <div className="text-left">
                         <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Previous Rank</p>
                         <p className="text-white text-xl font-bold">{resultsData.oldRank}</p>
                      </div>
                      <ChevronRight className="text-blue-500"/>
                      <div className="text-right">
                         <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">New Rank</p>
                         <p className="text-blue-400 text-xl font-black italic">{resultsData.newRank}</p>
                      </div>
                   </div>
                   <div className="h-4 bg-white/10 rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min(100, (resultsData.points / 1000) * 100)}%` }} 
                        className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                      />
                   </div>
                   <p className="mt-4 text-blue-400 font-black tracking-widest text-sm">+{resultsData.points} RP ({resultsData.percentGain}%)</p>
                </div>
              )}
              
               {currentLevel.name === 'Insane' && !isRanked && (
                 <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-3xl animate-pulse">
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Admin Access Decrypted</p>
                   <p className="text-white text-4xl font-black italic tracking-tighter">72958</p>
                 </div>
               )}

              <button onClick={() => setGameState('LEVEL_SELECT')} className="px-12 py-5 bg-white text-black rounded-3xl font-black transition-all active:scale-95 mt-8">CONTINUE</button>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Secret Label */}
      <div className="absolute bottom-4 left-4 z-0 opacity-[0.05] pointer-events-none select-none flex items-center gap-2">
        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em]">ibbi84</span>
      </div>

      {/* Admin Button (Prank or Real) */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-2">
        <AnimatePresence>
          {adminMsg && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-black/90 text-white border border-white/20 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl"
            >
              {adminMsg}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Admin Secret Panel */}
        <AnimatePresence>
          {showAdminPanel && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="mb-4 bg-red-600/95 backdrop-blur-2xl p-8 rounded-[40px] border-2 border-red-500 shadow-[0_20px_60px_rgba(239,68,68,0.4)] w-96 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
               <h3 className="text-white font-black text-2xl mb-6 italic uppercase tracking-tighter">System Terminal</h3>
               <div className="flex flex-col gap-3">
                  <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest">Global Ranks (Scroll)</p>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {RANK_DATA.filter(r => r.name !== 'ADMIN TIME').map((rank) => (
                      <button 
                        key={rank.name} 
                        onClick={() => { setRankPoints(rank.points); localStorage.setItem('ibbi_rp', rank.points.toString()); }} 
                        className="bg-white/10 hover:bg-white/20 py-2 rounded-xl text-white font-bold text-[8px] uppercase transition-all"
                      >
                        {rank.name}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 20, 50, 100, 500, 1000].map(val => (
                      <button key={val} onClick={() => { setRankedCoins(val); localStorage.setItem('ibbi_coins', val.toString()); }} className="bg-white/10 hover:bg-white/20 py-2 rounded-xl text-emerald-400 font-bold text-[8px] uppercase">
                        SET {val} COINS
                      </button>
                    ))}
                  </div>
                  <div className="bg-black/20 p-4 rounded-xl mt-2">
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest mb-2">Active Codes</p>
                    <p className="text-white font-mono text-[10px]">GOLD OC, IBBI OG, PS5 RL, vvv888, the 1nun1, cmd, 1441, IBADRBLX, SUESS</p>
                  </div>
                  <button onClick={() => setRankPoints(rankPoints + 1000)} className="w-full bg-white py-3 rounded-2xl text-red-600 font-black uppercase text-sm mt-4">Rank Up +1</button>
                  <button onClick={() => { setShowAdminPanel(false); setGameState('START'); }} className="w-full bg-black/40 py-2 rounded-xl text-white/60 font-bold uppercase text-[10px] tracking-widest mt-2">Close</button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

         {showAdminLogin && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-3xl">
                <div className="bg-white/5 border border-white/10 p-12 rounded-[40px] text-center w-full max-w-md shadow-2xl">
                   <h2 className="text-white font-black text-3xl mb-8 italic uppercase tracking-tighter">ADMIN VERIFICATION</h2>
                   <input 
                     type="text" 
                     placeholder="Enter Code..." 
                     className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-white font-bold outline-none mb-6 focus:border-red-500 transition-all text-center uppercase"
                     value={adminCodeInput}
                     onChange={(e) => setAdminCodeInput(e.target.value)}
                   />
                   <div className="flex flex-col gap-3">
                     <button onClick={() => {
                        if (adminCodeInput === '72958') {
                           setShowAdminPanel(true);
                           setShowAdminLogin(false);
                           setAdminCodeInput('');
                        } else {
                           alert("try acode");
                        }
                     }} className="w-full py-4 bg-white text-black rounded-2xl font-black transition-all active:scale-95 text-xs">Verify Access</button>
                     <button onClick={() => setShowAdminLogin(false)} className="w-full py-4 text-white/40 font-bold uppercase tracking-widest text-xs hover:text-white transition-all">Abort</button>
                   </div>
                </div>
             </motion.div>
          )}

        <button 
          onClick={() => {
            const lowerName = playerName.toLowerCase();
            if (lowerName === 'ibbi84' || lowerName === 'ibad10') {
              setShowAdminLogin(true);
              return;
            }
            if (adminStep === 0) {
              setAdminMsg("you have got pranked sry no");
              setTimeout(() => setAdminMsg("clue: name"), 1500);
            } else if (adminStep === 1) {
              setAdminMsg("first world of the game");
            }
            setAdminStep(prev => (prev + 1) % 2);
          }}
          className={`w-12 h-12 rounded-full transition-all animate-pulse border flex items-center justify-center text-[8px] font-black text-white ${(playerName.toLowerCase() === 'ibbi84' || playerName.toLowerCase() === 'ibad10') ? 'bg-red-600 border-red-400 opacity-100' : 'bg-gradient-to-tr from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 opacity-20 hover:opacity-100 border-white/40'}`}
        >
          {(playerName.toLowerCase() === 'ibbi84' || playerName.toLowerCase() === 'ibad10') ? 'CMD' : 'ADMIN'}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { font-family: 'Inter', sans-serif; background: #020617; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
      ` }} />
    </div>
  );
}
