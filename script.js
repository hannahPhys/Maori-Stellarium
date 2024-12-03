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
camera.lookAt(0, 0, 0); // Looking at the origin

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // For high-DPI screens
document.body.appendChild(renderer.domElement);

// Observer's Location (Queenstown, New Zealand)
const observerLatitude = -45.0312; // Degrees
const observerLongitude = 168.6626; // Degrees East

// Function to compute Julian Date
function getJulianDate(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // Months are zero-based in JS
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();

  let A = Math.floor(year / 100);
  let B = 2 - A + Math.floor(A / 4);

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const JD =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    B -
    1524.5 +
    (hour + minute / 60 + second / 3600) / 24;

  return JD;
}

// Function to compute Greenwich Mean Sidereal Time (GMST)
function getGMST(date) {
  const JD = getJulianDate(date);
  const T = (JD - 2451545.0) / 36525.0;
  let GMST =
    280.46061837 +
    360.98564736629 * (JD - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;

  GMST = GMST % 360.0;
  if (GMST < 0) GMST += 360.0;
  return GMST; // In degrees
}

// Function to compute Local Sidereal Time (LST)
function getLocalSiderealTime(longitude) {
  const now = new Date();
  const GMST = getGMST(now);
  let LST = GMST + longitude;
  LST = LST % 360.0;
  if (LST < 0) LST += 360.0;
  return LST; // In degrees
}

// Function to convert Equatorial Coordinates to Horizontal Coordinates
function equatorialToHorizontal(ra, dec, latitude, lst) {
  const raRad = THREE.Math.degToRad(ra); // RA in radians
  const decRad = THREE.Math.degToRad(dec); // Dec in radians
  const latRad = THREE.Math.degToRad(latitude);
  const lstRad = THREE.Math.degToRad(lst);

  let H = lstRad - raRad; // Hour Angle in radians
  H = ((H + Math.PI) % (2 * Math.PI)) - Math.PI; // Normalize H to [-π, π)

  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(H);
  const altitude = Math.asin(sinAlt);

  const cosAz =
    (Math.sin(decRad) - Math.sin(altitude) * Math.sin(latRad)) /
    (Math.cos(altitude) * Math.cos(latRad));
  const sinAz = (-Math.cos(decRad) * Math.sin(H)) / Math.cos(altitude);
  let azimuth = Math.atan2(sinAz, cosAz);

  azimuth = (azimuth + 2 * Math.PI) % (2 * Math.PI); // Normalize to [0, 2π)

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

  // Get Local Sidereal Time
  const lst = getLocalSiderealTime(observerLongitude);

  hipparcos_catalog.forEach((star) => {
    const hip = star[0];
    const mag = parseFloat(star[1]);
    const ra = parseFloat(star[2]); // RA in degrees
    const dec = parseFloat(star[3]); // Dec in degrees
    const bv = parseFloat(star[4]);

    if (isNaN(ra) || isNaN(dec) || isNaN(mag)) return;

    // Adjust magnitude limit as needed
    if (mag > 7.0) return;

    // Convert Equatorial Coordinates to Horizontal Coordinates
    const { altitude, azimuth } = equatorialToHorizontal(
      ra,
      dec,
      observerLatitude,
      lst
    );

    if (altitude < 0) return; // Skip stars below the horizon

    // Convert Altitude and Azimuth to Cartesian coordinates
    const radius = 1000;
    const altRad = THREE.Math.degToRad(altitude);
    const azRad = THREE.Math.degToRad(azimuth);

    const x = radius * Math.cos(altRad) * Math.sin(azRad);
    const y = radius * Math.sin(altRad);
    const z = radius * Math.cos(altRad) * Math.cos(azRad);

    starPositions.push(x, y, z);

    const size = Math.max(1.0, 6 - mag * 1);
    starSizes.push(size);

    const color = new THREE.Color(0xffffff);
    starColors.push(color.r, color.g, color.b);

    // Add invisible sphere for raycasting
    const hitboxGeometry = new THREE.SphereGeometry(40); // Adjust size as needed
    const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible material
    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.position.set(x, y, z);
    hitbox.userData = { name: starNameMapping[hip] }; // Store star name in userData

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

      if (!star) {
        tooltip.style.display = 'none';
        return;
      }

      tooltip.style.display = 'block';
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
      tooltip.textContent = star?.commonName; // Show the common name
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

// Allow full horizontal and vertical rotation
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI;
controls.minAzimuthAngle = -Infinity;
controls.maxAzimuthAngle = Infinity;

controls.update();

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