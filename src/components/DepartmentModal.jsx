import React, { useState } from 'react';
import { Building2, X, Check, ShieldCheck, ExternalLink, Globe2 } from 'lucide-react';

const DEPARTMENTS = [
  {
    id: 'IMD',
    abbr: 'IMD / आईएमडी',
    nameEn: 'India Meteorological Department (MoES)',
    nameHi: 'भारत मौसम विज्ञान विभाग',
    division: 'NWFC — Severe Weather & Radar Anomaly Cell',
    authType: 'e-Pramaan SSO / NIC PKI',
    status: 'FEDERATION NOMINAL'
  },
  {
    id: 'INCOIS',
    abbr: 'INCOIS / इनकोइस',
    nameEn: 'Indian National Centre for Ocean Information Services',
    nameHi: 'भारतीय राष्ट्रीय महासागर सूचना सेवा केंद्र',
    division: 'Ocean State & Coastal Surge Forecasting Division',
    authType: 'MoES SAML 2.0 Identity Hub',
    status: 'FEDERATION NOMINAL'
  },
  {
    id: 'ISRO_NRSC',
    abbr: 'NRSC-ISRO / एनआरएससी',
    nameEn: 'National Remote Sensing Centre (ISRO/DOS)',
    nameHi: 'राष्ट्रीय सुदूर संवेदन केंद्र (इसरो)',
    division: 'DMSP — Disaster Management Support & Satellite Earth Observation',
    authType: 'DOS Space-Grid PKI Auth',
    status: 'FEDERATION NOMINAL'
  },
  {
    id: 'NCMRWF',
    abbr: 'NCMRWF / एनसीएमआरडब्ल्यूएफ',
    nameEn: 'National Centre for Medium Range Weather Forecasting',
    nameHi: 'राष्ट्रीय मध्यम अवधि मौसम पूर्वानुमान केंद्र',
    division: 'AI Coupled Earth System Numerical Modeling',
    authType: 'PARAM HPC Kerberos SSO',
    status: 'FEDERATION NOMINAL'
  },
  {
    id: 'NDMA',
    abbr: 'NDMA / एनडीएमए',
    nameEn: 'National Disaster Management Authority (MHA)',
    nameHi: 'राष्ट्रीय आपदा प्रबंधन प्राधिकरण',
    division: 'National Emergency Operations Centre (NEOC)',
    authType: 'GovID Zero-Trust Gateway',
    status: 'FEDERATION NOMINAL'
  },
  {
    id: 'MOES_HQ',
    abbr: 'MoES / पृथ्वी विज्ञान मंत्रालय',
    nameEn: 'Ministry of Earth Sciences (Apex Command)',
    nameHi: 'पृथ्वी विज्ञान मंत्रालय, भारत सरकार',
    division: 'Central Atmospheric Science & Telemetry Council',
    authType: 'National Informatics Centre (NIC) Gateway',
    status: 'FEDERATION NOMINAL'
  },
  {
    id: 'CDAC_WEATHER',
    abbr: 'C-DAC HPC / सी-डैक',
    nameEn: 'Centre for Development of Advanced Computing',
    nameHi: 'प्रगत संगणन विकास केंद्र',
    division: 'National Supercomputing Mission (NSM) Weather Grid',
    authType: 'NSM Mutual-TLS Grid Gateway',
    status: 'FEDERATION NOMINAL'
  }
];

export default function DepartmentModal({ isOpen, onClose, selectedDept, onSelectDept }) {
  const [activeSelection, setActiveSelection] = useState(selectedDept || DEPARTMENTS[0]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelectDept(activeSelection);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card mono" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Building2 size={16} color="var(--accent-slate)" />
            <span>DEPARTMENT / INSTITUTIONAL FEDERATED ACCESS</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="modal-body">
          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Select your meteorological, oceanographic, or disaster response institutional authority:
          </div>

          <div className="dept-grid">
            {DEPARTMENTS.map((dept) => {
              const isChosen = activeSelection?.id === dept.id;
              return (
                <div
                  key={dept.id}
                  className={`dept-card ${isChosen ? 'selected' : ''}`}
                  onClick={() => setActiveSelection(dept)}
                >
                  <div className="dept-meta-left">
                    <div className="dept-abbr">{dept.abbr}</div>
                    <div className="dept-name-en">{dept.nameEn}</div>
                    <div className="dept-name-hi devanagari">{dept.nameHi}</div>
                    <div style={{ fontSize: '9px', color: 'var(--accent-slate)', marginTop: '2px' }}>
                      ↳ {dept.division}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className="dept-badge">{dept.authType}</span>
                    {isChosen && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: 'var(--text-primary)' }}>
                        <Check size={11} color="var(--accent-slate)" />
                        SELECTED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: 'var(--text-secondary)' }}>
            <ShieldCheck size={13} color="var(--accent-slate)" />
            <span>SAML 2.0 / OIDC 256-Bit Mutual TLS Session</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={onClose}
            >
              CANCEL
            </button>
            <button
              type="button"
              className="submit-btn"
              style={{ width: 'auto', padding: '0 16px', height: '28px' }}
              onClick={handleConfirm}
            >
              [ ATTACH DEPARTMENT ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
