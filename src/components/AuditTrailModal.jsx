import React from 'react';
import { Terminal, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AuditTrailModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const logs = [
    { time: '15:32:04.102 IST', node: 'VARUNA-P1', level: 'SYS_INIT', msg: 'MET-SATCOM-07 Ka-band telemetry locked. Geostationary orbital downlink nominal.' },
    { time: '15:33:18.420 IST', node: 'VARUNA-P1', level: 'AI_MESH', msg: 'Spatio-temporal convLSTM anomaly detector weights verified (SHA-256: 8f4b...c391).' },
    { time: '15:34:45.981 IST', node: 'VARUNA-P1', level: 'TLS_HS', msg: 'Mutual TLS certificate exchange with NIC-Gov PKI completed. Cipher: TLS_AES_256_GCM_SHA384.' },
    { time: '15:35:00.001 IST', node: 'VARUNA-P1', level: 'AUDIT', msg: 'Continuous audit daemon engaged. Zero unauthorized sessions detected.' }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card mono" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Terminal size={15} color="var(--accent-slate)" />
            <span>NODE VARUNA-P1 // REAL-TIME SYSTEM AUDIT TRAIL</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ backgroundColor: '#070a0e', padding: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px' }}>
            {logs.map((log, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', lineHeight: '1.4', borderBottom: '1px solid #1a222f', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>[{log.time}]</span>
                <span style={{ color: 'var(--accent-slate)', fontWeight: 600 }}>{log.level}</span>
                <span style={{ color: 'var(--text-primary)' }}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={12} color="#348e3c" />
            <span>Integrity Checksum: SHA-384 OK | Tamper Evidence Log: IMMUTABLE</span>
          </div>
          <button type="button" className="theme-toggle-btn" onClick={onClose}>
            CLOSE LOG
          </button>
        </div>
      </div>
    </div>
  );
}
