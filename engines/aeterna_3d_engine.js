// ═══════════════════════════════════════════════════════════════════════════════
// === AETERNA 3D SOVEREIGN ENGINE: WEBGL2 / THREE.JS CYBERNETIC RUNTIME ===
// ═══════════════════════════════════════════════════════════════════════════════
// Architect: Dimitar Prodromov (ID 101327948) | Pomorie HQ
// Authority: 0x41_45_54_45_52_4e_41_5f_4c_4f_47_4f_53_5f_44_49_4d_49_54_41_52_5f_50_52_4f_44_52_4f_4d_56_21
// Substrate: THREE.JS R128+ / GLSL 3.0 / WEB AUDIO API / ZERO FLOAT DRIFT
// ═══════════════════════════════════════════════════════════════════════════════

export class Aeterna3DEngine {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.canvas = options.canvas || null;
        this.particleCount = options.particleCount || 100000;
        this.displacementScale = options.displacementScale || 0.45;
        this.normalScale = options.normalScale || 3.2;
        this.autoOrbit = options.autoOrbit || false;
        
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
        this.audioActive = false;
        this.audioContext = null;
        this.analyser = null;
        this.audioFreqData = null;
        
        this.initWebGL();
        this.initShaders();
        this.initParticles();
        this.initEventListeners();
    }

    initWebGL() {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'aeterna-3d-canvas';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100vw';
            this.canvas.style.height = '100vh';
            this.canvas.style.display = 'block';
            this.container.appendChild(this.canvas);
        }

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance',
            alpha: true,
            preserveDrawingBuffer: true
        });

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x020409, 0.04);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100.0);
        this.camera.position.set(0, 0, 4.2);
        this.clock = new THREE.Clock();
    }

    initShaders() {
        this.vertexShader = `
            uniform sampler2D uDepthMap;
            uniform float uDisplacement;
            uniform float uTime;
            uniform vec2 uMouseTilt;
            
            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldPosition;

            void main() {
                vUv = uv;
                float depthVal = texture2D(uDepthMap, uv).r;
                float wave = sin(uv.x * 24.0 + uTime * 2.0) * cos(uv.y * 24.0 + uTime * 1.5) * 0.015;
                
                vec3 displacedPos = position + normal * ((depthVal * uDisplacement) + wave);
                displacedPos.xy += uMouseTilt * (depthVal * 0.15);

                vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
                vWorldPosition = worldPos.xyz;
                
                vec4 mvPosition = viewMatrix * worldPos;
                vViewPosition = -mvPosition.xyz;
                vNormal = normalMatrix * normal;
                
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        this.fragmentShader = `
            uniform sampler2D uColorMap;
            uniform sampler2D uNormalMap;
            uniform sampler2D uAoMap;
            uniform float uNormalScale;
            uniform float uTime;
            uniform vec3 uLightPos;
            uniform float uAudioResonance;
            uniform float uHoloIntensity;

            varying vec2 vUv;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            varying vec3 vWorldPosition;

            void main() {
                // Chromatic Aberration
                vec2 uvOffset = (vUv - 0.5) * (0.008 * (1.0 + uAudioResonance));
                float r = texture2D(uColorMap, vUv + uvOffset).r;
                float g = texture2D(uColorMap, vUv).g;
                float b = texture2D(uColorMap, vUv - uvOffset).b;
                vec3 baseColor = vec3(r, g, b);

                // Normal Perturbation
                vec3 rawN = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
                rawN.xy *= uNormalScale;
                vec3 N = normalize(vNormal + rawN.x * vec3(1.0, 0.0, 0.0) + rawN.y * vec3(0.0, 1.0, 0.0));

                float ao = texture2D(uAoMap, vUv).r;

                vec3 L = normalize(uLightPos - vWorldPosition);
                vec3 V = normalize(vViewPosition);
                vec3 H = normalize(L + V);

                float diff = max(dot(N, L), 0.0);
                float spec = pow(max(dot(N, H), 0.0), 32.0);

                // Holographic Rim Fresnel Glow
                float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
                vec3 rimColor = mix(vec3(0.0, 0.95, 1.0), vec3(1.0, 0.0, 0.35), sin(uTime * 0.8) * 0.5 + 0.5);

                float scanline = sin(gl_FragCoord.y * 1.5 + uTime * 4.0) * 0.06 * uHoloIntensity;

                vec3 ambient = vec3(0.18, 0.22, 0.32) * ao;
                vec3 diffuse = baseColor * diff * 1.1;
                vec3 specular = vec3(1.0, 1.0, 1.0) * spec * 0.6;
                vec3 rim = rimColor * fresnel * (0.7 + uAudioResonance * 1.2);

                vec3 finalColor = (ambient + diffuse + specular + rim) - scanline;
                finalColor += vec3(1.0, 0.85, 0.3) * (spec * 0.25);

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
    }

    loadManifold(textures) {
        const aspect = textures.aspect || 1.0;
        const meshWidth = 2.4 * aspect;
        const meshHeight = 2.4;
        const gridSegments = 160;

        if (this.volumetricMesh) {
            this.scene.remove(this.volumetricMesh);
            this.volumetricMesh.geometry.dispose();
            this.volumetricMesh.material.dispose();
        }

        const geometry = new THREE.PlaneGeometry(meshWidth, meshHeight, gridSegments, gridSegments);

        this.uniforms = {
            uColorMap: { value: textures.color },
            uDepthMap: { value: textures.depth },
            uNormalMap: { value: textures.normal },
            uAoMap: { value: textures.ao },
            uDisplacement: { value: this.displacementScale },
            uNormalScale: { value: this.normalScale },
            uTime: { value: 0.0 },
            uMouseTilt: { value: new THREE.Vector2(0, 0) },
            uLightPos: { value: new THREE.Vector3(0, 2, 3) },
            uAudioResonance: { value: 0.0 },
            uHoloIntensity: { value: 1.0 }
        };

        this.material = new THREE.ShaderMaterial({
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            uniforms: this.uniforms,
            side: THREE.DoubleSide
        });

        this.volumetricMesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.volumetricMesh);
    }

    initParticles() {
        const count = this.particleCount;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        this.particleOriginals = new Float32Array(count * 3);

        const cCyan = new THREE.Color(0x00f3ff);
        const cMag = new THREE.Color(0xff0055);
        const cGold = new THREE.Color(0xffd700);

        for (let i = 0; i < count; i++) {
            const r = 1.5 + Math.random() * 2.5;
            const theta = Math.random() * Math.PI * 2.0;
            const phi = (Math.random() - 0.5) * Math.PI;

            const x = r * Math.cos(theta) * Math.cos(phi);
            const y = r * Math.sin(phi);
            const z = r * Math.sin(theta) * Math.cos(phi) - 0.5;

            positions[i * 3 + 0] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            this.particleOriginals[i * 3 + 0] = x;
            this.particleOriginals[i * 3 + 1] = y;
            this.particleOriginals[i * 3 + 2] = z;

            const blend = Math.random();
            let col = new THREE.Color();
            if (blend < 0.6) {
                col.lerpColors(cCyan, cMag, blend / 0.6);
            } else {
                col.lerpColors(cMag, cGold, (blend - 0.6) / 0.4);
            }

            colors[i * 3 + 0] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;
        }

        this.particleGeometry = new THREE.BufferGeometry();
        this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.016,
            vertexColors: true,
            transparent: true,
            opacity: 0.75,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particleSwarm = new THREE.Points(this.particleGeometry, mat);
        this.scene.add(this.particleSwarm);
    }

    initEventListeners() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initAudioSynthesizer() {
        if (this.audioContext) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioCtx();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        this.audioFreqData = new Uint8Array(this.analyser.frequencyBinCount);

        const oscSub = this.audioContext.createOscillator();
        oscSub.type = 'sawtooth';
        oscSub.frequency.setValueAtTime(55, this.audioContext.currentTime);

        const oscPhi = this.audioContext.createOscillator();
        oscPhi.type = 'sine';
        oscPhi.frequency.setValueAtTime(432, this.audioContext.currentTime);

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.audioContext.currentTime);

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0.001, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.35, this.audioContext.currentTime + 1.2);

        oscSub.connect(filter);
        oscPhi.connect(filter);
        filter.connect(this.analyser);
        this.analyser.connect(gain);
        gain.connect(this.audioContext.destination);

        oscSub.start();
        oscPhi.start();
        this.audioActive = true;
    }

    render() {
        const elapsed = this.clock.getElapsedTime();

        if (this.uniforms) {
            this.uniforms.uTime.value = elapsed;
            this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.055;
            this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.055;
            this.uniforms.uMouseTilt.value.set(this.mouse.x, this.mouse.y);
            this.uniforms.uLightPos.value.set(
                this.mouse.x * 3.5 + Math.sin(elapsed * 1.5) * 0.5,
                this.mouse.y * 3.5 + Math.cos(elapsed * 1.5) * 0.5,
                2.8
            );

            if (this.autoOrbit) {
                this.volumetricMesh.rotation.y = elapsed * 0.4;
                this.volumetricMesh.rotation.x = Math.sin(elapsed * 0.3) * 0.2;
            } else {
                this.volumetricMesh.rotation.y = this.mouse.x * 0.38;
                this.volumetricMesh.rotation.x = -this.mouse.y * 0.38;
            }

            let audioRes = 0.0;
            if (this.analyser && this.audioActive) {
                this.analyser.getByteFrequencyData(this.audioFreqData);
                let sum = 0;
                for (let i = 0; i < this.audioFreqData.length; i++) {
                    sum += this.audioFreqData[i];
                }
                audioRes = (sum / this.audioFreqData.length) / 128.0;
                this.uniforms.uAudioResonance.value = audioRes;
            }

            // Particle Physics
            const pos = this.particleGeometry.attributes.position.array;
            const flow = elapsed * 0.4;
            for (let i = 0; i < this.particleCount; i++) {
                const idx = i * 3;
                const ox = this.particleOriginals[idx];
                const oy = this.particleOriginals[idx + 1];
                const oz = this.particleOriginals[idx + 2];

                const angle = flow + (oz * 0.5);
                let nx = ox * Math.cos(angle) - oy * Math.sin(angle);
                let ny = ox * Math.sin(angle) + oy * Math.cos(angle);
                let nz = oz + Math.sin(flow * 2.0 + ox) * 0.1;

                const dx = nx - this.mouse.x * 2.0;
                const dy = ny - this.mouse.y * 2.0;
                const distSq = dx * dx + dy * dy;

                if (distSq < 1.4) {
                    const force = (1.4 - distSq) * 0.45;
                    nx += dx * force;
                    ny += dy * force;
                }

                if (audioRes > 0.05) {
                    nx *= (1.0 + audioRes * 0.08);
                    ny *= (1.0 + audioRes * 0.08);
                }

                pos[idx] = nx;
                pos[idx + 1] = ny;
                pos[idx + 2] = nz;
            }
            this.particleGeometry.attributes.position.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
