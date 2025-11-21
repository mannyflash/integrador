"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pencil,
  Trash2,
  UserSquare2,
  Mail,
  Building,
  Key,
  Search,
  RefreshCw,
  X,
  Plus,
  Save,
  Ban,
  ArrowLeft,
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
import bcrypt from "bcryptjs"
import type React from "react"

interface Docente {
  Matricula: string
  Nombre: string
  Apellido: string
  Email: string
  Contraseña: string
  Departamento: string
  [key: string]: any
}

type Vista = "menu" | "agregar" | "lista"

export function DocentesTab({
  db,
  isDarkMode,
  currentColors,
}: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
  const [vistaActual, setVistaActual] = useState<Vista>("menu")

  const [docentes, setDocentes] = useState<Docente[]>([])
  const [datosDocente, setDatosDocente] = useState<Docente>({
    Matricula: "",
    Nombre: "",
    Apellido: "",
    Email: "",
    Contraseña: "",
    Departamento: "",
  })
  const [editando, setEditando] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    cargarDocentes()
  }, [])

  const cargarDocentes = async () => {
    setIsLoading(true)
    try {
      const docentesRef = collection(db, "Docentes")
      const docentesSnapshot = await getDocs(query(docentesRef))
      const docentesData = docentesSnapshot.docs.map((doc) => ({
        Matricula: doc.id,
        Nombre: doc.data().Nombre || "",
        Apellido: doc.data().Apellido || "",
        Email: doc.data().Email || "",
        Contraseña: doc.data().Contraseña || "",
        Departamento: doc.data().Departamento || "",
        ...doc.data(),
      })) as Docente[]
      setDocentes(docentesData)
    } catch (error) {
      console.error("Error al cargar docentes:", error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los docentes. Por favor, intenta de nuevo.",
        icon: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { Matricula, Contraseña, ...restoDatosDocente } = datosDocente

      if (!editando) {
        const docenteDoc = doc(db, "Docentes", Matricula)
        const docenteSnapshot = await getDoc(docenteDoc)

        if (docenteSnapshot.exists()) {
          await Swal.fire({
            title: "Error",
            text: "Esta matrícula ya existe. Por favor, use una matrícula diferente.",
            icon: "error",
          })
          return
        }

        if (!Contraseña) {
          throw new Error("La contraseña es requerida para nuevos docentes")
        }
        const hashedPassword = await bcrypt.hash(Contraseña, 10)
        await setDoc(docenteDoc, { ...restoDatosDocente, Contraseña: hashedPassword })
        await Swal.fire({
          title: "¡Éxito!",
          text: "Docente agregado correctamente",
          icon: "success",
        })
      } else {
        const updateData = { ...restoDatosDocente }
        if (Contraseña) {
          updateData.Contraseña = await bcrypt.hash(Contraseña, 10)
        }
        await updateDoc(doc(db, "Docentes", Matricula), updateData)
        await Swal.fire({
          title: "¡Éxito!",
          text: "Docente actualizado correctamente",
          icon: "success",
        })
        setEditando(false)
      }
      setDatosDocente({ Matricula: "", Nombre: "", Apellido: "", Email: "", Contraseña: "", Departamento: "" })
      cargarDocentes()
      setVistaActual("lista")
    } catch (error) {
      console.error("Error al agregar/actualizar docente:", error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error al agregar/actualizar el docente. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const eliminarDocente = async (matricula: string) => {
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
        await deleteDoc(doc(db, "Docentes", matricula))
        Swal.fire("Eliminado!", "El docente ha sido eliminado.", "success")
        cargarDocentes()
      } catch (error) {
        console.error("Error al eliminar docente:", error)
        Swal.fire("Error!", "Ha ocurrido un error al eliminar el docente.", "error")
      }
    }
  }

  const modificarDocente = (docente: Docente) => {
    setDatosDocente({ ...docente, Contraseña: "" })
    setEditando(true)
    setVistaActual("agregar")
  }

  const cancelarEdicion = () => {
    setDatosDocente({ Matricula: "", Nombre: "", Apellido: "", Email: "", Contraseña: "", Departamento: "" })
    setEditando(false)
  }

  const docentesFiltrados = docentes.filter(
    (docente) =>
      docente.Matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docente.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docente.Apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docente.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docente.Departamento.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
              <CardTitle className="text-3xl font-bold">Agregar Maestro</CardTitle>
              <CardDescription className="text-white/90 text-base">
                Registra un nuevo docente en el sistema
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-10 bg-gradient-to-b from-white to-gray-50">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-center gap-3 text-base">
                <UserSquare2 className="h-5 w-5 text-[#952952]" />
                <span>Asignar matrícula y nombre</span>
              </li>
              <li className="flex items-center gap-3 text-base">
                <Mail className="h-5 w-5 text-[#952952]" />
                <span>Configurar email y contraseña</span>
              </li>
              <li className="flex items-center gap-3 text-base">
                <Building className="h-5 w-5 text-[#952952]" />
                <span>Seleccionar departamento</span>
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
              <CardTitle className="text-3xl font-bold">Ver Lista de Maestros</CardTitle>
              <CardDescription className="text-white/90 text-base">
                Consulta, edita o elimina docentes existentes
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-10 bg-gradient-to-b from-white to-gray-50">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-center gap-3 text-base">
                <Search className="h-5 w-5 text-[#952952]" />
                <span>Buscar y filtrar docentes</span>
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
                  <CardTitle className="text-2xl font-bold">
                    {editando ? "Editar Docente" : "Agregar Docente"}
                  </CardTitle>
                  <CardDescription className="text-white/80 mt-1">
                    {editando
                      ? "Modifica los datos del docente seleccionado"
                      : "Completa el formulario para agregar un nuevo docente"}
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
                  htmlFor="matriculaDocente"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <UserSquare2 className="h-4 w-4" /> Matrícula
                </Label>
                <div className="relative">
                  <UserSquare2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="matriculaDocente"
                    value={datosDocente.Matricula}
                    onChange={(e) => setDatosDocente({ ...datosDocente, Matricula: e.target.value })}
                    required
                    disabled={editando}
                    placeholder="Ej: D12345"
                    className={`pl-10 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="nombreDocente"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <UserSquare2 className="h-4 w-4" /> Nombre
                </Label>
                <div className="relative">
                  <UserSquare2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="nombreDocente"
                    value={datosDocente.Nombre}
                    onChange={(e) => setDatosDocente({ ...datosDocente, Nombre: e.target.value })}
                    required
                    placeholder="Ej: Juan"
                    className={`pl-10 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="apellidoDocente"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <UserSquare2 className="h-4 w-4" /> Apellido
                </Label>
                <div className="relative">
                  <UserSquare2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="apellidoDocente"
                    value={datosDocente.Apellido}
                    onChange={(e) => setDatosDocente({ ...datosDocente, Apellido: e.target.value })}
                    required
                    placeholder="Ej: Pérez"
                    className={`pl-10 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="emailDocente"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <Mail className="h-4 w-4" /> Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="emailDocente"
                    type="email"
                    value={datosDocente.Email}
                    onChange={(e) => setDatosDocente({ ...datosDocente, Email: e.target.value })}
                    required
                    placeholder="Ej: juan.perez@tecnm.mx"
                    className={`pl-10 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="contraseñaDocente"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <Key className="h-4 w-4" />
                  {editando ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="contraseñaDocente"
                    type="password"
                    value={datosDocente.Contraseña}
                    onChange={(e) => setDatosDocente({ ...datosDocente, Contraseña: e.target.value })}
                    required={!editando}
                    placeholder="Ingrese la contraseña"
                    className={`pl-10 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="departamentoDocente"
                  className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
                >
                  <Building className="h-4 w-4" /> Departamento
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <select
                    id="departamentoDocente"
                    value={datosDocente.Departamento}
                    onChange={(e) => setDatosDocente({ ...datosDocente, Departamento: e.target.value })}
                    required
                    className={`w-full pl-10 py-2 rounded-md border ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                  >
                    <option value="">Seleccione un departamento</option>
                    <option value="Ingeniería en Sistemas Computacionales">
                      Ingeniería en Sistemas Computacionales
                    </option>
                    <option value="Ingeniería Civil">Ingeniería Civil</option>
                    <option value="Ingeniería Industrial">Ingeniería Industrial</option>
                    <option value="Licenciatura en Administración">Licenciatura en Administración</option>
                  </select>
                </div>
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
                  {editando ? "Actualizar Docente" : "Agregar Docente"}
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
    <div className="max-w-6xl mx-auto">
      <Card
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-shadow duration-300 border-0`}
      >
        <CardHeader className="bg-gradient-to-br from-[#952952] to-[#7a1f42] text-white p-6 rounded-t-lg">
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
                <UserSquare2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Lista de Docentes</CardTitle>
                <span className="text-white/80 text-sm">
                  {docentesFiltrados.length} {docentesFiltrados.length === 1 ? "docente" : "docentes"}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={cargarDocentes} className="text-white hover:bg-white/20">
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Actualizar</span>
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar docentes..."
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
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div
                className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                  isDarkMode ? "border-[#1d5631]" : "border-[#800040]"
                }`}
              ></div>
            </div>
          ) : docentesFiltrados.length > 0 ? (
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className={isDarkMode ? "bg-gray-900" : "bg-gray-50"}>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Matrícula</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Nombre</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Apellido</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Email</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Departamento</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docentesFiltrados.map((docente) => (
                    <TableRow
                      key={docente.Matricula}
                      className={`group ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition-colors`}
                    >
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>
                        <div className="font-medium">{docente.Matricula}</div>
                      </TableCell>
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>{docente.Nombre}</TableCell>
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>{docente.Apellido}</TableCell>
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>{docente.Email}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isDarkMode ? "bg-[#1d5631]/20 text-[#2a7a45]" : "bg-[#800040]/20 text-[#800040]"
                          }`}
                        >
                          {docente.Departamento}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button
                            onClick={() => modificarDocente(docente)}
                            size="sm"
                            variant="outline"
                            className={`h-8 w-8 p-0 ${
                              isDarkMode
                                ? "text-blue-400 border-blue-400 hover:bg-blue-400/10"
                                : "text-blue-600 border-blue-600 hover:bg-blue-600/10"
                            }`}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar docente</span>
                          </Button>
                          <Button
                            onClick={() => eliminarDocente(docente.Matricula)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 border-red-600 hover:bg-red-600/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar docente</span>
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
              <UserSquare2 className="h-12 w-12 mb-2 opacity-20" />
              <h3 className="text-lg font-medium mb-1">No hay docentes</h3>
              <p className="text-sm max-w-md">
                {searchTerm
                  ? "No se encontraron docentes con los criterios de búsqueda."
                  : "No hay docentes registrados. Agrega un nuevo docente usando el formulario."}
              </p>
              {searchTerm && (
                <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={() => setSearchTerm("")}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
