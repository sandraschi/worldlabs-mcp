export interface WorldPreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  style: string;
  model: "marble-1.1-plus" | "marble-1.1";
  categories: string[];
}

export const PRESET_CATEGORIES = [
  "interior",
  "exterior",
  "landmark",
  "fantasy",
  "scifi",
  "nature",
  "urban",
  "sacred",
  "domestic",
  "industrial",
  "ruins",
  "surreal",
  "historical",
] as const;

export type PresetCategory = (typeof PRESET_CATEGORIES)[number];

export const WORLD_PRESETS: WorldPreset[] = [
  {
    id: "gothic-cathedral",
    name: "Gothic Cathedral Interior",
    description:
      "A vast medieval gothic cathedral with towering rib-vaulted ceilings, rose windows casting coloured light through dust-filled air.",
    style: "Cinematic",
    categories: ["interior", "sacred", "landmark", "historical"],
    model: "marble-1.1-plus",
    prompt: `A vast gothic cathedral interior at dusk. Towering rib-vaulted stone ceilings receding into darkness 60 metres above the nave floor. Three massive stained-glass rose windows on the east wall casting deep ruby, sapphire and amber light shafts through slowly drifting dust motes. Rows of slender clustered columns with carved foliate capitals flanking the main aisle. A carved stone altar at the eastern terminus with a single flickering votive candle. Worn flagstone floor with irregular slabs and shallow depressions worn by centuries of footsteps. Deep side chapels with pointed arched openings revealing shadowy alcoves. Flying buttresses visible through tall lancet windows on the south wall. Atmospheric haze in the upper vaults. Cool stone greys and warm amber light. Profound sense of scale and silence.`,
  },
  {
    id: "neon-noir",
    name: "Neon Noir Alley",
    description:
      "A rain-slicked cyberpunk alleyway at midnight with neon signs, reflective puddles, and dense urban atmosphere.",
    style: "Cinematic",
    categories: ["urban", "scifi", "exterior"],
    model: "marble-1.1-plus",
    prompt: `A claustrophobic urban alleyway at midnight during heavy rain. Walls on both sides rising 8-10 storeys, lined with rusted fire escapes, exposed ductwork, and mismatched window units — some lit with warm tungsten, others dark. Saturated cyan and magenta neon signs casting sharp coloured light onto wet pavement. Deep puddles with oil-slick rainbow sheens reflecting the neon glow. A single flickering red tube sign at the far end. Steam rising from a grate near the centre. Discarded newspapers matted against a drain grate. Narrow enough to touch both walls with outstretched arms. Dense volumetric fog illuminated by the neon. High contrast — near-black shadows in corners, saturated colour where light hits. Cinematic anamorphic lens feel, shallow depth of field towards the distant end.`,
  },
  {
    id: "crystal-cavern",
    name: "Crystal Cavern",
    description:
      "A vast underground chamber filled with giant translucent crystals refracting light into rainbow beams.",
    style: "Fantasy",
    categories: ["interior", "fantasy", "nature", "surreal"],
    model: "marble-1.1-plus",
    prompt: `A colossal underground cavern, 40 metres wide and 30 metres tall. The space is densely populated with giant translucent crystals growing from floor and ceiling — some as thick as tree trunks, others as delicate as fingernails. Crystals in emerald green, sapphire blue, and pale amethyst, many faceted and sharply geometric. A bioluminescent pool of electric cyan water at the cavern's centre, its surface perfectly still, reflecting the crystal forest above. Light entering from an unseen source above refracts through the crystals, casting shifting rainbow patterns across the rough stone walls and the mist rising from the pool. Delicate mineral formations hang like chandeliers from the ceiling. A narrow natural stone bridge crosses the pool at its narrowest point. The air is cool and visibly dense with a faint blue haze. Silence except for the occasional drip of mineral-rich water.`,
  },
  {
    id: "brutalist-megastructure",
    name: "Brutalist Megastructure",
    description:
      "Monolithic raw concrete mega-architecture in a stark desert under harsh midday sun.",
    style: "Cinematic",
    categories: ["exterior", "industrial", "landmark", "urban"],
    model: "marble-1.1-plus",
    prompt: `A monolithic brutalist megastructure complex in a barren desert landscape under harsh midday sun. Massive raw concrete geometric forms — interlocking cubes, tilted planes, and cyclopean retaining walls — arranged in an asymmetrical composition across 200 metres of flat arid terrain. The concrete is textured with visible formwork grain, water stains, and shallow surface cracking. Deep shadow recesses between the masses creating extreme contrast against sun-bleached upper surfaces. A single monumental stairway ascending 15 metres between two converging walls, leading to a dark rectangular aperture. No vegetation except sparse dry scrub at the base. The horizon is flat and featureless. Dust haze at the distant edges. The scale is deliberately disorienting — no doors, windows, or human-scale references. Temperature feels baked into the concrete.`,
  },
  {
    id: "suspended-forest",
    name: "Suspended Forest Canopy",
    description:
      "A walkway suspended high in a primordial forest canopy with giant trees, vines, and misty undergrowth far below.",
    style: "Fantasy",
    categories: ["nature", "fantasy", "exterior"],
    model: "marble-1.1-plus",
    prompt: `A network of weathered rope-and-plank suspension bridges strung between colossal ancient trees in a primordial forest canopy 50 metres above the ground. The trees are enormous — trunks 5 metres in diameter, their bark thick with moss, lichen, and climbing ferns. Dappled golden-green light filtering through multiple canopy layers, creating shifting light shafts and deep shadow pools on the walkway. Giant buttress roots disappearing into thick mist below. Epiphytic orchids and luminous fungi growing from the bridge supports. A secondary canopy level of ferns and saplings 10 metres above the main walkway. The ground below is completely obscured by dense blue-white mist, giving the feeling of being suspended over an ocean. Warm humid air, visible atmospheric haze in the distance. Vibrant greens, amber light, deep brown trunks. Extremely dense vegetation filling every visual gap.`,
  },
  {
    id: "derelict-station",
    name: "Derelict Space Station",
    description:
      "An abandoned retro-futuristic space station corridor with flickering lights, floating debris, and views of a gas giant through cracked windows.",
    style: "Cinematic",
    categories: ["interior", "scifi", "industrial", "ruins"],
    model: "marble-1.1-plus",
    prompt: `A wide corridor of an abandoned retro-futuristic space station. The architecture is 1970s analogue sci-fi — brushed aluminium wall panels with riveted seams, worn vinyl floor tiles in orange and brown geometric patterns, banks of dead cathode-ray tube monitors along one wall. Emergency strobe lights casting long pulsing shadows every 4 seconds. Zero-gravity debris floating in the still air — loose papers, a floating coffee mug, tangled cables drifting like seaweed. A large curved observation window on the starboard side, its surface crazed with impact cracks, revealing a swirling ochre-and-cream gas giant planet filling half the sky. The corridor is lit primarily by the reflected planetary light — warm amber and cream tones. A single functional fluorescent panel at the far end flickering irregularly. Dust settled on every horizontal surface. Abandoned personal effects: a jacket draped over a chair, a terminal showing static. Profound stillness.`,
  },
  {
    id: "sunken-temple",
    name: "Sunken Temple",
    description:
      "An overgrown Khmer-style temple being slowly consumed by jungle, with massive roots splitting stone and dappled light.",
    style: "Cinematic",
    categories: ["landmark", "sacred", "historical", "ruins", "nature"],
    model: "marble-1.1-plus",
    prompt: `An ancient Khmer-style stone temple complex in advanced stages of jungle reclamation. The central structure is a stepped pyramid with three tiers, approximately 25 metres tall, built of massive sandstone blocks now darkened by centuries of moisture and lichen. Gigantic strangler fig roots — some as thick as a human torso — snake down the stone faces, splitting masonry and cascading over carved lintels. Headless sandstone statues of guardian figures lining the approach, their surfaces eroded and covered in moss. Dappled sunlight breaking through a dense triple-canopy jungle overhead, creating shifting pools of hot white light on the dark stone. Steam rising from the sun-warmed upper stones after a morning rain. Fallen columns scattered across the courtyard, half-buried in leaf litter. The jungle presses in from all sides — lianas, broad-leafed undergrowth, and flowering vines filling every gap. Vibrant green moss contrasting with dark grey stone. Shafts of light with visible dust and moisture particles.`,
  },
  {
    id: "steampunk-airport",
    name: "Steampunk Airship Harbour",
    description:
      "A Victorian-era airship terminal at high altitude, with brass fittings, moored zeppelins, and a city visible through clouds far below.",
    style: "Steampunk",
    categories: ["exterior", "industrial", "landmark", "historical", "scifi"],
    model: "marble-1.1-plus",
    prompt: `A vast Victorian-era airship terminal perched at 3,000 metres altitude on a mountain peak. The terminal is an open-sided structure of wrought iron arches, riveted steel beams, and polished brass fittings. Three moored hydrogen zeppelins of various sizes tethered to the terminal's mooring masts — the largest 200 metres long with "IMPERIAL AIR FLEET" painted along its flank in faded gold serif lettering. The terminal floor is wide oak planks worn smooth by decades of passengers. Copper steam pipes running along the ceiling, hissing occasionally. Brass pressure gauges with glass faces and analogue dials at regular intervals. A half-dozen cast-iron luggage trolleys loaded with steamer trunks. The station clock is a 3-metre-tall orrery mechanism with exposed gears. Through the open sides, a carpet of cumulus clouds extends to the horizon, with glimpses of a patchwork countryside through gaps far below. Late afternoon sun casting long horizontal shadows through the structure. Warm brass-and-amber colour palette.`,
  },
  {
    id: "bioluminescent-bay",
    name: "Bioluminescent Bay",
    description:
      "A nocturnal tropical bay where every wave and footprint in the sand glows electric blue with bioluminescent plankton.",
    style: "Fantasy",
    categories: ["nature", "fantasy", "exterior"],
    model: "marble-1.1-plus",
    prompt: `A nocturnal tropical bay on a moonless night, illuminated entirely by bioluminescent organisms. The water is shallow — waist-deep at the centre — and every disturbance triggers bursts of electric blue and cyan light. Small waves lapping at a crescent white-sand beach leave glowing foam lines. A wooden pier extends 15 metres into the bay, its submerged pilons surrounded by swirling blue light. Mangrove trees along the shoreline with glowing roots dipping into the water. The sand itself sparkles with bioluminescent algae where it's been disturbed — a trail of glowing footprints leading along the beach. A few jellyfish-like organisms pulse gently in the deeper water. The sky is clear with brilliant stars and a faint Milky Way band visible. No artificial light anywhere. The only sounds are gentle water movement and distant tropical insects. Deep blue-black sky, vibrant blue water glow, dark silhouettes of mangroves. Magical and immersive.`,
  },
  {
    id: "fractal-library",
    name: "Fractal Library",
    description:
      "An impossible infinite library with shelves receding into mirrored dimensions, floating staircases, and glowing manuscripts.",
    style: "Surreal",
    categories: ["interior", "surreal", "fantasy", "domestic"],
    model: "marble-1.1-plus",
    prompt: `An impossible infinite library inspired by Borges. The main chamber is vast — at least 50 metres tall — with walls entirely lined with dark wooden bookshelves stretching beyond visible resolution. Hexagonal alcoves arranged in a honeycomb pattern, each identical, each connected by short passageways and spiral staircases that seem to lead both up and down simultaneously. Multiple levels of galleries accessible by floating staircases with wrought-iron railings. A central well descends into darkness with more shelves visible fading into infinity. Scattered reading desks with green glass lamps casting warm pools of light. A massive celestial orrery suspended in the centre of the void, its brass planets slowly rotating. Glowing manuscripts floating between shelves like fireflies. Dust motes dancing in the lamp light. Rich mahogany wood, worn leather armchairs, copper lamp shades. The geometry is intentionally disorienting — corners that should meet don't. Endless perspective in all directions. Warm amber and deep brown tones, intimate pools of light against vast darkness.`,
  },
  {
    id: "floating-islands",
    name: "Floating Archipelago",
    description:
      "A chain of floating islands in a golden sunset sky, connected by stone arch bridges, with waterfalls falling into the clouds.",
    style: "Fantasy",
    categories: ["fantasy", "nature", "exterior", "landmark"],
    model: "marble-1.1-plus",
    prompt: `A chain of seven floating islands suspended in a golden sunset sky at varying altitudes from 50 to 200 metres above a sea of ochre-and-rose clouds. The largest central island is roughly 80 metres across, with a grassy plateau, a single gnarled ancient oak tree, and a ring of standing stones at its centre. Waterfalls cascade from two of the islands, falling 100 metres before dissipating into mist in the cloud layer. The islands are connected by elegant stone arch bridges — some spanning 30 metres — built from warm sandstone blocks with moss-filled joints. Smaller satellite islands host wind-sculpted pines, patches of wildflowers, and the ruins of what might have been a tower. The sun is low, casting long shadows and bathing everything in deep gold and warm orange light. Distant mountains visible on the horizon. The clouds below have texture and depth, forming a solid-looking floor with occasional gaps revealing an ocean far below. Peaceful, warm, vast. Ghibli-inspired colour palette.`,
  },
  {
    id: "soviet-progress",
    name: "Abandoned Soviet Research Station",
    description:
      "A decaying Soviet-era Arctic research station with peeling paint, frozen pipes, and the aurora borealis overhead.",
    style: "Cinematic",
    categories: ["exterior", "industrial", "ruins", "landmark"],
    model: "marble-1.1-plus",
    prompt: `An abandoned Soviet-era Arctic research station in deep winter. The main building is a prefabricated concrete-panel structure with a gently curved roof, now weathered and stained. Paint peeling in long strips from the exterior walls, revealing faded military green underneath. A collapsed radio mast leans at 45 degrees, its guy wires tangled. Snow drifts reaching halfway up the ground-floor windows, which are dark and cracked. Inside visible through broken windows: overturned wooden chairs, scattered papers frozen to the floor, a rotary telephone off the hook. A rusted Tatra 6x6 truck half-buried in snow near the entrance, its windscreen shattered. Ice formations hanging from the roofline like frozen waterfalls. The ground is hard-packed snow and gravel. The aurora borealis fills the night sky with shifting green and violet curtains of light, casting an eerie coloured glow across the snow-covered landscape. The temperature feels brutally cold — frost on every surface. Deep blue twilight, vibrant aurora, dark silhouettes of the structures. Isolation and desperation tangible.`,
  },
  {
    id: "origami-nexus",
    name: "Origami Nexus",
    description:
      "A surreal city of folded white paper and intricate cardboard architecture.",
    style: "Surreal",
    categories: ["urban", "surreal", "exterior"],
    model: "marble-1.1-plus",
    prompt: `A surreal city made entirely of folded white origami paper and precision-cut cardboard architecture. The buildings range from 5 to 30 metres tall, all with sharp geometric facets, clean creases, and visible fold lines like architectural blueprints brought to life. Streets are narrow canyons between towering paper facades with perfectly 90-degree corners. Delicate paper lanterns suspended on invisible threads between buildings. The ground is textured like hand-laid sheets with subtle grain and occasional paper-cut gaps revealing a void below. Some structures have intricate cut-out windows and doors, others are pure abstract geometry. The lighting is soft and diffused, as if the entire world is inside a light tent — no harsh shadows, every surface evenly illuminated. A muted palette of cream, off-white, and warm beige with occasional accents of gold foil on certain surfaces. The atmosphere is quiet and meditative. Toy-like scale that feels simultaneously miniature and monumental.`,
  },
  {
    id: "mushroom-colony",
    name: "Giant Mushroom Colony",
    description:
      "A misty valley floor covered in giant glowing mushrooms of every colour, with tiny dwellings built into their bases.",
    style: "Fantasy",
    categories: ["fantasy", "nature", "exterior", "domestic"],
    model: "marble-1.1-plus",
    prompt: `A misty valley floor at dusk, densely populated with giant mushrooms of astonishing variety. The largest specimens reach 8 metres tall, with caps wide enough to shelter a small house. Some are bioluminescent — pulsing with soft blue, violet, or pale green light from within their gills and stems. The mushroom varieties are diverse: tall slender ones with conical purple caps, broad flat ones with orange spotted tops, clusters of shelf fungi in pastel pinks and blues growing from a central stalk. Tiny wooden doors and circular windows built into the bases of the largest mushrooms, with warm amber lantern light visible through them. A winding path of smooth stepping stones leads through the colony, past miniature gardens and hanging moss. The ground is soft dark earth covered in a carpet of tiny glowing ferns. A permanent low mist hugs the ground, diffusing the bioluminescent glow into a soft atmospheric haze. The sky above is deep twilight transitioning to night. Glowing spore particles drift lazily through the air. Magical, warm, inviting.`,
  },
  {
    id: "subterranean-express",
    name: "Subterranean Train Station",
    description:
      "A grand abandoned Art Deco underground train station with marble columns, a vintage locomotive, and eerie silence.",
    style: "Cinematic",
    categories: ["interior", "historical", "industrial", "landmark", "ruins"],
    model: "marble-1.1-plus",
    prompt: `A grand abandoned Art Deco underground train station, cathedral-like in scale — the main concourse is 25 metres tall with a coffered ceiling featuring ornate geometric patterns in faded gold leaf. The walls are clad in cream and black marble panels, many now cracked or missing. A row of massive Art Deco chandeliers hang from the ceiling, most dark but three still glowing with a dim warm light. The floor is black-and-white chequerboard terrazzo, heavily worn in a path from the entrance to the platforms. A vintage steam locomotive sits at Platform 3 — dark green with brass fittings, its headlamp still glowing faintly. Advertising posters from the 1930s on the walls, faded to near-monochrome. A grand marble ticket booth dominates the centre, its brass grille closed. Empty wooden benches face the tracks. The air is still and cool with a faint smell of old dust and machine oil. No trains running, no announcements. Deep perspective down the platform receding into darkness. The lighting is dramatic — pools of warm amber from the chandeliers against deep shadow. Eerie and beautiful.`,
  },
  // ── Mined from the Marble community gallery (marble.worldlabs.ai) ──────────
  {
    id: "lisbon-tram",
    name: "Lisbon Tram Golden Hour",
    description:
      "A yellow tram climbing cobbled Lisbon streets at sunset, past tiled facades and hilltop buildings. Mined from the community gallery (@arons1001).",
    style: "Cinematic",
    categories: ["urban", "historical", "exterior"],
    model: "marble-1.1-plus",
    prompt: `A vibrant city street in Lisbon at warm sunset, rendered with an animated, painterly charm. A classic yellow tram with gleaming headlights navigates a winding cobblestone street, tracks guiding it uphill. Multi-storey buildings in cheerful blue, red, and yellow flank the street, adorned with balconies, wrought-iron railings, potted plants, and traditional Portuguese azulejo tiles in intricate patterns. Cafes with awnings spill onto the pavement. Laundry hangs from one balcony. Overhead, tram power lines crisscross the sky. In the distance, hills densely packed with white and pastel buildings rise toward a bridge spanning a river under a dramatic scattered-cloud sky. Ornate ironwork street lamps begin to glow as evening approaches. Golden light rakes across the facades, long shadows stretch up the hill, and the layered buildings ascending the distance create a deep, painterly perspective.`,
  },
  {
    id: "wild-west-town",
    name: "Wild West Frontier Town",
    description:
      "A dusty frontier main street with saloons, a sheriff's office, and a steam locomotive. Mined from the community gallery (@williamf666).",
    style: "Cinematic",
    categories: ["urban", "historical", "exterior"],
    model: "marble-1.1-plus",
    prompt: `A bustling Wild West frontier town under a bright, clear sky. A dusty main street traversed by wagon tracks extends through the settlement, flanked by weathered wooden buildings with false fronts, covered porches, and faded signage. On the left, a grand two-storey saloon with a prominent "SALOON" sign above its balcony, its facade of weathered wood and intricate detailing. Beside it, the Sheriff's office with a star emblem and a notice board on the porch. Further down, a livery stable and general store. A single-track railroad runs along the right side, with a classic black-and-red steam locomotive sitting on the tracks. A wooden water tower painted "SILVER CANYON" stands beside the railway, and a signpost points to "SILVER CANYON," "DRY GULCH," and "RED ROCK." Cacti and sparse scrub dot the arid landscape. Adventurous, rustic, cinematic.`,
  },
  {
    id: "tokyo-oden-alley",
    name: "Tokyo Oden Alley",
    description:
      "A narrow lamp-lit Japanese alley with a steaming oden stall on uneven stone steps. Mined from the community gallery (@faddd).",
    style: "Cinematic",
    categories: ["urban", "historical", "exterior"],
    model: "marble-1.1-plus",
    prompt: `A narrow, bustling Japanese alleyway with an atmospheric painted quality, evoking nostalgic urban charm. Uneven stone steps wind upward into the distance, flanked by tightly packed aged wooden buildings with slatted windows, moss, grime, and intricate timber detailing. Electrical wires crisscross overhead between the structures. On the right, a small open-fronted food stall pours steam from a large pot of simmering oden, illuminated by warm glowing bulbs hanging from the awning; posters and advertisements cover its walls in colour. On the left, quieter wooden facades with window frames and utility meters, planters of small green bushes scattered along the steps. The buildings cascade up the hillside, dense and layered. The stall's inviting glow falls across the rough stone pavement. Golden light against deep wood tones, steam catching the lamplight.`,
  },
  {
    id: "retro-diner",
    name: "Retro Diner with Booths",
    description:
      "A bright mint-green retro diner with red booths, vintage posters, and sunny views of palms. Mined from the community gallery (@linklink).",
    style: "Cinematic",
    categories: ["interior", "historical", "domestic"],
    model: "marble-1.1-plus",
    prompt: `A retro-styled diner interior with a bright, cheerful cartoon-like aesthetic. Red-cushioned booths with clean wooden tabletops line the walls, arranged in an L-shape around the room. Walls painted in two tones of light mint green above darker green wainscoting. Large windows frame sunny suburban views with palm trees and low commercial buildings. Vintage framed posters advertise "PAULAMIE PIZZA" and "BEER & PIZZA BEST FLAVOR" on the left wall, "PHULCHIN'S PIZZA" and wooden paddles on the right. Smooth light-beige floor reflecting ambient light, recessed ceiling lights evenly illuminating the space. Metal napkin dispensers and salt-and-pepper shakers on every table. Through the windows a street sign points toward "Yotola Air Base." Cheerful, inviting, saturated.`,
  },
  {
    id: "sorcerers-hallway",
    name: "Sorcerer's Castle Hallway",
    description:
      "A gothic stone hallway with pointed arches, flickering lanterns, and vines reclaiming the walls. Mined from the community gallery (@cattalyst).",
    style: "Fantasy",
    categories: ["interior", "fantasy", "historical"],
    model: "marble-1.1-plus",
    prompt: `A magically lit hallway within a grand castle, rendered realistic and cinematic, exuding mystery and old-world enchantment. Rough-hewn stone blocks form tall pointed archways, creating immense height and grandeur. Dark ornate wooden doors with heavy iron hardware are set into the walls. Lanterns with flickering flames hang from the vaulted ceiling, casting dramatic shadows over stone texture and cascading vines that cling to walls and ceiling — nature reclaiming the ancient dwelling. Persian rugs in intricate red and gold spread across the flagstone floor of large, irregular grey and brown stones, some damp. Antique carved furniture, scrolls, potted plants, and artifacts suggest a lived-in scholarly atmosphere; a tall wooden cabinet with brass spigot stands against one wall. A wide arching doorway leads into shadow, and a winding stone staircase ascends into the upper levels, worn smooth by centuries. Gothic and mystical, dim warm light.`,
  },
  {
    id: "temple-of-statues",
    name: "Temple of Sacred Statues",
    description:
      "A vast marble temple hall with fluted columns, faded frescoes, and a multi-tiered altar. Mined from the community gallery (@SmartPadawan).",
    style: "Cinematic",
    categories: ["sacred", "interior", "historical", "landmark"],
    model: "marble-1.1-plus",
    prompt: `A solemn and grand temple interior, realistic, evoking ancient reverence and mystery. A vast echoing space with a high vaulted ceiling adorned with intricate carvings and faded frescoes of celestial scenes and mythic figures. Large worn marble tiles extend far into the distance toward an ornate altar at the heart of the hall. Massive fluted columns line both sides, supporting heavy stone arches. Recessed side chapels hold smaller altars and devotional statues, intimate spaces for reflection. Sunlight streams through tall arched windows high on the walls, casting long dramatic shadows across textured surfaces and illuminating dust motes in the air. Tapestries of faded gold and deep crimson hang between columns, depicting ancient rituals, muted by centuries. At the focal altar, a multi-tiered structure of dark polished stone bears a central deity statue flanked by smaller figures. A heavy carved wooden door in a stone archway hints at a reliquary beyond. Hushed, contemplative, sacred.`,
  },
  {
    id: "tokyo-vinyl-bar",
    name: "Tokyo Vinyl Listening Bar",
    description:
      "A Ghibli-style listening bar with turntables, whiskey, and vinyl shelves in amber lamplight. Mined from the community gallery (@taste).",
    style: "Fantasy",
    categories: ["interior", "urban", "domestic"],
    model: "marble-1.1-plus",
    prompt: `A cozy, intimate Tokyo vinyl listening bar rendered in a hand-painted Studio Ghibli anime style — soft warm brushwork, painterly detail, hyper-detailed yet inviting. Evening setting with dim amber lighting, reverent and intimate, music-as-religion. A long industrial wooden bar along one wall, a bartender operating a vintage turntable; behind him floor-to-ceiling dark wood shelves filled with hundreds of vinyl records. A silver vintage hi-fi rack with glowing green VU meters at counter height, backlit shelves of amber Japanese whiskey bottles, and two large vintage wooden speakers flanking the bar. Opposite, a lounge area with two leather armchairs facing a low side table with a brass desk lamp, against warm reddish-brown exposed brick decorated with framed Japanese music posters. Small round dark-wood tables on a deep red oriental rug, each with a brass lamp and a whiskey tumbler. A single large warm circular pendant lamp casts soft amber light through the cave-like room.`,
  },
  {
    id: "bayou-pi-office",
    name: "Bayou Investigator's Office",
    description:
      "A cluttered Southern Gothic PI office with aquarium tanks, peeling paint, and moss-draped cypress views. Mined from the community gallery (@aivideoschool).",
    style: "Cinematic",
    categories: ["interior", "historical", "domestic"],
    model: "marble-1.1-plus",
    prompt: `A realistic, cluttered bayou private investigator's office with a Southern Gothic, lived-in, mysterious atmosphere. Interior of an aging brick building: exposed brick walls, peeling paint on the wooden trim around windows and doors from humid Louisiana air. Numerous aquarium tanks scattered through the space, murky water and aquatic plants adding to the humid ambiance. Rain-streaked windows on every exterior wall frame views of cypress trees draped in Spanish moss surrounding the building. Filing cabinets and overflowing bookshelves line the walls — decades of case files and research. A worn leather armchair in a corner, faded by years of use, beside a floor lamp casting a warm localized glow. Damp earth and old paper in the air. Worn, layered, quietly cinematic.`,
  },
  {
    id: "orbital-research-station",
    name: "Orbital Research Station",
    description:
      "A modular space station workstation with banks of monitors, exposed piping, and circular hatches. Mined from the community gallery (@lucasb10).",
    style: "Cinematic",
    categories: ["scifi", "interior", "industrial"],
    model: "marble-1.1-plus",
    prompt: `A highly detailed, realistic futuristic space station interior focused on scientific operations. Modular wall panels with integrated systems, numerous screens displaying complex data, readouts, and vivid imagery of mountain landscapes. An ergonomic cream upholstered office chair at an L-shaped composite desk covered with monitors, keyboards, scientific instruments, a microscope, and control panels with buttons and switches. Stacked equipment modules to the left with cables neatly routed along walls and ceiling; overhead compartments and strip lighting above the workstation. To the right, a corridor of white padded walls with exposed orange piping, circular hatches and portholes, and neatly stowed sleeping bags secured to the bulkheads. Utilitarian grey flooring with visible seams and access panels. Industrious, functional, sophisticated.`,
  },
  {
    id: "rustic-cabin-winter",
    name: "Rustic Cabin Winter Retreat",
    description:
      "A log cabin with roaring hearth and cooking fire, snow and pines visible through the window. Mined from the community gallery (@einhorn).",
    style: "Cinematic",
    categories: ["interior", "nature", "domestic"],
    model: "marble-1.1-plus",
    prompt: `A cozy, rustic cabin interior, realistic, warm and inviting, tranquil and comforting. Rough-hewn logs form the walls and ceiling beams. A large stone fireplace with a roaring fire is the central focal point; a traditional stone cooking hearth to the left has pots and pans simmering over open flame. Wooden benches near both fires, a rugged wooden table and stools between the cooking area and the window. A small square window frames a snow-covered landscape with a body of water and pine trees — remote wilderness. The floor mixes wide wooden planks and rough stone slabs with a textured rug. Tools, utensils, and provisions hang from walls and ceiling beams; baskets of firewood by the main fireplace. Warm firelight against deep wood, snow-light through the window, steam rising from the hearth.`,
  },
];
