import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sword, 
  Scroll, 
  Crown, 
  Wind, 
  ShoppingBag, 
  AlertCircle, 
  ChevronRight, 
  RefreshCcw, 
  User, 
  Compass,
  MessageSquare,
  Shield,
  Zap,
  Star
} from 'lucide-react';
import { cn } from '../lib/utils';

// --- Types ---

type BackgroundType = 'noble' | 'rogue' | 'scholar';

interface Character {
  name: string;
  background: BackgroundType;
  motivation: string;
  traits: string[];
}

interface GameEvent {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  impact: string;
}

interface Passage {
  text: string;
  choices: { text: string; nextId: string; impact?: string }[];
}

// --- Data ---

const BACKGROUNDS: Record<BackgroundType, { label: string; icon: any; description: string; traits: string[] }> = {
  noble: {
    label: 'Noble',
    icon: Crown,
    description: 'Born to luxury and power, though perhaps now in exile or seeking to prove your worth.',
    traits: ['Elegance', 'Authority', 'Diplomacy']
  },
  rogue: {
    label: 'Rogue',
    icon: Sword,
    description: 'A survivor from the streets, quick with blades and even quicker with wit.',
    traits: ['Stealth', 'Cunning', 'Observation']
  },
  scholar: {
    label: 'Scholar',
    icon: Scroll,
    description: 'An explorer of ancient texts and forgotten lore, seeking truth in a world of mystery.',
    traits: ['Knowledge', 'Logic', 'Magic Theory']
  }
};

const WORLD_EVENTS: GameEvent[] = [
  {
    id: 'storm',
    title: 'A Sudden Storm',
    description: 'Dark clouds gather with unnatural speed. Lightning tears the sky as a heavy deluge begins.',
    icon: Wind,
    impact: 'Atmospheric and hazardous.'
  },
  {
    id: 'merchant',
    title: 'Traveling Merchant',
    description: 'A colorful carriage stops nearby. A hooded figure offers strange artifacts from the east.',
    icon: ShoppingBag,
    impact: 'Opportunity for trade or information.'
  },
  {
    id: 'messenger',
    title: 'Urgent Messenger',
    description: 'A winded rider collapses near you, clutching a sealed scroll with the Royal seal.',
    icon: AlertCircle,
    impact: 'A sudden quest or warning.'
  }
];

