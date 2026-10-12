const features = [
  { title: 'People', value: '1,284', detail: 'Active employees' },
  { title: 'Projects', value: '42', detail: 'Running initiatives' },
  { title: 'Files', value: '8.7k', detail: 'Shared documents' },
  { title: 'Ops health', value: '99.2%', detail: 'System uptime' },
]

export default function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">SyncDesk</p>
          <h1>Enterprise operating system</h1>
        </div>
        <button type="button">Launch workspace</button>
      </header>

      <section className="hero">
        <div>
          <p className="label">Overview</p>
          <h2>Everything your teams need, in one connected workspace.</h2>
          <p className="subtitle">Real-time presence, project visibility, communication, and operational dashboards are all unified here.</p>
        </div>
        <div className="status-card">
          <span className="dot" />
          <div>
            <strong>System status</strong>
            <p>All services healthy</p>
          </div>
        </div>
      </section>

      <section className="metrics">
        {features.map((feature) => (
          <article key={feature.title} className="metric-card">
            <p>{feature.title}</p>
            <h3>{feature.value}</h3>
            <small>{feature.detail}</small>
          </article>
        ))}
      </section>
    </main>
  )
}
