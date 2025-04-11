"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { doc, updateDoc, setDoc, onSnapshot } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Laptop,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Plus,
  Settings,
  Info,
  HelpCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"
import swal from "sweetalert"
import { db } from "../pages/panel-laboratorista"
import { toast } from "@/hooks/use-toast"


interface Equipo {
  id: string
  fueraDeServicio: boolean
  enUso?: boolean
  ultimaActualizacion?: string
  notas?: string
}

// Modificar la definición de colores para incorporar el color gris
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

export default function VistaEquipos({
  esModoOscuro,
  logAction,
}: { esModoOscuro: boolean; logAction: (action: string, details: string) => Promise<void> }) {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [equiposFiltrados, setEquiposFiltrados] = useState<Equipo[]>([])
  const [cantidadEquipos, setCantidadEquipos] = useState("")
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [dialogoNotasAbierto, setDialogoNotasAbierto] = useState(false)
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Equipo | null>(null)
  const [notas, setNotas] = useState("")
  const [filtro, setFiltro] = useState("todos")
  const [busqueda, setBusqueda] = useState("")
  const [cargando, setCargando] = useState(true)
  const [activeTab, setActiveTab] = useState("todos")
  const [equiposAnteriores, setEquiposAnteriores] = useState<Equipo[]>([])

  const modoColor = esModoOscuro ? colors.dark : colors.light

  const cargarEquipos = () => {
    setCargando(true)
    try {
      // Usar onSnapshot para escuchar cambios en tiempo real
      const unsubscribe = onSnapshot(
        doc(db, "Numero de equipos", "equipos"),
        (equiposDoc) => {
          if (equiposDoc.exists()) {
            const data = equiposDoc.data()
            const equiposData = Array.isArray(data.Equipos) ? data.Equipos : []

            // Asegurarse de que todos los equipos tengan los campos necesarios
            const equiposCompletos = equiposData.map((equipo) => ({
              ...equipo,
              ultimaActualizacion: equipo.ultimaActualizacion || new Date().toISOString(),
              notas: equipo.notas || "",
              enUso: equipo.enUso || false,
            }))

            setEquipos(equiposCompletos)
            setCargando(false)
            logAction("Cargar Equipos", `Se cargaron ${equiposCompletos.length} equipos`)
          } else {
            setEquipos([])
            setCargando(false)
            logAction("Cargar Equipos", "No se encontraron equipos")
          }
        },
        (error) => {
          console.error("Error al escuchar cambios en equipos:", error)
          setCargando(false)
          logAction("Error", `Error al escuchar cambios en equipos: ${error}`)
        },
      )

      // Retornar la función de limpieza
      return unsubscribe
    } catch (error) {
      console.error("Error al configurar el listener de equipos:", error)
      setCargando(false)
      logAction("Error", `Error al configurar el listener de equipos: ${error}`)
      return () => {}
    }
  }

  useEffect(() => {
    // Guardar la función de limpieza que devuelve cargarEquipos
    const unsubscribe = cargarEquipos()

    // Limpiar la suscripción cuando el componente se desmonte
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [equipos, filtro, busqueda, activeTab])

  useEffect(() => {
    // Verificar si algún equipo cambió a estado "en uso"
    if (equiposAnteriores.length > 0) {
      const nuevosEnUso = equipos.filter(
        (equipo) => equipo.enUso && !equiposAnteriores.find((eq) => eq.id === equipo.id)?.enUso,
      )

      if (nuevosEnUso.length > 0) {
        // Mostrar notificación para cada equipo que cambió a "en uso"
        nuevosEnUso.forEach((equipo) => {
          toast({
            title: "Equipo en uso",
            description: `El equipo ${equipo.id} está siendo utilizado ahora`,
            variant: "default",
          })
        })
      }
    }

    // Actualizar el estado anterior
    setEquiposAnteriores(equipos)
  }, [equipos])

  const aplicarFiltros = () => {
    let equiposFiltrados = [...equipos]

    // Filtrar por estado
    if (filtro === "enServicio") {
      equiposFiltrados = equiposFiltrados.filter((equipo) => !equipo.fueraDeServicio)
    } else if (filtro === "fueraDeServicio") {
      equiposFiltrados = equiposFiltrados.filter((equipo) => equipo.fueraDeServicio)
    } else if (filtro === "enUso") {
      equiposFiltrados = equiposFiltrados.filter((equipo) => equipo.enUso)
    }

    // Filtrar por búsqueda
    if (busqueda) {
      equiposFiltrados = equiposFiltrados.filter(
        (equipo) =>
          equipo.id.toLowerCase().includes(busqueda.toLowerCase()) ||
          (equipo.notas && equipo.notas.toLowerCase().includes(busqueda.toLowerCase())),
      )
    }

    setEquiposFiltrados(equiposFiltrados)
  }

  const toggleFueraDeServicio = async (id: string) => {
    try {
      const equiposActualizados = equipos.map((equipo) =>
        equipo.id === id
          ? {
              ...equipo,
              fueraDeServicio: !equipo.fueraDeServicio,
              ultimaActualizacion: new Date().toISOString(),
            }
          : equipo,
      )

      await updateDoc(doc(db, "Numero de equipos", "equipos"), {
        Equipos: equiposActualizados,
      })

      setEquipos(equiposActualizados)

      const nuevoEstado = equiposActualizados.find((e) => e.id === id)?.fueraDeServicio
        ? "fuera de servicio"
        : "en servicio"

      await swal({
        title: "¡Éxito!",
        text: `Estado del equipo ${id} actualizado a ${nuevoEstado}`,
        icon: "success",
      })

      await logAction("Actualizar Equipo", `Estado del equipo ${id} actualizado a ${nuevoEstado}`)
    } catch (error) {
      console.error("Error al actualizar el equipo:", error)
      await swal({
        title: "Error",
        text: "Ha ocurrido un error al actualizar el equipo.",
        icon: "error",
      })
      await logAction("Error", `Error al actualizar el equipo ${id}: ${error}`)
    }
  }

  const agregarEquipos = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const cantidad = Number.parseInt(cantidadEquipos)
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error("Cantidad inválida")
      }

      const nuevosEquipos = Array.from({ length: cantidad }, (_, i) => ({
        id: (i + 1).toString(),
        fueraDeServicio: false,
        enUso: false,
        ultimaActualizacion: new Date().toISOString(),
        notas: "",
      }))

      await setDoc(doc(db, "Numero de equipos", "equipos"), { Equipos: nuevosEquipos })
      setEquipos(nuevosEquipos)
      setCantidadEquipos("")
      setDialogoAbierto(false)

      await swal({
        title: "¡Éxito!",
        text: `${cantidad} equipos agregados correctamente, reemplazando los anteriores`,
        icon: "success",
      })

      await logAction("Agregar Equipos", `Se agregaron ${cantidad} equipos nuevos, reemplazando los anteriores`)
    } catch (error) {
      console.error("Error al agregar equipos:", error)
      await swal({
        title: "Error",
        text: "Ha ocurrido un error al agregar los equipos.",
        icon: "error",
      })
      await logAction("Error", `Error al agregar equipos: ${error}`)
    }
  }

  const abrirDialogoNotas = (equipo: Equipo) => {
    setEquipoSeleccionado(equipo)
    setNotas(equipo.notas || "")
    setDialogoNotasAbierto(true)
  }

  const guardarNotas = async () => {
    if (!equipoSeleccionado) return

    try {
      const equiposActualizados = equipos.map((equipo) =>
        equipo.id === equipoSeleccionado.id
          ? {
              ...equipo,
              notas: notas,
              ultimaActualizacion: new Date().toISOString(),
            }
          : equipo,
      )

      await updateDoc(doc(db, "Numero de equipos", "equipos"), {
        Equipos: equiposActualizados,
      })

      setEquipos(equiposActualizados)
      setDialogoNotasAbierto(false)

      await swal({
        title: "¡Éxito!",
        text: `Notas del equipo ${equipoSeleccionado.id} actualizadas`,
        icon: "success",
      })

      await logAction("Actualizar Notas", `Notas del equipo ${equipoSeleccionado.id} actualizadas`)
    } catch (error) {
      console.error("Error al actualizar las notas:", error)
      await swal({
        title: "Error",
        text: "Ha ocurrido un error al actualizar las notas.",
        icon: "error",
      })
      await logAction("Error", `Error al actualizar las notas del equipo ${equipoSeleccionado.id}: ${error}`)
    }
  }

  const formatearFecha = (fechaISO: string) => {
    try {
      const fecha = new Date(fechaISO)
      return fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString()
    } catch (error) {
      return "Fecha desconocida"
    }
  }

  const obtenerEstadisticas = () => {
    const total = equipos.length
    const enServicio = equipos.filter((e) => !e.fueraDeServicio).length
    const fueraDeServicio = equipos.filter((e) => e.fueraDeServicio).length
    const enUso = equipos.filter((e) => e.enUso).length

    return { total, enServicio, fueraDeServicio, enUso }
  }

  const estadisticas = obtenerEstadisticas()

  return (
    <div className="space-y-6">
      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
              Total de Equipos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {estadisticas.total}
              </div>
              <Laptop className={`h-5 w-5 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
            </div>
            <p className={`text-xs mt-1 ${esModoOscuro ? "text-gray-300" : "text-[#74726f]"}`}>
              Equipos registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
              En Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {estadisticas.enServicio}
              </div>
              <CheckCircle className={`h-5 w-5 ${esModoOscuro ? "text-[#2a7a45]" : "text-green-600"}`} />
            </div>
            <p className={`text-xs mt-1 ${esModoOscuro ? "text-gray-300" : "text-[#74726f]"}`}>
              Equipos disponibles para uso
            </p>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
              Fuera de Servicio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {estadisticas.fueraDeServicio}
              </div>
              <AlertTriangle className={`h-5 w-5 ${esModoOscuro ? "text-amber-400" : "text-amber-500"}`} />
            </div>
            <p className={`text-xs mt-1 ${esModoOscuro ? "text-gray-300" : "text-[#74726f]"}`}>
              Equipos no disponibles
            </p>
          </CardContent>
        </Card>

        <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
              En Uso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-2xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {estadisticas.enUso}
              </div>
              <Settings className={`h-5 w-5 ${esModoOscuro ? "text-blue-400" : "text-blue-500"}`} />
            </div>
            <p className={`text-xs mt-1 ${esModoOscuro ? "text-gray-300" : "text-[#74726f]"}`}>
              Equipos siendo utilizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y acciones */}
      <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
        <CardHeader className={`${esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground}`}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-white">Gestión de Equipos</CardTitle>
            <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 text-white hover:bg-white/30">
                  <Plus className="mr-2 h-4 w-4" /> Agregar Equipos
                </Button>
              </DialogTrigger>
              <DialogContent className={esModoOscuro ? "bg-[#1d5631]/20 text-white" : "bg-white"}>
                <DialogHeader>
                  <DialogTitle className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                    Agregar Nuevos Equipos
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={agregarEquipos} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cantidadEquipos" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                      Cantidad de Equipos
                    </Label>
                    <Input
                      id="cantidadEquipos"
                      type="number"
                      value={cantidadEquipos}
                      onChange={(e) => setCantidadEquipos(e.target.value)}
                      placeholder="Ingrese la cantidad de equipos"
                      required
                      className={`${esModoOscuro ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white" : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"}`}
                    />
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        Esta acción reemplazará todos los equipos existentes. Los datos actuales se perderán.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogoAbierto(false)}
                      className={
                        esModoOscuro
                          ? "bg-gray-700 text-white hover:bg-gray-600"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className={esModoOscuro ? colors.dark.buttonPrimary : colors.light.buttonPrimary}
                    >
                      Agregar Equipos
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription className="text-white/80">
            Administre los equipos del laboratorio, cambie su estado y agregue notas
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="busqueda" className={`block mb-2 ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                Buscar Equipo
              </Label>
              <div className="relative">
                <Input
                  id="busqueda"
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por ID o notas..."
                  className={`${esModoOscuro ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white" : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"} pl-10`}
                />
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}
                />
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="filtro" className={`block mb-2 ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                Filtrar por Estado
              </Label>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full grid-cols-4 ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-[#fff0f5]"}`}>
                  <TabsTrigger
                    value="todos"
                    onClick={() => setFiltro("todos")}
                    className={`text-xs py-1 ${
                      esModoOscuro
                        ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                        : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                    }`}
                  >
                    Todos
                  </TabsTrigger>
                  <TabsTrigger
                    value="enServicio"
                    onClick={() => setFiltro("enServicio")}
                    className={`text-xs py-1 ${
                      esModoOscuro
                        ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                        : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                    }`}
                  >
                    En Servicio
                  </TabsTrigger>
                  <TabsTrigger
                    value="fueraDeServicio"
                    onClick={() => setFiltro("fueraDeServicio")}
                    className={`text-xs py-1 ${
                      esModoOscuro
                        ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                        : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                    }`}
                  >
                    Fuera de Servicio
                  </TabsTrigger>
                  <TabsTrigger
                    value="enUso"
                    onClick={() => setFiltro("enUso")}
                    className={`text-xs py-1 ${
                      esModoOscuro
                        ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                        : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                    }`}
                  >
                    En Uso
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-end">
              <Button
                onClick={cargarEquipos}
                className={`${esModoOscuro ? colors.dark.buttonTertiary : colors.light.buttonTertiary}`}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de equipos */}
      <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
        <CardHeader className={`pb-2 ${esModoOscuro ? "border-b border-gray-700" : "border-b"}`}>
          <div className="flex justify-between items-center">
            <CardTitle className={`flex items-center ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
              <Laptop className="w-5 h-5 mr-2" />
              Lista de Equipos
            </CardTitle>
            <Badge className={esModoOscuro ? "bg-[#1d5631] text-white" : "bg-[#800040] text-white"}>
              {equiposFiltrados.length} equipos
            </Badge>
          </div>
          <CardDescription className={esModoOscuro ? "text-gray-300" : "text-[#800040]/80"}>
            {filtro === "todos"
              ? "Mostrando todos los equipos"
              : filtro === "enServicio"
                ? "Mostrando equipos en servicio"
                : filtro === "fueraDeServicio"
                  ? "Mostrando equipos fuera de servicio"
                  : "Mostrando equipos en uso"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {cargando ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : equiposFiltrados.length > 0 ? (
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow
                    className={esModoOscuro ? "bg-[#1d5631]/40 border-gray-700" : "bg-[#fff0f5] border-gray-200"}
                  >
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">En Uso</TableHead>
                    <TableHead className="font-semibold">Última Actualización</TableHead>
                    <TableHead className="font-semibold">Notas</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {equiposFiltrados.map((equipo) => (
                      <motion.tr
                        key={equipo.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={`${
                          esModoOscuro
                            ? "hover:bg-[#1d5631]/40 border-b border-gray-700"
                            : "hover:bg-[#fff0f5] border-b border-gray-200"
                        }`}
                      >
                        <TableCell className="font-medium">{equipo.id}</TableCell>
                        <TableCell>
                          {equipo.fueraDeServicio ? (
                            <Badge
                              variant="outline"
                              className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Fuera de Servicio
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              En Servicio
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {equipo.enUso ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30"
                            >
                              <Settings className="mr-1 h-3 w-3 animate-spin-slow" />
                              En Uso
                            </Badge>
                          ) : (
                            <span className={esModoOscuro ? "text-gray-400" : "text-gray-500"}>No</span>
                          )}
                        </TableCell>
                        <TableCell className={esModoOscuro ? "text-gray-300" : "text-gray-700"}>
                          {equipo.ultimaActualizacion ? formatearFecha(equipo.ultimaActualizacion) : "N/A"}
                        </TableCell>
                        <TableCell>
                          {equipo.notas ? (
                            <div className="max-w-xs truncate">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`cursor-help ${esModoOscuro ? "text-gray-300" : "text-gray-700"}`}>
                                      {equipo.notas}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{equipo.notas}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          ) : (
                            <span className={esModoOscuro ? "text-gray-400" : "text-gray-500"}>Sin notas</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => abrirDialogoNotas(equipo)}
                                    className={esModoOscuro ? "hover:bg-[#1d5631]/30" : "hover:bg-[#fff0f5]"}
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Agregar/Editar Notas</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              size="sm"
                              variant={equipo.fueraDeServicio ? "default" : "destructive"}
                              onClick={() => toggleFueraDeServicio(equipo.id)}
                              className={
                                equipo.fueraDeServicio
                                  ? esModoOscuro
                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                    : "bg-green-600 hover:bg-green-700 text-white"
                                  : esModoOscuro
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                              }
                            >
                              {equipo.fueraDeServicio ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Activar
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Desactivar
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <HelpCircle className={`h-12 w-12 mb-4 ${esModoOscuro ? "text-gray-500" : "text-gray-400"}`} />
                <p className={`text-lg font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                  No se encontraron equipos
                </p>
                <p className={`text-sm ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                  {busqueda
                    ? "No hay equipos que coincidan con tu búsqueda"
                    : filtro !== "todos"
                      ? `No hay equipos con el estado "${filtro === "enServicio" ? "en servicio" : filtro === "fueraDeServicio" ? "fuera de servicio" : "en uso"}"`
                      : "Agrega equipos para comenzar"}
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className={`p-4 ${esModoOscuro ? "border-t border-gray-700" : "border-t"}`}>
          <div className="flex justify-between items-center w-full">
            <p className={`text-sm ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
              Mostrando {equiposFiltrados.length} de {equipos.length} equipos
            </p>
            <Button
              onClick={() => setDialogoAbierto(true)}
              className={esModoOscuro ? colors.dark.buttonPrimary : colors.light.buttonPrimary}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Equipos
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Diálogo para agregar/editar notas */}
      <Dialog open={dialogoNotasAbierto} onOpenChange={setDialogoNotasAbierto}>
        <DialogContent className={esModoOscuro ? "bg-[#1d5631]/20 text-white" : "bg-white"}>
          <DialogHeader>
            <DialogTitle className={esModoOscuro ? "text-white" : "text-[#800040]"}>
              {equipoSeleccionado ? `Notas para Equipo ${equipoSeleccionado.id}` : "Notas"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notas" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                Agregar o editar notas
              </Label>
              <textarea
                id="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Escriba notas sobre el estado o problemas del equipo..."
                className={`w-full h-32 p-2 rounded-md ${
                  esModoOscuro
                    ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                    : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                }`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogoNotasAbierto(false)}
              className={
                esModoOscuro
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={guardarNotas}
              className={esModoOscuro ? colors.dark.buttonPrimary : colors.light.buttonPrimary}
            >
              Guardar Notas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente Search para el ícono de búsqueda
function Search(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

