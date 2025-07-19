import './TechIcons.css';

export const AssemblyIcon = () => (
  <div className="tech-icon assembly-icon">
    <div className="assembly-components">
      <div className="component component-1">
        <div className="bolt-hole"></div>
      </div>
      <div className="component component-2">
        <div className="bolt-hole"></div>
      </div>
      <div className="component component-3">
        <div className="bolt-hole"></div>
      </div>
    </div>
    <div className="assembly-bolts">
      <div className="bolt bolt-1"></div>
      <div className="bolt bolt-2"></div>
    </div>
    <div className="assembly-arrows">
      <div className="arrow arrow-1"></div>
      <div className="arrow arrow-2"></div>
    </div>
  </div>
);

export const InspectionIcon = () => (
  <div className="tech-icon inspection-icon">
    <div className="inspection-layers">
      <div className="layer layer-1"></div>
      <div className="layer layer-2"></div>
      <div className="layer layer-3"></div>
      <div className="layer layer-4"></div>
    </div>
    <div className="depth-scanner">
      <div className="scanner-beam"></div>
      <div className="scanner-grid">
        <div className="grid-line grid-h1"></div>
        <div className="grid-line grid-h2"></div>
        <div className="grid-line grid-v1"></div>
        <div className="grid-line grid-v2"></div>
      </div>
    </div>
    <div className="analysis-points">
      <div className="point point-1"></div>
      <div className="point point-2"></div>
      <div className="point point-3"></div>
      <div className="point point-4"></div>
    </div>
  </div>
);

export const RepairIcon = () => (
  <div className="tech-icon repair-icon">
    <div className="wrench">
      <div className="wrench-head"></div>
      <div className="wrench-body"></div>
    </div>
    <div className="diagnostic-grid">
      <div className="grid-dot grid-1"></div>
      <div className="grid-dot grid-2"></div>
      <div className="grid-dot grid-3"></div>
      <div className="grid-dot grid-4"></div>
    </div>
    <div className="signal-waves">
      <div className="wave wave-1"></div>
      <div className="wave wave-2"></div>
    </div>
  </div>
);

export const MaintenanceIcon = () => (
  <div className="tech-icon maintenance-icon">
    <div className="chart-container">
      <div className="chart-bars">
        <div className="bar bar-1"></div>
        <div className="bar bar-2"></div>
        <div className="bar bar-3"></div>
        <div className="bar bar-4"></div>
      </div>
      <div className="trend-line"></div>
    </div>
    <div className="analytics-dots">
      <div className="dot dot-1"></div>
      <div className="dot dot-2"></div>
      <div className="dot dot-3"></div>
    </div>
  </div>
);

export const QualityIcon = () => (
  <div className="tech-icon quality-icon">
    <div className="verification-badge">
      <div className="badge-outer"></div>
      <div className="badge-inner"></div>
      <div className="checkmark">
        <div className="check-stem"></div>
        <div className="check-kick"></div>
      </div>
    </div>
    <div className="quality-rings">
      <div className="ring ring-1"></div>
      <div className="ring ring-2"></div>
      <div className="ring ring-3"></div>
    </div>
  </div>
); 