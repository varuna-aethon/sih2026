import React from 'react';

export default function LogoMark() {
  return (
    <div className="logo-container" aria-hidden="true">
      <svg className="logo-svg" viewBox="0 0 40 40">
        {/* Outer compass cardinal ticks */}
        <line x1="20" y1="2" x2="20" y2="6"></line>
        <line x1="20" y1="34" x2="20" y2="38"></line>
        <line x1="2" y1="20" x2="6" y2="20"></line>
        <line x1="34" y1="20" x2="38" y2="20"></line>
        
        {/* Primary geometric diamond */}
        <polygon points="20,5 35,20 20,35 5,20"></polygon>
        
        {/* Inner concentric diamond */}
        <polygon points="20,11 29,20 20,29 11,20"></polygon>
        
        {/* Precision coordinate crosshairs */}
        <line x1="20" y1="16" x2="20" y2="24"></line>
        <line x1="16" y1="20" x2="24" y2="20"></line>
      </svg>
    </div>
  );
}
