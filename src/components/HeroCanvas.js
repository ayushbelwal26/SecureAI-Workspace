'use client';
import { useEffect, useRef } from 'react';

export default function HeroCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    let renderer, scene, camera, animId;
    let shieldMesh, wireMesh, particles, particlePositions;
    let nodePoints = [];
    let connectionLines = [];
    const clock = { start: Date.now() };

    const init = async () => {
      const THREE = await import('three');
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      const container = mountRef.current;
      if (!container) return;

      // ── Renderer ──
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);

      // ── Scene & Camera ──
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
      camera.position.set(0, 0, 5);

      // ── Lighting ──
      const ambientLight = new THREE.AmbientLight(0x0a1628, 1);
      scene.add(ambientLight);
      const pointLight1 = new THREE.PointLight(0x00b4ff, 4, 20);
      pointLight1.position.set(3, 3, 3);
      scene.add(pointLight1);
      const pointLight2 = new THREE.PointLight(0x6366f1, 3, 20);
      pointLight2.position.set(-3, -2, 2);
      scene.add(pointLight2);

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

      // ── Particles: data packets streaming inward ──
      const pCount = 1800;
      const pGeo = new THREE.BufferGeometry();
      particlePositions = new Float32Array(pCount * 3);
      const pVelocities = new Float32Array(pCount * 3);
      const pColors = new Float32Array(pCount * 3);

      for (let i = 0; i < pCount; i++) {
        const r = 3.5 + Math.random() * 4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        particlePositions[i * 3 + 2] = r * Math.cos(phi);
        // velocity toward center
        const speed = 0.004 + Math.random() * 0.006;
        pVelocities[i * 3] = -particlePositions[i * 3] / r * speed;
        pVelocities[i * 3 + 1] = -particlePositions[i * 3 + 1] / r * speed;
        pVelocities[i * 3 + 2] = -particlePositions[i * 3 + 2] / r * speed;
        // color: cyan/blue
        pColors[i * 3] = 0.1 + Math.random() * 0.3;
        pColors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
        pColors[i * 3 + 2] = 1.0;
      }

      pGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
      const pMat = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        sizeAttenuation: true,
      });
      particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);

      // ── Store refs for scroll animations ──
      const state = {
        shieldRotX: 0, shieldRotY: 0,
        camZ: 5, camY: 0,
        wireOpacity: 0.35,
        solidOpacity: 0.18,
        particleColorR: 0.1, particleColorG: 0.7,
        nodeGlow: 0x38bdf8,
        shieldScale: 1,
      };

      // ── GSAP Scroll Timeline ──
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero-scroll-container',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1.5,
        },
      });

      // Scene 1→2: Threat Detection — shield pulses, camera zooms
      tl.to(state, {
        shieldRotY: Math.PI * 1.5,
        shieldRotX: 0.4,
        camZ: 3.5,
        wireOpacity: 0.7,
        duration: 1,
        onUpdate: () => {
          wireMesh.material.opacity = state.wireOpacity;
          camera.position.z = state.camZ;
          camera.position.y = state.camY;
          shieldMesh.rotation.y = state.shieldRotY;
          shieldMesh.rotation.x = state.shieldRotX;
          wireMesh.rotation.y = state.shieldRotY;
          wireMesh.rotation.x = state.shieldRotX;
        },
      })
      // Scene 2→3: PII Scrubbing — particles turn green (clean data)
      .to(state, {
        shieldRotY: Math.PI * 3,
        camZ: 4,
        camY: 0.5,
        particleColorG: 1.0,
        particleColorR: 0.0,
        wireOpacity: 0.5,
        shieldScale: 1.1,
        duration: 1,
        onUpdate: () => {
          wireMesh.material.opacity = state.wireOpacity;
          camera.position.z = state.camZ;
          camera.position.y = state.camY;
          shieldMesh.rotation.y = state.shieldRotY;
          wireMesh.rotation.y = state.shieldRotY;
          shieldMesh.scale.setScalar(state.shieldScale);
          wireMesh.scale.setScalar(state.shieldScale);
          // recolor particles green
          const col = pGeo.attributes.color.array;
          for (let i = 0; i < pCount; i++) {
            col[i * 3] = state.particleColorR;
            col[i * 3 + 1] = state.particleColorG;
          }
          pGeo.attributes.color.needsUpdate = true;
        },
      })
      // Scene 3→4: Agent Control — shield fans out into orbital rings
      .to(state, {
        shieldRotY: Math.PI * 4.5,
        shieldRotX: -0.6,
        camZ: 5.5,
        camY: 0,
        shieldScale: 0.85,
        wireOpacity: 0.9,
        duration: 1,
        onUpdate: () => {
          wireMesh.material.opacity = state.wireOpacity;
          camera.position.z = state.camZ;
          camera.position.y = state.camY;
          shieldMesh.rotation.y = state.shieldRotY;
          shieldMesh.rotation.x = state.shieldRotX;
          wireMesh.rotation.y = state.shieldRotY;
          wireMesh.rotation.x = state.shieldRotX;
          shieldMesh.scale.setScalar(state.shieldScale);
          wireMesh.scale.setScalar(state.shieldScale);
        },
      })
      // Scene 4→5: CTA — shield reassembles, full glow
      .to(state, {
        shieldRotY: Math.PI * 6,
        shieldRotX: 0,
        camZ: 4.5,
        camY: 0,
        shieldScale: 1.2,
        wireOpacity: 0.6,
        solidOpacity: 0.35,
        duration: 1,
        onUpdate: () => {
          wireMesh.material.opacity = state.wireOpacity;
          matSolid.opacity = state.solidOpacity;
          camera.position.z = state.camZ;
          camera.position.y = state.camY;
          shieldMesh.rotation.y = state.shieldRotY;
          shieldMesh.rotation.x = state.shieldRotX;
          wireMesh.rotation.y = state.shieldRotY;
          wireMesh.rotation.x = state.shieldRotX;
          shieldMesh.scale.setScalar(state.shieldScale);
          wireMesh.scale.setScalar(state.shieldScale);
          // recolor particles back to cyan
          const col = pGeo.attributes.color.array;
          for (let i = 0; i < pCount; i++) {
            col[i * 3] = 0.1 + Math.random() * 0.15;
            col[i * 3 + 1] = 0.6 + Math.random() * 0.3;
          }
          pGeo.attributes.color.needsUpdate = true;
        },
      });

      // ── Idle rotation + particle loop (render loop) ──
      let frame = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        frame++;

        // Idle gentle rotation
        const idleSpeed = 0.0015;
        shieldMesh.rotation.y += idleSpeed;
        wireMesh.rotation.y += idleSpeed;

        // Move particles inward, reset when they reach center
        const pos = pGeo.attributes.position.array;
        for (let i = 0; i < pCount; i++) {
          pos[i * 3] += pVelocities[i * 3];
          pos[i * 3 + 1] += pVelocities[i * 3 + 1];
          pos[i * 3 + 2] += pVelocities[i * 3 + 2];
          const dx = pos[i * 3], dy = pos[i * 3 + 1], dz = pos[i * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 1.4) {
            // reset to outer sphere
            const r = 3.5 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pos[i * 3 + 2] = r * Math.cos(phi);
          }
        }
        pGeo.attributes.position.needsUpdate = true;

        // Pulse node glow
        const pulse = 0.4 + 0.4 * Math.sin(frame * 0.04);
        nodePoints.forEach((n, idx) => {
          if (n.material) n.material.opacity = 0.5 + pulse * 0.5;
          if (idx % 3 === 0) n.material.color.setHSL(0.57 + pulse * 0.05, 1, 0.6);
        });

        // Subtle camera sway
        camera.position.x = Math.sin(frame * 0.008) * 0.15;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
      };
      animate();

      // Resize
      const onResize = () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
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
