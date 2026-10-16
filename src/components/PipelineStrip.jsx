import React, { useState } from 'react';
import { 
  Satellite, 
  GitFork, 
  Gauge, 
  Layers, 
  Target, 
  ChevronRight,
  Info,
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';

const PIPELINE_STEPS = [
  {
    step: '01',
    id: 'ingest',
    title: 'NEPS-G / OPEN INGEST',
    subtitle: '12km Gridded NWP',
    mode: 'LIVE',
    icon: Satellite,
    details: 'Real-time client-side ingest of Open-Meteo forecast, ECMWF reanalysis archive, and 30-member GFS ensemble streams across 20 pan-India observation nodes.'
  },
  {
    step: '02',
    id: 'gnn',
    title: 'GNN MESH TRACKING',
    subtitle: 'Icosahedral Mesh Tracking',
    mode: 'PROPOSED',
    icon: GitFork,
    details: 'Proposed Graph Neural Network (GNN) on spherical icosahedral mesh. Tracks spatio-temporal dynamics and advective propagation across regional boundaries.'
  },
  {
    step: '03',
    id: 'efi',
    title: 'EFI & ENSEMBLE',
    subtitle: '30-Member Agreement',
    mode: 'LIVE',
    icon: Gauge,
    details: 'Live Extreme Forecast Index (EFI) computation derived from Open-Meteo 30-member GFS ensemble variance against 10-year same-hour baseline distributions.'
  },
  {
    step: '04',
    id: 'diffusion',
    title: 'DIFFUSION DOWNSCALE',
    subtitle: 'Generative Super-Resolution',
    mode: 'PROPOSED',
    icon: Layers,
    details: 'Proposed generative diffusion model conditioned on topographical elevation and physics-informed loss to downscale 12km NWP fields to 5km mesh.'
  },
  {
    step: '05',
    id: 'impact',
    title: '5km IMPACT & ALERT',
    subtitle: '5km Zone · Alert API',
    mode: 'LIVE',
    icon: Target,
    details: 'Real-time 5km impact radius calculation, 3x3 local forecast point sampling, and automated standard Cap-compatible alert JSON generation.'
  }
];

export default function PipelineStrip() {
  const [selectedStep, setSelectedStep] = useState(null);

  return (
    <div className="pipeline-tracker-container mono" aria-label="System Architecture Pipeline Tracker">
      <div className="pipeline-compact-bar">
        
        {/* Left Label */}
        <div className="pipeline-label-tag">
          <span className="pipeline-tag-text">AI PIPELINE:</span>
        </div>

        {/* 5 Distinct Step Pills in a Row */}
        <div className="pipeline-steps-row">
          {PIPELINE_STEPS.map((item, idx) => {
            const Icon = item.icon;
            const isLive = item.mode === 'LIVE';
            const isSelected = selectedStep?.id === item.id;

            return (
              <React.Fragment key={item.id}>
                <div 
                  className={`pipeline-pill ${isLive ? 'pill-live' : 'pill-proposed'} ${isSelected ? 'pill-active' : ''}`}
                  onClick={() => setSelectedStep(isSelected ? null : item)}
                  title={`${item.title} (${item.mode}) — Click for architectural specification`}
                  role="button"
                  tabIndex={0}
                >
                  <Icon size={11} className="pill-icon" />
                  <span className="pill-title">{item.title}</span>
                  <span className={`pill-badge ${isLive ? 'badge-live-tag' : 'badge-proposed-tag'}`}>
                    {item.mode}
                  </span>
                </div>

                {idx < PIPELINE_STEPS.length - 1 && (
                  <ChevronRight size={11} className="pipeline-chevron" aria-hidden="true" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Info Icon Button */}
        <button 
          type="button" 
          className="pipeline-info-btn"
          onClick={() => setSelectedStep(selectedStep ? null : PIPELINE_STEPS[1])}
          title="Architecture Honesty Note"
        >
          <Info size={12} />
        </button>

      </div>

      {/* Architecture Honesty Banner Note */}
      <div className="pipeline-honesty-strip">
        <span className="honesty-text">
          Prototype demonstrates the data, alert and visualization layer on live open data; the AI core is the proposed architecture.
        </span>
        <span className="pipeline-cadence-label">
          CADENCE: 12km GLOBAL NWP → 5km LOCAL AI INFERENCE
        </span>
      </div>

      {/* Selected Step Popover / Detail Drawer */}
      {selectedStep && (
        <div className="pipeline-step-modal">
          <div className="step-modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={`pill-badge ${selectedStep.mode === 'LIVE' ? 'badge-live-tag' : 'badge-proposed-tag'}`}>
                {selectedStep.mode}
              </span>
              <span className="step-modal-title">STAGE {selectedStep.step}: {selectedStep.title}</span>
            </div>
            <button 
              type="button" 
              className="step-modal-close" 
              onClick={() => setSelectedStep(null)}
              title="Close specification"
            >
              <X size={12} />
            </button>
          </div>
          <div className="step-modal-body">
            <p className="step-modal-desc">{selectedStep.details}</p>
            <div className="step-modal-footer">
              <span>RESOLUTION: {selectedStep.subtitle}</span>
              <span style={{ color: selectedStep.mode === 'LIVE' ? '#388e3c' : 'var(--accent-slate)' }}>
                {selectedStep.mode === 'LIVE' ? '✓ VERIFIED ON LIVE OPEN API' : '⚙ TARGET DEPLOYMENT TARGET'}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
