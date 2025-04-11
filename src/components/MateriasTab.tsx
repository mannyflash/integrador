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
  BookOpen,
  UserSquare2,
  GraduationCap,
  Search,
  RefreshCw,
  X,
  Plus,
  Save,
  Ban,
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
  where,
} from "firebase/firestore"
import Swal from "sweetalert2"
import type React from "react"

interface Materia {
  ID: string
  NombreMateria: string
  MaestroID: string
  Semestre: string
  [key: string]: any
}

interface Docente {
  ID: string
  NombreCompleto: string
}

export function MateriasTab({
  db,
  isDarkMode,
  currentColors,
}: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [datosMateria, setDatosMateria] = useState<Materia>({
    ID: "",
    NombreMateria: "",
    MaestroID: "",
    Semestre: "",
  })
  const [editando, setEditando] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [semestreFilter, setSemestreFilter] = useState("todos")

  useEffect(() => {
    cargarMaterias()
    cargarDocentes()
  }, [])

  const cargarMaterias = async () => {
    setIsLoading(true)
    try {
      const materiasRef = collection(db, "Materias")
      const materiasSnapshot = await getDocs(query(materiasRef))
      const materiasData = materiasSnapshot.docs.map((doc) => ({
        ID: doc.id,
        NombreMateria: doc.data().NombreMateria || "",
        MaestroID: doc.data().MaestroID || "",
        Semestre: doc.data().Semestre || "",
        ...doc.data(),
      })) as Materia[]
      setMaterias(materiasData)
    } catch (error) {
      console.error("Error al cargar materias:", error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar las materias. Por favor, intenta de nuevo.",
        icon: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const cargarDocentes = async () => {
    try {
      const docentesRef = collection(db, "Docentes")
      const docentesSnapshot = await getDocs(query(docentesRef))
      const docentesData = docentesSnapshot.docs.map((doc) => ({
        ID: doc.id,
        NombreCompleto: `${doc.data().Nombre} ${doc.data().Apellido}`,
      }))
      setDocentes(docentesData)
    } catch (error) {
      console.error("Error al cargar docentes:", error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los docentes. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { ID, NombreMateria, ...restoDatosMateria } = datosMateria

      if (!editando) {
        // Check if the subject name already exists when adding a new subject
        const materiasRef = collection(db, "Materias")
        const nombreMateriaQuery = query(materiasRef, where("NombreMateria", "==", NombreMateria))
        const nombreMateriaQuerySnapshot = await getDocs(nombreMateriaQuery)

        if (!nombreMateriaQuerySnapshot.empty) {
          await Swal.fire({
            title: "Error",
            text: "Ya existe una materia con este nombre. Por favor, use un nombre diferente.",
            icon: "error",
          })
          return
        }

        const nuevoID = doc(collection(db, "Materias")).id
        await setDoc(doc(db, "Materias", nuevoID), { NombreMateria, ...restoDatosMateria })
        await Swal.fire({
          title: "¡Éxito!",
          text: "Materia agregada correctamente",
          icon: "success",
        })
      } else {
        await updateDoc(doc(db, "Materias", ID), { NombreMateria, ...restoDatosMateria })
        await Swal.fire({
          title: "¡Éxito!",
          text: "Materia actualizada correctamente",
          icon: "success",
        })
        setEditando(false)
      }
      setDatosMateria({ ID: "", NombreMateria: "", MaestroID: "", Semestre: "" })
      cargarMaterias()
    } catch (error) {
      console.error("Error al agregar/actualizar materia:", error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error al agregar/actualizar la materia. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const eliminarMateria = async (id: string) => {
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
        await deleteDoc(doc(db, "Materias", id))
        Swal.fire("Eliminada!", "La materia ha sido eliminada.", "success")
        cargarMaterias()
      } catch (error) {
        console.error("Error al eliminar materia:", error)
        Swal.fire("Error!", "Ha ocurrido un error al eliminar la materia.", "error")
      }
    }
  }

  const modificarMateria = (materia: Materia) => {
    setDatosMateria(materia)
    setEditando(true)
  }

  const cancelarEdicion = () => {
    setDatosMateria({ ID: "", NombreMateria: "", MaestroID: "", Semestre: "" })
    setEditando(false)
  }

  const materiasFiltradas = useMemo(() => {
    return materias.filter((materia) => {
      const matchesSearch =
        materia.NombreMateria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (docentes.find((d) => d.ID === materia.MaestroID)?.NombreCompleto || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        materia.Semestre.includes(searchTerm)

      const matchesSemestre = semestreFilter === "todos" || materia.Semestre === semestreFilter

      return matchesSearch && matchesSemestre
    })
  }, [materias, searchTerm, semestreFilter, docentes])

  const headerBgClass = isDarkMode
    ? "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]"
    : "bg-gradient-to-r from-[#800040] to-[#a30050]"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-0`}
      >
        <CardHeader className={`${headerBgClass} text-white p-4`}>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            {editando ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editando ? "Editar Materia" : "Agregar Materia"}
          </CardTitle>
          <CardDescription className="text-gray-100">
            {editando
              ? "Modifica los datos de la materia seleccionada"
              : "Completa el formulario para agregar una nueva materia"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="nombreMateria"
                className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
              >
                <BookOpen className="h-4 w-4" /> Nombre de la Materia
              </Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  id="nombreMateria"
                  value={datosMateria.NombreMateria}
                  onChange={(e) => setDatosMateria({ ...datosMateria, NombreMateria: e.target.value })}
                  required
                  placeholder="Ej: Programación Orientada a Objetos"
                  className={`pl-10 ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="maestroMateria"
                className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
              >
                <UserSquare2 className="h-4 w-4" /> Maestro
              </Label>
              <Select
                value={datosMateria.MaestroID}
                onValueChange={(value) => setDatosMateria({ ...datosMateria, MaestroID: value })}
              >
                <SelectTrigger
                  id="maestroMateria"
                  className={`${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"} pl-10`}
                >
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <UserSquare2 className="h-4 w-4 text-gray-500" />
                  </div>
                  <SelectValue placeholder="Selecciona un maestro" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {docentes.map((docente) => (
                    <SelectItem key={docente.ID} value={docente.ID}>
                      {docente.NombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="semestreMateria"
                className={`${isDarkMode ? "text-white" : "text-gray-700"} flex items-center gap-2`}
              >
                <GraduationCap className="h-4 w-4" /> Semestre
              </Label>
              <Select
                value={datosMateria.Semestre}
                onValueChange={(value) => setDatosMateria({ ...datosMateria, Semestre: value })}
              >
                <SelectTrigger
                  id="semestreMateria"
                  className={`${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"} pl-10`}
                >
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <GraduationCap className="h-4 w-4 text-gray-500" />
                  </div>
                  <SelectValue placeholder="Selecciona un semestre" />
                </SelectTrigger>
                <SelectContent className={isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((semestre) => (
                    <SelectItem key={semestre} value={semestre.toString()}>
                      {semestre}º Semestre
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {editando ? "Actualizar Materia" : "Agregar Materia"}
              </Button>

              {editando && (
                <Button type="button" onClick={cancelarEdicion} variant="outline" className="gap-2">
                  <Ban className="h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card
        className={`${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border-0`}
      >
        <CardHeader className={`${headerBgClass} text-white p-4`}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Lista de Materias
              <span
                className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  isDarkMode ? "bg-[#1d5631]/20 text-white" : "bg-white/20 text-white"
                }`}
              >
                {materiasFiltradas.length}
              </span>
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={cargarMaterias} className="text-white hover:bg-white/20">
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Actualizar</span>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar materias..."
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
            <Select value={semestreFilter} onValueChange={setSemestreFilter}>
              <SelectTrigger className="w-[180px] bg-white/10 text-white border-white/20">
                <SelectValue placeholder="Filtrar por semestre" />
              </SelectTrigger>
              <SelectContent className={isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>
                <SelectItem value="todos">Todos los semestres</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((semestre) => (
                  <SelectItem key={semestre} value={semestre.toString()}>
                    {semestre}º Semestre
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          ) : materiasFiltradas.length > 0 ? (
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className={isDarkMode ? "bg-gray-900" : "bg-gray-50"}>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Nombre</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Maestro</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Semestre</TableHead>
                    <TableHead className={isDarkMode ? "text-white" : "text-gray-700"}>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materiasFiltradas.map((materia) => (
                    <TableRow
                      key={materia.ID}
                      className={`group ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"} transition-colors`}
                    >
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>
                        <div className="font-medium">{materia.NombreMateria}</div>
                      </TableCell>
                      <TableCell className={isDarkMode ? "text-white" : "text-gray-700"}>
                        {docentes.find((d) => d.ID === materia.MaestroID)?.NombreCompleto || "No asignado"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isDarkMode ? "bg-[#1d5631]/20 text-[#2a7a45]" : "bg-[#800040]/20 text-[#800040]"
                          }`}
                        >
                          {materia.Semestre}º Semestre
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button
                            onClick={() => modificarMateria(materia)}
                            size="sm"
                            variant="outline"
                            className={`h-8 w-8 p-0 ${
                              isDarkMode
                                ? "text-blue-400 border-blue-400 hover:bg-blue-400/10"
                                : "text-blue-600 border-blue-600 hover:bg-blue-600/10"
                            }`}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar materia</span>
                          </Button>
                          <Button
                            onClick={() => eliminarMateria(materia.ID)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 border-red-600 hover:bg-red-600/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar materia</span>
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
              <BookOpen className="h-12 w-12 mb-2 opacity-20" />
              <h3 className="text-lg font-medium mb-1">No hay materias</h3>
              <p className="text-sm max-w-md">
                {searchTerm || semestreFilter !== "todos"
                  ? "No se encontraron materias con los filtros aplicados. Intenta con otros criterios de búsqueda."
                  : "No hay materias registradas. Agrega una nueva materia usando el formulario."}
              </p>
              {(searchTerm || semestreFilter !== "todos") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("")
                    setSemestreFilter("todos")
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
