import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  UserCircle, 
  Sparkles, 
  Save, 
  Trash2, 
  RefreshCcw, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Plus, 
  X,
  Palette,
  Briefcase,
  History,
  Eye,
  Shirt,
  Watch,
  UserPlus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db, auth } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

// --- Constants ---

const CHARACTER_OPTIONS = {
  appearance: {
    gender: ['Male', 'Female', 'Non-binary', 'Androgynous', 'Abstract'],
    age: ['Child', 'Teenager', 'Young Adult', 'Middle Aged', 'Elderly', 'Ageless'],
    ethnicity: ['Caucasian', 'African', 'East Asian', 'South Asian', 'Hispanic', 'Middle Eastern', 'Mixed', 'Fantastical'],
    eyeColor: ['Blue', 'Green', 'Brown', 'Hazel', 'Grey', 'Amber', 'Glowing Red', 'Violet'],
    hairStyle: ['Short Cropped', 'Buzz Cut', 'Long Flowing', 'Ponytail', 'Braids', 'Dreadlocks', 'Afro', 'Bald', 'Mohawk', 'Messy'],
    hairColor: ['Blonde', 'Brunette', 'Black', 'Red', 'Silver', 'White', 'Pink', 'Blue', 'Neon Green', 'Multi-colored'],
    build: ['Slim', 'Athletic', 'Muscular', 'Stocky', 'Large', 'Lanky']
  },
  wardrobe: {
    style: ['Cyberpunk', 'Steampunk', 'Minimalist', 'Streetwear', 'Avant-Garde', 'Noir', 'Fantasy', 'High-Fashion', 'Tactical'],
    top: ['Oversized Hoodie', 'Leather Jacket', 'Slim-fit Shirt', 'Techwear Vest', 'Victorian Corset', 'Oversized Trench Coat'],
    bottom: ['Cargo Pants', 'Distressed Denim', 'Tailored Trousers', 'Pleated Skirt', 'Leather Leggings'],
    footwear: ['High-top Sneakers', 'Combat Boots', 'Stiletto Heels', 'Loafers', 'Bio-mechanical Boots']
  },
  accessories: [
    'VR Headset', 'Cybernetic Eye', 'Golden Jewelry', 'Tattoos', 'Face Scars', 
    'Neon Decals', 'Round Glasses', 'Gas Mask', 'Cape', 'Bionic Arm', 'Piercings'
  ]
};

interface CharacterProfile {
  id?: string;
  userId: string;
  name: string;
  appearance: {
    gender: string;
    age: string;
    ethnicity: string;
    eyeColor: string;
    hairStyle: string;
    hairColor: string;
    facialHair: string;
    build: string;
  };
  wardrobe: {
    style: string;
    top: string;
    bottom: string;
    footwear: string;
  };
  accessories: string[];
  personality: string;
  fullPrompt: string;
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
}

