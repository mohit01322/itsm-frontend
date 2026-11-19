import { createContext, useContext, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('user'))
    } catch {
      return null
    }
  })

  async function login(username, password) {
    const u = await api.login(username, password)
    setUser(u)
    sessionStorage.setItem('user', JSON.stringify(u))
    return u
  }

  function logout() {
    api.logout?.()
    setUser(null)
    sessionStorage.removeItem('user')
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export const homeFor = (role) => (role === 'ADMINISTRATOR' ? '/admin' : role === 'TECHNICIAN' ? '/technician' : '/employee')
