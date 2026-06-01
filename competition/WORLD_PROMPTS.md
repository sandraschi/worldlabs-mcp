# Marble Adventure — World prompts (author / regen)

Multiline prompts for **Marble 1.1** via worldlabs-mcp. Hub blurbs stay one line in `portals.json`; these are generation-only.

**Series suffix** (append to every prompt):

```
Marble Adventure gallery world. Cohesive surreal realism. No people, no readable text, no UI. Wide establishing composition, strong depth cues.
```

**Sources:** Structure adapted from World Labs gallery examples — reworded for this tour.

---

## Featured (A–Z on hub ring)

### A — Gothic Cathedral (`gothic_cathedral`)

```
Grand Gothic cathedral interior, soaring nave with ribbed vaults and clustered columns.
Rose windows casting colored god rays through incense haze.
Wet limestone floor reflecting amber candlelight.
Wide establishing shot from the crossing, strong vertical lines, human-scale perspective.
Atmospheric, reverent, medieval European sacred architecture.
Marble Adventure gallery world. Cohesive surreal realism. No people, no readable text, no UI.
```

### B — Neon Alley (`cyberpunk_alley`)

```
Rain-slick cyberpunk backstreet at night, narrow alley between towering buildings.
Neon signs in magenta, cyan, and acid green reflecting in puddles.
Steam vents, tangled cables, holographic ad panels, ramen stall glow.
Wet asphalt, moody fog, blade-runner atmosphere.
Wide alley perspective with depth, cinematic night lighting.
Marble Adventure gallery world. Cohesive surreal realism. No people, no readable text, no UI.
```

### C — Sea of Fog (`sea_of_fog`)

```
Romantic landscape above an infinite sea of fog, Caspar Friedrich sublime mood.
Silent valley peaks emerging like islands from white mist.
Soft sunrise gradient, pale gold and cold blue tones.
Lone footpath on a rocky promontory, vast horizon, contemplative scale.
Marble Adventure gallery world. Cohesive surreal realism. No people, no readable text, no UI.
```

### D — Wonderland (`wonderland`)

```
Surreal dreamscape of floating bioluminescent islands connected by impossible stairways.
Escher-like geometry blended with Gaudi organic stone forms.
Glowing flora, crystal pools, twilight sky with twin moons.
Fantastical but grounded textures, wide vista, explorer-scale path.
Marble Adventure gallery world. Cohesive surreal realism. No people, no readable text, no UI.
```

### E — Zen Temple (`japanese_temple`)

```
Japanese temple garden in late autumn, vermilion maple canopy over mossy stone.
Koi pond with still reflections, wooden engawa, paper lantern warm glow.
Raked gravel patterns, torii gate in background mist.
Serene, meditative, golden hour side light, wide garden view.
Marble Adventure gallery world. Cohesive surreal realism. No people, no readable text, no UI.
```

---

## Bonus (outer ring, F–H)

### F — Deep Forest (`deep_forest`)

```
Ancient redwood forest cathedral, dappled green-gold light through canopy.
Moss-covered stone ruins half-swallowed by roots, fern understory.
Damp air, volumetric light shafts, quiet wilderness scale.
Marble Adventure gallery world. Cohesive surreal realism. No people, no readable text, no UI.
```

### G — Midcentury Villa (`midcentury_villa`)

```
Midcentury modernist villa at golden hour, infinity pool merging with tropical sky.
Concrete, glass, and teak; palm shadows on white walls.
Lounge chairs, calm water reflections, warm California modernism.
Marble Adventure gallery world. Cohesive surreal realism. No people, no readable text, no UI.
```

### H — Sunken Ruins (`underwater_ruins`)

```
Submerged Greco-Roman ruins on the ocean floor, bioluminescent coral and kelp.
God rays piercing turquoise water, marble columns and broken archways.
Schools of light particles, deep blue-green palette, mysterious calm.
Marble Adventure gallery world. Cohesive surreal realism. No people, no readable text, no UI.
```

---

## Meta world (future hero — optional regen)

### Agent Workshop (`agent_workshop` — not wired yet)

```
Infinite library of glowing terminal screens and holographic code scrolls,
cathedral-scale server vault with cable vines and soft blue ambient light.
Visual metaphor for agentic AI development, not literal UI text.
Marble Adventure gallery world. Cohesive surreal realism. No people, no readable text.
```

---

## Regenerate

```powershell
cd D:\Dev\repos\worldlabs-mcp\competition
.\regenerate_worlds.ps1              # all featured
.\regenerate_worlds.ps1 -Portal sea_of_fog
```

Then update `marble_id` in `portals.json` and run `just marble-adventure-thumbs`.
