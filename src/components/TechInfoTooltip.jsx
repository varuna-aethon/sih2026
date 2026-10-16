import React, { useState } from 'react';

/**
 * Reusable Technical Specification (?) Info-Affordance Component
 * Designed to mirror high-reliability instrumentation panels (NASA JPL / Bloomberg / ISRO standard).
 * Displays a concise, authoritative definition on hover or tap.
 */
export default function TechInfoTooltip({ term, definition, placement = 'top' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span 
      className="tech-info-wrap"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
      }}
      tabIndex={0}
      role="button"
      aria-label={`Technical specification for ${term}`}
    >
      <span className="tech-info-trigger" title={`Technical Specification: ${term}`}>?</span>
      {isOpen && (
        <span className={`tech-info-popover placement-${placement} mono`}>
          <span className="tip-header">SPECIFICATION // {term}</span>
          <span className="tip-body">{definition}</span>
        </span>
      )}
    </span>
  );
}

/**
 * Reusable Mission-Control Orienting Synthesis Banner
 * Consistent, authoritative briefing voice across government command screens.
 */
export function MissionSynthesisBanner({ 
  text, 
  subtitle = null, 
  tag = "MISSION-CONTROL ORIENTATION",
  metric = null 
}) {
  return (
    <div className="mission-orienting-banner mono">
      <div className="mob-left">
        <span className="mob-tag">{tag}</span>
        <span className="mob-text">{text}</span>
        {subtitle && <span className="mob-sub"> · {subtitle}</span>}
      </div>
      {metric && (
        <div className="mob-metric">
          <span className="mob-metric-val">{metric}</span>
        </div>
      )}
    </div>
  );
}
