export type ProjectStatus = "live" | "public-demo" | "readonly" | "under-construction" | "coming-soon";
export type ProjectDetail = "standard" | "coursework" | "billing-hub" | "job-scraper" | "music-player";

export interface ProjectPreview {
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
    objectPosition?: string;
    captionBelow?: boolean;
}

export interface ProjectHighlight {
    icon: string;
    title: string;
    detail: string;
}

export interface Project {
    id: string;
    title: string;
    category: "Game Development" | "Web Development" | "Automation & Systems" | "Native & Tools";
    subtitle?: string;
    description: string;
    link?: string;
    detail: ProjectDetail;
    accent: string;
    icon: string;
    tags?: string[];
    status?: ProjectStatus;
    visible?: boolean;
    detailDescription?: string;
    stackLabel?: string;
    actionLabel?: string;
    statusNote?: string;
    preview?: ProjectPreview;
    highlights?: ProjectHighlight[];
}

export const projects: Project[] = [
    {
        id: "philchat",
        title: "PhilChat",
        category: "Web Development",
        subtitle: "Multi-model chat workspace",
        description: "A self-hosted chat workspace for multiple AI providers, with streaming responses, guest trials, approved accounts, and per-user token budgets.",
        detail: "standard", accent: "#60a5fa", icon: "fa-solid fa-comment-dots",
        tags: ["React", "Node", "SQLite"], status: "live",
        link: "https://chat.philippeho.dev", actionLabel: "Try PhilChat",
        detailDescription: "One chat interface for Google and NVIDIA-hosted models, backed by a server that handles provider credentials, streaming, account approval, and usage limits. The interface is still evolving.",
        stackLabel: "React · Node · SQLite · Better Auth",
        preview: { src: "assets/img/philchat-20260907.webp", alt: "PhilChat guest interface showing the model selector, message composer, and remaining guest allowance", caption: "Public guest workspace · model selection and chat", width: 1280, height: 720, captionBelow: true },
        highlights: [
            { icon: "fa-solid fa-comments", title: "Multiple providers", detail: "Switch between supported models in a shared interface with streamed responses." },
            { icon: "fa-solid fa-user-check", title: "Guests and members", detail: "A limited guest trial leads into owner-approved accounts, with credentials kept on the server." },
            { icon: "fa-solid fa-gauge", title: "Usage budgets", detail: "Per-user monthly token budgets and a global daily ceiling help control inference costs." },
        ],
    },
    {
        id: "tokentracker",
        title: "TokenTracker",
        category: "Automation & Systems",
        subtitle: "AI usage across machines",
        description: "Collects Codex and Claude usage across my computers into one dashboard. The activity heatmap below is powered by its public summary feed.",
        detail: "standard", accent: "#a3e635", icon: "fa-solid fa-chart-simple",
        tags: ["Aggregation", "Automation", "Cloudflare Access"], status: "live",
        link: "#activity", actionLabel: "See the live heatmap below",
        statusNote: "The full dashboard is private. The activity section below shows its public output.",
        detailDescription: "A personal usage dashboard that brings Codex and Claude session totals together across desktop and laptop. Scheduled syncs feed a central aggregator, which publishes a reduced summary for this portfolio without exposing the private dashboard.",
        highlights: [
            { icon: "fa-solid fa-desktop", title: "Across machines", detail: "Bring usage from multiple computers and both coding tools into a single view." },
            { icon: "fa-solid fa-arrows-rotate", title: "Scheduled collection", detail: "Authenticated syncs deliver usage to the central aggregator on a daily schedule." },
            { icon: "fa-solid fa-chart-column", title: "Public proof", detail: "The heatmap below reads the reduced summary: daily activity, tool totals, and token breakdowns." },
        ],
    },
    {
        id: "health-hub",
        title: "Health Hub",
        category: "Web Development",
        subtitle: "Fitbit tracker · under development",
        description: "A personal health-data workspace for sleep, heart rate, calories, and journal context. Under development as I build out a fuller Fitbit companion.",
        detail: "standard", accent: "#2dd4bf", icon: "fa-solid fa-heart-pulse",
        tags: ["TypeScript", "PostgreSQL", "Health data"], status: "under-construction",
        statusNote: "Private project under development. SpO₂ tracking and LLM-assisted analysis are planned, not available yet.",
        detailDescription: "An evolving private health archive with daily views, sleep trends, data inspection, and structured exports. The current focus is getting the underlying records and sync behavior right before expanding the app and adding analysis.",
        highlights: [
            { icon: "fa-solid fa-bed", title: "Daily health context", detail: "Browse sleep, heart-rate, and calorie records alongside dated journal entries." },
            { icon: "fa-solid fa-database", title: "Personal archive", detail: "PostgreSQL preserves source records, with encrypted journal content and resumable synchronization." },
            { icon: "fa-solid fa-file-export", title: "Inspect and export", detail: "Inspect underlying data and prepare structured exports for further analysis." },
        ],
    },
    {
        id: "shaderlab",
        title: "ShaderLab",
        category: "Web Development",
        subtitle: "GPU playground",
        description: "A browser shader playground with a code editor, live GPU previews, and a library of visual experiments in GLSL and WGSL.",
        detail: "standard", accent: "#c084fc", icon: "fa-solid fa-wand-magic-sparkles",
        tags: ["TypeScript", "WebGL2", "WebGPU"], status: "live",
        link: "https://shaderlab.philippeho.dev", actionLabel: "Explore ShaderLab",
        detailDescription: "A hands-on shader lab for editing code and watching the output render on your GPU. The hosted version bundles a shader library and keeps edits in the browser; backend and shader compatibility depend on the browser and example.",
        stackLabel: "TypeScript · Vite · GLSL · WGSL · WebGL2 / WebGPU",
        preview: { src: "assets/img/shaderlab-20260907.webp", alt: "ShaderLab displaying GLSL source beside a live geometric shader preview and compile status", caption: "GLSL editor · live geometric shader preview", width: 1280, height: 720, captionBelow: true },
        highlights: [
            { icon: "fa-solid fa-code", title: "Code beside output", detail: "Edit shader source beside its rendered preview, with compile feedback and runtime statistics." },
            { icon: "fa-solid fa-layer-group", title: "Shader library", detail: "Browse bundled visual experiments across GLSL and WGSL." },
            { icon: "fa-solid fa-image", title: "Preview controls", detail: "Adjust rendering resolution, control playback, and export a PNG of the result." },
        ],
    },
    {
        id: "hidden",
        title: "Hidden",
        category: "Game Development",
        subtitle: "Blind-board Strategy Game",
        description: "A browser strategy game built around hidden information — place rock, paper, and scissors on a blind 3×3 board, use tactical power-ups, and battle a bot or another player online.",
        link: "https://hidden.philippeho.dev",
        detail: "standard",
        accent: "#facc15",
        icon: "fa-solid fa-eye-slash",
        tags: ["React", "TypeScript", "WebSocket"],
        status: "live",
        detailDescription: "A turn-based strategy game that mixes a concealed 3×3 board with rock-paper-scissors matchups, tactical power-ups, and fast browser-based matches.",
        stackLabel: "React · TypeScript · WebSocket · PostgreSQL",
        actionLabel: "Play Hidden",
        preview: {
            src: "assets/img/hidden-round-five-20260907.webp",
            alt: "Hidden round-five practice match with red, blue, and concealed board tiles, power-ups, and rock paper scissors controls",
            caption: "Round five · offline practice against a bot",
            captionBelow: true,
            width: 1280,
            height: 720,
        },
        highlights: [
            {
                icon: "fa-solid fa-table-cells",
                title: "Blind-board tactics",
                detail: "A concealed 3×3 board combines tic-tac-toe positioning, Battleship-style uncertainty, and rock-paper-scissors matchups.",
            },
            {
                icon: "fa-solid fa-people-arrows-left-right",
                title: "Online and offline play",
                detail: "WebSocket quick matching supports live opponents while configurable practice keeps the full game playable against a bot.",
            },
            {
                icon: "fa-solid fa-database",
                title: "Production account backend",
                detail: "Optional accounts and browser sessions persist in PostgreSQL while unrestricted guest play remains available.",
            },
        ],
    },
    {
        id: "unreal-engine-5",
        title: "Unreal Engine 5",
        category: "Game Development",
        subtitle: "Coursework",
        description: "Advanced C++ multiplayer coursework — dedicated servers on AWS GameLift, gameplay frameworks, and networked systems.",
        detail: "coursework",
        accent: "#e5e7eb",
        icon: "devicon-unrealengine-original",
        tags: ["C++", "GameLift", "Multiplayer"],
    },
    {
        id: "billing-hub",
        title: "Billing Hub",
        category: "Web Development",
        subtitle: "Freelance operations workspace",
        description: "A freelance billing workspace with separate member accounts — turn time and expenses into polished invoices, track payments, and keep each member's company records private.",
        link: "https://billinghub.philippeho.dev/",
        detail: "billing-hub",
        accent: "#fbbf24",
        icon: "fa-solid fa-file-invoice-dollar",
        status: "live",
    },
    {
        id: "turboreader",
        title: "TurboReader",
        category: "Web Development",
        subtitle: "Developer Tool",
        description: "A high-speed reading interface using RSVP — flashing words one at a time to push reading speed well past normal.",
        link: "https://philippeho.dev/TurboReader/",
        detail: "standard",
        accent: "#34d399",
        icon: "fa-solid fa-bolt",
        tags: ["RSVP", "Vanilla JS"],
        status: "live",
        detailDescription: "A focused rapid-reading tool that turns pasted or dropped documents into an adjustable one-word-at-a-time reading session.",
        stackLabel: "Vanilla JS · Vite · Tailwind CSS",
        actionLabel: "Open TurboReader",
        preview: {
            src: "assets/img/turboreader.webp",
            alt: "TurboReader interface with the RSVP visualizer, source text, progress, and speed controls",
            caption: "Reader visualizer · loaded source text",
            width: 1280,
            height: 720,
        },
        highlights: [
            { icon: "fa-solid fa-eye", title: "ORP highlighting", detail: "The optimal recognition point is emphasized so the eye can stay anchored as words advance." },
            { icon: "fa-solid fa-gauge-high", title: "Adjustable pace", detail: "Reading speed moves from a comfortable 300 WPM through 900+ WPM practice sessions." },
            { icon: "fa-solid fa-file-arrow-up", title: "Document input", detail: "Paste text directly or drag in TXT and Markdown files, then jump to any word in the source." },
        ],
    },
    {
        id: "manga-tracker",
        title: "Manga Tracker",
        category: "Web Development",
        subtitle: "Full-stack App",
        description: "A multi-user reading library with MangaUpdates search, daily chapter checks, and private progress tracking. Visitors can explore a read-only demo.",
        link: "https://manga.philippeho.dev",
        detail: "standard",
        accent: "#fbbf24",
        icon: "fa-solid fa-book",
        tags: ["TypeScript", "SQLite", "Better Auth"],
        status: "public-demo",
        detailDescription: "A self-hosted, multi-user reading library built in strict TypeScript. Approved members get isolated libraries and reading history, while visitors can browse a read-only demo.",
        stackLabel: "TypeScript · Express 5 · SQLite · Better Auth · MangaUpdates",
        actionLabel: "Open public demo",
        preview: {
            src: "assets/img/manga-tracker.webp",
            alt: "Manga Tracker library showing One Piece and Kagurabachi with reading progress",
            caption: "Reading library · series and chapter progress",
            width: 1280,
            height: 720,
        },
        highlights: [
            { icon: "fa-solid fa-magnifying-glass", title: "MangaUpdates search", detail: "Find series through MangaUpdates and keep chapter progress together in one library." },
            { icon: "fa-solid fa-clock-rotate-left", title: "Daily chapter checks", detail: "Scheduled checks look for new chapters while SQLite preserves series, chapter state, and reading history." },
            { icon: "fa-solid fa-user-lock", title: "Independent libraries", detail: "Owner-approved accounts receive isolated libraries; anonymous visitors explore a read-only demo." },
        ],
    },
    {
        id: "chatsim",
        title: "Chatsim",
        category: "Web Development",
        subtitle: "Animation Tool",
        description: "Build and play back scripted texting animations — a little story engine for fake chat threads, with a JSON-backed editor.",
        link: "https://chatsim.philippeho.dev",
        detail: "standard",
        accent: "#a78bfa",
        icon: "fa-solid fa-comments",
        tags: ["Node", "SPA"],
        status: "live",
        detailDescription: "A visual story studio for discovering public profiles, authoring scripted conversations, and playing them back as timed phone or battle scenes.",
        stackLabel: "React · TypeScript · Node",
        actionLabel: "Open Chatsim",
        preview: {
            src: "assets/img/chatsim-landing-20260907.webp",
            alt: "Chatsim landing page with a neon stick-figure profile carousel and profile search",
            caption: "Landing page · featured profiles and story discovery",
            captionBelow: true,
            width: 1280,
            height: 720,
        },
        highlights: [
            { icon: "fa-solid fa-compass", title: "Story discovery", detail: "Browse a public profile board and open authored stories through a social-style interface." },
            { icon: "fa-solid fa-mobile-screen-button", title: "Timed playback", detail: "Scripts play as phone conversations or battle scenes with controlled message timing." },
            { icon: "fa-solid fa-pen-to-square", title: "Persistent editing", detail: "A JSON-backed editor keeps profiles, scenes, and scripted dialogue available between sessions." },
        ],
    },
    {
        id: "personal-soundcloud",
        title: "CloudSound",
        category: "Web Development",
        subtitle: "Self-hosted Audio Platform",
        description: "A self-hosted long-form audio library with public listening, approved member uploads, resumable R2 storage, and a custom waveform player.",
        link: "https://cloudsound.philippeho.dev",
        detail: "standard",
        accent: "#ff4b12",
        icon: "fa-solid fa-music",
        tags: ["React", "Fastify", "R2"],
        status: "live",
        detailDescription: "CloudSound is a self-hosted long-form audio library that lets anyone listen while approved members upload and manage their own sets through a resilient direct-to-R2 pipeline.",
        stackLabel: "React · TypeScript · Fastify · SQLite · Cloudflare R2",
        actionLabel: "Open CloudSound",
        preview: {
            src: "assets/img/cloudsound.webp",
            alt: "CloudSound public set library with search, layout, and sorting controls",
            caption: "Public set library · search, layout, and sorting",
            width: 1280,
            height: 720,
        },
        highlights: [
            { icon: "fa-solid fa-cloud-arrow-up", title: "Direct-to-R2 uploads", detail: "Resumable multipart uploads send MP3s straight to private R2 storage, with retryable chunks and post-upload metadata processing." },
            { icon: "fa-solid fa-users", title: "Approved accounts", detail: "Owner-approved signups, per-member libraries, and storage quotas keep management scoped to each contributor." },
            { icon: "fa-solid fa-wave-square", title: "Custom playback", detail: "Signed playback URLs, server-generated waveforms, spectrum feedback, and persistent player controls support long-form sets." },
        ],
    },
    {
        id: "mp3-maker",
        title: "MP3 Maker",
        category: "Web Development",
        visible: false,
        subtitle: "Audio Utility",
        description: "Converts SoundCloud and Bandcamp links into clean audio files. Wraps yt-dlp + ffmpeg behind a simple UI.",
        link: "https://philippeho.dev/mp3maker/",
        detail: "standard",
        accent: "#38bdf8",
        icon: "fa-solid fa-headphones",
        tags: ["Node", "yt-dlp", "ffmpeg"],
        status: "live",
        detailDescription: "A focused browser utility that accepts SoundCloud and Bandcamp URLs, converts the source, and returns a properly tagged audio file.",
        stackLabel: "Node · yt-dlp · ffmpeg",
        actionLabel: "Open MP3 Maker",
        preview: {
            src: "assets/img/mp3-maker.webp",
            alt: "MP3 Maker landing screen with a SoundCloud or Bandcamp URL field and Convert action",
            caption: "SoundCloud and Bandcamp converter",
            width: 1280,
            height: 720,
        },
        highlights: [
            { icon: "fa-solid fa-link", title: "Simple source input", detail: "One field accepts supported SoundCloud and Bandcamp URLs without exposing conversion details." },
            { icon: "fa-solid fa-gears", title: "Conversion pipeline", detail: "yt-dlp resolves the source while ffmpeg produces a clean, downloadable audio file." },
            { icon: "fa-solid fa-bars-progress", title: "Live progress", detail: "Server-sent events report conversion stages before embedded artwork and metadata are returned." },
        ],
    },
    {
        id: "wave-function-collapse",
        title: "Wave Function Collapse",
        category: "Web Development",
        subtitle: "Generative Viz",
        description: "An interactive visualiser of the Wave Function Collapse algorithm — procedural tile generation rendered live on canvas.",
        link: "https://philippeho.dev/wfc/",
        detail: "standard",
        accent: "#84cc16",
        icon: "fa-solid fa-shapes",
        tags: ["React", "Canvas", "Algorithm"],
        status: "live",
        detailDescription: "An interactive algorithm lab for building tile constraints and exploring procedural island generation across several 2D and 3D modes.",
        stackLabel: "React · Three.js · Delaunay",
        actionLabel: "Explore visualizer",
        preview: {
            src: "assets/img/wave-function-collapse.webp",
            alt: "Wave Function Collapse Townscaper procedural view with a generated island and control panel",
            caption: "Townscaper Procedural · generated island",
            width: 1280,
            height: 720,
        },
        highlights: [
            { icon: "fa-solid fa-cubes", title: "2D and 3D modes", detail: "Move between explainers, builders, Townscaper studies, and procedural 3D experiments." },
            { icon: "fa-solid fa-sliders", title: "Procedural controls", detail: "Tune density, water, vegetation, and civilization to reshape each generated result." },
            { icon: "fa-solid fa-diagram-project", title: "Geometry stack", detail: "React drives the interface while Three.js and Delaunay geometry render the experiments." },
        ],
    },
    {
        id: "job-scraper",
        title: "Automated Job Intelligence Pipeline",
        category: "Automation & Systems",
        subtitle: "Multi-user job search + automation",
        description: "An automated job-search workspace: targeted listings and AI enrichment feed independent user boards, with personal notes, application tracking, and budgeted scrape requests.",
        link: "https://jobs.philippeho.dev/job-viewer/",
        detail: "job-scraper",
        accent: "#22d3ee",
        icon: "fa-solid fa-robot",
        status: "live",
    },
    {
        id: "classaction-scanner",
        title: "ClassAction Scanner",
        category: "Automation & Systems",
        subtitle: "AI Scraper",
        description: "Scans public class-action sources, ranks matches, and uses Gemini to structure results for a searchable dashboard. Python + SQLite with n8n-ready outputs.",
        link: "https://philippeho.dev/classactions/",
        detail: "standard",
        accent: "#c084fc",
        icon: "fa-solid fa-robot",
        tags: ["Python", "Gemini", "n8n"],
        status: "under-construction",
        detailDescription: "A working research dashboard backed by a keyword-filtered crawler and structured extraction pipeline, with notification automation still being completed.",
        stackLabel: "Python · Gemini · SQLite · n8n",
        actionLabel: "Open working preview",
        preview: {
            src: "assets/img/classaction-scanner.webp",
            alt: "ClassAction Scanner public dashboard with open and watched class-action results",
            caption: "Public results dashboard · populated feed",
            width: 1280,
            height: 720,
        },
        highlights: [
            { icon: "fa-solid fa-filter", title: "Targeted crawler", detail: "Keyword scoring filters public sources before promising class actions reach extraction." },
            { icon: "fa-solid fa-wand-magic-sparkles", title: "Structured extraction", detail: "Gemini turns source pages into consistent eligibility, deadline, jurisdiction, and payout fields." },
            { icon: "fa-solid fa-database", title: "Durable outputs", detail: "SQLite content hashes prevent duplicates while JSON, CSV, feed, and n8n outputs support delivery." },
        ],
    },
    {
        id: "music-player",
        title: "MusicPlayer",
        category: "Native & Tools",
        subtitle: "Released desktop app",
        description: "A native Rust player for DJs, with Traktor BPM and key analysis, spectral waveforms, and bar-accurate navigation. Optimized for long sets with less memory and faster playback startup.",
        detail: "music-player",
        accent: "#fb923c",
        icon: "devicon-rust-plain",
        status: "live",
    },
    {
        id: "song-finder",
        title: "Song Finder",
        category: "Native & Tools",
        subtitle: "Search Tool",
        description: "A fast Rust tool that indexes and searches a local music collection across USB drives and disks — find any track by name in milliseconds. Demo walkthrough coming soon.",
        detail: "standard",
        accent: "#2dd4bf",
        icon: "devicon-rust-plain",
        tags: ["Rust", "Search", "CLI"],
        status: "coming-soon",
    },
];
