"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Trash2, UserPlus, Users, Search, RefreshCw, GraduationCap, Clock, BookOpen, UserCircle, X, Check, Filter, Layers, ArrowLeft, ListChecks } from 'lucide-react'
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

export function AlumnosTab({
  db,
  isDarkMode,
  currentColors,
}: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
  const [vistaActual, setVistaActual] = useState<"menu" | "agregar" | "lista">("menu")

  const [alumnos, setAlumnos] = useState<
    Array<{
      Matricula: string
      Nombre: string
      Apellido: string
      Carrera: string
      Semestre: string
      Turno: string
      Grupo: string
      [key: string]: any
    }>
  >([])
  const [datosAlumno, setDatosAlumno] = useState<{
    Matricula: string
    Nombre: string
    Apellido: string
    Carrera: string
    Semestre: string
    Turno: string
    Grupo: string
    [key: string]: any
  }>({
    Matricula: "",
    Nombre: "",
    Apellido: "",
    Carrera: "",
    Semestre: "",
    Turno: "",
    Grupo: "",
  })
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [filtroCarrera, setFiltroCarrera] = useState("todas")
  const [showFilters, setShowFilters] = useState(false)
  const [filtroSemestre, setFiltroSemestre] = useState("todos")
  const [filtroTurno, setFiltroTurno] = useState("todos")
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

  useEffect(() => {
    cargarAlumnos()
  }, [])

  const cargarAlumnos = async () => {
    setCargando(true)
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
        ...doc.data(),
      })) as Array<{
        Matricula: string
        Nombre: string
        Apellido: string
        Carrera: string
        Semestre: string
        Turno: string
        Grupo: string
        [key: string]: any
      }>
      setAlumnos(alumnosData)
    } catch (error) {
      console.error("Error al cargar alumnos:", error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los alumnos. Por favor, intenta de nuevo.",
        icon: "error",
        confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
      })
    } finally {
      setCargando(false)
    }
  }

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { Matricula, ...restoDatosAlumno } = datosAlumno

      if (!editando) {
        // Check if the matricula already exists only when adding a new student
        const alumnoDoc = doc(db, "Alumnos", Matricula)
        const alumnoSnapshot = await getDoc(alumnoDoc)

        if (alumnoSnapshot.exists()) {
          await Swal.fire({
            title: "Error",
            text: "Esta matrícula ya existe. Por favor, use una matrícula diferente.",
            icon: "error",
            confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
          })
          return
        }

        // Add new student
        await setDoc(alumnoDoc, restoDatosAlumno)
        await Swal.fire({
          title: "¡Éxito!",
          text: "Alumno agregado correctamente",
          icon: "success",
          confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
        })
      } else {
        // Update existing student
        await updateDoc(doc(db, "Alumnos", Matricula), restoDatosAlumno)
        await Swal.fire({
          title: "¡Éxito!",
          text: "Alumno actualizado correctamente",
          icon: "success",
          confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
        })
        setEditando(false)
      }
      setDatosAlumno({ Matricula: "", Nombre: "", Apellido: "", Carrera: "", Semestre: "", Turno: "", Grupo: "" })
      cargarAlumnos()
    } catch (error) {
      console.error("Error al agregar/actualizar alumno:", error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error al agregar/actualizar el alumno. Por favor, intenta de nuevo.",
        icon: "error",
        confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
      })
    }
  }

  const eliminarAlumno = async (matricula: string) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar!",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "Alumnos", matricula))
        Swal.fire({
          title: "Eliminado!",
          text: "El alumno ha sido eliminado.",
          icon: "success",
          confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
        })
        cargarAlumnos()
      } catch (error) {
        console.error("Error al eliminar alumno:", error)
        Swal.fire({
          title: "Error!",
          text: "Ha ocurrido un error al eliminar el alumno.",
          icon: "error",
          confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
        })
      }
    }
  }

  const actualizarSemestreMasivo = async () => {
    if (!carreraSeleccionada || !semestreActual || !nuevoSemestre) {
      await Swal.fire({
        title: "Error",
        text: "Por favor, selecciona todos los campos requeridos.",
        icon: "error",
        confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
      })
      return
    }

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas cambiar a todos los alumnos de ${carreraSeleccionada}, del semestre ${semestreActual}º al semestre ${nuevoSemestre}º?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
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
          confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
        })

        cargarAlumnos()
        setCarreraSeleccionada("")
        setSemestreActual("")
        setNuevoSemestre("")
      } catch (error) {
        console.error("Error al actualizar semestres:", error)
        await Swal.fire({
          title: "Error",
          text: "Ha ocurrido un error al actualizar los semestres. Por favor, intenta de nuevo.",
          icon: "error",
          confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
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
        confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
      })
      return
    }

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Deseas cambiar a todos los alumnos de ${carreraGrupo}, del semestre ${semestreGrupo}º, del grupo ${grupoActual} al grupo ${nuevoGrupo}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
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
          confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
        })

        cargarAlumnos()
        setCarreraGrupo("")
        setSemestreGrupo("")
        setGrupoActual("")
        setNuevoGrupo("")
      } catch (error) {
        console.error("Error al actualizar grupos:", error)
        await Swal.fire({
          title: "Error",
          text: "Ha ocurrido un error al actualizar los grupos. Por favor, intenta de nuevo.",
          icon: "error",
          confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
        })
      } finally {
        setActualizando(false)
      }
    }
  }

  const modificarAlumno = (alumno: {
    Matricula: string
    Nombre: string
    Apellido: string
    Carrera: string
    Semestre: string
    Turno: string
    Grupo: string
    [key: string]: any
  }) => {
    setDatosAlumno(alumno)
    setEditando(true)
    setVistaActual("agregar")
  }

  const cancelarEdicion = () => {
    setDatosAlumno({ Matricula: "", Nombre: "", Apellido: "", Carrera: "", Semestre: "", Turno: "", Grupo: "" })
    setEditando(false)
  }

  const volverAlMenu = () => {
    setVistaActual("menu")
    cancelarEdicion()
  }

  const alumnosFiltrados = alumnos.filter((alumno) => {
    const coincideBusqueda =
      alumno.Matricula.toLowerCase().includes(busqueda.toLowerCase()) ||
      alumno.Nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      alumno.Apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      alumno.Grupo.toLowerCase().includes(busqueda.toLowerCase())

    const coincideCarrera = filtroCarrera === "todas" || alumno.Carrera === filtroCarrera
    const coincideSemestre = filtroSemestre === "todos" || alumno.Semestre === filtroSemestre
    const coincideTurno = filtroTurno === "todos" || alumno.Turno === filtroTurno

    return coincideBusqueda && coincideCarrera && coincideSemestre && coincideTurno
  })

  const carreras = [...new Set(alumnos.map((alumno) => alumno.Carrera))].filter(Boolean)
  const semestres = [...new Set(alumnos.map((alumno) => alumno.Semestre))].filter(Boolean)
  const turnos = [...new Set(alumnos.map((alumno) => alumno.Turno))].filter(Boolean)
  const grupos = [...new Set(alumnos.map((alumno) => alumno.Grupo))].filter(Boolean)

  const resetFilters = () => {
    setFiltroCarrera("todas")
    setFiltroSemestre("todos")
    setFiltroTurno("todos")
    setBusqueda("")
  }

  if (vistaActual === "menu") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          <Card
            onClick={() => setVistaActual("agregar")}
            className={`${
              isDarkMode ? "bg-[#2a2a2a] border-gray-700 hover:bg-[#333]" : "bg-white border-gray-200 hover:bg-gray-50"
            } shadow-lg rounded-xl overflow-hidden transition-all duration-300 cursor-pointer transform hover:scale-105`}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div
                className={`p-6 rounded-full ${
                  isDarkMode ? "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]" : "bg-gradient-to-r from-[#800040] to-[#a30050]"
                }`}
              >
                <UserPlus className="h-12 w-12 text-white" />
              </div>
              <h3 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>Agregar Alumno</h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Registra un nuevo alumno en el sistema
              </p>
            </CardContent>
          </Card>

          <Card
            onClick={() => setVistaActual("lista")}
            className={`${
              isDarkMode ? "bg-[#2a2a2a] border-gray-700 hover:bg-[#333]" : "bg-white border-gray-200 hover:bg-gray-50"
            } shadow-lg rounded-xl overflow-hidden transition-all duration-300 cursor-pointer transform hover:scale-105`}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div
                className={`p-6 rounded-full ${
                  isDarkMode ? "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]" : "bg-gradient-to-r from-[#800040] to-[#a30050]"
                }`}
              >
                <ListChecks className="h-12 w-12 text-white" />
              </div>
              <h3 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
                Ver Lista de Alumnos
              </h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Consulta y gestiona los alumnos registrados
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (vistaActual === "agregar") {
    return (
      <Card
        className={`${
          isDarkMode ? "bg-[#2a2a2a] border-gray-700" : "bg-white border-gray-200"
        } shadow-lg rounded-xl overflow-hidden transition-all duration-300 max-w-2xl mx-auto`}
      >
        <CardHeader
          className={`${
            isDarkMode ? "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]" : "bg-gradient-to-r from-[#800040] to-[#a30050]"
          } py-4 px-6 border-b`}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center text-white transition-colors duration-300">
              {editando ? (
                <>
                  <Pencil className="mr-2 h-5 w-5" />
                  Editar Alumno
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Agregar Alumno
                </>
              )}
            </CardTitle>
            <Button
              onClick={volverAlMenu}
              size="sm"
              variant="ghost"
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
                className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
              >
                <UserCircle className="h-4 w-4" /> Matrícula
              </Label>
              <Input
                id="matriculaAlumno"
                value={datosAlumno.Matricula}
                onChange={(e) => setDatosAlumno({ ...datosAlumno, Matricula: e.target.value })}
                required
                disabled={editando}
                className={`${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600 focus:border-green-500"
                    : "bg-white text-gray-900 border-gray-300 focus:border-red-500"
                } rounded-md transition-all duration-200`}
                placeholder="Ej. 20230001"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="nombreAlumno"
                className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
              >
                <UserCircle className="h-4 w-4" /> Nombre
              </Label>
              <Input
                id="nombreAlumno"
                value={datosAlumno.Nombre}
                onChange={(e) => setDatosAlumno({ ...datosAlumno, Nombre: e.target.value })}
                required
                className={`${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600 focus:border-green-500"
                    : "bg-white text-gray-900 border-gray-300 focus:border-red-500"
                } rounded-md transition-all duration-200`}
                placeholder="Ej. Juan"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="apellidoAlumno"
                className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
              >
                <UserCircle className="h-4 w-4" /> Apellido
              </Label>
              <Input
                id="apellidoAlumno"
                value={datosAlumno.Apellido}
                onChange={(e) => setDatosAlumno({ ...datosAlumno, Apellido: e.target.value })}
                required
                className={`${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600 focus:border-green-500"
                    : "bg-white text-gray-900 border-gray-300 focus:border-red-500"
                } rounded-md transition-all duration-200`}
                placeholder="Ej. Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="carreraAlumno"
                className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
              >
                <GraduationCap className="h-4 w-4" /> Carrera
              </Label>
              <Select
                value={datosAlumno.Carrera}
                onValueChange={(value) => setDatosAlumno({ ...datosAlumno, Carrera: value })}
              >
                <SelectTrigger
                  id="carreraAlumno"
                  className={`${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 focus:ring-green-500"
                      : "bg-white text-gray-900 border-gray-300 focus:ring-red-500"
                  } rounded-md transition-all duration-200`}
                >
                  <SelectValue placeholder="Selecciona una carrera" />
                </SelectTrigger>
                <SelectContent
                  className={`${
                    isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"
                  }`}
                >
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
                className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
              >
                <BookOpen className="h-4 w-4" /> Semestre
              </Label>
              <Select
                value={datosAlumno.Semestre}
                onValueChange={(value) => setDatosAlumno({ ...datosAlumno, Semestre: value })}
              >
                <SelectTrigger
                  id="semestreAlumno"
                  className={`${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 focus:ring-green-500"
                      : "bg-white text-gray-900 border-gray-300 focus:ring-red-500"
                  } rounded-md transition-all duration-200`}
                >
                  <SelectValue placeholder="Selecciona un semestre" />
                </SelectTrigger>
                <SelectContent
                  className={`${
                    isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"
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
            <div className="space-y-2">
              <Label
                htmlFor="turnoAlumno"
                className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
              >
                <Clock className="h-4 w-4" /> Turno
              </Label>
              <Select
                value={datosAlumno.Turno}
                onValueChange={(value) => setDatosAlumno({ ...datosAlumno, Turno: value })}
              >
                <SelectTrigger
                  id="turnoAlumno"
                  className={`${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 focus:ring-green-500"
                      : "bg-white text-gray-900 border-gray-300 focus:ring-red-500"
                  } rounded-md transition-all duration-200`}
                >
                  <SelectValue placeholder="Selecciona un turno" />
                </SelectTrigger>
                <SelectContent
                  className={`${
                    isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"
                  }`}
                >
                  <SelectItem value="matutino">Matutino</SelectItem>
                  <SelectItem value="vespertino">Vespertino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="grupoAlumno"
                className={`font-medium flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
              >
                <Users className="h-4 w-4" /> Grupo
              </Label>
              <Input
                id="grupoAlumno"
                value={datosAlumno.Grupo}
                onChange={(e) => setDatosAlumno({ ...datosAlumno, Grupo: e.target.value })}
                required
                className={`${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600 focus:border-green-500"
                    : "bg-white text-gray-900 border-gray-300 focus:border-red-500"
                } rounded-md transition-all duration-200`}
                placeholder="Ej. A"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  isDarkMode ? "bg-green-700 hover:bg-green-600 text-white" : "bg-red-800 hover:bg-red-700 text-white"
                }`}
              >
                {editando ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    <span>Actualizar Alumno</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Agregar Alumno</span>
                  </div>
                )}
              </Button>
              {editando && (
                <Button
                  type="button"
                  onClick={cancelarEdicion}
                  className="py-2 px-4 rounded-md font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 bg-gray-500 hover:bg-gray-400 text-white"
                >
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    <span>Cancelar</span>
                  </div>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`${
        isDarkMode ? "bg-[#2a2a2a] border-gray-700" : "bg-white border-gray-200"
      } shadow-lg rounded-xl overflow-hidden transition-all duration-300 h-[calc(100vh-200px)]`}
    >
      <CardHeader
        className={`${
          isDarkMode ? "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]" : "bg-gradient-to-r from-[#800040] to-[#a30050]"
        } py-4 px-6 border-b`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button onClick={volverAlMenu} size="sm" variant="ghost" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl font-bold flex items-center text-white transition-colors duration-300">
              <Users className="mr-2 h-5 w-5" />
              Lista de Alumnos ({alumnosFiltrados.length})
            </CardTitle>
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar alumno..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className={`pl-9 ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600 focus:border-green-500"
                    : "bg-white text-gray-900 border-gray-300 focus:border-red-500"
                } rounded-md transition-all duration-200 w-full md:w-auto`}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                size="sm"
                className={`${
                  isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                } rounded-md transition-all duration-200 flex items-center gap-1`}
                title="Filtros avanzados"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>
              <Button
                onClick={cargarAlumnos}
                size="sm"
                className={`${
                  isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                } rounded-md transition-all duration-200`}
                title="Actualizar lista"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 p-4 rounded-lg bg-black/10 backdrop-blur-sm">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-white text-xs mb-1 block">Carrera</Label>
                <Select value={filtroCarrera} onValueChange={setFiltroCarrera}>
                  <SelectTrigger
                    className={`${
                      isDarkMode
                        ? "bg-gray-700 text-white border-gray-600"
                        : "bg-white/90 text-gray-900 border-gray-300"
                    } rounded-md transition-all duration-200`}
                  >
                    <SelectValue placeholder="Filtrar por carrera" />
                  </SelectTrigger>
                  <SelectContent
                    className={`${
                      isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"
                    }`}
                  >
                    <SelectItem value="todas">Todas las carreras</SelectItem>
                    {carreras.map((carrera) => (
                      <SelectItem key={carrera} value={carrera}>
                        {carrera}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label className="text-white text-xs mb-1 block">Semestre</Label>
                <Select value={filtroSemestre} onValueChange={setFiltroSemestre}>
                  <SelectTrigger
                    className={`${
                      isDarkMode
                        ? "bg-gray-700 text-white border-gray-600"
                        : "bg-white/90 text-gray-900 border-gray-300"
                    } rounded-md transition-all duration-200`}
                  >
                    <SelectValue placeholder="Filtrar por semestre" />
                  </SelectTrigger>
                  <SelectContent
                    className={`${
                      isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"
                    }`}
                  >
                    <SelectItem value="todos">Todos los semestres</SelectItem>
                    {semestres.map((semestre) => (
                      <SelectItem key={semestre} value={semestre}>
                        {semestre}º Semestre
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label className="text-white text-xs mb-1 block">Turno</Label>
                <Select value={filtroTurno} onValueChange={setFiltroTurno}>
                  <SelectTrigger
                    className={`${
                      isDarkMode
                        ? "bg-gray-700 text-white border-gray-600"
                        : "bg-white/90 text-gray-900 border-gray-300"
                    } rounded-md transition-all duration-200`}
                  >
                    <SelectValue placeholder="Filtrar por turno" />
                  </SelectTrigger>
                  <SelectContent
                    className={`${
                      isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"
                    }`}
                  >
                    <SelectItem value="todos">Todos los turnos</SelectItem>
                    {turnos.map((turno) => (
                      <SelectItem key={turno} value={turno}>
                        {turno.charAt(0).toUpperCase() + turno.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={resetFilters}
                size="sm"
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                Limpiar filtros
              </Button>
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
        )}
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
      <CardContent className="p-0 h-[calc(100%-80px)] overflow-hidden">
        {cargando ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-green-500"></div>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader
                className={`sticky top-0 ${
                  isDarkMode ? "bg-gray-900" : "bg-gray-100"
                } z-10 transition-colors duration-300`}
              >
                <TableRow>
                  <TableHead
                    className={`py-3 px-4 text-left font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                  >
                    Matrícula
                  </TableHead>
                  <TableHead
                    className={`py-3 px-4 text-left font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                  >
                    Nombre
                  </TableHead>
                  <TableHead
                    className={`py-3 px-4 text-left font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                  >
                    Apellido
                  </TableHead>
                  <TableHead
                    className={`py-3 px-4 text-left font-semibold ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    } hidden md:table-cell`}
                  >
                    Carrera
                  </TableHead>
                  <TableHead
                    className={`py-3 px-4 text-left font-semibold ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    } hidden md:table-cell`}
                  >
                    Semestre
                  </TableHead>
                  <TableHead
                    className={`py-3 px-4 text-left font-semibold ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    } hidden md:table-cell`}
                  >
                    Turno
                  </TableHead>
                  <TableHead
                    className={`py-3 px-4 text-left font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}
                  >
                    Grupo
                  </TableHead>
                  <TableHead
                    className={`py-3 px-4 text-center font-semibold ${
                      isDarkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumnosFiltrados.length > 0 ? (
                  alumnosFiltrados.map((alumno) => (
                    <TableRow
                      key={alumno.Matricula}
                      className={`${
                        isDarkMode ? "hover:bg-gray-700 border-gray-700" : "hover:bg-gray-50 border-gray-200"
                      } transition-colors duration-200`}
                    >
                      <TableCell
                        className={`py-3 px-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"} font-medium`}
                      >
                        {alumno.Matricula}
                      </TableCell>
                      <TableCell className={`py-3 px-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {alumno.Nombre}
                      </TableCell>
                      <TableCell className={`py-3 px-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {alumno.Apellido}
                      </TableCell>
                      <TableCell
                        className={`py-3 px-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"} hidden md:table-cell`}
                      >
                        {alumno.Carrera}
                      </TableCell>
                      <TableCell
                        className={`py-3 px-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"} hidden md:table-cell`}
                      >
                        {alumno.Semestre}
                      </TableCell>
                      <TableCell
                        className={`py-3 px-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"} hidden md:table-cell`}
                      >
                        {alumno.Turno}
                      </TableCell>
                      <TableCell className={`py-3 px-4 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {alumno.Grupo}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            onClick={() => modificarAlumno(alumno)}
                            size="sm"
                            className={`${
                              isDarkMode
                                ? "bg-blue-700 hover:bg-blue-600 text-white"
                                : "bg-blue-600 hover:bg-blue-500 text-white"
                            } rounded transition-all duration-200 transform hover:scale-105 active:scale-95`}
                            title="Editar alumno"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar alumno</span>
                          </Button>
                          <Button
                            onClick={() => eliminarAlumno(alumno.Matricula)}
                            size="sm"
                            className={`${
                              isDarkMode
                                ? "bg-red-700 hover:bg-red-600 text-white"
                                : "bg-red-600 hover:bg-red-500 text-white"
                            } rounded transition-all duration-200 transform hover:scale-105 active:scale-95`}
                            title="Eliminar alumno"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar alumno</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className={`py-8 text-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      No se encontraron alumnos con los criterios de búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
