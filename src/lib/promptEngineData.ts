export type InfraTarget = {
  id: string;
  label: string;
  platform: "Higgsfield" | "Freepik" | "Suno";
  color: string;
};

export const INFRASTRUCTURE_TARGETS: InfraTarget[] = [
  { id: "cinema_studio", label: "Cinema Studio 3.0", platform: "Higgsfield", color: "#FF3366" },
  { id: "click_to_ad", label: "Click-to-Ad", platform: "Higgsfield", color: "#FF3366" },
  { id: "sora_trends", label: "Sora 2 Trends", platform: "Higgsfield", color: "#FF3366" },
  { id: "bullet_time", label: "Bullet Time", platform: "Higgsfield", color: "#FF3366" },
  { id: "giant_product", label: "Giant Product", platform: "Higgsfield", color: "#FF3366" },
  { id: "packshot", label: "Packshot", platform: "Higgsfield", color: "#FF3366" },
  { id: "macro_scene", label: "Macro Scene", platform: "Higgsfield", color: "#FF3366" },
  { id: "commercial_faces", label: "Commercial Faces", platform: "Higgsfield", color: "#FF3366" },
  { id: "asmr_promo", label: "ASMR Promo", platform: "Higgsfield", color: "#FF3366" },
  { id: "sketch_to_real", label: "Sketch-to-Real", platform: "Higgsfield", color: "#FF3366" },
  { id: "soul_cast", label: "Soul Cast + Soul ID", platform: "Higgsfield", color: "#FF3366" },
  { id: "freepik_veo3", label: "Veo 3", platform: "Freepik", color: "#1273EB" },
  { id: "freepik_kling", label: "Kling 2.1", platform: "Freepik", color: "#1273EB" },
  { id: "freepik_seedance", label: "Seedance", platform: "Freepik", color: "#1273EB" },
  { id: "nanobanana", label: "NanoBanana", platform: "Freepik", color: "#1273EB" },
  { id: "suno", label: "Suno (Music)", platform: "Suno", color: "#FFB800" },
];

export const CONCEPT_FRAMEWORKS = [
  {
    id: "universe_series",
    name: "Universe / Series",
    icon: "🌌",
    desc: "Multi-episode world-building (Chronicles of Bone model)",
    prompts: [
      "Dark fantasy reimagining of [PUBLIC DOMAIN CHARACTER] — inverted motivations, original lore mechanics",
      "Prologue episode: establish world rules, introduce antagonist faction, end on irreversible stakes",
      "Character introduction: [ARCHETYPE] with [UNEXPECTED TRAIT] in [GENRE-BENDING SETTING]",
      "Cold open: a hero falls under enemy control — the audience watches them turn"
    ]
  },
  {
    id: "product_cinema",
    name: "Product Cinema",
    icon: "📦",
    desc: "Product ads shot like film scenes — product IS the MacGuffin",
    prompts: [
      "Product placed in cinematic genre scene — the product IS the MacGuffin driving the plot",
      "Heist film but the vault contains YOUR PRODUCT — crew plans extraction",
      "Horror reveal: macro shot discovers product in impossible location",
      "Time-lapse: product assembles itself from raw materials, reverse entropy"
    ]
  },
  {
    id: "fake_trailer",
    name: "Fake Trailer / Fan Film",
    icon: "🎬",
    desc: "Kavan's breakout method — reimagined universes that go viral",
    prompts: [
      "Reimagined trailer for [BELOVED FRANCHISE] in completely new aesthetic/era",
      "What [CHARACTER] was doing during [KNOWN EVENT] — fill the narrative gap",
      "'Lost footage' from unreleased sequel that never got made",
      "Genre-swap: take [KNOWN PROPERTY] and rebuild it as [OPPOSITE GENRE]"
    ]
  },
  {
    id: "viral_bait",
    name: "Scroll-Stop Bait",
    icon: "🔥",
    desc: "Engineered for share velocity — 35-55s sweet spot",
    prompts: [
      "Impossible camera move: start in space, push through atmosphere, land on product",
      "Split-second morph: one object becomes another mid-frame",
      "POV: you're the product being unboxed — first person perspective",
      "Macro world hidden inside everyday object — reveal with slow zoom",
      "Before/after transformation in a single unbroken take",
      "ASMR destruction of product → instant magical rebuild"
    ]
  },
  {
    id: "ugc_hybrid",
    name: "AI-UGC Hybrid",
    icon: "📱",
    desc: "Authentic feel + AI scale (2026 highest ROI format)",
    prompts: [
      "UGC reaction: person discovers product, genuine surprise, phone-camera aesthetic",
      "Testimonial with AI avatar — consistent character across 10+ ad variants",
      "Behind-the-scenes of AI creation process itself (meta-content)",
      "'Day in the life' but the character is AI-generated — uncanny authenticity"
    ]
  },
  {
    id: "music_visual",
    name: "Music Video / Suno Sync",
    icon: "🎵",
    desc: "Dor Brothers style — music-synced AI visuals, beat-mapped cuts",
    prompts: [
      "Generate Suno track first → storyboard visuals to beats and transitions",
      "Fast-cut montage synced to musical beats — each cut on the downbeat",
      "Emotional arc mapped to song structure: verse=tension, chorus=release, bridge=twist",
      "Single continuous shot that evolves with the music — environment morphs with key changes"
    ]
  }
];

