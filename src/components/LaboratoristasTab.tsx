'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2 } from 'lucide-react'
import { collection, setDoc, doc, getDocs, query, deleteDoc, updateDoc, Firestore, getDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import bcrypt from 'bcryptjs'
import React from 'react'

interface Laboratorista {
  Matricula: string;
  Nombre: string;
  Apellido: string;
  Email: string;
  Contraseña: string;
  [key: string]: any;
}

export function LaboratoristasTab({ db, isDarkMode, currentColors }: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
  const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])
  const [datosLaboratorista, setDatosLaboratorista] = useState<Laboratorista>({
    Matricula: '',
    Nombre: '',
    Apellido: '',
    Email: '',
    Contraseña: ''
  })
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    cargarLaboratoristas()
  }, [])

  const cargarLaboratoristas = async () => {
    try {
      const laboratoristasRef = collection(db, 'Laboratoristas')
      const laboratoristasSnapshot = await getDocs(query(laboratoristasRef))
      const laboratoristasData = laboratoristasSnapshot.docs.map(doc => ({
        Matricula: doc.id,
        Nombre: doc.data().Nombre || '',
        Apellido: doc.data().Apellido || '',
        Email: doc.data().Email || '',
        Contraseña: doc.data().Contraseña || '',
        ...doc.data()
      })) as Laboratorista[]
      setLaboratoristas(laboratoristasData)
    } catch (error) {
      console.error('Error al cargar laboratoristas:', error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los laboratoristas. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { Matricula, Contraseña, ...restoDatosLaboratorista } = datosLaboratorista
      
      if (!editando) {
        // Check if the matricula already exists when adding a new laboratory technician
        const laboratoristaDoc = doc(db, 'Laboratoristas', Matricula)
        const laboratoristaSnapshot = await getDoc(laboratoristaDoc)

        if (laboratoristaSnapshot.exists()) {
          await Swal.fire({
            title: "Error",
            text: "Esta matrícula ya existe. Por favor, use una matrícula diferente.",
            icon: "error",
          })
          return
        }

        const hashedPassword = await bcrypt.hash(Contraseña, 10)
        await setDoc(laboratoristaDoc, { ...restoDatosLaboratorista, Contraseña: hashedPassword })
        await Swal.fire({
          title: "¡Éxito!",
          text: "Laboratorista agregado correctamente",
          icon: "success",
        })
      } else {
        const updateData = { ...restoDatosLaboratorista }
        if (Contraseña !== '') {
          updateData.Contraseña = await bcrypt.hash(Contraseña, 10)
        }
        await updateDoc(doc(db, 'Laboratoristas', Matricula), updateData)
        await Swal.fire({
          title: "¡Éxito!",
          text: "Laboratorista actualizado correctamente",
          icon: "success",
        })
        setEditando(false)
      }
      setDatosLaboratorista({ Matricula: '', Nombre: '', Apellido: '', Email: '', Contraseña: '' })
      cargarLaboratoristas()
    } catch (error) {
      console.error('Error al agregar/actualizar laboratorista:', error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error al agregar/actualizar el laboratorista. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const eliminarLaboratorista = async (matricula: string) => {
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
        await deleteDoc(doc(db, 'Laboratoristas', matricula));
        Swal.fire({
          title: 'Eliminado!',
          text: 'El laboratorista ha sido eliminado.',
          icon: 'success'
        });
        cargarLaboratoristas();
      } catch (error) {
        console.error('Error al eliminar laboratorista:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Ha ocurrido un error al eliminar el laboratorista.',
          icon: 'error'
        });
      }
    }
  };

  const modificarLaboratorista = (laboratorista: Laboratorista) => {
    setDatosLaboratorista({...laboratorista, Contraseña: ''})
    setEditando(true)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className={`${isDarkMode ? currentColors.cardBackground : currentColors.cardBackground} h-full`}>
        <CardHeader>
          <CardTitle className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
            {editando ? 'Editar Laboratorista' : 'Agregar Laboratorista'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matriculaLaboratorista" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Matrícula</Label>
              <Input
                id="matriculaLaboratorista"
                value={datosLaboratorista.Matricula}
                onChange={(e) => setDatosLaboratorista({...datosLaboratorista, Matricula: e.target.value})}
                required
                disabled={editando}
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreLaboratorista" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Nombre</Label>
              <Input
                id="nombreLaboratorista"
                value={datosLaboratorista.Nombre}
                onChange={(e) => setDatosLaboratorista({...datosLaboratorista, Nombre: e.target.value})}
                required
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidoLaboratorista" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Apellido</Label>
              <Input
                id="apellidoLaboratorista"
                value={datosLaboratorista.Apellido}
                onChange={(e) => setDatosLaboratorista({...datosLaboratorista, Apellido: e.target.value})}
                required
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailLaboratorista" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Email</Label>
              <Input
                id="emailLaboratorista"
                type="email"
                value={datosLaboratorista.Email}
                onChange={(e) => setDatosLaboratorista({...datosLaboratorista, Email: e.target.value})}
                required
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contraseñaLaboratorista" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                {editando ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
              </Label>
              <Input
                id="contraseñaLaboratorista"
                type="password"
                value={datosLaboratorista.Contraseña}
                onChange={(e) => setDatosLaboratorista({...datosLaboratorista, Contraseña: e.target.value})}
                required={!editando}
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <Button 
              type="submit" 
              className={`w-full h-8 px-1 py-0 text-xs font-tall transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                isDarkMode ? currentColors.buttonGreen : currentColors.buttonGreen
              }`}
            >
              {editando ? 'Actualizar Laboratorista' : 'Agregar Laboratorista'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className={`${isDarkMode ? currentColors.cardBackground : currentColors.cardBackground} h-full overflow-auto`}>
        <CardHeader>
          <CardTitle className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Lista de Laboratoristas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Matrícula</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Nombre</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Apellido</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Email</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laboratoristas.map((laboratorista) => (
                <TableRow key={laboratorista.Matricula}>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>{laboratorista.Matricula}</TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>{laboratorista.Nombre}</TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>{laboratorista.Apellido}</TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>{laboratorista.Email}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => modificarLaboratorista(laboratorista)}
                      className="mr-2"
                      size="sm"
                      variant="outline"
                      style={{ color: currentColors.buttonBlue, borderColor: currentColors.buttonBlue }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar laboratorista</span>
                    </Button>
                    <Button
                      onClick={() => eliminarLaboratorista(laboratorista.Matricula)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar laboratorista</span>
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

