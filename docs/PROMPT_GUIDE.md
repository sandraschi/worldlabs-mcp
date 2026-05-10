# Marble Prompt Engineering Guide

Marble is a **3D world generator** (Gaussian splat scenes), not a 2D image generator. Prompting strategies that work for Midjourney, DALL-E, or Stable Diffusion do not always translate. This guide covers what works, what doesn't, and why.

## Core Principle: If You Can Model It in Blender, Marble Can Render It

Marble builds navigable 3D geometry with surface properties and volumetric lighting. If a prompt element describes:

- **Geometry** (shape, scale, layout, density)
- **Materials** (surface texture, reflectivity, wear)
- **Lighting** (source, colour, atmosphere, time of day)
- **Spatial composition** (what goes where, distances, sightlines)

it will work. If it only exists in the viewer's mind (emotion, narrative, 2D painting technique), it needs to be translated into concrete 3D elements.

## What Works Well

### Architectural Styles
These define structural logic and material language — Marble picks them up strongly.

gothic, brutalism, art deco, Victorian, Bauhaus, Baroque, Tudor, colonial, modernist, Palladian, half-timbered

### Materials
Marble renders surface properties in 3D. These produce visible differences.

raw concrete with formwork grain, polished brass, weathered sandstone, oxidised copper, rough-hewn stone, aged oak, cracked marble, brushed aluminium, rusted corrugated iron, whitewashed plaster, terracotta tiles, leaded glass, moss-covered brick

### Weather & Season
Directly affect volumetric and lighting composition.

heavy rain with reflective puddles, deep winter with snow drifts, autumn mist, torrential downpour, heat haze, thunderstorm, fog so thick visibility is 10 metres, spring blossoms, golden autumn colours, hoarfrost on every surface

### Lighting & Atmosphere
Extremely effective for setting mood.

harsh midday sun, golden hour, aurora borealis, bioluminescent glow, volumetric fog, moonlight through broken clouds, fluorescent overhead, candlelight, deep shadow, crepuscular rays, industrial floodlighting

### Mood Descriptors (that work)
These map reliably to 3D-visible decay, damage, and environment changes.

abandoned, derelict, ruined, overgrown, decaying, weathered, frozen, floodlit, isolated, pristine, sterile, claustrophobic

### Specific Places (with clear 3D layout)
Best when the place has consistent objects and spatial arrangement.

morgue, cathedral, greenhouse, lighthouse interior, observatory, mine shaft, subway platform, operating theatre, engine room, bell tower, greenhouse, crypt, archive vault

## What Works Partially

### Artist Names
| Artist | Verdict | Reason |
|--------|---------|--------|
| Giger | Works | Biomechanical forms and organic-metal textures are 3D-appropriate |
| Dali | Partial | Surreal geometry can be described, but the 2D illusionism doesn't translate |
| Piranesi | Good | Imaginary prisons with massive vaulted stone spaces — directly 3D |
| H.R. Giger | Works | See above |
| Gaudí | Works | Organic architectural forms, trencadís tile — geometry + material |
| Monet | Fails | Impressionism is a 2D painting technique (brushwork, pigment) |
| Van Gogh | Fails | Same — paint application, not 3D geometry |
| Giotto | Fails | Trecento fresco technique — gold leaf and tempera on flat panels |
| Escher | Partial | Impossible staircases and repeating tiles — some geometry works, the 2D illusions don't |

Translation strategy instead of artist names:

```
Instead of: "in the style of Giger"
Use: "biomechanical organic-metallic architecture, dark iridescent surfaces,
ribbed tubular forms, bone-like structural columns, wet glossy texture,
oppressive industrial scale, dim atmospheric backlighting"
```

### Cultural References (Film, Books)
You get the **archetype**, not the specific reference.

| Reference | What you get | What you miss |
|-----------|-------------|---------------|
| Bates Motel | 2-storey roadside motel + hilltop Victorian house | The exact facade, the specific Psycho layout |
| Hogwarts | Stone castle on a lake, towers, great hall | The exact floorplan, moving stairs |
| Minas Tirith | Tiered white city on a mountainside | The specific 7-level layout |
| 221B Baker Street | Victorian sitting room, fireplace, bay window | The exact furniture arrangement |

### Landmarks
You get the **shape class**, not the specific landmark.

