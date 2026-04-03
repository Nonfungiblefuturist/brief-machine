import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Minus, 
  ArrowRight, 
  Zap, 
  ShieldAlert, 
  Target, 
  Lightbulb, 
  RefreshCcw, 
  Copy, 
  Check,
  ChevronRight,
  Sparkles,
  Search,
  Code
} from "lucide-react";
import { cn } from "@/src/lib/utils";

// --- Prompts ---

const MASTER_PROMPT = `You are an elite creative strategist who thinks at D&AD Black Pencil / Young Ones / Cannes Grand Prix level. You generate advertising concepts that win because of the IDEA — not the budget, not the production, not the celebrity. The idea is the weapon.

YOUR CREATIVE PHILOSOPHY:
- The best ads solve a TENSION, not a brief
- Great concepts are simple enough to sketch on a napkin
- If it needs explanation, it's not good enough
- Every concept must have a "why didn't I think of that" quality
- Insight > Execution. Always.
- Cultural relevance is not trend-chasing. It's finding the nerve.

WHEN GENERATING CONCEPTS, FOLLOW THIS ARCHITECTURE:

1. TENSION MINING
- What's the cultural contradiction this brand sits inside?
- What does the audience FEEL but never say out loud?
- What's the elephant in the room for this category?
- Find the friction. The concept lives there.

2. INSIGHT EXTRACTION
- One sentence. Human truth. Not a data point.
- It should make someone say "that's so true" before they even see the ad.
- Format: "People [verb] [unexpected truth] because [deeper reason]"

3. CONCEPT GENERATION (generate 3 concepts per brief, ranked by boldness)

For each concept provide:
- CONCEPT NAME: A punchy 2-4 word title
- THE IDEA IN ONE LINE: If you can't say it in one sentence, kill it
- FORMAT: What medium/format does this idea DEMAND? (Don't default to :30 film. Think installations, stunts, hacks, print, social mechanics, UX interventions, packaging, ambient, data-driven, AI-powered, experiential)
- THE EXECUTION: 3-4 sentences max. What does the audience SEE/EXPERIENCE?
- WHY IT WORKS: The strategic logic. Connect insight to impact.
- REFERENCE ENERGY: Name 1-2 real award-winning campaigns this shares DNA with. Explain WHY they were effective in tapping into similar cultural tensions or strategic mechanics.
- RISK LEVEL: safe, brave, or dangerous.
- RISK REASON: Provide a detailed explanation of the potential negative implications, brand safety concerns, or execution challenges associated with this specific idea. Avoid generic statements.
- PRODUCIBILITY: Can this be made with AI tools + minimal budget? How?

4. CULTURAL HOOKS (based on current 2025-2026 landscape)
Tag each concept with 2-3 specific and niche cultural currents that are highly relevant to the idea, in addition to broader ones. For each hook, provide a brief (1-2 sentence) justification for its inclusion, explaining how the concept resonates with that specific cultural undercurrent.

RULES:
- Never generate safe, obvious, or expected ideas
- Never default to "emotional storytelling" as a concept — that's a TECHNIQUE, not an IDEA
- Never suggest ideas that only work with massive celebrity or massive budget
- Prefer ideas with MECHANIC over ideas with MESSAGE (something that DOES something > something that SAYS something)
- Every concept must be producible — even if provocative
- Think transmedia: best ideas live across formats
- If the concept could be from any brand, it's not good enough. It must be OWNABLE.

SURREAL AI MODE ADDENDUM:
If the user requests Surreal AI mode, focus exclusively on concepts that are visually impossible to capture with traditional photography or film. Think:
- Impossible physics
- Surreal biological mashups
- Dream-logic environments
- Hyper-imaginative scenarios that DEMAND AI image/video generation (Midjourney, Sora, Kling, etc.) for their visual execution.
The idea must still be strategically grounded, but the execution must be "AI-native surrealism".`;

const REFINE_PROMPT = `You are an elite creative strategist. You are refining an existing advertising concept based on specific user feedback. 

Maintain the core strategic insight and the brand's essence, but iterate on the execution, format, or risk level as requested.

ORIGINAL CONCEPT:
{original_concept}

USER FEEDBACK:
{user_feedback}

Provide the refined concept in the same JSON format as the original.`;

