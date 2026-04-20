export interface WorldPreset {
    id: string;
    name: string;
    description: string;
    prompt: string;
    style: string;
    model: 'marble-1.1-plus' | 'marble-1.1';
    icon?: string;
}

export const WORLD_PRESETS: WorldPreset[] = [
    {
        id: 'origami-nexus',
        name: 'Origami Nexus',
        description: 'A world made entirely of folded white paper and intricate cardboard structures.',
        prompt: 'A surreal city made of folded white paper and cardboard, intricate origami skyscrapers, paper-craft trees, stop-motion aesthetic, soft diffused lighting, white and beige color palette.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
    {
        id: 'marshmallow-marsh',
        name: 'Marshmallow Marsh',
        description: 'Soft, bouncy pink landscapes with puffy clouds and gelatinous lakes.',
        prompt: 'A landscape made of pink marshmallows and puffy cotton candy clouds, bouncy geometric hills, liquid gelatin rivers, soft squishy textures, pastel colors, high-key lighting.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
    {
        id: 'neon-noir',
        name: 'Neon Noir',
        description: 'A dark, rainy cyberpunk alley with glowing signs and obsidian reflections.',
        prompt: 'A rainy cyberpunk alleyway at night, glowing neon signs in cyan and magenta, obsidian black wet pavement with sharp reflections, cinematic fog, moody thriller atmosphere, high contrast.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
    {
        id: 'biolume-deep',
        name: 'Biolume Deep',
        description: 'An underwater coral city glowing with bioluminescent life.',
        prompt: 'An underwater city with bioluminescent coral architecture, glowing jellyfish lanterns, deep blue and electric violet lighting, organic fluid shapes, ethereal atmosphere.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
    {
        id: 'clockwork-canyon',
        name: 'Clockwork Canyon',
        description: 'A steampunk canyon filled with rotating brass gears and steam vents.',
        prompt: 'A steep canyon filled with massive rotating brass gears and clockwork machinery, steam vents, victorian steampunk aesthetic, polished copper and iron textures, golden hour lighting.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
    {
        id: 'solarpunk-shrine',
        name: 'Solarpunk Shrine',
        description: 'Overgrown futuristic ruins reclaimed by vibrant lush nature.',
        prompt: 'Lush solarpunk architecture reclaimed by nature, futuristic white buildings covered in vines and blooming flowers, waterfalls, bright sunny day, vibrant greens and whites, optimistic atmosphere.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
    {
        id: 'vapor-glitch',
        name: 'Vapor Glitch',
        description: 'A surreal vaporwave landscape with glitching geometric monoliths.',
        prompt: 'Vaporwave dreamscape with marble roman statues and glowing grid floors, glitching geometric monoliths, low-poly palm trees, aesthetic sunset colors, purple and orange hazy lighting.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
    {
        id: 'obsidian-void',
        name: 'Obsidian Void',
        description: 'Abstract floating obsidian cubes over a mirrored liquid floor.',
        prompt: 'Abstract geometric void with floating sharp obsidian cubes, mirrored liquid floor, crimson red laser lighting, minimalist and oppressive atmosphere, high gloss reflections.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
    {
        id: 'crystal-cavern',
        name: 'Crystal Cavern',
        description: 'A giant cavern filled with translucent emerald and sapphire crystals.',
        prompt: 'A vast interior cavern filled with giant translucent emerald and sapphire crystals, refracted light beams, sparkling textures, magical fantasy atmosphere, cool blue color palette.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
    {
        id: 'brutalist-block',
        name: 'Brutalist Block',
        description: 'Massive raw concrete structures in a stark, desert wasteland.',
        prompt: 'Gigantic raw concrete brutalist structures, monolithic blocks, stark desert wasteland, harsh midday sun, deep shadows, cinematic scale, dusty atmosphere.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
    {
        id: 'floating-fable',
        name: 'Floating Fable',
        description: 'A whimsical world of floating islands and giant sunflowers.',
        prompt: 'Whimsical floating islands in a golden sky, giant sunflowers, tiny cottage houses, Ghibli-inspired aesthetic, vibrant warm colors, peaceful fantasy world.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
    {
        id: 'retro-orbit',
        name: 'Retro Orbit',
        description: '1950s atomic-age space station with chrome curves.',
        prompt: '1950s retro-futuristic space station interior, rounded chrome walls, red leather seats, atomic-age aesthetic, raygun-gothic style, view of planet earth through portholes.',
        style: 'Cinematic',
        model: 'marble-1.1-plus',
    },
];
