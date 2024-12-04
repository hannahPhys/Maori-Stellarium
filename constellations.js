const constellations = [
    {
        "name": "Tautoru", //Orion's Belt
        "stars": [
            { "hip": 26727 }, // Alnitak
            { "hip": 26311 }, // Alnilam
            { "hip": 25930 }  // Mintaka
        ],
        "edges": [
            [26727, 26311], // Alnitak to Alnilam
            [26311, 25930],  // Alnilam to Mintaka
            [25930, 26727]
        ]
    },
    {
        name: 'Mahutonga',
        stars: [
            { hip: 60718 }, // Acrux
            { hip: 62434 }, // Mimosa
            { hip: 59747 }, // Imai
            { hip: 61084 }, // Gacrux
        ],
        edges: [
            [60718, 62434], // Acrux to Mimosa
            [62434, 61084], // Mimosa to Gacrux
            [61084, 59747], // Gacrux to Imai
            [59747, 60718], // Imai to Acrux
        ],
    },
    {
        name: 'Whetū Matarau | The Pointers',
        stars: [
            { hip: 71683 }, // Alpha cen 
            { hip: 68702 }, // Beta cen
        ],
        edges: [
            [71683, 68702], // Anchor line from alpha to beta cen
        ],
    },
    {
        name: "False Cross",
        stars: [
            { hip: 41037 }, // Epsilon Carinae (Avior)
            { hip: 52419 }, // Iota Carinae (Aspidiske)
            { hip: 44382 }, // Delta Velorum
            { hip: 43509 }, // Kappa Velorum (Markeb)
        ],
        edges: [
            [41037, 52419], // Avior to Aspidiske
            [52419, 44382], // Aspidiske to Delta Velorum
            [44382, 43509], // Delta Velorum to Markeb
            [43509, 41037], // Markeb to Avior
        ],
    },
    {
        "name": "Tama-rereti", //Tail of Scorpio | Hook of Maui
        "stars": [
            { "hip": 85927 }, // Shaula
            { "hip": 86228 }, // Lesath
            { "hip": 82396 }, // Jabbah
            { "hip": 85696 }, // θ Scorpii
            { "hip": 87073 }, // ι Scorpii
            { "hip": 89962 }  // κ Scorpii
        ],
        "edges": [
            [85927, 86228], // Shaula to Lesath
            [86228, 85696], // Lesath to θ Scorpii
            [85696, 87073], // θ Scorpii to ι Scorpii
            [87073, 89962], // ι Scorpii to κ Scorpii
            [89962, 82396], // κ Scorpii to Jabbah
            [82396, 85927]  // Jabbah to Shaula (closing the loop)
        ]
    }
    // Define other constellations
];