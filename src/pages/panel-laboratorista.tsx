'use client'

import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, Timestamp, query, where, updateDoc, orderBy } from 'firebase/firestore'
import { startOfDay, endOfDay } from 'date-fns'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Download, Filter, Moon, Sun, Calendar, X, BarChart2, Users, BookOpen, Laptop, AlertTriangle, Database, ClipboardList } from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import ScheduleDashboard from './schedule-dashboard'
import swal from 'sweetalert';

const firebaseConfig = {
  apiKey: "AIzaSyCX5WX8tTkWRsIikpV3-pTXIsYUXfF5Eqk",
  authDomain: "integrador-7b39d.firebaseapp.com",
  projectId: "integrador-7b39d",
  storageBucket: "integrador-7b39d.appspot.com",
  messagingSenderId: "780966021686",
  appId: "1:780966021686:web:485712fb7509339c6ae697",
  measurementId: "G-FGB03PFM7Z"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

interface Materia {
  id: string
  nombre: string
}

interface Maestro {
  id: string
  nombre: string
  apellido: string
}

interface Alumno {
  id: string;
  Nombre: string;
  Apellido: string;
  Carrera: string;
  Semestre: string | number;
  Turno: string;
}

interface ClassInfo {
  id: string;
  alumnosIds: string[];
  fecha: Timestamp;
  maestroApellido: string;
  maestroId: string;
  maestroNombre: string;
  materia: string;
  practica: string;
  totalAsistencias: number;
}

interface ReportData {
  id: string;
  practica: string;
  materia: string;
  fecha: Timestamp;
  estudiantes: Alumno[];
  maestro: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

interface ScheduleEntry {
  id: string
  materiaId: string
  dia: string
  hora: string
  maestroId: string
}

export default function LabTechnicianDashboard() {
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [filteredData, setFilteredData] = useState<ReportData[]>([])
  const [allPractices, setAllPractices] = useState<ClassInfo[]>([])
  const [filteredAllPractices, setFilteredAllPractices] = useState<ClassInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [practiceFilter, setPracticeFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [materias, setMaterias] = useState<Materia[]>([])
  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [selectedPractice, setSelectedPractice] = useState<ReportData | null>(null)
  const [isScheduleCreatorOpen, setIsScheduleCreatorOpen] = useState(false)
  const [weekSchedule, setWeekSchedule] = useState<ScheduleEntry[]>([])
  const [isLoadingMaterias, setIsLoadingMaterias] = useState(true)
  const [isLoadingMaestros, setIsLoadingMaestros] = useState(true)
  const [currentView, setCurrentView] = useState<'report' | 'schedule' | 'equipos' | 'allPractices'>('report')
  const [equipos, setEquipos] = useState<{ id: string; fueraDeServicio: boolean }[]>([])
  const [cantidadEquipos, setCantidadEquipos] = useState('')

  useEffect(() => {
    fetchReportData()
    fetchAllPractices()
    fetchMaterias()
    fetchMaestros()
    fetchWeekSchedule()
    cargarEquipos()
  }, [])

  useEffect(() => {
    filterData()
  }, [reportData, dateFilter, subjectFilter, practiceFilter, teacherFilter])

  useEffect(() => {
    filterAllPractices()
  }, [allPractices, dateFilter, subjectFilter, practiceFilter, teacherFilter])

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const fetchReportData = async () => {
    try {
      const classInfoRef = collection(db, 'ClassInformation')
      const today = startOfDay(new Date())
      const classInfoQuery = query(
        classInfoRef,
        where('fecha', '>=', today),
        where('fecha', '<', new Date(today.getTime() + 24 * 60 * 60 * 1000)),
        orderBy('fecha', 'desc')
      )
      const classInfoSnapshot = await getDocs(classInfoQuery)
      const classInfoData = classInfoSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClassInfo[]

      const reportDataPromises = classInfoData.map(async (classInfo) => {
        const studentInfoPromises = classInfo.alumnosIds.map(async (studentId) => {
          const studentDoc = await getDoc(doc(db, 'Alumnos', studentId))
          if (studentDoc.exists()) {
            return { 
              id: studentId,
              ...studentDoc.data() 
            } as Alumno
          }
          return null
        })

        const maestroDoc = await getDoc(doc(db, 'Docentes', classInfo.maestroId))
        const maestroData = maestroDoc.exists() ? maestroDoc.data() : null

        const estudiantes = (await Promise.all(studentInfoPromises)).filter((student): student is Alumno => student !== null)

        return {
          id: classInfo.id,
          practica: classInfo.practica,
          materia: classInfo.materia,
          fecha: classInfo.fecha,
          estudiantes,
          maestro: {
            id: classInfo.maestroId,
            nombre: maestroData?.Nombre || '',
            apellido: maestroData?.Apellido || ''
          }
        }
      })

      const reportData = await Promise.all(reportDataPromises)
      setReportData(reportData)
      setFilteredData(reportData)
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching report data:', error)
      setIsLoading(false)
    }
  }

  const fetchAllPractices = async () => {
    try {
      const classInfoRef = collection(db, 'ClassInformation')
      const classInfoQuery = query(classInfoRef, orderBy('fecha', 'desc'))
      const classInfoSnapshot = await getDocs(classInfoQuery)
      const classInfoData = classInfoSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClassInfo[]
      setAllPractices(classInfoData)
      setFilteredAllPractices(classInfoData)
    } catch (error) {
      console.error('Error fetching all practices:', error)
    }
  }

  const fetchMaterias = async () => {
    setIsLoadingMaterias(true)
    try {
      const materiasRef = collection(db, 'Materias')
      const materiasSnapshot = await getDocs(materiasRef)
      const materiasList = materiasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Materia[]
      console.log('Fetched materias:', materiasList)
      setMaterias(materiasList)
    } catch (error) {
      console.error('Error fetching materias:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
    } finally {
      setIsLoadingMaterias(false)
    }
  }

  const fetchMaestros = async () => {
    setIsLoadingMaestros(true)
    try {
      const maestrosRef = collection(db, 'Maestros')
      const maestrosSnapshot = await getDocs(maestrosRef)
      const maestrosList = maestrosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Maestro[]
      console.log('Fetched maestros:', maestrosList)
      setMaestros(maestrosList)
    } catch (error) {
      console.error('Error fetching maestros:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
    } finally {
      setIsLoadingMaestros(false)
    }
  }

  const fetchWeekSchedule = async () => {
    try {
      const scheduleRef = collection(db, 'WeekSchedule')
      const scheduleSnapshot = await getDocs(scheduleRef)
      const scheduleData = scheduleSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ScheduleEntry[]
      setWeekSchedule(scheduleData)
    } catch (error) {
      console.error('Error fetching week schedule:', error)
    }
  }

  const filterData = () => {
    let filtered = reportData

    if (dateFilter) {
      const filterDate = startOfDay(new Date(dateFilter))
      filtered = filtered.filter(classInfo => {
        const classDate = startOfDay(classInfo.fecha.toDate())
        return classDate.getTime() === filterDate.getTime()
      })
    }

    if (subjectFilter) {
      filtered = filtered.filter(classInfo => 
        classInfo.materia.toLowerCase().includes(subjectFilter.toLowerCase())
      )
    }

    if (practiceFilter) {
      filtered = filtered.filter(classInfo => 
        classInfo.practica.toLowerCase().includes(practiceFilter.toLowerCase())
      )
    }

    if (teacherFilter) {
      filtered = filtered.filter(classInfo => 
        `${classInfo.maestro.nombre} ${classInfo.maestro.apellido}`.toLowerCase().includes(teacherFilter.toLowerCase())
      )
    }

    setFilteredData(filtered)
  }

  const filterAllPractices = () => {
    let filtered = allPractices

    if (dateFilter) {
      const filterDate = startOfDay(new Date(dateFilter))
      filtered = filtered.filter(classInfo => {
        const classDate = startOfDay(classInfo.fecha.toDate())
        return classDate.getTime() === filterDate.getTime()
      })
    }

    if (subjectFilter) {
      filtered = filtered.filter(classInfo => 
        classInfo.materia.toLowerCase().includes(subjectFilter.toLowerCase())
      )
    }

    if (practiceFilter) {
      filtered = filtered.filter(classInfo => 
        classInfo.practica.toLowerCase().includes(practiceFilter.toLowerCase())
      )
    }

    if (teacherFilter) {
      filtered = filtered.filter(classInfo => 
        `${classInfo.maestroNombre} ${classInfo.maestroApellido}`.toLowerCase().includes(teacherFilter.toLowerCase())
      )
    }

    setFilteredAllPractices(filtered)
  }

  const generateExcelReport = (data: ReportData[] = filteredData) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.flatMap(classInfo => 
        classInfo.estudiantes.map(student => ({
          Práctica: classInfo.practica,
          Materia: classInfo.materia,
          Fecha: classInfo.fecha.toDate().toLocaleDateString(),
          Docente: `${classInfo.maestro.nombre} ${classInfo.maestro.apellido}`,
          Nombre: student.Nombre,
          Apellido: student.Apellido,
          Semestre: student.Semestre,
          Carrera: student.Carrera,
          Turno: student.Turno
        }))
      )
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte de Clases")
    XLSX.writeFile(workbook, "reporte_clases.xlsx")
  }

  const generatePDFReport = (data: ReportData[] = filteredData) => {
    const doc = new jsPDF()
    
    data.forEach((classInfo, index) => {
      if (index > 0) {
        doc.addPage()
      }
      
      doc.setFontSize(18)
      doc.text(`Reporte de Clase: ${classInfo.materia}`, 14, 15)
      
      doc.setFontSize(12)
      doc.text(`Práctica: ${classInfo.practica}`, 14, 25)
      doc.text(`Fecha: ${classInfo.fecha.toDate().toLocaleDateString()}`, 14, 32)
      doc.text(`Docente: ${classInfo.maestro.nombre} ${classInfo.maestro.apellido}`, 14, 39)
      
      doc.autoTable({
        startY: 46,
        head: [['Nombre', 'Apellido', 'Semestre', 'Carrera']],
        body: classInfo.estudiantes.map(student => [
          student.Nombre,
          student.Apellido,
          student.Semestre,
          student.Carrera
        ]),
      })
    })
    
    doc.save("reporte_clases.pdf")
  }

  const generateWeekSchedule = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.text('Horario Semanal del Laboratorio', 14, 15)
    
    const tableData = weekSchedule.map(entry => [
      entry.dia,
      entry.hora,
      materias.find(m => m.id === entry.materiaId)?.nombre || 'N/A',
      (() => {
        const maestro = maestros.find(m => m.id === entry.maestroId)
        return maestro ? `${maestro.nombre} ${maestro.apellido}` : 'N/A'
      })()
    ])
    
    doc.autoTable({
      startY: 25,
      head: [['Día', 'Hora', 'Materia', 'Maestro']],
      body: tableData,
    })
    
    doc.save("horario_semanal.pdf")
  }

  const clearFilters = () => {
    setDateFilter('')
    setSubjectFilter('')
    setPracticeFilter('')
    setTeacherFilter('')
  }

  const cargarEquipos = async () => {
    try {
      const equiposDoc = await getDoc(doc(db, 'Numero de equipos', 'equipos'))
      if (equiposDoc.exists()) {
        const data = equiposDoc.data()
        setEquipos(Array.isArray(data.Equipos) ? data.Equipos : [])
      } else {
        setEquipos([])
      }
    } catch (error) {
      console.error('Error al cargar equipos:', error)
      setEquipos([])
    }
  }

  const toggleFueraDeServicio = async (id: string) => {
    try {
      const equiposActualizados = equipos.map(equipo => 
        equipo.id === id ? { ...equipo, fueraDeServicio: !equipo.fueraDeServicio } : equipo
      )
      await updateDoc(doc(db, 'Numero de equipos', 'equipos'), {
        Equipos: equiposActualizados
      })
      setEquipos(equiposActualizados)
      await swal({
        title: "¡Éxito!",
        text: `Estado del equipo ${id} actualizado`,
        icon: "success",
      })
    } catch (error) {
      console.error('Error al actualizar el equipo:', error)
      await swal({
        title: "Error",
        text: "Ha ocurrido un error al actualizar el equipo.",
        icon: "error",
      })
    }
  }

  const agregarEquipos = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const cantidad = parseInt(cantidadEquipos)
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error('Cantidad inválida')
      }
      const nuevosEquipos = Array.from({ length: cantidad }, (_, i) => ({
        id: (i + 1).toString(),
        fueraDeServicio: false
      }))
      await setDoc(doc(db, 'Numero de equipos', 'equipos'), { Equipos: nuevosEquipos })
      setEquipos(nuevosEquipos)
      setCantidadEquipos('')
      await swal({
        title: "¡Éxito!",
        text: `${cantidad} equipos agregados correctamente, reemplazando los anteriores`,
        icon: "success",
      })
    } catch (error) {
      console.error('Error al agregar equipos:', error)
      await swal({
        title: "Error",
        text: "Ha ocurrido un error al agregar los equipos.",
        icon: "error",
      })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando datos...</div>
  }

  return (
    <div className={`min-h-screen w-full ${isDarkMode ? 'dark bg-gray-900' : 'bg-green-50'}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-green-100'} p-6 hidden md:block`}>
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-green-800'}`}>Dashboard</h2>
          <nav>
            <Button
              variant="ghost"
              className={`w-full justify-start mb-4 text-lg font-semibold text-black ${currentView === 'report' ? 'bg-green-200 text-green-800' : ''}`}
              onClick={() => setCurrentView('report')}
            >
              <BarChart2 className="mr-2 h-5 w-5" /> Reportes
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start mb-4 text-lg font-semibold text-black ${currentView === 'allPractices' ? 'bg-green-200 text-green-800' : ''}`}
              onClick={() => setCurrentView('allPractices')}
            >
              <ClipboardList className="mr-2 h-5 w-5" /> Todas las Prácticas
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start mb-4 text-lg font-semibold text-black ${currentView === 'schedule' ? 'bg-green-200 text-green-800' : ''}`}
              onClick={() => setCurrentView('schedule')}
            >
              <Calendar className="mr-2 h-5 w-5" /> Horario
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start mb-4 text-lg font-semibold text-black ${currentView === 'equipos' ? 'bg-green-200 text-green-800' : ''}`}
              onClick={() => setCurrentView('equipos')}
            >
              <Laptop className="mr-2 h-5 w-5" /> Equipos
            </Button>
            {weekSchedule.length === 5 && (
              <Button
                variant="ghost"
                className="w-full justify-start mb-4 text-lg font-semibold text-black"
                onClick={generateWeekSchedule}
              >
                <Download className="mr-2 h-5 w-5" /> Generar Horario PDF
              </Button>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-green-100'} flex justify-between items-center`}>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-green-800'}`}>
              {currentView === 'report' ? 'Reporte de Clases' : 
               currentView === 'allPractices' ? 'Todas las Prácticas' :
               currentView === 'schedule' ? 'Horario Semanal' : 'Equipos'}
            </h1>
            <div className="flex items-center space-x-2">
              <Sun className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                aria-label="Toggle dark mode"
              />
              <Moon className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>
          </header>

          {/* Dashboard content */}
          <div className="p-6">
            {currentView === 'report' ? (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Clases</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{reportData.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Materias Únicas</CardTitle>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Set(reportData.map(d => d.materia)).size}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Estudiantes Totales</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {reportData.reduce((acc, curr) => acc + curr.estudiantes.length, 0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <Label htmlFor="dateFilter" className={isDarkMode ? 'text-gray-300' : 'text-green-700'}>
                          Filtrar por Fecha
                        </Label>
                        <Input
                          id="dateFilter"
                          type="date"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className={`w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-green-200'} focus:ring-green-500`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subjectFilter" className={isDarkMode ? 'text-gray-300' : 'text-green-700'}>
                          Filtrar por Materia
                        </Label>
                        <Input
                          id="subjectFilter"
                          type="text"
                          value={subjectFilter}
                          onChange={(e) => setSubjectFilter(e.target.value)}
                          placeholder="Ingrese la materia"
                          className={`w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-green-200'} focus:ring-green-500`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="practiceFilter" className={isDarkMode ? 'text-gray-300' : 'text-green-700'}>
                          Filtrar por Práctica
                        </Label>
                        <Input
                          id="practiceFilter"
                          type="text"
                          value={practiceFilter}
                          onChange={(e) => setPracticeFilter(e.target.value)}
                          placeholder="Ingrese la práctica"
                          className={`w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-green-200'} focus:ring-green-500`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="teacherFilter" className={isDarkMode ? 'text-gray-300' : 'text-green-700'}>
                          Filtrar por Docente
                        </Label>
                        <Input
                          id="teacherFilter"
                          type="text"
                          value={teacherFilter}
                          onChange={(e) => setTeacherFilter(e.target.value)}
                          placeholder="Ingrese el nombre del docente"
                          className={`w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-green-200'} focus:ring-green-500`}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={clearFilters} variant="outline" className="w-full">
                          <X className="mr-2 h-4 w-4" /> Limpiar Filtros
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Class reports */}
                {filteredData.map((classInfo, index) => (
                  <Card key={classInfo.id} className={`mt-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} shadow-sm`}>
                    <CardHeader className={isDarkMode ? 'bg-gray-700' : 'bg-green-50'}>
                      <CardTitle className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-green-800'}`}>
                        {classInfo.materia}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                        <p><strong className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Práctica:</strong> {classInfo.practica}</p>
                        <p><strong className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Fecha:</strong> {classInfo.fecha.toDate().toLocaleString()}</p>
                        <p><strong className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Docente:</strong> {classInfo.maestro.nombre} {classInfo.maestro.apellido}</p>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Nombre</TableHead>
                            <TableHead className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Apellido</TableHead>
                            <TableHead className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Semestre</TableHead>
                            <TableHead className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Carrera</TableHead>
                            <TableHead className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classInfo.estudiantes.map((student, studentIndex) => (
                            <TableRow key={studentIndex} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-green-50'}>
                              <TableCell>{student.Nombre}</TableCell>
                              <TableCell>{student.Apellido}</TableCell>
                              <TableCell>{student.Semestre}</TableCell>
                              <TableCell>{student.Carrera}</TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedPractice(classInfo)}>
                                      Ver Detalles
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Detalles de la Práctica</DialogTitle>
                                    </DialogHeader>
                                    {selectedPractice && (
                                      <div className="mt-4">
                                        <p><strong>Materia:</strong> {selectedPractice.materia}</p>
                                        <p><strong>Práctica:</strong> {selectedPractice.practica}</p>
                                        <p><strong>Fecha:</strong> {selectedPractice.fecha.toDate().toLocaleDateString()}</p>
                                        <p><strong>Docente:</strong> {selectedPractice.maestro.nombre} {selectedPractice.maestro.apellido}</p>
                                        <h3 className="mt-4 mb-2 font-bold">Estudiantes:</h3>
                                        <ul>
                                          {selectedPractice.estudiantes.map((student, index) => (
                                            <li key={index}>{student.Nombre} {student.Apellido} - {student.Carrera} ({student.Semestre})</li>
                                          ))}
                                        </ul>
                                        <div className="mt-4 space-x-2">
                                          <Button onClick={() => generateExcelReport([selectedPractice])}>
                                            Exportar a Excel
                                          </Button>
                                          <Button onClick={() => generatePDFReport([selectedPractice])}>
                                            Exportar a PDF
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : currentView === 'allPractices' ? (
              <div className="space-y-6">
                {/* Filters for All Practices */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div>
                        <Label htmlFor="dateFilter" className={isDarkMode ? 'text-gray-300' : 'text-green-700'}>
                          Filtrar por Fecha
                        </Label>
                        <Input
                          id="dateFilter"
                          type="date"
                          value={dateFilter}
                          onChange={(e) => setDateFilter(e.target.value)}
                          className={`w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-green-200'} focus:ring-green-500`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subjectFilter" className={isDarkMode ? 'text-gray-300' : 'text-green-700'}>
                          Filtrar por Materia
                        </Label>
                        <Input
                          id="subjectFilter"
                          type="text"
                          value={subjectFilter}
                          onChange={(e) => setSubjectFilter(e.target.value)}
                          placeholder="Ingrese la materia"
                          className={`w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-green-200'} focus:ring-green-500`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="practiceFilter" className={isDarkMode ? 'text-gray-300' : 'text-green-700'}>
                          Filtrar por Práctica
                        </Label>
                        <Input
                          id="practiceFilter"
                          type="text"
                          value={practiceFilter}
                          onChange={(e) => setPracticeFilter(e.target.value)}
                          placeholder="Ingrese la práctica"
                          className={`w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-green-200'} focus:ring-green-500`}
                        />
                      </div>
                      <div>
                        <Label htmlFor="teacherFilter" className={isDarkMode ? 'text-gray-300' : 'text-green-700'}>
                          Filtrar por Docente
                        </Label>
                        <Input
                          id="teacherFilter"
                          type="text"
                          value={teacherFilter}
                          onChange={(e) => setTeacherFilter(e.target.value)}
                          placeholder="Ingrese el nombre del docente"
                          className={`w-full ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-green-200'} focus:ring-green-500`}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={clearFilters} variant="outline" className="w-full">
                          <X className="mr-2 h-4 w-4" /> Limpiar Filtros
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* All Practices List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Todas las Prácticas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Fecha</TableHead>
                          <TableHead className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Materia</TableHead>
                          <TableHead className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Práctica</TableHead>
                          <TableHead className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Docente</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAllPractices.map((practice) => (
                          <TableRow key={practice.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-green-50'}>
                            <TableCell>{practice.fecha.toDate().toLocaleString()}</TableCell>
                            <TableCell>{practice.materia}</TableCell>
                            <TableCell>{practice.practica}</TableCell>
                            <TableCell>{`${practice.maestroNombre} ${practice.maestroApellido}`}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : currentView === 'schedule' ? (
              <ScheduleDashboard />
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Equipos en Servicio</CardTitle>
                      <Laptop className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{equipos.filter(e => !e.fueraDeServicio).length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Equipos Fuera de Servicio</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{equipos.filter(e => e.fueraDeServicio).length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Equipos</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{equipos.length}</div>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>Agregar Equipos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">
                        Ingrese la cantidad de equipos que desea agregar al inventario. Esta acción reemplazará la lista actual de equipos.
                      </p>
                      <form onSubmit={agregarEquipos} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="cantidadEquipos">Cantidad de Equipos</Label>
                          <Input
                            id="cantidadEquipos"
                            type="number"
                            value={cantidadEquipos}
                            onChange={(e) => setCantidadEquipos(e.target.value)}
                            required
                          />
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          <p>Recuerde:</p>
                          <ul className="list-disc list-inside">
                            <li>Los equipos se numerarán automáticamente</li>
                            <li>Todos los equipos nuevos se marcarán como "En Servicio"</li>
                          </ul>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full h-8 px-3 py-1 text-xs font-medium transition-all duration-200 transform hover:scale-105 active:scale-95" 
                          style={{ backgroundColor: 'green', color: 'white' }}
                        >
                          Agregar Equipos
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                  <Card className="md:col-span-1">
                    <CardHeader>
                      <CardTitle>Lista de Equipos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead style={{ color: 'black' }}>ID</TableHead>
                            <TableHead style={{ color: 'black' }}>Estado</TableHead>
                            <TableHead style={{ color: 'black' }}>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {equipos.map((equipo) => (
                            <TableRow key={equipo.id}>
                              <TableCell>{equipo.id}</TableCell>
                              <TableCell>{equipo.fueraDeServicio ? 'Fuera de Servicio' : 'En Servicio'}</TableCell>
                              <TableCell>
                                <Button
                                  onClick={() => toggleFueraDeServicio(equipo.id)}
                                  size="sm"
                                  variant={equipo.fueraDeServicio ? 'destructive' : 'default'}
                                >
                                  {equipo.fueraDeServicio ? 'Poner en Servicio' : 'Marcar Fuera de Servicio'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

