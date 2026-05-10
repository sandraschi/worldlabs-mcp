export interface Painting {
    id: string;
    title: string;
    artist: string;
    year: string;
    imageUrl: string;
    caption: string;
    style: string;
}

const WIKI = 'https://upload.wikimedia.org/wikipedia/commons';

export const PAINTINGS: Painting[] = [
    {
        id: 'starry-night',
        title: 'The Starry Night',
        artist: 'Vincent van Gogh',
        year: '1889',
        imageUrl: `${WIKI}/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg`,
        caption: 'A swirling night sky over a small French village, with glowing stars and a crescent moon above rolling hills.',
        style: 'Post-Impressionism',
    },
    {
        id: 'nighthawks',
        title: 'Nighthawks',
        artist: 'Edward Hopper',
        year: '1942',
        imageUrl: `${WIKI}/thumb/a/a8/Nighthawks_by_Edward_Hopper_1942.jpg/1280px-Nighthawks_by_Edward_Hopper_1942.jpg`,
        caption: 'A late-night diner interior on a deserted city corner, with three customers and a server beneath fluorescent light.',
        style: 'American Realism',
    },
    {
        id: 'wanderer',
        title: 'Wanderer above the Sea of Fog',
        artist: 'Caspar David Friedrich',
        year: '1818',
        imageUrl: `${WIKI}/thumb/b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg/1280px-Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg`,
        caption: 'A lone figure on a rocky precipice overlooking a vast sea of misty mountain peaks stretching to the horizon.',
        style: 'Romanticism',
    },
    {
        id: 'mona-lisa',
        title: 'Mona Lisa',
        artist: 'Leonardo da Vinci',
        year: '1503–1506',
        imageUrl: `${WIKI}/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/1280px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg`,
        caption: 'A half-length portrait of a woman with an enigmatic smile, seated before a distant imaginary landscape with winding paths and bridges.',
        style: 'Renaissance',
    },
    {
        id: 'great-wave',
        title: 'The Great Wave off Kanagawa',
        artist: 'Katsushika Hokusai',
        year: '1831',
        imageUrl: `${WIKI}/thumb/3/3c/Great_Wave_off_Kanagawa_%28Tribute%29.jpg/1280px-Great_Wave_off_Kanagawa_%28Tribute%29.jpg`,
        caption: 'A towering wave curling above three fishing boats, with Mount Fuji small in the distance beneath the foam.',
        style: 'Ukiyo-e',
    },
    {
        id: 'paris-street',
        title: 'Paris Street; Rainy Day',
        artist: 'Gustave Caillebotte',
        year: '1877',
        imageUrl: `${WIKI}/thumb/b/b6/Gustave_Caillebotte_-_Jour_de_pluie_%C3%A0_Paris.jpg/1280px-Gustave_Caillebotte_-_Jour_de_pluie_%C3%A0_Paris.jpg`,
        caption: 'A wide Parisian intersection on a wet day, with figures under umbrellas crossing the cobblestones between Haussmann buildings.',
        style: 'Impressionism',
    },
    {
        id: 'scream',
        title: 'The Scream',
        artist: 'Edvard Munch',
        year: '1893',
        imageUrl: `${WIKI}/thumb/f/f4/The_Scream.jpg/1280px-The_Scream.jpg`,
        caption: 'A figure on a bridge beneath a swirling orange sky, hands clasped to ears, with two distant figures walking away.',
        style: 'Expressionism',
    },
    {
        id: 'water-lilies',
        title: 'Water Lilies',
        artist: 'Claude Monet',
        year: '1916',
        imageUrl: `${WIKI}/thumb/9/98/Claude_Monet_-_Water_Lilies_-_1906.jpg/1280px-Claude_Monet_-_Water_Lilies_-_1906.jpg`,
        caption: 'A pond surface covered in green lily pads and scattered pink and white blooms, reflecting the sky and surrounding willows.',
        style: 'Impressionism',
    },
    {
        id: 'school-of-athens',
        title: 'The School of Athens',
        artist: 'Raphael',
        year: '1511',
        imageUrl: `${WIKI}/thumb/4/4a/%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg/1280px-%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg`,
        caption: 'A grand vaulted hall filled with ancient philosophers in discussion, framed by towering classical arches and marble statues.',
        style: 'High Renaissance',
    },
    {
        id: 'garden-of-earthly-delights',
        title: 'The Garden of Earthly Delights',
        artist: 'Hieronymus Bosch',
        year: '1490–1510',
        imageUrl: `${WIKI}/thumb/0/02/The_Garden_of_Earthly_Delights_by_Bosch_High_Resolution.jpg/1280px-The_Garden_of_Earthly_Delights_by_Bosch_High_Resolution.jpg`,
        caption: 'A fantastical triptych of paradise, earthly life, and hell — filled with surreal creatures, bizarre architectures, and dreamlike landscapes.',
        style: 'Northern Renaissance',
    },
    {
        id: 'cafe-terrace',
        title: 'Café Terrace at Night',
        artist: 'Vincent van Gogh',
        year: '1888',
        imageUrl: `${WIKI}/thumb/9/94/Vincent_van_Gogh_-_Terrace_of_a_caf%C3%A9_at_night_%28Yogurt%29.jpg/1280px-Vincent_van_Gogh_-_Terrace_of_a_caf%C3%A9_at_night_%28Yogurt%29.jpg`,
        caption: 'A warmly lit outdoor café on a cobbled square under a deep blue starry sky, with figures seated at small round tables.',
        style: 'Post-Impressionism',
    },
    {
        id: 'birth-of-venus',
        title: 'The Birth of Venus',
        artist: 'Sandro Botticelli',
        year: '1485–1486',
        imageUrl: `${WIKI}/thumb/1/14/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_%28cropped%29.jpg/1280px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_%28cropped%29.jpg`,
        caption: 'Venus standing on a giant scallop shell at sea, blown to shore by wind gods, with a spring goddess offering a cloak.',
        style: 'Early Renaissance',
    },
    {
        id: 'persistence-of-memory',
        title: 'The Persistence of Memory',
        artist: 'Salvador Dalí',
        year: '1931',
        imageUrl: `${WIKI}/thumb/d/dd/The_Persistence_of_Memory.jpg/1280px-The_Persistence_of_Memory.jpg`,
        caption: 'Melting clocks draped over a barren dreamscape with a cliff-like horizon, a dead tree, and a strange central creature.',
        style: 'Surrealism',
    },
    {
        id: 'american-gothic',
        title: 'American Gothic',
        artist: 'Grant Wood',
        year: '1930',
        imageUrl: `${WIKI}/thumb/5/5b/American_Gothic_1_%28cropped%29.jpg/1280px-American_Gothic_1_%28cropped%29.jpg`,
        caption: 'A farmer holding a pitchfork beside his daughter in front of an iconic white farmhouse with a gothic arched window.',
        style: 'Regionalism',
    },
];
