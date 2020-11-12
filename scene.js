var camera, scene, renderer;
var mesh, second;

init();
animate();
// var mesh = null;
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd6d6d6);
  var WIDTH = 600;
  var HEIGHT = 600;
	camera = new THREE.PerspectiveCamera( 70, WIDTH / HEIGHT, 0.01, 50 );
  camera.position.set(-0.2, 0.5, 2);
  camera.lookAt(scene.position);
  scene.add(camera);

  ambientLight = new THREE.AmbientLight(0x555555);
  scene.add(ambientLight);
  
  light = new THREE.PointLight(0xffffff);
  light.position.set(0, 30, 0);
  scene.add(light);

  light = new THREE.PointLight(0xffffff);
  light.position.set(5, -20, 10);
  scene.add(light);

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( WIDTH, HEIGHT );
  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.minDistance = 1;
  // controls.maxDistance = 2;
}

function animate() {
	requestAnimationFrame( animate );
  renderer.render(scene, camera);
}

/**
 * update lathe
 * @param {Array} data the series of amplitudes
 * @param {Any} color the color of material
 * @param {Number} MAX_HEIGHT height
 * @param {Number} MAX_RADIUS radius
 */
function updateLathe(data, color = 0xffff00, MAX_HEIGHT = 2, MAX_RADIUS = 1) {
  if (!Array.isArray(data) || data.length == 0) return;
  if (typeof color === 'string') color = parseInt(color, 16);
  if (mesh instanceof THREE.Mesh) scene.remove(mesh);
  if (second instanceof THREE.Mesh) scene.remove(second);

  var maxAmplitude = Math.max.apply(Math, data);

  let started = false;
  let startPoint = null;
  const shape = new THREE.Shape();
  var PILLAR_RADIUS = maxAmplitude * 0.02;
  
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (r < PILLAR_RADIUS) r = PILLAR_RADIUS;
    var a = r / maxAmplitude * MAX_RADIUS;
    var b = (i - data.length / 2) * MAX_HEIGHT / data.length;
    if (!started) {
      started = true;
      startPoint = [a, b]
    }
    shape.lineTo(a, b);
  }

  for (var i = data.length - 1; i >= 0; i--) {
    var r = data[i];
    if (r < PILLAR_RADIUS) r = PILLAR_RADIUS;
    var a = r / maxAmplitude * MAX_RADIUS;
    var b = (i - data.length / 2) * MAX_HEIGHT / data.length;
    shape.lineTo(-a, b);
  }

  shape.lineTo(startPoint[0], startPoint[1]);
  
  const DEPTH = 0.03;
  const extrudeSettings = {
    steps: 2,
    depth: DEPTH,
    bevelEnabled: false,
    // bevelThickness: 0.01,
    // bevelSize: 0.01,
    // bevelOffset: 0,
    // bevelSegments: 1
  };

  const geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );
  var material = new THREE.MeshPhongMaterial({color, side: THREE.DoubleSide});
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  try {
    for (var i in mesh.geometry.vertices) {
      let x = mesh.geometry.vertices[i].x;
      if (Math.abs(x) > (PILLAR_RADIUS * MAX_RADIUS * 3)) {
        mesh.geometry.vertices[i].z = DEPTH / 2;
      }
    }
  } catch (_) {
    
  }
  second = mesh.clone();
  scene.add(second);
  second.rotation.y = Math.PI / 2;
  
  mesh.position.z = -DEPTH / 2;
  second.position.x = -DEPTH / 2;
}