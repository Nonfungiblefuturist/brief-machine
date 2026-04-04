import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleGenAI, Type, ThinkingLevel, Modality, GenerateContentResponse } from "@google/genai";

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
  Camera
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
- A "video_hook" — A 3-second hook for social media (TikTok/Reels) to grab attention immediately.`;

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
  Timestamp,
  User
} from './firebase';

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

interface SavedProject {
  id: string;
  name: string;
  input: string;
  frames: StoryboardFrame[];
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
}

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
  const [view, setView] = useState<"input" | "loading" | "results" | "trends" | "prompt" | "storyboarder" | "shortlist" | "compare" | "projects">("input");
  const [mode, setMode] = useState<"standard" | "surreal">("standard");
  const [briefInput, setBriefInput] = useState("");
  const [videoLength, setVideoLength] = useState<string>(":30s");
  const [inspiration, setInspiration] = useState<"original" | "movie" | "ad" | "viral">("original");
  const [selectedConcepts, setSelectedConcepts] = useState<number[]>([]);
  const [selectedTrends, setSelectedTrends] = useState<number[]>([]);
  const [quickFireResults, setQuickFireResults] = useState<string[]>([]);
  const [results, setResults] = useState<Results | null>(null);
  const [trends, setTrends] = useState<Trend[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [expandedConcept, setExpandedConcept] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [pastRatings, setPastRatings] = useState<{ concept: string; rating: number }[]>([]);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState<number | null>(null);
  const [filterRating, setFilterRating] = useState<number>(0);
  const [storyboarderInput, setStoryboarderInput] = useState("");
  const [storyboarderProjectName, setStoryboarderProjectName] = useState("Untitled Project");
  const [storyboarderImages, setStoryboarderImages] = useState<string[]>([]);
  const [storyboarderFrames, setStoryboarderFrames] = useState<StoryboardFrame[]>([]);
  const [isGeneratingStoryboarder, setIsGeneratingStoryboarder] = useState(false);
  const [isGeneratingIndividualFrame, setIsGeneratingIndividualFrame] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [isFetchingMoreTrends, setIsFetchingMoreTrends] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [isExportingImages, setIsExportingImages] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [refiningFrameIndex, setRefiningFrameIndex] = useState<number | null>(null);
  const [refinementFeedback, setRefinementFeedback] = useState("");
  const [isMultiShot, setIsMultiShot] = useState(false);
  const [higgsfieldModel, setHiggsfieldModel] = useState<string>("Cinema Studio");
  const [clickToAdFields, setClickToAdFields] = useState({
    productUrl: "",
    brandIntent: "",
    visualAnchors: "",
    targetPlatform: "IG Reels"
  });
  const [cameraPhysics, setCameraPhysics] = useState({
    body: "ARRI Alexa LF",
    lens: "Prime",
    focalLength: "35mm",
    movements: [] as string[]
  });

  const getCreditEstimate = (model: string, length: string) => {
    const base = model === "Cinema Studio" ? 100 : 50;
    const multiplier = length === ":60s" ? 2 : length === ":30s" ? 1 : 0.5;
    return Math.round(base * multiplier);
  };

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

  const saveStoryboard = async () => {
    if (!user) {
      setError("Please sign in to save your work.");
      return;
    }
    if (storyboarderFrames.length === 0) return;

    setIsSaving(true);
    const projectId = storyboarderProjectName.replace(/\s+/g, '-').toLowerCase() + '-' + Date.now();
    const path = `storyboards/${projectId}`;
    try {
      const projectRef = doc(db, "storyboards", projectId);
      
      const projectData = {
        userId: user.uid,
        name: storyboarderProjectName,
        input: storyboarderInput,
        frames: storyboarderFrames,
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
    setStoryboarderProjectName(project.name);
    setStoryboarderInput(project.input);
    setStoryboarderFrames(project.frames);
    setView("storyboarder");
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
    if (!briefInput.trim()) return;
    setError(null);
    setView("loading");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const pastPreferences = pastRatings
        .filter(r => r.rating >= 4)
        .map(r => r.concept)
        .join("\n- ");

      // Combined prompt for Strategic Foundation, 3 Deep Concepts, and 5 Quick Provocations
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `USER BRIEF / INPUT: ${briefInput}
TARGET VIDEO LENGTH: ${videoLength}
INSPIRATION MODE: ${inspiration.toUpperCase()}
MODE: ${mode === "surreal" ? "SURREAL AI (Impossible Scenarios)" : "STANDARD STRATEGY"}

