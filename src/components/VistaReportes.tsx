'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../pages/panel-laboratorista'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, BookOpen, X, FileText, FileDown, Eye } from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { colors } from '../lib/constants'
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Alumno {
  id: string;
  Nombre: string;
  Apellido: string;
  Carrera: string;
  Semestre: string | number;
  Turno: string;
  Grupo: string;
  Equipo: string;
}

interface ReportData {
  id: string;
  practica: string;
  materia: string;
  fecha: string;
  horaInicio: string;
  estudiantes: Alumno[];
  maestro: {
    id: string;
    nombre: string;
    apellido: string;
  };
  totalAsistencias: number;
  alumnosIds: string[];
  maestroApellido: string;
  maestroId: string;
  maestroNombre: string;
}

export default function VistaReportes({ esModoOscuro }: { esModoOscuro: boolean }) {
  const [practicasHoy, setPracticasHoy] = useState<ReportData[]>([])
  const [practicasFiltradas, setPracticasFiltradas] = useState<ReportData[]>([])
  const [estaCargando, setEstaCargando] = useState(true)
  const [filtroMateria, setFiltroMateria] = useState('')
  const [filtroPractica, setFiltroPractica] = useState('')
  const [filtroProfesor, setFiltroProfesor] = useState('')
  const [practicaSeleccionada, setPracticaSeleccionada] = useState<ReportData | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  useEffect(() => {
    obtenerPracticasHoy()
  }, [])

  useEffect(() => {
    filtrarPracticas()
  }, [practicasHoy, filtroMateria, filtroPractica, filtroProfesor])

  const obtenerPracticasHoy = async () => {
    try {
      const hoy = new Date()
      const fechaHoy = format(hoy, 'dd/MM/yyyy')

      const refInfoClase = collection(db, 'ClassInformation')
      const consultaInfoClase = query(
        refInfoClase,
        where('fecha', '==', fechaHoy),
        orderBy('fecha', 'asc')
      )
      const snapshotInfoClase = await getDocs(consultaInfoClase)
      const practicasDelDia = snapshotInfoClase.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          practica: data.practica,
          materia: data.materia,
          fecha: data.fecha,
          horaInicio: data.horaInicio,
          estudiantes: data.alumnos ? data.alumnos.map((alumno: any) => ({
            id: alumno.id || '',
            Nombre: alumno.Nombre || alumno.nombre || '',
            Apellido: alumno.Apellido || alumno.apellido || '',
            Carrera: alumno.Carrera || alumno.carrera || '',
            Semestre: alumno.Semestre || alumno.semestre || '',
            Turno: alumno.Turno || alumno.turno || '',
            Grupo: alumno.Grupo || alumno.grupo || '',
            Equipo: alumno.Equipo || alumno.equipo || ''
          })) : [],
          maestro: {
            id: data.maestroId,
            nombre: data.maestroNombre,
            apellido: data.maestroApellido
          },
          totalAsistencias: data.totalAsistencias,
          alumnosIds: data.alumnosIds,
          maestroApellido: data.maestroApellido,
          maestroId: data.maestroId,
          maestroNombre: data.maestroNombre
        } as ReportData
      })

      setPracticasHoy(practicasDelDia)
      setPracticasFiltradas(practicasDelDia)
      setEstaCargando(false)
    } catch (error) {
      console.error('Error al obtener prácticas del día:', error)
      setEstaCargando(false)
    }
  }

  const filtrarPracticas = () => {
    let filtradas = practicasHoy

    if (filtroMateria) {
      filtradas = filtradas.filter(practica => 
        practica.materia.toLowerCase().includes(filtroMateria.toLowerCase())
      )
    }

    if (filtroPractica) {
      filtradas = filtradas.filter(practica => 
        practica.practica.toLowerCase().includes(filtroPractica.toLowerCase())
      )
    }

    if (filtroProfesor) {
      filtradas = filtradas.filter(practica => 
        `${practica.maestro.nombre} ${practica.maestro.apellido}`.toLowerCase().includes(filtroProfesor.toLowerCase())
      )
    }

    setPracticasFiltradas(filtradas)
  }

  const limpiarFiltros = () => {
    setFiltroMateria('')
    setFiltroPractica('')
    setFiltroProfesor('')
  }

  const seleccionarPractica = (practica: ReportData) => {
    setPracticaSeleccionada(practica)
    setModalAbierto(true)
  }

  const exportarAPDF = (practica: ReportData) => {
    const doc = new jsPDF()
    
    // Add ITSPP header (you may want to add a logo image here)
    doc.setFontSize(16)
    doc.text("ITSPP", 14, 20)
    
    // Title
    doc.setFontSize(14)
    doc.text("TALLER DE PROGRAMACION", doc.internal.pageSize.width / 2, 20, { align: 'center' })
    doc.text("HOJA DE REGISTRO", doc.internal.pageSize.width / 2, 28, { align: 'center' })
    
    // Information fields
    doc.setFontSize(12)
    doc.text(`FECHA: ${practica.fecha}`, 14, 45)
    doc.text(`HORA: ${practica.horaInicio || ''}`, 120, 45)
    
    doc.text(`GRUPO: ${Array.from(new Set(practica.estudiantes.map(e => e.Grupo))).join(', ')}`, 14, 55)
    doc.text(`CARRERA: ${Array.from(new Set(practica.estudiantes.map(e => e.Carrera))).join(', ')}`, 120, 55)
    
    doc.text(`TURNO: ${Array.from(new Set(practica.estudiantes.map(e => e.Turno))).join(', ')}`, 14, 65)
    doc.text(`SEMESTRE: ${Array.from(new Set(practica.estudiantes.map(e => e.Semestre))).join(', ')}`, 120, 65)
    
    doc.text(`PRÁCTICA: ${practica.practica}`, 14, 75)
    
    doc.text(`MATERIA: ${practica.materia}`, 14, 85)
    doc.text(`DOCENTE: ${practica.maestroNombre} ${practica.maestroApellido}`, 14, 95)
    
    // Table of students
    doc.autoTable({
      startY: 105,
      head: [['#', 'NOMBRE ALUMNO', 'NUM. PC', 'FIRMA']],
      body: practica.estudiantes.map((estudiante, index) => [
        (index + 1).toString(),
        `${estudiante.Nombre} ${estudiante.Apellido}`,
        estudiante.Equipo,
        '' // Space for signature
      ]),
      theme: 'grid',
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 }
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
    
    doc.save(`practica_${practica.id}.pdf`)
  }

  const exportarAExcel = (practica: ReportData) => {
    const workbook = XLSX.utils.book_new()
    
    // Create header data
    const headerData = [
      ['TALLER DE PROGRAMACION'],
      ['HOJA DE REGISTRO'],
      [''],
      ['FECHA:', practica.fecha, 'HORA:', new Date().toLocaleTimeString()],
      ['GRUPO:', Array.from(new Set(practica.estudiantes.map(e => e.Grupo))).join(', '), 'CARRERA:', Array.from(new Set(practica.estudiantes.map(e => e.Carrera))).join(', ')],
      ['TURNO:', Array.from(new Set(practica.estudiantes.map(e => e.Turno))).join(', '), 'SEMESTRE:', Array.from(new Set(practica.estudiantes.map(e => e.Semestre))).join(', ')],
      ['PRÁCTICA:', practica.practica, 'NUM. PRÁCTICA:', practica.id],
      ['MATERIA:', practica.materia],
      ['DOCENTE:', `${practica.maestroNombre} ${practica.maestroApellido}`],
      [''],
      ['#', 'NOMBRE ALUMNO', 'NUM. PC', 'FIRMA'],
      ...practica.estudiantes.map((estudiante, index) => [
        index + 1,
        `${estudiante.Nombre} ${estudiante.Apellido}`,
        estudiante.Equipo,
        ''
      ]),
      [''],
      ['FIRMA DOCENTE:', '', 'FIRMA ENCARGADO LABORATORIO:', '']
    ]
    
    const worksheet = XLSX.utils.aoa_to_sheet(headerData)
    
    // Set column widths
    const wscols = [
      { wch: 5 },  // #
      { wch: 40 }, // Nombre
      { wch: 10 }, // PC
      { wch: 20 }  // Firma
    ]
    worksheet['!cols'] = wscols
    
    // Merge cells for title
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // TALLER DE PROGRAMACION
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }  // HOJA DE REGISTRO
    ]
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registro de Práctica')
    XLSX.writeFile(workbook, `practica_${practica.id}.xlsx`)
  }

  if (estaCargando) {
    return <div className="flex justify-center items-center h-screen">Cargando datos...</div>
  }

  const modoColor = esModoOscuro ? colors.dark : colors.light

  return (
    <div className="space-y-6">
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className={modoColor.cardBackground}>
          <CardHeader className={modoColor.headerBackground}>
            <CardTitle className={`text-sm font-medium ${modoColor.titleText}`}>Total de Prácticas Hoy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${modoColor.countText}`}>{practicasHoy.length}</div>
          </CardContent>
        </Card>
        <Card className={modoColor.cardBackground}>
          <CardHeader className={modoColor.headerBackground}>
            <CardTitle className={`text-sm font-medium ${modoColor.titleText}`}>Materias Hoy</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${modoColor.countText}`}>
              {new Set(practicasHoy.map(p => p.materia)).size}
            </div>
          </CardContent>
        </Card>
        <Card className={modoColor.cardBackground}>
          <CardHeader className={modoColor.headerBackground}>
            <CardTitle className={`text-sm font-medium ${modoColor.titleText}`}>Estudiantes Hoy</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${modoColor.countText}`}>
              {practicasHoy.reduce((acc, curr) => acc + curr.totalAsistencias, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className={modoColor.cardBackground}>
        <CardHeader className={modoColor.headerBackground}>
          <CardTitle className={`text-lg font-semibold ${modoColor.titleText}`}>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="filtroMateria" className={esModoOscuro ? 'text-gray-300' : 'text-green-700'}>
                Filtrar por Materia
              </Label>
              <Input
                id="filtroMateria"
                type="text"
                value={filtroMateria}
                onChange={(e) => setFiltroMateria(e.target.value)}
                placeholder="Ingrese la materia"
                className={`w-full ${modoColor.inputBackground} ${modoColor.inputBorder} ${modoColor.inputText}`}
              />
            </div>
            <div>
              <Label htmlFor="filtroPractica" className={esModoOscuro ? 'text-gray-300' : 'text-green-700'}>
                Filtrar por Práctica
              </Label>
              <Input
                id="filtroPractica"
                type="text"
                value={filtroPractica}
                onChange={(e) => setFiltroPractica(e.target.value)}
                placeholder="Ingrese la práctica"
                className={`w-full ${modoColor.inputBackground} ${modoColor.inputBorder} ${modoColor.inputText}`}
              />
            </div>
            <div>
              <Label htmlFor="filtroProfesor" className={esModoOscuro ? 'text-gray-300' : 'text-green-700'}>
                Filtrar por Docente
              </Label>
              <Input
                id="filtroProfesor"
                type="text"
                value={filtroProfesor}
                onChange={(e) => setFiltroProfesor(e.target.value)}
                placeholder="Ingrese el nombre del docente"
                className={`w-full ${modoColor.inputBackground} ${modoColor.inputBorder} ${modoColor.inputText}`}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={limpiarFiltros} variant="outline" className={`w-full ${modoColor.buttonBlue}`}>
                <X className="mr-2 h-4 w-4" /> Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de prácticas */}
      <Card className={modoColor.cardBackground}>
        <CardHeader className={modoColor.headerBackground}>
          <CardTitle className={`text-lg font-semibold ${modoColor.titleText}`}>Prácticas del Día</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Materia</TableHead>
                <TableHead>Práctica</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Total Asistencias</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {practicasFiltradas.map((practica) => (
                <TableRow key={practica.id}>
                  <TableCell>{practica.materia}</TableCell>
                  <TableCell>{practica.practica}</TableCell>
                  <TableCell>{practica.horaInicio || 'N/A'}</TableCell>
                  <TableCell>{`${practica.maestroNombre} ${practica.maestroApellido}`}</TableCell>
                  <TableCell>{practica.totalAsistencias}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => seleccionarPractica(practica)}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Ver detalles</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className={`max-w-4xl ${esModoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={esModoOscuro ? 'text-white' : 'text-black'}>Detalles de la Práctica</DialogTitle>
          </DialogHeader>
          {practicaSeleccionada && (
            <div className={`space-y-4 ${esModoOscuro ? 'text-white' : 'text-black'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Materia:</strong> {practicaSeleccionada.materia}</p>
                  <p><strong>Práctica:</strong> {practicaSeleccionada.practica}</p>
                  <p><strong>Fecha:</strong> {practicaSeleccionada.fecha}</p>
                  <p><strong>Hora:</strong> {practicaSeleccionada.horaInicio || 'N/A'}</p>
                  <p><strong>Grupo:</strong> {Array.from(new Set(practicaSeleccionada.estudiantes.map(e => e.Grupo))).join(', ')}</p>
                  <p><strong>Carrera:</strong> {Array.from(new Set(practicaSeleccionada.estudiantes.map(e => e.Carrera))).join(', ')}</p>
                  <p><strong>Turno:</strong> {Array.from(new Set(practicaSeleccionada.estudiantes.map(e => e.Turno))).join(', ')}</p>
                </div>
                <div>
                  <p><strong>Docente:</strong> {practicaSeleccionada.maestroNombre} {practicaSeleccionada.maestroApellido}</p>
                  <p><strong>Total Asistencias:</strong> {practicaSeleccionada.totalAsistencias}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Lista de Estudiantes</h3>
                {practicaSeleccionada.estudiantes && practicaSeleccionada.estudiantes.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Apellido</TableHead>
                        <TableHead>Carrera</TableHead>
                        <TableHead>Semestre</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Turno</TableHead>
                        <TableHead>Equipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {practicaSeleccionada.estudiantes.map((estudiante, index) => (
                        <TableRow key={estudiante.id || index}>
                          <TableCell>{estudiante.id}</TableCell>
                          <TableCell>{estudiante.Nombre}</TableCell>
                          <TableCell>{estudiante.Apellido}</TableCell>
                          <TableCell>{estudiante.Carrera}</TableCell>
                          <TableCell>{estudiante.Semestre}</TableCell>
                          <TableCell>{estudiante.Grupo}</TableCell>
                          <TableCell>{estudiante.Turno}</TableCell>
                          <TableCell>{estudiante.Equipo}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>No hay estudiantes registrados para esta práctica.</p>
                )}
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => exportarAExcel(practicaSeleccionada)} variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar a Excel
                </Button>
                <Button onClick={() => exportarAPDF(practicaSeleccionada)} variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar a PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

