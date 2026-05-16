export default function AppLoadingScreen() {
  return (
    <div className="app-loading-screen" aria-live="polite" aria-busy="true">
      <div className="app-loading-glow" />
      <div className="app-loading-scene">
        <div className="app-loading-orbit" style={{ transform: 'rotateX(72deg)' }}>
          <div className="app-loading-ring" />
        </div>
        <div className="app-loading-orbit" style={{ transform: 'rotateX(72deg) rotateY(55deg)' }}>
          <div className="app-loading-ring app-loading-ring-delay" />
        </div>
        <div className="app-loading-orbit" style={{ transform: 'rotateX(72deg) rotateY(-55deg)' }}>
          <div className="app-loading-ring app-loading-ring-delay-2" />
        </div>
        <div className="app-loading-globe" />
      </div>
      <p className="app-loading-label">Loading</p>
    </div>
  );
}
