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
import { Trash2, LogOut, X, FileUp, Plus, Moon, Sun, User } from 'lucide-react'
import swal from 'sweetalert'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { motion, AnimatePresence } from 'framer-motion'
import { getTheme, setTheme, toggleTheme, applyTheme, Theme } from '../lib/theme'
import {AppSidebar} from '../components/AppSidebar'
import { SidebarProvider } from "@/components/ui/sidebar"
import { logAction } from '../lib/logging';
import * as XLSX from 'xlsx';
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
  AlumnoId: string
  Apellido: string
  Equipo: string
  Nombre: string
  Carrera: string
  Grupo: string
  Semestre: string
  Turno: string
  Fecha?: string
}
interface Docente {
  Nombre: string
  Apellido: string
}
const Loader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"
    >
      <div className="w-32 aspect-square rounded-full relative flex justify-center items-center animate-spin-slow z-40 bg-[conic-gradient(white_0deg,white_300deg,transparent_270deg,transparent_360deg)]">
        <div className="absolute w-[60%] aspect-square rounded-full z-[80] animate-spin-medium bg-[conic-gradient(white_0deg,white_270deg,transparent_180deg,transparent_360deg)]" />
        <div className="absolute w-3/4 aspect-square rounded-full z-[60] animate-spin-slow bg-[conic-gradient(#065f46_0deg,#065f46_180deg,transparent_180deg,transparent_360deg)]" />
        <div className="absolute w-[85%] aspect-square rounded-full z-[60] animate-spin-extra-slow bg-[conic-gradient(#34d399_0deg,#34d399_180deg,transparent_180deg,transparent_360deg)]" />
      </div>
    </motion.div>
  )
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
  const router = useRouter()
  const [materias, setMaterias] = useState<{ id: string; nombre: string }[]>([])
  const [selectedMateriaId, setSelectedMateriaId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setThemeState] = useState<Theme>(getTheme())
  const [horaInicio, setHoraInicio] = useState<string | null>(null);
  const [horaFin, setHoraFin] = useState<string | null>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const storedMaestroId = localStorage.getItem('maestroId')
      if (!storedMaestroId) {
        await swal({
          title: "Sesión expirada",
          text: "Por favor, inicie sesión nuevamente.",
          icon: "warning",
        })
        router.push('/')
        return
      }
      setMaestroId(storedMaestroId)
      fetchMaterias(storedMaestroId)
      fetchMaestroInfo(storedMaestroId)
      const unsubscribeAsistencias = onSnapshot(
        query(collection(db, 'Asistencias')),
        (snapshot) => {
          const nuevosEstudiantes = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Asistencia[]
          setAsistencias(nuevosEstudiantes)
          console.log('Asistencias actualizadas:', nuevosEstudiantes)
          setContador(nuevosEstudiantes.length)
        }
      )
      // Simulate loading time
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 1500)
      return () => {
        unsubscribeAsistencias()
        clearTimeout(timer)
      }
    }
    checkAuth()
  }, [router])
  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark')
    applyTheme(theme)
  }, [theme])
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
  const fetchPracticas = useCallback(async () => {
    if (selectedMateriaId) {
      try {
        const practicasSnapshot = await getDocs(collection(db, 'Materias', selectedMateriaId, 'Practicas'))
        const practicasData: Practica[] = practicasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Practica, 'id'>
        }))
        setPracticas(practicasData)
      } catch (error) {
        console.error('Error fetching practicas:', error)
        await swal({
          title: "Error",
          text: "No se pudieron cargar las practicas.",
          icon: "error",
        })
      }
    }
  }, [selectedMateriaId])
  useEffect(() => {
    if (selectedMateriaId) {
      fetchPracticas()
    }
  }, [selectedMateriaId, fetchPracticas])
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
    setSelectedPractica(null)
    setPracticas([])
  }
  const limpiarCampos = () => {
    setAsistencias([])
    setContador(0)
    setSelectedPractica(null)
    setSelectedMateriaId('')
    setPracticas([])
    setClaseIniciada(false)
    setHoraInicio(null)
    setHoraFin(null)
  }
  const toggleClase = useCallback(async () => {
    if (!selectedPractica) {
      await swal({
        title: "Error",
        text: "Seleccione una practica antes de iniciar la clase.",
        icon: "error",
      });
      return;
    }
    const nuevoEstado = !claseIniciada;
    const horaActual = new Date().toLocaleTimeString();
    try {
      const estadoRef = doc(db, 'EstadoClase', 'actual');
      await setDoc(estadoRef, { 
        iniciada: nuevoEstado,
        practica: selectedPractica.id,
        horaInicio: nuevoEstado ? horaActual : null,
        horaFin: nuevoEstado ? null : horaActual
      });
      if (nuevoEstado) {
        setHoraInicio(horaActual);
        await swal({
          title: "Clase iniciada",
          text: `Los alumnos ahora pueden registrar su asistencia para la practica: ${selectedPractica.Titulo}. Hora de inicio: ${horaActual}`,
          icon: "success",
        });
        await logAction('Iniciar Clase', `Clase iniciada para ${selectedPractica.Titulo} a las ${horaActual}`);
      } else {
        setHoraFin(horaActual);
        const historicalRef = collection(db, 'HistoricalAttendance');
        await addDoc(historicalRef, {
          practica: selectedPractica.Titulo,
          materia: materias.find(m => m.id === selectedMateriaId)?.nombre,
          fecha: serverTimestamp(),
          horaInicio: horaInicio,
          horaFin: horaActual,
          asistencias: asistencias
        });
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
          fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          totalAsistencias: asistencias.length,
          maestroId: maestroId,
          maestroNombre: maestroInfo?.Nombre,
          maestroApellido: maestroInfo?.Apellido,
          horaInicio: horaInicio,
          horaFin: horaActual,
          alumnos: asistencias.map(a => ({
            id: a.AlumnoId,
            nombre: a.Nombre,
            apellido: a.Apellido,
            equipo: a.Equipo,
            carrera: a.Carrera,
            grupo: a.Grupo,
            semestre: a.Semestre,
            turno: a.Turno
          }))
        })
        limpiarCampos()
        await swal({
          title: "Clase finalizada",
          text: `Se ha cerrado el registro de asistencias y guardado el registro histórico y la información de la clase. Hora de fin: ${horaActual}`,
          icon: "success",
        });
        await logAction('Finalizar Clase', `Clase finalizada para ${selectedPractica.Titulo} a las ${horaActual}. Total de asistencias: ${asistencias.length}`);
      }
      setClaseIniciada(nuevoEstado);
    } catch (error) {
      console.error('Error al cambiar el estado de la clase:', error);
      await swal({
        title: "Error",
        text: "No se pudo cambiar el estado de la clase.",
        icon: "error",
      });
      await logAction('Error', `Error al cambiar el estado de la clase: ${error}`);
    }
  }, [claseIniciada, selectedPractica, asistencias, horaInicio, limpiarCampos]);
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
        await logAction('Eliminar Asistencia', `Asistencia con ID ${id} eliminada`);
      } catch (error) {
        await swal("Error al eliminar el registro", { icon: "error" })
        await logAction('Error', `Error al eliminar asistencia con ID ${id}: ${error}`);
      }
    }
  }, [])
  const openModal = (practica: Practica) => {
    setSelectedPractica(practica)
    setShowModal(true)
  }
  const closeModal = () => {
    setShowModal(false)
  }
  const exportarPDF = async () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 10

    // Add ITSPP logo in the upper left corner
    doc.addImage('/FondoItspp.png', 'PNG', margin, margin, 25, 25)

    // Add header text centered
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0) // Black text color
    doc.text('TALLER DE PROGRAMACION', pageWidth / 2, margin + 10, { align: 'center' })
    doc.setFontSize(14)
    doc.text('HOJA DE REGISTRO', pageWidth / 2, margin + 20, { align: 'center' })

    // Form fields
    doc.setFontSize(10)
    const leftColX = margin
    const rightColX = pageWidth / 2 + margin
    let currentY = margin + 35

    // Left column
    doc.text(`FECHA: ${new Date().toLocaleDateString()}`, leftColX, currentY)
    doc.text(`GRUPO: ${asistencias[0]?.Grupo || ''}`, leftColX, currentY + 10)
    doc.text(`HORA: ${horaInicio || new Date().toLocaleTimeString()}`, leftColX, currentY + 20)
    doc.text(`MATERIA: ${materias.find(m => m.id === selectedMateriaId)?.nombre || ''}`, leftColX, currentY + 30)
    doc.text(`DOCENTE: ${maestroInfo ? `${maestroInfo.Nombre} ${maestroInfo.Apellido}` : ''}`, leftColX, currentY + 40)

    // Right column
    doc.text(`CARRERA: ${asistencias[0]?.Carrera || ''}`, rightColX, currentY)
    doc.text(`TURNO: ${asistencias[0]?.Turno || ''}`, rightColX, currentY + 10)
    doc.text(`PRACTICA: ${selectedPractica?.Titulo || ''}`, rightColX, currentY + 20)
    doc.text(`SEMESTRE: ${asistencias[0]?.Semestre || ''}`, rightColX, currentY + 30)

    currentY += 60

    // Table
    const tableHeaders = ['#', 'NOMBRE ALUMNO', 'NUM. PC']
    const tableData = asistencias.map((asistencia, index) => [
      (index + 1).toString(),
      `${asistencia.Nombre} ${asistencia.Apellido}`,
      asistencia.Equipo
    ])

    // Pad the table to have at least 25 rows
    const minRows = 25
    while (tableData.length < minRows) {
      tableData.push([
        (tableData.length + 1).toString(),
        '',
        ''
      ])
    }

    let finalY = currentY;
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: currentY,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20 }
      },
      didDrawPage: function(data: {
        cursor: { y: number };
        pageNumber: number;
        pageCount: number;
        settings: {
          margin: { top: number; right: number; bottom: number; left: number };
          startY: number;
          pageBreak: string;
        };
        table: {
          widths: number[];
          heights: number[];
          body: any[][];
        };
      }) {
        finalY = data.cursor.y;
      }
    });

    const signatureY = finalY + 20

    // Signature lines
    // Draw signature lines
    doc.line(margin, signatureY, margin + 70, signatureY)
    doc.text('FIRMA DOCENTE', margin + 35, signatureY + 5, { align: 'center' })

    doc.line(pageWidth - margin - 70, signatureY, pageWidth - margin, signatureY)
    doc.text('FIRMA ENCARGADO LABORATORIO', pageWidth - margin - 35, signatureY + 5, { align: 'center' })

    doc.save('lista_asistencias.pdf')
    await logAction('Exportar PDF', `PDF de asistencias exportado para ${selectedPractica?.Titulo || 'práctica no seleccionada'}`);
  }
  const exportarAExcel = async () => {
    const workbook = XLSX.utils.book_new();
    
    // Create header data with logo and title
    const headerData = [
      ['INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO'],
      ['CONTROL DE ASISTENCIA - TALLER DE PROGRAMACIÓN'],
      [''],
      ['Información de la Clase'],
      ['Fecha:', new Date().toLocaleDateString(), '', 'Carrera:', asistencias[0]?.Carrera || 'N/A'],
      ['Grupo:', asistencias[0]?.Grupo || 'N/A', '', 'Materia:', materias.find(m => m.id === selectedMateriaId)?.nombre || 'N/A'],
      ['Práctica:', selectedPractica?.Titulo || 'N/A', '', 'Docente:', maestroInfo ? `${maestroInfo.Nombre} ${maestroInfo.Apellido}` : 'N/A'],
      ['Hora Inicio:', horaInicio || 'N/A', '', 'Hora Fin:', horaFin || 'N/A'],
      [''],
      ['Lista de Asistencia'],
      ['#', 'ID Alumno', 'Nombre', 'Apellido', 'Carrera', 'Grupo', 'Semestre', 'Turno', 'Equipo']
    ];
  
    // Add student data
    const studentData = asistencias.map((alumno, index) => [
      index + 1,
      alumno.AlumnoId,
      alumno.Nombre,
      alumno.Apellido,
      alumno.Carrera,
      alumno.Grupo,
      alumno.Semestre,
      alumno.Turno,
      alumno.Equipo
    ]);
  
    // Combine header and student data
    const fullData = [...headerData, ...studentData];
  
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(fullData);
  
    // Set column widths
    const colWidths = [
      { wch: 5 },  // #
      { wch: 15 }, // ID
      { wch: 20 }, // Nombre
      { wch: 20 }, // Apellido
      { wch: 25 }, // Carrera
      { wch: 10 }, // Grupo
      { wch: 10 }, // Semestre
      { wch: 10 }, // Turno
      { wch: 10 }  // Equipo
    ];
    worksheet['!cols'] = colWidths;
  
    // Merge cells for titles
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Instituto
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Control de Asistencia
      { s: { r: 3, c: 0 }, e: { r: 3, c: 8 } }  // Información de la Clase
    ];
  
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Control de Asistencia');
  
    // Generate statistics worksheet
    const statsData = [
      ['Estadísticas de Asistencia'],
      [''],
      ['Total de Alumnos:', asistencias.length],
      ['Fecha:', new Date().toLocaleDateString()],
      ['Práctica:', selectedPractica?.Titulo || 'N/A'],
      ['Materia:', materias.find(m => m.id === selectedMateriaId)?.nombre || 'N/A'],
      ['Docente:', maestroInfo ? `${maestroInfo.Nombre} ${maestroInfo.Apellido}` : 'N/A']
    ];
  
    const statsWorksheet = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, 'Estadísticas');
  
    // Save the file
    XLSX.writeFile(workbook, `control_asistencia_${new Date().toISOString().split('T')[0]}.xlsx`);
    await logAction('Exportar Excel', `Se exportó el control de asistencia a Excel para la práctica ${selectedPractica?.Titulo || 'N/A'}`);
  };
  const handleThemeToggle = () => {
    const newTheme = toggleTheme()
    setThemeState(newTheme)
  }
  const handleLogout = async () => {
  if (claseIniciada) {
    await swal({
      title: "No se puede cerrar sesión",
      text: "No puedes cerrar sesión mientras una clase está en progreso. Por favor, finaliza la clase primero.",
      icon: "warning",
    });
    return;
  }

  const willLogout = await swal({
    title: "¿Está seguro?",
    text: "¿Desea cerrar la sesión?",
    icon: "warning",
    buttons: ["Cancelar", "Sí, cerrar sesión"],
    dangerMode: true,
  });

  if (willLogout) {
    localStorage.removeItem('maestroId');
    await logAction('Cerrar Sesión', `Sesión cerrada para ${maestroInfo?.Nombre} ${maestroInfo?.Apellido}`);
    router.push('/');
  }
};
  if (isLoading) {
    return <Loader />
  }
  return (
    <SidebarProvider>
      <div className={`flex h-screen w-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-green-50'}`}>
        <div className="w-96 flex-shrink-0">
          <AppSidebar 
            side="left"
            maestroId={maestroId}
            materias={materias}
            onPracticaAdded={fetchPracticas}
          />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden p-4">
          <Card className={`flex-1 flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-2`}>
            <CardHeader className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-green-100'} flex flex-col items-center justify-center text-center p-4 relative`}>
              <CardTitle className={`text-3xl mb-2 ${theme === 'dark' ? 'text-white' : 'text-green-800'}`}>
                Sistema de Gestión de Asistencias
              </CardTitle>
              <CardDescription className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-green-700'}`}>
              </CardDescription>
              <div className="flex items-center justify-center mt-4">
                <User className={`h-8 w-8 mr-3 ${theme === 'dark' ? 'text-white' : 'text-green-800'}`} />
                <span className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-green-800'}`}>
                  {maestroInfo ? `${maestroInfo.Nombre} ${maestroInfo.Apellido}` : 'Cargando...'}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <Sun className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-yellow-500'}`} />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={handleThemeToggle}
                  aria-label="Toggle dark mode"
                />
                <Moon className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-gray-400'}`} />
              </div>
            </CardHeader>
            <CardContent className={`flex-1 flex flex-col p-2 overflow-hidden ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              <div className="space-y-4 mb-4">
                  <div>
                    <Label htmlFor="materia-select" className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-green-700'}`}>Seleccionar Materia:</Label>
                    <Select onValueChange={handleMateriaChange}>
                      <SelectTrigger id="materia-select" className={`text-xl ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'border-green-300'}`}>
                        <SelectValue placeholder="Seleccione una materia">
                          {selectedMateriaId
                            ? materias.find((materia) => materia.id === selectedMateriaId)?.nombre
                            : "Seleccione una materia"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <div className="text-xl">
                        {materias.map((materia) => (
                          <SelectItem key={materia.id} value={materia.id} className="text-xl">
                            {materia.nombre}
                          </SelectItem>
                        ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="practica-select" className={`text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-green-700'}`}>Seleccionar Practica:</Label>
                    <Select 
                      value={selectedPractica?.id || ''}
                      onValueChange={(value) => {
                        const selected = practicas.find(p => p.id === value)
                        if (selected) {
                          setSelectedPractica(selected)
                          openModal(selected)
                        }
                      }}
                    >
                      <SelectTrigger id="practica-select" className={`text-xl ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'border-green-300'}`}>
                        <SelectValue placeholder="Seleccione una practica">
                          {selectedPractica ? `${selectedPractica.Titulo} - ${selectedPractica.fecha}` : "Seleccione una practica"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <div className="text-xl">
                        {practicas.map(practica => (
                          <SelectItem key={practica.id} value={practica.id} className="text-xl">
                            {practica.Titulo} - {practica.fecha}
                          </SelectItem>
                        ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-between mb-2">
                  <Button 
                    onClick={toggleClase} 
                    className={`flex-grow text-sm ${claseIniciada ? 
                      'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {claseIniciada ? 'Finalizar Clase' : 'Iniciar Clase'}
                  </Button>
                  <Button 
                    onClick={exportarPDF} 
                    className={`flex-grow text-sm ${theme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    <FileUp className="w-4 h-4 mr-1" />
                    Exportar PDF
                  </Button>
                  <Button 
                    onClick={exportarAExcel} 
                    className={`flex-grow text-sm ${theme === 'dark' ? 'bg-green-700 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    <FileUp className="w-4 h-4 mr-1" />
                    Exportar Excel
                  </Button>
                </div>
                <div className="flex justify-between items-center my-4">
                  <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-800'}`}>Lista de Estudiantes</h2>
                  <span className={`text-lg font-medium ${theme === 'dark' ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'} py-1 px-3 rounded-full`}>
                    Total: {contador}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="h-[calc(100vh-600px)] overflow-y-auto">
                    <Table className="w-full text-sm">
                      <TableHeader className="sticky top-0 z-10 bg-inherit">
                        <TableRow className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-green-100'}`}>
                          <TableHead>ID Alumno</TableHead>
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Apellido</TableHead>
                          <TableHead>Carrera</TableHead>
                          <TableHead>Semestre</TableHead>
                          <TableHead>Grupo</TableHead>
                          <TableHead>Turno</TableHead>
                          <TableHead>Equipo</TableHead>
                          <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {asistencias.map((asistencia, index) => (
                          <TableRow key={asistencia.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-green-50'}>
                            <TableCell>{asistencia.AlumnoId}</TableCell>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{asistencia.Nombre}</TableCell>
                            <TableCell>{asistencia.Apellido}</TableCell>
                            <TableCell>{asistencia.Carrera}</TableCell>
                            <TableCell>{asistencia.Semestre}</TableCell>
                            <TableCell>{asistencia.Grupo}</TableCell>
                            <TableCell>{asistencia.Turno}</TableCell>
                            <TableCell>{asistencia.Equipo}</TableCell>
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
                                    d="M.471 1.024v-.52a.1.1 0 0 0-.098.098v.618c0 .054.044.098.098.098h.487a.1.1 0 0 0 .098-.099h-.39c-.107 0-.195 0-.195-.195v-.39a.033.033 0 0 0-.032-.033z"></path>
                              <path
                                d="m1.245.465-.15-.15a.02.02 0 0 0-.016-.006.023.023 0 0 0-.023.022v.108c0 .036.029.065.065.065h.107a.023.023 0 0 0 .023-.023.02.02 0 0 0-.007-.016z"
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
                    {asistencias.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-4">
                          No hay asistencias registradas.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                  </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleLogout} 
                className={`${theme === 'dark' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} ${claseIniciada ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={claseIniciada}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </CardFooter>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  )
}

