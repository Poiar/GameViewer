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

  /** URL to a .glb 3D scan (takes priority over coverUrl) */
  @Input() modelUrl: string | null = null;
  /** Cover image URL — mapped onto the front face of the 3D box */
  @Input() coverUrl: string | null = null;
  /** Game title — rendered on the spine */
  @Input() title: string = "Game";
  /** Whether this is a physical release (true = thicker box) */
  @Input() isPhysical: boolean = false;

  loading = true;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private boxGroup: THREE.Group | null = null;
  private animationId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  // Auto-rotation
  private autoRotate = true;
  private userInteractedAt = 0;
  private readonly AUTO_ROTATE_DELAY = 2000;
  private readonly AUTO_ROTATE_SPEED = 0.005;

  // Box dimensions (height-normalized)
  private readonly BOX_HEIGHT = 1.6;
  private readonly BOX_WIDTH = this.BOX_HEIGHT * (200 / 280); // ~1.143 — matches 200x280 cover aspect
  private readonly BOX_DEPTH_PHYSICAL = 0.22;
  private readonly BOX_DEPTH_DIGITAL = 0.08;

  ngAfterViewInit(): void {
    const el = this.container.nativeElement;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
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
    this.camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100);
    this.camera.position.set(1.8, 1.2, 3.5);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(3, 5, 4);
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.35);
    fillLight.position.set(-2, 1, -2);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(-1, 2, -3);
    this.scene.add(rimLight);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false;
    this.controls.enablePan = false;
    this.controls.minPolarAngle = Math.PI / 4.5;
    this.controls.maxPolarAngle = Math.PI / 1.4;
    this.controls.target.set(0, 0, 0);
    this.controls.update();

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
      this.create3DBox(this.coverUrl);
    } else {
      this.loading = false;
    }

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(el);

    this.animate();
  }

  // ---------------------------------------------------------------------------
  // .glb scan fallback
  // ---------------------------------------------------------------------------

  private loadModel(url: string): void {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        this.boxGroup = gltf.scene;
        const box = new THREE.Box3().setFromObject(this.boxGroup);
        const center = box.getCenter(new THREE.Vector3());
        this.boxGroup.position.sub(center);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) this.boxGroup.scale.multiplyScalar(2 / maxDim);
        this.scene?.add(this.boxGroup!);
        this.loading = false;
      },
      undefined,
      () => {
        console.warn("[GameBoxViewer] 3D model failed — falling back to procedural box");
        if (this.coverUrl) this.create3DBox(this.coverUrl);
        this.loading = false;
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Procedural 3D game box
  // ---------------------------------------------------------------------------

  private create3DBox(coverUrl: string): void {
    const depth = this.isPhysical ? this.BOX_DEPTH_PHYSICAL : this.BOX_DEPTH_DIGITAL;
    const w = this.BOX_WIDTH;
    const h = this.BOX_HEIGHT;
    const d = depth;

    this.boxGroup = new THREE.Group();

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverUrl;

    img.onload = () => {
      // --- Face dimensions ---
      // Front/back: w × h
      // Spine (right edge): d × h
      // Top/bottom: w × d

      // Create 6 face materials
      const coverTexture = new THREE.Texture(img);
      coverTexture.needsUpdate = true;
      coverTexture.colorSpace = THREE.SRGBColorSpace;

      // Extract dominant color from the cover for matching edges
      const dominantColor = this.extractDominantColor(img);

      const frontMat = new THREE.MeshStandardMaterial({
        map: coverTexture,
        roughness: 0.25,
        metalness: 0.05,
      });

      const backMat = new THREE.MeshStandardMaterial({
        color: dominantColor,
        roughness: 0.6,
        metalness: 0,
      });

      const sideMat = new THREE.MeshStandardMaterial({
        color: dominantColor,
        roughness: 0.5,
        metalness: 0,
      });

      // Spine texture with game title
      const spineMat = this.createSpineMaterial(this.title, dominantColor);

      // Build the box from individual planes so we can texture each face
      const geo = (w2: number, h2: number) => new THREE.PlaneGeometry(w2, h2);

      // Front face
      const front = new THREE.Mesh(geo(w, h), frontMat);
      front.position.z = d / 2;
      this.boxGroup!.add(front);

      // Back face
      const back = new THREE.Mesh(geo(w, h), backMat);
      back.position.z = -d / 2;
      back.rotation.y = Math.PI;
      this.boxGroup!.add(back);

      // Spine (right side — the edge you see when the box is rotated)
      const spine = new THREE.Mesh(geo(d, h), spineMat);
      spine.position.x = w / 2;
      spine.rotation.y = Math.PI / 2;
      this.boxGroup!.add(spine);

      // Left edge
      const left = new THREE.Mesh(geo(d, h), sideMat);
      left.position.x = -w / 2;
      left.rotation.y = -Math.PI / 2;
      this.boxGroup!.add(left);

      // Top
      const top = new THREE.Mesh(geo(w, d), sideMat);
      top.position.y = h / 2;
      top.rotation.x = -Math.PI / 2;
      this.boxGroup!.add(top);

      // Bottom
      const bottom = new THREE.Mesh(geo(w, d), sideMat);
      bottom.position.y = -h / 2;
      bottom.rotation.x = Math.PI / 2;
      this.boxGroup!.add(bottom);

      // Subtle edge wireframe for definition
      const boxGeo = new THREE.BoxGeometry(w, h, d);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.08,
      });
      const wireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(boxGeo),
        edgeMat,
      );
      this.boxGroup!.add(wireframe);

      this.scene?.add(this.boxGroup!);
      this.loading = false;
    };

    img.onerror = () => {
      // No image — show a simple dark box
      this.createPlaceholderBox();
      this.loading = false;
    };
  }

  /** Generate a canvas texture for the spine with the game title */
  private createSpineMaterial(
    title: string,
    color: number,
  ): THREE.MeshStandardMaterial {
    const d = this.isPhysical ? this.BOX_DEPTH_PHYSICAL : this.BOX_DEPTH_DIGITAL;
    const canvas = document.createElement("canvas");
    const px = Math.ceil(d * 300); // ~24-66px wide
    const py = Math.ceil(this.BOX_HEIGHT * 300); // 480px tall
    canvas.width = Math.max(px, 24);
    canvas.height = py;
    const ctx = canvas.getContext("2d")!;

    // Spine background slightly darker than the box color
    const hex = "#" + color.toString(16).padStart(6, "0");
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vertical text
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height - 16);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = this.luminance(color) > 0.5 ? "#000" : "#fff";
    ctx.font = `bold ${Math.min(11, canvas.width * 0.7)}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 0.85;
    const maxWidth = py - 32;
    let displayTitle = title;
    while (ctx.measureText(displayTitle).width > maxWidth && displayTitle.length > 1) {
      displayTitle = displayTitle.slice(0, -1);
    }
    if (displayTitle !== title) displayTitle += "…";
    ctx.fillText(displayTitle, 0, 0);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.6,
      metalness: 0,
    });
  }

  /** Crude dominant-color extraction: sample edge pixels */
  private extractDominantColor(img: HTMLImageElement): number {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 4;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, 4, 4);
    const data = ctx.getImageData(0, 0, 4, 4).data;
    let r = 0, g2 = 0, b = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g2 += data[i + 1];
      b += data[i + 2];
    }
    const n = data.length / 4;
    return (Math.round(r / n) << 16) | (Math.round(g2 / n) << 8) | Math.round(b / n);
  }

  private luminance(color: number): number {
    const r = ((color >> 16) & 0xff) / 255;
    const g2 = ((color >> 8) & 0xff) / 255;
    const b = (color & 0xff) / 255;
    return 0.2126 * r + 0.7152 * g2 + 0.0722 * b;
  }

  private createPlaceholderBox(): void {
    const d = this.isPhysical ? this.BOX_DEPTH_PHYSICAL : this.BOX_DEPTH_DIGITAL;
    const geo = new THREE.BoxGeometry(this.BOX_WIDTH, this.BOX_HEIGHT, d);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.6,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.boxGroup = new THREE.Group();
    this.boxGroup.add(mesh);

    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x555555,
      transparent: true,
      opacity: 0.3,
    });
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      edgeMat,
    );
    this.boxGroup.add(wireframe);

    this.scene?.add(this.boxGroup);
  }

  // ---------------------------------------------------------------------------
  // Animation loop
  // ---------------------------------------------------------------------------

  private animate(): void {
    if (!this.renderer || !this.scene || !this.camera || !this.controls) return;

    this.animationId = requestAnimationFrame(() => this.animate());

    if (!this.autoRotate && Date.now() - this.userInteractedAt > this.AUTO_ROTATE_DELAY) {
      this.autoRotate = true;
    }
    if (this.autoRotate && this.boxGroup) {
      this.boxGroup.rotation.y += this.AUTO_ROTATE_SPEED;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // ---------------------------------------------------------------------------
  // Resize
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  ngOnDestroy(): void {
    this.animationId && cancelAnimationFrame(this.animationId);
    this.controls?.dispose();
    this.resizeObserver?.disconnect();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
    }
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
