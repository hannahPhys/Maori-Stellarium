## Māori Stellarium Application

# Overview

The Māori Stellarium application is an interactive, web-based star map that visualizes the night sky as seen from specific locations, with a focus on Māori celestial navigation and star lore. The application allows users to explore constellations, individual stars, and the southern celestial hemisphere with culturally significant Māori names and narratives.

# Features

	•	Accurate Star Mapping:
	•	Uses Hipparcos star catalog data for precise rendering of star positions.
	•	Displays stars based on the observer’s location (e.g., Queenstown, New Zealand).
	•	Includes magnitude-based brightness scaling for realistic visuals.
	•	Interactive Exploration:
	•	Hover over stars to reveal their names (both Māori and Western).
	•	Rotate, zoom, and pan the star map using mouse controls.
	•	Cultural Integration:
	•	Highlights key Māori stars and constellations such as Puanga (Rigel), Matariki (Pleiades), and Tautoru (Orion’s Belt).
	•	Includes visual markers for culturally significant points like the South Celestial Pole.
	•	Educational Tool:
	•	Designed for learning about Māori astronomy and its connection to navigation, agriculture, and storytelling.

# Setup Instructions

	1.	Clone the Repository:

git clone https://github.com/your-username/maori-stellarium.git
cd maori-stellarium


	2.	Install Dependencies:
Ensure you have Node.js installed. Then run:

npm install


	3.	Run the Application:
Use a simple web server (e.g., http-server) to serve the application locally:

npx http-server


	4.	Access the Application:
Open a web browser and navigate to:

http://localhost:8080

# Key Components

	1.	Star Data:
	•	Utilizes a JSON file with stars mapped to their Hipparcos catalog numbers, along with common and Māori names.
	2.	Three.js for Rendering:
	•	Displays the star field in a 3D environment.
	•	Handles interactive controls and animations.
	3.	Hover Tooltips:
	•	Tooltip displays dynamically on mouse hover, showing the star’s name and any additional information.
	4.	South Celestial Pole Marker:
	•	A red sphere marks the approximate position of Sigma Octantis near the South Celestial Pole.

# Planned Enhancements

	•	Add Māori constellation overlays with cultural stories.
	•	Implement a time slider to visualize the night sky across seasons.
	•	Provide multilingual support for Māori and English.
	•	Integrate local sidereal time calculations for more precise star positioning.

# Contributing

# Contributions are welcome! To contribute:
	1.	Fork the repository.
	2.	Create a feature branch:

git checkout -b feature/new-feature


	3.	Commit your changes and push the branch:

git push origin feature/new-feature


	4.	Submit a pull request for review.

# Acknowledgments

	•	Hipparcos Catalog: For star data.
	•	Three.js: For rendering the 3D star field.
	•	Māori Astronomy Experts: For providing culturally significant names and stories.
    •	Chatgpt 4.0-preview for being the best co-coder

# License

This project is licensed under the MIT License. You are free to use, modify, and distribute the code with proper attribution.

# Explore the heavens and reconnect with Māori celestial wisdom! 🌌