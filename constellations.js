const constellations = [
    {
      name: 'Orion',
      stars: [
        { hip: 27989 }, // Betelgeuse
        { hip: 25336 }, // Bellatrix
        { hip: 27366 }, // Saiph
        { hip: 24436 }, // Rigel
      ],
      edges: [
        [27989, 25336], // Betelgeuse to Bellatrix
        [25336, 24436], // Bellatrix to Rigel
        [24436, 27366], // Rigel to Saiph
        [27366, 27989], // Saiph to Betelgeuse
      ],
    },
    {
        name: 'Southern Cross',
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
    // Define other constellations
  ];