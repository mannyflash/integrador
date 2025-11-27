"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pencil,
  Trash2,
  UserCircle,
  GraduationCap,
  Clock,
  BookOpen,
  Users,
  Search,
  RefreshCw,
  X,
  Plus,
  Save,
  Ban,
  ArrowLeft,
  Layers,
  List,
} from "lucide-react"
import {
  collection,
  setDoc,
  doc,
  getDocs,
  query,
  deleteDoc,
  updateDoc,
  type Firestore,
  getDoc,
} from "firebase/firestore"
import Swal from "sweetalert2"
import type React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Alumno {
  Matricula: string
  Nombre: string
  Apellido: string
  Carrera: string
  Semestre: string
  Turno: string
  Grupo: string
  Materias?: string[] // Agregado campo de materias inscritas
  [key: string]: any
}

type Vista = "menu" | "agregar" | "lista"

export function AlumnosTab({
  db,
  isDarkMode,
  currentColors,
}: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
  const [vistaActual, setVistaActual] = useState<Vista>("menu")

  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [datosAlumno, setDatosAlumno] = useState<Alumno>({
    Matricula: "",
    Nombre: "",
    Apellido: "",
    Carrera: "",
    Semestre: "",
    Turno: "",
    Grupo: "",
    Materias: [], // Inicializar array de materias
  })
  const [editando, setEditando] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [carreraFilter, setCarreraFilter] = useState("todas")
  const [semestreFilter, setSemestreFilter] = useState("todos")
  const [turnoFilter, setTurnoFilter] = useState("todos")
  const [actualizacionMasiva, setActualizacionMasiva] = useState(false)
  const [tipoActualizacion, setTipoActualizacion] = useState("semestre")

  // Estados para actualización masiva de semestres
  const [carreraSeleccionada, setCarreraSeleccionada] = useState("")
  const [semestreActual, setSemestreActual] = useState("")
  const [nuevoSemestre, setNuevoSemestre] = useState("")

  // Estados para actualización masiva de grupos
  const [carreraGrupo, setCarreraGrupo] = useState("")
  const [semestreGrupo, setSemestreGrupo] = useState("")
  const [grupoActual, setGrupoActual] = useState("")
  const [nuevoGrupo, setNuevoGrupo] = useState("")

  const [actualizando, setActualizando] = useState(false)

  // Estados para materias
  const [materiasDisponibles, setMateriasDisponibles] = useState<{ id: string; nombre: string }[]>([])
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<string[]>([])

  useEffect(() => {
    cargarAlumnos()
  }, [])

  useEffect(() => {
    const cargarMaterias = async () => {
      try {
        const materiasSnapshot = await getDocs(collection(db, "Materias"))
        const materiasData = materiasSnapshot.docs.map((doc) => ({
          id: doc.id,
          nombre: doc.data().NombreMateria,
        }))
        setMateriasDisponibles(materiasData)
      } catch (error) {
        console.error("Error al cargar materias:", error)
      }
    }
    cargarMaterias()
  }, [db])

  const cargarAlumnos = async () => {
    setIsLoading(true)
    try {
      const alumnosRef = collection(db, "Alumnos")
      const alumnosSnapshot = await getDocs(query(alumnosRef))
      const alumnosData = alumnosSnapshot.docs.map((doc) => ({
        Matricula: doc.id,
        Nombre: doc.data().Nombre || "",
        Apellido: doc.data().Apellido || "",
        Carrera: doc.data().Carrera || "",
        Semestre: doc.data().Semestre || "",
        Turno: doc.data().Turno || "",
        Grupo: doc.data().Grupo || "",
        Materias: doc.data().Materias || [], // Asegurar que Materias exista
        ...doc.data(),
      })) as Alumno[]
      setAlumnos(alumnosData)
    } catch (error) {
      console.error("Error al cargar alumnos:", error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los alumnos. Por favor, intenta de nuevo.",
        icon: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { Matricula, ...restoDatosAlumno } = datosAlumno

      const datosConMaterias = {
        ...restoDatosAlumno,
        Materias: materiasSeleccionadas,
      }

      if (!editando) {
        const alumnoDoc = doc(db, "Alumnos", Matricula)
        const alumnoSnapshot = await getDoc(alumnoDoc)

        if (alumnoSnapshot.exists()) {
          await Swal.fire({
            title: "Error",
            text: "Esta matrícula ya existe. Por favor, use una matrícula diferente.",
            icon: "error",
          })
          return
        }

        await setDoc(alumnoDoc, datosConMaterias) // Guardar con materias
        await Swal.fire({
          title: "¡Éxito!",
          text: "Alumno agregado correctamente",
          icon: "success",
        })
      } else {
        await updateDoc(doc(db, "Alumnos", Matricula), datosConMaterias) // Actualizar con materias
        await Swal.fire({
          title: "¡Éxito!",
          text: "Alumno actualizado correctamente",
          icon: "success",
        })
        setEditando(false)
      }
      setDatosAlumno({
        Matricula: "",
        Nombre: "",
        Apellido: "",
        Carrera: "",
        Semestre: "",
        Turno: "",
        Grupo: "",
        Materias: [],
      })
      setMateriasSeleccionadas([]) // Limpiar materias seleccionadas
      cargarAlumnos()
      setVistaActual("lista")
    } catch (error) {
      console.error("Error al agregar/actualizar alumno:", error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error al agregar/actualizar el alumno. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const eliminarAlumno = async (matricula: string) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar!",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "Alumnos", matricula))
        Swal.fire("Eliminado!", "El alumno ha sido eliminado.", "success")
        cargarAlumnos()
      } catch (error) {
        console.error("Error al eliminar alumno:", error)
        Swal.fire("Error!", "Ha ocurrido un error al eliminar el alumno.", "error")
      }
    }
  }

  const toggleSeleccionarTodos = () => {
    if (seleccionados.length === alumnosFiltrados.length) {
      setSeleccionados([])
    } else {
      setSeleccionados(alumnosFiltrados.map((a) => a.Matricula))
    }
  }

  const toggleSeleccionarAlumno = (matricula: string) => {
    setSeleccionados((prev) => (prev.includes(matricula) ? prev.filter((m) => m !== matricula) : [...prev, matricula]))
  }

  const eliminarSeleccionados = async () => {
    if (seleccionados.length === 0) {
      Swal.fire("Advertencia", "No has seleccionado ningún alumno", "warning")
      return
    }

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `Se eliminarán ${seleccionados.length} alumno(s). No podrás revertir esta acción!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar!",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        await Promise.all(seleccionados.map((matricula) => deleteDoc(doc(db, "Alumnos", matricula))))
        Swal.fire("Eliminados!", `${seleccionados.length} alumno(s) eliminado(s).`, "success")
        setSeleccionados([])
        cargarAlumnos()
      } catch (error) {
        console.error("Error al eliminar alumnos:", error)
        Swal.fire("Error!", "Ha ocurrido un error al eliminar los alumnos.", "error")
      }
    }
  }

  const actualizarSemestreMasivo = async () => {
    if (!carreraSeleccionada || !semestreActual || !nuevoSemestre) {
      await Swal.fire({
        title: "Error",
        text: "Por favor, selecciona todos los campos requeridos.",
        icon: "error",
      })
      return
    }

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas cambiar a todos los alumnos de ${carreraSeleccionada}, del semestre ${semestreActual}º al semestre ${nuevoSemestre}º?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, actualizar",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        setActualizando(true)
        const alumnosRef = collection(db, "Alumnos")
        const alumnosSnapshot = await getDocs(query(alumnosRef))

        const actualizaciones = []
        let contador = 0

        for (const docSnapshot of alumnosSnapshot.docs) {
          const alumnoData = docSnapshot.data()
          if (alumnoData.Carrera === carreraSeleccionada && alumnoData.Semestre === semestreActual) {
            actualizaciones.push(
              updateDoc(doc(db, "Alumnos", docSnapshot.id), {
                Semestre: nuevoSemestre,
              }),
            )
            contador++
          }
        }

        await Promise.all(actualizaciones)

        await Swal.fire({
          title: "¡Éxito!",
          text: `Se actualizaron ${contador} alumnos del semestre ${semestreActual}º al semestre ${nuevoSemestre}º.`,
          icon: "success",
        })

        cargarAlumnos()
        setCarreraSeleccionada("")
        setSemestreActual("")
        setNuevoSemestre("")
        setActualizacionMasiva(false) // Close the massive update section
      } catch (error) {
        console.error("Error al actualizar semestres:", error)
        await Swal.fire({
          title: "Error",
          text: "Ha ocurrido un error al actualizar los semestres. Por favor, intenta de nuevo.",
          icon: "error",
        })
      } finally {
        setActualizando(false)
      }
    }
  }

  const actualizarGrupoMasivo = async () => {
    if (!carreraGrupo || !semestreGrupo || !grupoActual || !nuevoGrupo) {
      await Swal.fire({
        title: "Error",
        text: "Por favor, selecciona todos los campos requeridos.",
        icon: "error",
      })
      return
    }

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas cambiar a todos los alumnos de ${carreraGrupo}, del semestre ${semestreGrupo}º, del grupo ${grupoActual} al grupo ${nuevoGrupo}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, actualizar",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        setActualizando(true)
        const alumnosRef = collection(db, "Alumnos")
        const alumnosSnapshot = await getDocs(query(alumnosRef))

        const actualizaciones = []
        let contador = 0

        for (const docSnapshot of alumnosSnapshot.docs) {
          const alumnoData = docSnapshot.data()
          if (
            alumnoData.Carrera === carreraGrupo &&
            alumnoData.Semestre === semestreGrupo &&
            alumnoData.Grupo === grupoActual
          ) {
            actualizaciones.push(
              updateDoc(doc(db, "Alumnos", docSnapshot.id), {
                Grupo: nuevoGrupo,
              }),
            )
            contador++
          }
        }

        await Promise.all(actualizaciones)

        await Swal.fire({
          title: "¡Éxito!",
          text: `Se actualizaron ${contador} alumnos del grupo ${grupoActual} al grupo ${nuevoGrupo}.`,
          icon: "success",
        })

        cargarAlumnos()
        setCarreraGrupo("")
        setSemestreGrupo("")
        setGrupoActual("")
        setNuevoGrupo("")
        setActualizacionMasiva(false) // Close the massive update section
      } catch (error) {
        console.error("Error al actualizar grupos:", error)
        await Swal.fire({
          title: "Error",
          text: "Ha ocurrido un error al actualizar los grupos. Por favor, intenta de nuevo.",
          icon: "error",
        })
      } finally {
        setActualizando(false)
      }
    }
  }

  const modificarAlumno = (alumno: Alumno) => {
    setDatosAlumno(alumno)
    setMateriasSeleccionadas(alumno.Materias || []) // Cargar materias del alumno
    setEditando(true)
    setVistaActual("agregar")
  }

  const cancelarEdicion = () => {
    setDatosAlumno({
      Matricula: "",
      Nombre: "",
      Apellido: "",
      Carrera: "",
      Semestre: "",
      Turno: "",
      Grupo: "",
      Materias: [],
    })
    setEditando(false)
    setMateriasSeleccionadas([]) // Limpiar materias seleccionadas
  }

  const toggleMateria = (materiaId: string) => {
    setMateriasSeleccionadas((prev) => {
      if (prev.includes(materiaId)) {
        return prev.filter((id) => id !== materiaId)
      } else {
        return [...prev, materiaId]
      }
    })
  }

  const alumnosFiltrados = useMemo(() => {
    return alumnos.filter((alumno) => {
      const matchesSearch =
        alumno.Matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumno.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumno.Apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alumno.Grupo.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCarrera = carreraFilter === "todas" || alumno.Carrera === carreraFilter
      const matchesSemestre = semestreFilter === "todos" || alumno.Semestre === semestreFilter
      const matchesTurno = turnoFilter === "todos" || alumno.Turno === turnoFilter

      return matchesSearch && matchesCarrera && matchesSemestre && matchesTurno
    })
  }, [alumnos, searchTerm, carreraFilter, semestreFilter, turnoFilter])

  const carreras = [...new Set(alumnos.map((alumno) => alumno.Carrera))].filter(Boolean)
  const semestres = [...new Set(alumnos.map((alumno) => alumno.Semestre))].filter(Boolean).sort()
  const turnos = [...new Set(alumnos.map((alumno) => alumno.Turno))].filter(Boolean)
  const grupos = [...new Set(alumnos.map((alumno) => alumno.Grupo))].filter(Boolean)

  const resetFilters = () => {
    setCarreraFilter("todas")
    setSemestreFilter("todos")
    setTurnoFilter("todos")
    setSearchTerm("")
  }

  const headerBgClass = isDarkMode
    ? "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]"
    : "bg-gradient-to-r from-[#800040] to-[#a30050]"

  if (vistaActual === "menu") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto p-4">
        <Card
          className={`${isDarkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"} shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 cursor-pointer transform hover:scale-[1.02]`}
          onClick={() => setVistaActual("agregar")}
        >
          <CardHeader className="bg-gradient-to-br from-[#952952] to-[#7a1f42] text-white p-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full shadow-lg">
                <Plus className="h-16 w-16" />
              </div>
              <CardTitle className="text-3xl font-bold">Agregar Alumno</CardTitle>
              <CardDescription className="text-white/90 text-base">
                Registra un nuevo alumno en el sistema
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-10 bg-gradient-to-b from-white to-gray-50">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-center gap-3 text-base">
                <UserCircle className="h-5 w-5 text-[#952952]" />
                <span>Asignar matrícula y nombre</span>
              </li>
              <li className="flex items-center gap-3 text-base">
                <GraduationCap className="h-5 w-5 text-[#952952]" />
                <span>Seleccionar carrera y semestre</span>
              </li>
              <li className="flex items-center gap-3 text-base">
                <Users className="h-5 w-5 text-[#952952]" />
                <span>Definir turno y grupo</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card
          className={`${isDarkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"} shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 cursor-pointer transform hover:scale-[1.02]`}
          onClick={() => setVistaActual("lista")}
        >
          <CardHeader className="bg-gradient-to-br from-[#952952] to-[#7a1f42] text-white p-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full shadow-lg">
                <List className="h-16 w-16" />
              </div>
              <CardTitle className="text-3xl font-bold">Ver Lista de Alumnos</CardTitle>
              <CardDescription className="text-white/90 text-base">
                Consulta, edita o elimina alumnos existentes
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-10 bg-gradient-to-b from-white to-gray-50">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-center gap-3 text-base">
                <Search className="h-5 w-5 text-[#952952]" />
                <span>Buscar y filtrar alumnos</span>
              </li>
              <li className="flex items-center gap-3 text-base">
                <Pencil className="h-5 w-5 text-[#952952]" />
                <span>Editar información</span>
              </li>
              <li className="flex items-center gap-3 text-base">
                <Trash2 className="h-5 w-5 text-[#952952]" />
                <span>Eliminar registros</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (vistaActual === "agregar") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card
          className={`${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-shadow duration-300 border-0`}
        >
          <CardHeader className="bg-gradient-to-br from-[#952952] to-[#7a1f42] text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                  {editando ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{editando ? "Editar Alumno" : "Agregar Alumno"}</CardTitle>
                  <CardDescription className="text-white/80 mt-1">
                    {editando
                      ? "Modifica los datos del alumno seleccionado"
                      : "Completa el formulario para agregar un nuevo alumno"}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setVistaActual("menu")
                  cancelarEdicion()
                }}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Menú
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={manejarEnvio} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="matriculaAlumno"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <UserCircle className="h-4 w-4" /> Matrícula
                </Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="matriculaAlumno"
                    value={datosAlumno.Matricula}
                    onChange={(e) => setDatosAlumno({ ...datosAlumno, Matricula: e.target.value })}
                    required
                    disabled={editando}
                    placeholder="Ej: 20230001"
                    className={`pl-10 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="nombreAlumno"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <UserCircle className="h-4 w-4" /> Nombre
                </Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="nombreAlumno"
                    value={datosAlumno.Nombre}
                    onChange={(e) => setDatosAlumno({ ...datosAlumno, Nombre: e.target.value })}
                    required
                    placeholder="Ej: Juan"
                    className={`pl-10 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="apellidoAlumno"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <UserCircle className="h-4 w-4" /> Apellido
                </Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="apellidoAlumno"
                    value={datosAlumno.Apellido}
                    onChange={(e) => setDatosAlumno({ ...datosAlumno, Apellido: e.target.value })}
                    required
                    placeholder="Ej: Pérez"
                    className={`pl-10 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="carreraAlumno"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <GraduationCap className="h-4 w-4" /> Carrera
                </Label>
                <Select
                  value={datosAlumno.Carrera}
                  onValueChange={(value) => setDatosAlumno({ ...datosAlumno, Carrera: value })}
                >
                  <SelectTrigger
                    id="carreraAlumno"
                    className={`${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"} pl-10`}
                  >
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <GraduationCap className="h-4 w-4 text-gray-500" />
                    </div>
                    <SelectValue placeholder="Selecciona una carrera" />
                  </SelectTrigger>
                  <SelectContent className={isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                    <SelectItem value="Ingenieria en sistemas computacionales">
                      Ingeniería en Sistemas Computacionales
                    </SelectItem>
                    <SelectItem value="ingenieria industrial">Ingeniería Industrial</SelectItem>
                    <SelectItem value="licenciatura en administracion de empresas">
                      Licenciatura en Administración de Empresas
                    </SelectItem>
                    <SelectItem value="ingenieria civil">Ingeniería Civil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="semestreAlumno"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <BookOpen className="h-4 w-4" /> Semestre
                </Label>
                <Select
                  value={datosAlumno.Semestre}
                  onValueChange={(value) => setDatosAlumno({ ...datosAlumno, Semestre: value })}
                >
                  <SelectTrigger
                    id="semestreAlumno"
                    className={`${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"} pl-10`}
                  >
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                    </div>
                    <SelectValue placeholder="Selecciona un semestre" />
                  </SelectTrigger>
                  <SelectContent className={isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((semestre) => (
                      <SelectItem key={semestre} value={semestre.toString()}>
                        {semestre}º Semestre
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="turnoAlumno"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <Clock className="h-4 w-4" /> Turno
                </Label>
                <Select
                  value={datosAlumno.Turno}
                  onValueChange={(value) => setDatosAlumno({ ...datosAlumno, Turno: value })}
                >
                  <SelectTrigger
                    id="turnoAlumno"
                    className={`${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"} pl-10`}
                  >
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <SelectValue placeholder="Selecciona un turno" />
                  </SelectTrigger>
                  <SelectContent className={isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                    <SelectItem value="matutino">Matutino</SelectItem>
                    <SelectItem value="vespertino">Vespertino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="grupoAlumno"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <Users className="h-4 w-4" /> Grupo
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="grupoAlumno"
                    value={datosAlumno.Grupo}
                    onChange={(e) => setDatosAlumno({ ...datosAlumno, Grupo: e.target.value })}
                    required
                    placeholder="Ej: A"
                    className={`pl-10 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}>
                  <BookOpen className="h-4 w-4" /> Materias Inscritas
                </Label>
                <div
                  className={`border rounded-lg p-4 ${isDarkMode ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"} max-h-60 overflow-y-auto`}
                >
                  {materiasDisponibles.length === 0 ? (
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      No hay materias disponibles
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {materiasDisponibles.map((materia) => (
                        <div key={materia.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`materia-${materia.id}`}
                            checked={materiasSeleccionadas.includes(materia.id)}
                            onChange={() => toggleMateria(materia.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#952952] focus:ring-[#952952]"
                          />
                          <label
                            htmlFor={`materia-${materia.id}`}
                            className={`text-sm cursor-pointer ${isDarkMode ? "text-white" : "text-gray-700"}`}
                          >
                            {materia.nombre}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Selecciona las materias que el alumno está cursando
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className={`flex-1 gap-2 ${
                    isDarkMode
                      ? "bg-[#1d5631] hover:bg-[#153d23] text-white"
                      : "bg-[#800040] hover:bg-[#5c002e] text-white"
                  } transition-all duration-200`}
                >
                  {editando ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editando ? "Actualizar Alumno" : "Agregar Alumno"}
                </Button>

                {editando && (
                  <Button type="button" onClick={cancelarEdicion} variant="outline" className="gap-2 bg-transparent">
                    <Ban className="h-4 w-4" />
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Card
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-shadow duration-300 border-0 overflow-hidden`}
      >
        <CardHeader className="bg-gradient-to-br from-[#952952] to-[#7a1f42] text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVistaActual("menu")}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Menú
              </Button>
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Lista de Alumnos</CardTitle>
                <span className="text-white/80 text-sm">
                  {alumnosFiltrados.length} {alumnosFiltrados.length === 1 ? "alumno" : "alumnos"}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={cargarAlumnos} className="text-white hover:bg-white/20">
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Actualizar</span>
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar alumnos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 text-white border-white/20 placeholder:text-gray-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={carreraFilter} onValueChange={setCarreraFilter}>
                <SelectTrigger className="flex-1 bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="Filtrar por carrera" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  <SelectItem value="todas">Todas las carreras</SelectItem>
                  {carreras.map((carrera) => (
                    <SelectItem key={carrera} value={carrera}>
                      {carrera}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={semestreFilter} onValueChange={setSemestreFilter}>
                <SelectTrigger className="w-[180px] bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="Filtrar por semestre" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  <SelectItem value="todos">Todos los semestres</SelectItem>
                  {semestres.map((semestre) => (
                    <SelectItem key={semestre} value={semestre}>
                      {semestre}º Semestre
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={turnoFilter} onValueChange={setTurnoFilter}>
                <SelectTrigger className="w-[150px] bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="Filtrar por turno" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  <SelectItem value="todos">Todos los turnos</SelectItem>
                  {turnos.map((turno) => (
                    <SelectItem key={turno} value={turno}>
                      {turno.charAt(0).toUpperCase() + turno.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  setActualizacionMasiva(!actualizacionMasiva)
                  if (!actualizacionMasiva) {
                    setTipoActualizacion("semestre")
                  }
                }}
                size="sm"
                className="bg-yellow-500/80 hover:bg-yellow-500 text-white"
              >
                {actualizacionMasiva ? "Cancelar actualización" : "Actualización masiva"}
              </Button>
            </div>
          </div>
        </CardHeader>
        {actualizacionMasiva && (
          <div className="px-6 py-4 bg-black/5 border-t border-b border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-800"}`}>
              Actualización masiva
            </h3>

            <Tabs value={tipoActualizacion} onValueChange={setTipoActualizacion} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="semestre" className="text-sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Actualizar Semestres
                </TabsTrigger>
                <TabsTrigger value="grupo" className="text-sm">
                  <Layers className="h-4 w-4 mr-2" />
                  Actualizar Grupos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="semestre">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className={`text-sm mb-1 block ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Carrera
                    </Label>
                    <Select value={carreraSeleccionada} onValueChange={setCarreraSeleccionada}>
                      <SelectTrigger
                        className={`${
                          isDarkMode
                            ? "bg-gray-700 text-white border-gray-600"
                            : "bg-white text-gray-900 border-gray-300"
                        } rounded-md transition-all duration-200`}
                      >
                        <SelectValue placeholder="Seleccionar carrera" />
                      </SelectTrigger>
                      <SelectContent
                        className={`${
                          isDarkMode
                            ? "bg-gray-800 text-white border-gray-700"
                            : "bg-white text-gray-900 border-gray-200"
                        }`}
                      >
                        {carreras.map((carrera) => (
                          <SelectItem key={carrera} value={carrera}>
                            {carrera}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={`text-sm mb-1 block ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Semestre actual
                    </Label>
                    <Select value={semestreActual} onValueChange={setSemestreActual}>
                      <SelectTrigger
                        className={`${
                          isDarkMode
                            ? "bg-gray-700 text-white border-gray-600"
                            : "bg-white text-gray-900 border-gray-300"
                        } rounded-md transition-all duration-200`}
                      >
                        <SelectValue placeholder="Seleccionar semestre" />
                      </SelectTrigger>
                      <SelectContent
                        className={`${
                          isDarkMode
                            ? "bg-gray-800 text-white border-gray-700"
                            : "bg-white text-gray-900 border-gray-200"
                        }`}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((semestre) => (
                          <SelectItem key={semestre} value={semestre.toString()}>
                            {semestre}º Semestre
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={`text-sm mb-1 block ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Nuevo semestre
                    </Label>
                    <Select value={nuevoSemestre} onValueChange={setNuevoSemestre}>
                      <SelectTrigger
                        className={`${
                          isDarkMode
                            ? "bg-gray-700 text-white border-gray-600"
                            : "bg-white text-gray-900 border-gray-300"
                        } rounded-md transition-all duration-200`}
                      >
                        <SelectValue placeholder="Seleccionar semestre" />
                      </SelectTrigger>
                      <SelectContent
                        className={`${
                          isDarkMode
                            ? "bg-gray-800 text-white border-gray-700"
                            : "bg-white text-gray-900 border-gray-200"
                        }`}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((semestre) => (
                          <SelectItem key={semestre} value={semestre.toString()}>
                            {semestre}º Semestre
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={actualizarSemestreMasivo}
                      disabled={actualizando || !carreraSeleccionada || !semestreActual || !nuevoSemestre}
                      className={`w-full ${
                        isDarkMode
                          ? "bg-green-700 hover:bg-green-600 text-white"
                          : "bg-red-800 hover:bg-red-700 text-white"
                      } rounded-md transition-all duration-200`}
                    >
                      {actualizando ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Actualizando...</span>
                        </div>
                      ) : (
                        <span>Actualizar semestres</span>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="grupo">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label className={`text-sm mb-1 block ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Carrera
                    </Label>
                    <Select value={carreraGrupo} onValueChange={setCarreraGrupo}>
                      <SelectTrigger
                        className={`${
                          isDarkMode
                            ? "bg-gray-700 text-white border-gray-600"
                            : "bg-white text-gray-900 border-gray-300"
                        } rounded-md transition-all duration-200`}
                      >
                        <SelectValue placeholder="Seleccionar carrera" />
                      </SelectTrigger>
                      <SelectContent
                        className={`${
                          isDarkMode
                            ? "bg-gray-800 text-white border-gray-700"
                            : "bg-white text-gray-900 border-gray-200"
                        }`}
                      >
                        {carreras.map((carrera) => (
                          <SelectItem key={carrera} value={carrera}>
                            {carrera}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={`text-sm mb-1 block ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Semestre
                    </Label>
                    <Select value={semestreGrupo} onValueChange={setSemestreGrupo}>
                      <SelectTrigger
                        className={`${
                          isDarkMode
                            ? "bg-gray-700 text-white border-gray-600"
                            : "bg-white text-gray-900 border-gray-300"
                        } rounded-md transition-all duration-200`}
                      >
                        <SelectValue placeholder="Seleccionar semestre" />
                      </SelectTrigger>
                      <SelectContent
                        className={`${
                          isDarkMode
                            ? "bg-gray-800 text-white border-gray-700"
                            : "bg-white text-gray-900 border-gray-200"
                        }`}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((semestre) => (
                          <SelectItem key={semestre} value={semestre.toString()}>
                            {semestre}º Semestre
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={`text-sm mb-1 block ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Grupo actual
                    </Label>
                    <Select value={grupoActual} onValueChange={setGrupoActual}>
                      <SelectTrigger
                        className={`${
                          isDarkMode
                            ? "bg-gray-700 text-white border-gray-600"
                            : "bg-white text-gray-900 border-gray-300"
                        } rounded-md transition-all duration-200`}
                      >
                        <SelectValue placeholder="Seleccionar grupo" />
                      </SelectTrigger>
                      <SelectContent
                        className={`${
                          isDarkMode
                            ? "bg-gray-800 text-white border-gray-700"
                            : "bg-white text-gray-900 border-gray-200"
                        }`}
                      >
                        {grupos.map((grupo) => (
                          <SelectItem key={grupo} value={grupo}>
                            Grupo {grupo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className={`text-sm mb-1 block ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Nuevo grupo
                    </Label>
                    <Input
                      value={nuevoGrupo}
                      onChange={(e) => setNuevoGrupo(e.target.value)}
                      placeholder="Ej. B"
                      className={`${
                        isDarkMode
                          ? "bg-gray-700 text-white border-gray-600 focus:border-green-500"
                          : "bg-white text-gray-900 border-gray-300 focus:border-red-500"
                      } rounded-md transition-all duration-200`}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={actualizarGrupoMasivo}
                      disabled={actualizando || !carreraGrupo || !semestreGrupo || !grupoActual || !nuevoGrupo}
                      className={`w-full ${
                        isDarkMode
                          ? "bg-green-700 hover:bg-green-600 text-white"
                          : "bg-red-800 hover:bg-red-700 text-white"
                      } rounded-md transition-all duration-200`}
                    >
                      {actualizando ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Actualizando...</span>
                        </div>
                      ) : (
                        <span>Actualizar grupos</span>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div
                className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                  isDarkMode ? "border-[#1d5631]" : "border-[#800040]"
                }`}
              ></div>
            </div>
          ) : alumnosFiltrados.length > 0 ? (
            <div className="max-h-[600px] overflow-auto">
              {seleccionados.length > 0 && (
                <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 p-3 border-b flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"}`}>
                    {seleccionados.length} alumno(s) seleccionado(s)
                  </span>
                  <Button onClick={eliminarSeleccionados} size="sm" variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Eliminar seleccionados
                  </Button>
                </div>
              )}
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className={isDarkMode ? "bg-gray-900" : "bg-gray-50"}>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>
                      <input
                        type="checkbox"
                        checked={seleccionados.length === alumnosFiltrados.length && alumnosFiltrados.length > 0}
                        onChange={toggleSeleccionarTodos}
                        className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Matrícula</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Nombre</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Apellido</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Carrera</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Semestre</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Turno</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Grupo</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alumnosFiltrados.map((alumno) => (
                    <TableRow
                      key={alumno.Matricula}
                      className={`group ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition-colors`}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={seleccionados.includes(alumno.Matricula)}
                          onChange={() => toggleSeleccionarAlumno(alumno.Matricula)}
                          className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>
                        <div className="font-medium">{alumno.Matricula}</div>
                      </TableCell>
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>{alumno.Nombre}</TableCell>
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>{alumno.Apellido}</TableCell>
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>{alumno.Carrera}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isDarkMode ? "bg-[#1d5631]/20 text-[#2a7a45]" : "bg-[#800040]/20 text-[#800040]"
                          }`}
                        >
                          {alumno.Semestre}º Semestre
                        </span>
                      </TableCell>
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>
                        {alumno.Turno.charAt(0).toUpperCase() + alumno.Turno.slice(1)}
                      </TableCell>
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>{alumno.Grupo}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button
                            onClick={() => modificarAlumno(alumno)}
                            size="sm"
                            variant="outline"
                            className={`h-8 w-8 p-0 ${
                              isDarkMode
                                ? "text-blue-400 border-blue-400 hover:bg-blue-400/10"
                                : "text-blue-600 border-blue-600 hover:bg-blue-600/10"
                            }`}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar alumno</span>
                          </Button>
                          <Button
                            onClick={() => eliminarAlumno(alumno.Matricula)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 border-red-600 hover:bg-red-600/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar alumno</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div
              className={`flex flex-col items-center justify-center p-8 text-center ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <Users className="h-12 w-12 mb-2 opacity-20" />
              <h3 className="text-lg font-medium mb-1">No hay alumnos</h3>
              <p className="text-sm max-w-md">
                {searchTerm || carreraFilter !== "todas" || semestreFilter !== "todos" || turnoFilter !== "todos"
                  ? "No se encontraron alumnos con los filtros aplicados. Intenta con otros criterios de búsqueda."
                  : "No hay alumnos registrados. Agrega un nuevo alumno usando el formulario."}
              </p>
              {(searchTerm || carreraFilter !== "todas" || semestreFilter !== "todos" || turnoFilter !== "todos") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 bg-transparent"
                  onClick={() => {
                    setSearchTerm("")
                    setCarreraFilter("todas")
                    setSemestreFilter("todos")
                    setTurnoFilter("todos")
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}