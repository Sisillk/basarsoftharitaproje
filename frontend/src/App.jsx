import { useCallback, useEffect, useState } from 'react'

import Login from './Login'
import MapPage from './MapPage'
import AdminPanel from './AdminPanel.jsx'

import './App.css'


function App() {

    const [token, setToken] = useState(() => {

        const savedToken =
            localStorage.getItem('token')

        const expiration =
            Number(
                localStorage.getItem(
                    'expiration'
                )
            )

        if (
            savedToken &&
            expiration &&
            Date.now() < expiration
        ) {
            return savedToken
        }

        localStorage.removeItem('token')
        localStorage.removeItem('expiration')

        return null
    })


    const [showAdmin, setShowAdmin] =
        useState(false)


    // =========================================
    // LOGIN
    // =========================================

    const handleLogin =
        useCallback(
            (
                newToken,
                expiresIn
            ) => {

                const expiration =
                    Date.now() +
                    expiresIn * 1000

                localStorage.setItem(
                    'token',
                    newToken
                )

                localStorage.setItem(
                    'expiration',
                    expiration.toString()
                )

                setToken(newToken)

                setShowAdmin(false)
            },
            []
        )


    // =========================================
    // LOGOUT
    // =========================================

    const handleLogout =
        useCallback(
            () => {

                localStorage.removeItem(
                    'token'
                )

                localStorage.removeItem(
                    'expiration'
                )

                setToken(null)

                setShowAdmin(false)
            },
            []
        )


    // =========================================
    // TOKEN SÜRESİ
    // =========================================

    useEffect(() => {

        if (!token) {
            return
        }

        const expiration =
            Number(
                localStorage.getItem(
                    'expiration'
                )
            )

        const remainingTime =
            expiration - Date.now()


        if (remainingTime <= 0) {

            handleLogout()

            return
        }


        const timer =
            setTimeout(
                () => {

                    handleLogout()

                },
                remainingTime
            )


        return () => {

            clearTimeout(timer)

        }

    }, [
        token,
        handleLogout
    ])


    // =========================================
    // LOGIN EKRANI
    // =========================================

    if (!token) {

        return (
            <Login
                onLogin={
                    handleLogin
                }
            />
        )
    }


    // =========================================
    // ADMIN PANELİ
    // =========================================

    if (showAdmin) {

        return (
            <AdminPanel

                token={
                    token
                }

                onBack={
                    () =>
                        setShowAdmin(
                            false
                        )
                }

                onLogout={
                    handleLogout
                }

            />
        )
    }


//harita
    return (
        <MapPage

            token={
                token
            }

            onLogout={
                handleLogout
            }

            onOpenAdmin={
                () =>
                    setShowAdmin(
                        true
                    )
            }

        />
    )
}


export default App