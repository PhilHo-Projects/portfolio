export interface Certificate {
    title: string;
    instructor: string;
    desc: string;
    image: string;
    imageAlt: string;
    href: string;
}

export const certificates: Certificate[] = [
    {
        title: "Unreal Engine 5 C++ Multiplayer Shooter",
        instructor: "Stephen Ulibarri",
        desc: "Built replicated weapons, projectiles, matchmaking, client-side prediction, and lag-compensated multiplayer systems in C++.",
        image: "assets/img/ue5-multiplayer-shooter.webp",
        imageAlt: "Unreal Engine multiplayer arena from the UE5 C++ Multiplayer Shooter course",
        href: "https://www.udemy.com/course/unreal-engine-5-cpp-multiplayer-shooter/",
    },
    {
        title: "Unreal Engine 5: The Ultimate Game Developer Course",
        instructor: "Stephen Ulibarri",
        desc: "Worked through Unreal's C++ gameplay framework, character systems, combat, animation, physics, and engine architecture.",
        image: "assets/img/ue5-ultimate-course.webp",
        imageAlt: "Desert combat scene from the Unreal Engine 5 Ultimate Game Developer course",
        href: "https://www.udemy.com/course/unreal-engine-5-the-ultimate-game-developer-course/",
    },
    {
        title: "Unreal Engine 5 Dedicated Servers with AWS & GameLift",
        instructor: "Stephen Ulibarri",
        desc: "Built Unreal Engine for Linux servers and deployed multiplayer infrastructure with AWS GameLift, FlexMatch, Lambda, and API Gateway.",
        image: "assets/img/ue5-dedicated-servers.webp",
        imageAlt: "Cloud server artwork from the UE5 Dedicated Servers with AWS and GameLift course",
        href: "https://www.udemy.com/course/unreal-engine-5-dedicated-servers-with-aws-and-gamelift/",
    },
];
