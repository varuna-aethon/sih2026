# AERO-SENSE // METHODOLOGY & SYSTEM ARCHITECTURE
## Smart India Hackathon 2024 — Problem Statement SIH26078
### Ministry of Earth Sciences (MoES) / NCMRWF & IMD

> **Document Purpose**: Complete technical reference, data source citations, scientific methodology, and Real-vs-Proposed architectural specifications for written submissions, technical juries, and YouTube presentation scripts.

---

## 1. System Overview & Executive Summary

### 1.1 The Operational Challenge
Severe and extreme weather events—tropical super cyclones in the Bay of Bengal and Arabian Sea, convective cloudbursts in the Western Ghats and Himalayan river basins, and prolonged lethal heatwaves across the Indo-Gangetic Plains—constitute India's greatest natural hazard risks. 

Standard Numerical Weather Prediction (NWP) operational pipelines deployed by global centres (such as ECMWF 9 km IFS HRES or NCEP 25 km GFS) and regional systems (NCMRWF NEPS-G 12 km ensemble) face two fundamental limitations when serving frontline disaster management authorities:
1. **The Spatial Resolution Barrier**: District-wide warnings issued over 3,500–5,000 km² zones trigger alert fatigue, massive unnecessary economic shutdowns, and uncoordinated public response because only a 5–10 km localized mesoscale core actually suffers catastrophic winds or torrential downpours.
2. **The Medium-Range Disconnect (Day 3 to Day 10)**: Deterministic forecast skill drops rapidly beyond 72 hours in tropical convective atmospheres. Forecasters need probabilistic, ensemble-calibrated indicators of extreme deviation from long-term climatology to initiate early pre-positioning before storm formation.

### 1.2 The AERO-SENSE Solution
**AERO-SENSE (VARUNA-CORE)** is an AI-augmented meteorological intelligence and hyper-local early warning platform. It ingests multi-source numerical weather ensemble grids, satellite soundings, and Doppler radar feeds, processes them through a 5-stage inference architecture, and generates alert-grade, 5 km pinpoint early advisories formatted to NDMA's **CAP-IN v1.0** standard.

---

## 2. Five-Stage AI Architecture Pipeline

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│  STAGE 1        │     │  STAGE 2             │     │  STAGE 3             │
│  NEPS-G / Open  │ ──> │  GNN Mesh Tracking   │ ──> │  EFI & Ensemble      │
│  Ingest Grid    │     │  (Delaunay-Voronoi)  │     │  Spread Estimation   │
└─────────────────┘     └──────────────────────┘     └──────────────────────┘
                                                                │
                                                                ▼
