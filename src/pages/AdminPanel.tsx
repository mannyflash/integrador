"use client"

import { useState, useEffect } from "react"
import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  updateDoc,
  doc,
  type Timestamp,
} from "firebase/firestore"
import { Sidebar } from "../components/sidebarAdmin"
import { StatsCards } from "../components/StatsCards"
import { AlumnosTab } from "../components/AlumnosTab"
import { DocentesTab } from "../components/DocentesTab"
import { MateriasTab } from "../components/MateriasTab"
import { LaboratoristasTab } from "../components/LaboratoristasTab"
import { AdministradoresTab } from "../components/AdministradoresTab"
import { firebaseConfig } from "../lib/constants"
import { motion, AnimatePresence } from "framer-motion"
import { getTheme, toggleTheme, applyTheme, type Theme } from "../lib/theme"
import { useRouter } from 'next/navigation'
import Swal from "sweetalert2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

// Importar los iconos necesarios de Lucide React
import { Moon, Sun, Bell, AlertTriangle, UserPlus, Settings, CheckCircle, Clock, Users, Laptop, Award, Shield, Activity, AlertCircle, Info, Zap, Wrench, CheckCircle2 } from 'lucide-react'

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
    background: "bg-[#0c1f1a]", // Fondo verde muy oscuro
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
  // Campos para el estado de equipos
  estadoEquipo?: "reportado" | "en_proceso" | "resuelto"
  fechaActualizacionEstado?: Timestamp
  comentarioEstado?: string
}

interface EstadisticasNotificaciones {
  total: number
  noLeidas: number
  porTipo: Record<string, number>
  ultimaActualizacion: string
}

// Configuración de tipos de notificación
const tiposNotificacion = {
  equipo: {
    icon: <Laptop className="h-4 w-4" />,
    color: "bg-red-500",
    label: "Equipos",
  },
  maestro_invitado: {
    icon: <UserPlus className="h-4 w-4" />,
    color: "bg-blue-500",
    label: "Maestro Invitado",
  },
  evento: {
    icon: <Award className="h-4 w-4" />,
    color: "bg-purple-500",
    label: "Eventos",
  },
  asistencia: {
    icon: <Users className="h-4 w-4" />,
    color: "bg-green-500",
    label: "Asistencias",
  },
  sistema: {
    icon: <Settings className="h-4 w-4" />,
    color: "bg-orange-500",
    label: "Sistema",
  },
  seguridad: {
    icon: <Shield className="h-4 w-4" />,
    color: "bg-yellow-500",
    label: "Seguridad",
  },
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
    icon: <Wrench className="h-3 w-3" />,
    color: "bg-yellow-500",
    label: "En Proceso",
    description: "Siendo reparado por el departamento de sistemas",
  },
  resuelto: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    color: "bg-green-500",
    label: "Resuelto",
    description: "Problema solucionado, equipo disponible",
  },
}