const TREND_PROMPT = `You are a cultural intelligence analyst. Scan for the most potent cultural tensions, trends, and undercurrents shaping advertising in 2025-2026. Focus on what's USEFUL for generating ad concepts — not just what's trending.

For each trend, provide:
- The trend/tension name
- Why it matters for brands RIGHT NOW  
- The emotional undercurrent (what people FEEL about this)
- A "brief starter" — a provocative question a brand could build a campaign around
- A "viral_concept" — A specific, high-impact idea for a video or stunt that leverages this trend. It should be designed for shareability.
- A "video_hook" — A 3-second hook for social media (TikTok/Reels) to grab attention immediately.
- A "ai_execution_methods" — Detail specific AI-driven methods (e.g., using specific tools like Midjourney, Runway, ElevenLabs) to execute the viral concept and video hook on a minimal budget.`;

// --- Types ---

interface Concept {
  name: string;
  idea: string;
  format: string;
  execution: string;
  why_it_works: string;
  reference_energy: string;
  risk_level: 'safe' | 'brave' | 'dangerous';
  risk_reason: string;
  producibility: string;
  cultural_hooks: {
    hook: string;
    justification: string;
  }[];
  visual_url?: string;
}

interface Results {
  brand: string;
  category: string;
  tension: string;
  insight: string;
  concepts: Concept[];
}

interface Trend {
  name: string;
  why_it_matters: string;
  emotional_undercurrent: string;
  brief_starter: string;
  viral_concept: string;
  video_hook: string;
  ai_execution_methods: string;
}

// --- Components ---

