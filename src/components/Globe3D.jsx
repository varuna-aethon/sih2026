import React, { useRef, useEffect, useState, useCallback } from 'react';
import { geoMercator, geoPath, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';
import land110m from 'world-atlas/land-110m.json';
import { 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Target, 
  Radio, 
  Layers, 
  Maximize2, 
  Minimize2,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { ANOMALY_POINTS } from '../data/anomalies';

// Pan-India Central Geographic Anchor (Near Vidarbha centroid)
const INDIA_CENTER = [82.0, 22.0];
const RADAR_STATION_COORDS = [79.08, 21.15];

export default function Globe3D({ 
  points = [], 
  activeAnomalyId, 
  onSelectAnomaly, 
  lastSynced = '--:--:-- IST',
  onFilterEvents,
  onNavigateTrack
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const activePoints = points && points.length > 0 ? points : ANOMALY_POINTS;

  // Regional Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [radarSweepActive, setRadarSweepActive] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showEventsPopover, setShowEventsPopover] = useState(false);

  // References for render loop
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;
  const panOffsetRef = useRef(panOffset);
  panOffsetRef.current = panOffset;

  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  
  const pulseRef = useRef(0);
  const sweepAngleRef = useRef(0);
  const projectedPointsRef = useRef([]);
  const lastDataChangeTimeRef = useRef(0);

  // Trigger subtle 300ms ease animation on markers when live data updates
  useEffect(() => {
    lastDataChangeTimeRef.current = performance.now();
  }, [points]);

  // Escape key listener for exiting fullscreen mode
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Pre-process TopoJSON to GeoJSON once
  const landFeatures = useRef(feature(land110m, land110m.objects.land)).current;
  const graticule = useRef(geoGraticule().step([5, 5]).extent([[35, -15], [130, 50]])).current;

  // Auto-pan / center to selected station if requested
  useEffect(() => {
    if (!activeAnomalyId) return;
    const pt = activePoints.find(p => p.id === activeAnomalyId);
    if (pt && pt.coords) {
      const deltaLon = (pt.coords[0] - INDIA_CENTER[0]) * 15 * zoomLevelRef.current;
      const deltaLat = -(pt.coords[1] - INDIA_CENTER[1]) * 15 * zoomLevelRef.current;
      setPanOffset({ x: -deltaLon * 0.4, y: -deltaLat * 0.4 });
    }
  }, [activeAnomalyId, activePoints]);

  // Main 60FPS High-DPI Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      pulseRef.current = (pulseRef.current + 0.04) % (Math.PI * 2);
      if (radarSweepActive) {
        sweepAngleRef.current = (sweepAngleRef.current + 0.018) % (Math.PI * 2);
      }

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 1. Projection Setup: India & surrounding ocean basins fill canvas comfortably edge-to-edge
      const scaleByH = height * 1.68;
      const scaleByW = width * 0.90;
      // In wide panels, subcontinent and surrounding oceans (Arabian Sea, Bay of Bengal) scale comfortably to fill panel
      const responsiveScale = Math.max(scaleByH, Math.min(scaleByW, scaleByH * 1.45));
      const baseScale = responsiveScale * zoomLevelRef.current;
      const centerX = width / 2 + panOffsetRef.current.x;
      const centerY = height / 2 + panOffsetRef.current.y;

      const projection = geoMercator()
        .center(INDIA_CENTER)
        .translate([centerX, centerY])
        .scale(baseScale);

      const path = geoPath(projection, ctx);

      // 2. Background: Deep Navy Oceanic & Atmosphere Base
      ctx.fillStyle = '#0a0e14';
      ctx.fillRect(0, 0, width, height);

      // 3. Radar Grid Origin (Central India Radar Hub)
      const radarCenter = projection(RADAR_STATION_COORDS);
      if (radarCenter) {
        const [rx, ry] = radarCenter;
        const ringDistances = [75, 150, 225, 300, 420, 560, 720, 920, 1200].map(d => d * zoomLevelRef.current);
        const ringLabels = ['250 KM', '500 KM', '750 KM', '1000 KM', '1500 KM', '2000 KM', '2500 KM', '3200 KM', '4000 KM'];

        ringDistances.forEach((r, idx) => {
          ctx.beginPath();
          ctx.arc(rx, ry, r, 0, Math.PI * 2);
          ctx.strokeStyle = idx % 2 === 1 ? 'rgba(74, 111, 165, 0.18)' : 'rgba(74, 111, 165, 0.08)';
          ctx.lineWidth = idx % 2 === 1 ? 0.9 : 0.6;
          ctx.setLineDash(idx % 2 === 0 ? [3, 4] : []);
          ctx.stroke();
          ctx.setLineDash([]);

          if (rx + r < width - 10 && rx + r > 0) {
            ctx.font = '8px "IBM Plex Mono", monospace';
            ctx.fillStyle = 'rgba(139, 149, 165, 0.40)';
            ctx.fillText(ringLabels[idx] || `${Math.round(r * 3.3)} KM`, rx + r + 3, ry - 2);
          }
        });

        // Cardinal Crosshairs spanning entire canvas
        ctx.beginPath();
        ctx.moveTo(0, ry);
        ctx.lineTo(width, ry);
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx, height);
        ctx.strokeStyle = 'rgba(74, 111, 165, 0.12)';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Rotating Phosphor Radar Sweep Line spanning full canvas diagonal
        if (radarSweepActive) {
          const sweepLen = Math.max(width, height) * 1.25;
          const sweepX = rx + sweepLen * Math.cos(sweepAngleRef.current);
          const sweepY = ry + sweepLen * Math.sin(sweepAngleRef.current);

          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(sweepX, sweepY);
          ctx.strokeStyle = 'rgba(74, 111, 165, 0.32)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.arc(rx, ry, sweepLen, sweepAngleRef.current - 0.18, sweepAngleRef.current);
          ctx.closePath();
          ctx.fillStyle = 'rgba(74, 111, 165, 0.03)';
          ctx.fill();
        }
      }

      // 4. Draw Graticule Lines (5° Lat/Long grid)
      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = 'rgba(42, 58, 80, 0.32)';
      ctx.lineWidth = 0.55;
      ctx.stroke();

      // 5. Draw Landmasses (Dark desaturated topography with soft feathered edge)
      ctx.save();
      ctx.shadowColor = 'rgba(56, 189, 248, 0.25)';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      path(landFeatures);
      ctx.fillStyle = '#141d28';
      ctx.fill();
      ctx.restore();

      // Soft feathered coastline outlines
      ctx.beginPath();
      path(landFeatures);
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.20)';
      ctx.stroke();

      ctx.beginPath();
      path(landFeatures);
      ctx.lineWidth = 0.85;
      ctx.strokeStyle = '#2d425b';
      ctx.stroke();

      // 6. Draw Indian Maritime Focus Boundary (subtle dashed line)
      const eezPoints = [
        [68.5, 23.5], [68.0, 20.0], [71.5, 15.0], [75.0, 8.0], 
        [77.5, 5.5], [82.0, 7.5], [88.0, 12.0], [92.5, 14.0], 
        [94.0, 20.0], [89.0, 21.5]
      ];
      ctx.beginPath();
      const firstEEZ = projection(eezPoints[0]);
      if (firstEEZ) {
        ctx.moveTo(firstEEZ[0], firstEEZ[1]);
        eezPoints.slice(1).forEach(pt => {
          const pos = projection(pt);
          if (pos) ctx.lineTo(pos[0], pos[1]);
        });
        ctx.strokeStyle = 'rgba(74, 111, 165, 0.22)';
        ctx.lineWidth = 0.75;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 7. Draw Historic / EONET Storm & Cyclone Trajectory Tracks if available
      activePoints.forEach(pt => {
        // Case A: 13-step Trajectory for Cyclone Amphan or selected historic event
        if (pt.trajectorySteps && pt.trajectorySteps.length > 1 && (pt.isFlagship || pt.id === activeAnomalyId)) {
          const steps = pt.trajectorySteps;
          
          // Draw Model Track (Dashed white line)
          ctx.beginPath();
          const startPt = projection(steps[0].modelCoords);
          if (startPt) {
            ctx.moveTo(startPt[0], startPt[1]);
            steps.slice(1).forEach(s => {
              const p = projection(s.modelCoords);
              if (p) ctx.lineTo(p[0], p[1]);
            });
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Draw NOAA IBTrACS Ground Truth (Thin gray dotted line)
          ctx.beginPath();
          const startIb = projection(steps[0].ibtracsCoords);
          if (startIb) {
            ctx.moveTo(startIb[0], startIb[1]);
            steps.slice(1).forEach(s => {
              const p = projection(s.ibtracsCoords);
              if (p) ctx.lineTo(p[0], p[1]);
            });
            ctx.strokeStyle = 'rgba(156, 163, 175, 0.50)';
            ctx.lineWidth = 1.0;
            ctx.setLineDash([2, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Waypoint dots
          steps.forEach(s => {
            const p = projection(s.modelCoords);
            if (p) {
              ctx.beginPath();
              ctx.arc(p[0], p[1], s.severity === 'CATASTROPHIC' ? 3.5 : 2.5, 0, Math.PI * 2);
              ctx.fillStyle = s.color || '#dc2626';
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          });
        }

        // Case B: NASA EONET Trajectory
        if (pt.isEonet && pt.trajectory && pt.trajectory.length > 1) {
          ctx.beginPath();
          const startPt = projection(pt.trajectory[0].coords);
          if (startPt) {
            ctx.moveTo(startPt[0], startPt[1]);
            pt.trajectory.slice(1).forEach(tp => {
              const p = projection(tp.coords);
              if (p) ctx.lineTo(p[0], p[1]);
            });
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
            ctx.lineWidth = 1.25;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Trajectory waypoint dots
            pt.trajectory.forEach(tp => {
              const p = projection(tp.coords);
              if (p) {
                ctx.beginPath();
                ctx.arc(p[0], p[1], 2.2, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
              }
            });
          }
        }
      });

      // 8. 5km Impact Zone Circle around Selected Station
      const selectedItem = activePoints.find(p => p.id === activeAnomalyId);
      if (selectedItem && selectedItem.coords) {
        const centerPos = projection(selectedItem.coords);
        // ~5km = 0.045 deg latitude offset
        const edgePos = projection([selectedItem.coords[0], selectedItem.coords[1] + 0.045]);
        if (centerPos && edgePos) {
          const r5km = Math.max(7, Math.abs(edgePos[1] - centerPos[1]));
          
          ctx.beginPath();
          ctx.arc(centerPos[0], centerPos[1], r5km, 0, Math.PI * 2);
          ctx.fillStyle = selectedItem.severity === 'SEVERE' 
            ? 'rgba(239, 68, 68, 0.12)' 
            : (selectedItem.severity === 'MODERATE' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(74, 111, 165, 0.10)');
          ctx.fill();
          
          ctx.strokeStyle = selectedItem.color || 'var(--accent-slate)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = '8px "IBM Plex Mono", monospace';
          ctx.fillStyle = 'rgba(139, 149, 165, 0.75)';
          ctx.fillText('5km IMPACT ZONE', centerPos[0] + r5km + 4, centerPos[1] + 3);
        }
      }

      // 9. Project & Draw Station Markers + NASA EONET events
      const pulse = (Math.sin(pulseRef.current) + 1) / 2;
      const elapsedSinceData = performance.now() - lastDataChangeTimeRef.current;
      const isDataPulseActive = elapsedSinceData < 350;
      const dataEase = isDataPulseActive ? Math.sin((elapsedSinceData / 350) * Math.PI) * 1.5 : 0;

      // Project all active points to screen space
      const renderedPoints = [];
      activePoints.forEach((pt) => {
        if (!pt.coords) return;
        const screenPos = projection(pt.coords);
        if (!screenPos) return;

        const [x, y] = screenPos;
        const isSelected = activeAnomalyId === pt.id;
        const isHovered = hoveredPoint?.id === pt.id;

        renderedPoints.push({ pt, x, y, isSelected, isHovered });
      });

      // PASS 1: Render All Station/Event Node Markers (Halos, dots, reticles, NASA diamonds)
      renderedPoints.forEach(({ pt, x, y, isSelected, isHovered }) => {
        // CASE A: NASA EONET Hazard Event (Red Pulsing Diamond)
        if (pt.isEonet) {
          ctx.save();
          ctx.translate(x, y);

          ctx.beginPath();
          const dSize = 7 + pulse * 3;
          ctx.moveTo(0, -dSize);
          ctx.lineTo(dSize, 0);
          ctx.lineTo(0, dSize);
          ctx.lineTo(-dSize, 0);
          ctx.closePath();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(0, -4.5);
          ctx.lineTo(4.5, 0);
          ctx.lineTo(0, 4.5);
          ctx.lineTo(-4.5, 0);
          ctx.closePath();
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.restore();
          return;
        }

        // CASE B: Meteorological Grid Station Marker
        let dotColor = '#388e3c';
        let haloColor = 'rgba(56, 142, 60, 0.25)';
        if (pt.severity === 'CATASTROPHIC') {
          dotColor = '#dc2626';
          haloColor = 'rgba(220, 38, 38, 0.60)';
        } else if (pt.severity === 'SEVERE') {
          dotColor = '#ef4444';
          haloColor = 'rgba(239, 68, 68, 0.45)';
        } else if (pt.severity === 'MODERATE') {
          dotColor = '#f59e0b';
          haloColor = 'rgba(245, 158, 11, 0.35)';
        } else if (pt.severity === 'LOW') {
          dotColor = '#60a5fa';
          haloColor = 'rgba(96, 165, 250, 0.25)';
        }

        // Halo ring on severe/catastrophic stations, hovered, or selected
        if (pt.severity === 'CATASTROPHIC' || pt.severity === 'SEVERE' || isHovered || isSelected) {
          ctx.beginPath();
          const haloR = (isSelected ? 9 : (pt.severity === 'CATASTROPHIC' ? 8 : 6)) + pulse * (pt.severity === 'CATASTROPHIC' ? 4 : 3);
          ctx.arc(x, y, haloR, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? '#ffffff' : haloColor;
          ctx.lineWidth = isSelected ? 1.25 : (pt.severity === 'CATASTROPHIC' ? 1.5 : 1);
          ctx.stroke();

          // Second pulsing warning ring for CATASTROPHIC flagship events
          if (pt.severity === 'CATASTROPHIC') {
            ctx.beginPath();
            ctx.arc(x, y, 14 + pulse * 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(220, 38, 38, 0.35)';
            ctx.lineWidth = 0.8;
            ctx.setLineDash([2, 2]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Station Center Node
        ctx.beginPath();
        const baseRadius = (isSelected ? 5.5 : (pt.severity === 'CATASTROPHIC' ? 5.0 : (pt.severity === 'SEVERE' ? 4.5 : (pt.severity === 'MODERATE' ? 3.5 : 3.0)))) + dataEase;
        ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
        ctx.lineWidth = isSelected ? 1.5 : 0.8;
        ctx.strokeStyle = isSelected ? '#ffffff' : '#111827';
        ctx.stroke();

        // Selected station larger reticle ring
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(x, y, 11, 0, Math.PI * 2);
          ctx.strokeStyle = 'var(--accent-slate)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // PASS 2: PRIORITY-BASED DYNAMIC LABEL COLLISION RESOLUTION ENGINE
      // Priority scoring: Selected/Hovered > CATASTROPHIC / Flagship > SEVERE / EONET > MODERATE > LOW > NORMAL
      const getPriorityScore = (item) => {
        if (item.isSelected) return 1000;
        if (item.isHovered) return 900;
        if (item.pt.severity === 'CATASTROPHIC' || item.pt.isFlagship) return 800;
        if (item.pt.severity === 'SEVERE' || item.pt.isEonet) return 700;
        if (item.pt.severity === 'MODERATE') return 400;
        if (item.pt.severity === 'LOW') return 200;
        return 100;
      };

      const sortedForLabels = [...renderedPoints].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));

      const placedBoxes = []; // Placed bounding boxes: { x1, y1, x2, y2 }
      const placedLabelsMap = new Map(); // stationId -> bounding box

      const doBoxesOverlap = (b1, b2, padding = 4) => {
        return !(
          b1.x2 + padding < b2.x1 ||
          b1.x1 - padding > b2.x2 ||
          b1.y2 + padding < b2.y1 ||
          b1.y1 - padding > b2.y2
        );
      };

      const currentZoom = zoomLevelRef.current;

      sortedForLabels.forEach((item) => {
        const { pt, x, y, isSelected, isHovered } = item;
        const isCatastrophic = pt.severity === 'CATASTROPHIC' || pt.isFlagship;
        const isSevere = pt.severity === 'SEVERE' || pt.isEonet;
        const isHighPriority = isSelected || isHovered || isCatastrophic || isSevere;

        // Dynamic visibility threshold based on zoom level:
        // - High priority (CATASTROPHIC/SEVERE/selected/hovered) labels are ALWAYS evaluated.
        // - At base zoom (<= 1.15x): Normal baseline nodes collapse into just the colored dot to prevent clutter.
        // - At medium zoom (1.15x - 1.7x): MODERATE nodes become eligible if space permits.
        // - At higher zoom (> 1.7x): LOW and NORMAL nodes become eligible if space permits.
        // - Hovering or clicking ANY node immediately reveals its full label badge.
        let isEligible = isHighPriority;
        if (!isEligible) {
          if (currentZoom >= 1.7) {
            isEligible = true;
          } else if (currentZoom >= 1.15 && pt.severity === 'MODERATE') {
            isEligible = true;
          }
        }

        if (!isEligible) return;

        const labelText = pt.isEonet ? `[EONET] ${pt.name}` : (pt.name || pt.id);
        ctx.font = (isSelected || isHovered || isCatastrophic)
          ? '600 9px "IBM Plex Mono", monospace'
          : '500 8.5px "IBM Plex Mono", monospace';

        const metrics = ctx.measureText(labelText);
        const padX = 4;
        const boxW = Math.ceil(metrics.width + padX * 2);
        const boxH = 14;

        // Candidate placement offsets relative to node (x, y)
        const candidateOffsets = [
          // Standard close offsets
          { dx: 9, dy: -8, leader: false },
          { dx: 9, dy: 7, leader: false },
          { dx: -boxW - 9, dy: -8, leader: false },
          { dx: -boxW - 9, dy: 7, leader: false },
          // Offset callouts with connecting leader lines
          { dx: -Math.floor(boxW / 2), dy: -24, leader: true },
          { dx: -Math.floor(boxW / 2), dy: 18, leader: true },
          { dx: 22, dy: -7, leader: true },
          { dx: -boxW - 22, dy: -7, leader: true },
          { dx: 18, dy: -22, leader: true },
          { dx: -boxW - 18, dy: -22, leader: true }
        ];

        // Specific regional refinements for adjacent clusters
        if (pt.id === 'STN-MUM') {
          // Mumbai: prioritize placing Northeast inland so it never clips off western coastline
          candidateOffsets.unshift({ dx: 12, dy: -12, leader: false });
        } else if (pt.id === 'STN-PUN') {
          // Pune: prioritize Southeast
          candidateOffsets.unshift({ dx: 10, dy: 9, leader: false });
        } else if (pt.id === 'STN-BLR') {
          // Bengaluru: prioritize West
          candidateOffsets.unshift({ dx: -boxW - 10, dy: -6, leader: false });
        } else if (pt.id === 'STN-CHE') {
          // Chennai: prioritize East
          candidateOffsets.unshift({ dx: 10, dy: 8, leader: false });
        } else if (pt.id === 'STN-HYD') {
          // Hyderabad: prioritize Northwest
          candidateOffsets.unshift({ dx: -boxW - 10, dy: -10, leader: false });
        }

        let chosenBox = null;

        for (const cand of candidateOffsets) {
          const bx1 = x + cand.dx;
          const by1 = y + cand.dy;
          const bx2 = bx1 + boxW;
          const by2 = by1 + boxH;

          // Panel boundary check (preserve internal padding)
          if (bx1 < 8 || bx2 > width - 8 || by1 < 28 || by2 > height - 10) {
            continue;
          }

          const boxCandidate = { x1: bx1, y1: by1, x2: bx2, y2: by2, leader: cand.leader };
          const collides = placedBoxes.some(placed => doBoxesOverlap(boxCandidate, placed));

          if (!collides) {
            chosenBox = boxCandidate;
            break;
          }
        }

        // If no collision-free standard offset found:
        if (!chosenBox) {
          if (isHighPriority) {
            // High-priority events MUST remain visible: render callout with leader line at safe boundary
            const bx1 = Math.max(8, Math.min(width - boxW - 8, x - Math.floor(boxW / 2)));
            const by1 = Math.max(28, Math.min(height - boxH - 12, y > height / 2 ? y - 26 : y + 18));
            chosenBox = { x1: bx1, y1: by1, x2: bx1 + boxW, y2: by1 + boxH, leader: true };
          } else {
            // Lower-priority nodes (NORMAL/LOW): collapse cleanly into just the dot when tight
            return;
          }
        }

        // Register placed box
        placedBoxes.push(chosenBox);
        placedLabelsMap.set(pt.id, chosenBox);

        // Draw connecting leader line if callout offset is used
        if (chosenBox.leader) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          const targetX = Math.max(chosenBox.x1, Math.min(chosenBox.x2, x));
          const targetY = y < chosenBox.y1 ? chosenBox.y1 : chosenBox.y2;
          ctx.lineTo(targetX, targetY);
          ctx.strokeStyle = isSelected 
            ? 'rgba(255, 255, 255, 0.75)' 
            : (isCatastrophic ? 'rgba(239, 68, 68, 0.75)' : (isSevere ? 'rgba(239, 68, 68, 0.50)' : 'rgba(74, 111, 165, 0.45)'));
          ctx.lineWidth = isSelected || isCatastrophic ? 1.0 : 0.7;
          ctx.stroke();
        }

        // Draw Label Background Box
        ctx.fillStyle = 'rgba(10, 14, 20, 0.94)';
        ctx.fillRect(chosenBox.x1, chosenBox.y1, boxW, boxH);

        ctx.strokeStyle = isSelected 
          ? 'var(--accent-slate)' 
          : (isCatastrophic ? '#dc2626' : (isSevere ? '#ef4444' : '#2a3441'));
        ctx.lineWidth = isSelected || isCatastrophic ? 1.2 : 0.75;
        ctx.strokeRect(chosenBox.x1, chosenBox.y1, boxW, boxH);

        // Draw Label Text
        ctx.fillStyle = isSelected 
          ? '#ffffff' 
          : (isCatastrophic ? '#fca5a5' : (isSevere ? '#fecaca' : '#e5e7eb'));
        ctx.fillText(labelText, chosenBox.x1 + padX, chosenBox.y1 + 10);
      });

      // Update projectedPointsRef for hit testing (mouse hover & click)
      projectedPointsRef.current = renderedPoints.map(({ pt, x, y }) => ({
        id: pt.id,
        x,
        y,
        pt,
        box: placedLabelsMap.get(pt.id) || null
      }));

      // 10. Vignette Edge Pass: Soft peripheral gradient edge fade (preserves edge-to-edge cartography)
      const vigRadius1 = Math.hypot(width, height) * 0.45;
      const vigRadius2 = Math.hypot(width, height) * 0.65;
      const vigGrad = ctx.createRadialGradient(
        width / 2, height / 2, vigRadius1,
        width / 2, height / 2, vigRadius2
      );
      vigGrad.addColorStop(0, 'rgba(10, 14, 20, 0)');
      vigGrad.addColorStop(0.70, 'rgba(10, 14, 20, 0.20)');
      vigGrad.addColorStop(1, 'rgba(10, 14, 20, 0.85)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [radarSweepActive, activeAnomalyId, activePoints, hoveredPoint]);

  // Mouse Handlers for Zoom & Pan
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoomLevel(prev => Math.min(3.5, Math.max(0.75, prev * zoomFactor)));
  };

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setMousePos({ x: mouseX, y: mouseY });

      let closest = null;
      for (const item of projectedPointsRef.current) {
        const dDot = Math.hypot(item.x - mouseX, item.y - mouseY);
        let inBox = false;
        if (item.box) {
          inBox = mouseX >= item.box.x1 && mouseX <= item.box.x2 && mouseY >= item.box.y1 && mouseY <= item.box.y2;
        }
        if (dDot < 15 || inBox) {
          closest = item.pt;
          break;
        }
      }
      setHoveredPoint(closest);
    }
  };

  const handleMouseUp = (e) => {
    isDraggingRef.current = false;
    const moveDist = Math.hypot(e.clientX - dragStartPosRef.current.x, e.clientY - dragStartPosRef.current.y);
    if (moveDist < 6 && onSelectAnomaly && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let closestPt = null;
      let minDistance = 20;

      projectedPointsRef.current.forEach(item => {
        let inBox = false;
        if (item.box) {
          inBox = clickX >= item.box.x1 && clickX <= item.box.x2 && clickY >= item.box.y1 && clickY <= item.box.y2;
        }
        if (inBox) {
          closestPt = item;
          minDistance = 0;
        } else {
          const d = Math.hypot(item.x - clickX, item.y - clickY);
          if (d < minDistance) {
            minDistance = d;
            closestPt = item;
          }
        }
      });

      if (closestPt) {
        onSelectAnomaly(closestPt.id);
      }
    }
  };

  const handleResetFocus = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  // Active Extreme Weather Events (Seeded Historic + Live EONET)
  const eventsList = activePoints.filter(p => p.isHistoricEvent || p.isEonet || p.severity === 'CATASTROPHIC' || p.severity === 'SEVERE' || p.severity === 'MODERATE');

  return (
    <div className={`globe-component-wrapper ${isFullscreen ? 'fullscreen-mode' : ''}`} ref={containerRef}>
      
      {/* Fullscreen Persistent Top Header */}
      {isFullscreen && (
        <div className="globe-fullscreen-header mono">
          <div className="fs-header-left">
            <span className="fs-badge">FULLSCREEN ACTIVE</span>
            <span className="fs-title">VARUNA // PAN-INDIA MONITORING MESH</span>
            <span className="telemetry-pill">
              <span className="status-dot"></span>
              LIVE UPLINK: {activePoints.length} NODES
            </span>
            <span className="fs-synced">SYNCED: {lastSynced}</span>
          </div>
          <div className="fs-header-right">
            <button 
              type="button"
              className="fs-exit-btn mono"
              onClick={() => setIsFullscreen(false)}
              title="Exit Fullscreen Mode (or press Esc)"
            >
              <Minimize2 size={12} />
              <span>EXIT FULLSCREEN [ESC]</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Header on EXACTLY ONE Line */}
      <div className="globe-overlay-top mono">
        <div className="projection-tag">
          <Compass size={11} color="var(--accent-slate)" />
          <span>PROJECTION: CONFORMAL REGIONAL MESH</span>
          <span 
            className="globe-info-tooltip-trigger" 
            title="Focus: Pan-India Meteorological Observation Grid [6°N–37°N, 68°E–97°E] · Calibrated on Conformal Mercator Mesh"
          >
            <Info size={11} color="var(--text-secondary)" />
          </span>
        </div>
        <div className="globe-coords-tag">
          ZOOM {zoomLevel.toFixed(1)}x · NODES {activePoints.length}
        </div>
      </div>

      {/* Main Canvas Box */}
      <div 
        className="globe-canvas-box regional-map-box"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isDraggingRef.current = false; setHoveredPoint(null); }}
        title="Scroll to zoom · Click-drag to pan · Click any station to inspect telemetry"
      >
        <canvas ref={canvasRef} className="globe-canvas" />

        {/* Dedicated Edge Vignette Overlay */}
        <div className="map-edge-vignette" />

        {/* Clean Floating Hover Tooltip (replaces large intrusive on-map HUD) */}
        {hoveredPoint && (
          <div 
            className="globe-hover-tooltip mono"
            style={{ 
              left: `${Math.min(window.innerWidth - 180, mousePos.x + 12)}px`, 
              top: `${Math.max(10, mousePos.y - 30)}px` 
            }}
          >
            <div className="tooltip-line1">
              <span className="tooltip-name">{hoveredPoint.name}</span>
              <span className={`tooltip-badge badge-${(hoveredPoint.severity || 'normal').toLowerCase()}`}>
                {hoveredPoint.severity || 'NORMAL'}
              </span>
            </div>
            <div className="tooltip-line2">
              <span>{hoveredPoint.currentTemp ?? '—'}°C</span>
              {hoveredPoint.tempDelta !== undefined && (
                <span style={{ color: hoveredPoint.tempDelta >= 0 ? '#fbbf24' : '#60a5fa' }}>
                  ({hoveredPoint.tempDelta >= 0 ? '+' : ''}{hoveredPoint.tempDelta}°C)
                </span>
              )}
              <span className="tooltip-type">{hoveredPoint.anomalyType || hoveredPoint.type}</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Controls Bar: Bottom-Left (Legend + Events) & Bottom-Right (Tools) */}
      <div className="globe-controls-bar mono">
        
        {/* Bottom-Left: Collapsible Legend & Events Popover */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          
          {/* Collapsible Legend Chip */}
          <div className="legend-chip-container">
            <button 
              type="button" 
              className="globe-tool-btn"
              onClick={() => setShowLegend(!showLegend)}
              title="Toggle severity color legend"
            >
              <Layers size={11} />
              <span>LEGEND</span>
              {showLegend ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>

            {showLegend && (
              <div className="map-legend-dropdown mono">
                <div className="legend-row"><span className="legend-dot" style={{ background: '#dc2626' }}></span><span>CATASTROPHIC (Extreme Alert)</span></div>
                <div className="legend-row"><span className="legend-dot dot-severe"></span><span>SEVERE (Multi-parameter / Heat / Cloudburst)</span></div>
                <div className="legend-row"><span className="legend-dot dot-moderate"></span><span>MODERATE (|Δ| ≥ 5°C / Orographic)</span></div>
                <div className="legend-row"><span className="legend-dot dot-low"></span><span>LOW (|Δ| ≥ 3°C)</span></div>
                <div className="legend-row"><span className="legend-dot dot-normal"></span><span>NORMAL (Nominal Envelope)</span></div>
                <div className="legend-row"><span className="legend-line" style={{ display: 'inline-block', width: '12px', borderBottom: '2px dashed #ffffff', marginRight: '6px' }}></span><span>4D GNN TRAJECTORY</span></div>
                <div className="legend-row"><span className="legend-line" style={{ display: 'inline-block', width: '12px', borderBottom: '2px dotted #9ca3af', marginRight: '6px' }}></span><span>NOAA IBTrACS GROUND TRUTH</span></div>
              </div>
            )}
          </div>

          {/* EVENTS Popover & Filter Trigger */}
          <div className="events-chip-container">
            <button 
              type="button" 
              className={`globe-tool-btn ${eventsList.length > 0 ? 'active-tool' : ''}`}
              onClick={() => {
                if (onFilterEvents) onFilterEvents();
                setShowEventsPopover(!showEventsPopover);
              }}
              title="Filter node list to active extreme weather events & view catalog"
            >
              <AlertTriangle size={11} color={eventsList.length > 0 ? '#ef4444' : 'var(--text-secondary)'} />
              <span>EVENTS ({eventsList.length})</span>
            </button>

            {showEventsPopover && (
              <div className="map-events-dropdown mono">
                <div className="events-dropdown-header">
                  <span>ACTIVE EXTREME WEATHER CASES ({eventsList.length})</span>
                  <button type="button" onClick={() => setShowEventsPopover(false)}><X size={10} /></button>
                </div>
                {eventsList.length === 0 ? (
                  <div className="events-empty-msg">No active severe storm cyclones in North Indian Ocean basin.</div>
                ) : (
                  eventsList.map(ev => (
                    <div 
                      key={ev.id} 
                      className="event-popover-item"
                      onClick={() => { 
                        onSelectAnomaly(ev.id); 
                        setShowEventsPopover(false); 
                      }}
                    >
                      <div className="ev-name" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{ev.systemName || ev.name}</span>
                        <span className={`badge-pill badge-${ev.severity?.toLowerCase()}`}>{ev.severity}</span>
                      </div>
                      <div className="ev-meta">
                        {ev.type || ev.anomalyType} · {ev.eventDate || 'Real-time telemetry'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>

        {/* Bottom-Right: Compact Tools Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            className="globe-tool-btn"
            onClick={handleResetFocus}
            title="Reset to full India-bounded view"
          >
            <Target size={11} />
            <span>RESET</span>
          </button>

          <button
            type="button"
            className="globe-tool-btn"
            onClick={() => setRadarSweepActive(!radarSweepActive)}
            title="Toggle background radar sweep rotation"
          >
            <Radio size={11} className={radarSweepActive ? 'radar-pulse-icon' : ''} />
            <span>{radarSweepActive ? 'RADAR' : 'PAUSED'}</span>
          </button>

          <button
            type="button"
            className={`globe-tool-btn ${isFullscreen ? 'active-tool' : ''}`}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand Map Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
            <span>{isFullscreen ? 'EXIT' : 'EXPAND'}</span>
          </button>

          <button
            type="button"
            className="globe-tool-btn icon-only"
            onClick={() => setZoomLevel(prev => Math.min(3.5, prev + 0.25))}
            title="Zoom In (+)"
          >
            <ZoomIn size={11} />
          </button>
          
          <button
            type="button"
            className="globe-tool-btn icon-only"
            onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
            title="Zoom Out (-)"
          >
            <ZoomOut size={11} />
          </button>
        </div>

      </div>

    </div>
  );
}
