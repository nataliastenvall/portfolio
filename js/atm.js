import * as THREE from "three";

const canvas = document.getElementById("atm");
if (
  !canvas ||
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  !window.WebGLRenderingContext
) {
  canvas?.remove();
} else {
  boot();
}

function boot() {
  const paper = new THREE.Color("#DEE2DE");
  const ink = new THREE.Color("#1B1A1E");
  const accent = new THREE.Color("#7A3A48");
  const soft = new THREE.Color("#5F5C66");

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0, 0.15, 6.2);

  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uPtr: { value: new THREE.Vector2(0.72, 0.48) },
    uPaper: { value: paper },
    uInk: { value: ink },
    uAccent: { value: accent },
  };

  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      depthWrite: false,
      depthTest: false,
      transparent: true,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `
        precision highp float;
        uniform vec2 uRes, uPtr;
        uniform float uTime;
        uniform vec3 uPaper, uInk, uAccent;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
        }
        float fbm(vec2 p){
          float s = 0.0; float a = 0.5;
          for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.07 + 13.1; a *= 0.52; }
          return s;
        }
        void main(){
          vec2 uv = gl_FragCoord.xy / uRes;
          vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
          vec2 ptr = (uPtr * uRes - 0.5 * uRes) / min(uRes.x, uRes.y);
          float t = uTime * 0.028;
          float w = fbm(p * 1.65 + vec2(t, -t * 0.62));
          float w2 = fbm(p * 3.1 - vec2(t * 0.4, t) + w * 1.2);
          float d = length(p - ptr);
          float glow = exp(-d * d * 2.8);
          vec3 col = uPaper;
          col = mix(col, mix(uPaper, uInk, 0.14), w2 * 0.7);
          col = mix(col, uAccent, glow * 0.16 * (0.4 + w));
          float laid = sin((uv.y + w * 0.018) * 210.0) * 0.02;
          col += laid * (uInk - uPaper);
          float vign = smoothstep(1.15, 0.25, length(p));
          col = mix(col, uPaper, 1.0 - vign * 0.28);
          gl_FragColor = vec4(col, 0.88);
        }`,
    })
  );
  bg.frustumCulled = false;
  bg.renderOrder = -1;
  scene.add(bg);

  const group = new THREE.Group();
  scene.add(group);

  const nodes = [
    [0.0, 0.42, 0.0],
    [0.58, 0.12, 0.28],
    [0.46, -0.36, -0.12],
    [-0.08, -0.44, 0.26],
    [-0.54, -0.08, -0.16],
    [-0.38, 0.34, 0.22],
  ];
  const pts = nodes.map((n) => new THREE.Vector3(...n));
  const ballGeo = new THREE.IcosahedronGeometry(0.038, 1);
  const nodeMats = [];
  pts.forEach((p, i) => {
    const mat = new THREE.MeshBasicMaterial({
      color: i === 0 ? accent : i % 2 ? soft : ink,
      transparent: true,
      opacity: i === 0 ? 0.5 : 0.22,
      depthWrite: false,
    });
    mat.userData.base = mat.opacity;
    nodeMats.push(mat);
    const m = new THREE.Mesh(ballGeo, mat);
    m.position.copy(p);
    group.add(m);
  });

  const edges = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 1],
  ];
  const linePos = [];
  for (const [a, b] of edges) {
    linePos.push(pts[a].x, pts[a].y, pts[a].z, pts[b].x, pts[b].y, pts[b].z);
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  lineMat.userData.base = 0.16;
  group.add(new THREE.LineSegments(lineGeo, lineMat));

  const sheets = [];
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.05),
      new THREE.MeshBasicMaterial({
        color: i % 2 ? paper : ink,
        transparent: true,
        opacity: i % 2 ? 0.13 : 0.055,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    s.position.set((i - 1.5) * 0.4, (i % 2 ? 0.12 : -0.1) + i * 0.03, -1.1 - i * 0.28);
    s.rotation.set(0.4 + i * 0.12, 0.5 + i * 0.2, -0.15 + i * 0.08);
    group.add(s);
    sheets.push({ mesh: s, ox: s.rotation.x, oy: s.rotation.y });
  }

  const ptr = { x: 0.72, y: 0.48 };
  const ptrT = { x: 0.72, y: 0.48 };
  window.addEventListener(
    "pointermove",
    (e) => {
      ptrT.x = e.clientX / window.innerWidth;
      ptrT.y = 1 - e.clientY / window.innerHeight;
    },
    { passive: true }
  );

  function size() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uRes.value.set(w, h);
    const mobile = w < 760;
    group.visible = !mobile;
    group.position.set(2.35, 0.2, -0.35);
    group.scale.setScalar(1.05);
  }
  size();
  window.addEventListener("resize", size, { passive: true });

  let t0 = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const t = (now - t0) / 1000;
    ptr.x += (ptrT.x - ptr.x) * 0.045;
    ptr.y += (ptrT.y - ptr.y) * 0.045;
    uniforms.uTime.value = t;
    uniforms.uPtr.value.set(ptr.x, ptr.y);
    group.rotation.y = (ptr.x - 0.5) * 0.55 + t * 0.04;
    group.rotation.x = (0.5 - ptr.y) * 0.28;
    for (let i = 0; i < sheets.length; i++) {
      const s = sheets[i];
      s.mesh.rotation.x = s.ox + Math.sin(t * 0.22 + i) * 0.08;
      s.mesh.rotation.y = s.oy + Math.cos(t * 0.17 + i * 0.7) * 0.06;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
