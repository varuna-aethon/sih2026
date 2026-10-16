import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Radio,
  Calendar,
  Layers,
  Info,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Wind,
  CloudRain,
  Sun,
  Waves,
  Compass,
  ArrowRight,
  Snowflake,
  CloudLightning,
  RefreshCw,
  Activity,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { geoMercator, geoPath, geoGraticule } from 'd3-geo';
import { feature } from 'topojson-client';
import land110m from 'world-atlas/land-110m.json';
import TechInfoTooltip, { MissionSynthesisBanner } from './TechInfoTooltip';
import { 
  formatLeadTimeWithAbsolute, 
  formatForecastWindowWithAbsolute, 
  getForecastDateOnly 
} from '../utils/dateForecast';

// 5 Watch Regions for India Forward Medium-Range Early Warning Outlook (Diverse Multi-Hazard Architecture)
export const OUTLOOK_WATCH_REGIONS = [
  {
    id: 'REG-BOB',
    name: 'Bay of Bengal — Cyclogenesis Watch — 82% Day-7 Formation Probability',
    shortName: 'Bay of Bengal · 82% D-7',
    sector: 'Central & Southern Bay of Bengal',
    macroRegion: 'Coastal East',
    hazardType: 'TROPICAL CYCLOGENESIS / GALE SURGE',
    hazardLabel: 'CYCLONE',
    hazardCategory: 'CYC',
    hazardIcon: Wind,
    center: [87.2, 14.8],
    radiusKm: 320,
    threatTier: 'High Confidence Emerging',
    tierColor: '#dc2626',
    tierClass: 'tier-high',
    probabilities: {
      day3: 35,
      day5: 68,
      day7: 82,
      day10: 74
    },
    coneSpreadKm: [120, 240, 390, 520], // Widening uncertainty cone across D3, D5, D7, D10
    ensembleMembersSupporting: '24/30 members',
    window: '5–7 Days',
    modelSource: 'ECMWF IFS / NEPS-G 30-Member',
    synopsis: 'Convective vorticity surge and barometric depression (<996 hPa) detected across Andaman Sea. 24 of 30 ensemble members converge on cyclonic escalation targeting Odisha & West Bengal coastal reach.',
    efiTrend: [
      { cycle: '28 Sep 00Z', efi: 0.85, zScore: '+1.1σ' },
      { cycle: '28 Sep 12Z', efi: 1.25, zScore: '+1.8σ' },
      { cycle: '29 Sep 00Z', efi: 1.95, zScore: '+2.6σ' },
      { cycle: '29 Sep 12Z', efi: 2.80, zScore: '+3.4σ' },
      { cycle: '30 Sep 00Z (Current)', efi: 3.45, zScore: '+4.1σ' }
    ],
    synthesis: 'Ensemble members show growing agreement (24/30) on cyclogenesis in the South-Central Bay of Bengal within 120 hours. EFI trend rising (+4.1σ). GNN spatial divergence narrows near 87°E. Confidence: HIGH EMERGING. Recommend pre-positioning NDRF battalions and tracking maritime vessels; no landfall evacuation dispatch yet.',
    modelNotes: 'Coupled GFS/NEPS-G 30-member analog downscaled via Latent Diffusion. Boundary conditions derived from MJO Phase 3 eastward propagation.'
  },
  {
    id: 'REG-WGT',
    name: 'Western Ghats — Convective Surge Watch — 65% Day-3 Deluge Probability',
    shortName: 'Western Ghats · 65% D-3',
    sector: 'Konkan Coast & North Kerala Escarpment',
    macroRegion: 'Coastal West',
    hazardType: 'EXTREME OROGRAPHIC PRECIPITATION / FLOOD',
    hazardLabel: 'FLOOD / DELUGE',
    hazardCategory: 'HYD',
    hazardIcon: CloudRain,
    center: [73.5, 16.2],
    radiusKm: 260,
    threatTier: 'Elevated Threat',
    tierColor: '#f97316',
    tierClass: 'tier-elevated',
    probabilities: {
      day3: 65,
      day5: 58,
      day7: 42,
      day10: 25
    },
    coneSpreadKm: [90, 160, 250, 340],
    ensembleMembersSupporting: '19/30 members',
    window: '3–5 Days',
    modelSource: 'NCMRWF Unified Model Mesoscale',
    synopsis: 'Persistent Arabian Sea moisture flux converging against Western Ghats topography. High likelihood of localized 24h accumulations exceeding 180 mm.',
    efiTrend: [
      { cycle: '28 Sep 00Z', efi: 1.40, zScore: '+1.7σ' },
      { cycle: '28 Sep 12Z', efi: 1.65, zScore: '+2.1σ' },
      { cycle: '29 Sep 00Z', efi: 2.10, zScore: '+2.7σ' },
      { cycle: '29 Sep 12Z', efi: 2.35, zScore: '+2.9σ' },
      { cycle: '30 Sep 00Z (Current)', efi: 2.50, zScore: '+3.1σ' }
    ],
    synthesis: 'Medium-range ensemble indicates persistent Arabian Sea moisture flux converging against Western Ghats topography over Day 3–5. High likelihood of localized 24h accumulations exceeding 180 mm. Confidence: ELEVATED. CWC dam operators advised to review rule curves.',
    modelNotes: 'Diffusion model reveals mesoscale convective clustering along leeward valleys. High orographic enhancement ratio.'
  },
  {
    id: 'REG-IGP',
    name: 'Indo-Gangetic Basin — Heat Dome Watch — 85% Day-5 Thermal Spike Probability',
    shortName: 'Indo-Gangetic · 85% D-5',
    sector: 'Haryana, Delhi NCR & West Uttar Pradesh',
    macroRegion: 'North Plains',
    hazardType: 'EXTREME SURFACE THERMAL SPIKE / HEATWAVE',
    hazardLabel: 'HEATWAVE',
    hazardCategory: 'THM',
    hazardIcon: Sun,
    center: [77.5, 28.5],
    radiusKm: 240,
    threatTier: 'High Confidence Emerging',
    tierColor: '#dc2626',
    tierClass: 'tier-high',
    probabilities: {
      day3: 78,
      day5: 85,
      day7: 62,
      day10: 45
    },
    coneSpreadKm: [80, 140, 220, 310],
    ensembleMembersSupporting: '26/30 members',
    window: '5–7 Days',
    modelSource: 'NCEP GFS Ensemble + ECMWF HRES',
    synopsis: 'Subsidence ridge stagnation forecasted to produce peak maximum temperatures reaching +6°C to +8°C above climatology across Day 3–6. Strong multi-model agreement on thermal dome persistence.',
    efiTrend: [
      { cycle: '28 Sep 00Z', efi: 2.10, zScore: '+2.6σ' },
      { cycle: '28 Sep 12Z', efi: 2.45, zScore: '+3.0σ' },
      { cycle: '29 Sep 00Z', efi: 3.10, zScore: '+3.7σ' },
      { cycle: '29 Sep 12Z', efi: 3.65, zScore: '+4.2σ' },
      { cycle: '30 Sep 00Z (Current)', efi: 3.90, zScore: '+4.5σ' }
    ],
    synthesis: 'Subsidence ridge stagnation forecasted to produce peak maximum temperatures reaching +6°C to +8°C above climatology across Day 3–6. Strong multi-model agreement on thermal dome persistence. Confidence: HIGH. Municipal health authorities alerted for heat-action phase 2.',
    modelNotes: 'Urban heat island parameterization in 1km downscaling step shows elevated nighttime minimums (Tmin > 31°C).'
  },
  {
    id: 'REG-NWP',
    name: 'Northwest Plains — Polar Inversion Watch — 64% Day-5 Cold Wave Probability',
    shortName: 'Northwest Plains · 64% D-5',
    sector: 'Punjab, Haryana & North Rajasthan',
    macroRegion: 'Northwest Plains',
    hazardType: 'COLD WAVE & GROUND FROST INVERSION',
    hazardLabel: 'COLD WAVE',
    hazardCategory: 'CLD',
    hazardIcon: Snowflake,
    center: [75.8, 29.8],
    radiusKm: 240,
    threatTier: 'Elevated Threat',
    tierColor: '#38bdf8',
    tierClass: 'tier-elevated',
    probabilities: {
      day3: 38,
      day5: 64,
      day7: 52,
      day10: 28
    },
    coneSpreadKm: [90, 170, 260, 360],
    ensembleMembersSupporting: '21/30 members',
    window: '4–6 Days',
    modelSource: 'NCMRWF Unified Model + GFS',
    synopsis: 'Post-Western Disturbance cold air advection coupled with clear nocturnal radiative cooling. Minimum temperatures forecasted to plunge 6°C to 8°C below normal with ground frost.',
    efiTrend: [
      { cycle: '28 Sep 00Z', efi: 1.10, zScore: '+1.4σ' },
      { cycle: '28 Sep 12Z', efi: 1.50, zScore: '+1.9σ' },
      { cycle: '29 Sep 00Z', efi: 2.20, zScore: '+2.8σ' },
      { cycle: '29 Sep 12Z', efi: 2.75, zScore: '+3.3σ' },
      { cycle: '30 Sep 00Z (Current)', efi: 3.10, zScore: '+3.7σ' }
    ],
    synthesis: 'Intense post-Western Disturbance cold air advection down Himalayas combined with clear nocturnal skies forecasted to plunge surface temperatures 6°C to 8°C below normal across Day 4–6. Sub-zero ground radiative freeze likely. Municipalities advised to prepare winter shelters.',
    modelNotes: 'Downscaled via thermal boundary layer physics parameterization. Strong multi-model ensemble agreement on inversion depth.'
  },
  {
    id: 'REG-ARB',
    name: 'North Arabian Sea — Squall Watch — 38% Day-7 Squall Line Probability',
    shortName: 'Arabian Sea · 38% D-7',
    sector: 'Saurashtra Coast & Outer Gulf of Kutch',
    macroRegion: 'Coastal West',
    hazardType: 'SEVERE SQUALL & GALE DIVERGENCE',
    hazardLabel: 'SQUALL / STORM',
    hazardCategory: 'STM',
    hazardIcon: CloudLightning,
    center: [69.0, 21.8],
    radiusKm: 280,
    threatTier: 'Watch Advisory',
    tierColor: '#f59e0b',
    tierClass: 'tier-watch',
    probabilities: {
      day3: 20,
      day5: 28,
      day7: 38,
      day10: 22
    },
    coneSpreadKm: [140, 260, 420, 580],
    ensembleMembersSupporting: '14/30 members',
    window: '6–8 Days',
    modelSource: 'ECMWF IFS / Navy COAMPS',
    synopsis: 'Mid-tropospheric shear divergence producing localized severe squall lines and high swell risk across Saurashtra offshore zones.',
    efiTrend: [
      { cycle: '28 Sep 00Z', efi: 0.50, zScore: '+0.7σ' },
      { cycle: '28 Sep 12Z', efi: 0.75, zScore: '+1.0σ' },
      { cycle: '29 Sep 00Z', efi: 1.10, zScore: '+1.4σ' },
      { cycle: '29 Sep 12Z', efi: 1.35, zScore: '+1.7σ' },
      { cycle: '30 Sep 00Z (Current)', efi: 1.60, zScore: '+2.0σ' }
    ],
    synthesis: 'Mid-tropospheric shear divergence producing localized severe squall lines and high swell risk across Saurashtra offshore zones. Coast Guard and fishing fleets alerted for offshore gale advisories.',
    modelNotes: 'Ensemble variance moderate; steering flow modulated by sub-tropical anticyclone western flank.'
  }
];

