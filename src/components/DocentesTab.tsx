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

interface Docente {
  Matricula: string;
  Nombre: string;
  Apellido: string;
  Email: string;
  Contraseña: string;
  Departamento: string;
  [key: string]: any;
}

export function DocentesTab({ db, isDarkMode, currentColors }: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [datosDocente, setDatosDocente] = useState<Docente>({
    Matricula: '',
    Nombre: '',
    Apellido: '',
    Email: '',
    Contraseña: '',
    Departamento: ''
  })
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    cargarDocentes()
  }, [])

  const cargarDocentes = async () => {
    try {
      const docentesRef = collection(db, 'Docentes')
      const docentesSnapshot = await getDocs(query(docentesRef))
      const docentesData = docentesSnapshot.docs.map(doc => ({
        Matricula: doc.id,
        Nombre: doc.data().Nombre || '',
        Apellido: doc.data().Apellido || '',
        Email: doc.data().Email || '',
        Contraseña: doc.data().Contraseña || '',
        Departamento: doc.data().Departamento || '',
        ...doc.data()
      })) as Docente[]
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
      const { Matricula, Contraseña, ...restoDatosDocente } = datosDocente
      
      if (!editando) {
        // Check if the matricula already exists when adding a new teacher
        const docenteDoc = doc(db, 'Docentes', Matricula)
        const docenteSnapshot = await getDoc(docenteDoc)

        if (docenteSnapshot.exists()) {
          await Swal.fire({
            title: "Error",
            text: "Esta matrícula ya existe. Por favor, use una matrícula diferente.",
            icon: "error",
          })
          return
        }

        if (!Contraseña) {
          throw new Error("La contraseña es requerida para nuevos docentes")
        }
        const hashedPassword = await bcrypt.hash(Contraseña, 10)
        await setDoc(docenteDoc, { ...restoDatosDocente, Contraseña: hashedPassword })
        await Swal.fire({
          title: "¡Éxito!",
          text: "Docente agregado correctamente",
          icon: "success",
        })
      } else {
        const updateData = { ...restoDatosDocente }
        if (Contraseña) {
          updateData.Contraseña = await bcrypt.hash(Contraseña, 10)
        }
        await updateDoc(doc(db, 'Docentes', Matricula), updateData)
        await Swal.fire({
          title: "¡Éxito!",
          text: "Docente actualizado correctamente",
          icon: "success",
        })
        setEditando(false)
      }
      setDatosDocente({ Matricula: '', Nombre: '', Apellido: '', Email: '', Contraseña: '', Departamento: '' })
      cargarDocentes()
    } catch (error) {
      console.error('Error al agregar/actualizar docente:', error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error al agregar/actualizar el docente. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const eliminarDocente = async (matricula: string) => {
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
        await deleteDoc(doc(db, 'Docentes', matricula));
        Swal.fire(
          'Eliminado!',
          'El docente ha sido eliminado.',
          'success'
        );
        cargarDocentes();
      } catch (error) {
        console.error('Error al eliminar docente:', error);
        Swal.fire(
          'Error!',
          'Ha ocurrido un error al eliminar el docente.',
          'error'
        );
      }
    }
  };

  const modificarDocente = (docente: Docente) => {
    setDatosDocente({...docente, Contraseña: ''})
    setEditando(true)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className={`${isDarkMode ? currentColors.cardBackground : currentColors.cardBackground} h-full`}>
        <CardHeader>
          <CardTitle className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
            {editando ? 'Editar Docente' : 'Agregar Docente'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="matriculaDocente" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Matrícula</Label>
              <Input
                id="matriculaDocente"
                value={datosDocente.Matricula}
                onChange={(e) => setDatosDocente({...datosDocente, Matricula: e.target.value})}
                required
                disabled={editando}
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreDocente" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Nombre</Label>
              <Input
                id="nombreDocente"
                value={datosDocente.Nombre}
                onChange={(e) => setDatosDocente({...datosDocente, Nombre: e.target.value})}
                required
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidoDocente" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Apellido</Label>
              <Input
                id="apellidoDocente"
                value={datosDocente.Apellido}
                onChange={(e) => setDatosDocente({...datosDocente, Apellido: e.target.value})}
                required
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailDocente" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Email</Label>
              <Input
                id="emailDocente"
                type="email"
                value={datosDocente.Email}
                onChange={(e) => setDatosDocente({...datosDocente, Email: e.target.value})}
                required
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contraseñaDocente" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                {editando ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
              </Label>
              <Input
                id="contraseñaDocente"
                type="password"
                value={datosDocente.Contraseña}
                onChange={(e) => setDatosDocente({...datosDocente, Contraseña: e.target.value})}
                required={!editando}
                className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departamentoDocente" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Departamento</Label>
              <select
                id="departamentoDocente"
                value={datosDocente.Departamento}
                onChange={(e) => setDatosDocente({...datosDocente, Departamento: e.target.value})}
                required
                className={`w-full p-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
              >
                <option value="">Seleccione un departamento</option>
                <option value="Ingeniería en Sistemas Computacionales">Ingeniería en Sistemas Computacionales</option>
                <option value="Ingeniería Civil">Ingeniería Civil</option>
                <option value="Ingeniería Industrial">Ingeniería Industrial</option>
                <option value="Licenciatura en Administración">Licenciatura en Administración</option>
              </select>
            </div>
            <Button 
              type="submit" 
              className={`w-full h-8 px-1 py-0 text-xs font-tall transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                isDarkMode ? currentColors.buttonGreen : currentColors.buttonGreen
              }`}
            >
              {editando ? 'Actualizar Docente' : 'Agregar Docente'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className={`${isDarkMode ? currentColors.cardBackground : currentColors.cardBackground} h-full overflow-auto`}>
        <CardHeader>
          <CardTitle className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Lista de Docentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Matrícula</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Nombre</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Apellido</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Email</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Departamento</TableHead>
                <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docentes.map((docente) => (
                <TableRow key={docente.Matricula}>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>{docente.Matricula}</TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>{docente.Nombre}</TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>{docente.Apellido}</TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>{docente.Email}</TableCell>
                  <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>{docente.Departamento}</TableCell>
                  <TableCell>
                    <Button
                      onClick={() => modificarDocente(docente)}
                      className="mr-2"
                      size="sm"
                      variant="outline"
                      style={{ color: currentColors.buttonBlue, borderColor: currentColors.buttonBlue }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar docente</span>
                    </Button>
                    <Button
                      onClick={() => eliminarDocente(docente.Matricula)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar docente</span>
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