export const CAMERA_RIG = {
  bodies: ["RED RAPTOR V", "SONY VENICE", "ARRI ALEXA 35", "ARRIFLEX 16SR", "PANAVISION MILLENNIUM DXL2"],
  lenses: ["Anamorphic 40mm", "85mm f/1.2", "35mm wide", "50mm Summilux", "135mm telephoto"],
  moves: ["Slow dolly-in", "Whip pan", "Crane up reveal", "Steadicam orbit", "Rack focus pull", "Push-in with tilt", "Handheld drift", "FPV drone through", "Static locked tripod"],
  grades: ["Warm golden hour", "Cool desaturated noir", "High contrast editorial", "Teal and orange blockbuster", "Monochrome film grain", "Pastel soft bloom"],
  meta: ["stills archive", "unreleased footage", "leaked production still", "BTS camera test", "dailies scan", "evidence grade"]
};

export const MOODS = ["Cinematic", "Dark Fantasy", "Hyperreal", "Surreal", "Gritty", "Luxe", "Chaotic", "Horror", "Noir", "Epic", "Comedy", "Dreamlike", "Aggressive"];

export const KAVAN_METHODS = {
  temu_version: {
    name: '"Temu Version" Character Design',
    steps: [
      "Photograph yourself in costume/props/masks (real physical objects)",
      "Run through Freepik NanoBanana with detail tags for what to evolve",
      "Iterate 10-20+ versions until character emerges as distinctly yours",
      "This creates copyright paper trail — grounded in YOUR photographs",
      "Lock final character with Soul ID / Custom Characters for consistency"
    ],
    why: "Characters created solely through AI have murky copyright. Physical photo origin = original authorship. This is how Kavan owns every character in Chronicles of Bone."
  },
  universe_building: {
    name: "5-Season Universe Architecture",
    steps: [
      "Write full arc beginning-to-end before generating a single frame",
      "Physical notebooks for character backstories (even ones that never make the script)",
      "Google Docs for screenplays (formatting plugin, not Final Draft)",
      "Google Slides for story bibles — one for Season 1, one for entire show",
      "Reimagine public domain characters with inverted motivations",
      "Design lore mechanics that create real stakes (mind control > blood thirst)"
    ],
    why: "Freepik bought 5 seasons of Chronicles of Bone because the universe was COMPLETE. They didn't buy a video — they bought a world. Build the world first, generate frames second."
  },
  one_man_workflow: {
    name: "Solo Creator Production Pipeline",
    steps: [
      "WRITE: Notebooks → Google Docs (screenplay) → Google Slides (story bible)",
      "IMAGE GEN: Freepik NanoBanana + Spaces for sequential shots — line by line from script",
      "VIDEO GEN: Kling + Veo 3 as primary models",
      "EDIT: Premiere Pro for edit + sound design",
      "COLOR: DaVinci Resolve for grading + effects",
      "UPSCALE: 'Topaz Day' — each clip individually upscaled (Proteus model usually, Iris for some)",
      "SOUND: Layers upon layers in Premiere — described as 'pure chaos' but this is where the magic happens",
      "MUSIC: Suno — write descriptions in your own words → hit AI rewrite → generate 50-60 songs → pick winners in 20 min"
    ],
    why: "One person built a 5-season fantasy epic that got picked up as an Original Series. Every frame, every sound effect, every Suno track."
  },
  suno_method: {
    name: "Suno Music Reverse-Engineering",
    steps: [
      "Write music descriptions in your natural speaking voice (your own nonsensical way)",
      "Hit Suno's AI rewrite to translate into music theory terminology",
      "Generate 50-60 variations per track needed",
      "Listen through all in ~20 minutes (you'll know in the first 10 seconds if it's the one)",
      "Google the instruments Suno suggests to learn what they actually sound like",
      "Keep or remove instruments from prompt based on what you hear",
      "Test selected tracks against visuals for emotional sync"
    ],
    why: "Learning music theory by doing. AI-native composition. Results: soundtracks people want to listen to while driving."
  },
  ip_model: {
    name: "Creator-Owns-100% IP Model (Phantom X)",
    steps: [
      "Creator owns 100% of their IP — studio takes small percentage only",
      "Merchandise, graphic novels, spinoffs = all creator profit",
      "Studio serves the creator, not the other way around",
      "Build IP as an asset: 5 seasons written = sellable package",
      "Public domain source material = no licensing costs",
      "SAG New Media Deal: Kavan helped write the rulebook for AI filmmaking with union talent"
    ],
    why: "Phantom X studio model. The studio serves the creator. First SAG-approved AI film (Echo Hunter). Netflix should've partnered 6 months earlier — Freepik got there first."
  }
};