const CharacterCreator = () => {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [savedCharacters, setSavedCharacters] = useState<CharacterProfile[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New Character State
  const [charName, setCharName] = useState("New Pilot");
  const [appearance, setAppearance] = useState({
    gender: 'Non-binary',
    age: 'Young Adult',
    ethnicity: 'Mixed',
    eyeColor: 'Grey',
    hairStyle: 'Messy',
    hairColor: 'Silver',
    facialHair: 'None',
    build: 'Athletic'
  });
  const [wardrobe, setWardrobe] = useState({
    style: 'Cyberpunk',
    top: 'Techwear Vest',
    bottom: 'Cargo Pants',
    footwear: 'High-top Sneakers'
  });
  const [accessories, setAccessories] = useState<string[]>([]);
  const [personality, setPersonality] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => setCurrentUser(user));
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setSavedCharacters([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, "characters"),
      where("userId", "==", currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const chars = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CharacterProfile));
      setSavedCharacters(chars);
      setIsLoading(false);
    });

    return unsub;
  }, [currentUser]);

  const generatePrompt = () => {
    const accessText = accessories.length > 0 ? ` wearing ${accessories.join(', ')}` : "";
    return `Professional cinematic character portrait of ${charName}, a ${appearance.age} ${appearance.ethnicity} ${appearance.gender}. ${appearance.build} build, ${appearance.eyeColor} eyes, ${appearance.hairStyle} ${appearance.hairColor} hair. Dressed in ${wardrobe.style} style ${wardrobe.top} and ${wardrobe.bottom} with ${wardrobe.footwear}${accessText}. Personality: ${personality || 'Confident and sharp'}. 8k resolution, highly detailed, photorealistic, dramatic lighting.`;
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const data = {
        userId: currentUser.uid,
        name: charName,
        appearance,
        wardrobe,
        accessories,
        personality,
        fullPrompt: generatePrompt(),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "characters", editingId), data);
      } else {
        await addDoc(collection(db, "characters"), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      
      // Feedback or reset
      if (!editingId) resetCreator();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this character?")) return;
    try {
      await deleteDoc(doc(db, "characters", id));
      if (editingId === id) resetCreator();
    } catch (e) {
      console.error(e);
    }
  };

  const loadCharacter = (char: CharacterProfile) => {
    setEditingId(char.id || null);
    setCharName(char.name);
    setAppearance(char.appearance);
    setWardrobe(char.wardrobe);
    setAccessories(char.accessories);
    setPersonality(char.personality);
    setActiveStep(0);
  };

  const resetCreator = () => {
    setEditingId(null);
    setCharName("New Pilot");
    setAppearance({
      gender: 'Non-binary',
      age: 'Young Adult',
      ethnicity: 'Mixed',
      eyeColor: 'Grey',
      hairStyle: 'Messy',
      hairColor: 'Silver',
      facialHair: 'None',
      build: 'Athletic'
    });
    setWardrobe({
      style: 'Cyberpunk',
      top: 'Techwear Vest',
      bottom: 'Cargo Pants',
      footwear: 'High-top Sneakers'
    });
    setAccessories([]);
    setPersonality("");
    setActiveStep(0);
  };

  const steps = [
    { id: 'basics', label: 'Identity', icon: User },
    { id: 'appearance', label: 'Anatomy', icon: Palette },
    { id: 'wardrobe', label: 'Uniform', icon: Shirt },
    { id: 'accessories', label: 'Gear', icon: Watch },
    { id: 'personality', label: 'Essence', icon: Sparkles }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sidebar: Library */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[10px] text-white uppercase tracking-widest flex items-center gap-2">
              <History size={12} />
              Library
            </h3>
            <button onClick={resetCreator} className="text-zinc-500 hover:text-white transition-all">
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-3 h-[400px] overflow-y-auto pr-2 scrollbar-hide">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <RefreshCcw size={16} className="animate-spin text-zinc-700" />
              </div>
            ) : savedCharacters.length === 0 ? (
              <p className="text-[10px] text-zinc-600 italic">No pilots saved yet.</p>
            ) : (
              savedCharacters.map(char => (
                <button
                  key={char.id}
                  onClick={() => loadCharacter(char)}
                  className={cn(
                    "w-full text-left p-3 border transition-all group relative",
                    editingId === char.id 
                      ? "bg-white border-white text-black" 
                      : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-700"
                  )}
                >
                  <div className="font-display italic text-sm">{char.name}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest mt-1 opacity-60">
                    {char.appearance.age} • {char.wardrobe.style}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (char.id) handleDelete(char.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 p-2 hover:bg-red-500/10 rounded transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#c87941]/5 border border-[#c87941]/20 p-6 space-y-3">
          <h4 className="font-mono text-[9px] text-[#c87941] uppercase tracking-widest">Creator Insight</h4>
          <p className="text-[10px] text-zinc-400 leading-relaxed italic">
            "Characters are the DNA of the narrative. Specify constraints to ensure generational stability across shots."
          </p>
        </div>
      </div>

      {/* Main Creator Area */}
      <div className="lg:col-span-9 space-y-8">
        {/* Navigation Steps */}
        <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(i)}
              className={cn(
                "flex items-center gap-3 px-6 py-4 border transition-all whitespace-nowrap min-w-[140px]",
                activeStep === i 
                  ? "bg-white text-black border-white shadow-xl" 
                  : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-600"
              )}
            >
              <step.icon size={14} />
              <span className="font-mono text-[10px] uppercase tracking-widest">{step.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="bg-zinc-900/50 border border-zinc-800 p-8 md:p-10 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {activeStep === 0 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Name / Code Identifier</label>
                      <input 
                        type="text"
                        value={charName}
                        onChange={(e) => setCharName(e.target.value)}
                        className="w-full bg-black/50 border border-zinc-800 p-4 text-white font-display text-2xl italic focus:border-white focus:outline-none transition-all"
                        placeholder="e.g. Captain Vora"
                      />
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="space-y-8">
                    {Object.entries(CHARACTER_OPTIONS.appearance).map(([key, options]) => (
                      <div key={key} className="space-y-3">
                        <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">{key}</label>
                        <div className="flex flex-wrap gap-2">
                          {options.map(opt => (
                            <button
                              key={opt}
                              onClick={() => setAppearance(prev => ({ ...prev, [key]: opt }))}
                              className={cn(
                                "px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border transition-all",
                                appearance[key as keyof typeof appearance] === opt
                                  ? "bg-white text-black border-white"
                                  : "bg-black/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-8">
                    {Object.entries(CHARACTER_OPTIONS.wardrobe).map(([key, options]) => (
                      <div key={key} className="space-y-3">
                        <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">{key}</label>
                        <div className="flex flex-wrap gap-2">
                          {options.map(opt => (
                            <button
                              key={opt}
                              onClick={() => setWardrobe(prev => ({ ...prev, [key]: opt }))}
                              className={cn(
                                "px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border transition-all",
                                wardrobe[key as keyof typeof wardrobe] === opt
                                  ? "bg-white text-black border-white"
                                  : "bg-black/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-4">
                    <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Accessories / Cybernetics</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {CHARACTER_OPTIONS.accessories.map(item => (
                        <button
                          key={item}
                          onClick={() => setAccessories(prev => 
                            prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
                          )}
                          className={cn(
                            "p-3 font-mono text-[9px] uppercase tracking-widest border transition-all text-left",
                            accessories.includes(item)
                              ? "bg-white text-black border-white shadow-lg"
                              : "bg-black/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeStep === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Archetype / Role / Personality</label>
                      <textarea 
                        value={personality}
                        onChange={(e) => setPersonality(e.target.value)}
                        className="w-full bg-black/50 border border-zinc-800 p-4 text-white font-display text-lg italic focus:border-white focus:outline-none transition-all min-h-[120px] resize-none"
                        placeholder="e.g. A weary war veteran who has seen too much. Stoic, precise, but with a hidden warmth."
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="pt-8 border-t border-zinc-800 flex justify-between items-center">
              <button
                disabled={activeStep === 0}
                onClick={() => setActiveStep(prev => prev - 1)}
                className="p-3 border border-zinc-800 text-zinc-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex gap-2">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1 h-1 rounded-full",
                      activeStep === i ? "bg-white w-4 transition-all" : "bg-zinc-800"
                    )} 
                  />
                ))}
              </div>

              {activeStep < steps.length - 1 ? (
                <button
                  onClick={() => setActiveStep(prev => prev + 1)}
                  className="p-3 border border-zinc-800 text-zinc-600 hover:text-white transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={isSaving || !currentUser}
                  className="flex items-center gap-2 px-8 py-3 bg-[#c87941] text-white font-mono text-[10px] uppercase tracking-widest hover:bg-[#b06a38] transition-all shadow-lg disabled:opacity-50"
                >
                  {isSaving ? <RefreshCcw size={12} className="animate-spin" /> : <Save size={12} />}
                  {editingId ? "Update Profile" : "Initialize Profile"}
                </button>
              )}
            </div>
          </div>

          {/* Visual DNA / Prompt Preview */}
          <div className="space-y-6">
            <div className="relative aspect-[3/4] bg-zinc-950 border border-zinc-800 overflow-hidden flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="absolute top-4 left-4 font-mono text-[9px] text-zinc-700 uppercase tracking-widest">Physical DNA</div>
              <div className="absolute bottom-4 right-4 font-mono text-[9px] text-zinc-700 uppercase tracking-widest">Model V1.0</div>
              
              <UserCircle size={80} className="text-zinc-900 mb-4" />
              <div className="space-y-1">
                <h2 className="font-display text-3xl text-white italic">{charName}</h2>
                <p className="font-mono text-[10px] text-[#c87941] uppercase tracking-widest">
                  {appearance.age} {appearance.ethnicity} {appearance.gender}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full mt-8 opacity-60">
                <div className="p-3 border border-zinc-900 bg-zinc-900/20 text-left">
                  <div className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Build</div>
                  <div className="font-mono text-[9px] text-zinc-400 mt-1 uppercase">{appearance.build}</div>
                </div>
                <div className="p-3 border border-zinc-900 bg-zinc-900/20 text-left">
                  <div className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Style</div>
                  <div className="font-mono text-[9px] text-zinc-400 mt-1 uppercase">{wardrobe.style}</div>
                </div>
              </div>

              {accessories.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mt-4">
                  {accessories.map(a => (
                    <span key={a} className="px-2 py-0.5 bg-zinc-900 text-[8px] font-mono text-zinc-500 uppercase rounded border border-zinc-800">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-black/50 border border-zinc-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Generated Character Prompt</h4>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatePrompt());
                    // alert("Copied to clipboard!");
                  }}
                  className="text-zinc-600 hover:text-white transition-all p-1"
                >
                  <Plus size={12} />
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-mono italic">
                "{generatePrompt()}"
              </p>
            </div>
            
            {!currentUser && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-3">
                <X size={16} className="text-red-500" />
                <p className="text-[10px] text-red-500 font-mono uppercase tracking-widest">Sign in to save character DNA</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;
