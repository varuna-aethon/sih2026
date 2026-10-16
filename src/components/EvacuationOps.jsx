import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Truck, 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  Compass, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  RotateCw, 
  Layers, 
  Users, 
  Building, 
  Home, 
  Navigation, 
  Package, 
  Radio, 
  Info, 
  ExternalLink,
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
  Ship,
  Anchor
} from 'lucide-react';
import { geoMercator, geoPath } from 'd3-geo';
import { HISTORIC_EXTREME_EVENTS } from '../data/historicEvents.js';
import { logAuditAction } from '../services/auditLogger';
import { MUMBAI_REAL_ROADS, MUMBAI_MARITIME_SEAWAY, DIGHA_REAL_ROADS } from '../data/realEvacuationRoads.js';

// =========================================================================
// 1. LIVE ACTIVE FORECAST THREATS (OCTOBER 5-8, 2026) & HISTORIC BENCHMARKS
// =========================================================================
export const LIVE_FORECAST_THREATS = [
  {
    id: 'LIVE-MUMBAI-01',
    isLive: false,
    systemName: 'SCENARIO · BASED ON 26 JUL 2005 EVENT (Mumbai 944mm Cloudburst Benchmark)',
    category: 'Extreme Cloudburst & Estuary Inundation Contingency Scenario',
    validWindow: 'OPERATIONAL CONTINGENCY PROTOCOL (PRE-AUDITED ESCAPE PLAN)',
    forecastProbability: '88% High Vulnerability Estuary Basin',
    threatLevel: 'RED CONTINGENCY WARNING',
    region: 'Mumbai Suburban / Mithi River Basin (Bandra – Santacruz – Kurla – Andheri Corridor)',
    state: 'Maharashtra',
    centerCoords: [72.855, 19.068], // Dharavi / Mithi River Basin / Kurla
    windSpeedKmh: 95,
    expectedRainfallMm: 380,
    efiValue: 'EFI: +0.94 (Extreme Forecast Index)',
    downscalingPipeline: '12km NWP → 5km PINPOINT (High-Res AI Downscaling Core)',
    evacuationPopulation: 68500,
    censusDensityPerKm2: 21500,
    originSectors: [
      { id: 'sec-mum1', name: 'Sector Alpha: Dharavi Estuary Lowlands', lat: 19.038, lon: 72.855, pop: 28500, risk: 'Mithi River Estuary Swell', labelPos: 'bottom' },
      { id: 'sec-mum2', name: 'Sector Bravo: Kurla Transit Lowland', lat: 19.068, lon: 72.885, pop: 24000, risk: 'Submerged Rail/Road Chokepoints', labelPos: 'right' },
      { id: 'sec-mum3', name: 'Sector Charlie: Santacruz West Elevation Ward', lat: 19.090, lon: 72.836, pop: 16000, risk: 'Runoff Accumulation Basin', labelPos: 'left' }
    ],
    roads: [
      {
        id: 'rd-weh',
        name: 'Western Express Highway (WEH / NH-48 Elevated Viaduct Artery)',
        type: 'primary',
        color: '#10b981', // Emerald
        strokeWidth: 4.8,
        flowSpeed: '65 km/h',
        distanceKm: MUMBAI_REAL_ROADS.weh.distanceKm,
        durationMins: MUMBAI_REAL_ROADS.weh.durationMins,
        status: 'OPEN - DESIGNATED ARTERIAL NORTHWARD EVACUATION FREEWAY',
        points: MUMBAI_REAL_ROADS.weh.points,
        targetShelterId: 'sh-mum-1'
      },
      {
        id: 'rd-eeh',
        name: 'BKC Connector Elevated Expressway to MMRDA Hub',
        type: 'secondary',
        color: '#f59e0b', // Amber
        strokeWidth: 4.0,
        flowSpeed: '45 km/h',
        distanceKm: MUMBAI_REAL_ROADS.bkc.distanceKm,
        durationMins: MUMBAI_REAL_ROADS.bkc.durationMins,
        status: 'OPEN - ELEVATED BKC CONNECTOR OPEN FOR BUS FLEETS',
        points: MUMBAI_REAL_ROADS.bkc.points,
        targetShelterId: 'sh-mum-2'
      },
      {
        id: 'rd-coastal',
        name: 'Bandra Reclamation High-Ground Coastal Link',
        type: 'tertiary',
        color: '#06b6d4', // Cyan
        strokeWidth: 3.2,
        flowSpeed: '35 km/h',
        distanceKm: MUMBAI_REAL_ROADS.reclamation.distanceKm,
        durationMins: MUMBAI_REAL_ROADS.reclamation.durationMins,
        status: 'OPEN - RAPID ONE-WAY SEAWARD RELIEF CORRIDOR',
        points: MUMBAI_REAL_ROADS.reclamation.points,
        targetShelterId: 'sh-mum-3'
      },
      {
        id: 'rd-mithi-hazard',
        name: 'Mithi River Low-Lying Causeway (Kurla-Bandra Link)',
        type: 'hazard',
        color: '#ef4444', // Hazard Red
        strokeWidth: 3.5,
        flowSpeed: '0 km/h (HALTED)',
        distanceKm: MUMBAI_REAL_ROADS.mithiHazard.distanceKm,
        durationMins: MUMBAI_REAL_ROADS.mithiHazard.durationMins,
        status: 'CLOSED - WATER OVERTOPPING RISK (STRICTLY BARRICADED)',
        points: MUMBAI_REAL_ROADS.mithiHazard.points,
        targetShelterId: null
      },
      {
        id: 'rd-thane-overflow',
        name: 'Eastern Express Highway to Thane-Mulund Safe Ridge (Secondary Mega-Overflow)',
        type: 'overflow',
        color: '#818cf8', // Indigo / Purple
        strokeWidth: 3.6,
        flowSpeed: '60 km/h',
        distanceKm: MUMBAI_REAL_ROADS.eehThane.distanceKm,
        durationMins: MUMBAI_REAL_ROADS.eehThane.durationMins,
        status: 'ACTIVE - INTER-DISTRICT CONVOYS EN ROUTE TO HIGHER RIDGE',
        points: MUMBAI_REAL_ROADS.eehThane.points,
        targetShelterId: 'sh-mum-4'
      },
      {
        id: 'rd-maritime',
        name: 'Arabian Sea Coastal Maritime Evacuation Lane (Coast Guard & Maritime Ops)',
        type: 'maritime',
        color: '#38bdf8', // Light Cyan Sea Blue
        strokeWidth: 3.5,
        flowSpeed: '22 knots (40 km/h)',
        distanceKm: MUMBAI_MARITIME_SEAWAY.distanceKm,
        durationMins: MUMBAI_MARITIME_SEAWAY.durationMins,
        status: 'ACTIVE - OFFSHORE FERRY & AMPHIBIOUS CRAFT EVACUATION CORRIDOR',
        points: MUMBAI_MARITIME_SEAWAY.points,
        targetShelterId: 'sh-mum-5'
      }
    ],
    shelters: [
      { id: 'sh-mum-1', name: 'NESCO Goregaon / Andheri High-Ground Mega Shelter', lat: 19.155, lon: 72.852, ratedCapacity: 25000, currentOccupancy: 14200, type: 'Candidate shelter (capacity illustrative)', routeVia: 'Western Express Highway (Green)', distanceKm: 16.5, travelMins: 24, osmId: 'way/1920481' },
      { id: 'sh-mum-2', name: 'BKC MMRDA Grounds Elevated Disaster Center', lat: 19.066, lon: 72.868, ratedCapacity: 8500, currentOccupancy: 6200, type: 'Candidate shelter (capacity illustrative)', routeVia: 'BKC Connector Viaduct (Amber)', distanceKm: 3.5, travelMins: 5, osmId: 'way/5829102' },
      { id: 'sh-mum-3', name: 'Bandra Reclamation Disaster Shelter #3', lat: 19.048, lon: 72.830, ratedCapacity: 4500, currentOccupancy: 3800, type: 'Candidate shelter (capacity illustrative)', routeVia: 'Reclamation Coastal Link (Cyan)', distanceKm: 3.3, travelMins: 4, osmId: 'node/4910284' },
      { id: 'sh-mum-4', name: 'Thane-Mulund Safe Ridge Mega Haven (Secondary Overflow)', lat: 19.174, lon: 72.955, ratedCapacity: 35000, currentOccupancy: 8500, type: 'Candidate shelter (capacity illustrative)', routeVia: 'EEH Inland Highway (Purple)', distanceKm: 20.5, travelMins: 25, isSecondary: true, osmId: 'rel/2910481' },
      { id: 'sh-mum-5', name: 'Colaba / Navy Nagar Coastal Staging Base (Maritime Haven)', lat: 18.928, lon: 72.845, ratedCapacity: 12000, currentOccupancy: 2100, type: 'Candidate shelter (capacity illustrative)', routeVia: 'Arabian Sea Nautical Corridor (Cyan)', distanceKm: 21.4, travelMins: 42, isMaritime: true, osmId: 'rel/5910294' }
    ],
    convoys: [
      { id: 'CNV-MUM-01', callsign: 'NDRF HEAVY RESCUE UNIT (BOATS & PUMPS)', mode: 'road', roadId: 'rd-weh', cargo: 'Inflatable Assault Boats + High-Discharge De-Watering Pumps', weightMt: 16.5, vehicleCount: 6, origin: 'Regional Heavy Response Staging Base', destination: 'NESCO Goregaon Mega Shelter', progressPct: 0.65, status: 'En Route', etaMinutes: 14, speedKmh: 48, routeColor: '#10b981' },
      { id: 'CNV-MUM-02', callsign: 'CIVIL EMERGENCY POTABLE WATER & RATIONS', mode: 'road', roadId: 'rd-eeh', cargo: '25,000L Potable Water + Ready-to-Eat Emergency Meals', weightMt: 22.0, vehicleCount: 8, origin: 'Civil Supplies Regional Staging Depot', destination: 'BKC MMRDA Grounds Center', progressPct: 0.52, status: 'En Route', etaMinutes: 8, speedKmh: 45, routeColor: '#f59e0b' },
      { id: 'CNV-MUM-03', callsign: 'MOBILE TRAUMA SURGICAL & FIELD CLINIC UNIT', mode: 'road', roadId: 'rd-coastal', cargo: 'Field Surgery Modules, Blood Packs & Trauma Antibiotics', weightMt: 7.2, vehicleCount: 3, origin: 'Central Hospital Disaster Wing', destination: 'Bandra Reclamation Shelter #3', progressPct: 0.82, status: 'En Route', etaMinutes: 5, speedKmh: 42, routeColor: '#06b6d4' },
      { id: 'CNV-MUM-04', callsign: 'COAST GUARD OFFSHORE RESCUE CRAFT', mode: 'maritime', roadId: 'rd-maritime', cargo: 'Fast Interceptor Craft + Offshore Triage Deck', weightMt: 120.0, vehicleCount: 1, origin: 'Coastal Harbor Jetty / Pier', destination: 'Colaba Coastal Staging Terminal', progressPct: 0.40, status: 'En Route', etaMinutes: 25, speedKmh: 40, routeColor: '#38bdf8' }
    ]
  },
  {
    id: 'LIVE-BOB-01',
    isLive: true,
    systemName: 'Bay of Bengal Cyclonic Depression Watch (85% Probability)',
    category: 'Severe Cyclonic Storm (Formative Stage)',
    validWindow: '05 OCT 2026 18:00 IST – 08 OCT 2026 23:30 IST',
    forecastProbability: '85%',
    threatLevel: 'RED WARNING',
    region: 'Coastal West Bengal & North Odisha (Dhamra – Digha – Sagar Island Corridor)',
    state: 'West Bengal / Odisha',
    centerCoords: [87.525, 21.632], // [lon, lat] Digha Coastal Ward
    windSpeedKmh: 115,
    expectedRainfallMm: 280,
    evacuationPopulation: 54200,
    censusDensityPerKm2: 1080,
    originSectors: [
      { id: 'sec-a', name: 'Sector Alpha: Digha Beachfront & Fishermen Hamlets', lat: 21.626, lon: 87.510, pop: 22000, risk: 'EXTREME TIDAL SURGE (3.5M)' },
      { id: 'sec-b', name: 'Sector Bravo: Lowland Estuary & Mudflats Settlement', lat: 21.638, lon: 87.535, pop: 18500, risk: 'SEVERE WATERLOGGING / BREACH' },
      { id: 'sec-c', name: 'Sector Charlie: Old Digha Civic & Market Precinct', lat: 21.645, lon: 87.502, pop: 13700, risk: 'STRUCTURAL GALE IMPACT (115 KM/H)' }
    ],
    roads: [
      {
        id: 'rd-nh116b',
        name: 'NH-116B High-Speed Evacuation Expressway (4 Lanes)',
        type: 'primary',
        color: '#10b981', // Neon Emerald
        strokeWidth: 4.5,
        flowSpeed: '65 km/h',
        distanceKm: DIGHA_REAL_ROADS.nh116b.distanceKm,
        durationMins: DIGHA_REAL_ROADS.nh116b.durationMins,
        status: 'OPEN - HIGHWAY POLICE CLEARANCE ACTIVE',
        points: DIGHA_REAL_ROADS.nh116b.points,
        targetShelterId: 'sh-bob-1'
      },
      {
        id: 'rd-sh4',
        name: 'SH-4 Coastal Arterial Highway (Elevated Embankment)',
        type: 'secondary',
        color: '#f59e0b', // Neon Amber
        strokeWidth: 3.5,
        flowSpeed: '45 km/h',
        distanceKm: DIGHA_REAL_ROADS.sh4.distanceKm,
        durationMins: DIGHA_REAL_ROADS.sh4.durationMins,
        status: 'OPEN - REGULATED TRANSIT BUSES ONLY',
        points: DIGHA_REAL_ROADS.sh4.points,
        targetShelterId: 'sh-bob-3'
      },
      {
        id: 'rd-marine',
        name: 'Digha-Sankarpur Marine Drive Coastal Evacuation Link',
        type: 'tertiary',
        color: '#06b6d4', // Cyan
        strokeWidth: 3.0,
        flowSpeed: '35 km/h',
        status: 'OPEN - RAPID ONE-WAY SEAWARD EVACUATION',
        points: [
          [87.510, 21.626], [87.525, 21.630], [87.550, 21.636], [87.585, 21.642]
        ],
        targetShelterId: 'sh-bob-4'
      },
      {
        id: 'rd-canal-hazard',
        name: 'Lowland Canal Embankment Road (Jhamu Sector)',
        type: 'hazard',
        color: '#ef4444', // Crimson Hazard
        strokeWidth: 3.0,
        flowSpeed: '0 km/h (HALTED)',
        status: 'CLOSED - INUNDATION RISK (DO NOT USE)',
        points: [
          [87.510, 21.626], [87.525, 21.610], [87.555, 21.618]
        ],
        targetShelterId: null
      },
      {
        id: 'rd-contai-inland',
        name: 'Contai Inland Mega-Shelter Corridor (Secondary Overflow)',
        type: 'overflow',
        color: '#818cf8', // Indigo / Purple
        strokeWidth: 3.2,
        flowSpeed: '55 km/h',
        status: 'ACTIVE FOR SECONDARY OVERFLOW DISPATCH',
        points: [
          [87.568, 21.685], [87.620, 21.720], [87.680, 21.750], [87.752, 21.778]
        ],
        targetShelterId: 'sh-bob-5'
      }
    ],
    shelters: [
      { id: 'sh-bob-1', name: 'Ramnagar Block II Multipurpose Cyclone Shelter (RCC)', lat: 21.685, lon: 87.568, ratedCapacity: 2800, currentOccupancy: 2140, type: 'Multipurpose Cyclone Shelter', routeVia: 'NH-116B Expressway (Green)', distanceKm: 5.2, travelMins: 14, osmId: 'way/8421092' },
      { id: 'sh-bob-2', name: 'Digha Coastal Community Disaster Center #1', lat: 21.632, lon: 87.525, ratedCapacity: 2200, currentOccupancy: 2150, type: 'Community Center / Cyclone Shelter', routeVia: 'NH-116B Sector Connector', distanceKm: 2.1, travelMins: 8, osmId: 'node/5291048' },
      { id: 'sh-bob-3', name: 'Alankarpur High School Emergency Relief Camp', lat: 21.652, lon: 87.551, ratedCapacity: 1800, currentOccupancy: 1420, type: 'Reinforced Public School Camp', routeVia: 'SH-4 Arterial Highway (Amber)', distanceKm: 4.8, travelMins: 16, osmId: 'way/7821903' },
      { id: 'sh-bob-4', name: 'Sankarpur Harbor Fisheries Marine Refuge Post', lat: 21.642, lon: 87.585, ratedCapacity: 1600, currentOccupancy: 950, type: 'Fisheries Marine Refuge', routeVia: 'Marine Drive Link (Cyan)', distanceKm: 6.8, travelMins: 20, osmId: 'node/6391024' },
      { id: 'sh-bob-5', name: 'Contai Inland Mega Disaster Haven (Secondary Overflow)', lat: 21.778, lon: 87.752, ratedCapacity: 18000, currentOccupancy: 6200, type: 'Sub-Divisional High-Elevation Safe Base', routeVia: 'Contai Inland Expressway (Purple)', distanceKm: 31.5, travelMins: 42, isSecondary: true, osmId: 'rel/2910481' }
    ],
    convoys: [
      { id: 'CNV-BOB-01', callsign: 'RELIEF CONVOY ALPHA (FOOD & WATER)', cargo: '14,000L Potable Water + High-Calorie Rations', weightMt: 16.5, vehicleCount: 6, origin: 'Kharagpur Regional Supply Depot', destination: 'Ramnagar Block II Shelter', progressPct: 0.68, status: 'En Route', etaMinutes: 22, speedKmh: 52, routeColor: '#10b981' },
      { id: 'CNV-BOB-02', callsign: 'MEDICAL RESCUE CONVOY BRAVO', cargo: 'Trauma Surgical Kits, Saline & Antidotes', weightMt: 5.8, vehicleCount: 3, origin: 'Tamluk District Hospital Base', destination: 'Digha Community Disaster Center', progressPct: 0.45, status: 'En Route', etaMinutes: 38, speedKmh: 46, routeColor: '#f59e0b' },
      { id: 'CNV-BOB-03', callsign: 'EMERGENCY SHELTER KITS CHARLIE', cargo: 'Heavy-Duty Tarpaulins, Inflatable Rafts, Gensets', weightMt: 11.2, vehicleCount: 4, origin: 'Kolaghat NDRF 2nd Bn Hub', destination: 'Alankarpur High School Camp', progressPct: 0.22, status: 'Dispatched', etaMinutes: 65, speedKmh: 48, routeColor: '#06b6d4' }
    ]
  },
  {
    id: 'LIVE-KONKAN-02',
    isLive: true,
    systemName: 'Western Ghats / Konkan Coastal Extreme Deluge (78% Probability)',
    category: 'Flash Flood & Landslide Watch',
    validWindow: '05 OCT 2026 12:00 IST – 07 OCT 2026 21:00 IST',
    forecastProbability: '78%',
    threatLevel: 'ORANGE ALERT',
    region: 'Mahad – Chiplun – Savitri River Basin, Maharashtra',
    state: 'Maharashtra',
    centerCoords: [73.422, 18.082],
    windSpeedKmh: 75,
    expectedRainfallMm: 340,
    evacuationPopulation: 41000,
    censusDensityPerKm2: 890,
    originSectors: [
      { id: 'sec-k1', name: 'Sector Alpha: Savitri River Low-Lying Ghat Ward', lat: 18.080, lon: 73.420, pop: 18000, risk: 'RIVER SWELL / FLASH INUNDATION' },
      { id: 'sec-k2', name: 'Sector Bravo: Mahad Industrial Lowland Precinct', lat: 18.095, lon: 73.435, pop: 14500, risk: 'SLOPE FAILURE & RUNOFF ACCUMULATION' },
      { id: 'sec-k3', name: 'Sector Charlie: Old City Bazaar & Riverbank Colony', lat: 18.072, lon: 73.415, pop: 8500, risk: 'STRUCTURAL WATERLOGGING' }
    ],
    roads: [
      {
        id: 'rd-nh66',
        name: 'NH-66 Mumbai-Goa Highway (High Ridge Evacuation Corrdor)',
        type: 'primary',
        color: '#10b981',
        strokeWidth: 4.5,
        flowSpeed: '60 km/h',
        status: 'OPEN - HIGH ELEVATION RIDGE SECURED',
        points: [[73.420, 18.080], [73.445, 18.110], [73.475, 18.140]],
        targetShelterId: 'sh-kon-1'
      },
      {
        id: 'rd-sh96',
        name: 'SH-96 Mahabaleshwar Valley Link Road',
        type: 'secondary',
        color: '#f59e0b',
        strokeWidth: 3.5,
        flowSpeed: '38 km/h',
        status: 'CAUTION - RESTRICTED TRAFFIC SPEED',
        points: [[73.435, 18.095], [73.470, 18.085], [73.505, 18.070]],
        targetShelterId: 'sh-kon-2'
      },
      {
        id: 'rd-bridge-hazard',
        name: 'Old Savitri River Causeway Bridge',
        type: 'hazard',
        color: '#ef4444',
        strokeWidth: 3.0,
        flowSpeed: '0 km/h',
        status: 'SUBMERGED - STRICTLY BARRICADED BY POLICE',
        points: [[73.415, 18.072], [73.425, 18.068], [73.435, 18.065]],
        targetShelterId: null
      }
    ],
    shelters: [
      { id: 'sh-kon-1', name: 'Mahad Industrial High-Ground Relief Hub', lat: 18.140, lon: 73.475, ratedCapacity: 3500, currentOccupancy: 2400, type: 'Reinforced Industrial Complex', routeVia: 'NH-66 Ridge Highway (Green)', distanceKm: 8.4, travelMins: 18, osmId: 'way/1920481' },
      { id: 'sh-kon-2', name: 'Poladpur Hillside Municipal Flood Center', lat: 18.070, lon: 73.505, ratedCapacity: 2800, currentOccupancy: 1950, type: 'Community Hill Refuge', routeVia: 'SH-96 Valley Link (Amber)', distanceKm: 9.8, travelMins: 22, osmId: 'node/4910284' },
      { id: 'sh-kon-3', name: 'Mangaon High-Elevation Safe Base (Secondary Overflow)', lat: 18.250, lon: 73.285, ratedCapacity: 15000, currentOccupancy: 3800, type: 'Inter-District Safe Hub', routeVia: 'NH-66 Northward Expressway', distanceKm: 28.0, travelMins: 38, isSecondary: true, osmId: 'rel/3819204' }
    ],
    convoys: [
      { id: 'CNV-KON-01', callsign: 'SDRF FLOOD RESCUE UNIT 04', cargo: 'Power Boats, Ropes, De-Watering Pumps', weightMt: 8.5, vehicleCount: 4, origin: 'Pune SDRF Regional Base', destination: 'Mahad Industrial Hub', progressPct: 0.58, status: 'En Route', etaMinutes: 28, speedKmh: 44, routeColor: '#10b981' },
      { id: 'CNV-KON-02', callsign: 'MEDICAL EPIDEMIC PREVENTION CONVOY', cargo: 'Water Purification Tablets & Typhoid Vaccines', weightMt: 4.2, vehicleCount: 2, origin: 'Navi Mumbai Civil Depot', destination: 'Poladpur Hillside Center', progressPct: 0.32, status: 'En Route', etaMinutes: 54, speedKmh: 42, routeColor: '#f59e0b' }
    ]
  },
  {
    id: 'LIVE-KUTCH-03',
    isLive: true,
    systemName: 'North Gujarat / Kutch Storm Surge Watch (74% Probability)',
    category: 'Coastal Depression & Tidal Inundation',
    validWindow: '06 OCT 2026 06:00 IST – 08 OCT 2026 18:00 IST',
    forecastProbability: '74%',
    threatLevel: 'ORANGE ALERT',
    region: 'Mandvi – Mundra – Kandla Coastal Belt, Gujarat',
    state: 'Gujarat',
    centerCoords: [69.718, 22.828],
    windSpeedKmh: 95,
    expectedRainfallMm: 190,
    evacuationPopulation: 34500,
    censusDensityPerKm2: 420,
    originSectors: [
      { id: 'sec-g1', name: 'Sector Alpha: Mandvi Port & Fisherman Colony', lat: 22.825, lon: 69.715, pop: 16000, risk: 'STORM SURGE WAVE RUNUP' },
      { id: 'sec-g2', name: 'Sector Bravo: Lowland Salt Flat Habitations', lat: 22.845, lon: 69.735, pop: 11500, risk: 'TIDAL BACKWATER INUNDATION' },
      { id: 'sec-g3', name: 'Sector Charlie: Coastal Rural Hamlets', lat: 22.810, lon: 69.695, pop: 7000, risk: 'GALE FORCE WINDS (95 KM/H)' }
    ],
    roads: [
      {
        id: 'rd-nh41',
        name: 'NH-41 Coastal-Inland Expressway to Bhuj',
        type: 'primary',
        color: '#10b981',
        strokeWidth: 4.5,
        flowSpeed: '70 km/h',
        status: 'OPEN - DESIGNATED HIGH-SPEED CORRIDOR',
        points: [[69.715, 22.825], [69.735, 22.875], [69.765, 22.945], [69.790, 23.050]],
        targetShelterId: 'sh-kutch-1'
      },
      {
        id: 'rd-sh48',
        name: 'SH-48 Kutch Coastal Highway (Mundra Link)',
        type: 'secondary',
        color: '#f59e0b',
        strokeWidth: 3.5,
        flowSpeed: '50 km/h',
        status: 'OPEN - MONITORED BY GUJARAT POLICE',
        points: [[69.735, 22.845], [69.785, 22.855], [69.845, 22.865]],
        targetShelterId: 'sh-kutch-2'
      }
    ],
    shelters: [
      { id: 'sh-kutch-1', name: 'Mandvi Sub-Divisional Multi-Purpose Cyclone Shelter', lat: 22.945, lon: 69.765, ratedCapacity: 3800, currentOccupancy: 2900, type: 'RCC Cyclone Shelter', routeVia: 'NH-41 Expressway (Green)', distanceKm: 14.5, travelMins: 20, osmId: 'way/3810291' },
      { id: 'sh-kutch-2', name: 'Mundra Port Community Resilience Hall', lat: 22.865, lon: 69.845, ratedCapacity: 3200, currentOccupancy: 2100, type: 'Reinforced Hall', routeVia: 'SH-48 Coastal Highway (Amber)', distanceKm: 16.2, travelMins: 24, osmId: 'node/9201948' },
      { id: 'sh-kutch-3', name: 'Bhuj Mega Inland Defense Complex (Secondary Overflow)', lat: 23.250, lon: 69.670, ratedCapacity: 20000, currentOccupancy: 4500, type: 'District Safe Hub', routeVia: 'NH-41 to Bhuj Safe Zone', distanceKm: 52.0, travelMins: 55, isSecondary: true, osmId: 'rel/4920184' }
    ],
    convoys: [
      { id: 'CNV-KUTCH-01', callsign: 'GSDMA RELIEF CONVOY 01', cargo: 'Dry Rations, Milk Powder, Diesel Generators', weightMt: 18.0, vehicleCount: 7, origin: 'Gandhidham Port Warehouse', destination: 'Mandvi Sub-Divisional Shelter', progressPct: 0.72, status: 'En Route', etaMinutes: 18, speedKmh: 58, routeColor: '#10b981' }
    ]
  },
  {
    id: 'LIVE-COROMANDEL-04',
    isLive: true,
    systemName: 'Coromandel Coast / Coastal Tamil Nadu Deep Depression (81% Probability)',
    category: 'Depression / Heavy Rain Alert',
    validWindow: '06 OCT 2026 00:00 IST – 09 OCT 2026 12:00 IST',
    forecastProbability: '81%',
    threatLevel: 'ORANGE ALERT',
    region: 'Cuddalore – Nagapattinam Cauvery Delta Sector',
    state: 'Tamil Nadu',
    centerCoords: [79.765, 11.748],
    windSpeedKmh: 85,
    expectedRainfallMm: 260,
    evacuationPopulation: 46000,
    censusDensityPerKm2: 820,
    originSectors: [
      { id: 'sec-tn1', name: 'Sector Alpha: Silver Beach & Coastal Fishing Hamlets', lat: 11.745, lon: 79.762, pop: 20500, risk: 'TIDAL SURGE & RIVER BACKFLOW' },
      { id: 'sec-tn2', name: 'Sector Bravo: Gadilam Riverbank Settlements', lat: 11.758, lon: 79.775, pop: 15500, risk: 'RIVER SWELL / LOWLAND FLOODING' },
      { id: 'sec-tn3', name: 'Sector Charlie: Cuddalore Old Town Core', lat: 11.735, lon: 79.750, pop: 10000, risk: 'INTENSE CONVECTIVE RAINFALL' }
    ],
    roads: [
      {
        id: 'rd-ecr',
        name: 'East Coast Road (ECR / NH-332A High Elevated Evacuation Route)',
        type: 'primary',
        color: '#10b981',
        strokeWidth: 4.5,
        flowSpeed: '65 km/h',
        status: 'OPEN - DESIGNATED RAPID CORRIDOR',
        points: [[79.762, 11.745], [79.740, 11.770], [79.715, 11.820]],
        targetShelterId: 'sh-tn-1'
      },
      {
        id: 'rd-nh36',
        name: 'NH-36 Delta Arterial Highway to Chidambaram',
        type: 'secondary',
        color: '#f59e0b',
        strokeWidth: 3.5,
        flowSpeed: '45 km/h',
        status: 'OPEN - CIVIC BUS FLEET ROLLING',
        points: [[79.775, 11.758], [79.745, 11.710], [79.705, 11.640]],
        targetShelterId: 'sh-tn-2'
      },
      {
        id: 'rd-kollidam-hazard',
        name: 'Kollidam Lowland Estuary Causeway',
        type: 'hazard',
        color: '#ef4444',
        strokeWidth: 3.0,
        flowSpeed: '0 km/h',
        status: 'CLOSED - WATER OVERTOPPING RISK',
        points: [[79.750, 11.735], [79.765, 11.715], [79.780, 11.700]],
        targetShelterId: null
      }
    ],
    shelters: [
      { id: 'sh-tn-1', name: 'Cuddalore Government Arts College Mega Shelter', lat: 11.820, lon: 79.715, ratedCapacity: 4500, currentOccupancy: 3100, type: 'Elevated College Campus Refuge', routeVia: 'ECR / NH-332A (Green)', distanceKm: 11.2, travelMins: 18, osmId: 'way/4820194' },
      { id: 'sh-tn-2', name: 'Chidambaram Community Disaster Refuge Center', lat: 11.640, lon: 79.705, ratedCapacity: 3800, currentOccupancy: 2800, type: 'Reinforced Community Shelter', routeVia: 'NH-36 Highway (Amber)', distanceKm: 15.8, travelMins: 24, osmId: 'node/8201948' }
    ],
    convoys: [
      { id: 'CNV-TN-01', callsign: 'TNDRRA WATER & RATION CONVOY', cargo: 'Packet Meals, Fresh Water Tankers, Baby Formula', weightMt: 15.0, vehicleCount: 5, origin: 'Villupuram Logistics Base', destination: 'Cuddalore Arts College Shelter', progressPct: 0.62, status: 'En Route', etaMinutes: 24, speedKmh: 50, routeColor: '#10b981' }
    ]
  },
  {
    id: 'LIVE-ASSAM-05',
    isLive: true,
    systemName: 'Brahmaputra Riverine Basin Inundation Watch (76% Probability)',
    category: 'Riverine Flood & Embankment Breach',
    validWindow: '05 OCT 2026 15:00 IST – 08 OCT 2026 18:00 IST',
    forecastProbability: '76%',
    threatLevel: 'ORANGE ALERT',
    region: 'Dibrugarh – Majuli Embankment Corridor, Assam',
    state: 'Assam',
    centerCoords: [94.908, 27.481],
    windSpeedKmh: 55,
    expectedRainfallMm: 290,
    evacuationPopulation: 31000,
    censusDensityPerKm2: 390,
    originSectors: [
      { id: 'sec-as1', name: 'Sector Alpha: Brahmaputra Riverbank Chars & Hamlets', lat: 27.485, lon: 94.905, pop: 15000, risk: 'IMMEDIATE EMBANKMENT BREACH' },
      { id: 'sec-as2', name: 'Sector Bravo: Low-Lying Paddy Floodplain Wards', lat: 27.472, lon: 94.920, pop: 10500, risk: 'SLOW-RISE WATER ACCUMULATION' },
      { id: 'sec-as3', name: 'Sector Charlie: Old Market & Rail Siding Settlement', lat: 27.465, lon: 94.895, pop: 5500, risk: 'DRAINAGE CHOKE / RAINFLOOD' }
    ],
    roads: [
      {
        id: 'rd-nh15',
        name: 'NH-15 Bogibeel High Embankment Expressway',
        type: 'primary',
        color: '#10b981',
        strokeWidth: 4.5,
        flowSpeed: '60 km/h',
        status: 'OPEN - HIGH BOGIBEEL APPROACH VIADUCT',
        points: [[94.905, 27.485], [94.875, 27.505], [94.845, 27.535]],
        targetShelterId: 'sh-as-1'
      },
      {
        id: 'rd-at',
        name: 'Assam Trunk Road (AT Road Elevated Arterial)',
        type: 'secondary',
        color: '#f59e0b',
        strokeWidth: 3.5,
        flowSpeed: '40 km/h',
        status: 'OPEN - CIVIC EVACUATION BUSES DEPLOYED',
        points: [[94.920, 27.472], [94.950, 27.460], [94.980, 27.445]],
        targetShelterId: 'sh-as-2'
      }
    ],
    shelters: [
      { id: 'sh-as-1', name: 'Dibrugarh University High-Ground Flood Shelter Complex', lat: 27.535, lon: 94.845, ratedCapacity: 4200, currentOccupancy: 2800, type: 'Elevated Institutional Complex', routeVia: 'NH-15 Highway (Green)', distanceKm: 9.8, travelMins: 16, osmId: 'way/7821903' },
      { id: 'sh-as-2', name: 'Moran High School Relief Camp', lat: 27.445, lon: 94.980, ratedCapacity: 3000, currentOccupancy: 1950, type: 'Reinforced Public School', routeVia: 'AT Road Arterial (Amber)', distanceKm: 12.4, travelMins: 22, osmId: 'node/5291048' }
    ],
    convoys: [
      { id: 'CNV-AS-01', callsign: 'NDRF 1ST BN ASSAM QUICK RESCUE', cargo: 'Inflatable Assault Boats & Life Jackets', weightMt: 6.5, vehicleCount: 3, origin: 'Guwahati Air Force Station Depot', destination: 'Dibrugarh University Complex', progressPct: 0.54, status: 'En Route', etaMinutes: 32, speedKmh: 45, routeColor: '#10b981' }
    ]
  }
];

