"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  doc,
  orderBy,
  type Timestamp,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "../lib/firebase"
import { toast, Toaster } from "react-hot-toast"
import {
  UserPlus,
  School,
  BookOpen,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  ClipboardList,
  Award,
  CalendarDays,
  Timer,
  FileText,
  User,
  Bookmark,
  PlusCircle,
  Eye,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// Agregar nuevas interfaces para los eventos
interface Evento {
  id: string
  nombre: string
  tipo: string
  organizador: string
  participantes: number
  fecha: string
  hora: string
  duracion: string
  descripcion: string
  resultados: string
  createdAt: Timestamp
}

interface Maestro {
  id: string
  Nombre: string
  Apellido: string
  Departamento: string
}

interface Materia {
  id: string
  NombreMateria: string
  MaestroID: string
  Semestre: string
}

// Actualizar la interfaz VistaMaestroInvitadoProps
interface VistaMaestroInvitadoProps {
  esModoOscuro: boolean
  logAction: (action: string, details: string) => Promise<void>
}

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

// Actualizar el componente principal para incluir la nueva pestaña de eventos
export default function VistaMaestroInvitado({ esModoOscuro, logAction }: VistaMaestroInvitadoProps) {
  const [departamento, setDepartamento] = useState("")
  const [maestroSeleccionado, setMaestroSeleccionado] = useState("")
  const [nombreMaestroSeleccionado, setNombreMaestroSeleccionado] = useState("")
  const [materia, setMateria] = useState("")
  const [practica, setPractica] = useState("")
  const [grupo, setGrupo] = useState("")
  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [cargandoMaestros, setCargandoMaestros] = useState(false)
  const [cargandoMaterias, setCargandoMaterias] = useState(false)
  const [activeTab, setActiveTab] = useState("clase")
  const router = useRouter()

  // Estados para el formulario de eventos
  const [nombreEvento, setNombreEvento] = useState("")
  const [tipoEvento, setTipoEvento] = useState("")
  const [organizadorEvento, setOrganizadorEvento] = useState("")
  const [participantesEvento, setParticipantesEvento] = useState("")
  const [fechaEvento, setFechaEvento] = useState("")
  const [horaEvento, setHoraEvento] = useState("")
  const [duracionEvento, setDuracionEvento] = useState("")
  const [descripcionEvento, setDescripcionEvento] = useState("")
  const [resultadosEvento, setResultadosEvento] = useState("")
  const [eventos, setEventos] = useState<Evento[]>([])
  const [cargandoEventos, setCargandoEventos] = useState(false)
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Evento | null>(null)
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false)

  const modoColor = esModoOscuro ? colors.dark : colors.light

  // Mantener el código existente para cargar maestros y materias
  useEffect(() => {
    const cargarMaestrosPorDepartamento = async () => {
      if (!departamento) {
        setMaestros([])
        return
      }

      setCargandoMaestros(true)
      try {
        const maestrosQuery = query(collection(db, "Docentes"), where("Departamento", "==", departamento))
        const querySnapshot = await getDocs(maestrosQuery)
        const maestrosData = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Maestro,
        )
        setMaestros(maestrosData)
        await logAction(
          "Cargar Maestros",
          `Se cargaron ${maestrosData.length} maestros del departamento ${departamento}`,
        )
      } catch (error) {
        console.error("Error al cargar maestros:", error)
        toast.error("Error al cargar la lista de maestros")
        await logAction("Error", `Error al cargar maestros: ${error}`)
      } finally {
        setCargandoMaestros(false)
      }
    }
    cargarMaestrosPorDepartamento()
  }, [departamento, logAction])

  useEffect(() => {
    const cargarMaterias = async () => {
      if (!maestroSeleccionado) {
        setMaterias([])
        return
      }

      setCargandoMaterias(true)
      try {
        const materiasQuery = query(collection(db, "Materias"), where("MaestroID", "==", maestroSeleccionado))
        const querySnapshot = await getDocs(materiasQuery)
        const materiasData = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Materia,
        )
        setMaterias(materiasData)

        const maestroSeleccionadoData = maestros.find((m) => m.id === maestroSeleccionado)
        if (maestroSeleccionadoData) {
          setNombreMaestroSeleccionado(`${maestroSeleccionadoData.Nombre} ${maestroSeleccionadoData.Apellido}`)
        }
        await logAction(
          "Cargar Materias",
          `Se cargaron ${materiasData.length} materias para el maestro ${nombreMaestroSeleccionado}`,
        )
      } catch (error) {
        console.error("Error al cargar materias:", error)
        toast.error("Error al cargar las materias")
        await logAction("Error", `Error al cargar materias: ${error}`)
      } finally {
        setCargandoMaterias(false)
      }
    }
    cargarMaterias()
  }, [maestroSeleccionado, maestros, nombreMaestroSeleccionado, logAction])

  // Agregar efecto para cargar eventos
  useEffect(() => {
    const cargarEventos = async () => {
      setCargandoEventos(true)
      try {
        const eventosQuery = query(collection(db, "EventosLaboratorio"), orderBy("createdAt", "desc"))
        const querySnapshot = await getDocs(eventosQuery)
        const eventosData = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Evento,
        )
        setEventos(eventosData)
        await logAction("Cargar Eventos", `Se cargaron ${eventosData.length} eventos del laboratorio`)
      } catch (error) {
        console.error("Error al cargar eventos:", error)
        toast.error("Error al cargar los eventos")
        await logAction("Error", `Error al cargar eventos: ${error}`)
      } finally {
        setCargandoEventos(false)
      }
    }

    if (activeTab === "eventos") {
      cargarEventos()
    }
  }, [activeTab, logAction])

  // Mantener el código existente para iniciar clase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!departamento || !maestroSeleccionado || !materia || !practica || !grupo) {
      toast.error("Por favor, complete todos los campos")
      return
    }

    try {
      const docRef = await addDoc(collection(db, "ClassInformation"), {
        maestroNombre: nombreMaestroSeleccionado,
        maestroId: maestroSeleccionado,
        departamento,
        materia,
        practica,
        grupo,
        fecha: new Date().toLocaleDateString(),
        horaInicio: new Date().toLocaleTimeString(),
        totalAsistencias: 0,
        alumnos: [],
      })

      await setDoc(doc(db, "EstadoClaseInvitado", "actual"), {
        iniciada: true,
        MaestroInvitado: nombreMaestroSeleccionado,
        Materia: materia,
        Practica: practica,
        Departamento: departamento,
        HoraInicio: new Date().toLocaleTimeString(),
      })

      const nombreCompletoDocente = nombreMaestroSeleccionado

      localStorage.setItem(
        "claseInfo",
        JSON.stringify({
          maestroNombre: nombreMaestroSeleccionado,
          maestroId: maestroSeleccionado,
          departamento,
          materia,
          practica,
          grupo,
          fecha: new Date().toLocaleDateString(),
          horaInicio: new Date().toLocaleTimeString(),
          nombreCompletoDocente,
        }),
      )

      toast.success("Clase iniciada con éxito")
      await logAction("Iniciar Clase", `Clase iniciada por ${nombreMaestroSeleccionado} para ${materia} - ${practica}`)
      router.push("/lista-asistenciasInvitado")
    } catch (error) {
      console.error("Error al iniciar la clase:", error)
      toast.error("Error al iniciar la clase")
      await logAction("Error", `Error al iniciar la clase: ${error}`)
    }
  }

  // Agregar función para manejar el envío del formulario de eventos
  const handleSubmitEvento = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !nombreEvento ||
      !tipoEvento ||
      !organizadorEvento ||
      !participantesEvento ||
      !fechaEvento ||
      !horaEvento ||
      !duracionEvento
    ) {
      toast.error("Por favor, complete todos los campos obligatorios")
      return
    }

    try {
      await addDoc(collection(db, "EventosLaboratorio"), {
        nombre: nombreEvento,
        tipo: tipoEvento,
        organizador: organizadorEvento,
        participantes: Number.parseInt(participantesEvento),
        fecha: fechaEvento,
        hora: horaEvento,
        duracion: duracionEvento,
        descripcion: descripcionEvento,
        resultados: resultadosEvento,
        createdAt: serverTimestamp(),
      })

      // Limpiar el formulario
      setNombreEvento("")
      setTipoEvento("")
      setOrganizadorEvento("")
      setParticipantesEvento("")
      setFechaEvento("")
      setHoraEvento("")
      setDuracionEvento("")
      setDescripcionEvento("")
      setResultadosEvento("")

      toast.success("Evento registrado con éxito")
      await logAction("Registrar Evento", `Evento "${nombreEvento}" registrado por ${organizadorEvento}`)

      // Recargar la lista de eventos
      const eventosQuery = query(collection(db, "EventosLaboratorio"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(eventosQuery)
      const eventosData = querySnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Evento,
      )
      setEventos(eventosData)
    } catch (error) {
      console.error("Error al registrar el evento:", error)
      toast.error("Error al registrar el evento")
      await logAction("Error", `Error al registrar el evento: ${error}`)
    }
  }

  // Función para ver detalles de un evento
  const verDetallesEvento = (evento: Evento) => {
    setEventoSeleccionado(evento)
    setModalDetallesAbierto(true)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className={`border-none shadow-lg ${esModoOscuro ? "bg-[#1d5631]/10" : "bg-white"}`}>
        <CardHeader className={esModoOscuro ? modoColor.headerBackground : modoColor.headerBackground}>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-white/20">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">Panel de Maestro Invitado</CardTitle>
              <CardDescription className="text-white/80">
                Gestione clases invitadas y eventos del laboratorio
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-[#1BB827]/10 dark:bg-[#1BB827]/20 rounded-xl">
              <TabsTrigger
                value="clase"
                className={`text-sm py-3 rounded-lg transition-all duration-300 ${
                  esModoOscuro
                    ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                    : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                }`}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Iniciar Clase
              </TabsTrigger>
              <TabsTrigger
                value="eventos"
                className={`text-sm py-3 rounded-lg transition-all duration-300 ${
                  esModoOscuro
                    ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                    : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                }`}
              >
                <Award className="w-4 h-4 mr-2" />
                Eventos del Laboratorio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clase" className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="departamento" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                        <School className="inline-block w-4 h-4 mr-2" />
                        Departamento
                      </Label>
                      <Select value={departamento} onValueChange={setDepartamento}>
                        <SelectTrigger
                          className={`mt-2 ${
                            esModoOscuro
                              ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                              : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                          }`}
                        >
                          <SelectValue placeholder="Seleccione un departamento" />
                        </SelectTrigger>
                        <SelectContent className={esModoOscuro ? "bg-[#2a2a2a] text-white" : ""}>
                          <SelectItem value="Ingeniería Industrial">Ingeniería Industrial</SelectItem>
                          <SelectItem value="Ingeniería Civil">Ingeniería Civil</SelectItem>
                          <SelectItem value="Ingeniería en Sistemas Computacionales">
                            Ingeniería en Sistemas Computacionales
                          </SelectItem>
                          <SelectItem value="Licenciatura en Administración">Licenciatura en Administración</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="maestro" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                        <UserPlus className="inline-block w-4 h-4 mr-2" />
                        Seleccionar Maestro
                      </Label>
                      <Select
                        value={maestroSeleccionado}
                        onValueChange={setMaestroSeleccionado}
                        disabled={cargandoMaestros || maestros.length === 0}
                      >
                        <SelectTrigger
                          className={`mt-2 ${
                            esModoOscuro
                              ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                              : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                          }`}
                        >
                          <SelectValue
                            placeholder={
                              cargandoMaestros
                                ? "Cargando maestros..."
                                : maestros.length === 0 && departamento
                                  ? "No hay maestros disponibles"
                                  : "Seleccione un maestro"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className={esModoOscuro ? "bg-[#2a2a2a] text-white" : ""}>
                          {maestros.map((maestro) => (
                            <SelectItem key={maestro.id} value={maestro.id}>
                              {`${maestro.Nombre} ${maestro.Apellido}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="materia" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                        <BookOpen className="inline-block w-4 h-4 mr-2" />
                        Materia
                      </Label>
                      <Select
                        value={materia}
                        onValueChange={setMateria}
                        disabled={cargandoMaterias || materias.length === 0}
                      >
                        <SelectTrigger
                          className={`mt-2 ${
                            esModoOscuro
                              ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                              : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                          }`}
                        >
                          <SelectValue
                            placeholder={
                              cargandoMaterias
                                ? "Cargando materias..."
                                : materias.length === 0 && maestroSeleccionado
                                  ? "No hay materias disponibles"
                                  : "Seleccione una materia"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className={esModoOscuro ? "bg-[#2a2a2a] text-white" : ""}>
                          {materias.map((mat) => (
                            <SelectItem key={mat.id} value={mat.NombreMateria}>
                              {`${mat.NombreMateria} (Semestre ${mat.Semestre})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="practica" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                        <ClipboardList className="inline-block w-4 h-4 mr-2" />
                        Práctica
                      </Label>
                      <Input
                        id="practica"
                        value={practica}
                        onChange={(e) => setPractica(e.target.value)}
                        placeholder="Ingrese la práctica"
                        className={`mt-2 ${
                          esModoOscuro
                            ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                            : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                        }`}
                      />
                    </div>

                    <div>
                      <Label htmlFor="grupo" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                        <Users className="inline-block w-4 h-4 mr-2" />
                        Grupo
                      </Label>
                      <Input
                        id="grupo"
                        value={grupo}
                        onChange={(e) => setGrupo(e.target.value)}
                        placeholder="Ingrese el grupo"
                        className={`mt-2 ${
                          esModoOscuro
                            ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                            : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                        }`}
                      />
                    </div>

                    <div className={`p-4 rounded-lg ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-[#fff0f5]"} mt-2`}>
                      <div className="flex items-center mb-2">
                        <Calendar className={`w-4 h-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                        <span className={`font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          Fecha: {new Date().toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className={`w-4 h-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                        <span className={`font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          Hora: {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className={esModoOscuro ? "bg-gray-700" : "bg-gray-200"} />

                <Button
                  type="submit"
                  className={`w-full py-6 ${esModoOscuro ? modoColor.buttonPrimary : modoColor.buttonPrimary}`}
                  disabled={!departamento || !maestroSeleccionado || !materia || !practica || !grupo}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Iniciar Clase
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="eventos" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulario para registrar eventos */}
                <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
                  <CardHeader className={`pb-2 ${esModoOscuro ? "border-b border-gray-700" : "border-b"}`}>
                    <CardTitle className={`flex items-center ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                      <Award className="w-5 h-5 mr-2" />
                      Registrar Nuevo Evento
                    </CardTitle>
                    <CardDescription className={esModoOscuro ? "text-gray-300" : "text-[#800040]/80"}>
                      Complete el formulario para registrar un evento en el laboratorio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <form onSubmit={handleSubmitEvento} className="space-y-4">
                      <div className="space-y-3">
                        <Label htmlFor="nombreEvento" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                          <Bookmark className="inline-block w-4 h-4 mr-2" />
                          Nombre del Evento
                        </Label>
                        <Input
                          id="nombreEvento"
                          value={nombreEvento}
                          onChange={(e) => setNombreEvento(e.target.value)}
                          placeholder="Ej: Concurso de Programación"
                          className={`${
                            esModoOscuro
                              ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                              : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                          }`}
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="tipoEvento" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                          <Bookmark className="inline-block w-4 h-4 mr-2" />
                          Tipo de Evento
                        </Label>
                        <Select value={tipoEvento} onValueChange={setTipoEvento} required>
                          <SelectTrigger
                            className={`${
                              esModoOscuro
                                ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                                : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                            }`}
                          >
                            <SelectValue placeholder="Seleccione el tipo de evento" />
                          </SelectTrigger>
                          <SelectContent className={esModoOscuro ? "bg-[#2a2a2a] text-white" : ""}>
                            <SelectItem value="Concurso de Programación">Concurso de Programación</SelectItem>
                            <SelectItem value="Taller">Taller</SelectItem>
                            <SelectItem value="Conferencia">Conferencia</SelectItem>
                            <SelectItem value="Hackathon">Hackathon</SelectItem>
                            <SelectItem value="Curso">Curso</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="organizadorEvento" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                          <User className="inline-block w-4 h-4 mr-2" />
                          Organizador o Encargado
                        </Label>
                        <Input
                          id="organizadorEvento"
                          value={organizadorEvento}
                          onChange={(e) => setOrganizadorEvento(e.target.value)}
                          placeholder="Nombre del organizador o encargado"
                          className={`${
                            esModoOscuro
                              ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                              : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                          }`}
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="participantesEvento" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                          <Users className="inline-block w-4 h-4 mr-2" />
                          Número de Participantes
                        </Label>
                        <Input
                          id="participantesEvento"
                          type="number"
                          value={participantesEvento}
                          onChange={(e) => setParticipantesEvento(e.target.value)}
                          placeholder="Ej: 20"
                          className={`${
                            esModoOscuro
                              ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                              : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                          }`}
                          min="1"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label htmlFor="fechaEvento" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                            <CalendarDays className="inline-block w-4 h-4 mr-2" />
                            Fecha del Evento
                          </Label>
                          <Input
                            id="fechaEvento"
                            type="date"
                            value={fechaEvento}
                            onChange={(e) => setFechaEvento(e.target.value)}
                            className={`${
                              esModoOscuro
                                ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                                : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                            }`}
                            required
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="horaEvento" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                            <Clock className="inline-block w-4 h-4 mr-2" />
                            Hora del Evento
                          </Label>
                          <Input
                            id="horaEvento"
                            type="time"
                            value={horaEvento}
                            onChange={(e) => setHoraEvento(e.target.value)}
                            className={`${
                              esModoOscuro
                                ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                                : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                            }`}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="duracionEvento" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                          <Timer className="inline-block w-4 h-4 mr-2" />
                          Duración del Evento
                        </Label>
                        <Input
                          id="duracionEvento"
                          value={duracionEvento}
                          onChange={(e) => setDuracionEvento(e.target.value)}
                          placeholder="Ej: 2 horas, 3 días, etc."
                          className={`${
                            esModoOscuro
                              ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                              : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                          }`}
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="descripcionEvento" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                          <FileText className="inline-block w-4 h-4 mr-2" />
                          Descripción del Evento
                        </Label>
                        <Textarea
                          id="descripcionEvento"
                          value={descripcionEvento}
                          onChange={(e) => setDescripcionEvento(e.target.value)}
                          placeholder="Describa brevemente el evento..."
                          className={`${
                            esModoOscuro
                              ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                              : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                          }`}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="resultadosEvento" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                          <FileText className="inline-block w-4 h-4 mr-2" />
                          Resultados o Notas Adicionales
                        </Label>
                        <Textarea
                          id="resultadosEvento"
                          value={resultadosEvento}
                          onChange={(e) => setResultadosEvento(e.target.value)}
                          placeholder="Resultados, ganadores o notas adicionales..."
                          className={`${
                            esModoOscuro
                              ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                              : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                          }`}
                          rows={3}
                        />
                      </div>

                      <Button
                        type="submit"
                        className={`w-full py-4 ${esModoOscuro ? modoColor.buttonPrimary : modoColor.buttonPrimary}`}
                      >
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Registrar Evento
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Lista de eventos registrados */}
                <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
                  <CardHeader className={`pb-2 ${esModoOscuro ? "border-b border-gray-700" : "border-b"}`}>
                    <CardTitle className={`flex items-center ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                      <Award className="w-5 h-5 mr-2" />
                      Eventos Registrados
                    </CardTitle>
                    <CardDescription className={esModoOscuro ? "text-gray-300" : "text-[#800040]/80"}>
                      Historial de eventos realizados en el laboratorio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {cargandoEventos ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                      </div>
                    ) : eventos.length > 0 ? (
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-4">
                          {eventos.map((evento) => (
                            <Card
                              key={evento.id}
                              className={`border ${
                                esModoOscuro ? "border-gray-700 bg-[#1d5631]/30" : "border-gray-200 bg-white"
                              } hover:shadow-md transition-shadow duration-200`}
                            >
                              <CardHeader className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <CardTitle
                                      className={`text-base font-semibold ${
                                        esModoOscuro ? "text-white" : "text-[#800040]"
                                      }`}
                                    >
                                      {evento.nombre}
                                    </CardTitle>
                                    <CardDescription className={esModoOscuro ? "text-gray-300" : "text-[#800040]/80"}>
                                      {evento.fecha} - {evento.hora}
                                    </CardDescription>
                                  </div>
                                  <Badge
                                    className={esModoOscuro ? "bg-[#1d5631] text-white" : "bg-[#800040] text-white"}
                                  >
                                    {evento.tipo}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                                  <div className="flex items-center">
                                    <User
                                      className={`h-4 w-4 mr-1 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                                    />
                                    <span className={esModoOscuro ? "text-gray-300" : "text-gray-700"}>
                                      {evento.organizador}
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <Users
                                      className={`h-4 w-4 mr-1 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                                    />
                                    <span className={esModoOscuro ? "text-gray-300" : "text-gray-700"}>
                                      {evento.participantes} participantes
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <Timer
                                      className={`h-4 w-4 mr-1 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                                    />
                                    <span className={esModoOscuro ? "text-gray-300" : "text-gray-700"}>
                                      {evento.duracion}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-end mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => verDetallesEvento(evento)}
                                    className={`${
                                      esModoOscuro
                                        ? "border-[#1d5631] text-white hover:bg-[#1d5631]/20"
                                        : "border-[#800040] text-[#800040] hover:bg-[#fff0f5]"
                                    }`}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver Detalles
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40">
                        <Award className={`h-12 w-12 mb-2 ${esModoOscuro ? "text-gray-500" : "text-gray-400"}`} />
                        <p className={`text-lg font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          No hay eventos registrados
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter
          className={`p-4 ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-[#fff0f5]"} border-t ${esModoOscuro ? "border-gray-700" : "border-gray-200"}`}
        >
          <p className={`text-sm ${esModoOscuro ? "text-gray-300" : "text-gray-600"}`}>
            {activeTab === "clase"
              ? "Al iniciar la clase, los estudiantes podrán registrar su asistencia desde la página principal."
              : "Los eventos registrados quedarán almacenados en el historial del laboratorio para consultas futuras."}
          </p>
        </CardFooter>
      </Card>

      {/* Modal para ver detalles del evento */}
      <Dialog open={modalDetallesAbierto} onOpenChange={setModalDetallesAbierto}>
        <DialogContent
          className={`sm:max-w-[600px] ${esModoOscuro ? "bg-[#1d5631]/90 text-white" : "bg-white text-[#800040]"}`}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <Award className="h-5 w-5 mr-2" />
              {eventoSeleccionado?.nombre}
            </DialogTitle>
          </DialogHeader>
          {eventoSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg ${esModoOscuro ? "bg-[#1d5631]" : "bg-[#fff0f5]"}`}>
                  <div className="flex items-center mb-1">
                    <Bookmark className="h-4 w-4 mr-2" />
                    <span className="font-medium">Tipo:</span>
                  </div>
                  <p>{eventoSeleccionado.tipo}</p>
                </div>
                <div className={`p-3 rounded-lg ${esModoOscuro ? "bg-[#1d5631]" : "bg-[#fff0f5]"}`}>
                  <div className="flex items-center mb-1">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">Organizador:</span>
                  </div>
                  <p>{eventoSeleccionado.organizador}</p>
                </div>
                <div className={`p-3 rounded-lg ${esModoOscuro ? "bg-[#1d5631]" : "bg-[#fff0f5]"}`}>
                  <div className="flex items-center mb-1">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="font-medium">Participantes:</span>
                  </div>
                  <p>{eventoSeleccionado.participantes}</p>
                </div>
                <div className={`p-3 rounded-lg ${esModoOscuro ? "bg-[#1d5631]" : "bg-[#fff0f5]"}`}>
                  <div className="flex items-center mb-1">
                    <Timer className="h-4 w-4 mr-2" />
                    <span className="font-medium">Duración:</span>
                  </div>
                  <p>{eventoSeleccionado.duracion}</p>
                </div>
              </div>

              <div className={`p-3 rounded-lg ${esModoOscuro ? "bg-[#1d5631]" : "bg-[#fff0f5]"}`}>
                <div className="flex items-center mb-1">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <span className="font-medium">Fecha y Hora:</span>
                </div>
                <p>
                  {eventoSeleccionado.fecha} a las {eventoSeleccionado.hora}
                </p>
              </div>

              <div className={`p-3 rounded-lg ${esModoOscuro ? "bg-[#1d5631]" : "bg-[#fff0f5]"}`}>
                <div className="flex items-center mb-1">
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="font-medium">Descripción:</span>
                </div>
                <p>{eventoSeleccionado.descripcion || "No se proporcionó descripción."}</p>
              </div>

              {eventoSeleccionado.resultados && (
                <div className={`p-3 rounded-lg ${esModoOscuro ? "bg-[#1d5631]" : "bg-[#fff0f5]"}`}>
                  <div className="flex items-center mb-1">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="font-medium">Resultados:</span>
                  </div>
                  <p>{eventoSeleccionado.resultados}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setModalDetallesAbierto(false)}
              className={esModoOscuro ? modoColor.buttonPrimary : modoColor.buttonPrimary}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-right" />
    </motion.div>
  )
}

