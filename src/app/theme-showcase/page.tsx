import React from 'react';

export default function ThemeShowcase() {
    return (
        <div className="min-h-screen bg-background-light p-8 space-y-12">
            <header className="space-y-4">
                <h1 className="text-4xl font-bold text-primary">Design System Showcase</h1>
                <p className="text-text-medium text-lg">Visual verification of the centralized theme implementation.</p>
            </header>

            {/* Colors Section */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-text-dark border-b border-border-gray pb-2">Color Palette</h2>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-text-medium">Primary Colors</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ColorCard name="Primary Green" variable="--primary" bg="bg-primary" hex="#0e4701" />
                        <ColorCard name="Primary Light" variable="--primary-light" bg="bg-primary-light" hex="#1b6610" />
                        <ColorCard name="Primary Dark" variable="--primary-dark" bg="bg-primary-dark" hex="#062b00" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-text-medium">Secondary Colors</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ColorCard name="Secondary Gold" variable="--secondary-gold" bg="bg-secondary-gold" hex="#f2b705" text="text-black" />
                        <ColorCard name="Secondary Orange" variable="--secondary-orange" bg="bg-secondary-orange" hex="#e57e25" />
                        <ColorCard name="Secondary Red" variable="--secondary-red" bg="bg-secondary-red" hex="#d64545" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-text-medium">Neutral Colors</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <ColorCard name="Text Dark" variable="--text-dark" bg="bg-text-dark" hex="#0a0a0a" />
                        <ColorCard name="Text Medium" variable="--text-medium" bg="bg-text-medium" hex="#4a4a4a" />
                        <ColorCard name="Text Light" variable="--text-light" bg="bg-text-light" hex="#f4f4f4" text="text-black" border />
                        <ColorCard name="Border Gray" variable="--border-gray" bg="bg-border-gray" hex="#d6d6d6" text="text-black" />
                        <ColorCard name="Background Light" variable="--background-light" bg="bg-background-light" hex="#ffffff" text="text-black" border />
                        <ColorCard name="Background Muted" variable="--background-muted" bg="bg-background-muted" hex="#f2f4f2" text="text-black" border />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-text-medium">UI Feedback</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <ColorCard name="Success" variable="--success" bg="bg-success" hex="#2e7d32" />
                        <ColorCard name="Warning" variable="--warning" bg="bg-warning" hex="#fbc02d" text="text-black" />
                        <ColorCard name="Error" variable="--error" bg="bg-error" hex="#d32f2f" />
                        <ColorCard name="Info" variable="--info" bg="bg-info" hex="#0288d1" />
                    </div>
                </div>
            </section>

            {/* Typography Section */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-text-dark border-b border-border-gray pb-2">Typography</h2>
                <div className="space-y-4 bg-background-light p-6 rounded-[20px] shadow-lg border border-border-gray">
                    <div>
                        <span className="text-xs text-text-medium uppercase tracking-wider">H1 / 32px / Bold</span>
                        <h1 className="text-4xl font-bold text-text-dark mt-1">The Quick Brown Fox Jumps Over The Lazy Dog</h1>
                    </div>
                    <div>
                        <span className="text-xs text-text-medium uppercase tracking-wider">H2 / 24px / Semibold</span>
                        <h2 className="text-2xl font-semibold text-text-dark mt-1">The Quick Brown Fox Jumps Over The Lazy Dog</h2>
                    </div>
                    <div>
                        <span className="text-xs text-text-medium uppercase tracking-wider">H3 / 20px / Semibold</span>
                        <h3 className="text-xl font-semibold text-text-dark mt-1">The Quick Brown Fox Jumps Over The Lazy Dog</h3>
                    </div>
                    <div>
                        <span className="text-xs text-text-medium uppercase tracking-wider">Body Large / 18px / Regular</span>
                        <p className="text-lg text-text-dark mt-1">The Quick Brown Fox Jumps Over The Lazy Dog</p>
                    </div>
                    <div>
                        <span className="text-xs text-text-medium uppercase tracking-wider">Body / 16px / Regular</span>
                        <p className="text-base text-text-dark mt-1">The Quick Brown Fox Jumps Over The Lazy Dog</p>
                    </div>
                    <div>
                        <span className="text-xs text-text-medium uppercase tracking-wider">Body Small / 14px / Regular</span>
                        <p className="text-sm text-text-dark mt-1">The Quick Brown Fox Jumps Over The Lazy Dog</p>
                    </div>
                    <div>
                        <span className="text-xs text-text-medium uppercase tracking-wider">Caption / 12px / Regular</span>
                        <p className="text-xs text-text-dark mt-1">The Quick Brown Fox Jumps Over The Lazy Dog</p>
                    </div>
                </div>
            </section>

            {/* Components Section */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold text-text-dark border-b border-border-gray pb-2">Components</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Buttons */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-text-medium">Buttons</h3>
                        <div className="flex flex-col gap-4 items-start">
                            <button className="bg-primary text-text-light px-6 py-4 rounded-[14px] font-semibold shadow-md hover:bg-primary-light active:bg-primary-dark transition-colors">
                                Primary Button
                            </button>
                            <button className="bg-transparent border-2 border-primary text-primary px-6 py-4 rounded-[14px] font-semibold hover:bg-primary/5 active:bg-primary/10 transition-colors">
                                Secondary Button
                            </button>
                            <button className="text-primary font-semibold hover:underline">
                                Tertiary Button
                            </button>
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-text-medium">Cards</h3>
                        <div className="bg-background-light p-5 rounded-[20px] shadow-lg border border-border-gray max-w-sm">
                            <div className="h-40 bg-background-muted rounded-[16px] mb-4 flex items-center justify-center text-text-medium">
                                Image Placeholder
                            </div>
                            <h3 className="text-xl font-semibold text-text-dark mb-1">Delicious Recipe</h3>
                            <p className="text-sm text-text-medium mb-4">A short description of this amazing culinary delight.</p>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-secondary-orange bg-secondary-orange/10 px-2 py-1 rounded-full">350 kcal</span>
                                <button className="text-primary font-semibold text-sm">View Recipe</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function ColorCard({ name, variable, bg, hex, text = "text-white", border = false }: { name: string, variable: string, bg: string, hex: string, text?: string, border?: boolean }) {
    return (
        <div className={`p-4 rounded-[16px] ${bg} ${text} ${border ? 'border border-border-gray' : ''} shadow-sm flex flex-col justify-between h-24`}>
            <span className="font-semibold">{name}</span>
            <div className="flex justify-between text-xs opacity-90">
                <span>{variable}</span>
                <span className="uppercase">{hex}</span>
            </div>
        </div>
    );
}