// Helper to convert historic benchmark events into our rich format
const ADAPTED_HISTORIC_EVENTS = HISTORIC_EXTREME_EVENTS.map(ev => {
  const [lon, lat] = ev.coords || [88.10, 21.68];
  return {
    id: ev.id,
    isLive: false,
    systemName: `${ev.systemName} (Historic Benchmark)`,
    category: ev.classification || 'Historic Disaster Replay',
    validWindow: ev.dates || 'Historical Reference',
    forecastProbability: '100% Ground Truth',
    threatLevel: 'HISTORIC BENCHMARK',
    region: ev.region,
    state: ev.region.split(' / ')[0],
    centerCoords: [lon, lat],
    windSpeedKmh: ev.peakMetric?.includes('km/h') ? parseInt(ev.peakMetric, 10) : 120,
    expectedRainfallMm: 240,
    evacuationPopulation: 48500,
    censusDensityPerKm2: 950,
    originSectors: [
      { id: `${ev.id}-sec1`, name: 'Sector Alpha: Immediate Impact Epicenter', lat: lat, lon: lon, pop: 24000, risk: 'MAX GALE & TIDAL SURGE' },
      { id: `${ev.id}-sec2`, name: 'Sector Bravo: Lowland Inundation Belt', lat: lat + 0.015, lon: lon + 0.02, pop: 16500, risk: 'HIGH WATERLOGGING' },
      { id: `${ev.id}-sec3`, name: 'Sector Charlie: Peripheral Rural Settlements', lat: lat - 0.015, lon: lon - 0.02, pop: 8000, risk: 'STRUCTURAL DAMAGE' }
    ],
    roads: [
      {
        id: `${ev.id}-rd-primary`,
        name: 'Primary High-Capacity Evacuation Highway Corridor',
        type: 'primary',
        color: '#10b981',
        strokeWidth: 4.5,
        flowSpeed: '60 km/h',
        status: 'OPEN - RAPID EVACUATION ARTERY',
        points: [[lon, lat], [lon + 0.03, lat + 0.04], [lon + 0.07, lat + 0.08]],
        targetShelterId: `${ev.id}-sh1`
      },
      {
        id: `${ev.id}-rd-secondary`,
        name: 'Secondary Civil Arterial Relief Road',
        type: 'secondary',
        color: '#f59e0b',
        strokeWidth: 3.5,
        flowSpeed: '40 km/h',
        status: 'OPEN - BUS CONVOY LANE',
        points: [[lon + 0.02, lat + 0.015], [lon + 0.05, lat + 0.01], [lon + 0.08, lat - 0.01]],
        targetShelterId: `${ev.id}-sh2`
      },
      {
        id: `${ev.id}-rd-hazard`,
        name: 'Lowland Causeway (Inundation Danger)',
        type: 'hazard',
        color: '#ef4444',
        strokeWidth: 3.0,
        flowSpeed: '0 km/h',
        status: 'CLOSED - INUNDATION DANGER',
        points: [[lon, lat], [lon - 0.02, lat - 0.03], [lon - 0.04, lat - 0.04]],
        targetShelterId: null
      }
    ],
    shelters: [
      { id: `${ev.id}-sh1`, name: `${ev.systemName.split(' ')[0]} Primary Cyclone Refuge`, lat: lat + 0.08, lon: lon + 0.07, ratedCapacity: 3500, currentOccupancy: 2800, type: 'RCC Cyclone Shelter', routeVia: 'Primary Highway (Green)', distanceKm: 8.5, travelMins: 16, osmId: 'way/8421092' },
      { id: `${ev.id}-sh2`, name: `${ev.systemName.split(' ')[0]} Secondary Community Hall`, lat: lat - 0.01, lon: lon + 0.08, ratedCapacity: 2200, currentOccupancy: 1750, type: 'Community Hall', routeVia: 'Secondary Road (Amber)', distanceKm: 9.2, travelMins: 20, osmId: 'node/5291048' },
      { id: `${ev.id}-sh3`, name: `${ev.systemName.split(' ')[0]} District Inland Mega Camp`, lat: lat + 0.22, lon: lon + 0.25, ratedCapacity: 15000, currentOccupancy: 4200, type: 'Inland Safe Base', routeVia: 'Inter-District Highway', distanceKm: 34.0, travelMins: 45, isSecondary: true, osmId: 'rel/2910481' }
    ],
    convoys: [
      { id: `CNV-${ev.id}-01`, callsign: 'HISTORIC RELIEF BATTALION 01', cargo: 'Food, Clean Water & Tents', weightMt: 12.0, vehicleCount: 5, origin: 'Regional Base', destination: `${ev.systemName.split(' ')[0]} Primary Shelter`, progressPct: 0.70, status: 'En Route', etaMinutes: 20, speedKmh: 48, routeColor: '#10b981' }
    ]
  };
});

