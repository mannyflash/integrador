"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
  getDocs,
  addDoc,
  where,
  serverTimestamp,
  writeBatch,
  getDoc,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { AppSidebar } from "../components/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { logAction } from "../lib/logging"
import * as XLSX from "xlsx"
import { verificarYLimpiarAsistenciasHuerfanas } from "../lib/cleanup"
import Swal from "sweetalert2" // Importar SweetAlert2

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

// Función para crear notificaciones para el administrador
const crearNotificacionAdmin = async (
  tipo: string,
  titulo: string,
  mensaje: string,
  prioridad: string,
  datos?: any,
) => {
  try {
    await addDoc(collection(db, "NotificacionesAdmin"), {
      tipo,
      titulo,
      mensaje,
      fecha: serverTimestamp(),
      leida: false,
      prioridad,
      datos: datos || null,
    })
    console.log("Notificación creada para el administrador:", titulo)
  } catch (error) {
    console.error("Error al crear notificación:", error)
  }
}

interface Practica {
  id: string
  Titulo: string
  Descripcion: string
  Duracion: string
  fecha: string
}
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

export default function ListaAsistencias() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [contador, setContador] = useState(0)
  const [claseIniciada, setClaseIniciada] = useState(false)
  const [practicas, setPracticas] = useState<Practica[]>([])
  const [selectedPractica, setSelectedPractica] = useState<Practica | null>(null)
  const [maestroId, setMaestroId] = useState("")
  const [maestroInfo, setMaestroInfo] = useState<Docente | null>(null)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const [materias, setMaterias] = useState<{ id: string; nombre: string; semestre?: string; turno?: string }[]>([])
  const [selectedMateriaId, setSelectedMateriaId] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setThemeState] = useState<Theme>(getTheme())
  const [horaInicio, setHoraInicio] = useState<string | null>(null)
  const [horaFin, setHoraFin] = useState<string | null>(null)
  const [alumnos, setAlumnos] = useState<Asistencia[]>([]) // Estado para almacenar todos los alumnos

  // useEffect para cargar todos los alumnos desde Firebase
  useEffect(() => {
    const cargarAlumnos = async () => {
      try {
        const alumnosSnapshot = await getDocs(collection(db, "Alumnos"))
        const alumnosData = alumnosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Asistencia[]
        setAlumnos(alumnosData)
        console.log("[v0] Alumnos cargados:", alumnosData.length)
      } catch (error) {
        console.error("Error al cargar alumnos:", error)
      }
    }

    cargarAlumnos()
  }, [])

  // Función para verificar si hay una clase activa y recuperar su información
  const verificarClaseActiva = useCallback(async () => {
    try {
      const estadoRef = doc(db, "EstadoClase", "actual")
      const estadoDoc = await getDoc(estadoRef)

      if (estadoDoc.exists() && estadoDoc.data().iniciada === true) {
        // Hay una clase activa, recuperar la información
        const estadoData = estadoDoc.data()

        // Actualizar el estado de clase iniciada
        setClaseIniciada(true)
        setHoraInicio(estadoData.horaInicio || null)

        // Recuperar información de la materia
        if (estadoData.materiaId) {
          setSelectedMateriaId(estadoData.materiaId)

          // Cargar las prácticas de esta materia
          const practicasSnapshot = await getDocs(collection(db, "Materias", estadoData.materiaId, "Practicas"))
          const practicasData = practicasSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Practica, "id">),
          }))
          setPracticas(practicasData)

          // Encontrar la práctica seleccionada
          if (estadoData.practica) {
            const practicaDoc = await getDoc(
              doc(db, "Materias", estadoData.materiaId, "Practicas", estadoData.practica),
            )
            if (practicaDoc.exists()) {
              const practicaData = {
                id: practicaDoc.id,
                ...(practicaDoc.data() as Omit<Practica, "id">),
              }
              setSelectedPractica(practicaData)
            }
          }
        }

        console.log("Se recuperó la información de la clase activa")
        return true
      }
      return false
    } catch (error) {
      console.error("Error al verificar clase activa:", error)
      return false
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const storedMaestroId = localStorage.getItem("maestroId")
      if (!storedMaestroId) {
        await swal({
          title: "Sesión expirada",
          text: "Por favor, inicie sesión nuevamente.",
          icon: "warning",
        })
        router.push("/")
        return
      }
      setMaestroId(storedMaestroId)
      // Verificar y limpiar asistencias huérfanas
      verificarYLimpiarAsistenciasHuerfanas()
        .then(() => console.log("Verificación de asistencias huérfanas completada"))
        .catch((error) => console.error("Error en verificación de asistencias huérfanas:", error))

      // Verificar si hay una clase activa
      await verificarClaseActiva()

      fetchMaterias(storedMaestroId)
      fetchMaestroInfo(storedMaestroId)
      const unsubscribeAsistencias = onSnapshot(query(collection(db, "Asistencias")), (snapshot) => {
        const nuevosEstudiantes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Asistencia[]
        setAsistencias(nuevosEstudiantes)
        console.log("Asistencias actualizadas:", nuevosEstudiantes)
        setContador(nuevosEstudiantes.length)
      })

      const estadoRef = doc(db, "EstadoClase", "actual")
      const unsubscribeEstadoClase = onSnapshot(estadoRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()

          // Si la clase fue finalizada externamente (por admin o laboratorista)
          if (data.iniciada === false && claseIniciada) {
            console.log("[v0] Clase finalizada externamente, cerrando sesión del maestro...")

            // Mostrar notificación al maestro
            await Swal.fire({
              // Cambio de swal a Swal.fire para corregir error de tipado
              title: "Clase finalizada",
              text: "Un administrador o laboratorista ha finalizado la clase. Su sesión se cerrará automáticamente.",
              icon: "info",
              timer: 3000,
              showConfirmButton: false,
              timerProgressBar: true,
            })

            // Cerrar sesión del maestro
            localStorage.removeItem("maestroId")

            // Registrar la acción
            await logAction(
              "Sesión Cerrada (Automática)",
              `Sesión cerrada automáticamente para ${maestroInfo?.Nombre} ${maestroInfo?.Apellido} debido a finalización externa de clase`,
            )

            // Redirigir al index
            router.push("/")
          }
        }
      })

      // Simulate loading time
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1500)

      return () => {
        unsubscribeAsistencias()
        unsubscribeEstadoClase() // Limpiar el listener del estado de clase
        clearTimeout(timer)
      }
    }
    checkAuth()
  }, [router, verificarClaseActiva, claseIniciada, maestroInfo])

  // Añadir este efecto después del useEffect que verifica la autenticación
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      // Si hay una clase iniciada, finalizarla automáticamente
      if (claseIniciada) {
        // Guardar el ID del maestro y la información de la práctica para usarlos en el cierre
        const maestroActual = maestroId
        const practicaActual = selectedPractica
        const materiaActual = selectedMateriaId
        const horaInicioActual = horaInicio
        const asistenciasActuales = asistencias
        const maestroInfoActual = maestroInfo
        const materiasActuales = materias

        // Finalizar la clase automáticamente
        const horaActual = new Date().toLocaleTimeString()

        try {
          const estadoRef = doc(db, "EstadoClase", "actual")

          // Guardar en historial
          const historicalRef = collection(db, "HistoricalAttendance")
          await addDoc(historicalRef, {
            practica: practicaActual?.Titulo || "Clase finalizada automáticamente",
            materia: materiasActuales.find((m) => m.id === materiaActual)?.nombre || "No especificada",
            fecha: serverTimestamp(),
            horaInicio: horaInicioActual,
            horaFin: horaActual,
            asistencias: asistenciasActuales,
            maestroNombre: maestroInfoActual?.Nombre || "",
            maestroApellido: maestroInfoActual?.Apellido || "",
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
            materia: materiasActuales.find((m) => m.id === materiaActual)?.nombre || "No especificada",
            practica: practicaActual?.Titulo || "Clase finalizada automáticamente",
            fecha: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }),
            totalAsistencias: asistenciasActuales.length,
            maestroId: maestroActual,
            maestroNombre: maestroInfoActual?.Nombre || "",
            maestroApellido: maestroInfoActual?.Apellido || "",
            horaInicio: horaInicioActual,
            horaFin: horaActual,
            finalizadaAutomaticamente: true,
            alumnos: asistenciasActuales.map((a) => ({
              id: a.AlumnoId,
              nombre: a.Nombre,
              apellido: a.Apellido,
              equipo: a.Equipo,
              carrera: a.Carrera,
              grupo: a.Grupo,
              semestre: a.Semestre,
              turno: a.Turno,
            })),
          })

          // Eliminar todas las asistencias
          try {
            const asistenciasSnapshot = await getDocs(collection(db, "Asistencias"))

            if (!asistenciasSnapshot.empty) {
              const batch = writeBatch(db)

              asistenciasSnapshot.docs.forEach((doc) => {
                batch.delete(doc.ref)
              })

              await batch.commit()
              console.log(`Se eliminaron ${asistenciasSnapshot.docs.length} registros de asistencias automáticamente`)
              await logAction(
                "Finalizar Clase Automáticamente",
                `Se eliminaron ${asistenciasSnapshot.docs.length} registros de asistencias automáticamente`,
              )
            }
          } catch (error) {
            console.error("Error al eliminar asistencias automáticamente:", error)
            await logAction("Error", `Error al eliminar asistencias automáticamente: ${error}`)
          }

          // Resetear el estado "enUso" de todos los equipos
          const equipoRef = doc(db, "Numero de equipos", "equipos")
          const equipoDoc = await getDoc(equipoRef)

          if (equipoDoc.exists()) {
            const equiposData = equipoDoc.data()
            const equiposActualizados = equiposData.Equipos.map((eq: Equipment) => ({
              ...eq,
              enUso: false,
            }))

            await setDoc(equipoRef, { Equipos: equiposActualizados })
          }

          // Crear notificación para el administrador sobre clase finalizada automáticamente
          await crearNotificacionAdmin(
            "asistencia",
            "⚠️ Clase Finalizada Automáticamente",
            `La clase de ${practicaActual?.Titulo || "No especificada"} del maestro ${maestroInfoActual?.Nombre} ${maestroInfoActual?.Apellido} fue finalizada automáticamente debido al cierre del navegador.`,
            "media",
            {
              maestroNombre: `${maestroInfoActual?.Nombre} ${maestroInfoActual?.Apellido}`,
              maestroId: maestroActual,
              practica: practicaActual?.Titulo || "No especificada",
              practicaDescripcion: practicaActual?.Descripcion || "Sin descripción",
              materia: materiasActuales.find((m) => m.id === materiaActual)?.nombre || "No especificada",
              materiaId: materiaActual,
              totalAsistencias: asistenciasActuales.length,
              horaInicio: horaInicioActual,
              horaFin: horaActual,
              duracionClase: horaInicioActual ? `${horaInicioActual} - ${horaActual}` : "No disponible",
              fecha: new Date().toLocaleDateString("es-MX"),
              finalizadaAutomaticamente: true,
              razonFinalizacion: "Cierre del navegador",
              estado: "Finalizada Automáticamente",
              equiposLiberados: true,
              historialGuardado: true,
              accion: "finalizar_automaticamente",
            },
          )

          // Registrar la acción en el log
          await logAction(
            "Finalizar Clase Automáticamente",
            `Clase finalizada automáticamente para ${practicaActual?.Titulo || "No especificada"} a las ${horaActual} debido al cierre del navegador.`,
          )

          // Eliminar el ID del maestro del localStorage
          localStorage.removeItem("maestroId")
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
  }, [claseIniciada, maestroId, selectedPractica, selectedMateriaId, horaInicio, asistencias, maestroInfo, materias])

  useEffect(() => {
    document.body.classList.toggle("dark", theme === "dark")
    applyTheme(theme)
  }, [theme])
  const fetchMaterias = async (maestroId: string) => {
    try {
      const materiasSnapshot = await getDocs(query(collection(db, "Materias"), where("MaestroID", "==", maestroId)))
      const materiasData = materiasSnapshot.docs.map((doc) => ({
        id: doc.id,
        nombre: doc.data().NombreMateria,
        semestre: doc.data().Semestre, // Añadir semestre
        turno: doc.data().Turno, // Añadir turno
      }))
      setMaterias(materiasData)
    } catch (error) {
      await swal({
        title: "Error",
        text: "No se pudieron cargar las materias.",
        icon: "error",
      })
    }
  }

  const fetchPracticas = useCallback(async () => {
    if (selectedMateriaId) {
      try {
        console.log("Actualizando prácticas para la materia:", selectedMateriaId)
        const practicasSnapshot = await getDocs(collection(db, "Materias", selectedMateriaId, "Practicas"))
        const practicasData: Practica[] = practicasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Practica, "id">),
        }))

        // Solo actualizar las prácticas si no hay una práctica seleccionada
        // o si la práctica seleccionada no está en la lista nueva
        if (!selectedPractica || !practicasData.some((p) => p.id === selectedPractica.id)) {
          setPracticas(practicasData)
        }
        console.log("Prácticas actualizadas:", practicasData)
      } catch (error) {
        console.error("Error fetching practicas:", error)
        await swal({
          title: "Error",
          text: "No se pudieron cargar las practicas.",
          icon: "error",
        })
      }
    }
  }, [selectedMateriaId, selectedPractica])

  useEffect(() => {
    if (selectedMateriaId) {
      fetchPracticas()
    }
  }, [selectedMateriaId, fetchPracticas])
  const fetchMaestroInfo = async (maestroId: string) => {
    try {
      const maestroDoc = await getDoc(doc(db, "Docentes", maestroId))
      if (maestroDoc.exists()) {
        const data = maestroDoc.data() as Docente
        setMaestroInfo(data)
      }
    } catch (error) {
      console.error("Error fetching maestro info:", error)
    }
  }
  const handleMateriaChange = (materiaId: string) => {
    // Si es la misma materia que ya está seleccionada, no hagas nada
    if (materiaId === selectedMateriaId) {
      return
    }

    setSelectedMateriaId(materiaId)
    setSelectedPractica(null)
    setPracticas([])

    // Forzar la actualización de las prácticas
    if (materiaId) {
      fetchPracticas()
    }
  }
  const limpiarCampos = useCallback(() => {
    setAsistencias([])
    setContador(0)
    setSelectedPractica(null)
    setSelectedMateriaId("")
    setPracticas([])
    setClaseIniciada(false)
    setHoraInicio(null)
    setHoraFin(null)
    // Limpiar también el estado de alumnos si se usa para estadísticas
    setAlumnos([])
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
    if (!selectedPractica) {
      await swal({
        title: "Error",
        text: "Seleccione una practica antes de iniciar la clase.",
        icon: "error",
      })
      return
    }
    const nuevoEstado = !claseIniciada
    const horaActual = new Date().toLocaleTimeString()
    try {
      const estadoRef = doc(db, "EstadoClase", "actual")

      if (nuevoEstado) {
        // Iniciar clase - Guardar toda la información en el documento "actual"
        await setDoc(estadoRef, {
          iniciada: true,
          practica: selectedPractica.id,
          practicaTitulo: selectedPractica.Titulo,
          practicaDescripcion: selectedPractica.Descripcion,
          practicaDuracion: selectedPractica.Duracion,
          practicaFecha: selectedPractica.fecha,
          materiaId: selectedMateriaId,
          materiaNombre: materias.find((m) => m.id === selectedMateriaId)?.nombre || "",
          maestroId: maestroId,
          maestroNombre: maestroInfo?.Nombre || "",
          maestroApellido: maestroInfo?.Apellido || "",
          horaInicio: horaActual,
          horaFin: null,
        })

        setHoraInicio(horaActual)

        // Crear notificación DETALLADA para el administrador
        await crearNotificacionAdmin(
          "asistencia",
          `📚 Clase Iniciada: "${selectedPractica.Titulo}"`,
          `El maestro ${maestroInfo?.Nombre} ${maestroInfo?.Apellido} ha iniciado una clase. Los estudiantes pueden registrar su asistencia desde la página principal.`,
          "baja",
          {
            maestroNombre: `${maestroInfo?.Nombre} ${maestroInfo?.Apellido}`,
            maestroId: maestroId,
            practica: selectedPractica.Titulo,
            practicaDescripcion: selectedPractica.Descripcion,
            practicaDuracion: selectedPractica.Duracion,
            materia: materias.find((m) => m.id === selectedMateriaId)?.nombre,
            materiaId: selectedMateriaId,
            horaInicio: horaActual,
            fecha: new Date().toLocaleDateString("es-MX"),
            estado: "Iniciada",
            ubicacion: "Laboratorio de Cómputo",
            accion: "iniciar_clase",
          },
        )

        await swal({
          title: "Clase iniciada",
          text: `Los alumnos ahora pueden registrar su asistencia para la practica: ${selectedPractica.Titulo}. Hora de inicio: ${horaActual}`,
          icon: "success",
        })
        await logAction("Iniciar Clase", `Clase iniciada para ${selectedPractica.Titulo} a las ${horaActual}`)
      } else {
        // Finalizar clase
        setHoraFin(horaActual)

        // Obtener los datos actuales antes de borrarlos
        const estadoClaseDoc = await getDoc(estadoRef)
        const estadoClaseData = estadoClaseDoc.exists() ? estadoClaseDoc.data() : null

        // Guardar en historial antes de borrar
        const historicalRef = collection(db, "HistoricalAttendance")
        await addDoc(historicalRef, {
          practica: selectedPractica.Titulo,
          materia: materias.find((m) => m.id === selectedMateriaId)?.nombre,
          fecha: serverTimestamp(),
          horaInicio: horaInicio,
          horaFin: horaActual,
          asistencias: asistencias,
          maestroNombre: maestroInfo?.Nombre || "",
          maestroApellido: maestroInfo?.Apellido || "",
        })

        // Limpiar el documento "actual" (establecer iniciada: false y borrar todos los demás campos)
        await setDoc(estadoRef, {
          iniciada: false,
          horaFin: horaActual,
        })

        // Eliminar todas las asistencias de la colección "Asistencias"
        try {
          // Primero, obtener todas las asistencias actuales
          const asistenciasSnapshot = await getDocs(collection(db, "Asistencias"))

          if (!asistenciasSnapshot.empty) {
            const batch = writeBatch(db)

            // Añadir cada documento al batch para eliminación
            asistenciasSnapshot.docs.forEach((doc) => {
              const asistenciaRef = doc.ref
              batch.delete(asistenciaRef)
            })

            // Ejecutar el batch
            await batch.commit()
            console.log(`Se eliminaron ${asistenciasSnapshot.docs.length} registros de asistencias`)
            await logAction(
              "Finalizar Clase",
              `Se eliminaron ${asistenciasSnapshot.docs.length} registros de asistencias`,
            )
          } else {
            console.log("No hay asistencias para eliminar")
            await logAction("Finalizar Clase", "No había asistencias para eliminar")
          }
        } catch (error) {
          console.error("Error al eliminar las asistencias:", error)
          await logAction("Error", `Error al eliminar las asistencias: ${error}`)

          // Intentar eliminar las asistencias una por una como fallback
          try {
            for (const asistencia of asistencias) {
              await deleteDoc(doc(db, "Asistencias", asistencia.id))
            }
            console.log("Asistencias eliminadas individualmente como fallback")
            await logAction("Finalizar Clase", "Asistencias eliminadas individualmente como fallback")
          } catch (secondError) {
            console.error("Error en el fallback de eliminación de asistencias:", secondError)
            await logAction("Error", `Error en el fallback de eliminación de asistencias: ${secondError}`)
          }
        }

        const classInfoRef = collection(db, "ClassInformation")
        await addDoc(classInfoRef, {
          materia: materias.find((m) => m.id === selectedMateriaId)?.nombre,
          practica: selectedPractica.Titulo,
          fecha: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }),
          totalAsistencias: asistencias.length,
          maestroId: maestroId,
          maestroNombre: maestroInfo?.Nombre,
          maestroApellido: maestroInfo?.Apellido,
          horaInicio: horaInicio,
          horaFin: horaActual,
          alumnos: asistencias.map((a) => ({
            id: a.AlumnoId,
            nombre: a.Nombre,
            apellido: a.Apellido,
            equipo: a.Equipo,
            carrera: a.Carrera,
            grupo: a.Grupo,
            semestre: a.Semestre,
            turno: a.Turno,
          })),
        })

        // Resetear el estado "enUso" de todos los equipos cuando finaliza la clase
        await resetEquiposEnUso()

        // Calcular duración de la clase
        const duracionClase = horaInicio && horaActual ? `${horaInicio} - ${horaActual}` : "No disponible"

        // Crear notificación DETALLADA para el administrador sobre clase finalizada
        await crearNotificacionAdmin(
          "asistencia",
          `✅ Clase Finalizada: "${selectedPractica.Titulo}"`,
          `La clase "${selectedPractica.Titulo}" del maestro ${maestroInfo?.Nombre} ${maestroInfo?.Apellido} ha finalizado exitosamente. Se han registrado ${asistencias.length} asistencias.`,
          "baja",
          {
            maestroNombre: `${maestroInfo?.Nombre} ${maestroInfo?.Apellido}`,
            maestroId: maestroId,
            practica: selectedPractica.Titulo,
            practicaDescripcion: selectedPractica.Descripcion,
            materia: materias.find((m) => m.id === selectedMateriaId)?.nombre,
            materiaId: selectedMateriaId,
            totalAsistencias: asistencias.length,
            horaInicio: horaInicio,
            horaFin: horaActual,
            duracionClase: duracionClase,
            fecha: new Date().toLocaleDateString("es-MX"),
            estado: "Finalizada",
            equiposLiberados: true,
            historialGuardado: true,
            accion: "finalizar_clase",
          },
        )

        // Limpiar campos y restablecer el estado
        limpiarCampos()

        // Asegurarse de que el estado se actualice correctamente
        setTimeout(() => {
          setSelectedMateriaId("")
          setPracticas([])
        }, 100)

        await swal({
          title: "Clase finalizada",
          text: `Se ha cerrado el registro de asistencias y guardado el registro histórico y la información de la clase. Hora de fin: ${horaActual}`,
          icon: "success",
        })
        await logAction(
          "Finalizar Clase",
          `Clase finalizada para ${selectedPractica.Titulo} a las ${horaActual}. Total de asistencias: ${asistencias.length}`,
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
      await logAction("Error", `Error al cambiar el estado de la clase: ${error}`)
    }
  }, [
    claseIniciada,
    selectedPractica,
    asistencias,
    horaInicio,
    limpiarCampos,
    maestroId,
    maestroInfo?.Nombre,
    maestroInfo?.Apellido,
    materias,
    selectedMateriaId,
  ])
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
        const asistenciaRef = doc(db, "Asistencias", id)
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
  const openModal = (practica: Practica) => {
    setSelectedPractica(practica)
    setShowModal(true)
  }
  const closeModal = () => {
    setShowModal(false)
  }
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
    doc.text("HOJA DE REGISTRO", pageWidth / 2, margin + 20, { align: "center" })

    // Form fields
    doc.setFontSize(10)
    const leftColX = margin
    const rightColX = pageWidth / 2 + margin
    let currentY = margin + 35

    // Left column
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, leftColX, currentY)
    doc.text(`GRUPO: ${asistencias[0]?.Grupo || ""}`, leftColX, currentY + 10)
    doc.text(`HORA: ${horaInicio || new Date().toLocaleTimeString()}`, leftColX, currentY + 20)
    doc.text(`MATERIA: ${materias.find((m) => m.id === selectedMateriaId)?.nombre || ""}`, leftColX, currentY + 30)
    doc.text(`DOCENTE: ${maestroInfo ? `${maestroInfo.Nombre} ${maestroInfo.Apellido}` : ""}`, leftColX, currentY + 40)

    // Right column
    doc.text(`CARRERA: ${asistencias[0]?.Carrera || ""}`, rightColX, currentY)
    doc.text(`TURNO: ${asistencias[0]?.Turno || ""}`, rightColX, currentY + 10)
    doc.text(`PRACTICA: ${selectedPractica?.Titulo || ""}`, rightColX, currentY + 20)
    doc.text(`SEMESTRE: ${asistencias[0]?.Semestre || ""}`, rightColX, currentY + 30)

    currentY += 60

    // Table
    const tableHeaders = ["#", "NOMBRE ALUMNO", "NUM. PC"]
    const tableData = asistencias.map((asistencia, index) => [
      (index + 1).toString(),
      `${asistencia.Nombre} ${asistencia.Apellido}`,
      asistencia.Equipo,
    ])

    // Pad the table to have at least 25 rows
    const minRows = 25
    while (tableData.length < minRows) {
      tableData.push([(tableData.length + 1).toString(), "", ""])
    }

    let finalY = currentY
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: currentY,
      theme: "grid",
      styles: {
        fontSize: 12,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineWidth: 0.3,
        lineColor: [100, 100, 100],
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [149, 41, 82], // Color borgoña para encabezado
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 13,
        halign: "center",
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center", fontStyle: "bold" },
        1: { cellWidth: "auto", halign: "center" },
        2: { cellWidth: 25, halign: "center" },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245], // Filas alternadas en gris claro
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
    // Draw signature lines
    doc.line(margin, signatureY, margin + 70, signatureY)
    doc.text("FIRMA DOCENTE", margin + 35, signatureY + 5, { align: "center" })

    doc.line(pageWidth - margin - 70, signatureY, pageWidth - margin, signatureY)
    doc.text("FIRMA ENCARGADO LABORATORIO", pageWidth - margin - 35, signatureY + 5, { align: "center" })

    doc.save("lista_asistencias.pdf")
    await logAction(
      "Exportar PDF",
      `PDF de asistencias exportado para ${selectedPractica?.Titulo || "práctica no seleccionada"}`,
    )
  }
  const exportarAExcel = async () => {
    const workbook = XLSX.utils.book_new()

    // Create header data with logo and title
    const headerData = [
      ["INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO"],
      ["CONTROL DE ASISTENCIA - TALLER DE PROGRAMACIÓN"],
      [""],
      ["Información de la Clase"],
      ["Fecha:", new Date().toLocaleDateString(), "", "Carrera:", asistencias[0]?.Carrera || "N/A"],
      [
        "Grupo:",
        asistencias[0]?.Grupo || "N/A",
        "",
        "Materia:",
        materias.find((m) => m.id === selectedMateriaId)?.nombre || "N/A",
      ],
      [
        "Práctica:",
        selectedPractica?.Titulo || "N/A",
        "",
        "Docente:",
        maestroInfo ? `${maestroInfo.Nombre} ${maestroInfo.Apellido}` : "N/A",
      ],
      ["Hora Inicio:", horaInicio || "N/A", "", "Hora Fin:", horaFin || "N/A"],
      [""],
      ["Lista de Asistencia"],
      ["#", "ID Alumno", "Nombre", "Apellido", "Carrera", "Grupo", "Semestre", "Turno", "Equipo"],
    ]

    // Add student data
    const studentData = asistencias.map((alumno, index) => [
      index + 1,
      alumno.AlumnoId,
      alumno.Nombre,
      alumno.Apellido,
      alumno.Carrera,
      alumno.Grupo,
      alumno.Semestre,
      alumno.Turno,
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
      { wch: 25 }, // Carrera
      { wch: 10 }, // Grupo
      { wch: 10 }, // Semestre
      { wch: 10 }, // Turno
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
      ["Práctica:", selectedPractica?.Titulo || "N/A"],
      ["Materia:", materias.find((m) => m.id === selectedMateriaId)?.nombre || "N/A"],
      ["Docente:", maestroInfo ? `${maestroInfo.Nombre} ${maestroInfo.Apellido}` : "N/A"],
    ]

    const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData)
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Estadísticas")

    // Save the file
    XLSX.writeFile(workbook, `control_asistencia_${new Date().toISOString().split("T")[0]}.xlsx`)
    await logAction(
      "Exportar Excel",
      `Se exportó el control de asistencia a Excel para la práctica ${selectedPractica?.Titulo || "N/A"}`,
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
      localStorage.removeItem("maestroId")
      await logAction("Cerrar Sesión", `Sesión cerrada para ${maestroInfo?.Nombre} ${maestroInfo?.Apellido}`)
      router.push("/")
    }
  }
  if (isLoading) {
    return <Loader />
  }
  return (
    <SidebarProvider>
      <div
        className={`flex min-h-screen w-full flex-col lg:flex-row ${
          theme === "dark" ? "bg-[#0c1f1a]" : "bg-[#f0fff4]"
        } transition-colors duration-300`}
      >
        {/* Sidebar - Hidden on mobile by default */}
        <div className="hidden lg:block lg:w-80 xl:w-96 flex-shrink-0">
          <AppSidebar side="left" maestroId={maestroId} materias={materias} onPracticaAdded={fetchPracticas} />
        </div>

        {/* Mobile Sidebar Toggle Button */}
        <button className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-white">
          <span className="sr-only">Toggle Sidebar</span>
          {/* Add your menu icon here */}
        </button>

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
                      ¡Bienvenido, {maestroInfo ? `${maestroInfo.Nombre} ${maestroInfo.Apellido}` : "Docente"}!
                    </CardTitle>
                    <CardDescription className="text-white/80">Panel de Control de Asistencias</CardDescription>
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
                  Configuración de Clase
                </CardTitle>
                <CardDescription
                  className={theme === "dark" ? colors.dark.descriptionText : colors.light.descriptionText}
                >
                  Seleccione la materia y práctica para iniciar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Materia Select */}
                <div className="space-y-2">
                  <Label
                    htmlFor="materia-select"
                    className={`block text-base font-medium ${theme === "dark" ? "text-gray-300" : "text-green-700"}`}
                  >
                    <BookOpen className="inline-block w-4 h-4 mr-2" />
                    Materia:
                  </Label>
                  <Select onValueChange={handleMateriaChange} value={selectedMateriaId}>
                    <SelectTrigger
                      id="materia-select"
                      className={`text-base ${
                        theme === "dark"
                          ? "bg-[#153731] border-[#1BB827]/30 text-white"
                          : "bg-[#f0fff4] border-[#1BB827]/30 text-[#1C4A3F]"
                      } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                    >
                      <SelectValue placeholder="Seleccione una materia">
                        {selectedMateriaId
                          ? materias.find((materia) => materia.id === selectedMateriaId)?.nombre
                          : "Seleccione una materia"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className={`${theme === "dark" ? "bg-[#1C4A3F] text-white" : "bg-white"}`}>
                      <div className="text-base">
                        {materias.map((materia) => (
                          <SelectItem key={materia.id} value={materia.id} className="text-base">
                            {materia.nombre}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Practica Select */}
                <div className="space-y-2">
                  <Label
                    htmlFor="practica-select"
                    className={`block text-base font-medium ${theme === "dark" ? "text-gray-300" : "text-green-700"}`}
                  >
                    <ClipboardList className="inline-block w-4 h-4 mr-2" />
                    Práctica:
                  </Label>
                  <Select
                    value={selectedPractica?.id || ""}
                    onValueChange={(value) => {
                      const selected = practicas.find((p) => p.id === value)
                      if (selected) {
                        setSelectedPractica(selected)
                        openModal(selected)
                      }
                    }}
                  >
                    <SelectTrigger
                      id="practica-select"
                      className={`text-base ${
                        theme === "dark"
                          ? "bg-[#153731] border-[#1BB827]/30 text-white"
                          : "bg-[#f0fff4] border-[#1BB827]/30 text-[#1C4A3F]"
                      } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                    >
                      <SelectValue placeholder="Seleccione una práctica">
                        {selectedPractica ? `${selectedPractica.Titulo}` : "Seleccione una práctica"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className={`${theme === "dark" ? "bg-[#1C4A3F] text-white" : "bg-white"}`}>
                      <div className="text-base">
                        {practicas.map((practica) => (
                          <SelectItem key={practica.id} value={practica.id} className="text-base">
                            {practica.Titulo}
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Detalles de la práctica seleccionada */}
                {selectedPractica && (
                  <div className={`p-4 rounded-xl ${theme === "dark" ? "bg-[#153731]/50" : "bg-[#e6ffe9]"} mt-4`}>
                    <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-[#1C4A3F]"}`}>
                      Detalles de la Práctica
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <Calendar
                          className={`w-4 h-4 mt-1 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}
                        />
                        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                          <span className="font-medium">Fecha:</span> {selectedPractica.fecha}
                        </p>
                      </div>
                      <div className="flex items-start">
                        <Clock
                          className={`w-4 h-4 mt-1 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}
                        />
                        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                          <span className="font-medium">Duración:</span> {selectedPractica.Duracion}
                        </p>
                      </div>
                      <div className="flex items-start">
                        <FileText
                          className={`w-4 h-4 mt-1 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}
                        />
                        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                          <span className="font-medium">Descripción:</span> {selectedPractica.Descripcion}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                        <BookOpen
                          className={`w-4 h-4 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}
                        />
                        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                          <span className="font-medium">Materia:</span>{" "}
                          {materias.find((m) => m.id === selectedMateriaId)?.nombre || "No seleccionada"}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <ClipboardList
                          className={`w-4 h-4 mr-2 ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}
                        />
                        <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                          <span className="font-medium">Práctica:</span> {selectedPractica?.Titulo || "No seleccionada"}
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
                    <div className="space-y-3">
                      {/* Contador principal */}
                      <div className="text-center pb-3 border-b border-gray-300/20">
                        <div className={`text-4xl font-bold ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}>
                          {contador}
                        </div>
                        <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}>
                          Estudiantes registrados
                        </p>
                      </div>

                      {/* Porcentaje de asistencia */}
                      {claseIniciada &&
                        selectedMateriaId &&
                        (() => {
                          // Obtener el grupo más común de los alumnos que asistieron
                          const gruposAsistentes = asistencias.map((a) => a.Grupo).filter(Boolean)
                          const grupoActual = gruposAsistentes.length > 0 ? gruposAsistentes[0] : null

                          // Contar total de alumnos con ese mismo grupo en la base de datos
                          const totalAlumnosGrupo = grupoActual
                            ? alumnos.filter((a) => a.Grupo === grupoActual).length
                            : 0

                          const porcentajeAsistencia =
                            totalAlumnosGrupo > 0 ? Math.round((contador / totalAlumnosGrupo) * 100) : 0

                          return (
                            <>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-[#1C4A3F]/70"}`}>
                                  Asistencia del grupo:
                                </span>
                                <span
                                  className={`text-sm font-bold ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}
                                >
                                  {contador} de {totalAlumnosGrupo} alumnos
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-[#1C4A3F]/70"}`}>
                                  Porcentaje de asistencia:
                                </span>
                                <span
                                  className={`text-sm font-bold ${theme === "dark" ? "text-[#1BB827]" : "text-[#1BB827]"}`}
                                >
                                  {porcentajeAsistencia}%
                                </span>
                              </div>
                              {grupoActual && (
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-[#1C4A3F]/70"}`}
                                  >
                                    Grupo:
                                  </span>
                                  <span
                                    className={`text-sm font-semibold ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]"}`}
                                  >
                                    {grupoActual}
                                  </span>
                                </div>
                              )}
                            </>
                          )
                        })()}
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
                  <Button
                    onClick={() => {
                      swal({
                        title: "Verificar y limpiar asistencias",
                        text: "¿Desea forzar la limpieza incluso si se detecta una clase activa?",
                        icon: "warning",
                        buttons: ["No, solo verificar", "Sí, forzar limpieza"],
                        dangerMode: true,
                      }).then((forzarLimpieza) => {
                        verificarYLimpiarAsistenciasHuerfanas(forzarLimpieza)
                          .then(() => {
                            swal({
                              title: "Limpieza completada",
                              text: "Se ha verificado y limpiado cualquier registro de asistencia huérfano",
                              icon: "success",
                            })
                          })
                          .catch((error) => {
                            swal({
                              title: "Error",
                              text: "No se pudo completar la limpieza: " + error.message,
                              icon: "error",
                            })
                          })
                      })
                    }}
                    className={`py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                      theme === "dark" ? colors.dark.buttonTertiary : colors.light.buttonTertiary
                    }`}
                  >
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Verificar y Limpiar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/*Tabla de asistencias */}
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
              <CardDescription
                className={theme === "dark" ? colors.dark.descriptionText : colors.light.descriptionText}
              >
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
                          <TableHead className="min-w-[100px]">ID Alumno</TableHead>
                          <TableHead className="min-w-[120px]">Nombre</TableHead>
                          <TableHead className="min-w-[120px]">Apellido</TableHead>
                          <TableHead className="min-w-[150px]">Carrera</TableHead>
                          <TableHead className="min-w-[100px]">Semestre</TableHead>
                          <TableHead className="min-w-[80px]">Grupo</TableHead>
                          <TableHead className="min-w-[80px]">Turno</TableHead>
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
                              <TableCell>{asistencia.Carrera}</TableCell>
                              <TableCell>{asistencia.Semestre}</TableCell>
                              <TableCell>{asistencia.Grupo}</TableCell>
                              <TableCell>{asistencia.Turno}</TableCell>
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
                            <TableCell colSpan={10} className="h-32 text-center">
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
    </SidebarProvider>
  )
}
