'use client'

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sun, Moon } from 'lucide-react'
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../pages/panel-laboratorista'
import { colors } from '../lib/constants'

interface FranjaHoraria {
  hora: string
  materia?: string
  docente?: string
}

interface DatosHorario {
  [key: string]: {
    [key: string]: FranjaHoraria
  }
}

interface Docente {
  id: string
  Nombre: string
  Apellido: string
}

interface Materia {
  id: string
  NombreMateria: string
}

const DIAS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES"]
const HORAS_MATUTINO = [
  "7:00-8:00", "8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00",
  "12:00-13:00", "13:00-14:00"
]
const HORAS_VESPERTINO = [
  "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00",
  "19:00-20:00", "20:00-21:00", "21:00-22:00"
]

export default function VistaHorario({ esModoOscuro }: { esModoOscuro: boolean }) {
  const [periodo, setPeriodo] = useState("JULIO 2024 - ENERO 2025")
  const [horario, setHorario] = useState<DatosHorario>({})
  const [franjaSeleccionada, setFranjaSeleccionada] = useState<{dia: string, hora: string} | null>(null)
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [materiasPorDocente, setMateriasPorDocente] = useState<Materia[]>([])
  const [mostrarTarjeta, setMostrarTarjeta] = useState(false)

  useEffect(() => {
    cargarDocentes()
    cargarMaterias()
  }, [])

  const cargarDocentes = async () => {
    try {
      const docentesRef = collection(db, 'Docentes');
      const docentesSnapshot = await getDocs(docentesRef);
      const listaDocentes = docentesSnapshot.docs.map((docSnapshot) => {
        const docenteData = docSnapshot.data();
        return { 
          id: docSnapshot.id, 
          Nombre: docenteData.Nombre, 
          Apellido: docenteData.Apellido
        } as Docente;
      });
      setDocentes(listaDocentes);
    } catch (error) {
      console.error('Error al cargar docentes:', error);
    }
  };

  const cargarMaterias = async () => {
    try {
      const materiasRef = collection(db, 'Materias')
      const materiasSnapshot = await getDocs(materiasRef)
      const listaMaterias = materiasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Materia[]
      setMaterias(listaMaterias)
    } catch (error) {
      console.error('Error al cargar materias:', error)
    }
  }

  const guardarFranja = (materiaId: string, docenteId: string) => {
    if (!franjaSeleccionada) return

    const docenteSeleccionado = docentes.find(d => d.id === docenteId)
    const materiaSeleccionada = materiasPorDocente.find(m => m.id === materiaId)
    
    if (!docenteSeleccionado || !materiaSeleccionada) return

    const nombreCompletoDocente = `${docenteSeleccionado.Nombre} ${docenteSeleccionado.Apellido}`

    setHorario(prevHorario => ({
      ...prevHorario,
      [franjaSeleccionada.dia]: {
        ...prevHorario[franjaSeleccionada.dia],
        [franjaSeleccionada.hora]: {
          hora: franjaSeleccionada.hora,
          materia: materiaSeleccionada.NombreMateria,
          docente: nombreCompletoDocente
        }
      }
    }))

    setMostrarTarjeta(false)
    setFranjaSeleccionada(null)
  }

  const handleDocenteChange = async (docenteId: string) => {
    try {
      const materiasRef = collection(db, 'Materias');
      const materiasQuery = query(materiasRef, where('MaestroID', '==', docenteId));
      const materiasSnapshot = await getDocs(materiasQuery);
      const materiasList = materiasSnapshot.docs.map(doc => ({
        id: doc.id,
        NombreMateria: doc.data().NombreMateria
      }));
      setMateriasPorDocente(materiasList);
    } catch (error) {
      console.error('Error al cargar materias del docente:', error);
      setMateriasPorDocente([]);
    }
  };

  const seleccionarFranja = (dia: string, hora: string) => {
    setFranjaSeleccionada({ dia, hora })
    setMostrarTarjeta(true)
  }

  const renderizarFranjasHorarias = (horas: string[]) => {
    return horas.map(hora => (
      <TableRow key={hora}>
        <TableCell className="font-medium">{hora}</TableCell>
        {DIAS.map(dia => {
          const franja = horario[dia]?.[hora]
          return (
            <TableCell key={`${dia}-${hora}`} className="p-0">
              <Button
                variant="outline"
                className={`h-full min-h-[80px] w-full ${
                  esModoOscuro 
                    ? 'border-gray-700 hover:bg-gray-800' 
                    : 'border-green-200 hover:bg-green-50'
                }`}
                onClick={() => seleccionarFranja(dia, hora)}
              >
                {franja ? (
                  <div className="text-xs">
                    <p className="font-semibold">{franja.materia}</p>
                    <p>{franja.docente}</p>
                  </div>
                ) : (
                  <span>Agregar</span>
                )}
              </Button>
            </TableCell>
          )
        })}
      </TableRow>
    ))
  }

  const generarPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4')
    
    doc.setFontSize(16)
    doc.text('INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO', 149, 20, { align: 'center' })
    doc.setFontSize(14)
    doc.text('SUBDIRECCIÓN ACADÉMICA', 149, 30, { align: 'center' })
    doc.text(`PERIODO: ${periodo}`, 149, 40, { align: 'center' })
    doc.text('LABORATORIO: TALLER DE PROGRAMACIÓN', 149, 50, { align: 'center' })

    const datosTabla = [...HORAS_MATUTINO, ...HORAS_VESPERTINO].map(hora => {
      const fila = [hora]
      DIAS.forEach(dia => {
        const franja = horario[dia]?.[hora]
        fila.push(franja ? `${franja.materia}\n${franja.docente}` : '')
      })
      return fila
    })

    doc.autoTable({
      startY: 60,
      head: [['HORA', ...DIAS]],
      body: datosTabla,
      theme: 'grid',
      styles: {
        cellPadding: 2,
        fontSize: 8,
        valign: 'middle',
        halign: 'center'
      },
      headStyles: {
        fillColor: [0, 100, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      didDrawCell: (data: { cell: { text: string | any[]; x: number; y: number; width: number; height: number }; row: { index: number } }) => {
        if (data.cell.text.length > 0 && data.row.index >= 0) {
          doc.setFillColor(230, 255, 230)
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F')
          doc.setTextColor(0, 100, 0)
          doc.text(data.cell.text.toString(), data.cell.x + data.cell.width / 2, data.cell.y + 5, {
            align: 'center'
          })
        }
      }
    })

    doc.save('horario_laboratorio.pdf')
  }

  const modoColor = esModoOscuro ? colors.dark : colors.light

  return (
    <div className="space-y-6">
      <Card className={modoColor.cardBackground}>
        <CardHeader>
          <CardTitle className={`text-2xl font-bold ${modoColor.titleText}`}>
            Horario del Laboratorio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              onClick={() => {
                const newPeriod = prompt("Ingrese el nuevo periodo:", periodo);
                if (newPeriod) setPeriodo(newPeriod);
              }}
              className={modoColor.buttonBlue}
            >
              PERIODO: {periodo}
            </Button>
            <p className={`text-sm font-medium ${modoColor.descriptionText}`}>
              LABORATORIO: TALLER DE PROGRAMACIÓN
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HORA</TableHead>
                  {DIAS.map(dia => (
                    <TableHead key={dia}>{dia}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className={`text-center font-semibold ${modoColor.titleText}`}>
                    TURNO MATUTINO
                  </TableCell>
                </TableRow>
                {renderizarFranjasHorarias(HORAS_MATUTINO)}
                <TableRow>
                  <TableCell colSpan={6} className={`text-center font-semibold ${modoColor.titleText}`}>
                    TURNO VESPERTINO
                  </TableCell>
                </TableRow>
                {renderizarFranjasHorarias(HORAS_VESPERTINO)}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-center">
            <Button onClick={generarPDF} className={modoColor.buttonGreen}>
              Generar PDF del Horario
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={mostrarTarjeta} onOpenChange={setMostrarTarjeta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Detalles de Clase</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              guardarFranja(
                formData.get("materia") as string,
                formData.get("docente") as string
              )
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="docente">Docente</Label>
              <Select onValueChange={handleDocenteChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un docente" />
                </SelectTrigger>
                <SelectContent>
                  {docentes.map(docente => (
                    <SelectItem key={docente.id} value={docente.id}>
                      {`${docente.Nombre} ${docente.Apellido}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="materia">Materia</Label>
              <Select name="materia">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una materia" />
                </SelectTrigger>
                <SelectContent>
                  {materiasPorDocente.map(materia => (
                    <SelectItem key={materia.id} value={materia.id}>
                      {materia.NombreMateria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-between">
              <Button type="submit" className={modoColor.buttonGreen}>
                Guardar
              </Button>
              <Button type="button" onClick={() => setMostrarTarjeta(false)} variant="destructive">
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

