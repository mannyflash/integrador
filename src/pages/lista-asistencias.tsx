'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, onSnapshot, doc, deleteDoc, setDoc } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Play, Pause } from 'lucide-react'
import swal from 'sweetalert'

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

export default function ListaAsistencias() {
  const [asistencias, setAsistencias] = useState<any[]>([])
  const [contador, setContador] = useState(0)
  const [claseIniciada, setClaseIniciada] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const q = query(collection(db, 'Asistencias'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nuevosEstudiantes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setAsistencias(nuevosEstudiantes)
      setContador(nuevosEstudiantes.length)
    })

    const estadoClaseUnsubscribe = onSnapshot(doc(db, 'EstadoClase', 'actual'), (doc) => {
      if (doc.exists()) {
        setClaseIniciada(doc.data().iniciada);
      }
    });
    

    return () => {
      unsubscribe()
      estadoClaseUnsubscribe()
    }
  }, [])

  const volverAlInicio = () => {
    swal({
      title: "¿Deseas regresar al inicio?",
      text: "Serás redirigido a la página de inicio de sesión.",
      icon: "info",
      buttons: {
        cancel: {
          text: "Cancelar",
          visible: true,
        },
        confirm: {
          text: "Aceptar",
          className: "btn btn-success",
        }
      }
    }).then((willRedirect) => {
      if (willRedirect) {
        router.push('/')
      }
    })
  }

  const eliminarAsistencia = (id: string) => {
    swal({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      buttons: [true, "Aceptar"],
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        deleteDoc(doc(db, 'Asistencias', id))
          .then(() => swal("Registro eliminado con éxito", { icon: "success" }))
          .catch((error) => {
            swal("Error al eliminar el registro", { icon: "error" })
            console.error("Error al eliminar el documento: ", error)
          })
      }
    })
  }

  const toggleClase = async () => {
    const nuevoEstado = !claseIniciada
    try {
      await setDoc(doc(db, 'EstadoClase', 'actual'), { iniciada: nuevoEstado })
      setClaseIniciada(nuevoEstado)
      swal({
        title: nuevoEstado ? "Clase iniciada" : "Clase finalizada",
        text: nuevoEstado ? "Los alumnos ahora pueden registrar su asistencia." : "Se ha cerrado el registro de asistencias.",
        icon: "success",
      })
    } catch (error) {
      console.error("Error al cambiar el estado de la clase:", error)
      swal({
        title: "Error",
        text: "No se pudo cambiar el estado de la clase. Por favor, intente nuevamente.",
        icon: "error",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="bg-blue-800 text-white">
          <CardTitle className="text-3xl font-bold">Asistencias en Tiempo Real</CardTitle>
          <CardDescription className="text-yellow-100">Estudiantes que han registrado asistencia</CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-blue-800">Lista de Estudiantes</h2>
            <span className="text-lg font-medium bg-blue-100 text-blue-800 py-1 px-3 rounded-full">
              Total: {contador}
            </span>
          </div>

          <Button
            onClick={toggleClase}
            className={`w-full ${claseIniciada ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
          >
            {claseIniciada ? (
              <>
                <Pause className="mr-2 h-4 w-4" /> Finalizar Clase
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Iniciar Clase
              </>
            )}
          </Button>

          {asistencias.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Apellido</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asistencias.map((asistencia, index) => (
                  <TableRow key={asistencia.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{asistencia.nombre}</TableCell>
                    <TableCell>{asistencia.apellido}</TableCell>
                    <TableCell>{asistencia.equipo}</TableCell>
                    <TableCell>
                      <Button 
                        onClick={() => eliminarAsistencia(asistencia.id)} 
                        variant="destructive" 
                        size="icon"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar asistencia</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No hay asistencias registradas.
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button onClick={volverAlInicio} className="w-full">
            Volver al Inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}