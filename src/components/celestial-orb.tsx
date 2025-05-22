
"use client";

import type { FC } from 'react';
import { useEffect, useRef }
from 'react';
import * as THREE from 'three';

// Define props for the CelestialOrb component
interface CelestialOrbProps {
  particleColor?: number;
  particleSize?: number;
  animationSpeed?: number;
  animationAmplitude?: number;
  cameraDistanceFactor?: number;
  orbRadius?: number;
  particleCount?: number;
}

const SHOT_INTERVAL = 30; // seconds
const STAR_SPEED = 7; // units per second
const STAR_LIFETIME = 15; // seconds
const FAR_DISTANCE_FOR_STAR_SPAWN = 25; // units
const SHOOTING_STAR_SIZE = 0.08;
const SHOOTING_STAR_COLOR = 0xffffaa;


interface ShootingStarData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  active: boolean;
  startTime: number;
}

const CelestialOrb: FC<CelestialOrbProps> = ({
  particleColor = 0xFF8C00, 
  particleSize = 0.02, // Increased particle size
  animationSpeed = 0.2,
  animationAmplitude = 0.08,
  cameraDistanceFactor = 1.8, // Brought camera closer
  orbRadius = 2.0, 
  particleCount = 15000, 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particleMeshRef = useRef<THREE.Points | null>(null);
  const originalPositionsRef = useRef<Float32Array | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const animationFrameIdRef = useRef<number | null>(null);

  // Shooting star refs
  const shootingStarMeshRef = useRef<THREE.Points | null>(null);
  const shootingStarDataRef = useRef<ShootingStarData | null>(null);
  const lastShotTimeRef = useRef<number>(0);


  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setClearColor(0x000000, 0);
    currentMount.appendChild(rendererRef.current.domElement);

    // Main orb particles
    const sphereGeometry = new THREE.SphereGeometry(orbRadius, 128, 64); 
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const r = orbRadius * Math.cbrt(Math.random()); 
      const theta = Math.random() * 2 * Math.PI; 
      const phi = Math.acos(2 * Math.random() - 1); 

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;
    }
    originalPositionsRef.current = basePositions;

    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: particleColor,
      size: particleSize,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85, // Increased particle opacity
      blending: THREE.AdditiveBlending, 
    });

    particleMeshRef.current = new THREE.Points(bufferGeometry, particleMaterial);
    sceneRef.current.add(particleMeshRef.current);

    // Shooting star particle
    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0]), 3)); 
    const starMat = new THREE.PointsMaterial({
        color: SHOOTING_STAR_COLOR,
        size: SHOOTING_STAR_SIZE,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.95, // Ensured shooting star is quite opaque
        blending: THREE.AdditiveBlending,
    });
    shootingStarMeshRef.current = new THREE.Points(starGeom, starMat);
    shootingStarMeshRef.current.visible = false;
    sceneRef.current.add(shootingStarMeshRef.current);

    lastShotTimeRef.current = clockRef.current.getElapsedTime(); 


    if (cameraRef.current && sceneRef.current && particleMeshRef.current) {
        const distance = orbRadius * cameraDistanceFactor;
        cameraRef.current.position.z = Math.max(distance, orbRadius * 1.5); 
        cameraRef.current.lookAt(sceneRef.current.position); 
        cameraRef.current.updateProjectionMatrix();
    }
    

    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clockRef.current.getElapsedTime();
      const deltaTime = clockRef.current.getDelta();

      // Main orb animation
      if (particleMeshRef.current) {
        particleMeshRef.current.rotation.y += 0.0005;
        particleMeshRef.current.rotation.x += 0.0002;

        if (originalPositionsRef.current && particleMeshRef.current.geometry.attributes.position) {
            const currentPositions = particleMeshRef.current.geometry.attributes.position as THREE.BufferAttribute;
            const original = originalPositionsRef.current;

            for (let i = 0; i < particleCount; i++) {
              const ox = original[i * 3];
              const oy = original[i * 3 + 1];
              const oz = original[i * 3 + 2];

              currentPositions.setX(i, ox + Math.sin(elapsedTime * animationSpeed + oy * 0.5 + ox * 0.2) * animationAmplitude);
              currentPositions.setY(i, oy + Math.cos(elapsedTime * animationSpeed + ox * 0.5 + oy * 0.2) * animationAmplitude * 1.2);
              currentPositions.setZ(i, oz + Math.sin(elapsedTime * animationSpeed * 0.8 + oz * 0.5) * animationAmplitude * 0.8);
            }
            currentPositions.needsUpdate = true;
        }
      }

      // Shooting star animation & logic
      if (shootingStarMeshRef.current) {
        if (!shootingStarDataRef.current?.active && (elapsedTime - lastShotTimeRef.current > SHOT_INTERVAL)) {
            
            const startPos = new THREE.Vector3();
            const s_phi = Math.acos(2 * Math.random() - 1);
            const s_theta = Math.random() * 2 * Math.PI;
            startPos.set(
                FAR_DISTANCE_FOR_STAR_SPAWN * Math.sin(s_phi) * Math.cos(s_theta),
                FAR_DISTANCE_FOR_STAR_SPAWN * Math.sin(s_phi) * Math.sin(s_theta),
                FAR_DISTANCE_FOR_STAR_SPAWN * Math.cos(s_phi)
            );

            const targetPos = new THREE.Vector3();
            // Target a random point on the orb's surface
            const t_phi = Math.acos(2 * Math.random() - 1);
            const t_theta = Math.random() * 2 * Math.PI;
            targetPos.set(
                orbRadius * Math.sin(t_phi) * Math.cos(t_theta),
                orbRadius * Math.sin(t_phi) * Math.sin(t_theta),
                orbRadius * Math.cos(t_phi)
            );
            
            const velocity = targetPos.clone().sub(startPos).normalize().multiplyScalar(STAR_SPEED);

            shootingStarDataRef.current = {
                position: startPos.clone(),
                velocity: velocity,
                active: true,
                startTime: elapsedTime,
            };
            
            const starPositions = shootingStarMeshRef.current.geometry.attributes.position as THREE.BufferAttribute;
            starPositions.setXYZ(0, startPos.x, startPos.y, startPos.z);
            starPositions.needsUpdate = true;
            shootingStarMeshRef.current.visible = true;
            lastShotTimeRef.current = elapsedTime;
        }

        if (shootingStarDataRef.current?.active && shootingStarMeshRef.current.visible) {
            const star = shootingStarDataRef.current;
            star.position.add(star.velocity.clone().multiplyScalar(deltaTime));

            const starPositions = shootingStarMeshRef.current.geometry.attributes.position as THREE.BufferAttribute;
            starPositions.setXYZ(0, star.position.x, star.position.y, star.position.z);
            starPositions.needsUpdate = true;

            // Collision detection with the orb
            if (star.position.lengthSq() <= (orbRadius * orbRadius * 1.05)) { 
                star.active = false;
                shootingStarMeshRef.current.visible = false;
            }

            // Lifetime check
            if (elapsedTime - star.startTime > STAR_LIFETIME) {
                star.active = false;
                shootingStarMeshRef.current.visible = false;
            }
        }
      }
      
      if(rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current && currentMount) {
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      
      if (particleMeshRef.current) {
        sceneRef.current?.remove(particleMeshRef.current);
        particleMeshRef.current.geometry.dispose();
        if(Array.isArray(particleMeshRef.current.material)) {
            particleMeshRef.current.material.forEach(m => m.dispose());
        } else {
            particleMeshRef.current.material.dispose();
        }
      }
      sphereGeometry.dispose();

      if (shootingStarMeshRef.current) {
        sceneRef.current?.remove(shootingStarMeshRef.current);
        shootingStarMeshRef.current.geometry.dispose();
         if(Array.isArray(shootingStarMeshRef.current.material)) {
            shootingStarMeshRef.current.material.forEach(m => m.dispose());
        } else {
            shootingStarMeshRef.current.material.dispose();
        }
      }
      
      if (rendererRef.current) {
        if (rendererRef.current.domElement && currentMount.contains(rendererRef.current.domElement)) {
             currentMount.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
      
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      particleMeshRef.current = null;
      shootingStarMeshRef.current = null;
      shootingStarDataRef.current = null;
      originalPositionsRef.current = null;
    };
  }, [particleColor, particleSize, animationSpeed, animationAmplitude, cameraDistanceFactor, orbRadius, particleCount]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default CelestialOrb;
