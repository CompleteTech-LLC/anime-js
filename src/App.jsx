import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, createDraggable, stagger } from 'animejs';
import { ArrowDown, Box, ChevronDown, ChevronUp, Code2, Cuboid, ExternalLink, Gauge, Move, Play, Sparkles } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const chapters = [
  { id: 'intro', label: 'Intro', theme: 'dark', start: 0, end: 0.16 },
  { id: 'toolbox', label: 'Toolbox', theme: 'light', start: 0.16, end: 0.27 },
  { id: 'intuitive', label: 'Intuitive', theme: 'dark', start: 0.27, end: 0.35 },
  { id: 'composition', label: 'Composition', theme: 'dark', start: 0.35, end: 0.43 },
  { id: 'scroll', label: 'Scroll', theme: 'dark', start: 0.43, end: 0.51 },
  { id: 'staggering', label: 'Stagger', theme: 'dark', start: 0.51, end: 0.59 },
  { id: 'svg', label: 'SVG', theme: 'dark', start: 0.59, end: 0.67 },
  { id: 'draggable', label: 'Drag', theme: 'dark', start: 0.67, end: 0.75 },
  { id: 'modules', label: 'Modules', theme: 'light', start: 0.75, end: 0.88 },
  { id: 'finish', label: 'Start', theme: 'dark', start: 0.88, end: 1 },
];

const features = [
  {
    id: 'intuitive',
    title: 'Intuitive API',
    kicker: 'animate()',
    copy: 'Small calls, readable values, and motion defaults that keep the interface alive while you scroll.',
    code: "animate('.block', {\n  x: 260,\n  rotate: '1turn',\n  delay: stagger(90)\n});",
    icon: Sparkles,
  },
  {
    id: 'composition',
    title: 'Composition',
    kicker: 'timeline',
    copy: 'Independent steps lock into a longer sequence, just like the homepage ties each viewport to the main timeline.',
    code: "createTimeline()\n  .add('.ring', { scale: 1 })\n  .add('.card', { y: 0 }, '-=400');",
    icon: Code2,
  },
  {
    id: 'scroll',
    title: 'Scroll observer',
    kicker: 'sync',
    copy: 'Scroll progress becomes animation progress. The stage, code card, and navigation cursor all stay in sync.',
    code: "onScroll({\n  target: '.feature',\n  sync: .9\n}).link(timeline);",
    icon: Gauge,
  },
  {
    id: 'staggering',
    title: 'Staggering',
    kicker: 'stagger()',
    copy: 'Groups can ripple, fan out, and return without hand-tuning every item.',
    code: "animate('.tile', {\n  y: stagger([-28, 28], { grid: [5, 4] }),\n  delay: stagger(45)\n});",
    icon: Cuboid,
  },
  {
    id: 'svg',
    title: 'SVG utilities',
    kicker: 'draw',
    copy: 'Path motion and stroke drawing make the vector parts of the page feel attached to the same engine.',
    code: "animate(svg.createDrawable('path'), {\n  draw: ['0 0', '0 1'],\n  duration: 1200\n});",
    icon: Box,
  },
  {
    id: 'draggable',
    title: 'Draggable',
    kicker: 'input',
    copy: 'The progress cursor is draggable, and this local control mirrors the interaction style used by the real page.',
    code: "createDraggable('.handle', {\n  container: '.track',\n  releaseEase: 'out(4)'\n});",
    icon: Move,
  },
];

const modelFiles = [
  'module-engine-01.glb',
  'module-renderer-01.glb',
  'module-animate-01.glb',
  'module-timeline-01.glb',
  'module-scroll-01.glb',
  'module-draggable-01.glb',
  'module-svg-01.glb',
  'module-stagger-01.glb',
  'module-spring-01.glb',
  'module-waapi-01.glb',
  'module-timer-01.glb',
  'module-scope-01.glb',
];

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function getChapter(progress) {
  return chapters.find((chapter) => progress >= chapter.start && progress < chapter.end) || chapters[chapters.length - 1];
}

function scrollToProgress(value) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: max * clamp(value), behavior: 'smooth' });
}

