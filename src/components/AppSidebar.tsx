'use client'

import * as React from "react"
import { FileText, Plus, Edit, Trash2, FileDown, RefreshCw } from 'lucide-react'
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Swal from 'sweetalert2'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

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

interface ClassInfo {
  id: string
  materia: string
  practica: string
  fecha: string
  totalAsistencias: number
  maestroNombre: string
  maestroApellido: string
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
  const [selectedClassInfo, setSelectedClassInfo] = React.useState<ClassInfo | null>(null)
  const [practicas, setPracticas] = React.useState<Practica[]>([])
  const [editingPractica, setEditingPractica] = React.useState<Practica | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const { toast } = useToast()

  const fetchClassInfo = React.useCallback(async (materiaId: string, practicaId: string) => {
    if (!maestroId || !materiaId || !practicaId) return
    
    const q = query(
      collection(db, 'ClassInformation'),
      where("maestroId", "==", maestroId),
      where("materia", "==", materias.find(m => m.id === materiaId)?.nombre),
      where("practica", "==", practicas.find(p => p.id === practicaId)?.Titulo)
    )
    
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data()
      const info: ClassInfo = {
        id: querySnapshot.docs[0].id,
        materia: data.materia,
        practica: data.practica,
        fecha: data.fecha,
        totalAsistencias: data.totalAsistencias,
        maestroNombre: data.maestroNombre,
        maestroApellido: data.maestroApellido,
        alumnos: data.alumnos
      }
      setSelectedClassInfo(info)
    } else {
      setSelectedClassInfo(null)
    }
  }, [maestroId, materias, practicas])

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
      setSelectedClassInfo(null)
    }
  }, [selectedMateria, fetchPracticas])

  React.useEffect(() => {
    if (selectedMateria && selectedPractica) {
      fetchClassInfo(selectedMateria, selectedPractica)
    }
  }, [selectedMateria, selectedPractica, fetchClassInfo])

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
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPractica || !selectedMateria) return

    if (!editingPractica.Titulo || !editingPractica.Descripcion || !editingPractica.Duracion || !editingPractica.fecha) {
      await Swal.fire({
        title: "Error",
        text: "Por favor, complete todos los campos.",
        icon: "error",
      })
      return
    }

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

        setIsEditDialogOpen(false)
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

  const exportToPDF = () => {
    if (!selectedClassInfo) return

    const doc = new jsPDF()
    doc.text(`Lista de Asistencia - ${selectedClassInfo.practica}`, 14, 15)
    doc.text(`Materia: ${selectedClassInfo.materia}`, 14, 25)
    doc.text(`Fecha: ${selectedClassInfo.fecha}`, 14, 35)
    doc.text(`Total de Asistencias: ${selectedClassInfo.totalAsistencias}`, 14, 45)

    const tableColumn = ["#", "Nombre", "Apellido", "Carrera", "Semestre", "Grupo", "Turno", "Equipo"]
    const tableRows = selectedClassInfo.alumnos.map((alumno, index) => [
      index + 1,
      alumno.nombre,
      alumno.apellido,
      alumno.carrera,
      alumno.semestre,
      alumno.grupo,
      alumno.turno,
      alumno.equipo
    ])

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 55,
    })

    doc.save(`lista_asistencia_${selectedClassInfo.practica}.pdf`)
  }

  const exportToExcel = () => {
    if (!selectedClassInfo) return

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(selectedClassInfo.alumnos)

    XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencias")
    XLSX.writeFile(workbook, `lista_asistencia_${selectedClassInfo.practica}.xlsx`)
  }

  const clearListaAsistenciaFields = () => {
    setSelectedMateria('')
    setSelectedPractica('')
    setSelectedClassInfo(null)
  }

  const clearPracticasFields = () => {
    setSelectedMateria('')
    setPracticas([])
  }

  return (
    <Sidebar side={side} className="h-screen flex flex-col w-96">
      <SidebarHeader className="p-2 border-b">
        <SidebarMenu>
          <div className="flex space-x-1">
            <SidebarMenuItem className="flex-1">
              <SidebarMenuButton 
                isActive={activeTab === 'add'}
                onClick={() => setActiveTab('add')}
                className="w-full text-xs py-1"
              >
                <Plus className="mr-1 h-3 w-3" />
                Agregar
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="flex-1">
              <SidebarMenuButton 
                isActive={activeTab === 'listasAsistencia'}
                onClick={() => setActiveTab('listasAsistencia')}
                className="w-full text-xs py-1"
              >
                <FileText className="mr-1 h-3 w-3" />
                Listas Asistencia
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="flex-1">
              <SidebarMenuButton 
                isActive={activeTab === 'practicas'}
                onClick={() => setActiveTab('practicas')}
                className="w-full text-xs py-1"
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
                    <Label className="text-sm font-medium">Materia</Label>
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
                    <Label className="text-sm font-medium">Título</Label>
                    <Input
                      value={newPractica.Titulo}
                      onChange={(e) => setNewPractica({...newPractica, Titulo: e.target.value})}
                      required
                      className="w-full text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Descripción</Label>
                    <Input
                      value={newPractica.Descripcion}
                      onChange={(e) => setNewPractica({...newPractica, Descripcion: e.target.value})}
                      required
                      className="w-full text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Duración</Label>
                    <Input
                      value={newPractica.Duracion}
                      onChange={(e) => setNewPractica({...newPractica, Duracion: e.target.value})}
                      required
                      className="w-full text-sm"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Fecha</Label>
                    <Input
                      type="date"
                      value={newPractica.fecha}
                      onChange={(e) => setNewPractica({...newPractica, fecha: e.target.value})}
                      required
                      className="w-full text-sm"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full mt-4 text-sm">
                    Agregar Práctica
                  </Button>
                </form>
              )}
              {activeTab === 'listasAsistencia' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Seleccionar Materia</Label>
                    <Select
                      value={selectedMateria}
                      onValueChange={(value) => {
                        setSelectedMateria(value)
                        setSelectedPractica('')
                        setSelectedClassInfo(null)
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
                  {selectedMateria && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Seleccionar Práctica</Label>
                      <Select
                        value={selectedPractica}
                        onValueChange={setSelectedPractica}
                      >
                        <SelectTrigger className="w-full text-sm">
                          <SelectValue placeholder="Seleccionar práctica" />
                        </SelectTrigger>
                        <SelectContent>
                          {practicas.map((practica) => (
                            <SelectItem key={practica.id} value={practica.id} className="text-sm">
                              {practica.Titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {selectedClassInfo && (
                    <Card className="w-full">
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">{selectedClassInfo.practica}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="space-y-1 text-sm">
                          <p><strong>Materia:</strong> {selectedClassInfo.materia}</p>
                          <p><strong>Fecha:</strong> {selectedClassInfo.fecha}</p>
                          <p><strong>Total Asistencias:</strong> {selectedClassInfo.totalAsistencias}</p>
                          <p><strong>Docente:</strong> {selectedClassInfo.maestroNombre} {selectedClassInfo.maestroApellido}</p>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">Lista de Asistencia:</h4>
                          <ul className="space-y-1 text-sm">
                            {selectedClassInfo.alumnos.map((alumno, index) => (
                              <li key={alumno.id}>
                                {index + 1}. {alumno.nombre} {alumno.apellido} - Carrera: {alumno.carrera}, Semestre: {alumno.semestre}, Grupo: {alumno.grupo}, Turno: {alumno.turno}, Equipo: {alumno.equipo}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex justify-end space-x-2 mt-4">
                          <Button size="sm" onClick={exportToPDF}>
                            <FileDown className="w-4 h-4 mr-1" />
                            Exportar PDF
                          </Button>
                          <Button size="sm" onClick={exportToExcel}>
                            <FileDown className="w-4 h-4 mr-1" />
                            Exportar Excel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <Button onClick={clearListaAsistenciaFields} className="w-full mt-4 text-sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Limpiar Campos
                  </Button>
                </div>
              )}
              {activeTab === 'practicas' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Materia</Label>
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
                    <Card key={practica.id} className="w-full">
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm">{practica.Titulo}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
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
                  <Button onClick={clearPracticasFields} className="w-full mt-4 text-sm">
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Práctica</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Título</Label>
              <Input
                value={editingPractica?.Titulo || ''}
                onChange={(e) => setEditingPractica(prev => prev ? {...prev, Titulo: e.target.value} : null)}
                required
                className="w-full text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm font-medium">Descripción</Label>
              <Input
                value={editingPractica?.Descripcion || ''}
                onChange={(e) => setEditingPractica(prev => prev ? {...prev, Descripcion: e.target.value} : null)}
                required
                className="w-full text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm font-medium">Duración</Label>
              <Input
                value={editingPractica?.Duracion || ''}
                onChange={(e) => setEditingPractica(prev => prev ? {...prev, Duracion: e.target.value} : null)}
                required
                className="w-full text-sm"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm font-medium">Fecha</Label>
              <Input
                type="date"
                value={editingPractica?.fecha || ''}
                onChange={(e) => setEditingPractica(prev => prev ? {...prev, fecha: e.target.value} : null)}
                required
                className="w-full text-sm"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}

