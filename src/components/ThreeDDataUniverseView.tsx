import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Globe,
  RotateCcw,
  Sparkles,
  Maximize2,
  AlertTriangle,
  Layers,
  Box,
  Move,
} from 'lucide-react';
import { DatasetAnalysisContext } from '../types/data';

interface ThreeDDataUniverseViewProps {
  context: DatasetAnalysisContext;
}

interface HoveredPointInfo {
  index: number;
  xVal: number;
  yVal: number;
  zVal: number;
  row: Record<string, any>;
  isOutlier: boolean;
  screenX: number;
  screenY: number;
}

export const ThreeDDataUniverseView: React.FC<ThreeDDataUniverseViewProps> = ({ context }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [xCol, setXCol] = useState<string>('');
  const [yCol, setYCol] = useState<string>('');
  const [zCol, setZCol] = useState<string>('');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPointInfo | null>(null);

  // Extract numerical column names from context.numericStats
  const numericCols = useMemo(() => {
    return context.numericStats.map((s) => s.columnName);
  }, [context]);


  // Set default top 3 numeric columns
  useEffect(() => {
    if (numericCols.length >= 3) {
      setXCol(numericCols[0]);
      setYCol(numericCols[1]);
      setZCol(numericCols[2]);
    } else if (numericCols.length === 2) {
      setXCol(numericCols[0]);
      setYCol(numericCols[1]);
      setZCol(numericCols[0]);
    } else if (numericCols.length === 1) {
      setXCol(numericCols[0]);
      setYCol(numericCols[0]);
      setZCol(numericCols[0]);
    }
  }, [numericCols]);

  // Calculate statistics (min, max, mean, std) for normalization and outlier detection
  const stats = useMemo(() => {
    if (!xCol || !yCol || !zCol) return null;

    const calcCol = (colName: string) => {
      const vals = context.allData
        .map((r) => Number(r[colName]))
        .filter((v) => !isNaN(v));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      const variance =
        vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length || 1);
      const std = Math.sqrt(variance);
      return { min, max, mean, std };
    };

    return {
      x: calcCol(xCol),
      y: calcCol(yCol),
      z: calcCol(zCol),
    };
  }, [context, xCol, yCol, zCol]);

  // Count total outliers
  const outlierCount = useMemo(() => {
    if (!stats) return 0;
    return context.allData.filter((r) => {
      const vx = Number(r[xCol]);
      const vy = Number(r[yCol]);
      const vz = Number(r[zCol]);
      const isXOut = Math.abs(vx - stats.x.mean) > 2 * stats.x.std;
      const isYOut = Math.abs(vy - stats.y.mean) > 2 * stats.y.std;
      const isZOut = Math.abs(vz - stats.z.mean) > 2 * stats.z.std;
      return isXOut || isYOut || isZOut;
    }).length;
  }, [context, stats, xCol, yCol, zCol]);

  // Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container || !stats || !xCol || !yCol || !zCol) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#030712'); // Rich deep slate space

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(30, 25, 40);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;

    // Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6366f1, 2, 100);
    pointLight.position.set(20, 20, 20);
    scene.add(pointLight);

    // 3D Grid & Axes Helper
    const gridHelper = new THREE.GridHelper(40, 20, 0x4f46e5, 0x1e293b);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // 3D Bounding Box Wireframe
    const boxGeo = new THREE.BoxGeometry(20, 20, 20);
    const boxMat = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.4 });
    const wireframe = new THREE.LineSegments(new THREE.WireframeGeometry(boxGeo), boxMat);
    scene.add(wireframe);

    // Create 3D Nodes for Data Points
    const nodesGroup = new THREE.Group();
    const raycastMeshes: THREE.Mesh[] = [];

    const norm = (val: number, s: { min: number; max: number }) => {
      if (s.max === s.min) return 0;
      return ((val - s.min) / (s.max - s.min)) * 20 - 10; // Map to range [-10, 10]
    };

    context.allData.forEach((row, idx) => {
      const vx = Number(row[xCol]) || 0;
      const vy = Number(row[yCol]) || 0;
      const vz = Number(row[zCol]) || 0;

      const px = norm(vx, stats.x);
      const py = norm(vy, stats.y);
      const pz = norm(vz, stats.z);

      const isXOut = Math.abs(vx - stats.x.mean) > 2 * stats.x.std;
      const isYOut = Math.abs(vy - stats.y.mean) > 2 * stats.y.std;
      const isZOut = Math.abs(vz - stats.z.mean) > 2 * stats.z.std;
      const isOutlier = isXOut || isYOut || isZOut;

      const radius = isOutlier ? 0.45 : 0.28;
      const geometry = new THREE.SphereGeometry(radius, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color: isOutlier ? 0xf43f5e : 0x06b6d4, // Red for outliers, Cyan for normal
        emissive: isOutlier ? 0x9f1239 : 0x0284c7,
        emissiveIntensity: isOutlier ? 0.6 : 0.3,
        roughness: 0.2,
        metalness: 0.8,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(px, py, pz);
      mesh.userData = { index: idx, row, vx, vy, vz, isOutlier };

      nodesGroup.add(mesh);
      raycastMeshes.push(mesh);
    });

    scene.add(nodesGroup);

    // Raycaster for Mouse Hover Detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(raycastMeshes);

      if (intersects.length > 0) {
        const topMesh = intersects[0].object as THREE.Mesh;
        const uData = topMesh.userData;
        setHoveredPoint({
          index: uData.index,
          xVal: uData.vx,
          yVal: uData.vy,
          zVal: uData.vz,
          row: uData.row,
          isOutlier: uData.isOutlier,
          screenX: event.clientX - rect.left,
          screenY: event.clientY - rect.top,
        });
      } else {
        setHoveredPoint(null);
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Pulsing effect for nodes
      nodesGroup.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh && child.userData.isOutlier) {
          const scale = 1 + Math.sin(Date.now() * 0.005 + i) * 0.15;
          child.scale.set(scale, scale, scale);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [context, stats, xCol, yCol, zCol, autoRotate]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-800/40 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl text-cyan-400 shadow-inner">
            <Globe className="w-7 h-7 animate-spin-slow text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-extrabold text-slate-100">
                🌐 3D Spatial Data Universe (Üç Boyutlu Veri Evreni)
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                Three.js WebGL Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              Verinizi X, Y ve Z sayısal eksenlerinde 3B uzayda süzülen parlak küreler olarak inceleyin. Aykırı değerler kırmızı parlayan kürelerle işaretlenir.
            </p>
          </div>
        </div>

        {/* Outlier Stats & Auto-Rotate Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{outlierCount} Aykırı Değer (Outlier)</span>
          </div>

          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              autoRotate
                ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>{autoRotate ? 'Oto-Dönüş Açık' : 'Oto-Dönüş Kapalı'}</span>
          </button>
        </div>
      </div>

      {/* Axis Selector Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
        <div>
          <label className="block text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Box className="w-3.5 h-3.5" /> X Ekseni (Yatay Uzay)
          </label>
          <select
            value={xCol}
            onChange={(e) => setXCol(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-cyan-500"
          >
            {numericCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-teal-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Box className="w-3.5 h-3.5" /> Y Ekseni (Dikey Yükseklik)
          </label>
          <select
            value={yCol}
            onChange={(e) => setYCol(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-teal-500"
          >
            {numericCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Box className="w-3.5 h-3.5" /> Z Ekseni (Derinlik)
          </label>
          <select
            value={zCol}
            onChange={(e) => setZCol(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-purple-500"
          >
            {numericCols.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative w-full h-[520px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden shadow-inner group">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* 3D Controls Instructions Hint */}
        <div className="absolute top-4 left-4 pointer-events-none bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sol Tık: Döndür • Sağ Tık: Kaydır • Scroll: Yakınlaş</span>
        </div>

        {/* Hovered Point Glassmorphism Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none p-4 rounded-xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 shadow-2xl text-xs space-y-2 w-64 animate-fadeIn"
            style={{
              left: Math.min(hoveredPoint.screenX + 15, (mountRef.current?.clientWidth || 800) - 270),
              top: Math.min(hoveredPoint.screenY + 15, (mountRef.current?.clientHeight || 500) - 180),
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-100 font-mono">
                Kayıt #{hoveredPoint.index + 1}
              </span>
              {hoveredPoint.isOutlier ? (
                <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-[10px]">
                  🚨 Aykırı Değer
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-[10px]">
                  Normal Değer
                </span>
              )}
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-cyan-300">
                <span>X ({xCol}):</span>
                <span className="font-bold">{hoveredPoint.xVal}</span>
              </div>
              <div className="flex justify-between text-teal-300">
                <span>Y ({yCol}):</span>
                <span className="font-bold">{hoveredPoint.yVal}</span>
              </div>
              <div className="flex justify-between text-purple-300">
                <span>Z ({zCol}):</span>
                <span className="font-bold">{hoveredPoint.zVal}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
