"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, UserSquare2, Mail, Building, Key, Search, Plus, RefreshCw, UserCheck } from "lucide-react"
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

export function DocentesTab({
  db,
  isDarkMode,
  currentColors,
}: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
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
  const [busqueda, setBusqueda] = useState("")
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDocentes()
  }, [])

  const cargarDocentes = async () => {
    setCargando(true)
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
      setCargando(false)
    }
  }

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { Matricula, Contraseña, ...restoDatosDocente } = datosDocente

      if (!editando) {
        // Check if the matricula already exists when adding a new teacher
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
      confirmButtonColor: isDarkMode ? "#1d5631" : "#800040",
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
  }

  const cancelarEdicion = () => {
    setDatosDocente({
      Matricula: "",
      Nombre: "",
      Apellido: "",
      Email: "",
      Contraseña: "",
      Departamento: "",
    })
    setEditando(false)
  }

  const docentesFiltrados = docentes.filter(
    (docente) =>
      docente.Matricula.toLowerCase().includes(busqueda.toLowerCase()) ||
      docente.Nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      docente.Apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      docente.Email.toLowerCase().includes(busqueda.toLowerCase()) ||
      docente.Departamento.toLowerCase().includes(busqueda.toLowerCase()),
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card
        className={`${isDarkMode ? "bg-[#2a2a2a]" : "bg-white"} shadow-lg transition-all duration-300 hover:shadow-xl border border-opacity-20 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <CardHeader
          className={`${isDarkMode ? "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]" : "bg-gradient-to-r from-[#800040] to-[#a30050]"} rounded-t-lg`}
        >
          <CardTitle className="text-white flex items-center gap-2">
            {editando ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editando ? "Editar Docente" : "Agregar Docente"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="matriculaDocente"
                className={`${isDarkMode ? "text-white" : "text-[#800040]"} flex items-center gap-2`}
              >
                <UserCheck className="h-4 w-4" /> Matrícula
              </Label>
              <div className="relative">
                <Input
                  id="matriculaDocente"
                  value={datosDocente.Matricula}
                  onChange={(e) => setDatosDocente({ ...datosDocente, Matricula: e.target.value })}
                  required
                  disabled={editando}
                  className={`pl-9 ${isDarkMode ? "bg-[#3a3a3a] text-white border-[#1d5631]/30" : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30"} focus:ring-2 focus:ring-opacity-50 ${isDarkMode ? "focus:ring-[#1d5631]" : "focus:ring-[#800040]"} transition-all`}
                />
                <UserCheck
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-[#a0a0a0]" : "text-[#74726f]"}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="nombreDocente"
                className={`${isDarkMode ? "text-white" : "text-[#800040]"} flex items-center gap-2`}
              >
                <UserSquare2 className="h-4 w-4" /> Nombre
              </Label>
              <div className="relative">
                <Input
                  id="nombreDocente"
                  value={datosDocente.Nombre}
                  onChange={(e) => setDatosDocente({ ...datosDocente, Nombre: e.target.value })}
                  required
                  className={`pl-9 ${isDarkMode ? "bg-[#3a3a3a] text-white border-[#1d5631]/30" : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30"} focus:ring-2 focus:ring-opacity-50 ${isDarkMode ? "focus:ring-[#1d5631]" : "focus:ring-[#800040]"} transition-all`}
                />
                <UserSquare2
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-[#a0a0a0]" : "text-[#74726f]"}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="apellidoDocente"
                className={`${isDarkMode ? "text-white" : "text-[#800040]"} flex items-center gap-2`}
              >
                <UserSquare2 className="h-4 w-4" /> Apellido
              </Label>
              <div className="relative">
                <Input
                  id="apellidoDocente"
                  value={datosDocente.Apellido}
                  onChange={(e) => setDatosDocente({ ...datosDocente, Apellido: e.target.value })}
                  required
                  className={`pl-9 ${isDarkMode ? "bg-[#3a3a3a] text-white border-[#1d5631]/30" : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30"} focus:ring-2 focus:ring-opacity-50 ${isDarkMode ? "focus:ring-[#1d5631]" : "focus:ring-[#800040]"} transition-all`}
                />
                <UserSquare2
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-[#a0a0a0]" : "text-[#74726f]"}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="emailDocente"
                className={`${isDarkMode ? "text-white" : "text-[#800040]"} flex items-center gap-2`}
              >
                <Mail className="h-4 w-4" /> Email
              </Label>
              <div className="relative">
                <Input
                  id="emailDocente"
                  type="email"
                  value={datosDocente.Email}
                  onChange={(e) => setDatosDocente({ ...datosDocente, Email: e.target.value })}
                  required
                  className={`pl-9 ${isDarkMode ? "bg-[#3a3a3a] text-white border-[#1d5631]/30" : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30"} focus:ring-2 focus:ring-opacity-50 ${isDarkMode ? "focus:ring-[#1d5631]" : "focus:ring-[#800040]"} transition-all`}
                />
                <Mail
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-[#a0a0a0]" : "text-[#74726f]"}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="contraseñaDocente"
                className={`${isDarkMode ? "text-white" : "text-[#800040]"} flex items-center gap-2`}
              >
                <Key className="h-4 w-4" />
                {editando ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
              </Label>
              <div className="relative">
                <Input
                  id="contraseñaDocente"
                  type="password"
                  value={datosDocente.Contraseña}
                  onChange={(e) => setDatosDocente({ ...datosDocente, Contraseña: e.target.value })}
                  required={!editando}
                  className={`pl-9 ${isDarkMode ? "bg-[#3a3a3a] text-white border-[#1d5631]/30" : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30"} focus:ring-2 focus:ring-opacity-50 ${isDarkMode ? "focus:ring-[#1d5631]" : "focus:ring-[#800040]"} transition-all`}
                />
                <Key
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-[#a0a0a0]" : "text-[#74726f]"}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="departamentoDocente"
                className={`${isDarkMode ? "text-white" : "text-[#800040]"} flex items-center gap-2`}
              >
                <Building className="h-4 w-4" /> Departamento
              </Label>
              <div className="relative">
                <select
                  id="departamentoDocente"
                  value={datosDocente.Departamento}
                  onChange={(e) => setDatosDocente({ ...datosDocente, Departamento: e.target.value })}
                  required
                  className={`w-full pl-9 py-2 rounded-md ${isDarkMode ? "bg-[#3a3a3a] text-white border-[#1d5631]/30" : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30"} focus:ring-2 focus:ring-opacity-50 ${isDarkMode ? "focus:ring-[#1d5631]" : "focus:ring-[#800040]"} transition-all`}
                >
                  <option value="">Seleccione un departamento</option>
                  <option value="Ingeniería en Sistemas Computacionales">Ingeniería en Sistemas Computacionales</option>
                  <option value="Ingeniería Civil">Ingeniería Civil</option>
                  <option value="Ingeniería Industrial">Ingeniería Industrial</option>
                  <option value="Licenciatura en Administración">Licenciatura en Administración</option>
                </select>
                <Building
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-[#a0a0a0]" : "text-[#74726f]"}`}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className={`flex-1 ${isDarkMode ? "bg-[#1d5631] hover:bg-[#153d23] text-white" : "bg-[#800040] hover:bg-[#5c002e] text-white"} transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2`}
              >
                {editando ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editando ? "Actualizar Docente" : "Agregar Docente"}
              </Button>
              {editando && (
                <Button
                  type="button"
                  onClick={cancelarEdicion}
                  className={`${isDarkMode ? "bg-[#74726f] hover:bg-[#5a5856] text-white" : "bg-[#74726f] hover:bg-[#5a5856] text-white"} transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2`}
                >
                  <RefreshCw className="h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card
        className={`${isDarkMode ? "bg-[#2a2a2a]" : "bg-white"} shadow-lg transition-all duration-300 hover:shadow-xl border border-opacity-20 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
      >
        <CardHeader
          className={`${isDarkMode ? "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]" : "bg-gradient-to-r from-[#800040] to-[#a30050]"} rounded-t-lg`}
        >
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserSquare2 className="h-5 w-5" />
              Lista de Docentes
            </span>
            <span className="text-sm font-normal bg-white/20 px-2 py-1 rounded-full">{docentes.length} registros</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Input
              placeholder="Buscar docente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`pl-9 ${isDarkMode ? "bg-[#3a3a3a] text-white border-[#1d5631]/30" : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30"} focus:ring-2 focus:ring-opacity-50 ${isDarkMode ? "focus:ring-[#1d5631]" : "focus:ring-[#800040]"} transition-all`}
            />
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-[#a0a0a0]" : "text-[#74726f]"}`}
            />
          </div>

          <div className="rounded-lg border overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className={`sticky top-0 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <TableRow>
                    <TableHead className={`${isDarkMode ? "text-white" : "text-[#800040]"} font-bold`}>
                      Matrícula
                    </TableHead>
                    <TableHead className={`${isDarkMode ? "text-white" : "text-[#800040]"} font-bold`}>
                      Nombre
                    </TableHead>
                    <TableHead className={`${isDarkMode ? "text-white" : "text-[#800040]"} font-bold`}>
                      Apellido
                    </TableHead>
                    <TableHead className={`${isDarkMode ? "text-white" : "text-[#800040]"} font-bold`}>Email</TableHead>
                    <TableHead className={`${isDarkMode ? "text-white" : "text-[#800040]"} font-bold`}>
                      Departamento
                    </TableHead>
                    <TableHead className={`${isDarkMode ? "text-white" : "text-[#800040]"} font-bold text-right`}>
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargando ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <RefreshCw
                            className={`h-8 w-8 ${isDarkMode ? "text-white" : "text-[#800040]"} animate-spin mb-2`}
                          />
                          <span className={isDarkMode ? "text-white" : "text-[#800040]"}>Cargando docentes...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : docentesFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <UserSquare2 className={`h-8 w-8 ${isDarkMode ? "text-[#a0a0a0]" : "text-[#74726f]"} mb-2`} />
                          <span className={isDarkMode ? "text-[#a0a0a0]" : "text-[#74726f]"}>
                            No se encontraron docentes
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    docentesFiltrados.map((docente) => (
                      <TableRow
                        key={docente.Matricula}
                        className={`${isDarkMode ? "hover:bg-[#153d23]" : "hover:bg-[#fff0f5]"} transition-colors`}
                      >
                        <TableCell className={`${isDarkMode ? "text-gray-300" : "text-[#800040]/80"} font-medium`}>
                          {docente.Matricula}
                        </TableCell>
                        <TableCell className={isDarkMode ? "text-gray-300" : "text-[#800040]/80"}>
                          {docente.Nombre}
                        </TableCell>
                        <TableCell className={isDarkMode ? "text-gray-300" : "text-[#800040]/80"}>
                          {docente.Apellido}
                        </TableCell>
                        <TableCell className={isDarkMode ? "text-gray-300" : "text-[#800040]/80"}>
                          {docente.Email}
                        </TableCell>
                        <TableCell className={isDarkMode ? "text-gray-300" : "text-[#800040]/80"}>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isDarkMode ? "bg-[#1d5631]/20 text-[#1d5631]" : "bg-[#800040]/20 text-[#800040]"
                            }`}
                          >
                            {docente.Departamento}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => modificarDocente(docente)}
                              size="sm"
                              className={`${
                                isDarkMode
                                  ? "bg-[#800040] hover:bg-[#5c002e] text-white"
                                  : "bg-[#1d5631] hover:bg-[#153d23] text-white"
                              } transition-all duration-200 transform hover:scale-105 active:scale-95`}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar docente</span>
                            </Button>
                            <Button
                              onClick={() => eliminarDocente(docente.Matricula)}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200 transform hover:scale-105 active:scale-95"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar docente</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
