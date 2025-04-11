"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore"
import { db } from "../pages/panel-laboratorista"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  FileDown,
  X,
  FileText,
  Eye,
  Search,
  Filter,
  RefreshCw,
  BookOpen,
  ClipboardList,
  Calendar,
  User,
  School,
  GraduationCap,
  Users,
  Clock,
  Laptop,
} from "lucide-react"
import { format, parse, isValid } from "date-fns"
import { es } from "date-fns/locale"
import * as XLSX from "xlsx"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { motion, AnimatePresence } from "framer-motion"
import type { JSX } from "react/jsx-runtime"

interface Alumno {
  id: string
  nombre: string
  apellido: string
  equipo: string
  carrera: string
  semestre: string | number
  grupo: string
  turno: string
}

interface InfoClase {
  id: string
  alumnosIds: string[]
  fecha: Date
  maestroApellido: string
  maestroId: string
  maestroNombre: string
  materia: string
  practica: string
  totalAsistencias: number
  alumnos: Alumno[]
}

interface PracticaDetallada extends InfoClase {
  docente: {
    id: string
    nombre: string
    apellido: string
    email: string
    matricula: string
  } | null
}

interface VistaPracticasProps {
  esModoOscuro: boolean
  logAction: (action: string, details: string) => Promise<void>
}

// Modificar la definición de colores para incorporar el color gris de manera consistente
const colores = {
  claro: {
    primario: "#800040", // Guinda/vino como color principal en modo claro
    secundario: "#1d5631", // Verde oscuro como color secundario
    terciario: "#74726f", // Gris para elementos terciarios
    fondo: "#ffffff", // Blanco
    fondoTarjeta: "bg-white",
    fondoEncabezado: "bg-gradient-to-r from-[#800040] to-[#a30050]",
    textoTitulo: "text-[#800040]",
    textoDescripcion: "text-[#800040]/80",
    fondoHover: "hover:bg-[#fff0f5]",
    botonPrimario: "bg-[#800040] hover:bg-[#5c002e] text-white",
    botonSecundario: "bg-[#1d5631] hover:bg-[#153d23] text-white",
    botonTerciario: "bg-[#74726f] hover:bg-[#5a5956] text-white",
    fondoContador: "bg-[#fff0f5]",
    textoContador: "text-[#800040]",
    fondoInput: "bg-[#f8f8f8]",
    bordeInput: "border-[#800040]/30",
    textoInput: "text-[#800040]",
    fondoSwitch: "bg-[#800040]/20",
    toggleSwitch: "bg-white",
    badge: "bg-[#800040]",
    badgeOutline: "border-[#800040] text-[#800040]",
    badgeSecundario: "bg-[#800040]/20 text-[#800040]",
    textoGris: "text-[#74726f]",
    bordeGris: "border-[#74726f]",
    fondoGris: "bg-[#f0f0f0]",
  },
  oscuro: {
    primario: "#1d5631", // Verde oscuro como color principal en modo oscuro
    secundario: "#800040", // Guinda/vino como color secundario
    terciario: "#74726f", // Gris para elementos terciarios
    fondo: "#1a1a1a", // Negro/gris muy oscuro
    fondoTarjeta: "bg-[#2a2a2a]",
    fondoEncabezado: "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]",
    textoTitulo: "text-white",
    textoDescripcion: "text-gray-300",
    fondoHover: "hover:bg-[#3a3a3a]",
    botonPrimario: "bg-[#1d5631] hover:bg-[#153d23] text-white",
    botonSecundario: "bg-[#800040] hover:bg-[#5c002e] text-white",
    botonTerciario: "bg-[#74726f] hover:bg-[#5a5956] text-white",
    fondoContador: "bg-[#1d5631]/20",
    textoContador: "text-[#2a7a45]",
    fondoInput: "bg-[#3a3a3a]",
    bordeInput: "border-[#1d5631]/30",
    textoInput: "text-white",
    fondoSwitch: "bg-[#1d5631]/20",
    toggleSwitch: "bg-[#1d5631]",
    badge: "bg-[#1d5631]",
    badgeOutline: "border-[#1d5631] text-[#2a7a45]",
    badgeSecundario: "bg-[#1d5631]/20 text-[#1d5631]",
    textoGris: "text-[#a0a0a0]",
    bordeGris: "border-[#74726f]",
    fondoGris: "bg-[#3a3a3a]",
  },
}

