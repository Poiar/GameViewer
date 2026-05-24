import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, input, signal } from "@angular/core";
import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

@Component({
  selector: "app-model-viewer",
  standalone: true,
  template: `
    <div class="viewer-container">
      <canvas #canvas class="viewer-canvas"></canvas>
      @if (loading()) {
        <div class="viewer-overlay">
          <div class="viewer-spinner"></div>
          <span>Loading model…</span>
        </div>
      }
      @if (error()) {
        <div class="viewer-overlay viewer-error">
          <span>{{ error() }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .viewer-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 300px;
        border-radius: var(--radius-lg);
        overflow: hidden;
        background: var(--bg-tertiary);
      }

      .viewer-canvas {
        display: block;
        width: 100%;
        height: 100%;
      }

      .viewer-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: var(--bg-overlay, rgba(0, 0, 0, 0.6));
        color: var(--text-primary);
        font-size: 13px;
      }

      .viewer-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--border-subtle);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .viewer-error {
        color: var(--accent-warn);
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class ModelViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild("canvas", { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  modelPath = input<string>("");
  loading = signal(true);
  error = signal("");

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private animationId: number = 0;
  private loader!: GLTFLoader;

  ngAfterViewInit(): void {
    this.initScene();
    this.initLights();
    this.initControls();
    this.loadModel();
    this.animate();

    window.addEventListener("resize", this.onResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener("resize", this.onResize);
    cancelAnimationFrame(this.animationId);
    this.controls?.dispose();
    this.renderer?.dispose();
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

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(2, 1.5, 2);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.loader = new GLTFLoader();
  }

  private initLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(3, 5, 4);
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-3, 2, -2);
    this.scene.add(fillLight);
  }

  private initControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 20;
    this.controls.update();
  }

  private loadModel(): void {
    const path = this.modelPath();
    if (!path) {
      this.loading.set(false);
      this.error.set("No 3D model provided");
      return;
    }

    this.loading.set(true);
    this.error.set("");

    this.loader.load(
      path,
      (gltf: GLTF) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;

        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        model.position.y -= box.min.y * scale;

        this.scene.add(model);
        this.loading.set(false);
      },
      undefined,
      (err: unknown) => {
        this.loading.set(false);
        this.error.set("Failed to load 3D model");
        console.error("GLTF load error:", err);
      },
    );
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = (): void => {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };
}
