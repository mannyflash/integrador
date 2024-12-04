'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, onSnapshot, doc, deleteDoc, setDoc, getDocs, addDoc, where, serverTimestamp, writeBatch, getDoc } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Trash2, LogOut, X, FileUp, Plus, Moon, Sun } from 'lucide-react'
import swal from 'sweetalert'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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

interface Practica {
  id: string
  Titulo: string
  Descripcion: string
  Duracion: string
  fecha: string
}

interface Asistencia {
  id: string
  nombre: string
  apellido: string
  equipo: string
  alumnoId: string
}

interface Docente {
  Nombre: string
  Apellido: string
}

export default function ListaAsistencias() {
  const [asistencias, setAsistencias] = useState<Asistencia[]>([])
  const [contador, setContador] = useState(0)
  const [claseIniciada, setClaseIniciada] = useState(false)
  const [practicas, setPracticas] = useState<Practica[]>([])
  const [selectedPractica, setSelectedPractica] = useState<Practica | null>(null)
  const [maestroId, setMaestroId] = useState('')
  const [maestroInfo, setMaestroInfo] = useState<Docente | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const router = useRouter()
  const [showAddPracticaModal, setShowAddPracticaModal] = useState(false)
  const [newPractica, setNewPractica] = useState({
    Titulo: '',
    Descripcion: '',
    Duracion: '',
    fecha: ''
  })
  const [materias, setMaterias] = useState<{ id: string; nombre: string }[]>([])
  const [selectedMateriaId, setSelectedMateriaId] = useState('')

  useEffect(() => {
    const unsubscribeAsistencias = onSnapshot(
      query(collection(db, 'Asistencias')),
      (snapshot) => {
        const nuevosEstudiantes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Asistencia[]
        setAsistencias(nuevosEstudiantes)
        setContador(nuevosEstudiantes.length)
      }
    )

    const storedMaestroId = localStorage.getItem('maestroId')
    if (storedMaestroId) {
      setMaestroId(storedMaestroId)
      fetchMaterias(storedMaestroId)
      fetchMaestroInfo(storedMaestroId)
    } else {
      router.push('/')
    }

    return () => {
      unsubscribeAsistencias()
    }
  }, [router])

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const fetchMaterias = async (maestroId: string) => {
    try {
      const materiasSnapshot = await getDocs(query(collection(db, 'Materias'), where("MaestroID", "==", maestroId)))
      const materiasData = materiasSnapshot.docs.map(doc => ({
        id: doc.id,
        nombre: doc.data().NombreMateria
      }))
      setMaterias(materiasData)
    } catch (error) {
      await swal({
        title: "Error",
        text: "No se pudieron cargar las materias.",
        icon: "error",
      })
    }
  }

  const fetchMaestroInfo = async (maestroId: string) => {
    try {
      const maestroDoc = await getDoc(doc(db, 'Docentes', maestroId))
      if (maestroDoc.exists()) {
        const data = maestroDoc.data() as Docente
        setMaestroInfo(data)
      }
    } catch (error) {
      console.error('Error fetching maestro info:', error)
    }
  }

  const handleMateriaChange = (materiaId: string) => {
    setSelectedMateriaId(materiaId)
    fetchPracticas(materiaId)
  }

  const fetchPracticas = async (materiaId: string) => {
    try {
      const practicasSnapshot = await getDocs(collection(db, 'Materias', materiaId, 'Practicas'))
      const practicasData: Practica[] = practicasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Practica, 'id'>
      }))
      setPracticas(practicasData)
    } catch (error) {
      await swal({
        title: "Error",
        text: "No se pudieron cargar las practicas.",
        icon: "error",
      })
    }
  }

  const toggleClase = useCallback(async () => {
    if (!selectedPractica) {
      await swal({
        title: "Error",
        text: "Seleccione una practica antes de iniciar la clase.",
        icon: "error",
      })
      return
    }

    const nuevoEstado = !claseIniciada
    try {
      const estadoRef = doc(db, 'EstadoClase', 'actual')
      await setDoc(estadoRef, { 
        iniciada: nuevoEstado,
        practica: selectedPractica.id
      })
      
      if (!nuevoEstado) {
        const historicalRef = collection(db, 'HistoricalAttendance')
        await addDoc(historicalRef, {
          practica: selectedPractica.Titulo,
          materia: materias.find(m => m.id === selectedMateriaId)?.nombre,
          fecha: serverTimestamp(),
          asistencias: asistencias
        })

        const batch = writeBatch(db)
        asistencias.forEach((asistencia) => {
          const asistenciaRef = doc(db, 'Asistencias', asistencia.id)
          batch.delete(asistenciaRef)
        })
        await batch.commit()

        const classInfoRef = collection(db, 'ClassInformation')
        await addDoc(classInfoRef, {
          materia: materias.find(m => m.id === selectedMateriaId)?.nombre,
          practica: selectedPractica.Titulo,
          fecha: serverTimestamp(),
          totalAsistencias: asistencias.length,
          maestroId: maestroId,
          maestroNombre: maestroInfo?.Nombre,
          maestroApellido: maestroInfo?.Apellido,
          alumnosIds: asistencias.map(a => a.alumnoId)
        })

        setAsistencias([])
        setContador(0)
      }
      
      await swal({
        title: nuevoEstado ? "Clase iniciada" : "Clase finalizada",
        text: nuevoEstado ? `Los alumnos ahora pueden registrar su asistencia para la practica: ${selectedPractica.Titulo}.` : "Se ha cerrado el registro de asistencias y guardado el registro histórico y la información de la clase.",
        icon: "success",
      })
      setClaseIniciada(nuevoEstado)
    } catch (error) {
      console.error('Error al cambiar el estado de la clase:', error)
      await swal({
        title: "Error",
        text: "No se pudo cambiar el estado de la clase.",
        icon: "error",
      })
    }
  }, [claseIniciada, selectedPractica, asistencias, materias, selectedMateriaId, maestroId, maestroInfo])

  const eliminarAsistencia = useCallback(async (id: string) => {
    const willDelete = await swal({
      title: "¿Esta seguro?",
      text: "Esta accion no se puede deshacer.",
      icon: "warning",
      buttons: ["Cancelar", "Aceptar"],
      dangerMode: true,
    })

    if (willDelete) {
      try {
        await deleteDoc(doc(db, 'Asistencias', id))
        await swal("Registro eliminado con exito", { icon: "success" })
      } catch (error) {
        await swal("Error al eliminar el registro", { icon: "error" })
      }
    }
  }, [])

  const volverAlInicio = useCallback(async () => {
    const willRedirect = await swal({
      title: "Deseas regresar al inicio?",
      text: "Seras redirigido a la pagina de inicio de sesion.",
      icon: "info",
      buttons: ["Cancelar", "Aceptar"],
    })

    if (willRedirect) {
      localStorage.removeItem('maestroId')
      router.push('/')
    }
  }, [router])

  const openModal = (practica: Practica) => {
    setSelectedPractica(practica)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const exportarPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 10
    
    // Add background image
    doc.addImage('/Currículum Vitae Cv de Ventas Moderno Negro.jpg', 'JPEG', 0, 0, pageWidth, pageHeight)
    
    // Header
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255) // White text color
    doc.text('TALLER DE PROGRAMACION', pageWidth / 2, margin + 10, { align: 'center' })
    doc.setFontSize(14)
    doc.text('HOJA DE REGISTRO', pageWidth / 2, margin + 20, { align: 'center' })
    
    doc.setFontSize(10)
    const leftColX = margin
    const rightColX = pageWidth / 2 + margin
    const startY = margin + 30
    let currentY = startY

    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, leftColX, currentY)
    doc.text(`CARRERA: Ingenieria En Sistemas Computacionales`, rightColX, currentY)
    currentY += 10

    doc.text(`GRUPO: ${selectedPractica?.Titulo || ''}`, leftColX, currentY)
    doc.text(`SEMESTRE: ${selectedPractica?.Duracion || ''}`, rightColX, currentY)
    currentY += 10

    doc.text(`HORA: ${new Date().toLocaleTimeString()}`, leftColX, currentY)
    doc.text(`TURNO: `, rightColX, currentY)
    currentY += 10

    doc.text(`NOMBRE PRACTICA: ${selectedPractica?.Titulo || ''}`, leftColX, currentY)
    doc.text(`NUM. PRACTICA: `, rightColX, currentY)
    currentY += 10

    doc.text(`MATERIA: ${materias.find(m => m.id === selectedMateriaId)?.nombre || ''}`, leftColX, currentY)
    currentY += 10

    doc.text(`DOCENTE: ${maestroInfo ? `${maestroInfo.Nombre} ${maestroInfo.Apellido}` : ''}`, leftColX, currentY)
    currentY += 15

    // Table
    const tableHeaders = ['#', 'NOMBRE ALUMNO', 'NUM. PC', 'FIRMA']
    const tableData = asistencias.map((asistencia, index) => [
      index + 1,
      `${asistencia.nombre} ${asistencia.apellido}`,
      asistencia.equipo,
      ''  // Empty string for signature
    ])

    // Pad the table to always have 20 rows
    while (tableData.length < 20) {
      tableData.push([tableData.length + 1, '', '', ''])
    }

    const tableHeight = 20 * 10 // Estimate 10mm per row
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 1, textColor: [255, 255, 255] },
      headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20 },
        3: { cellWidth: 30 }
      }
    })

    // Signature lines
    const signatureY = currentY + tableHeight + 20
    doc.setDrawColor(255, 255, 255) // White line color
    doc.line(margin, signatureY, margin + 70, signatureY)
    doc.text('FIRMA DOCENTE', margin + 35, signatureY + 5, { align: 'center' })

    doc.line(pageWidth - margin - 70, signatureY, pageWidth - margin, signatureY)
    doc.text('FIRMA ENCARGADO LABORATORIO', pageWidth - margin - 35, signatureY + 5, { align: 'center' })

    doc.save('lista_asistencias.pdf')
  }

  const addPractica = async () => {
    if (!selectedMateriaId) {
      await swal({
        title: "Error",
        text: "Por favor, seleccione una materia antes de agregar una práctica.",
        icon: "error",
      })
      return
    }

    try {
      const practicasRef = collection(db, 'Materias', selectedMateriaId, 'Practicas')
      const newPracticaRef = await addDoc(practicasRef, newPractica)
      
      setNewPractica({
        Titulo: '',
        Descripcion: '',
        Duracion: '',
        fecha: ''
      })
      setShowAddPracticaModal(false)
      
      await swal({
        title: "Éxito",
        text: "La práctica ha sido agregada correctamente.",
        icon: "success",
      })
      
      fetchPracticas(selectedMateriaId)
    } catch (error) {
      await swal({
        title: "Error",
        text: "No se pudo agregar la práctica.",
        icon: "error",
      })
    }
  }

  return (
    <div className={`min-h-screen w-screen ${isDarkMode ? 'bg-gray-900' : 'bg-green-50'}`}>
      <Card className={`w-full h-full m-0 rounded-none flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <CardHeader className={`${isDarkMode ? 'bg-gray-700' : 'bg-green-100'} flex flex-col items-center justify-center text-center p-6`}>
          <CardTitle className={`text-4xl mb-2 ${isDarkMode ? 'text-white' : 'text-green-800'}`}>
            Asistencias en Tiempo Real
          </CardTitle>
          <CardDescription className={`text-2xl font-bold ${isDarkMode ? 'text-gray-300' : 'text-green-700'}`}>
            Docente: {maestroInfo ? `${maestroInfo.Nombre} ${maestroInfo.Apellido}` : 'Cargando...'}
          </CardDescription>
          <div className="flex items-center space-x-2 mt-4">
            <Sun className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
            <Switch
              checked={isDarkMode}
              onCheckedChange={setIsDarkMode}
              aria-label="Toggle dark mode"
            />
            <Moon className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-gray-400'}`} />
          </div>
        </CardHeader>
        <CardContent className={`flex-grow p-4 overflow-auto ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>Lista de Estudiantes</h2>
            <span className={`text-lg font-medium ${isDarkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'} py-1 px-3 rounded-full`}>
              Total: {contador}
            </span>
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <Label htmlFor="materia-select" className={isDarkMode ? 'text-gray-300' : 'text-green-700'}>Seleccionar Materia:</Label>
              <Select onValueChange={handleMateriaChange}>
                <SelectTrigger id="materia-select" className={isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-green-300'}>
                  <SelectValue placeholder="Seleccione una materia">
                    {selectedMateriaId
                      ? materias.find((materia) => materia.id === selectedMateriaId)?.nombre
                      : "Seleccione una materia"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {materias.map((materia) => (
                    <SelectItem key={materia.id} value={materia.id}>
                      {materia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="practica-select" className={isDarkMode ? 'text-gray-300' : 'text-green-700'}>Seleccionar Practica:</Label>
              <Select 
                onValueChange={(value) => {
                  const selected = practicas.find(p => p.id === value)
                  if (selected) openModal(selected)
                }}
              >
                <SelectTrigger id="practica-select" className={isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-green-300'}>
                  <SelectValue placeholder="Seleccione una practica" />
                </SelectTrigger>
                <SelectContent>
                  {practicas.map(practica => (
                    <SelectItem key={practica.id} value={practica.id}>
                      {practica.Titulo} - {practica.fecha}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}>
              <DialogHeader>
                <DialogTitle>{selectedPractica?.Titulo}</DialogTitle>
              </DialogHeader>
              <div className="mt-2">
                <p><strong>Descripción:</strong> {selectedPractica?.Descripcion}</p>
                <p><strong>Duración:</strong> {selectedPractica?.Duracion}</p>
                <p><strong>Fecha:</strong> {selectedPractica?.fecha}</p>
              </div>
              <Button onClick={closeModal} className={`mt-4 ${isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}>
                <X className="w-4 h-4 mr-2" />
                Cerrar
              </Button>
            </DialogContent>
          </Dialog>

          <div className="flex flex-wrap gap-2 justify-between mb-4">
            <Button 
              onClick={toggleClase} 
              className={`flex-grow ${claseIniciada ? 
                'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {claseIniciada ? 'Finalizar Clase' : 'Iniciar Clase'}
            </Button>

            <Button 
              onClick={() => setShowAddPracticaModal(true)} 
              className={`flex-grow ${isDarkMode ? 'bg-green-700 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Práctica
            </Button>

            <Button 
              onClick={exportarPDF} 
              className={`flex-grow ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <FileUp className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          <Table className="w-full">
            <TableHeader>
              <TableRow className={isDarkMode ? 'bg-gray-700' : 'bg-green-100'}>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Apellido</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>ID Alumno</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asistencias.map((asistencia, index) => (
                <TableRow key={asistencia.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-green-50'}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{asistencia.nombre}</TableCell>
                  <TableCell>{asistencia.apellido}</TableCell>
                  <TableCell>{asistencia.equipo}</TableCell>
                  <TableCell>{asistencia.alumnoId}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => eliminarAsistencia(asistencia.id)}
                      className="group relative flex h-14 w-14 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-red-800 bg-red-400 hover:bg-red-600"
                    >
                      <svg
                        viewBox="0 0 1.625 1.625"
                        className="absolute -top-7 fill-white delay-100 group-hover:top-6 group-hover:animate-[spin_1.4s] group-hover:duration-1000"
                        height="15"
                        width="15"
                      >
                        <path
                          d="M.471 1.024v-.52a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099h-.39c-.107 0-.195 0-.195-.195"
                        ></path>
                        <path
                          d="M1.219.601h-.163A.1.1 0 0 1 .959.504V.341A.033.033 0 0 0 .926.309h-.26a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099v-.39a.033.033 0 0 0-.032-.033"
                        ></path>
                        <path
                          d="m1.245.465-.15-.15a.02.02 0 0 0-.016-.006.023.023 0 0 0-.023.022v.108c0 .036.029.065.065.065h.107a.023.023 0 0 0 .023-.023.02.02 0 0 0-.007-.016"
                        ></path>
                      </svg>
                      <svg
                        width="16"
                        fill="none"
                        viewBox="0 0 39 7"
                        className="origin-right duration-500 group-hover:rotate-90"
                      >
                        <line stroke-width="4" stroke="white" y2="5" x2="39" y1="5"></line>
                        <line
                          stroke-width="3"
                          stroke="white"
                          y2="1.5"
                          x2="26.0357"
                          y1="1.5"
                          x1="12"
                        ></line>
                      </svg>
                      <svg width="16" fill="none" viewBox="0 0 33 39" className="">
                        <mask fill="white" id="path-1-inside-1_8_19">
                          <path
                            d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"
                          ></path>
                        </mask>
                        <path
                          mask="url(#path-1-inside-1_8_19)"
                          fill="white"
                          d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z"
                        ></path>
                        <path stroke-width="4" stroke="white" d="M12 6L12 29"></path>
                        <path stroke-width="4" stroke="white" d="M21 6V29"></path>
                      </svg>
                      <span className="sr-only">Eliminar</span>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button onClick={volverAlInicio} className={isDarkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'}>
            <LogOut className="w-4 h-4 mr-2" />
            Regresar
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showAddPracticaModal} onOpenChange={setShowAddPracticaModal}>
        <DialogContent className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}>
          <DialogHeader>
            <DialogTitle>Agregar Nueva Práctica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Título</Label>
              <Input
                id="titulo"
                value={newPractica.Titulo}
                onChange={(e) => setNewPractica({...newPractica, Titulo: e.target.value})}
                className={isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border-gray-300'}
              />
            </div>
            <div>
              <Label htmlFor="descripcion" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Descripción</Label>
              <Input
                id="descripcion"
                value={newPractica.Descripcion}
                onChange={(e) => setNewPractica({...newPractica, Descripcion: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="duracion" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Duración</Label>
              <Input
                id="duracion"
                value={newPractica.Duracion}
                onChange={(e) => setNewPractica({...newPractica, Duracion: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="fecha" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={newPractica.fecha}
                onChange={(e) => setNewPractica({...newPractica, fecha: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={() => setShowAddPracticaModal(false)} variant="outline">Cancelar</Button>
            <Button onClick={addPractica}>Agregar Práctica</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}