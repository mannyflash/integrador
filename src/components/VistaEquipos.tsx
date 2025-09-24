"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { doc, updateDoc, setDoc, onSnapshot, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Laptop, CheckCircle, RefreshCw, Plus, Settings, Info, HelpCircle, XCircle, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import swal from "sweetalert"
import { db } from "../pages/panel-laboratorista"
import { toast } from "../hooks/use-toast"
import { AlertTriangle, Wrench, CheckCircle2, Activity } from "lucide-react"

interface Equipo {
  id: string
  fueraDeServicio: boolean
  enUso?: boolean
  ultimaActualizacion?: string
  notas?: string
  // Nuevos campos para el estado de reparación
  estadoReparacion?: "reportado" | "en_proceso" | "resuelto"
  fechaActualizacionEstado?: string
  comentarioEstado?: string
  notificacionAdminId?: string // ID de la notificación enviada al admin
}

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
    badge: "bg-[#800040]",
    badgeOutline: "border-[#800040] text-[#800040]",
    badgeSecundario: "bg-[#800040]/20 text-[#800040]",
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
    badge: "bg-[#1d5631]",
    badgeOutline: "border-[#1d5631] text-[#2a7a45]",
    badgeSecundario: "bg-[#1d5631]/20 text-[#1d5631]",
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

// Función para crear notificaciones para el administrador
const crearNotificacionAdmin = async (
  tipo: string,
  titulo: string,
  mensaje: string,
  prioridad: string,
  datos?: any,
) => {
  try {
    const docRef = await addDoc(collection(db, "NotificacionesAdmin"), {
      tipo,
      titulo,
      mensaje,
      fecha: serverTimestamp(),
      leida: false,
      prioridad,
      datos: datos || null,
      // Agregar estado inicial para equipos
      estadoEquipo: tipo === "equipo" && datos?.accion === "deshabilitar_equipo" ? "reportado" : undefined,
    })
    console.log("Notificación creada para el administrador:", titulo)
    return docRef.id // Retornar el ID de la notificación creada
  } catch (error) {
    console.error("Error al crear notificación:", error)
    return null
  }
}

// Función para actualizar el estado de una notificación existente
const actualizarEstadoNotificacionAdmin = async (
  notificacionId: string,
  nuevoEstado: "reportado" | "en_proceso" | "resuelto",
  comentario?: string,
) => {
  try {
    await updateDoc(doc(db, "NotificacionesAdmin", notificacionId), {
      estadoEquipo: nuevoEstado,
      fechaActualizacionEstado: serverTimestamp(),
      comentarioEstado: comentario || null,
    })
    console.log("Estado de notificación actualizado:", notificacionId, nuevoEstado)
  } catch (error) {
    console.error("Error al actualizar estado de notificación:", error)
  }
}

