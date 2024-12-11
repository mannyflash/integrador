'use client'

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Sun, Moon } from 'lucide-react'
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface VistaHorarioProps {
  esModoOscuro: boolean;
  logAction: (action: string, details: string) => Promise<void>;
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

export default function HorarioDashboard({ esModoOscuro, logAction }: VistaHorarioProps) {
  const [periodo, setPeriodo] = useState("JULIO 2024 - ENERO 2025")
  const [horario, setHorario] = useState<DatosHorario>({})
  const [franjaSeleccionada, setFranjaSeleccionada] = useState<{dia: string, hora: string} | null>(null)
  const [modoOscuro, setModoOscuro] = useState(false)
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [materiasPorDocente, setMateriasPorDocente] = useState<Materia[]>([])
  const [mostrarTarjeta, setMostrarTarjeta] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('dark', modoOscuro)
    cargarDocentes()
    cargarMaterias()
  }, [modoOscuro])

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
      await logAction('Cargar Docentes', `Se cargaron ${listaDocentes.length} docentes`)
    } catch (error) {
      console.error('Error al cargar docentes:', error);
      await logAction('Error', `Error al cargar docentes: ${error}`)
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
      await logAction('Cargar Materias', `Se cargaron ${listaMaterias.length} materias`)
    } catch (error) {
      console.error('Error al cargar materias:', error)
      await logAction('Error', `Error al cargar materias: ${error}`)
    }
  }

  const guardarFranja = async (materiaId: string, docenteId: string) => {
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

    await logAction('Modificar Horario', `Agregada clase de ${materiaSeleccionada.NombreMateria} con ${nombreCompletoDocente} el ${franjaSeleccionada.dia} a las ${franjaSeleccionada.hora}`)

    // Close the card
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
      await logAction('Cargar Materias por Docente', `Se cargaron ${materiasList.length} materias para el docente ${docenteId}`)
    } catch (error) {
      console.error('Error al cargar materias del docente:', error)
      await logAction('Error', `Error al cargar materias del docente: ${error}`)
      setMateriasPorDocente([])
    }
  };

  const seleccionarFranja = async (dia: string, hora: string) => {
    setFranjaSeleccionada({ dia, hora })
    setMostrarTarjeta(true)
    await logAction('Seleccionar Franja', `Seleccionada franja para el ${dia} a las ${hora}`)
  }

  const renderizarFranjasHorarias = (horas: string[]) => {
    return horas.map(hora => (
      <>
        <div key={`hora-${hora}`} className={`p-2 text-center border ${
          modoOscuro ? 'border-[#2d3748] text-[#e2e8f0] bg-[#1a1f2c]' : 'border-[#98FB98] text-[#006400] bg-white'
        }`}>
          {hora}
        </div>
        {DIAS.map(dia => {
          const franja = horario[dia]?.[hora]
          return (
            <Button
              variant="outline"
              className={`h-full min-h-[80px] w-full ${
                modoOscuro 
                  ? 'border-[#2d3748] hover:bg-[#1a1f2c] bg-[#0f172a]' 
                  : 'border-[#98FB98] hover:bg-[#e6ffe6] bg-white'
              }`}
              onClick={() => seleccionarFranja(dia, hora)}
            >
              {franja ? (
                <div className="text-xs">
                  <p className={`font-semibold ${modoOscuro ? 'text-[#e2e8f0]' : 'text-[#006400]'}`}>
                    {franja.materia}
                  </p>
                  <p className={modoOscuro ? 'text-[#a0aec0]' : 'text-[#006400]'}>
                    {franja.docente}
                  </p>
                </div>
              ) : (
                <span className={modoOscuro ? 'text-[#a0aec0]' : 'text-[#006400]'}>
                  Haga clic para agregar
                </span>
              )}
            </Button>
          )
        })}
      </>
    ))
  }

  const generarPDF = async () => {
    const doc = new jsPDF('l', 'mm', 'a4')
  
    // Agregar la imagen en la esquina superior izquierda
    doc.addImage('/FondoItspp.png', 'PNG', 10, 10, 20, 20)

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
        fila.push(franja ? `${franja.materia}\n- ${franja.docente}` : '')
      })
      return fila
    })

    const dividerIndex = HORAS_MATUTINO.length
    datosTabla.splice(dividerIndex, 0, ['TURNO VESPERTINO', '', '', '', '', ''])

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
        fillColor: [144, 238, 144],
        textColor: [0, 100, 0],
        fontStyle: 'bold'
      },
      didParseCell: function(data: { row: { index: number }, cell: { styles: any } }) {
        if (data.row.index === dividerIndex) {
          data.cell.styles.fillColor = [144, 238, 144];
          data.cell.styles.textColor = [0, 100, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawCell: (data: {
        cell: {
          text: string | string[];
          x: number;
          y: number;
          width: number;
          height: number;
        };
        row: { index: number };
      }) => {
        if (data.cell.text.length > 0 && data.row.index >= 0 && data.row.index !== dividerIndex) {
          doc.setFillColor(230, 255, 230)
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F')
          doc.setTextColor(0, 100, 0)
          const [materia, docente] = data.cell.text.toString().split('\n')
          if (materia) {
            doc.setFontSize(8)
            doc.setFont("helvetica", 'bold')
            doc.text(materia, data.cell.x + data.cell.width / 2, data.cell.y + 5, {
              align: 'center'
            })
          }
          if (docente) {
            doc.setFontSize(6)
            doc.setFont("helvetica", 'normal')
            doc.text(docente, data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height - 3, {
              align: 'center',
              maxWidth: data.cell.width - 2
            })
          }
        }
      }
    })

    doc.save('horario_laboratorio.pdf')

    await logAction('Generar PDF', 'Generado PDF del horario de laboratorio')

    // Reiniciar el horario
    setHorario({})
  }

  return (
    <div className={`min-h-screen ${modoOscuro ? 'dark bg-[#0f172a]' : 'bg-[#e6ffe6]'}`}>
      <div className="container mx-auto py-6 space-y-8">
        <Card className={`border-none shadow-none ${
          modoOscuro ? 'bg-[#1a1f2c]' : 'bg-white'
        }`}>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-between items-center px-6">
              <CardTitle className={`text-2xl font-bold tracking-tight ${
                modoOscuro ? 'text-[#e2e8f0]' : 'text-[#006400]'
              }`}>
                INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Sun className={`h-4 w-4 ${modoOscuro ? 'text-[#a0aec0]' : 'text-yellow-500'}`} />
                <Switch
                  checked={modoOscuro}
                  onCheckedChange={setModoOscuro}
                  aria-label="Alternar modo oscuro"
                />
                <Moon className={`h-4 w-4 ${modoOscuro ? 'text-blue-400' : 'text-[#a0aec0]'}`} />
              </div>
            </div>
            <p className={`text-xl font-semibold ${
              modoOscuro ? 'text-[#e2e8f0]' : 'text-[#006400]'
            }`}>
              SUBDIRECCIÓN ACADÉMICA
            </p>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className={
                        modoOscuro 
                          ? 'border-[#2d3748] text-[#e2e8f0]' 
                          : 'border-[#98FB98] text-[#006400]'
                      }
                    >
                      PERIODO: {periodo}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={modoOscuro ? 'bg-[#1a1f2c] text-[#e2e8f0]' : 'bg-white text-[#006400]'}>
                    <DialogHeader>
                      <DialogTitle>Cambiar Periodo</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        id="periodo"
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className={modoOscuro ? 'bg-[#2d3748] text-[#e2e8f0]' : 'bg-white text-[#006400]'}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <p className={`text-sm font-medium ${
                  modoOscuro ? 'text-[#a0aec0]' : 'text-[#006400]'
                }`}>
                  LABORATORIO: TALLER DE PROGRAMACIÓN
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-2">
              <div className={`p-2 font-bold text-center ${
                modoOscuro ? 'bg-[#1a1f2c] text-[#e2e8f0]' : 'bg-white text-[#006400]'
              }`}>
                HORA
              </div>
              {DIAS.map(dia => (
                <div key={dia} className={`p-2 font-bold text-center ${
                  modoOscuro ? 'bg-[#1a1f2c] text-[#e2e8f0]' : 'bg-white text-[#006400]'
                }`}>
                  {dia}
                </div>
              ))}

              <div className={`col-span-6 ${
                modoOscuro ? 'bg-[#1a1f2c]/50 text-[#e2e8f0]' : 'bg-[#e6ffe6] text-[#006400]'
              } p-2 text-center font-semibold`}>
                TURNO MATUTINO
              </div>

              {renderizarFranjasHorarias(HORAS_MATUTINO)}

              <div className={`col-span-6 ${
                modoOscuro ? 'bg-[#1a1f2c] text-[#e2e8f0]' : 'bg-white text-[#006400]'
              } p-2 text-center font-semibold`}>
                TURNO VESPERTINO
              </div>

              {renderizarFranjasHorarias(HORAS_VESPERTINO)}
            </div>
          </div>
        </div>

        {mostrarTarjeta && franjaSeleccionada && (
          <Card className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96 ${
            modoOscuro ? 'bg-[#1a1f2c] text-[#e2e8f0]' : 'bg-white'
          }`}>
            <CardHeader>
              <CardTitle className={modoOscuro ? 'text-[#e2e8f0]' : 'text-[#006400]'}>
                Agregar Detalles de Clase
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  <Label htmlFor="docente" className={modoOscuro ? 'text-[#e2e8f0]' : 'text-[#006400]'}>
                    Docente
                  </Label>
                  <select
                    id="docente"
                    name="docente"
                    defaultValue=""
                    required
                    onChange={(e) => handleDocenteChange(e.target.value)}
                    className={`w-full p-2 rounded-md ${modoOscuro 
                      ? 'bg-[#2d3748] border-[#2d3748] text-[#e2e8f0]' 
                      : 'bg-white border-[#98FB98] text-[#006400]'
                    }`}
                  >
                    <option value="">Seleccione un docente</option>
                    {docentes.map(docente => (
                      <option key={docente.id} value={docente.id}>
                        {`${docente.Nombre} ${docente.Apellido}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materia" className={modoOscuro ? 'text-[#e2e8f0]' : 'text-[#006400]'}>
                    Materia
                  </Label>
                  <select
                    id="materia"
                    name="materia"
                    defaultValue=""
                    required
                    className={`w-full p-2 rounded-md ${modoOscuro 
                      ? 'bg-[#2d3748] border-[#2d3748] text-[#e2e8f0]' 
                      : 'bg-white border-[#98FB98] text-[#006400]'
                    }`}
                  >
                    <option value="">Seleccione una materia</option>
                    {materiasPorDocente.map(materia => (
                      <option key={materia.id} value={materia.id}>
                        {materia.NombreMateria}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between">
                  <Button 
                    type="submit"
                    className={modoOscuro 
                      ? 'bg-[#006400] hover:bg-[#008000] text-white' 
                      : 'bg-[#006400] hover:bg-[#008000] text-white'
                    }
                  >
                    Guardar
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setMostrarTarjeta(false)}
                    className={modoOscuro 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                    }
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button 
            onClick={generarPDF}
            className={modoOscuro 
              ? 'bg-[#006400] hover:bg-[#008000] text-white' 
              : 'bg-[#006400] hover:bg-[#008000] text-white'
            }
          >
            Generar PDF del Horario
          </Button>
        </div>
      </div>
    </div>
  )
}

