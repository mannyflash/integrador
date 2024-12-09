'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../pages/panel-laboratorista'
import { toast } from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface VistaMaestroInvitadoProps {
  esModoOscuro: boolean;
}

interface Maestro {
  id: string;
  Nombre: string;
  Apellido: string;
  Departamento: string;
}

interface Materia {
  id: string;
  NombreMateria: string;
  MaestroID: string;
  Semestre: string;
}

export default function VistaMaestroInvitado({ esModoOscuro }: VistaMaestroInvitadoProps) {
  const [departamento, setDepartamento] = useState('')
  const [maestroSeleccionado, setMaestroSeleccionado] = useState('')
  const [nombreMaestroSeleccionado, setNombreMaestroSeleccionado] = useState('')
  const [materia, setMateria] = useState('')
  const [practica, setPractica] = useState('')
  const [grupo, setGrupo] = useState('')
  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const router = useRouter()

  useEffect(() => {
    const cargarMaestrosPorDepartamento = async () => {
      if (!departamento) {
        setMaestros([])
        return
      }

      try {
        const maestrosQuery = query(
          collection(db, 'Docentes'),
          where('Departamento', '==', departamento)
        )
        const querySnapshot = await getDocs(maestrosQuery)
        const maestrosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Maestro))
        setMaestros(maestrosData)
      } catch (error) {
        console.error('Error al cargar maestros:', error)
        toast.error('Error al cargar la lista de maestros')
      }
    }
    cargarMaestrosPorDepartamento()
  }, [departamento])

  useEffect(() => {
    const cargarMaterias = async () => {
      if (!maestroSeleccionado) {
        setMaterias([])
        return
      }

      try {
        const materiasQuery = query(
          collection(db, 'Materias'),
          where('MaestroID', '==', maestroSeleccionado)
        )
        const querySnapshot = await getDocs(materiasQuery)
        const materiasData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Materia))
        setMaterias(materiasData)

        const maestroSeleccionadoData = maestros.find(m => m.id === maestroSeleccionado)
        if (maestroSeleccionadoData) {
          setNombreMaestroSeleccionado(`${maestroSeleccionadoData.Nombre} ${maestroSeleccionadoData.Apellido}`)
        }
      } catch (error) {
        console.error('Error al cargar materias:', error)
        toast.error('Error al cargar las materias')
      }
    }
    cargarMaterias()
  }, [maestroSeleccionado, maestros])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!departamento || !maestroSeleccionado || !materia || !practica || !grupo) {
      toast.error('Por favor, complete todos los campos')
      return
    }

    try {
      const docRef = await addDoc(collection(db, 'ClassInformation'), {
        maestroNombre: nombreMaestroSeleccionado,
        maestroId: maestroSeleccionado,
        departamento,
        materia,
        practica,
        grupo,
        fecha: new Date().toLocaleDateString(),
        horaInicio: new Date().toLocaleTimeString(),
        totalAsistencias: 0,
        alumnos: []
      })

      const nombreCompletoDocente = `${nombreMaestroSeleccionado}`;

      localStorage.setItem('claseInfo', JSON.stringify({
        maestroNombre: nombreMaestroSeleccionado,
        maestroId: maestroSeleccionado,
        departamento,
        materia,
        practica,
        grupo,
        fecha: new Date().toLocaleDateString(),
        horaInicio: new Date().toLocaleTimeString(),
        nombreCompletoDocente,
      }))

      toast.success('Clase iniciada con éxito')
      router.push('/lista-asistencias')
    } catch (error) {
      console.error('Error al iniciar la clase:', error)
      toast.error('Error al iniciar la clase')
    }
  }

  return (
    <Card className={esModoOscuro ? 'bg-gray-800 text-white' : 'bg-white'}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Iniciar Clase como Maestro Invitado</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="departamento">Departamento</Label>
            <Select value={departamento} onValueChange={setDepartamento}>
              <SelectTrigger className={esModoOscuro ? 'bg-gray-700 text-white' : ''}>
                <SelectValue placeholder="Seleccione un departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ingeniería Industrial">Ingeniería Industrial</SelectItem>
                <SelectItem value="Ingeniería Civil">Ingeniería Civil</SelectItem>
                <SelectItem value="Ingeniería en Sistemas Computacionales">Ingeniería en Sistemas Computacionales</SelectItem>
                <SelectItem value="Licenciatura en Administración">Licenciatura en Administración</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="maestro">Seleccionar Maestro</Label>
            <Select value={maestroSeleccionado} onValueChange={setMaestroSeleccionado}>
              <SelectTrigger className={esModoOscuro ? 'bg-gray-700 text-white' : ''}>
                <SelectValue placeholder="Seleccione un maestro" />
              </SelectTrigger>
              <SelectContent>
                {maestros.map((maestro) => (
                  <SelectItem key={maestro.id} value={maestro.id}>
                    {`${maestro.Nombre} ${maestro.Apellido}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="materia">Materia</Label>
            <Select value={materia} onValueChange={setMateria}>
              <SelectTrigger className={esModoOscuro ? 'bg-gray-700 text-white' : ''}>
                <SelectValue placeholder="Seleccione una materia" />
              </SelectTrigger>
              <SelectContent>
                {materias.map((mat) => (
                  <SelectItem key={mat.id} value={mat.NombreMateria}>
                    {`${mat.NombreMateria} (Semestre ${mat.Semestre})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="practica">Práctica</Label>
            <Input
              id="practica"
              value={practica}
              onChange={(e) => setPractica(e.target.value)}
              placeholder="Ingrese la práctica"
              className={esModoOscuro ? 'bg-gray-700 text-white' : ''}
            />
          </div>
          <div>
            <Label htmlFor="grupo">Grupo</Label>
            <Input
              id="grupo"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              placeholder="Ingrese el grupo"
              className={esModoOscuro ? 'bg-gray-700 text-white' : ''}
            />
          </div>
          <Button type="submit" className="w-full">
            Iniciar Clase
          </Button>
        </form>
      </CardContent>
      <Toaster position="bottom-right" />
    </Card>
  )
}
