export default function App() {
  const apiUrl = import.meta.env.VITE_API_URL || 'Not configured yet'

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.logo}>B</div>
        <p style={styles.eyebrow}>DEPLOYMENT FOUNDATION</p>
        <h1 style={styles.title}>Bugzilla</h1>
        <p style={styles.description}>
          The production frontend foundation is online and ready for the real application to be built on top of it.
        </p>

        <div style={styles.grid}>
          <Status label="Frontend" value="Ready" />
          <Status label="Build" value="Vite" />
          <Status label="Hosting" value="Vercel" />
          <Status label="API" value={apiUrl === 'Not configured yet' ? 'Pending' : 'Configured'} />
        </div>

        <p style={styles.note}>
          API integration will be connected later through <code>VITE_API_URL</code>.
        </p>
      </section>
    </main>
  )
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.status}>
      <span style={styles.statusDot} />
      <div>
        <span style={styles.label}>{label}</span>
        <strong style={styles.value}>{value}</strong>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    margin: 0,
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    boxSizing: 'border-box' as const,
    background: '#0b0d10',
    color: '#f4f6f8',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '620px',
    padding: '40px',
    boxSizing: 'border-box' as const,
    border: '1px solid #242a31',
    borderRadius: '20px',
    background: '#11151a',
    boxShadow: '0 24px 80px rgba(0,0,0,.35)',
  },
  logo: {
    width: '44px',
    height: '44px',
    display: 'grid',
    placeItems: 'center',
    marginBottom: '28px',
    borderRadius: '12px',
    background: '#f4f6f8',
    color: '#0b0d10',
    fontSize: '20px',
    fontWeight: 800,
  },
  eyebrow: {
    margin: '0 0 8px',
    color: '#8993a0',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '.12em',
  },
  title: {
    margin: 0,
    fontSize: '42px',
    lineHeight: 1.05,
    letterSpacing: '-.04em',
  },
  description: {
    margin: '16px 0 28px',
    color: '#aab3bf',
    fontSize: '16px',
    lineHeight: 1.65,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px',
    border: '1px solid #242a31',
    borderRadius: '12px',
    background: '#0d1115',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    flex: '0 0 auto',
    borderRadius: '50%',
    background: '#55d187',
    boxShadow: '0 0 0 4px rgba(85,209,135,.08)',
  },
  label: {
    display: 'block',
    color: '#7f8995',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '.08em',
  },
  value: {
    display: 'block',
    marginTop: '3px',
    fontSize: '14px',
  },
  note: {
    margin: '22px 0 0',
    color: '#6f7985',
    fontSize: '13px',
    lineHeight: 1.6,
  },
} as const
