// Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Set background to black

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, -100, 200); // X, Y, Z coordinates
camera.lookAt(0, 0, 0); // Looking at the origin

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // For high-DPI screens
document.body.appendChild(renderer.domElement);

// Observer's Location (Queenstown, New Zealand)
const observerLatitude = -45.0312; // Degrees
const observerLongitude = 168.6626; // Degrees East

const starPositionsByHip = {};
// Create the star field
function createStarField() {
  const starPositions = [];
  const starSizes = [];
  const starColors = [];
  const starHitboxes = []; // Array to store invisible spheres for raycasting
  // Get Local Sidereal Time
  const lst = Utils.getLocalSiderealTime(observerLongitude);

  hipparcos_catalog.forEach((star) => {
    const hip = star[0];
    const mag = parseFloat(star[1]);
    const ra = parseFloat(star[2]); // RA in degrees
    const dec = parseFloat(star[3]); // Dec in degrees
    const bv = parseFloat(star[4]);

    if (isNaN(ra) || isNaN(dec) || isNaN(mag)) return;

    // Adjust magnitude limit as needed
    if (mag > 6.5) return;

    // Convert Equatorial Coordinates to Horizontal Coordinates
    const { altitude, azimuth } = Utils.equatorialToHorizontal(
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
    starPositionsByHip[hip] = { x, y, z };

    const size = Math.max(1.0, 5 - mag * 1.2);
    starSizes.push(size);

    const colorComponents = bv ? Utils.bvToRgb(bv) : { r: 1, g: 1, b: 1 };
    const color = new THREE.Color(colorComponents.r, colorComponents.g, colorComponents.b);
    starColors.push(color.r, color.g, color.b);

    // Add invisible sphere for raycasting
    const hitboxGeometry = new THREE.SphereBufferGeometry(40, 8, 8); // Use BufferGeometry
    const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible material
    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.position.set(x, y, z);
    hitbox.userData = { name: starNameMapping[hip] }; // Store star name in userData

    scene.add(hitbox);
    starHitboxes.push(hitbox); // Add to raycasting array
    scene.add(hitbox);
    starHitboxes.push(hitbox); // Add to raycasting array
  });

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  starGeometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(starColors, 3)
  );
  starGeometry.setAttribute(
    'size',
    new THREE.Float32BufferAttribute(starSizes, 1)
  );

  const starMaterial = new THREE.ShaderMaterial({
    vertexColors: true,
    vertexShader: `
      attribute float size;
      varying vec3 vColor;

      void main() {
        vColor = color;
        gl_PointSize = size;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;

      void main() {
        // Calculate the distance from the center of the point
        float dist = length(gl_PointCoord - vec2(0.3));
        
        // If the fragment is outside the circle, discard it
        if (dist > 0.3) discard;
        
        // Set the fragment color
        gl_FragColor = vec4(vColor, 1.0);
      } 
    `,
    transparent: true,
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  const constellationMeshes = [];

  constellations.forEach((constellation) => {
    const points = [];
    constellation.stars.forEach((star) => {
      const position = starPositionsByHip[star.hip];
      if (position) {
        points.push(new THREE.Vector3(position.x, position.y, position.z));
      }
    });

    if (points.length >= 4) {
      // Create a custom shape using BufferGeometry
      const vertices = [];
      points.forEach((point) => {
        vertices.push(point.x, point.y, point.z);
      });
    
      // Define faces for the 4-point shape (triangle faces)
      const indices = [
        0, 1, 2, // Triangle 1
        2, 3, 0, // Triangle 2
      ];
    
      // Create BufferGeometry
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
    
      const material = new THREE.MeshBasicMaterial({
        color: 0x0000ff,
        opacity: 0.5, // Adjust opacity for visibility
        transparent: true,
        side: THREE.DoubleSide,
      });
    
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { name: constellation.name };
      scene.add(mesh);
    
      // Calculate bounding sphere for a more accurate hitbox
      const boundingSphere = new THREE.Sphere();
      geometry.computeBoundingSphere();
      boundingSphere.copy(geometry.boundingSphere);
    
      const hitboxGeometry = new THREE.SphereGeometry(
        boundingSphere.radius * 1.5, // Expand radius slightly
        16,
        16
      );
      const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });
      const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
      hitbox.position.copy(boundingSphere.center);
      hitbox.userData = {
        name: constellation.name,
        isConstellation: true,
      };
      scene.add(hitbox);
      constellationMeshes.push(hitbox); // Add hitbox to raycastObjects
    } else if (points.length === 3) {
      // Create a triangle using BufferGeometry
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      geometry.setIndex([0, 1, 2]);
      geometry.computeVertexNormals();

      if (geometry && geometry.attributes.position) {
        const material = new THREE.MeshBasicMaterial({
          color: 0x0000ff,
          opacity: 0.5,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { name: constellation.name };
        scene.add(mesh);
        constellationMeshes.push(mesh);

        // Add bounding sphere for raycasting
        geometry.computeBoundingSphere(); // Compute the bounding sphere
        const boundingSphere = geometry.boundingSphere; // Access the computed bounding sphere

        const hitboxGeometry = new THREE.SphereGeometry(boundingSphere.radius * 1.5, 16, 16); // Scale radius
        const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible hitbox
        const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        hitbox.position.copy(boundingSphere.center); // Set position to sphere's center
        hitbox.userData = { name: constellation.name, isConstellation: true };

        scene.add(hitbox);
        constellationMeshes.push(hitbox);
      } else {
        console.warn(`Failed to create triangle for constellation ${constellation.name}`);
      }
    } else if (points.length === 2) {
      // Create a line
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      if (geometry && geometry.attributes.position) {
        const material = new THREE.LineBasicMaterial({
          color: 0x0000ff,
          opacity: 0.5,
          transparent: true,
        });

        const line = new THREE.Line(geometry, material);
        line.userData = { name: constellation.name };
        scene.add(line);
        constellationMeshes.push(line); // Add the line to the raycasting array

        // Create bounding sphere manually
        const midpoint = new THREE.Vector3()
          .addVectors(points[0], points[1])
          .multiplyScalar(0.5); // Midpoint of the two points
        const radius = points[0].distanceTo(points[1]) / 2; // Half the distance between the points

        const hitboxGeometry = new THREE.SphereGeometry(radius * 1.5, 16, 16); // Expand radius
        const hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible hitbox
        const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        hitbox.position.copy(midpoint);
        hitbox.userData = {
          name: constellation.name,
          isConstellation: true,
        };
        scene.add(hitbox);
        constellationMeshes.push(hitbox); // Add hitbox to the raycasting array
      } else {
        console.warn(`Failed to create line for constellation ${constellation.name}`);
      }
    } else if (points.length === 1) {
      // Create a small sphere
      const geometry = new THREE.SphereGeometry(5, 8, 8); // Note: SphereGeometry is acceptable
      if (geometry && geometry.attributes.position) {
        const material = new THREE.MeshBasicMaterial({
          color: 0x0000ff,
          opacity: 0.0,
          transparent: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(points[0]);
        mesh.userData = { name: constellation.name };
        scene.add(mesh);
        constellationMeshes.push(mesh);
      } else {
        console.warn(`Failed to create sphere for constellation ${constellation.name}`);
      }
    } else {
      // No valid points found for this constellation
      console.warn(`No valid stars found for constellation ${constellation.name}`);
    }
  });

  // Raycasting for Hover Detection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // Update the list of objects to raycast against
  const raycastObjects = [...starHitboxes, ...constellationMeshes];

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
    const intersects = raycaster.intersectObjects(raycastObjects);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const object = intersectedObject?.userData;
      if (object?.isConstellation) {
        console.log(object.name)
        tooltip.style.display = 'block';
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        tooltip.textContent = object.name;
      } else {
        const star = object?.name;
        if (star) {
          tooltip.style.display = 'block';
          tooltip.style.left = `${event.clientX + 10}px`;
          tooltip.style.top = `${event.clientY + 10}px`;
          tooltip.textContent = star.maoriName ? (star.maoriName + " / " + star.commonName) : star.commonName;
        } else {
          tooltip.style.display = 'none';
        }
      }
    } else {
      tooltip.style.display = 'none'; // Hide tooltip if nothing is hovered
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

controls.minDistance = 10;
controls.maxDistance = 5000;

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