const TextAdventure = () => {
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [character, setCharacter] = useState<Character>({
    name: '',
    background: 'scholar',
    motivation: '',
    traits: BACKGROUNDS.scholar.traits
  });
  const [history, setHistory] = useState<string[]>([]);
  const [currentPassage, setCurrentPassage] = useState<string>('');
  const [choices, setChoices] = useState<{ text: string; nextId: string }[]>([]);
  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentPassage]);

  const startAdventure = () => {
    if (!character.name || !character.motivation) return;
    
    setGameState('playing');
    const intro = `You are ${character.name}, a ${character.background} driven by ${character.motivation}. You stand at the gates of Oakhaven, the city of whispers. The sun is setting, casting long, crimson shadows across the cobblestones.`;
    
    setHistory([intro]);
    generateNextPassage('city_gates');
  };

  const generateNextPassage = (sceneId: string) => {
    // In a real app, this might call an AI or a complex branching logic.
    // For this implementation, we'll simulate narrative branches.
    
    let text = "";
    let nextChoices: { text: string; nextId: string }[] = [];

    if (sceneId === 'city_gates') {
      text = "The guard at the gate eyes you suspiciously. He recognizes your status as a " + character.background + ". 'Business or pleasure?' he grunts.";
      nextChoices = [
        { text: "State your business firmly", nextId: 'tavern' },
        { text: "Slide a coin across the counter", nextId: 'shadows' },
        { text: "Quote an ancient law of passage", nextId: 'scholar_entry' }
      ];
    } else if (sceneId === 'tavern') {
      text = "You find yourself in 'The Rusty Tankard'. The air is thick with smoke and the smell of roasted meat. A group of travelers huddles in the corner, speaking in hushed tones.";
      nextChoices = [
        { text: "Approach the travelers", nextId: 'conversation' },
        { text: "Listen from afar", nextId: 'eavesdrop' }
      ];
    } else if (sceneId === 'shadows') {
      text = "The guard nods and lets you pass. You slip into the alleyways. Here, the city shows its true face. Thieves and poets alike haunt these dark corners.";
      nextChoices = [
        { text: "Seek the local contact", nextId: 'underground' },
        { text: "Head toward the light of the main square", nextId: 'tavern' }
      ];
    } else {
      text = "The journey continues deeper into the heart of Oakhaven. Your background as a " + character.background + " makes you feel " + (character.background === 'noble' ? 'right at home.' : 'on edge.');
      nextChoices = [
        { text: "Rest for the night", nextId: 'tavern' },
        { text: "Push forward", nextId: 'city_gates' }
      ];
    }

    setCurrentPassage(text);
    setChoices(nextChoices);

    // Random Event Check (20% chance)
    if (Math.random() < 0.2) {
      triggerRandomEvent();
    }
  };

  const triggerRandomEvent = () => {
    const event = WORLD_EVENTS[Math.floor(Math.random() * WORLD_EVENTS.length)];
    setActiveEvent(event);
    
    // Add event description to history after a short delay
    setTimeout(() => {
      setHistory(prev => [...prev, `[EVENT: ${event.title}] ${event.description}`]);
    }, 1000);
  };

  const makeChoice = (choiceText: string, nextId: string) => {
    setHistory(prev => [...prev, currentPassage, `> ${choiceText}`]);
    generateNextPassage(nextId);
    setActiveEvent(null);
  };

  const resetGame = () => {
    setGameState('setup');
    setHistory([]);
    setCurrentPassage('');
    setChoices([]);
    setActiveEvent(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AnimatePresence mode="wait">
        {gameState === 'setup' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-900/50 border border-zinc-800 p-8 md:p-12 space-y-10"
          >
            <div className="text-center space-y-4">
              <h2 className="font-display text-4xl text-white italic tracking-tight">Character Creation</h2>
              <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                Define your origin for the chronicles of Oakhaven
              </p>
            </div>

            <div className="space-y-8">
              {/* Name */}
              <div className="space-y-4">
                <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">What is your name?</label>
                <input 
                  type="text"
                  value={character.name}
                  onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                  placeholder="e.g. Alaric of Thorne"
                  className="w-full bg-black/50 border border-zinc-800 p-4 text-white font-display text-2xl italic outline-none focus:border-[#c87941] transition-all"
                />
              </div>

              {/* Backgrounds */}
              <div className="space-y-4">
                <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Select your background</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(BACKGROUNDS).map(([id, bg]) => (
                    <button
                      key={id}
                      onClick={() => setCharacter({ ...character, background: id as BackgroundType, traits: bg.traits })}
                      className={cn(
                        "p-6 border transition-all text-left space-y-4",
                        character.background === id 
                          ? "bg-white text-black border-white shadow-xl scale-[1.02]" 
                          : "bg-black/30 text-zinc-500 border-zinc-800 hover:border-zinc-600"
                      )}
                    >
                      <bg.icon size={24} className={character.background === id ? "text-[#c87941]" : "text-zinc-700"} />
                      <div>
                        <h4 className="font-display text-lg italic">{bg.label}</h4>
                        <p className="text-[10px] leading-relaxed mt-2 opacity-80">{bg.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-2">
                        {bg.traits.map(trait => (
                          <span key={trait} className={cn(
                            "px-1.5 py-0.5 text-[8px] font-mono border rounded uppercase",
                            character.background === id ? "border-black/20 text-black/60" : "border-zinc-800 text-zinc-600"
                          )}>
                            {trait}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Motivation */}
              <div className="space-y-4">
                <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">What drives you to Oakhaven?</label>
                <textarea 
                  value={character.motivation}
                  onChange={(e) => setCharacter({ ...character, motivation: e.target.value })}
                  placeholder="e.g. Seeking my brother who disappeared, or looking for the lost tomb of kings..."
                  className="w-full bg-black/50 border border-zinc-800 p-4 text-white font-mono text-xs italic outline-none focus:border-[#c87941] transition-all min-h-[100px] resize-none"
                />
              </div>

              <button
                onClick={startAdventure}
                disabled={!character.name || !character.motivation}
                className="w-full py-5 bg-[#c87941] text-white font-mono text-xs uppercase tracking-[0.3em] hover:bg-[#b06a38] transition-all disabled:opacity-30 disabled:grayscale"
              >
                Begin Chronicle
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-[700px] bg-zinc-950 border border-zinc-800 relative overflow-hidden"
          >
            {/* Header / HUD */}
            <div className="border-b border-zinc-800 p-4 flex justify-between items-center bg-black/50 relative z-20">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-zinc-900 border border-zinc-800">
                  <User size={14} className="text-[#c87941]" />
                </div>
                <div>
                  <h3 className="font-display text-white italic">{character.name}</h3>
                  <p className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">
                    {character.background} // {character.traits?.join(', ')}
                  </p>
                </div>
              </div>
              <button 
                onClick={resetGame}
                className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                title="Abandon Journey"
              >
                <RefreshCcw size={14} />
              </button>
            </div>

            {/* Narrative Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 scroll-smooth"
            >
              {history.map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "font-mono text-[11px] leading-relaxed",
                    h.startsWith('>') ? "text-[#c87941] ml-4 italic border-l border-[#c87941]/30 pl-4 py-2" : 
                    h.startsWith('[EVENT:') ? "text-cyan-400 bg-cyan-400/5 border border-cyan-400/20 p-4 rounded italic" :
                    "text-zinc-400"
                  )}
                >
                  {h}
                </motion.div>
              ))}

              {/* Current Passage */}
              <div className="space-y-8 pt-4">
                <motion.p 
                  key={currentPassage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  className="font-display text-lg text-white italic leading-relaxed"
                >
                  {currentPassage}
                </motion.p>

                {/* Random Event Alert */}
                <AnimatePresence>
                  {activeEvent && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.05, y: -10 }}
                      className="p-6 bg-cyan-950 border border-cyan-800 flex items-center gap-6"
                    >
                      <div className="p-3 bg-cyan-900 border border-cyan-400">
                        <activeEvent.icon size={20} className="text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest font-bold">World Event: {activeEvent.title}</h4>
                        <p className="text-[10px] text-cyan-200/70 italic mt-1">{activeEvent.description}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Choices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                  {choices.map((choice, i) => (
                    <button
                      key={i}
                      onClick={() => makeChoice(choice.text, choice.nextId)}
                      className="group flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 hover:border-white transition-all text-left"
                    >
                      <span className="font-mono text-[10px] text-zinc-500 group-hover:text-white uppercase tracking-widest">{choice.text}</span>
                      <ChevronRight size={14} className="text-zinc-800 group-hover:text-[#c87941] group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ambient Vignette */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-10" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Narrative Stats / Meta */}
      {gameState === 'playing' && (
        <div className="grid grid-cols-3 gap-8">
          {[
            { label: 'Narrative Depth', value: 'Level 1', icon: Compass },
            { label: 'Chronicle Words', value: history.length * 12, icon: MessageSquare },
            { label: 'World Entropy', value: 'Low', icon: Zap }
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800 p-4 flex items-center gap-4">
              <stat.icon size={12} className="text-zinc-700" />
              <div>
                <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">{stat.label}</p>
                <p className="font-mono text-[10px] text-zinc-400">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TextAdventure;