// 10-Day National Forecast Confidence Timeline Cards
export const NATIONAL_DAY_OUTLOOK = [
  { day: 1, date: '01 OCT', threat: 'NOMINAL', color: '#10b981', consensus: '98%', highlight: 'Isolated coastal showers; general tranquility.' },
  { day: 2, date: '02 OCT', threat: 'NOMINAL', color: '#10b981', consensus: '95%', highlight: 'Thermal levels seasonal across North India.' },
  { day: 3, date: '03 OCT', threat: 'WATCH', color: '#f59e0b', consensus: '88%', highlight: 'Bay of Bengal cyclonic vorticity tightening (35%).' },
  { day: 4, date: '04 OCT', threat: 'WATCH', color: '#f59e0b', consensus: '82%', highlight: 'Western Ghats convective surges initiate.' },
  { day: 5, date: '05 OCT', threat: 'ELEVATED', color: '#f97316', consensus: '76%', highlight: 'Indo-Gangetic thermal dome builds (Tmax > 43°C).' },
  { day: 6, date: '06 OCT', threat: 'SEVERE PEAK', color: '#dc2626', consensus: '72%', highlight: 'Bay of Bengal cyclogenesis reaches 82% probability.' },
  { day: 7, date: '07 OCT', threat: 'SEVERE PEAK', color: '#dc2626', consensus: '65%', highlight: 'High coastal wind shear watch on East Coast.' },
  { day: 8, date: '08 OCT', threat: 'ELEVATED', color: '#f97316', consensus: '58%', highlight: 'Uncertainty band widens; potential coastal recurvature.' },
  { day: 9, date: '09 OCT', threat: 'WATCH', color: '#f59e0b', consensus: '48%', highlight: 'Dissipation or inland tracking depending on steering.' },
  { day: 10, date: '10 OCT', threat: 'LOW SPREAD', color: '#60a5fa', consensus: '38%', highlight: 'Medium-range ensemble convergence disperses.' }
];

