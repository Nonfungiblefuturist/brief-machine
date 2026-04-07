import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Save, ChevronDown, ChevronUp, Star, Zap, Search, Layout, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  INFRASTRUCTURE_TARGETS, 
  CONCEPT_FRAMEWORKS, 
  CAMERA_RIG, 
  MOODS, 
  KAVAN_METHODS, 
  assemblePrompt 
} from '../lib/promptEngineData';

type SavedPrompt = {
  id: string;
  timestamp: number;
  prompt: string;
  workflow: string;
  platform: string;
  label: string;
};

export default function PromptEngine() {
  const [activeTab, setActiveTab] = useState<"build" | "methods" | "concepts" | "saved">("build");
  
  // Build Tab State
  const [infra, setInfra] = useState<string>("");
  const [concept, setConcept] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [hookText, setHookText] = useState<string>("");
  const [mood, setMood] = useState<string>("");
  const [camBody, setCamBody] = useState<string>("");
  const [camLens, setCamLens] = useState<string>("");
  const [camMove, setCamMove] = useState<string>("");
  const [camGrade, setCamGrade] = useState<string>("");
  const [camMeta, setCamMeta] = useState<string>("");
  const [extra, setExtra] = useState<string>("");
  
  const [clickToAdFields, setClickToAdFields] = useState({
    productUrl: "",
    brandIntent: "",
    visualAnchors: "",
    targetPlatform: "IG Reels"
  });
  
  const [isCameraExpanded, setIsCameraExpanded] = useState(false);
  const [output, setOutput] = useState<{ prompt: string; workflow: string; platform: string; label: string } | null>(null);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-prompt-engine-saved');
    if (saved) {
      try {
        setSavedPrompts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved prompts", e);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  const handleBuild = () => {
    if (!infra || !subject) return;
    const result = assemblePrompt({
      infra,
      subject,
      hookText,
      mood,
      cam: { body: camBody, lens: camLens, move: camMove, grade: camGrade, meta: camMeta },
      extra,
      clickToAdFields
    });
    setOutput(result);
  };

  const handleSave = () => {
    if (!output) return;
    const newSaved: SavedPrompt = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...output
    };
    const updated = [newSaved, ...savedPrompts].slice(0, 25);
    setSavedPrompts(updated);
    localStorage.setItem('ai-prompt-engine-saved', JSON.stringify(updated));
    showToast("Prompt saved");
  };

  const Pill = ({ active, onClick, children, color = "#FF3366" }: any) => (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all border",
        active 
          ? `bg-opacity-15 border-opacity-40 text-zinc-100` 
          : "bg-zinc-800/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300"
      )}
      style={active ? { backgroundColor: `${color}26`, borderColor: `${color}66`, color: '#fff' } : {}}
    >
      {children}
    </button>
  );

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[10px] font-mono uppercase tracking-[2px] text-zinc-500 mb-3">
      {children}
    </div>
  );

  return (
    <div className="w-full font-sans selection:bg-zinc-800/50">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 backdrop-blur-md border border-zinc-800 px-4 py-2 rounded-full text-sm font-mono z-50 text-zinc-200"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-zinc-800 pb-4">
          {[
            { id: "build", label: "Build" },
            { id: "methods", label: "Kavan Methods" },
            { id: "concepts", label: "Concept Bank" },
            { id: "saved", label: "Saved" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-md transition-colors",
                activeTab === tab.id ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "build" && (
              <div className="space-y-8">
                {/* 1. Target Infrastructure */}
                <section>
                  <SectionLabel>1. Target Infrastructure</SectionLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {INFRASTRUCTURE_TARGETS.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setInfra(t.id)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all flex flex-col gap-1",
                          infra === t.id 
                            ? "bg-zinc-800/50 border-zinc-700" 
                            : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50"
                        )}
                        style={infra === t.id ? { borderColor: t.color } : {}}
                      >
                        <span className="text-[10px] font-mono uppercase" style={{ color: t.color }}>{t.platform}</span>
                        <span className="text-sm font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {infra === "click_to_ad" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mt-4"
                      >
                        <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-lg space-y-6">
                          <div className="flex items-center gap-2">
                            <Zap size={14} className="text-[#FF3366]" />
                            <span className="font-mono text-[10px] text-[#FF3366] uppercase tracking-widest">Click-to-Ad Configuration</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <label className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Product URL</label>
                              <input 
                                type="text"
                                value={clickToAdFields.productUrl}
                                onChange={(e) => setClickToAdFields({...clickToAdFields, productUrl: e.target.value})}
                                placeholder="https://brand.com/product"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 outline-none focus:border-[#FF3366]/50 transition-colors placeholder:text-zinc-600"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Target Platform</label>
                              <div className="grid grid-cols-2 gap-2">
                                {["IG Reels", "TikTok", "YouTube Shorts", "Meta Feed"].map(p => (
                                  <button
                                    key={p}
                                    onClick={() => setClickToAdFields({...clickToAdFields, targetPlatform: p})}
                                    className={cn(
                                      "px-3 py-2 rounded-lg font-mono text-[9px] uppercase tracking-widest border transition-all",
                                      clickToAdFields.targetPlatform === p
                                        ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/50"
                                        : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                                    )}
                                  >
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Brand Intent Summary</label>
                            <textarea 
                              value={clickToAdFields.brandIntent}
                              onChange={(e) => setClickToAdFields({...clickToAdFields, brandIntent: e.target.value})}
                              placeholder="What is the primary goal of this ad? (e.g. Drive sales for new winter collection)"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 outline-none focus:border-[#FF3366]/50 transition-colors placeholder:text-zinc-600 min-h-[80px] resize-none"
                            />
                          </div>

                          <div className="space-y-3">
                            <label className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Visual Anchors</label>
                            <textarea 
                              value={clickToAdFields.visualAnchors}
                              onChange={(e) => setClickToAdFields({...clickToAdFields, visualAnchors: e.target.value})}
                              placeholder="Key visual elements to maintain (e.g. Logo placement, specific product color)"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 outline-none focus:border-[#FF3366]/50 transition-colors placeholder:text-zinc-600 min-h-[80px] resize-none"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* 2. Concept Framework */}
                <section>
                  <SectionLabel>2. Concept Framework</SectionLabel>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {CONCEPT_FRAMEWORKS.map(f => (
                      <div key={f.id} className="flex flex-col gap-2">
                        <button
                          onClick={() => setConcept(concept === f.id ? "" : f.id)}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all flex items-start gap-3",
                            concept === f.id 
                              ? "bg-zinc-800 border-zinc-700" 
                              : "bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50"
                          )}
                        >
                          <span className="text-xl">{f.icon}</span>
                          <div>
                            <div className="text-sm font-medium">{f.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{f.desc}</div>
                          </div>
                        </button>
                        
                        {/* Expanded Prompts */}
                        <AnimatePresence>
                          {concept === f.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg flex flex-col gap-2">
                                {f.prompts.map((p, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setHookText(p)}
                                    className="text-left text-xs text-zinc-300 hover:text-zinc-100 p-2 hover:bg-zinc-800/50 rounded transition-colors flex gap-2"
                                  >
                                    <span className="text-zinc-500 font-mono">{i+1}.</span>
                                    <span>{p}</span>
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3 & 4. Subject & Hook */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section>
                    <SectionLabel>3. Subject / Product / Character</SectionLabel>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. A neon hologram of a cat driving at top speed"
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-[#FF3366]/50 transition-colors placeholder:text-zinc-500"
                    />
                  </section>
                  <section>
                    <SectionLabel>4. Hook / Bait / Concept Override</SectionLabel>
                    <textarea
                      value={hookText}
                      onChange={(e) => setHookText(e.target.value)}
                      placeholder="Select a concept framework above or type manually..."
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-[#FF3366]/50 transition-colors placeholder:text-zinc-500 min-h-[80px] resize-y"
                    />
                  </section>
                </div>

                {/* 5. Mood */}
                <section>
                  <SectionLabel>5. Mood / Genre</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map(m => (
                      <Pill key={m} active={mood === m} onClick={() => setMood(mood === m ? "" : m)} color="#8B5CF6">
                        {m}
                      </Pill>
                    ))}
                  </div>
                </section>

                {/* 6. Camera Rig */}
                <section className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setIsCameraExpanded(!isCameraExpanded)}
                    className="w-full p-4 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
                  >
                    <SectionLabel>6. Camera Rig + Meta Tokens (Optional)</SectionLabel>
                    {isCameraExpanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                  </button>
                  
                  <AnimatePresence>
                    {isCameraExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-4 border-t border-zinc-800">
                          <div>
                            <div className="text-[10px] text-zinc-500 mb-2 font-mono">BODY</div>
                            <div className="flex flex-wrap gap-2">
                              {CAMERA_RIG.bodies.map(b => <Pill key={b} active={camBody === b} onClick={() => setCamBody(camBody === b ? "" : b)} color="#22d3ee">{b}</Pill>)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-zinc-500 mb-2 font-mono">LENS</div>
                            <div className="flex flex-wrap gap-2">
                              {CAMERA_RIG.lenses.map(l => <Pill key={l} active={camLens === l} onClick={() => setCamLens(camLens === l ? "" : l)} color="#22d3ee">{l}</Pill>)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-zinc-500 mb-2 font-mono">MOVE</div>
                            <div className="flex flex-wrap gap-2">
                              {CAMERA_RIG.moves.map(m => <Pill key={m} active={camMove === m} onClick={() => setCamMove(camMove === m ? "" : m)} color="#22d3ee">{m}</Pill>)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-zinc-500 mb-2 font-mono">GRADE</div>
                            <div className="flex flex-wrap gap-2">
                              {CAMERA_RIG.grades.map(g => <Pill key={g} active={camGrade === g} onClick={() => setCamGrade(camGrade === g ? "" : g)} color="#22d3ee">{g}</Pill>)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-zinc-500 mb-2 font-mono">META TOKEN</div>
                            <div className="flex flex-wrap gap-2">
                              {CAMERA_RIG.meta.map(m => <Pill key={m} active={camMeta === m} onClick={() => setCamMeta(camMeta === m ? "" : m)} color="#f472b6">{m}</Pill>)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </section>

                {/* 7. Extra Notes */}
                <section>
                  <SectionLabel>7. Extra Notes</SectionLabel>
                  <input
                    type="text"
                    value={extra}
                    onChange={(e) => setExtra(e.target.value)}
                    placeholder="Constraints, dialogue, actions..."
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:border-[#FF3366]/50 transition-colors placeholder:text-zinc-500"
                  />
                </section>

                {/* Build Button */}
                <button
                  onClick={handleBuild}
                  disabled={!infra || !subject}
                  className="w-full py-4 rounded-lg font-mono uppercase tracking-widest text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                >
                  Build Prompt →
                </button>

                {/* Output */}
                {output && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className="px-2 py-1 rounded text-[10px] font-mono uppercase bg-zinc-800">{output.platform}</span>
                        <span className="px-2 py-1 rounded text-[10px] font-mono uppercase bg-zinc-800/50 text-zinc-400">{output.label}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSave} className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors" title="Save">
                          <Save size={16} />
                        </button>
                        <button onClick={() => handleCopy(output.prompt)} className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors" title="Copy Prompt">
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm leading-[1.65] text-zinc-200">
                      {output.prompt}
                    </div>

                    <div className="p-4 rounded-lg bg-gradient-to-r from-[#FF3366]/10 to-[#FF3366]/5 border border-[#FF3366]/20 text-xs text-zinc-300 leading-relaxed font-mono">
                      <div className="text-[10px] text-[#FF3366]/50 mb-2 uppercase tracking-widest">Workflow Instructions</div>
                      {output.workflow}
                    </div>

                    <button
                      onClick={() => setOutput(null)}
                      className="w-full py-3 rounded-lg font-mono uppercase tracking-widest text-xs transition-all bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 flex items-center justify-center gap-2"
                    >
                      <span>↻</span> Rebuild
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === "methods" && (
              <div className="space-y-6">
                <p className="text-sm text-zinc-400 leading-relaxed max-w-3xl">
                  Production methodology from Kavan the Kid — sold Chronicles of Bone (5 seasons) to Freepik as an Original Series. First SAG-approved AI film (Echo Hunter). Solo creator, every frame.
                </p>
                
                <div className="space-y-3">
                  {Object.entries(KAVAN_METHODS).map(([key, method]) => (
                    <div key={key} className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedMethod(expandedMethod === key ? null : key)}
                        className="w-full p-4 text-left hover:bg-zinc-900/50 transition-colors flex items-start justify-between gap-4"
                      >
                        <div>
                          <h3 className="font-['Space_Grotesk'] font-bold text-sm text-zinc-200">{method.name}</h3>
                          <p className="text-[11px] text-zinc-500 mt-1">{method.why}</p>
                        </div>
                        <div className="mt-1">
                          {expandedMethod === key ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {expandedMethod === key && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-0 border-t border-zinc-800">
                              <ol className="space-y-2 mt-3">
                                {method.steps.map((step, i) => (
                                  <li key={i} className="text-xs text-zinc-300 flex gap-3">
                                    <span className="text-zinc-500 font-mono">{i+1}.</span>
                                    <span className="leading-relaxed">{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 rounded-lg bg-gradient-to-br from-[#FF3366]/10 via-[#FFB800]/10 to-[#1273EB]/10 border border-zinc-800">
                  <p className="text-sm text-zinc-200 leading-relaxed italic">
                    "Kavan didn't sell a video. He sold a universe — 5 seasons written, story bibles built, character IP grounded in physical photographs for copyright protection. The Freepik deal happened because the package was COMPLETE. Build the world first, generate frames second."
                  </p>
                </div>
              </div>
            )}

            {activeTab === "concepts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CONCEPT_FRAMEWORKS.map(f => (
                  <div key={f.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{f.icon}</span>
                      <div>
                        <h3 className="font-medium text-sm text-zinc-200">{f.name}</h3>
                        <p className="text-[10px] text-zinc-500">{f.desc}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 flex-1">
                      {f.prompts.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => handleCopy(p)}
                          className="w-full text-left text-xs text-zinc-300 hover:text-zinc-100 p-2 hover:bg-zinc-800/50 rounded transition-colors flex gap-2 group"
                        >
                          <span className="text-zinc-500 font-mono group-hover:text-[#FFB800] transition-colors">{i+1}.</span>
                          <span className="leading-relaxed">{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "saved" && (
              <div className="space-y-4">
                {savedPrompts.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-sm font-mono">
                    No saved prompts. Build and save from the Build tab.
                  </div>
                ) : (
                  savedPrompts.map(p => (
                    <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex gap-2 items-center">
                          <span className="px-2 py-1 rounded text-[10px] font-mono uppercase bg-zinc-800">{p.platform}</span>
                          <span className="px-2 py-1 rounded text-[10px] font-mono uppercase bg-zinc-800/50 text-zinc-400">{p.label}</span>
                          <span className="text-[10px] text-zinc-500 font-mono ml-2">
                            {new Date(p.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <button onClick={() => handleCopy(p.prompt)} className="p-2 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors">
                          <Copy size={14} />
                        </button>
                      </div>
                      <div className="text-sm text-zinc-300 leading-relaxed mb-3">
                        {p.prompt}
                      </div>
                      <div className="text-[10px] text-[#FF3366]/60 font-mono leading-relaxed bg-[#FF3366]/5 p-2 rounded border border-[#FF3366]/10">
                        {p.workflow}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-zinc-800/50 text-center">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Intelligence: Kavan the Kid (AI Cinema) · Higgsfield · Freepik · Dor Brothers · 2026 Viral Research
          </div>
        </footer>
      </div>
    </div>
  );
}
