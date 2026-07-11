export interface Project {
    title: string;
    category: "Game Development" | "Web Development" | "Automation & Systems" | "Native & Tools";
    subtitle?: string;        // small label above the title
    description: string;
    link: string;             // URL the modal opens (live app, image, or "#")
    type: "modal" | "image" | "certificate" | "soon";
    accent: string;           // hex accent color, e.g. "#22d3ee"
    icon: string;             // FontAwesome or devicon class for the preview strip
    tags?: string[];          // tech chips
    status?: "live" | "readonly"; // demo badge in the preview strip
}

export const projects: Project[] = [
    // --- Game Development ---
    {
        title: "ChatroomWars",
        category: "Game Development",
        subtitle: "Multiplayer Game",
        description: "A Unity WebGL game with a hand-rolled WebSocket backend. Live rooms, usernames, and real-time msgpack networking — playable right in the browser.",
        link: "https://philippeho.dev/hiddengame/",
        type: "modal",
        accent: "#22d3ee",
        icon: "devicon-unity-plain",
        tags: ["Unity", "WebGL", "WebSocket"],
        status: "live"
    },
    {
        title: "Unreal Engine 5",
        category: "Game Development",
        subtitle: "Coursework",
        description: "Advanced C++ multiplayer coursework — dedicated servers on AWS GameLift, gameplay frameworks, and networked systems.",
        link: "#",
        type: "certificate",
        accent: "#e5e7eb",
        icon: "devicon-unrealengine-original",
        tags: ["C++", "GameLift", "Multiplayer"]
    },

    // --- Web Development ---
    {
        title: "TurboReader",
        category: "Web Development",
        subtitle: "Developer Tool",
        description: "A high-speed reading interface using RSVP — flashing words one at a time to push reading speed well past normal.",
        link: "https://philippeho.dev/TurboReader/",
        type: "modal",
        accent: "#34d399",
        icon: "fa-solid fa-bolt",
        tags: ["RSVP", "Vanilla JS"],
        status: "live"
    },
    {
        title: "Manga Tracker",
        category: "Web Development",
        subtitle: "Full-stack App",
        description: "Tracks reading progress across series with a daily scheduler that checks for new chapters. Express + SQLite, self-hosted.",
        link: "https://philippeho.dev/manga-tracker/",
        type: "modal",
        accent: "#fbbf24",
        icon: "fa-solid fa-book",
        tags: ["Express", "SQLite", "Cron"],
        status: "readonly"
    },
    {
        title: "Chatsim",
        category: "Web Development",
        subtitle: "Animation Tool",
        description: "Build and play back scripted texting animations — a little story engine for fake chat threads, with a JSON-backed editor.",
        link: "https://philippeho.dev/chatsim/",
        type: "modal",
        accent: "#a78bfa",
        icon: "fa-solid fa-comments",
        tags: ["Node", "SPA"],
        status: "live"
    },
    {
        title: "Personal SoundCloud",
        category: "Web Development",
        subtitle: "Audio Platform",
        description: "A private streaming archive with custom upload, cover art, and playback logic — a self-hosted take on SoundCloud.",
        link: "https://philippeho.dev/personalsoundcloud/",
        type: "modal",
        accent: "#fb7185",
        icon: "fa-solid fa-music",
        tags: ["Node", "Uploads"],
        status: "readonly"
    },
    {
        title: "MP3 Maker",
        category: "Web Development",
        subtitle: "Audio Utility",
        description: "Converts streaming links from YouTube, Bandcamp, and SoundCloud into clean audio files. Wraps yt-dlp + ffmpeg behind a simple UI.",
        link: "https://philippeho.dev/mp3maker/",
        type: "modal",
        accent: "#38bdf8",
        icon: "fa-solid fa-headphones",
        tags: ["Node", "yt-dlp", "ffmpeg"],
        status: "live"
    },
    {
        title: "Wave Function Collapse",
        category: "Web Development",
        subtitle: "Generative Viz",
        description: "An interactive visualiser of the Wave Function Collapse algorithm — procedural tile generation rendered live on canvas.",
        link: "https://philippeho.dev/wfc/",
        type: "modal",
        accent: "#84cc16",
        icon: "fa-solid fa-shapes",
        tags: ["React", "Canvas", "Algorithm"],
        status: "live"
    },

    // --- Automation & Systems ---
    {
        title: "ClassAction Scanner",
        category: "Automation & Systems",
        subtitle: "AI Scraper",
        description: "Scrapes Canadian class-action settlements, summarizes each with Gemini, and emails a weekly digest. Python + n8n, fully automated.",
        link: "https://philippeho.dev/classactions/",
        type: "modal",
        accent: "#c084fc",
        icon: "fa-solid fa-robot",
        tags: ["Python", "Gemini", "n8n"],
        status: "live"
    },
    // --- Native & Tools ---
    {
        title: "Rust Music Player",
        category: "Native & Tools",
        subtitle: "Desktop App",
        description: "A native music player and library manager built in Rust — a MusicBee-style desktop client for browsing, tagging, and playing a local collection. Demo walkthrough coming soon.",
        link: "#",
        type: "soon",
        accent: "#f97316",
        icon: "devicon-rust-plain",
        tags: ["Rust", "Desktop", "Audio"]
    },
    {
        title: "Song Finder",
        category: "Native & Tools",
        subtitle: "Search Tool",
        description: "A fast Rust tool that indexes and searches a local music collection across USB drives and disks — find any track by name in milliseconds. Demo walkthrough coming soon.",
        link: "#",
        type: "soon",
        accent: "#2dd4bf",
        icon: "devicon-rust-plain",
        tags: ["Rust", "Search", "CLI"]
    }
];
