interface TelemetryOverlayProps {
  duration: string;
  avgSpeed: string;
  cams: number;
  viewers: number;
}

export default function TelemetryOverlay({ duration, avgSpeed, cams, viewers }: TelemetryOverlayProps) {
  const rows = [
    { icon: '⏱', label: 'DURAÇÃO', value: duration },
    { icon: '⚡', label: 'MÉDIA',   value: avgSpeed },
    { icon: '📷', label: 'CAMS',    value: String(cams) },
    { icon: '👁', label: 'VIEWERS', value: String(viewers) },
  ];

  return (
    <div className="telemetry-overlay">
      <div className="tele-header">TELEMETRIA</div>
      {rows.map(r => (
        <div key={r.label} className="tele-row">
          <span className="tele-icon">{r.icon}</span>
          <span className="tele-label">{r.label}</span>
          <span className="tele-value">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