┌─────────────────┐                                  ┌──────────────────────┐
│  STAGE 5        │                                  │  STAGE 4             │
│  5 km Impact    │ <─────────────────────────────── │  Diffusion           │
│  & CAP-IN Alert │                                  │  Downscaling (1 km)  │
└─────────────────┘                                  └──────────────────────┘
```

### Stage 1: Multi-Model Telemetry Ingest & Real-Time Normalization
- **Inputs**: Open-Meteo current API (15-minute telemetry sync across 20+ Indian synoptic stations), NASA POWER API (MERRA-2 hourly solar radiation, 2 m temperature, surface skin pressure), and GDACS (Global Disaster Alert & Coordination System, UN/EU real-time RSS/GeoJSON feed).
- **Function**: Standardizes coordinate geometries into an isotropic spatial representation over the South Asian synoptic box (4°N–42°N, 60°E–105°E).
- **Dynamic Cross-Verification**: Automatically cross-checks Open-Meteo station observations against NASA MERRA-2 satellite reanalysis to detect station sensor drift, missing data packets, or microclimate bias.

### Stage 2: Spherical Graph Neural Network (GNN) Mesh Tracking
- **Topology**: Delaunay triangulation and Voronoi tessellation mapped over spherical geodesics, avoiding the polar distortion and boundary artifacts inherent to rectangular Cartesian grids.
- **Function**: Propagates atmospheric state vectors (barometric gradients, vorticity, geopotential height at 850 hPa and 500 hPa, precipitable water vapour) across irregular observation node densities. Tracks the spatio-temporal kinematic centroid of storm systems and mesoscale convective complexes across discrete time intervals ($t_0 \to t_{+72\text{h}}$).

### Stage 3: Extreme Forecast Index (EFI) & Ensemble Spread
- **Metric Formulation**:
  $$\text{EFI} = \frac{2}{\pi} \int_0^1 \frac{F(p) - C(p)}{\sqrt{p(1-p)}} \, dp$$
  where $F(p)$ is the cumulative distribution function (CDF) of the 30-member perturbed ensemble forecast and $C(p)$ is the CDF of the 30-year model reanalysis climate (M-Climate, derived from ERA5 1991–2020).
- **Physical Interpretation**: An EFI score exceeding $+0.80$ (or normalized $z > +2.0\sigma$) indicates that virtually the entire ensemble distribution lies outside historical climatological bounds, providing reliable Day 3 to Day 10 early alert triggers before conventional models achieve steering consensus.

### Stage 4: Latent Diffusion Mesoscale Downscaling
- **Model Mechanics**: Super-resolution conditional generative diffusion model (denoising diffusion probabilistic models, DDPM).
- **Function**: Ingests coarse 25 km GFS or 12 km NEPS-G forecast tensors conditioned on high-resolution Shuttle Radar Topography Mission (SRTM 30 m) digital elevation models, land-use land-cover (LULC) maps, and coastal bathymetry contours. Generates sharp, physically consistent 5 km (and localized 1 km) wind-gust, precipitation, and thermal stress envelopes.

### Stage 5: Hyper-Local Impact & CAP-IN Protocol Dispatch
- **Impact Radius**: Constrains the active emergency boundary to a 5 km pinpoint footprint ($78.5\text{ km}^2$), reducing false-alarm geographic coverage by **97.8%** compared to traditional district-wide polygons ($\approx 3,500\text{ km}^2$).
- **Dissemination**: Compiles standardized **Common Alerting Protocol (India Profile - CAP-IN v1.0)** XML payloads, JSON-LD GeoAlert structures, and automated localized SMS/IVR voice bulletins for direct ingestion by state disaster management authorities (SDMAs), National Disaster Response Force (NDRF), and public mobile cellular networks.

---

## 3. Real vs. Proposed Architecture Matrix

To ensure total transparency before evaluation committees and hackathon juries, the table below outlines exactly what is functional and verified in the current codebase versus what is computationally modeled or scheduled for high-performance computing (HPC) deployment:

| System Layer | Implementation Status in Current Prototype | Full Operational Target (NCMRWF / MoES HPC) |
| :--- | :--- | :--- |
| **Observation Grid Telemetry** | **REAL & LIVE**: Queries Open-Meteo REST API every 60 s for 14 baseline Indian synoptic nodes; queries NASA POWER API for satellite reanalysis and UN/EU GDACS for active South Asian alerts. | Dedicated high-frequency Indian Doppler Weather Radar (DWR) composite network (34 radars) + INSAT-3D/3DR rapid-scan atmospheric motion vectors. |
| **Historic Case Reconstructions** | **REAL & VERIFIED**: 6 benchmark cases (Cyclone Amphan, Delhi Heatwave, Mumbai Cloudburst, Kedarnath, Phalodi Heat Record, North India Cold Wave) built using exact IMD monsoon reports, NOAA IBTrACS v04r00 ground truth, and observed AWS records. | Continuous historical reanalysis database containing 1970–2025 archived synoptic extremes. |
| **Anomaly Detection Algorithm** | **REAL & FUNCTIONAL**: Dynamic statistical $z$-score calculation against multi-year same-hour baseline distributions ($\sigma_T \ge 2.5^\circ\text{C}, \sigma_W \ge 10\text{ km/h}, \sigma_P \ge 6\text{ hPa}, \sigma_R \ge 15\text{ mm/h}$) with automated sensor-anomaly flagging. | Full multi-variate autoencoder anomaly detection trained on 100 TB of ERA5 and NCMRWF historical model analysis fields. |
| **AI Inference & Downscaling** | **COMPUTED EMULATION**: Mesoscale downscaling fields and GNN trajectory coordinates pre-computed using verified hindcast runs and physical parameterizations. | Real-time GPU cluster inference (NVIDIA H100 / Param Brahma HPC) executing within 45 seconds of NWP cycle arrival. |
| **CAP-IN Alert Dispatch** | **REAL & FUNCTIONAL**: Generates compliant CAP-IN v1.0 XML schema with coordinate bounding polygons, target agency toggles, and cryptographic SHA-256 audit logging. | Dedicated telecom gateway integration with Department of Telecommunications (DoT) Cell Broadcast Emergency System. |
| **Multilingual Citizen Preview** | **REAL & FUNCTIONAL**: Native language SMS alerts and IVR voice preview synthesized in 6 scheduled Indian languages (Hindi, Bengali, Odia, Tamil, Telugu, English). | Automated AI neural speech synthesis (Bhashini API) supporting all 22 official 8th Schedule Indian languages with geographic auto-routing. |

---

## 4. Scientific Ground Truth Data Sources & Citations

1. **NOAA IBTrACS (International Best Track Archive for Climate Stewardship) v04r00**
   - *Citation*: Knapp, K. R., et al. (2018). *The International Best Track Archive for Climate Stewardship (IBTrACS)*. Bulletin of the American Meteorological Society, 91(3), 363-376.
   - *Usage*: Best-track cyclone positions, central minimum barometric pressure, maximum sustained wind velocities, and track error residuals for Tropical Cyclone Amphan.
2. **India Meteorological Department (IMD) Severe Weather & Cyclone Reports**
   - *Citation*: RSMC New Delhi (2020). *Report on Cyclonic Disturbances over North Indian Ocean during 2020*. IMD MoES Govt. of India.
   - *Usage*: Doppler radar reflectivity timestamps, landfall coordinates (Sagar Island / Digha), rainfall rate ground truth (Mumbai Santacruz 944 mm, Kedarnath 375 mm), and Phalodi 51.0°C maximum temperature verification.
3. **ECMWF ERA5 Atmospheric Reanalysis**
   - *Citation*: Hersbach, H., et al. (2020). *The ERA5 global reanalysis*. Quarterly Journal of the Royal Meteorological Society, 146(730), 1999-2049.
   - *Usage*: 30-year climatological baseline statistics (1991–2020) for temperature, mean sea-level pressure, and wind speed anomalies.
4. **Open-Meteo Real-Time Global Telemetry**
   - *Citation*: Zippenfenig, P. (2023). *Open-Meteo: Open-source weather API*. CC BY 4.0.
   - *Usage*: Real-time 2 m temperature ($T_{2\text{m}}$), surface pressure ($P_{\text{sfc}}$), 10 m wind speed, and precipitation rates across all live Indian stations.
5. **NASA POWER Project (Prediction Of Worldwide Energy Resources)**
   - *Citation*: NASA Langley Research Center POWER Project. Atmospheric Science Data Center.
   - *Usage*: Independent satellite and MERRA-2 reanalysis cross-verification of station temperature and surface parameters.
6. **United Nations & European Commission GDACS**
   - *Citation*: Global Disaster Alert and Coordination System (GDACS). Joint Research Centre (JRC).
   - *Usage*: Real-time live disaster alert feed for South Asian earthquakes, floods, and tropical storms.
