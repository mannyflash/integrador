"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../pages/panel-laboratorista" // Importamos la instancia de Firestore

// Definición de tipos
interface FranjaHoraria {
  materia: string
  docente: string
}

interface Horario {
  [dia: string]: {
    [hora: string]: FranjaHoraria
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
  MaestroID?: string
  DocenteId?: string
}

// Definición de colores
const colors = {
  light: {
    primary: "#800040", // Guinda/vino como color principal en modo claro
    secondary: "#1d5631", // Verde oscuro como color secundario
    tertiary: "#74726f", // Gris para elementos terciarios
    background: "#fff0f5", // Fondo con tono rosado muy suave
    cardBackground: "bg-white",
    headerBackground: "bg-gradient-to-r from-[#800040] to-[#a30050]",
    titleText: "text-[#800040]",
    descriptionText: "text-[#800040]/80",
    hoverBackground: "hover:bg-[#fff0f5]",
    buttonPrimary: "bg-[#800040] hover:bg-[#5c002e] text-white",
    buttonSecondary: "bg-[#1d5631] hover:bg-[#153d23] text-white",
    buttonTertiary: "bg-[#74726f] hover:bg-[#5a5856] text-white",
    countBackground: "bg-[#fff0f5]",
    countText: "text-[#800040]",
    inputBackground: "bg-[#f8f8f8]",
    inputBorder: "border-[#800040]/30",
    inputText: "text-[#800040]",
    switchBackground: "bg-[#800040]/20",
    switchToggle: "bg-white",
    grayText: "text-[#74726f]",
    grayBorder: "border-[#74726f]",
    grayBackground: "bg-[#f0f0f0]",
  },
  dark: {
    primary: "#1d5631", // Verde oscuro como color principal en modo oscuro
    secondary: "#800040", // Guinda/vino como color secundario
    tertiary: "#74726f", // Gris para elementos terciarios
    background: "#0c1f15", // Fondo verde muy oscuro
    cardBackground: "bg-[#2a2a2a]",
    headerBackground: "bg-gradient-to-r from-[#1d5631] to-[#2a7a45]",
    titleText: "text-white",
    descriptionText: "text-gray-300",
    hoverBackground: "hover:bg-[#153d23]",
    buttonPrimary: "bg-[#1d5631] hover:bg-[#153d23] text-white",
    buttonSecondary: "bg-[#800040] hover:bg-[#5c002e] text-white",
    buttonTertiary: "bg-[#74726f] hover:bg-[#5a5856] text-white",
    countBackground: "bg-[#1d5631]/20",
    countText: "text-[#2a7a45]",
    inputBackground: "bg-[#3a3a3a]",
    inputBorder: "border-[#1d5631]/30",
    inputText: "text-white",
    switchBackground: "bg-[#1d5631]/20",
    switchToggle: "bg-[#1d5631]",
    grayText: "text-[#a0a0a0]",
    grayBorder: "border-[#74726f]",
    grayBackground: "bg-[#3a3a3a]",
  },
}

const DIAS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES"]
const HORAS_MATUTINO = ["7:00 - 8:00", "8:00 - 9:00", "9:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00"]
const HORAS_VESPERTINO = [
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
  "18:00 - 19:00",
]

// Actualizar la interfaz VistaHorarioProps para incluir esModoOscuro
interface VistaHorarioProps {
  esModoOscuro: boolean
  logAction: (action: string, details: string) => Promise<void>
}

// Modificar la definición del componente para usar esModoOscuro como prop
const VistaHorario: React.FC<VistaHorarioProps> = ({ esModoOscuro, logAction }) => {
  const [horario, setHorario] = useState<Horario>({})
  const [mostrarTarjeta, setMostrarTarjeta] = useState(false)
  const [franjaSeleccionada, setFranjaSeleccionada] = useState<{
    dia: string
    hora: string
  } | null>(null)
  const [periodo, setPeriodo] = useState("AGOSTO - DICIEMBRE 2024")
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [materiasPorDocente, setMateriasPorDocente] = useState<Materia[]>([])
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const cargarDocentes = async () => {
      try {
        // Obtener docentes desde Firestore
        const docentesRef = collection(db, "Docentes")
        const docentesSnapshot = await getDocs(docentesRef)
        const docentesData = docentesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Docente[]

        setDocentes(docentesData)
      } catch (error) {
        console.error("Error al cargar los docentes:", error)
        toast({
          title: "Error al cargar los docentes",
          description: "Hubo un problema al obtener la lista de docentes. Por favor, inténtelo de nuevo más tarde.",
          variant: "destructive",
        })
      }
    }

    cargarDocentes()
  }, [toast])

  const handleDocenteChange = async (docenteId: string) => {
    setDocenteSeleccionado(docenteId)

    try {
      // Obtener materias del docente seleccionado desde Firestore
      const materiasRef = collection(db, "Materias")
      const materiasQuery = query(materiasRef, where("MaestroID", "==", docenteId))
      const materiasSnapshot = await getDocs(materiasQuery)

      const materiasData = materiasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Materia[]

      setMateriasPorDocente(materiasData)
    } catch (error) {
      console.error("Error al cargar las materias:", error)
      toast({
        title: "Error al cargar las materias",
        description: "Hubo un problema al obtener las materias del docente. Por favor, inténtelo de nuevo más tarde.",
        variant: "destructive",
      })
    }
  }

  const seleccionarFranja = (dia: string, hora: string) => {
    setFranjaSeleccionada({ dia, hora })
    setMostrarTarjeta(true)
  }

  const guardarFranja = (materia: string, docente: string) => {
    if (!franjaSeleccionada) return

    setHorario((prevHorario) => {
      const { dia, hora } = franjaSeleccionada
      return {
        ...prevHorario,
        [dia]: {
          ...prevHorario[dia],
          [hora]: {
            materia: materiasPorDocente.find((m) => m.id === materia)?.NombreMateria || "Materia no encontrada",
            docente:
              docentes.find((d) => d.id === docente)?.Nombre + " " + docentes.find((d) => d.id === docente)?.Apellido ||
              "Docente no encontrado",
          },
        },
      }
    })

    setMostrarTarjeta(false)
    setFranjaSeleccionada(null)
  }

  const generarPDF = async () => {
    const doc = new jsPDF("l", "mm", "a4")
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 10

    // Agregar la imagen en la esquina superior izquierda
    doc.addImage("/FondoItspp.png", "PNG", margin, margin, 25, 25)

    // Agregar encabezado centrado
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0) // Color de texto negro
    doc.text("INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO", pageWidth / 2, margin + 10, { align: "center" })
    doc.setFontSize(14)
    doc.text("SUBDIRECCIÓN ACADÉMICA", pageWidth / 2, margin + 20, { align: "center" })
    doc.text(`PERIODO: ${periodo}`, pageWidth / 2, margin + 30, { align: "center" })
    doc.text("LABORATORIO: TALLER DE PROGRAMACIÓN", pageWidth / 2, margin + 40, { align: "center" })

    const datosTabla = [...HORAS_MATUTINO, ...HORAS_VESPERTINO].map((hora) => {
      const fila = [hora]
      DIAS.forEach((dia) => {
        const franja = horario[dia]?.[hora]
        fila.push(franja ? `${franja.materia}\n- ${franja.docente}` : "")
      })
      return fila
    })

    const dividerIndex = HORAS_MATUTINO.length
    datosTabla.splice(dividerIndex, 0, ["TURNO VESPERTINO", "", "", "", "", ""])

    doc.autoTable({
      startY: 60,
      head: [["HORA", ...DIAS]],
      body: datosTabla,
      theme: "grid",
      styles: {
        cellPadding: 2,
        fontSize: 8,
        valign: "middle",
        halign: "center",
      },
      headStyles: {
        fillColor: [128, 0, 64], // Color guinda/vino
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      didParseCell: (data: { row: { index: number }; cell: { styles: any } }) => {
        if (data.row.index === dividerIndex) {
          data.cell.styles.fillColor = [128, 0, 64] // Color guinda/vino
          data.cell.styles.textColor = [255, 255, 255]
          data.cell.styles.fontStyle = "bold"
        }
      },
      didDrawCell: (data: {
        cell: {
          text: string | string[]
          x: number
          y: number
          width: number
          height: number
        }
        row: { index: number }
      }) => {
        if (data.cell.text.length > 0 && data.row.index >= 0 && data.row.index !== dividerIndex) {
          doc.setFillColor(255, 240, 245) // Color de fondo rosado muy suave
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F")
          doc.setTextColor(128, 0, 64) // Color guinda/vino
          const [materia, docente] = data.cell.text.toString().split("\n")
          if (materia) {
            doc.setFontSize(7)
            doc.setFont("helvetica", "bold")
            doc.text(materia, data.cell.x + data.cell.width / 2, data.cell.y + 5, {
              align: "center",
              maxWidth: data.cell.width - 4,
            })
          }
          if (docente) {
            doc.setFontSize(6)
            doc.setFont("helvetica", "normal")
            doc.text(docente.replace("- ", ""), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height - 3, {
              align: "center",
              maxWidth: data.cell.width - 4,
            })
          }
        }
      },
    })

    // Agregar pie de página con firmas
    const finalY = (doc as any).lastAutoTable.finalY || 220
    // Eliminar las siguientes lineas
    // const signatureY = finalY + 20

    // Líneas de firma
    // Eliminar las siguientes lineas
    // doc.line(margin, signatureY, margin + 70, signatureY)
    // doc.text("FIRMA DOCENTE", margin + 35, signatureY + 5, { align: "center" })

    // doc.line(pageWidth - margin - 70, signatureY, pageWidth - margin, signatureY)
    // doc.text("FIRMA ENCARGADO LABORATORIO", pageWidth - margin - 35, signatureY + 5, { align: "center" })

    // Guardar el PDF con nombre formateado
    const fechaActual = new Date().toLocaleDateString().replace(/\//g, "-")
    doc.save(`horario_laboratorio_${fechaActual}.pdf`)

    await logAction("Generar PDF", "Generado PDF del horario de laboratorio")

    // Reiniciar el horario
    setHorario({})
  }

  const renderizarFranjasHorarias = (horas: string[]) => {
    return horas.map((hora) => (
      <>
        <div
          key={`hora-${hora}`}
          className={`p-2 text-center border ${
            esModoOscuro ? "border-gray-700 text-white bg-[#1d5631]/10" : "border-[#800040]/20 text-[#800040] bg-white"
          }`}
        >
          {hora}
        </div>
        {DIAS.map((dia) => {
          const franja = horario[dia]?.[hora]
          return (
            <Button
              key={`${dia}-${hora}`}
              variant="outline"
              className={`h-full min-h-[80px] w-full p-1 ${
                esModoOscuro
                  ? "border-gray-700 hover:bg-[#1d5631]/20 bg-[#1d5631]/10"
                  : "border-[#800040]/20 hover:bg-[#fff0f5] bg-white"
              }`}
              onClick={() => seleccionarFranja(dia, hora)}
            >
              {franja ? (
                <div className="text-xs w-full flex flex-col items-center justify-center">
                  <p className={`font-semibold mb-1 text-center ${esModoOscuro ? "text-white" : "text-[#800040]"}`}>
                    {franja.materia}
                  </p>
                  <div className={`text-center ${esModoOscuro ? "text-gray-300" : "text-[#800040]/80"}`}>
                    {franja.docente}
                  </div>
                </div>
              ) : (
                <span className={esModoOscuro ? "text-gray-400" : "text-[#800040]/60"}>Haga clic para agregar</span>
              )}
            </Button>
          )
        })}
      </>
    ))
  }

  return (
    <div className={`min-h-screen ${esModoOscuro ? "dark bg-[#0c1f15]" : "bg-[#fff0f5]"}`}>
      <div className="container mx-auto py-6 space-y-8">
        <Card
          className={`border-none shadow-lg ${esModoOscuro ? colors.dark.cardBackground : colors.light.cardBackground}`}
        >
          <CardHeader
            className={`text-center space-y-4 ${
              esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground
            }`}
          >
            <div className="flex justify-between items-center px-6">
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                INSTITUTO TECNOLÓGICO SUPERIOR DE PUERTO PEÑASCO
              </CardTitle>
            </div>
            <p className="text-xl font-semibold text-white">SUBDIRECCIÓN ACADÉMICA</p>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-white/20 text-white hover:bg-white/30">
                      PERIODO: {periodo}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={esModoOscuro ? "bg-[#1d5631]/20 text-white" : "bg-white text-[#800040]"}>
                    <DialogHeader>
                      <DialogTitle>Cambiar Periodo</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        id="periodo"
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className={
                          esModoOscuro
                            ? colors.dark.inputBackground + " " + colors.dark.inputBorder + " " + colors.dark.inputText
                            : colors.light.inputBackground +
                              " " +
                              colors.light.inputBorder +
                              " " +
                              colors.light.inputText
                        }
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <p className="text-sm font-medium text-white">LABORATORIO: TALLER DE PROGRAMACIÓN</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-2">
              <div
                className={`p-2 font-bold text-center ${
                  esModoOscuro ? "bg-[#1d5631]/20 text-white" : "bg-[#800040] text-white"
                }`}
              >
                HORA
              </div>
              {DIAS.map((dia) => (
                <div
                  key={dia}
                  className={`p-2 font-bold text-center ${
                    esModoOscuro ? "bg-[#1d5631]/20 text-white" : "bg-[#800040] text-white"
                  }`}
                >
                  {dia}
                </div>
              ))}

              <div
                className={`col-span-6 ${
                  esModoOscuro ? "bg-[#1d5631]/50 text-white" : "bg-[#800040]/80 text-white"
                } p-2 text-center font-semibold`}
              >
                TURNO MATUTINO
              </div>

              {renderizarFranjasHorarias(HORAS_MATUTINO)}

              <div
                className={`col-span-6 ${
                  esModoOscuro ? "bg-[#1d5631]/50 text-white" : "bg-[#800040]/80 text-white"
                } p-2 text-center font-semibold`}
              >
                TURNO VESPERTINO
              </div>

              {renderizarFranjasHorarias(HORAS_VESPERTINO)}
            </div>
          </div>
        </div>

        {mostrarTarjeta && franjaSeleccionada && (
          <Card
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-96 ${
              esModoOscuro ? colors.dark.cardBackground : colors.light.cardBackground
            }`}
          >
            <CardHeader className={esModoOscuro ? colors.dark.headerBackground : colors.light.headerBackground}>
              <CardTitle className="text-white">Agregar Detalles de Clase</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  guardarFranja(formData.get("materia") as string, formData.get("docente") as string)
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="docente" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                    Docente
                  </Label>
                  <select
                    id="docente"
                    name="docente"
                    defaultValue=""
                    required
                    onChange={(e) => handleDocenteChange(e.target.value)}
                    className={`w-full p-2 rounded-md ${
                      esModoOscuro
                        ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                        : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                    }`}
                  >
                    <option value="">Seleccione un docente</option>
                    {docentes.map((docente) => (
                      <option key={docente.id} value={docente.id}>
                        {`${docente.Nombre} ${docente.Apellido}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materia" className={esModoOscuro ? "text-white" : "text-[#800040]"}>
                    Materia
                  </Label>
                  <select
                    id="materia"
                    name="materia"
                    defaultValue=""
                    required
                    className={`w-full p-2 rounded-md ${
                      esModoOscuro
                        ? "bg-[#3a3a3a] border-[#1d5631]/30 text-white"
                        : "bg-[#f8f8f8] border-[#800040]/30 text-[#800040]"
                    }`}
                  >
                    <option value="">Seleccione una materia</option>
                    {materiasPorDocente.map((materia) => (
                      <option key={materia.id} value={materia.id}>
                        {materia.NombreMateria}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-between">
                  <Button
                    type="submit"
                    className={esModoOscuro ? colors.dark.buttonPrimary : colors.light.buttonPrimary}
                  >
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setMostrarTarjeta(false)}
                    className="bg-red-500 hover:bg-red-600 text-white"
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
            className={esModoOscuro ? colors.dark.buttonPrimary : colors.light.buttonPrimary}
          >
            Generar PDF del Horario
          </Button>
        </div>
      </div>
    </div>
  )
}

export default VistaHorario
