export interface Project {
    title: string;
    category: "Game Development" | "Web Development" | "Automation & Systems";
    description: string;
    subtitle?: string; // "Multiplayer Sandbox", "Developer Tool", etc.
    link: string; // URL to open
    type: "modal" | "image" | "certificate"; // How it opens
    image?: string; // For image modals
    techIcon?: string; // Component name or icon class
    color?: string; // CSS color class (text-cyan-400)
    borderColor?: string; // CSS border color on hover
    shadowColor?: string; // CSS shadow color
    colSpan?: string; // "md:col-span-2" etc
}

export const projects: Project[] = [
    // Game Development
    {
        title: "Unity - Multiplayer",
        category: "Game Development",
        subtitle: "Multiplayer Sandbox",
        description: "A specialized playground for testing multiplayer turn-based mini-games and custom networking logic.",
        link: "https://philippeho.popnux.com/workshopgames/",
        type: "modal",
        techIcon: "devicon-unity-plain",
        color: "text-cyan-400",
        borderColor: "hover:border-cyan-400/40",
        shadowColor: "hover:shadow-[0_0_40px_-15px_rgba(34,211,238,0.15)]",
        colSpan: "md:col-span-2"
    },
    {
        title: "Unreal Engine 5",
        category: "Game Development",
        subtitle: "Online Tutorials",
        description: "Advanced coursework in C++ Multiplayer, Dedicated Servers (AWS GameLift), and Gameplay Frameworks.",
        link: "#", // Opens certificate modal
        type: "certificate",
        techIcon: "devicon-unrealengine-original",
        color: "text-white",
        borderColor: "hover:border-white/40",
        shadowColor: "hover:shadow-[0_0_40px_-15px_rgba(255,255,255,0.1)]",
        colSpan: "md:col-span-2"
    },

    // Web Development
    {
        title: "TurboReader",
        category: "Web Development",
        subtitle: "Developer Tool",
        description: "High-speed reading interface using RSVP technology to simulate rapid serial visual presentation of text.",
        link: "https://philippeho27.github.io/TurboReader/",
        type: "modal",
        color: "text-emerald-400",
        borderColor: "hover:border-emerald-400/40",
        shadowColor: "hover:shadow-[0_0_30px_-10px_rgba(52,211,153,0.1)]",
        colSpan: "col-span-2 md:col-span-4"
    },
    {
        title: "MP3 Maker",
        category: "Web Development",
        subtitle: "Audio Utility",
        description: "Toolkit for converting streaming links from YouTube, Bandcamp, and SoundCloud into private audio archives.",
        link: "https://philippeho.popnux.com/mp3maker/",
        type: "modal",
        color: "text-violet-400",
        borderColor: "hover:border-violet-400/40",
        shadowColor: "hover:shadow-[0_0_30px_-10px_rgba(167,139,250,0.1)]",
        colSpan: "col-span-1 md:col-span-2"
    },
    {
        title: "Job Viewer",
        category: "Web Development",
        subtitle: "Data App",
        description: "A specialized dashboard for filtering and analyzing technical job postings.",
        link: "https://philippeho.popnux.com/job-viewer/",
        type: "modal",
        color: "text-amber-400",
        borderColor: "hover:border-amber-400/40",
        shadowColor: "hover:shadow-[0_0_30px_-10px_rgba(251,191,36,0.1)]",
        colSpan: "col-span-1 md:col-span-3"
    },
    {
        title: "Personal SoundCloud",
        category: "Web Development",
        subtitle: "Audio Platform",
        description: "Custom streaming logic for private audio archives.",
        link: "https://philippeho.popnux.com/personalsoundcloud/",
        type: "modal",
        color: "text-rose-400",
        borderColor: "hover:border-rose-400/40",
        shadowColor: "hover:shadow-[0_0_30px_-10px_rgba(251,113,133,0.1)]",
        colSpan: "col-span-2 md:col-span-3"
    },

    // Automation
    {
        title: "n8n Job Scraper",
        category: "Automation & Systems",
        subtitle: "Workflow Automation",
        description: "Job listings scraper. Fetches LinkedIn data, cleans with LLM, and displays on custom frontend.",
        link: import.meta.env.BASE_URL + "assets/img/n8n-workflow.png",
        type: "image",
        color: "text-white",
        borderColor: "hover:border-white/40",
        shadowColor: "hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]",
        colSpan: ""
    },
    {
        title: "OpenClaw",
        category: "Automation & Systems",
        subtitle: "Local Agent Platform",
        description: "Open-source agent platform. Runs locally to automate Discord, Slack, and Telegram.",
        link: "#",
        type: "modal", // Actually just a card, but we'll treat it as default
        color: "text-white",
        borderColor: "border-white/10",
        shadowColor: "",
        colSpan: ""
    }
];
