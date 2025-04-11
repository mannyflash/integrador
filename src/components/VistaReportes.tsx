"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "../pages/panel-laboratorista"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Users,
  BookOpen,
  X,
  FileText,
  FileDown,
  Eye,
  Calendar,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Laptop,
  User,
  School,
  GraduationCap,
  BookOpenCheck,
  ClipboardList,
} from "lucide-react"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

interface Alumno {
  id: string
  Nombre: string
  Apellido: string
  Carrera: string
  Semestre: string | number
  Turno: string
  Grupo: string
  Equipo: string
}

interface ReportData {
  id: string
  practica: string
  materia: string
  fecha: string
  horaInicio: string
  estudiantes: Alumno[]
  maestro: {
    id: string
    nombre: string
    apellido: string
  }
  totalAsistencias: number
  alumnosIds: string[]
  maestroApellido: string
  maestroId: string
  maestroNombre: string
}

interface VistaReportesProps {
  esModoOscuro: boolean
  logAction: (action: string, details: string) => Promise<void>
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

export default function VistaReportes({ esModoOscuro, logAction }: VistaReportesProps) {
  const [practicasHoy, setPracticasHoy] = useState<ReportData[]>([])
  const [practicasFiltradas, setPracticasFiltradas] = useState<ReportData[]>([])
  const [estaCargando, setEstaCargando] = useState(true)
  const [filtroMateria, setFiltroMateria] = useState("")
  const [filtroPractica, setFiltroPractica] = useState("")
  const [filtroProfesor, setFiltroProfesor] = useState("")
  const [practicaSeleccionada, setPracticaSeleccionada] = useState<ReportData | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [activeTab, setActiveTab] = useState("detalles")

  useEffect(() => {
    const unsubscribe = obtenerPracticasHoy()
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    filtrarPracticas()
  }, [practicasHoy, filtroMateria, filtroPractica, filtroProfesor])

  const obtenerPracticasHoy = () => {
    try {
      const hoy = new Date()
      const fechaHoy = format(hoy, "dd/MM/yyyy")

      const refInfoClase = collection(db, "ClassInformation")
      const consultaInfoClase = query(
        refInfoClase,
        where("fecha", "==", fechaHoy),
        // Quitamos temporalmente el orderBy mientras se crea el índice
      )

      // Usar onSnapshot para actualizaciones en tiempo real
      const unsubscribe = onSnapshot(
        consultaInfoClase,
        (snapshot) => {
          const practicasDelDia = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              practica: data.practica,
              materia: data.materia,
              fecha: data.fecha,
              horaInicio: data.horaInicio,
              estudiantes: data.alumnos
                ? data.alumnos.map((alumno: any) => ({
                    id: alumno.id || "",
                    Nombre: alumno.Nombre || alumno.nombre || "",
                    Apellido: alumno.Apellido || alumno.apellido || "",
                    Carrera: alumno.Carrera || alumno.carrera || "",
                    Semestre: alumno.Semestre || alumno.semestre || "",
                    Turno: alumno.Turno || alumno.turno || "",
                    Grupo: alumno.Grupo || alumno.grupo || "",
                    Equipo: alumno.Equipo || alumno.equipo || "",
                  }))
                : [],
              maestro: {
                id: data.maestroId,
                nombre: data.maestroNombre,
                apellido: data.maestroApellido,
              },
              totalAsistencias: data.totalAsistencias,
              alumnosIds: data.alumnosIds,
              maestroApellido: data.maestroApellido,
              maestroId: data.maestroId,
              maestroNombre: data.maestroNombre,
            } as ReportData
          })

          // Ordenamos manualmente las prácticas por horaInicio (más recientes primero)
          practicasDelDia.sort((a, b) => {
            if (!a.horaInicio) return 1
            if (!b.horaInicio) return -1
            return b.horaInicio.localeCompare(a.horaInicio)
          })

          setPracticasHoy(practicasDelDia)
          setPracticasFiltradas(practicasDelDia)
          setEstaCargando(false)
          logAction("Obtener Prácticas", `Se obtuvieron ${practicasDelDia.length} prácticas del día ${fechaHoy}`)
          console.log("Prácticas actualizadas en tiempo real:", practicasDelDia.length)
        },
        (error) => {
          console.error("Error al obtener prácticas del día:", error)
          setEstaCargando(false)
          logAction("Error", `Error al obtener prácticas del día: ${error}`)
        },
      )

