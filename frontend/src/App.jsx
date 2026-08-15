import { useCallback, useEffect, useState } from 'react'
import Login from './Login'
import MapPage from './MapPage'
import './App.css'

function App() {
  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token')
    const expiration = Number(localStorage.getItem('expiration'))

    if (savedToken && expiration && Date.now() < expiration) {
      return savedToken
    }

    localStorage.removeItem('token')
    localStorage.removeItem('expiration')
    return null
  })

  const handleLogin = useCallback((newToken, expiresIn) => {
    const expiration = Date.now() + expiresIn * 1000

    localStorage.setItem('token', newToken)
    localStorage.setItem('expiration', expiration.toString())

    setToken(newToken)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('expiration')
    setToken(null)
  }, [])

  useEffect(() => {
    if (!token) return

    const expiration = Number(localStorage.getItem('expiration'))
    const remainingTime = expiration - Date.now()

    if (remainingTime <= 0) {
      handleLogout()
      return
    }

    const timer = setTimeout(handleLogout, remainingTime)

    return () => clearTimeout(timer)
  }, [token, handleLogout])

  return token
    ? <MapPage onLogout={handleLogout} />
    : <Login onLogin={handleLogin} />
}

export default App