const prioridadColors = {
  alta: "border-l-red-500 bg-red-50 dark:bg-red-900/20",
  media: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
  baja: "border-l-blue-500 bg-blue-50 dark:bg-blue-900/20",
}

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

  // Estados para notificaciones
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0)
  const [dialogoNotificacionesAbierto, setDialogoNotificacionesAbierto] = useState(false)
  const [filtroNotificaciones, setFiltroNotificaciones] = useState<string>("no_leidas")
  const [estadisticas, setEstadisticas] = useState<EstadisticasNotificaciones>({
    total: 0,
    noLeidas: 0,
    porTipo: {},
    ultimaActualizacion: new Date().toLocaleString(),
  })

  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState<Notificacion | null>(null)
  const [previewAbierto, setPreviewAbierto] = useState(false)

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
    setupNotificacionesListeners()

    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [theme])

  // Actualizar tiempo cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setEstadisticas((prev) => ({
        ...prev,
        ultimaActualizacion: new Date().toLocaleString(),
      }))
    }, 60000) // Actualizar cada minuto

    return () => clearInterval(interval)
  }, [])

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

  // Configurar listeners para notificaciones
  const setupNotificacionesListeners = () => {
    const esDiaActual = (timestamp: Timestamp) => {
      const fechaNotificacion = timestamp.toDate()
      const hoy = new Date()

      return (
        fechaNotificacion.getDate() === hoy.getDate() &&
        fechaNotificacion.getMonth() === hoy.getMonth() &&
        fechaNotificacion.getFullYear() === hoy.getFullYear()
      )
    }

    // Listener principal para notificaciones
    const unsubscribeNotificaciones = onSnapshot(
      query(collection(db, "NotificacionesAdmin"), orderBy("fecha", "desc"), limit(50)),
      (snapshot) => {
        const notificacionesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notificacion[]

        const notificacionesFiltradas = notificacionesData.filter((n) => {
          // Si es una notificación de equipo, mostrar solo las que no están resueltas
          if (n.tipo === "equipo") {
            return n.estadoEquipo !== "resuelto"
          }
          // Para otros tipos de notificaciones, mostrar las del día actual o las no leídas
          return esDiaActual(n.fecha) || !n.leida
        })

        setNotificaciones(notificacionesFiltradas)

        if (notificacionSeleccionada) {
          const notificacionActualizada = notificacionesFiltradas.find((n) => n.id === notificacionSeleccionada.id)
          if (notificacionActualizada) {
            setNotificacionSeleccionada(notificacionActualizada)
          }
        }

        const noLeidas = notificacionesFiltradas.filter((n) => !n.leida).length
        setNotificacionesNoLeidas(noLeidas)

        // Calcular estadísticas
        const porTipo = notificacionesFiltradas.reduce(
          (acc, notif) => {
            acc[notif.tipo] = (acc[notif.tipo] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        setEstadisticas({
          total: notificacionesFiltradas.length,
          noLeidas,
          porTipo,
          ultimaActualizacion: new Date().toLocaleString(),
        })

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const nuevaNotificacion = {
              id: change.doc.id,
              ...change.doc.data(),
            } as Notificacion

            // Solo mostrar alerta si la notificación fue creada en los últimos 5 segundos
            const tiempoTranscurrido = Date.now() - nuevaNotificacion.fecha.toMillis()
            if (tiempoTranscurrido < 5000) {
              // Mostrar toast para notificaciones de prioridad alta o media
              if (nuevaNotificacion.prioridad === "alta") {
                Swal.fire({
                  title: "🚨 Notificación Urgente",
                  text: nuevaNotificacion.titulo,
                  icon: "warning",
                  confirmButtonColor: theme === "dark" ? "#1d5631" : "#800040",
                  timer: 5000,
                  timerProgressBar: true,
                  position: "top-end",
                  toast: true,
                  showConfirmButton: false,
                })
              } else if (nuevaNotificacion.prioridad === "media") {
                Swal.fire({
                  title: nuevaNotificacion.titulo,
                  text: nuevaNotificacion.mensaje.substring(0, 100),
                  icon: "info",
                  confirmButtonColor: theme === "dark" ? "#1d5631" : "#800040",
                  timer: 4000,
                  timerProgressBar: true,
                  position: "top-end",
                  toast: true,
                  showConfirmButton: false,
                })
              }
            }
          }
        })
      },
    )

    // Listeners para generar notificaciones automáticas
    const unsubscribeEquipos = onSnapshot(collection(db, "Numero de equipos"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const equipos = change.doc.data().Equipos || []
          const equiposFueraServicio = equipos.filter((e: any) => e.fueraDeServicio)

          if (equiposFueraServicio.length > 0) {
            console.log("Equipos fuera de servicio detectados:", equiposFueraServicio.length)
          }
        }
      })
    })

    const unsubscribeMaestroInvitado = onSnapshot(collection(db, "EstadoClaseInvitado"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified" || change.type === "added") {
          const data = change.doc.data()
          if (data.iniciada) {
            console.log("Clase de maestro invitado iniciada:", data)
          }
        }
      })
    })

    return () => {
      unsubscribeNotificaciones()
      unsubscribeEquipos()
      unsubscribeMaestroInvitado()
    }
  }

  const marcarComoLeida = async (notificacionId: string) => {
    try {
      await updateDoc(doc(db, "NotificacionesAdmin", notificacionId), {
        leida: true,
      })

      setNotificaciones((prev) => prev.map((n) => (n.id === notificacionId ? { ...n, leida: true } : n)))

      setNotificacionSeleccionada((prev) => {
        if (prev && prev.id === notificacionId) {
          return { ...prev, leida: true }
        }
        return prev
      })

      setNotificacionesNoLeidas((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error)
    }
  }

  const marcarTodasComoLeidas = async () => {
    try {
      const notificacionesNoLeidasIds = notificaciones.filter((n) => !n.leida).map((n) => n.id)

      // Actualizar todas en Firestore
      const updatePromises = notificacionesNoLeidasIds.map((id) =>
        updateDoc(doc(db, "NotificacionesAdmin", id), { leida: true }),
      )

      await Promise.all(updatePromises)

      // Actualizar estado local
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
      setNotificacionesNoLeidas(0)
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error)
    }
  }

  const filtrarNotificaciones = (notificaciones: Notificacion[]) => {
    if (filtroNotificaciones === "todas") return notificaciones
    if (filtroNotificaciones === "no_leidas") return notificaciones.filter((n) => !n.leida)
    return notificaciones.filter((n) => n.tipo === filtroNotificaciones)
  }

  const formatearFecha = (timestamp: Timestamp) => {
    const fecha = timestamp.toDate()
    const ahora = new Date()
    const diferencia = ahora.getTime() - fecha.getTime()

    const minutos = Math.floor(diferencia / 60000)
    const horas = Math.floor(diferencia / 3600000)
    const dias = Math.floor(diferencia / 86400000)
    const semanas = Math.floor(diferencia / 604800000)
    const meses = Math.floor(diferencia / 2629746000)

    if (diferencia < 60000) return "Hace un momento"
    if (minutos < 60) return `Hace ${minutos} min`
    if (horas < 24) return `Hace ${horas} h`
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? "s" : ""}`
    if (semanas < 4) return `Hace ${semanas} semana${semanas > 1 ? "s" : ""}`
    if (meses < 12) return `Hace ${meses} mes${meses > 1 ? "es" : ""}`

    const años = Math.floor(meses / 12)
    return `Hace ${años} año${años > 1 ? "s" : ""}`
  }

  const abrirPreview = (notificacion: Notificacion) => {
    // Crear una copia independiente de la notificación
    const copiaNotificacion = { ...notificacion }
    setNotificacionSeleccionada(copiaNotificacion)
    setPreviewAbierto(true)
    // NO marcar como leída automáticamente
  }

  const cerrarPreview = async () => {
    if (notificacionSeleccionada && notificacionSeleccionada.tipo !== "equipo" && !notificacionSeleccionada.leida) {
      try {
        await marcarComoLeida(notificacionSeleccionada.id)
      } catch (error) {
        console.error("Error al marcar notificación como leída:", error)
      }
    }

    setPreviewAbierto(false)
    setTimeout(() => {
      setNotificacionSeleccionada(null)
    }, 150)
  }

  const NotificacionItem = ({ notificacion }: { notificacion: Notificacion }) => {
    const tipoConfig = tiposNotificacion[notificacion.tipo]
    const estadoConfig = notificacion.estadoEquipo ? estadosEquipo[notificacion.estadoEquipo] : null

    const renderDetallesEspecificos = () => {
      if (!notificacion.datos) return null

      switch (notificacion.tipo) {
        case "equipo":
          return (
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
                {notificacion.datos.notas && (
                  <div className="col-span-2">
                    <span className="font-medium">Notas:</span> {notificacion.datos.notas.substring(0, 100)}...
                  </div>
                )}
                {notificacion.datos.cantidadEquipos && (
                  <div>
                    <span className="font-medium">Cantidad:</span> {notificacion.datos.cantidadEquipos} equipos
                  </div>
                )}
              </div>

              {/* Estado del equipo - Solo mostrar, no editar desde admin */}
              {estadoConfig && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1 rounded-full ${estadoConfig.color} text-white`}>{estadoConfig.icon}</div>
                      <div>
                        <p className="font-medium text-xs">{estadoConfig.label}</p>
                        <p className="text-xs opacity-70">{estadoConfig.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Actualizado por laboratorista
                    </Badge>
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
              )}
            </div>
          )

        case "maestro_invitado":
          return (
            <div
              className={`mt-2 p-2 rounded text-xs ${
                theme === "dark" ? "bg-gray-800/50 text-gray-300" : "bg-gray-50 text-gray-700"
              }`}
            >
              <div className="grid grid-cols-2 gap-2">
                {notificacion.datos.maestroNombre && (
                  <div>
                    <span className="font-medium">Maestro:</span> {notificacion.datos.maestroNombre}
                  </div>
                )}
                {notificacion.datos.departamento && (
                  <div>
                    <span className="font-medium">Departamento:</span> {notificacion.datos.departamento}
                  </div>
                )}
                {notificacion.datos.materia && (
                  <div>
                    <span className="font-medium">Materia:</span> {notificacion.datos.materia}
                  </div>
                )}
                {notificacion.datos.practica && (
                  <div>
                    <span className="font-medium">Práctica:</span> {notificacion.datos.practica}
                  </div>
                )}
                {notificacion.datos.grupo && (
                  <div>
                    <span className="font-medium">Grupo:</span> {notificacion.datos.grupo}
                  </div>
                )}
                {notificacion.datos.horaInicio && (
                  <div>
                    <span className="font-medium">Hora:</span> {notificacion.datos.horaInicio}
                  </div>
                )}
              </div>
            </div>
          )

        case "evento":
          return (
            <div
              className={`mt-2 p-2 rounded text-xs ${
                theme === "dark" ? "bg-gray-800/50 text-gray-300" : "bg-gray-50 text-gray-700"
              }`}
            >
              <div className="grid grid-cols-2 gap-2">
                {notificacion.datos.tipoEvento && (
                  <div>
                    <span className="font-medium">Tipo:</span> {notificacion.datos.tipoEvento}
                  </div>
                )}
                {notificacion.datos.organizador && (
                  <div>
                    <span className="font-medium">Organizador:</span> {notificacion.datos.organizador}
                  </div>
                )}
                {notificacion.datos.participantes && (
                  <div>
                    <span className="font-medium">Participantes:</span> {notificacion.datos.participantes}
                  </div>
                )}
                {notificacion.datos.fecha && (
                  <div>
                    <span className="font-medium">Fecha:</span> {notificacion.datos.fecha}
                  </div>
                )}
                {notificacion.datos.hora && (
                  <div>
                    <span className="font-medium">Hora:</span> {notificacion.datos.hora}
                  </div>
                )}
                {notificacion.datos.duracion && (
                  <div>
                    <span className="font-medium">Duración:</span> {notificacion.datos.duracion}
                  </div>
                )}
              </div>
            </div>
          )

        case "asistencia":
          return (
            <div
              className={`mt-2 p-2 rounded text-xs ${
                theme === "dark" ? "bg-gray-800/50 text-gray-300" : "bg-gray-50 text-gray-700"
              }`}
            >
              <div className="grid grid-cols-2 gap-2">
                {notificacion.datos.maestroNombre && (
                  <div>
                    <span className="font-medium">Maestro:</span> {notificacion.datos.maestroNombre}
                  </div>
                )}
                {notificacion.datos.materia && (
                  <div>
                    <span className="font-medium">Materia:</span> {notificacion.datos.materia}
                  </div>
                )}
                {notificacion.datos.practica && (
                  <div>
                    <span className="font-medium">Práctica:</span> {notificacion.datos.practica}
                  </div>
                )}
                {notificacion.datos.totalAsistencias !== undefined && (
                  <div>
                    <span className="font-medium">Asistencias:</span> {notificacion.datos.totalAsistencias}
                  </div>
                )}
                {notificacion.datos.horaInicio && (
                  <div>
                    <span className="font-medium">Inicio:</span> {notificacion.datos.horaInicio}
                  </div>
                )}
                {notificacion.datos.horaFin && (
                  <div>
                    <span className="font-medium">Fin:</span> {notificacion.datos.horaFin}
                  </div>
                )}
                {notificacion.datos.finalizadaAutomaticamente && (
                  <div className="col-span-2 text-orange-600 dark:text-orange-400">
                    <span className="font-medium">⚠️ Finalizada automáticamente</span>
                  </div>
                )}
              </div>
            </div>
          )

        case "sistema":
          return (
            <div
              className={`mt-2 p-2 rounded text-xs ${
                theme === "dark" ? "bg-gray-800/50 text-gray-300" : "bg-gray-50 text-gray-700"
              }`}
            >
              <div className="grid grid-cols-2 gap-2">
                {notificacion.datos.accion && (
                  <div>
                    <span className="font-medium">Acción:</span> {notificacion.datos.accion}
                  </div>
                )}
                {notificacion.datos.cantidadEquipos && (
                  <div>
                    <span className="font-medium">Equipos:</span> {notificacion.datos.cantidadEquipos}
                  </div>
                )}
              </div>
            </div>
          )

        default:
          return null
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 border-l-4 rounded-lg mb-3 cursor-pointer transition-all hover:shadow-md ${
          prioridadColors[notificacion.prioridad]
        } ${!notificacion.leida ? "ring-2 ring-blue-200" : ""}`}
        onClick={() => abrirPreview(notificacion)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded-full ${tipoConfig.color} text-white`}>{tipoConfig.icon}</div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                  {notificacion.titulo}
                </h4>
                <Badge variant="outline" className="text-xs">
                  {tipoConfig.label}
                </Badge>
                {notificacion.prioridad === "alta" && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Urgente
                  </Badge>
                )}
                {estadoConfig && (
                  <Badge variant="outline" className={`text-xs ${estadoConfig.color} text-white border-transparent`}>
                    {estadoConfig.icon}
                    <span className="ml-1">{estadoConfig.label}</span>
                  </Badge>
                )}
              </div>
              <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"} mb-2`}>
                {notificacion.mensaje}
              </p>

              {/* Renderizar detalles específicos */}
              {renderDetallesEspecificos()}

              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  {formatearFecha(notificacion.fecha)}
                </span>
                {!notificacion.leida && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const NotificacionPreview = () => {
    if (!notificacionSeleccionada) return null

    const tipoConfig = tiposNotificacion[notificacionSeleccionada.tipo]
    const estadoConfig = notificacionSeleccionada.estadoEquipo
      ? estadosEquipo[notificacionSeleccionada.estadoEquipo]
      : null

    return (
      <Sheet
        open={previewAbierto}
        onOpenChange={(open) => {
          if (!open) {
            cerrarPreview()
          }
        }}
      >
        <SheetContent
          side="right"
          className={`w-full sm:max-w-2xl ${theme === "dark" ? "bg-[#1a1a1a] text-white border-gray-700" : "bg-white"}`}
        >
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <SheetHeader>
              <div className="flex items-center space-x-3 mb-2">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className={`p-3 rounded-full ${tipoConfig.color} text-white`}
                >
                  {tipoConfig.icon}
                </motion.div>
                <div className="flex-1">
                  <SheetTitle className={theme === "dark" ? "text-white" : "text-gray-900"}>
                    {notificacionSeleccionada.titulo}
                  </SheetTitle>
                  <SheetDescription className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{tipoConfig.label}</Badge>
                    {notificacionSeleccionada.prioridad === "alta" && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Urgente
                      </Badge>
                    )}
                    {estadoConfig && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${estadoConfig.color} text-white border-transparent`}
                      >
                        {estadoConfig.icon}
                        <span className="ml-1">{estadoConfig.label}</span>
                      </Badge>
                    )}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <Separator className="my-4" />

            <ScrollArea className="h-[calc(100vh-200px)]">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="space-y-6"
              >
                {/* Información principal */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h3 className={`text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Mensaje
                  </h3>
                  <p className={`text-base ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                    {notificacionSeleccionada.mensaje}
                  </p>
                </motion.div>

                <Separator />

                {/* Fecha y hora */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <h3
                      className={`text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Fecha y hora
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className={theme === "dark" ? "text-gray-200" : "text-gray-800"}>
                        {notificacionSeleccionada.fecha.toDate().toLocaleString("es-MX", {
                          dateStyle: "full",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      {formatearFecha(notificacionSeleccionada.fecha)}
                    </p>
                  </div>

                  <div>
                    <h3
                      className={`text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Prioridad
                    </h3>
                    <Badge
                      variant={notificacionSeleccionada.prioridad === "alta" ? "destructive" : "outline"}
                      className="capitalize"
                    >
                      {notificacionSeleccionada.prioridad}
                    </Badge>
                  </div>
                </motion.div>

                <Separator />

                {/* Estado del equipo (si aplica) */}
                {estadoConfig && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <h3
                      className={`text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Estado de reparación
                    </h3>
                    <Card className={theme === "dark" ? "bg-[#2a2a2a] border-gray-700" : "bg-gray-50"}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`p-2 rounded-full ${estadoConfig.color} text-white`}>{estadoConfig.icon}</div>
                          <div>
                            <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                              {estadoConfig.label}
                            </p>
                            <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                              {estadoConfig.description}
                            </p>
                          </div>
                        </div>

                        {notificacionSeleccionada.comentarioEstado && (
                          <div
                            className={`mt-3 p-3 rounded-lg ${theme === "dark" ? "bg-[#1a1a1a]" : "bg-white"} border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                          >
                            <p
                              className={`text-xs font-semibold mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                            >
                              Comentario del laboratorista:
                            </p>
                            <p className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                              {notificacionSeleccionada.comentarioEstado}
                            </p>
                          </div>
                        )}

                        {notificacionSeleccionada.fechaActualizacionEstado && (
                          <p className={`text-xs mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            Última actualización: {formatearFecha(notificacionSeleccionada.fechaActualizacionEstado)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Detalles específicos según el tipo */}
                {notificacionSeleccionada.datos && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3
                      className={`text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Detalles adicionales
                    </h3>
                    <Card className={theme === "dark" ? "bg-[#2a2a2a] border-gray-700" : "bg-gray-50"}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(notificacionSeleccionada.datos).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <p
                                className={`text-xs font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-500"} capitalize`}
                              >
                                {key.replace(/([A-Z])/g, " $1").trim()}
                              </p>
                              <p className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-800"}`}>
                                {typeof value === "boolean" ? (value ? "Sí" : "No") : value?.toString() || "N/A"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </ScrollArea>

            {/* Botones de acción */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-0 left-0 right-0 p-6 border-t bg-inherit"
            >
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    if (notificacionSeleccionada.leida) {
                      updateDoc(doc(db, "NotificacionesAdmin", notificacionSeleccionada.id), { leida: false })
                      setNotificaciones((prev) =>
                        prev.map((n) => (n.id === notificacionSeleccionada.id ? { ...n, leida: false } : n)),
                      )
                      setNotificacionSeleccionada((prev) => (prev ? { ...prev, leida: false } : null))
                      setNotificacionesNoLeidas((prev) => prev + 1)
                    } else {
                      marcarComoLeida(notificacionSeleccionada.id)
                    }
                  }}
                >
                  {notificacionSeleccionada.leida ? "Marcar como no leída" : "Marcar como leída"}
                </Button>
                <Button
                  className={theme === "dark" ? currentColors.buttonPrimary : currentColors.buttonPrimary}
                  onClick={cerrarPreview}
                >
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </SheetContent>
      </Sheet>
    )
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
            {/* Botón de notificaciones */}
            <Dialog open={dialogoNotificacionesAbierto} onOpenChange={setDialogoNotificacionesAbierto}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className={`relative ${theme === "dark" ? "bg-[#1d5631] border-[#2a7a45] text-white hover:bg-[#153d23]" : "bg-white border-[#800040] text-[#800040] hover:bg-[#fff0f5]"}`}
                >
                  <Bell className="h-5 w-5" />
                  {notificacionesNoLeidas > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {notificacionesNoLeidas > 99 ? "99+" : notificacionesNoLeidas}
                    </Badge>
                  )}
                  <span className="ml-2 hidden sm:inline">Notificaciones</span>
                </Button>
              </DialogTrigger>
              <DialogContent
                className={`max-w-4xl max-h-[80vh] ${theme === "dark" ? "bg-[#2a2a2a] text-white" : "bg-white"}`}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>Centro de Notificaciones</span>
                      {notificacionesNoLeidas > 0 && (
                        <Badge variant="destructive">{notificacionesNoLeidas} nuevas</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={marcarTodasComoLeidas}
                      disabled={notificacionesNoLeidas === 0}
                      className={theme === "dark" ? "text-white hover:bg-[#3a3a3a]" : ""}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar todas como leídas
                    </Button>
                  </DialogTitle>
                </DialogHeader>

                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <Card className={theme === "dark" ? "bg-[#3a3a3a]" : "bg-gray-50"}>
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Total</p>
                          <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {estadisticas.total}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={theme === "dark" ? "bg-[#3a3a3a]" : "bg-gray-50"}>
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <div>
                          <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>No leídas</p>
                          <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {estadisticas.noLeidas}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={theme === "dark" ? "bg-[#3a3a3a]" : "bg-gray-50"}>
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <Laptop className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Equipos</p>
                          <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {estadisticas.porTipo.equipo || 0}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={theme === "dark" ? "bg-[#3a3a3a]" : "bg-gray-50"}>
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-green-500" />
                        <div>
                          <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            Actualizado
                          </p>
                          <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                            {estadisticas.ultimaActualizacion.split(" ")[1]}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtros */}
                <Tabs value={filtroNotificaciones} onValueChange={setFiltroNotificaciones}>
                  <TabsList
                    className={`grid grid-cols-3 md:grid-cols-7 w-full ${theme === "dark" ? "bg-[#3a3a3a]" : ""}`}
                  >
                    <TabsTrigger value="no_leidas">No leídas</TabsTrigger>
                    <TabsTrigger value="todas">Todas</TabsTrigger>
                    <TabsTrigger value="equipo">Equipos</TabsTrigger>
                    <TabsTrigger value="maestro_invitado">Invitados</TabsTrigger>
                    <TabsTrigger value="evento">Eventos</TabsTrigger>
                    <TabsTrigger value="asistencia">Asistencias</TabsTrigger>
                    <TabsTrigger value="sistema">Sistema</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Lista de notificaciones */}
                <ScrollArea className="h-[400px] mt-4">
                  <AnimatePresence>
                    {filtrarNotificaciones(notificaciones).length > 0 ? (
                      filtrarNotificaciones(notificaciones).map((notificacion) => (
                        <NotificacionItem key={notificacion.id} notificacion={notificacion} />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                        <Info className="h-8 w-8 mb-2" />
                        <p>No hay notificaciones para mostrar</p>
                      </div>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </DialogContent>
            </Dialog>

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

          {/* Resumen de notificaciones recientes en el dashboard */}
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

      <NotificacionPreview />
    </div>
  )
}
