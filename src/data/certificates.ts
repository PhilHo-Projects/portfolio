export interface Certificate {
    title: string;
    instructor: string;
    desc: string;
}

export const certificates: Certificate[] = [
    {
        title: "Unreal Engine 5 C++ Multiplayer Shooter",
        instructor: "Stephen Ulibarri",
        // Using static background logic in HTML, but we could dynamic swap if we wanted.
        // For now, HTML has a static background logo.
        desc: "Advanced C++ network programming. Implemented lag compensation, client-side prediction, extensive replication for weapons and projectiles, and matchmaking logic."
    },
    {
        title: "Unreal Engine 5: The Ultimate Game Developer Course",
        instructor: "Stephen Ulibarri",
        desc: "Comprehensive study of the engine's core C++ architecture, gameplay framework (GameMode, PlayerController, Pawn), and physics interactions."
    },
    {
        title: "Unreal Engine 5 Dedicated Servers with AWS & GameLift",
        instructor: "Stephen Ulibarri",
        desc: "Cloud infrastructure mastery. Building Unreal Engine from source for Linux servers, deploying to AWS GameLift, and setting up FlexMatch with Lambda backend."
    }
];
