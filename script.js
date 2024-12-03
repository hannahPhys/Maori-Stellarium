// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Set background to black

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, 50, 200); // X, Y, Z coordinates
camera.lookAt(0, 0, 0); // Looking along positive Y-axis

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // For high-DPI screens
document.body.appendChild(renderer.domElement);

// Convert RA and Dec to Cartesian coordinates (Y-up)
function convertToCartesian(ra, dec, radius = 1000) {
  const raRad = THREE.Math.degToRad(ra); // Convert RA to radians
  const decRad = THREE.Math.degToRad(dec); // Convert Dec to radians

  const x = radius * Math.cos(decRad) * Math.cos(raRad);
  const y = radius * Math.sin(decRad); // Y corresponds to Dec
  const z = radius * Math.cos(decRad) * Math.sin(raRad);

  return { x, y, z };
}

//Manual current location
// const observerLatitude = -45.0312; // Queenstown, New Zealand
// const observerLongitude = 168.6626;
// const observerElevation = 0; // Elevation in meters

function getSiderealTime(longitude) {
  const now = new Date();
  const jd = now.getTime() / 86400000 + 2440587.5; // Julian date
  const T = (jd - 2451545.0) / 36525; // Julian centuries from J2000.0

  // Greenwich Mean Sidereal Time in degrees
  const GMST = (280.46061837 + 360.98564736629 * (jd - 2451545.0)) % 360;

  // Local Sidereal Time
  const LST = (GMST + longitude) % 360; // Include longitude correction
  return LST < 0 ? LST + 360 : LST; // Normalize to [0, 360)
}

function equatorialToHorizontal(ra, dec, latitude, lst) {
  const raRad = THREE.Math.degToRad(ra * 15); // RA in radians
  const decRad = THREE.Math.degToRad(dec); // Dec in radians
  const latRad = THREE.Math.degToRad(latitude);
  const lstRad = THREE.Math.degToRad(lst);

  const hourAngle = lstRad - raRad;

  const altitude = Math.asin(
    Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(hourAngle)
  );
  const azimuth = Math.atan2(
    -Math.cos(decRad) * Math.sin(hourAngle),
    Math.sin(decRad) - Math.sin(latRad) * Math.sin(altitude)
  );

  return {
    altitude: THREE.Math.radToDeg(altitude),
    azimuth: THREE.Math.radToDeg(azimuth),
  };
}

// Create the star field
function createStarField() {
  const starPositions = [];
  const starSizes = [];
  const starColors = [];
  const starHitboxes = []; // Array to store invisible spheres for raycasting


  hipparcos_catalog.forEach((star) => {
    const hip = star[0];
    const mag = parseFloat(star[1]);
    const ra = parseFloat(star[2]);
    const dec = parseFloat(star[3]);
    const bv = parseFloat(star[4]);

    if (isNaN(ra) || isNaN(dec) || isNaN(mag)) return;

    // Adjust magnitude limit as needed
    if (mag > 7.0) return;

    
    //const lst = getSiderealTime(observerLongitude);
    //const { altitude, azimuth } = equatorialToHorizontal(ra, dec, observerLatitude, lst);

    //if (altitude < 0) return; // Skip stars below the horizon

    // const radius = 1000;
    // const x = radius * Math.cos(THREE.Math.degToRad(altitude)) * Math.sin(THREE.Math.degToRad(azimuth));
    // const y = radius * Math.sin(THREE.Math.degToRad(altitude));
    // const z = radius * Math.cos(THREE.Math.degToRad(altitude)) * Math.cos(THREE.Math.degToRad(azimuth));
    
    const { x, y, z } = convertToCartesian(ra, dec);
    starPositions.push(x, y, z);

    const size = Math.max(1.0, 6 - mag * 1);
    starSizes.push(size);

    const color =  new THREE.Color(0xffffff) ;
    starColors.push(color.r, color.g, color.b);

      // Add invisible sphere for raycasting
    const hitboxGeometry = new THREE.SphereGeometry(40); // Adjust size as needed
    const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible material
    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.position.set(x, y, z);
    hitbox.userData = { name: starNameMapping[hip] }; // Store star name in userData
    //if (hip == 68702) 

    scene.add(hitbox);
    starHitboxes.push(hitbox); // Add to raycasting array
  });

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  starGeometry.setAttribute(
    'size',
    new THREE.Float32BufferAttribute(starSizes, 1)
  );

  const starMaterial = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(0xffffff) } },
    vertexShader: `
      attribute float size;
      void main() {
        gl_PointSize = size;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      void main() {
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    transparent: true,
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  function addSouthPoint() {
    const sigmaOctantis = {
      ra: 317, // Right Ascension in degrees
      dec: -88.95, // Declination in degrees
    };
  
    // Calculate the position of the South Celestial Pole
    const lst = getSiderealTime(observerLongitude);
    const { altitude, azimuth } = equatorialToHorizontal(
      sigmaOctantis.ra,
      sigmaOctantis.dec,
      observerLatitude,
      lst
    );
  
    const radius = 1000; // Same radius as the stars
    const x = radius * Math.cos(THREE.Math.degToRad(altitude)) * Math.sin(THREE.Math.degToRad(azimuth));
    const y = radius * Math.sin(THREE.Math.degToRad(altitude));
    const z = radius * Math.cos(THREE.Math.degToRad(altitude)) * Math.cos(THREE.Math.degToRad(azimuth));
  
    // Create a small dot to represent the South Celestial Pole
    const southPointGeometry = new THREE.SphereGeometry(10, 16, 16); // Adjust size as needed
    const southPointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color for visibility
    const southPoint = new THREE.Mesh(southPointGeometry, southPointMaterial);
    southPoint.position.set(x, y, z);
  
    scene.add(southPoint);
  }
  
  // Call this function after creating the star field
  //addSouthPoint();

// Raycasting for Hover Detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Tooltip setup
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.padding = '5px';
tooltip.style.background = 'rgba(0, 0, 0, 0.7)';
tooltip.style.color = 'white';
tooltip.style.borderRadius = '5px';
tooltip.style.display = 'none'; // Initially hidden
document.body.appendChild(tooltip);

// Handle Mouse Move for Hover Detection
function onMouseMove(event) {
  // Normalize mouse coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Perform raycasting
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(starHitboxes);

  if (intersects.length > 0) {
    // Determine the closest star
    const intersectedStar = intersects[0].object;
    const star = intersectedStar?.userData?.name;

    if (!star) { tooltip.style.display = 'none';  return; }

    tooltip.style.display = 'block';
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
    tooltip.textContent = star?.commonName; // Show the maori name first star?.maoriName || 
    
  } else {
    tooltip.style.display = 'none'; // Hide tooltip if no star is hovered
  }
}

// Attach mouse move event listener
window.addEventListener('mousemove', onMouseMove);
}

createStarField();

// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.minDistance = 0.1;
controls.maxDistance = 2000;

// Remove vertical rotation limits to allow full 360-degree view
// controls.minPolarAngle = 0;
// controls.maxPolarAngle = Math.PI;

// Allow full horizontal rotation
controls.minAzimuthAngle = -Infinity;
controls.maxAzimuthAngle = Infinity;

controls.update();

// Optional: Add a ground plane or horizon for reference
// const groundGeometry = new THREE.PlaneGeometry(4000, 4000);
// const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
// const ground = new THREE.Mesh(groundGeometry, groundMaterial);
// ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
// ground.position.y = -10; // Slightly below the origin
// scene.add(ground);

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});