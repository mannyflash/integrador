"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
  getDoc,
  getDocs,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  LogOut,
  User,
  Moon,
  Sun,
  BookOpen,
  ClipboardList,
  Clock,
  Calendar,
  Users,
  FileText,
  FilePlus2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import swal from "sweetalert"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { motion, AnimatePresence } from "framer-motion"
import { getTheme, toggleTheme, applyTheme, type Theme } from "../lib/theme"
import { logAction } from "../lib/logging"
import * as XLSX from "xlsx"
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}
const firebaseConfig = {
  apiKey: "AIzaSyCX5WX8tTkWRsIikpV3-pTXIsYUXfF5Eqk",
  authDomain: "integrador-7b39d.firebaseapp.com",
  projectId: "integrador-7b39d",
  storageBucket: "integrador-7b39d.appspot.com",
  messagingSenderId: "780966021686",
  appId: "1:780966021686:web:485712fb7509339c6ae697",
  measurementId: "G-FGB03PFM7Z",
}
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

interface Asistencia {
  id: string
  AlumnoId: string
  Apellido: string
  Equipo: string
  Nombre: string
  Carrera: string
  Grupo: string
  Semestre: string
  Turno: string
  Fecha?: string
  collection?: string
}

interface Docente {
  Nombre: string
  Apellido: string
}

interface Equipment {
  id: string
  fueraDeServicio: boolean
  enUso: boolean
}

// Modificar la definición de colores para intercambiar los colores principales
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

