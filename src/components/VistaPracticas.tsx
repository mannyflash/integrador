'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../pages/panel-laboratorista'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileDown, X, FileText, Eye } from 'lucide-react'
import { colors } from '../lib/constants'
import { format, parse, isValid } from "date-fns"
import { es } from "date-fns/locale"
import * as XLSX from 'xlsx'
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import Image from 'next/image'

interface Alumno {
  id: string;
  nombre: string;
  apellido: string;
  equipo: string;
  carrera: string;
  semestre: string | number;
  grupo: string;
  turno: string;
}

interface InfoClase {
  id: string;
  alumnosIds: string[];
  fecha: Date;
  maestroApellido: string;
  maestroId: string;
  maestroNombre: string;
  materia: string;
  practica: string;
  totalAsistencias: number;
  alumnos: Alumno[];
}

interface PracticaDetallada extends InfoClase {
  docente: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    matricula: string;
  } | null;
}

interface VistaPracticasProps {
  esModoOscuro: boolean;
  logAction: (action: string, details: string) => Promise<void>;
}

export default function VistaPracticas({ esModoOscuro, logAction }: VistaPracticasProps): JSX.Element {
  const [todasLasPracticas, setTodasLasPracticas] = useState<InfoClase[]>([])
  const [practicasFiltradas, setPracticasFiltradas] = useState<InfoClase[]>([])
  const [practicaSeleccionada, setPracticaSeleccionada] = useState<PracticaDetallada | null>(null)
  const [filtroMateria, setFiltroMateria] = useState('')
  const [filtroPractica, setFiltroPractica] = useState('')
  const [filtroProfesor, setFiltroProfesor] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)

  useEffect(() => {
    obtenerTodasLasPracticas()
  }, [])

  useEffect(() => {
    filtrarPracticas()
  }, [todasLasPracticas, filtroMateria, filtroPractica, filtroProfesor, filtroFecha])

  const obtenerTodasLasPracticas = async (): Promise<void> => {
    try {
      const refInfoClase = collection(db, 'ClassInformation')
      const consultaInfoClase = query(refInfoClase, orderBy('fecha', 'desc'))
      const snapshotInfoClase = await getDocs(consultaInfoClase)
      const datosInfoClase = snapshotInfoClase.docs.map(doc => {
        const data = doc.data()
        let fecha: Date
        if (data.fecha instanceof Timestamp) {
          fecha = data.fecha.toDate()
        } else if (typeof data.fecha === 'string') {
          const parsedDate = parse(data.fecha, 'dd/MM/yyyy', new Date())
          fecha = isValid(parsedDate) ? parsedDate : new Date(data.fecha)
        } else {
          fecha = new Date(data.fecha)
        }
        return {
          id: doc.id,
          ...data,
          fecha,
          alumnos: data.alumnos || []
        } as InfoClase
      })
      setTodasLasPracticas(datosInfoClase)
      setPracticasFiltradas(datosInfoClase)
      await logAction('Obtener Prácticas', `Se obtuvieron ${datosInfoClase.length} prácticas`)
    } catch (error) {
      console.error('Error al obtener todas las prácticas:', error)
      await logAction('Error', `Error al obtener todas las prácticas: ${error}`)
    }
  }

  const seleccionarPractica = async (practica: InfoClase): Promise<void> => {
    const practicaDetallada: PracticaDetallada = {
      ...practica,
      docente: null
    }
    setPracticaSeleccionada(practicaDetallada)
    setModalAbierto(true)
    await logAction('Ver Detalles', `Se visualizaron los detalles de la práctica ${practica.id}`)
  }

  const filtrarPracticas = (): void => {
    let filtradas = todasLasPracticas

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
        `${practica.maestroNombre} ${practica.maestroApellido}`.toLowerCase().includes(filtroProfesor.toLowerCase())
      )
    }

    if (filtroFecha) {
      filtradas = filtradas.filter(practica => 
        format(practica.fecha, 'dd/MM/yyyy').includes(filtroFecha)
      )
    }

    setPracticasFiltradas(filtradas)
  }

  const limpiarFiltros = async (): Promise<void> => {
    setFiltroMateria('')
    setFiltroPractica('')
    setFiltroProfesor('')
    setFiltroFecha('')
    await logAction('Limpiar Filtros', 'Se limpiaron todos los filtros de búsqueda')
  }

  const exportarAPDF = async (practica: PracticaDetallada): Promise<void> => {
    const doc = new jsPDF()
    
    // Add logo to the top-left corner
  doc.addImage("/FondoItspp.png", "PNG", 10, 10, 30, 30)
    
    // Title
    doc.setFontSize(16)
    doc.text("TALLER DE PROGRAMACION", doc.internal.pageSize.width / 2, 25, { align: 'center' })
    doc.text("HOJA DE REGISTRO", doc.internal.pageSize.width / 2, 35, { align: 'center' })
    
    // Information fields in two columns
    doc.setFontSize(12)
    // Left column
    doc.text(`FECHA: ${formatearFecha(practica.fecha)}`, 14, 50)
    doc.text(`GRUPO: ${Array.from(new Set(practica.alumnos.map(a => a.grupo))).join(', ')}`, 14, 60)
    doc.text(`TURNO: ${Array.from(new Set(practica.alumnos.map(a => a.turno))).join(', ')}`, 14, 70)
    doc.text(`PRACTICA: ${practica.practica}`, 14, 80)
    doc.text(`MATERIA: ${practica.materia}`, 14, 90)
    
    // Right column
    doc.text(`HORA: ${new Date().toLocaleTimeString()}`, 120, 50)
    doc.text(`CARRERA: ${Array.from(new Set(practica.alumnos.map(a => a.carrera))).join(', ')}`, 120, 60)
    doc.text(`SEMESTRE: ${Array.from(new Set(practica.alumnos.map(a => a.semestre))).join(', ')}`, 120, 70)
    doc.text(`DOCENTE: ${practica.maestroNombre} ${practica.maestroApellido}`, 14, 100)
    
    // Table of students
    doc.autoTable({
      startY: 110,
      head: [['#', 'NOMBRE ALUMNO', 'NUM. PC', 'FIRMA']],
      body: practica.alumnos.map((alumno, index) => [
        (index + 1).toString(),
        `${alumno.nombre} ${alumno.apellido}`,
        alumno.equipo || '',
        '' // Space for signature
      ]),
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold',
        lineWidth: 0.5
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25 },
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
    await logAction('Exportar PDF', `Se exportó a PDF la práctica ${practica.id}`)
  }

  const exportarAExcel = async (practica: PracticaDetallada): Promise<void> => {
    const workbook = XLSX.utils.book_new()
    
    // Hoja de detalles de la práctica
    const detallesWorksheet = XLSX.utils.json_to_sheet([
      { 'Detalles de la Práctica': practica.materia },
      { 'Fecha': formatearFecha(practica.fecha) },
      { 'Práctica': practica.practica },
      { 'Materia': practica.materia },
      { 'Docente': `${practica.maestroNombre} ${practica.maestroApellido}` },
      { 'Total Asistencias': practica.totalAsistencias },
      { 'Grupo': Array.from(new Set(practica.alumnos.map(a => a.grupo))).join(', ') },
      { 'Carrera': Array.from(new Set(practica.alumnos.map(a => a.carrera))).join(', ') },
      { 'Turno': Array.from(new Set(practica.alumnos.map(a => a.turno))).join(', ') },
    ])
    XLSX.utils.book_append_sheet(workbook, detallesWorksheet, 'Detalles de Práctica')

    // Hoja de lista de asistencia
    const asistenciaWorksheet = XLSX.utils.json_to_sheet(practica.alumnos.map(alumno => ({
      ID: alumno.id,
      Nombre: alumno.nombre,
      Apellido: alumno.apellido,
      Carrera: alumno.carrera,
      Semestre: alumno.semestre,
      Grupo: alumno.grupo,
      Turno: alumno.turno,
      Equipo: alumno.equipo
    })))
    XLSX.utils.book_append_sheet(workbook, asistenciaWorksheet, 'Lista de Asistencia')

    XLSX.writeFile(workbook, `practica_${practica.id}.xlsx`)
    await logAction('Exportar Excel', `Se exportó a Excel la práctica ${practica.id}`)
  }

  const formatearFecha = (fecha: Date): string => {
    return format(fecha, 'dd/MM/yyyy', { locale: es })
  }

  const modoColor = esModoOscuro ? colors.dark : colors.light

  const DetallesPractica = ({ practica }: { practica: PracticaDetallada }): JSX.Element => (
    <div className={`space-y-6 ${esModoOscuro ? 'text-white' : 'text-black'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Información de la Clase</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Fecha:</span> {formatearFecha(practica.fecha)}</p>
            <p><span className="font-medium">Materia:</span> {practica.materia}</p>
            <p><span className="font-medium">Práctica:</span> {practica.practica}</p>
            <p><span className="font-medium">Total Asistencias:</span> {practica.totalAsistencias}</p>
            <p><span className="font-medium">Grupo:</span> {Array.from(new Set(practica.alumnos.map(a => a.grupo))).join(', ')}</p>
            <p><span className="font-medium">Carrera:</span> {Array.from(new Set(practica.alumnos.map(a => a.carrera))).join(', ')}</p>
            <p><span className="font-medium">Turno:</span> {Array.from(new Set(practica.alumnos.map(a => a.turno))).join(', ')}</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Información del Docente</h3>
          <div className="space-y-2">
            <p><span className="font-medium">ID:</span> {practica.maestroId}</p>
            <p><span className="font-medium">Nombre:</span> {practica.maestroNombre}</p>
            <p><span className="font-medium">Apellido:</span> {practica.maestroApellido}</p>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold mb-2">Lista de Asistencia</h3>
        {practica.alumnos && practica.alumnos.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={esModoOscuro ? 'bg-gray-800' : 'bg-gray-100'}>
                  <TableHead className={esModoOscuro ? 'text-white' : 'text-black'}>ID</TableHead>
                  <TableHead className={esModoOscuro ? 'text-white' : 'text-black'}>Nombre</TableHead>
                  <TableHead className={esModoOscuro ? 'text-white' : 'text-black'}>Apellido</TableHead>
                  <TableHead className={esModoOscuro ? 'text-white' : 'text-black'}>Carrera</TableHead>
                  <TableHead className={esModoOscuro ? 'text-white' : 'text-black'}>Semestre</TableHead>
                  <TableHead className={esModoOscuro ? 'text-white' : 'text-black'}>Grupo</TableHead>
                  <TableHead className={esModoOscuro ? 'text-white' : 'text-black'}>Turno</TableHead>
                  <TableHead className={esModoOscuro ? 'text-white' : 'text-black'}>Equipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {practica.alumnos.map((alumno) => (
                  <TableRow key={alumno.id} className={esModoOscuro ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'}>
                    <TableCell className={esModoOscuro ? 'text-white' : 'text-black'}>{alumno.id}</TableCell>
                    <TableCell className={esModoOscuro ? 'text-white' : 'text-black'}>{alumno.nombre}</TableCell>
                    <TableCell className={esModoOscuro ? 'text-white' : 'text-black'}>{alumno.apellido}</TableCell>
                    <TableCell className={esModoOscuro ? 'text-white' : 'text-black'}>{alumno.carrera}</TableCell>
                    <TableCell className={esModoOscuro ? 'text-white' : 'text-black'}>{alumno.semestre}</TableCell>
                    <TableCell className={esModoOscuro ? 'text-white' : 'text-black'}>{alumno.grupo}</TableCell>
                    <TableCell className={esModoOscuro ? 'text-white' : 'text-black'}>{alumno.turno}</TableCell>
                    <TableCell className={esModoOscuro ? 'text-white' : 'text-black'}>{alumno.equipo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>No hay información de alumnos disponible</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card className={modoColor.cardBackground}>
        <CardHeader className={modoColor.headerBackground}>
          <CardTitle className={`text-lg font-semibold ${modoColor.titleText}`}>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtroMateria" className={esModoOscuro ? 'text-gray-300' : 'text-green-700'}>
                Materia
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
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtroPractica" className={esModoOscuro ? 'text-gray-300' : 'text-green-700'}>
                Práctica
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
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtroProfesor" className={esModoOscuro ? 'text-gray-300' : 'text-green-700'}>
                Docente
              </Label>
              <Input
                id="filtroProfesor"
                type="text"
                value={filtroProfesor}
                onChange={(e) => setFiltroProfesor(e.target.value)}
                placeholder="Ingrese el docente"
                className={`w-full ${modoColor.inputBackground} ${modoColor.inputBorder} ${modoColor.inputText}`}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtroFecha" className={esModoOscuro ? 'text-gray-300' : 'text-green-700'}>
                Fecha
              </Label>
              <Input
                id="filtroFecha"
                type="text"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                placeholder="dd/mm/aaaa"
                className={`w-full ${modoColor.inputBackground} ${modoColor.inputBorder} ${modoColor.inputText}`}
              />
            </div>
            <Button onClick={limpiarFiltros} variant="outline" className={`${modoColor.buttonBlue} whitespace-nowrap`}>
              <X className="mr-2 h-4 w-4" /> Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={modoColor.cardBackground}>
        <CardHeader className={modoColor.headerBackground}>
          <CardTitle className={`text-lg font-semibold ${modoColor.titleText}`}>Todas las Prácticas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Materia</TableHead>
                <TableHead>Práctica</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Total Asistencias</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {practicasFiltradas.map((practica) => (
                <TableRow 
                  key={practica.id}
                  className={practicaSeleccionada?.id === practica.id ? 'bg-secondary/50' : ''}
                >
                  <TableCell>{formatearFecha(practica.fecha)}</TableCell>
                  <TableCell>{practica.materia}</TableCell>
                  <TableCell>{practica.practica}</TableCell>
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

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className={`max-w-4xl ${esModoOscuro ? 'bg-gray-800' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={esModoOscuro ? 'text-white' : 'text-black'}>Detalles de la Práctica</DialogTitle>
            <Button
              onClick={() => setModalAbierto(false)}
              variant="ghost"
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          {practicaSeleccionada && (
            <>
              <DetallesPractica practica={practicaSeleccionada} />
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  onClick={() => exportarAPDF(practicaSeleccionada)} 
                  variant="outline"
                  className={`${esModoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'} border border-gray-300`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar a PDF
                </Button>
                <Button 
                  onClick={() => exportarAExcel(practicaSeleccionada)} 
                  variant="outline"
                  className={`${esModoOscuro ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-800 hover:bg-gray-100'} border border-gray-300`}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar a Excel
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