const DetailBlock = ({ label, value, className }: { label: string; value: string; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">{label}</span>
    <p className="text-sm text-zinc-300 leading-relaxed">{value}</p>
  </div>
);

const RiskBadge = ({ level }: { level: 'safe' | 'brave' | 'dangerous' }) => {
  const config = {
    safe: { emoji: "🟢", label: "SAFE", color: "text-green-500" },
    brave: { emoji: "🟡", label: "BRAVE", color: "text-yellow-500" },
    dangerous: { emoji: "🔴", label: "DANGEROUS", color: "text-red-500" },
  };
  const { emoji, label, color } = config[level] || config.brave;
  return (
    <span className={cn("font-mono text-[10px] tracking-widest flex items-center gap-1.5", color)}>
      {emoji} {label}
    </span>
  );
};

export default function App() {
  const [view, setView] = useState<"input" | "loading" | "results" | "trends" | "prompt">("input");
  const [mode, setMode] = useState<"standard" | "surreal">("standard");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [constraint, setConstraint] = useState("");
  const [results, setResults] = useState<Results | null>(null);
  const [trends, setTrends] = useState<Trend[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [expandedConcept, setExpandedConcept] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  const loadingMessages = [
    "Mining cultural tensions...",
    "Killing safe ideas...",
    "Finding the nerve...",
    "Stress-testing concepts...",
    "Checking producibility...",
    "Rating risk levels...",
    "Sharpening the edge...",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === "loading") {
      let i = 0;
      setLoadingMsg(loadingMessages[0]);
      interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMsg(loadingMessages[i]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [view]);

  const generateConcepts = async () => {
    if (!brand.trim()) return;
    setError(null);
    setView("loading");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Generate 3 award-caliber ad concepts for:
BRAND: ${brand}
CATEGORY: ${category || "Not specified"}
OBJECTIVE: ${objective || "Brand fame / cultural relevance"}
TARGET AUDIENCE: ${audience || "Culturally engaged 18-35"}
CONSTRAINTS/CONTEXT: ${constraint || "None"}
MODE: ${mode === "surreal" ? "SURREAL AI (Impossible Scenarios)" : "STANDARD STRATEGY"}

Think D&AD. Think Cannes.`,
        config: {
          systemInstruction: MASTER_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brand: { type: Type.STRING },
              category: { type: Type.STRING },
              tension: { type: Type.STRING },
              insight: { type: Type.STRING },
              concepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    idea: { type: Type.STRING },
                    format: { type: Type.STRING },
                    execution: { type: Type.STRING },
                    why_it_works: { type: Type.STRING },
                    reference_energy: { type: Type.STRING },
                    risk_level: { type: Type.STRING, enum: ["safe", "brave", "dangerous"] },
                    risk_reason: { type: Type.STRING },
                    producibility: { type: Type.STRING },
                    cultural_hooks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          hook: { type: Type.STRING },
                          justification: { type: Type.STRING }
                        },
                        required: ["hook", "justification"]
                      }
                    }
                  },
                  required: ["name", "idea", "format", "execution", "why_it_works", "reference_energy", "risk_level", "risk_reason", "producibility", "cultural_hooks"]
                }
              }
            },
            required: ["brand", "category", "tension", "insight", "concepts"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      setResults(parsed);
      setExpandedConcept(0);
      setView("results");
    } catch (e) {
      console.error(e);
      setError("Generation failed. The creative director is having a breakdown. Try again.");
      setView("input");
    }
  };

  const fetchTrends = async () => {
    setError(null);
    setView("loading");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: "Give me the 6 most potent cultural tensions shaping advertising RIGHT NOW in 2025-2026.",
        config: {
          systemInstruction: TREND_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              trends: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    why_it_matters: { type: Type.STRING },
                    emotional_undercurrent: { type: Type.STRING },
                    brief_starter: { type: Type.STRING },
                    viral_concept: { type: Type.STRING },
                    video_hook: { type: Type.STRING },
                    ai_execution_methods: { type: Type.STRING }
                  },
                  required: ["name", "why_it_matters", "emotional_undercurrent", "brief_starter", "viral_concept", "video_hook", "ai_execution_methods"]
                }
              }
            },
            required: ["trends"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      setTrends(parsed.trends);
      setView("trends");
    } catch (e) {
      console.error(e);
      setError("Trend scan failed. The zeitgeist is currently unavailable.");
      setView("input");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const refineConcept = async (index: number, feedback: string) => {
    if (!results || !feedback.trim()) return;
    
    // Set a local loading state for this specific concept if needed, 
    // but for now we'll just use the main loading view or a simple overlay
    setError(null);
    const originalConcept = results.concepts[index];
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: REFINE_PROMPT
          .replace("{original_concept}", JSON.stringify(originalConcept, null, 2))
          .replace("{user_feedback}", feedback),
        config: {
          systemInstruction: MASTER_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              idea: { type: Type.STRING },
              format: { type: Type.STRING },
              execution: { type: Type.STRING },
              why_it_works: { type: Type.STRING },
              reference_energy: { type: Type.STRING },
              risk_level: { type: Type.STRING, enum: ["safe", "brave", "dangerous"] },
              risk_reason: { type: Type.STRING },
              producibility: { type: Type.STRING },
              cultural_hooks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hook: { type: Type.STRING },
                    justification: { type: Type.STRING }
                  },
                  required: ["hook", "justification"]
                }
              }
            },
            required: ["name", "idea", "format", "execution", "why_it_works", "reference_energy", "risk_level", "risk_reason", "producibility", "cultural_hooks"]
          }
        }
      });

      const refinedConcept = JSON.parse(response.text || "{}");
      const newConcepts = [...results.concepts];
      newConcepts[index] = refinedConcept;
      setResults({ ...results, concepts: newConcepts });
    } catch (e) {
      console.error(e);
      setError("Refinement failed. The creative team is stuck in a meeting.");
    }
  };

  const visualizeConcept = async (index: number) => {
    if (!results) return;
    const concept = results.concepts[index];
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              text: `A high-end, award-winning advertising mood board image for the concept "${concept.name}". 
              Execution: ${concept.execution}. 
              The image should be cinematic, surreal, and visually arresting, capturing the "Reference Energy" of ${concept.reference_energy}. 
              High-end production value, professional lighting, 8k resolution.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          },
        },
      });

      let visualUrl = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          visualUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (visualUrl) {
        const newConcepts = [...results.concepts];
        newConcepts[index] = { ...concept, visual_url: visualUrl };
        setResults({ ...results, concepts: newConcepts });
      }
    } catch (e) {
      console.error(e);
      setError("Visualization failed. The AI artist is out of ink.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-white selection:text-black">
      <div className="grain-overlay" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Header */}
        <header className="mb-16 border-b border-zinc-800 pb-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-baseline gap-4"
          >
            <h1 className="font-display text-5xl md:text-7xl text-white tracking-tight leading-none">
              Brief Machine
            </h1>
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em]">
              Concept Engine v2.6
            </span>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-xs text-zinc-500 mt-6 max-w-xl leading-relaxed"
          >
            Feed it a brand. Get back ideas that win. Powered by the same creative philosophy that wins D&AD Black Pencils.
          </motion.p>

          <nav className="flex flex-wrap gap-2 mt-8">
            {[
              { id: "input", label: "Generate", icon: Sparkles },
              { id: "trends", label: "Trend Scanner", icon: Search, action: fetchTrends },
              { id: "prompt", label: "Prompt DNA", icon: Code },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => item.action ? item.action() : setView(item.id as any)}
                className={cn(
                  "font-mono text-[10px] uppercase tracking-widest px-4 py-2 border transition-all flex items-center gap-2",
                  (view === item.id || (item.id === "input" && view === "results"))
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                )}
              >
                <item.icon size={12} />
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-red-950/30 border border-red-900/50 p-4 flex gap-3 items-start">
                <ShieldAlert className="text-red-500 shrink-0" size={18} />
                <p className="font-mono text-xs text-red-400">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Views */}
        <main>
          {/* INPUT VIEW */}
          {view === "input" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputGroup 
                  label="Brand *" 
                  placeholder="e.g. Patagonia, Duolingo, Liquid Death"
                  value={brand}
                  onChange={setBrand}
                  mono
                />
                <InputGroup 
                  label="Category" 
                  placeholder="e.g. Outdoor, EdTech, Beverage"
                  value={category}
                  onChange={setCategory}
                  mono
                />
              </div>
              <InputGroup 
                label="Objective / Tension" 
                placeholder="e.g. Make Gen Z care about climate without guilt-tripping them"
                value={objective}
                onChange={setObjective}
              />
              <InputGroup 
                label="Target Audience" 
                placeholder="e.g. Burnt-out millennials seeking authenticity"
                value={audience}
                onChange={setAudience}
              />
              <InputGroup 
                label="Constraints / Context" 
                placeholder="e.g. Producible with AI. No celebrity. Zero budget."
                value={constraint}
                onChange={setConstraint}
              />

              <div className="space-y-4">
                <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block">
                  Creative Mode
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "standard", label: "Standard Strategy", desc: "Award-winning strategic logic" },
                    { id: "surreal", label: "Surreal AI", desc: "Impossible, AI-native scenarios" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as any)}
                      className={cn(
                        "p-4 border text-left transition-all",
                        mode === m.id 
                          ? "bg-white text-black border-white" 
                          : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      <div className="font-mono text-[10px] uppercase tracking-widest mb-1">{m.label}</div>
                      <div className="text-xs opacity-70">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateConcepts}
                disabled={!brand.trim()}
                className={cn(
                  "w-full py-6 font-display italic text-2xl transition-all duration-500 flex items-center justify-center gap-4 group",
                  brand.trim() 
                    ? "bg-white text-black hover:bg-zinc-200" 
                    : "bg-zinc-900 text-zinc-700 cursor-not-allowed"
                )}
              >
                Generate Concepts
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          )}

          {/* LOADING VIEW */}
          {view === "loading" && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="relative w-16 h-16 mb-8">
                <div className="absolute inset-0 border-2 border-zinc-800 rounded-full" />
                <div className="absolute inset-0 border-2 border-white rounded-full border-t-transparent animate-spin" />
              </div>
              <motion.p 
                key={loadingMsg}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-sm text-zinc-400 tracking-widest uppercase"
              >
                {loadingMsg}
              </motion.p>
            </div>
          )}

          {/* RESULTS VIEW */}
          {view === "results" && results && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              {/* Strategy Section */}
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 md:p-10">
                <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em] mb-6">
                  Strategic Foundation
                </div>
                <h2 className="font-display text-3xl md:text-4xl text-white mb-8">
                  {results.brand} <span className="text-zinc-600">/ {results.category}</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-500">
                      <Zap size={14} />
                      <span className="font-mono text-[10px] uppercase tracking-widest">Tension</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{results.tension}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-500">
                      <Lightbulb size={14} />
                      <span className="font-mono text-[10px] uppercase tracking-widest">Insight</span>
                    </div>
                    <p className="font-display italic text-xl text-white leading-tight">
                      "{results.insight}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Concepts List */}
              <div className="space-y-4">
                {results.concepts.map((concept, idx) => (
                  <ConceptCard 
                    key={idx}
                    index={idx}
                    concept={concept}
                    isExpanded={expandedConcept === idx}
                    onToggle={() => setExpandedConcept(expandedConcept === idx ? null : idx)}
                    onRefine={(feedback) => refineConcept(idx, feedback)}
                    onVisualize={() => visualizeConcept(idx)}
                  />
                ))}
              </div>

              <div className="flex justify-center pt-8">
                <button
                  onClick={() => setView("input")}
                  className="font-mono text-[10px] uppercase tracking-widest px-8 py-4 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                >
                  <RefreshCcw size={12} />
                  New Brief
                </button>
              </div>
            </motion.div>
          )}

          {/* TRENDS VIEW */}
          {view === "trends" && trends && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 gap-4">
                {trends.map((trend, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => {
                      setObjective(trend.brief_starter);
                      setView("input");
                    }}
                    className="group bg-zinc-900/30 border border-zinc-800 p-8 hover:border-zinc-600 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-display text-2xl text-white group-hover:text-zinc-200 transition-colors">
                        {trend.name}
                      </h3>
                      <ChevronRight className="text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                    <p className="text-sm text-zinc-400 mb-6 leading-relaxed">{trend.why_it_matters}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-zinc-800/50">
                      <DetailBlock label="Emotional Undercurrent" value={trend.emotional_undercurrent} />
                      <div className="space-y-1">
                        <span className="font-mono text-[10px] text-red-500 uppercase tracking-widest">Brief Starter</span>
                        <p className="font-display italic text-lg text-zinc-200 leading-tight">"{trend.brief_starter}"</p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-white/5 border border-white/10 space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-cyan-400">
                          <Sparkles size={12} />
                          <span className="font-mono text-[10px] uppercase tracking-widest">Viral Concept</span>
                        </div>
                        <p className="text-sm text-zinc-200 leading-relaxed">{trend.viral_concept}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-purple-400">
                          <Zap size={12} />
                          <span className="font-mono text-[10px] uppercase tracking-widest">3s Video Hook</span>
                        </div>
                        <p className="font-mono text-xs text-zinc-400 italic">"{trend.video_hook}"</p>
                      </div>
                      <div className="space-y-1 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <Code size={12} />
                          <span className="font-mono text-[10px] uppercase tracking-widest">AI Execution Strategy</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{trend.ai_execution_methods}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* PROMPT DNA VIEW */}
          {view === "prompt" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <PromptBlock title="Strategist DNA" content={MASTER_PROMPT} />
              <PromptBlock title="Analyst DNA" content={TREND_PROMPT} />
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- Helper Components ---

function InputGroup({ label, placeholder, value, onChange, mono }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block">
        {label}
      </label>
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-zinc-900/50 border border-zinc-800 px-4 py-4 text-zinc-200 outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700",
          mono ? "font-mono text-xs" : "text-sm"
        )}
      />
    </div>
  );
}