export function assemblePrompt(config: {
  infra: string;
  subject: string;
  hookText: string;
  mood: string;
  cam: {
    body: string;
    lens: string;
    move: string;
    grade: string;
    meta: string;
  };
  extra: string;
}): { prompt: string; workflow: string; platform: string; label: string } {
  const target = INFRASTRUCTURE_TARGETS.find(t => t.id === config.infra);
  if (!target) return { prompt: "", workflow: "", platform: "", label: "" };

  const { subject, hookText: hook, mood, cam, extra } = config;
  const { body, lens, move, grade, meta } = cam;

  let prompt = "";
  let workflow = "";

  switch (config.infra) {
    case "cinema_studio":
      prompt = `${meta ? meta + ', ' : ''}${hook}. ${subject}. Shot on ${body}, ${lens}. Camera: ${move}. ${mood} mood. ${grade} color grade. Shallow depth of field, cinematic natural lighting, subtle film grain. ${extra}`.trim();
      workflow = `Cinema Studio 3.0 → Soul Cast: create/select character → Set location prompt → Camera body: ${body} → Lens: ${lens} → Genre: ${mood} → Generate Hero Frame batch → Select best as Anchor → Animate with motion prompt. Cinematic reasoning engine interprets narrative intent. Audio generates natively. Up to 9 reference images.`;
      break;
    case "click_to_ad":
      prompt = `Product URL input. Override: ${hook}. ${subject}. ${mood} tone. ${grade} look. ${extra}`.trim();
      workflow = `Higgsfield → Click-to-Ad → Paste product page URL → AI extracts brand intent + visual anchors → Override with prompt for creative direction → 2-5 min generation. Uses GPT-4.1 for deterministic structure.`;
      break;
    case "sora_trends":
      prompt = `${hook}. ${subject}. Style: ${mood}, cinematic. ${grade}. Camera: ${move}. ${extra}`.trim();
      workflow = `Sora 2 Trends → Upload single product/subject image → Select trend template → Paste prompt → Platform applies motion logic + pacing automatically. 150% higher share velocity vs baseline.`;
      break;
    case "soul_cast":
      prompt = `Character: ${subject}. ${hook}. ${mood} aesthetic. Detailed costume design, distinguishing features, unique silhouette. Consistent facial geometry across all shots. ${extra}`.trim();
      workflow = `KAVAN METHOD: 1) Photograph yourself in costume/props → 2) Upload to Freepik NanoBanana with detail tags → 3) Iterate 10-20 versions → 4) Lock final design → 5) Train Soul ID in Higgsfield Cinema Studio → 6) Character stays consistent across all scenes. Creates copyright paper trail via physical photo origin.`;
      break;
    case "nanobanana":
      prompt = `Transform reference photo: ${subject}. Evolve into: ${hook}. Maintain core structure but reimagine: costume details, texture, lighting, atmosphere. ${mood} aesthetic. ${extra}`.trim();
      workflow = `Freepik → NanoBanana → Upload reference photo of yourself in costume/props → Tag specific details to evolve → Iterate until character is distinctly yours → Save as Custom Character for video pipeline. The "Temu Version" method.`;
      break;
    case "suno":
      prompt = `Music for: ${subject}. Mood: ${mood}. ${hook}. ${extra || "Cinematic, emotional, building tension with release."}`.trim();
      workflow = `KAVAN SUNO METHOD: 1) Write description in YOUR natural voice → 2) Hit AI Rewrite → 3) Generate 50-60 variations → 4) Speed-listen ~20 min → 5) Google instruments Suno suggests → 6) Keep/remove from prompt → 7) Test winners against visuals.`;
      break;
    case "freepik_veo3":
    case "freepik_kling":
    case "freepik_seedance":
      prompt = `${meta ? meta + '. ' : ''}A cinematic ${mood} shot of ${subject}. ${hook}. Shot composition: ${move}. ${grade} color palette. Shallow depth of field, natural lighting. ${extra}`.trim();
      if (config.infra === "freepik_veo3") workflow = `Built-in audio generation. Most realistic model.`;
      else if (config.infra === "freepik_kling") workflow = `15 camera perspectives. Best for complex motion.`;
      else workflow = `Best physics simulation — fabric, water, hair.`;
      break;
    default:
      // preset-based
      prompt = `${subject}. ${hook}. ${mood} atmosphere. Cinematic, ${grade}. ${extra}`.trim();
      workflow = `Higgsfield → Select "${target.label}" preset → Upload clean image (sharp, well-lit, simple background) → Paste prompt → Generate. One clear camera move per generation.`;
      break;
  }

  return { prompt, workflow, platform: target.platform, label: target.label };
}
