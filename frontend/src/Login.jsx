import { useState } from 'react'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:5092/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      )

      if (!response.ok) {
        setError('Kullanıcı adı veya şifre yanlış.')
        return
      }

      const data = await response.json()
      onLogin(data.token, data.expiresIn)
    } catch {
      setError('Sunucuya bağlanılamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="blue-glow glow-left"></div>
      <div className="blue-glow glow-right"></div>

      <div className="login-layout">
        <section className="login-info">
          <div className="project-badge">TÜRKİYE HARİTASI</div>
          <h1>Başarsoft</h1>
        </section>

        <section className="login-card">
          <div className="login-card-header">
            <div className="map-icon">
              <span>⌖</span>
            </div>

            <h2>Giriş Yap</h2>
            <p>Harita ekranına devam etmek için bilgilerinizi girin.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Kullanıcı Adı</label>
              <input
                type="text"
                placeholder="Kullanıcı adınız"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label>Şifre</label>

              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Şifreniz"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Gizle' : 'Göster'}
                </button>
              </div>
            </div>

            <button
              className="submit-button"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Giriş yapılıyor...' : 'Haritaya Git →'}
            </button>
          </form>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="login-meta">
            <span className="meta-dot"></span>
            Güvenli oturum • 10 dakika
          </div>
        </section>
      </div>
    </div>
  )
}

export default Login
