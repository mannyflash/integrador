'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2 } from 'lucide-react'
import { collection, setDoc, doc, getDocs, query, deleteDoc, updateDoc, Firestore, where, getDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import React from 'react'

interface Materia {
  ID: string;
  NombreMateria: string;
  MaestroID: string;
  Semestre: string;
  [key: string]: any;
}

interface Docente {
  ID: string;
  NombreCompleto: string;
}

export function MateriasTab({ db, isDarkMode, currentColors }: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
  const [materias, setMaterias] = useState<Materia[]>([])
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [datosMateria, setDatosMateria] = useState<Materia>({
    ID: '',
    NombreMateria: '',
    MaestroID: '',
    Semestre: ''
  })
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    cargarMaterias()
    cargarDocentes()
  }, [])

  const cargarMaterias = async () => {
    try {
      const materiasRef = collection(db, 'Materias')
      const materiasSnapshot = await getDocs(query(materiasRef))
      const materiasData = materiasSnapshot.docs.map(doc => ({
        ID: doc.id,
        NombreMateria: doc.data().NombreMateria || '',
        MaestroID: doc.data().MaestroID || '',
        Semestre: doc.data().Semestre || '',
        ...doc.data()
      })) as Materia[]
      setMaterias(materiasData)
    } catch (error) {
      console.error('Error al cargar materias:', error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar las materias. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const cargarDocentes = async () => {
    try {
      const docentesRef = collection(db, 'Docentes')
      const docentesSnapshot = await getDocs(query(docentesRef))
      const docentesData = docentesSnapshot.docs.map(doc => ({
        ID: doc.id,
        NombreCompleto: `${doc.data().Nombre} ${doc.data().Apellido}`
      }))
      setDocentes(docentesData)
    } catch (error) {
      console.error('Error al cargar docentes:', error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los docentes. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { ID, NombreMateria, ...restoDatosMateria } = datosMateria
    
      if (!editando) {
        // Check if the subject name already exists when adding a new subject
        const materiasRef = collection(db, 'Materias')
        const nombreMateriaQuery = query(materiasRef, where("NombreMateria", "==", NombreMateria))
        const nombreMateriaQuerySnapshot = await getDocs(nombreMateriaQuery)

        if (!nombreMateriaQuerySnapshot.empty) {
          await Swal.fire({
            title: "Error",
            text: "Ya existe una materia con este nombre. Por favor, use un nombre diferente.",
            icon: "error",
          })
          return
        }

        const nuevoID = doc(collection(db, 'Materias')).id
        await setDoc(doc(db, 'Materias', nuevoID), { NombreMateria, ...restoDatosMateria })
        await Swal.fire({
          title: "¡Éxito!",
          text: "Materia agregada correctamente",
          icon: "success",
        })
      } else {
        await updateDoc(doc(db, 'Materias', ID), { NombreMateria, ...restoDatosMateria })
        await Swal.fire({
          title: "¡Éxito!",
          text: "Materia actualizada correctamente",
          icon: "success",
        })
        setEditando(false)
      }
      setDatosMateria({ ID: '', NombreMateria: '', MaestroID: '', Semestre: '' })
      cargarMaterias()
    } catch (error) {
      console.error('Error al agregar/actualizar materia:', error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error al agregar/actualizar la materia. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const eliminarMateria = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'Materias', id));
        Swal.fire(
          'Eliminada!',
          'La materia ha sido eliminada.',
          'success'
        );
        cargarMaterias();
      } catch (error) {
        console.error('Error al eliminar materia:', error);
        Swal.fire(
          'Error!',
          'Ha ocurrido un error al eliminar la materia.',
          'error'
        );
      }
    }
  };

  const modificarMateria = (materia: Materia) => {
    setDatosMateria(materia)
    setEditando(true)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className={`${isDarkMode ? currentColors.cardBackground : currentColors.cardBackground} h-full`}>
        <CardHeader>
          <CardTitle className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
            {editando ? 'Editar Materia' : 'Agregar Materia'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombreMateria" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Nombre de la Materia</Label>
              <Input
                id="nombreMateria"
                value={datosMateria.NombreMateria}
                onChange={(e) => setDatosMateria({...datosMateria, NombreMateria: e.target.value})}
                required
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maestroMateria" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Maestro</Label>
              <Select
                value={datosMateria.MaestroID}
                onValueChange={(value) => setDatosMateria({...datosMateria, MaestroID: value})}
              >
                <SelectTrigger id="maestroMateria" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
                  <SelectValue placeholder="Selecciona un maestro" />
                </SelectTrigger>
                <SelectContent>
                  {docentes.map((docente) => (
                    <SelectItem key={docente.ID} value={docente.ID}>
                      {docente.NombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semestreMateria" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Semestre</Label>
              <Select
                value={datosMateria.Semestre}
                onValueChange={(value) => setDatosMateria({...datosMateria, Semestre: value})}
              >
                <SelectTrigger id="semestreMateria" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
                  <SelectValue placeholder="Selecciona un semestre" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((semestre) => (
                    <SelectItem key={semestre} value={semestre.toString()}>
                      {semestre}º Semestre
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className={`w-full h-8 px-1 py-0 text-xs font-tall transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                isDarkMode ? currentColors.buttonGreen : currentColors.buttonGreen
              }`}
            >
              {editando ? 'Actualizar Materia' : 'Agregar Materia'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className={`${isDarkMode ? currentColors.cardBackground : currentColors.cardBackground} h-full overflow-auto`}>
        <CardHeader>
          <CardTitle className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Lista de Materias</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Nombre</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Maestro</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Semestre</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materias.map((materia) => (
                <TableRow key={materia.ID}>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>{materia.NombreMateria}</TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                    {docentes.find(d => d.ID === materia.MaestroID)?.NombreCompleto || 'No asignado'}
                  </TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>{materia.Semestre}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => modificarMateria(materia)}
                      className="mr-2"
                      size="sm"
                      variant="outline"
                      style={{ color: currentColors.buttonBlue, borderColor: currentColors.buttonBlue }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar materia</span>
                    </Button>
                    <Button
                      onClick={() => eliminarMateria(materia.ID)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar materia</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

