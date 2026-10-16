import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, Key, AlertCircle, Building, Sun, Moon, ShieldCheck, KeyRound, BookOpen } from 'lucide-react';
import LogoMark from './components/LogoMark';
import OtpInput from './components/OtpInput';
import DepartmentModal from './components/DepartmentModal';
import AuditTrailModal from './components/AuditTrailModal';
import Dashboard from './components/Dashboard';
import MethodologyData from './components/MethodologyData';
import { logAuditAction } from './services/auditLogger';

export default function App() {
  // Navigation View State: 'login' (Loads FIRST by default) | 'dashboard' | 'methodology'
  const [currentView, setCurrentView] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      const h = window.location.hash;
      if (p === '/settings' || h === '#settings' ||
          p === '/dashboard' || h === '#dashboard' ||
          p === '/evacuation' || h === '#evacuation' ||
          p === '/track' || h === '#track' ||
          p === '/bulletin' || h === '#bulletin' ||
          p === '/outlook' || h === '#outlook') {
        return 'dashboard';
      }
      if (p === '/methodology' || h === '#methodology') {
        return 'methodology';
      }
    }
    return 'login';
  });

  // Form state - EMPTY BY DEFAULT as per hard constraint
  const [operatorId, setOperatorId] = useState('');
  const [operatorRole, setOperatorRole] = useState('Forecast Analyst');
  const [password, setPassword] = useState('');
  const [tokenDigits, setTokenDigits] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);

  // Authentication error banner state - HIDDEN BY DEFAULT on initial load
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Display mode (Tactical Dark vs CAD Mode)
  const [cadMode, setCadMode] = useState(false);

  // Modals state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  // Real-time IST Clock
  const [istTime, setIstTime] = useState('--:--:-- IST');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      const formatter = new Intl.DateTimeFormat('en-GB', options);
      const parts = formatter.formatToParts(now);

      let day = '', month = '', year = '', hour = '', minute = '', second = '';
      for (const p of parts) {
        if (p.type === 'day') day = p.value;
        if (p.type === 'month') month = p.value.toUpperCase();
        if (p.type === 'year') year = p.value;
        if (p.type === 'hour') hour = p.value;
        if (p.type === 'minute') minute = p.value;
        if (p.type === 'second') second = p.value;
      }
      setIstTime(`${day} ${month} ${year} | ${hour}:${minute}:${second} IST`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const [previousView, setPreviousView] = useState('login');

  // Listen to hash changes for deep linking to #methodology, #settings, #evacuation, etc.
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === '#methodology' || path === '/methodology') {
        setCurrentView(prev => {
          if (prev !== 'methodology') setPreviousView(prev);
          return 'methodology';
        });
      } else if (hash === '#settings' || path === '/settings' ||
                 hash === '#evacuation' || path === '/evacuation' ||
                 hash === '#track' || path === '/track' ||
                 hash === '#bulletin' || path === '/bulletin' ||
                 hash === '#outlook' || path === '/outlook' ||
                 hash === '#dashboard' || path === '/dashboard') {
        setCurrentView('dashboard');
      } else if (hash === '#login' || path === '/login') {
        setCurrentView('login');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleToggleTheme = () => {
    setCadMode((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add('cad-mode');
      } else {
        document.body.classList.remove('cad-mode');
      }
      return next;
    });
  };

  const handleAutofillDemo = () => {
    setOperatorId('OP-8842-MET');
    setPassword('varuna@2026');
    setTokenDigits(['8', '4', '9', '2', '0', '1']);
    setOperatorRole('Forecast Analyst');
    setErrorMessage(null);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const fullToken = tokenDigits.join('');
    
    // Hard constraint: Validation error shown ONLY after attempt
    if (!operatorId.trim() || !password.trim() || fullToken.length < 6) {
      setErrorMessage({
        title: 'ACCESS REJECTED: INCOMPLETE IDENTIFIERS',
        en: 'All credentials are required. Ensure Operator ID, Password, and all 6 Security Token digits are entered.',
        hi: 'सभी क्रेडेंशियल अनिवार्य हैं। कृपया ऑपरेटर आईडी, पासवर्ड और सभी 6-अंकों का टोकन दर्ज करें।'
      });
      return;
    }

    setIsAuthenticating(true);

    // Simulate authentication handshake, transitioning into Dashboard
    setTimeout(() => {
      setIsAuthenticating(false);
      setErrorMessage(null);
      logAuditAction(
        'SESSION_LOGIN',
        `Operator ${operatorId} authenticated via 6-digit MFA token (Role: ${operatorRole})`,
        operatorId,
        'AUTH'
      );
      setCurrentView('dashboard');
    }, 600);
  };

  return (
    <div className="app-shell">
      {/* 1. TOP BAR (IDENTICAL ON LOGIN & DASHBOARD) */}
      <header className="top-bar">
        <div className="top-left mono">
          <div className="station-pill">
            <span>STATION: MET-SATCOM-07 | NODE: VARUNA-P1</span>
            <div className="status-badge" title="Telemetry nominal">
              <span className="status-dot"></span>
              <span>SYSTEM: OPERATIONAL</span>
            </div>
          </div>
        </div>

        <div className="top-right mono">
          {/* Quick lock session button visible when inside dashboard */}
          {currentView === 'dashboard' && (
            <button 
              type="button" 
              className="theme-toggle-btn"
              onClick={() => setCurrentView('login')}
              title="Lock session and return to Secure Access Portal"
            >
              <ShieldCheck size={11} color="var(--accent-slate)" />
              <span>LOCK SESSION</span>
            </button>
          )}

          <div className="live-clock">{istTime}</div>
          
          <button 
            type="button" 
            className="theme-toggle-btn" 
            onClick={handleToggleTheme}
            aria-label="Toggle Tactical Commander Display Mode"
          >
            {cadMode ? <Sun size={12} /> : <Moon size={12} />}
            <span>{cadMode ? 'STD DARK' : 'COMMAND VIEW'}</span>
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT: CONDITIONAL RENDER BETWEEN DASHBOARD, METHODOLOGY & LOGIN */}
      {currentView === 'dashboard' ? (
        <Dashboard 
          onReturnToLogin={() => {
            logAuditAction('SESSION_LOCK', `Session locked by operator ${operatorId || 'OP-8842-MET'}`, operatorId || 'OP-8842-MET', 'AUTH');
            setCurrentView('login');
          }}
          operatorId={operatorId || 'OP-8842-MET'}
          operatorRole={operatorRole}
        />
      ) : currentView === 'methodology' ? (
        <MethodologyData 
          onBack={() => {
            const target = previousView === 'dashboard' ? 'dashboard' : 'login';
            window.location.hash = `#${target}`;
            setCurrentView(target);
          }}
          onNavigateDashboard={() => {
            window.location.hash = '#dashboard';
            setCurrentView('dashboard');
          }}
        />
      ) : (
        /* CENTERED LOGIN CARD VIEW */
        <main className="main-stage">
          <div className="auth-card" role="region" aria-label="Secure Access Panel">
            
            {/* LOGO MARK: Abstract diamond/compass glyph */}
            <LogoMark />

            {/* BADGE */}
            <div className="access-badge mono">
              SECURE ACCESS / सुरक्षित पहुँच
            </div>

            {/* TITLE GROUP */}
            <div className="title-group">
              <h1 className="main-title mono">VARUNA</h1>
              <div className="hindi-title devanagari">वरुण</div>
            </div>

            {/* SUBTITLE */}
            <div className="subtitle-group">
              <div className="subtitle-en mono">AI-DRIVEN SPATIO-TEMPORAL WEATHER ANOMALY TRACKING</div>
              <div className="subtitle-hi devanagari">एआई-आधारित स्थानिक-कालिक चरम मौसम विसंगति ट्रैकिंग</div>
            </div>

            {/* AUTHORIZATION NOTICE */}
            <div className="auth-restriction mono">
              AUTHORIZED PERSONNEL ONLY / केवल अधिकृत कर्मियों के लिए
            </div>

            {/* DYNAMIC ERROR MESSAGE (Shown ONLY after failed login attempt) */}
            {errorMessage && (
              <div className="error-alert mono" role="alert" aria-live="assertive">
                <div className="error-alert-header">
                  <AlertCircle size={13} />
                  <span>{errorMessage.title}</span>
                </div>
                <div>{errorMessage.en}</div>
                <div className="devanagari" style={{ fontSize: '9.5px', marginTop: '2px', opacity: 0.9 }}>
                  {errorMessage.hi}
                </div>
              </div>
            )}

            {/* LOGIN FORM */}
            <form className="login-form" onSubmit={handleFormSubmit} noValidate>
              
              {/* FIELD 1: OPERATOR ID */}
              <div className="form-group">
                <div className="field-label">
                  <span className="mono">Operator ID</span>
                  <span className="label-hi devanagari">ऑपरेटर आईडी</span>
                </div>
                <div className="input-wrapper">
                  <User className="input-icon" />
                  <input
                    type="text"
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                    placeholder="OP-XXXX-MET"
                    className="text-input mono"
                    autoComplete="off"
                    spellCheck="false"
                    required
                  />
                </div>
              </div>

              {/* FIELD 1B: OPERATIONAL ROLE SELECTOR */}
              <div className="form-group">
                <div className="field-label">
                  <span className="mono">Operational Role</span>
                  <span className="label-hi devanagari">परिचालन भूमिका</span>
                </div>
                <div className="input-wrapper">
                  <ShieldCheck className="input-icon" />
                  <select
                    value={operatorRole}
                    onChange={(e) => setOperatorRole(e.target.value)}
                    className="text-input mono role-select-input"
                  >
                    <option value="Forecast Analyst">Forecast Analyst</option>
                    <option value="Disaster Management Authority (DMA)">Disaster Management Authority (DMA)</option>
                    <option value="Evaluation Panel">Evaluation Panel</option>
                    <option value="Guest Observer">Guest Observer</option>
                  </select>
                </div>
              </div>

              {/* FIELD 2: PASSWORD */}
              <div className="form-group">
                <div className="field-label">
                  <span className="mono">Password</span>
                  <span className="label-hi devanagari">पासवर्ड</span>
                </div>
                <div className="input-wrapper">
                  <Lock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="text-input has-toggle mono"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* FIELD 3: 6 BOXES FOR CODE (SECURE ACCESS TOKEN / PIN) */}
              <div className="form-group">
                <div className="field-label">
                  <span className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Key size={11} color="var(--accent-slate)" />
                    <span>Secure Access Token / PIN (6-Digit)</span>
                  </span>
                  <span className="label-hi devanagari">सुरक्षा टोकन / पिन</span>
                </div>
                
                {/* 6 Individual Code Boxes */}
                <OtpInput value={tokenDigits} onChange={setTokenDigits} />
                
                <div className="otp-helper-row mono">
                  <span>HARDWARE TOKEN / TOTP</span>
                  <span>6-DIGIT AUTHENTICATOR CODE</span>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="submit-btn mono"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <span>[ VERIFYING MET-UPLINK... ]</span>
                ) : (
                  <span>[ SECURE LOGIN ]</span>
                )}
              </button>
            </form>

            {/* AUTHORIZED CREDENTIALS HINT (CLICK TO AUTOFILL) */}
            <div 
              className="demo-credentials-banner mono" 
              onClick={handleAutofillDemo} 
              title="Click to autofill authorized demo credentials"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <KeyRound size={11} color="var(--accent-slate)" />
                <span>DEMO CREDENTIALS:</span>
              </div>
              <span className="demo-fill-link">OP-8842-MET · varuna@2026 · PIN: 849201 ↗</span>
            </div>

            {/* FOOTER LINK INSIDE CARD: DEPARTMENT / INSTITUTIONAL LOGIN & METHODOLOGY */}
            <div className="card-footer mono">
              <button
                type="button"
                className="institutional-btn"
                onClick={() => setIsDeptModalOpen(true)}
              >
                <Building size={12} color="var(--accent-slate)" />
                <span>Department / Institutional Login</span>
              </button>

              {selectedDept && (
                <span className="active-dept-pill">
                  ATTACHED: {selectedDept.abbr.split('/')[0].trim()} ({selectedDept.division.split('—')[0].trim()})
                </span>
              )}

              {/* Direct Small Text Link to Methodology */}
              <button
                type="button"
                className="login-methodology-link-btn"
                onClick={() => {
                  window.location.hash = '#methodology';
                  setCurrentView('methodology');
                }}
                title="View Data Sources & Methodology Specification"
                style={{ marginTop: '10px' }}
              >
                <span>View Data Sources & Methodology →</span>
              </button>
            </div>

          </div>
        </main>
      )}

      {/* 3. FULL-WIDTH FOOTER (PERSISTENT ACROSS VIEWS) */}
      <footer className="system-footer">
        {currentView === 'login' && (
          <div className="compliance-notice">
            NOTICE: Unauthorized access or misuse of this system is strictly prohibited under applicable laws. All network connections and user activities are continuously monitored and logged.
          </div>
        )}

        <div className="bottom-status-bar mono">
          <div className="status-left">
            <span 
              className="audit-interactive" 
              onClick={() => setIsAuditModalOpen(true)}
              title="Click to view node audit records"
            >
              AUDIT TRAIL: ACTIVE ↗
            </span>
            <span>|</span>
            <span 
              className="methodology-status-link" 
              onClick={() => {
                window.location.hash = '#methodology';
                setCurrentView('methodology');
              }}
              title="Inspect primary data layers, mathematical formulations, and citations"
            >
              DATA & METHODOLOGY ↗
            </span>
            <span>|</span>
            <span>SECURE SESSION</span>
            <span>|</span>
            <span>NODE: VARUNA-P1</span>
          </div>

          <div className="status-right">
            <span>Operational Research Prototype — Independent Academic Project. Not affiliated with or endorsed by any government ministry or agency.</span>
            <span className="version-tag">v0.9.4-PROTOTYPE</span>
          </div>
        </div>
      </footer>

      {/* DEPARTMENT MODAL */}
      <DepartmentModal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        selectedDept={selectedDept}
        onSelectDept={setSelectedDept}
      />

      {/* AUDIT TRAIL MODAL */}
      <AuditTrailModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
}
