"use client"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import { getFirestore, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  BarChart2,
  Calendar,
  Laptop,
  ClipboardList,
  Moon,
  Sun,
  UserPlus,
  BookOpen,
  LogOut,
  FileText,
  Clock,
  Menu,
  X,
  ChevronRight,
  Shield,
} from "lucide-react"
import VistaReportes from "../components/VistaReportes"
import VistaPracticas from "../components/VistaPracticas"
import VistaHorario from "../components/VistaHorario"
import VistaEquipos from "../components/VistaEquipos"
import VistaMaestroInvitado from "../components/VistaMaestroInvitado"
import VistaBitacora from "../components/VistaBitacora"
import VistaReporteMensual from "../components/VistaReporteMensual"
import { firebaseConfig } from "../lib/constants"
import { getTheme, toggleTheme, applyTheme, type Theme } from "../lib/theme"
import { getAuth, signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { da } from "date-fns/locale"

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Definición de colores para mantener consistencia
const colors = {
  light: {
    primary: "#800040", // Guinda/vino como color principal en modo claro
    secondary: "#1d5631", // Verde oscuro como color secundario
    tertiary: "#74726f", // Gris para elementos terciarios
    background: "#fff0f5", // Fondo con tono rosado muy suave
    cardBackground: "bg-white",
    headerBackground: "bg-gradient-to-r from-[#800040] to-[#a30050]",
    titleText: "text-[#800040]",
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
  },
  dark: {
    primary: "#1d5631", // Verde oscuro como color principal en modo oscuro
    secondary: "#800040", // Guinda/vino como color secundario
    tertiary: "#74726f", // Gris para elementos terciarios
    background: "#0c1f15", // Fondo verde muy oscuro
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
  },
}

// Elementos del menú con información mejorada
const menuItems = [
  {
    id: "reportes",
    label: "Reportes Diarios",
    icon: <BarChart2 className="h-5 w-5" />,
    description: "Visualiza y gestiona los reportes de clases",
  },
  {
    id: "practicas",
    label: "Todas Las Prácticas",
    icon: <ClipboardList className="h-5 w-5" />,
    description: "Administra las prácticas de laboratorio",
  },
  {
    id: "horario",
    label: "Horario Semestral",
    icon: <Calendar className="h-5 w-5" />,
    description: "Consulta y organiza el horario semanal",
  },
  {
    id: "equipos",
    label: "Equipos",
    icon: <Laptop className="h-5 w-5" />,
    description: "Administra el estado de los equipos",
  },
  {
    id: "maestroInvitado",
    label: "Eventos Y C.Externas",
    icon: <UserPlus className="h-5 w-5" />,
    description: "Gestiona las clases de maestros invitados",
  },
  {
    id: "bitacora",
    label: "Bitácora",
    icon: <BookOpen className="h-5 w-5" />,
    description: "Registro de actividades del laboratorio",
  },
  {
    id: "reporteMensual",
    label: "Reporte Mensual",
    icon: <FileText className="h-5 w-5" />,
    description: "Genera reportes mensuales de actividad",
  },
]

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

export default function PanelLaboratorista() {
  const [theme, setThemeState] = useState<Theme>("light")
  const [vistaActual, setVistaActual] = useState<
    "reportes" | "practicas" | "horario" | "equipos" | "maestroInvitado" | "bitacora" | "reporteMensual"
  >("reportes")
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const currentTheme = getTheme()
    setThemeState(currentTheme)
    applyTheme(currentTheme)

    // Simular tiempo de carga
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handleThemeToggle = () => {
    const newTheme = toggleTheme()
    setThemeState(newTheme)
    applyTheme(newTheme)
  }

  const logAction = async (action: string, details: string) => {
    try {
      await addDoc(collection(db, "logs"), {
        timestamp: serverTimestamp(),
        action,
        user: "Laboratorista",
        details,
      })
    } catch (error) {
      console.error("Error logging action:", error)
    }
  }

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Deseas cerrar sesión?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      const auth = getAuth()
      try {
        await signOut(auth)
        await logAction("logout", "Laboratorista cerró sesión")
        localStorage.removeItem("labTechId")
        router.push("/")
      } catch (error) {
        console.error("Error logging out:", error)
        Swal.fire("Error", "No se pudo cerrar sesión", "error")
      }
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (isLoading) {
    return <Loader />
  }

  const modoColor = theme === "dark" ? colors.dark : colors.light

  return (
    <div
      className={`min-h-screen ${theme === "dark" ? "bg-[#0c1f15]" : "bg-[#fff0f5]"} transition-colors duration-300`}
    >
      {/* Mobile Menu Button - Mejorado con sombra y transición */}
      <button
        onClick={toggleMobileMenu}
        className={`fixed top-4 left-4 z-50 p-2 rounded-full md:hidden shadow-lg transition-all duration-300 ${
          theme === "dark" ? "bg-[#1d5631] text-white hover:bg-[#153d23]" : "bg-[#800040] text-white hover:bg-[#5c002e]"
        }`}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Theme Toggle Button - Mejorado con sombra */}
      <button
        onClick={handleThemeToggle}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-300 shadow-lg ${
          theme === "dark" ? "bg-[#1d5631] text-white hover:bg-[#153d23]" : "bg-[#800040] text-white hover:bg-[#5c002e]"
        }`}
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="flex h-screen overflow-hidden pt-16 md:pt-0">
        {/* Sidebar - Desktop - Mejorado con bordes redondeados y transiciones */}
        <aside
          className={`hidden md:flex flex-col w-64 h-full ${
            theme === "dark" ? "bg-[#1d5631]/20" : "bg-white"
          } shadow-xl transition-all duration-300 rounded-r-xl overflow-hidden`}
        >
          <div className={`p-6 ${theme === "dark" ? colors.dark.headerBackground : colors.light.headerBackground}`}>
            <div className="flex items-center space-x-3 mb-6">
              <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                <AvatarImage src="/logo itspp.jpeg" alt="Logo" />
                <AvatarFallback className="bg-green-100 text-green-800">IT</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-white">Laboratorio</h2>
                <p className="text-sm text-white/80">Panel de Control</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3">
            <div className="flex items-center px-4 py-2 mb-4">
              <Shield className={`h-5 w-5 mr-2 ${theme === "dark" ? "text-[#2a7a45]" : "text-[#800040]"}`} />
              <span className={`font-medium ${theme === "dark" ? "text-white" : "text-[#800040]"}`}>
                Administración
              </span>
            </div>
            <Separator className={`mb-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <TooltipProvider key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                          vistaActual === item.id
                            ? theme === "dark"
                              ? "bg-[#1d5631] text-white shadow-md"
                              : "bg-[#800040] text-white shadow-md"
                            : theme === "dark"
                              ? "text-white hover:bg-[#1d5631]/40"
                              : "text-[#800040] hover:bg-[#fff0f5]"
                        }`}
                        onClick={() => setVistaActual(item.id as typeof vistaActual)}
                      >
                        <span className="mr-3">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                        {item.id === vistaActual && <ChevronRight className="ml-auto h-5 w-5" />}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </nav>
          </div>

          <div className={`p-4 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <Button
              variant="ghost"
              className={`w-full justify-start py-2 ${
                theme === "dark" ? "text-white hover:bg-[#1d5631]/40" : "text-[#800040] hover:bg-[#fff0f5]"
              }`}
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Cerrar Sesión
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar - Mejorado con animaciones y estilos */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40 md:hidden backdrop-blur-sm"
                onClick={toggleMobileMenu}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25 }}
                className={`fixed top-0 left-0 z-50 w-64 h-full ${
                  theme === "dark" ? "bg-[#1d5631]/20" : "bg-white"
                } shadow-xl md:hidden rounded-r-xl overflow-hidden`}
              >
                <div
                  className={`p-6 ${theme === "dark" ? colors.dark.headerBackground : colors.light.headerBackground}`}
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                      <AvatarImage src="/logo itspp.jpeg" alt="Logo" />
                      <AvatarFallback className="bg-green-100 text-green-800">IT</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold text-white">Laboratorio</h2>
                      <p className="text-sm text-white/80">Panel de Control</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3">
                  <div className="flex items-center px-4 py-2 mb-4">
                    <Shield className={`h-5 w-5 mr-2 ${theme === "dark" ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                    <span className={`font-medium ${theme === "dark" ? "text-white" : "text-[#800040]"}`}>
                      Administración
                    </span>
                  </div>
                  <Separator className={`mb-4 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`} />

                  <nav className="space-y-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                          vistaActual === item.id
                            ? theme === "dark"
                              ? "bg-[#1d5631] text-white shadow-md"
                              : "bg-[#800040] text-white shadow-md"
                            : theme === "dark"
                              ? "text-white hover:bg-[#1d5631]/40"
                              : "text-[#800040] hover:bg-[#fff0f5]"
                        }`}
                        onClick={() => {
                          setVistaActual(item.id as typeof vistaActual)
                          toggleMobileMenu()
                        }}
                      >
                        <span className="mr-3">{item.icon}</span>
                        <span className="font-medium">{item.label}</span>
                        {item.id === vistaActual && <ChevronRight className="ml-auto h-5 w-5" />}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className={`p-4 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start py-2 ${
                      theme === "dark" ? "text-white hover:bg-[#1d5631]/40" : "text-[#800040] hover:bg-[#fff0f5]"
                    }`}
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Cerrar Sesión
                  </Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content - Mejorado con espaciado y bordes redondeados */}
        <main className="flex-1 overflow-y-auto">
          {/* Header - Mejorado con sombra y bordes redondeados */}
          <header
            className={`p-4 ${
              theme === "dark" ? colors.dark.headerBackground : colors.light.headerBackground
            } shadow-lg rounded-b-xl`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-full bg-white/20 shadow-inner">
                  {vistaActual === "reportes" && <BarChart2 className="h-6 w-6 text-white" />}
                  {vistaActual === "practicas" && <ClipboardList className="h-6 w-6 text-white" />}
                  {vistaActual === "horario" && <Calendar className="h-6 w-6 text-white" />}
                  {vistaActual === "equipos" && <Laptop className="h-6 w-6 text-white" />}
                  {vistaActual === "maestroInvitado" && <UserPlus className="h-6 w-6 text-white" />}
                  {vistaActual === "bitacora" && <BookOpen className="h-6 w-6 text-white" />}
                  {vistaActual === "reporteMensual" && <FileText className="h-6 w-6 text-white" />}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {vistaActual === "reportes" && "Reportes de Clases"}
                    {vistaActual === "practicas" && "Todas las Prácticas"}
                    {vistaActual === "horario" && "Horario Semanal"}
                    {vistaActual === "equipos" && "Gestión de Equipos"}
                    {vistaActual === "maestroInvitado" && "Maestro Invitado"}
                    {vistaActual === "bitacora" && "Bitácora de Actividades"}
                    {vistaActual === "reporteMensual" && "Reporte Mensual de Laboratorio"}
                  </h1>
                  <p className="text-sm text-white/80">
                    {menuItems.find((item) => item.id === vistaActual)?.description}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <div className="bg-white/20 text-white text-sm px-3 py-1 rounded-full shadow-inner">
                  <Clock className="inline-block w-4 h-4 mr-1" />
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard content - Mejorado con animaciones y espaciado */}
          <div className="p-4 md:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={vistaActual}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={`${theme === "dark" ? "bg-[#1d5631]/20" : "bg-white"} border-none shadow-xl rounded-xl overflow-hidden`}
                >
                  <CardContent className="p-0">
                    <div className={`p-6 ${theme === "dark" ? "text-white" : "text-[#800040]"}`}>
                      {vistaActual === "reportes" && (
                        <VistaReportes esModoOscuro={theme === "dark"} logAction={logAction} />
                      )}
                      {vistaActual === "practicas" && (
                        <VistaPracticas esModoOscuro={theme === "dark"} logAction={logAction} />
                      )}
                      {vistaActual === "horario" && (
                        <VistaHorario esModoOscuro={theme === "dark"} logAction={logAction} />
                      )}
                      {vistaActual === "equipos" && (
                        <VistaEquipos esModoOscuro={theme === "dark"} logAction={logAction} />
                      )}
                      {vistaActual === "maestroInvitado" && (
                        <VistaMaestroInvitado esModoOscuro={theme === "dark"} logAction={logAction} />
                      )}
                      {vistaActual === "bitacora" && (
                        <VistaBitacora esModoOscuro={theme === "dark"} logAction={logAction} />
                      )}
                      {vistaActual === "reporteMensual" && (
                        <VistaReporteMensual esModoOscuro={theme === "dark"} logAction={logAction} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}