function useScrollProgress() {
  const [state, setState] = useState({ progress: 0, chapter: chapters[0], featureId: features[0].id });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max <= 0 ? 0 : clamp(window.scrollY / max);
      const chapter = getChapter(progress);
      const feature = features.find((item) => item.id === chapter.id) || features[0];
      setState({ progress, chapter, featureId: feature.id });
      document.documentElement.dataset.theme = chapter.theme;
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return state;
}

function ThreeStage({ progress, activeFeature }) {
  const mountRef = useRef(null);
  const targetProgress = useRef(progress);
  const featureRef = useRef(activeFeature);

  useEffect(() => {
    targetProgress.current = progress;
  }, [progress]);

  useEffect(() => {
    featureRef.current = activeFeature;
  }, [activeFeature]);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x08090c, 18, 44);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 1.2, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.9);
    const key = new THREE.DirectionalLight(0xffffff, 3);
    key.position.set(5, 7, 8);
    const rim = new THREE.PointLight(0xff4b3e, 18, 16);
    rim.position.set(-5, -2, 4);
    scene.add(ambient, key, rim);

    const root = new THREE.Group();
    const modules = new THREE.Group();
    const rings = new THREE.Group();
    const grid = new THREE.Group();
    scene.add(root, rings, grid);
    root.add(modules);

    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.6 });
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.025, 12, 180), ringMaterial);
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(4.35, 0.018, 12, 180), ringMaterial.clone());
    const sweep = new THREE.Mesh(
      new THREE.TorusGeometry(3.76, 0.035, 12, 80, Math.PI * 1.38),
      new THREE.MeshBasicMaterial({ color: 0xff5b4f, transparent: true, opacity: 0.85 }),
    );
    rings.add(innerRing, outerRing, sweep);

    const gridMaterial = new THREE.LineBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.13 });
    for (let i = -5; i <= 5; i += 1) {
      const horizontal = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-7, i, -2), new THREE.Vector3(7, i, -2)]);
      const vertical = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i * 1.4, -5, -2), new THREE.Vector3(i * 1.4, 5, -2)]);
      grid.add(new THREE.Line(horizontal, gridMaterial), new THREE.Line(vertical, gridMaterial));
    }

    const loader = new GLTFLoader();
    const pieces = modelFiles.map((file, index) => {
      const holder = new THREE.Group();
      holder.userData.index = index;
      holder.userData.file = file;
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL((index * 0.065 + 0.01) % 1, 0.62, 0.55),
        roughness: 0.48,
        metalness: 0.4,
      });
      const fallback = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 0.52), mat);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.56, 24), mat);
      cap.rotation.z = Math.PI / 2;
      cap.position.x = 0.52;
      holder.add(fallback, cap);
      modules.add(holder);

      loader.load(
        `/models/${file}`,
        (gltf) => {
          holder.clear();
          const asset = gltf.scene;
          const box = new THREE.Box3().setFromObject(asset);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxAxis = Math.max(size.x, size.y, size.z) || 1;
          asset.position.sub(center);
          asset.scale.setScalar(1.05 / maxAxis);
          asset.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              child.material = child.material.clone();
              child.material.roughness = 0.52;
              child.material.metalness = 0.35;
              child.material.color.offsetHSL(0, 0.05, index % 2 ? 0.06 : -0.02);
            }
          });
          holder.add(asset);
        },
        undefined,
        () => {},
      );

      return holder;
    });

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    let current = targetProgress.current;
    let raf = 0;
    const temp = new THREE.Vector3();
    const target = new THREE.Vector3();
    const tick = (time) => {
      current = mix(current, targetProgress.current, 0.085);
      const intro = 1 - smoothstep(0.08, 0.23, current);
      const toolbox = smoothstep(0.1, 0.24, current) * (1 - smoothstep(0.28, 0.38, current));
      const feature = smoothstep(0.28, 0.38, current) * (1 - smoothstep(0.7, 0.78, current));
      const modulePhase = smoothstep(0.72, 0.82, current) * (1 - smoothstep(0.89, 0.96, current));
      const finish = smoothstep(0.88, 1, current);

      const lightTheme = current > 0.14 && current < 0.28 || current > 0.74 && current < 0.89;
      scene.fog.color.set(lightTheme ? 0xf4f1e8 : 0x08090c);
      camera.position.x = mix(0, -2.5, feature) + mix(0, 1.5, finish);
      camera.position.y = mix(1.25, 0.5, toolbox) + Math.sin(time * 0.0004) * 0.14;
      camera.position.z = mix(14, 10.2, toolbox + modulePhase * 0.45);
      camera.lookAt(0, 0, 0);

      rings.rotation.z = time * 0.00022 + current * Math.PI * 4;
      rings.rotation.x = mix(0.08, -0.4, toolbox) + feature * 0.18;
      rings.scale.setScalar(mix(1.2, 0.72, toolbox) + modulePhase * 0.18 + finish * 0.9);
      rings.position.x = mix(0, -2.8, feature) + modulePhase * 1.6;
      rings.position.y = mix(0.2, -0.2, toolbox);
      rings.children.forEach((ring, index) => {
        ring.material.opacity = mix(0.72 - index * 0.1, 0.2, toolbox) * (1 - finish * 0.5);
      });

      grid.visible = true;
      grid.position.x = mix(0, -2.2, feature);
      grid.rotation.z = current * 0.45;
      grid.children.forEach((line) => {
        line.material.opacity = mix(0.05, 0.18, feature + modulePhase) * (1 - finish * 0.6);
      });

      const featureIndex = Math.max(0, features.findIndex((item) => item.id === featureRef.current));
      pieces.forEach((piece, index) => {
        const theta = (index / pieces.length) * Math.PI * 2 + current * Math.PI * 2.2;
        const orbit = temp.set(Math.cos(theta) * 3.2, Math.sin(theta) * 1.7, Math.sin(theta * 1.4) * 1.4);
        const row = Math.floor(index / 4);
        const col = index % 4;
        const assembled = new THREE.Vector3((index - 5.5) * 0.82, Math.sin(index * 0.7) * 0.1, 0);
        const featureArc = new THREE.Vector3(
          -2.8 + Math.cos(theta + featureIndex * 0.4) * (1.3 + (index % 3) * 0.15),
          Math.sin(theta * 1.2) * 2.6,
          Math.cos(theta * 0.8) * 1.1,
        );
        const moduleGrid = new THREE.Vector3((col - 1.5) * 1.8, (1.5 - row) * 1.05, Math.sin(index) * 0.5);
        const finishLift = new THREE.Vector3(Math.cos(theta) * 5.3, 2.7 + Math.sin(theta) * 1.7, -2.8);

        target.copy(orbit)
          .lerp(assembled, toolbox)
          .lerp(featureArc, feature)
          .lerp(moduleGrid, modulePhase)
          .lerp(finishLift, finish);

        piece.position.lerp(target, 0.1);
        piece.rotation.x += 0.005 + index * 0.0002;
        piece.rotation.y = mix(piece.rotation.y, theta + toolbox * 1.4 + modulePhase * 0.6, 0.06);
        piece.rotation.z = mix(piece.rotation.z, Math.sin(theta) * 0.28 + feature * 0.65, 0.06);
        piece.scale.setScalar(mix(0.72, 1.25, toolbox) + feature * 0.08 + modulePhase * 0.18 - finish * 0.12);
      });

      root.rotation.y = current * 0.9 + Math.sin(time * 0.0003) * 0.07;
      root.rotation.x = mix(0.2, -0.08, toolbox);
      root.position.y = mix(0, -0.3, modulePhase) + finish * 0.5;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, []);

  return <div className="three-stage" ref={mountRef} aria-hidden="true" />;
}

