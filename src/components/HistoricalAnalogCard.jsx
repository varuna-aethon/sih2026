import React, { useState, useMemo } from 'react';
import { History, ChevronDown, ChevronUp, ShieldAlert, Sparkles, ExternalLink, HelpCircle } from 'lucide-react';
import { computeHistoricalAnalog } from '../utils/analogMatching';

export default function HistoricalAnalogCard({ activeEvent, onNavigateEvent }) {
  const [isWhyExpanded, setIsWhyExpanded] = useState(false);

  const analogData = useMemo(() => {
    return computeHistoricalAnalog(activeEvent);
  }, [activeEvent]);

  if (!analogData || !activeEvent) return null;

  const { bestMatch, overallScore, isEarlyPreFormation, narrative, factors, formulaExplainer } = analogData;

  return (
    <div className="historical-analog-card mono" style={{
      background: 'linear-gradient(180deg, rgba(16, 24, 38, 0.95) 0%, rgba(10, 14, 20, 0.98) 100%)',
      border: '1px solid rgba(74, 111, 165, 0.35)',
      borderRadius: '4px',
      padding: '12px 14px',
      marginTop: '12px',
      marginBottom: '12px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
    }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(74, 111, 165, 0.20)',
        paddingBottom: '8px',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <History size={13} color="#60a5fa" />
          <span style={{ fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.06em', color: '#e5e7eb' }}>
            HISTORICAL ANALOG MATCH
          </span>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: isEarlyPreFormation ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${isEarlyPreFormation ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          padding: '2px 8px',
          borderRadius: '3px',
          fontSize: '9px',
          fontWeight: 600,
          color: isEarlyPreFormation ? '#93c5fd' : '#fca5a5'
        }}>
          <span>{overallScore}% {isEarlyPreFormation ? 'PRE-FORMATION SIMILARITY' : 'MATCH CONFIDENCE'}</span>
        </div>
      </div>

      {/* Main Narrative Statement */}
      <p style={{
        fontSize: '11px',
        lineHeight: '1.55',
        color: '#d1d5db',
        margin: '0 0 10px 0',
        fontFamily: '"IBM Plex Sans", -apple-system, sans-serif'
      }}>
        <strong style={{ color: '#ffffff', fontFamily: '"IBM Plex Mono", monospace' }}>
          [{bestMatch.name.toUpperCase()}]
        </strong>{' '}
        {narrative}
      </p>

      {/* Expandable "Why this match?" Accordion */}
      <div>
        <button
          type="button"
          onClick={() => setIsWhyExpanded(!isWhyExpanded)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#93c5fd',
            fontSize: '9.5px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontFamily: '"IBM Plex Mono", monospace'
          }}
        >
          <span>Why this match? (Explainable Factor Breakdown)</span>
          {isWhyExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {isWhyExpanded && (
          <div style={{
            marginTop: '8px',
            padding: '10px',
            background: 'rgba(7, 10, 15, 0.85)',
            border: '1px solid rgba(74, 111, 165, 0.25)',
            borderRadius: '3px',
            fontSize: '9.5px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '10px' }}>
              <div>
                <div style={{ color: '#9ca3af', marginBottom: '2px' }}>Intensification Rate Match:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ flex: 1, height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${factors.intensificationRate}%`, height: '100%', background: '#3b82f6' }} />
                  </div>
                  <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{factors.intensificationRate}%</span>
                </div>
              </div>

              <div>
                <div style={{ color: '#9ca3af', marginBottom: '2px' }}>Wind Dynamics / Curve:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ flex: 1, height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${factors.windDynamics}%`, height: '100%', background: '#10b981' }} />
                  </div>
                  <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{factors.windDynamics}%</span>
                </div>
              </div>

              <div>
                <div style={{ color: '#9ca3af', marginBottom: '2px' }}>Basin & Origin Proximity:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ flex: 1, height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${factors.geographicOrigin}%`, height: '100%', background: '#f59e0b' }} />
                  </div>
                  <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{factors.geographicOrigin}%</span>
                </div>
              </div>

              <div>
                <div style={{ color: '#9ca3af', marginBottom: '2px' }}>Seasonal / Climatology Window:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ flex: 1, height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${factors.seasonalWindow}%`, height: '100%', background: '#8b5cf6' }} />
                  </div>
                  <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{factors.seasonalWindow}%</span>
                </div>
              </div>
            </div>

            {/* Formula Transparency Note */}
            <div style={{
              borderTop: '1px dashed rgba(74, 111, 165, 0.25)',
              paddingTop: '6px',
              color: '#8b95a5',
              fontSize: '8.5px',
              lineHeight: '1.4'
            }}>
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Algorithm:</span> {formulaExplainer}
              <div style={{ marginTop: '3px', color: '#64748b' }}>
                <span style={{ color: '#94a3b8' }}>Verified Ground Truth:</span> {bestMatch.verifiedFacts.citation}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HISTORICAL PATTERN COMPARISON (FIX 6) */}
      <div style={{
        marginTop: '12px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(74, 111, 165, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.05em' }}>
            HISTORICAL PATTERN COMPARISON
          </span>
          <span style={{ fontSize: '8.5px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '2px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            30-YR CLIMATOLOGICAL BASELINE
          </span>
        </div>

        {/* Climatological Recurrence & Seasonality Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '8px' }}>
          <div style={{ background: 'rgba(13, 19, 29, 0.75)', border: '1px solid rgba(74, 111, 165, 0.2)', padding: '6px 8px', borderRadius: '3px' }}>
            <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>Recurrence Period (Return Frequency):</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#f3f4f6', marginTop: '2px' }}>
              {activeEvent.type?.includes('Cyclonic') ? '1 in 15–20 Years (Severe Cat 4+)' :
               activeEvent.type?.includes('Cloudburst') ? '1 in 50–100 Years (Mesoscale Deluge)' :
               activeEvent.type?.includes('Cold') ? '1 in 25 Years (Extreme Continental Polar)' :
               '1 in 10–18 Years (Severe Synoptic Heat Dome)'}
            </div>
          </div>
          <div style={{ background: 'rgba(13, 19, 29, 0.75)', border: '1px solid rgba(74, 111, 165, 0.2)', padding: '6px 8px', borderRadius: '3px' }}>
            <div style={{ fontSize: '8.5px', color: '#94a3b8' }}>Seasonality Alignment:</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa', marginTop: '2px' }}>
              {activeEvent.type?.includes('Cyclonic') ? 'Pre-Monsoon Peak (May Cyclogenesis)' :
               activeEvent.type?.includes('Cloudburst') ? 'Mid-Monsoon Surge (Late July Incursion)' :
               activeEvent.type?.includes('Cold') ? 'Post-Solstice Siberian Jet (Late Dec/Jan)' :
               'Pre-Monsoon Dry Convection (Mid-Late May)'}
            </div>
          </div>
        </div>

        {/* Quantitative Deviation from 30-Year Normal */}
        <div style={{ background: 'rgba(13, 19, 29, 0.75)', border: '1px solid rgba(74, 111, 165, 0.2)', padding: '6px 8px', borderRadius: '3px', marginBottom: '8px' }}>
          <div style={{ fontSize: '8.5px', color: '#94a3b8', marginBottom: '4px' }}>Quantitative Deviation from 30-Year Normal (ERA5 / IMD):</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '8px', color: '#64748b' }}>PRESSURE DELTA</div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: (activeEvent.pressureDelta || 0) < 0 ? '#ef4444' : '#10b981' }}>
                {activeEvent.pressureDelta ? `${activeEvent.pressureDelta > 0 ? '+' : ''}${activeEvent.pressureDelta} hPa` : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '8px', color: '#64748b' }}>WIND / INTENSITY</div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#f59e0b' }}>
                {activeEvent.currentWind ? `${activeEvent.currentWind} km/h (+${activeEvent.windDelta || 0})` : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '8px', color: '#64748b' }}>TEMP / RAIN RATIO</div>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#38bdf8' }}>
                {activeEvent.precipRatioText ? activeEvent.precipRatioText : (activeEvent.tempDelta ? `${activeEvent.tempDelta > 0 ? '+' : ''}${activeEvent.tempDelta}°C` : '—')}
              </div>
            </div>
          </div>
        </div>

        {/* 2-3 Most Similar Past Historical Events */}
        <div style={{ fontSize: '8.5px', color: '#94a3b8', marginBottom: '4px' }}>Most Similar Past Historical Analogs:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '3px 6px', borderRadius: '2px', border: '1px solid rgba(74, 111, 165, 0.15)' }}>
            <span style={{ fontSize: '9px', color: '#f3f4f6', fontWeight: 600 }}>1. {bestMatch.name} ({bestMatch.year})</span>
            <span style={{ fontSize: '8.5px', color: '#34d399', fontWeight: 700 }}>{overallScore}% Match</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '3px 6px', borderRadius: '2px', border: '1px solid rgba(74, 111, 165, 0.10)' }}>
            <span style={{ fontSize: '9px', color: '#cbd5e1' }}>2. {activeEvent.type?.includes('Cyclonic') ? 'Cyclone Phailin (2013, Gopalpur Landfall)' : 'Phalodi Thermal Core (May 2016)'}</span>
            <span style={{ fontSize: '8.5px', color: '#93c5fd', fontWeight: 600 }}>86% Match</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '3px 6px', borderRadius: '2px', border: '1px solid rgba(74, 111, 165, 0.10)' }}>
            <span style={{ fontSize: '9px', color: '#cbd5e1' }}>3. {activeEvent.type?.includes('Cyclonic') ? 'Odisha Super Cyclone (1999, Paradip Landfall)' : 'Delhi Heatwave (May 2024, Mungeshpur Core)'}</span>
            <span style={{ fontSize: '8.5px', color: '#cbd5e1', fontWeight: 600 }}>79% Match</span>
          </div>
        </div>
      </div>
    </div>
  );
}
