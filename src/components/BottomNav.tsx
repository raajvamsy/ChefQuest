"use client";

import React from "react";
import { Home, Heart, Bell, ShoppingCart, User } from "lucide-react";

export default function BottomNav() {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background-light border-t border-border-gray px-6 py-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
            <div className="flex justify-between items-center max-w-md mx-auto">
                <NavItem icon={<Home size={24} />} active />
                <NavItem icon={<Heart size={24} />} />
                <NavItem icon={<Bell size={24} />} />
                <NavItem icon={<ShoppingCart size={24} />} />
                <NavItem icon={<User size={24} />} />
            </div>
        </div>
    );
}

function NavItem({ icon, active = false }: { icon: React.ReactNode; active?: boolean }) {
    return (
        <button
            className={`p-2 rounded-full transition-colors ${active ? "text-primary bg-primary/10" : "text-text-medium hover:text-primary hover:bg-primary/5"
                }`}
        >
            {icon}
        </button>
    );
}
