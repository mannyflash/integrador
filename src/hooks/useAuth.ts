import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import bcrypt from 'bcryptjs'

const firebaseConfig = {
  apiKey: "AIzaSyCX5WX8tTkWRsIikpV3-pTXIsYUXfF5Eqk",
  authDomain: "integrador-7b39d.firebaseapp.com",
  projectId: "integrador-7b39d",
  storageBucket: "integrador-7b39d.appspot.com",
  messagingSenderId: "780966021686",
  appId: "1:780966021686:web:485712fb7509339c6ae697",
  measurementId: "G-FGB03PFM7Z"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const authData = localStorage.getItem('authData')
      if (authData) {
        const { userType, matricula, timestamp } = JSON.parse(authData)
        const currentTime = new Date().getTime()
        if (currentTime - timestamp < 30 * 60 * 1000) { // 30 minutes
          setIsAuthenticated(true)
          setUser({ userType, matricula })
        } else {
          localStorage.removeItem('authData')
          setIsAuthenticated(false)
          setUser(null)
        }
      }
    }
    checkAuth()
  }, [])

  const login = async (matricula: string, password: string, userType: 'maestro' | 'laboratorista' | 'admin') => {
    let collectionName = userType === 'admin' ? 'Administrador' : (userType === 'maestro' ? 'Docentes' : 'Laboratoristas')
    const userRef = doc(db, collectionName, matricula)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return false
    }

    const userData = userSnap.data()
    const passwordMatch = await bcrypt.compare(password, userData.Contraseña)

    if (passwordMatch) {
      const authData = {
        userType,
        matricula,
        timestamp: new Date().getTime()
      }
      localStorage.setItem('authData', JSON.stringify(authData))
      setIsAuthenticated(true)
      setUser({ userType, matricula })
      return true
    }

    return false
  }

  const logout = () => {
    localStorage.removeItem('authData')
    setIsAuthenticated(false)
    setUser(null)
  }

  return { isAuthenticated, user, login, logout }
}

