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

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
  camera.position.set(0, 0.1, 6.4);

  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uPtr: { value: new THREE.Vector2(0.72, 0.5) },
    uScroll: { value: 0 },
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
      vertexShader: `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: `
        precision highp float;
        uniform vec2 uRes, uPtr;
        uniform float uTime, uScroll;
        uniform vec3 uPaper, uInk, uAccent;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p); vec2 f = fract(p); f = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
        }
        float fbm(vec2 p){
          float s = 0.0; float a = 0.5;
          for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.09 + 17.2; a *= 0.5; }
          return s;
        }
        void main(){
          vec2 uv = gl_FragCoord.xy / uRes;
          vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
          vec2 ptr = (uPtr * uRes - 0.5 * uRes) / min(uRes.x, uRes.y);
          float t = uTime * 0.22 + uScroll * 1.4;
          vec2 q = p + 0.18 * vec2(fbm(p * 1.4 + t * 0.15), fbm(p * 1.4 - t * 0.12));
          float n = fbm(q * 2.2 + vec2(t * 0.08, -t * 0.05));
          float n2 = fbm(q * 4.6 - n);
          float d = length(p - ptr);
          float light = exp(-d * d * 4.4);
          float cau =
            pow(0.5 + 0.5 * sin(q.x * 16.0 + t + n * 4.0) * sin(q.y * 13.0 - t * 0.85), 4.0);
          float margin = smoothstep(0.34, 0.72, uv.x) * (1.0 - smoothstep(0.82, 1.0, uv.x));
          float top = 1.0 - smoothstep(0.55, 1.05, uv.y);
          vec3 col = uPaper;
          col = mix(col, mix(uPaper, uInk, 0.16), n2 * 0.55);
          col = mix(col, uAccent, cau * margin * top * (0.18 + light * 0.55));
          col = mix(col, uAccent, light * 0.07);
          float laid = sin((uv.y + n * 0.02 + uScroll * 0.04) * 240.0) * 0.018;
          col += laid * (uInk - uPaper);
          gl_FragColor = vec4(col, 0.92);
        }`,
    })
  );
  bg.frustumCulled = false;
  bg.renderOrder = -1;
  scene.add(bg);

  const group = new THREE.Group();
  scene.add(group);

  const rest = [
    new THREE.Vector3(-0.15, 0.55, 0.2),
    new THREE.Vector3(0.35, 0.28, -0.15),
    new THREE.Vector3(0.55, -0.05, 0.25),
    new THREE.Vector3(0.15, -0.42, -0.1),
    new THREE.Vector3(-0.4, -0.22, 0.18),
    new THREE.Vector3(-0.55, 0.22, -0.2),
  ];
  const live = rest.map((v) => v.clone());
  const SEGS = 72;
  const HALF_W = 0.028;
  const pos = new Float32Array(SEGS * 2 * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const idx = [];
  for (let i = 0; i < SEGS - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geo.setIndex(idx);
  const ribbon = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.42,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  group.add(ribbon);

  const joints = rest.map((p, i) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(i === 0 ? 0.038 : 0.026, 12, 10),
      new THREE.MeshBasicMaterial({
        color: i === 0 ? accent : ink,
        transparent: true,
        opacity: i === 0 ? 0.7 : 0.28,
        depthWrite: false,
      })
    );
    m.position.copy(p);
    group.add(m);
    return m;
  });

  const tmp = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const side = new THREE.Vector3();
  const up = new THREE.Vector3(0, 0, 1);

  function sampleCurve(t, out) {
    const n = live.length;
    const x = t * (n - 1);
    const i = Math.min(n - 2, Math.floor(x));
    const f = x - i;
    const p0 = live[Math.max(0, i - 1)];
    const p1 = live[i];
    const p2 = live[i + 1];
    const p3 = live[Math.min(n - 1, i + 2)];
    const f2 = f * f;
    const f3 = f2 * f;
    out.set(
      0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * f +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * f2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * f3),
      0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * f +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * f2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * f3),
      0.5 *
        (2 * p1.z +
          (-p0.z + p2.z) * f +
          (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * f2 +
          (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * f3)
    );
    return out;
  }

  function writeRibbon() {
    const arr = geo.attributes.position.array;
    for (let i = 0; i < SEGS; i++) {
      const t = i / (SEGS - 1);
      sampleCurve(t, tmp);
      const t2 = Math.min(1, t + 1 / SEGS);
      sampleCurve(t2, tan);
      tan.sub(tmp).normalize();
      side.crossVectors(tan, up);
      if (side.lengthSq() < 1e-6) side.set(0, 1, 0);
      else side.normalize().multiplyScalar(HALF_W);
      const o = i * 6;
      arr[o] = tmp.x - side.x;
      arr[o + 1] = tmp.y - side.y;
      arr[o + 2] = tmp.z - side.z;
      arr[o + 3] = tmp.x + side.x;
      arr[o + 4] = tmp.y + side.y;
      arr[o + 5] = tmp.z + side.z;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
  }

  const ptr = { x: 0.72, y: 0.5 };
  const ptrT = { x: 0.72, y: 0.5 };
  window.addEventListener(
    "pointermove",
    (e) => {
      ptrT.x = e.clientX / window.innerWidth;
      ptrT.y = 1 - e.clientY / window.innerHeight;
    },
    { passive: true }
  );

  function scrollAmt() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    return window.scrollY / max;
  }

  function size() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uRes.value.set(w, h);
    const mobile = w < 760;
    group.visible = !mobile;
    group.position.set(2.45, 0.1, -0.15);
    group.scale.setScalar(1.12);
  }
  size();
  window.addEventListener("resize", size, { passive: true });

  let t0 = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const t = (now - t0) / 1000;
    ptr.x += (ptrT.x - ptr.x) * 0.05;
    ptr.y += (ptrT.y - ptr.y) * 0.05;
    const sc = scrollAmt();
    uniforms.uTime.value = t;
    uniforms.uPtr.value.set(ptr.x, ptr.y);
    uniforms.uScroll.value = sc;
    camera.position.x = (ptr.x - 0.5) * 0.35;
    camera.position.y = 0.1 - sc * 0.55 + (ptr.y - 0.5) * 0.2;
    camera.lookAt(0, 0.05 - sc * 0.2, 0);

    if (group.visible) {
      const tugX = (ptr.x - 0.72) * 0.55;
      const tugY = (ptr.y - 0.5) * 0.4;
      for (let i = 0; i < live.length; i++) {
        const w = 0.35 + 0.65 * (i / (live.length - 1));
        live[i].x = rest[i].x + Math.sin(t * 0.35 + i * 0.9) * 0.07 + tugX * w;
        live[i].y = rest[i].y + Math.cos(t * 0.28 + i * 1.1) * 0.05 + tugY * w;
        live[i].z = rest[i].z + Math.sin(t * 0.22 + i) * 0.06;
        joints[i].position.copy(live[i]);
      }
      writeRibbon();
      group.rotation.y = (ptr.x - 0.5) * 0.35 + t * 0.03;
      group.rotation.x = (0.5 - ptr.y) * 0.18;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
