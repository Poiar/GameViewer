import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  HostListener,
} from "@angular/core";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

@Component({
  selector: "app-game-box-viewer",
  standalone: true,
  template: `<div #container class="box-container">@if (loading) {<div class="box-loading">Loading 3D model...</div>}</div>`,
  styles: [
    `
    .box-container { width: 100%; height: 100%; position: relative; cursor: grab; touch-action: none; }
    .box-container:active { cursor: grabbing; }
    .box-container canvas { display: block; width: 100% !important; height: 100% !important; }
    .box-loading {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font-size: 13px; color: var(--text-muted); background: var(--bg-tertiary);
      border-radius: 12px; animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: .4; } 50% { opacity: .8; } }
  `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameBoxViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild("container", { static: true }) container!: ElementRef<HTMLDivElement>;

  @Input() modelUrl: string | null = null;
  @Input() coverUrl: string | null = null;

  loading = true;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private model: THREE.Group | null = null;
  private animationId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Auto-rotation
  private autoRotate = true;
  private userInteractedAt = 0;
  private readonly AUTO_ROTATE_DELAY = 2000; // ms after user stops before auto-rotate resumes
  private readonly AUTO_ROTATE_SPEED = 0.005;

  ngAfterViewInit(): void {
    const el = this.container.nativeElement;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      // Container not yet sized — wait for a frame
      requestAnimationFrame(() => this.initScene());
    } else {
      this.initScene();
    }
  }

  private initScene(): void {
    const el = this.container.nativeElement;
    const width = el.clientWidth || 200;
    const height = el.clientHeight || 280;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    el.prepend(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    this.camera.position.set(2, 1.5, 4);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(3, 5, 4);
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
    fillLight.position.set(-2, 1, -2);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(-1, 2, -3);
    this.scene.add(rimLight);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.autoRotate = false; // we handle this ourselves
    this.controls.minPolarAngle = Math.PI / 4;
    this.controls.maxPolarAngle = Math.PI / 1.5;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // Track user interaction
    this.controls.addEventListener("start", () => {
      this.autoRotate = false;
    });
    this.controls.addEventListener("end", () => {
      this.userInteractedAt = Date.now();
    });

    // Load content
    if (this.modelUrl) {
      this.loadModel(this.modelUrl);
    } else if (this.coverUrl) {
      this.createFlatCover(this.coverUrl);
    } else {
      this.loading = false;
    }

    // ResizeObserver
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(el);

    // Start animation loop
    this.animate();
  }

  private loadModel(url: string): void {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        this.model = gltf.scene;
        // Center the model
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
        // Scale if needed
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) {
          this.model.scale.multiplyScalar(2 / maxDim);
        }
        this.scene?.add(this.model);
        this.loading = false;
      },
      undefined,
      () => {
        // Error — fall back to flat cover
        console.warn("[GameBoxViewer] Failed to load 3D model, falling back to flat cover");
        if (this.coverUrl) this.createFlatCover(this.coverUrl);
        this.loading = false;
      },
    );
  }

  private createFlatCover(url: string): void {
    const textureLoader = new THREE.TextureLoader();
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      const geometry = new THREE.PlaneGeometry(aspect * 1.4, 1.4);
      const texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.15,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      // Add a subtle 3D bezel
      const bevelGeo = new THREE.EdgesGeometry(geometry);
      const bevelMat = new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.3 });
      const bevel = new THREE.LineSegments(bevelGeo, bevelMat);
      mesh.add(bevel);
      this.scene?.add(mesh);
      this.loading = false;
    };
    img.onerror = () => {
      this.loading = false;
    };
  }

  private animate(): void {
    if (!this.renderer || !this.scene || !this.camera || !this.controls) return;

    this.animationId = requestAnimationFrame(() => this.animate());

    // Auto-rotation: kick in after user has been idle for AUTO_ROTATE_DELAY ms
    if (!this.autoRotate && Date.now() - this.userInteractedAt > this.AUTO_ROTATE_DELAY) {
      this.autoRotate = true;
    }
    if (this.autoRotate) {
      const group = this.model ?? (this.scene.children.find((c) => c.type === "Mesh")?.parent ?? null);
      if (group) {
        group.rotation.y += this.AUTO_ROTATE_SPEED;
      } else {
        // Rotate scene root
        const mesh = this.scene.children.find((c) => c.type === "Mesh");
        if (mesh) mesh.rotation.y += this.AUTO_ROTATE_SPEED;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    const el = this.container?.nativeElement;
    if (!el || !this.renderer || !this.camera) return;
    const width = el.clientWidth;
    const height = el.clientHeight;
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  @HostListener("window:resize")
  onWindowResize(): void {
    this.onResize();
  }

  ngOnDestroy(): void {
    this.animationId && cancelAnimationFrame(this.animationId);
    this.controls?.dispose();
    this.resizeObserver?.disconnect();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
    }
    // Dispose scene objects
    this.scene?.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material?.dispose();
        }
      }
    });
  }
}