      // Retornar la función de limpieza para desuscribirse cuando el componente se desmonte
      return unsubscribe
    } catch (error) {
      console.error("Error al configurar el listener de prácticas:", error)
      setEstaCargando(false)
      logAction("Error", `Error al configurar el listener de prácticas: ${error}`)
      return () => {}
    }
  }

  const filtrarPracticas = () => {
    let filtradas = [...practicasHoy] // Crear una copia para no modificar el original

    if (filtroMateria) {
      filtradas = filtradas.filter((practica) => practica.materia.toLowerCase().includes(filtroMateria.toLowerCase()))
    }

    if (filtroPractica) {
      filtradas = filtradas.filter((practica) => practica.practica.toLowerCase().includes(filtroPractica.toLowerCase()))
    }

    if (filtroProfesor) {
      filtradas = filtradas.filter((practica) =>
        `${practica.maestro.nombre} ${practica.maestro.apellido}`.toLowerCase().includes(filtroProfesor.toLowerCase()),
      )
    }

    // Asegurar que siempre estén ordenadas por hora (más recientes primero)
    filtradas.sort((a, b) => {
      // Si no hay horaInicio, colocar al final
      if (!a.horaInicio) return 1
      if (!b.horaInicio) return -1
      // Comparar horas en formato inverso para mostrar las más recientes primero
      return b.horaInicio.localeCompare(a.horaInicio)
    })

    setPracticasFiltradas(filtradas)
    logAction(
      "Aplicar Filtros",
      `Se aplicaron filtros: Materia: ${filtroMateria}, Práctica: ${filtroPractica}, Profesor: ${filtroProfesor}`,
    )
  }

  const limpiarFiltros = async () => {
    setFiltroMateria("")
    setFiltroPractica("")
    setFiltroProfesor("")
    await logAction("Limpiar Filtros", "Se limpiaron todos los filtros de búsqueda")
  }

  const seleccionarPractica = async (practica: ReportData) => {
    setPracticaSeleccionada(practica)
    setModalAbierto(true)
    setActiveTab("detalles")
    await logAction("Ver Detalles", `Se visualizaron los detalles de la práctica ${practica.id}`)
  }

  const exportarAPDF = async (practica: ReportData) => {
    const doc = new jsPDF()

    // Add logo to the top-left corner
    doc.addImage("/FondoItspp.png", "PNG", 10, 10, 30, 30)

    // Title
    doc.setFontSize(16)
    doc.text("TALLER DE PROGRAMACION", doc.internal.pageSize.width / 2, 25, { align: "center" })
    doc.text("HOJA DE REGISTRO", doc.internal.pageSize.width / 2, 35, { align: "center" })

    // Information fields in two columns
    doc.setFontSize(12)
    // Left column
    doc.text(`FECHA: ${practica.fecha}`, 14, 50)
    doc.text(`GRUPO: ${Array.from(new Set(practica.estudiantes.map((e) => e.Grupo))).join(", ")}`, 14, 60)
    doc.text(`TURNO: ${Array.from(new Set(practica.estudiantes.map((e) => e.Turno))).join(", ")}`, 14, 70)
    doc.text(`PRACTICA: ${practica.practica}`, 14, 80)
    doc.text(`MATERIA: ${practica.materia}`, 14, 90)

    // Right column
    doc.text(`HORA: ${practica.horaInicio || ""}`, 120, 50)
    doc.text(`CARRERA: ${Array.from(new Set(practica.estudiantes.map((e) => e.Carrera))).join(", ")}`, 120, 60)
    doc.text(`SEMESTRE: ${Array.from(new Set(practica.estudiantes.map((e) => e.Semestre))).join(", ")}`, 120, 70)
    doc.text(`DOCENTE: ${practica.maestroNombre} ${practica.maestroApellido}`, 14, 100)

    // Table of students
    doc.autoTable({
      startY: 110,
      head: [["#", "NOMBRE ALUMNO", "NUM. PC"]],
      body: practica.estudiantes.map((estudiante, index) => [
        (index + 1).toString(),
        `${estudiante.Nombre} ${estudiante.Apellido}`,
        estudiante.Equipo || "",
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: "auto" },
        2: { cellWidth: 25 },
      },
      styles: {
        cellPadding: 2,
        fontSize: 10,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
    })

    // Footer signatures
    const finalY = (doc as any).lastAutoTable.finalY || 220
    doc.line(14, finalY + 20, 80, finalY + 20)
    doc.line(120, finalY + 20, 186, finalY + 20)
    doc.text("FIRMA DOCENTE", 14, finalY + 25)
    doc.text("FIRMA ENCARGADO LABORATORIO", 120, finalY + 25)

    // Cambiar esta línea:
    //doc.save(`practica_${practica.id}.pdf`)

    // Por esta:
    const nombreMateria = practica.materia.replace(/\s+/g, "_").toLowerCase()
    const fechaFormateada = practica.fecha.replace(/\//g, "-")
    doc.save(`practica_${nombreMateria}_${fechaFormateada}.pdf`)
    await logAction("Exportar PDF", `Se exportó a PDF la práctica ${practica.practica} de ${practica.materia}`)
  }

  const exportarAExcel = async (practica: ReportData) => {
    const workbook = XLSX.utils.book_new()

    // Actualizar los colores de los estilos para el documento Excel
    const estilos = {
      titulo: {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
        fill: { fgColor: { rgb: esModoOscuro ? "1D5631" : "800040" } },
        alignment: { horizontal: "center", vertical: "center" },
      },
      subtitulo: {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        fill: { fgColor: { rgb: esModoOscuro ? "2A7A45" : "A30050" } },
        alignment: { horizontal: "center", vertical: "center" },
      },
      encabezado: {
        font: { bold: true, sz: 11 },
        fill: { fgColor: { rgb: esModoOscuro ? "153D23" : "FFF0F5" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      },
      etiqueta: {
        font: { bold: true, sz: 10 },
        alignment: { horizontal: "right" },
        border: { right: { style: "thin" } },
      },
      valor: { font: { sz: 10 }, alignment: { horizontal: "left" }, border: { left: { style: "thin" } } },
      tablaHeader: {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
        fill: { fgColor: { rgb: esModoOscuro ? "1D5631" : "800040" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      },
      tablaFila: {
        font: { sz: 10 },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      },
      tablaFilaAlterna: {
        font: { sz: 10 },
        fill: { fgColor: { rgb: esModoOscuro ? "0C1F15" : "FFF0F5" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      },
      firma: { font: { bold: true, sz: 10 }, alignment: { horizontal: "center" }, border: { top: { style: "thin" } } },
    }

    // HOJA 1: RESUMEN DE LA PRÁCTICA
    const resumenData = [
      ["INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO"], // A1
      ["TALLER DE PROGRAMACIÓN - HOJA DE REGISTRO"], // A2
      [], // Fila vacía
      ["INFORMACIÓN DE LA PRÁCTICA"], // A4
      ["Materia:", practica.materia, "", "Fecha:", practica.fecha], // A5
      ["Práctica:", practica.practica, "", "Hora:", practica.horaInicio || "N/A"], // A6
      [
        "Docente:",
        `${practica.maestroNombre} ${practica.maestroApellido}`,
        "",
        "Total Asistencias:",
        practica.totalAsistencias.toString(),
      ], // A7
      [], // Fila vacía
      ["INFORMACIÓN DEL GRUPO"], // A9
      ["Carrera:", Array.from(new Set(practica.estudiantes.map((e) => e.Carrera))).join(", ") || "N/A"], // A10
      ["Grupo:", Array.from(new Set(practica.estudiantes.map((e) => e.Grupo))).join(", ") || "N/A"], // A11
      ["Semestre:", Array.from(new Set(practica.estudiantes.map((e) => e.Semestre))).join(", ") || "N/A"], // A12
      ["Turno:", Array.from(new Set(practica.estudiantes.map((e) => e.Turno))).join(", ") || "N/A"], // A13
    ]

    const resumenWS = XLSX.utils.aoa_to_sheet(resumenData)

    // Aplicar estilos a la hoja de resumen
    resumenWS["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Título principal
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Subtítulo
      { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, // Información de la práctica
      { s: { r: 8, c: 0 }, e: { r: 8, c: 4 } }, // Información del grupo
      { s: { r: 9, c: 1 }, e: { r: 9, c: 4 } }, // Carrera
      { s: { r: 10, c: 1 }, e: { r: 10, c: 4 } }, // Grupo
      { s: { r: 11, c: 1 }, e: { r: 11, c: 4 } }, // Semestre
      { s: { r: 12, c: 1 }, e: { r: 12, c: 4 } }, // Turno
    ]

    // Aplicar estilos a celdas específicas
    if (!resumenWS["!cols"]) resumenWS["!cols"] = []
    resumenWS["!cols"] = [
      { wch: 15 }, // A
      { wch: 25 }, // B
      { wch: 15 }, // C
      { wch: 15 }, // D
      { wch: 25 }, // E
    ]

    // Aplicar estilos a las celdas
    if (resumenWS) {
      applyStyle(resumenWS, "A1:E1", estilos.titulo)
      applyStyle(resumenWS, "A2:E2", estilos.subtitulo)
      applyStyle(resumenWS, "A4:E4", estilos.subtitulo)
      applyStyle(resumenWS, "A9:E9", estilos.subtitulo)
    }

    // Estilos para etiquetas y valores
    if (resumenWS) {
      // Estilos para etiquetas y valores
      for (let r = 5; r <= 7; r++) {
        applyStyle(resumenWS, `A${r}`, estilos.etiqueta)
        applyStyle(resumenWS, `B${r}:C${r}`, estilos.valor)
        applyStyle(resumenWS, `D${r}`, estilos.etiqueta)
        applyStyle(resumenWS, `E${r}`, estilos.valor)
      }

      for (let r = 10; r <= 13; r++) {
        applyStyle(resumenWS, `A${r}`, estilos.etiqueta)
        applyStyle(resumenWS, `B${r}:E${r}`, estilos.valor)
      }
    }

    XLSX.utils.book_append_sheet(workbook, resumenWS, "Resumen")

    // HOJA 2: LISTA DE ASISTENCIA
    const headerRow = ["#", "ID Alumno", "Nombre", "Apellido", "Carrera", "Grupo", "Semestre", "Turno", "Equipo"]
    const asistenciaData = [
      ["LISTA DE ASISTENCIA - TALLER DE PROGRAMACIÓN"], // A1
      [`Materia: ${practica.materia} - Práctica: ${practica.practica} - Fecha: ${practica.fecha}`], // A2
      [], // Fila vacía
      headerRow, // A4
    ]

    // Agregar datos de estudiantes
    practica.estudiantes.forEach((estudiante, index) => {
      asistenciaData.push([
        (index + 1).toString(),
        estudiante.id,
        estudiante.Nombre,
        estudiante.Apellido,
        estudiante.Carrera,
        estudiante.Grupo,
        (estudiante.Semestre || "").toString(),
        estudiante.Turno,
        estudiante.Equipo,
      ])
    })

    // Agregar filas para firmas
    asistenciaData.push([])
    asistenciaData.push([])
    asistenciaData.push(["", "", "FIRMA DOCENTE", "", "", "", "FIRMA ENCARGADO LABORATORIO"])

    const asistenciaWS = XLSX.utils.aoa_to_sheet(asistenciaData)

    // Aplicar estilos a la hoja de asistencia
    asistenciaWS["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Título
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Subtítulo
      { s: { r: asistenciaData.length - 1, c: 2 }, e: { r: asistenciaData.length - 1, c: 4 } }, // Firma docente
      { s: { r: asistenciaData.length - 1, c: 5 }, e: { r: asistenciaData.length - 1, c: 8 } }, // Firma encargado
    ]

    // Aplicar estilos a celdas específicas
    if (!asistenciaWS["!cols"]) asistenciaWS["!cols"] = []
    asistenciaWS["!cols"] = [
      { wch: 5 }, // #
      { wch: 12 }, // ID
      { wch: 20 }, // Nombre
      { wch: 20 }, // Apellido
      { wch: 25 }, // Carrera
      { wch: 10 }, // Grupo
      { wch: 10 }, // Semestre
      { wch: 10 }, // Turno
      { wch: 10 }, // Equipo
    ]

    // Aplicar estilos a las celdas
    if (asistenciaWS) {
      // Aplicar estilos a las celdas
      applyStyle(asistenciaWS, "A1:I1", estilos.titulo)
      applyStyle(asistenciaWS, "A2:I2", estilos.subtitulo)
      applyStyle(asistenciaWS, "A4:I4", estilos.tablaHeader)
    }

    // Aplicar estilos a las filas de datos (alternando colores)
    if (asistenciaWS) {
      // Aplicar estilos a las filas de datos (alternando colores)
      for (let r = 5; r < asistenciaData.length - 3; r++) {
        const estilo = r % 2 === 0 ? estilos.tablaFila : estilos.tablaFilaAlterna
        applyStyle(asistenciaWS, `A${r}:I${r}`, estilo)
      }

      // Aplicar estilos a las firmas
      const ultimaFila = asistenciaData.length
      applyStyle(asistenciaWS, `C${ultimaFila}:E${ultimaFila}`, estilos.firma)
      applyStyle(asistenciaWS, `F${ultimaFila}:I${ultimaFila}`, estilos.firma)
    }

    XLSX.utils.book_append_sheet(workbook, asistenciaWS, "Lista de Asistencia")

    // HOJA 3: ESTADÍSTICAS
    const equiposPersonales = practica.estudiantes.filter((e) => e.Equipo === "personal").length
    const equiposLaboratorio = practica.estudiantes.filter((e) => e.Equipo !== "personal").length

    // Calcular distribución por carrera
    const carrerasCount: Record<string, number> = {}
    practica.estudiantes.forEach((e) => {
      carrerasCount[e.Carrera] = (carrerasCount[e.Carrera] || 0) + 1
    })

    const estadisticasData = [
      ["ESTADÍSTICAS DE ASISTENCIA"], // A1
      [`Práctica: ${practica.practica} - Fecha: ${practica.fecha}`], // A2
      [], // Fila vacía
      ["RESUMEN GENERAL"], // A4
      ["Total de estudiantes:", practica.totalAsistencias], // A5
      ["Equipos personales:", equiposPersonales], // A6
      ["Equipos de laboratorio:", equiposLaboratorio], // A7
      [], // Fila vacía
      ["DISTRIBUCIÓN POR CARRERA"], // A9
    ]

    // Agregar distribución por carrera
    let row = 10
    Object.entries(carrerasCount).forEach(([carrera, count]) => {
      estadisticasData.push([carrera, count, `${((count / practica.totalAsistencias) * 100).toFixed(1)}%`])
      row++
    })

    const estadisticasWS = XLSX.utils.aoa_to_sheet(estadisticasData)

    // Aplicar estilos a la hoja de estadísticas
    estadisticasWS["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Título
      { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, // Subtítulo
      { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }, // Resumen general
      { s: { r: 8, c: 0 }, e: { r: 8, c: 2 } }, // Distribución por carrera
    ]

    // Aplicar estilos a celdas específicas
    if (!estadisticasWS["!cols"]) estadisticasWS["!cols"] = []
    estadisticasWS["!cols"] = [
      { wch: 25 }, // A
      { wch: 15 }, // B
      { wch: 15 }, // C
    ]

    // Aplicar estilos a las celdas
    if (estadisticasWS) {
      // Aplicar estilos a las celdas
      applyStyle(estadisticasWS, "A1:C1", estilos.titulo)
      applyStyle(estadisticasWS, "A2:C2", estilos.subtitulo)
      applyStyle(estadisticasWS, "A4:C4", estilos.subtitulo)
      applyStyle(estadisticasWS, "A9:C9", estilos.subtitulo)

      // Estilos para etiquetas y valores
      for (let r = 5; r <= 7; r++) {
        applyStyle(estadisticasWS, `A${r}`, estilos.etiqueta)
        applyStyle(estadisticasWS, `B${r}`, estilos.valor)
      }

      // Estilos para la distribución por carrera
      for (let r = 10; r < 10 + Object.keys(carrerasCount).length; r++) {
        const estilo = r % 2 === 0 ? estilos.tablaFila : estilos.tablaFilaAlterna
        applyStyle(estadisticasWS, `A${r}:C${r}`, estilo)
      }
    }

    // Función auxiliar para aplicar estilos a un rango de celdas
    function applyStyle(ws: any, range: string, style: any) {
      if (!ws) return // Verificar que la hoja de trabajo no sea nula

      const [start, end] = range.split(":")
      const startCol = start.match(/[A-Z]+/)?.[0]
      const startRow = Number.parseInt(start.match(/\d+/)?.[0] || "0")
      const endCol = end ? end.match(/[A-Z]+/)?.[0] : startCol
      const endRow = end ? Number.parseInt(end.match(/\d+/)?.[0] || "0") : startRow

      if (!startCol || !endCol || startRow === 0 || endRow === 0) return

      for (let r = startRow; r <= endRow; r++) {
        for (let c = colToNum(startCol); c <= colToNum(endCol); c++) {
          const cellRef = `${numToCol(c)}${r}`
          if (!ws[cellRef]) ws[cellRef] = { v: "" }
          if (!ws[cellRef].s) ws[cellRef].s = {}
          ws[cellRef].s = { ...ws[cellRef].s, ...style }
        }
      }
    }

    // Funciones auxiliares para convertir entre letras de columna y números
    function colToNum(col: string): number {
      let num = 0
      for (let i = 0; i < col.length; i++) {
        num = num * 26 + col.charCodeAt(i) - 64
      }
      return num - 1
    }

    function numToCol(num: number): string {
      let col = ""
      num++
      while (num > 0) {
        const mod = (num - 1) % 26
        col = String.fromCharCode(65 + mod) + col
        num = Math.floor((num - mod) / 26)
      }
      return col
    }

    // Guardar el archivo con el nombre formateado
    const nombreMateria = practica.materia.replace(/\s+/g, "_").toLowerCase()
    const fechaFormateada = practica.fecha.replace(/\//g, "-")
    XLSX.writeFile(workbook, `practica_${nombreMateria}_${fechaFormateada}.xlsx`)

    await logAction(
      "Exportar Excel",
      `Se exportó a Excel la práctica ${practica.practica} de ${practica.materia} con formato mejorado`,
    )
  }

  const modoColor = esModoOscuro ? colors.dark : colors.light
  const colores = {
    claro: {
      textoPrincipal: "text-[#800040]",
      textoSecundario: "text-[#800040]/80",
      fondo: "bg-white",
      fondoEncabezado: "bg-gradient-to-r from-[#800040] to-[#a30050]",
    },
    oscuro: {
      textoPrincipal: "text-white",
      textoSecundario: "text-gray-300",
      fondo: "bg-[#2a2a2a]",
      fondoEncabezado: "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]",
    },
  }

  if (estaCargando) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className={esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}>
              <CardHeader className="pb-2">
                <Skeleton className={`h-5 w-32 ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-gray-200"}`} />
              </CardHeader>
              <CardContent>
                <Skeleton className={`h-8 w-16 ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-gray-200"}`} />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className={esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}>
          <CardHeader className="pb-2">
            <Skeleton className={`h-6 w-40 ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-gray-200"}`} />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton
                    key={i}
                    className={`h-10 flex-1 min-w-[200px] ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-gray-200"}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}>
          <CardHeader className="pb-2">
            <Skeleton className={`h-6 w-48 ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-gray-200"}`} />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className={`h-12 w-full ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-gray-200"}`} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Tarjeta 1: Clases Hoy */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader
            className={`pb-2 ${esModoOscuro ? colores.oscuro.fondoEncabezado : colores.claro.fondoEncabezado}`}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Total de Prácticas Hoy</CardTitle>
              <BookOpenCheck className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className={`text-4xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {practicasHoy.length}
              </div>
              <Badge className={`ml-2 ${esModoOscuro ? "bg-[#1d5631]" : "bg-[#800040]"} text-white`}>Hoy</Badge>
            </div>
            <p className={`text-sm mt-1 ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}>
              Prácticas registradas para hoy
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 2: Materias Hoy */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader
            className={`pb-2 ${esModoOscuro ? colores.oscuro.fondoEncabezado : colores.claro.fondoEncabezado}`}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Materias Hoy</CardTitle>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className={`text-4xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {new Set(practicasHoy.map((p) => p.materia)).size}
              </div>
              <div className="ml-3 flex flex-wrap gap-1">
                {Array.from(new Set(practicasHoy.map((p) => p.materia)))
                  .slice(0, 2)
                  .map((materia, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={`${esModoOscuro ? "border-[#2a7a45] text-[#2a7a45]" : "border-[#800040] text-[#800040]"}`}
                    >
                      {materia.length > 10 ? `${materia.substring(0, 10)}...` : materia}
                    </Badge>
                  ))}
                {new Set(practicasHoy.map((p) => p.materia)).size > 2 && (
                  <Badge
                    variant="outline"
                    className={`${esModoOscuro ? "border-[#2a7a45] text-[#2a7a45]" : "border-[#800040] text-[#800040]"}`}
                  >
                    +{new Set(practicasHoy.map((p) => p.materia)).size - 2}
                  </Badge>
                )}
              </div>
            </div>
            <p className={`text-sm mt-1 ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}>
              Materias con prácticas hoy
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 3: Estudiantes Hoy */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader
            className={`pb-2 ${esModoOscuro ? colores.oscuro.fondoEncabezado : colores.claro.fondoEncabezado}`}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Estudiantes Hoy</CardTitle>
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className={`text-4xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {practicasHoy.reduce((acc, curr) => acc + curr.totalAsistencias, 0)}
              </div>
              <div className="ml-3">
                <Badge className={`${esModoOscuro ? "bg-[#1d5631]/20 text-[#2a7a45]" : "bg-[#fff0f5] text-[#800040]"}`}>
                  <Laptop className="h-4 w-4 mr-1 inline-block" />
                  {practicasHoy.reduce((acc, curr) => {
                    const equipos = curr.estudiantes.filter((e) => e.Equipo !== "personal").length
                    return acc + equipos
                  }, 0)}{" "}
                  equipos
                </Badge>
              </div>
            </div>
            <p className={`text-sm mt-1 ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}>
              Estudiantes registrados hoy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
        <CardHeader
          className={`${esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground} border-none`}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-white">Filtros de Búsqueda</CardTitle>
              <CardDescription className="text-white/80">Filtra las prácticas por diferentes criterios</CardDescription>
            </div>
            <Filter className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtroMateria" className={`block mb-2 ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                <BookOpen className="inline-block w-4 h-4 mr-2" />
                Materia
              </Label>
              <div className="relative">
                <Input
                  id="filtroMateria"
                  type="text"
                  value={filtroMateria}
                  onChange={(e) => setFiltroMateria(e.target.value)}
                  placeholder="Ingrese la materia"
                  className={`w-full pl-9 ${esModoOscuro ? "bg-[#1d5631]/20 border-[#1d5631]/30 text-white" : "bg-[#fff0f5] border-[#800040]/30 text-[#800040]"} rounded-lg border-2 focus:ring-[#1d5631] focus:border-[#1d5631] transition-all duration-300`}
                />
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${esModoOscuro ? "text-gray-400" : modoColor.grayText}`}
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label
                htmlFor="filtroPractica"
                className={`block mb-2 ${esModoOscuro ? "text-white" : "text-[#800040]"}`}
              >
                <ClipboardList className="inline-block w-4 h-4 mr-2" />
                Práctica
              </Label>
              <div className="relative">
                <Input
                  id="filtroPractica"
                  type="text"
                  value={filtroPractica}
                  onChange={(e) => setFiltroPractica(e.target.value)}
                  placeholder="Ingrese la práctica"
                  className={`w-full pl-9 ${esModoOscuro ? "bg-[#1d5631]/20 border-[#1d5631]/30 text-white" : "bg-[#fff0f5] border-[#800040]/30 text-[#800040]"} rounded-lg border-2 focus:ring-[#1d5631] focus:border-[#1d5631] transition-all duration-300`}
                />
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${esModoOscuro ? "text-gray-400" : modoColor.grayText}`}
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label
                htmlFor="filtroProfesor"
                className={`block mb-2 ${esModoOscuro ? "text-white" : "text-[#800040]"}`}
              >
                <User className="inline-block w-4 h-4 mr-2" />
                Docente
              </Label>
              <div className="relative">
                <Input
                  id="filtroProfesor"
                  type="text"
                  value={filtroProfesor}
                  onChange={(e) => setFiltroProfesor(e.target.value)}
                  placeholder="Ingrese el docente"
                  className={`w-full pl-9 ${esModoOscuro ? "bg-[#1d5631]/20 border-[#1d5631]/30 text-white" : "bg-[#fff0f5] border-[#800040]/30 text-[#800040]"} rounded-lg border-2 focus:ring-[#1d5631] focus:border-[#1d5631] transition-all duration-300`}
                />
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${esModoOscuro ? "text-gray-400" : modoColor.grayText}`}
                />
              </div>
            </div>
            <Button
              onClick={limpiarFiltros}
              className={`${esModoOscuro ? "bg-[#74726f] hover:bg-[#5a5856] text-white" : "bg-[#74726f] hover:bg-[#5a5856] text-white"} whitespace-nowrap transition-all duration-300`}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de prácticas */}
      <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/20" : "bg-white"}`}>
        <CardHeader
          className={`${esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground} border-none`}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-white">Prácticas del Día</CardTitle>
              <CardDescription className="text-white/80">
                {practicasFiltradas.length}{" "}
                {practicasFiltradas.length === 1 ? "práctica encontrada" : "prácticas encontradas"}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">
                <Clock className="inline-block w-4 h-4 mr-1" />
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-6">
              {practicasFiltradas.length > 0 ? (
                <Table>
                  <TableHeader className="sticky top-0 bg-inherit z-10">
                    <TableRow
                      className={esModoOscuro ? "border-gray-700 bg-[#1d5631]/30" : "border-gray-200 bg-[#fff0f5]"}
                    >
                      <TableHead className="font-semibold">Materia</TableHead>
                      <TableHead className="font-semibold">Práctica</TableHead>
                      <TableHead className="font-semibold">Hora</TableHead>
                      <TableHead className="font-semibold">Docente</TableHead>
                      <TableHead className="font-semibold text-center">Asistencias</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {practicasFiltradas.map((practica) => (
                        <motion.tr
                          key={practica.id}
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
                          <TableCell className={`font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                            <div className="flex items-center">
                              <BookOpen
                                className={`h-4 w-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                              />
                              {practica.materia}
                            </div>
                          </TableCell>
                          <TableCell className={esModoOscuro ? "text-gray-300" : "text-gray-700"}>
                            {practica.practica}
                          </TableCell>
                          <TableCell className={esModoOscuro ? "text-gray-300" : "text-gray-700"}>
                            <div className="flex items-center">
                              <Clock className={`h-4 w-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                              {practica.horaInicio || "N/A"}
                            </div>
                          </TableCell>
                          <TableCell className={esModoOscuro ? "text-gray-300" : "text-gray-700"}>
                            <div className="flex items-center">
                              <User className={`h-4 w-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                              {`${practica.maestroNombre} ${practica.maestroApellido}`}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={
                                esModoOscuro ? "bg-[#1d5631]/20 text-[#2a7a45]" : "bg-[#fff0f5] text-[#800040]"
                              }
                            >
                              {practica.totalAsistencias}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => seleccionarPractica(practica)}
                                    className={
                                      esModoOscuro
                                        ? "hover:bg-[#1d5631]/40 text-white"
                                        : "hover:bg-[#fff0f5] text-[#800040]"
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalles</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => exportarAPDF(practica)}
                                    className={
                                      esModoOscuro
                                        ? "hover:bg-[#1d5631]/40 text-white"
                                        : "hover:bg-[#fff0f5] text-[#800040]"
                                    }
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Exportar a PDF</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => exportarAExcel(practica)}
                                    className={
                                      esModoOscuro
                                        ? "hover:bg-[#1d5631]/40 text-white"
                                        : "hover:bg-[#fff0f5] text-[#800040]"
                                    }
                                  >
                                    <FileDown className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Exportar a Excel</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              ) : (
                <div
                  className={`flex flex-col items-center justify-center py-12 ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}
                >
                  <ClipboardList className="h-12 w-12 mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-1">No hay prácticas disponibles</h3>
                  <p className="text-sm">No se encontraron prácticas que coincidan con los filtros aplicados.</p>
                  <Button
                    onClick={limpiarFiltros}
                    className={`mt-4 ${esModoOscuro ? "bg-[#74726f] hover:bg-[#5a5856]" : "bg-[#74726f] hover:bg-[#5a5856]"} text-white`}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Limpiar Filtros
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent
          className={`max-w-4xl ${esModoOscuro ? "bg-[#1d5631]/20 text-white" : "bg-white text-[#800040]"} border-none shadow-xl`}
        >
          <DialogHeader
            className={`${esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground} -mx-6 -mt-6 px-6 py-4 rounded-t-lg`}
          >
            <DialogTitle className="text-xl font-bold text-white flex items-center">
              <ClipboardList className="h-5 w-5 mr-2" />
              Detalles de la Práctica
            </DialogTitle>
            <Button
              onClick={() => setModalAbierto(false)}
              variant="ghost"
              className="absolute right-4 top-4 text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {practicaSeleccionada && (
            <div className="pt-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList
                  className={`grid w-full grid-cols-2 mb-6 p-1 ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-[#fff0f5]"} rounded-lg`}
                >
                  <TabsTrigger
                    value="detalles"
                    className={`text-sm py-2 rounded-md transition-all duration-300 ${
                      esModoOscuro
                        ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                        : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Información General
                  </TabsTrigger>
                  <TabsTrigger
                    value="estudiantes"
                    className={`text-sm py-2 rounded-md transition-all duration-300 ${
                      esModoOscuro
                        ? "data-[state=active]:bg-[#1d5631] data-[state=active]:text-white"
                        : "data-[state=active]:bg-[#800040] data-[state=active]:text-white"
                    }`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Lista de Estudiantes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="detalles" className="space-y-4">
                  <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-[#fff0f5]"}`}>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <BookOpen
                              className={`h-5 w-5 mt-0.5 mr-3 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                            />
                            <div>
                              <h3
                                className={`text-sm font-medium ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}
                              >
                                Materia
                              </h3>
                              <p className="text-lg font-semibold">{practicaSeleccionada.materia}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <ClipboardList
                              className={`h-5 w-5 mt-0.5 mr-3 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                            />
                            <div>
                              <h3
                                className={`text-sm font-medium ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}
                              >
                                Práctica
                              </h3>
                              <p className="text-lg font-semibold">{practicaSeleccionada.practica}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <Calendar
                              className={`h-5 w-5 mt-0.5 mr-3 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                            />
                            <div>
                              <h3
                                className={`text-sm font-medium ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}
                              >
                                Fecha
                              </h3>
                              <p className="text-lg font-semibold">{practicaSeleccionada.fecha}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <Clock
                              className={`h-5 w-5 mt-0.5 mr-3 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                            />
                            <div>
                              <h3
                                className={`text-sm font-medium ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}
                              >
                                Hora
                              </h3>
                              <p className="text-lg font-semibold">
                                {practicaSeleccionada.horaInicio || "No registrada"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start">
                            <User
                              className={`h-5 w-5 mt-0.5 mr-3 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                            />
                            <div>
                              <h3
                                className={`text-sm font-medium ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}
                              >
                                Docente
                              </h3>
                              <p className="text-lg font-semibold">
                                {practicaSeleccionada.maestroNombre} {practicaSeleccionada.maestroApellido}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <School
                              className={`h-5 w-5 mt-0.5 mr-3 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                            />
                            <div>
                              <h3
                                className={`text-sm font-medium ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}
                              >
                                Carrera
                              </h3>
                              <p className="text-lg font-semibold">
                                {Array.from(new Set(practicaSeleccionada.estudiantes.map((e) => e.Carrera))).join(
                                  ", ",
                                ) || "No especificada"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <GraduationCap
                              className={`h-5 w-5 mt-0.5 mr-3 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                            />
                            <div>
                              <h3
                                className={`text-sm font-medium ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}
                              >
                                Grupo
                              </h3>
                              <p className="text-lg font-semibold">
                                {Array.from(new Set(practicaSeleccionada.estudiantes.map((e) => e.Grupo))).join(", ") ||
                                  "No especificado"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <Users
                              className={`h-5 w-5 mt-0.5 mr-3 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                            />
                            <div>
                              <h3
                                className={`text-sm font-medium ${esModoOscuro ? "text-gray-300" : modoColor.grayText}`}
                              >
                                Total Asistencias
                              </h3>
                              <p className="text-lg font-semibold">
                                {practicaSeleccionada.totalAsistencias} estudiantes
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="estudiantes">
                  <Card className={`border-none shadow-md ${esModoOscuro ? "bg-[#1d5631]/30" : "bg-[#fff0f5]"}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle
                          className={`text-lg font-semibold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}
                        >
                          Lista de Estudiantes
                        </CardTitle>
                        <Badge className={esModoOscuro ? "bg-[#1d5631] text-white" : "bg-[#800040] text-white"}>
                          {practicaSeleccionada.estudiantes.length} estudiantes
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[300px]">
                        <div className="p-4">
                          {practicaSeleccionada.estudiantes && practicaSeleccionada.estudiantes.length > 0 ? (
                            <Table>
                              <TableHeader className="sticky top-0 bg-inherit z-10">
                                <TableRow
                                  className={
                                    esModoOscuro ? "border-gray-700 bg-[#1d5631]/40" : "border-gray-200 bg-[#fff0f5]/80"
                                  }
                                >
                                  <TableHead className="font-semibold">#</TableHead>
                                  <TableHead className="font-semibold">ID</TableHead>
                                  <TableHead className="font-semibold">Nombre</TableHead>
                                  <TableHead className="font-semibold">Apellido</TableHead>
                                  <TableHead className="font-semibold">Carrera</TableHead>
                                  <TableHead className="font-semibold">Grupo</TableHead>
                                  <TableHead className="font-semibold">Equipo</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {practicaSeleccionada.estudiantes.map((estudiante, index) => (
                                  <TableRow
                                    key={estudiante.id || index}
                                    className={esModoOscuro ? "border-gray-700" : "border-gray-200"}
                                  >
                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                    <TableCell>{estudiante.id}</TableCell>
                                    <TableCell>{estudiante.Nombre}</TableCell>
                                    <TableCell>{estudiante.Apellido}</TableCell>
                                    <TableCell>{estudiante.Carrera}</TableCell>
                                    <TableCell>{estudiante.Grupo}</TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={`${
                                          estudiante.Equipo === "personal"
                                            ? esModoOscuro
                                              ? "border-[#800040] text-[#800040]"
                                              : "border-[#1d5631] text-[#1d5631]"
                                            : esModoOscuro
                                              ? "border-[#2a7a45] text-[#2a7a45]"
                                              : "border-[#800040] text-[#800040]"
                                        }`}
                                      >
                                        {estudiante.Equipo}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Users className={`h-12 w-12 mb-2 ${esModoOscuro ? "text-gray-500" : "text-gray-400"}`} />
                              <p className={`text-lg font-medium ${esModoOscuro ? "text-gray-300" : "text-gray-600"}`}>
                                No hay estudiantes registrados
                              </p>
                              <p className={`text-sm ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                                Esta práctica no tiene estudiantes registrados.
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6 flex justify-end space-x-2">
                <Button
                  onClick={() => exportarAExcel(practicaSeleccionada)}
                  className={`${esModoOscuro ? "bg-[#74726f] hover:bg-[#5a5856] text-white" : "bg-[#74726f] hover:bg-[#5a5856] text-white"}`}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar a Excel
                </Button>
                <Button
                  onClick={() => exportarAPDF(practicaSeleccionada)}
                  className={esModoOscuro ? colors.dark.buttonPrimary : colors.light.buttonPrimary}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar a PDF
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

