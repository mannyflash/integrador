'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Laptop, AlertTriangle, Database } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import swal from 'sweetalert'
import { colors } from '../lib/constants'
import { db } from '../pages/panel-laboratorista'

interface Equipo {
  id: string;
  fueraDeServicio: boolean;
}

export default function VistaEquipos({ esModoOscuro }: { esModoOscuro: boolean }) {
  const [equipos, setEquipos] = useState<Equipo[]>([])
  const [cantidadEquipos, setCantidadEquipos] = useState('')
  const [dialogoAbierto, setDialogoAbierto] = useState(false)

  const modoColor = esModoOscuro ? colors.dark : colors.light

  useEffect(() => {
    cargarEquipos()
  }, [])

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
      setDialogoAbierto(false)
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

  return (
    <div>
      <Card className={`mb-6 ${modoColor.cardBackground}`}>
        <CardHeader className={modoColor.headerBackground}>
          <CardTitle className={`flex items-center ${modoColor.titleText}`}>
            <Laptop className="mr-2" />
            Equipos del Laboratorio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID del Equipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipos.map((equipo) => (
                <TableRow key={equipo.id}>
                  <TableCell>{equipo.id}</TableCell>
                  <TableCell>
                    {equipo.fueraDeServicio ? (
                      <span className="text-red-500 flex items-center">
                        <AlertTriangle className="mr-2" /> Fuera de Servicio
                      </span>
                    ) : (
                      <span className="text-green-500">En Servicio</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => toggleFueraDeServicio(equipo.id)}
                      variant={equipo.fueraDeServicio ? "destructive" : "default"}
                      className={equipo.fueraDeServicio ? modoColor.buttonGreen : modoColor.buttonBlue}
                    >
                      {equipo.fueraDeServicio ? "Poner en Servicio" : "Marcar Fuera de Servicio"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogTrigger asChild>
          <Button className={`mb-4 ${modoColor.buttonGreen}`}>
            <Database className="mr-2" /> Agregar Equipos
          </Button>
        </DialogTrigger>
        <DialogContent className={modoColor.cardBackground}>
          <DialogHeader>
            <DialogTitle className={modoColor.titleText}>Agregar Nuevos Equipos</DialogTitle>
          </DialogHeader>
          <form onSubmit={agregarEquipos} className="space-y-4">
            <div>
              <Label htmlFor="cantidadEquipos" className={modoColor.descriptionText}>Cantidad de Equipos</Label>
              <Input
                id="cantidadEquipos"
                type="number"
                value={cantidadEquipos}
                onChange={(e) => setCantidadEquipos(e.target.value)}
                placeholder="Ingrese la cantidad de equipos"
                required
                className={`${modoColor.inputBackground} ${modoColor.inputBorder} ${modoColor.inputText}`}
              />
            </div>
            <Button type="submit" className={modoColor.buttonGreen}>Agregar Equipos</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