export default function VistaEquipos({
  esModoOscuro,
  logAction,
}: { esModoOscuro: boolean; logAction: (action: string, details: string) => Promise<void> }) {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [equiposFiltrados, setEquiposFiltrados] = useState<Equipo[]>([])
  const [cantidadEquipos, setCantidadEquipos] = useState("")
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [dialogoNotasAbierto, setDialogoNotasAbierto] = useState(false)
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null)
  const [notas, setNotas] = useState("")
  const [filtro, setFiltro] = useState("todos")
  const [busqueda, setBusqueda] = useState("")
  const [cargando, setCargando] = useState(true)
  const [activeTab, setActiveTab] = useState("todos")
  const [equiposAnteriores, setEquiposAnteriores] = useState<Equipo[]>([])
  const [dialogoDeshabilitarAbierto, setDialogoDeshabilitarAbierto] = useState(false)
  const [equipoADeshabilitar, setEquipoADeshabilitar] = useState<Equipo | null>(null)
  const [razonDeshabilitacion, setRazonDeshabilitacion] = useState("")
  const [enviandoReporte, setEnviandoReporte] = useState(false)

  // Estados para el diálogo de cambio de estado
  const [dialogoEstadoAbierto, setDialogoEstadoAbierto] = useState(false)
  const [equipoParaEstado, setEquipoParaEstado] = useState<Equipo | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState<"reportado" | "en_proceso" | "resuelto">("reportado")
  const [comentarioEstado, setComentarioEstado] = useState("")

  const modoColor = esModoOscuro ? colors.dark : colors.light

  const cargarEquipos = () => {
    setCargando(true)
    try {
      // Usar onSnapshot para escuchar cambios en tiempo real
      const unsubscribe = onSnapshot(
        doc(db, "Numero de equipos", "equipos"),
        (equiposDoc) => {
          if (equiposDoc.exists()) {
            const data = equiposDoc.data()
            const equiposData = Array.isArray(data.Equipos) ? data.Equipos : []

            // Asegurarse de que todos los equipos tengan los campos necesarios
            const equiposCompletos = equiposData.map((equipo) => ({
              ...equipo,
              ultimaActualizacion: equipo.ultimaActualizacion || new Date().toISOString(),
              notas: equipo.notas || "",
              enUso: equipo.enUso || false,
              estadoReparacion: equipo.estadoReparacion || undefined,
              fechaActualizacionEstado: equipo.fechaActualizacionEstado || undefined,
              comentarioEstado: equipo.comentarioEstado || undefined,
              notificacionAdminId: equipo.notificacionAdminId || undefined,
            }))

            setEquipos(equiposCompletos)
            setCargando(false)
            logAction("Cargar Equipos", `Se cargaron ${equiposCompletos.length} equipos`)
          } else {
            setEquipos([])
            setCargando(false)
            logAction("Cargar Equipos", "No se encontraron equipos")
          }
        },
        (error) => {
          console.error("Error al escuchar cambios en equipos:", error)
          setCargando(false)
          logAction("Error", `Error al escuchar cambios en equipos: ${error}`)
        },
      )

      // Retornar la función de limpieza
      return unsubscribe
    } catch (error) {
      console.error("Error al configurar el listener de equipos:", error)
      setCargando(false)
      logAction("Error", `Error al configurar el listener de equipos: ${error}`)
      return () => {}
    }
  }

  useEffect(() => {
    // Guardar la función de limpieza que devuelve cargarEquipos
    const unsubscribe = cargarEquipos()

    // Limpiar la suscripción cuando el componente se desmonte
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [equipos, filtro, busqueda, activeTab])

  useEffect(() => {
    // Verificar si algún equipo cambió a estado "en uso"
    if (equiposAnteriores.length > 0) {
      const nuevosEnUso = equipos.filter(
        (equipo) => equipo.enUso && !equiposAnteriores.find((eq) => eq.id === equipo.id)?.enUso,
      )

      if (nuevosEnUso.length > 0) {
        // Mostrar notificación para cada equipo que cambió a "en uso"
        nuevosEnUso.forEach((equipo) => {
          toast({
            title: "Equipo en uso",
            description: `El equipo ${equipo.id} está siendo utilizado ahora`,
            variant: "default",
          })
        })
      }
    }

    // Actualizar el estado anterior
    setEquiposAnteriores(equipos)
  }, [equipos])

  const aplicarFiltros = () => {
    let equiposFiltrados = [...equipos]

    // Filtrar por estado
    if (filtro === "enServicio") {
      equiposFiltrados = equiposFiltrados.filter((equipo) => !equipo.fueraDeServicio)
    } else if (filtro === "fueraDeServicio") {
      equiposFiltrados = equiposFiltrados.filter((equipo) => equipo.fueraDeServicio)
    } else if (filtro === "enUso") {
      equiposFiltrados = equiposFiltrados.filter((equipo) => equipo.enUso)
    }

    // Filtrar por búsqueda
    if (busqueda) {
      equiposFiltrados = equiposFiltrados.filter(
        (equipo) =>
          equipo.id.toLowerCase().includes(busqueda.toLowerCase()) ||
          (equipo.notas && equipo.notas.toLowerCase().includes(busqueda.toLowerCase())),
      )
    }

    setEquiposFiltrados(equiposFiltrados)
  }

  const agregarEquipos = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const cantidad = Number.parseInt(cantidadEquipos)
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error("Cantidad inválida")
      }

      const equiposAnteriores = equipos.length

      const nuevosEquipos = Array.from({ length: cantidad }, (_, i) => ({
        id: (i + 1).toString(),
        fueraDeServicio: false,
        enUso: false,
        ultimaActualizacion: new Date().toISOString(),
        notas: `Equipo agregado el ${new Date().toLocaleString("es-MX")}`,
      }))

      await setDoc(doc(db, "Numero de equipos", "equipos"), { Equipos: nuevosEquipos })
      setEquipos(nuevosEquipos)
      setCantidadEquipos("")
      setDialogoAbierto(false)

      // Crear notificación DETALLADA para el administrador
      await crearNotificacionAdmin(
        "sistema",
        `🔧 Configuración de Equipos Actualizada`,
        `Se ha actualizado la configuración del laboratorio con ${cantidad} equipos nuevos, reemplazando la configuración anterior de ${equiposAnteriores} equipos.`,
        "media",
        {
          cantidadEquipos: cantidad,
          equiposAnteriores: equiposAnteriores,
          accion: "actualizar_equipos",
          fecha: new Date().toLocaleString("es-MX"),
          rangoEquipos: `#1 - #${cantidad}`,
          configuracionAnterior: `${equiposAnteriores} equipos`,
          configuracionNueva: `${cantidad} equipos`,
        },
      )

      await swal({
        title: "¡Éxito!",
        text: `${cantidad} equipos agregados correctamente, reemplazando los ${equiposAnteriores} anteriores`,
        icon: "success",
      })

      await logAction(
        "Agregar Equipos",
        `Se agregaron ${cantidad} equipos nuevos, reemplazando los ${equiposAnteriores} anteriores`,
      )
    } catch (error) {
      console.error("Error al agregar equipos:", error)
      await swal({
        title: "Error",
        text: "Ha ocurrido un error al agregar los equipos.",
        icon: "error",
      })
      await logAction("Error", `Error al agregar equipos: ${error}`)
    }
  }

  const abrirDialogoNotas = (equipo: Equipo) => {
    setEquipoSeleccionado(equipo)
    setNotas(equipo.notas || "")
    setDialogoNotasAbierto(true)
  }

  const guardarNotas = async () => {
    if (!equipoSeleccionado) return

    try {
      const notasAnteriores = equipoSeleccionado.notas || "Sin notas previas"

      const equiposActualizados = equipos.map((equipo) =>
        equipo.id === equipoSeleccionado.id
          ? {
              ...equipo,
              notas: notas,
              ultimaActualizacion: new Date().toISOString(),
            }
          : equipo,
      )

      await updateDoc(doc(db, "Numero de equipos", "equipos"), {
        Equipos: equiposActualizados,
      })

      setEquipos(equiposActualizados)
      setDialogoNotasAbierto(false)

      // Crear notificación DETALLADA si las notas indican un problema
      const palabrasProblema = ["problema", "falla", "error", "dañado", "roto", "no funciona", "defecto"]
      const tieneProblema = palabrasProblema.some((palabra) => notas.toLowerCase().includes(palabra))

      if (tieneProblema) {
        await crearNotificacionAdmin(
          "equipo",
          `⚠️ Problema Reportado en Equipo #${equipoSeleccionado.id}`,
          `Se han actualizado las notas del equipo #${equipoSeleccionado.id} con un posible problema que requiere atención. Revisar las notas para más detalles.`,
          "media",
          {
            equipoId: equipoSeleccionado.id,
            notas: notas,
            notasAnteriores: notasAnteriores,
            problemaDetectado: true,
            fechaActualizacion: new Date().toLocaleString("es-MX"),
            requiereRevision: true,
            accion: "actualizar_notas_problema",
          },
        )
      } else {
        // Notificación normal para actualización de notas
        await crearNotificacionAdmin(
          "equipo",
          `📝 Notas Actualizadas - Equipo #${equipoSeleccionado.id}`,
          `Se han actualizado las notas del equipo #${equipoSeleccionado.id} con información adicional.`,
          "baja",
          {
            equipoId: equipoSeleccionado.id,
            notas: notas.substring(0, 200) + (notas.length > 200 ? "..." : ""),
            notasAnteriores: notasAnteriores,
            fechaActualizacion: new Date().toLocaleString("es-MX"),
            accion: "actualizar_notas",
          },
        )
      }

      await swal({
        title: "¡Éxito!",
        text: `Notas del equipo #${equipoSeleccionado.id} actualizadas`,
        icon: "success",
      })

      await logAction("Actualizar Notas", `Notas del equipo #${equipoSeleccionado.id} actualizadas`)
    } catch (error) {
      console.error("Error al actualizar las notas:", error)
      await swal({
        title: "Error",
        text: "Ha ocurrido un error al actualizar las notas.",
        icon: "error",
      })
      await logAction("Error", `Error al actualizar las notas del equipo #${equipoSeleccionado.id}: ${error}`)
    }
  }

  const formatearFecha = (fechaISO: string) => {
    try {
      const fecha = new Date(fechaISO)
      return fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString()
    } catch (error) {
      return "Fecha desconocida"
    }
  }

  const enviarReporteGoogle = async (equipo: Equipo, razon: string, usuario = "Laboratorista") => {
    try {
      setEnviandoReporte(true)

      const datosReporte = {
        equipoId: equipo.id,
        accion: "deshabilitado",
        fecha: new Date().toLocaleString("es-MX"),
        usuario: usuario,
        razonDeshabilitacion: razon,
        notasEquipo: equipo.notas || "Sin notas adicionales",
        estadoAnterior: "En servicio",
        estadoNuevo: "Fuera de servicio",
        correoDestino: "sistemas@universidad.edu", // Cambiar por el correo real
        asunto: `REPORTE URGENTE - Equipo ${equipo.id} Fuera de Servicio`,
        mensaje: `
REPORTE AUTOMÁTICO DE EQUIPO DESHABILITADO

═══════════════════════════════════════════════════════════════
INFORMACIÓN DEL EQUIPO
═══════════════════════════════════════════════════════════════
• Equipo ID: ${equipo.id}
• Fecha y hora: ${new Date().toLocaleString("es-MX")}
• Usuario responsable: ${usuario}
• Estado anterior: En servicio
• Estado nuevo: Fuera de servicio

═══════════════════════════════════════════════════════════════
RAZÓN DE LA DESHABILITACIÓN
═══════════════════════════════════════════════════════════════
${razon}

═══════════════════════════════════════════════════════════════
NOTAS ADICIONALES DEL EQUIPO
═══════════════════════════════════════════════════════════════
${equipo.notas || "Sin notas adicionales"}

═══════════════════════════════════════════════════════════════
ACCIONES REQUERIDAS
═══════════════════════════════════════════════════════════════
1. Revisar físicamente el equipo ${equipo.id}
2. Diagnosticar el problema reportado: "${razon}"
3. Realizar las reparaciones necesarias
4. Notificar al laboratorio cuando esté listo para reactivación
5. Actualizar el estado en el sistema una vez reparado

⚠️  ATENCIÓN: Este equipo NO debe ser utilizado hasta completar la revisión técnica.

═══════════════════════════════════════════════════════════════
Sistema de Gestión de Laboratorio - Reporte Automático
Generado el: ${new Date().toLocaleString("es-MX")}
═══════════════════════════════════════════════════════════════
      `,
      }

      // URL del Google Apps Script Web App (debes crear uno y reemplazar esta URL)
      const googleScriptURL = "https://script.google.com/macros/s/TU_SCRIPT_ID/exec"

      const response = await fetch(googleScriptURL, {
        method: "POST",
        mode: "no-cors", // Necesario para Google Apps Script
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosReporte),
      })

      console.log("Reporte enviado exitosamente al departamento de sistemas")
      await logAction("Envío de Reporte", `Reporte de equipo ${equipo.id} deshabilitado enviado por correo`)

      toast({
        title: "Reporte enviado",
        description: `Se ha notificado al departamento de sistemas sobre el equipo ${equipo.id}`,
        variant: "default",
      })

      return true
    } catch (error) {
      console.error("Error al enviar el reporte por correo:", error)
      await logAction("Error de Reporte", `Error al enviar reporte de equipo ${equipo.id}: ${error}`)

      toast({
        title: "Error al enviar reporte",
        description: "No se pudo enviar el reporte al departamento de sistemas. El cambio se guardó correctamente.",
        variant: "destructive",
      })

      return false
    } finally {
      setEnviandoReporte(false)
    }
  }

  const iniciarDeshabilitacion = (id: string) => {
    const equipo = equipos.find((e) => e.id === id)
    if (!equipo) return

    if (equipo.fueraDeServicio) {
      // Si está fuera de servicio, reactivar directamente
      reactivarEquipo(id)
    } else {
      // Si está en servicio, abrir diálogo para deshabilitar
      setEquipoADeshabilitar(equipo)
      setRazonDeshabilitacion("")
      setDialogoDeshabilitarAbierto(true)
    }
  }

  const confirmarDeshabilitacion = async () => {
    if (!equipoADeshabilitar || !razonDeshabilitacion.trim()) {
      toast({
        title: "Información requerida",
        description: "Por favor, especifique la razón de la deshabilitación",
        variant: "destructive",
      })
      return
    }

    try {
      const equiposActualizados = equipos.map((equipo) =>
        equipo.id === equipoADeshabilitar.id
          ? {
              ...equipo,
              fueraDeServicio: true,
              ultimaActualizacion: new Date().toISOString(),
              notas: equipo.notas
                ? `${equipo.notas}\n\n[${new Date().toLocaleString("es-MX")}] Deshabilitado: ${razonDeshabilitacion}`
                : `[${new Date().toLocaleString("es-MX")}] Deshabilitado: ${razonDeshabilitacion}`,
              estadoReparacion: "reportado", // Estado inicial
              fechaActualizacionEstado: new Date().toISOString(),
            }
          : equipo,
      )

      await updateDoc(doc(db, "Numero de equipos", "equipos"), {
        Equipos: equiposActualizados,
      })

      // Crear notificación DETALLADA para el administrador con estado inicial "reportado"
      const notificacionId = await crearNotificacionAdmin(
        "equipo",
        `🚨EQUIPO #${equipoADeshabilitar.id} FUERA DE SERVICIO`,
        `URGENTE: El equipo #${equipoADeshabilitar.id} ha sido deshabilitado y requiere atención inmediata del departamento de sistemas. Se ha enviado un reporte automático por correo.`,
        "alta",
        {
          equipoId: equipoADeshabilitar.id,
          razon: razonDeshabilitacion,
          fechaDeshabilitacion: new Date().toLocaleString("es-MX"),
          estadoAnterior: "En servicio",
          estadoNuevo: "Fuera de servicio",
          notasAnteriores: equipoADeshabilitar.notas || "Sin notas previas",
          requiereAtencion: true,
          reporteEnviado: true,
          accion: "deshabilitar_equipo",
        },
      )

      // Actualizar el equipo con el ID de la notificación
      if (notificacionId) {
        const equiposConNotificacion = equiposActualizados.map((equipo) =>
          equipo.id === equipoADeshabilitar.id
            ? {
                ...equipo,
                notificacionAdminId: notificacionId,
              }
            : equipo,
        )

        await updateDoc(doc(db, "Numero de equipos", "equipos"), {
          Equipos: equiposConNotificacion,
        })

        setEquipos(equiposConNotificacion)
      } else {
        setEquipos(equiposActualizados)
      }

      // Enviar reporte por correo
      await enviarReporteGoogle(equipoADeshabilitar, razonDeshabilitacion)

      setDialogoDeshabilitarAbierto(false)
      setEquipoADeshabilitar(null)
      setRazonDeshabilitacion("")

      await swal({
        title: "¡Equipo Deshabilitado!",
        text: `El equipo #${equipoADeshabilitar.id} ha sido marcado como fuera de servicio y se ha enviado un reporte al departamento de sistemas.`,
        icon: "success",
      })

      await logAction(
        "Deshabilitar Equipo",
        `Equipo #${equipoADeshabilitar.id} deshabilitado. Razón: ${razonDeshabilitacion}`,
      )
    } catch (error) {
      console.error("Error al deshabilitar el equipo:", error)
      await swal({
        title: "Error",
        text: "Ha ocurrido un error al deshabilitar el equipo.",
        icon: "error",
      })
      await logAction("Error", `Error al deshabilitar el equipo #${equipoADeshabilitar.id}: ${error}`)
    }
  }

  const reactivarEquipo = async (id: string) => {
    try {
      const equipoAnterior = equipos.find((e) => e.id === id)

      const equiposActualizados = equipos.map((equipo) =>
        equipo.id === id
          ? {
              ...equipo,
              fueraDeServicio: false,
              ultimaActualizacion: new Date().toISOString(),
              notas: equipo.notas
                ? `${equipo.notas}\n\n[${new Date().toLocaleString("es-MX")}] Reactivado y disponible para uso`
                : `[${new Date().toLocaleString("es-MX")}] Reactivado y disponible para uso`,
              estadoReparacion: "resuelto", // Marcar como resuelto al reactivar
              fechaActualizacionEstado: new Date().toISOString(),
              comentarioEstado: "Equipo reactivado y disponible para uso",
            }
          : equipo,
      )

      await updateDoc(doc(db, "Numero de equipos", "equipos"), {
        Equipos: equiposActualizados,
      })

      setEquipos(equiposActualizados)

      // Si hay una notificación asociada, actualizar su estado
      if (equipoAnterior?.notificacionAdminId) {
        await actualizarEstadoNotificacionAdmin(
          equipoAnterior.notificacionAdminId,
          "resuelto",
          "Equipo reactivado y disponible para uso",
        )
      }

      // Crear notificación DETALLADA para el administrador
      await crearNotificacionAdmin(
        "equipo",
        `✅ Equipo #${id} Reactivado y Disponible`,
        `El equipo #${id} ha sido reactivado exitosamente y está disponible para uso nuevamente. El problema anterior ha sido resuelto.`,
        "baja",
        {
          equipoId: id,
          accion: "reactivar_equipo",
          fecha: new Date().toLocaleString("es-MX"),
          estadoAnterior: "Fuera de servicio",
          estadoNuevo: "En servicio",
          notasAnteriores: equipoAnterior?.notas || "Sin notas previas",
          disponibleParaUso: true,
        },
      )

      await swal({
        title: "¡Éxito!",
        text: `El equipo #${id} ha sido reactivado y está disponible para uso.`,
        icon: "success",
      })

      await logAction("Reactivar Equipo", `Equipo #${id} reactivado y disponible para uso`)
    } catch (error) {
      console.error("Error al reactivar el equipo:", error)
      await swal({
        title: "Error",
        text: "Ha ocurrido un error al reactivar el equipo.",
        icon: "error",
      })
      await logAction("Error", `Error al reactivar el equipo #${id}: ${error}`)
    }
  }

  // Función para abrir el diálogo de cambio de estado
  const abrirDialogoEstado = (equipo: Equipo) => {
    setEquipoParaEstado(equipo)
    setNuevoEstado(equipo.estadoReparacion || "reportado")
    setComentarioEstado(equipo.comentarioEstado || "")
    setDialogoEstadoAbierto(true)
  }

  // Función para actualizar el estado de reparación
  const actualizarEstadoReparacion = async () => {
    if (!equipoParaEstado) return

    try {
      const equiposActualizados = equipos.map((equipo) =>
        equipo.id === equipoParaEstado.id
          ? {
              ...equipo,
              estadoReparacion: nuevoEstado,
              fechaActualizacionEstado: new Date().toISOString(),
              ...(comentarioEstado.trim() && { comentarioEstado: comentarioEstado.trim() }),
              ultimaActualizacion: new Date().toISOString(),
            }
          : equipo,
      )

      await updateDoc(doc(db, "Numero de equipos", "equipos"), {
        Equipos: equiposActualizados,
      })

      setEquipos(equiposActualizados)

      // Actualizar la notificación del administrador si existe
      if (equipoParaEstado.notificacionAdminId) {
        await actualizarEstadoNotificacionAdmin(
          equipoParaEstado.notificacionAdminId,
          nuevoEstado,
          comentarioEstado.trim() || undefined,
        )
      }

      setDialogoEstadoAbierto(false)
      setEquipoParaEstado(null)
      setComentarioEstado("")

      await logAction(
        "Actualizar Estado Reparación",
        `Estado del equipo #${equipoParaEstado.id} cambiado a "${estadosEquipo[nuevoEstado].label}"`,
      )

      await swal({
        title: "¡Estado actualizado!",
        text: `El estado del equipo #${equipoParaEstado.id} se ha cambiado a "${estadosEquipo[nuevoEstado].label}"`,
        icon: "success",
      })
    } catch (error) {
      console.error("Error al actualizar estado de reparación:", error)
      await swal({
        title: "Error",
        text: "Ha ocurrido un error al actualizar el estado del equipo.",
        icon: "error",
      })
      await logAction("Error", `Error al actualizar estado del equipo #${equipoParaEstado.id}: ${error}`)
    }
  }

  const obtenerEstadisticas = () => {
    const total = equipos.length
    const enServicio = equipos.filter((e) => !e.fueraDeServicio).length
    const fueraDeServicio = equipos.filter((e) => e.fueraDeServicio).length
    const enUso = equipos.filter((e) => e.enUso).length

    return { total, enServicio, fueraDeServicio, enUso }
  }

  const estadisticas = obtenerEstadisticas()

  return (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
              Total de Equipos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {estadisticas.total}
              </div>
              <Laptop className={`h-5 w-5 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
            </div>
            <p className={`text-xs mt-1 ${esModoOscuro ? "text-gray-300" : "text-[#74726f]"}`}>
              Equipos registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
              En Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {estadisticas.enServicio}
              </div>
              <CheckCircle className={`h-5 w-5 ${esModoOscuro ? "text-[#2a7a45]" : "text-green-600"}`} />
            </div>
            <p className={`text-xs mt-1 ${esModoOscuro ? "text-gray-300" : "text-[#74726f]"}`}>
              Equipos disponibles para uso
            </p>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
              Fuera de Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {estadisticas.fueraDeServicio}
              </div>
              <AlertCircle className={`h-5 w-5 ${esModoOscuro ? "text-amber-400" : "text-amber-500"}`} />
            </div>
            <p className={`text-xs mt-1 ${esModoOscuro ? "text-gray-300" : "text-[#74726f]"}`}>
              Equipos no disponibles
            </p>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
              En Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {estadisticas.enUso}
              </div>
              <Settings className={`h-5 w-5 ${esModoOscuro ? "text-blue-400" : "text-blue-500"}`} />
            </div>
            <p className={`text-xs mt-1 ${esModoOscuro ? "text-gray-300" : "text-[#74726f]"}`}>
              Equipos siendo utilizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y acciones */}
      <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
        <CardHeader className={esModoOscuro ? modoColor.headerBackground : modoColor.headerBackground}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white">Gestión de Equipos</CardTitle>
            <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 text-white hover:bg-white/30">
                  <Plus className="mr-2 h-4 w-4" /> Agregar Equipos
                </Button>
              </DialogTrigger>
              <DialogContent className={esModoOscuro ? "bg-[#1d5631]/20 text-white" : "bg-white"}>
                <DialogHeader>
                  <DialogTitle className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                    Agregar Nuevos Equipos
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={agregarEquipos} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cantidadEquipos" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                      Cantidad de Equipos
                    </Label>
                    <Input
                      id="cantidadEquipos"
                      type="number"
                      value={cantidadEquipos}
                      onChange={(e) => setCantidadEquipos(e.target.value)}
                      placeholder="Ingrese la cantidad de equipos"
                      required
                      className={`${esModoOscuro ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white" : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"}`}
                    />
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        Esta acción reemplazará todos los equipos existentes. Los datos actuales se perderán.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogoAbierto(false)}
                      className={
                        esModoOscuro
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className={esModoOscuro ? colors.dark.buttonPrimary : colors.light.buttonPrimary}
                    >
                      Agregar Equipos
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription className="text-white/80">
            Administre los equipos del laboratorio, cambie su estado y agregue notas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="busqueda" className={`block mb-2 ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                Buscar Equipo
              </Label>
              <div className="relative">
                <Input
                  id="busqueda"
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por ID o notas..."
                  className={`${esModoOscuro ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white" : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"} pl-10`}
                />
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="filtro" className={`block mb-2 ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                Filtrar por Estado
              </Label>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full grid-cols-4 ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-[#fff0f5]"}`}>
                  <TabsTrigger
                    value="todos"
                    onClick={() => setFiltro("todos")}
                    className={`text-xs py-1 ${
                      esModoOscuro
                        ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                        : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                    }`}
                  >
                    Todos
                  </TabsTrigger>
                  <TabsTrigger
                    value="enServicio"
                    onClick={() => setFiltro("enServicio")}
                    className={`text-xs py-1 ${
                      esModoOscuro
                        ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                        : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                    }`}
                  >
                    En Servicio
                  </TabsTrigger>
                  <TabsTrigger
                    value="fueraDeServicio"
                    onClick={() => setFiltro("fueraDeServicio")}
                    className={`text-xs py-1 ${
                      esModoOscuro
                        ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                        : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                    }`}
                  >
                    Fuera de Servicio
                  </TabsTrigger>
                  <TabsTrigger
                    value="enUso"
                    onClick={() => setFiltro("enUso")}
                    className={`text-xs py-1 ${
                      esModoOscuro
                        ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                        : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                    }`}
                  >
                    En Uso
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-end">
              <Button
                onClick={cargarEquipos}
                className={`${esModoOscuro ? colors.dark.buttonTertiary : colors.light.buttonTertiary}`}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/*Tabla de equipos */}
      <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
        <CardHeader className={`pb-2 ${esModoOscuro ? "border-b border-gray-700" : "border-b"}`}>
          <div className="flex justify-between items-center">
            <CardTitle className={`flex items-center ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
              <Laptop className="w-5 h-5 mr-2" />
              Lista de Equipos
            </CardTitle>
            <Badge className={esModoOscuro ? "bg-[#1d5631] text-white" : "bg-[#800040] text-white"}>
              {equiposFiltrados.length} equipos
            </Badge>
          </div>
          <CardDescription className={esModoOscuro ? "text-gray-300" : "text-[#800040]/80"}>
            {filtro === "todos"
              ? "Mostrando todos los equipos"
              : filtro === "enServicio"
                ? "Mostrando equipos en servicio"
                : filtro === "fueraDeServicio"
                  ? "Mostrando equipos fuera de servicio"
                  : "Mostrando equipos en uso"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {cargando ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : equiposFiltrados.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow
                    className={esModoOscuro ? "bg-[#1d5631]/40 border-gray-700" : "bg-[#fff0f5] border-gray-200"}
                  >
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">En Uso</TableHead>
                    <TableHead className="font-semibold">Estado Reparación</TableHead>
                    <TableHead className="font-semibold">Última Actualización</TableHead>
                    <TableHead className="font-semibold">Notas</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {equiposFiltrados.map((equipo) => (
                      <motion.tr
                        key={equipo.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={`${
                          esModoOscuro
                            ? "hover:bg-[#1d5631]/40 border-b border-gray-700"
                            : "hover:bg-[#fff0f5] border-b border-gray-200"
                        }`}
                      >
                        <TableCell className="font-medium">{equipo.id}</TableCell>
                        <TableCell>
                          {equipo.fueraDeServicio ? (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30"
                            >
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Fuera de Servicio
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              En Servicio
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {equipo.enUso ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30"
                            >
                              <Settings className="mr-1 h-3 w-3 animate-spin-slow" />
                              En Uso
                            </Badge>
                          ) : (
                            <span className={esModoOscuro ? "text-gray-400" : "text-gray-500"}>No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {equipo.estadoReparacion ? (
                            <Badge
                              variant="outline"
                              className={`${
                                equipo.estadoReparacion === "resuelto"
                                  ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30"
                                  : equipo.estadoReparacion === "en_proceso"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30"
                                    : "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30"
                              }`}
                            >
                              {estadosEquipo[equipo.estadoReparacion].icon}
                              <span className="ml-1">{estadosEquipo[equipo.estadoReparacion].label}</span>
                            </Badge>
                          ) : (
                            <span className={esModoOscuro ? "text-gray-400" : "text-gray-500"}>-</span>
                          )}
                        </TableCell>
                        <TableCell className={esModoOscuro ? "text-gray-300" : "text-gray-700"}>
                          {equipo.ultimaActualizacion ? formatearFecha(equipo.ultimaActualizacion) : "N/A"}
                        </TableCell>
                        <TableCell>
                          {equipo.notas ? (
                            <div className="max-w-xs truncate">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`cursor-help ${esModoOscuro ? "text-gray-300" : "text-gray-700"}`}>
                                      {equipo.notas}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{equipo.notas}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          ) : (
                            <span className={esModoOscuro ? "text-gray-400" : "text-gray-500"}>Sin notas</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => abrirDialogoNotas(equipo)}
                                    className={esModoOscuro ? "hover:bg-[#1d5631]/30" : "hover:bg-[#fff0f5]"}
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Agregar/Editar Notas</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Botón para cambiar estado de reparación (solo si está fuera de servicio) */}
                            {equipo.fueraDeServicio && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => abrirDialogoEstado(equipo)}
                                      className={`${
                                        esModoOscuro
                                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                                          : "bg-blue-600 hover:bg-blue-700 text-white"
                                      }`}
                                    >
                                      <Activity className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Actualizar Estado de Reparación</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            <Button
                              size="sm"
                              variant={equipo.fueraDeServicio ? "default" : "destructive"}
                              onClick={() => iniciarDeshabilitacion(equipo.id)}
                              className={
                                equipo.fueraDeServicio
                                  ? esModoOscuro
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                                  : esModoOscuro
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                              }
                            >
                              {equipo.fueraDeServicio ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Activar
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Desactivar
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <HelpCircle className={`h-12 w-12 mb-4 ${esModoOscuro ? "text-gray-500" : "text-gray-400"}`} />
                <p className={`text-lg font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                  No se encontraron equipos
                </p>
                <p className={`text-sm ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                  {busqueda
                    ? "No hay equipos que coincidan con tu búsqueda"
                    : filtro !== "todos"
                      ? `No hay equipos con el estado "${filtro === "enServicio" ? "en servicio" : filtro === "fueraDeServicio" ? "fuera de servicio" : "en uso"}"`
                      : "Agrega equipos para comenzar"}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className={`p-4 ${esModoOscuro ? "border-t border-gray-700" : "border-t"}`}>
          <div className="flex justify-between items-center w-full">
            <p className={`text-sm ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
              Mostrando {equiposFiltrados.length} de {equipos.length} equipos
            </p>
            <Button
              onClick={() => setDialogoAbierto(true)}
              className={esModoOscuro ? colors.dark.buttonPrimary : colors.light.buttonPrimary}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Equipos
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo para agregar/editar notas */}
      <Dialog open={dialogoNotasAbierto} onOpenChange={setDialogoNotasAbierto}>
        <DialogContent className={esModoOscuro ? "bg-[#1d5631]/20 text-white" : "bg-white"}>
          <DialogHeader>
            <DialogTitle className={esModoOscuro ? "text-white" : "text-[#800040]"}>
              {equipoSeleccionado ? `Notas para Equipo ${equipoSeleccionado.id}` : "Notas"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notas" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                Agregar o editar notas
              </Label>
              <textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Escriba notas sobre el estado o problemas del equipo..."
                className={`w-full h-32 p-2 rounded-md ${
                  esModoOscuro
                    ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                    : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                }`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogoNotasAbierto(false)}
              className={
                esModoOscuro
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={guardarNotas}
              className={esModoOscuro ? colors.dark.buttonPrimary : colors.light.buttonPrimary}
            >
              Guardar Notas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para deshabilitar equipo */}
      <Dialog open={dialogoDeshabilitarAbierto} onOpenChange={setDialogoDeshabilitarAbierto}>
        <DialogContent className={esModoOscuro ? "bg-[#1d5631]/20 text-white" : "bg-white"}>
          <DialogHeader>
            <DialogTitle className={esModoOscuro ? "text-white" : "text-[#800040]"}>
              Deshabilitar Equipo {equipoADeshabilitar?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    ¡Atención! Este equipo será marcado como fuera de servicio
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    Se enviará automáticamente un reporte al departamento de sistemas
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="razonDeshabilitacion" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                Razón de la deshabilitación *
              </Label>
              <textarea
                id="razonDeshabilitacion"
                value={razonDeshabilitacion}
                onChange={(e) => setRazonDeshabilitacion(e.target.value)}
                placeholder="Especifique detalladamente la razón por la cual se deshabilita el equipo (ej: Pantalla dañada, no enciende, problemas de conectividad, etc.)"
                className={`w-full h-32 p-2 rounded-md border ${
                  esModoOscuro
                    ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                    : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                }`}
                required
              />
              <p className={`text-xs ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                Esta información será incluida en el reporte enviado al departamento de sistemas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogoDeshabilitarAbierto(false)
                setEquipoADeshabilitar(null)
                setRazonDeshabilitacion("")
              }}
              className={
                esModoOscuro
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmarDeshabilitacion}
              disabled={enviandoReporte || !razonDeshabilitacion.trim()}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {enviandoReporte ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Enviando Reporte...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Deshabilitar Equipo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para cambiar estado de reparación */}
      <Dialog open={dialogoEstadoAbierto} onOpenChange={setDialogoEstadoAbierto}>
        <DialogContent className={`${esModoOscuro ? "bg-[#1d5631]/20 text-white" : "bg-white"} max-w-md`}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Actualizar Estado de Reparación</span>
            </DialogTitle>
          </DialogHeader>

          {equipoParaEstado && (
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${esModoOscuro ? "bg-[#3a3a3a]" : "bg-gray-50"}`}>
                <h4 className="font-medium mb-2">Información del Equipo:</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Equipo:</span> #{equipoParaEstado.id}
                  </p>
                  <p>
                    <span className="font-medium">Estado actual:</span>{" "}
                    {equipoParaEstado.estadoReparacion
                      ? estadosEquipo[equipoParaEstado.estadoReparacion].label
                      : "Sin estado"}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="estado">Nuevo Estado *</Label>
                <Select value={nuevoEstado} onValueChange={(value: any) => setNuevoEstado(value)}>
                  <SelectTrigger className={esModoOscuro ? "bg-[#3a3a3a] border-gray-600" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={esModoOscuro ? "bg-[#3a3a3a] text-white" : ""}>
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
                  placeholder="Agregar detalles sobre el progreso de la reparación..."
                  className={esModoOscuro ? "bg-[#3a3a3a] border-gray-600" : ""}
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => setDialogoEstadoAbierto(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={actualizarEstadoReparacion}
                  className={`flex-1 ${esModoOscuro ? colors.dark.buttonPrimary : colors.light.buttonPrimary}`}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
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
