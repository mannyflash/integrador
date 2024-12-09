'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2 } from 'lucide-react'
import { collection, setDoc, doc, getDocs, query, deleteDoc, updateDoc, Firestore } from 'firebase/firestore'
import Swal from 'sweetalert2'
import bcrypt from 'bcryptjs'
import React from 'react'

interface Administrador {
  Matricula: string;
  Nombre: string;
  Apellido: string;
  Email: string;
  Contraseña?: string;  // Make it optional since it might not always be present
}

export function AdministradoresTab({ db, isDarkMode, currentColors }: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
  const [administradores, setAdministradores] = useState<Administrador[]>([])
  const [datosAdministrador, setDatosAdministrador] = useState<Administrador>({
    Matricula: '',
    Nombre: '',
    Apellido: '',
    Email: '',
    Contraseña: ''
  })
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    cargarAdministradores()
  }, [])

  const cargarAdministradores = async () => {
    try {
      const administradoresRef = collection(db, 'Administrador')
      const administradoresSnapshot = await getDocs(query(administradoresRef))
      const administradoresData = administradoresSnapshot.docs.map(doc => ({
        Matricula: doc.id,
        Nombre: doc.data().Nombre || '',
        Apellido: doc.data().Apellido || '',
        Email: doc.data().Email || '',
        Contraseña: doc.data().Contraseña || '',
      })) as Administrador[]
      setAdministradores(administradoresData)
    } catch (error) {
      console.error('Error al cargar administradores:', error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los administradores. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { Matricula, Contraseña, ...restoDatosAdministrador } = datosAdministrador as { Matricula: string; Contraseña?: string; [key: string]: any }
      let hashedPassword: string | undefined = undefined
      
      if (!editando || (editando && Contraseña && Contraseña !== '')) {
        hashedPassword = await bcrypt.hash(Contraseña!, 10)
      }
      
      if (editando) {
        const updateData: Partial<Administrador> = { ...restoDatosAdministrador };
        if (hashedPassword) {
          updateData.Contraseña = hashedPassword;
        }
        await updateDoc(doc(db, 'Administrador', Matricula), updateData);
        await Swal.fire({
          title: "¡Éxito!",
          text: "Administrador actualizado correctamente",
          icon: "success",
        })
        setEditando(false)
      } else {
        if (!hashedPassword) {
          throw new Error("La contraseña es requerida para crear un nuevo administrador");
        }
        await setDoc(doc(db, 'Administrador', Matricula), {
          ...restoDatosAdministrador,
          Contraseña: hashedPassword
        } as Administrador);
        await Swal.fire({
          title: "¡Éxito!",
          text: "Administrador agregado correctamente",
          icon: "success",
        })
      }
      setDatosAdministrador({ Matricula: '', Nombre: '', Apellido: '', Email: '', Contraseña: '' })
      cargarAdministradores()
    } catch (error) {
      console.error('Error al agregar/actualizar administrador:', error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error al agregar/actualizar el administrador. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const eliminarAdministrador = async (matricula: string) => {
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
        await deleteDoc(doc(db, 'Administrador', matricula));
        Swal.fire({
          title: 'Eliminado!',
          text: 'El administrador ha sido eliminado.',
          icon: 'success'
        });
        cargarAdministradores();
      } catch (error) {
        console.error('Error al eliminar administrador:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Ha ocurrido un error al eliminar el administrador.',
          icon: 'error'
        });
      }
    }
  };

  const modificarAdministrador = (administrador: Administrador) => {
    setDatosAdministrador({...administrador, Contraseña: ''})
    setEditando(true)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className={`${isDarkMode ? currentColors.cardBackground : currentColors.cardBackground} h-full`}>
        <CardHeader>
          <CardTitle className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
            {editando ? 'Editar Administrador' : 'Agregar Administrador'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matriculaAdministrador" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Matrícula</Label>
              <Input
                id="matriculaAdministrador"
                value={datosAdministrador.Matricula}
                onChange={(e) => setDatosAdministrador({...datosAdministrador, Matricula: e.target.value})}
                required
                disabled={editando}
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreAdministrador" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Nombre</Label>
              <Input
                id="nombreAdministrador"
                value={datosAdministrador.Nombre}
                onChange={(e) => setDatosAdministrador({...datosAdministrador, Nombre: e.target.value})}
                required
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidoAdministrador" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Apellido</Label>
              <Input
                id="apellidoAdministrador"
                value={datosAdministrador.Apellido}
                onChange={(e) => setDatosAdministrador({...datosAdministrador, Apellido: e.target.value})}
                required
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailAdministrador" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Email</Label>
              <Input
                id="emailAdministrador"
                type="email"
                value={datosAdministrador.Email}
                onChange={(e) => setDatosAdministrador({...datosAdministrador, Email: e.target.value})}
                required
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contraseñaAdministrador" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                {editando ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
              </Label>
              <Input
                id="contraseñaAdministrador"
                type="password"
                value={datosAdministrador.Contraseña}
                onChange={(e) => setDatosAdministrador({...datosAdministrador, Contraseña: e.target.value})}
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
              {editando ? 'Actualizar Administrador' : 'Agregar Administrador'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className={`${isDarkMode ? currentColors.cardBackground : currentColors.cardBackground} h-full overflow-auto`}>
        <CardHeader>
          <CardTitle className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Lista de Administradores</CardTitle>
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
              {administradores.map((administrador) => (
                <TableRow key={administrador.Matricula}>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                    {administrador.Matricula}
                  </TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                    {administrador.Nombre}
                  </TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                    {administrador.Apellido}
                  </TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                    {administrador.Email}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => modificarAdministrador(administrador)}
                      className="mr-2"
                      size="sm"
                      variant="outline"
                      style={{ color: currentColors.buttonBlue, borderColor: currentColors.buttonBlue }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar administrador</span>
                    </Button>
                    <Button
                      onClick={() => eliminarAdministrador(administrador.Matricula)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar administrador</span>
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