HIGGSFIELD USER SELECTIONS:
- Selected Model: ${higgsfieldModel}
- Multi-Shot Sequence: ${isMultiShot ? "YES" : "NO"}
- Camera Physics: 
  - Body: ${cameraPhysics.body}
  - Lens: ${cameraPhysics.lens}
  - Focal Length: ${cameraPhysics.focalLength}
  - Movements: ${cameraPhysics.movements.join(", ") || "None"}
${inspiration === "ad" ? `
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
4. For each concept, ensure the 'higgsfield_config' reflects the user's selected model and camera physics, and if Multi-Shot is 'YES', provide a detailed shot breakdown.

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
      setView("results");
    } catch (e) {
      console.error(e);
      setError("Generation failed. The creative director is having a breakdown. Try again.");
      setView("input");
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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

      const imgResponse = await ai.models.generateContent({
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
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

      const response = await ai.models.generateContent({
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
          const imgResponse = await ai.models.generateContent({
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

  const fetchTrends = async (loadMore = false) => {
    if (loadMore) setIsFetchingMoreTrends(true);
    else setView("loading");
    
    setLoadingMsg("Scanning the zeitgeist...");
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const updatedStoryboard = [...concept.storyboard];

      for (let i = 0; i < updatedStoryboard.length; i++) {
        const frame = updatedStoryboard[i];
        const response = await ai.models.generateContent({
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let operation = await ai.models.generateVideos({
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
        operation = await ai.operations.getVideosOperation({ operation: operation });
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
      
      <div className="relative z-10 w-full px-6 md:px-12 py-12 md:py-20">
        {/* Header */}
        <header className="mb-16 border-b border-zinc-800 pb-10">
          <div className="flex justify-between items-start mb-10">
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

          <nav className="flex flex-wrap gap-2 mt-8">
            {[
              { id: "input", label: "Creative Engine", icon: Zap },
              { id: "trends", label: "Trend Scanner", icon: Search, action: fetchTrends },
              { id: "storyboarder", label: "Auto Storyboarder", icon: Layout },
              { id: "projects", label: "Saved Projects", icon: Folder, action: user ? () => { fetchSavedProjects(user.uid); setView("projects"); } : undefined },
              { id: "shortlist", label: "Shortlist", icon: Check },
              { id: "prompt", label: "Prompt DNA", icon: Code },
            ].map((item) => (
              <button
                key={item.id}
                disabled={item.id === "projects" && !user}
                onClick={() => item.action ? item.action() : setView(item.id as any)}
                className={cn(
                  "font-mono text-[10px] uppercase tracking-widest px-4 py-2 border transition-all flex items-center gap-2",
                  (view === item.id || (item.id === "input" && view === "results"))
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300",
                  item.id === "projects" && !user && "opacity-30 cursor-not-allowed"
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
                      { id: "viral", label: "Viral/Far-fetched", icon: <Sparkles size={12} /> },
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
                    {[":15s", ":30s", ":60s", "Long Form", "Teaser", "Pilot"].map((l) => (
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
                </div>
              </div>

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
                    {["Kling 3.0", "Veo 3.1", "Cinema Studio", "Click-to-Ad"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setHiggsfieldModel(m)}
                        className={cn(
                          "px-3 py-3 font-mono text-[9px] uppercase tracking-widest border transition-all",
                          higgsfieldModel === m
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-zinc-900/30 border border-zinc-800">
                    <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Est. Credit Cost:</span>
                    <span className="font-display text-sm text-yellow-500">{getCreditEstimate(higgsfieldModel, videoLength)} Credits</span>
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
              </div>

              {/* Camera Physics Section */}
              <div className="p-8 bg-zinc-900/30 border border-zinc-800 space-y-8">
                <div className="flex items-center gap-2">
                  <Camera size={14} className="text-zinc-500" />
                  <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">Camera Physics Layer</span>
                </div>
                
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
                            : "bg-zinc-950 text-zinc-600 border-zinc-800 hover:border-zinc-700"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Click-to-Ad Section (Conditional) */}
              <AnimatePresence>
                {inspiration === "ad" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 bg-cyan-950/10 border border-cyan-900/30 space-y-8">
                      <div className="flex items-center gap-2">
                        <Zap size={14} className="text-cyan-400" />
                        <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">Click-to-Ad Configuration</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] text-cyan-800 uppercase tracking-widest">Product URL</label>
                          <input 
                            type="text"
                            value={clickToAdFields.productUrl}
                            onChange={(e) => setClickToAdFields({...clickToAdFields, productUrl: e.target.value})}
                            placeholder="https://brand.com/product"
                            className="w-full bg-zinc-950 border border-cyan-900/30 px-4 py-3 text-sm text-cyan-400 outline-none focus:border-cyan-500 transition-colors placeholder:text-cyan-900"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="font-mono text-[9px] text-cyan-800 uppercase tracking-widest">Target Platform</label>
                          <div className="grid grid-cols-2 gap-2">
                            {["IG Reels", "TikTok", "YouTube Shorts", "Meta Feed"].map(p => (
                              <button
                                key={p}
                                onClick={() => setClickToAdFields({...clickToAdFields, targetPlatform: p})}
                                className={cn(
                                  "px-3 py-2 font-mono text-[9px] uppercase tracking-widest border transition-all",
                                  clickToAdFields.targetPlatform === p
                                    ? "bg-cyan-400 text-black border-cyan-400"
                                    : "bg-zinc-950 text-cyan-900 border-cyan-900/30 hover:border-cyan-700"
                                )}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="font-mono text-[9px] text-cyan-800 uppercase tracking-widest">Brand Intent Summary</label>
                        <textarea 
                          value={clickToAdFields.brandIntent}
                          onChange={(e) => setClickToAdFields({...clickToAdFields, brandIntent: e.target.value})}
                          placeholder="What is the primary goal of this ad? (e.g. Drive sales for new winter collection)"
                          className="w-full bg-zinc-950 border border-cyan-900/30 px-4 py-3 text-sm text-cyan-400 outline-none focus:border-cyan-500 transition-colors placeholder:text-cyan-900 min-h-[80px] resize-none"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="font-mono text-[9px] text-cyan-800 uppercase tracking-widest">Visual Anchors</label>
                        <textarea 
                          value={clickToAdFields.visualAnchors}
                          onChange={(e) => setClickToAdFields({...clickToAdFields, visualAnchors: e.target.value})}
                          placeholder="Key visual elements to maintain (e.g. Logo placement, specific product color)"
                          className="w-full bg-zinc-950 border border-cyan-900/30 px-4 py-3 text-sm text-cyan-400 outline-none focus:border-cyan-500 transition-colors placeholder:text-cyan-900 min-h-[80px] resize-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={generateConcepts}
                disabled={!briefInput.trim()}
                className={cn(
                  "w-full py-8 font-display italic text-3xl transition-all duration-500 flex items-center justify-center gap-4 group shadow-2xl",
                  briefInput.trim() 
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

          {/* STORYBOARDER VIEW */}
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

                  <div className="space-y-2">
                    <label className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">The Script / Story</label>
                    <textarea 
                      value={storyboarderInput}
                      onChange={(e) => setStoryboarderInput(e.target.value)}
                      placeholder="Describe the scene, the action, or paste a script snippet..."
                      className="w-full bg-black/50 border border-zinc-800 p-6 text-white font-display text-xl focus:border-white focus:outline-none transition-all min-h-[200px] resize-none"
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
                            <img src={img} className="w-full h-full object-cover" />
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
                          onClick={saveStoryboard}
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
                  
                  <div ref={storyboardRef} className="space-y-8 p-12 bg-[#000000] border border-[#27272a]">
                    <div className="border-b border-[#27272a] pb-8 mb-8">
                      <h2 className="font-display text-4xl text-[#ffffff] italic mb-2">{storyboarderProjectName}</h2>
                      <div className="flex justify-between items-end">
                        <p className="font-mono text-[10px] text-[#71717a] uppercase tracking-widest w-full">
                          {storyboarderInput.slice(0, 200)}{storyboarderInput.length > 200 ? '...' : ''}
                        </p>
                        <div className="text-right">
                          <p className="font-mono text-[10px] text-[#52525b] uppercase tracking-widest">Generated By</p>
                          <p className="font-display text-lg text-[#ffffff] italic">Brief Machine AI</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      {storyboarderFrames.map((frame, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="space-y-4 group/frame"
                      >
                        <div className="relative aspect-video bg-[#09090b] border border-[#27272a] overflow-hidden group">
                          {frame.visual_url ? (
                            <img src={frame.visual_url} className="w-full h-full object-cover" />
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
                        
                        <div className="space-y-4 p-6 bg-[rgba(24,24,27,0.3)] border border-[#27272a]">
                          {refiningFrameIndex === i && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="pb-4 space-y-3 border-b border-[rgba(39,39,42,0.5)] mb-4"
                            >
                              <label className="font-mono text-[9px] text-cyan-500 uppercase tracking-widest">Refinement Feedback</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  value={refinementFeedback}
                                  onChange={(e) => setRefinementFeedback(e.target.value)}
                                  placeholder="e.g., 'Make it more moody', 'Add a red car'..."
                                  className="flex-1 bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:ring-1 focus:ring-cyan-500 outline-none"
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
                            <label className="font-mono text-[9px] text-[#52525b] uppercase tracking-widest">Visual Description</label>
                            <textarea 
                              value={frame.frame_description}
                              onChange={(e) => updateStoryboardFrame(i, { frame_description: e.target.value })}
                              placeholder="Describe the shot..."
                              className="w-full bg-transparent border-none p-0 text-sm text-[#e4e4e7] leading-relaxed font-medium focus:ring-0 resize-none h-20"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[rgba(39,39,42,0.5)]">
                            <div className="space-y-1">
                              <label className="font-mono text-[8px] text-[#52525b] uppercase tracking-widest">Camera</label>
                              <input 
                                type="text"
                                value={frame.camera_angle || ""}
                                onChange={(e) => updateStoryboardFrame(i, { camera_angle: e.target.value })}
                                placeholder="Dolly, Crane..."
                                className="w-full bg-transparent border-none p-0 text-[10px] text-[#e4e4e7] focus:ring-0"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-mono text-[8px] text-[#52525b] uppercase tracking-widest">Lighting</label>
                              <input 
                                type="text"
                                value={frame.lighting || ""}
                                onChange={(e) => updateStoryboardFrame(i, { lighting: e.target.value })}
                                placeholder="Golden hour..."
                                className="w-full bg-transparent border-none p-0 text-[10px] text-[#e4e4e7] focus:ring-0"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-mono text-[8px] text-[#52525b] uppercase tracking-widest">Atmosphere</label>
                              <input 
                                type="text"
                                value={frame.atmosphere || ""}
                                onChange={(e) => updateStoryboardFrame(i, { atmosphere: e.target.value })}
                                placeholder="Gritty, Dreamy..."
                                className="w-full bg-transparent border-none p-0 text-[10px] text-[#e4e4e7] focus:ring-0"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2 pt-4 border-t border-[rgba(39,39,42,0.5)]">
                            <label className="font-mono text-[9px] text-[#52525b] uppercase tracking-widest">Director's Note</label>
                            <textarea 
                              value={frame.annotation}
                              onChange={(e) => updateStoryboardFrame(i, { annotation: e.target.value })}
                              placeholder="Camera moves, sound, text..."
                              className="w-full bg-transparent border-none p-0 text-[10px] text-[#71717a] italic leading-relaxed focus:ring-0 resize-none h-12"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center pt-8" data-html2canvas-ignore="true">
                  <button 
                    onClick={addStoryboardFrame}
                    className="font-mono text-[10px] uppercase tracking-widest px-8 py-4 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2"
                  >
                    <Plus size={12} />
                    Add New Shot
                  </button>
                </div>
              </div>
            )}
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
                      className="group bg-zinc-900/30 border border-zinc-800 p-8 hover:border-zinc-600 transition-all flex justify-between items-center"
                    >
                      <div className="space-y-2 flex-1 cursor-pointer" onClick={() => loadProject(project)}>
                        <div className="flex items-center gap-4">
                          <h3 className="font-display text-2xl text-white group-hover:text-zinc-200 transition-colors">
                            {project.name}
                          </h3>
                          <span className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest">
                            {project.frames.length} Shots
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let operation = await ai.models.generateVideos({
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
        operation = await ai.operations.getVideosOperation({ operation: operation });
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
                        <img 
                          src={concept.visual_url} 
                          alt={concept.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-4 font-mono text-[10px] text-white/70 uppercase tracking-widest">
                          Mood Board
                        </div>
                      </div>
                    )}

                    {concept.background_url && (
                      <div className="relative aspect-video bg-zinc-800 border border-zinc-700 overflow-hidden">
                        <img 
                          src={concept.background_url} 
                          alt="Atmospheric Background" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
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
                          <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest">Click-to-Ad Brief</span>
                          <div className="p-6 bg-cyan-950/10 border border-cyan-900/30 space-y-4">
                            <div className="space-y-1">
                              <span className="font-mono text-[8px] text-cyan-800 uppercase tracking-widest">Brand Intent</span>
                              <p className="text-[11px] text-cyan-400/80 leading-relaxed">{concept.click_to_ad_brief.brand_intent}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-mono text-[8px] text-cyan-800 uppercase tracking-widest">Visual Anchors</span>
                              <p className="text-[11px] text-cyan-400/80 leading-relaxed">{concept.click_to_ad_brief.visual_anchors}</p>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-[8px] text-cyan-800 uppercase tracking-widest">Target Platform</span>
                              <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-900 text-[9px] font-mono text-cyan-400 uppercase tracking-wider">{concept.click_to_ad_brief.target_platform}</span>
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
