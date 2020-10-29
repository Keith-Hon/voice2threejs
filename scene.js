var camera, scene, renderer;
var mesh;

init();
animate();
// var mesh = null;
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd6d6d6);
  var WIDTH = 600;
  var HEIGHT = 600;
	camera = new THREE.PerspectiveCamera( 70, WIDTH / HEIGHT, 0.01, 50 );
  camera.position.set(1, 0.5, -2);
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

  // controls = new THREE.OrbitControls(camera, renderer.domElement);
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
  // var points = [];
  // for ( var i = 0; i < 10; i ++ ) {
  //   points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * 1, ( i - 5 ) * 0.2 ) );
  // }
  var points = [];
  var maxAmplitude = Math.max.apply(Math, data);
  
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var PILLAR_RADIUS = maxAmplitude * 0.02;
    if (r < PILLAR_RADIUS) r = PILLAR_RADIUS;
    points.push( new THREE.Vector2( r / maxAmplitude * MAX_RADIUS, ( i - data.length / 2 ) * MAX_HEIGHT / data.length ) );
  }
  var geometry = new THREE.LatheGeometry( points, 9 );
  var material = new THREE.MeshPhongMaterial({color, side: THREE.DoubleSide});
  mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );

}