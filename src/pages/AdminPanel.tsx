"use client"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore, collection, onSnapshot, query } from "firebase/firestore"
import { Sidebar } from "../components/sidebarAdmin"
import { StatsCards } from "../components/StatsCards"
import { AlumnosTab } from "../components/AlumnosTab"
import { DocentesTab } from "../components/DocentesTab"
import { MateriasTab } from "../components/MateriasTab"
import { LaboratoristasTab } from "../components/LaboratoristasTab"
import { AdministradoresTab } from "../components/AdministradoresTab"
import { firebaseConfig } from "../lib/constants"
import { motion } from "framer-motion"
import { getTheme, toggleTheme, applyTheme, type Theme } from "../lib/theme"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"

// Importar los iconos necesarios de Lucide React
import { Moon, Sun } from "lucide-react"

// Añadir la definición de colores del index.tsx
const colors = {
  light: {
    primary: "#800040", // Guinda/vino como color principal en modo claro
    secondary: "#1d5631", // Verde oscuro como color secundario
    tertiary: "#74726f", // Gris para elementos terciarios
    background: "bg-[#fff0f5]", // Fondo con tono rosado muy suave
    cardBackground: "bg-white",
    headerBackground: "bg-gradient-to-r from-[#800040] to-[#a30050]",
    titleText: "text-white",
    descriptionText: "text-[#800040]/80",
    hoverBackground: "hover:bg-[#fff0f5]",
    buttonPrimary: "bg-[#800040] hover:bg-[#5c002e] text-white",
    buttonSecondary: "bg-[#1d5631] hover:bg-[#153d23] text-white",
    buttonTertiary: "bg-[#74726f] hover:bg-[#5a5856] text-white",
    countBackground: "bg-[#fff0f5]",
    countText: "text-[#800040]",
    inputBackground: "bg-[#f8f8f8]",
    inputBorder: "border-[#800040]/30",
    inputText: "text-[#800040]",
    switchBackground: "bg-[#800040]/20",
    switchToggle: "bg-white",
    grayText: "text-[#74726f]",
    grayBorder: "border-[#74726f]",
    grayBackground: "bg-[#f0f0f0]",
    badge: "bg-[#800040]",
    badgeOutline: "border-[#800040] text-[#800040]",
    badgeSecundario: "bg-[#800040]/20 text-[#800040]",
  },
  dark: {
    primary: "#1d5631", // Verde oscuro como color principal en modo oscuro
    secondary: "#800040", // Guinda/vino como color secundario
    tertiary: "#74726f", // Gris para elementos terciarios
    background: "bg-[#0c1f15]", // Fondo verde muy oscuro
    cardBackground: "bg-[#2a2a2a]",
    headerBackground: "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]",
    titleText: "text-white",
    descriptionText: "text-gray-300",
    hoverBackground: "hover:bg-[#153d23]",
    buttonPrimary: "bg-[#1d5631] hover:bg-[#153d23] text-white",
    buttonSecondary: "bg-[#800040] hover:bg-[#5c002e] text-white",
    buttonTertiary: "bg-[#74726f] hover:bg-[#5a5856] text-white",
    countBackground: "bg-[#1d5631]/20",
    countText: "text-[#2a7a45]",
    inputBackground: "bg-[#3a3a3a]",
    inputBorder: "border-[#1d5631]/30",
    inputText: "text-white",
    switchBackground: "bg-[#1d5631]/20",
    switchToggle: "bg-[#1d5631]",
    grayText: "text-[#a0a0a0]",
    grayBorder: "border-[#74726f]",
    grayBackground: "bg-[#3a3a3a]",
    badge: "bg-[#1d5631]",
    badgeOutline: "border-[#1d5631] text-[#2a7a45]",
    badgeSecundario: "bg-[#1d5631]/20 text-[#1d5631]",
  },
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Modificar el componente Loader para usar los colores del proyecto
const Loader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center h-screen bg-[#f0fff4] dark:bg-[#0c1f1a]"
    >
      <div className="relative flex flex-col items-center">
        <div className="w-32 aspect-square rounded-full relative flex justify-center items-center animate-spin-slow z-40 bg-[conic-gradient(#1BB827_0deg,#1BB827_300deg,transparent_270deg,transparent_360deg)]">
          <div className="absolute w-[60%] aspect-square rounded-full z-[80] animate-spin-medium bg-[conic-gradient(#1BB827_0deg,#1BB827_270deg,transparent_180deg,transparent_360deg)]" />
          <div className="absolute w-3/4 aspect-square rounded-full z-[60] animate-spin-slow bg-[conic-gradient(#1C4A3F_0deg,#1C4A3F_180deg,transparent_180deg,transparent_360deg)]" />
          <div className="absolute w-[85%] aspect-square rounded-full z-[60] animate-spin-extra-slow bg-[conic-gradient(#25D533_0deg,#25D533_180deg,transparent_180deg,transparent_360deg)]" />
        </div>
        <div className="mt-8 text-[#1C4A3F] dark:text-white text-xl font-medium">Cargando...</div>
      </div>
    </motion.div>
  )
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("alumnos")
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    totalDocentes: 0,
    totalMaterias: 0,
    totalLaboratoristas: 0,
    totalAdministradores: 0,
  })

  const [theme, setThemeState] = useState<Theme>(getTheme())
  const [isLoading, setIsLoading] = useState(true)

  const currentColors = theme === "dark" ? colors.dark : colors.light

  const router = useRouter()

  const handleLogout = () => {
    Swal.fire({
      title: "¿Desea cerrar sesión?",
      text: "Será redirigido a la página de inicio",
      icon: "warning",
      showCancelButton: true,

      cancelButtonColor: "#d33",
      confirmButtonColor: theme === "dark" ? "#1d5631" : "#800040",
      cancelButtonText: "Cancelar",
      confirmButtonText: "Sí, cerrar sesión",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/")
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
    const collections = ["Alumnos", "Docentes", "Materias", "Laboratoristas", "Administrador"]
  
    collections.forEach((collectionName) => {
      const collectionRef = collection(db, collectionName)
      onSnapshot(query(collectionRef), (snapshot) => {
        setStats((prevStats) => ({
          ...prevStats,
          // Usar "totalAdministradores" cuando collectionName es "Administrador"
          [collectionName === "Administrador" ? "totalAdministradores" : `total${collectionName}`]: snapshot.size,
        }))
      })
    })
  }

  if (isLoading) {
    return <Loader />
  }

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "dark bg-[#0c1f1a]" : "bg-[#f0fff4]"} transition-colors duration-300`}
    >
      <header
        className={`${theme === "dark" ? colors.dark.headerBackground : colors.light.headerBackground} shadow-md p-4`}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Panel de Administrador</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-full transition-all duration-300 ${
                theme === "dark"
                  ? "bg-[#1C4A3F] text-white hover:bg-[#153731]"
                  : "bg-[#1BB827] text-white hover:bg-[#18a423]"
              }`}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isDarkMode={theme === "dark"}
          onLogout={handleLogout}
        />
        <main className="flex-1 p-6 overflow-auto h-[calc(100vh-64px)]">
          <StatsCards stats={stats} isDarkMode={theme === "dark"} colors={colors} />

          {activeTab === "alumnos" && (
            <AlumnosTab db={db} isDarkMode={theme === "dark"} currentColors={currentColors} />
          )}
          {activeTab === "docentes" && (
            <DocentesTab db={db} isDarkMode={theme === "dark"} currentColors={currentColors} />
          )}
          {activeTab === "materias" && (
            <MateriasTab db={db} isDarkMode={theme === "dark"} currentColors={currentColors} />
          )}
          {activeTab === "laboratoristas" && (
            <LaboratoristasTab db={db} isDarkMode={theme === "dark"} currentColors={currentColors} />
          )}
          {activeTab === "administradores" && (
            <AdministradoresTab db={db} isDarkMode={theme === "dark"} currentColors={currentColors} />
          )}
        </main>
      </div>
    </div>
  )
}
