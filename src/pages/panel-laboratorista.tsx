'use client'

import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, Timestamp, query, where } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Download, Filter, Moon, Sun, Menu, Calendar, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from "jspdf"
import "jspdf-autotable"

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

interface ClassInfo {
  practica: string
  materia: string
  fecha: Timestamp
  alumnosIds: string[]
  maestroNombre: string
  maestroApellido: string
}

interface StudentInfo {
  Nombre: string
  Apellido: string
  Semestre: string
  Carrera: string
}

interface ReportData extends Omit<ClassInfo, 'alumnosIds'> {
  estudiantes: StudentInfo[]
}

interface ScheduleEntry {
  materia: string
  dia: string
  hora: string
  maestro: string
}

export default function LabTechnicianReportForm() {
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [filteredData, setFilteredData] = useState<ReportData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [practiceFilter, setPracticeFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [subjects, setSubjects] = useState<string[]>([])
  const [selectedPractice, setSelectedPractice] = useState<ReportData | null>(null)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [scheduleEntry, setScheduleEntry] = useState<ScheduleEntry>({
    materia: '',
    dia: '',
    hora: '',
    maestro: ''
  })
  const [weekSchedule, setWeekSchedule] = useState<ScheduleEntry[]>([])
  const [teachers, setTeachers] = useState<string[]>([])

  useEffect(() => {
    fetchReportData()
    fetchSubjects()
    fetchTeachers()
    fetchWeekSchedule()
  }, [])

  useEffect(() => {
    filterData()
  }, [reportData, dateFilter, subjectFilter, practiceFilter, teacherFilter])

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const fetchReportData = async () => {
    try {
      const classInfoRef = collection(db, 'ClassInformation')
      const classInfoSnapshot = await getDocs(classInfoRef)
      const classInfoData = classInfoSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as unknown as ClassInfo[]

      const reportDataPromises = classInfoData.map(async (classInfo) => {
        const studentInfoPromises = classInfo.alumnosIds.map(async (studentId) => {
          const studentDoc = await getDoc(doc(db, 'Alumnos', studentId))
          return studentDoc.data() as StudentInfo
        })

        const estudiantes = await Promise.all(studentInfoPromises)

        return {
          ...classInfo,
          estudiantes
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

  const fetchSubjects = async () => {
    try {
      const subjectsRef = collection(db, 'Materias')
      const subjectsSnapshot = await getDocs(subjectsRef)
      const subjectsList = subjectsSnapshot.docs.map(doc => doc.data().nombre)
      setSubjects(subjectsList)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const teachersRef = collection(db, 'Maestros')
      const teachersSnapshot = await getDocs(teachersRef)
      const teachersList = teachersSnapshot.docs.map(doc => `${doc.data().nombre} ${doc.data().apellido}`)
      setTeachers(teachersList)
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const fetchWeekSchedule = async () => {
    try {
      const scheduleRef = collection(db, 'WeekSchedule')
      const scheduleSnapshot = await getDocs(scheduleRef)
      const scheduleData = scheduleSnapshot.docs.map(doc => doc.data() as ScheduleEntry)
      setWeekSchedule(scheduleData)
    } catch (error) {
      console.error('Error fetching week schedule:', error)
    }
  }

  const filterData = () => {
    let filtered = reportData

    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      filtered = filtered.filter(classInfo => {
        const classDate = classInfo.fecha.toDate()
        return classDate.getDate() === filterDate.getDate() &&
               classDate.getMonth() === filterDate.getMonth() &&
               classDate.getFullYear() === filterDate.getFullYear()
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

    const groupedData = filtered.reduce((acc, classInfo) => {
      const date = classInfo.fecha.toDate().toDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(classInfo)
      return acc
    }, {} as Record<string, ReportData[]>)

    setFilteredData(Object.values(groupedData).flat())
  }

  const generateExcelReport = (data: ReportData[] = filteredData) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.flatMap(classInfo => 
        classInfo.estudiantes.map(student => ({
          Práctica: classInfo.practica,
          Materia: classInfo.materia,
          Fecha: classInfo.fecha.toDate().toLocaleDateString(),
          Docente: `${classInfo.maestroNombre} ${classInfo.maestroApellido}`,
          Nombre: student.Nombre,
          Apellido: student.Apellido,
          Semestre: student.Semestre,
          Carrera: student.Carrera
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
      doc.text(`Docente: ${classInfo.maestroNombre} ${classInfo.maestroApellido}`, 14, 39)
      
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

  const handleScheduleSubmit = async () => {
    try {
      const scheduleRef = collection(db, 'WeekSchedule')
      await setDoc(doc(scheduleRef), scheduleEntry)
      setWeekSchedule([...weekSchedule, scheduleEntry])
      setScheduleEntry({
        materia: '',
        dia: '',
        hora: '',
        maestro: ''
      })
      setIsScheduleModalOpen(false)
    } catch (error) {
      console.error('Error saving schedule entry:', error)
    }
  }

  const generateWeekSchedule = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(18)
    doc.text('Horario Semanal del Laboratorio', 14, 15)
    
    const tableData = weekSchedule.map(entry => [
      entry.dia,
      entry.hora,
      entry.materia,
      entry.maestro
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando datos...</div>
  }

  return (
    <div className={`min-h-screen w-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-green-50'}`}>
      <Card className="w-full h-full m-0 rounded-none">
        <CardHeader className={`${isDarkMode ? 'bg-gray-800' : 'bg-green-100'} flex justify-between items-center`}>
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="mr-2 flex items-center">
                  <Menu className="h-4 w-4 mr-2" />
                  <span>Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  <Button onClick={() => generateExcelReport()} className="w-full">
                    <FileText className="mr-2 h-4 w-4" /> Exportar a Excel
                  </Button>
                  <Button onClick={() => generatePDFReport()} className="w-full">
                    <Download className="mr-2 h-4 w-4" /> Exportar a PDF
                  </Button>
                  <Button onClick={() => setIsScheduleModalOpen(true)} className="w-full">
                    <Calendar className="mr-2 h-4 w-4" /> Crear Horario
                  </Button>
                  {weekSchedule.length === 5 && (
                    <Button onClick={generateWeekSchedule} className="w-full">
                      <Calendar className="mr-2 h-4 w-4" /> Generar Horario Semanal
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-green-800'}`}>
              Reporte de Clases
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Sun className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
            <Switch
              checked={isDarkMode}
              onCheckedChange={setIsDarkMode}
              aria-label="Toggle dark mode"
            />
            <Moon className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-gray-400'}`} />
          </div>
        </CardHeader>
        <CardContent className={`p-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <div className="space-y-6">
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

            {filteredData.map((classInfo, index) => (
              <Card key={index} className={`mt-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} shadow-sm`}>
                <CardHeader className={isDarkMode ? 'bg-gray-700' : 'bg-green-50'}>
                  <CardTitle className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-green-800'}`}>
                    {classInfo.materia}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    <p><strong className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Práctica:</strong> {classInfo.practica}</p>
                    <p><strong className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Fecha:</strong> {classInfo.fecha.toDate().toLocaleDateString()}</p>
                    <p><strong className={isDarkMode ? 'text-green-400' : 'text-green-700'}>Docente:</strong> {classInfo.maestroNombre} {classInfo.maestroApellido}</p>
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
                                    <p><strong>Docente:</strong> {selectedPractice.maestroNombre} {selectedPractice.maestroApellido}</p>
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
        </CardContent>
      </Card>

      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Horario de Uso del Laboratorio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Materia</Label>
              <Select onValueChange={(value) => setScheduleEntry({...scheduleEntry, materia: value})} value={scheduleEntry.materia}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Seleccionar materia" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject, index) => (
                    <SelectItem key={index} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="day">Día</Label>
              <Select onValueChange={(value) => setScheduleEntry({...scheduleEntry, dia: value})} value={scheduleEntry.dia}>
                <SelectTrigger id="day">
                  <SelectValue placeholder="Seleccionar día" />
                </SelectTrigger>
                <SelectContent>
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={scheduleEntry.hora}
                onChange={(e) => setScheduleEntry({...scheduleEntry, hora: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="teacher">Maestro</Label>
              <Select onValueChange={(value) => setScheduleEntry({...scheduleEntry, maestro: value})} value={scheduleEntry.maestro}>
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Seleccionar maestro" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher, index) => (
                    <SelectItem key={index} value={teacher}>{teacher}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleScheduleSubmit} className="w-full">
              Guardar Horario
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}