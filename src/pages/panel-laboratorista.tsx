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
  Bell,
  XCircle,
  AlertTriangle,
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
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { onSnapshot, query, orderBy, limit, updateDoc, doc, type Timestamp, where, getDoc } from "firebase/firestore"

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

// Interfaces para notificaciones
interface Notificacion {
  id: string
  tipo: "equipo" | "maestro_invitado" | "evento" | "asistencia" | "sistema" | "seguridad"
  titulo: string
  mensaje: string
  fecha: Timestamp
  leida: boolean
  prioridad: "alta" | "media" | "baja"
  datos?: any
  estadoEquipo?: "reportado" | "en_proceso" | "resuelto"
  fechaActualizacionEstado?: Timestamp
  comentarioEstado?: string
}

// Configuración de estados de equipos
const estadosEquipo = {
  reportado: {
    icon: <AlertTriangle className="h-3 w-3" />,
    color: "bg-red-500",
    label: "Reportado",
    description: "Problema reportado, pendiente de revisión",
  },
  en_proceso: {
    icon: <AlertTriangle className="h-3 w-3" />,
    color: "bg-yellow-500",
    label: "En Proceso",
    description: "Siendo reparado por el departamento de sistemas",
  },
  resuelto: {
    icon: <AlertTriangle className="h-3 w-3" />,
    color: "bg-green-500",
    label: "Resuelto",
    description: "Problema solucionado, equipo disponible",
  },
}

