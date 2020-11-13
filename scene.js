var camera, scene, renderer;
var mesh;
var clipPlane;

var tree_height = 1;
init();
animate();
// var mesh = null;
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd6d6d6);
  var WIDTH = 600;
  var HEIGHT = 600;
  camera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT, 0.01, 50);
  camera.position.set(-1.5, 0.5, 1.2);
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

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.localClippingEnabled = true;

  document.body.appendChild(renderer.domElement);

  // controls = new THREE.OrbitControls(camera, renderer.domElement);
  // controls.minDistance = 1;
  // controls.maxDistance = 2;
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);

  let follow = document.getElementById('chk-follow-progress').checked;
  if (follow && clipPlane) {
    let aud = document.getElementById('aud-playback');
    try {
      let duration = aud.duration;
      let currentTime = aud.currentTime;
      let rate = (duration > 0) ? (currentTime / duration) : 1;
      clipPlane.constant = rate * tree_height - (tree_height / 2);
    } catch (_) {

    }
  }
}

/**
 * update lathe
 * @param {Array} data the series of amplitudes
 * @param {Any} color the color of material
 * @param {Number} MAX_HEIGHT height
 * @param {Number} MAX_RADIUS radius
 */
function updateLathe(data, color = 0xffff00, MAX_HEIGHT = 2, MAX_RADIUS = 1) {
  tree_height = MAX_HEIGHT;

  if (!Array.isArray(data) || data.length == 0) return;
  if (typeof color === 'string') color = parseInt(color, 16);
  if (mesh instanceof THREE.Mesh) scene.remove(mesh);

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
    if (!started) started = true, startPoint = [a, b];
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

  const DEPTH = 0;
  const extrudeSettings = {
    steps: 1,
    depth: DEPTH,
    bevelEnabled: false
  };

  clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), tree_height);
  var material = new THREE.MeshPhongMaterial({
    color,
    side: THREE.DoubleSide,
    clippingPlanes: [clipPlane],
    clipShadows: true
  });


  // const geometry = new THREE.TorusKnotBufferGeometry(0.4, 0.08, 95, 20);
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  // object.position.y = 0.8
  scene.add(mesh);

  let subObjects = [];
  let BRANCH_COUNT = 8;
  for (var i = 1; i < (BRANCH_COUNT + 1); i++) {
    var angle = Math.PI / BRANCH_COUNT * i;
    var cloned = mesh.clone();
    var rate = i % (BRANCH_COUNT / 2);
    if (rate == 0) rate = BRANCH_COUNT / 2;
    cloned.scale.set(rate / (BRANCH_COUNT / 2), 1, 1);
    cloned.rotation.y = angle;
    subObjects.push(cloned);
  }
  subObjects.forEach(subObject => mesh.add(subObject));
  subObjects = [];
}