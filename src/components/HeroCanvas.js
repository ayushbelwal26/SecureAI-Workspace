'use client';
import { useEffect, useRef } from 'react';

export default function HeroCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    let renderer, scene, camera, animId;
    let shieldMesh, wireMesh;
    let nodePoints = [];
    let composer;

    // Orbital swarm state
    let swarmMesh, swarmGeometry, swarmMaterial;
    let swarmPositions = [];
    let swarmDummy;
    let swarmColor;
    let swarmTarget;
    let swarmClock;
    const SWARM_COUNT = 8000;

    const init = async () => {
      const THREE = await import('three');
      const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
      const { RenderPass }     = await import('three/examples/jsm/postprocessing/RenderPass.js');
      const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      const container = mountRef.current;
      if (!container) return;

      // ── Renderer ──
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      // ── Scene & Camera ──
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200);
      camera.position.set(0, 0, 5);

      // ── Bloom post-processing ──
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(container.clientWidth, container.clientHeight),
        1.2,   // strength
        0.5,   // radius
        0.0    // threshold
      );
      composer.addPass(bloom);

      // ── Lighting ──
      scene.add(new THREE.AmbientLight(0x0a1628, 1));
      const pl1 = new THREE.PointLight(0x00b4ff, 4, 20);
      pl1.position.set(3, 3, 3);
      scene.add(pl1);
      const pl2 = new THREE.PointLight(0x6366f1, 3, 20);
      pl2.position.set(-3, -2, 2);
      scene.add(pl2);

      // ── Shield: Icosahedron solid core ──
      const geoSolid = new THREE.IcosahedronGeometry(1.5, 2);
      const matSolid = new THREE.MeshPhongMaterial({
        color: 0x001a33,
        emissive: 0x003366,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
      });
      shieldMesh = new THREE.Mesh(geoSolid, matSolid);
      scene.add(shieldMesh);

      // ── Shield: Wireframe overlay ──
      const geoWire = new THREE.IcosahedronGeometry(1.52, 2);
      const matWire = new THREE.MeshBasicMaterial({
        color: 0x00b4ff,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      wireMesh = new THREE.Mesh(geoWire, matWire);
      scene.add(wireMesh);

      // ── Node spheres at icosahedron vertices ──
      const posAttr = geoSolid.attributes.position;
      const seen = new Set();
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      for (let i = 0; i < posAttr.count; i++) {
        const key = `${posAttr.getX(i).toFixed(2)},${posAttr.getY(i).toFixed(2)},${posAttr.getZ(i).toFixed(2)}`;
        if (!seen.has(key)) {
          seen.add(key);
          const nodeGeo = new THREE.SphereGeometry(0.025, 6, 6);
          const node = new THREE.Mesh(nodeGeo, nodeMat.clone());
          node.position.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
          node.scale.multiplyScalar(1.013);
          shieldMesh.add(node);
          nodePoints.push(node);
        }
      }

      // ── Orbital Particle Swarm (quantum cloud) ──
      swarmDummy  = new THREE.Object3D();
      swarmColor  = new THREE.Color();
      swarmTarget = new THREE.Vector3();

      // Small tetrahedra instanced – identical to reference code
      swarmGeometry = new THREE.TetrahedronGeometry(0.012);
      swarmMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

      swarmMesh = new THREE.InstancedMesh(swarmGeometry, swarmMaterial, SWARM_COUNT);
      swarmMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(swarmMesh);

      // Seed initial positions in a small sphere around origin
      for (let i = 0; i < SWARM_COUNT; i++) {
        const r   = 1.5 + Math.random() * 1.5;
        const th  = Math.random() * Math.PI * 2;
        const ph  = Math.acos(2 * Math.random() - 1);
        swarmPositions.push(new THREE.Vector3(
          r * Math.sin(ph) * Math.cos(th),
          r * Math.cos(ph),
          r * Math.sin(ph) * Math.sin(th)
        ));
        swarmMesh.setColorAt(i, swarmColor.set(0x00e5ff));
      }

      swarmClock = new THREE.Clock();

      // ── GSAP Scroll Timeline ──
      const state = {
        shieldRotX: 0, shieldRotY: 0,
        camZ: 5, camY: 0,
        wireOpacity: 0.35,
        solidOpacity: 0.18,
        shieldScale: 1,
        bloomStrength: 1.2,
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero-scroll-container',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
        },
      });

      tl.to(state, {
        shieldRotY: Math.PI * 1.5, shieldRotX: 0.4,
        camZ: 3.5, wireOpacity: 0.7, bloomStrength: 1.6,
        duration: 1,
        onUpdate: () => {
          wireMesh.material.opacity = state.wireOpacity;
          bloom.strength = state.bloomStrength;
          camera.position.z = state.camZ;
          camera.position.y = state.camY;
          shieldMesh.rotation.y = state.shieldRotY;
          shieldMesh.rotation.x = state.shieldRotX;
          wireMesh.rotation.y   = state.shieldRotY;
          wireMesh.rotation.x   = state.shieldRotX;
        },
      })
      .to(state, {
        shieldRotY: Math.PI * 3, camZ: 4, camY: 0.5,
        wireOpacity: 0.5, shieldScale: 1.1, bloomStrength: 1.8,
        duration: 1,
        onUpdate: () => {
          wireMesh.material.opacity = state.wireOpacity;
          bloom.strength = state.bloomStrength;
          camera.position.z = state.camZ;
          camera.position.y = state.camY;
          shieldMesh.rotation.y = state.shieldRotY;
          wireMesh.rotation.y   = state.shieldRotY;
          shieldMesh.scale.setScalar(state.shieldScale);
          wireMesh.scale.setScalar(state.shieldScale);
        },
      })
      .to(state, {
        shieldRotY: Math.PI * 4.5, shieldRotX: -0.6,
        camZ: 5.5, camY: 0, shieldScale: 0.85, wireOpacity: 0.9, bloomStrength: 2.0,
        duration: 1,
        onUpdate: () => {
          wireMesh.material.opacity = state.wireOpacity;
          bloom.strength = state.bloomStrength;
          camera.position.z = state.camZ;
          camera.position.y = state.camY;
          shieldMesh.rotation.y = state.shieldRotY;
          shieldMesh.rotation.x = state.shieldRotX;
          wireMesh.rotation.y   = state.shieldRotY;
          wireMesh.rotation.x   = state.shieldRotX;
          shieldMesh.scale.setScalar(state.shieldScale);
          wireMesh.scale.setScalar(state.shieldScale);
        },
      })
      .to(state, {
        shieldRotY: Math.PI * 6, shieldRotX: 0,
        camZ: 4.5, camY: 0, shieldScale: 1.2,
        wireOpacity: 0.6, solidOpacity: 0.35, bloomStrength: 1.4,
        duration: 1,
        onUpdate: () => {
          wireMesh.material.opacity = state.wireOpacity;
          matSolid.opacity = state.solidOpacity;
          bloom.strength = state.bloomStrength;
          camera.position.z = state.camZ;
          camera.position.y = state.camY;
          shieldMesh.rotation.y = state.shieldRotY;
          shieldMesh.rotation.x = state.shieldRotX;
          wireMesh.rotation.y   = state.shieldRotY;
          wireMesh.rotation.x   = state.shieldRotX;
          shieldMesh.scale.setScalar(state.shieldScale);
          wireMesh.scale.setScalar(state.shieldScale);
        },
      });

      // ── Render loop ──
      let frame = 0;
      const TAU = Math.PI * 2;

      // Orbital parameters (tuned for security-cloud aesthetic around the shield)
      const ORB = { n: 3, l: 1, m: 1, scale: 3.2, spin: 0.06, breathe: 0.20, jitter: 0.28 };

      const animate = () => {
        animId = requestAnimationFrame(animate);
        frame++;

        const time = swarmClock.getElapsedTime();

        // Idle shield rotation
        shieldMesh.rotation.y += 0.0015;
        wireMesh.rotation.y   += 0.0015;

        // ── Orbital particle update (ported from ParticlesSwarm) ──
        const n       = Math.max(1, Math.floor(ORB.n));
        const lMax    = Math.max(0, Math.min(n - 1, Math.floor(ORB.l)));
        const mAbs    = Math.min(lMax, Math.floor(ORB.m));
        const a0      = ORB.scale;
        const spin    = ORB.spin;
        const breathe = ORB.breathe;
        const cJitter = ORB.jitter;

        for (let i = 0; i < SWARM_COUNT; i++) {
          // Stable per-particle hashes
          const h1 = Math.sin(i * 12.9898 + 78.233)  * 43758.5453; const rand1 = h1 - Math.floor(h1);
          const h2 = Math.sin(i * 39.3468 + 11.135)  * 24634.6345; const rand2 = h2 - Math.floor(h2);
          const h3 = Math.sin(i * 93.9898 + 47.233)  * 95734.5453; const rand3 = h3 - Math.floor(h3);

          // Radial sampling (gamma-like CDF)
          const u = (i + 1) / SWARM_COUNT;
          const baseR = -Math.log(1.0 - u * 0.999);
          const radialPower = (n * n) - (n - 1 - lMax);
          let r = baseR * a0 * (n * n) * 0.5 / Math.max(1, radialPower * 0.3);

          // Radial nodes
          const nodeCount = n - lMax - 1;
          const nodeMod   = nodeCount > 0
            ? Math.abs(Math.sin((r / (a0 * n)) * Math.PI * (nodeCount + 1)))
            : 1.0;
          r *= 0.6 + 0.8 * nodeMod;

          // Angular: phi spins over time, theta from spherical harmonic
          const phi  = rand1 * TAU + time * spin;
          const theta = Math.acos(1.0 - 2.0 * rand2);
          const cosT  = Math.cos(theta);
          const sinT  = Math.sin(theta);

          // Lobe shaping |Y_l^m|^2
          let lobe;
          if (lMax === 0) {
            lobe = 1.0;
          } else if (lMax === 1) {
            lobe = mAbs === 0
              ? cosT * cosT
              : sinT * sinT * Math.cos(phi) * Math.cos(phi);
          } else if (lMax === 2) {
            if (mAbs === 0)      { const c2 = 3*cosT*cosT-1; lobe = c2*c2*0.25; }
            else if (mAbs === 1) { lobe = sinT*sinT*cosT*cosT*4; }
            else                 { lobe = sinT*sinT*sinT*sinT*Math.cos(2*phi)*Math.cos(2*phi); }
          } else {
            const bands = Math.cos(theta * lMax);
            lobe = bands * bands;
            if (mAbs > 0) { const az = Math.cos(mAbs * phi); lobe *= az * az; }
          }

          // Probability weight
          r *= 0.15 + 0.85 * Math.min(1.0, lobe);

          // Breathing
          r *= 1.0 + breathe * 0.12 * Math.sin(time * 0.5 + r * 0.03);

          // Jitter / cloud thickness
          r *= 1.0 + (rand3 - 0.5) * cJitter;

          // Spherical → cartesian
          const x = r * sinT * Math.cos(phi);
          const y = r * cosT;
          const z = r * sinT * Math.sin(phi);
          swarmTarget.set(x, y, z);

          // Smooth lerp toward target
          swarmPositions[i].lerp(swarmTarget, 0.025);
          swarmDummy.position.copy(swarmPositions[i]);
          swarmDummy.updateMatrix();
          swarmMesh.setMatrixAt(i, swarmDummy.matrix);

          // Color: platform palette – cyan, indigo, teal based on orbital + phase
          // Hue mapped: 0.50 = cyan, 0.65 = indigo, 0.45 = teal
          const orbHue     = (0.50 + lMax * 0.10 + mAbs * 0.04 + nodeMod * 0.05) % 1.0;
          const phaseShift = mAbs > 0 ? 0.5 + 0.5 * Math.cos(mAbs * phi) : 1.0;
          const lightness  = 0.30 + 0.40 * Math.min(1.0, lobe) * phaseShift;
          const saturation = 0.80 + 0.20 * nodeMod;
          swarmColor.setHSL(orbHue, saturation, lightness);
          swarmMesh.setColorAt(i, swarmColor);
        }

        swarmMesh.instanceMatrix.needsUpdate = true;
        swarmMesh.instanceColor.needsUpdate  = true;

        // Pulse node glow
        const pulse = 0.4 + 0.4 * Math.sin(frame * 0.04);
        nodePoints.forEach((nd, idx) => {
          if (nd.material) nd.material.opacity = 0.5 + pulse * 0.5;
          if (idx % 3 === 0) nd.material.color.setHSL(0.57 + pulse * 0.05, 1, 0.6);
        });

        // Subtle camera sway
        camera.position.x = Math.sin(frame * 0.008) * 0.15;
        camera.lookAt(0, 0, 0);

        composer.render();
      };
      animate();

      // ── Resize ──
      const onResize = () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
        composer.setSize(container.clientWidth, container.clientHeight);
      };
      window.addEventListener('resize', onResize);
    };

    init();

    return () => {
      cancelAnimationFrame(animId);
      if (renderer) {
        renderer.dispose();
        if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        ScrollTrigger.getAll().forEach(t => t.kill());
      });
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