function ConceptCard({ concept, index, isExpanded, onToggle, onRefine, onVisualize }: { concept: Concept; index: number; isExpanded: boolean; onToggle: () => void; onRefine: (feedback: string) => Promise<void>; onVisualize: () => Promise<void> }) {
  const [refineInput, setRefineInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [showRefine, setShowRefine] = useState(false);

  const handleRefine = async () => {
    if (!refineInput.trim()) return;
    setIsRefining(true);
    await onRefine(refineInput);
    setIsRefining(false);
    setRefineInput("");
    setShowRefine(false);
  };

  const handleVisualize = async () => {
    setIsVisualizing(true);
    await onVisualize();
    setIsVisualizing(false);
  };

  return (
    <div className={cn(
      "border transition-all duration-500 overflow-hidden",
      isExpanded ? "bg-zinc-900/80 border-zinc-700" : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700"
    )}>
      <button 
        onClick={onToggle}
        className="w-full px-8 py-6 flex items-center justify-between text-left group"
      >
        <div className="flex items-baseline gap-6">
          <span className="font-mono text-[10px] text-zinc-700">0{index + 1}</span>
          <h3 className="font-display text-2xl text-white group-hover:translate-x-1 transition-transform">
            {concept.name}
          </h3>
          <div className="hidden md:block">
            <RiskBadge level={concept.risk_level} />
          </div>
        </div>
        <div className="text-zinc-700 group-hover:text-zinc-400 transition-colors">
          {isExpanded ? <Minus size={20} /> : <Plus size={20} />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-8 pb-10 border-t border-zinc-800/50"
          >
            <div className="pt-8 space-y-10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <p className="font-display italic text-2xl text-white leading-tight max-w-2xl">
                  {concept.idea}
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleVisualize}
                    disabled={isVisualizing || !!concept.visual_url}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                  >
                    <Sparkles size={12} className={isVisualizing ? "animate-pulse" : ""} />
                    {isVisualizing ? "Visualizing..." : concept.visual_url ? "Visualized" : "Visualize Concept"}
                  </button>
                  <button
                    onClick={() => setShowRefine(!showRefine)}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                  >
                    <RefreshCcw size={12} className={isRefining ? "animate-spin" : ""} />
                    {showRefine ? "Cancel" : "Refine Concept"}
                  </button>
                </div>
              </div>

              {concept.visual_url && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-video bg-zinc-800 border border-zinc-700 overflow-hidden"
                >
                  <img 
                    src={concept.visual_url} 
                    alt={concept.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 font-mono text-[10px] text-white/70 uppercase tracking-widest">
                    AI Generated Mood Board
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {showRefine && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-6 bg-zinc-800/30 border border-zinc-700 space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Refinement Feedback</label>
                      <textarea
                        value={refineInput}
                        onChange={(e) => setRefineInput(e.target.value)}
                        placeholder="e.g. Make it more provocative, explore a different format, or reduce the risk..."
                        className="w-full bg-zinc-900/50 border border-zinc-800 px-4 py-3 text-sm text-zinc-200 outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700 min-h-[80px] resize-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleRefine}
                        disabled={isRefining || !refineInput.trim()}
                        className="font-mono text-[10px] uppercase tracking-widest px-6 py-2 bg-white text-black hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRefining ? "Regenerating..." : "Apply Refinement"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <DetailBlock label="Format" value={concept.format} />
                <DetailBlock label="Risk Context" value={concept.risk_reason || "Calculated risk for maximum impact."} />
              </div>

              <DetailBlock label="The Execution" value={concept.execution} />
              <DetailBlock label="Strategic Logic" value={concept.why_it_works} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <DetailBlock label="Reference Energy" value={concept.reference_energy} />
                <DetailBlock label="Producibility" value={concept.producibility} />
              </div>

              {concept.cultural_hooks?.length > 0 && (
                <div className="space-y-4">
                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Cultural Hooks & Justifications</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {concept.cultural_hooks.map((item, i) => (
                      <div key={i} className="p-4 bg-zinc-800/30 border border-zinc-800 space-y-2">
                        <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                          {item.hook}
                        </span>
                        <p className="text-xs text-zinc-400 leading-relaxed italic">
                          {item.justification}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PromptBlock({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-2xl text-white">{title}</h3>
        <button 
          onClick={handleCopy}
          className="font-mono text-[10px] text-zinc-500 hover:text-white flex items-center gap-2 transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "COPIED" : "COPY DNA"}
        </button>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 p-6 max-h-80 overflow-y-auto">
        <pre className="font-mono text-[11px] text-zinc-500 leading-relaxed whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    </div>
  );
}
