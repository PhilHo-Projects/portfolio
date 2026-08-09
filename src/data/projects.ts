export type ProjectStatus = "live" | "public-demo" | "readonly" | "under-construction" | "coming-soon";
export type ProjectDetail = "standard" | "coursework" | "billing-hub" | "job-scraper" | "music-player";

export interface ProjectPreview {
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
    objectPosition?: string;
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
    preview?: ProjectPreview;
    highlights?: ProjectHighlight[];
}

export const projects: Project[] = [
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
            src: "assets/img/hidden-gameplay.webp",
            alt: "Hidden offline practice match showing the blind board, power-ups, timer, and rock paper scissors controls",
            caption: "Offline practice · active blind-board match",
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
        description: "A multi-company workspace that turns time entries and expenses into polished invoices, then keeps every paid and archived record within reach.",
        link: "https://philippeho.dev/InvoicingAndTrackingTool/",
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
        description: "Tracks reading progress across series with a daily scheduler that checks for new chapters. Express + SQLite, self-hosted.",
        link: "https://philippeho.dev/manga-tracker/",
        detail: "standard",
        accent: "#fbbf24",
        icon: "fa-solid fa-book",
        tags: ["Express", "SQLite", "Cron"],
        status: "public-demo",
        detailDescription: "A self-hosted reading library that checks MangaDex for new chapters and keeps a clean, persistent history of what has been read.",
        stackLabel: "Express · SQLite · MangaDex API",
        actionLabel: "Open public demo",
        preview: {
            src: "assets/img/manga-tracker.webp",
            alt: "Manga Tracker public demo showing One Piece and Kagurabachi in the shared library",
            caption: "Shared demo library · resets daily",
            width: 1280,
            height: 720,
        },
        highlights: [
            { icon: "fa-solid fa-magnifying-glass", title: "MangaDex search", detail: "Find titles through MangaDex and add them to a personal or shared demo library." },
            { icon: "fa-solid fa-clock-rotate-left", title: "Scheduled checks", detail: "A daily job looks for new chapters while the public demonstration data resets on schedule." },
            { icon: "fa-solid fa-database", title: "Reading history", detail: "SQLite stores series, chapter state, and read history without requiring a hosted database." },
        ],
    },
    {
        id: "chatsim",
        title: "Chatsim",
        category: "Web Development",
        subtitle: "Animation Tool",
        description: "Build and play back scripted texting animations — a little story engine for fake chat threads, with a JSON-backed editor.",
        link: "https://philippeho.dev/chatsim/",
        detail: "standard",
        accent: "#a78bfa",
        icon: "fa-solid fa-comments",
        tags: ["Node", "SPA"],
        status: "live",
        detailDescription: "A visual story studio for discovering public profiles, authoring scripted conversations, and playing them back as timed phone or battle scenes.",
        stackLabel: "React · TypeScript · Node",
        actionLabel: "Open Chatsim",
        preview: {
            src: "assets/img/chatsim.webp",
            alt: "Chatsim discovery board with public demo profiles and story cover artwork",
            caption: "Public story discovery board",
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
        title: "Personal SoundCloud",
        category: "Web Development",
        visible: false,
        subtitle: "Audio Platform",
        description: "A private streaming archive with custom upload, cover art, and playback logic — a self-hosted take on SoundCloud.",
        link: "https://philippeho.dev/personalsoundcloud/",
        detail: "standard",
        accent: "#fb7185",
        icon: "fa-solid fa-music",
        tags: ["Node", "Uploads"],
        status: "readonly",
        detailDescription: "A self-hosted music surface that turns Google Drive audio links into a browsable library with custom metadata and rich playback feedback.",
        stackLabel: "Node · Express · HTML5 Audio",
        actionLabel: "Open project",
        preview: {
            src: "assets/img/personal-soundcloud.webp",
            alt: "Personal SoundCloud track form and audio player surface with no private tracks loaded",
            caption: "Track metadata · audio player surface",
            width: 1280,
            height: 720,
        },
        highlights: [
            { icon: "fa-brands fa-google-drive", title: "Drive streaming", detail: "Audio streams from Google Drive links through a small Node and Express service." },
            { icon: "fa-solid fa-tags", title: "Track metadata", detail: "The library extracts and stores titles, artists, artwork, descriptions, and optional details." },
            { icon: "fa-solid fa-wave-square", title: "Playback feedback", detail: "Waveform, buffering, playhead, and canvas visualizer states make progress easy to read." },
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
        subtitle: "n8n + Gemini",
        description: "One system collects targeted job listings, normalizes them with an LLM, publishes structured results to a purpose-built dashboard, and sends a ready-to-review digest.",
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
        description: "A responsive desktop player for MP3, WAV, FLAC, M4A, and AAC with hands-on waveform controls, spectral feedback, and beat-aware navigation.",
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
