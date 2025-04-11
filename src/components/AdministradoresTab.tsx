"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Pencil,
  Trash2,
  UserCog,
  Search,
  User,
  AtSign,
  Key,
  Hash,
  Shield,
  RefreshCw,
  Plus,
  X,
  AlertCircle,
  Save,
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

interface Administrador {
  Matricula: string
  Nombre: string
  Apellido: string
  Email: string
  Contraseña?: string // Make it optional since it might not always be present
}

export function AdministradoresTab({
  db,
  isDarkMode,
  currentColors,
}: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
  const [administradores, setAdministradores] = useState<Administrador[]>([])
  const [administradoresFiltrados, setAdministradoresFiltrados] = useState<Administrador[]>([])
  const [datosAdministrador, setDatosAdministrador] = useState<Administrador>({
    Matricula: "",
    Nombre: "",
    Apellido: "",
    Email: "",
    Contraseña: "",
  })
  const [editando, setEditando] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [errorMatricula, setErrorMatricula] = useState("")

  useEffect(() => {
    cargarAdministradores()
  }, [])

  useEffect(() => {
    if (busqueda.trim() === "") {
      setAdministradoresFiltrados(administradores)
    } else {
      const terminoBusqueda = busqueda.toLowerCase()
      setAdministradoresFiltrados(
        administradores.filter(
          (admin) =>
            admin.Matricula.toLowerCase().includes(terminoBusqueda) ||
            admin.Nombre.toLowerCase().includes(terminoBusqueda) ||
            admin.Apellido.toLowerCase().includes(terminoBusqueda) ||
            admin.Email.toLowerCase().includes(terminoBusqueda),
        ),
      )
    }
  }, [busqueda, administradores])

  const cargarAdministradores = async () => {
    setCargando(true)
    try {
      const administradoresRef = collection(db, "Administrador")
      const administradoresSnapshot = await getDocs(query(administradoresRef))
      const administradoresData = administradoresSnapshot.docs.map((doc) => ({
        Matricula: doc.id,
        Nombre: doc.data().Nombre || "",
        Apellido: doc.data().Apellido || "",
        Email: doc.data().Email || "",
        Contraseña: doc.data().Contraseña || "",
      })) as Administrador[]
      setAdministradores(administradoresData)
      setAdministradoresFiltrados(administradoresData)
    } catch (error) {
      console.error("Error al cargar administradores:", error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los administradores. Por favor, intenta de nuevo.",
        icon: "error",
      })
    } finally {
      setCargando(false)
    }
  }

  const validarMatricula = async (matricula: string): Promise<boolean> => {
    if (!matricula.trim()) {
      setErrorMatricula("La matrícula es obligatoria")
      return false
    }

    if (editando) return true // Skip validation during edit mode

    try {
      const administradorDoc = doc(db, "Administrador", matricula)
      const administradorSnapshot = await getDoc(administradorDoc)

      if (administradorSnapshot.exists()) {
        setErrorMatricula("Esta matrícula ya existe. Por favor, usa una diferente.")
        return false
      }

      setErrorMatricula("")
      return true
    } catch (error) {
      console.error("Error al validar matrícula:", error)
      setErrorMatricula("Error al verificar la matrícula")
      return false
    }
  }

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate matricula first
    const matriculaValida = await validarMatricula(datosAdministrador.Matricula)
    if (!matriculaValida) return

    try {
      const { Matricula, Contraseña, ...restoDatosAdministrador } = datosAdministrador as {
        Matricula: string
        Contraseña?: string
        [key: string]: any
      }

      if (!editando) {
        if (!Contraseña) {
          throw new Error("La contraseña es requerida para crear un nuevo administrador")
        }
        const hashedPassword = await bcrypt.hash(Contraseña, 10)
        await setDoc(doc(db, "Administrador", Matricula), {
          ...restoDatosAdministrador,
          Contraseña: hashedPassword,
        } as Administrador)

        await Swal.fire({
          title: "¡Éxito!",
          text: "Administrador agregado correctamente",
          icon: "success",
        })
      } else {
        const updateData: Partial<Administrador> = { ...restoDatosAdministrador }
        if (Contraseña) {
          updateData.Contraseña = await bcrypt.hash(Contraseña, 10)
        }
        await updateDoc(doc(db, "Administrador", Matricula), updateData)

        await Swal.fire({
          title: "¡Éxito!",
          text: "Administrador actualizado correctamente",
          icon: "success",
        })
        setEditando(false)
      }

      setDatosAdministrador({ Matricula: "", Nombre: "", Apellido: "", Email: "", Contraseña: "" })
      cargarAdministradores()
    } catch (error) {
      console.error("Error al agregar/actualizar administrador:", error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error al agregar/actualizar el administrador. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const eliminarAdministrador = async (matricula: string) => {
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
        await deleteDoc(doc(db, "Administrador", matricula))
        Swal.fire({
          title: "Eliminado!",
          text: "El administrador ha sido eliminado.",
          icon: "success",
        })
        cargarAdministradores()
      } catch (error) {
        console.error("Error al eliminar administrador:", error)
        Swal.fire({
          title: "Error!",
          text: "Ha ocurrido un error al eliminar el administrador.",
          icon: "error",
        })
      }
    }
  }

  const modificarAdministrador = (administrador: Administrador) => {
    setDatosAdministrador({ ...administrador, Contraseña: "" })
    setEditando(true)
    setErrorMatricula("")
  }

  const cancelarEdicion = () => {
    setDatosAdministrador({ Matricula: "", Nombre: "", Apellido: "", Email: "", Contraseña: "" })
    setEditando(false)
    setErrorMatricula("")
  }

  // Color helpers
  const headerGradient = isDarkMode
    ? "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]"
    : "bg-gradient-to-r from-[#800040] to-[#a30050]"

  const textColor = isDarkMode ? "text-white" : "text-[#800040]"
  const descriptionColor = isDarkMode ? "text-gray-300" : "text-[#800040]/80"

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card
        className={`${isDarkMode ? "bg-[#2a2a2a]" : "bg-white"} h-full shadow-lg hover:shadow-xl transition-shadow duration-300`}
      >
        <CardHeader className={`${headerGradient} text-white rounded-t-lg`}>
          <div className="flex items-center">
            <Shield className="mr-2 h-6 w-6" />
            <CardTitle className="text-xl font-bold">
              {editando ? "Editar Administrador" : "Agregar Administrador"}
            </CardTitle>
          </div>
          <CardDescription className="text-gray-100 mt-1">
            {editando
              ? "Modifica los datos del administrador seleccionado"
              : "Completa el formulario para agregar un nuevo administrador"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matriculaAdministrador" className={`${textColor} flex items-center`}>
                <Hash className="h-4 w-4 mr-1" /> Matrícula
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Hash className={`h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-[#800040]/50"}`} />
                </div>
                <Input
                  id="matriculaAdministrador"
                  value={datosAdministrador.Matricula}
                  onChange={(e) => {
                    setDatosAdministrador({ ...datosAdministrador, Matricula: e.target.value })
                    if (errorMatricula) setErrorMatricula("")
                  }}
                  required
                  disabled={editando}
                  placeholder="Ingresa la matrícula"
                  className={`pl-10 ${
                    isDarkMode
                      ? "bg-[#3a3a3a] text-white border-[#1d5631]/30 focus:border-[#1d5631]"
                      : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30 focus:border-[#800040]"
                  } 
                    transition-all duration-300 focus:ring-2 ${isDarkMode ? "focus:ring-[#1d5631]/20" : "focus:ring-[#800040]/20"}`}
                />
              </div>
              {errorMatricula && (
                <div className="text-red-500 text-sm flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errorMatricula}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombreAdministrador" className={`${textColor} flex items-center`}>
                <User className="h-4 w-4 mr-1" /> Nombre
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className={`h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-[#800040]/50"}`} />
                </div>
                <Input
                  id="nombreAdministrador"
                  value={datosAdministrador.Nombre}
                  onChange={(e) => setDatosAdministrador({ ...datosAdministrador, Nombre: e.target.value })}
                  required
                  placeholder="Ingresa el nombre"
                  className={`pl-10 ${
                    isDarkMode
                      ? "bg-[#3a3a3a] text-white border-[#1d5631]/30 focus:border-[#1d5631]"
                      : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30 focus:border-[#800040]"
                  } 
                    transition-all duration-300 focus:ring-2 ${isDarkMode ? "focus:ring-[#1d5631]/20" : "focus:ring-[#800040]/20"}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellidoAdministrador" className={`${textColor} flex items-center`}>
                <User className="h-4 w-4 mr-1" /> Apellido
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <User className={`h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-[#800040]/50"}`} />
                </div>
                <Input
                  id="apellidoAdministrador"
                  value={datosAdministrador.Apellido}
                  onChange={(e) => setDatosAdministrador({ ...datosAdministrador, Apellido: e.target.value })}
                  required
                  placeholder="Ingresa el apellido"
                  className={`pl-10 ${
                    isDarkMode
                      ? "bg-[#3a3a3a] text-white border-[#1d5631]/30 focus:border-[#1d5631]"
                      : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30 focus:border-[#800040]"
                  } 
                    transition-all duration-300 focus:ring-2 ${isDarkMode ? "focus:ring-[#1d5631]/20" : "focus:ring-[#800040]/20"}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailAdministrador" className={`${textColor} flex items-center`}>
                <AtSign className="h-4 w-4 mr-1" /> Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <AtSign className={`h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-[#800040]/50"}`} />
                </div>
                <Input
                  id="emailAdministrador"
                  type="email"
                  value={datosAdministrador.Email}
                  onChange={(e) => setDatosAdministrador({ ...datosAdministrador, Email: e.target.value })}
                  required
                  placeholder="Ingresa el email"
                  className={`pl-10 ${
                    isDarkMode
                      ? "bg-[#3a3a3a] text-white border-[#1d5631]/30 focus:border-[#1d5631]"
                      : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30 focus:border-[#800040]"
                  } 
                    transition-all duration-300 focus:ring-2 ${isDarkMode ? "focus:ring-[#1d5631]/20" : "focus:ring-[#800040]/20"}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contraseñaAdministrador" className={`${textColor} flex items-center`}>
                <Key className="h-4 w-4 mr-1" />
                {editando ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Key className={`h-5 w-5 ${isDarkMode ? "text-gray-400" : "text-[#800040]/50"}`} />
                </div>
                <Input
                  id="contraseñaAdministrador"
                  type="password"
                  value={datosAdministrador.Contraseña}
                  onChange={(e) => setDatosAdministrador({ ...datosAdministrador, Contraseña: e.target.value })}
                  required={!editando}
                  placeholder={editando ? "Dejar en blanco para no cambiar" : "Ingresa la contraseña"}
                  className={`pl-10 ${
                    isDarkMode
                      ? "bg-[#3a3a3a] text-white border-[#1d5631]/30 focus:border-[#1d5631]"
                      : "bg-[#f8f8f8] text-[#800040] border-[#800040]/30 focus:border-[#800040]"
                  } 
                    transition-all duration-300 focus:ring-2 ${isDarkMode ? "focus:ring-[#1d5631]/20" : "focus:ring-[#800040]/20"}`}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className={`flex-1 transform transition-all duration-200 hover:scale-105 active:scale-95 ${
                  isDarkMode
                    ? "bg-[#1d5631] hover:bg-[#153d23] text-white"
                    : "bg-[#800040] hover:bg-[#5c002e] text-white"
                }`}
              >
                {editando ? (
                  <>
                    <Save className="h-4 w-4 mr-2" /> Actualizar Administrador
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" /> Agregar Administrador
                  </>
                )}
              </Button>

              {editando && (
                <Button
                  type="button"
                  onClick={cancelarEdicion}
                  variant="outline"
                  className="transform transition-all duration-200 hover:scale-105 active:scale-95 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card
        className={`${isDarkMode ? "bg-[#2a2a2a]" : "bg-white"} h-full shadow-lg hover:shadow-xl transition-shadow duration-300`}
      >
        <CardHeader className={`${headerGradient} text-white rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserCog className="mr-2 h-6 w-6" />
              <CardTitle className="text-xl font-bold">Lista de Administradores</CardTitle>
            </div>
            <Badge className={`${isDarkMode ? "bg-[#2a7a45]" : "bg-[#800040]"} hover:bg-opacity-80 transition-all`}>
              {administradores.length} {administradores.length === 1 ? "administrador" : "administradores"}
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-white" />
              </div>
              <Input
                placeholder="Buscar administradores..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 bg-white/10 border-white/20 placeholder:text-white/70 text-white w-full"
              />
            </div>
            <Button
              onClick={() => cargarAdministradores()}
              variant="outline"
              size="icon"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {cargando ? (
            <div className={`flex flex-col items-center justify-center py-12 ${textColor}`}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 mb-4 border-primary"></div>
              <p>Cargando administradores...</p>
            </div>
          ) : administradoresFiltrados.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-12 ${descriptionColor}`}>
              {busqueda ? (
                <>
                  <Search className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-center">No se encontraron administradores que coincidan con "{busqueda}"</p>
                  <Button
                    onClick={() => setBusqueda("")}
                    variant="link"
                    className={`mt-2 ${isDarkMode ? "text-[#2a7a45]" : "text-[#800040]"}`}
                  >
                    Mostrar todos los administradores
                  </Button>
                </>
              ) : (
                <>
                  <UserCog className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-center">No hay administradores registrados</p>
                  <p className="text-center text-sm opacity-70 mt-1">Agrega un administrador usando el formulario</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-auto max-h-[500px] rounded-b-lg">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-opacity-90 backdrop-blur-sm bg-inherit">
                  <TableRow>
                    <TableHead className={`${textColor} font-semibold`}>Matrícula</TableHead>
                    <TableHead className={`${textColor} font-semibold`}>Nombre Completo</TableHead>
                    <TableHead className={`${textColor} font-semibold`}>Email</TableHead>
                    <TableHead className={`${textColor} font-semibold`}>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {administradoresFiltrados.map((administrador) => (
                    <TableRow
                      key={administrador.Matricula}
                      className={`group transition-colors ${
                        isDarkMode ? "hover:bg-[#1d5631]/10" : "hover:bg-[#800040]/5"
                      }`}
                    >
                      <TableCell className={`${descriptionColor} font-medium`}>{administrador.Matricula}</TableCell>
                      <TableCell className={descriptionColor}>
                        {`${administrador.Nombre} ${administrador.Apellido}`}
                      </TableCell>
                      <TableCell className={descriptionColor}>{administrador.Email}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end space-x-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button
                            onClick={() => modificarAdministrador(administrador)}
                            size="sm"
                            variant="outline"
                            className={`h-8 px-2 py-0 transform transition-all hover:scale-105 border-blue-500 text-blue-500 hover:bg-blue-50 ${
                              isDarkMode ? "hover:bg-blue-900/20 hover:text-blue-400" : ""
                            }`}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" />
                            <span className="text-xs">Editar</span>
                          </Button>
                          <Button
                            onClick={() => eliminarAdministrador(administrador.Matricula)}
                            size="sm"
                            className="h-8 px-2 py-0 transform transition-all hover:scale-105 bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            <span className="text-xs">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
