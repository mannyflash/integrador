"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X, Clock, User, FileText, Calendar, Activity, Info } from "lucide-react"
import { collection, query, orderBy, limit, getDocs, where, type Timestamp } from "firebase/firestore"
import { db } from "../pages/panel-laboratorista"

// Definición de colores del sistema
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

interface VistaBitacoraProps {
  esModoOscuro: boolean
  logAction: (action: string, details: string) => Promise<void>
  usuarioActual?: {
    nombre: string
    ocupacion: string
    email: string
  }
}

interface LogEntry {
  id: string
  timestamp: Timestamp
  action: string
  user: string
  userOcupacion?: string
  userEmail?: string
  details: string
}

const VistaBitacora: React.FC<VistaBitacoraProps> = ({ esModoOscuro, logAction, usuarioActual }) => {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [userFilter, setUserFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [uniqueActions, setUniqueActions] = useState<string[]>([])
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("todos")

  // Usar la paleta de colores según el modo
  const theme = esModoOscuro ? colors.dark : colors.light

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const logsRef = collection(db, "logs")
      const q = query(logsRef, orderBy("timestamp", "desc"), limit(100))
      const querySnapshot = await getDocs(q)
      const logs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LogEntry[]
      setLogEntries(logs)

      // Extraer acciones y usuarios únicos para los filtros
      const actions = [...new Set(logs.map((log) => log.action))]
      const users = [...new Set(logs.map((log) => log.user))]
      setUniqueActions(actions)
      setUniqueUsers(users)

      // Registrar la acción de visualización de bitácora
      if (usuarioActual) {
        await logAction(
          "Visualización de Bitácora",
          `${usuarioActual.nombre} (${usuarioActual.ocupacion}) consultó la bitácora del sistema`,
        )
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = async () => {
    setIsLoading(true)
    try {
      const logsRef = collection(db, "logs")
      let q = query(logsRef, orderBy("timestamp", "desc"))

      if (dateFilter) {
        const filterDate = new Date(dateFilter)
        const nextDay = new Date(filterDate)
        nextDay.setDate(nextDay.getDate() + 1)
        q = query(q, where("timestamp", ">=", filterDate), where("timestamp", "<", nextDay))
      }

      if (actionFilter && actionFilter !== "all") {
        q = query(q, where("action", "==", actionFilter))
      }

      if (userFilter && userFilter !== "all") {
        q = query(q, where("user", "==", userFilter))
      }

      const querySnapshot = await getDocs(q)
      const logs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LogEntry[]
      setLogEntries(logs)

      // Registrar la acción de filtrado
      if (usuarioActual) {
        const filterDetails = [
          dateFilter ? `fecha: ${dateFilter}` : "",
          actionFilter && actionFilter !== "all" ? `acción: ${actionFilter}` : "",
          userFilter && userFilter !== "all" ? `usuario: ${userFilter}` : "",
          searchTerm ? `término: ${searchTerm}` : "",
        ]
          .filter(Boolean)
          .join(", ")

        await logAction(
          "Filtrado de Bitácora",
          `${usuarioActual.nombre} (${usuarioActual.ocupacion}) filtró la bitácora por ${filterDetails || "criterios personalizados"}`,
        )
      }
    } catch (error) {
      console.error("Error applying filters:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = async () => {
    setSearchTerm("")
    setDateFilter("")
    setActionFilter("")
    setUserFilter("")
    setActiveTab("todos")
    await fetchLogs()

    // Registrar la acción de limpieza de filtros
    if (usuarioActual) {
      await logAction(
        "Limpieza de Filtros",
        `${usuarioActual.nombre} (${usuarioActual.ocupacion}) limpió los filtros de la bitácora`,
      )
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)

    if (value === "hoy") {
      const today = new Date()
      setDateFilter(today.toISOString().split("T")[0])
      applyFilters()
    } else if (value === "semana") {
      const today = new Date()
      const lastWeek = new Date(today)
      lastWeek.setDate(today.getDate() - 7)
      // Aquí solo establecemos el filtro, pero necesitaríamos modificar la lógica de filtrado
      // para manejar rangos de fechas
    } else if (value === "mes") {
      const today = new Date()
      const lastMonth = new Date(today)
      lastMonth.setMonth(today.getMonth() - 1)
      // Similar al caso anterior
    } else if (value === "todos") {
      clearFilters()
    }
  }

  const filteredEntries = logEntries.filter(
    (entry) =>
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.userOcupacion && entry.userOcupacion.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const getActionBadgeColor = (action: string) => {
    const actionMap: Record<string, string> = {
      "Inicio de Sesión": esModoOscuro ? theme.buttonPrimary : theme.buttonPrimary,
      "Cierre de Sesión": esModoOscuro ? theme.buttonSecondary : theme.buttonSecondary,
      "Registro de Usuario": esModoOscuro ? theme.buttonPrimary : theme.buttonPrimary,
      "Eliminación de Usuario": esModoOscuro ? theme.buttonSecondary : theme.buttonSecondary,
      "Modificación de Usuario": esModoOscuro ? theme.buttonPrimary : theme.buttonPrimary,
      "Visualización de Bitácora": esModoOscuro ? theme.buttonSecondary : theme.buttonSecondary,
      "Filtrado de Bitácora": esModoOscuro ? theme.buttonPrimary : theme.buttonPrimary,
      "Limpieza de Filtros": esModoOscuro ? theme.buttonSecondary : theme.buttonSecondary,
      "Registro de Evento": esModoOscuro ? theme.buttonPrimary : theme.buttonPrimary,
      "Inicio de Clase": esModoOscuro ? theme.buttonSecondary : theme.buttonSecondary,
      "Registro de Asistencia": esModoOscuro ? theme.buttonPrimary : theme.buttonPrimary,
    }

    return actionMap[action] || (esModoOscuro ? theme.buttonTertiary : theme.buttonTertiary)
  }

  return (
    <div className={`p-4 ${esModoOscuro ? `bg-[${theme.background}]` : `bg-[${theme.background}]`}`}>
      <Card className={`shadow-lg ${esModoOscuro ? theme.cardBackground : theme.cardBackground}`}>
        <CardHeader className={`pb-4 ${esModoOscuro ? theme.headerBackground : theme.headerBackground}`}>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className={`text-2xl font-bold ${esModoOscuro ? theme.titleText : theme.titleText}`}>
                Bitácora del Sistema
              </CardTitle>
              <CardDescription className={`mt-1 ${esModoOscuro ? theme.descriptionText : theme.descriptionText}`}>
                Registro de todas las actividades realizadas en el sistema
              </CardDescription>
            </div>
            {usuarioActual && (
              <div
                className={`text-right px-4 py-2 rounded-lg ${esModoOscuro ? theme.countBackground : theme.countBackground}`}
              >
                <p className={`text-sm font-medium ${esModoOscuro ? theme.grayText : theme.grayText}`}>
                  Usuario actual:
                </p>
                <p className={`text-sm font-semibold ${esModoOscuro ? theme.countText : theme.countText}`}>
                  {usuarioActual.nombre}
                </p>
                <p className={`text-xs ${esModoOscuro ? theme.grayText : theme.grayText}`}>{usuarioActual.ocupacion}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="todos" value={activeTab} onValueChange={handleTabChange} className="mb-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger
                value="todos"
                className={esModoOscuro ? "data-[state=active]:bg-[#1d5631]" : "data-[state=active]:bg-[#800040]"}
              >
                Todos los registros
              </TabsTrigger>
              <TabsTrigger
                value="hoy"
                className={esModoOscuro ? "data-[state=active]:bg-[#1d5631]" : "data-[state=active]:bg-[#800040]"}
              >
                Hoy
              </TabsTrigger>
              <TabsTrigger
                value="semana"
                className={esModoOscuro ? "data-[state=active]:bg-[#1d5631]" : "data-[state=active]:bg-[#800040]"}
              >
                Última semana
              </TabsTrigger>
              <TabsTrigger
                value="mes"
                className={esModoOscuro ? "data-[state=active]:bg-[#1d5631]" : "data-[state=active]:bg-[#800040]"}
              >
                Último mes
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar en la bitácora..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${esModoOscuro ? theme.inputBackground : theme.inputBackground} ${esModoOscuro ? theme.inputBorder : theme.inputBorder} ${esModoOscuro ? theme.inputText : theme.inputText}`}
                />
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  type="date"
                  placeholder="Filtrar por fecha"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className={`pl-10 ${esModoOscuro ? theme.inputBackground : theme.inputBackground} ${esModoOscuro ? theme.inputBorder : theme.inputBorder} ${esModoOscuro ? theme.inputText : theme.inputText}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger
                  className={`${esModoOscuro ? theme.inputBackground : theme.inputBackground} ${esModoOscuro ? theme.inputBorder : theme.inputBorder} ${esModoOscuro ? theme.inputText : theme.inputText}`}
                >
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Filtrar por acción" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger
                  className={`${esModoOscuro ? theme.inputBackground : theme.inputBackground} ${esModoOscuro ? theme.inputBorder : theme.inputBorder} ${esModoOscuro ? theme.inputText : theme.inputText}`}
                >
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Filtrar por usuario" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={applyFilters}
                  className={`flex-1 ${esModoOscuro ? theme.badgeOutline : theme.badgeOutline}`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Aplicar
                </Button>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className={`flex-1 ${esModoOscuro ? theme.badgeOutline : theme.badgeOutline}`}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div
                className={`animate-spin rounded-full h-10 w-10 border-b-2 ${
                  esModoOscuro ? `border-[${theme.primary}]` : `border-[${theme.primary}]`
                }`}
              ></div>
            </div>
          ) : (
            <>
              <div className="flex items-center mb-4">
                <Info className={`h-4 w-4 mr-2 ${esModoOscuro ? theme.countText : theme.countText}`} />
                <span className={`text-sm ${esModoOscuro ? theme.grayText : theme.grayText}`}>
                  {filteredEntries.length}{" "}
                  {filteredEntries.length === 1 ? "registro encontrado" : "registros encontrados"}
                </span>
              </div>

              <div
                className={`rounded-lg border overflow-hidden ${esModoOscuro ? theme.grayBorder : theme.grayBorder}`}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`${esModoOscuro ? theme.grayBackground : theme.grayBackground}`}>
                      <tr>
                        <th
                          className={`px-4 py-3 text-left font-medium ${esModoOscuro ? theme.titleText : theme.titleText}`}
                        >
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Fecha y Hora</span>
                          </div>
                        </th>
                        <th
                          className={`px-4 py-3 text-left font-medium ${esModoOscuro ? theme.titleText : theme.titleText}`}
                        >
                          <div className="flex items-center">
                            <Activity className="h-4 w-4 mr-2" />
                            <span>Acción</span>
                          </div>
                        </th>
                        <th
                          className={`px-4 py-3 text-left font-medium ${esModoOscuro ? theme.titleText : theme.titleText}`}
                        >
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <span>Usuario</span>
                          </div>
                        </th>
                        <th
                          className={`px-4 py-3 text-left font-medium ${esModoOscuro ? theme.titleText : theme.titleText}`}
                        >
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Detalles</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.length > 0 ? (
                        filteredEntries.map((entry, index) => (
                          <tr
                            key={entry.id}
                            className={`${
                              index % 2 === 0
                                ? esModoOscuro
                                  ? "bg-[#1e1e1e]"
                                  : "bg-white"
                                : esModoOscuro
                                  ? "bg-[#262626]"
                                  : theme.countBackground
                            } ${esModoOscuro ? theme.hoverBackground : theme.hoverBackground} transition-colors`}
                          >
                            <td className="px-4 py-3">
                              <div className={`font-medium ${esModoOscuro ? theme.titleText : theme.titleText}`}>
                                {entry.timestamp.toDate().toLocaleDateString("es-MX", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </div>
                              <div className={`text-xs ${esModoOscuro ? theme.grayText : theme.grayText}`}>
                                {entry.timestamp.toDate().toLocaleTimeString("es-MX")}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={getActionBadgeColor(entry.action)}>{entry.action}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className={`font-medium ${esModoOscuro ? theme.titleText : theme.titleText}`}>
                                {entry.user}
                              </div>
                              {entry.userOcupacion && (
                                <div className={`text-xs ${esModoOscuro ? theme.grayText : theme.grayText}`}>
                                  {entry.userOcupacion}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 max-w-[500px]">
                              <div
                                className={`line-clamp-2 ${esModoOscuro ? theme.titleText : theme.titleText}`}
                                title={entry.details}
                              >
                                {entry.details}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className={`text-center py-10 ${esModoOscuro ? theme.grayText : theme.grayText}`}
                          >
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Info className="h-10 w-10 opacity-50" />
                              <p>No se encontraron registros que coincidan con los criterios de búsqueda</p>
                              <Button
                                variant="link"
                                onClick={clearFilters}
                                className={esModoOscuro ? theme.countText : theme.countText}
                              >
                                Limpiar filtros
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default VistaBitacora

