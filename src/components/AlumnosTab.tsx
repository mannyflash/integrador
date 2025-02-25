"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2 } from "lucide-react"
import {
  collection,
  setDoc,
  doc,
  getDocs,
  query,
  deleteDoc,
  updateDoc,
  type Firestore,
  getDoc,
} from "firebase/firestore"
import Swal from "sweetalert2"
import type React from "react"

export function AlumnosTab({
  db,
  isDarkMode,
  currentColors,
}: { db: Firestore; isDarkMode: boolean; currentColors: any }) {
  const [alumnos, setAlumnos] = useState<
    Array<{
      Matricula: string
      Nombre: string
      Apellido: string
      Carrera: string
      Semestre: string
      Turno: string
      Grupo: string
      [key: string]: any
    }>
  >([])
  const [datosAlumno, setDatosAlumno] = useState<{
    Matricula: string
    Nombre: string
    Apellido: string
    Carrera: string
    Semestre: string
    Turno: string
    Grupo: string
    [key: string]: any
  }>({
    Matricula: "",
    Nombre: "",
    Apellido: "",
    Carrera: "",
    Semestre: "",
    Turno: "",
    Grupo: "",
  })
  const [editando, setEditando] = useState(false)

  useEffect(() => {
    cargarAlumnos()
  }, [])

  const cargarAlumnos = async () => {
    try {
      const alumnosRef = collection(db, "Alumnos")
      const alumnosSnapshot = await getDocs(query(alumnosRef))
      const alumnosData = alumnosSnapshot.docs.map((doc) => ({
        Matricula: doc.id,
        Nombre: doc.data().Nombre || "",
        Apellido: doc.data().Apellido || "",
        Carrera: doc.data().Carrera || "",
        Semestre: doc.data().Semestre || "",
        Turno: doc.data().Turno || "",
        Grupo: doc.data().Grupo || "",
        ...doc.data(),
      })) as Array<{
        Matricula: string
        Nombre: string
        Apellido: string
        Carrera: string
        Semestre: string
        Turno: string
        Grupo: string
        [key: string]: any
      }>
      setAlumnos(alumnosData)
    } catch (error) {
      console.error("Error al cargar alumnos:", error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los alumnos. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const manejarEnvio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const { Matricula, ...restoDatosAlumno } = datosAlumno

      if (!editando) {
        // Check if the matricula already exists only when adding a new student
        const alumnoDoc = doc(db, "Alumnos", Matricula)
        const alumnoSnapshot = await getDoc(alumnoDoc)

        if (alumnoSnapshot.exists()) {
          await Swal.fire({
            title: "Error",
            text: "Esta matrícula ya existe. Por favor, use una matrícula diferente.",
            icon: "error",
          })
          return
        }

        // Add new student
        await setDoc(alumnoDoc, restoDatosAlumno)
        await Swal.fire({
          title: "¡Éxito!",
          text: "Alumno agregado correctamente",
          icon: "success",
        })
      } else {
        // Update existing student
        await updateDoc(doc(db, "Alumnos", Matricula), restoDatosAlumno)
        await Swal.fire({
          title: "¡Éxito!",
          text: "Alumno actualizado correctamente",
          icon: "success",
        })
        setEditando(false)
      }
      setDatosAlumno({ Matricula: "", Nombre: "", Apellido: "", Carrera: "", Semestre: "", Turno: "", Grupo: "" })
      cargarAlumnos()
    } catch (error) {
      console.error("Error al agregar/actualizar alumno:", error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error al agregar/actualizar el alumno. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const eliminarAlumno = async (matricula: string) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar!",
      cancelButtonText: "Cancelar",
    })

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "Alumnos", matricula))
        Swal.fire("Eliminado!", "El alumno ha sido eliminado.", "success")
        cargarAlumnos()
      } catch (error) {
        console.error("Error al eliminar alumno:", error)
        Swal.fire("Error!", "Ha ocurrido un error al eliminar el alumno.", "error")
      }
    }
  }

  const modificarAlumno = (alumno: {
    Matricula: string
    Nombre: string
    Apellido: string
    Carrera: string
    Semestre: string
    Turno: string
    Grupo: string
    [key: string]: any
  }) => {
    setDatosAlumno(alumno)
    setEditando(true)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card
        className={`${isDarkMode ? currentColors.cardBackground : currentColors.cardBackground} h-[calc(100vh-200px)]`}
      >
        <CardHeader>
          <CardTitle className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
            {editando ? "Editar Alumno" : "Agregar Alumno"}
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)] overflow-y-auto">
          <form onSubmit={manejarEnvio} className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label
                htmlFor="matriculaAlumno"
                className={isDarkMode ? currentColors.titleText : currentColors.titleText}
              >
                Matrícula
              </Label>
              <Input
                id="matriculaAlumno"
                value={datosAlumno.Matricula}
                onChange={(e) => setDatosAlumno({ ...datosAlumno, Matricula: e.target.value })}
                required
                disabled={editando}
                className={`${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreAlumno" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                Nombre
              </Label>
              <Input
                id="nombreAlumno"
                value={datosAlumno.Nombre}
                onChange={(e) => setDatosAlumno({ ...datosAlumno, Nombre: e.target.value })}
                required
                className={`${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="apellidoAlumno"
                className={isDarkMode ? currentColors.titleText : currentColors.titleText}
              >
                Apellido
              </Label>
              <Input
                id="apellidoAlumno"
                value={datosAlumno.Apellido}
                onChange={(e) => setDatosAlumno({ ...datosAlumno, Apellido: e.target.value })}
                required
                className={`${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} border-gray-300`}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carreraAlumno" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                Carrera
              </Label>
              <Select
                value={datosAlumno.Carrera}
                onValueChange={(value) => setDatosAlumno({ ...datosAlumno, Carrera: value })}
              >
                <SelectTrigger
                  id="carreraAlumno"
                  className={`${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} border-gray-300`}
                >
                  <SelectValue placeholder="Selecciona una carrera" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ingenieria en sistemas computacionales">
                    Ingeniería en Sistemas Computacionales
                  </SelectItem>
                  <SelectItem value="Ingenieria industrial">Ingeniería Industrial</SelectItem>
                  <SelectItem value="Licenciatura en administracion de empresas">
                    Licenciatura en Administración de Empresas
                  </SelectItem>
                  <SelectItem value="Ingenieria civil">Ingeniería Civil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="semestreAlumno"
                className={isDarkMode ? currentColors.titleText : currentColors.titleText}
              >
                Semestre
              </Label>
              <Select
                value={datosAlumno.Semestre}
                onValueChange={(value) => setDatosAlumno({ ...datosAlumno, Semestre: value })}
              >
                <SelectTrigger
                  id="semestreAlumno"
                  className={`${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} border-gray-300`}
                >
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
            <div className="space-y-2">
              <Label htmlFor="turnoAlumno" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                Turno
              </Label>
              <Select
                value={datosAlumno.Turno}
                onValueChange={(value) => setDatosAlumno({ ...datosAlumno, Turno: value })}
              >
                <SelectTrigger
                  id="turnoAlumno"
                  className={`${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} border-gray-300`}
                >
                  <SelectValue placeholder="Selecciona un turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matutino">Matutino</SelectItem>
                  <SelectItem value="vespertino">Vespertino</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grupoAlumno" className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                Grupo
              </Label>
              <Input
                id="grupoAlumno"
                value={datosAlumno.Grupo}
                onChange={(e) => setDatosAlumno({ ...datosAlumno, Grupo: e.target.value })}
                required
                className={`${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-900"} border-gray-300`}
              />
            </div>
            <Button
              type="submit"
              className={`w-full h-8 px-1 py-0 text-xs font-tall transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                isDarkMode ? currentColors.buttonGreen : currentColors.buttonGreen
              }`}
            >
              {editando ? "Actualizar Alumno" : "Agregar Alumno"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card
        className={`${isDarkMode ? currentColors.cardBackground : currentColors.cardBackground} h-[calc(100vh-200px)] overflow-auto`}
      >
        <CardHeader>
          <CardTitle className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
            Lista de Alumnos
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)] overflow-hidden">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-inherit z-10">
                <TableRow>
                  <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                    Matrícula
                  </TableHead>
                  <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                    Nombre
                  </TableHead>
                  <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                    Apellido
                  </TableHead>
                  <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                    Carrera
                  </TableHead>
                  <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                    Semestre
                  </TableHead>
                  <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                    Turno
                  </TableHead>
                  <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                    Grupo
                  </TableHead>
                  <TableHead className={isDarkMode ? currentColors.titleText : currentColors.titleText}>
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumnos.map((alumno) => (
                  <TableRow key={alumno.Matricula}>
                    <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                      {alumno.Matricula}
                    </TableCell>
                    <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                      {alumno.Nombre}
                    </TableCell>
                    <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                      {alumno.Apellido}
                    </TableCell>
                    <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                      {alumno.Carrera}
                    </TableCell>
                    <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                      {alumno.Semestre}
                    </TableCell>
                    <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                      {alumno.Turno}
                    </TableCell>
                    <TableCell className={isDarkMode ? currentColors.descriptionText : currentColors.descriptionText}>
                      {alumno.Grupo}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => modificarAlumno(alumno)}
                        className="mr-2"
                        size="sm"
                        variant="outline"
                        style={{ color: currentColors.buttonBlue, borderColor: currentColors.buttonBlue }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar alumno</span>
                      </Button>
                      <Button onClick={() => eliminarAlumno(alumno.Matricula)} size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar alumno</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

