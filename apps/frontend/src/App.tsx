
import { useState, type FormEvent } from 'react'

const API_URL = 'http://127.0.0.1:8000'

type Page = 'login' | 'register' | 'dashboard'

type AthleteProfile = {
  id: number
  user_id: number
  first_name: string
  last_name: string | null
  age: number | null
  body_weight: number | null
  height: number | null
  training_experience: string | null
  training_goal: string | null
}

type ProfileForm = {
  first_name: string
  last_name: string
  age: string
  body_weight: string
  height: string
  training_experience: string
  training_goal: string
}

const emptyProfile: ProfileForm = {
  first_name: '',
  last_name: '',
  age: '',
  body_weight: '',
  height: '',
  training_experience: '',
  training_goal: '',
}

function profileToForm(profile: AthleteProfile): ProfileForm {
  return {
    first_name: profile.first_name ?? '',
    last_name: profile.last_name ?? '',
    age: profile.age?.toString() ?? '',
    body_weight: profile.body_weight?.toString() ?? '',
    height: profile.height?.toString() ?? '',
    training_experience: profile.training_experience ?? '',
    training_goal: profile.training_goal ?? '',
  }
}

function App() {
  const [page, setPage] = useState<Page>('login')
  const [darkMode, setDarkMode] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activePage, setActivePage] = useState('Overview')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [token, setToken] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [athleteProfile, setAthleteProfile] =
    useState<AthleteProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [profileForm, setProfileForm] =
    useState<ProfileForm>(emptyProfile)

  const theme = darkMode
    ? {
        bg: '#202923',
        panel: '#29332C',
        sidebar: '#1B241F',
        text: '#F3F3ED',
        muted: '#A0AA9F',
        border: '#3B473E',
        accent: '#B5D66B',
      }
    : {
        bg: '#F3F3ED',
        panel: '#FFFFFF',
        sidebar: '#EAECE4',
        text: '#202923',
        muted: '#687168',
        border: '#DDE1D7',
        accent: '#829F42',
      }

  const navigation = [
    {
      section: 'WORKSPACE',
      items: ['Overview', 'Athlete Profile', 'Training', 'Exercise Library'],
    },
    {
      section: 'INTELLIGENCE',
      items: ['Evidence Explorer', 'AI Assistant'],
    },
  ]

  const icons: Record<string, string> = {
    Overview: '◫',
    'Athlete Profile': '◎',
    Training: '▤',
    'Exercise Library': '▦',
    'Evidence Explorer': '⌕',
    'AI Assistant': '✳',
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 13px',
    border: `1px solid ${theme.border}`,
    borderRadius: 4,
    background: theme.bg,
    color: theme.text,
    fontSize: 13,
  }

  const panelStyle = {
    background: theme.panel,
    border: `1px solid ${theme.border}`,
    borderRadius: 6,
    padding: 22,
  }

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Registrazione non riuscita.'
        )
      }

      setSuccess('Account creato correttamente. Ora puoi effettuare il login.')
      setPassword('')
      setPage('login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di connessione.')
    } finally {
      setLoading(false)
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Email o password non corretti.')
      }

      const accessToken: string = data.access_token

      setToken(accessToken)
      setUserEmail(email)
      setPassword('')
      setProfileLoading(true)

      try {
        const profileResponse = await fetch(
          `${API_URL}/athlete-profiles/me`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (profileResponse.status === 404) {
          setAthleteProfile(null)
          setProfileForm(emptyProfile)
        } else if (!profileResponse.ok) {
          throw new Error('Impossibile recuperare il profilo atleta.')
        } else {
          const profileData: AthleteProfile =
            await profileResponse.json()

          setAthleteProfile(profileData)
          setProfileForm(profileToForm(profileData))
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Errore durante il recupero del profilo.'
        )
      } finally {
        setProfileLoading(false)
      }

      setActivePage('Overview')
      setPage('dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di connessione.')
    } finally {
      setLoading(false)
    }
  }

  async function saveAthleteProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    setProfileSaving(true)
    setProfileError('')
    setProfileMessage('')

    const payload = {
      first_name: profileForm.first_name.trim(),
      last_name: profileForm.last_name.trim() || null,
      age: profileForm.age === '' ? null : Number(profileForm.age),
      body_weight:
        profileForm.body_weight === ''
          ? null
          : Number(profileForm.body_weight),
      height: profileForm.height === '' ? null : Number(profileForm.height),
      training_experience: profileForm.training_experience || null,
      training_goal: profileForm.training_goal || null,
    }

    try {
      const response = await fetch(
        `${API_URL}/athlete-profiles/${athleteProfile ? 'me' : ''}`,
        {
          method: athleteProfile ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Salvataggio del profilo non riuscito.'
        )
      }

      const savedProfile: AthleteProfile = data

      setAthleteProfile(savedProfile)
      setProfileForm(profileToForm(savedProfile))
      setProfileMessage('Profilo atleta salvato correttamente.')
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : 'Errore di connessione.'
      )
    } finally {
      setProfileSaving(false)
    }
  }

  function logout() {
    setToken(null)
    setUserEmail('')
    setEmail('')
    setPassword('')
    setAthleteProfile(null)
    setProfileForm(emptyProfile)
    setProfileMessage('')
    setProfileError('')
    setError('')
    setSuccess('')
    setPage('login')
    setActivePage('Overview')
  }

  function updateProfileField(
    field: keyof ProfileForm,
    value: string
  ) {
    setProfileForm(current => ({
      ...current,
      [field]: value,
    }))
  }

  const profileFields = [
    { key: 'first_name', label: 'Nome', type: 'text', required: true },
    { key: 'last_name', label: 'Cognome', type: 'text' },
    { key: 'age', label: 'Età', type: 'number', min: '1', max: '120' },
    {
      key: 'body_weight',
      label: 'Peso corporeo (kg)',
      type: 'number',
      min: '0',
      step: '0.1',
    },
    {
      key: 'height',
      label: 'Altezza (cm)',
      type: 'number',
      min: '0',
      step: '0.1',
    },
  ] as const

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.bg,
        color: theme.text,
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        button, input, select { font: inherit; }
        button { cursor: pointer; }

        .auth-layout {
          min-height: calc(100vh - 70px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 25px;
        }

        .auth-panel {
          width: 100%;
          max-width: 440px;
          padding: 38px;
          border: 1px solid;
          border-radius: 7px;
        }

        .auth-link {
          border: 0;
          background: transparent;
          color: #829F42;
          font-weight: 700;
          padding: 0;
        }

        .sidebar {
          width: 245px;
          flex-shrink: 0;
          position: relative;
          min-height: calc(100vh - 70px);
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 11px 13px;
          border: 0;
          border-radius: 5px;
          background: transparent;
          text-align: left;
          font-size: 13px;
          margin: 3px 0;
        }

        .nav-item:hover {
          background: rgba(128,150,100,.12);
        }

        .metric-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 16px;
          margin-top: 20px;
        }

        .profile-fields {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 7px;
        }

        .field-input {
          width: 100%;
          min-width: 0;
          padding: 11px 12px;
          border: 1px solid;
          border-radius: 4px;
          font-size: 13px;
        }

        .mobile-menu { display: none; }

        @media(max-width: 800px) {
          .sidebar {
            position: fixed;
            z-index: 10;
            top: 70px;
            bottom: 0;
            left: 0;
            width: 260px;
            min-height: auto;
            transform: translateX(-100%);
            transition: transform .2s;
          }

          .sidebar.open { transform: translateX(0); }
          .mobile-menu { display: inline-flex; }
          .content-grid { grid-template-columns: 1fr; }
        }

        @media(max-width: 520px) {
          .metric-grid { grid-template-columns: 1fr; }
          .profile-fields { grid-template-columns: 1fr; }
          .main-content { padding: 25px 15px !important; }
          .topbar { padding: 0 15px !important; }
          .page-title { font-size: 24px !important; }
          .auth-panel { padding: 25px 20px; }
        }
      `}</style>

      {/* HEADER */}
      <header
        style={{
          height: 70,
          padding: '0 25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.border}`,
          background: theme.bg,
        }}
      >
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -1 }}>
            ipertrof<span style={{ color: theme.accent }}>IA</span>
          </div>
          <div
            style={{
              fontSize: 9,
              color: theme.muted,
              letterSpacing: 2,
              marginTop: 3,
            }}
          >
            PERFORMANCE PLATFORM
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            border: `1px solid ${theme.border}`,
            background: theme.panel,
            color: theme.text,
            padding: '9px 13px',
            borderRadius: 5,
            fontSize: 12,
          }}
        >
          {darkMode ? '☀ Light mode' : '◐ Dark mode'}
        </button>
      </header>

      {/* LOGIN E REGISTRAZIONE */}
      {page !== 'dashboard' && (
        <div className="auth-layout">
          <section
            className="auth-panel"
            style={{
              background: theme.panel,
              borderColor: theme.border,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: theme.muted,
                letterSpacing: 1.5,
                marginBottom: 12,
              }}
            >
              {page === 'login'
                ? 'YOUR PERFORMANCE WORKSPACE'
                : 'CREATE YOUR ACCOUNT'}
            </div>

            <h1
              style={{
                fontSize: 28,
                margin: '0 0 10px',
                letterSpacing: -1,
              }}
            >
              {page === 'login' ? 'Welcome back.' : 'Join ipertrofIA.'}
            </h1>

            <p
              style={{
                fontSize: 13,
                color: theme.muted,
                marginBottom: 30,
                lineHeight: 1.6,
              }}
            >
              {page === 'login'
                ? 'Accedi al tuo spazio personale di allenamento.'
                : 'Crea il tuo account per iniziare.'}
            </p>

            {success && (
              <div
                role="status"
                style={{
                  padding: 12,
                  background: 'rgba(130,159,66,.12)',
                  color: theme.accent,
                  fontSize: 12,
                  marginBottom: 18,
                  borderRadius: 4,
                }}
              >
                {success}
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  padding: 12,
                  background: 'rgba(190,65,65,.12)',
                  color: '#D66B6B',
                  fontSize: 12,
                  marginBottom: 18,
                  borderRadius: 4,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={page === 'login' ? login : register}>
              <label
                htmlFor="auth-email"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Email
              </label>

              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={inputStyle}
              />

              <label
                htmlFor="auth-password"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  margin: '20px 0 8px',
                }}
              >
                Password
              </label>

              <input
                id="auth-password"
                type="password"
                autoComplete={
                  page === 'login' ? 'current-password' : 'new-password'
                }
                required
                minLength={page === 'register' ? 8 : undefined}
                maxLength={128}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={
                  page === 'register'
                    ? 'Minimo 8 caratteri'
                    : 'Inserisci la password'
                }
                style={inputStyle}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: 14,
                  border: 0,
                  borderRadius: 5,
                  background: theme.accent,
                  color: '#202923',
                  fontWeight: 700,
                  fontSize: 13,
                  marginTop: 25,
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading
                  ? 'Attendere...'
                  : page === 'login'
                    ? 'Sign in →'
                    : 'Create account →'}
              </button>
            </form>

            <div
              style={{
                marginTop: 25,
                textAlign: 'center',
                fontSize: 12,
                color: theme.muted,
              }}
            >
              {page === 'login'
                ? 'Non hai ancora un account? '
                : 'Hai già un account? '}

              <button
                className="auth-link"
                onClick={() => {
                  setPage(page === 'login' ? 'register' : 'login')
                  setError('')
                  setSuccess('')
                }}
              >
                {page === 'login' ? 'Registrati' : 'Accedi'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* DASHBOARD */}
      {page === 'dashboard' && token && (
        <div
          style={{
            display: 'flex',
            minHeight: 'calc(100vh - 70px)',
          }}
        >
          {/* SIDEBAR */}
          <aside
            className={`sidebar ${menuOpen ? 'open' : ''}`}
            style={{
              background: theme.sidebar,
              borderRight: `1px solid ${theme.border}`,
              padding: '25px 16px',
            }}
          >
            {navigation.map(group => (
              <div key={group.section} style={{ marginBottom: 28 }}>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: 1.5,
                    fontWeight: 700,
                    color: theme.muted,
                    padding: '0 12px 10px',
                  }}
                >
                  {group.section}
                </div>

                {group.items.map(item => (
                  <button
                    key={item}
                    className="nav-item"
                    onClick={() => {
                      setActivePage(item)
                      setMenuOpen(false)
                    }}
                    style={{
                      color:
                        activePage === item ? theme.text : theme.muted,
                      background:
                        activePage === item ? theme.bg : 'transparent',
                      fontWeight: activePage === item ? 700 : 400,
                    }}
                  >
                    <span style={{ fontSize: 17, width: 18 }}>
                      {icons[item]}
                    </span>
                    {item}
                  </button>
                ))}
              </div>
            ))}

            <div
              style={{
                position: 'absolute',
                bottom: 25,
                left: 28,
                fontSize: 11,
                color: theme.muted,
              }}
            >
              PROTOTYPE · v0.1
            </div>
          </aside>

          {/* MAIN */}
          <main style={{ flex: 1, minWidth: 0 }}>
            <header
              className="topbar"
              style={{
                height: 75,
                padding: '0 35px',
                borderBottom: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <button
                  className="mobile-menu"
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: theme.text,
                    fontSize: 22,
                  }}
                  aria-label="Apri menu"
                >
                  ☰
                </button>

                <span style={{ fontSize: 13, color: theme.muted }}>
                  Workspace /
                </span>
                <strong style={{ fontSize: 13 }}>{activePage}</strong>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <span
                  style={{
                    color: theme.muted,
                    fontSize: 12,
                  }}
                >
                  {userEmail}
                </span>
                <button
                  onClick={logout}
                  style={{
                    border: `1px solid ${theme.border}`,
                    background: theme.panel,
                    color: theme.text,
                    padding: '9px 13px',
                    borderRadius: 5,
                    fontSize: 12,
                  }}
                >
                  Log out
                </button>
              </div>
            </header>

            <div
              className="main-content"
              style={{
                maxWidth: 1250,
                margin: '0 auto',
                padding: '38px 35px',
              }}
            >
              <div style={{ marginBottom: 30 }}>
                <div
                  style={{
                    color: theme.muted,
                    fontSize: 11,
                    letterSpacing: 1.5,
                    marginBottom: 10,
                  }}
                >
                  PERFORMANCE WORKSPACE
                </div>

                <h1
                  className="page-title"
                  style={{
                    fontSize: 30,
                    letterSpacing: -1,
                    margin: 0,
                    fontWeight: 700,
                  }}
                >
                  {activePage === 'Overview'
                    ? 'Performance overview'
                    : activePage}
                </h1>

                <p
                  style={{
                    color: theme.muted,
                    fontSize: 13,
                    marginTop: 10,
                  }}
                >
                  Your training environment. Built around evidence and performance.
                </p>
              </div>

              {/* OVERVIEW */}
              {activePage === 'Overview' && (
                <>
                  <div className="metric-grid">
                    {[
                      [
                        'ATHLETE',
                        profileLoading
                          ? '…'
                          : athleteProfile
                            ? athleteProfile.first_name
                            : '—',
                        profileLoading
                          ? 'Loading profile'
                          : athleteProfile
                            ? 'Profile configured'
                            : 'Profile not configured',
                      ],
                      ['TRAINING STATUS', '—', 'No active program'],
                      ['SESSIONS', '—', 'No training data'],
                    ].map(([label, value, description]) => (
                      <div
                        key={label}
                        className="panel"
                        style={panelStyle}
                      >
                        <div
                          style={{
                            color: theme.muted,
                            fontSize: 10,
                            letterSpacing: 1.2,
                            fontWeight: 700,
                          }}
                        >
                          {label}
                        </div>

                        <div
                          style={{
                            fontSize: 30,
                            fontWeight: 700,
                            margin: '17px 0 7px',
                          }}
                        >
                          {value}
                        </div>

                        <div
                          style={{
                            color: theme.muted,
                            fontSize: 12,
                          }}
                        >
                          {description}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="content-grid">
                    <section
                      className="panel"
                      style={{
                        ...panelStyle,
                        minHeight: 240,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <strong style={{ fontSize: 14 }}>
                          Athlete profile
                        </strong>
                        <span
                          style={{
                            fontSize: 10,
                            color: theme.accent,
                          }}
                        >
                          {profileLoading
                            ? 'LOADING'
                            : athleteProfile
                              ? 'CONFIGURED'
                              : 'NOT CONFIGURED'}
                        </span>
                      </div>

                      <p
                        style={{
                          color: theme.muted,
                          fontSize: 13,
                          lineHeight: 1.7,
                          marginTop: 20,
                        }}
                      >
                        {athleteProfile
                          ? `${athleteProfile.first_name} ${athleteProfile.last_name ?? ''} · ${athleteProfile.training_experience ?? 'Experience not specified'} · ${athleteProfile.training_goal ?? 'Goal not specified'}`
                          : 'Your athlete profile will contain personal data, training experience, body measurements and goals.'}
                      </p>

                      <button
                        onClick={() => setActivePage('Athlete Profile')}
                        style={{
                          marginTop: 18,
                          padding: '11px 16px',
                          border: 0,
                          borderRadius: 4,
                          background: theme.accent,
                          color: '#202923',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Open athlete profile →
                      </button>
                    </section>

                    <section
                      className="panel"
                      style={{
                        ...panelStyle,
                        minHeight: 240,
                      }}
                    >
                      <strong style={{ fontSize: 14 }}>
                        Training activity
                      </strong>

                      <div
                        style={{
                          marginTop: 30,
                          padding: 20,
                          textAlign: 'center',
                          border: `1px dashed ${theme.border}`,
                          color: theme.muted,
                          fontSize: 12,
                          lineHeight: 1.8,
                        }}
                      >
                        No training sessions yet.
                        <br />
                        Your activity will appear here.
                      </div>
                    </section>
                  </div>

                  <section
                    className="panel"
                    style={{
                      ...panelStyle,
                      marginTop: 16,
                    }}
                  >
                    <strong style={{ fontSize: 14 }}>
                      Knowledge & intelligence
                    </strong>
                    <p
                      style={{
                        fontSize: 12,
                        color: theme.muted,
                        lineHeight: 1.7,
                      }}
                    >
                      Scientific literature, training methodologies and
                      AI-assisted evidence exploration will be available here.
                    </p>
                  </section>
                </>
              )}

              {/* ATHLETE PROFILE */}
              {activePage === 'Athlete Profile' && (
                <section className="panel" style={panelStyle}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                      marginBottom: 22,
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 16 }}>
                        Athlete information
                      </strong>
                      <p
                        style={{
                          color: theme.muted,
                          fontSize: 12,
                          marginBottom: 0,
                        }}
                      >
                        Dati personali e parametri di allenamento.
                      </p>
                    </div>

                    <span
                      style={{
                        color: theme.accent,
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {athleteProfile ? 'PROFILE CONFIGURED' : 'NEW PROFILE'}
                    </span>
                  </div>

                  {profileLoading ? (
                    <p style={{ color: theme.muted, fontSize: 13 }}>
                      Caricamento profilo...
                    </p>
                  ) : (
                    <form onSubmit={saveAthleteProfile}>
                      {profileError && (
                        <div
                          role="alert"
                          style={{
                            color: '#D66B6B',
                            background: 'rgba(190,65,65,.12)',
                            padding: 12,
                            borderRadius: 4,
                            fontSize: 12,
                            marginBottom: 16,
                          }}
                        >
                          {profileError}
                        </div>
                      )}

                      {profileMessage && (
                        <div
                          role="status"
                          style={{
                            color: theme.accent,
                            background: 'rgba(130,159,66,.12)',
                            padding: 12,
                            borderRadius: 4,
                            fontSize: 12,
                            marginBottom: 16,
                          }}
                        >
                          {profileMessage}
                        </div>
                      )}

                      <div className="profile-fields">
                        {profileFields.map(field => (
                          <div key={field.key}>
                            <label
                              className="field-label"
                              htmlFor={`profile-${field.key}`}
                            >
                              {field.label}
                            </label>
                            <input
                              id={`profile-${field.key}`}
                              className="field-input"
                              style={{
                                background: theme.bg,
                                color: theme.text,
                                borderColor: theme.border,
                              }}
                              type={field.type}
                              min={'min' in field ? field.min : undefined}
                              max={'max' in field ? field.max : undefined}
                              step={'step' in field ? field.step : undefined}
                              required={
                                'required' in field
                                  ? field.required
                                  : false
                              }
                              value={profileForm[field.key]}
                              onChange={event =>
                                updateProfileField(
                                  field.key,
                                  event.target.value
                                )
                              }
                            />
                          </div>
                        ))}

                        <div>
                          <label
                            className="field-label"
                            htmlFor="profile-experience"
                          >
                            Esperienza di allenamento
                          </label>
                          <select
                            id="profile-experience"
                            className="field-input"
                            style={{
                              background: theme.bg,
                              color: theme.text,
                              borderColor: theme.border,
                            }}
                            value={profileForm.training_experience}
                            onChange={event =>
                              updateProfileField(
                                'training_experience',
                                event.target.value
                              )
                            }
                          >
                            <option value="">Seleziona</option>
                            <option value="beginner">Principiante</option>
                            <option value="intermediate">Intermedio</option>
                            <option value="advanced">Avanzato</option>
                          </select>
                        </div>

                        <div>
                          <label
                            className="field-label"
                            htmlFor="profile-goal"
                          >
                            Obiettivo
                          </label>
                          <select
                            id="profile-goal"
                            className="field-input"
                            style={{
                              background: theme.bg,
                              color: theme.text,
                              borderColor: theme.border,
                            }}
                            value={profileForm.training_goal}
                            onChange={event =>
                              updateProfileField(
                                'training_goal',
                                event.target.value
                              )
                            }
                          >
                            <option value="">Seleziona</option>
                            <option value="hypertrophy">Ipertrofia</option>
                            <option value="strength">Forza</option>
                            <option value="powerlifting">Powerlifting</option>
                            <option value="weight_loss">Perdita di peso</option>
                            <option value="general_fitness">
                              Fitness generale
                            </option>
                          </select>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 12,
                          marginTop: 24,
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="submit"
                          disabled={profileSaving}
                          style={{
                            padding: '12px 18px',
                            border: 0,
                            borderRadius: 4,
                            background: theme.accent,
                            color: '#202923',
                            fontWeight: 700,
                            fontSize: 12,
                            opacity: profileSaving ? 0.6 : 1,
                          }}
                        >
                          {profileSaving
                            ? 'Salvataggio...'
                            : athleteProfile
                              ? 'Save changes →'
                              : 'Create athlete profile →'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setActivePage('Overview')}
                          style={{
                            padding: '12px 18px',
                            border: `1px solid ${theme.border}`,
                            borderRadius: 4,
                            background: 'transparent',
                            color: theme.text,
                            fontSize: 12,
                          }}
                        >
                          Back to overview
                        </button>
                      </div>
                    </form>
                  )}

                  {athleteProfile && (
                    <div
                      style={{
                        marginTop: 28,
                        paddingTop: 20,
                        borderTop: `1px solid ${theme.border}`,
                      }}
                    >
                      <strong style={{ fontSize: 13 }}>
                        Current database record
                      </strong>
                      <div
                        style={{
                          color: theme.muted,
                          fontSize: 12,
                          lineHeight: 1.9,
                          marginTop: 8,
                        }}
                      >
                        ID: {athleteProfile.id} · {athleteProfile.first_name}{' '}
                        {athleteProfile.last_name ?? ''}
                        <br />
                        {athleteProfile.age != null
                          ? `${athleteProfile.age} anni`
                          : 'Età non indicata'}
                        {' · '}
                        {athleteProfile.body_weight != null
                          ? `${athleteProfile.body_weight} kg`
                          : 'Peso non indicato'}
                        {' · '}
                        {athleteProfile.height != null
                          ? `${athleteProfile.height} cm`
                          : 'Altezza non indicata'}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* ALTRE SEZIONI */}
              {!['Overview', 'Athlete Profile'].includes(activePage) && (
                <section
                  className="panel"
                  style={{
                    ...panelStyle,
                    minHeight: 220,
                  }}
                >
                  <strong>{activePage}</strong>
                  <p
                    style={{
                      color: theme.muted,
                      fontSize: 13,
                      lineHeight: 1.7,
                    }}
                  >
                    Questa sezione sarà implementata nei prossimi passaggi
                    e collegata ai dati reali di ipertrofIA.
                  </p>
                </section>
              )}

              <footer
                style={{
                  marginTop: 35,
                  paddingTop: 18,
                  borderTop: `1px solid ${theme.border}`,
                  color: theme.muted,
                  fontSize: 11,
                }}
              >
                ipertrofIA · Strength training intelligence
              </footer>
            </div>
          </main>
        </div>
      )}
    </div>
  )
}

export default App