export default function ListaAsistenciasInvitado() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [contador, setContador] = useState(0)
  const [claseIniciada, setClaseIniciada] = useState(false)
  const [maestroInfo, setMaestroInfo] = useState<Docente | null>(null)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setThemeState] = useState<Theme>(getTheme())
  const [horaInicio, setHoraInicio] = useState<string | null>(null)
  const [horaFin, setHoraFin] = useState<string | null>(null)
  const [claseInfo, setClaseInfo] = useState<any>(null)

  // Función para verificar si hay una clase activa y recuperar su información
  const verificarClaseActiva = useCallback(async () => {
    try {
      const estadoRef = doc(db, "EstadoClaseInvitado", "actual")
      const estadoDoc = await getDoc(estadoRef)

      if (estadoDoc.exists() && estadoDoc.data().iniciada === true) {
        // Hay una clase activa, recuperar la información
        const estadoData = estadoDoc.data()

        // Actualizar el estado de clase iniciada
        setClaseIniciada(true)
        setHoraInicio(estadoData.HoraInicio || null)

        // Si hay información de clase almacenada, usarla
        const storedClaseInfo = localStorage.getItem("claseInfo")
        if (storedClaseInfo) {
          setClaseInfo(JSON.parse(storedClaseInfo))
        } else {
          // Si no hay información almacenada, crear un objeto con la información disponible
          setClaseInfo({
            nombreCompletoDocente: estadoData.MaestroInvitado || "Docente Invitado",
            materia: estadoData.Materia || "No especificada",
            practica: estadoData.Practica || "No especificada",
            departamento: estadoData.Departamento || "No especificado",
          })
        }

        console.log("Se recuperó la información de la clase invitada activa")
        return true
      }
      return false
    } catch (error) {
      console.error("Error al verificar clase invitada activa:", error)
      return false
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const storedClaseInfo = localStorage.getItem("claseInfo")

      if (!storedClaseInfo) {
        await swal({
          title: "Información de clase faltante",
          text: "Por favor, inicie una clase nuevamente.",
          icon: "warning",
        })
        router.push("/panel-laboratorista")
        return
      }

      const parsedClaseInfo = JSON.parse(storedClaseInfo)
      setClaseInfo(parsedClaseInfo)

      setMaestroInfo({
        Nombre: parsedClaseInfo.nombreCompletoDocente.split(" ")[0],
        Apellido: parsedClaseInfo.nombreCompletoDocente.split(" ")[1] || "",
      })

      // Verificar si hay una clase activa
      await verificarClaseActiva()

      // Update the query to only get relevant attendance records
      const unsubscribeAsistencias = onSnapshot(collection(db, "AsistenciasInvitado"), (snapshot) => {
        const nuevosEstudiantes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          collection: "AsistenciasInvitado",
        })) as Asistencia[]

        // Sort students by their names
        const sortedEstudiantes = nuevosEstudiantes.sort((a, b) =>
          `${a.Apellido} ${a.Nombre}`.localeCompare(`${b.Apellido} ${b.Nombre}`),
        )

        setAsistencias(sortedEstudiantes)
        console.log("Asistencias actualizadas:", sortedEstudiantes)
        setContador(sortedEstudiantes.length)
      })

      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1500)

      return () => {
        unsubscribeAsistencias()
        clearTimeout(timer)
      }
    }

    checkAuth()
  }, [router, verificarClaseActiva])

  // Añadir este efecto para manejar el cierre de la ventana o navegación
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      // Si hay una clase iniciada, finalizarla automáticamente
      if (claseIniciada) {
        // Guardar la información de la clase para usarla en el cierre
        const claseInfoActual = claseInfo
        const horaInicioActual = horaInicio
        const asistenciasActuales = asistencias

        // Finalizar la clase automáticamente
        const horaActual = new Date().toLocaleTimeString()

        try {
          const estadoRef = doc(db, "EstadoClaseInvitado", "actual")

          // Guardar en historial
          const historicalRef = collection(db, "HistoricalAttendance")
          await addDoc(historicalRef, {
            practica: claseInfoActual?.practica || "Clase finalizada automáticamente",
            materia: claseInfoActual?.materia || "No especificada",
            departamento: claseInfoActual?.departamento || "No especificado",
            fecha: serverTimestamp(),
            horaInicio: horaInicioActual,
            horaFin: horaActual,
            asistencias: asistenciasActuales,
            maestroNombre: claseInfoActual?.nombreCompletoDocente || "Docente Invitado",
            tipoClase: "invitado",
            finalizadaAutomaticamente: true,
          })

          // Limpiar el documento "actual"
          await setDoc(estadoRef, {
            iniciada: false,
            horaFin: horaActual,
            finalizadaAutomaticamente: true,
          })

          // Guardar información de la clase
          const classInfoRef = collection(db, "ClassInformation")
          await addDoc(classInfoRef, {
            materia: claseInfoActual?.materia || "No especificada",
            practica: claseInfoActual?.practica || "Clase finalizada automáticamente",
            departamento: claseInfoActual?.departamento || "No especificado",
            fecha: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }),
            totalAsistencias: asistenciasActuales.length,
            maestroNombre: claseInfoActual?.nombreCompletoDocente || "Docente Invitado",
            horaInicio: horaInicioActual,
            horaFin: horaActual,
            tipoClase: "invitado",
            finalizadaAutomaticamente: true,
            alumnos: asistenciasActuales.map((a) => ({
              id: a.AlumnoId,
              nombre: a.Nombre,
              apellido: a.Apellido,
              equipo: a.Equipo,
              carrera: a.Carrera || "Externo",
              grupo: a.Grupo || "Externo",
              semestre: a.Semestre || "Externo",
              turno: a.Turno || "Externo",
            })),
          })

          // Eliminar todas las asistencias
          try {
            const asistenciasSnapshot = await getDocs(collection(db, "AsistenciasInvitado"))

            if (!asistenciasSnapshot.empty) {
              const batch = writeBatch(db)

              asistenciasSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref)
              })

              await batch.commit()
              console.log(`Se eliminaron ${asistenciasSnapshot.docs.length} registros de asistencias automáticamente`)
              await logAction(
                "Finalizar Clase Invitado Automáticamente",
                `Se eliminaron ${asistenciasSnapshot.docs.length} registros de asistencias automáticamente`,
              )
            }
          } catch (error) {
            console.error("Error al eliminar asistencias automáticamente:", error)
            await logAction("Error", `Error al eliminar asistencias automáticamente: ${error}`)
          }

          // Resetear el estado de los equipos
          await resetEquiposEnUso()

          // Registrar la acción en el log
          await logAction(
            "Finalizar Clase Invitado Automáticamente",
            `Clase invitada finalizada automáticamente para ${claseInfoActual?.practica || "No especificada"} a las ${horaActual} debido al cierre del navegador.`,
          )

          // Eliminar la información de clase del localStorage
          localStorage.removeItem("claseInfo")
        } catch (error) {
          console.error("Error al finalizar la clase automáticamente:", error)
        }
      }
    }

    // Registrar el evento beforeunload
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Limpiar el evento cuando el componente se desmonte
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [claseIniciada, claseInfo, horaInicio, asistencias])

  useEffect(() => {
    const checkClaseStatus = async () => {
      const estadoRef = doc(db, "EstadoClaseInvitado", "actual")
      const estadoDoc = await getDoc(estadoRef)
      if (estadoDoc.exists()) {
        const estadoData = estadoDoc.data()
        setClaseIniciada(estadoData.iniciada || false)
        if (estadoData.iniciada) {
          setHoraInicio(estadoData.HoraInicio || null)
        }
      }
    }
    checkClaseStatus()
  }, [])

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark")
    applyTheme(theme)
  }, [theme])

  const limpiarCampos = useCallback(() => {
    setAsistencias([])
    setContador(0)
    setClaseIniciada(false)
    setHoraInicio(null)
    setHoraFin(null)
  }, [])

  // Función para resetear el estado "enUso" de todos los equipos
  const resetEquiposEnUso = async () => {
    try {
      const equipoRef = doc(db, "Numero de equipos", "equipos")
      const equipoDoc = await getDoc(equipoRef)

      if (equipoDoc.exists()) {
        const equiposData = equipoDoc.data()
        const equiposActualizados = equiposData.Equipos.map((eq: Equipment) => ({
          ...eq,
          enUso: false,
        }))

        await setDoc(equipoRef, { Equipos: equiposActualizados })
        console.log("Estado de equipos restablecido")
        await logAction("Equipos", "Se han restablecido los estados de los equipos a 'no en uso'")
      }
    } catch (error) {
      console.error("Error al restablecer el estado de los equipos:", error)
      await logAction("Error", `Error al restablecer el estado de los equipos: ${error}`)
    }
  }

  const toggleClase = useCallback(async () => {
    if (!claseInfo) {
      await swal({
        title: "Error",
        text: "No hay información de clase disponible.",
        icon: "error",
      })
      return
    }

    const nuevoEstado = !claseIniciada
    const horaActual = new Date().toLocaleTimeString()
    try {
      const estadoRef = doc(db, "EstadoClaseInvitado", "actual")

      if (nuevoEstado) {
        // Iniciar clase
        await setDoc(estadoRef, {
          iniciada: true,
          MaestroInvitado: claseInfo.nombreCompletoDocente,
          Materia: claseInfo.materia,
          Practica: claseInfo.practica,
          Departamento: claseInfo.departamento,
          HoraInicio: horaActual,
          HoraFin: null,
        })

        setHoraInicio(horaActual)
        await swal({
          title: "Clase iniciada",
          text: `Los alumnos ahora pueden registrar su asistencia para la práctica: ${claseInfo.practica}. Hora de inicio: ${horaActual}`,
          icon: "success",
        })
        await logAction("Iniciar Clase Invitado", `Clase iniciada para ${claseInfo.practica} a las ${horaActual}`)
      } else {
        // Finalizar clase
        setHoraFin(horaActual)

        // Guardar en historial antes de borrar
        const historicalRef = collection(db, "HistoricalAttendance")
        await addDoc(historicalRef, {
          practica: claseInfo.practica,
          materia: claseInfo.materia,
          departamento: claseInfo.departamento,
          fecha: serverTimestamp(),
          horaInicio: horaInicio,
          horaFin: horaActual,
          asistencias: asistencias,
          maestroNombre: claseInfo.nombreCompletoDocente,
          tipoClase: "invitado",
        })

        // Limpiar el documento "actual"
        await setDoc(estadoRef, {
          iniciada: false,
          horaFin: horaActual,
        })

        // Eliminar todas las asistencias de la colección "AsistenciasInvitado"
        try {
          // Primero, obtener todas las asistencias actuales
          const asistenciasSnapshot = await getDocs(collection(db, "AsistenciasInvitado"))

          if (!asistenciasSnapshot.empty) {
            const batch = writeBatch(db)

            // Añadir cada documento al batch para eliminación
            asistenciasSnapshot.docs.forEach((doc) => {
              const asistenciaRef = doc.ref
              batch.delete(asistenciaRef)
            })

            // Ejecutar el batch
            await batch.commit()
            console.log(`Se eliminaron ${asistenciasSnapshot.docs.length} registros de asistencias invitado`)
            await logAction(
              "Finalizar Clase Invitado",
              `Se eliminaron ${asistenciasSnapshot.docs.length} registros de asistencias invitado`,
            )
          } else {
            console.log("No hay asistencias invitado para eliminar")
            await logAction("Finalizar Clase Invitado", "No había asistencias invitado para eliminar")
          }
        } catch (error) {
          console.error("Error al eliminar las asistencias invitado:", error)
          await logAction("Error", `Error al eliminar las asistencias invitado: ${error}`)

          // Intentar eliminar las asistencias una por una como fallback
          try {
            for (const asistencia of asistencias) {
              await deleteDoc(doc(db, "AsistenciasInvitado", asistencia.id))
            }
            console.log("Asistencias invitado eliminadas individualmente como fallback")
            await logAction("Finalizar Clase Invitado", "Asistencias invitado eliminadas individualmente como fallback")
          } catch (secondError) {
            console.error("Error en el fallback de eliminación de asistencias invitado:", secondError)
            await logAction("Error", `Error en el fallback de eliminación de asistencias invitado: ${secondError}`)
          }
        }

        const classInfoRef = collection(db, "ClassInformation")
        await addDoc(classInfoRef, {
          materia: claseInfo.materia,
          practica: claseInfo.practica,
          departamento: claseInfo.departamento,
          fecha: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }),
          totalAsistencias: asistencias.length,
          maestroId: claseInfo.maestroId,
          maestroNombre: claseInfo.nombreCompletoDocente,
          horaInicio: horaInicio,
          horaFin: horaActual,
          tipoClase: "invitado",
          alumnos: asistencias.map((a) => ({
            id: a.AlumnoId,
            nombre: a.Nombre,
            apellido: a.Apellido,
            equipo: a.Equipo,
            carrera: a.Carrera || "Externo",
            grupo: a.Grupo || "Externo",
            semestre: a.Semestre || "Externo",
            turno: a.Turno || "Externo",
          })),
        })

        // Resetear el estado "enUso" de todos los equipos cuando finaliza la clase
        await resetEquiposEnUso()

        // Limpiar campos y restablecer el estado
        limpiarCampos()

        await swal({
          title: "Clase finalizada",
          text: `Se ha cerrado el registro de asistencias y guardado el registro histórico y la información de la clase. Hora de fin: ${horaActual}`,
          icon: "success",
        })
        await logAction(
          "Finalizar Clase Invitado",
          `Clase finalizada para ${claseInfo.practica} a las ${horaActual}. Total de asistencias: ${asistencias.length}`,
        )
      }
      setClaseIniciada(nuevoEstado)
    } catch (error) {
      console.error("Error al cambiar el estado de la clase:", error)
      await swal({
        title: "Error",
        text: "No se pudo cambiar el estado de la clase.",
        icon: "error",
      })
      await logAction("Error", `Error al cambiar el estado de la clase invitada: ${error}`)
    }
  }, [claseIniciada, claseInfo, asistencias, horaInicio, limpiarCampos])

  const eliminarAsistencia = useCallback(async (id: string) => {
    const willDelete = await swal({
      title: "¿Esta seguro?",
      text: "Esta accion no se puede deshacer.",
      icon: "warning",
      buttons: ["Cancelar", "Aceptar"],
      dangerMode: true,
    })
    if (willDelete) {
      try {
        // Obtener la información de la asistencia antes de eliminarla
        const asistenciaRef = doc(db, "AsistenciasInvitado", id)
        const asistenciaDoc = await getDoc(asistenciaRef)

        if (asistenciaDoc.exists()) {
          const asistenciaData = asistenciaDoc.data() as Asistencia
          const equipoId = asistenciaData.Equipo

          // Si no es equipo personal, liberar el equipo (marcar como no en uso)
          if (equipoId !== "personal") {
            const equipoRef = doc(db, "Numero de equipos", "equipos")
            const equipoDoc = await getDoc(equipoRef)

            if (equipoDoc.exists()) {
              const equiposData = equipoDoc.data()
              const equiposActualizados = equiposData.Equipos.map((eq: Equipment) => {
                if (eq.id === equipoId) {
                  return { ...eq, enUso: false }
                }
                return eq
              })

              await setDoc(equipoRef, { Equipos: equiposActualizados })
              console.log(`Equipo ${equipoId} marcado como no en uso`)
              await logAction("Equipos", `Equipo ${equipoId} liberado al eliminar asistencia`)
            }
          }

          // Eliminar la asistencia
          await deleteDoc(asistenciaRef)
          await swal("Registro eliminado con exito", { icon: "success" })
          await logAction("Eliminar Asistencia", `Asistencia con ID ${id} eliminada`)
        }
      } catch (error) {
        await swal("Error al eliminar el registro", { icon: "error" })
        await logAction("Error", `Error al eliminar asistencia con ID ${id}: ${error}`)
      }
    }
  }, [])

  const exportarPDF = async () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 10

    // Add ITSPP logo in the upper left corner
    doc.addImage("/FondoItspp.png", "PNG", margin, margin, 25, 25)

    // Add header text centered
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0) // Black text color
    doc.text("TALLER DE PROGRAMACION", pageWidth / 2, margin + 10, { align: "center" })
    doc.setFontSize(14)
    doc.text("HOJA DE REGISTRO - CLASE INVITADA", pageWidth / 2, margin + 20, { align: "center" })

    // Form fields
    doc.setFontSize(10)
    const leftColX = margin
    const rightColX = pageWidth / 2 + margin
    let currentY = margin + 35

    // Left column
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, leftColX, currentY)
    doc.text(`GRUPO: ${claseInfo?.grupo || "Externo"}`, leftColX, currentY + 10)
    doc.text(`HORA: ${horaInicio || new Date().toLocaleTimeString()}`, leftColX, currentY + 20)
    doc.text(`MATERIA: ${claseInfo?.materia || ""}`, leftColX, currentY + 30)
    doc.text(`DOCENTE: ${claseInfo ? claseInfo.nombreCompletoDocente : ""}`, leftColX, currentY + 40)

    // Right column
    doc.text(`DEPARTAMENTO: ${claseInfo?.departamento || ""}`, rightColX, currentY)
    doc.text(`TIPO: Clase Invitada`, rightColX, currentY + 10)
    doc.text(`PRACTICA: ${claseInfo?.practica || ""}`, rightColX, currentY + 20)
    doc.text(`TOTAL ASISTENTES: ${asistencias.length}`, rightColX, currentY + 30)

    currentY += 60

    // Table
    const tableHeaders = ["#", "NOMBRE ALUMNO", "NUM. PC", "FIRMA"]
    const tableData = asistencias.map((asistencia, index) => [
      (index + 1).toString(),
      `${asistencia.Nombre} ${asistencia.Apellido}`,
      asistencia.Equipo,
      "",
    ])

    // Pad the table to have at least 25 rows
    const minRows = 25
    while (tableData.length < minRows) {
      tableData.push([(tableData.length + 1).toString(), "", "", ""])
    }

    let finalY = currentY
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: currentY,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 20 },
        3: { cellWidth: 30 },
      },
      didDrawPage: (data: {
        cursor: { y: number }
        pageNumber: number
        pageCount: number
        settings: {
          margin: { top: number; right: number; bottom: number; left: number }
          startY: number
          pageBreak: string
        }
        table: {
          widths: number[]
          heights: number[]
          body: any[][]
        }
      }) => {
        finalY = data.cursor.y
      },
    })

    const signatureY = finalY + 20

    // Signature lines
    doc.line(margin, signatureY, margin + 70, signatureY)
    doc.text("FIRMA DOCENTE", margin + 35, signatureY + 5, { align: "center" })

    doc.line(pageWidth - margin - 70, signatureY, pageWidth - margin, signatureY)
    doc.text("FIRMA ENCARGADO LABORATORIO", pageWidth - margin - 35, signatureY + 5, { align: "center" })

    doc.save("lista_asistencias_invitado.pdf")
    await logAction(
      "Exportar PDF",
      `PDF de asistencias exportado para ${claseInfo?.practica || "práctica no seleccionada"}`,
    )
  }

  const exportarAExcel = async () => {
    const workbook = XLSX.utils.book_new()

    // Create header data with logo and title
    const headerData = [
      ["INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO"],
      ["CONTROL DE ASISTENCIA - TALLER DE PROGRAMACIÓN - CLASE INVITADA"],
      [""],
      ["Información de la Clase"],
      ["Fecha:", new Date().toLocaleDateString(), "", "Departamento:", claseInfo?.departamento || "N/A"],
      ["Grupo:", claseInfo?.grupo || "Externo", "", "Materia:", claseInfo?.materia || "N/A"],
      ["Práctica:", claseInfo?.practica || "N/A", "", "Docente:", claseInfo?.nombreCompletoDocente || "N/A"],
      ["Hora Inicio:", horaInicio || "N/A", "", "Hora Fin:", horaFin || "N/A"],
      [""],
      ["Lista de Asistencia"],
      ["#", "ID Alumno", "Nombre", "Apellido", "Equipo"],
    ]

    // Add student data
    const studentData = asistencias.map((alumno, index) => [
      index + 1,
      alumno.AlumnoId,
      alumno.Nombre,
      alumno.Apellido,
      alumno.Equipo,
    ])

    // Combine header and student data
    const fullData = [...headerData, ...studentData]

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(fullData)

    // Set column widths
    const colWidths = [
      { wch: 5 }, // #
      { wch: 15 }, // ID
      { wch: 20 }, // Nombre
      { wch: 20 }, // Apellido
      { wch: 10 }, // Equipo
    ]
    worksheet["!cols"] = colWidths

    // Merge cells for titles
    worksheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Instituto
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Control de Asistencia
      { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } }, // Información de la Clase
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Control de Asistencia")

    // Generate statistics worksheet
    const statsData = [
      ["Estadísticas de Asistencia"],
      [""],
      ["Total de Alumnos:", asistencias.length],
      ["Fecha:", new Date().toLocaleDateString()],
      ["Práctica:", claseInfo?.practica || "N/A"],
      ["Materia:", claseInfo?.materia || "N/A"],
      ["Docente:", claseInfo?.nombreCompletoDocente || "N/A"],
    ]

    const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData)
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Estadísticas")

    // Save the file
    XLSX.writeFile(workbook, `control_asistencia_invitado_${new Date().toISOString().split("T")[0]}.xlsx`)
    await logAction(
      "Exportar Excel",
      `Se exportó el control de asistencia a Excel para la práctica ${claseInfo?.practica || "N/A"}`,
    )
  }

  const handleThemeToggle = () => {
    const newTheme = toggleTheme()
    setThemeState(newTheme)
  }

  const handleLogout = async () => {
    if (claseIniciada) {
      await swal({
        title: "No se puede cerrar sesión",
        text: "No puedes cerrar sesión mientras una clase está en progreso. Por favor, finaliza la clase primero.",
        icon: "warning",
      })
      return
    }

    const willLogout = await swal({
      title: "¿Está seguro?",
      text: "¿Desea cerrar la sesión?",
      icon: "warning",
      buttons: ["Cancelar", "Sí, cerrar sesión"],
      dangerMode: true,
    })

    if (willLogout) {
      localStorage.removeItem("claseInfo")
      await logAction(
        "Cerrar Sesión",
        `Sesión cerrada para ${claseInfo?.nombreCompletoDocente || "docente no especificado"}`,
      )
      router.push("/panel-laboratorista")
    }
  }

  if (isLoading) {
    return <Loader />
  }

  return (
    <div
      className={`flex min-h-screen w-full flex-col lg:flex-row ${
        theme === "dark" ? "bg-[#0c1f1a]" : "bg-[#f0fff4]"
      } transition-colors duration-300`}
    >
      <main className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
        {/* Botón de cambio de tema */}
        <button
          onClick={handleThemeToggle}
          className={`fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-300 ${
            theme === "dark"
              ? "bg-[#1C4A3F] text-white hover:bg-[#153731]"
              : "bg-[#1BB827] text-white hover:bg-[#18a423]"
          }`}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Encabezado de bienvenida */}
        <div className="mb-6">
          <Card
            className={`${theme === "dark" ? colors.dark.headerBackground : colors.light.headerBackground} border-none shadow-lg`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center space-x-4">
                <div className="p-2 rounded-full bg-white/20">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-white">
                    ¡Bienvenido, {claseInfo ? claseInfo.nombreCompletoDocente : "Docente Invitado"}!
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    Panel de Control de Asistencias - Clase Invitada
                  </CardDescription>
                </div>
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <div className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                  <Clock className="inline-block w-4 h-4 mr-1" />
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Panel principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Panel de configuración de clase */}
          <Card
            className={`lg:col-span-1 ${theme === "dark" ? colors.dark.cardBackground : colors.light.cardBackground} border-none shadow-lg`}
          >
            <CardHeader className={`pb-2 ${theme === "dark" ? "border-b border-gray-700" : "border-b"}`}>
              <CardTitle
                className={`flex items-center ${theme === "dark" ? colors.dark.titleText : colors.light.titleText}`}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Información de Clase
              </CardTitle>
              <CardDescription
                className={theme === "dark" ? colors.dark.descriptionText : colors.light.descriptionText}
              >
                Detalles de la clase invitada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Detalles de la clase */}
              <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-[#153731]/50" : "bg-[#e6ffe9]"} mt-4`}>
                <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-[#1C4A3F]"}`}>
                  Detalles de la Clase
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Calendar
                      className={`w-4 h-4 mt-1 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}
                    />
                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                      <span className="font-medium">Departamento:</span> {claseInfo?.departamento || "No disponible"}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <BookOpen
                      className={`w-4 h-4 mt-1 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}
                    />
                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                      <span className="font-medium">Materia:</span> {claseInfo?.materia || "No disponible"}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <ClipboardList
                      className={`w-4 h-4 mt-1 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}
                    />
                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                      <span className="font-medium">Práctica:</span> {claseInfo?.practica || "No disponible"}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Clock className={`w-4 h-4 mt-1 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`} />
                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                      <span className="font-medium">Hora de inicio:</span> {horaInicio || "No iniciada"}
                    </p>
                  </div>
                  <div className="flex items-start">
                    <Users className={`w-4 h-4 mt-1 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`} />
                    <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                      <span className="font-medium">Grupo:</span> {claseInfo?.grupo || "Externo"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de iniciar/finalizar clase */}
              <Button
                onClick={toggleClase}
                className={`w-full py-4 rounded-xl text-base font-medium transition-all duration-300 ${
                  claseIniciada
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : theme === "dark"
                      ? colors.dark.buttonPrimary
                      : colors.light.buttonPrimary
                }`}
              >
                {claseIniciada ? (
                  <>
                    <XCircle className="w-5 h-5 mr-2" />
                    Finalizar Clase
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Iniciar Clase
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Panel de estado de la clase */}
          <Card
            className={`lg:col-span-2 ${theme === "dark" ? colors.dark.cardBackground : colors.light.cardBackground} border-none shadow-lg`}
          >
            <CardHeader className={`pb-2 ${theme === "dark" ? "border-b border-gray-700" : "border-b"}`}>
              <div className="flex justify-between items-center">
                <CardTitle
                  className={`flex items-center ${theme === "dark" ? colors.dark.titleText : colors.light.titleText}`}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Estado de la Clase
                </CardTitle>
                <div
                  className={`flex items-center px-3 py-1 rounded-full ${
                    claseIniciada
                      ? theme === "dark"
                        ? "bg-green-900/50 text-green-400"
                        : "bg-green-100 text-green-700"
                      : theme === "dark"
                        ? "bg-gray-700/50 text-gray-300"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${claseIniciada ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
                  ></div>
                  <span className="text-sm font-medium">
                    {claseIniciada ? "Clase en progreso" : "Clase no iniciada"}
                  </span>
                </div>
              </div>
              <CardDescription
                className={theme === "dark" ? colors.dark.descriptionText : colors.light.descriptionText}
              >
                {claseIniciada
                  ? `Clase iniciada a las ${horaInicio}`
                  : "Inicie una clase para comenzar a registrar asistencias"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Información de la clase */}
                <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-[#153731]/50" : "bg-[#e6ffe9]"}`}>
                  <h3 className={`text-lg font-semibold mb-3 ${theme === "dark" ? "text-white" : "text-[#1C4A3F]"}`}>
                    Información de la Clase
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <BookOpen className={`w-4 h-4 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`} />
                      <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                        <span className="font-medium">Materia:</span> {claseInfo?.materia || "No seleccionada"}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <ClipboardList
                        className={`w-4 h-4 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}
                      />
                      <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                        <span className="font-medium">Práctica:</span> {claseInfo?.practica || "No seleccionada"}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Clock className={`w-4 h-4 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`} />
                      <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                        <span className="font-medium">Hora de inicio:</span> {horaInicio || "No iniciada"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estadísticas de asistencia */}
                <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-[#153731]/50" : "bg-[#e6ffe9]"}`}>
                  <h3 className={`text-lg font-semibold mb-3 ${theme === "dark" ? "text-white" : "text-[#1C4A3F]"}`}>
                    Estadísticas de Asistencia
                  </h3>
                  <div className="flex items-center justify-center h-24">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}>
                        {contador}
                      </div>
                      <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                        Estudiantes registrados
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de exportación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Button
                  onClick={exportarPDF}
                  className={`py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                    theme === "dark" ? colors.dark.buttonSecondary : colors.light.buttonSecondary
                  }`}
                  disabled={!claseIniciada || asistencias.length === 0}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Exportar a PDF
                </Button>
                <Button
                  onClick={exportarAExcel}
                  className={`py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                    theme === "dark" ? colors.dark.buttonPrimary : colors.light.buttonPrimary
                  }`}
                  disabled={!claseIniciada || asistencias.length === 0}
                >
                  <FilePlus2 className="w-5 h-5 mr-2" />
                  Exportar a Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de asistencias */}
        <Card
          className={`flex-1 ${theme === "dark" ? colors.dark.cardBackground : colors.light.cardBackground} border-none shadow-lg`}
        >
          <CardHeader className={`pb-2 ${theme === "dark" ? "border-b border-gray-700" : "border-b"}`}>
            <div className="flex justify-between items-center">
              <CardTitle
                className={`flex items-center ${theme === "dark" ? colors.dark.titleText : colors.light.titleText}`}
              >
                <Users className="w-5 h-5 mr-2" />
                Lista de Estudiantes
              </CardTitle>
              <div
                className={`px-3 py-1 rounded-full ${
                  theme === "dark" ? "bg-[#1BB827]/20 text-[#1BB827]" : "bg-[#e6ffe9] text-[#1BB827]"
                }`}
              >
                Total: {contador}
              </div>
            </div>
            <CardDescription className={theme === "dark" ? colors.dark.descriptionText : colors.light.descriptionText}>
              Estudiantes que han registrado su asistencia
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <div className="h-[calc(100vh-600px)] min-h-[300px] overflow-y-auto">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="sticky top-0 z-10 bg-inherit">
                      <TableRow className={`${theme === "dark" ? "bg-[#153731]" : "bg-[#e6ffe9]"}`}>
                        <TableHead className="min-w-[50px]">#</TableHead>
                        <TableHead className="min-w-[100px]">Matrícula</TableHead>
                        <TableHead className="min-w-[120px]">Nombre</TableHead>
                        <TableHead className="min-w-[120px]">Apellido</TableHead>
                        <TableHead className="min-w-[80px]">Equipo</TableHead>
                        <TableHead className="min-w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {asistencias.map((asistencia, index) => (
                          <motion.tr
                            key={asistencia.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className={`${
                              theme === "dark"
                                ? "hover:bg-[#153731] border-b border-gray-700/50"
                                : "hover:bg-[#e6ffe9]/50 border-b"
                            }`}
                          >
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{asistencia.AlumnoId}</TableCell>
                            <TableCell>{asistencia.Nombre}</TableCell>
                            <TableCell>{asistencia.Apellido}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  asistencia.Equipo === "personal"
                                    ? theme === "dark"
                                      ? "bg-blue-900/50 text-blue-400"
                                      : "bg-blue-100 text-blue-700"
                                    : theme === "dark"
                                      ? "bg-green-900/50 text-green-400"
                                      : "bg-green-100 text-green-700"
                                }`}
                              >
                                {asistencia.Equipo}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => eliminarAsistencia(asistencia.id)}
                                variant="destructive"
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                      {asistencias.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <AlertCircle
                                className={`w-8 h-8 mb-2 ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`}
                              />
                              <p className={`text-base ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                No hay asistencias registradas
                              </p>
                              <p className={`text-sm ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                                {claseIniciada
                                  ? "Los estudiantes pueden registrar su asistencia desde la página principal"
                                  : "Inicie una clase para permitir el registro de asistencias"}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleLogout}
              className={`py-2 px-4 rounded-xl text-base font-medium bg-red-500 hover:bg-red-600 text-white ${
                claseIniciada ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={claseIniciada}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}