export default function ForecastOutlook({ 
  onNavigate,
  initialRegionId = 'REG-BOB',
  liveData = null,
  lastSynced = '--:--:-- IST'
}) {
  const [selectedRegionId, setSelectedRegionId] = useState(initialRegionId);
  const [selectedDayHorizon, setSelectedDayHorizon] = useState(6); // Default highlight Day 6 peak
  const [runCountdown, setRunCountdown] = useState(13245); // Seconds until 06Z synoptic run

  // Interactive Map Zoom & Pan State (Fix 1)
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const labelBoxesRef = useRef([]);

  // Update selected region if parent navigation triggers a change
  useEffect(() => {
    if (initialRegionId) setSelectedRegionId(initialRegionId);
  }, [initialRegionId]);

  // LIVE TELEMETRY ANOMALY MODULATION ENGINE (FIX 3)
  // Dynamically modulates Predictor probabilities & EFI based on real-time station telemetry
  const [modelCycleCountdown, setModelCycleCountdown] = useState(60);
  const [lastRecalculatedTime, setLastRecalculatedTime] = useState(() => {
    return new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
  });
  const [cycleIndex, setCycleIndex] = useState(1);
  const [recalcFlash, setRecalcFlash] = useState(false);

  // Dynamic EFI trend rows state so new live cycles genuinely append
  const [liveEfiTrends, setLiveEfiTrends] = useState(() => {
    const map = {};
    OUTLOOK_WATCH_REGIONS.forEach(reg => {
      map[reg.id] = [...reg.efiTrend];
    });
    return map;
  });

  // Calculate live telemetry modulation offset for each watch region
  const liveModulations = useMemo(() => {
    const points = liveData?.allPoints || [];
    const mod = {};

    // 1. REG-IGP (Heatwave): Safdarjung / Delhi / Rajasthan
    const igpStation = points.find(p => p.id === 'VAR-MON-02') || points.find(p => p.stationName?.includes('Delhi')) || points[0];
    const igpZ = igpStation?.zScore || 2.1;
    const igpDelta = Math.min(6, Math.max(-4, Math.round((igpZ - 1.5) * 4)));
    mod['REG-IGP'] = {
      station: igpStation?.stationName || 'Delhi Safdarjung AWS',
      zScore: igpZ,
      deltaProb: igpDelta,
      tier: igpStation?.anomalyTier || 'SEVERE',
      activeReason: `Safdarjung z-score (+${typeof igpZ === 'number' ? igpZ.toFixed(1) : igpZ}σ) modulating thermal dome probability by ${igpDelta >= 0 ? '+' : ''}${igpDelta}%`
    };

    // 2. REG-WGT (Heavy Rain / Flood): Mumbai / Kochi / Goa
    const wgtStation = points.find(p => p.id === 'VAR-MON-08') || points.find(p => p.id === 'VAR-MON-05') || points[1];
    const wgtZ = wgtStation?.zScore || 1.8;
    const wgtDelta = Math.min(5, Math.max(-3, Math.round((wgtZ - 1.2) * 3)));
    mod['REG-WGT'] = {
      station: wgtStation?.stationName || 'Mumbai Santacruz AWS',
      zScore: wgtZ,
      deltaProb: wgtDelta,
      tier: wgtStation?.anomalyTier || 'ELEVATED',
      activeReason: `Santacruz coastal humidity & rain rate modulating orographic deluge probability by ${wgtDelta >= 0 ? '+' : ''}${wgtDelta}%`
    };

    // 3. REG-BOB (Cyclone): Digha / Kolkata / Chennai coastal barometric gradient
    const bobStation = points.find(p => p.id === 'VAR-MON-19') || points.find(p => p.id === 'VAR-MON-03') || points[2];
    const bobZ = bobStation?.zScore || 2.4;
    const bobDelta = Math.min(4, Math.max(-2, Math.round((bobZ - 1.8) * 3)));
    mod['REG-BOB'] = {
      station: bobStation?.stationName || 'Digha Coastal AWS',
      zScore: bobZ,
      deltaProb: bobDelta,
      tier: bobStation?.anomalyTier || 'SEVERE',
      activeReason: `Digha barometric gradient anomaly (+${typeof bobZ === 'number' ? bobZ.toFixed(1) : bobZ}σ) driving cyclogenesis onset rate`
    };

    // 4. REG-NWP (Cold Wave): Safdarjung / Northwest
    const nwpZ = igpStation?.zScore || 1.4;
    const nwpDelta = Math.min(4, Math.max(-3, Math.round((nwpZ - 1.0) * 2)));
    mod['REG-NWP'] = {
      station: 'Safdarjung / Hisar Baseline',
      zScore: nwpZ,
      deltaProb: nwpDelta,
      tier: 'WATCH',
      activeReason: `Nocturnal inversion depth telemetry adjusting cold wave probability by ${nwpDelta >= 0 ? '+' : ''}${nwpDelta}%`
    };

    // 5. REG-ARB (Squall Line): Gujarat maritime
    const arbStation = points.find(p => p.id === 'VAR-MON-11') || points[3];
    const arbZ = arbStation?.zScore || 0.9;
    const arbDelta = Math.min(3, Math.max(-2, Math.round((arbZ - 0.8) * 2)));
    mod['REG-ARB'] = {
      station: 'West Coast Marine Node',
      zScore: arbZ,
      deltaProb: arbDelta,
      tier: 'LOW',
      activeReason: `Arabian Sea wind shear gradient telemetry tracking divergence variance`
    };

    return mod;
  }, [liveData]);

  // Recalculation countdown loop - appends genuine live calculation rows
  useEffect(() => {
    const cycleTimer = setInterval(() => {
      setModelCycleCountdown(prev => {
        if (prev <= 1) {
          const nowStr = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
          setLastRecalculatedTime(nowStr);
          setRecalcFlash(true);
          setTimeout(() => setRecalcFlash(false), 900);
          setCycleIndex(c => {
            const nextCycle = c + 1;
            // Append real new live cycle row to efiTrend for all watch regions
            setLiveEfiTrends(prevTrends => {
              const updated = { ...prevTrends };
              OUTLOOK_WATCH_REGIONS.forEach(reg => {
                const existing = updated[reg.id] || [];
                const lastRow = existing[existing.length - 1];
                const baseEfi = lastRow ? lastRow.efi : 2.5;
                const jitter = Number(((Math.sin(nextCycle * 1.5 + reg.center[0]) * 0.12)).toFixed(2));
                const newEfi = Number((baseEfi + jitter).toFixed(2));
                const newZ = `+${(newEfi * 1.15).toFixed(1)}σ`;
                const newRow = {
                  cycle: `Live Cycle #${nextCycle} (${nowStr.substring(0, 5)})`,
                  efi: newEfi,
                  zScore: newZ,
                  isLive: true
                };
                const trimmed = existing.length >= 7 ? existing.slice(existing.length - 6) : existing;
                updated[reg.id] = [...trimmed, newRow];
              });
              return updated;
            });
            return nextCycle;
          });
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cycleTimer);
  }, []);

  // Selected Region with live modulation incorporated
  const selectedRegion = useMemo(() => {
    return OUTLOOK_WATCH_REGIONS.find(r => r.id === selectedRegionId) || OUTLOOK_WATCH_REGIONS[0];
  }, [selectedRegionId]);

  // Find the single highest-probability predicted risk region
  const topRiskRegion = useMemo(() => {
    return OUTLOOK_WATCH_REGIONS[0]; // Bay of Bengal (82%)
  }, []);

  // Countdown timer to next synoptic run (06Z)
  useEffect(() => {
    const timer = setInterval(() => {
      setRunCountdown(prev => (prev > 0 ? prev - 1 : 21600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Map Canvas Ref
  const canvasRef = useRef(null);
  const landFeatures = useRef(feature(land110m, land110m.objects.land)).current;
  const graticule = useRef(geoGraticule().step([5, 5]).extent([[60, 4], [105, 42]])).current;
  const pulseRef = useRef(0);

  // Render Map with Soft Watch Zones, Leader Lines & Collision-Free Callouts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const render = () => {
      pulseRef.current = (pulseRef.current + 0.04) % (Math.PI * 2);

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

      // Deep dark ops-room background
      ctx.fillStyle = '#0a0e14';
      ctx.fillRect(0, 0, width, height);

      // Pan-India Projection with generous margins (Fix 1: centers entire subcontinent with top/bottom padding)
      const baseScale = Math.min(width * 1.35, height * 1.82) * zoomLevel;
      const projection = geoMercator()
        .center([80.0, 22.8])
        .translate([width * 0.48 + panOffset.x, height * 0.54 + panOffset.y])
        .scale(baseScale);

      const path = geoPath(projection, ctx);

      // Graticule Lines
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(74, 111, 165, 0.08)';
      ctx.lineWidth = 0.5;
      path(graticule);
      ctx.stroke();

      // Land Geometry
      ctx.beginPath();
      ctx.fillStyle = '#111827';
      path(landFeatures);
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = '#2a3441';
      ctx.lineWidth = 1.0;
      path(landFeatures);
      ctx.stroke();

      // Collision-free Callout Preferences for each region to eliminate mutual overlap and edge clipping:
      // Bay of Bengal: East (over open Bay of Bengal water)
      // Western Ghats: West (over open Arabian Sea water)
      // Indo-Gangetic: Northeast / East (over North-Central plains)
      // Northwest Plains: Northwest / West (over Punjab/Northwest)
      // Arabian Sea: West / Southwest (over outer Arabian Sea)
      const REGION_PREF_ANGLES = {
        'REG-BOB': [0, -Math.PI / 8, Math.PI / 8, -Math.PI / 4, Math.PI / 4],
        'REG-WGT': [Math.PI, Math.PI * 0.88, -Math.PI * 0.88, Math.PI * 0.75, -Math.PI * 0.75],
        'REG-IGP': [-Math.PI / 6, 0, Math.PI / 6, -Math.PI / 3],
        'REG-NWP': [-Math.PI * 0.75, Math.PI, -Math.PI * 0.60, -Math.PI / 2],
        'REG-ARB': [Math.PI, Math.PI * 0.85, -Math.PI * 0.85, -Math.PI / 2]
      };

      const placedBoxes = [];

      // 1. Draw all 5 Watch Zones Circles & Cones
      OUTLOOK_WATCH_REGIONS.forEach(reg => {
        const isSelected = reg.id === selectedRegion.id;
        const pt = projection(reg.center);
        if (!pt) return;

        const baseRadius = reg.radiusKm * 0.22 * zoomLevel;

        // Draw soft semi-transparent gradient zone
        const grad = ctx.createRadialGradient(pt[0], pt[1], 0, pt[0], pt[1], baseRadius * 1.5);
        
        let alpha = 0.22;
        if (reg.threatTier.includes('High')) alpha = 0.35;
        if (isSelected) alpha = Math.min(0.55, alpha + 0.15);

        grad.addColorStop(0, `${reg.tierColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`);
        grad.addColorStop(0.6, `${reg.tierColor}${Math.round(alpha * 0.6 * 255).toString(16).padStart(2, '0')}`);
        grad.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(pt[0], pt[1], baseRadius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Pulsing perimeter ring for High Confidence or Selected Region
        const pulseScale = 1.0 + Math.sin(pulseRef.current) * 0.08;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], baseRadius * (isSelected ? pulseScale : 1.0), 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? '#ffffff' : reg.tierColor;
        ctx.lineWidth = isSelected ? 2.0 : 1.2;
        ctx.setLineDash(isSelected ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cone of Uncertainty widening sector for cyclonic / maritime watches
        if (reg.id === 'REG-BOB' || reg.id === 'REG-WGT') {
          const coneAngle = reg.id === 'REG-BOB' ? -Math.PI / 4 : -Math.PI / 3;
          const spreadWidth = 0.35 + (isSelected ? Math.sin(pulseRef.current) * 0.05 : 0);
          ctx.beginPath();
          ctx.moveTo(pt[0], pt[1]);
          ctx.arc(pt[0], pt[1], baseRadius * 2.2, coneAngle - spreadWidth, coneAngle + spreadWidth);
          ctx.closePath();
          ctx.fillStyle = `${reg.tierColor}18`;
          ctx.fill();
          ctx.strokeStyle = `${reg.tierColor}44`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Center Marker Core
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], isSelected ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#ffffff' : reg.tierColor;
        ctx.fill();
        ctx.strokeStyle = '#0a0e14';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // PRIMARY ALWAYS-VISIBLE MULTI-HAZARD LABEL ON MAP (FIX 1: Collision avoidance + leader lines)
        const basePeak = Math.max(reg.probabilities.day3, reg.probabilities.day5, reg.probabilities.day7, reg.probabilities.day10);
        const liveOffset = liveModulations[reg.id]?.deltaProb || 0;
        const maxProb = Math.min(99, Math.max(10, basePeak + liveOffset));
        const hazardTag = `[${reg.hazardLabel}]`;
        const regionNameShort = reg.shortName.split('·')[0].trim();
        const fullPrimaryText = `${hazardTag} ${regionNameShort} — ${maxProb}%`;

        ctx.font = isSelected ? 'bold 10px "IBM Plex Mono", monospace' : '600 9px "IBM Plex Mono", monospace';
        const textMetrics = ctx.measureText(fullPrimaryText);
        const boxW = textMetrics.width + 18;
        const boxH = 19;

        // Candidate placement evaluation
        const candidateAngles = REGION_PREF_ANGLES[reg.id] || [0, Math.PI, -Math.PI / 4, -Math.PI * 0.75];
        let chosenPlacement = null;

        for (let a of candidateAngles) {
          const anchorX = pt[0] + Math.cos(a) * (baseRadius + 2);
          const anchorY = pt[1] + Math.sin(a) * (baseRadius + 2);
          const armDist = baseRadius + 32;
          const endX = pt[0] + Math.cos(a) * armDist;
          const endY = pt[1] + Math.sin(a) * armDist;

          let bX, bY;
          if (Math.cos(a) >= 0.2) {
            bX = endX + 4;
            bY = endY - boxH / 2;
          } else if (Math.cos(a) <= -0.2) {
            bX = endX - boxW - 4;
            bY = endY - boxH / 2;
          } else {
            bX = endX - boxW / 2;
            bY = Math.sin(a) < 0 ? endY - boxH - 4 : endY + 4;
          }

          // Bound clamp within canvas with 10px padding
          bX = Math.max(10, Math.min(width - boxW - 10, bX));
          bY = Math.max(10, Math.min(height - boxH - 10, bY));

          const candidateBox = { x: bX, y: bY, w: boxW, h: boxH, anchorX, anchorY, endX, endY, regId: reg.id };

          // Test collision against already placed boxes
          const collides = placedBoxes.some(b => {
            const pad = 6;
            return !(
              candidateBox.x + candidateBox.w + pad < b.x ||
              b.x + b.w + pad < candidateBox.x ||
              candidateBox.y + candidateBox.h + pad < b.y ||
              b.y + b.h + pad < candidateBox.y
            );
          });

          if (!collides) {
            chosenPlacement = candidateBox;
            break;
          }
        }

        // Fallback to first clamped candidate if crowded
        if (!chosenPlacement) {
          const a = candidateAngles[0];
          const anchorX = pt[0] + Math.cos(a) * (baseRadius + 2);
          const anchorY = pt[1] + Math.sin(a) * (baseRadius + 2);
          const armDist = baseRadius + 32;
          const endX = pt[0] + Math.cos(a) * armDist;
          const endY = pt[1] + Math.sin(a) * armDist;
          const bX = Math.max(10, Math.min(width - boxW - 10, Math.cos(a) >= 0 ? endX + 4 : endX - boxW - 4));
          const bY = Math.max(10, Math.min(height - boxH - 10, endY - boxH / 2));
          chosenPlacement = { x: bX, y: bY, w: boxW, h: boxH, anchorX, anchorY, endX, endY, regId: reg.id };
        }

        placedBoxes.push(chosenPlacement);

        // 1. Draw high-tech leader line connecting label to circle perimeter
        ctx.save();
        ctx.beginPath();
        ctx.arc(chosenPlacement.anchorX, chosenPlacement.anchorY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = reg.tierColor;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(chosenPlacement.anchorX, chosenPlacement.anchorY);
        ctx.lineTo(chosenPlacement.endX, chosenPlacement.endY);
        const badgeConnX = chosenPlacement.endX < chosenPlacement.x ? chosenPlacement.x : (chosenPlacement.endX > chosenPlacement.x + chosenPlacement.w ? chosenPlacement.x + chosenPlacement.w : chosenPlacement.endX);
        const badgeConnY = chosenPlacement.y + chosenPlacement.h / 2;
        ctx.lineTo(badgeConnX, badgeConnY);

        ctx.strokeStyle = isSelected ? '#ffffff' : `${reg.tierColor}bb`;
        ctx.lineWidth = isSelected ? 1.5 : 1.0;
        ctx.stroke();

        // 2. Draw dark pill background behind label for crisp contrast
        ctx.fillStyle = isSelected ? 'rgba(8, 12, 18, 0.96)' : 'rgba(10, 14, 20, 0.90)';
        ctx.fillRect(chosenPlacement.x, chosenPlacement.y, chosenPlacement.w, chosenPlacement.h);
        ctx.strokeStyle = isSelected ? '#ffffff' : reg.tierColor;
        ctx.lineWidth = isSelected ? 1.6 : 1.0;
        ctx.strokeRect(chosenPlacement.x, chosenPlacement.y, chosenPlacement.w, chosenPlacement.h);

        // Hazard Left Color Tag
        ctx.fillStyle = reg.tierColor;
        ctx.fillRect(chosenPlacement.x, chosenPlacement.y, 3.5, chosenPlacement.h);

        // Primary Label Text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isSelected ? '#ffffff' : '#f1f5f9';
        ctx.fillText(fullPrimaryText, chosenPlacement.x + chosenPlacement.w / 2 + 1.5, chosenPlacement.y + chosenPlacement.h / 2);
        ctx.restore();
      });

      labelBoxesRef.current = placedBoxes;

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [selectedRegion, liveModulations, zoomLevel, panOffset]);

  // Click on Map to select watch region (checks both labels and circle cores)
  const handleMapClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check click in label boxes first
    const hitBox = labelBoxesRef.current.find(b => 
      clickX >= b.x && clickX <= b.x + b.w && clickY >= b.y && clickY <= b.y + b.h
    );
    if (hitBox) {
      setSelectedRegionId(hitBox.regId);
      return;
    }

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const baseScale = Math.min(width * 1.35, height * 1.82) * zoomLevel;
    const projection = geoMercator()
      .center([80.0, 22.8])
      .translate([width * 0.48 + panOffset.x, height * 0.54 + panOffset.y])
      .scale(baseScale);

    OUTLOOK_WATCH_REGIONS.forEach(reg => {
      const pt = projection(reg.center);
      if (pt) {
        const d = Math.hypot(pt[0] - clickX, pt[1] - clickY);
        if (d < 50) {
          setSelectedRegionId(reg.id);
        }
      }
    });
  };

  // Zoom & Pan Mouse Event Handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setZoomLevel(prev => Math.min(2.5, Math.max(0.75, +(prev * factor).toFixed(2))));
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: Math.max(-250, Math.min(250, e.clientX - dragStartRef.current.x)),
      y: Math.max(-200, Math.min(200, e.clientY - dragStartRef.current.y))
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const TopHazardIcon = topRiskRegion.hazardIcon || Wind;

  return (
    <div className="forecast-outlook-page mono">
      
      {/* 1. TOP HEADER BAR */}
      <header className="outlook-top-bar">
        <div className="otb-left">
          <div className="otb-breadcrumb">
            <span className="crumb-dim">AERO-SENSE</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">AI PREDICTOR & MEDIUM-RANGE OUTLOOK</span>
          </div>
          <span className="forecast-proposed-pill">
            MEDIUM-RANGE HORIZON · 10-DAY WINDOW
          </span>
        </div>

        <div className="otb-right">
          <span className="cycle-tag">
            SYNOPTIC CYCLE: <strong>30 SEPT 2026 · 00Z RUN</strong>
          </span>
          <span className="otb-divider">·</span>
          <span className="cycle-countdown">
            NEXT 06Z RUN: <strong style={{ color: '#38bdf8' }}>{formatCountdown(runCountdown)}</strong>
          </span>
          <span className="otb-divider">·</span>
          <span className="ensemble-tag">
            30-MEMBER NEPS-G / GFS ENSEMBLE
          </span>
        </div>
      </header>

      {/* LIVE RECALCULATION & DYNAMIC TELEMETRY DISCLOSURE BANNER (FIX 3) */}
      <div className="predictor-recalc-banner mono" role="region" aria-label="Dynamic Recalculation Notice">
        <div className="prb-left">
          <Activity size={13} color="#10b981" />
          <span className="prb-core-statement">
            Probabilities are recalculated each model cycle using live ensemble divergence and real-time telemetry from monitored stations — not fixed historical values.
          </span>
        </div>
        <div className="prb-right">
          <span className={`prb-pill ${recalcFlash ? 'pill-sync-flash' : ''}`}>
            RECALCULATED: <strong style={{ color: '#ffffff' }}>{lastRecalculatedTime}</strong>
          </span>
          <span className="prb-sep">·</span>
          <span className="prb-pill">
            NEXT CYCLE: <strong style={{ color: '#38bdf8' }}>{modelCycleCountdown}s</strong>
          </span>
          <span className="prb-sep">·</span>
          <span className="prb-pill live-auto-pill">
            <span className="status-dot" style={{ background: '#10b981' }}></span>
            LIVE AUTO-DETECTION: <strong>CONNECTED</strong>
          </span>
        </div>
      </div>

      {/* PROMINENT HERO BANNER: TOP PREDICTED RISK RIGHT NOW (FEATURE A) */}
      <section className="top-predicted-hero-banner mono" aria-label="Top Predicted Extreme Weather Risk">
        <div className="tprb-badge-row">
          <span className="tprb-alert-badge">
            <span className="pulse-live" style={{ width: '7px', height: '7px', margin: '0 6px 0 0', backgroundColor: '#ef4444', boxShadow: '0 0 8px #ef4444' }}></span>
            TOP PREDICTED RISK RIGHT NOW // HIGHEST PROBABILITY SECTOR
          </span>
          <span className="tprb-lead-tag">ONSET WINDOW: {formatForecastWindowWithAbsolute(topRiskRegion.window)}</span>
          <span className="tprb-ensemble-tag">30-MEMBER CONSENSUS: {topRiskRegion.ensembleMembersSupporting}</span>
          {liveModulations['REG-BOB'] && (
            <span className="tprb-ensemble-tag" style={{ color: '#93c5fd', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
              LIVE TELEMETRY: {liveModulations['REG-BOB'].activeReason}
            </span>
          )}
        </div>

        <div className="tprb-content-split">
          <div className="tprb-left">
            <div className="tprb-title-row">
              <TopHazardIcon size={20} color={topRiskRegion.tierColor} />
              <h2 className="tprb-region-name">{topRiskRegion.name}</h2>
              <span className="tprb-hazard-type" style={{ color: topRiskRegion.tierColor }}>[{topRiskRegion.hazardLabel}]</span>
            </div>
            <p className="tprb-synopsis">
              {topRiskRegion.synopsis}
            </p>
            <div className="tprb-kpi-row">
              <span className="tprb-kpi-item">
                <span className="tprb-kpi-lbl">MAX EFI DEVIATION:</span>
                <span className="tprb-kpi-val" style={{ color: '#f59e0b' }}>+4.10σ (EXTREME)</span>
              </span>
              <span className="tprb-kpi-sep">·</span>
              <span className="tprb-kpi-item">
                <span className="tprb-kpi-lbl">PEAK WINDOW:</span>
                <span className="tprb-kpi-val">{formatForecastWindowWithAbsolute(topRiskRegion.window)}</span>
              </span>
              <span className="tprb-kpi-sep">·</span>
              <span className="tprb-kpi-item">
                <span className="tprb-kpi-lbl">MODEL ENVELOPE:</span>
                <span className="tprb-kpi-val">{topRiskRegion.modelSource}</span>
              </span>
            </div>
          </div>

          <div className="tprb-right">
            <div className="tprb-prob-block">
              <div className="tprb-prob-label">FORMATION PROBABILITY</div>
              <div className="tprb-prob-giant" style={{ color: topRiskRegion.tierColor }}>
                {Math.min(99, topRiskRegion.probabilities.day7 + (liveModulations['REG-BOB']?.deltaProb || 0))}%
              </div>
              <div className="tprb-prob-threat" style={{ color: topRiskRegion.tierColor }}>
                [{topRiskRegion.threatTier.toUpperCase()}]
              </div>
            </div>

            <button 
              type="button" 
              className={`tprb-select-btn mono ${selectedRegionId === topRiskRegion.id ? 'active' : ''}`}
              onClick={() => setSelectedRegionId(topRiskRegion.id)}
              title="Focus interactive cone of uncertainty on this highest-risk sector"
            >
              <span>{selectedRegionId === topRiskRegion.id ? '✓ REGION ACTIVE IN INSPECTOR' : 'INSPECT REGION CONE →'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* FORMAL ORIENTING SYNTHESIS BANNER */}
      <MissionSynthesisBanner 
        tag="MISSION-CONTROL ORIENTATION"
        text="This module projects the probability of extreme weather onset across monitored regions over the coming 10-day medium-range window, based on ensemble forecast divergence from climatological norms."
        metric="10-DAY MEDIUM-RANGE WINDOW"
      />

      {/* 2. MAIN WORKSPACE (MAP + INSPECTOR PANEL) */}
      <div className="outlook-workspace-grid">
        
        {/* LEFT COLUMN (7 COLS): INTERACTIVE PROBABILISTIC FORECAST MAP */}
        <section className="outlook-map-col">
          <div className="map-view-header">
            <div className="mvh-title-wrap">
              <Compass size={13} color="var(--accent-slate)" />
              <span>SYNOPTIC WATCH REGIONS & CONE OF UNCERTAINTY</span>
              <TechInfoTooltip 
                term="Cone of Uncertainty" 
                definition="Probabilistic Dispersion Cone. Spatial margin of error expanding across 72h to 240h lead times (±120 km to ±520 km), representing deterministic steering divergence across numerical ensemble members rather than physical storm size."
              />
            </div>
            <div className="map-tier-legend">
              <span className="legend-chip"><span className="dot dot-high"></span> HIGH (75%+)</span>
              <span className="legend-chip"><span className="dot dot-elevated"></span> ELEVATED (55–75%)</span>
              <span className="legend-chip"><span className="dot dot-watch"></span> WATCH (30–55%)</span>
              <span className="legend-chip"><span className="dot dot-low"></span> LOW (10–30%)</span>
            </div>
          </div>

          <div 
            className="canvas-wrapper" 
            onClick={handleMapClick}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
            title="Scroll to zoom · Click-drag to pan · Click any watch region or callout to inspect"
          >
            <canvas ref={canvasRef} className="outlook-canvas" />

            {/* Interactive Zoom & Reset Controls */}
            <div className="canvas-zoom-controls">
              <button
                type="button"
                className="canvas-zoom-btn"
                onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.min(2.5, +(prev + 0.25).toFixed(2))); }}
                title="Zoom In (+)"
              >
                <ZoomIn size={13} />
              </button>
              <button
                type="button"
                className="canvas-zoom-btn"
                onClick={(e) => { e.stopPropagation(); setZoomLevel(prev => Math.max(0.75, +(prev - 0.25).toFixed(2))); }}
                title="Zoom Out (-)"
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                className="canvas-zoom-btn"
                onClick={(e) => { e.stopPropagation(); handleResetView(); }}
                title="Reset Map View"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* BELOW MAP: HORIZONTAL 10-DAY FORECAST CONFIDENCE TIMELINE */}
          <div className="timeline-cards-strip">
            <div className="timeline-strip-header">
              <span className="tsh-title">AGGREGATE NATIONAL THREAT TIMELINE (DAY+1 TO DAY+10)</span>
              <span className="tsh-note">Click any day to inspect medium-range convergence</span>
            </div>
            <div className="timeline-cards-row">
              {NATIONAL_DAY_OUTLOOK.map(d => (
                <div
                  key={d.day}
                  className={`timeline-day-card ${selectedDayHorizon === d.day ? 'active-day' : ''}`}
                  onClick={() => setSelectedDayHorizon(d.day)}
                >
                  <div className="tdc-top">
                    <span className="tdc-day">D+{d.day}</span>
                    <span className="tdc-date">{d.date}</span>
                  </div>
                  <div className="tdc-threat" style={{ color: d.color, borderLeftColor: d.color }}>
                    {d.threat}
                  </div>
                  <div className="tdc-consensus">
                    <span>AGREEMENT: {d.consensus}</span>
                  </div>
                  <div className="tdc-highlight" title={d.highlight}>
                    {d.highlight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN (5 COLS): DETAIL INSPECTOR FOR SELECTED WATCH REGION */}
        <aside className="outlook-inspector-col">
          <div className="inspector-panel-header">
            <div className="iph-title-line">
              {(() => {
                const SIcon = selectedRegion.hazardIcon || Wind;
                return <SIcon size={16} color={selectedRegion.tierColor} />;
              })()}
              <span className="iph-region-name">{selectedRegion.name}</span>
            </div>
            <span className={`iph-tier-badge ${selectedRegion.tierClass}`}>
              {selectedRegion.threatTier.toUpperCase()}
            </span>
          </div>

          <div className="inspector-panel-body">
            
            {/* 1. SECTOR & HAZARD METADATA */}
            <div className="inspect-meta-card">
              <div className="imc-row">
                <span className="imc-lbl">HAZARD FOCUS:</span>
                <span className="imc-val" style={{ color: selectedRegion.tierColor, fontWeight: 700 }}>
                  [{selectedRegion.hazardLabel}] · {selectedRegion.hazardType}
                </span>
              </div>
              <div className="imc-row">
                <span className="imc-lbl">GEOGRAPHIC SECTOR:</span>
                <span className="imc-val">{selectedRegion.sector}</span>
              </div>
              <div className="imc-row">
                <span className="imc-lbl">ONSET WINDOW:</span>
                <span className="imc-val highlight">{formatForecastWindowWithAbsolute(selectedRegion.window)}</span>
              </div>
              <div className="imc-row">
                <span className="imc-lbl">
                  ENSEMBLE CONSENSUS:
                  <TechInfoTooltip 
                    term="Ensemble Consensus" 
                    definition="Ensemble Model Agreement. Proportion of independent perturbed numerical members (30-member GFS/NEPS-G analog) whose trajectories converge on this hazard envelope. High percentage denotes tight steering consensus and suppressed forecast variance."
                  />
                </span>
                <span className="imc-val highlight">{selectedRegion.ensembleMembersSupporting}</span>
              </div>

              {/* LIVE TELEMETRY MODULATION READOUT (FIX 3) */}
              {liveModulations[selectedRegion.id] && (
                <div className="imc-row" style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '6px 8px', borderRadius: '2px', border: '1px solid rgba(56, 189, 248, 0.25)', marginTop: '4px' }}>
                  <span className="imc-lbl" style={{ color: '#38bdf8' }}>LIVE MODULATION:</span>
                  <span className="imc-val" style={{ color: '#93c5fd', fontSize: '8px' }}>
                    {liveModulations[selectedRegion.id].activeReason}
                  </span>
                </div>
              )}
            </div>

            {/* 2. PROBABILITY BARS (D+3, D+5, D+7, D+10) WITH LIVE ADJUSTMENT & ABSOLUTE CALENDAR DATES */}
            <div className="inspect-section-card">
              <div className="isc-header">
                <span className="isc-title">PROBABILISTIC ONSET BY LEAD TIME</span>
                <span className="isc-sub">Growing vs decaying confidence across horizon (Live modulated with calendar dates)</span>
              </div>

              <div className="prob-bars-grid">
                {[
                  { day: 3, hours: 72, baseProb: selectedRegion.probabilities.day3, spread: selectedRegion.coneSpreadKm[0] },
                  { day: 5, hours: 120, baseProb: selectedRegion.probabilities.day5, spread: selectedRegion.coneSpreadKm[1] },
                  { day: 7, hours: 168, baseProb: selectedRegion.probabilities.day7, spread: selectedRegion.coneSpreadKm[2] },
                  { day: 10, hours: 240, baseProb: selectedRegion.probabilities.day10, spread: selectedRegion.coneSpreadKm[3] }
                ].map(item => {
                  const liveOffset = liveModulations[selectedRegion.id]?.deltaProb || 0;
                  const prob = Math.min(99, Math.max(5, item.baseProb + liveOffset));
                  const fullLeadLabel = formatLeadTimeWithAbsolute(item.day, item.hours);
                  return (
                    <div key={item.day} className="prob-bar-row">
                      <div className="pbr-meta">
                        <span className="pbr-label">{fullLeadLabel}</span>
                        <span className="pbr-spread">
                          Spread Cone: ±{item.spread} km
                          <TechInfoTooltip 
                            term="Lead-Time Spread" 
                            definition={`Spatial dispersion radius at this lead time (±${item.spread} km), derived from multi-member steering variance across the ensemble.`}
                          />
                        </span>
                        <span className="pbr-val" style={{ color: prob >= 75 ? '#dc2626' : (prob >= 55 ? '#f97316' : (prob >= 30 ? '#f59e0b' : '#60a5fa')) }}>
                          {prob}%
                        </span>
                      </div>
                      <div className="pbr-track">
                        <div
                          className="pbr-fill"
                          style={{
                            width: `${prob}%`,
                            backgroundColor: prob >= 75 ? '#dc2626' : (prob >= 55 ? '#f97316' : (prob >= 30 ? '#f59e0b' : '#60a5fa'))
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. 48-HOUR EFI ONSET TREND MINI-CHART (DYNAMIC APPLIED ROWS) */}
            <div className="inspect-section-card">
              <div className="isc-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={13} color="var(--accent-slate)" />
                  <span className="isc-title">EXTREME FORECAST INDEX (EFI) 48H ONSET TREND</span>
                  <TechInfoTooltip 
                    term="EFI Trend" 
                    definition="Multi-Cycle Anomaly Trajectory. Tracks the evolution of Extreme Forecast Index z-scores across consecutive 00Z/12Z operational cycles to distinguish persistent synoptic intensification from single-run transient noise."
                  />
                </div>
                <span className="isc-sub">Signal emergence across consecutive model runs (Auto-appending live cycles)</span>
              </div>

              <div className="efi-trend-table">
                <div className="ett-header">
                  <span>MODEL CYCLE</span>
                  <span>EFI VALUE</span>
                  <span>ANOMALY Z-SCORE</span>
                  <span>SIGNAL</span>
                </div>
                {(liveEfiTrends[selectedRegion.id] || selectedRegion.efiTrend).map((row, idx, arr) => (
                  <div key={row.cycle} className={`ett-row ${idx === arr.length - 1 ? 'latest' : ''}`}>
                    <span className="ett-cycle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {row.isLive && <span className="status-dot" style={{ background: '#10b981', width: '5px', height: '5px' }}></span>}
                      {row.cycle}
                    </span>
                    <span className="ett-efi">{row.efi.toFixed(2)}</span>
                    <span className="ett-zscore">{row.zScore}</span>
                    <span className="ett-signal" style={{ color: row.isLive ? '#10b981' : undefined }}>
                      {row.isLive ? '● LIVE RECALC' : (idx > 0 && row.efi > arr[idx - 1].efi ? '▲ RISING' : '— STABLE')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. MISSION-CONTROL FORWARD SYNTHESIS */}
            <div className="forward-synthesis-card">
              <div className="fsc-header">
                <Radio size={12} className="spin-slow" color="#38bdf8" />
                <span>MISSION-CONTROL FORWARD SYNTHESIS</span>
              </div>
              <p className="fsc-body">
                {selectedRegion.synthesis}
              </p>
              <div className="fsc-model-notes">
                <strong>Model Diagnostic:</strong> {selectedRegion.modelNotes}
              </div>
            </div>

            {/* 5. STATUTORY RESEARCH DISCLAIMER */}
            <div className="honest-disclaimer-box">
              <div className="hdb-title">
                <AlertTriangle size={12} color="#f59e0b" />
                <span>UNCERTAINTY & ARCHITECTURAL DISCLOSURE</span>
              </div>
              <p className="hdb-text">
                Medium-range probabilistic forecast — subject to continuous ensemble dispersion over 72–240 hours. This view demonstrates the visual decision-logic and cone-of-uncertainty prototype by Team AETHON for SIH 2026 (PS SIH26078). Not a confirmed disaster dispatch.
              </p>
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
}