| Landmark | Works? | What you get |
|----------|--------|-------------|
| Eiffel Tower | Archetype | Three-tiered wrought-iron lattice tower, arched base |
| Taj Mahal | Best of landmarks | Onion dome + 4 minarets + reflecting pool + gate |
| Forbidden City | Archetype | Red walls, yellow roofs, marble terraces, grand courtyards |
| St. Peter's Basilica | Partial | Massive dome, colonnade, baroque facade |
| Pyramids of Giza | Good | Smooth-sided triangular monuments in desert — simple geometry |
| Stonehenge | Good | Trilithon standing stones in circle on plain — simple geometry |

For landmarks, use **image-to-world generation** with a reference photo rather than relying on text.

## What Does Not Work

### 2D Painting Techniques
impressionism, pointillism, sfumato, chiaroscuro, tempera, fresco, glazing, impasto — these describe how paint is applied to canvas, not how 3D space is constructed.

### Narrative Emotions (without 3D translation)
fear, dread, hope, melancholy, nostalgia — these exist in the viewer's mind. You must decompose them into concrete visual elements.

```
Instead of: "a melancholic scene"
Use: "abandoned seaside pier at twilight, peeling paint, rusted railings,
overcast sky, grey choppy water, a single gull on a broken bench, cold wind"
```

### Abstract Concepts (without spatial form)
justice, chaos, freedom, entropy, love — these have no consistent 3D manifestation.

### Specific People
Marble does not generate recognizable human faces or figures. Characters will be indistinct silhouettes at best. Skip prompts about specific people.

## Prompt Structure Template

The most reliable structure for a Marble text prompt:

```
[ARCHITECTURE/SPACE] + [MATERIALS] + [LIGHTING/TIME] + [WEATHER] + [SCALE] + [COLOUR PALETTE]
```

Example:
```
"A vast gothic cathedral interior at dusk. Towering rib-vaulted stone ceilings
60 metres above. Rose windows casting ruby and sapphire light through dust.
Worn flagstone floor. Cool stone greys and warm amber light."
```

## Category Prompting Reference

### Architecture & Interior
| Prompt | Tips |
|--------|------|
| medieval | half-timbered, stone walls, narrow streets, battlements, rough-hewn oak |
| bucolic | rolling hills, patchwork fields, drystone walls, ancient trees, soft afternoon light |
| horror | dilapidated manor at night, broken windows, dead trees, thick fog, cold moonlight |
| formal garden | symmetry, hedges, gravel paths, fountains, topiary, reflecting pool |
| junkpile | rusted scrap, crushed cars, broken machinery, oily puddles, wasteland |
| morgue | stainless steel tables, refrigerated drawers, tile drain floor, harsh lights, sterile |
| bedlam | abandoned asylum, long crumbling wings, barred windows, overgrown grounds |
| empty corridor | long hospital corridor, fluorescent lights, linoleum, numbered doors, fire extinguisher |
| wax museum | dim rooms, pedestals, velvet ropes, exhibit cases, dramatic spotlighting |

### Landmarks (Text Only — Archetypes)

For accurate landmarks, use **image-to-world** with a reference photo instead.

## Model Selection

| Model | Use When |
|-------|----------|
| marble-1.1 (1500 credits) | Small interiors, simple scenes, tight budgets. ~1-3 min |
| marble-1.1-plus (1500 + 300/cube) | Outdoor scenes, large interiors, architectural visualisation. Variable time. Auto-expands when the prompt describes large/big/extensive spaces |

## Additional Tips

- **Scale anchoring**: Specify dimensions explicitly ("60-metre vaulted ceiling", "trunks 5m in diameter", "knee-high grass"). Without scale references, Marble defaults to room-scale.
- **Density**: Use "dense", "sparse", "cluttered", "minimalist" to control object frequency.
- **Sightlines**: "narrow corridor", "wide-open plaza", "obstructed view", "receding into darkness" control what the viewer sees.
- **Ground plane**: "flagstone floor", "hard-packed snow", "muddy track", "polished marble" — the ground is the most visible surface in a 3D walkthrough.
- **Ceiling/roof**: "open sky", "vaulted stone", "low pressed-tin ceiling", "canopy of branches" — this frames the vertical space.
- **Edge of scene**: "fading into mist", "darkness", "distant mountains", "cliff edge" — defines where the walkable area ends.