function IntroSection() {
  const words = ['the web', 'WebGL', 'CSS', 'Canvas 2D', 'SVG', 'anything'];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setWordIndex((value) => (value + 1) % words.length), 1150);
    return () => window.clearInterval(interval);
  }, [words.length]);

  return (
    <section className="section intro-section" id="intro">
      <div className="section-inner intro-copy">
        <p className="eyebrow">JavaScript animation engine</p>
        <h1>
          Anime.js animates
          <span>{words[wordIndex]}</span>
        </h1>
        <div className="intro-actions">
          <button type="button" onClick={() => scrollToProgress(0.18)}>
            <Play size={18} />
            Watch scroll
          </button>
          <code>npm install animejs</code>
        </div>
      </div>
      <button className="scroll-cue" type="button" onClick={() => scrollToProgress(0.17)} aria-label="Scroll to toolbox">
        <ArrowDown size={22} />
      </button>
    </section>
  );
}

function ToolboxSection() {
  return (
    <section className="section light-section toolbox-section" id="toolbox">
      <div className="section-inner toolbox-grid">
        <div>
          <p className="eyebrow">One toolbox</p>
          <h2>Every module clicks into the same animation engine.</h2>
        </div>
        <div className="toolbox-labels" aria-label="Anime.js module list">
          {['Timer', 'Animate', 'Timeline', 'Scroll', 'SVG', 'Draggable', 'Stagger', 'Spring'].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureDemo({ feature, active }) {
  const Icon = feature.icon;
  const dragRef = useRef(null);

  useEffect(() => {
    const floating = animate('.demo-dot', {
      translateY: [-10, 10],
      scale: [0.86, 1.12],
      delay: stagger(70),
      duration: 1300,
      loop: true,
      alternate: true,
    });
    const tiles = animate('.stagger-tile', {
      translateY: stagger([-16, 16], { grid: [5, 4] }),
      delay: stagger(55),
      duration: 1500,
      loop: true,
      alternate: true,
    });
    let draggable;
    if (dragRef.current) {
      draggable = createDraggable(dragRef.current, {
        container: '.draggable-demo',
        releaseEase: 'out(4)',
        containerPadding: 10,
      });
    }
    return () => {
      floating.revert();
      tiles.revert();
      draggable?.revert();
    };
  }, []);

  return (
    <section className={`section feature-section ${active ? 'is-active' : ''}`} id={feature.id}>
      <div className="section-inner feature-grid">
        <article className="feature-copy">
          <span className="feature-icon"><Icon size={20} /></span>
          <p className="eyebrow">{feature.kicker}</p>
          <h2>{feature.title}</h2>
          <p>{feature.copy}</p>
        </article>
        <div className="demo-panel" aria-hidden={!active}>
          <div className="code-card">
            <div className="code-toolbar">
              <span />
              <span />
              <span />
            </div>
            <pre>{feature.code}</pre>
          </div>
          <div className={`visual-demo demo-${feature.id}`}>
            {feature.id === 'intuitive' && (
              <div className="dot-field">
                {Array.from({ length: 18 }).map((_, index) => <span className="demo-dot" key={index} />)}
              </div>
            )}
            {feature.id === 'composition' && (
              <div className="timeline-demo">
                {['ring', 'card', 'label', 'engine'].map((label, index) => (
                  <span key={label} style={{ '--i': index }}>{label}</span>
                ))}
              </div>
            )}
            {feature.id === 'scroll' && (
              <div className="scroll-demo">
                <span className="scroll-demo-track" />
                <span className="scroll-demo-cursor" />
                <span className="scroll-demo-card">sync .9</span>
              </div>
            )}
            {feature.id === 'staggering' && (
              <div className="stagger-demo">
                {Array.from({ length: 20 }).map((_, index) => <span className="stagger-tile" key={index} />)}
              </div>
            )}
            {feature.id === 'svg' && (
              <svg className="svg-demo" viewBox="0 0 320 190" role="img" aria-label="Animated vector paths">
                <path d="M22 142 C70 28 124 28 164 96 S258 164 298 42" />
                <circle cx="164" cy="96" r="14" />
                <circle cx="298" cy="42" r="8" />
              </svg>
            )}
            {feature.id === 'draggable' && (
              <div className="draggable-demo">
                <span className="drag-grid" />
                <button className="drag-handle" ref={dragRef} type="button" aria-label="Drag demo handle">
                  <Move size={21} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ModulesSection() {
  return (
    <section className="section light-section modules-section" id="modules">
      <div className="section-inner modules-copy">
        <p className="eyebrow">Modular by default</p>
        <h2>Import only the motion pieces you need.</h2>
        <div className="module-stats">
          <span><strong>12</strong> model pieces</span>
          <span><strong>4.4.1</strong> Anime.js</span>
          <span><strong>scroll</strong> synced</span>
        </div>
      </div>
    </section>
  );
}

function FinishSection() {
  return (
    <section className="section finish-section" id="finish">
      <div className="section-inner finish-copy">
        <p className="eyebrow">End state</p>
        <h2>The clone is one continuous scroll timeline.</h2>
        <button type="button" onClick={() => scrollToProgress(0)}>
          <ChevronUp size={18} />
          Back to top
        </button>
        <a href="https://github.com/juliangarnier/anime" target="_blank" rel="noreferrer">
          <ExternalLink size={18} />
          Source reference
        </a>
      </div>
    </section>
  );
}

function ProgressRail({ progress, chapter }) {
  const railRef = useRef(null);
  const thumbRef = useRef(null);

  useEffect(() => {
    const rail = railRef.current;
    const thumb = thumbRef.current;
    if (!rail || !thumb) return undefined;
    let dragging = false;

    const updateFromPointer = (event) => {
      const rect = rail.getBoundingClientRect();
      const next = clamp((event.clientY - rect.top) / rect.height);
      scrollToProgress(next);
    };
    const down = (event) => {
      dragging = true;
      thumb.setPointerCapture?.(event.pointerId);
      updateFromPointer(event);
    };
    const move = (event) => {
      if (dragging) updateFromPointer(event);
    };
    const up = () => {
      dragging = false;
    };
    thumb.addEventListener('pointerdown', down);
    thumb.addEventListener('pointermove', move);
    thumb.addEventListener('pointerup', up);
    thumb.addEventListener('pointercancel', up);
    return () => {
      thumb.removeEventListener('pointerdown', down);
      thumb.removeEventListener('pointermove', move);
      thumb.removeEventListener('pointerup', up);
      thumb.removeEventListener('pointercancel', up);
    };
  }, []);

  return (
    <nav className="progress-rail" aria-label="Scroll chapters">
      <button type="button" onClick={() => scrollToProgress(Math.max(0, progress - 0.1))} aria-label="Scroll up">
        <ChevronUp size={16} />
      </button>
      <div className="rail-track" ref={railRef}>
        <span className="rail-fill" style={{ height: `${progress * 100}%` }} />
        <button
          className="rail-thumb"
          ref={thumbRef}
          type="button"
          style={{ top: `${progress * 100}%` }}
          aria-label="Drag scroll progress"
        />
        {chapters.map((item) => (
          <button
            className={`rail-tick ${item.id === chapter.id ? 'is-current' : ''}`}
            key={item.id}
            type="button"
            style={{ top: `${item.start * 100}%` }}
            onClick={() => scrollToProgress(item.start + 0.004)}
            aria-label={`Jump to ${item.label}`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <button type="button" onClick={() => scrollToProgress(Math.min(1, progress + 0.1))} aria-label="Scroll down">
        <ChevronDown size={16} />
      </button>
    </nav>
  );
}

function App() {
  const { progress, chapter, featureId } = useScrollProgress();
  const activeFeature = useMemo(() => featureId, [featureId]);

  return (
    <main className="app-shell">
      <ThreeStage progress={progress} activeFeature={activeFeature} />
      <div className="site-brand" aria-label="Anime.js clone">
        <span />
        <strong>anime.js</strong>
      </div>
      <IntroSection />
      <ToolboxSection />
      {features.map((feature) => (
        <FeatureDemo key={feature.id} feature={feature} active={feature.id === activeFeature} />
      ))}
      <ModulesSection />
      <FinishSection />
      <ProgressRail progress={progress} chapter={chapter} />
    </main>
  );
}

export default App;