export default function VistaPracticas({ esModoOscuro, logAction }: VistaPracticasProps): JSX.Element {
  const [todasLasPracticas, setTodasLasPracticas] = useState<InfoClase[]>([])
  const [practicasFiltradas, setPracticasFiltradas] = useState<InfoClase[]>([])
  const [practicaSeleccionada, setPracticaSeleccionada] = useState<PracticaDetallada | null>(null)
  const [filtroMateria, setFiltroMateria] = useState("")
  const [filtroPractica, setFiltroPractica] = useState("")
  const [filtroProfesor, setFiltroProfesor] = useState("")
  const [filtroFecha, setFiltroFecha] = useState("")
  const [modalAbierto, setModalAbierto] = useState(false)
  const [activeTab, setActiveTab] = useState("detalles")
  const [estaCargando, setEstaCargando] = useState(true)

  useEffect(() => {
    obtenerTodasLasPracticas()
  }, [])

  useEffect(() => {
    filtrarPracticas()
  }, [todasLasPracticas, filtroMateria, filtroPractica, filtroProfesor, filtroFecha])

  const obtenerTodasLasPracticas = async (): Promise<void> => {
    try {
      setEstaCargando(true)
      const refInfoClase = collection(db, "ClassInformation")
      const consultaInfoClase = query(refInfoClase, orderBy("fecha", "desc"))
      const snapshotInfoClase = await getDocs(consultaInfoClase)
      const datosInfoClase = snapshotInfoClase.docs.map((doc) => {
        const data = doc.data()
        let fecha: Date
        if (data.fecha instanceof Timestamp) {
          fecha = data.fecha.toDate()
        } else if (typeof data.fecha === "string") {
          const parsedDate = parse(data.fecha, "dd/MM/yyyy", new Date())
          fecha = isValid(parsedDate) ? parsedDate : new Date(data.fecha)
        } else {
          fecha = new Date(data.fecha)
        }
        return {
          id: doc.id,
          ...data,
          fecha,
          alumnos: data.alumnos || [],
        } as InfoClase
      })
      setTodasLasPracticas(datosInfoClase)
      setPracticasFiltradas(datosInfoClase)
      await logAction("Obtener Prácticas", `Se obtuvieron ${datosInfoClase.length} prácticas`)
      setEstaCargando(false)
    } catch (error) {
      console.error("Error al obtener todas las prácticas:", error)
      await logAction("Error", `Error al obtener todas las prácticas: ${error}`)
      setEstaCargando(false)
    }
  }

  const seleccionarPractica = async (practica: InfoClase): Promise<void> => {
    const practicaDetallada: PracticaDetallada = {
      ...practica,
      docente: null,
    }
    setPracticaSeleccionada(practicaDetallada)
    setModalAbierto(true)
    setActiveTab("detalles")
    await logAction("Ver Detalles", `Se visualizaron los detalles de la práctica ${practica.id}`)
  }

  const filtrarPracticas = (): void => {
    let filtradas = todasLasPracticas

    if (filtroMateria) {
      filtradas = filtradas.filter((practica) => practica.materia.toLowerCase().includes(filtroMateria.toLowerCase()))
    }

    if (filtroPractica) {
      filtradas = filtradas.filter((practica) => practica.practica.toLowerCase().includes(filtroPractica.toLowerCase()))
    }

    if (filtroProfesor) {
      filtradas = filtradas.filter((practica) =>
        `${practica.maestroNombre} ${practica.maestroApellido}`.toLowerCase().includes(filtroProfesor.toLowerCase()),
      )
    }

    if (filtroFecha) {
      filtradas = filtradas.filter((practica) => format(practica.fecha, "dd/MM/yyyy").includes(filtroFecha))
    }

    setPracticasFiltradas(filtradas)
  }

  const limpiarFiltros = async (): Promise<void> => {
    setFiltroMateria("")
    setFiltroPractica("")
    setFiltroProfesor("")
    setFiltroFecha("")
    await logAction("Limpiar Filtros", "Se limpiaron todos los filtros de búsqueda")
  }

  const exportarAPDF = async (practica: PracticaDetallada): Promise<void> => {
    const doc = new jsPDF()

    doc.addImage("/FondoItspp.png", "PNG", 10, 10, 30, 30)

    doc.setFontSize(16)
    doc.text("TALLER DE PROGRAMACION", doc.internal.pageSize.width / 2, 25, { align: "center" })
    doc.text("HOJA DE REGISTRO", doc.internal.pageSize.width / 2, 35, { align: "center" })

    doc.setFontSize(12)

    doc.text(`FECHA: ${formatearFecha(practica.fecha)}`, 14, 50)
    doc.text(`GRUPO: ${Array.from(new Set(practica.alumnos.map((a) => a.grupo))).join(", ")}`, 14, 60)
    doc.text(`TURNO: ${Array.from(new Set(practica.alumnos.map((a) => a.turno))).join(", ")}`, 14, 70)
    doc.text(`PRACTICA: ${practica.practica}`, 14, 80)
    doc.text(`MATERIA: ${practica.materia}`, 14, 90)

    // Right column
    doc.text(`HORA: ${new Date().toLocaleTimeString()}`, 120, 50)
    doc.text(`CARRERA: ${Array.from(new Set(practica.alumnos.map((a) => a.carrera))).join(", ")}`, 120, 60)
    doc.text(`SEMESTRE: ${Array.from(new Set(practica.alumnos.map((a) => a.semestre))).join(", ")}`, 120, 70)
    doc.text(`DOCENTE: ${practica.maestroNombre} ${practica.maestroApellido}`, 14, 100)

    // Table of students
    doc.autoTable({
      startY: 110,
      head: [["#", "NOMBRE ALUMNO", "NUM. PC"]],
      body: practica.alumnos.map((alumno, index) => [
        (index + 1).toString(),
        `${alumno.nombre} ${alumno.apellido}`,
        alumno.equipo || "",
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

    // Cambiar el nombre del archivo para incluir materia y fecha
    const nombreMateria = practica.materia.replace(/\s+/g, "_").toLowerCase()
    const fechaFormateada = formatearFecha(practica.fecha).replace(/\//g, "-")
    doc.save(`practica_${nombreMateria}_${fechaFormateada}.pdf`)

    await logAction("Exportar PDF", `Se exportó a PDF la práctica ${practica.practica} de ${practica.materia}`)
  }

  const exportarAExcel = async (practica: PracticaDetallada): Promise<void> => {
    const workbook = XLSX.utils.book_new()

    // Crear estilos para el documento
    const estilos = {
      titulo: {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
        fill: { fgColor: { rgb: "1BB827" } },
        alignment: { horizontal: "center", vertical: "center" },
      },
      subtitulo: {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12 },
        fill: { fgColor: { rgb: "1C4A3F" } },
        alignment: { horizontal: "center", vertical: "center" },
      },
      encabezado: {
        font: { bold: true, sz: 11 },
        fill: { fgColor: { rgb: "E6FFE9" } },
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
      valor: {
        font: { sz: 10 },
        alignment: { horizontal: "left" },
        border: { left: { style: "thin" } },
      },
      tablaHeader: {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 },
        fill: { fgColor: { rgb: "1BB827" } },
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
        fill: { fgColor: { rgb: "F0FFF4" } },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      },
    }

    // HOJA 1: RESUMEN DE LA PRÁCTICA
    const resumenData = [
      ["INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO"], // A1
      ["TALLER DE PROGRAMACIÓN - HOJA DE REGISTRO"], // A2
      [], // Fila vacía
      ["INFORMACIÓN DE LA PRÁCTICA"], // A4
      ["Materia:", practica.materia, "", "Fecha:", formatearFecha(practica.fecha)], // A5
      ["Práctica:", practica.practica, "", "Hora:", new Date().toLocaleTimeString() || "N/A"], // A6
      [
        "Docente:",
        `${practica.maestroNombre} ${practica.maestroApellido}`,
        "",
        "Total Asistencias:",
        practica.totalAsistencias.toString(),
      ], // A7
      [], // Fila vacía
      ["INFORMACIÓN DEL GRUPO"], // A9
      ["Carrera:", Array.from(new Set(practica.alumnos.map((e) => e.carrera))).join(", ") || "N/A"], // A10
      ["Grupo:", Array.from(new Set(practica.alumnos.map((e) => e.grupo))).join(", ") || "N/A"], // A11
      ["Semestre:", Array.from(new Set(practica.alumnos.map((e) => e.semestre))).join(", ") || "N/A"], // A12
      ["Turno:", Array.from(new Set(practica.alumnos.map((e) => e.turno))).join(", ") || "N/A"], // A13
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
      [`Materia: ${practica.materia} - Práctica: ${practica.practica} - Fecha: ${formatearFecha(practica.fecha)}`], // A2
      [], // Fila vacía
      headerRow, // A4
    ]

    // Agregar datos de estudiantes
    practica.alumnos.forEach((estudiante, index) => {
      asistenciaData.push([
        (index + 1).toString(),
        estudiante.id,
        estudiante.nombre,
        estudiante.apellido,
        estudiante.carrera,
        estudiante.grupo,
        (estudiante.semestre || "").toString(),
        estudiante.turno,
        estudiante.equipo,
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
      applyStyle(asistenciaWS, `C${ultimaFila}:E${ultimaFila}`, estilos.etiqueta)
      applyStyle(asistenciaWS, `F${ultimaFila}:I${ultimaFila}`, estilos.etiqueta)
    }

    XLSX.utils.book_append_sheet(workbook, asistenciaWS, "Lista de Asistencia")

    // HOJA 3: ESTADÍSTICAS
    const equiposPersonales = practica.alumnos.filter((e) => e.equipo === "personal").length
    const equiposLaboratorio = practica.alumnos.filter((e) => e.equipo !== "personal").length

    // Calcular distribución por carrera
    const carrerasCount: Record<string, number> = {}
    practica.alumnos.forEach((e) => {
      carrerasCount[e.carrera] = (carrerasCount[e.carrera] || 0) + 1
    })

    const estadisticasData = [
      ["ESTADÍSTICAS DE ASISTENCIA"], // A1
      [`Práctica: ${practica.practica} - Fecha: ${formatearFecha(practica.fecha)}`], // A2
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

      //  "A4:C4", estilos.subtitulo)
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

    XLSX.utils.book_append_sheet(workbook, estadisticasWS, "Estadísticas")

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
    const fechaFormateada = formatearFecha(practica.fecha).replace(/\//g, "-")
    XLSX.writeFile(workbook, `practica_${nombreMateria}_${fechaFormateada}.xlsx`)

    await logAction("Exportar Excel", `Se exportó a Excel la práctica ${practica.practica} de ${practica.materia}`)
  }

  const formatearFecha = (fecha: Date): string => {
    return format(fecha, "dd/MM/yyyy", { locale: es })
  }

  const modoColor = esModoOscuro ? colores.oscuro : colores.claro

  return (
    <div className="space-y-6">
      {/*  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Tarjeta 1: Total de Prácticas */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader
            className={`pb-2 ${esModoOscuro ? colores.oscuro.fondoEncabezado : colores.claro.fondoEncabezado}`}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Total de Prácticas</CardTitle>
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className={`text-4xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {todasLasPracticas.length}
              </div>
              <Badge className={`ml-2 ${esModoOscuro ? "bg-[#1d5631]" : "bg-[#800040]"} text-white`}>Total</Badge>
            </div>
            <p className={`text-sm mt-1 ${esModoOscuro ? "text-gray-300" : colores.claro.textoGris}`}>
              Prácticas registradas en el sistema
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 2: Materias Registradas */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader
            className={`pb-2 ${esModoOscuro ? colores.oscuro.fondoEncabezado : colores.claro.fondoEncabezado}`}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Materias Registradas</CardTitle>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className={`text-4xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {new Set(todasLasPracticas.map((p) => p.materia)).size}
              </div>
              <div className="ml-3 flex flex-wrap gap-1">
                {Array.from(new Set(todasLasPracticas.map((p) => p.materia)))
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
                {new Set(todasLasPracticas.map((p) => p.materia)).size > 2 && (
                  <Badge
                    variant="outline"
                    className={`${esModoOscuro ? "border-[#2a7a45] text-[#2a7a45]" : "border-[#800040] text-[#800040]"}`}
                  >
                    +{new Set(todasLasPracticas.map((p) => p.materia)).size - 2}
                  </Badge>
                )}
              </div>
            </div>
            <p className={`text-sm mt-1 ${esModoOscuro ? "text-gray-300" : colores.claro.textoGris}`}>
              Materias con prácticas registradas
            </p>
          </CardContent>
        </Card>

        {/* Tarjeta 3: Estudiantes Registrados */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader
            className={`pb-2 ${esModoOscuro ? colores.oscuro.fondoEncabezado : colores.claro.fondoEncabezado}`}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white">Estudiantes Registrados</CardTitle>
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className={`text-4xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                {todasLasPracticas.reduce((acc, curr) => acc + curr.totalAsistencias, 0)}
              </div>
              <div className="ml-3">
                <Badge className={`${esModoOscuro ? "bg-[#1d5631]/20 text-[#2a7a45]" : "bg-[#fff0f5] text-[#800040]"}`}>
                  <Laptop className="h-4 w-4 mr-1 inline-block" />
                  {todasLasPracticas.reduce((acc, curr) => {
                    const equipos = curr.alumnos.filter((e) => e.equipo !== "personal").length
                    return acc + equipos
                  }, 0)}{" "}
                  equipos
                </Badge>
              </div>
            </div>
            <p className={`text-sm mt-1 ${esModoOscuro ? "text-gray-300" : colores.claro.textoGris}`}>
              Total de estudiantes registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card
        className={`border-none shadow-md ${esModoOscuro ? colores.oscuro.fondoTarjeta : colores.claro.fondoTarjeta}`}
      >
        <CardHeader
          className={`${esModoOscuro ? colores.oscuro.fondoEncabezado : colores.claro.fondoEncabezado} border-none`}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-white">Filtros de Búsqueda</CardTitle>
              <CardDescription className="text-white/80">Filtra las prácticas por diferentes criterios</CardDescription>
            </div>
            <Filter className={`h-5 w-5 text-white`} />
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
                  className={`w-full pl-9 ${esModoOscuro ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white" : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"} rounded-lg border-2 focus:ring-[#1d5631] focus:border-[#1d5631] transition-all duration-300`}
                />
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}
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
                  className={`w-full pl-9 ${esModoOscuro ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white" : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"} rounded-lg border-2 focus:ring-[#1d5631] focus:border-[#1d5631] transition-all duration-300`}
                />
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}
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
                  className={`w-full pl-9 ${esModoOscuro ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white" : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"} rounded-lg border-2 focus:ring-[#1d5631] focus:border-[#1d5631] transition-all duration-300`}
                />
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtroFecha" className={`block mb-2 ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                <Calendar className="inline-block w-4 h-4 mr-2" />
                Fecha
              </Label>
              <div className="relative">
                <Input
                  id="filtroFecha"
                  type="text"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className={`w-full pl-9 ${esModoOscuro ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white" : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"} rounded-lg border-2 focus:ring-[#1d5631] focus:border-[#1d5631] transition-all duration-300`}
                />
                <Calendar
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}
                />
              </div>
            </div>
            <Button
              onClick={limpiarFiltros}
              className={`mt-4 ${esModoOscuro ? colores.oscuro.botonTerciario : colores.claro.botonTerciario} whitespace-nowrap transition-all duration-300`}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de prácticas */}
      <Card
        className={`border-none shadow-md ${esModoOscuro ? colores.oscuro.fondoTarjeta : colores.claro.fondoTarjeta}`}
      >
        <CardHeader
          className={`${esModoOscuro ? colores.oscuro.fondoEncabezado : colores.claro.fondoEncabezado} border-none`}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-white">Todas las Prácticas</CardTitle>
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
                      className={esModoOscuro ? "border-gray-700 bg-[#3a3a3a]" : "border-gray-200 bg-[#e8f5ed]"}
                    >
                      <TableHead className="font-semibold">Fecha</TableHead>
                      <TableHead className="font-semibold">Materia</TableHead>
                      <TableHead className="font-semibold">Práctica</TableHead>
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
                          className={`${esModoOscuro ? "hover:bg-[#3a3a3a] border-b border-gray-700" : "hover:bg-[#e8f5ed] border-b border-gray-200"}`}
                        >
                          <TableCell className={`font-medium ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                            <div className="flex items-center">
                              <Calendar
                                className={`h-4 w-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                              />
                              {formatearFecha(practica.fecha)}
                            </div>
                          </TableCell>
                          <TableCell className={esModoOscuro ? "text-gray-300" : "text-gray-700"}>
                            <div className="flex items-center">
                              <BookOpen
                                className={`h-4 w-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                              />
                              {practica.materia}
                            </div>
                          </TableCell>
                          <TableCell className={esModoOscuro ? "text-gray-300" : "text-gray-700"}>
                            <div className="flex items-center">
                              <ClipboardList
                                className={`h-4 w-4 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                              />
                              {practica.practica}
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
                              className={esModoOscuro ? colores.oscuro.badgeSecundario : colores.claro.badgeSecundario}
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
                                    className={`${esModoOscuro ? "hover:bg-[#3a3a3a] text-white" : "hover:bg-[#e8f5ed] text-[#800040]"}`}
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
                                    onClick={() => exportarAPDF(practica as PracticaDetallada)}
                                    className={`${esModoOscuro ? "hover:bg-[#3a3a3a] text-white" : "hover:bg-[#e8f5ed] text-[#800040]"}`}
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
                                    onClick={() => exportarAExcel(practica as PracticaDetallada)}
                                    className={`${esModoOscuro ? "hover:bg-[#3a3a3a] text-white" : "hover:bg-[#e8f5ed] text-[#800040]"}`}
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
                  className={`flex flex-col items-center justify-center py-12 ${esModoOscuro ? "text-gray-300" : colores.claro.textoGris}`}
                >
                  <ClipboardList className="h-12 w-12 mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-1">No hay prácticas disponibles</h3>
                  <p className="text-sm">No se encontraron prácticas que coincidan con los filtros aplicados.</p>
                  <Button
                    onClick={limpiarFiltros}
                    className={`mt-4 ${esModoOscuro ? colores.oscuro.botonTerciario : colores.claro.botonTerciario}`}
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
          className={`max-w-7xl p-0 overflow-hidden ${
            esModoOscuro ? "bg-[#1d5631]" : "bg-white"
          } border-none shadow-xl`}
        >
          <div
            className={`${esModoOscuro ? "bg-[#1d5631]" : "bg-[#800040]"} px-6 py-4 flex items-center justify-between`}
          >
            <DialogTitle className="text-xl font-bold text-white flex items-center">
              <ClipboardList className="h-5 w-5 mr-2" />
              Detalles de la Práctica
            </DialogTitle>
            <Button
              onClick={() => setModalAbierto(false)}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {practicaSeleccionada && (
            <div className="flex flex-col md:flex-row h-[650px]">
              {/* Sidebar de navegación */}
              <div className={`w-full md:w-64 ${esModoOscuro ? "bg-[#153d23]" : "bg-[#f0fff4]"} p-0`}>
                <div className="space-y-0">
                  <Button
                    variant={activeTab === "detalles" ? "default" : "ghost"}
                    onClick={() => setActiveTab("detalles")}
                    className={`w-full justify-start text-left rounded-none h-12 px-4 ${
                      activeTab === "detalles"
                        ? esModoOscuro
                          ? "bg-[#1d5631] text-white"
                          : "bg-[#800040] text-white"
                        : esModoOscuro
                          ? "text-white hover:bg-[#1d5631]/30"
                          : "text-[#800040] hover:bg-[#f0fff4]"
                    }`}
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Información General
                  </Button>
                  <Button
                    variant={activeTab === "estudiantes" ? "default" : "ghost"}
                    onClick={() => setActiveTab("estudiantes")}
                    className={`w-full justify-start text-left rounded-none h-12 px-4 ${
                      activeTab === "estudiantes"
                        ? esModoOscuro
                          ? "bg-[#1d5631] text-white"
                          : "bg-[#800040] text-white"
                        : esModoOscuro
                          ? "text-white hover:bg-[#1d5631]/30"
                          : "text-[#800040] hover:bg-[#f0fff4]"
                    }`}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Lista de Estudiantes
                  </Button>
                </div>
              </div>

              {/* Contenido principal */}
              <div className="flex-1 p-0">
                {activeTab === "detalles" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <BookOpen className={`h-5 w-5 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                          <h3 className={`text-sm font-medium ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                            Materia
                          </h3>
                        </div>
                        <p className={`text-xl font-semibold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          {practicaSeleccionada.materia}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center mb-2">
                          <ClipboardList
                            className={`h-5 w-5 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                          />
                          <h3 className={`text-sm font-medium ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                            Práctica
                          </h3>
                        </div>
                        <p className={`text-xl font-semibold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          {practicaSeleccionada.practica}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center mb-2">
                          <Calendar className={`h-5 w-5 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                          <h3 className={`text-sm font-medium ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                            Fecha
                          </h3>
                        </div>
                        <p className={`text-xl font-semibold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          {formatearFecha(practicaSeleccionada.fecha)}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center mb-2">
                          <Clock className={`h-5 w-5 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                          <h3 className={`text-sm font-medium ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                            Hora
                          </h3>
                        </div>
                        <p className={`text-xl font-semibold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          {new Date().toLocaleTimeString() || "No registrada"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <User className={`h-5 w-5 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                          <h3 className={`text-sm font-medium ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                            Docente
                          </h3>
                        </div>
                        <p className={`text-xl font-semibold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          {practicaSeleccionada.maestroNombre} {practicaSeleccionada.maestroApellido}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center mb-2">
                          <School className={`h-5 w-5 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                          <h3 className={`text-sm font-medium ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                            Carrera
                          </h3>
                        </div>
                        <p className={`text-xl font-semibold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          {Array.from(new Set(practicaSeleccionada.alumnos.map((e) => e.carrera))).join(", ") ||
                            "No especificada"}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center mb-2">
                          <GraduationCap
                            className={`h-5 w-5 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`}
                          />
                          <h3 className={`text-sm font-medium ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                            Grupo
                          </h3>
                        </div>
                        <p className={`text-xl font-semibold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          {Array.from(new Set(practicaSeleccionada.alumnos.map((e) => e.grupo))).join(", ") ||
                            "No especificado"}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center mb-2">
                          <Users className={`h-5 w-5 mr-2 ${esModoOscuro ? "text-[#2a7a45]" : "text-[#800040]"}`} />
                          <h3 className={`text-sm font-medium ${esModoOscuro ? "text-gray-400" : "text-gray-500"}`}>
                            Total Asistencias
                          </h3>
                        </div>
                        <p className={`text-xl font-semibold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                          {practicaSeleccionada.totalAsistencias} estudiantes
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "estudiantes" && (
                  <div className="p-6 h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className={`text-2xl font-bold ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                        Lista de Estudiantes
                      </h2>
                      <Badge
                        className={`${
                          esModoOscuro ? "bg-[#1d5631]/20 text-[#2a7a45]" : "bg-[#fff0f5] text-[#800040]"
                        } px-3 py-1 text-sm rounded-full`}
                      >
                        {practicaSeleccionada.alumnos.length} estudiantes
                      </Badge>
                    </div>

                    {practicaSeleccionada.alumnos && practicaSeleccionada.alumnos.length > 0 ? (
                      <div
                        className={`overflow-x-auto max-h-[400px] ${esModoOscuro ? "border border-gray-700" : ""} rounded-lg`}
                      >
                        <table className="w-full border-collapse">
                          <thead className="sticky top-0 z-10">
                            <tr className={`${esModoOscuro ? "bg-[#153d23]" : "bg-[#800040]"} text-white`}>
                              <th className="py-3 px-4 font-semibold text-left" style={{ width: "5%" }}>
                                #
                              </th>
                              <th className="py-3 px-4 font-semibold text-left" style={{ width: "15%" }}>
                                ID
                              </th>
                              <th className="py-3 px-4 font-semibold text-left" style={{ width: "15%" }}>
                                Nombre
                              </th>
                              <th className="py-3 px-4 font-semibold text-left" style={{ width: "15%" }}>
                                Apellido
                              </th>
                              <th className="py-3 px-4 font-semibold text-left" style={{ width: "25%" }}>
                                Carrera
                              </th>
                              <th className="py-3 px-4 font-semibold text-left" style={{ width: "10%" }}>
                                Grupo
                              </th>
                              <th className="py-3 px-4 font-semibold text-left" style={{ width: "15%" }}>
                                Equipo
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {practicaSeleccionada.alumnos.map((estudiante, index) => (
                              <tr
                                key={estudiante.id || index}
                                className={
                                  esModoOscuro
                                    ? `${index % 2 === 0 ? "bg-[#1d5631]/80" : "bg-[#1d5631]/60"} border-b border-gray-700`
                                    : `${index % 2 === 0 ? "bg-white" : "bg-[#fff0f5]"} border-b border-gray-200`
                                }
                              >
                                <td className={`py-3 px-4 ${esModoOscuro ? "text-white" : "text-gray-700"}`}>
                                  {index + 1}
                                </td>
                                <td className={`py-3 px-4 ${esModoOscuro ? "text-white" : "text-gray-700"}`}>
                                  {estudiante.id}
                                </td>
                                <td className={`py-3 px-4 ${esModoOscuro ? "text-white" : "text-gray-700"}`}>
                                  {estudiante.nombre}
                                </td>
                                <td className={`py-3 px-4 ${esModoOscuro ? "text-white" : "text-gray-700"}`}>
                                  {estudiante.apellido}
                                </td>
                                <td className={`py-3 px-4 ${esModoOscuro ? "text-white" : "text-gray-700"}`}>
                                  {estudiante.carrera}
                                </td>
                                <td className={`py-3 px-4 ${esModoOscuro ? "text-white" : "text-gray-700"}`}>
                                  {estudiante.grupo}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium ${
                                      estudiante.equipo === "personal"
                                        ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                                        : esModoOscuro
                                          ? "bg-white text-[#1d5631] border border-white"
                                          : "bg-white text-[#800040] border border-[#800040]"
                                    }`}
                                  >
                                    {estudiante.equipo || "N/A"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div
                        className={`flex flex-col items-center justify-center py-12 ${
                          esModoOscuro ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        <Users className="h-12 w-12 mb-4 opacity-30" />
                        <h3 className="text-lg font-medium mb-1">No hay estudiantes registrados</h3>
                        <p className="text-sm">Esta práctica no tiene estudiantes asignados.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div
            className={`p-4 border-t ${esModoOscuro ? "border-gray-700" : "border-gray-200"} flex justify-end space-x-2`}
          >
            <Button
              onClick={() => exportarAExcel(practicaSeleccionada as PracticaDetallada)}
              className={`${esModoOscuro ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-500 hover:bg-gray-600"} text-white`}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar a Excel
            </Button>
            <Button
              onClick={() => exportarAPDF(practicaSeleccionada as PracticaDetallada)}
              className={
                esModoOscuro
                  ? "bg-[#1d5631] hover:bg-[#153d23] text-white"
                  : "bg-[#800040] hover:bg-[#5c002e] text-white"
              }
            >
              <FileText className="mr-2 h-4 w-4" />
              Exportar a PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Estado de carga */}
      {estaCargando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className={`w-64 ${esModoOscuro ? colores.oscuro.fondoTarjeta : colores.claro.fondoTarjeta}`}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className={esModoOscuro ? "text-white" : "text-[#800040]"}>Cargando prácticas...</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

