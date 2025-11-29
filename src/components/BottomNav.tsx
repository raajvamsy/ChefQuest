"use client";

import React from "react";
import { Home, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    const isHome = pathname === "/";
    const isProfile = pathname === "/profile";

    return (
        <div className="fixed bottom-8 left-0 right-0 z-[100] flex justify-center px-6 pointer-events-none">
            <div className="bg-white border border-border-gray/30 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm px-8 py-3 flex items-center gap-12 pointer-events-auto">
                <NavItem 
                    icon={<Home size={24} />} 
                    label="Home" 
                    active={isHome}
                    onClick={() => router.push("/")}
                />
                <NavItem 
                    icon={<User size={24} />} 
                    label="Profile" 
                    active={isProfile}
                    onClick={() => router.push("/profile")}
                />
            </div>
        </div>
    );
}

function NavItem({ 
    icon, 
    label, 
    active = false,
    onClick 
}: { 
    icon: React.ReactNode; 
    label: string;
    active?: boolean;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-1 transition-all duration-200 group ${
                active ? "" : "hover:scale-105"
            }`}
        >
            <div className={`${
                active 
                    ? "text-primary" 
                    : "text-text-medium group-hover:text-primary"
            } transition-colors duration-200`}>
                {icon}
            </div>
            <span className={`text-xs font-medium ${
                active 
                    ? "text-primary" 
                    : "text-text-medium group-hover:text-primary"
            } transition-colors duration-200`}>
                {label}
            </span>
        </button>
    );
}