// Elementos del menú con información mejorada
const menuItems = [
  {
    id: "reportes",
    label: "Reportes de Clases",
    icon: <BarChart2 className="h-5 w-5" />,
    description: "Visualiza y gestiona los reportes de clases",
  },
  {
    id: "practicas",
    label: "Prácticas",
    icon: <ClipboardList className="h-5 w-5" />,
    description: "Administra las prácticas de laboratorio",
  },
  {
    id: "horario",
    label: "Horario Semanal",
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
    label: "Maestro Invitado",
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

  // Estados para notificaciones de equipos
  const [notificacionesEquipos, setNotificacionesEquipos] = useState<Notificacion[]>([])
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0)
  const [dialogoNotificacionesAbierto, setDialogoNotificacionesAbierto] = useState(false)
  const [dialogoEstadoAbierto, setDialogoEstadoAbierto] = useState(false)
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState<Notificacion | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState<"reportado" | "en_proceso" | "resuelto">("reportado")
  const [comentarioEstado, setComentarioEstado] = useState("")
  const [filtroNotificaciones, setFiltroNotificaciones] = useState<string>("equipos")

  // Estados para detectar clases activas
  const [claseActivaRegular, setClaseActivaRegular] = useState(false)
  const [claseActivaInvitado, setClaseActivaInvitado] = useState(false)
  const [dialogoFinalizarClase, setDialogoFinalizarClase] = useState(false)
  const [tipoClaseAFinalizar, setTipoClaseAFinalizar] = useState<"regular" | "invitado">("regular")

  const router = useRouter()

  useEffect(() => {
    const currentTheme = getTheme()
    setThemeState(currentTheme)
    applyTheme(currentTheme)

    // Configurar listeners para notificaciones de equipos
    const unsubscribeNotificaciones = setupNotificacionesListeners()

    const unsubscribeClases = setupClasesListeners()

    // Simular tiempo de carga
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => {
      clearTimeout(timer)
      unsubscribeNotificaciones()
      unsubscribeClases()
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  const setupNotificacionesListeners = () => {
    // Listener para notificaciones de equipos enviadas al administrador
    const unsubscribeNotificaciones = onSnapshot(
      query(collection(db, "NotificacionesAdmin"), where("tipo", "==", "equipo"), orderBy("fecha", "desc"), limit(20)),
      (snapshot) => {
        const notificacionesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notificacion[]

        setNotificacionesEquipos(notificacionesData)

        // Contar notificaciones no resueltas
        const noResueltas = notificacionesData.filter((n) => n.estadoEquipo !== "resuelto").length
        setNotificacionesNoLeidas(noResueltas)
      },
      (error) => {
        console.error("Error al escuchar notificaciones:", error)
      },
    )

    return unsubscribeNotificaciones
  }

  const setupClasesListeners = () => {
    // Listener para clase regular
    const unsubscribeClaseRegular = onSnapshot(doc(db, "EstadoClase", "actual"), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setClaseActivaRegular(data.iniciada === true)
      } else {
        setClaseActivaRegular(false)
      }
    })

    // Listener para clase de maestro invitado
    const unsubscribeClaseInvitado = onSnapshot(doc(db, "EstadoClaseInvitado", "estado"), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        setClaseActivaInvitado(data.iniciada === true)
      } else {
        setClaseActivaInvitado(false)
      }
    })

    return () => {
      unsubscribeClaseRegular()
      unsubscribeClaseInvitado()
    }
  }

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

  const actualizarEstadoEquipo = async () => {
    if (!notificacionSeleccionada) return

    try {
      const fechaActual = new Date()

      await updateDoc(doc(db, "NotificacionesAdmin", notificacionSeleccionada.id), {
        estadoEquipo: nuevoEstado,
        fechaActualizacionEstado: fechaActual,
        comentarioEstado: comentarioEstado.trim() || null,
      })

      // Actualizar estado local
      setNotificacionesEquipos((prev) =>
        prev.map((n) =>
          n.id === notificacionSeleccionada.id
            ? {
                ...n,
                estadoEquipo: nuevoEstado,
                fechaActualizacionEstado: fechaActual as any,
                comentarioEstado: comentarioEstado.trim() || undefined,
              }
            : n,
        ),
      )

      setDialogoEstadoAbierto(false)
      setNotificacionSeleccionada(null)
      setComentarioEstado("")

      await logAction(
        "Actualizar Estado Equipo",
        `Estado del equipo #${notificacionSeleccionada.datos?.equipoId} cambiado a "${estadosEquipo[nuevoEstado].label}"`,
      )

      Swal.fire({
        title: "¡Estado actualizado!",
        text: `El estado del equipo se ha cambiado a "${estadosEquipo[nuevoEstado].label}"`,
        icon: "success",
        confirmButtonColor: theme === "dark" ? "#1d5631" : "#800040",
        timer: 2000,
      })
    } catch (error) {
      console.error("Error al actualizar estado del equipo:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar el estado del equipo",
        icon: "error",
        confirmButtonColor: theme === "dark" ? "#1d5631" : "#800040",
      })
    }
  }

  const abrirDialogoEstado = (notificacion: Notificacion) => {
    setNotificacionSeleccionada(notificacion)
    setNuevoEstado(notificacion.estadoEquipo || "reportado")
    setComentarioEstado(notificacion.comentarioEstado || "")
    setDialogoEstadoAbierto(true)
  }

  const formatearFecha = (timestamp: Timestamp) => {
    const fecha = timestamp.toDate()
    const ahora = new Date()
    const diferencia = ahora.getTime() - fecha.getTime()

    const minutos = Math.floor(diferencia / 60000)
    const horas = Math.floor(diferencia / 3600000)
    const dias = Math.floor(diferencia / 86400000)

    if (diferencia < 60000) return "Hace un momento"
    if (minutos < 60) return `Hace ${minutos} min`
    if (horas < 24) return `Hace ${horas} h`
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? "s" : ""}`

    return fecha.toLocaleDateString()
  }

  const NotificacionEquipoItem = ({ notificacion }: { notificacion: Notificacion }) => {
    const estadoConfig = notificacion.estadoEquipo ? estadosEquipo[notificacion.estadoEquipo] : estadosEquipo.reportado

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 border-l-4 rounded-lg mb-3 transition-all hover:shadow-md ${
          notificacion.estadoEquipo === "resuelto"
            ? "border-l-green-500 bg-green-50 dark:bg-green-900/20"
            : notificacion.estadoEquipo === "en_proceso"
              ? "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
              : "border-l-red-500 bg-red-50 dark:bg-red-900/20"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded-full bg-red-500 text-white`}>
              <Laptop className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {notificacion.titulo}
                </h4>
                <Badge variant="outline" className="text-xs">
                  Equipo #{notificacion.datos?.equipoId}
                </Badge>
                <Badge variant="outline" className={`text-xs ${estadoConfig.color} text-white border-transparent`}>
                  {estadoConfig.icon}
                  <span className="ml-1">{estadoConfig.label}</span>
                </Badge>
              </div>

              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-2`}>
                {notificacion.mensaje}
              </p>

              {/* Detalles del equipo */}
              {notificacion.datos && (
                <div
                  className={`mt-2 p-2 rounded text-xs ${
                    theme === "dark" ? "bg-gray-800/50 text-gray-300" : "bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-2">
                    {notificacion.datos.equipoId && (
                      <div>
                        <span className="font-medium">Equipo:</span> #{notificacion.datos.equipoId}
                      </div>
                    )}
                    {notificacion.datos.razon && (
                      <div className="col-span-2">
                        <span className="font-medium">Razón:</span> {notificacion.datos.razon}
                      </div>
                    )}
                  </div>

                  {/* Estado del equipo */}
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded-full ${estadoConfig.color} text-white`}>{estadoConfig.icon}</div>
                        <div>
                          <p className="font-medium text-xs">{estadoConfig.label}</p>
                          <p className="text-xs opacity-70">{estadoConfig.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirDialogoEstado(notificacion)}
                        className="h-6 px-2 text-xs"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Actualizar
                      </Button>
                    </div>

                    {notificacion.comentarioEstado && (
                      <div className="mt-2 p-2 rounded bg-gray-100 dark:bg-gray-700">
                        <p className="text-xs">
                          <span className="font-medium">Comentario:</span> {notificacion.comentarioEstado}
                        </p>
                      </div>
                    )}

                    {notificacion.fechaActualizacionEstado && (
                      <p className="text-xs opacity-60 mt-1">
                        Actualizado: {formatearFecha(notificacion.fechaActualizacionEstado)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  {formatearFecha(notificacion.fecha)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const finalizarClaseEmergencia = async () => {
    try {
      let maestroId = null

      if (tipoClaseAFinalizar === "regular") {
        const estadoRef = doc(db, "EstadoClase", "actual")
        const estadoClaseDoc = await getDoc(estadoRef)

        if (estadoClaseDoc.exists()) {
          const data = estadoClaseDoc.data()
          maestroId = data.maestroId // Obtener el ID del maestro antes de finalizar

          const horaFin = new Date().toLocaleTimeString()
          await updateDoc(estadoRef, { iniciada: false, horaFin: horaFin })

          await logAction(
            "Finalizar Clase de Emergencia",
            `Clase regular finalizada por laboratorista a las ${horaFin}`,
          )
        }
      } else {
        const estadoRef = doc(db, "EstadoClaseInvitado", "estado")
        const horaFin = new Date().toLocaleTimeString()
        await updateDoc(estadoRef, { iniciada: false, horaFin: horaFin })

        await logAction(
          "Finalizar Clase de Emergencia",
          `Clase de maestro invitado finalizada por laboratorista a las ${horaFin}`,
        )
      }

      setDialogoFinalizarClase(false)

      Swal.fire({
        title: "¡Clase finalizada!",
        text: "La clase ha sido cerrada correctamente y el maestro ha sido desconectado",
        icon: "success",
        confirmButtonColor: theme === "dark" ? "#1d5631" : "#800040",
        timer: 3000,
      })
    } catch (error) {
      console.error("Error al finalizar clase:", error)
      Swal.fire({
        title: "Error",
        text: "No se pudo finalizar la clase",
        icon: "error",
        confirmButtonColor: theme === "dark" ? "#1d5631" : "#800040",
      })
    }
  }

  const abrirDialogoFinalizarClase = (tipo: "regular" | "invitado") => {
    setTipoClaseAFinalizar(tipo)
    setDialogoFinalizarClase(true)
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

      {(claseActivaRegular || claseActivaInvitado) && (
        <div
          onClick={() => abrirDialogoFinalizarClase(claseActivaRegular ? "regular" : "invitado")}
          className={`fixed bottom-8 right-8 z-40 cursor-pointer group`}
          title="Finalizar clase activa de emergencia"
        >
          <div
            className={`relative flex items-center space-x-3 px-5 py-3 rounded-full transition-all duration-300 shadow-2xl ${
              theme === "dark"
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            } transform hover:scale-105`}
          >
            {/* Ícono pulsante */}
            <div className="relative">
              <XCircle size={24} className="text-white animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            </div>

            {/* Texto descriptivo */}
            <span className="text-white font-semibold text-sm whitespace-nowrap">Finalizar Clase</span>
          </div>

          {/* Tooltip expandido */}
          <div
            className={`absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-900 text-white"
            }`}
          >
            Cerrar clase activa y desconectar maestro
          </div>
        </div>
      )}

      <Dialog open={dialogoFinalizarClase} onOpenChange={setDialogoFinalizarClase}>
        <DialogContent className={theme === "dark" ? "bg-[#2a2a2a] text-white" : "bg-white"}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <span className="text-lg">Finalizar Clase de Emergencia</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
              ¿Estás seguro de que deseas finalizar la clase{" "}
              {tipoClaseAFinalizar === "regular" ? "regular" : "de maestro invitado"} activa?
            </p>

            <div
              className={`p-4 rounded-lg ${theme === "dark" ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"}`}
            >
              <p className="text-sm text-red-500 font-semibold mb-2">⚠️ Esta acción realizará lo siguiente:</p>
              <ul className="text-sm text-red-600 space-y-1 ml-4">
                <li>• Cerrará la clase inmediatamente</li>
                <li>• Cerrará la sesión del maestro</li>
                <li>• No se podrán registrar más asistencias</li>
                <li>• El maestro será redirigido al inicio</li>
              </ul>
            </div>

            <div className="flex space-x-2 pt-2">
              <Button onClick={() => setDialogoFinalizarClase(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={finalizarClaseEmergencia} className="flex-1 bg-red-500 hover:bg-red-600 text-white">
                <XCircle className="h-4 w-4 mr-2" />
                Finalizar Clase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Botón de notificaciones de equipos */}
      <Dialog open={dialogoNotificacionesAbierto} onOpenChange={setDialogoNotificacionesAbierto}>
        <DialogTrigger asChild>
          <button
            className={`fixed top-4 right-16 z-50 p-3 rounded-full transition-all duration-300 shadow-lg ${
              theme === "dark"
                ? "bg-[#1d5631] text-white hover:bg-[#153d23]"
                : "bg-[#800040] text-white hover:bg-[#5c002e]"
            }`}
          >
            <Bell size={20} />
            {notificacionesNoLeidas > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notificacionesNoLeidas > 99 ? "99+" : notificacionesNoLeidas}
              </Badge>
            )}
          </button>
        </DialogTrigger>
        <DialogContent
          className={`max-w-3xl max-h-[80vh] ${theme === "dark" ? "bg-[#2a2a2a] text-white" : "bg-white"}`}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Laptop className="h-5 w-5" />
                <span>Gestión de Estados de Equipos</span>
                {notificacionesNoLeidas > 0 && <Badge variant="destructive">{notificacionesNoLeidas} pendientes</Badge>}
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card className={theme === "dark" ? "bg-[#3a3a3a]" : "bg-gray-50"}>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Reportados</p>
                    <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {notificacionesEquipos.filter((n) => n.estadoEquipo === "reportado" || !n.estadoEquipo).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={theme === "dark" ? "bg-[#3a3a3a]" : "bg-gray-50"}>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>En Proceso</p>
                    <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {notificacionesEquipos.filter((n) => n.estadoEquipo === "en_proceso").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={theme === "dark" ? "bg-[#3a3a3a]" : "bg-gray-50"}>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Resueltos</p>
                    <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {notificacionesEquipos.filter((n) => n.estadoEquipo === "resuelto").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Tabs value={filtroNotificaciones} onValueChange={setFiltroNotificaciones}>
            <TabsList className={`grid grid-cols-4 w-full ${theme === "dark" ? "bg-[#3a3a3a]" : ""}`}>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="reportado">Reportados</TabsTrigger>
              <TabsTrigger value="en_proceso">En Proceso</TabsTrigger>
              <TabsTrigger value="resuelto">Resueltos</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Lista de notificaciones */}
          <ScrollArea className="h-[400px] mt-4">
            <AnimatePresence>
              {notificacionesEquipos.filter((n) => {
                if (filtroNotificaciones === "todas") return true
                if (filtroNotificaciones === "reportado") return n.estadoEquipo === "reportado" || !n.estadoEquipo
                return n.estadoEquipo === filtroNotificaciones
              }).length > 0 ? (
                notificacionesEquipos
                  .filter((n) => {
                    if (filtroNotificaciones === "todas") return true
                    if (filtroNotificaciones === "reportado") return n.estadoEquipo === "reportado" || !n.estadoEquipo
                    return n.estadoEquipo === filtroNotificaciones
                  })
                  .map((notificacion) => <NotificacionEquipoItem key={notificacion.id} notificacion={notificacion} />)
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <AlertTriangle className="h-8 w-8 mb-2" />
                  <p>No hay equipos en este estado</p>
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </DialogContent>
      </Dialog>

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
              <AlertTriangle className={`h-5 w-5 mr-2 ${theme === "dark" ? "text-[#2a7a45]" : "text-[#800040]"}`} />
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
                        {item.id === vistaActual && <AlertTriangle className="ml-auto h-5 w-5" />}
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
                    <AlertTriangle
                      className={`h-5 w-5 mr-2 ${theme === "dark" ? "text-[#2a7a45]" : "text-[#800040]"}`}
                    />
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
                        {item.id === vistaActual && <AlertTriangle className="ml-auto h-5 w-5" />}
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

      {/* Diálogo para cambiar estado del equipo */}
      <Dialog open={dialogoEstadoAbierto} onOpenChange={setDialogoEstadoAbierto}>
        <DialogContent className={`${theme === "dark" ? "bg-[#2a2a2a] text-white" : "bg-white"} max-w-md`}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Actualizar Estado del Equipo</span>
            </DialogTitle>
          </DialogHeader>

          {notificacionSeleccionada && (
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-[#3a3a3a]" : "bg-gray-50"}`}>
                <h4 className="font-medium mb-2">Información del Equipo:</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Equipo:</span> #{notificacionSeleccionada.datos?.equipoId}
                  </p>
                  {notificacionSeleccionada.datos?.razon && (
                    <p>
                      <span className="font-medium">Problema:</span> {notificacionSeleccionada.datos.razon}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="estado">Nuevo Estado *</Label>
                <Select value={nuevoEstado} onValueChange={(value: any) => setNuevoEstado(value)}>
                  <SelectTrigger className={theme === "dark" ? "bg-[#3a3a3a] border-gray-600" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={theme === "dark" ? "bg-[#3a3a3a] text-white" : ""}>
                    {Object.entries(estadosEquipo).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded-full ${config.color} text-white`}>{config.icon}</div>
                          <div>
                            <p className="font-medium">{config.label}</p>
                            <p className="text-xs opacity-70">{config.description}</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comentario">Comentario (opcional)</Label>
                <Textarea
                  id="comentario"
                  value={comentarioEstado}
                  onChange={(e) => setComentarioEstado(e.target.value)}
                  placeholder="Agregar detalles sobre el estado actual del equipo..."
                  className={theme === "dark" ? "bg-[#3a3a3a] border-gray-600" : ""}
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => setDialogoEstadoAbierto(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={actualizarEstadoEquipo}
                  className={`flex-1 ${theme === "dark" ? colors.dark.buttonPrimary : colors.light.buttonPrimary}`}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Actualizar Estado
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
