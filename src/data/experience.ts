export interface Job {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
    link?: string;
    videoSrc?: string;
}

export const experience: Job[] = [
    {
        company: "Téléfix Productions",
        role: "Game Programmer",
        startDate: "Jan 2024",
        endDate: "Nov 2024",
        description: "Developed a Steam-published construction game, implementing essential gameplay systems including character movement, save functionality, shader effects, UI/UX, and sound integration.",
        link: "https://store.steampowered.com/app/3113740/Dont_Drop_The_Wall_Jack/",
        videoSrc: "/assets/img/dontdrop.webm"
    },
    {
        company: "Small Detour Games",
        role: "Programmer Intern",
        startDate: "Mar 2023",
        endDate: "Jun 2023",
        description: "Worked on implementing features including a hidden NPC relationship meter for tracking growth. Developed trigger points for specific events and interactions.",
        link: "https://store.steampowered.com/app/2707880/Troubadours/",
        videoSrc: "/assets/img/troubadour.webm"
    }
];
