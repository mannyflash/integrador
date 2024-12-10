'use client'

import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, onSnapshot, query } from 'firebase/firestore'
import { Sidebar } from '../components/sidebarAdmin'
import { StatsCards } from '../components/StatsCards'
import { AlumnosTab } from '../components/AlumnosTab'
import { DocentesTab } from '../components/DocentesTab'
import { MateriasTab } from '../components/MateriasTab'
import { LaboratoristasTab } from '../components/LaboratoristasTab'
import { AdministradoresTab } from '../components/AdministradoresTab'
import { colors, firebaseConfig } from '../lib/constants'
import { Sun, Moon } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from 'framer-motion'
import { getTheme, setTheme, toggleTheme, applyTheme, Theme } from '../lib/theme'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const Loader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"
    >
      <div className="w-32 aspect-square rounded-full relative flex justify-center items-center animate-spin-slow z-40 bg-[conic-gradient(white_0deg,white_300deg,transparent_270deg,transparent_360deg)]">
        <div className="absolute w-[60%] aspect-square rounded-full z-[80] animate-spin-medium bg-[conic-gradient(white_0deg,white_270deg,transparent_180deg,transparent_360deg)]" />
        <div className="absolute w-3/4 aspect-square rounded-full z-[60] animate-spin-slow bg-[conic-gradient(#065f46_0deg,#065f46_180deg,transparent_180deg,transparent_360deg)]" />
        <div className="absolute w-[85%] aspect-square rounded-full z-[60] animate-spin-extra-slow bg-[conic-gradient(#34d399_0deg,#34d399_180deg,transparent_180deg,transparent_360deg)]" />
      </div>
    </motion.div>
  )
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('alumnos')
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    totalDocentes: 0,
    totalMaterias: 0,
    totalLaboratoristas: 0,
    totalAdministradores: 0
  })

  const [theme, setThemeState] = useState<Theme>(getTheme())
  const [isLoading, setIsLoading] = useState(true)

  const currentColors = theme === 'dark' ? colors.dark : colors.light

  const router = useRouter()

  const handleLogout = () => {
    Swal.fire({
      title: '¿Desea cerrar sesión?',
      text: "Será redirigido a la página de inicio",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Perform logout actions here (e.g., clear session, cookies, etc.)
        router.push('/') // Redirect to the home page
      }
    })
  }

  useEffect(() => {
    applyTheme(theme)
    setupRealTimeListeners()

    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [theme])

  const toggleDarkMode = () => {
    const newTheme = toggleTheme()
    setThemeState(newTheme)
  }

  const setupRealTimeListeners = () => {
    const collections = ['Alumnos', 'Docentes', 'Materias', 'Laboratoristas', 'Administrador']
    
    collections.forEach(collectionName => {
      const collectionRef = collection(db, collectionName)
      onSnapshot(query(collectionRef), (snapshot) => {
        setStats(prevStats => ({
          ...prevStats,
          [`total${collectionName}`]: snapshot.size
        }))
      })
    })
  }

  if (isLoading) {
    return <Loader />
  }

  return (
    <div className={`min-h-screen ${currentColors.background} transition-all duration-300`}>
      <header className={`${currentColors.headerBackground} shadow-md p-4`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-semibold ${currentColors.titleText}`}>Panel de Administrador</h1>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              theme === 'dark'
                ? 'bg-gradient-to-tl from-[#343a40] to-[#495057] border border-[#6c757d]'
                : 'bg-gradient-to-tl from-[#f8f9fa] to-[#e9ecef] border border-[#ced4da]'
            } p-1 rounded-full transition-all duration-200`}>
              <Sun className={`h-5 w-5 ${theme === 'dark' ? 'text-[#adb5bd]' : 'text-[#ffc107]'}`} />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleDarkMode}
                className={`${theme === 'dark' ? 'bg-[#28a745]' : 'bg-[#6c757d]'}`}
              />
              <Moon className={`h-5 w-5 ${theme === 'dark' ? 'text-[#007bff]' : 'text-[#6c757d]'}`} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isDarkMode={theme === 'dark'} 
          onLogout={handleLogout}
        />
        <main className="flex-1 p-6 overflow-auto h-[calc(100vh-64px)]">
          <StatsCards stats={stats} isDarkMode={theme === 'dark'} colors={colors} />
          
          {activeTab === 'alumnos' && <AlumnosTab db={db} isDarkMode={theme === 'dark'} currentColors={currentColors} />}
          {activeTab === 'docentes' && <DocentesTab db={db} isDarkMode={theme === 'dark'} currentColors={currentColors} />}
          {activeTab === 'materias' && <MateriasTab db={db} isDarkMode={theme === 'dark'} currentColors={currentColors} />}
          {activeTab === 'laboratoristas' && <LaboratoristasTab db={db} isDarkMode={theme === 'dark'} currentColors={currentColors} />}
          {activeTab === 'administradores' && <AdministradoresTab db={db} isDarkMode={theme === 'dark'} currentColors={currentColors} />}
        </main>
      </div>
    </div>
  )
}

