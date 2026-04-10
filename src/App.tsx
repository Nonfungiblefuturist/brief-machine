import React, { useState, useCallback, useRef, useEffect } from "react";
import { Type, ThinkingLevel, Modality, GenerateContentResponse } from "@google/genai";

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import JSZip from "jszip";
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
  ChevronDown,
  Sparkles,
  Search,
  Code,
  X,
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Layout,
  Trash2,
  LogIn,
  Folder,
  FolderOpen,
  ExternalLink,
  Save,
  Film,
  FileImage,
  Camera,
  Scissors,
  Video,
  Clock,
  LayoutGrid,
  Play,
  History,
  Layers,
  Monitor,
  ChevronLeft,
  Maximize2,
  Grid,
  Settings,
  Sparkle,
  Moon,
  Sun,
  Eye,
  Star,
  Upload,
  Palette
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// --- Prompts ---

interface ExtractorFrame {
  url: string;
  name?: string;
  backgroundUrl?: string;
  time?: number;
}

const BRIEF_MACHINE_PRESETS = {
  cameras: ["ARRI Alexa 35", "RED V-RAPTOR", "Sony FX6", "Canon C70", "Blackmagic URSA", "Bolex 16mm", "Super 8 film camera"],
  lenses: ["anamorphic 50mm", "vintage Helios 44-2", "Cooke S4 35mm", "Zeiss Master Prime 85mm", "tilt-shift lens", "macro lens", "fisheye lens"],
  filmStocks: ["Kodak Vision3 500T", "Kodak Portra 400", "Fuji Eterna Vivid 500", "CineStill 800T", "Kodak Ektachrome", "Ilford HP5 Plus"],
  lighting: ["Rembrandt lighting", "golden hour backlight", "harsh midday sun", "neon-lit cyberpunk", "candlelit warmth", "overcast diffused", "blue moonlight", "studio three-point lighting", "chiaroscuro", "volumetric fog with rim light"],
  styles: ["1970s film grain", "Wes Anderson symmetry", "Blade Runner 2049 neon noir", "Studio Ghibli dreamscape", "Christopher Nolan IMAX", "Terrence Malick golden hour", "Wong Kar-wai neon romance", "A24 indie realism", "Soviet propaganda poster", "renaissance painting"],
  compositions: ["extreme close-up", "Dutch angle", "bird's eye view", "over-the-shoulder", "symmetrical center frame", "rule of thirds", "leading lines", "deep depth of field", "shallow bokeh", "handheld shaky cam"],
  motions: ["slow dolly push in", "crane shot rising", "Steadicam tracking shot", "whip pan", "slow motion 120fps", "time-lapse", "drone flyover", "static locked-off", "rack focus pull", "vertigo zoom (dolly zoom)"]
};