// All Available Incidents
export const ALL_OPERATIONAL_INCIDENTS = [
  ...LIVE_FORECAST_THREATS,
  ...ADAPTED_HISTORIC_EVENTS
];

export default function EvacuationOps({
  operatorId = 'OP-8842-MET',
  onNavigate
}) {
  // Navigation Tabs: 'routes' | 'convoys'
  const [activeSubTab, setActiveSubTab] = useState('routes');

  // Threat Category Filter: 'live' | 'all' | 'historic'
  const [threatCategory, setThreatCategory] = useState('live');

  // Selected Threat Incident (Default: Mumbai Metropolitan Deluge Contingency)
  const [selectedIncidentId, setSelectedIncidentId] = useState('LIVE-MUMBAI-01');

  // Filtered List
  const visibleIncidents = useMemo(() => {
    if (threatCategory === 'live') return LIVE_FORECAST_THREATS;
    if (threatCategory === 'historic') return ADAPTED_HISTORIC_EVENTS;
    return ALL_OPERATIONAL_INCIDENTS;
  }, [threatCategory]);

  const activeIncident = useMemo(() => {
    return ALL_OPERATIONAL_INCIDENTS.find(inc => inc.id === selectedIncidentId) || LIVE_FORECAST_THREATS[0];
  }, [selectedIncidentId]);

  // Selected Shelter & Route for Deep Inspection
  const [selectedShelterId, setSelectedShelterId] = useState('sh-mum-1');
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  // Road Filter State: 'all' | 'primary' | 'secondary' | 'hazard'
  const [roadFilter, setRoadFilter] = useState('all');

  // Map Zoom & Pan State (Zoom 13 for high-precision street & highway curvature)
  const [zoomLevel, setZoomLevel] = useState(13);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Layer Toggles & Map Basemap Mode ('satellite' | 'dark' | 'streets')
  const [mapMode, setMapMode] = useState('satellite');
  const [showTiles, setShowTiles] = useState(true);
  const [showDangerZone, setShowDangerZone] = useState(true);
  const [showFlowParticles, setShowFlowParticles] = useState(true);
  const [showShelterPins, setShowShelterPins] = useState(true);

  // Convoy simulation
  const [convoys, setConvoys] = useState(activeIncident.convoys || []);
  const [selectedConvoyId, setSelectedConvoyId] = useState(activeIncident.convoys[0]?.id || null);
  const [isSimulatingConvoys, setIsSimulatingConvoys] = useState(true);

  // Canvas & Animation References
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const flowProgressRef = useRef(0);
  const pulseRef = useRef(0);
  const tileCacheRef = useRef(new Map());

  // Sync state when active incident changes
  useEffect(() => {
    setConvoys(activeIncident.convoys || []);
    setSelectedConvoyId(activeIncident.convoys[0]?.id || null);
    setSelectedShelterId(activeIncident.shelters[0]?.id || null);
    setSelectedRouteId(null);
    setPanOffset({ x: 0, y: 0 });
  }, [activeIncident]);

  // Capacity calculations
  const totalLocalCapacity = useMemo(() => {
    return activeIncident.shelters.filter(s => !s.isSecondary).reduce((acc, s) => acc + s.ratedCapacity, 0);
  }, [activeIncident]);

  const capacityShortfall = Math.max(0, activeIncident.evacuationPopulation - totalLocalCapacity);

  // Convoy simulation loop
  useEffect(() => {
    if (!isSimulatingConvoys) return;
    const interval = setInterval(() => {
      setConvoys(prev => prev.map(c => {
        if (c.status === 'Arrived') return c;
        const nextProgress = Math.min(1.0, c.progressPct + 0.006);
        const nextEta = Math.max(0, Math.round(c.etaMinutes * (1 - (nextProgress - c.progressPct))));
        const nextStatus = nextProgress >= 1.0 ? 'Arrived' : (nextProgress > 0.05 ? 'En Route' : 'Dispatched');
        return {
          ...c,
          progressPct: nextProgress,
          etaMinutes: nextEta,
          status: nextStatus
        };
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, [isSimulatingConvoys]);

  // =========================================================================
  // 2. SLIPPY TILE & CANVAS ROUTE RENDERING ENGINE
  // =========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      pulseRef.current = (pulseRef.current + 0.035) % (Math.PI * 2);
      flowProgressRef.current = (flowProgressRef.current + 0.012) % 1.0;

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

      // Deep Dark Tactical Ops Ground
      ctx.fillStyle = '#080d16';
      ctx.fillRect(0, 0, width, height);

      // Center Lat/Lon of current incident
      const [centerLon, centerLat] = activeIncident.centerCoords || [87.525, 21.632];

      // Slippy Map Math for Web Mercator (EPSG:3857)
      const zoom = zoomLevel;
      const scale = 256 * Math.pow(2, zoom);

      const lonToX = (lon) => ((lon + 180) / 360) * scale;
      const latToY = (lat) => {
        const latRad = (lat * Math.PI) / 180;
        return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
      };

      const centerWorldX = lonToX(centerLon);
      const centerWorldY = latToY(centerLat);

      const screenOriginX = width / 2 + panOffset.x;
      const screenOriginY = height / 2 + panOffset.y;

      const project = (coords) => {
        const [lon, lat] = coords;
        const wx = lonToX(lon);
        const wy = latToY(lat);
        return [
          screenOriginX + (wx - centerWorldX),
          screenOriginY + (wy - centerWorldY)
        ];
      };

      // -------------------------------------------------------------
      // LAYER 1: CARTO-DB DARK MATTER REAL MAP TILES
      // -------------------------------------------------------------
      if (showTiles) {
        const tileCount = Math.pow(2, zoom);
        const minTileX = Math.floor((centerWorldX - screenOriginX) / 256);
        const maxTileX = Math.floor((centerWorldX - screenOriginX + width) / 256);
        const minTileY = Math.floor((centerWorldY - screenOriginY) / 256);
        const maxTileY = Math.floor((centerWorldY - screenOriginY + height) / 256);

        for (let tx = minTileX; tx <= maxTileX; tx++) {
          for (let ty = minTileY; ty <= maxTileY; ty++) {
            if (tx < 0 || tx >= tileCount || ty < 0 || ty >= tileCount) continue;
            const tileX = screenOriginX + tx * 256 - centerWorldX;
            const tileY = screenOriginY + ty * 256 - centerWorldY;

            const tileKey = `${mapMode}/${zoom}/${tx}/${ty}`;
            let img = tileCacheRef.current.get(tileKey);

            if (!img) {
              img = new Image();
              img.crossOrigin = 'anonymous';
              let tileUrl = '';
              if (mapMode === 'satellite') {
                tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}`;
              } else if (mapMode === 'dark') {
                tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${zoom}/${ty}/${tx}`;
              } else {
                tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${zoom}/${ty}/${tx}`;
              }
              img.src = tileUrl;
              img.onload = () => {
                tileCacheRef.current.set(tileKey, img);
              };
              img.onerror = () => {
                tileCacheRef.current.set(tileKey, false);
              };
              tileCacheRef.current.set(tileKey, img);
            }

            if (img && img.complete && img.naturalWidth !== 0) {
              ctx.drawImage(img, tileX, tileY, 256, 256);
            } else {
              // Tactical subtle grid fallback
              ctx.strokeStyle = 'rgba(74, 111, 165, 0.12)';
              ctx.lineWidth = 0.5;
              ctx.strokeRect(tileX, tileY, 256, 256);
            }
          }
        }
      }

      // Tactical Vignette & Military Contrast Darkening
      if (mapMode === 'satellite') {
        // Dark military transparent tint so glowing neon roads pop vividly
        ctx.fillStyle = 'rgba(6, 11, 20, 0.38)';
        ctx.fillRect(0, 0, width, height);
      }
      const grad = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.35, width / 2, height / 2, Math.min(width, height) * 0.75);
      grad.addColorStop(0, 'rgba(8, 13, 22, 0.05)');
      grad.addColorStop(1, 'rgba(8, 13, 22, 0.72)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // -------------------------------------------------------------
      // LAYER 2: 5KM PINPOINT DANGER ZONE & ORIGIN SECTORS
      // -------------------------------------------------------------
      const dangerCenter = project(activeIncident.centerCoords);
      // 5km in Web Mercator pixels at this zoom
      const kmPerDegree = 111.32;
      const metersPerPixel = (156543.03392 * Math.cos((centerLat * Math.PI) / 180)) / Math.pow(2, zoom);
      const r5km = Math.max(30, (5000 / metersPerPixel));

      if (showDangerZone) {
        // Outer Pulsing Danger Radar Sweep
        const pulseR = r5km * (1 + Math.sin(pulseRef.current) * 0.18);
        ctx.beginPath();
        ctx.arc(dangerCenter[0], dangerCenter[1], pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Solid 5km Danger Core
        ctx.beginPath();
        ctx.arc(dangerCenter[0], dangerCenter[1], r5km, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Crosshairs
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dangerCenter[0] - r5km - 10, dangerCenter[1]);
        ctx.lineTo(dangerCenter[0] + r5km + 10, dangerCenter[1]);
        ctx.moveTo(dangerCenter[0], dangerCenter[1] - r5km - 10);
        ctx.lineTo(dangerCenter[0], dangerCenter[1] + r5km + 10);
        ctx.stroke();

        // 5km Pinpoint Banner Tag
        ctx.font = 'bold 9.5px "IBM Plex Mono", Consolas, monospace';
        ctx.fillStyle = '#fca5a5';
        ctx.fillText(`5KM PINPOINT GROUND ZERO`, dangerCenter[0] - 65, dangerCenter[1] - r5km - 12);
        ctx.font = '8px "IBM Plex Mono", Consolas, monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`[${activeIncident.evacuationPopulation.toLocaleString()} CITIZENS AT RISK]`, dangerCenter[0] - 78, dangerCenter[1] - r5km - 2);

        // Render Evacuation Origin Sectors (Sectors Alpha, Bravo, Charlie)
        activeIncident.originSectors.forEach((sec) => {
          const secPos = project([sec.lon, sec.lat]);
          
          ctx.beginPath();
          ctx.arc(secPos[0], secPos[1], 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Sector Label (Custom directional offset to prevent colliding with roads or hospital)
          ctx.font = 'bold 8.5px "IBM Plex Mono", Consolas, monospace';
          const title = `ORIGIN: ${sec.name.split(':')[0]}`;
          const subtitle = `${sec.pop.toLocaleString()} evacuees · ${sec.risk}`;
          const titleW = ctx.measureText(title).width;
          const subW = ctx.measureText(subtitle).width;
          const maxW = Math.max(titleW, subW);

          let offsetX = 10;
          let offsetY = -8;

          if (sec.labelPos === 'left') {
            offsetX = -maxW - 14;
            offsetY = -6;
          } else if (sec.labelPos === 'bottom') {
            offsetX = -maxW / 2;
            offsetY = 16;
          } else if (sec.labelPos === 'right') {
            offsetX = 12;
            offsetY = -4;
          }

          // Background chip to guarantee legibility over satellite imagery or road lines
          ctx.save();
          ctx.fillStyle = 'rgba(7, 10, 16, 0.88)';
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.lineWidth = 0.8;
          ctx.fillRect(secPos[0] + offsetX - 3, secPos[1] + offsetY - 10, maxW + 6, 23);
          ctx.strokeRect(secPos[0] + offsetX - 3, secPos[1] + offsetY - 10, maxW + 6, 23);

          ctx.fillStyle = '#fca5a5';
          ctx.fillText(title, secPos[0] + offsetX, secPos[1] + offsetY);
          ctx.font = '7.5px "IBM Plex Mono", Consolas, monospace';
          ctx.fillStyle = '#cbd5e1';
          ctx.fillText(subtitle, secPos[0] + offsetX, secPos[1] + offsetY + 9);
          ctx.restore();
        });
      }

      // -------------------------------------------------------------
      // LAYER 3: CRISP COLOR-CODED EVACUATION ROADS & CORRIDORS
      // -------------------------------------------------------------
      activeIncident.roads.forEach(road => {
        if (roadFilter === 'primary' && road.type !== 'primary') return;
        if (roadFilter === 'secondary' && road.type !== 'secondary') return;
        if (roadFilter === 'maritime' && road.type !== 'maritime') return;
        if (roadFilter === 'hazard' && road.type !== 'hazard') return;

        const isSelected = selectedRouteId === road.id;
        const screenPoints = road.points.map(pt => project(pt));
        if (screenPoints.length < 2) return;

        ctx.save();

        // 1. Solid Dark Casing / Stroke (NO BLURRY GLOW - Sharp Military CAD contrast)
        ctx.beginPath();
        ctx.moveTo(screenPoints[0][0], screenPoints[0][1]);
        for (let i = 1; i < screenPoints.length; i++) {
          ctx.lineTo(screenPoints[i][0], screenPoints[i][1]);
        }
        ctx.strokeStyle = '#05080f'; // Dark solid casing
        ctx.lineWidth = isSelected ? road.strokeWidth + 3.5 : road.strokeWidth + 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // 2. Crisp Solid High-Contrast Colored Core Line
        ctx.beginPath();
        ctx.moveTo(screenPoints[0][0], screenPoints[0][1]);
        for (let i = 1; i < screenPoints.length; i++) {
          ctx.lineTo(screenPoints[i][0], screenPoints[i][1]);
        }
        ctx.strokeStyle = road.color;
        ctx.lineWidth = isSelected ? road.strokeWidth + 1 : road.strokeWidth;
        if (road.type === 'hazard') {
          ctx.setLineDash([8, 6]);
        } else if (road.type === 'overflow') {
          ctx.setLineDash([6, 4]);
        } else if (road.type === 'maritime') {
          ctx.setLineDash([8, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 3. Directional Chevrons / Arrowheads along Road (SPACED OUT TO PREVENT COINCIDING)
        if (road.type !== 'hazard') {
          // Sample points every ~80 pixels along the screen path so arrows never bunch up
          let accumulatedDist = 0;
          const arrowStep = 90; // Pixels between arrows

          for (let i = 0; i < screenPoints.length - 1; i++) {
            const p1 = screenPoints[i];
            const p2 = screenPoints[i + 1];
            const dx = p2[0] - p1[0];
            const dy = p2[1] - p1[1];
            const segLen = Math.sqrt(dx * dx + dy * dy);

            accumulatedDist += segLen;
            if (accumulatedDist >= arrowStep) {
              accumulatedDist = 0; // reset step
              const midX = (p1[0] + p2[0]) / 2;
              const midY = (p1[1] + p2[1]) / 2;
              const angle = Math.atan2(dy, dx);

              ctx.save();
              ctx.translate(midX, midY);
              ctx.rotate(angle);
              ctx.beginPath();
              ctx.moveTo(-5, -3.5);
              ctx.lineTo(2.5, 0);
              ctx.lineTo(-5, 3.5);
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.6;
              ctx.lineCap = 'round';
              ctx.stroke();
              ctx.restore();
            }
          }
        }

        // 4. Highway Shield / Name Tag Floating along Road Midpoint
        const midIdx = Math.floor(screenPoints.length / 2);
        const tagPt = screenPoints[midIdx];
        if (tagPt) {
          ctx.save();
          ctx.font = 'bold 8.5px "IBM Plex Mono", Consolas, monospace';
          const label = road.name.split(' (')[0];
          const textW = ctx.measureText(label).width;

          ctx.fillStyle = 'rgba(7, 10, 16, 0.94)';
          ctx.strokeStyle = road.color;
          ctx.lineWidth = 1;
          ctx.fillRect(tagPt[0] - textW / 2 - 4, tagPt[1] - 18, textW + 8, 14);
          ctx.strokeRect(tagPt[0] - textW / 2 - 4, tagPt[1] - 18, textW + 8, 14);

          ctx.fillStyle = '#f3f4f6';
          ctx.fillText(label, tagPt[0] - textW / 2, tagPt[1] - 8);
          ctx.restore();
        }

        // -------------------------------------------------------------
        // LAYER 4: ANIMATED EVACUATION FLOW PARTICLES
        // -------------------------------------------------------------
        if (showFlowParticles && road.type !== 'hazard') {
          const numParticles = 3;
          for (let pIdx = 0; pIdx < numParticles; pIdx++) {
            const t = (flowProgressRef.current + pIdx / numParticles) % 1.0;
            // Interpolate along polyline
            const totalSegs = screenPoints.length - 1;
            const segPos = t * totalSegs;
            const curSeg = Math.floor(segPos);
            const subT = segPos - curSeg;

            if (curSeg < totalSegs) {
              const pA = screenPoints[curSeg];
              const pB = screenPoints[curSeg + 1];
              const partX = pA[0] + (pB[0] - pA[0]) * subT;
              const partY = pA[1] + (pB[1] - pA[1]) * subT;

              ctx.save();
              ctx.beginPath();
              ctx.arc(partX, partY, 2.8, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.fill();
              ctx.strokeStyle = road.color;
              ctx.lineWidth = 1;
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      });

      // -------------------------------------------------------------
      // LAYER 5: DESIGNATED REAL CYCLONE / FLOOD SHELTERS
      // -------------------------------------------------------------
      if (showShelterPins) {
        activeIncident.shelters.forEach((sh, shIdx) => {
          const shPos = project([sh.lon, sh.lat]);
          const isSelected = selectedShelterId === sh.id;
          const isSec = sh.isSecondary;

          // Pulse if selected
          if (isSelected) {
            ctx.beginPath();
            ctx.arc(shPos[0], shPos[1], 16, 0, Math.PI * 2);
            ctx.strokeStyle = isSec ? '#ef4444' : '#10b981';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Shelter Hex / Circular Pin (Clean solid without excessive blur)
          ctx.save();
          ctx.beginPath();
          ctx.arc(shPos[0], shPos[1], isSec ? 8 : 7.5, 0, Math.PI * 2);
          ctx.fillStyle = isSec ? '#dc2626' : (isSelected ? '#10b981' : '#0284c7');
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();

          // Shelter Icon Pip (White House/Building Dot)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(shPos[0] - 2, shPos[1] - 2, 4, 4);

          // Shelter Callout Box (Offset dynamically to prevent collision with convoy tags)
          ctx.save();
          ctx.font = 'bold 8.5px "IBM Plex Mono", Consolas, monospace';
          const capText = `${sh.name.split(' ')[0]} [Cap: ${sh.ratedCapacity.toLocaleString()}]`;
          const textW = ctx.measureText(capText).width;

          // Smart offset depending on shelter index/location to avoid overlay with hospital convoy
          const isLeftOffset = sh.id === 'sh-mum-3'; // Bandra Reclamation shelter offset to top-left
          const boxX = isLeftOffset ? shPos[0] - textW - 20 : shPos[0] + 12;
          const boxY = isLeftOffset ? shPos[1] - 34 : (shIdx % 2 === 0 ? shPos[1] - 28 : shPos[1] + 10);

          ctx.fillStyle = 'rgba(7, 10, 16, 0.94)';
          ctx.strokeStyle = isSec ? '#ef4444' : (isSelected ? '#10b981' : 'rgba(74, 111, 165, 0.45)');
          ctx.lineWidth = 1;
          ctx.fillRect(boxX, boxY, textW + 10, 24);
          ctx.strokeRect(boxX, boxY, textW + 10, 24);

          ctx.fillStyle = isSec ? '#fca5a5' : '#ffffff';
          ctx.fillText(capText, boxX + 5, boxY + 10);

          // Capacity Bar in Callout
          const occPct = Math.min(1.0, (sh.currentOccupancy || (sh.ratedCapacity * 0.75)) / sh.ratedCapacity);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(boxX + 5, boxY + 15, textW, 4);
          ctx.fillStyle = occPct > 0.9 ? '#ef4444' : (occPct > 0.7 ? '#f59e0b' : '#10b981');
          ctx.fillRect(boxX + 5, boxY + 15, textW * occPct, 4);

          ctx.restore();
        });
      }

      // -------------------------------------------------------------
      // LAYER 6: CONVOY RELIEF TRUCKS & MARITIME RESCUE VESSELS
      // -------------------------------------------------------------
      if (activeSubTab === 'convoys') {
        convoys.forEach(convoy => {
          // Route points for this convoy: check convoy.roadId or fallback
          const matchingRoad = activeIncident.roads.find(r => r.id === convoy.roadId) || 
                               activeIncident.roads.find(r => r.type === 'primary') || 
                               activeIncident.roads[0];
          const screenPoints = matchingRoad.points.map(pt => project(pt));
          if (screenPoints.length < 2) return;

          const p = convoy.progressPct;
          const totalSegs = screenPoints.length - 1;
          const segPos = p * totalSegs;
          const curSeg = Math.floor(segPos);
          const subT = segPos - curSeg;

          let curX = screenPoints[0][0];
          let curY = screenPoints[0][1];

          if (curSeg < totalSegs) {
            const pA = screenPoints[curSeg];
            const pB = screenPoints[curSeg + 1];
            curX = pA[0] + (pB[0] - pA[0]) * subT;
            curY = pA[1] + (pB[1] - pA[1]) * subT;
          } else {
            curX = screenPoints[totalSegs][0];
            curY = screenPoints[totalSegs][1];
          }

          const isSelected = selectedConvoyId === convoy.id;
          const isMaritime = convoy.mode === 'maritime' || convoy.id.includes('SAMUDRA');

          ctx.save();
          // Radar pulse ring around selected vehicle
          if (isSelected) {
            ctx.beginPath();
            ctx.arc(curX, curY, 16, 0, Math.PI * 2);
            ctx.strokeStyle = convoy.routeColor || '#10b981';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Outer beacon glow
          ctx.shadowColor = convoy.routeColor || '#10b981';
          ctx.shadowBlur = isSelected ? 22 : 14;

          if (isMaritime) {
            // Draw Diamond Boat Shape for Maritime Vessel
            ctx.beginPath();
            ctx.moveTo(curX, curY - 10);
            ctx.lineTo(curX + 8, curY + 4);
            ctx.lineTo(curX, curY + 9);
            ctx.lineTo(curX - 8, curY + 4);
            ctx.closePath();
            ctx.fillStyle = '#0284c7';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.0;
            ctx.stroke();

            // Nautical anchor / vessel inner dot
            ctx.beginPath();
            ctx.arc(curX, curY, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.fill();
          } else {
            // Convoy Land Truck Marker (Rounded Hex / Pill)
            ctx.beginPath();
            ctx.arc(curX, curY, 8.5, 0, Math.PI * 2);
            ctx.fillStyle = convoy.routeColor || '#10b981';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.0;
            ctx.stroke();

            // Inner vehicle pip
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(curX - 2.5, curY - 2.5, 5, 5);
          }

          // Convoy Callsign & ETA Tag
          ctx.font = 'bold 8.5px "IBM Plex Mono", Consolas, monospace';
          const callsign = convoy.callsign.split(' ')[0] + ' ' + (convoy.callsign.split(' ')[1] || '');
          const label = `${isMaritime ? '⚓ ' : '🚛 '}${callsign} [${convoy.etaMinutes}m ETA]`;
          const textW = ctx.measureText(label).width;

          ctx.fillStyle = 'rgba(10, 14, 20, 0.92)';
          ctx.strokeStyle = convoy.routeColor || '#10b981';
          ctx.lineWidth = 1;
          ctx.fillRect(curX + 12, curY - 9, textW + 8, 16);
          ctx.strokeRect(curX + 12, curY - 9, textW + 8, 16);

          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, curX + 16, curY + 3);
          ctx.restore();
        });
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    activeIncident,
    zoomLevel,
    panOffset,
    showTiles,
    showDangerZone,
    showFlowParticles,
    showShelterPins,
    roadFilter,
    selectedShelterId,
    selectedRouteId,
    activeSubTab,
    convoys
  ]);

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="evacuation-ops-container mono" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      
      {/* 1. TOP HEADER & BREADCRUMB */}
      <header className="dash-header" style={{ flexShrink: 0, padding: '10px 18px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--accent-slate)', letterSpacing: '0.06em' }}>AERO-SENSE</span>
            <span style={{ color: 'var(--border-color)' }}>/</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f3f4f6', letterSpacing: '0.06em' }}>EVACUATION & RELIEF OPS</span>
            <span style={{ fontSize: '9px', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#7dd3fc', padding: '2px 6px', borderRadius: '3px', fontWeight: 700 }}>
              DISASTER CONTINGENCY PROTOCOL ACTIVE
            </span>
          </div>
          <div style={{ fontSize: '9px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Pre-Audited Evacuation Corridors · Candidate Shelter Capacity Matching · Illustrative Pre-Staged Logistics
          </div>
        </div>

        {/* THREAT SELECTION & SCENARIO DROPDOWN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Category Toggle: ACTIVE CONTINGENCY SCENARIOS vs HISTORIC BENCHMARKS */}
          <div style={{ display: 'flex', background: '#0a0e14', border: '1px solid rgba(74, 111, 165, 0.35)', borderRadius: '3px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => {
                setThreatCategory('live');
                setSelectedIncidentId('LIVE-MUMBAI-01');
              }}
              style={{
                background: threatCategory === 'live' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                border: threatCategory === 'live' ? '1px solid #ef4444' : 'none',
                color: threatCategory === 'live' ? '#fca5a5' : '#94a3b8',
                padding: '3px 8px',
                fontSize: '9px',
                fontWeight: 700,
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              ⚠️ ACTIVE CONTINGENCY SCENARIOS
            </button>
            <button
              type="button"
              onClick={() => {
                setThreatCategory('historic');
                setSelectedIncidentId(ADAPTED_HISTORIC_EVENTS[0].id);
              }}
              style={{
                background: threatCategory === 'historic' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                border: threatCategory === 'historic' ? '1px solid #3b82f6' : 'none',
                color: threatCategory === 'historic' ? '#93c5fd' : '#94a3b8',
                padding: '3px 8px',
                fontSize: '9px',
                fontWeight: 700,
                borderRadius: '2px',
                cursor: 'pointer'
              }}
            >
              🏛️ HISTORIC BENCHMARKS
            </button>
          </div>

          {/* Incident Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              value={selectedIncidentId}
              onChange={(e) => setSelectedIncidentId(e.target.value)}
              className="historic-selector-select mono"
              style={{
                background: '#090d14',
                border: '1px solid rgba(74, 111, 165, 0.45)',
                color: '#f3f4f6',
                padding: '5px 10px',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '460px',
                maxWidth: 'calc(100vw - 680px)',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {visibleIncidents.map(inc => (
                <option key={inc.id} value={inc.id}>
                  {inc.systemName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* OPERATIONAL CONTINGENCY PROTOCOL EXPLANATION BANNER */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.96)',
        borderBottom: '1px solid rgba(74, 111, 165, 0.35)',
        padding: '6px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '8.5px',
        color: '#cbd5e1',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', color: '#7dd3fc', padding: '1px 6px', borderRadius: '2px', fontWeight: 700 }}>
            DISASTER CONTINGENCY PROTOCOL
          </span>
          <span>
            <strong>Preparedness & Response Blueprint:</strong> Pre-audited evacuation routes directing citizens away from danger zones into verified shelters, with real capacity shortfall alerts and pre-staged relief fleet routing.
          </span>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '8px' }}>
          {activeSubTab === 'routes' 
            ? 'TAB 1: Citizen Escape Routes & Shelter Capacity' 
            : 'TAB 2: Pre-Staged Supply Fleet Deployment (Food, Water, Medical)'}
        </div>
      </div>

      {/* 2. SUB-TAB & HIGHWAY FILTER STRIP */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 18px',
        background: '#0c111a',
        borderBottom: '1px solid rgba(74, 111, 165, 0.25)',
        flexShrink: 0
      }}>
        {/* TAB 1 vs TAB 2 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('routes')}
            style={{
              background: activeSubTab === 'routes' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.6)',
              border: activeSubTab === 'routes' ? '1px solid #10b981' : '1px solid rgba(74, 111, 165, 0.25)',
              color: activeSubTab === 'routes' ? '#ffffff' : '#94a3b8',
              borderRadius: '3px',
              padding: '5px 12px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Navigation size={12} color={activeSubTab === 'routes' ? '#10b981' : '#94a3b8'} />
            <span>TAB 1: EVACUATION ROUTES & SHELTER ALLOCATION</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('convoys')}
            style={{
              background: activeSubTab === 'convoys' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(15, 23, 42, 0.6)',
              border: activeSubTab === 'convoys' ? '1px solid #3b82f6' : '1px solid rgba(74, 111, 165, 0.25)',
              color: activeSubTab === 'convoys' ? '#ffffff' : '#94a3b8',
              borderRadius: '3px',
              padding: '5px 12px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Truck size={12} color={activeSubTab === 'convoys' ? '#3b82f6' : '#94a3b8'} />
            <span>TAB 2: CONVOY RELIEF DISPATCH TRACKER</span>
          </button>
        </div>

        {/* ROAD FILTERS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '9px', color: '#94a3b8' }}>FILTER ROADS:</span>
          
          <button
            type="button"
            onClick={() => setRoadFilter('all')}
            style={{
              background: roadFilter === 'all' ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              fontSize: '8.5px',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            ALL ROUTES
          </button>

          <button
            type="button"
            onClick={() => setRoadFilter('primary')}
            style={{
              background: roadFilter === 'primary' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
              border: '1px solid #10b981',
              color: '#6ee7b7',
              fontSize: '8.5px',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            EXPRESSWAYS (GREEN)
          </button>

          <button
            type="button"
            onClick={() => setRoadFilter('secondary')}
            style={{
              background: roadFilter === 'secondary' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
              border: '1px solid #f59e0b',
              color: '#fcd34d',
              fontSize: '8.5px',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
            ARTERIAL HIGHWAYS (AMBER)
          </button>

          <button
            type="button"
            onClick={() => setRoadFilter('maritime')}
            style={{
              background: roadFilter === 'maritime' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
              border: '1px solid #38bdf8',
              color: '#7dd3fc',
              fontSize: '8.5px',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
            MARITIME SEA LANES (CYAN)
          </button>

          <button
            type="button"
            onClick={() => setRoadFilter('hazard')}
            style={{
              background: roadFilter === 'hazard' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
              border: '1px solid #ef4444',
              color: '#fca5a5',
              fontSize: '8.5px',
              padding: '2px 6px',
              borderRadius: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
            HAZARDS (RED)
          </button>
        </div>

      </div>

      {/* 3. MAIN DUAL-PANE OPS STAGE */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', overflow: 'hidden' }}>
        
        {/* LEFT PANE: HIGHWAY EVACUATION MAP CANVAS */}
        <div 
          style={{ position: 'relative', width: '100%', height: '100%', background: '#080d16', cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />

          {/* Top-Left Tactical Incident Overview HUD */}
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(10, 14, 20, 0.94)',
            border: '1px solid rgba(74, 111, 165, 0.45)',
            borderRadius: '4px',
            padding: '10px 14px',
            backdropFilter: 'blur(8px)',
            maxWidth: '380px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fca5a5' }}>
                  {activeIncident.systemName}
                </span>
              </div>
              <span style={{ fontSize: '8px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '1px 5px', borderRadius: '2px', fontWeight: 700 }}>
                {activeIncident.threatLevel}
              </span>
            </div>

            <div style={{ fontSize: '8.5px', color: '#cbd5e1', lineHeight: '1.4' }}>
              <div>Sector: <strong>{activeIncident.region}</strong></div>
              
              {/* EFI & 12km -> 5km AI Downscaling Pipeline Link */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', marginBottom: '4px' }}>
                <span style={{ fontSize: '8px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '1px 5px', borderRadius: '2px', fontWeight: 700 }}>
                  {activeIncident.efiValue || 'EFI: +0.94 (Extreme Forecast Index)'}
                </span>
                <span style={{ fontSize: '8px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '1px 5px', borderRadius: '2px', fontWeight: 700 }}>
                  {activeIncident.downscalingPipeline || '12km NWP → 5km PINPOINT'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '2px', color: '#94a3b8' }}>
                <span>Wind: <strong style={{ color: '#fca5a5' }}>{activeIncident.windSpeedKmh} km/h</strong></span>
                <span>Precipitation: <strong style={{ color: '#38bdf8' }}>{activeIncident.expectedRainfallMm} mm/24h</strong></span>
                <span>Probability: <strong style={{ color: '#34d399' }}>{activeIncident.forecastProbability}</strong></span>
              </div>
            </div>
          </div>

          {/* Top-Right Basemap Mode & Zoom Controls */}
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10
          }}>
            {/* Basemap Style Selector */}
            <div style={{
              display: 'flex',
              background: 'rgba(10, 14, 20, 0.94)',
              border: '1px solid rgba(74, 111, 165, 0.45)',
              borderRadius: '4px',
              padding: '3px',
              gap: '3px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)'
            }}>
              <button
                type="button"
                onClick={() => setMapMode('satellite')}
                style={{
                  background: mapMode === 'satellite' ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                  border: mapMode === 'satellite' ? '1px solid #38bdf8' : '1px solid transparent',
                  color: mapMode === 'satellite' ? '#38bdf8' : '#94a3b8',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                🛰️ SATELLITE OPS
              </button>
              <button
                type="button"
                onClick={() => setMapMode('dark')}
                style={{
                  background: mapMode === 'dark' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                  border: mapMode === 'dark' ? '1px solid #10b981' : '1px solid transparent',
                  color: mapMode === 'dark' ? '#6ee7b7' : '#94a3b8',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                🗺️ TACTICAL DARK
              </button>
              <button
                type="button"
                onClick={() => setMapMode('streets')}
                style={{
                  background: mapMode === 'streets' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  border: mapMode === 'streets' ? '1px solid #f59e0b' : '1px solid transparent',
                  color: mapMode === 'streets' ? '#fcd34d' : '#94a3b8',
                  fontSize: '8.5px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                🛣️ HIGHWAY TOPO
              </button>
            </div>

            {/* Map Interactive Zoom & Reset Controls */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              background: 'rgba(10, 14, 20, 0.94)',
              border: '1px solid rgba(74, 111, 165, 0.45)',
              borderRadius: '4px',
              padding: '3px',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)'
            }}>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(15, prev + 1))}
              title="Zoom In"
              style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(9, prev - 1))}
              title="Zoom Out"
              style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomLevel(12);
                setPanOffset({ x: 0, y: 0 });
              }}
              title="Reset View"
              style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

          {/* Bottom Interactive Legend */}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(10, 14, 20, 0.92)',
            border: '1px solid rgba(74, 111, 165, 0.35)',
            borderRadius: '4px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '8.5px',
            color: '#cbd5e1'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '16px', height: '4px', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span>Primary Expressway (NH)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '16px', height: '3px', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
              <span>State Arterial (SH)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '16px', height: '3px', background: '#06b6d4' }} />
              <span>Coastal Link Road</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '16px', height: '3px', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
              <span style={{ color: '#7dd3fc' }}>⚓ Maritime Sea Lane (Coast Guard)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '16px', height: '3px', background: '#ef4444', borderTop: '1px dashed #ffffff' }} />
              <span style={{ color: '#fca5a5' }}>Closed / Hazard Inundation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7', border: '1.5px solid #ffffff' }} />
              <span>Candidate Refuge Shelter (Illustrative)</span>
            </div>
          </div>

        </div>

        {/* RIGHT PANE: ANALYTICS, SHELTER ALLOCATION & FLEET DISPATCH */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '14px 14px 64px 14px',
          gap: '12px'
        }}>

          {/* TAB 1: EVACUATION LOGISTICS & CAPACITY MATCHING */}
          {activeSubTab === 'routes' && (
            <>
              {/* Capacity Matching Audit Card */}
              <div style={{
                background: 'rgba(13, 19, 29, 0.85)',
                border: '1px solid rgba(74, 111, 165, 0.3)',
                borderRadius: '4px',
                padding: '10px 12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#93c5fd' }}>
                    CAPACITY ALLOCATION AUDIT (ILLUSTRATIVE)
                  </span>
                  <span style={{ fontSize: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 5px', borderRadius: '2px' }}>
                    5KM IMPACT SECTOR
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '3px', border: '1px solid rgba(74, 111, 165, 0.15)' }}>
                    <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>EVACUATION TARGET</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fca5a5' }}>
                      {activeIncident.evacuationPopulation.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '3px', border: '1px solid rgba(74, 111, 165, 0.15)' }}>
                    <div style={{ fontSize: '7.5px', color: '#94a3b8' }}>PRIMARY SHELTER CAP</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                      {totalLocalCapacity.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* CAPACITY SHORTFALL OR ADEQUATE BANNER */}
                {capacityShortfall > 0 ? (
                  <div style={{
                    background: 'rgba(220, 38, 38, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '3px',
                    padding: '8px 10px',
                    color: '#fca5a5',
                    fontSize: '9px',
                    lineHeight: '1.4'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, color: '#ef4444', marginBottom: '2px' }}>
                      <AlertTriangle size={11} />
                      <span>CAPACITY SHORTFALL: {capacityShortfall.toLocaleString()} CITIZENS</span>
                    </div>
                    <div>
                      Immediate primary shelters at capacity. Overflow routed along NH-116B Expressway toward Secondary High-Elevation Safe Base.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '3px',
                    padding: '6px 8px',
                    color: '#6ee7b7',
                    fontSize: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <CheckCircle2 size={11} />
                    <span>Nearby shelter capacity adequate for current population at risk.</span>
                  </div>
                )}
              </div>

              {/* HIGHWAY EVACUATION CORRIDORS */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#e5e7eb', letterSpacing: '0.04em' }}>
                    EVACUATION CORRIDORS ({activeIncident.roads.length})
                  </span>
                  <span style={{ fontSize: '8px', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '1px 5px', borderRadius: '2px' }}>
                    MULTIMODAL SNAPPED
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeIncident.roads.map(rd => {
                    const isSelected = selectedRouteId === rd.id;
                    const isMaritime = rd.type === 'maritime';
                    return (
                      <div
                        key={rd.id}
                        onClick={() => setSelectedRouteId(isSelected ? null : rd.id)}
                        style={{
                          background: isSelected ? 'rgba(16, 185, 129, 0.18)' : 'rgba(13, 19, 29, 0.65)',
                          border: isSelected ? `1px solid ${rd.color}` : '1px solid rgba(74, 111, 165, 0.25)',
                          borderRadius: '3px',
                          padding: '8px 10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontSize: '9.5px', fontWeight: 700, color: rd.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isMaritime ? '⚓ ' : '🛣️ '}{rd.name.split(' (')[0]}
                          </span>
                          <span style={{ fontSize: '8px', color: '#ffffff', background: rd.color, padding: '1px 5px', borderRadius: '2px', fontWeight: 700 }}>
                            {rd.type.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: '8px', color: '#94a3b8' }}>
                          {rd.status}
                        </div>
                        <div style={{ fontSize: '8px', color: '#cbd5e1', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Target Flow Speed: <strong>{rd.flowSpeed}</strong></span>
                          <span>Length: <strong style={{ color: '#38bdf8' }}>{rd.distanceKm} km</strong> · {rd.points.length} nodes</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MULTIMODAL ESCAPE BLUEPRINT */}
              <div style={{
                background: 'rgba(13, 19, 29, 0.75)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '4px',
                padding: '8px 10px'
              }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>🌊 MULTIMODAL DISASTER RELIEF STAGING</span>
                </div>
                <div style={{ fontSize: '8px', color: '#94a3b8', lineHeight: '1.4' }}>
                  <div style={{ marginBottom: '3px' }}>
                    • <strong style={{ color: '#10b981' }}>Expressways (WEH / EEH)</strong>: Snapped with 397+ GPS nodes along elevated flyovers to bypass ground waterlogging.
                  </div>
                  <div>
                    • <strong style={{ color: '#38bdf8' }}>Maritime Coastal Channel</strong>: Arabian Sea waterborne evacuation by Coast Guard & Navy crafts from Bandra Pier to Colaba Naval Haven.
                  </div>
                </div>
              </div>

              {/* CANDIDATE SHELTERS LIST */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#e5e7eb', letterSpacing: '0.04em' }}>
                    CANDIDATE SHELTERS ({activeIncident.shelters.length})
                  </span>
                  <span style={{ fontSize: '7.5px', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '2px' }}>
                    CAPACITY ILLUSTRATIVE
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeIncident.shelters.map(sh => {
                    const isSelected = selectedShelterId === sh.id;
                    const isSec = sh.isSecondary;
                    const isMaritime = sh.isMaritime;
                    const occPct = Math.round(((sh.currentOccupancy || sh.ratedCapacity * 0.75) / sh.ratedCapacity) * 100);
                    return (
                      <div
                        key={sh.id}
                        onClick={() => setSelectedShelterId(sh.id)}
                        style={{
                          background: isSelected ? 'rgba(59, 130, 246, 0.20)' : 'rgba(13, 19, 29, 0.65)',
                          border: isSelected ? '1px solid #60a5fa' : (isSec ? '1px dashed rgba(239, 68, 68, 0.5)' : (isMaritime ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(74, 111, 165, 0.25)')),
                          borderRadius: '3px',
                          padding: '8px 10px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: isSec ? '#fca5a5' : (isMaritime ? '#7dd3fc' : '#ffffff') }}>
                            {isMaritime ? '⚓ ' : '🏢 '}{sh.name}
                          </span>
                          <span style={{ fontSize: '8px', color: isSec ? '#ef4444' : (isMaritime ? '#38bdf8' : '#10b981'), background: isSec ? 'rgba(239,68,68,0.15)' : (isMaritime ? 'rgba(56,189,248,0.15)' : 'rgba(16,185,129,0.15)'), padding: '1px 4px', borderRadius: '2px' }}>
                            {isSec ? 'SECONDARY OVERFLOW' : (isMaritime ? 'MARITIME HARBOR' : 'PRIMARY')}
                          </span>
                        </div>
                        <div style={{ fontSize: '8px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Via: {sh.routeVia}</span>
                          <span style={{ color: '#38bdf8' }}>{sh.distanceKm} km · {sh.travelMins}m transit</span>
                        </div>
                        <div style={{ fontSize: '8px', color: '#cbd5e1', marginTop: '3px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Capacity: <strong>{sh.ratedCapacity.toLocaleString()}</strong> ({occPct}% full)</span>
                          <span style={{ color: '#64748b' }}>OSM ID: {sh.osmId}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: RELIEF CONVOY FLEET TRACKER */}
          {activeSubTab === 'convoys' && (
            <>
              {/* Fleet Dispatch Controls */}
              <div style={{
                background: 'rgba(13, 19, 29, 0.85)',
                border: '1px solid rgba(74, 111, 165, 0.3)',
                borderRadius: '4px',
                padding: '10px 12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399' }}>
                    RELIEF CONVOY FLEET CONTROL
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSimulatingConvoys(!isSimulatingConvoys)}
                    style={{
                      background: isSimulatingConvoys ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      border: isSimulatingConvoys ? '1px solid #ef4444' : '1px solid #10b981',
                      color: isSimulatingConvoys ? '#fca5a5' : '#6ee7b7',
                      borderRadius: '3px',
                      padding: '2px 6px',
                      fontSize: '8.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    {isSimulatingConvoys ? <Pause size={9} /> : <Play size={9} />}
                    <span>{isSimulatingConvoys ? 'PAUSE' : 'RUN'}</span>
                  </button>
                </div>
                <div style={{ fontSize: '8.5px', color: '#94a3b8', lineHeight: '1.4' }}>
                  Real-time simulated dispatch tracking delivering potable drinking water, high-calorie food rations, mobile surgical modules, and Coast Guard interceptor crafts.
                </div>
              </div>

              {/* Active Convoys List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {convoys.map(convoy => {
                  const isSelected = selectedConvoyId === convoy.id;
                  const isMaritime = convoy.mode === 'maritime' || convoy.id.includes('SAMUDRA');
                  return (
                    <div
                      key={convoy.id}
                      onClick={() => setSelectedConvoyId(convoy.id)}
                      style={{
                        background: isSelected ? 'rgba(16, 185, 129, 0.18)' : 'rgba(13, 19, 29, 0.65)',
                        border: isSelected ? '1px solid #10b981' : (isMaritime ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(74, 111, 165, 0.25)'),
                        borderRadius: '3px',
                        padding: '8px 10px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: isMaritime ? '#7dd3fc' : '#ffffff', display: 'flex', alignItems: 'center', gap: '5px', flex: 1, minWidth: '180px', lineHeight: '1.3' }}>
                          {isMaritime ? <Ship size={12} color="#38bdf8" style={{ flexShrink: 0 }} /> : <Truck size={12} color="#10b981" style={{ flexShrink: 0 }} />}
                          <span>{convoy.callsign}</span>
                        </span>
                        <span style={{
                          fontSize: '8px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '2px',
                          background: convoy.status === 'Arrived' ? 'rgba(16,185,129,0.2)' : (isMaritime ? 'rgba(56,189,248,0.2)' : 'rgba(59,130,246,0.2)'),
                          color: convoy.status === 'Arrived' ? '#6ee7b7' : (isMaritime ? '#7dd3fc' : '#93c5fd'),
                          border: convoy.status === 'Arrived' ? '1px solid #10b981' : (isMaritime ? '1px solid #38bdf8' : '1px solid #3b82f6'),
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {convoy.status} · {convoy.etaMinutes > 0 ? `${convoy.etaMinutes}m ETA` : 'DELIVERED'}
                        </span>
                      </div>

                      <div style={{ fontSize: '8.5px', color: '#cbd5e1', marginBottom: '3px' }}>
                        Cargo: <strong style={{ color: isMaritime ? '#38bdf8' : '#60a5fa' }}>{convoy.cargo}</strong> ({convoy.weightMt} MT · {convoy.vehicleCount} {isMaritime ? 'Vessel' : 'Trucks'})
                      </div>

                      <div style={{ fontSize: '8px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span>From: {convoy.origin}</span>
                        <span>To: {convoy.destination.split(' ')[0]}</span>
                      </div>

                      {/* Route Progress Bar */}
                      <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.round(convoy.progressPct * 100)}%`,
                          height: '100%',
                          background: convoy.routeColor || '#10b981',
                          transition: 'width 0.5s ease'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>

      </div>

    </div>
  );
}
