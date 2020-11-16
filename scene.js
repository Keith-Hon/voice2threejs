'use strict';
var SPARKLE_PRESETS = [{
    baseColor: [1, 1, 1],
    outlineColor: [143 / 255, 255 / 255, 207 / 255],
    duration: 2
  },
  {
    baseColor: [1, 1, 1],
    outlineColor: [250 / 255, 162 / 255, 143 / 255],
    duration: 1.3
  },
  {
    baseColor: [1, 1, 1],
    outlineColor: [188 / 255, 255 / 255, 143 / 255],
    duration: 1.6
  },
];

(function () {
  var SceneManager = function () {
    const self = this;
    var camera, scene, renderer, composer, controls;
    var mesh, sphere;
    var clipPlane;
    var sparkles = [];

    var outlines = [];

    var tree_height = 1;

    this.toScreenPosition = function (obj, camera) {
      var vector = new THREE.Vector3();

      var widthHalf = 0.5 * renderer.context.canvas.width;
      var heightHalf = 0.5 * renderer.context.canvas.height;

      obj.updateMatrixWorld();
      vector.setFromMatrixPosition(obj.matrixWorld);
      vector.project(camera);

      vector.x = (vector.x * widthHalf) + widthHalf;
      vector.y = -(vector.y * heightHalf) + heightHalf;

      return {
        x: vector.x,
        y: vector.y
      };

    };

    // var mesh = null;
    this.init = function () {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xd6d6d6);
      // scene.background = new THREE.Color(0x000000);
      var WIDTH = 600;
      var HEIGHT = 600;
      camera = new THREE.PerspectiveCamera(70, WIDTH / HEIGHT, 0.01, 50);
      camera.position.set(-0.7, 0.5, 1.6);
      camera.lookAt(scene.position);
      scene.add(camera);

      var ambientLight = new THREE.AmbientLight(0x555555);
      scene.add(ambientLight);

      var light = new THREE.PointLight(0xffffff);
      light.position.set(0, 30, 0);
      scene.add(light);

      light = new THREE.PointLight(0xffffff);
      light.position.set(5, -20, 10);
      scene.add(light);

      const geometry = new THREE.SphereGeometry(0.1, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
      });
      sphere = new THREE.Mesh(geometry, material);
      sphere.visible = false;
      scene.add(sphere);

      renderer = new THREE.WebGLRenderer({
        antialias: true
      });
      renderer.setSize(WIDTH, HEIGHT);
      renderer.localClippingEnabled = true;

      document.getElementById('canvas-container').appendChild(renderer.domElement);
      var line = document.createElement('div');
      line.id = 'line-indicator';
      document.getElementById('canvas-container').appendChild(line);

      composer = new THREE.EffectComposer(renderer);

      var renderPass = new THREE.RenderPass(scene, camera);
      composer.addPass(renderPass);

      for (var i = 0; i < SPARKLE_PRESETS.length; i++) {
        var outlinePass = new THREE.OutlinePass(new THREE.Vector2(WIDTH, HEIGHT), scene, camera);

        outlinePass.edgeStrength = 10;
        outlinePass.edgeGlow = 1;
        outlinePass.edgeThickness = 2;
        outlinePass.pulsePeriod = SPARKLE_PRESETS[i].duration;
        outlinePass.visibleEdgeColor = new THREE.Color(
          SPARKLE_PRESETS[i].outlineColor[0],
          SPARKLE_PRESETS[i].outlineColor[1],
          SPARKLE_PRESETS[i].outlineColor[2]
        );
        outlinePass.hiddenEdgeColor = new THREE.Color(
          SPARKLE_PRESETS[i].outlineColor[0] * 0.7,
          SPARKLE_PRESETS[i].outlineColor[1] * 0.7,
          SPARKLE_PRESETS[i].outlineColor[2] * 0.7
        );

        composer.addPass(outlinePass);
        outlines.push(outlinePass);
      }

      var effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
      effectFXAA.uniforms['resolution'].value.set(1 / WIDTH, 1 / HEIGHT);
      composer.addPass(effectFXAA);

      // controls = new THREE.OrbitControls(camera, renderer.domElement);
      // controls.minDistance = 1;
      // controls.maxDistance = 2;
    }

    this.animate = function () {
      requestAnimationFrame(self.animate);
      renderer.render(scene, camera);
      composer.render();

      let follow = document.getElementById('chk-follow-progress').checked;
      if (follow && clipPlane) {
        let aud = document.getElementById('aud-playback');
        try {
          let duration = aud.duration;
          let currentTime = aud.currentTime;
          let rate = (duration > 0) ? (currentTime / duration) : 1;
          clipPlane.constant = sphere.position.y = rate * tree_height - (tree_height / 2);
          let pos = self.toScreenPosition(sphere, camera);
          document.getElementById('line-indicator').style.top = `${pos.y}px`;
        } catch (_) {}
      }
    }

    /**
     * update lathe
     * @param {Array} data the series of amplitudes
     * @param {Any} color the color of material
     * @param {Number} MAX_HEIGHT height
     * @param {Number} MAX_RADIUS radius
     */
    this.updateLathe = function (data, color = 0xffff00, MAX_HEIGHT = 2, MAX_RADIUS = 1) {
      tree_height = MAX_HEIGHT;
      sphere.position.y = tree_height;

      if (!Array.isArray(data) || data.length == 0) return;
      if (typeof color === 'string') color = parseInt(color, 16);
      if (mesh instanceof THREE.Mesh) scene.remove(mesh);

      for (var outline of outlines) outline.selectedObjects = [];
      for (var star of sparkles) scene.remove(star);
      sparkles = [];


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

      const DEPTH = 0.005;
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

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      scene.add(mesh);

      let subObjects = [];
      let BRANCH_COUNT = 16;
      for (var i = 1; i < (BRANCH_COUNT + 1); i++) {
        var angle = Math.PI / BRANCH_COUNT * i;
        var cloned = mesh.clone();
        var rate = i % (BRANCH_COUNT / 2);
        rate = Math.abs(BRANCH_COUNT / 4 - rate);
        cloned.scale.set(rate / (BRANCH_COUNT / 2) * 2, 1, 1);
        cloned.rotation.y = angle;
        subObjects.push(cloned);
      }
      subObjects.forEach(subObject => mesh.add(subObject));
      subObjects = [];

      // generate sparkles
      for (var i = 0; i < SPARKLES_COUNT; i++) {
        var sparkle_group_index = i % SPARKLE_PRESETS.length;

        let childIndex = parseInt(Math.random() * BRANCH_COUNT);
        let vertices = mesh.children[childIndex].geometry.vertices;
        let pos = vertices[parseInt(Math.random() * vertices.length)];

        const geometry = new THREE.SphereGeometry(0.006, 32, 32);
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(SPARKLE_PRESETS[sparkle_group_index].baseColor[0], SPARKLE_PRESETS[sparkle_group_index].baseColor[1], SPARKLE_PRESETS[sparkle_group_index].baseColor[2]),
          depthTest: false,
        });
        var star = new THREE.Mesh(geometry, material);
        scene.add(star);
        star.position.set(pos.x, pos.y, pos.z);
        sparkles.push(star);
        outlines[sparkle_group_index].selectedObjects.push(star);
      }
    }

    this.init();
    this.animate();
  }

  window.sceneManager = new SceneManager();
})();