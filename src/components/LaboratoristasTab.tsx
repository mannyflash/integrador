"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pencil,
  Trash2,
  Search,
  UserCog,
  BadgeCheck,
  Mail,
  KeyRound,
  Plus,
  X,
  RefreshCw,
  Save,
  UserPlus,
  Filter,
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

interface Laboratorista {
  Matricula: string
  Nombre: string
  Apellido: string
  Email: string
  Contraseña: string
  [key: string]: any
}

export function LaboratoristasTab({
  db,
  isDarkMode,
  currentColors,
}: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
  const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])
  const [datosLaboratorista, setDatosLaboratorista] = useState<Laboratorista>({
    Matricula: "",
    Nombre: "",
    Apellido: "",
    Email: "",
    Contraseña: "",
  })
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [laboratoristasFiltrados, setLaboratoristasFiltrados] = useState<Laboratorista[]>([])

  useEffect(() => {
    cargarLaboratoristas()
  }, [])

  useEffect(() => {
    if (busqueda.trim() === "") {
      setLaboratoristasFiltrados(laboratoristas)
    } else {
      const terminoBusqueda = busqueda.toLowerCase()
      const filtrados = laboratoristas.filter(
        (lab) =>
          lab.Matricula.toLowerCase().includes(terminoBusqueda) ||
          lab.Nombre.toLowerCase().includes(terminoBusqueda) ||
          lab.Apellido.toLowerCase().includes(terminoBusqueda) ||
          lab.Email.toLowerCase().includes(terminoBusqueda) ||
          `${lab.Nombre} ${lab.Apellido}`.toLowerCase().includes(terminoBusqueda),
      )
      setLaboratoristasFiltrados(filtrados)
    }
  }, [busqueda, laboratoristas])

  const cargarLaboratoristas = async () => {
    setCargando(true)
    try {
      const laboratoristasRef = collection(db, "Laboratoristas")
      const laboratoristasSnapshot = await getDocs(query(laboratoristasRef))
      const laboratoristasData = laboratoristasSnapshot.docs.map((doc) => ({
        Matricula: doc.id,
        Nombre: doc.data().Nombre || "",
        Apellido: doc.data().Apellido || "",
        Email: doc.data().Email || "",
        Contraseña: doc.data().Contraseña || "",
        ...doc.data(),
      })) as Laboratorista[]
      setLaboratoristas(laboratoristasData)
      setLaboratoristasFiltrados(laboratoristasData)
    } catch (error) {
      console.error("Error al cargar laboratoristas:", error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los laboratoristas. Por favor, intenta de nuevo.",
        icon: "error",
      })
    } finally {
      setCargando(false)
    }
  }

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { Matricula, Contraseña, ...restoDatosLaboratorista } = datosLaboratorista

      if (!editando) {
        // Check if the matricula already exists when adding a new laboratory technician
        const laboratoristaDoc = doc(db, "Laboratoristas", Matricula)
        const laboratoristaSnapshot = await getDoc(laboratoristaDoc)

        if (laboratoristaSnapshot.exists()) {
          await Swal.fire({
            title: "Error",
            text: "Esta matrícula ya existe. Por favor, use una matrícula diferente.",
            icon: "error",
          })
          return
        }

        const hashedPassword = await bcrypt.hash(Contraseña, 10)
        await setDoc(laboratoristaDoc, { ...restoDatosLaboratorista, Contraseña: hashedPassword })
        await Swal.fire({
          title: "¡Éxito!",
          text: "Laboratorista agregado correctamente",
          icon: "success",
        })
      } else {
        const updateData = { ...restoDatosLaboratorista }
        if (Contraseña !== "") {
          updateData.Contraseña = await bcrypt.hash(Contraseña, 10)
        }
        await updateDoc(doc(db, "Laboratoristas", Matricula), updateData)
        await Swal.fire({
          title: "¡Éxito!",
          text: "Laboratorista actualizado correctamente",
          icon: "success",
        })
        setEditando(false)
      }
      setDatosLaboratorista({ Matricula: "", Nombre: "", Apellido: "", Email: "", Contraseña: "" })
      cargarLaboratoristas()
    } catch (error) {
      console.error("Error al agregar/actualizar laboratorista:", error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error al agregar/actualizar el laboratorista. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const eliminarLaboratorista = async (matricula: string) => {
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
        await deleteDoc(doc(db, "Laboratoristas", matricula))
        Swal.fire({
          title: "Eliminado!",
          text: "El laboratorista ha sido eliminado.",
          icon: "success",
        })
        cargarLaboratoristas()
      } catch (error) {
        console.error("Error al eliminar laboratorista:", error)
        Swal.fire({
          title: "Error!",
          text: "Ha ocurrido un error al eliminar el laboratorista.",
          icon: "error",
        })
      }
    }
  }

  const modificarLaboratorista = (laboratorista: Laboratorista) => {
    setDatosLaboratorista({ ...laboratorista, Contraseña: "" })
    setEditando(true)
  }

  const cancelarEdicion = () => {
    setDatosLaboratorista({ Matricula: "", Nombre: "", Apellido: "", Email: "", Contraseña: "" })
    setEditando(false)
  }

  // Determinar colores basados en el modo
  const primaryColor = isDarkMode ? "#1d5631" : "#800040"
  const secondaryColor = isDarkMode ? "#800040" : "#1d5631"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card
        className={`${isDarkMode ? "bg-[#2a2a2a]" : "bg-white"} h-full shadow-lg hover:shadow-xl transition-shadow duration-300`}
      >
        <CardHeader
          className={`pb-2 ${
            isDarkMode
              ? "bg-gradient-to-r from-[#1d5631] to-[#2a7a45] text-white"
              : "bg-gradient-to-r from-[#800040] to-[#a30050] text-white"
          } rounded-t-lg`}
        >
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            {editando ? (
              <>
                <Pencil className="h-5 w-5" />
                Editar Laboratorista
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Agregar Laboratorista
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="matriculaLaboratorista"
                className={`flex items-center gap-2 font-medium ${isDarkMode ? "text-white" : "text-[#800040]"}`}
              >
                <BadgeCheck className="h-4 w-4" />
                Matrícula
              </Label>
              <div className="relative">
                <UserCog
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode ? "text-gray-400" : "text-[#800040]/60"
                  }`}
                />
                <Input
                  id="matriculaLaboratorista"
                  value={datosLaboratorista.Matricula}
                  onChange={(e) => setDatosLaboratorista({ ...datosLaboratorista, Matricula: e.target.value })}
                  required
                  disabled={editando}
                  placeholder="Ingrese la matrícula"
                  className={`pl-10 border ${
                    isDarkMode
                      ? "bg-[#3a3a3a] text-white border-[#1d5631]/30 focus:border-[#1d5631]"
                      : "bg-white text-gray-900 border-[#800040]/30 focus:border-[#800040]"
                  } rounded-md focus:ring-2 ${
                    isDarkMode ? "focus:ring-[#1d5631]/20" : "focus:ring-[#800040]/20"
                  } transition-all`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="nombreLaboratorista"
                className={`flex items-center gap-2 font-medium ${isDarkMode ? "text-white" : "text-[#800040]"}`}
              >
                <UserCog className="h-4 w-4" />
                Nombre
              </Label>
              <div className="relative">
                <UserCog
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode ? "text-gray-400" : "text-[#800040]/60"
                  }`}
                />
                <Input
                  id="nombreLaboratorista"
                  value={datosLaboratorista.Nombre}
                  onChange={(e) => setDatosLaboratorista({ ...datosLaboratorista, Nombre: e.target.value })}
                  required
                  placeholder="Ingrese el nombre"
                  className={`pl-10 border ${
                    isDarkMode
                      ? "bg-[#3a3a3a] text-white border-[#1d5631]/30 focus:border-[#1d5631]"
                      : "bg-white text-gray-900 border-[#800040]/30 focus:border-[#800040]"
                  } rounded-md focus:ring-2 ${
                    isDarkMode ? "focus:ring-[#1d5631]/20" : "focus:ring-[#800040]/20"
                  } transition-all`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="apellidoLaboratorista"
                className={`flex items-center gap-2 font-medium ${isDarkMode ? "text-white" : "text-[#800040]"}`}
              >
                <UserCog className="h-4 w-4" />
                Apellido
              </Label>
              <div className="relative">
                <UserCog
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode ? "text-gray-400" : "text-[#800040]/60"
                  }`}
                />
                <Input
                  id="apellidoLaboratorista"
                  value={datosLaboratorista.Apellido}
                  onChange={(e) => setDatosLaboratorista({ ...datosLaboratorista, Apellido: e.target.value })}
                  required
                  placeholder="Ingrese el apellido"
                  className={`pl-10 border ${
                    isDarkMode
                      ? "bg-[#3a3a3a] text-white border-[#1d5631]/30 focus:border-[#1d5631]"
                      : "bg-white text-gray-900 border-[#800040]/30 focus:border-[#800040]"
                  } rounded-md focus:ring-2 ${
                    isDarkMode ? "focus:ring-[#1d5631]/20" : "focus:ring-[#800040]/20"
                  } transition-all`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="emailLaboratorista"
                className={`flex items-center gap-2 font-medium ${isDarkMode ? "text-white" : "text-[#800040]"}`}
              >
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <div className="relative">
                <Mail
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode ? "text-gray-400" : "text-[#800040]/60"
                  }`}
                />
                <Input
                  id="emailLaboratorista"
                  type="email"
                  value={datosLaboratorista.Email}
                  onChange={(e) => setDatosLaboratorista({ ...datosLaboratorista, Email: e.target.value })}
                  required
                  placeholder="correo@ejemplo.com"
                  className={`pl-10 border ${
                    isDarkMode
                      ? "bg-[#3a3a3a] text-white border-[#1d5631]/30 focus:border-[#1d5631]"
                      : "bg-white text-gray-900 border-[#800040]/30 focus:border-[#800040]"
                  } rounded-md focus:ring-2 ${
                    isDarkMode ? "focus:ring-[#1d5631]/20" : "focus:ring-[#800040]/20"
                  } transition-all`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="contraseñaLaboratorista"
                className={`flex items-center gap-2 font-medium ${isDarkMode ? "text-white" : "text-[#800040]"}`}
              >
                <KeyRound className="h-4 w-4" />
                {editando ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
              </Label>
              <div className="relative">
                <KeyRound
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                    isDarkMode ? "text-gray-400" : "text-[#800040]/60"
                  }`}
                />
                <Input
                  id="contraseñaLaboratorista"
                  type="password"
                  value={datosLaboratorista.Contraseña}
                  onChange={(e) => setDatosLaboratorista({ ...datosLaboratorista, Contraseña: e.target.value })}
                  required={!editando}
                  placeholder={editando ? "••••••••" : "Ingrese la contraseña"}
                  className={`pl-10 border ${
                    isDarkMode
                      ? "bg-[#3a3a3a] text-white border-[#1d5631]/30 focus:border-[#1d5631]"
                      : "bg-white text-gray-900 border-[#800040]/30 focus:border-[#800040]"
                  } rounded-md focus:ring-2 ${
                    isDarkMode ? "focus:ring-[#1d5631]/20" : "focus:ring-[#800040]/20"
                  } transition-all`}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className={`flex-1 gap-2 transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                  isDarkMode
                    ? "bg-[#1d5631] hover:bg-[#153d23] text-white"
                    : "bg-[#800040] hover:bg-[#5c002e] text-white"
                }`}
              >
                {editando ? (
                  <>
                    <Save className="h-4 w-4" />
                    Actualizar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Agregar
                  </>
                )}
              </Button>

              {editando && (
                <Button
                  type="button"
                  onClick={cancelarEdicion}
                  variant="outline"
                  className={`gap-2 transition-all duration-200 border ${
                    isDarkMode
                      ? "border-[#1d5631] text-white hover:bg-[#1d5631]/10"
                      : "border-[#800040] text-[#800040] hover:bg-[#800040]/10"
                  }`}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card
        className={`${isDarkMode ? "bg-[#2a2a2a]" : "bg-white"} h-full shadow-lg hover:shadow-xl transition-shadow duration-300`}
      >
        <CardHeader
          className={`pb-2 ${
            isDarkMode
              ? "bg-gradient-to-r from-[#1d5631] to-[#2a7a45] text-white"
              : "bg-gradient-to-r from-[#800040] to-[#a30050] text-white"
          } rounded-t-lg`}
        >
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <UserCog className="h-5 w-5" />
              Lista de Laboratoristas
              <span className={`ml-2 text-sm px-2 py-0.5 rounded-full ${isDarkMode ? "bg-white/20" : "bg-white/20"}`}>
                {laboratoristasFiltrados.length}
              </span>
            </CardTitle>
            <Button onClick={cargarLaboratoristas} variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="relative mb-4">
            <Search
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                isDarkMode ? "text-gray-400" : "text-[#800040]/60"
              }`}
            />
            <Input
              placeholder="Buscar laboratoristas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={`pl-10 border ${
                isDarkMode
                  ? "bg-[#3a3a3a] text-white border-[#1d5631]/30 focus:border-[#1d5631]"
                  : "bg-white text-gray-900 border-[#800040]/30 focus:border-[#800040]"
              } rounded-md focus:ring-2 ${
                isDarkMode ? "focus:ring-[#1d5631]/20" : "focus:ring-[#800040]/20"
              } transition-all`}
            />
          </div>

          <div className="rounded-md border overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              {cargando ? (
                <div
                  className={`flex justify-center items-center py-20 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Cargando laboratoristas...</span>
                </div>
              ) : laboratoristasFiltrados.length === 0 ? (
                <div
                  className={`flex flex-col justify-center items-center py-20 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  <Filter className="h-16 w-16 mb-2 opacity-20" />
                  <p className="text-center">
                    {busqueda.trim() !== ""
                      ? "No se encontraron laboratoristas que coincidan con la búsqueda."
                      : "No hay laboratoristas registrados."}
                  </p>
                  {busqueda.trim() !== "" && (
                    <Button
                      onClick={() => setBusqueda("")}
                      variant="link"
                      className={isDarkMode ? "text-[#2a7a45]" : "text-[#800040]"}
                    >
                      Limpiar búsqueda
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className={isDarkMode ? "bg-[#1d5631]/20" : "bg-[#800040]/5"}>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#800040]"} font-medium`}>
                        Matrícula
                      </TableHead>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#800040]"} font-medium`}>
                        Nombre
                      </TableHead>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#800040]"} font-medium`}>
                        Apellido
                      </TableHead>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#800040]"} font-medium`}>
                        Email
                      </TableHead>
                      <TableHead className={`${isDarkMode ? "text-white" : "text-[#800040]"} font-medium`}>
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laboratoristasFiltrados.map((laboratorista) => (
                      <TableRow
                        key={laboratorista.Matricula}
                        className={`group transition-colors ${
                          isDarkMode ? "hover:bg-[#1d5631]/10" : "hover:bg-[#800040]/5"
                        }`}
                      >
                        <TableCell className={`font-medium ${isDarkMode ? "text-white" : "text-[#800040]"}`}>
                          {laboratorista.Matricula}
                        </TableCell>
                        <TableCell className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                          {laboratorista.Nombre}
                        </TableCell>
                        <TableCell className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                          {laboratorista.Apellido}
                        </TableCell>
                        <TableCell className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                          {laboratorista.Email}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => modificarLaboratorista(laboratorista)}
                              size="sm"
                              variant="outline"
                              className={`h-8 px-2 transition-all ${
                                isDarkMode
                                  ? "border-[#1d5631] text-[#2a7a45] hover:bg-[#1d5631]/10"
                                  : "border-[#800040] text-[#800040] hover:bg-[#800040]/10"
                              } group-hover:opacity-100 ${
                                laboratoristasFiltrados.length > 5 ? "opacity-0" : "opacity-100"
                              }`}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              onClick={() => eliminarLaboratorista(laboratorista.Matricula)}
                              size="sm"
                              variant="destructive"
                              className={`h-8 px-2 transition-all group-hover:opacity-100 ${
                                laboratoristasFiltrados.length > 5 ? "opacity-0" : "opacity-100"
                              }`}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
