'use client'

import * as React from "react"
import { FileText, Plus, Edit, Trash2, FileDown, RefreshCw } from 'lucide-react'
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Swal from 'sweetalert2'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import 'sweetalert2/dist/sweetalert2.css'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import styled, { createGlobalStyle } from 'styled-components'

interface ClassInfo {
  id: string
  materia: string
  practica: string
  fecha: string
  totalAsistencias: number
  maestroNombre: string
  maestroApellido: string
  horaInicio: string
  carrera: string;
  grupo: string;
  alumnos: {
    id: string
    nombre: string
    apellido: string
    equipo: string
    carrera: string
    grupo: string
    semestre: string
    turno: string
  }[]
}

interface Practica {
  id: string
  Titulo: string
  Descripcion: string
  Duracion: string
  fecha: string
}

const GlobalStyle = createGlobalStyle`
  .swal2-container {
    z-index: 10000 !important;
  }
`

export function AppSidebar({ maestroId, materias, onPracticaAdded, side = "left" }: { 
  maestroId: string
  materias: { id: string; nombre: string }[]
  onPracticaAdded: () => void
  side?: "left" | "right"
}) {
  const [activeTab, setActiveTab] = React.useState<'add' | 'listasAsistencia' | 'practicas'>('add')
  const [selectedMateria, setSelectedMateria] = React.useState('')
  const [selectedPractica, setSelectedPractica] = React.useState('')
  const [newPractica, setNewPractica] = React.useState({
    Titulo: '',
    Descripcion: '',
    Duracion: '',
    fecha: ''
  })
  const [classInfo, setClassInfo] = React.useState<ClassInfo[]>([])
  const [selectedClassInfo, setSelectedClassInfo] = React.useState<ClassInfo[]>([])
  const [practicas, setPracticas] = React.useState<Practica[]>([])
  const [editingPractica, setEditingPractica] = React.useState<Practica | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false) 
  const { toast } = useToast()
  const [dateFilter, setDateFilter] = React.useState('')
  const [groupFilter, setGroupFilter] = React.useState('')

  const fetchClassInfo = React.useCallback(async (materiaId: string) => {
    if (!maestroId || !materiaId) return
    
    let q = query(
      collection(db, 'ClassInformation'),
      where("maestroId", "==", maestroId),
      where("materia", "==", materias.find(m => m.id === materiaId)?.nombre)
    )
    
    if (dateFilter) {
      q = query(q, where("fecha", "==", dateFilter))
    }
    
    if (groupFilter) {
      q = query(q, where("grupo", "==", groupFilter))
    }
    
    const querySnapshot = await getDocs(q)
    const classInfoData: ClassInfo[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      classInfoData.push({
        id: doc.id,
        materia: data.materia,
        practica: data.practica,
        fecha: data.fecha,
        totalAsistencias: data.totalAsistencias,
        maestroNombre: data.maestroNombre,
        maestroApellido: data.maestroApellido,
        horaInicio: data.horaInicio || '',
        carrera: data.alumnos && data.alumnos[0] ? data.alumnos[0].carrera : '',
        grupo: data.alumnos && data.alumnos[0] ? data.alumnos[0].grupo : '',
        alumnos: data.alumnos || []
      })
    })
    setSelectedClassInfo(classInfoData)
  }, [maestroId, materias, dateFilter, groupFilter])

  const fetchPracticas = React.useCallback(async (materiaId: string) => {
    if (!materiaId) return
    
    const practicasRef = collection(db, 'Materias', materiaId, 'Practicas')
    const practicasSnapshot = await getDocs(practicasRef)
    const practicasData = practicasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Practica[]
    setPracticas(practicasData)
  }, [])

  React.useEffect(() => {
    if (selectedMateria) {
      fetchPracticas(selectedMateria)
      setSelectedPractica('')
      setSelectedClassInfo([])
    }
  }, [selectedMateria, fetchPracticas])

  React.useEffect(() => {
    if (selectedMateria) {
      fetchClassInfo(selectedMateria)
    }
  }, [selectedMateria, dateFilter, groupFilter, fetchClassInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMateria) {
      await Swal.fire({
        title: "Error",
        text: "Por favor, seleccione una materia antes de agregar una práctica.",
        icon: "error",
      })
      return
    }
    
    if (!newPractica.Titulo || !newPractica.Descripcion || !newPractica.Duracion || !newPractica.fecha) {
      await Swal.fire({
        title: "Error",
        text: "Por favor, complete todos los campos.",
        icon: "error",
      })
      return
    }
    
    try {
      const practicasRef = collection(db, 'Materias', selectedMateria, 'Practicas')
      await addDoc(practicasRef, newPractica)
      
      setNewPractica({
        Titulo: '',
        Descripcion: '',
        Duracion: '',
        fecha: ''
      })
      
      await Swal.fire({
        title: "Éxito",
        text: "La práctica ha sido agregada correctamente.",
        icon: "success",
      })
      
      onPracticaAdded()
      fetchPracticas(selectedMateria)
    } catch (error) {
      console.error("Error al agregar la práctica:", error)
      await Swal.fire({
        title: "Error",
        text: "No se pudo agregar la práctica. Por favor, intente de nuevo.",
        icon: "error",
      })
    }
  }

  const handleEdit = (practica: Practica) => {
    setEditingPractica(practica)
    setIsDialogOpen(true) 
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPractica || !selectedMateria) return

    if (!editingPractica.Titulo || !editingPractica.Descripcion || !editingPractica.Duracion || !editingPractica.fecha) {
      toast({
        title: "Error",
        description: "Por favor, complete todos los campos.",
        variant: "destructive",
      })
      return
    }

    setIsDialogOpen(false) 

    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: "¿Desea modificar esta práctica?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, modificar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      try {
        const practicaRef = doc(db, 'Materias', selectedMateria, 'Practicas', editingPractica.id)
        const { id, ...practicaData } = editingPractica
        await updateDoc(practicaRef, practicaData)

        await Swal.fire({
          title: "Éxito",
          text: "La práctica ha sido actualizada correctamente.",
          icon: "success",
        })

        fetchPracticas(selectedMateria)
      } catch (error) {
        console.error("Error al actualizar la práctica:", error)
        await Swal.fire({
          title: "Error",
          text: "No se pudo actualizar la práctica. Por favor, intente de nuevo.",
          icon: "error",
        })
      }
    }
  }

  const handleDelete = async (practicaId: string) => {
    if (!selectedMateria) return

    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'Materias', selectedMateria, 'Practicas', practicaId))

        await Swal.fire({
          title: "Éxito",
          text: "La práctica ha sido eliminada correctamente.",
          icon: "success",
        })

        fetchPracticas(selectedMateria)
      } catch (error) {
        console.error("Error al eliminar la práctica:", error)
        await Swal.fire({
          title: "Error",
          text: "No se pudo eliminar la práctica. Por favor, intente de nuevo.",
          icon: "error",
        })
      }
    }
  }

  const exportToPDF = (classInfo: ClassInfo) => {
    if (!classInfo) return

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
    doc.text(`FECHA: ${classInfo.fecha}`, leftColX, currentY)
    doc.text(`GRUPO: ${classInfo.grupo}`, leftColX, currentY + 10)
    doc.text(`HORA: ${classInfo.horaInicio}`, leftColX, currentY + 20)
    doc.text(`MATERIA: ${classInfo.materia}`, leftColX, currentY + 30)

    // Right column
    doc.text(`CARRERA: ${classInfo.carrera}`, rightColX, currentY)
    doc.text(`DOCENTE: ${classInfo.maestroNombre} ${classInfo.maestroApellido}`, rightColX, currentY + 10)
    doc.text(`PRACTICA: ${classInfo.practica}`, rightColX, currentY + 20)
    doc.text(`TOTAL ASISTENCIAS: ${classInfo.totalAsistencias}`, rightColX, currentY + 30)

    currentY += 50

    // Table
    const tableHeaders = ['#', 'NOMBRE ALUMNO', 'NUM. PC']
    const tableData = classInfo.alumnos.map((alumno, index) => [
      (index + 1).toString(),
      `${alumno.nombre} ${alumno.apellido}`,
      alumno.equipo
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

    doc.save(`lista_asistencia_${classInfo.practica}.pdf`)
  }

  const exportToExcel = (classInfo: ClassInfo) => {
    if (!classInfo) return

    const workbook = XLSX.utils.book_new()
    
    // Hoja de resumen
    const resumenSheet = XLSX.utils.json_to_sheet([{
      Materia: classInfo.materia,
      Practica: classInfo.practica,
      Fecha: classInfo.fecha,
      TotalAsistencias: classInfo.totalAsistencias,
      Docente: `${classInfo.maestroNombre} ${classInfo.maestroApellido}`,
      Carrera: classInfo.carrera,
      Grupo: classInfo.grupo
    }])
    XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen")

    // Hoja de alumnos
    const alumnosSheet = XLSX.utils.json_to_sheet(classInfo.alumnos.map((alumno, index) => ({
      '#': index + 1,
      Nombre: alumno.nombre,
      Apellido: alumno.apellido,
      Equipo: alumno.equipo,
      Carrera: alumno.carrera,
      Grupo: alumno.grupo,
      Semestre: alumno.semestre,
      Turno: alumno.turno
    })))
    XLSX.utils.book_append_sheet(workbook, alumnosSheet, "Alumnos")

    XLSX.writeFile(workbook, `lista_asistencia_${classInfo.practica}.xlsx`)
  }

  const clearListaAsistenciaFields = () => {
    setSelectedMateria('')
    setSelectedPractica('')
    setSelectedClassInfo([])
    setDateFilter('')
    setGroupFilter('')
  }

  const clearPracticasFields = () => {
    setSelectedMateria('')
    setPracticas([])
  }

  return (
    <>
    <Sidebar side={side} className="h-screen flex flex-col w-96 bg-white dark:bg-gray-800">
      <SidebarHeader className="p-2 border-b border-gray-200 dark:border-gray-700">
        <SidebarMenu>
          <div className="flex space-x-1">
            <SidebarMenuItem className="flex-1">
              <SidebarMenuButton 
                isActive={activeTab === 'add'}
                onClick={() => setActiveTab('add')}
                className="w-full text-xs py-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <Plus className="mr-1 h-3 w-3" />
                Agregar
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="flex-1">
              <SidebarMenuButton 
                isActive={activeTab === 'listasAsistencia'}
                onClick={() => setActiveTab('listasAsistencia')}
                className="w-full text-xs py-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <FileText className="mr-1 h-3 w-3" />
                Listas Asistencia
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="flex-1">
              <SidebarMenuButton 
                isActive={activeTab === 'practicas'}
                onClick={() => setActiveTab('practicas')}
                className="w-full text-xs py-1 bg-purple-500 hover:bg-purple-600 text-white"
              >
                <FileText className="mr-1 h-3 w-3" />
                Prácticas
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="flex-1 h-[calc(100vh-60px)]">
          <SidebarGroup>
            <SidebarGroupContent className="p-3">
              {activeTab === 'add' && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Materia</Label>
                    <Select
                      value={selectedMateria}
                      onValueChange={setSelectedMateria}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="Seleccionar materia" />
                      </SelectTrigger>
                      <SelectContent>
                        {materias.map((materia) => (
                          <SelectItem key={materia.id} value={materia.id} className="text-sm">
                            {materia.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</Label>
                    <Input
                      value={newPractica.Titulo}
                      onChange={(e) => setNewPractica({...newPractica, Titulo: e.target.value})}
                      required
                      className="w-full text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</Label>
                    <Input
                      value={newPractica.Descripcion}
                      onChange={(e) => setNewPractica({...newPractica, Descripcion: e.target.value})}
                      required
                      className="w-full text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duración</Label>
                    <Input
                      value={newPractica.Duracion}
                      onChange={(e) => setNewPractica({...newPractica, Duracion: e.target.value})}
                      required
                      className="w-full text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</Label>
                    <Input
                      type="date"
                      value={newPractica.fecha}
                      onChange={(e) => setNewPractica({...newPractica, fecha: e.target.value})}
                      required
                      className="w-full text-sm"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full mt-4 text-sm bg-green-500 hover:bg-green-600 text-white">
                    Agregar Práctica
                  </Button>
                </form>
              )}
              {activeTab === 'listasAsistencia' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Seleccionar Materia</Label>
                    <Select
                      value={selectedMateria}
                      onValueChange={(value) => {
                        setSelectedMateria(value)
                        setSelectedClassInfo([])
                      }}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="Seleccionar materia" />
                      </SelectTrigger>
                      <SelectContent>
                        {materias.map((materia) => (
                          <SelectItem key={materia.id} value={materia.id} className="text-sm">
                            {materia.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</Label>
                    <Input
                      type="text"
                      placeholder="Ejemplo: 09/12/2024"
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        if (selectedMateria) {
                          fetchClassInfo(selectedMateria);
                        }
                      }}
                      className="w-full text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Grupo</Label>
                    <Input
                      type="text"
                      placeholder="Ejemplo: 7-ISCM"
                      value={groupFilter}
                      onChange={(e) => {
                        setGroupFilter(e.target.value);
                        if (selectedMateria) {
                          fetchClassInfo(selectedMateria);
                        }
                      }}
                      className="w-full text-sm"
                    />
                  </div>
                  {selectedClassInfo.map((classInfo) => (
                    <Card key={classInfo.id} className="w-full bg-white dark:bg-gray-700 shadow-md">
                      <CardHeader className="p-3 bg-gray-100 dark:bg-gray-600">
                        <CardTitle className="text-sm text-gray-800 dark:text-white">{classInfo.practica}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 text-gray-700 dark:text-gray-300">
                        <div className="space-y-1 text-sm">
                          <p><strong>Materia:</strong> {classInfo.materia}</p>
                          <p><strong>Fecha:</strong> {classInfo.fecha}</p>
                          <p><strong>Total Asistencias:</strong> {classInfo.totalAsistencias}</p>
                          <p><strong>Docente:</strong> {classInfo.maestroNombre} {classInfo.maestroApellido}</p>
                          <p><strong>Carrera:</strong> {classInfo.carrera}</p>
                          <p><strong>Grupo:</strong> {classInfo.grupo}</p>
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button size="sm" onClick={() => exportToPDF(classInfo)} className="bg-blue-500 hover:bg-blue-600 text-white">
                            <FileDown className="w-4 h-4 mr-1" />
                            Exportar PDF
                          </Button>
                          <Button size="sm" onClick={() => exportToExcel(classInfo)} className="bg-blue-500 hover:bg-blue-600 text-white">
                            <FileDown className="w-4 h-4 mr-1" />
                            Exportar Excel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button onClick={clearListaAsistenciaFields} className="w-full mt-4 text-sm bg-gray-500 hover:bg-gray-600 text-white">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Limpiar Campos
                  </Button>
                </div>
              )}
              {activeTab === 'practicas' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Materia</Label>
                    <Select
                      value={selectedMateria}
                      onValueChange={setSelectedMateria}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="Seleccionar materia" />
                      </SelectTrigger>
                      <SelectContent>
                        {materias.map((materia) => (
                          <SelectItem key={materia.id} value={materia.id} className="text-sm">
                            {materia.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {practicas.map((practica) => (
                    <Card key={practica.id} className="w-full bg-white dark:bg-gray-700 shadow-md">
                      <CardHeader className="p-3 bg-gray-100 dark:bg-gray-600">
                        <CardTitle className="text-sm text-gray-800 dark:text-white">{practica.Titulo}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 text-gray-700 dark:text-gray-300">
                        <div className="space-y-1 text-sm">
                          <p><strong>Descripción:</strong> {practica.Descripcion}</p>
                          <p><strong>Duración:</strong> {practica.Duracion}</p>
                          <p><strong>Fecha:</strong> {practica.fecha}</p>
                        </div>
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(practica)}>
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(practica.id)}>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button onClick={clearPracticasFields} className="w-full mt-4 text-sm bg-gray-500 hover:bg-gray-600 text-white">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Limpiar Campos
                  </Button>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
      <SidebarRail />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}> 
        <DialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Editar Práctica</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</Label>
              <Input
                value={editingPractica?.Titulo || ''}
                onChange={(e) => setEditingPractica(prev => prev ? {...prev, Titulo: e.target.value} : null)}
                required
                className="w-full text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</Label>
              <Input
                value={editingPractica?.Descripcion || ''}
                onChange={(e) => setEditingPractica(prev => prev ? {...prev, Descripcion: e.target.value} : null)}
                required
                className="w-full text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duración</Label>
              <Input
                value={editingPractica?.Duracion || ''}
                onChange={(e) => setEditingPractica(prev => prev ? {...prev, Duracion: e.target.value} : null)}
                required
                className="w-full text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</Label>
              <Input
                type="date"
                value={editingPractica?.fecha || ''}
                onChange={(e) => setEditingPractica(prev => prev ? {...prev, fecha: e.target.value} : null)}
                required
                className="w-full text-sm"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="text-gray-700 dark:text-gray-300">Cancelar</Button>
              <Button type="submit" className="bg-green-500 hover:bg-green-600 text-white">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <GlobalStyle />
    </Sidebar>
    </>
  )
}