const STORYBOARD_TEMPLATES = [
  {
    id: "3-act",
    name: "3-Act Structure",
    description: "Classic narrative arc: Setup, Confrontation, Resolution.",
    frames: [
      { frame_description: "Establishing shot: The world before the conflict. Calm, wide, atmospheric.", annotation: "Wide shot, slow pan.", camera_angle: "Wide", lighting: "Natural", atmosphere: "Calm" },
      { frame_description: "The inciting incident: Something changes. Close-up on the catalyst.", annotation: "Close-up, sharp focus.", camera_angle: "Close-up", lighting: "Dramatic", atmosphere: "Tense" },
      { frame_description: "The climax: The highest point of tension. Fast-paced, dynamic.", annotation: "Handheld, shaky cam.", camera_angle: "Dutch Angle", lighting: "High Contrast", atmosphere: "Chaotic" },
      { frame_description: "The resolution: The new normal. Soft, lingering shot.", annotation: "Slow zoom out.", camera_angle: "Medium", lighting: "Soft", atmosphere: "Peaceful" }
    ]
  },
  {
    id: "social-ad",
    name: "Quick Cut Social Ad",
    description: "High-energy, fast-paced for mobile platforms.",
    frames: [
      { frame_description: "The Hook: Stop the scroll. Bold colors, immediate action.", annotation: "Fast zoom in.", camera_angle: "Eye-level", lighting: "Vibrant", atmosphere: "Energetic" },
      { frame_description: "The Problem: Relatable frustration. Close-up on emotion.", annotation: "Extreme close-up.", camera_angle: "Close-up", lighting: "Cool tones", atmosphere: "Frustrated" },
      { frame_description: "The Solution: Product reveal. Hero shot, glowing.", annotation: "Low angle, hero shot.", camera_angle: "Low Angle", lighting: "Golden hour", atmosphere: "Triumphant" },
      { frame_description: "Call to Action: Text overlay, final brand shot.", annotation: "Static shot, text overlay.", camera_angle: "Medium", lighting: "Clean", atmosphere: "Direct" }
    ]
  },
  {
    id: "cinematic-teaser",
    name: "Cinematic Teaser",
    description: "Moody, atmospheric, and mysterious.",
    frames: [
      { frame_description: "Mystery: A silhouette in the fog. Low light, high mystery.", annotation: "Tracking shot, slow.", camera_angle: "Low Angle", lighting: "Chiaroscuro", atmosphere: "Mysterious" },
      { frame_description: "Detail: A macro shot of a key object. Sharp detail, shallow depth.", annotation: "Macro shot.", camera_angle: "Macro", lighting: "Spotlight", atmosphere: "Clinical" },
      { frame_description: "Scale: A massive landscape or structure. Emphasize isolation.", annotation: "Drone shot, high.", camera_angle: "Bird's Eye", lighting: "Overcast", atmosphere: "Epic" },
      { frame_description: "The Reveal: A brief glimpse of the protagonist. Intense gaze.", annotation: "Extreme close-up on eyes.", camera_angle: "Extreme Close-up", lighting: "Hard light", atmosphere: "Intense" }
    ]
  }
];

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
- TITLE OPTIONS: 3-4 alternative punchy titles that capture the core idea from different angles.
- THE IDEA IN ONE LINE: If you can't say it in one sentence, kill it
- FORMAT: What medium/format does this idea DEMAND? (Don't default to :30 film. Think installations, stunts, hacks, print, social mechanics, UX interventions, packaging, ambient, data-driven, AI-powered, experiential)
- THE EXECUTION: 3-4 sentences max. What does the audience SEE/EXPERIENCE?
- WHY IT WORKS: The strategic logic. Connect insight to impact.
- REFERENCE ENERGY: Name 1-2 real award-winning campaigns this shares DNA with. Explain WHY they were effective in tapping into similar cultural tensions or strategic mechanics.
- RISK LEVEL: safe, brave, or dangerous.
- RISK REASON: Provide a detailed explanation of the potential negative implications, brand safety concerns, or execution challenges associated with this specific idea. Avoid generic statements.
- PRODUCIBILITY: Can this be made with AI tools + minimal budget? How?
- AI VISUAL PROMPT: A highly detailed, professional prompt for an AI image generator (like Midjourney or DALL-E) that would perfectly capture the visual essence of this concept. Focus on lighting, texture, composition, and surreal elements.
- SCRIPT SNIPPET: (For video formats) A brief, high-impact script snippet or dialogue that captures the tone and voice of the concept.
- STORYBOARD: (For video formats) A sequence of 3-4 key frames. Each frame needs a "frame_description" (visual details), "annotation" (camera move, sound, or text overlay), "camera_angle", "lighting", and "atmosphere".

4. HIGGSFIELD OPTIMIZATION (MANDATORY FOR ALL CONCEPTS)
For every concept, generate a Higgsfield-ready configuration:
- RECOMMENDED MODEL: Choose from Kling 3.0, Veo 3.1, Cinema Studio, or Click-to-Ad. 
  - Social/Fast -> Kling
  - Cinematic/Brand -> Cinema Studio
  - Ad Remix -> Click-to-Ad
- CAMERA PHYSICS: Specify camera body (e.g., ARRI Alexa LF, RED V-Raptor), lens type (e.g., Anamorphic, Prime), focal length (e.g., 35mm, 85mm), and up to 3 simultaneous movements (e.g., Dolly Push + Pan + Tilt).
- PROMPT DNA: Structured as discrete fields:
  - scene_description
  - camera_movement
  - lens_lighting_specs
  - style_reference
  - duration (e.g., "15s", "30s")
- CREDIT ESTIMATE: Estimate the Higgsfield credit cost (Cinema Studio is high, Kling is medium).
- SHOT BREAKDOWN: For the total duration, suggest a shot-by-shot breakdown (e.g., a 30s spot is 4-6 shots).

5. CLICK-TO-AD INTEGRATION (ONLY FOR "AD REMIX" MODE)
If the mode is "AD REMIX", provide:
- product_url (placeholder if not known)
- brand_intent (summary of the ad's goal)
- visual_anchors (key visual elements to maintain)
- target_platform (IG Reels, TikTok, YouTube Shorts)

6. CULTURAL HOOKS (based on current 2025-2026 landscape)
Tag each concept with 2-3 specific and niche cultural currents that are highly relevant to the idea, in addition to broader ones. For each hook, provide a brief (1-2 sentence) justification for its inclusion, explaining how the concept resonates with that specific cultural undercurrent.

INSPIRATION MODES:
- ORIGINAL: Focus on pure strategic logic and human insight.
- CINEMATIC / MOVIE STYLE: Draw inspiration from iconic film genres, directors (e.g., Wes Anderson, Nolan, Kubrick), or specific cinematic tropes. The concept should feel like a "pitch pilot" or a teaser for a larger narrative.
- AD REMIX: Take inspiration from classic, award-winning ad campaigns (e.g., "Think Different", "Just Do It", "The Man Your Man Could Smell Like") and remix their core mechanics for the current brand and cultural context.
- VIRAL / FAR-FETCHED: Cook up ideas that are intentionally provocative, surreal, or "too far" to be ignored. Focus on "viral-worthy" mechanics that demand attention through sheer audacity or experimental AI execution.
- FOUND FOOTAGE: Draw inspiration from VHS tapes, camcorders, CCTV, bodycams, or amateur recordings. The concept should feel raw, unpolished, and authentic to the specified decade.

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
- Hyper-imaginative scenarios that DEMAND AI image/video generation (Midjourney, Higgsfield, Kling, etc.) for their visual execution.
The idea must still be strategically grounded, but the execution must be "AI-native surrealism".`;

const REFINE_PROMPT = `You are an elite creative strategist. You are refining an existing advertising concept based on specific user feedback. 

Maintain the core strategic insight and the brand's essence, but iterate on the execution, format, or risk level as requested.

ORIGINAL CONCEPT:
{original_concept}

USER FEEDBACK:
{user_feedback}

Provide the refined concept in the same JSON format as the original.`;

const TREND_PROMPT = `You are a cultural intelligence analyst specializing in AI-native creativity. Scan for the most potent cultural tensions, trends, and undercurrents shaping advertising in 2025-2026, specifically focusing on ideas that DEMAND AI-generated video execution (Surrealism, impossible physics, dream-logic).

For each trend, provide:
- The trend/tension name
- Why it matters for brands RIGHT NOW  
- The emotional undercurrent (what people FEEL about this)
- A "brief starter" — a provocative question a brand could build a campaign around, specifically for an AI-generated video.
- A "viral_concept" — A specific, high-impact idea for an AI-generated video that leverages this trend. It should be designed for shareability and visual awe.
- A "video_hook" — A 3-second hook for social media (TikTok/Reels) to grab attention immediately.
- The industry category (e.g., Fashion, Tech, Automotive, Food, Travel, Entertainment, etc.)`;

import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  serverTimestamp, 
  Timestamp 
} from './firebase';
import type { User } from './firebase';

// --- Types ---

interface StoryboardFrame {
  frame_description: string;
  visual_url?: string;
  annotation?: string;
  camera_angle?: string;
  lighting?: string;
  atmosphere?: string;
  higgsfield_specs?: {
    camera_body: string;
    lens: string;
    focal_length: string;
    movements: string[];
  };
}

interface PastTrend {
  id: string;
  trends: Trend[];
  createdAt: any;
  userId: string;
}

interface SavedProject {
  id: string;
  name: string;
  input: string;
  frames: StoryboardFrame[];
  prompts?: BriefMachineHistoryItem[];
  extractedFrames?: ExtractorFrame[];
  thumbnailUrl?: string;
  createdAt: any;
  updatedAt: any;
  userId: string;
}

interface Concept {
  name: string;
  title_options: string[];
  selected_title?: string;
  background_url?: string;
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
  visual_video_url?: string;
  ai_visual_prompt: string;
  script_snippet?: string;
  storyboard?: StoryboardFrame[];
  rating?: number;
  variations?: Concept[];
  higgsfield_config?: {
    recommended_model: string;
    camera_physics: {
      body: string;
      lens: string;
      focal_length: string;
      movements: string[];
    };
    prompt_dna: {
      scene_description: string;
      camera_movement: string;
      lens_lighting_specs: string;
      style_reference: string;
      duration: string;
    };
    credit_estimate: number;
    shot_breakdown: {
      shot: number;
      description: string;
      duration: string;
    }[];
  };
  click_to_ad_brief?: {
    product_url: string;
    brand_intent: string;
    visual_anchors: string;
    target_platform: string;
  };
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
  industry: string;
}

interface BriefMachineCharacter {
  id: string;
  name: string;
  description: string;
  wardrobe: string;
  personality: string;
  notes: string;
  initials: string;
  color: string;
}

interface BriefMachineShot {
  id: string;
  subject: string;
  composition: string;
  lighting: string;
  camera: string;
  style: string;
  motion: string;
  imageUrl?: string;
}

interface BriefMachineHistoryItem {
  id: string;
  timestamp: number;
  shot: BriefMachineShot;
}

const BriefMachineHistoryComponent = ({ 
  history, 
  onSelect, 
  onDelete 
}: { 
  history: BriefMachineHistoryItem[], 
  onSelect: (shot: BriefMachineShot) => void,
  onDelete: (id: string) => void
}) => {
  if (history.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-zinc-800 gap-4">
        <History size={48} />
        <p className="font-display italic text-xl">No history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map(item => (
        <div 
          key={item.id}
          className="bg-zinc-900/30 border border-zinc-800 hover:border-zinc-600 transition-all rounded-lg overflow-hidden group"
        >
          <div className="flex gap-4 p-4">
            <div 
              className="w-24 aspect-video bg-black border border-zinc-800 flex-shrink-0 cursor-pointer overflow-hidden"
              onClick={() => onSelect(item.shot)}
            >
              {item.shot.imageUrl ? (
                <img src={item.shot.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles size={16} className="text-zinc-800" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex justify-between items-start">
                <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">
                  {new Date(item.timestamp).toLocaleString()}
                </span>
                <button 
                  onClick={() => onDelete(item.id)}
                  className="text-zinc-700 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-[11px] text-zinc-300 line-clamp-2 font-medium leading-relaxed">
                {item.shot.subject}
              </p>
              <div className="flex flex-wrap gap-2">
                {item.shot.camera && <span className="px-2 py-0.5 bg-zinc-800 text-[8px] text-zinc-500 font-mono uppercase tracking-widest rounded">{item.shot.camera}</span>}
                {item.shot.lighting && <span className="px-2 py-0.5 bg-zinc-800 text-[8px] text-zinc-500 font-mono uppercase tracking-widest rounded">{item.shot.lighting}</span>}
                {item.shot.style && <span className="px-2 py-0.5 bg-zinc-800 text-[8px] text-zinc-500 font-mono uppercase tracking-widest rounded">{item.shot.style}</span>}
              </div>
            </div>
          </div>
          <button 
            onClick={() => onSelect(item.shot)}
            className="w-full py-2 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-widest transition-all border-t border-zinc-800"
          >
            Restore Shot
          </button>
        </div>
      ))}
    </div>
  );
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

import { geminiService } from "./services/geminiService";
import PromptEngine from "./components/PromptEngine";

// --- Components ---

const LazyImage = ({ src, alt, className, placeholder }: { src?: string; alt: string; className?: string; placeholder?: React.ReactNode }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  if (!src || error) return <div className={cn("bg-zinc-900 flex items-center justify-center", className)}>{placeholder || <FileImage size={24} className="text-zinc-700" />}</div>;

  return (
    <div className={cn("relative overflow-hidden bg-zinc-900", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse bg-zinc-900/50">
          {placeholder || <RefreshCcw size={24} className="text-zinc-700 animate-spin" />}
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        loading="lazy"
        className={cn("w-full h-full object-cover transition-opacity duration-500", isLoaded ? "opacity-100" : "opacity-0")}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

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
  const [view, setView] = useState<"input" | "loading" | "results" | "trends" | "prompt" | "storyboarder" | "shortlist" | "compare" | "projects" | "extractor" | "pastTrends" | "anomaLab" | "promptEngine">("input");
  const [mode, setMode] = useState<"standard" | "surreal">("standard");
  const [anomaLabTheme, setAnomaLabTheme] = useState<"dark" | "light" | "high-contrast">("dark");
  const [briefInput, setBriefInput] = useState("");
  const [scriptInput, setScriptInput] = useState("");
  const [videoLength, setVideoLength] = useState<string>(":30s");
  const [inspiration, setInspiration] = useState<"original" | "movie" | "ad" | "viral" | "found_footage" | "festival" | "arthouse" | "feature">("original");
  const [decade, setDecade] = useState<string>("Modern");
  const [selectedConcepts, setSelectedConcepts] = useState<number[]>([]);
  const [selectedTrends, setSelectedTrends] = useState<number[]>([]);
  const [quickFireResults, setQuickFireResults] = useState<string[]>([]);
  const [results, setResults] = useState<Results | null>(null);
  const [trends, setTrends] = useState<Trend[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [expandedConcept, setExpandedConcept] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [pastRatings, setPastRatings] = useState<{ concept: string; rating: number }[]>([]);
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState<number | null>(null);
  const [filterRating, setFilterRating] = useState<number>(0);
  const [storyboarderInput, setStoryboarderInput] = useState("");
  const [storyboarderProjectName, setStoryboarderProjectName] = useState("Untitled Project");
  const [storyboarderImages, setStoryboarderImages] = useState<string[]>([]);
  const [storyboarderFrames, setStoryboarderFrames] = useState<StoryboardFrame[]>([]);
  const [isGeneratingStoryboarder, setIsGeneratingStoryboarder] = useState(false);
  const [isGeneratingIndividualFrame, setIsGeneratingIndividualFrame] = useState<number | null>(null);
  const [briefHistory, setBriefHistory] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [isFetchingMoreTrends, setIsFetchingMoreTrends] = useState(false);
  const [pastTrends, setPastTrends] = useState<PastTrend[]>([]);
  const [isLoadingPastTrends, setIsLoadingPastTrends] = useState(false);
  const [trendFilterMonth, setTrendFilterMonth] = useState<string>("all");
  const [trendFilterYear, setTrendFilterYear] = useState<string>("all");
  const [trendFilterIndustry, setTrendFilterIndustry] = useState<string>("all");
  const [videoAspectRatio, setVideoAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [refiningFrameIndex, setRefiningFrameIndex] = useState<number | null>(null);
  const [refinementFeedback, setRefinementFeedback] = useState("");
  const [attachedExtractorFrames, setAttachedExtractorFrames] = useState<ExtractorFrame[]>([]);
  const [isMultiShot, setIsMultiShot] = useState(false);
  
  // Anoma Lab State
  const [briefMachineShot, setBriefMachineShot] = useState<BriefMachineShot>({
    id: Date.now().toString(),
    subject: "",
    composition: "",
    lighting: "",
    camera: "",
    style: "",
    motion: ""
  });
  const [briefMachineRawInput, setBriefMachineRawInput] = useState("");
  const [anomaLabCharacters, setBriefMachineCharacters] = useState<BriefMachineCharacter[]>([]);
  const [briefMachineHistory, setBriefMachineHistory] = useState<BriefMachineHistoryItem[]>([]);
  const [briefMachineStoryboard, setBriefMachineStoryboard] = useState<BriefMachineShot[]>([]);
  const [isStoryboardMode, setIsStoryboardMode] = useState(false);
  const [isAnomaLabSidebarOpen, setIsBriefMachineSidebarOpen] = useState(true);
  const [isBriefMachineRightPanelOpen, setIsBriefMachineRightPanelOpen] = useState(true);
  const [anomaLabActiveTab, setAnomaLabActiveTab] = useState<"presets" | "characters" | "history">("presets");
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [isSmartEditing, setIsSmartEditing] = useState(false);
  const [smartEditInstruction, setSmartEditInstruction] = useState("");
  const [isExpanding, setIsExpanding] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [expandedLabSections, setExpandedLabSections] = useState<string[]>(["studio"]);
  const [expandedPresetCategories, setExpandedPresetCategories] = useState<string[]>([]);
  const [hoveredStoryboardFrame, setHoveredStoryboardFrame] = useState<number | null>(null);
  const [anomaLabGallery, setAnomaLabGallery] = useState<string[]>([]);
  const [favoritePresets, setFavoritePresets] = useState<string[]>([]);
  const [galleryGridCols, setGalleryGridCols] = useState<1 | 2 | 4>(2);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [higgsfieldModel, setHiggsfieldModel] = useState<string>("None Selected");
  const [clickToAdFields, setClickToAdFields] = useState({
    productUrl: "",
    brandIntent: "",
    visualAnchors: "",
    targetPlatform: "IG Reels"
  });
  const [isCameraPhysicsEnabled, setIsCameraPhysicsEnabled] = useState(false);
  const [cameraPhysics, setCameraPhysics] = useState({
    body: "ARRI Alexa LF",
    lens: "Prime",
    focalLength: "35mm",
    movements: [] as string[]
  });

  // Extractor State
  const [extractorVideoFile, setExtractorVideoFile] = useState<File | null>(null);
  const [extractorVideoUrl, setExtractorVideoUrl] = useState<string | null>(null);
  const [extractorFrames, setExtractorFrames] = useState<ExtractorFrame[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionInterval, setExtractionInterval] = useState(1); // seconds
  const [selectedExtractorFrames, setSelectedExtractorFrames] = useState<number[]>([]);
  const [extractorExportFormat, setExtractorExportFormat] = useState<'jpg' | 'png'>('jpg');
  const [extractorThumbnailSize, setExtractorThumbnailSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [extractorAspectRatio, setExtractorAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [hoveredFrame, setHoveredFrame] = useState<ExtractorFrame | null>(null);
  const [extractorViewMode, setExtractorViewMode] = useState<'grid' | 'timeline'>('grid');
  const [isGeneratingExtractorBackground, setIsGeneratingExtractorBackground] = useState<number | null>(null);
  const [refiningBackgroundIndex, setRefiningBackgroundIndex] = useState<number | null>(null);
  const [backgroundRefinementPrompt, setBackgroundRefinementPrompt] = useState("");
  const [extractorRenamePrefix, setExtractorRenamePrefix] = useState("frame");
  const [extractorScrubTime, setExtractorScrubTime] = useState(0);
  const extractorVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-save Storyboard Draft
  useEffect(() => {
    const draftTimer = setInterval(() => {
      if (storyboarderFrames.length > 0 || storyboarderInput.trim() || storyboarderProjectName !== "Untitled Project") {
        const draft = {
          name: storyboarderProjectName,
          input: storyboarderInput,
          frames: storyboarderFrames,
          timestamp: Date.now()
        };
        localStorage.setItem("storyboard_draft", JSON.stringify(draft));
        console.log("Storyboard draft auto-saved.");
      }
    }, 120000); // Every 2 minutes

    return () => clearInterval(draftTimer);
  }, [storyboarderFrames, storyboarderInput, storyboarderProjectName]);

  // Load Storyboard Draft on Mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("storyboard_draft");
    if (savedDraft && storyboarderFrames.length === 0 && !storyboarderInput.trim()) {
      try {
        const draft = JSON.parse(savedDraft);
        // Only restore if it's relatively fresh (e.g., within 24 hours)
        if (Date.now() - draft.timestamp < 86400000) {
          setStoryboarderProjectName(draft.name);
          setStoryboarderInput(draft.input);
          setStoryboarderFrames(draft.frames);
        }
      } catch (e) {
        console.error("Failed to load storyboard draft:", e);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchSavedProjects(currentUser.uid);
      } else {
        setSavedProjects([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSavedProjects = async (uid: string) => {
    setIsLoadingProjects(true);
    const path = "storyboards";
    try {
      const q = query(
        collection(db, path), 
        where("userId", "==", uid),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const projects: SavedProject[] = [];
      querySnapshot.forEach((doc) => {
        projects.push({ id: doc.id, ...doc.data() } as SavedProject);
      });
      setSavedProjects(projects);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = STORYBOARD_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setStoryboarderFrames(template.frames.map(f => ({ ...f })));
      setStoryboarderProjectName(template.name);
      setStoryboarderInput(`Template: ${template.name}\n${template.description}`);
    }
  };

  const beautifyPrompt = async () => {
    if (!briefMachineRawInput.trim()) return;
    setIsBeautifying(true);
    try {
      const response = await geminiService.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are a professional AI prompt engineer for cinematic image and video generation. Take this unstructured prompt and reorganize it into clean, well-written sections. If a section has no relevant content, leave it empty.
        
        RAW INPUT: ${briefMachineRawInput}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              composition: { type: Type.STRING },
              lighting: { type: Type.STRING },
              camera: { type: Type.STRING },
              style: { type: Type.STRING },
              motion: { type: Type.STRING }
            },
            required: ["subject", "composition", "lighting", "camera", "style", "motion"]
          }
        }
      });
      
      const result = JSON.parse(response.text);
      setBriefMachineShot(prev => ({ ...prev, ...result }));
      setBriefMachineRawInput("");
    } catch (err) {
      console.error(err);
      setError("Beautify failed.");
    } finally {
      setIsBeautifying(false);
    }
  };

  const smartEditPrompt = async (instruction: string) => {
    if (!instruction.trim()) return;
    setIsSmartEditing(true);
    try {
      const response = await geminiService.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `You are an expert AI prompt editor. Modify the provided structured prompt according to the user's instruction. Keep all sections intact. Only change what the instruction asks for.
        
        CURRENT PROMPT:
        Subject: ${briefMachineShot.subject}
        Composition: ${briefMachineShot.composition}
        Lighting: ${briefMachineShot.lighting}
        Camera: ${briefMachineShot.camera}
        Style: ${briefMachineShot.style}
        Motion: ${briefMachineShot.motion}
        
        INSTRUCTION: ${instruction}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              composition: { type: Type.STRING },
              lighting: { type: Type.STRING },
              camera: { type: Type.STRING },
              style: { type: Type.STRING },
              motion: { type: Type.STRING }
            },
            required: ["subject", "composition", "lighting", "camera", "style", "motion"]
          }
        }
      });
      
      const result = JSON.parse(response.text);
      setBriefMachineShot(prev => ({ ...prev, ...result }));
      setSmartEditInstruction("");
    } catch (err) {
      console.error(err);
      setError("Smart Edit failed.");
    } finally {
      setIsSmartEditing(false);
    }
  };

  const expandPrompt = async () => {
    setIsExpanding(true);
    try {
      const response = await geminiService.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Add more cinematic detail and richness to each section of this prompt while preserving the original creative intent. Make it more vivid and specific.
        
        CURRENT PROMPT:
        Subject: ${briefMachineShot.subject}
        Composition: ${briefMachineShot.composition}
        Lighting: ${briefMachineShot.lighting}
        Camera: ${briefMachineShot.camera}
        Style: ${briefMachineShot.style}
        Motion: ${briefMachineShot.motion}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              composition: { type: Type.STRING },
              lighting: { type: Type.STRING },
              camera: { type: Type.STRING },
              style: { type: Type.STRING },
              motion: { type: Type.STRING }
            },
            required: ["subject", "composition", "lighting", "camera", "style", "motion"]
          }
        }
      });
      
      const result = JSON.parse(response.text);
      setBriefMachineShot(prev => ({ ...prev, ...result }));
    } catch (err) {
      console.error(err);
      setError("Expand failed.");
    } finally {
      setIsExpanding(false);
    }
  };

  const simplifyPrompt = async () => {
    setIsSimplifying(true);
    try {
      const response = await geminiService.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Strip this prompt down to only its most essential elements. Remove unnecessary detail. Make it clean and minimal.
        
        CURRENT PROMPT:
        Subject: ${briefMachineShot.subject}
        Composition: ${briefMachineShot.composition}
        Lighting: ${briefMachineShot.lighting}
        Camera: ${briefMachineShot.camera}
        Style: ${briefMachineShot.style}
        Motion: ${briefMachineShot.motion}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              composition: { type: Type.STRING },
              lighting: { type: Type.STRING },
              camera: { type: Type.STRING },
              style: { type: Type.STRING },
              motion: { type: Type.STRING }
            },
            required: ["subject", "composition", "lighting", "camera", "style", "motion"]
          }
        }
      });
      
      const result = JSON.parse(response.text);
      setBriefMachineShot(prev => ({ ...prev, ...result }));
    } catch (err) {
      console.error(err);
      setError("Simplify failed.");
    } finally {
      setIsSimplifying(false);
    }
  };

  const rollPrompt = () => {
    const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    setBriefMachineShot({
      id: Date.now().toString(),
      subject: "A mysterious figure in a futuristic city",
      composition: getRandom(BRIEF_MACHINE_PRESETS.compositions),
      lighting: getRandom(BRIEF_MACHINE_PRESETS.lighting),
      camera: getRandom(BRIEF_MACHINE_PRESETS.cameras),
      style: getRandom(BRIEF_MACHINE_PRESETS.styles),
      motion: getRandom(BRIEF_MACHINE_PRESETS.motions)
    });
  };

  const saveToHistory = () => {
    const newItem: BriefMachineHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      shot: { ...briefMachineShot }
    };
    const updatedHistory = [newItem, ...briefMachineHistory].slice(0, 50);
    setBriefMachineHistory(updatedHistory);
    localStorage.setItem("anomaLab_history", JSON.stringify(updatedHistory));
  };

  const copyFullPrompt = () => {
    const full = `${briefMachineShot.subject}. ${briefMachineShot.composition}. ${briefMachineShot.lighting}. ${briefMachineShot.camera}. ${briefMachineShot.style}. ${briefMachineShot.motion}.`.replace(/\.\s\./g, ".").trim();
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    saveToHistory();
  };

  const clearPrompt = () => {
    setBriefMachineShot({
      id: Date.now().toString(),
      subject: "",
      composition: "",
      lighting: "",
      camera: "",
      style: "",
      motion: ""
    });
  };

  const addCharacter = (char: Omit<BriefMachineCharacter, "id" | "initials" | "color">) => {
    const initials = char.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const colors = ["#c87941", "#41c879", "#4179c8", "#c84179", "#7941c8"];
    const color = colors[anomaLabCharacters.length % colors.length];
    const newChar: BriefMachineCharacter = {
      ...char,
      id: Date.now().toString(),
      initials,
      color
    };
    const updated = [...anomaLabCharacters, newChar];
    setBriefMachineCharacters(updated);
    localStorage.setItem("anomaLab_characters", JSON.stringify(updated));
  };

  const deleteCharacter = (id: string) => {
    const updated = anomaLabCharacters.filter(c => c.id !== id);
    setBriefMachineCharacters(updated);
    localStorage.setItem("anomaLab_characters", JSON.stringify(updated));
  };

  const insertCharacter = (char: BriefMachineCharacter) => {
    setBriefMachineShot(prev => ({
      ...prev,
      subject: prev.subject ? `${prev.subject}, ${char.description} wearing ${char.wardrobe}` : `${char.name}: ${char.description} wearing ${char.wardrobe}`
    }));
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem("anomaLab_history");
    if (savedHistory) setBriefMachineHistory(JSON.parse(savedHistory));
    
    const savedChars = localStorage.getItem("anomaLab_characters");
    if (savedChars) setBriefMachineCharacters(JSON.parse(savedChars));

    const savedBriefs = localStorage.getItem("brief_history");
    if (savedBriefs) setBriefHistory(JSON.parse(savedBriefs));

    const firstVisit = !localStorage.getItem("anomaLab_visited");
    if (firstVisit) {
      setShowWelcomeModal(true);
      localStorage.setItem("anomaLab_visited", "true");
    }
  }, []);

  useEffect(() => {
    const savedFavs = localStorage.getItem("briefmachine_favorites");
    if (savedFavs) setFavoritePresets(JSON.parse(savedFavs));
  }, []);

  const toggleFavorite = (preset: string) => {
    setFavoritePresets(prev => {
      const updated = prev.includes(preset) ? prev.filter(p => p !== preset) : [...prev, preset];
      localStorage.setItem("briefmachine_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== "anomaLab") return;
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        copyFullPrompt();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        beautifyPrompt();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        setSmartEditInstruction(""); // Open modal logic would go here
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        saveToHistory();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, briefMachineShot, briefMachineRawInput]);

  const exportBriefMachineJSON = () => {
    const data = {
      history: briefMachineHistory,
      storyboard: briefMachineStoryboard,
      characters: anomaLabCharacters
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BriefMachine_Export_${Date.now()}.json`;
    a.click();
  };

  const exportStoryboardText = () => {
    let text = "BRIEF MACHINE STORYBOARD EXPORT\n\n";
    briefMachineStoryboard.forEach((shot, i) => {
      text += `SHOT ${i + 1}\n`;
      text += `Subject: ${shot.subject}\n`;
      text += `Composition: ${shot.composition}\n`;
      text += `Lighting: ${shot.lighting}\n`;
      text += `Camera: ${shot.camera}\n`;
      text += `Style: ${shot.style}\n`;
      text += `Motion: ${shot.motion}\n`;
      text += `-----------------------------------\n\n`;
    });
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Storyboard_Export_${Date.now()}.txt`;
    a.click();
  };

  const saveProject = async (type: 'storyboard' | 'prompt' | 'extractor' = 'storyboard') => {
    if (!user) {
      setError("Please sign in to save your work.");
      return;
    }
    
    setIsSaving(true);
    const projectName = type === 'storyboard' ? storyboarderProjectName : 
                        type === 'prompt' ? `Anoma Lab ${new Date().toLocaleDateString()}` :
                        `Extractor ${new Date().toLocaleDateString()}`;
    
    const projectId = projectName.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now();
    const path = `storyboards/${projectId}`;
    try {
      const projectRef = doc(db, "storyboards", projectId);
      
      const projectData: any = {
        userId: user.uid,
        name: projectName,
        input: type === 'storyboard' ? storyboarderInput : "",
        frames: type === 'storyboard' ? storyboarderFrames : [],
        prompts: type === 'prompt' ? briefMachineHistory : [],
        extractedFrames: type === 'extractor' ? extractorFrames : [],
        thumbnailUrl: type === 'storyboard' ? (storyboarderFrames[0]?.visual_url || null) : 
                      type === 'extractor' ? (extractorFrames[0]?.url || null) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(projectRef, projectData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      fetchSavedProjects(user.uid);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const loadProject = (project: SavedProject) => {
    if (project.frames && project.frames.length > 0) {
      setStoryboarderProjectName(project.name);
      setStoryboarderInput(project.input || "");
      setStoryboarderFrames(project.frames);
      setView("storyboarder");
    } else if (project.prompts && project.prompts.length > 0) {
      setBriefMachineHistory(project.prompts);
      setView("anomaLab");
    } else if (project.extractedFrames && project.extractedFrames.length > 0) {
      setExtractorFrames(project.extractedFrames);
      setView("extractor");
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user) return;
    const path = `storyboards/${projectId}`;
    try {
      await deleteDoc(doc(db, "storyboards", projectId));
      fetchSavedProjects(user.uid);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Login failed:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        try {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } catch (e) {
          console.error("Error checking API key:", e);
          setHasApiKey(true); // Fallback
        }
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

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
    console.log("Firing Creative Engine... Preparing for actual generation logic.");
    if (!briefInput.trim() && !scriptInput.trim()) return;
    setError(null);
    setIsGeneratingConcepts(true);
    setLoading(true);
    
    try {
      const pastPreferences = pastRatings
        .filter(r => r.rating >= 4)
        .map(r => r.concept)
        .join("\n- ");

      // Combined prompt for Strategic Foundation, 3 Deep Concepts, and 5 Quick Provocations
      const visualContext = attachedExtractorFrames.length > 0 
        ? `\nVISUAL REFERENCES ATTACHED (${attachedExtractorFrames.length} frames):
           ${attachedExtractorFrames.map((f, i) => `Frame ${i+1}: ${f.name || 'Unnamed'} at ${f.time.toFixed(2)}s`).join('\n')}`
        : "";

      const response = await geminiService.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `USER BRIEF / INPUT: ${briefInput}${visualContext}
${scriptInput ? `\nPROVIDED SCRIPT / STORY:\n${scriptInput}\n\n(If a script/story is provided, focus on adapting it into a storyboard/shot list for the concepts.)` : ""}
TARGET VIDEO LENGTH: ${videoLength}
INSPIRATION MODE: ${inspiration.toUpperCase()}
DECADE TO DEPICT: ${decade}
MODE: ${mode === "surreal" ? "SURREAL AI (Impossible Scenarios)" : "STANDARD STRATEGY"}

HIGGSFIELD USER SELECTIONS:
- Selected Model: ${higgsfieldModel}
- Multi-Shot Sequence: ${isMultiShot || scriptInput ? "YES" : "NO"}
${isCameraPhysicsEnabled ? `- Camera Physics: 
  - Body: ${cameraPhysics.body}
  - Lens: ${cameraPhysics.lens}
  - Focal Length: ${cameraPhysics.focalLength}
  - Movements: ${cameraPhysics.movements.join(", ") || "None"}` : "- Camera Physics: None (Let AI decide)"}
${higgsfieldModel === "Click-to-Ad" ? `
CLICK-TO-AD FIELDS:
- Product URL: ${clickToAdFields.productUrl}
- Brand Intent: ${clickToAdFields.brandIntent}
- Visual Anchors: ${clickToAdFields.visualAnchors}
- Target Platform: ${clickToAdFields.targetPlatform}` : ""}

${pastPreferences ? `PAST HIGH-RATED CONCEPTS (Use these as inspiration for the style/tone the user likes):\n- ${pastPreferences}` : ""}

TASK:
1. Parse the USER BRIEF to identify the BRAND, CATEGORY, and the core TENSION/INSIGHT.
2. Generate 3 award-caliber ad concepts (Deep Concepts).
3. Generate 5 high-impact, one-line "Quick Fire" provocations specifically tailored to the TARGET VIDEO LENGTH.
4. For each concept, ensure the 'higgsfield_config' reflects the user's selected model and camera physics. If Multi-Shot is 'YES' OR a script/story is provided, provide a detailed shot breakdown (storyboard).

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
              quick_fire: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              concepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    title_options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    idea: { type: Type.STRING },
                    format: { type: Type.STRING },
                    execution: { type: Type.STRING },
                    why_it_works: { type: Type.STRING },
                    reference_energy: { type: Type.STRING },
                    risk_level: { type: Type.STRING, enum: ["safe", "brave", "dangerous"] },
                    risk_reason: { type: Type.STRING },
                    producibility: { type: Type.STRING },
                    ai_visual_prompt: { type: Type.STRING },
                    script_snippet: { type: Type.STRING },
                    storyboard: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          frame_description: { type: Type.STRING },
                          annotation: { type: Type.STRING },
                          camera_angle: { type: Type.STRING },
                          lighting: { type: Type.STRING },
                          atmosphere: { type: Type.STRING }
                        },
                        required: ["frame_description", "annotation", "camera_angle", "lighting", "atmosphere"]
                      }
                    },
                    higgsfield_config: {
                      type: Type.OBJECT,
                      properties: {
                        recommended_model: { type: Type.STRING },
                        camera_physics: {
                          type: Type.OBJECT,
                          properties: {
                            body: { type: Type.STRING },
                            lens: { type: Type.STRING },
                            focal_length: { type: Type.STRING },
                            movements: {
                              type: Type.ARRAY,
                              items: { type: Type.STRING }
                            }
                          },
                          required: ["body", "lens", "focal_length", "movements"]
                        },
                        prompt_dna: {
                          type: Type.OBJECT,
                          properties: {
                            scene_description: { type: Type.STRING },
                            camera_movement: { type: Type.STRING },
                            lens_lighting_specs: { type: Type.STRING },
                            style_reference: { type: Type.STRING },
                            duration: { type: Type.STRING }
                          },
                          required: ["scene_description", "camera_movement", "lens_lighting_specs", "style_reference", "duration"]
                        },
                        credit_estimate: { type: Type.NUMBER },
                        shot_breakdown: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              shot: { type: Type.NUMBER },
                              description: { type: Type.STRING },
                              duration: { type: Type.STRING }
                            },
                            required: ["shot", "description", "duration"]
                          }
                        }
                      },
                      required: ["recommended_model", "camera_physics", "prompt_dna", "credit_estimate", "shot_breakdown"]
                    },
                    click_to_ad_brief: {
                      type: Type.OBJECT,
                      properties: {
                        product_url: { type: Type.STRING },
                        brand_intent: { type: Type.STRING },
                        visual_anchors: { type: Type.STRING },
                        target_platform: { type: Type.STRING }
                      },
                      required: ["product_url", "brand_intent", "visual_anchors", "target_platform"]
                    },
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
                  required: ["name", "title_options", "idea", "format", "execution", "why_it_works", "reference_energy", "risk_level", "risk_reason", "producibility", "ai_visual_prompt", "cultural_hooks"]
                }
              }
            },
            required: ["brand", "category", "tension", "insight", "concepts", "quick_fire"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      setResults(parsed);
      setQuickFireResults(parsed.quick_fire || []);
      setExpandedConcept(0);
      setSelectedConcepts([]);
      
      // Save to history
      setBriefHistory(prev => {
        const next = [briefInput, ...prev.filter(b => b !== briefInput)].slice(0, 10);
        localStorage.setItem("brief_history", JSON.stringify(next));
        return next;
      });

      setView("results");
    } catch (e) {
      console.error(e);
      setError("Generation failed. The creative director is having a breakdown. Try again.");
      setView("input");
    } finally {
      setIsGeneratingConcepts(false);
      setLoading(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const storyboardRef = useRef<HTMLDivElement>(null);

  const exportStoryboard = async () => {
    if (!storyboardRef.current || storyboarderFrames.length === 0) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(storyboardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      const safeName = storyboarderProjectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      pdf.save(`${safeName}-storyboard-${Date.now()}.pdf`);
    } catch (e) {
      console.error("Export failed", e);
      setError("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportStoryboardImages = async () => {
    if (storyboarderFrames.length === 0) return;
    setIsExportingImages(true);
    try {
      const zip = new JSZip();
      const safeName = storyboarderProjectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      
      for (let i = 0; i < storyboarderFrames.length; i++) {
        const frame = storyboarderFrames[i];
        if (frame.visual_url) {
          const base64Data = frame.visual_url.split(',')[1];
          zip.file(`frame-${i + 1}.png`, base64Data, { base64: true });
        }
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeName}-images-${Date.now()}.zip`;
      link.click();
    } catch (e) {
      console.error("Image export failed", e);
      setError("Failed to export images.");
    } finally {
      setIsExportingImages(false);
    }
  };

  const handleExtractorVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 1024) {
      setError("Video file too large. Maximum size is 1GB.");
      return;
    }

    setExtractorVideoFile(file);
    const url = URL.createObjectURL(file);
    setExtractorVideoUrl(url);
    setExtractorFrames([]);
  };

  const extractFrame = useCallback(() => {
    const video = extractorVideoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = canvas.toDataURL('image/jpeg', 0.9);
    setExtractorFrames(prev => [...prev, { url: frame, time: video.currentTime }]);
  }, []);

  const autoExtractFrames = async () => {
    const video = extractorVideoRef.current;
    if (!video) return;

    setIsExtracting(true);
    setExtractorFrames([]);
    
    const duration = video.duration;
    let currentTime = 0;

    while (currentTime < duration) {
      video.currentTime = currentTime;
      await new Promise(resolve => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          extractFrame();
          resolve(null);
        };
        video.addEventListener('seeked', onSeeked);
      });
      currentTime += extractionInterval;
    }
    setIsExtracting(false);
  };

  const seekToFrameTime = (time?: number) => {
    if (time !== undefined && extractorVideoRef.current) {
      extractorVideoRef.current.currentTime = time;
      extractorVideoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const exportExtractorFramesAsZip = async () => {
    const framesToExport = selectedExtractorFrames.length > 0 
      ? extractorFrames.filter((_, i) => selectedExtractorFrames.includes(i))
      : extractorFrames;

    if (framesToExport.length === 0) return;
    setIsExporting(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("extracted-frames");
      
      framesToExport.forEach((frame, i) => {
        const base64Data = frame.url.split(',')[1];
        const fileName = frame.name || `frame-${i + 1}`;
        folder?.file(`${fileName}.${extractorExportFormat}`, base64Data, { base64: true });
      });
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `extracted-frames-${Date.now()}.zip`;
      link.click();
    } catch (e) {
      console.error("Export failed", e);
      setError("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const batchRenameFrames = () => {
    if (selectedExtractorFrames.length === 0) return;
    setExtractorFrames(prev => {
      const next = [...prev];
      // Sort indices to ensure sequential numbering matches visual order
      [...selectedExtractorFrames].sort((a, b) => a - b).forEach((idx, i) => {
        next[idx] = { ...next[idx], name: `${extractorRenamePrefix}_${String(i + 1).padStart(3, '0')}` };
      });
      return next;
    });
  };

  const sendFrameToEngine = (frame: ExtractorFrame | ExtractorFrame[]) => {
    const frames = Array.isArray(frame) ? frame : [frame];
    setAttachedExtractorFrames(frames);
    setBriefInput(`Concept inspired by ${frames.length > 1 ? "these visual references" : "this visual reference"}: [Visual Reference Attached]`);
    setView("input");
  };

  const generateExtractorBackground = async (index: number, refinement?: string) => {
    const frame = extractorFrames[index];
    if (!frame) return;
    
    setIsGeneratingExtractorBackground(index);
    try {
      const prompt = refinement 
        ? `Refine the AI-generated background for this video frame: ${refinement}. 
           Maintain the cinematic, high-end advertising style. 
           Reference the original frame for composition and color palette.`
        : `Generate an atmospheric, cinematic background for this video frame. 
           Style: High-end advertising, abstract but evocative. 
           Focus on enhancing the mood and environment while keeping the original frame's essence.`;

      const response = await geminiService.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: frame.url.split(',')[1], mimeType: "image/jpeg" } },
            { text: prompt }
          ]
        },
        config: {
          imageConfig: { aspectRatio: extractorAspectRatio }
        }
      });

      let imageUrl = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setExtractorFrames(prev => {
          const next = [...prev];
          next[index] = { ...next[index], backgroundUrl: imageUrl };
          return next;
        });
      }
    } catch (err) {
      console.error(err);
      setError("Background generation failed.");
    } finally {
      setIsGeneratingExtractorBackground(null);
      setRefiningBackgroundIndex(null);
      setBackgroundRefinementPrompt("");
    }
  };

  const sendFrameToStoryboarder = (frame: ExtractorFrame) => {
    setStoryboarderImages(prev => [...prev, frame.url]);
    setView("storyboarder");
  };

  const exportStoryboardVideo = async () => {
    if (storyboarderFrames.length === 0) return;
    setIsExportingVideo(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");

      // Use 16:9 aspect ratio for video export
      canvas.width = 1280;
      canvas.height = 720;

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const safeName = storyboarderProjectName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        link.download = `${safeName}-video-${Date.now()}.webm`;
        link.click();
      };

      recorder.start();

      for (let i = 0; i < storyboarderFrames.length; i++) {
        const frame = storyboarderFrames[i];
        if (frame.visual_url) {
          const img = new Image();
          img.src = frame.visual_url;
          await new Promise((resolve) => {
            img.onload = () => {
              // Draw black background
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Draw image centered and scaled to fit
              const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
              const x = (canvas.width / 2) - (img.width / 2) * scale;
              const y = (canvas.height / 2) - (img.height / 2) * scale;
              ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
              
              // Draw frame number
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(20, 20, 100, 40);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 20px monospace';
              ctx.fillText(`SHOT 0${i + 1}`, 30, 48);
              
              resolve(null);
            };
          });
          // Show each frame for 2 seconds
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      recorder.stop();
    } catch (e) {
      console.error("Video export failed", e);
      setError("Failed to export video. Your browser might not support MediaRecorder.");
    } finally {
      setIsExportingVideo(false);
    }
  };

  const generateIndividualFrame = async (index: number, feedback?: string) => {
    const frame = storyboarderFrames[index];
    if (!frame.frame_description) return;
    
    setIsGeneratingIndividualFrame(index);
    try {
      const prompt = feedback 
        ? `Refine this storyboard frame: ${frame.frame_description}. 
           Camera Angle: ${frame.camera_angle || 'N/A'}. 
           Lighting: ${frame.lighting || 'N/A'}. 
           Atmosphere: ${frame.atmosphere || 'N/A'}. 
           User feedback: ${feedback}. 
           Maintain the cinematic, professional storyboard sketch style.`
        : `Storyboard frame: ${frame.frame_description}. 
           Camera Angle: ${frame.camera_angle || 'N/A'}. 
           Lighting: ${frame.lighting || 'N/A'}. 
           Atmosphere: ${frame.atmosphere || 'N/A'}. 
           Cinematic, professional storyboard sketch style.`;

      const imgResponse = await geminiService.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt,
        config: {
          imageConfig: { aspectRatio: "16:9" }
        }
      });
      
      const imgPart = imgResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imgPart) {
        const newFrames = [...storyboarderFrames];
        newFrames[index] = { ...frame, visual_url: `data:image/png;base64,${imgPart.inlineData.data}` };
        setStoryboarderFrames(newFrames);
      }
    } catch (e) {
      console.error("Frame visualization failed", e);
      setError("Frame visualization failed.");
    } finally {
      setIsGeneratingIndividualFrame(null);
      setRefiningFrameIndex(null);
      setRefinementFeedback("");
    }
  };

  const addStoryboardFrame = () => {
    setStoryboarderFrames(prev => [...prev, { 
      frame_description: "", 
      annotation: "",
      camera_angle: "",
      lighting: "",
      atmosphere: ""
    }]);
  };

  const removeStoryboardFrame = (index: number) => {
    setStoryboarderFrames(prev => prev.filter((_, i) => i !== index));
  };

  const duplicateStoryboardFrame = (index: number) => {
    setStoryboarderFrames(prev => {
      const next = [...prev];
      const duplicatedFrame = { ...next[index] };
      next.splice(index + 1, 0, duplicatedFrame);
      return next;
    });
  };

  const clearStoryboard = () => {
    setStoryboarderFrames([]);
    setStoryboarderInput("");
    setStoryboarderImages([]);
    setStoryboarderProjectName("Untitled Project");
    setIsGeneratingStoryboarder(false);
    setIsGeneratingIndividualFrame(null);
    setIsExporting(false);
  };

  const sendConceptToStoryboarder = (concept: Concept) => {
    setStoryboarderInput(`${concept.idea}\n\nExecution: ${concept.execution}\n\nFormat: ${concept.format}`);
    setStoryboarderProjectName(concept.selected_title || concept.name);
    setStoryboarderFrames([]);
    setView("storyboarder");
  };

  const updateStoryboardFrame = (index: number, updates: Partial<StoryboardFrame>) => {
    setStoryboarderFrames(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const generateStoryboarder = async () => {
    if (!storyboarderInput.trim() && storyboarderImages.length === 0) return;
    setIsGeneratingStoryboarder(true);
    setError(null);
    
    try {
      const contents: any[] = [
        `TASK: Generate a storyboard based on the following input. 
        Determine the appropriate number of shots (between 4 and 12) to tell the story effectively.
        Also, provide a creative and concise project name for this storyboard.
        INPUT: ${storyboarderInput}
        
        For each frame, provide:
        - frame_description: A detailed visual description for AI image generation.
        - annotation: Director's notes (camera, sound, text).
        - camera_angle: Suggestion for camera movement or angle (e.g., 'dolly shot', 'crane shot', 'low angle', 'close-up').
        - lighting: Suggestion for lighting style (e.g., 'chiaroscuro', 'golden hour', 'high-key', 'neon').
        - atmosphere: Suggestion for the mood or atmosphere (e.g., 'gritty', 'dreamy', 'clinical', 'vibrant').`
      ];

      // Add images as context if available
      for (const img of storyboarderImages) {
        contents.push({
          inlineData: {
            data: img.split(',')[1],
            mimeType: "image/jpeg"
          }
        });
      }

      const response = await geminiService.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: { parts: contents.map(c => typeof c === 'string' ? { text: c } : c) },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              project_name: { type: Type.STRING },
              frames: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    frame_description: { type: Type.STRING },
                    annotation: { type: Type.STRING },
                    camera_angle: { type: Type.STRING },
                    lighting: { type: Type.STRING },
                    atmosphere: { type: Type.STRING }
                  },
                  required: ["frame_description", "annotation", "camera_angle", "lighting", "atmosphere"]
                }
              }
            },
            required: ["frames", "project_name"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      const frames = parsed.frames || [];
      
      if (parsed.project_name) {
        setStoryboarderProjectName(parsed.project_name);
      }
      
      // Set the text frames first so the user sees them immediately
      setStoryboarderFrames(frames);
      
      // Now visualize each frame one by one (shot by shot)
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        setIsGeneratingIndividualFrame(i);
        try {
          const imgResponse = await geminiService.generateContent({
            model: "gemini-2.5-flash-image",
            contents: `Storyboard frame: ${frame.frame_description}. Cinematic, professional storyboard sketch style.`,
            config: {
              imageConfig: { aspectRatio: "16:9" }
            }
          });
          
          const imgPart = imgResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
          if (imgPart) {
            setStoryboarderFrames(prev => {
              const next = [...prev];
              next[i] = { ...next[i], visual_url: `data:image/png;base64,${imgPart.inlineData.data}` };
              return next;
            });
          }
        } catch (e) {
          console.error(`Frame ${i} visualization failed`, e);
        } finally {
          setIsGeneratingIndividualFrame(null);
        }
      }
    } catch (e) {
      console.error(e);
      setError("Storyboard generation failed. The artist is on a coffee break.");
    } finally {
      setIsGeneratingStoryboarder(false);
    }
  };

  const handleStoryboardImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoryboarderImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFrameImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateStoryboardFrame(index, { visual_url: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const fetchTrends = async (loadMore = false) => {
    if (loadMore) setIsFetchingMoreTrends(true);
    else setView("loading");
    
    setLoadingMsg("Scanning the zeitgeist...");
    setError(null);
    try {
      const response = await geminiService.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Give me 6 ${loadMore ? 'additional ' : ''}potent cultural tensions shaping advertising RIGHT NOW in 2025-2026. ${loadMore ? 'Ensure these are different from common mainstream trends.' : ''}`,
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
                    video_hook: { type: Type.STRING }
                  },
                  required: ["name", "why_it_matters", "emotional_undercurrent", "brief_starter", "viral_concept", "video_hook"]
                }
              }
            },
            required: ["trends"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      if (loadMore && trends) {
        setTrends([...trends, ...parsed.trends]);
      } else {
        setTrends(parsed.trends);
        // Save to past trends if user is logged in
        if (user && parsed.trends.length > 0) {
          const trendDocId = `trends-${Date.now()}`;
          const trendRef = doc(db, "pastTrends", trendDocId);
          await setDoc(trendRef, {
            userId: user.uid,
            trends: parsed.trends,
            createdAt: serverTimestamp(),
          });
        }
      }
      setView("trends");
    } catch (e) {
      console.error(e);
      setError("Trend scan failed. The zeitgeist is currently unavailable.");
      if (!loadMore) setView("input");
    } finally {
      setIsFetchingMoreTrends(false);
    }
  };

  const fetchPastTrends = async () => {
    if (!user) return;
    setIsLoadingPastTrends(true);
    setView("pastTrends");
    try {
      const q = query(
        collection(db, "pastTrends"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const trendsData: PastTrend[] = [];
      querySnapshot.forEach((doc) => {
        trendsData.push({ id: doc.id, ...doc.data() } as PastTrend);
      });
      setPastTrends(trendsData);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, "pastTrends");
    } finally {
      setIsLoadingPastTrends(false);
    }
  };

  const refineConcept = async (index: number, feedback: string) => {
    if (!results || !feedback.trim()) return;
    
    // Set a local loading state for this specific concept if needed, 
    // but for now we'll just use the main loading view or a simple overlay
    setError(null);
    const originalConcept = results.concepts[index];
    
    try {
      const response = await geminiService.generateContent({
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
              title_options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              idea: { type: Type.STRING },
              format: { type: Type.STRING },
              execution: { type: Type.STRING },
              why_it_works: { type: Type.STRING },
              reference_energy: { type: Type.STRING },
              risk_level: { type: Type.STRING, enum: ["safe", "brave", "dangerous"] },
              risk_reason: { type: Type.STRING },
              producibility: { type: Type.STRING },
              ai_visual_prompt: { type: Type.STRING },
              script_snippet: { type: Type.STRING },
              storyboard: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    frame_description: { type: Type.STRING },
                    annotation: { type: Type.STRING }
                  },
                  required: ["frame_description", "annotation"]
                }
              },
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
            required: ["name", "title_options", "idea", "format", "execution", "why_it_works", "reference_energy", "risk_level", "risk_reason", "producibility", "ai_visual_prompt", "cultural_hooks"]
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

  const visualizeStoryboard = async (conceptIndex: number) => {
    if (!results) return;
    const concept = results.concepts[conceptIndex];
    if (!concept.storyboard) return;

    try {
      const updatedStoryboard = [...concept.storyboard];

      for (let i = 0; i < updatedStoryboard.length; i++) {
        const frame = updatedStoryboard[i];
        const response = await geminiService.generateContent({
          model: "gemini-2.5-flash-image",
          contents: {
            parts: [
              {
                text: `Storyboard frame for advertising concept "${concept.name}". 
                Frame Description: ${frame.frame_description}. 
                Style: Cinematic, high-end, professional lighting.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
            },
          },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            updatedStoryboard[i] = { ...frame, visual_url: `data:image/png;base64,${part.inlineData.data}` };
            break;
          }
        }
      }

      const newConcepts = [...results.concepts];
      newConcepts[conceptIndex] = { ...concept, storyboard: updatedStoryboard };
      setResults({ ...results, concepts: newConcepts });
    } catch (e) {
      console.error(e);
      setError("Storyboard visualization failed.");
    }
  };

  const generateBackground = async (index: number) => {
    if (!results) return;
    const concept = results.concepts[index];
    setError(null);
    
    try {
      const response = await geminiService.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Atmospheric background for: ${concept.ai_visual_prompt}. Style: Cinematic, high-end advertising, abstract but evocative.` }],
        },
        config: {
          imageConfig: { aspectRatio: "16:9" }
        }
      });

      let imageUrl = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        const newConcepts = [...results.concepts];
        newConcepts[index] = { ...newConcepts[index], background_url: imageUrl };
        setResults({ ...results, concepts: newConcepts });
      }
    } catch (err) {
      console.error(err);
      setError("Background generation failed.");
    }
  };

  const selectTitle = (conceptIndex: number, title: string) => {
    if (!results) return;
    const newConcepts = [...results.concepts];
    newConcepts[conceptIndex] = { ...newConcepts[conceptIndex], selected_title: title };
    setResults({ ...results, concepts: newConcepts });
  };

  const exportResultsToPDF = async () => {
    if (!results) return;
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text(results.brand.toUpperCase(), margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Category: ${results.category}`, margin, y);
    y += 20;

    // Strategy
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("STRATEGIC FOUNDATION", margin, y);
    y += 10;
    
    doc.setFontSize(10);
    doc.text("TENSION", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const tensionLines = doc.splitTextToSize(results.tension, 170);
    doc.text(tensionLines, margin, y);
    y += (tensionLines.length * 5) + 10;

    doc.setFont("helvetica", "bold");
    doc.text("INSIGHT", margin, y);
    y += 5;
    doc.setFont("helvetica", "italic");
    const insightLines = doc.splitTextToSize(`"${results.insight}"`, 170);
    doc.text(insightLines, margin, y);
    y += (insightLines.length * 5) + 20;

    // Concepts
    results.concepts.forEach((concept, i) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`CONCEPT 0${i + 1}: ${concept.selected_title || concept.name}`, margin, y);
      y += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("THE IDEA", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const ideaLines = doc.splitTextToSize(concept.idea, 170);
      doc.text(ideaLines, margin, y);
      y += (ideaLines.length * 5) + 10;

      doc.setFont("helvetica", "bold");
      doc.text("EXECUTION", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const execLines = doc.splitTextToSize(concept.execution, 170);
      doc.text(execLines, margin, y);
      y += (execLines.length * 5) + 10;

      doc.setFont("helvetica", "bold");
      doc.text("STRATEGIC LOGIC", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const logicLines = doc.splitTextToSize(concept.why_it_works, 170);
      doc.text(logicLines, margin, y);
      y += (logicLines.length * 5) + 20;
    });

    doc.save(`${results.brand.replace(/\s+/g, '_')}_Brief.pdf`);
  };

  const exportConceptToPDF = async (index: number) => {
    if (!results) return;
    const concept = results.concepts[index];
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text((concept.selected_title || concept.name).toUpperCase(), margin, y);
    y += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    const ideaLines = doc.splitTextToSize(`"${concept.idea}"`, 170);
    doc.text(ideaLines, margin, y);
    y += (ideaLines.length * 5) + 15;

    const sections = [
      { label: "STRATEGIC LOGIC", value: concept.why_it_works },
      { label: "EXECUTION", value: concept.execution },
      { label: "REFERENCE ENERGY", value: concept.reference_energy },
      { label: "PRODUCIBILITY", value: concept.producibility },
      { label: "AI VISUAL PROMPT", value: concept.ai_visual_prompt },
    ];

    sections.forEach(section => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(section.label, margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(section.value, 170);
      doc.text(lines, margin, y);
      y += (lines.length * 5) + 10;
    });

    if (concept.script_snippet) {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text("SCRIPT SNIPPET", margin, y);
      y += 5;
      doc.setFont("courier", "normal");
      const scriptLines = doc.splitTextToSize(concept.script_snippet, 170);
      doc.text(scriptLines, margin, y);
    }

    doc.save(`${(concept.selected_title || concept.name).replace(/\s+/g, '_')}_Concept.pdf`);
  };

  const exportShortlistToPDF = async () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("CREATIVE SHORTLIST", margin, y);
    y += 15;

    if (selectedTrends.length > 0 && trends) {
      doc.setFontSize(16);
      doc.text("TRENDS & CULTURAL INSIGHTS", margin, y);
      y += 10;
      selectedTrends.forEach((idx) => {
        const trend = trends[idx];
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(trend.name.toUpperCase(), margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(trend.why_it_matters, 170);
        doc.text(lines, margin, y);
        y += (lines.length * 5) + 10;
      });
      y += 10;
    }

    if (selectedConcepts.length > 0 && results) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("STRATEGIC CONCEPTS", margin, y);
      y += 10;
      selectedConcepts.forEach((idx) => {
        const concept = results.concepts[idx];
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(concept.name.toUpperCase(), margin, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        const ideaLines = doc.splitTextToSize(`"${concept.idea}"`, 170);
        doc.text(ideaLines, margin, y);
        y += (ideaLines.length * 5) + 7;
        doc.setFont("helvetica", "normal");
        const execLines = doc.splitTextToSize(`Execution: ${concept.execution}`, 170);
        doc.text(execLines, margin, y);
        y += (execLines.length * 5) + 15;
      });
    }

    if (storyboardRef.current && storyboarderFrames.length > 0) {
      doc.addPage();
      const canvas = await html2canvas(storyboardRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pageWidth = doc.internal.pageSize.getWidth();
      const imgWidth = pageWidth - (2 * margin);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("STORYBOARD", margin, 20);
      doc.addImage(imgData, 'JPEG', margin, 30, imgWidth, imgHeight);
    }

    doc.save(`Brief_Machine_Shortlist_${Date.now()}.pdf`);
  };

  const visualizeConcept = async (index: number) => {
    if (!results) return;
    const concept = results.concepts[index];
    
    try {
      const response = await geminiService.generateContent({
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

  const rateConcept = (index: number, rating: number) => {
    if (!results) return;
    const newConcepts = [...results.concepts];
    newConcepts[index] = { ...newConcepts[index], rating };
    setResults({ ...results, concepts: newConcepts });

    // Store for future generations
    setPastRatings(prev => {
      const existing = prev.findIndex(p => p.concept === newConcepts[index].name);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { concept: newConcepts[index].name, rating };
        return updated;
      }
      return [...prev, { concept: newConcepts[index].name, rating }];
    });
  };

  const generateVariations = async (index: number) => {
    if (!results) return;
    const concept = results.concepts[index];
    setIsGeneratingVariations(index);
    setError(null);

    try {
      const response = await geminiService.generateContent({
        model: "gemini-3-flash-preview",
        contents: `CORE CONCEPT: ${concept.name}
IDEA: ${concept.idea}
EXECUTION: ${concept.execution}

TASK: Generate 3 variations of this concept. Each variation should explore a slightly different angle, tone, or execution style while keeping the core insight intact.

Return as JSON matching the Concept schema (without visual_url, storyboard, etc. for now).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                title_options: { type: Type.ARRAY, items: { type: Type.STRING } },
                idea: { type: Type.STRING },
                format: { type: Type.STRING },
                execution: { type: Type.STRING },
                why_it_works: { type: Type.STRING },
                reference_energy: { type: Type.STRING },
                risk_level: { type: Type.STRING, enum: ["safe", "brave", "dangerous"] },
                risk_reason: { type: Type.STRING },
                producibility: { type: Type.STRING },
                ai_visual_prompt: { type: Type.STRING }
              },
              required: ["name", "idea", "execution", "why_it_works", "ai_visual_prompt"]
            }
          }
        }
      });

      const variations = JSON.parse(response.text);
      const newConcepts = [...results.concepts];
      newConcepts[index] = { ...concept, variations };
      setResults({ ...results, concepts: newConcepts });
    } catch (e) {
      console.error(e);
      setError("Failed to generate variations. The creative team is stuck in a meeting.");
    } finally {
      setIsGeneratingVariations(null);
    }
  };

  const visualizeVideo = async (index: number) => {
    if (!results) return;
    const concept = results.concepts[index];
    
    try {
      let operation = await geminiService.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: `A high-end, award-winning advertising video snippet for the concept "${concept.name}". 
        Execution: ${concept.execution}. 
        Cinematic, surreal, and visually arresting. 
        High-end production value, professional lighting.`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: videoAspectRatio
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await geminiService.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        // Fetch the video with the API key
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': process.env.GEMINI_API_KEY as string,
          },
        });
        const blob = await response.blob();
        const videoUrl = URL.createObjectURL(blob);

        const newConcepts = [...results.concepts];
        newConcepts[index] = { ...concept, visual_video_url: videoUrl };
        setResults({ ...results, concepts: newConcepts });
      }
    } catch (e: any) {
      console.error(e);
      if (e?.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        setError("API Key session expired. Please reconnect.");
      } else {
        setError("Video generation failed. The AI director is on strike.");
      }
    }
  };


  if (hasApiKey === false) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="font-display text-4xl text-white italic">Connect to AI Director</h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest leading-relaxed">
              To generate AI video snippets, you must connect a paid Google Cloud project with billing enabled.
            </p>
          </div>
          <button
            onClick={handleOpenKey}
            className="w-full py-4 bg-white text-black font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all"
          >
            Select API Key
          </button>
          <p className="text-zinc-700 font-mono text-[8px] uppercase tracking-widest">
            See <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">billing documentation</a> for details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-white selection:text-black">
      <div className="grain-overlay" />
      
      <div className="relative z-10 w-full px-6 md:px-12 py-12 md:py-20 max-w-[1800px] mx-auto">
        {/* Header */}
        <header className="mb-16 border-b border-zinc-800 pb-10">
          <div className="flex justify-between items-start mb-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-baseline gap-4"
            >
              <h1 className="font-display text-5xl md:text-7xl text-white tracking-tight leading-none">
                Anoma Lab
              </h1>
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em]">
                Concept Engine v2.6
              </span>
            </motion.div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <div className="font-mono text-[10px] text-white uppercase tracking-widest">{user.displayName}</div>
                    <button onClick={handleLogout} className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest hover:text-red-500 transition-colors">Sign Out</button>
                  </div>
                  {user.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-zinc-800" referrerPolicy="no-referrer" />}
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                >
                  <LogIn size={12} />
                  Sign In
                </button>
              )}
            </div>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-xs text-zinc-500 mt-6 w-full leading-relaxed"
          >
            Feed it a brand. Get back ideas that win. Powered by the same creative philosophy that wins D&AD Black Pencils.
          </motion.p>

          <nav className="flex flex-wrap gap-4 mt-8">
            {[
              { 
                id: "trends_group", 
                label: "Intelligence", 
                icon: Search, 
                active: view === "trends" || view === "pastTrends",
                subItems: [
                  { id: "trends", label: "Scanner", action: fetchTrends },
                  { id: "pastTrends", label: "Archive", action: fetchPastTrends }
                ]
              },
              { 
                id: "engine_group", 
                label: "Engine", 
                icon: Zap, 
                active: view === "input" || view === "results" || view === "prompt" || view === "anomaLab" || view === "promptEngine",
                subItems: [
                  { id: "input", label: "Concepts" },
                  { id: "prompt", label: "DNA" },
                  { id: "anomaLab", label: "Anoma Lab" },
                  { id: "promptEngine", label: "Prompt Engine" }
                ]
              },
              { 
                id: "studio_group", 
                label: "Studio", 
                icon: Layout, 
                active: view === "storyboarder" || view === "extractor",
                subItems: [
                  { id: "storyboarder", label: "Storyboard" },
                  { id: "extractor", label: "Extractor" }
                ]
              },
              { 
                id: "library_group", 
                label: "Library", 
                icon: Folder, 
                active: view === "projects" || view === "shortlist",
                subItems: [
                  { id: "projects", label: "Projects", action: user ? () => { fetchSavedProjects(user.uid); setView("projects"); } : undefined },
                  { id: "shortlist", label: "Shortlist" }
                ]
              },
            ].map((group) => (
              <div key={group.id} className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    const firstSub = group.subItems[0];
                    if (firstSub.action) firstSub.action();
                    else setView(firstSub.id as any);
                  }}
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-widest px-6 py-3 border transition-all flex items-center gap-3",
                    group.active ? "bg-white text-black border-white" : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                  )}
                >
                  <group.icon size={14} />
                  {group.label}
                </button>
                {group.active && (
                  <div className="flex gap-2 px-1">
                    {group.subItems.map(item => (
                      <button
                        key={item.id}
                        disabled={item.id === "projects" && !user}
                        onClick={() => item.action ? item.action() : setView(item.id as any)}
                        className={cn(
                          "font-mono text-[8px] uppercase tracking-widest py-1 px-2 transition-all border-b-2",
                          view === item.id ? "border-white text-white" : "border-transparent text-zinc-600 hover:text-zinc-400",
                          item.id === "projects" && !user && "opacity-30 cursor-not-allowed"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
        <main className="grid grid-cols-1 gap-12">
          {/* INPUT VIEW */}
          {view === "input" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block">
                  The Brief / Brand / Topic
                </label>
                <textarea 
                  value={briefInput}
                  onChange={(e) => setBriefInput(e.target.value)}
                  placeholder="e.g. Patagonia: Make Gen Z care about climate without guilt-tripping them. Focus on the tension between wanting to help and feeling powerless."
                  className="w-full bg-zinc-900/50 border border-zinc-800 px-6 py-6 text-xl font-display italic text-zinc-200 outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-800 min-h-[160px] resize-none"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block">
                    Script / Story (Optional)
                  </label>
                  <label className="cursor-pointer font-mono text-[9px] text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-2 transition-colors">
                    <Upload size={12} />
                    Upload File
                    <input 
                      type="file" 
                      accept=".txt,.md,.rtf,.pdf" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
                          try {
                            const arrayBuffer = await file.arrayBuffer();
                            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                            let fullText = "";
                            for (let i = 1; i <= pdf.numPages; i++) {
                              const page = await pdf.getPage(i);
                              const textContent = await page.getTextContent();
                              const pageText = textContent.items.map((item: any) => item.str).join(" ");
                              fullText += pageText + "\n\n";
                            }
                            setScriptInput(fullText);
                          } catch (err) {
                            console.error("Error reading PDF:", err);
                            alert("Failed to read PDF file.");
                          }
                        } else {
                          const reader = new FileReader();
                          reader.onload = (e) => setScriptInput(e.target?.result as string);
                          reader.readAsText(file);
                        }
                      }} 
                    />
                  </label>
                </div>
                <textarea 
                  value={scriptInput}
                  onChange={(e) => setScriptInput(e.target.value)}
                  placeholder="Paste your script or story here, or upload a text or PDF file. We'll adapt it into a storyboard/shot list..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 px-6 py-6 text-sm font-mono text-zinc-300 outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-800 min-h-[120px] resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block">
                    Inspiration Source
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "original", label: "Original", icon: <Zap size={12} /> },
                      { id: "movie", label: "Cinematic", icon: <Search size={12} /> },
                      { id: "ad", label: "Ad Remix", icon: <RefreshCcw size={12} /> },
                      { id: "viral", label: "Viral", icon: <Sparkles size={12} /> },
                      { id: "found_footage", label: "Found Footage", icon: <Video size={12} /> },
                      { id: "festival", label: "Festival Film", icon: <Film size={12} /> },
                      { id: "arthouse", label: "Art House", icon: <Palette size={12} /> },
                      { id: "feature", label: "Feature", icon: <Video size={12} /> },
                    ].map((i) => (
                      <button
                        key={i.id}
                        onClick={() => setInspiration(i.id as any)}
                        className={cn(
                          "p-3 border text-left transition-all flex flex-col gap-2",
                          inspiration === i.id 
                            ? "bg-white text-black border-white" 
                            : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          {i.icon}
                          <div className="font-mono text-[8px] uppercase tracking-widest">{i.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block">
                    Target Video Length
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[":15s", ":30s", ":60s", "3 mins", "10 mins", "30 mins", "90 mins", "Feature"].map((l) => (
                      <button
                        key={l}
                        onClick={() => setVideoLength(l)}
                        className={cn(
                          "px-3 py-3 font-mono text-[9px] uppercase tracking-widest border transition-all",
                          videoLength === l
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>

                  <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block mt-6">
                    Decade to Depict
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Modern", "2000s", "1990s", "1980s", "1970s", "Retro-Futurism"].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDecade(d)}
                        className={cn(
                          "px-3 py-3 font-mono text-[9px] uppercase tracking-widest border transition-all",
                          decade === d
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Attached Frames from Extractor */}
              {briefHistory.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block">
                      Recent Briefs
                    </label>
                    <button 
                      onClick={() => {
                        setBriefHistory([]);
                        localStorage.removeItem("brief_history");
                      }}
                      className="font-mono text-[8px] text-red-500 hover:text-red-400 uppercase tracking-widest"
                    >
                      Clear History
                    </button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {briefHistory.map((brief, i) => (
                      <button 
                        key={i}
                        onClick={() => setBriefInput(brief)}
                        className="flex-shrink-0 w-64 p-4 bg-zinc-900/30 border border-zinc-800 hover:border-zinc-600 transition-all text-left group"
                      >
                        <p className="text-[10px] text-zinc-400 line-clamp-2 group-hover:text-white transition-colors italic">
                          "{brief}"
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {attachedExtractorFrames.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block">
                      Attached Visual References ({attachedExtractorFrames.length})
                    </label>
                    <button 
                      onClick={() => setAttachedExtractorFrames([])}
                      className="font-mono text-[8px] text-red-500 hover:text-red-400 uppercase tracking-widest"
                    >
                      Remove All
                    </button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {attachedExtractorFrames.map((frame, i) => (
                      <div key={i} className="relative w-48 aspect-video flex-shrink-0 border border-zinc-800 group">
                        <img src={frame.url} className="w-full h-full object-cover" />
                        {frame.backgroundUrl && (
                          <div className="absolute inset-0 z-10">
                            <img src={frame.backgroundUrl} className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 w-full p-2 bg-black/80 font-mono text-[8px] text-white border-t border-zinc-800 z-20 flex justify-between items-center">
                          <span className="truncate max-w-[100px]">{frame.name || `Frame ${i+1}`}</span>
                          <span>{frame.time.toFixed(1)}s</span>
                        </div>
                        <button 
                          onClick={() => setAttachedExtractorFrames(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-2 right-2 w-6 h-6 bg-black/80 border border-zinc-800 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-30"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block">
                    Higgsfield Model
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["None Selected", "Cinema Studio", "Click-to-Ad", "Bullet Time", "Giant Product", "Packshot", "Macro Scene", "Commercial Faces", "ASMR Promo", "Sketch-to-Real", "Soul Cast"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setHiggsfieldModel(m)}
                        className={cn(
                          "px-3 py-3 font-mono text-[9px] uppercase tracking-widest border transition-all",
                          higgsfieldModel === m
                            ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/50"
                            : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block">
                    Sequence Type
                  </label>
                  <button
                    onClick={() => setIsMultiShot(!isMultiShot)}
                    className={cn(
                      "w-full p-4 border text-left transition-all flex items-center justify-between",
                      isMultiShot 
                        ? "bg-white text-black border-white" 
                        : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-widest">Multi-Shot Sequence</div>
                      <div className="text-[10px] opacity-70">Suggest a detailed shot breakdown</div>
                    </div>
                    <div className={cn(
                      "w-10 h-5 rounded-full relative transition-colors",
                      isMultiShot ? "bg-black" : "bg-zinc-800"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-3 h-3 rounded-full transition-all",
                        isMultiShot ? "right-1 bg-white" : "left-1 bg-zinc-600"
                      )} />
                    </div>
                  </button>
                </div>
               {/* Camera Physics Section */}
              <div className="p-8 bg-zinc-900/30 border border-zinc-800 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera size={14} className="text-zinc-500" />
                    <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Camera Physics Layer (Optional)</span>
                  </div>
                  <button
                    onClick={() => setIsCameraPhysicsEnabled(!isCameraPhysicsEnabled)}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative",
                      isCameraPhysicsEnabled ? "bg-white" : "bg-zinc-800"
                    )}
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full bg-black absolute top-1 transition-all",
                      isCameraPhysicsEnabled ? "left-6" : "left-1 bg-zinc-500"
                    )} />
                  </button>
                </div>
                
                {isCameraPhysicsEnabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <label className="font-mono text-[9px] text-zinc-700 uppercase tracking-widest">Body</label>
                        <select 
                          value={cameraPhysics.body}
                          onChange={(e) => setCameraPhysics({...cameraPhysics, body: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-400 outline-none focus:border-zinc-600"
                        >
                          {["ARRI Alexa LF", "RED V-Raptor", "Sony Venice 2", "Panavision Millennium DXL2"].map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="font-mono text-[9px] text-zinc-700 uppercase tracking-widest">Lens Type</label>
                        <select 
                          value={cameraPhysics.lens}
                          onChange={(e) => setCameraPhysics({...cameraPhysics, lens: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-400 outline-none focus:border-zinc-600"
                        >
                          {["Prime", "Anamorphic", "Zoom", "Macro", "Fish-eye"].map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="font-mono text-[9px] text-zinc-700 uppercase tracking-widest">Focal Length</label>
                        <select 
                          value={cameraPhysics.focalLength}
                          onChange={(e) => setCameraPhysics({...cameraPhysics, focalLength: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-400 outline-none focus:border-zinc-600"
                        >
                          {["14mm", "24mm", "35mm", "50mm", "85mm", "135mm"].map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="font-mono text-[9px] text-zinc-700 uppercase tracking-widest">Simultaneous Movements (Max 3)</label>
                      <div className="flex flex-wrap gap-2">
                        {["Dolly Push", "Dolly Pull", "Pan Left", "Pan Right", "Tilt Up", "Tilt Down", "Crane Up", "Crane Down", "FPV Fly-through", "Handheld Shake"].map(m => (
                          <button
                            key={m}
                            onClick={() => {
                              const current = cameraPhysics.movements;
                              if (current.includes(m)) {
                                setCameraPhysics({...cameraPhysics, movements: current.filter(x => x !== m)});
                              } else if (current.length < 3) {
                                setCameraPhysics({...cameraPhysics, movements: [...current, m]});
                              }
                            }}
                            className={cn(
                              "px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border transition-all",
                              cameraPhysics.movements.includes(m)
                                ? "bg-white text-black border-white"
                                : "bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                            )}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              </div>

              {/* Click-to-Ad Section (Conditional) */}
              <AnimatePresence>
                {higgsfieldModel === "Click-to-Ad" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 bg-zinc-900/30 border border-zinc-800 space-y-8">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-[#FF3366]" />
                        <span className="font-mono text-[10px] text-[#FF3366] uppercase tracking-widest">Click-to-Ad Configuration</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Product URL</label>
                          <input 
                            type="text"
                            value={clickToAdFields.productUrl}
                            onChange={(e) => setClickToAdFields({...clickToAdFields, productUrl: e.target.value})}
                            placeholder="https://brand.com/product"
                            className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-zinc-400 outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Target Platform</label>
                          <div className="grid grid-cols-2 gap-2">
                            {["IG Reels", "TikTok", "YouTube Shorts", "Meta Feed"].map(p => (
                              <button
                                key={p}
                                onClick={() => setClickToAdFields({...clickToAdFields, targetPlatform: p})}
                                className={cn(
                                  "px-3 py-2 font-mono text-[9px] uppercase tracking-widest border transition-all",
                                  clickToAdFields.targetPlatform === p
                                    ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/50"
                                    : "bg-zinc-950 text-zinc-600 border-zinc-800 hover:border-zinc-700"
                                )}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Brand Intent Summary</label>
                        <textarea 
                          value={clickToAdFields.brandIntent}
                          onChange={(e) => setClickToAdFields({...clickToAdFields, brandIntent: e.target.value})}
                          placeholder="What is the primary goal of this ad? (e.g. Drive sales for new winter collection)"
                          className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-zinc-400 outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700 min-h-[80px] resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Visual Anchors</label>
                        <textarea 
                          value={clickToAdFields.visualAnchors}
                          onChange={(e) => setClickToAdFields({...clickToAdFields, visualAnchors: e.target.value})}
                          placeholder="Key visual elements to maintain (e.g. Logo placement, specific product color)"
                          className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-zinc-400 outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-700 min-h-[80px] resize-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={generateConcepts}
                disabled={!briefInput.trim() && !scriptInput.trim()}
                className={cn(
                  "w-full py-8 font-display italic text-3xl transition-all duration-500 flex items-center justify-center gap-4 group shadow-2xl",
                  (briefInput.trim() || scriptInput.trim())
                    ? "bg-white text-black hover:bg-zinc-200" 
                    : "bg-zinc-900 text-zinc-700 cursor-not-allowed"
                )}
              >
                Fire Creative Engine
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
                <div className="flex justify-between items-start mb-6">
                  <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                    Strategic Foundation
                  </div>
                  <button
                    onClick={() => exportResultsToPDF()}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                  >
                    <Download size={12} />
                    Export PDF
                  </button>
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

              {/* Quick Fire Provocations */}
              {quickFireResults.length > 0 && (
                <div className="space-y-4">
                  <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                    Quick Fire Provocations
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {quickFireResults.map((idea, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-zinc-900/30 border border-zinc-800 p-6 flex gap-6 items-center group hover:border-zinc-700 transition-all"
                      >
                        <span className="font-mono text-[10px] text-zinc-700">0{idx + 1}</span>
                        <p className="font-display italic text-xl text-white flex-1 leading-tight">
                          {idea}
                        </p>
                        <button 
                          onClick={() => copyToClipboard(idea)}
                          className="text-zinc-600 group-hover:text-zinc-400 transition-colors"
                        >
                          <Copy size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Fire Provocations */}
              {quickFireResults.length > 0 && (
                <div className="space-y-4">
                  <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                    Quick Fire Provocations
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {quickFireResults.map((idea, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-zinc-900/30 border border-zinc-800 p-6 flex gap-6 items-center group hover:border-zinc-700 transition-all"
                      >
                        <span className="font-mono text-[10px] text-zinc-700">0{idx + 1}</span>
                        <p className="font-display italic text-xl text-white flex-1 leading-tight">
                          {idea}
                        </p>
                        <button 
                          onClick={() => copyToClipboard(idea)}
                          className="text-zinc-600 group-hover:text-zinc-400 transition-colors"
                        >
                          <Copy size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concepts List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                      {selectedConcepts.length} Concepts Shortlisted
                    </div>
                    {selectedConcepts.length > 0 && (
                      <button
                        onClick={() => setSelectedConcepts([])}
                        className="font-mono text-[10px] text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors"
                      >
                        Clear Shortlist
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {selectedConcepts.length >= 2 && (
                      <button
                        onClick={() => setView("compare")}
                        className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
                      >
                        Compare Side-by-Side
                      </button>
                    )}
                    <button
                      onClick={() => setView("shortlist")}
                      className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-2"
                    >
                      <Check size={12} />
                      View Shortlist
                    </button>
                  </div>
                </div>
                {/* Rating Filter */}
                <div className="flex items-center gap-4 mb-8 px-2">
                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Filter by Rating:</span>
                  <div className="flex gap-1">
                    {[0, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        onClick={() => setFilterRating(stars)}
                        className={cn(
                          "px-3 py-1 font-mono text-[10px] border transition-all",
                          filterRating === stars 
                            ? "bg-white text-black border-white" 
                            : "text-zinc-500 border-zinc-800 hover:border-zinc-600"
                        )}
                      >
                        {stars === 0 ? "ALL" : `${stars}+ STARS`}
                      </button>
                    ))}
                  </div>
                </div>

                {results.concepts.map((concept, idx) => {
                  if (filterRating && (concept.rating || 0) < filterRating) return null;
                  return (
                    <ConceptCard 
                      key={idx}
                      index={idx}
                      concept={concept}
                      isExpanded={expandedConcept === idx}
                      isSelected={selectedConcepts.includes(idx)}
                      onToggle={() => setExpandedConcept(expandedConcept === idx ? null : idx)}
                      onCompare={() => {
                        if (selectedConcepts.includes(idx)) {
                          setSelectedConcepts(selectedConcepts.filter(i => i !== idx));
                        } else if (selectedConcepts.length < 3) {
                          setSelectedConcepts([...selectedConcepts, idx]);
                        }
                      }}
                      onRefine={(feedback) => refineConcept(idx, feedback)}
                      onVisualize={() => visualizeConcept(idx)}
                      onVisualizeVideo={() => visualizeVideo(idx)}
                      onVisualizeStoryboard={() => visualizeStoryboard(idx)}
                      onGenerateBackground={() => generateBackground(idx)}
                      onSelectTitle={(title) => selectTitle(idx, title)}
                      onExportPDF={() => exportConceptToPDF(idx)}
                      onCopy={copyToClipboard}
                      onRate={(rating) => rateConcept(idx, rating)}
                      onGenerateVariations={() => generateVariations(idx)}
                      onSendToStoryboarder={() => sendConceptToStoryboarder(concept)}
                      isGeneratingVariations={isGeneratingVariations === idx}
                      videoAspectRatio={videoAspectRatio}
                      onSetVideoAspectRatio={setVideoAspectRatio}
                    />
                  );
                })}
              </div>

              {/* Related Trends Integration */}
              {trends && (
                <div className="space-y-6 pt-12 border-t border-zinc-800">
                  <div className="flex justify-between items-center">
                    <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                      Related Cultural Trends
                    </div>
                    <button 
                      onClick={() => setView("trends")}
                      className="font-mono text-[10px] text-white hover:underline uppercase tracking-widest"
                    >
                      View All Trends
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trends.slice(0, 2).map((trend, idx) => (
                      <div key={idx} className="bg-zinc-900/30 border border-zinc-800 p-6 space-y-4">
                        <h4 className="font-display text-xl text-white italic">{trend.name}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{trend.why_it_matters}</p>
                        <button
                          onClick={() => {
                            if (selectedTrends.includes(idx)) {
                              setSelectedTrends(selectedTrends.filter(i => i !== idx));
                            } else {
                              setSelectedTrends([...selectedTrends, idx]);
                            }
                          }}
                          className={cn(
                            "w-full py-2 border font-mono text-[9px] uppercase tracking-widest transition-all",
                            selectedTrends.includes(idx) ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-500 hover:text-white"
                          )}
                        >
                          {selectedTrends.includes(idx) ? "Shortlisted" : "Shortlist Trend"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {selectedConcepts.length >= 2 && view === "results" && (
                  <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
                  >
                    <button
                      onClick={() => setView("compare")}
                      className="bg-white text-black px-8 py-4 font-display italic text-xl shadow-2xl hover:scale-105 transition-all flex items-center gap-4"
                    >
                      Compare {selectedConcepts.length} Concepts
                      <ArrowRight size={20} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

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
              className="space-y-12"
            >
              <div className="grid grid-cols-1 gap-4">
                {trends.map((trend, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => setSelectedTrend(trend)}
                    className="group bg-zinc-900/30 border border-zinc-800 p-8 hover:border-zinc-600 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-display text-2xl text-white group-hover:text-zinc-200 transition-colors">
                        {trend.name}
                      </h3>
                      <ChevronRight className="text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                    <p className="text-sm text-zinc-400 mb-6 leading-relaxed line-clamp-2">{trend.why_it_matters}</p>
                    
                    <div className="mt-6 flex flex-wrap gap-3 pt-6 border-t border-zinc-800/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBriefInput(trend.viral_concept);
                          setView("input");
                        }}
                        className="px-4 py-2 bg-white text-black font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2"
                      >
                        <Zap size={12} />
                        Send to Creative Engine
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStoryboarderInput(trend.viral_concept);
                          setStoryboarderProjectName(trend.name);
                          setStoryboarderFrames([]);
                          setView("storyboarder");
                        }}
                        className="px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 font-mono text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                      >
                        <Layout size={12} />
                        Auto Storyboard
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedTrends.includes(idx)) {
                            setSelectedTrends(selectedTrends.filter(i => i !== idx));
                          } else {
                            setSelectedTrends([...selectedTrends, idx]);
                          }
                        }}
                        className={cn(
                          "px-4 py-2 border font-mono text-[10px] uppercase tracking-widest transition-all flex items-center gap-2",
                          selectedTrends.includes(idx)
                            ? "bg-white text-black border-white"
                            : "border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600"
                        )}
                      >
                        {selectedTrends.includes(idx) ? <Check size={12} /> : <Plus size={12} />}
                        {selectedTrends.includes(idx) ? "Shortlisted" : "Shortlist"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center pt-8">
                <button
                  onClick={() => fetchTrends(true)}
                  disabled={isFetchingMoreTrends}
                  className="font-mono text-[10px] uppercase tracking-widest px-8 py-4 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isFetchingMoreTrends ? <RefreshCcw size={12} className="animate-spin" /> : <Plus size={12} />}
                  Load More Trends
                </button>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {selectedTrend && (
              <TrendDetailModal 
                trend={selectedTrend} 
                onClose={() => setSelectedTrend(null)}
                onSendToEngine={(concept) => {
                  setBriefInput(concept);
                  setView("input");
                  setSelectedTrend(null);
                }}
                onSendToStoryboarder={(concept, name) => {
                  setStoryboarderInput(concept);
                  setStoryboarderProjectName(name);
                  setStoryboarderFrames([]);
                  setView("storyboarder");
                  setSelectedTrend(null);
                }}
                videoAspectRatio={videoAspectRatio}
                onSetVideoAspectRatio={setVideoAspectRatio}
              />
            )}
          </AnimatePresence>

          {/* BRIEF MACHINE LAB VIEW */}
          {view === "anomaLab" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "flex overflow-hidden font-sans min-h-[calc(100vh-200px)] border transition-all duration-500",
                anomaLabTheme === "dark" ? "bg-black text-[#e0e0e0] border-zinc-800" : 
                anomaLabTheme === "light" ? "bg-zinc-50 text-zinc-900 border-zinc-200" : 
                "bg-black text-yellow-400 border-yellow-400"
              )}
            >
              {/* Left Sidebar */}
              <AnimatePresence>
                {isAnomaLabSidebarOpen && (
                  <motion.div 
                    initial={{ x: -300 }}
                    animate={{ x: 0 }}
                    exit={{ x: -300 }}
                    className={cn(
                      "w-[300px] border-r flex flex-col transition-colors duration-500",
                      anomaLabTheme === "dark" ? "bg-black border-zinc-800" : 
                      anomaLabTheme === "light" ? "bg-white border-zinc-200" : 
                      "bg-black border-yellow-400"
                    )}
                  >
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                      {/* THEME SWITCHER */}
                      <div className={cn(
                        "p-4 border-b flex items-center justify-between",
                        anomaLabTheme === "dark" ? "border-zinc-900" : 
                        anomaLabTheme === "light" ? "border-zinc-100" : 
                        "border-yellow-900"
                      )}>
                        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">Theme</span>
                        <div className="flex gap-1">
                          {(["dark", "light", "high-contrast"] as const).map(t => (
                            <button 
                              key={t}
                              onClick={() => setAnomaLabTheme(t)}
                              className={cn(
                                "w-6 h-6 rounded flex items-center justify-center border transition-all",
                                anomaLabTheme === t ? "border-[#c87941] bg-[#c87941]/10" : "border-zinc-800 hover:border-zinc-600"
                              )}
                              title={t.charAt(0).toUpperCase() + t.slice(1)}
                            >
                              {t === "dark" && <Moon size={10} />}
                              {t === "light" && <Sun size={10} />}
                              {t === "high-contrast" && <Eye size={10} />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* STUDIO SECTION */}
                      <div className="border-b border-zinc-900">
                        <button 
                          onClick={() => setExpandedLabSections(prev => prev.includes("studio") ? prev.filter(s => s !== "studio") : [...prev, "studio"])}
                          className="w-full flex items-center justify-between p-4 font-mono text-[10px] uppercase tracking-widest text-[#c87941] hover:bg-zinc-900/50 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <Layers size={12} />
                            Studio
                          </div>
                          {expandedLabSections.includes("studio") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                        
                        <AnimatePresence>
                          {expandedLabSections.includes("studio") && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-zinc-950/30"
                            >
                              <div className="p-4 space-y-6">
                                <div className="space-y-4">
                                  <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg space-y-4">
                                    <h4 className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Quick Create</h4>
                                    <input 
                                      type="text"
                                      placeholder="Character Name..."
                                      className="w-full bg-black border border-zinc-800 p-3 text-xs text-white focus:border-[#c87941] outline-none"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const name = e.currentTarget.value;
                                          if (name) {
                                            addCharacter({ name, description: "", wardrobe: "", personality: "", notes: "" });
                                            e.currentTarget.value = "";
                                          }
                                        }
                                      }}
                                    />
                                    <p className="text-[9px] text-zinc-600 italic">Press Enter to add to studio</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  {anomaLabCharacters.map(char => (
                                    <div key={char.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg space-y-3 group hover:border-zinc-700 transition-all">
                                      <div className="flex items-center gap-3">
                                        <div 
                                          className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[10px] text-white shadow-lg"
                                          style={{ backgroundColor: char.color }}
                                        >
                                          {char.initials}
                                        </div>
                                        <div className="flex-1">
                                          <input 
                                            type="text"
                                            value={char.name}
                                            onChange={(e) => {
                                              const updated = anomaLabCharacters.map(c => c.id === char.id ? { ...c, name: e.target.value } : c);
                                              setBriefMachineCharacters(updated);
                                              localStorage.setItem("anomaLab_characters", JSON.stringify(updated));
                                            }}
                                            className="bg-transparent border-none p-0 text-xs font-bold text-white focus:ring-0 w-full"
                                          />
                                          <textarea 
                                            value={char.description}
                                            onChange={(e) => {
                                              const updated = anomaLabCharacters.map(c => c.id === char.id ? { ...c, name: e.target.value } : c);
                                              setBriefMachineCharacters(updated);
                                              localStorage.setItem("anomaLab_characters", JSON.stringify(updated));
                                            }}
                                            placeholder="Role/Description..."
                                            className="bg-transparent border-none p-0 text-[10px] text-zinc-500 focus:ring-0 w-full resize-none h-4"
                                          />
                                        </div>
                                        <button 
                                          onClick={() => deleteCharacter(char.id)}
                                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all p-1"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <button 
                                          onClick={() => insertCharacter(char)}
                                          className="py-2 bg-zinc-800 text-zinc-300 font-mono text-[9px] uppercase tracking-widest hover:bg-zinc-700 transition-all border border-zinc-700"
                                        >
                                          Insert
                                        </button>
                                        <button 
                                          onClick={() => {
                                            const desc = prompt("Update description?", char.description);
                                            const wardrobe = prompt("Update wardrobe?", char.wardrobe);
                                            if (desc !== null || wardrobe !== null) {
                                              const updated = anomaLabCharacters.map(c => c.id === char.id ? { 
                                                ...c, 
                                                description: desc ?? c.description,
                                                wardrobe: wardrobe ?? c.wardrobe
                                              } : c);
                                              setBriefMachineCharacters(updated);
                                              localStorage.setItem("anomaLab_characters", JSON.stringify(updated));
                                            }
                                          }}
                                          className="py-2 bg-zinc-900 text-zinc-500 font-mono text-[9px] uppercase tracking-widest hover:text-white transition-all border border-zinc-800"
                                        >
                                          Edit
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* PRESETS SECTION */}
                      <div className={cn(
                        "border-b",
                        anomaLabTheme === "dark" ? "border-zinc-900" : 
                        anomaLabTheme === "light" ? "border-zinc-100" : 
                        "border-yellow-900"
                      )}>
                        <button 
                          onClick={() => setExpandedLabSections(prev => prev.includes("presets") ? prev.filter(s => s !== "presets") : [...prev, "presets"])}
                          className="w-full flex items-center justify-between p-4 font-mono text-[10px] uppercase tracking-widest text-[#c87941] hover:bg-zinc-900/50 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles size={12} />
                            Presets
                          </div>
                          {expandedLabSections.includes("presets") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>

                        <AnimatePresence>
                          {expandedLabSections.includes("presets") && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className={cn(
                                "overflow-hidden",
                                anomaLabTheme === "dark" ? "bg-zinc-950/30" : 
                                anomaLabTheme === "light" ? "bg-zinc-50" : 
                                "bg-black"
                              )}
                            >
                              <div className="p-4 space-y-2">
                                {/* FAVORITES CATEGORY */}
                                {favoritePresets.length > 0 && (
                                  <div className="border border-[#c87941]/30 rounded overflow-hidden mb-4">
                                    <div className="w-full flex items-center justify-between p-2 bg-[#c87941]/5">
                                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#c87941] flex items-center gap-2">
                                        <Star size={10} fill="#c87941" /> Favorites
                                      </span>
                                    </div>
                                    <div className="p-2 grid grid-cols-1 gap-1">
                                      {favoritePresets.map(item => (
                                        <div key={item} className="flex items-center group">
                                          <button 
                                            onClick={() => {
                                              // We don't know the category here easily, so we just apply it to subject or try to find it
                                              // For now, let's just use it as a generic insert if we can't find category
                                              setBriefMachineShot(prev => ({ ...prev, subject: prev.subject ? `${prev.subject}, ${item}` : item }));
                                            }}
                                            className={cn(
                                              "flex-1 text-left py-2 px-3 text-[11px] transition-all rounded border border-transparent",
                                              anomaLabTheme === "dark" ? "text-zinc-400 hover:bg-zinc-900 hover:text-white hover:border-zinc-800" : 
                                              anomaLabTheme === "light" ? "text-zinc-600 hover:bg-zinc-100 hover:text-black hover:border-zinc-200" : 
                                              "text-yellow-600 hover:bg-zinc-900 hover:text-yellow-400 hover:border-yellow-400"
                                            )}
                                          >
                                            {item}
                                          </button>
                                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                              onClick={() => copyToClipboard(item)}
                                              className="p-2 text-zinc-500 hover:text-white"
                                              title="Copy Preset"
                                            >
                                              <Copy size={10} />
                                            </button>
                                            <button 
                                              onClick={() => toggleFavorite(item)}
                                              className="p-2 text-[#c87941]"
                                              title="Remove from Favorites"
                                            >
                                              <Star size={10} fill="#c87941" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {Object.entries(BRIEF_MACHINE_PRESETS).map(([category, items]) => (
                                  <div key={category} className={cn(
                                    "border rounded overflow-hidden",
                                    anomaLabTheme === "dark" ? "border-zinc-900" : 
                                    anomaLabTheme === "light" ? "border-zinc-200" : 
                                    "border-yellow-900"
                                  )}>
                                    <button 
                                      onClick={() => setExpandedPresetCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category])}
                                      className={cn(
                                        "w-full flex items-center justify-between p-2 transition-all",
                                        anomaLabTheme === "dark" ? "bg-zinc-900/50 hover:bg-zinc-900" : 
                                        anomaLabTheme === "light" ? "bg-zinc-100 hover:bg-zinc-200" : 
                                        "bg-zinc-900 hover:bg-zinc-800"
                                      )}
                                    >
                                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">{category}</span>
                                      {expandedPresetCategories.includes(category) ? <ChevronDown size={10} className="text-zinc-600" /> : <ChevronRight size={10} className="text-zinc-600" />}
                                    </button>
                                    
                                    <AnimatePresence>
                                      {expandedPresetCategories.includes(category) && (
                                        <motion.div 
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="p-2 grid grid-cols-1 gap-1">
                                            {items.map(item => (
                                              <div key={item} className="flex items-center group">
                                                <button 
                                                  onClick={() => {
                                                    const key = category === "cameras" ? "camera" : 
                                                                category === "lenses" ? "camera" :
                                                                category === "filmStocks" ? "camera" :
                                                                category.slice(0, -1) as keyof BriefMachineShot;
                                                    
                                                    setBriefMachineShot(prev => {
                                                      let val = prev[key as keyof BriefMachineShot] || "";
                                                      if (category === "cameras" || category === "lenses" || category === "filmStocks") {
                                                        val = val ? `${val}, ${item}` : item;
                                                        return { ...prev, camera: val };
                                                      }
                                                      return { ...prev, [key]: item };
                                                    });
                                                  }}
                                                  className={cn(
                                                    "flex-1 text-left py-2 px-3 text-[11px] transition-all rounded border border-transparent",
                                                    anomaLabTheme === "dark" ? "text-zinc-500 hover:bg-zinc-900 hover:text-white hover:border-zinc-800" : 
                                                    anomaLabTheme === "light" ? "text-zinc-600 hover:bg-zinc-100 hover:text-black hover:border-zinc-200" : 
                                                    "text-yellow-600 hover:bg-zinc-900 hover:text-yellow-400 hover:border-yellow-400"
                                                  )}
                                                >
                                                  {item}
                                                </button>
                                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button 
                                                    onClick={() => copyToClipboard(item)}
                                                    className="p-2 text-zinc-500 hover:text-white"
                                                    title="Copy Preset"
                                                  >
                                                    <Copy size={10} />
                                                  </button>
                                                  <button 
                                                    onClick={() => toggleFavorite(item)}
                                                    className={cn(
                                                      "p-2 transition-colors",
                                                      favoritePresets.includes(item) ? "text-[#c87941]" : "text-zinc-500 hover:text-white"
                                                    )}
                                                    title={favoritePresets.includes(item) ? "Remove from Favorites" : "Add to Favorites"}
                                                  >
                                                    <Star size={10} fill={favoritePresets.includes(item) ? "#c87941" : "none"} />
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* HISTORY SECTION */}
                      <div className="border-b border-zinc-900">
                        <button 
                          onClick={() => setExpandedLabSections(prev => prev.includes("history") ? prev.filter(s => s !== "history") : [...prev, "history"])}
                          className="w-full flex items-center justify-between p-4 font-mono text-[10px] uppercase tracking-widest text-[#c87941] hover:bg-zinc-900/50 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <History size={12} />
                            History
                          </div>
                          {expandedLabSections.includes("history") ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>

                        <AnimatePresence>
                          {expandedLabSections.includes("history") && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-zinc-950/30"
                            >
                              <div className="p-4">
                                <BriefMachineHistoryComponent 
                                  history={briefMachineHistory}
                                  onSelect={setBriefMachineShot}
                                  onDelete={(id) => {
                                    const updated = briefMachineHistory.filter(h => h.id !== id);
                                    setBriefMachineHistory(updated);
                                    localStorage.setItem("anomaLab_history", JSON.stringify(updated));
                                  }}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toggle Sidebar */}
              <button 
                onClick={() => setIsBriefMachineSidebarOpen(!isAnomaLabSidebarOpen)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-zinc-900 border border-zinc-800 p-1 text-zinc-500 hover:text-white transition-all"
                style={{ left: isAnomaLabSidebarOpen ? "300px" : "0" }}
              >
                {isAnomaLabSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>

              {/* Main Area */}
              <div className={cn(
                "flex-1 flex flex-col overflow-hidden transition-colors duration-500",
                anomaLabTheme === "dark" ? "bg-black" : 
                anomaLabTheme === "light" ? "bg-white" : 
                "bg-black"
              )}>
                {/* Toolbar */}
                <div className={cn(
                  "h-[60px] border-b flex items-center justify-between px-6 backdrop-blur-md z-30 transition-colors duration-500",
                  anomaLabTheme === "dark" ? "border-zinc-800 bg-black/80" : 
                  anomaLabTheme === "light" ? "border-zinc-200 bg-white/80" : 
                  "border-yellow-400 bg-black/80"
                )}>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-4 w-[1px]",
                      anomaLabTheme === "dark" ? "bg-zinc-800" : 
                      anomaLabTheme === "light" ? "bg-zinc-200" : 
                      "bg-yellow-400"
                    )} />
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={beautifyPrompt}
                        disabled={isBeautifying}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 border transition-all rounded font-mono text-[10px] uppercase tracking-widest disabled:opacity-50",
                          anomaLabTheme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600" : 
                          anomaLabTheme === "light" ? "bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-black hover:border-zinc-400" : 
                          "bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                        )}
                      >
                        {isBeautifying ? <RefreshCcw size={12} className="animate-spin" /> : <Sparkles size={12} className={anomaLabTheme === "high-contrast" ? "text-yellow-400" : "text-[#c87941]"} />}
                        Beautify
                      </button>
                      <button 
                        onClick={() => {
                          const inst = prompt("Smart Edit Instruction? (e.g. 'make it more dramatic')");
                          if (inst) smartEditPrompt(inst);
                        }}
                        disabled={isSmartEditing}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 border transition-all rounded font-mono text-[10px] uppercase tracking-widest disabled:opacity-50",
                          anomaLabTheme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600" : 
                          anomaLabTheme === "light" ? "bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-black hover:border-zinc-400" : 
                          "bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                        )}
                      >
                        {isSmartEditing ? <RefreshCcw size={12} className="animate-spin" /> : <Code size={12} className={anomaLabTheme === "high-contrast" ? "text-yellow-400" : "text-cyan-500"} />}
                        Smart Edit
                      </button>
                      <button 
                        onClick={expandPrompt}
                        disabled={isExpanding}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 border transition-all rounded font-mono text-[10px] uppercase tracking-widest disabled:opacity-50",
                          anomaLabTheme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600" : 
                          anomaLabTheme === "light" ? "bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-black hover:border-zinc-400" : 
                          "bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                        )}
                      >
                        {isExpanding ? <RefreshCcw size={12} className="animate-spin" /> : <Maximize2 size={12} className={anomaLabTheme === "high-contrast" ? "text-yellow-400" : "text-purple-500"} />}
                        Expand
                      </button>
                      <button 
                        onClick={simplifyPrompt}
                        disabled={isSimplifying}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 border transition-all rounded font-mono text-[10px] uppercase tracking-widest disabled:opacity-50",
                          anomaLabTheme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600" : 
                          anomaLabTheme === "light" ? "bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-black hover:border-zinc-400" : 
                          "bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                        )}
                      >
                        {isSimplifying ? <RefreshCcw size={12} className="animate-spin" /> : <Minus size={12} className={anomaLabTheme === "high-contrast" ? "text-yellow-400" : "text-zinc-500"} />}
                        Simplify
                      </button>
                      <button 
                        onClick={rollPrompt}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 border transition-all rounded font-mono text-[10px] uppercase tracking-widest",
                          anomaLabTheme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600" : 
                          anomaLabTheme === "light" ? "bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-black hover:border-zinc-400" : 
                          "bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                        )}
                      >
                        <RefreshCcw size={12} className={anomaLabTheme === "high-contrast" ? "text-yellow-400" : "text-orange-500"} />
                        Roll
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {user && (
                      <button 
                        onClick={() => saveProject('prompt')}
                        disabled={isSaving}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 border transition-all rounded font-mono text-[10px] uppercase tracking-widest",
                          anomaLabTheme === "dark" ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600" : 
                          anomaLabTheme === "light" ? "bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-black hover:border-zinc-400" : 
                          "bg-black border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                        )}
                      >
                        {isSaving ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Anoma Lab
                      </button>
                    )}
                    <button 
                      onClick={copyFullPrompt}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 transition-all rounded font-mono text-[10px] uppercase tracking-widest shadow-lg",
                        anomaLabTheme === "high-contrast" ? "bg-yellow-400 text-black shadow-yellow-400/20" : "bg-[#c87941] text-white hover:bg-[#b06a38] shadow-[#c87941]/20"
                      )}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy Prompt"}
                    </button>
                    <button 
                      onClick={clearPrompt}
                      className={cn(
                        "p-2 transition-all",
                        anomaLabTheme === "high-contrast" ? "text-yellow-600 hover:text-yellow-400" : "text-zinc-600 hover:text-red-500"
                      )}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                  <div className="max-w-4xl mx-auto space-y-10">
                    {/* Raw Input */}
                    <div className="space-y-3">
                      <label className={cn(
                        "font-mono text-[10px] uppercase tracking-widest block",
                        anomaLabTheme === "dark" ? "text-zinc-600" : 
                        anomaLabTheme === "light" ? "text-zinc-400" : 
                        "text-yellow-600"
                      )}>Raw Input / Paste Area</label>
                      <textarea 
                        value={briefMachineRawInput}
                        onChange={(e) => setBriefMachineRawInput(e.target.value)}
                        placeholder="Paste messy text here and click 'Beautify'..."
                        className={cn(
                          "w-full border p-4 font-mono text-xs focus:outline-none transition-all min-h-[80px] resize-none",
                          anomaLabTheme === "dark" ? "bg-black/30 border-zinc-800 text-zinc-300 focus:border-[#c87941]" : 
                          anomaLabTheme === "light" ? "bg-white border-zinc-200 text-zinc-700 focus:border-zinc-400" : 
                          "bg-black border-yellow-400 text-yellow-400 focus:border-yellow-200"
                        )}
                      />
                    </div>

                    {/* Structured Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        { key: "subject", label: "Subject", color: "text-white", accent: "border-white" },
                        { key: "composition", label: "Composition", color: "text-cyan-400", accent: "border-cyan-900" },
                        { key: "lighting", label: "Lighting", color: "text-orange-400", accent: "border-orange-900" },
                        { key: "camera", label: "Camera", color: "text-purple-400", accent: "border-purple-900" },
                        { key: "style", label: "Style", color: "text-emerald-400", accent: "border-emerald-900" },
                        { key: "motion", label: "Motion", color: "text-pink-400", accent: "border-pink-900" }
                      ].map(section => (
                        <div key={section.key} className="space-y-3">
                          <label className={cn(
                            "font-mono text-[10px] uppercase tracking-widest block",
                            anomaLabTheme === "high-contrast" ? "text-yellow-400" : section.color
                          )}>
                            {section.label}
                          </label>
                          <textarea 
                            value={briefMachineShot[section.key as keyof BriefMachineShot] || ""}
                            onChange={(e) => setBriefMachineShot(prev => ({ ...prev, [section.key]: e.target.value }))}
                            className={cn(
                              "w-full border p-4 font-sans text-sm focus:outline-none transition-all min-h-[100px] resize-none",
                              anomaLabTheme === "dark" ? "bg-black/20 border-zinc-800 text-zinc-200 focus:border-[#c87941]" : 
                              anomaLabTheme === "light" ? "bg-white border-zinc-200 text-zinc-800 focus:border-zinc-400" : 
                              "bg-black border-yellow-400 text-yellow-400 focus:border-yellow-200",
                              anomaLabTheme === "high-contrast" ? "border-yellow-400" : section.accent
                            )}
                            placeholder={`Describe ${section.label.toLowerCase()}...`}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Preview Area */}
                    <div className={cn(
                      "border p-8 rounded-lg space-y-6 transition-colors duration-500",
                      anomaLabTheme === "dark" ? "bg-black/40 border-zinc-800" : 
                      anomaLabTheme === "light" ? "bg-zinc-50 border-zinc-200" : 
                      "bg-black border-yellow-400"
                    )}>
                      <div className="flex justify-between items-center">
                        <label className={cn(
                          "font-mono text-[10px] uppercase tracking-widest block",
                          anomaLabTheme === "dark" ? "text-zinc-600" : 
                          anomaLabTheme === "light" ? "text-zinc-400" : 
                          "text-yellow-600"
                        )}>Full Prompt Preview</label>
                        <button 
                          onClick={copyFullPrompt}
                          className={cn(
                            "transition-all",
                            anomaLabTheme === "dark" ? "text-zinc-500 hover:text-white" : 
                            anomaLabTheme === "light" ? "text-zinc-400 hover:text-black" : 
                            "text-yellow-600 hover:text-yellow-400"
                          )}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      <div className={cn(
                        "font-mono text-sm leading-relaxed",
                        anomaLabTheme === "light" ? "text-zinc-800" : "text-white"
                      )}>
                        <span className={cn(
                          anomaLabTheme === "light" ? "text-black" : 
                          anomaLabTheme === "high-contrast" ? "text-yellow-400" : 
                          "text-white"
                        )}>{briefMachineShot.subject}</span>
                        {briefMachineShot.composition && <span className={anomaLabTheme === "high-contrast" ? "text-yellow-400" : "text-cyan-400"}>. {briefMachineShot.composition}</span>}
                        {briefMachineShot.lighting && <span className={anomaLabTheme === "high-contrast" ? "text-yellow-400" : "text-orange-400"}>. {briefMachineShot.lighting}</span>}
                        {briefMachineShot.camera && <span className={anomaLabTheme === "high-contrast" ? "text-yellow-400" : "text-purple-400"}>. {briefMachineShot.camera}</span>}
                        {briefMachineShot.style && <span className={anomaLabTheme === "high-contrast" ? "text-yellow-400" : "text-emerald-400"}>. {briefMachineShot.style}</span>}
                        {briefMachineShot.motion && <span className={anomaLabTheme === "high-contrast" ? "text-yellow-400" : "text-pink-400"}>. {briefMachineShot.motion}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Storyboard Mode Strip */}
                {isStoryboardMode && (
                  <div className={cn(
                    "h-[180px] border-t p-4 flex gap-4 overflow-x-auto scrollbar-hide transition-colors duration-500",
                    anomaLabTheme === "dark" ? "border-zinc-800 bg-black/50" : 
                    anomaLabTheme === "light" ? "border-zinc-200 bg-zinc-50" : 
                    "border-yellow-400 bg-black/50"
                  )}>
                    {briefMachineStoryboard.map((shot, i) => (
                      <div 
                        key={i}
                        onClick={() => setBriefMachineShot(shot)}
                        className={cn(
                          "w-60 h-full border flex-shrink-0 cursor-pointer group relative overflow-hidden transition-all",
                          anomaLabTheme === "dark" ? "bg-zinc-900 border-zinc-800 hover:border-zinc-600" : 
                          anomaLabTheme === "light" ? "bg-white border-zinc-200 hover:border-zinc-400" : 
                          "bg-black border-yellow-400 hover:border-yellow-200",
                          briefMachineShot.id === shot.id && "border-[#c87941] ring-1 ring-[#c87941]"
                        )}
                      >
                        <div className={cn(
                          "absolute top-2 left-2 z-10 px-2 py-0.5 rounded font-mono text-[8px]",
                          anomaLabTheme === "light" ? "bg-zinc-200 text-zinc-800" : "bg-black/80 text-white"
                        )}>
                          Shot {i + 1}
                        </div>
                        {shot.imageUrl ? (
                          <img src={shot.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <div className={cn(
                            "w-full h-full flex items-center justify-center",
                            anomaLabTheme === "light" ? "text-zinc-300" : "text-zinc-800"
                          )}>
                            <ImageIcon size={32} />
                          </div>
                        )}
                        <div className={cn(
                          "absolute bottom-0 left-0 w-full p-2 border-t",
                          anomaLabTheme === "dark" ? "bg-black/80 border-zinc-800" : 
                          anomaLabTheme === "light" ? "bg-white/90 border-zinc-100" : 
                          "bg-black/80 border-yellow-400"
                        )}>
                          <p className={cn(
                            "text-[9px] line-clamp-1 font-mono",
                            anomaLabTheme === "light" ? "text-zinc-600" : "text-zinc-400"
                          )}>{shot.subject}</p>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newShot = { ...briefMachineShot, id: Date.now().toString() };
                        setBriefMachineStoryboard([...briefMachineStoryboard, newShot]);
                      }}
                      className="w-60 h-full border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-600 hover:text-white hover:border-zinc-600 transition-all flex-shrink-0"
                    >
                      <Plus size={24} />
                      <span className="font-mono text-[10px] uppercase tracking-widest mt-2">Add Shot</span>
                    </button>
                  </div>
                )}

                {/* Bottom Bar */}
                <div className="h-[40px] border-t border-zinc-800 bg-black flex items-center justify-between px-6">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setIsStoryboardMode(!isStoryboardMode)}
                      className={cn(
                        "flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest transition-all",
                        isStoryboardMode ? "text-[#c87941]" : "text-zinc-600 hover:text-zinc-400"
                      )}
                    >
                      <Layout size={12} />
                      Storyboard Mode
                    </button>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={exportBriefMachineJSON}
                        className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-all"
                      >
                        <Download size={12} />
                        Export JSON
                      </button>
                      {isStoryboardMode && (
                        <button 
                          onClick={exportStoryboardText}
                          className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-all"
                        >
                          <FileImage size={12} />
                          Export Storyboard
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[9px] text-zinc-700 uppercase tracking-widest">
                      {briefMachineShot.subject.length} chars
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <AnimatePresence>
                {isBriefMachineRightPanelOpen && (
                  <motion.div 
                    initial={{ x: 400 }}
                    animate={{ x: 0 }}
                    exit={{ x: 400 }}
                    className="w-[400px] border-l border-zinc-800 flex flex-col bg-black"
                  >
                    <div className="h-[60px] border-b border-zinc-800 flex items-center justify-between px-6">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">Gallery / Preview</span>
                      <div className="flex items-center gap-2">
                        {[1, 2, 4].map(cols => (
                          <button 
                            key={cols}
                            onClick={() => setGalleryGridCols(cols as any)}
                            className={cn(
                              "p-1.5 transition-all",
                              galleryGridCols === cols ? "text-[#c87941]" : "text-zinc-600 hover:text-zinc-400"
                            )}
                          >
                            {cols === 1 ? <Layout size={14} /> : cols === 2 ? <Grid size={14} /> : <LayoutGrid size={14} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest block">Add to Gallery</label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="Paste image URL..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const url = (e.target as HTMLInputElement).value;
                                  if (url) {
                                    setAnomaLabGallery([url, ...anomaLabGallery]);
                                    (e.target as HTMLInputElement).value = "";
                                  }
                                }
                              }}
                              className="flex-1 bg-black/30 border border-zinc-800 p-2 text-zinc-300 font-mono text-[10px] focus:border-[#c87941] focus:outline-none transition-all"
                            />
                            <label className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white transition-all cursor-pointer">
                              <Plus size={14} />
                              <input type="file" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    if (ev.target?.result) setAnomaLabGallery([ev.target.result as string, ...anomaLabGallery]);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }} />
                            </label>
                          </div>
                        </div>

                        <div className={cn(
                          "grid gap-4",
                          galleryGridCols === 1 ? "grid-cols-1" : galleryGridCols === 2 ? "grid-cols-2" : "grid-cols-2"
                        )}>
                          {anomaLabGallery.map((url, i) => (
                            <div key={i} className="relative aspect-square bg-zinc-900 border border-zinc-800 group overflow-hidden rounded">
                              <img src={url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                              <button 
                                onClick={() => setAnomaLabGallery(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-2 right-2 p-1 bg-black/80 text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toggle Right Panel */}
              <button 
                onClick={() => setIsBriefMachineRightPanelOpen(!isBriefMachineRightPanelOpen)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-zinc-900 border border-zinc-800 p-1 text-zinc-500 hover:text-white transition-all"
                style={{ right: isBriefMachineRightPanelOpen ? "400px" : "0" }}
              >
                {isBriefMachineRightPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </motion.div>
          )}
          {view === "promptEngine" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PromptEngine />
            </motion.div>
          )}
          {view === "storyboarder" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 md:p-10 space-y-8">
                <div className="space-y-2">
                  <h2 className="font-display text-3xl text-white italic">Auto Storyboarder</h2>
                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Turn scripts or images into visual narratives</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Project Name</label>
                      <input 
                        type="text"
                        value={storyboarderProjectName}
                        onChange={(e) => setStoryboarderProjectName(e.target.value)}
                        className="w-full bg-black/50 border border-zinc-800 p-4 text-white font-display text-lg focus:border-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Storyboard Templates</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {STORYBOARD_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template.id)}
                          className="p-4 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-600 transition-all text-left group"
                        >
                          <h4 className="font-display text-lg text-white italic group-hover:text-zinc-200">{template.name}</h4>
                          <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest mt-1">{template.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">The Script / Story</label>
                    <textarea 
                      value={storyboarderInput}
                      onChange={(e) => setStoryboarderInput(e.target.value)}
                      placeholder="Describe the scene, the action, or paste a script snippet..."
                      className="w-full bg-zinc-950 border border-zinc-800 p-6 text-zinc-200 font-mono text-sm leading-relaxed focus:border-zinc-500 focus:outline-none transition-all min-h-[200px] resize-none"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Reference Images (Optional)</label>
                      <label className="cursor-pointer font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2">
                        <Plus size={12} />
                        Upload
                        <input type="file" multiple accept="image/*" className="hidden" onChange={handleStoryboardImageUpload} />
                      </label>
                    </div>
                    
                    {storyboarderImages.length > 0 && (
                      <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                        {storyboarderImages.map((img, i) => (
                          <div key={i} className="relative aspect-square bg-zinc-800 border border-zinc-700 group">
                            <LazyImage src={img} alt={`Reference ${i}`} className="w-full h-full" />
                            <button 
                              onClick={() => setStoryboarderImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={generateStoryboarder}
                    disabled={isGeneratingStoryboarder || (!storyboarderInput.trim() && storyboarderImages.length === 0)}
                    className="w-full py-6 bg-white text-black font-display italic text-2xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
                  >
                    {isGeneratingStoryboarder ? (
                      <>
                        <RefreshCcw size={24} className="animate-spin" />
                        Directing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={24} />
                        Generate Storyboard
                      </>
                    )}
                  </button>
                </div>
              </div>

              {storyboarderFrames.length > 0 && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Visual Sequence</h3>
                    <div className="flex gap-2">
                      {user && (
                        <button 
                          onClick={() => saveProject('storyboard')}
                          disabled={isSaving}
                          className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                        >
                          {isSaving ? <RefreshCcw size={12} className="animate-spin" /> : <Save size={12} />}
                          {copied ? "Saved!" : "Save Project"}
                        </button>
                      )}
                      <button 
                        onClick={exportStoryboard}
                        disabled={isExporting}
                        className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                      >
                        {isExporting ? <RefreshCcw size={12} className="animate-spin" /> : <Download size={12} />}
                        Export PDF
                      </button>
                      <button 
                        onClick={exportStoryboardImages}
                        disabled={isExportingImages}
                        className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                      >
                        {isExportingImages ? <RefreshCcw size={12} className="animate-spin" /> : <FileImage size={12} />}
                        Export Images (ZIP)
                      </button>
                      <button 
                        onClick={exportStoryboardVideo}
                        disabled={isExportingVideo}
                        className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                      >
                        {isExportingVideo ? <RefreshCcw size={12} className="animate-spin" /> : <Film size={12} />}
                        Export Video (WebM)
                      </button>
                      <button 
                        onClick={addStoryboardFrame}
                        className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                      >
                        <Plus size={12} />
                        Add Shot
                      </button>
                      <button 
                        onClick={clearStoryboard}
                        className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-red-900/30 text-red-500/50 hover:text-red-500 hover:border-red-500 transition-all flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Sequence Bar */}
                  <div className="flex gap-2 overflow-x-auto pb-4 border-b border-zinc-800 mb-8 scrollbar-hide">
                    {storyboarderFrames.map((frame, i) => (
                      <div 
                        key={i}
                        className="relative flex-shrink-0 w-24 aspect-video bg-zinc-900 border border-zinc-800 hover:border-white transition-all cursor-pointer group"
                        onMouseEnter={() => setHoveredStoryboardFrame(i)}
                        onMouseLeave={() => setHoveredStoryboardFrame(null)}
                        onClick={() => {
                          const element = document.getElementById(`frame-${i}`);
                          if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        {frame.visual_url ? (
                          <img src={frame.visual_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-700 font-mono">
                            0{i+1}
                          </div>
                        )}
                        
                        {/* Visual Preview on Hover */}
                        <AnimatePresence>
                          {hoveredStoryboardFrame === i && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.9 }}
                              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 aspect-video bg-black border border-zinc-700 shadow-2xl z-50 pointer-events-none"
                            >
                              {frame.visual_url ? (
                                <img src={frame.visual_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-900">
                                  <Sparkles size={24} className="text-zinc-800" />
                                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">No Image</span>
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 right-2 bg-black/80 p-2 border border-zinc-800">
                                <p className="text-[9px] text-white line-clamp-2 italic">{frame.frame_description}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                  
                  <div ref={storyboardRef} className="space-y-8 p-12 bg-[#000000] border border-[#27272a]">
                    <div className="border-b border-[#27272a] pb-8 mb-8">
                      <h2 className="font-display text-4xl text-[#ffffff] italic mb-2">{storyboarderProjectName}</h2>
                      <div className="flex justify-between items-end">
                        <p className="font-mono text-[10px] text-[#71717a] uppercase tracking-widest w-full">
                          {storyboarderInput.slice(0, 200)}{storyboarderInput.length > 200 ? '...' : ''}
                        </p>
                        <div className="text-right">
                          <p className="font-mono text-[10px] text-[#52525b] uppercase tracking-widest">Generated By</p>
                          <p className="font-display text-lg text-[#ffffff] italic">Anoma Lab AI</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {storyboarderFrames.map((frame, i) => (
                      <motion.div 
                        key={i}
                        id={`frame-${i}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="space-y-4 group/frame"
                      >
                        <div className="relative aspect-video bg-[#09090b] border border-[#27272a] overflow-hidden group">
                          {frame.visual_url ? (
                            <LazyImage src={frame.visual_url} alt={`Frame ${i+1}`} className="w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[rgba(24,24,27,0.5)]">
                              <div className="text-[#27272a] font-mono text-[10px] uppercase tracking-widest">
                                Frame 0{i+1}
                              </div>
                              <button
                                onClick={() => generateIndividualFrame(i)}
                                disabled={isGeneratingIndividualFrame === i || !frame.frame_description}
                                className="px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#71717a] font-mono text-[10px] uppercase tracking-widest hover:bg-[#ffffff] hover:text-[#000000] transition-all flex items-center gap-2"
                                data-html2canvas-ignore="true"
                              >
                                {isGeneratingIndividualFrame === i ? <RefreshCcw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                Generate Image
                              </button>
                            </div>
                          )}
                          <div className="absolute top-4 left-4 bg-[rgba(0,0,0,0.8)] px-3 py-1 font-mono text-xs text-[#ffffff] border border-[rgba(255,255,255,0.1)]">0{i+1}</div>
                          
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" data-html2canvas-ignore="true">
                            <label className="bg-[rgba(0,0,0,0.8)] p-2 text-[#ffffff] border border-[rgba(255,255,255,0.1)] hover:bg-[#ffffff] hover:text-[#000000] transition-all cursor-pointer" title="Upload Image">
                              <Upload size={14} />
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFrameImageUpload(i, e)} />
                            </label>
                            {frame.visual_url && (
                              <>
                                <button 
                                  onClick={() => setRefiningFrameIndex(refiningFrameIndex === i ? null : i)}
                                  className="bg-[rgba(0,0,0,0.8)] p-2 text-[#ffffff] border border-[rgba(255,255,255,0.1)] hover:bg-[#ffffff] hover:text-[#000000] transition-all"
                                  title="Refine Image"
                                >
                                  <RefreshCcw size={14} className={isGeneratingIndividualFrame === i ? "animate-spin" : ""} />
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => duplicateStoryboardFrame(i)}
                              className="bg-[rgba(0,0,0,0.8)] p-2 text-[#ffffff] border border-[rgba(255,255,255,0.1)] hover:bg-[#ffffff] hover:text-[#000000] transition-all"
                              title="Duplicate Shot"
                            >
                              <Copy size={14} />
                            </button>
                            <button 
                              onClick={() => removeStoryboardFrame(i)}
                              className="bg-[rgba(0,0,0,0.8)] p-2 text-[#ffffff] border border-[rgba(255,255,255,0.1)] hover:bg-[#ef4444] transition-all"
                              title="Remove Shot"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-4 p-6 bg-zinc-900 border border-zinc-800">
                          {refiningFrameIndex === i && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="pb-4 space-y-3 border-b border-zinc-800 mb-4"
                            >
                              <label className="font-mono text-[9px] text-cyan-500 uppercase tracking-widest">Refinement Feedback</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  value={refinementFeedback}
                                  onChange={(e) => setRefinementFeedback(e.target.value)}
                                  placeholder="e.g., 'Make it more moody', 'Add a red car'..."
                                  className="flex-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') generateIndividualFrame(i, refinementFeedback);
                                  }}
                                />
                                <button
                                  onClick={() => generateIndividualFrame(i, refinementFeedback)}
                                  disabled={isGeneratingIndividualFrame === i || !refinementFeedback.trim()}
                                  className="px-4 py-2 bg-cyan-600 text-white font-mono text-[9px] uppercase tracking-widest hover:bg-cyan-500 transition-all disabled:opacity-50"
                                >
                                  Apply
                                </button>
                              </div>
                            </motion.div>
                          )}
                          <div className="space-y-2">
                            <label className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Visual Description</label>
                            <textarea 
                              value={frame.frame_description}
                              onChange={(e) => updateStoryboardFrame(i, { frame_description: e.target.value })}
                              placeholder="Describe the shot..."
                              className="w-full bg-zinc-950 border border-zinc-800 p-3 text-sm text-zinc-100 leading-relaxed font-medium focus:border-zinc-600 outline-none resize-none h-20"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-800">
                            <div className="space-y-1">
                              <label className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">Camera</label>
                              <input 
                                type="text"
                                value={frame.camera_angle || ""}
                                onChange={(e) => updateStoryboardFrame(i, { camera_angle: e.target.value })}
                                placeholder="Dolly, Crane..."
                                className="w-full bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-[10px] text-zinc-300 focus:border-zinc-600 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">Lighting</label>
                              <input 
                                type="text"
                                value={frame.lighting || ""}
                                onChange={(e) => updateStoryboardFrame(i, { lighting: e.target.value })}
                                placeholder="Golden hour..."
                                className="w-full bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-[10px] text-zinc-300 focus:border-zinc-600 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">Atmosphere</label>
                              <input 
                                type="text"
                                value={frame.atmosphere || ""}
                                onChange={(e) => updateStoryboardFrame(i, { atmosphere: e.target.value })}
                                placeholder="Gritty, Dreamy..."
                                className="w-full bg-zinc-950 border border-zinc-800 px-2 py-1.5 text-[10px] text-zinc-300 focus:border-zinc-600 outline-none"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2 pt-4 border-t border-zinc-800">
                            <label className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Director's Note</label>
                            <textarea 
                              value={frame.annotation}
                              onChange={(e) => updateStoryboardFrame(i, { annotation: e.target.value })}
                              placeholder="Camera moves, sound, text..."
                              className="w-full bg-zinc-950 border border-zinc-800 p-2 text-[10px] text-zinc-400 italic leading-relaxed focus:border-zinc-600 outline-none resize-none h-12"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-8" data-html2canvas-ignore="true">
              <button 
                onClick={addStoryboardFrame}
                className="font-mono text-[10px] uppercase tracking-widest px-8 py-4 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
              >
                <Plus size={12} />
                Add New Shot
              </button>
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

          {/* EXTRACTOR VIEW */}
          {view === "extractor" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 md:p-10 space-y-8">
                <div className="space-y-2">
                  <h2 className="font-display text-3xl text-white italic">Video Frame Extractor</h2>
                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Extract high-quality frames for AI workflows</p>
                </div>

                <div className="space-y-8">
                  {!extractorVideoUrl ? (
                    <div className="border-2 border-dashed border-zinc-800 p-20 flex flex-col items-center justify-center gap-6 group hover:border-zinc-600 transition-all">
                      <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700 group-hover:text-white transition-colors">
                        <Video size={32} />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="font-display text-xl text-zinc-500 group-hover:text-white transition-colors">Upload video to start extracting</p>
                        <p className="font-mono text-[10px] text-zinc-700 uppercase tracking-widest">Supports MP4, MOV, WEBM up to 1GB</p>
                      </div>
                      <label className="cursor-pointer px-8 py-4 bg-white text-black font-display italic text-xl hover:bg-zinc-200 transition-all">
                        Select Video File
                        <input type="file" accept="video/*" className="hidden" onChange={handleExtractorVideoUpload} />
                      </label>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <div className="relative aspect-video bg-black border border-zinc-800 overflow-hidden">
                          <video 
                            ref={extractorVideoRef}
                            src={extractorVideoUrl} 
                            className="w-full h-full object-contain"
                            controls
                            onTimeUpdate={(e) => setExtractorScrubTime(e.currentTarget.currentTime)}
                          />
                        </div>

                        {/* Timeline Slider */}
                        <div className="space-y-2 p-4 bg-zinc-950 border border-zinc-800">
                          <div className="flex justify-between items-center font-mono text-[8px] text-zinc-600 uppercase tracking-widest">
                            <span>{extractorScrubTime.toFixed(1)}s</span>
                            <span>{extractorVideoRef.current?.duration ? extractorVideoRef.current.duration.toFixed(1) : "0.0"}s</span>
                          </div>
                          <div className="relative h-6 flex items-center">
                            <input 
                              type="range"
                              min="0"
                              max={extractorVideoRef.current?.duration || 100}
                              step="0.1"
                              value={extractorScrubTime}
                              onChange={(e) => {
                                const time = parseFloat(e.target.value);
                                setExtractorScrubTime(time);
                                if (extractorVideoRef.current) {
                                  extractorVideoRef.current.currentTime = time;
                                }
                              }}
                              className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer relative z-10"
                            />
                            {/* Frame Markers */}
                            <div className="absolute inset-0">
                              {extractorFrames.map((frame, i) => (
                                <button 
                                  key={i}
                                  onClick={() => {
                                    setSelectedExtractorFrames(prev => 
                                      prev.includes(i) ? prev.filter(id => id !== i) : [...prev, i]
                                    );
                                    setExtractorScrubTime(frame.time);
                                    if (extractorVideoRef.current) {
                                      extractorVideoRef.current.currentTime = frame.time;
                                    }
                                  }}
                                  className={cn(
                                    "absolute top-1/2 -translate-y-1/2 w-2 h-4 transition-all cursor-pointer z-20 hover:scale-125",
                                    selectedExtractorFrames.includes(i) ? "bg-cyan-500 h-6" : "bg-zinc-600 hover:bg-zinc-400"
                                  )}
                                  style={{ 
                                    left: `${(frame.time / (extractorVideoRef.current?.duration || 1)) * 100}%`,
                                    transform: 'translate(-50%, -50%)'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest">Scrub to preview & select frames</p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  // Select frame closest to current scrub time
                                  const closestIdx = extractorFrames.reduce((prev, curr, idx) => {
                                    const prevDiff = Math.abs(extractorFrames[prev].time - extractorScrubTime);
                                    const currDiff = Math.abs(curr.time - extractorScrubTime);
                                    return currDiff < prevDiff ? idx : prev;
                                  }, 0);
                                  if (extractorFrames.length > 0) {
                                    setSelectedExtractorFrames(prev => 
                                      prev.includes(closestIdx) ? prev.filter(id => id !== closestIdx) : [...prev, closestIdx]
                                    );
                                  }
                                }}
                                className="px-2 py-1 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 font-mono text-[8px] uppercase tracking-widest transition-all"
                              >
                                Toggle Nearest Frame
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6 bg-zinc-900/30 border border-zinc-800 space-y-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Extraction Interval</label>
                              <span className="font-display text-xl text-white italic">{extractionInterval}s</span>
                            </div>
                            <input 
                              type="range" 
                              min="0.5" 
                              max="30" 
                              step="0.5" 
                              value={extractionInterval} 
                              onChange={(e) => setExtractionInterval(parseFloat(e.target.value))}
                              className="w-full accent-white h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between font-mono text-[8px] text-zinc-700 uppercase tracking-widest">
                              <span>0.5s</span>
                              <span>30s</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Target Aspect Ratio</label>
                              <div className="flex border border-zinc-800 p-1">
                                {["16:9", "9:16"].map(ratio => (
                                  <button
                                    key={ratio}
                                    onClick={() => setExtractorAspectRatio(ratio as any)}
                                    className={cn(
                                      "flex-1 py-2 font-mono text-[10px] transition-all",
                                      extractorAspectRatio === ratio ? "bg-white text-black" : "text-zinc-500 hover:text-white"
                                    )}
                                  >
                                    {ratio}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Export Format</label>
                              <select 
                                value={extractorExportFormat}
                                onChange={(e) => setExtractorExportFormat(e.target.value as any)}
                                className="w-full bg-black border border-zinc-800 text-zinc-500 font-mono text-[10px] p-2 focus:outline-none focus:border-zinc-600"
                              >
                                <option value="jpg">JPG</option>
                                <option value="png">PNG</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={extractFrame}
                              className="py-4 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 font-mono text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                              <Camera size={14} />
                              Manual Capture
                            </button>
                            <button
                              onClick={autoExtractFrames}
                              disabled={isExtracting}
                              className="py-4 bg-white text-black font-display italic text-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {isExtracting ? <RefreshCcw size={18} className="animate-spin" /> : <Scissors size={18} />}
                              Auto Extract
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setExtractorVideoFile(null);
                              setExtractorVideoUrl(null);
                              setExtractorFrames([]);
                            }}
                            className="w-full py-3 border border-red-900/30 text-red-500/50 hover:text-red-500 hover:border-red-500 font-mono text-[10px] uppercase tracking-widest transition-all"
                          >
                            Remove Video
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Extracted Frames ({extractorFrames.length})</h3>
                            <div className="flex items-center gap-4">
                              <div className="flex border border-zinc-800 p-0.5">
                                {[
                                  { id: 'grid', icon: LayoutGrid },
                                  { id: 'timeline', icon: Clock }
                                ].map(mode => (
                                  <button
                                    key={mode.id}
                                    onClick={() => setExtractorViewMode(mode.id as any)}
                                    className={cn(
                                      "px-3 py-1 transition-all",
                                      extractorViewMode === mode.id ? "bg-zinc-700 text-white" : "text-zinc-600 hover:text-zinc-400"
                                    )}
                                  >
                                    <mode.icon size={12} />
                                  </button>
                                ))}
                              </div>
                              <div className="flex border border-zinc-800 p-0.5">
                                {["sm", "md", "lg"].map(size => (
                                  <button
                                    key={size}
                                    onClick={() => setExtractorThumbnailSize(size as any)}
                                    className={cn(
                                      "px-3 py-1 font-mono text-[8px] uppercase transition-all",
                                      extractorThumbnailSize === size ? "bg-zinc-700 text-white" : "text-zinc-600 hover:text-zinc-400"
                                    )}
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                              {extractorFrames.length > 0 && (
                                <button
                                  onClick={exportExtractorFramesAsZip}
                                  disabled={isExporting}
                                  className="px-6 py-3 bg-cyan-600 text-white font-display italic text-lg hover:bg-cyan-500 transition-all flex items-center gap-3 shadow-lg shadow-cyan-900/20"
                                >
                                  {isExporting ? <RefreshCcw size={16} className="animate-spin" /> : <Download size={16} />}
                                  Export {selectedExtractorFrames.length > 0 ? `(${selectedExtractorFrames.length})` : "All"}
                                </button>
                              )}
                              {user && extractorFrames.length > 0 && (
                                <button
                                  onClick={() => saveProject('extractor')}
                                  disabled={isSaving}
                                  className="px-6 py-3 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 font-display italic text-lg transition-all flex items-center gap-3"
                                >
                                  {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
                                  Save to Project
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center border-y border-zinc-800 py-3">
                            <div className="flex gap-4 items-center">
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => setSelectedExtractorFrames(extractorFrames.map((_, i) => i))}
                                  className="font-mono text-[8px] text-zinc-500 hover:text-white uppercase tracking-widest"
                                >
                                  Select All
                                </button>
                                <span className="text-zinc-800">/</span>
                                <button 
                                  onClick={() => setSelectedExtractorFrames([])}
                                  className="font-mono text-[8px] text-zinc-500 hover:text-white uppercase tracking-widest"
                                >
                                  Deselect All
                                </button>
                              </div>
                              {selectedExtractorFrames.length > 0 && (
                                <button
                                  onClick={() => sendFrameToEngine(extractorFrames.filter((_, i) => selectedExtractorFrames.includes(i)))}
                                  className="px-3 py-1 bg-white text-black font-mono text-[8px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2"
                                >
                                  <Zap size={10} />
                                  Batch Send to Engine
                                </button>
                              )}
                              {selectedExtractorFrames.length > 0 && (
                                <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
                                  <input 
                                    type="text"
                                    value={extractorRenamePrefix}
                                    onChange={(e) => setExtractorRenamePrefix(e.target.value)}
                                    placeholder="Prefix..."
                                    className="bg-black border border-zinc-800 text-white font-mono text-[8px] p-1 w-24 focus:outline-none focus:border-zinc-600"
                                  />
                                  <button
                                    onClick={batchRenameFrames}
                                    className="px-3 py-1 border border-zinc-700 text-zinc-400 font-mono text-[8px] uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all"
                                  >
                                    Batch Rename
                                  </button>
                                </div>
                              )}
                            </div>
                            {extractorFrames.length > 0 && (
                              <button
                                onClick={() => {
                                  if (selectedExtractorFrames.length > 0) {
                                    setExtractorFrames(prev => prev.filter((_, i) => !selectedExtractorFrames.includes(i)));
                                    setSelectedExtractorFrames([]);
                                  } else {
                                    setExtractorFrames([]);
                                  }
                                }}
                                className="font-mono text-[8px] text-red-900 hover:text-red-500 uppercase tracking-widest flex items-center gap-1"
                              >
                                <Trash2 size={10} />
                                {selectedExtractorFrames.length > 0 ? "Delete Selected" : "Clear All"}
                              </button>
                            )}
                          </div>
                        </div>

                        {extractorViewMode === 'timeline' && extractorFrames.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 px-2">
                              <Clock size={12} className="text-zinc-600" />
                              <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Video Timeline View</span>
                            </div>
                            <div className="relative h-48 border border-zinc-800 bg-black/50 overflow-x-auto overflow-y-hidden flex items-end p-4 gap-1 group/timeline">
                            {/* Time indicators */}
                            <div className="absolute top-0 left-0 w-full h-6 border-b border-zinc-800 flex items-center px-4">
                              <div className="flex gap-20 font-mono text-[8px] text-zinc-600 uppercase tracking-widest">
                                {Array.from({ length: 10 }).map((_, i) => (
                                  <span key={i}>{i * 10}s</span>
                                ))}
                              </div>
                            </div>
                            
                            {extractorFrames.map((frame, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => seekToFrameTime(frame.time)}
                                className={cn(
                                  "relative flex-shrink-0 cursor-pointer transition-all border border-zinc-800 hover:border-white group/frame",
                                  selectedExtractorFrames.includes(i) ? "border-cyan-500 ring-1 ring-cyan-500" : ""
                                )}
                                style={{ 
                                  width: extractorThumbnailSize === 'sm' ? '60px' : extractorThumbnailSize === 'md' ? '120px' : '240px',
                                  height: extractorThumbnailSize === 'sm' ? '34px' : extractorThumbnailSize === 'md' ? '68px' : '135px'
                                }}
                              >
                                <LazyImage src={frame.url} alt={`Frame at ${frame.time}s`} className="w-full h-full" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/frame:opacity-100 transition-opacity flex items-center justify-center">
                                  <Play size={16} className="text-white" />
                                </div>
                                <div className="absolute -top-6 left-0 font-mono text-[8px] text-zinc-600 opacity-0 group-hover/frame:opacity-100 transition-opacity">
                                  {frame.time?.toFixed(1)}s
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                        )}

                        {extractorViewMode === 'grid' && (
                          <div className={cn(
                            "grid gap-4 max-h-[600px] overflow-y-auto p-2 border border-zinc-800 bg-black/30",
                            extractorThumbnailSize === "sm" ? "grid-cols-4 sm:grid-cols-6" : 
                            extractorThumbnailSize === "md" ? "grid-cols-2 sm:grid-cols-3" : 
                            "grid-cols-1 sm:grid-cols-2"
                          )}>
                          {extractorFrames.length === 0 ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-800 gap-4">
                              <FileImage size={48} />
                              <p className="font-display italic text-xl">No frames extracted yet</p>
                            </div>
                          ) : (
                            extractorFrames.map((frame, i) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onMouseEnter={() => setHoveredFrame(frame)}
                                onMouseLeave={() => setHoveredFrame(null)}
                                className={cn(
                                  "relative aspect-video bg-zinc-900 border transition-all cursor-pointer group",
                                  selectedExtractorFrames.includes(i) ? "border-cyan-500 ring-1 ring-cyan-500" : "border-zinc-800 hover:border-zinc-600"
                                )}
                                onClick={() => {
                                  setSelectedExtractorFrames(prev => 
                                    prev.includes(i) ? prev.filter(id => id !== i) : [...prev, i]
                                  );
                                }}
                              >
                                <LazyImage src={frame.url} alt={frame.name || `Frame ${i+1}`} className="w-full h-full" />
                                
                                {frame.backgroundUrl && (
                                  <div className="absolute inset-0 z-10">
                                    <LazyImage src={frame.backgroundUrl} alt="Background" className="w-full h-full opacity-50 mix-blend-overlay" />
                                  </div>
                                )}

                                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 font-mono text-[8px] text-white border border-zinc-800 z-20">
                                  {frame.name || `FRAME ${i + 1}`}
                                </div>

                                {/* Selection Checkbox */}
                                <div className={cn(
                                  "absolute top-2 left-2 w-4 h-4 border flex items-center justify-center transition-all",
                                  selectedExtractorFrames.includes(i) ? "bg-cyan-500 border-cyan-500" : "bg-black/50 border-zinc-700 opacity-0 group-hover:opacity-100"
                                )}>
                                  {selectedExtractorFrames.includes(i) && <Check size={10} className="text-white" />}
                                </div>

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                  <div className="flex gap-2 w-full">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (frame.backgroundUrl) {
                                          setRefiningBackgroundIndex(i);
                                          setBackgroundRefinementPrompt("");
                                        } else {
                                          generateExtractorBackground(i);
                                        }
                                      }}
                                      disabled={isGeneratingExtractorBackground === i}
                                      className="flex-1 py-1.5 bg-cyan-600 text-white font-mono text-[8px] uppercase tracking-widest hover:bg-cyan-500 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                      {isGeneratingExtractorBackground === i ? (
                                        <RefreshCcw size={10} className="animate-spin" />
                                      ) : (
                                        <>
                                          <Sparkles size={10} />
                                          {frame.backgroundUrl ? "Refine BG" : "AI BG"}
                                        </>
                                      )}
                                    </button>
                                  </div>
                                  <div className="flex gap-2 w-full">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        sendFrameToEngine(frame);
                                      }}
                                      className="flex-1 py-1.5 bg-white text-black font-mono text-[8px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-1"
                                    >
                                      <Zap size={10} />
                                      Engine
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        sendFrameToStoryboarder(frame);
                                      }}
                                      className="flex-1 py-1.5 border border-white text-white font-mono text-[8px] uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-1"
                                    >
                                      <Layout size={10} />
                                      Story
                                    </button>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExtractorFrames(prev => prev.filter((_, idx) => idx !== i));
                                      setSelectedExtractorFrames(prev => prev.filter(id => id !== i));
                                    }}
                                    className="w-full py-1.5 border border-red-500 text-red-500 font-mono text-[8px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                                  >
                                    <Trash2 size={10} />
                                    Delete
                                  </button>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Preview Overlay */}
              <AnimatePresence>
                {hoveredFrame && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed bottom-10 right-10 w-96 aspect-video z-50 pointer-events-none border-4 border-zinc-800 shadow-2xl overflow-hidden bg-black"
                  >
                    <img src={hoveredFrame.url} className="w-full h-full object-contain" />
                    {hoveredFrame.backgroundUrl && (
                      <div className="absolute inset-0">
                        <img src={hoveredFrame.backgroundUrl} className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
                      </div>
                    )}
                    <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black/80 to-transparent">
                      <p className="font-mono text-[10px] text-white uppercase tracking-widest">Preview Mode</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Background Refinement Modal */}
              <AnimatePresence>
                {refiningBackgroundIndex !== null && (
                  <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="bg-zinc-900 border border-zinc-800 p-8 max-w-2xl w-full space-y-6"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-display text-2xl text-white italic">Refine AI Background</h3>
                        <button onClick={() => setRefiningBackgroundIndex(null)} className="text-zinc-500 hover:text-white">
                          <X size={20} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Original Frame</p>
                          <div className="aspect-video bg-black border border-zinc-800 overflow-hidden">
                            <img src={extractorFrames[refiningBackgroundIndex].url} className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Current Background</p>
                          <div className="aspect-video bg-black border border-zinc-800 overflow-hidden">
                            <img src={extractorFrames[refiningBackgroundIndex].backgroundUrl} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Refinement Instructions</label>
                        <textarea
                          value={backgroundRefinementPrompt}
                          onChange={(e) => setBackgroundRefinementPrompt(e.target.value)}
                          placeholder="e.g., Make it more neon-lit, add a futuristic cityscape, or change the color palette to deep purples..."
                          className="w-full bg-black border border-zinc-800 p-4 text-white font-mono text-xs focus:outline-none focus:border-cyan-500 h-32 resize-none"
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setRefiningBackgroundIndex(null)}
                          className="flex-1 py-4 border border-zinc-800 text-zinc-500 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => generateExtractorBackground(refiningBackgroundIndex, backgroundRefinementPrompt)}
                          disabled={isGeneratingExtractorBackground !== null}
                          className="flex-1 py-4 bg-white text-black font-display italic text-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isGeneratingExtractorBackground !== null ? (
                            <RefreshCcw size={20} className="animate-spin" />
                          ) : (
                            <>
                              <Sparkles size={20} />
                              Regenerate Background
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* PROJECTS VIEW */}
          {view === "projects" && user && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="flex justify-between items-end border-b border-zinc-800 pb-10">
                <div className="space-y-2">
                  <h2 className="font-display text-5xl text-white italic">Saved Projects</h2>
                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Your creative archive</p>
                </div>
                <button 
                  onClick={() => setView("storyboarder")}
                  className="px-6 py-3 bg-white text-black font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2"
                >
                  <Plus size={14} />
                  New Project
                </button>
              </div>

              {isLoadingProjects ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <RefreshCcw size={32} className="text-zinc-800 animate-spin" />
                  <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Loading Archive...</p>
                </div>
              ) : savedProjects.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-zinc-800">
                  <FolderOpen size={48} className="text-zinc-800 mx-auto mb-4" />
                  <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">No projects found in the archive.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {savedProjects.map((project) => (
                    <motion.div 
                      key={project.id}
                      className="group bg-zinc-900/30 border border-zinc-800 p-6 hover:border-zinc-600 transition-all flex gap-8 items-center"
                    >
                      {project.thumbnailUrl && (
                        <div className="w-40 aspect-video bg-black border border-zinc-800 overflow-hidden flex-shrink-0">
                          <img src={project.thumbnailUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      <div className="space-y-2 flex-1 cursor-pointer" onClick={() => loadProject(project)}>
                        <div className="flex items-center gap-4">
                          <h3 className="font-display text-2xl text-white group-hover:text-zinc-200 transition-colors">
                            {project.name}
                          </h3>
                          <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest px-2 py-0.5 border border-zinc-800 rounded">
                            {project.frames && project.frames.length > 0 ? "Storyboard" : 
                             project.prompts && project.prompts.length > 0 ? "Anoma Lab" : 
                             project.extractedFrames && project.extractedFrames.length > 0 ? "Extractor" : "Project"}
                          </span>
                          <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">
                            {project.frames?.length || project.prompts?.length || project.extractedFrames?.length || 0} Items
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                          Last Updated: {project.updatedAt instanceof Timestamp ? project.updatedAt.toDate().toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => loadProject(project)}
                          className="p-3 text-zinc-600 hover:text-white transition-colors"
                          title="Open Project"
                        >
                          <ExternalLink size={18} />
                        </button>
                        <button 
                          onClick={() => deleteProject(project.id)}
                          className="p-3 text-zinc-600 hover:text-red-500 transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* PAST TRENDS VIEW */}
          {view === "pastTrends" && user && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-10 gap-6">
                <div className="space-y-2">
                  <h2 className="font-display text-5xl text-white italic">Trend Archive</h2>
                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Historical context for current creative strategies</p>
                </div>
                
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <label className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest block">Filter by Month</label>
                    <select 
                      value={trendFilterMonth}
                      onChange={(e) => setTrendFilterMonth(e.target.value)}
                      className="bg-black border border-zinc-800 text-zinc-400 font-mono text-[10px] p-2 focus:outline-none focus:border-zinc-600"
                    >
                      <option value="all">All Months</option>
                      {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                        <option key={m} value={i.toString()}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest block">Filter by Year</label>
                    <select 
                      value={trendFilterYear}
                      onChange={(e) => setTrendFilterYear(e.target.value)}
                      className="bg-black border border-zinc-800 text-zinc-400 font-mono text-[10px] p-2 focus:outline-none focus:border-zinc-600"
                    >
                      <option value="all">All Years</option>
                      {["2024", "2025", "2026"].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest block">Filter by Industry</label>
                    <select 
                      value={trendFilterIndustry}
                      onChange={(e) => setTrendFilterIndustry(e.target.value)}
                      className="bg-black border border-zinc-800 text-zinc-400 font-mono text-[10px] p-2 focus:outline-none focus:border-zinc-600"
                    >
                      <option value="all">All Industries</option>
                      {["Fashion", "Tech", "Automotive", "Food", "Travel", "Entertainment", "Finance", "Health", "Beauty"].map(i => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {isLoadingPastTrends ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <RefreshCcw size={32} className="text-zinc-800 animate-spin" />
                  <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Retrieving Archive...</p>
                </div>
              ) : (
                <div className="space-y-16">
                  {pastTrends
                    .filter(session => {
                      if (!session.createdAt || !(session.createdAt instanceof Timestamp)) return true;
                      const date = session.createdAt.toDate();
                      const monthMatch = trendFilterMonth === "all" || date.getMonth().toString() === trendFilterMonth;
                      const yearMatch = trendFilterYear === "all" || date.getFullYear().toString() === trendFilterYear;
                      const industryMatch = trendFilterIndustry === "all" || session.trends.some(t => t.industry === trendFilterIndustry);
                      return monthMatch && yearMatch && industryMatch;
                    })
                    .length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-zinc-800">
                        <Search size={48} className="text-zinc-800 mx-auto mb-4" />
                        <p className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">No trends found for the selected period.</p>
                      </div>
                    ) : (
                      pastTrends
                        .filter(session => {
                          if (!session.createdAt || !(session.createdAt instanceof Timestamp)) return true;
                          const date = session.createdAt.toDate();
                          const monthMatch = trendFilterMonth === "all" || date.getMonth().toString() === trendFilterMonth;
                          const yearMatch = trendFilterYear === "all" || date.getFullYear().toString() === trendFilterYear;
                          const industryMatch = trendFilterIndustry === "all" || session.trends.some(t => t.industry === trendFilterIndustry);
                          return monthMatch && yearMatch && industryMatch;
                        })
                        .map((session) => (
                          <div key={session.id} className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-zinc-900 pb-4">
                              <Clock size={14} className="text-zinc-700" />
                              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                                Scanned on: {session.createdAt instanceof Timestamp ? session.createdAt.toDate().toLocaleString() : 'Recently'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {session.trends
                                .filter(t => trendFilterIndustry === "all" || t.industry === trendFilterIndustry)
                                .map((trend, idx) => (
                                <motion.div 
                                  key={idx}
                                  className="bg-zinc-900/30 border border-zinc-800 p-8 hover:border-zinc-600 transition-all flex flex-col justify-between group"
                                >
                                  <div className="space-y-6">
                                    <div className="flex justify-between items-start">
                                      <h3 className="font-display text-3xl text-white group-hover:text-zinc-200 transition-colors leading-tight italic">{trend.name}</h3>
                                      {trend.industry && (
                                        <span className="px-2 py-1 bg-zinc-800 text-zinc-400 font-mono text-[8px] uppercase tracking-widest border border-zinc-700">
                                          {trend.industry}
                                        </span>
                                      )}
                                    </div>
                                    <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">{trend.why_it_matters}</p>
                                    <div className="pt-4 border-t border-zinc-800/50">
                                      <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest mb-2">Emotional Undercurrent</p>
                                      <p className="text-xs text-zinc-400 italic">{trend.emotional_undercurrent}</p>
                                    </div>
                                  </div>
                                  <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col gap-3">
                                    <button 
                                      onClick={() => {
                                        setBriefInput(trend.brief_starter);
                                        setView("input");
                                      }}
                                      className="w-full py-3 bg-white text-black font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                                    >
                                      <Zap size={12} />
                                      Use as Brief
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              )}

          {/* Welcome Modal */}
          {/* Welcome Modal */}
          <AnimatePresence>
            {showWelcomeModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-black border border-zinc-800 p-10 max-w-2xl w-full space-y-8 relative"
                >
                  <button 
                    onClick={() => setShowWelcomeModal(false)}
                    className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                  
                  <div className="space-y-4">
                    <h2 className="font-display text-5xl text-white italic leading-tight">Welcome to Anoma Lab</h2>
                    <p className="font-mono text-xs text-[#c87941] uppercase tracking-widest">Professional AI Prompt Engineering Workstation</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                    <div className="space-y-2">
                      <h4 className="font-mono text-[10px] text-white uppercase tracking-widest">Structured Editor</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">Break down complex cinematic prompts into 6 core pillars: Subject, Composition, Lighting, Camera, Style, and Motion.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-mono text-[10px] text-white uppercase tracking-widest">AI Intelligence</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">Use Beautify to organize raw ideas, Smart Edit for natural language tweaks, and Expand for rich cinematic detail.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-mono text-[10px] text-white uppercase tracking-widest">Character Studio</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">Build a library of persistent character profiles to maintain consistency across multiple shots and prompts.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-mono text-[10px] text-white uppercase tracking-widest">Storyboard Mode</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">Switch to multi-shot view to build full visual narratives. Reorder shots and export your vision as a storyboard.</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowWelcomeModal(false)}
                    className="w-full py-4 bg-[#c87941] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#b06a38] transition-all shadow-xl shadow-[#c87941]/20"
                  >
                    Enter Workstation
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {view === "compare" && results && (
              <ComparisonView 
                concepts={selectedConcepts.map(idx => results.concepts[idx])}
                onClose={() => setView("results")}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {view === "shortlist" && (
              <ShortlistView 
                concepts={results?.concepts || []}
                trends={trends || []}
                selectedConcepts={selectedConcepts}
                selectedTrends={selectedTrends}
                onExport={exportShortlistToPDF}
                onClear={() => {
                  setSelectedConcepts([]);
                  setSelectedTrends([]);
                }}
                onClose={() => setView(results ? "results" : "input")}
                onSendToStoryboarder={sendConceptToStoryboarder}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// --- Helper Components ---


function TrendDetailModal({ 
  trend, 
  onClose, 
  onSendToEngine, 
  onSendToStoryboarder,
  videoAspectRatio,
  onSetVideoAspectRatio
}: { 
  trend: Trend; 
  onClose: () => void;
  onSendToEngine: (concept: string) => void;
  onSendToStoryboarder: (concept: string, name: string) => void;
  videoAspectRatio: "16:9" | "9:16";
  onSetVideoAspectRatio: (ratio: "16:9" | "9:16") => void;
}) {
  const [isVisualizingVideo, setIsVisualizingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVisualizeVideo = async () => {
    setIsVisualizingVideo(true);
    setError(null);
    try {
      let operation = await geminiService.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: `A high-end, award-winning advertising video snippet inspired by the cultural trend "${trend.name}". 
        Viral Concept: ${trend.viral_concept}. 
        Video Hook: ${trend.video_hook}.
        Cinematic, surreal, and visually arresting. 
        High-end production value, professional lighting.`,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: videoAspectRatio
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await geminiService.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! },
        });
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }
    } catch (e) {
      console.error(e);
      setError("Video generation failed. Cultural tension is too high.");
    } finally {
      setIsVisualizingVideo(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl overflow-y-auto p-6 md:p-12 flex items-center justify-center"
    >
      <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 p-8 md:p-12 space-y-10 relative">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="space-y-4">
          <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Cultural Tension</div>
          <h2 className="font-display text-5xl text-white italic leading-tight">{trend.name}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-6">
              <h3 className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">The Cultural Undercurrent</h3>
              <p className="font-display text-3xl text-zinc-300 leading-tight italic">"{trend.why_it_matters}"</p>
              <p className="text-zinc-500 leading-relaxed italic">"{trend.emotional_undercurrent}"</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-zinc-800">
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} className="text-yellow-400" />
                  Viral Concept
                </h3>
                <p className="text-white leading-relaxed">{trend.viral_concept}</p>
              </div>
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                  <Target size={12} className="text-cyan-400" />
                  Video Hook
                </h3>
                <p className="text-white leading-relaxed italic">"{trend.video_hook}"</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 bg-black/30 p-8 border border-zinc-800/50">
            <h3 className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">AI Visualization</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Aspect Ratio</span>
                <div className="flex gap-2">
                  {(["16:9", "9:16"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => onSetVideoAspectRatio(ratio)}
                      className={cn(
                        "px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-all",
                        videoAspectRatio === ratio 
                          ? "bg-white text-black" 
                          : "bg-zinc-800 text-zinc-500 hover:text-white"
                      )}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className={cn(
                "relative bg-black border border-zinc-800 overflow-hidden flex items-center justify-center",
                videoAspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16] max-h-[400px] mx-auto"
              )}>
                {videoUrl ? (
                  <video src={videoUrl} controls className="w-full h-full object-cover" />
                ) : isVisualizingVideo ? (
                  <div className="flex flex-col items-center gap-4">
                    <RefreshCcw size={24} className="text-zinc-700 animate-spin" />
                    <span className="font-mono text-[10px] text-zinc-700 uppercase tracking-widest animate-pulse">Rendering Reality...</span>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-4">
                    <Film size={32} className="text-zinc-800 mx-auto" />
                    <p className="font-mono text-[10px] text-zinc-700 uppercase tracking-widest">No visualization yet</p>
                    <button
                      onClick={handleVisualizeVideo}
                      className="px-6 py-3 bg-zinc-800 text-zinc-400 hover:bg-white hover:text-black font-mono text-[10px] uppercase tracking-widest transition-all"
                    >
                      Visualize Trend
                    </button>
                  </div>
                )}
                {error && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 text-center">
                    <p className="text-red-500 font-mono text-[10px] uppercase tracking-widest">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-8 border-t border-zinc-800">
          <button
            onClick={() => onSendToEngine(trend.viral_concept)}
            className="flex-1 py-4 bg-white text-black font-mono text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-3"
          >
            <Zap size={14} />
            Send to Creative Engine
          </button>
          <button
            onClick={() => onSendToStoryboarder(trend.viral_concept, trend.name)}
            className="flex-1 py-4 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 font-mono text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3"
          >
            <Layout size={14} />
            Auto Storyboard
          </button>
          <button
            onClick={onClose}
            className="px-8 py-4 font-mono text-[10px] uppercase tracking-widest text-zinc-700 hover:text-zinc-400 transition-all"
          >
            Back to Scanner
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ComparisonView({ concepts, onClose }: { concepts: Concept[]; onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl overflow-y-auto p-6 md:p-12"
    >
      <div className="w-full">
        <div className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-8">
          <div>
            <h2 className="font-display text-4xl text-white mb-2">Concept Comparison</h2>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Side-by-side strategic analysis</p>
          </div>
          <button 
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-widest px-6 py-3 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
          >
            <X size={12} />
            Close Comparison
          </button>
        </div>

        <div className={cn(
          "grid gap-8",
          concepts.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"
        )}>
          {concepts.map((concept, idx) => (
            <div key={idx} className="space-y-8 bg-zinc-900/50 border border-zinc-800 p-8">
              <div>
                <span className="font-mono text-[10px] text-zinc-700 block mb-2">0{idx + 1}</span>
                <h3 className="font-display text-3xl text-white mb-4">{concept.name}</h3>
                <RiskBadge level={concept.risk_level} />
              </div>

              <div className="space-y-6">
                <DetailBlock label="The Idea" value={concept.idea} />
                <DetailBlock label="Format" value={concept.format} />
                <DetailBlock label="Strategic Logic" value={concept.why_it_works} />
                <DetailBlock label="Risk Context" value={concept.risk_reason} />
                <DetailBlock label="Execution" value={concept.execution} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ShortlistView({ 
  concepts, 
  trends, 
  selectedConcepts, 
  selectedTrends, 
  onExport, 
  onClear,
  onClose,
  onSendToStoryboarder
}: { 
  concepts: Concept[]; 
  trends: Trend[]; 
  selectedConcepts: number[]; 
  selectedTrends: number[]; 
  onExport: () => void; 
  onClear: () => void;
  onClose: () => void;
  onSendToStoryboarder: (concept: Concept) => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl overflow-y-auto p-6 md:p-12"
    >
      <div className="w-full space-y-12">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-10">
          <div className="space-y-1">
            <h2 className="font-display text-5xl text-white italic">Shortlist</h2>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              {selectedConcepts.length} Concepts & {selectedTrends.length} Trends Saved
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onClear}
              className="px-6 py-4 border border-red-900/30 text-red-500/50 hover:text-red-500 hover:border-red-500 font-mono text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <Trash2 size={14} />
              Clear All
            </button>
            <button 
              onClick={onExport}
              className="px-8 py-4 bg-white text-black font-display italic text-xl hover:bg-zinc-200 transition-all flex items-center gap-4"
            >
              <Download size={20} />
              Export PDF
            </button>
            <button 
              onClick={onClose}
              className="p-4 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Selected Trends */}
          <div className="space-y-8">
            <h3 className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Saved Trends</h3>
            {selectedTrends.length === 0 ? (
              <p className="text-zinc-700 italic font-display text-xl">No trends shortlisted yet.</p>
            ) : (
              <div className="space-y-4">
                {selectedTrends.map((idx) => {
                  const trend = trends[idx];
                  return (
                    <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-8 space-y-4">
                      <h4 className="font-display text-2xl text-white italic">{trend.name}</h4>
                      <p className="text-sm text-zinc-400 leading-relaxed">{trend.why_it_matters}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Concepts */}
          <div className="space-y-8">
            <h3 className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Saved Concepts</h3>
            {selectedConcepts.length === 0 ? (
              <p className="text-zinc-700 italic font-display text-xl">No concepts shortlisted yet.</p>
            ) : (
              <div className="space-y-4">
                {selectedConcepts.map((idx) => {
                  const concept = concepts[idx];
                  return (
                    <div key={idx} className="bg-zinc-900/50 border border-zinc-800 p-8 space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-display text-2xl text-white italic">{concept.name}</h4>
                        <p className="text-sm text-zinc-300 leading-relaxed italic">"{concept.idea}"</p>
                      </div>
                      <button 
                        onClick={() => onSendToStoryboarder(concept)}
                        className="w-full py-3 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 font-mono text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <Layout size={12} />
                        Send to Storyboarder
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ConceptCard({ 
  concept, 
  index, 
  isExpanded, 
  isSelected,
  onToggle, 
  onCompare,
  onRefine, 
  onVisualize,
  onVisualizeVideo,
  onVisualizeStoryboard,
  onGenerateBackground,
  onSelectTitle,
  onExportPDF,
  onCopy,
  onRate,
  onGenerateVariations,
  onSendToStoryboarder,
  isGeneratingVariations,
  videoAspectRatio,
  onSetVideoAspectRatio
}: { 
  concept: Concept; 
  index: number; 
  isExpanded: boolean; 
  isSelected: boolean;
  onToggle: () => void; 
  onCompare: () => void;
  onRefine: (feedback: string) => Promise<void>; 
  onVisualize: () => Promise<void>;
  onVisualizeVideo: () => Promise<void>;
  onVisualizeStoryboard: () => Promise<void>;
  onGenerateBackground: () => Promise<void>;
  onSelectTitle: (title: string) => void;
  onExportPDF: () => void;
  onCopy: (text: string) => void;
  onRate: (rating: number) => void;
  onGenerateVariations: () => Promise<void>;
  onSendToStoryboarder: () => void;
  isGeneratingVariations: boolean;
  videoAspectRatio: "16:9" | "9:16";
  onSetVideoAspectRatio: (ratio: "16:9" | "9:16") => void;
}) {
  const [refineInput, setRefineInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [isVisualizingVideo, setIsVisualizingVideo] = useState(false);
  const [isVisualizingStoryboard, setIsVisualizingStoryboard] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "storyboard" | "script" | "higgsfield">("details");

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

  const handleVisualizeVideo = async () => {
    setIsVisualizingVideo(true);
    await onVisualizeVideo();
    setIsVisualizingVideo(false);
  };

  const handleVisualizeStoryboard = async () => {
    setIsVisualizingStoryboard(true);
    await onVisualizeStoryboard();
    setIsVisualizingStoryboard(false);
  };

  const handleGenerateBackground = async () => {
    setIsGeneratingBackground(true);
    await onGenerateBackground();
    setIsGeneratingBackground(false);
  };

  return (
    <div className={cn(
      "border transition-all duration-500 overflow-hidden",
      isExpanded ? "bg-zinc-900/80 border-zinc-700" : "bg-zinc-900/30 border-zinc-800 hover:border-zinc-700",
      isSelected && "ring-2 ring-white border-white"
    )}>
      <div className="flex items-center">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onCompare();
          }}
          className={cn(
            "px-4 py-6 border-r border-zinc-800 transition-colors flex items-center justify-center h-full",
            isSelected ? "text-white bg-zinc-800" : "text-zinc-700 hover:text-zinc-400"
          )}
        >
          {isSelected ? <Check size={16} /> : <Plus size={16} />}
        </button>
        <button 
          onClick={onToggle}
          className="flex-1 px-8 py-6 flex items-center justify-between text-left group"
        >
          <div className="flex items-baseline gap-6">
            <span className="font-mono text-[10px] text-zinc-700">0{index + 1}</span>
            <h3 className="font-display text-2xl text-white group-hover:translate-x-1 transition-transform">
              {concept.selected_title || concept.name}
            </h3>
            <div className="hidden md:flex items-center gap-4">
              <RiskBadge level={concept.risk_level} />
              {concept.rating && (
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Zap 
                      key={i} 
                      size={10} 
                      className={cn(i < concept.rating! ? "text-yellow-400 fill-yellow-400" : "text-zinc-800")} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-zinc-700 group-hover:text-zinc-400 transition-colors">
            {isExpanded ? <Minus size={20} /> : <Plus size={20} />}
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-8 pb-10 border-t border-zinc-800/50"
          >
            <div className="pt-8 space-y-8">
              {concept.variations && concept.variations.length > 0 && (
                <div className="space-y-6 p-6 bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <RefreshCcw size={12} className="text-cyan-400" />
                    <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Alternative Angles / Variations</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {concept.variations.map((v, i) => (
                      <div key={i} className="space-y-3 group/var">
                        <h5 className="font-display text-lg text-white group-hover/var:text-cyan-400 transition-colors">{v.name}</h5>
                        <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-3">{v.idea}</p>
                        <div className="pt-2">
                          <RiskBadge level={v.risk_level} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <p className="font-display italic text-2xl text-white leading-tight w-full">
                  {concept.idea}
                </p>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <div className="flex items-center gap-2 px-4 py-2 border border-zinc-800">
                    <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Rate:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRate(star);
                          }}
                          className="transition-transform hover:scale-125"
                        >
                          <Zap 
                            size={12} 
                            className={cn(
                              star <= (concept.rating || 0) 
                                ? "text-yellow-400 fill-yellow-400" 
                                : "text-zinc-700 hover:text-zinc-500"
                            )} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={onGenerateVariations}
                    disabled={isGeneratingVariations}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                  >
                    <RefreshCcw size={12} className={isGeneratingVariations ? "animate-spin" : ""} />
                    {isGeneratingVariations ? "Exploring Angles..." : "Generate Variations"}
                  </button>
                  <button
                    onClick={handleVisualize}
                    disabled={isVisualizing || !!concept.visual_url}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                  >
                    <Sparkles size={12} className={isVisualizing ? "animate-pulse" : ""} />
                    {isVisualizing ? "Visualizing..." : concept.visual_url ? "Mood Board Ready" : "Mood Board"}
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2 border border-zinc-800">
                    <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Aspect Ratio:</span>
                    <div className="flex gap-2">
                      {(["16:9", "9:16"] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetVideoAspectRatio(ratio);
                          }}
                          className={cn(
                            "px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-all",
                            videoAspectRatio === ratio 
                              ? "bg-white text-black" 
                              : "bg-zinc-900 text-zinc-500 hover:text-white"
                          )}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleVisualizeVideo}
                    disabled={isVisualizingVideo || !!concept.visual_video_url}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                  >
                    <Zap size={12} className={isVisualizingVideo ? "animate-pulse" : ""} />
                    {isVisualizingVideo ? "Generating..." : concept.visual_video_url ? "Video Ready" : "Video Snippet"}
                  </button>
                  <button
                    onClick={handleGenerateBackground}
                    disabled={isGeneratingBackground}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                  >
                    <ImageIcon size={12} className={isGeneratingBackground ? "animate-pulse" : ""} />
                    {isGeneratingBackground ? "Generating BG..." : "Atmospheric BG"}
                  </button>
                  <button
                    onClick={() => setShowRefine(!showRefine)}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                  >
                    <RefreshCcw size={12} className={isRefining ? "animate-spin" : ""} />
                    {showRefine ? "Cancel" : "Refine Concept"}
                  </button>
                  <button
                    onClick={onExportPDF}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                  >
                    <Download size={12} />
                    Export PDF
                  </button>
                  <button
                    onClick={onSendToStoryboarder}
                    className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                  >
                    <Layout size={12} />
                    Send to Storyboarder
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b border-zinc-800 pb-2">
                {[
                  { id: "details", label: "Strategic Details" },
                  { id: "storyboard", label: "Storyboard" },
                  { id: "script", label: "Script Snippet" },
                  { id: "higgsfield", label: "Higgsfield DNA" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-widest pb-2 border-b transition-all",
                      activeTab === tab.id 
                        ? "text-white border-white" 
                        : "text-zinc-600 border-transparent hover:text-zinc-400"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "details" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  {/* Title Selection */}
                  <div className="space-y-4">
                    <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Title Options</span>
                    <div className="flex flex-wrap gap-2">
                      {[concept.name, ...(concept.title_options || [])].map((title, i) => (
                        <button
                          key={i}
                          onClick={() => onSelectTitle(title)}
                          className={cn(
                            "px-4 py-2 font-display italic text-lg border transition-all",
                            (concept.selected_title === title || (!concept.selected_title && title === concept.name))
                              ? "bg-white text-black border-white"
                              : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                          )}
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {concept.visual_url && (
                      <div className="relative aspect-video bg-zinc-800 border border-zinc-700 overflow-hidden">
                        <LazyImage 
                          src={concept.visual_url} 
                          alt={concept.name} 
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-4 font-mono text-[10px] text-white/70 uppercase tracking-widest">
                          Mood Board
                        </div>
                      </div>
                    )}

                    {concept.background_url && (
                      <div className="relative aspect-video bg-zinc-800 border border-zinc-700 overflow-hidden">
                        <LazyImage 
                          src={concept.background_url} 
                          alt="Atmospheric Background" 
                          className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-4 font-mono text-[10px] text-white/70 uppercase tracking-widest">
                          Atmospheric BG
                        </div>
                      </div>
                    )}

                    {concept.visual_video_url && (
                      <div className="relative aspect-video bg-zinc-800 border border-zinc-700 overflow-hidden">
                        <video 
                          src={concept.visual_video_url} 
                          controls
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-4 font-mono text-[10px] text-white/70 uppercase tracking-widest pointer-events-none">
                          AI Video Snippet
                        </div>
                      </div>
                    )}
                  </div>

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

                  <div className="p-6 bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <Sparkles size={12} />
                        <span className="font-mono text-[10px] uppercase tracking-widest">AI Visual Prompt (Midjourney / DALL-E)</span>
                      </div>
                      <button 
                        onClick={() => onCopy(concept.ai_visual_prompt)}
                        className="text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="font-mono text-[11px] text-zinc-400 italic leading-relaxed">
                      "{concept.ai_visual_prompt}"
                    </p>
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
                </motion.div>
              )}

              {activeTab === "storyboard" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h4 className="font-display text-xl text-white">Visual Narrative</h4>
                      <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Key frame breakdown</p>
                    </div>
                    <button
                      onClick={handleVisualizeStoryboard}
                      disabled={isVisualizingStoryboard}
                      className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                    >
                      <Sparkles size={12} className={isVisualizingStoryboard ? "animate-pulse" : ""} />
                      {isVisualizingStoryboard ? "Visualizing Frames..." : "Visualize Storyboard"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {concept.storyboard?.map((frame, i) => (
                      <div key={i} className="space-y-3">
                        <div className="relative aspect-video bg-zinc-950 border border-zinc-800 overflow-hidden group/frame">
                          {frame.visual_url ? (
                            <img src={frame.visual_url} alt={`Frame ${i+1}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-800 font-mono text-[10px] uppercase tracking-widest">
                              Frame 0{i+1}
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 font-mono text-[10px] text-white">0{i+1}</div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-zinc-300 leading-relaxed font-medium">{frame.frame_description}</p>
                          <div className="flex gap-2 items-start">
                            <div className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest pt-0.5 shrink-0">Note:</div>
                            <p className="text-[10px] text-zinc-500 italic leading-relaxed">{frame.annotation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "script" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h4 className="font-display text-xl text-white">Script Snippet</h4>
                    <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Tone & Dialogue direction</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-8 font-mono text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap italic">
                    {concept.script_snippet || "No script snippet generated for this concept."}
                  </div>
                </motion.div>
              )}

              {activeTab === "higgsfield" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="space-y-1">
                      <h4 className="font-display text-xl text-white uppercase tracking-tighter">Higgsfield DNA</h4>
                      <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">Optimized for AI Video Generation</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950 border border-zinc-800">
                        <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Recommended Model:</span>
                        <span className="font-display text-sm text-cyan-400">{concept.higgsfield_config?.recommended_model || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950 border border-zinc-800">
                        <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Credit Estimate:</span>
                        <span className="font-display text-sm text-yellow-400">{concept.higgsfield_config?.credit_estimate || 0} Credits</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Camera Physics Layer</span>
                        <div className="p-6 bg-zinc-950 border border-zinc-800 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest">Body</span>
                              <p className="text-xs text-zinc-300">{concept.higgsfield_config?.camera_physics?.body || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest">Lens</span>
                              <p className="text-xs text-zinc-300">{concept.higgsfield_config?.camera_physics?.lens || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest">Focal Length</span>
                              <p className="text-xs text-zinc-300">{concept.higgsfield_config?.camera_physics?.focal_length || "N/A"}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest">Movements</span>
                            <div className="flex flex-wrap gap-2">
                              {concept.higgsfield_config?.camera_physics?.movements?.map((m, i) => (
                                <span key={i} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">{m}</span>
                              )) || <span className="text-xs text-zinc-700 italic">None specified</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Shot Breakdown</span>
                        <div className="space-y-2">
                          {concept.higgsfield_config?.shot_breakdown?.map((shot, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-zinc-950/50 border border-zinc-900">
                              <span className="font-mono text-[10px] text-zinc-700">0{shot.shot}</span>
                              <p className="flex-1 text-[11px] text-zinc-400 leading-relaxed">{shot.description}</p>
                              <span className="font-mono text-[9px] text-zinc-600">{shot.duration}</span>
                            </div>
                          )) || <p className="text-xs text-zinc-700 italic">No breakdown available</p>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Structured Prompt DNA</span>
                          <button 
                            onClick={() => {
                              const dna = concept.higgsfield_config?.prompt_dna;
                              if (dna) {
                                onCopy(`Scene: ${dna.scene_description}\nCamera: ${dna.camera_movement}\nLens/Lighting: ${dna.lens_lighting_specs}\nStyle: ${dna.style_reference}\nDuration: ${dna.duration}`);
                              }
                            }}
                            className="text-zinc-600 hover:text-zinc-400 transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="p-6 bg-zinc-950 border border-zinc-800 space-y-4">
                          <div className="space-y-1">
                            <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest">Scene Description</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{concept.higgsfield_config?.prompt_dna?.scene_description || "N/A"}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest">Camera Movement</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{concept.higgsfield_config?.prompt_dna?.camera_movement || "N/A"}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest">Lens & Lighting</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{concept.higgsfield_config?.prompt_dna?.lens_lighting_specs || "N/A"}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="font-mono text-[8px] text-zinc-700 uppercase tracking-widest">Style Reference</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed italic">{concept.higgsfield_config?.prompt_dna?.style_reference || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      {concept.click_to_ad_brief && (
                        <div className="space-y-4">
                          <span className="font-mono text-[10px] text-[#FF3366] uppercase tracking-widest">Click-to-Ad Brief</span>
                          <div className="p-6 bg-zinc-900/30 border border-zinc-800 space-y-4">
                            <div className="space-y-1">
                              <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Brand Intent</span>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{concept.click_to_ad_brief.brand_intent}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Visual Anchors</span>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{concept.click_to_ad_brief.visual_anchors}</p>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">Target Platform</span>
                              <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[9px] font-mono text-zinc-400 uppercase tracking-wider">{concept.click_to_ad_brief.target_platform}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
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
