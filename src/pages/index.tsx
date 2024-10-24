'use client'

import { useState, useEffect } from 'react'
import { Waves, Microscope, ChevronLeft, ChevronRight } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

export default function InterfazLaboratorio() {
  const [activeTask, setActiveTask] = useState('asistencia')
  const [matricula, setMatricula] = useState('')
  const [equipo, setEquipo] = useState('')
  const [maestroMatricula, setMaestroMatricula] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessage('')
    }, 5000)

    return () => clearTimeout(timer)
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTask === 'asistencia') {
      try {
        const alumnoRef = doc(db, 'Alumnos', matricula)
        const alumnoSnap = await getDoc(alumnoRef)

        if (alumnoSnap.exists()) {
          const alumnoData = alumnoSnap.data()
          const asistenciaRef = doc(collection(db, 'Asistencias'))
          await setDoc(asistenciaRef, {
            alumnoId: matricula,
            nombre: alumnoData.nombre,
            apellido: alumnoData.apellido,
            equipo: equipo,
            fecha: serverTimestamp()
          })
          setMessage('Asistencia registrada correctamente')
          setMessageType('success')
          setMatricula('')
          setEquipo('')
        } else {
          setMessage('Matrícula no encontrada')
          setMessageType('error')
        }
      } catch (error) {
        console.error('Error al registrar asistencia:', error)
        setMessage('Error al registrar asistencia')
        setMessageType('error')
      }
    } else {
      // Lógica para inicio de sesión de maestros (no implementada en este ejemplo)
      console.log('Inicio de sesión de maestros')
    }
  }

  const toggleTask = () => {
    setActiveTask(activeTask === 'asistencia' ? 'login' : 'asistencia')
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo del mar */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-blue-400/30 w-full h-full"></div>
        <div className="absolute inset-0 z-0 bg-blue-300/20 w-full h-full"></div>
      </div>

      <Card className="w-full max-w-md relative z-20">
        <CardHeader className="bg-blue-800 text-white">
          <CardTitle className="text-3xl font-bold">Laboratorio Marino</CardTitle>
          <CardDescription className="text-blue-100">Sistema de Registro de Asistencia</CardDescription>
          <Microscope className="absolute top-4 right-4 w-12 h-12" />
        </CardHeader>
        
        <CardContent className="p-6">
          {activeTask === 'asistencia' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">Registro de Asistencia</h2>
              <div className="space-y-2">
                <Label htmlFor="matricula">Matrícula</Label>
                <Input
                  id="matricula"
                  type="text"
                  placeholder="Ingrese su matrícula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipo">Número de Equipo</Label>
                <Input
                  id="equipo"
                  type="text"
                  placeholder="Ingrese el número de equipo"
                  value={equipo}
                  onChange={(e) => setEquipo(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Registrar Asistencia
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-2xl font-semibold text-blue-800 mb-4">Inicio de Sesión Maestros</h2>
              <div className="space-y-2">
                <Label htmlFor="maestroMatricula">Matrícula del Maestro</Label>
                <Input
                  id="maestroMatricula"
                  type="text"
                  placeholder="Ingrese su matrícula"
                  value={maestroMatricula}
                  onChange={(e) => setMaestroMatricula(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Iniciar Sesión
              </Button>
            </form>
          )}
          {message && (
            <Alert className={`mt-4 ${messageType === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              <AlertTitle>{messageType === 'success' ? 'Éxito' : 'Error'}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter>
          <Button
            onClick={toggleTask}
            variant="outline"
            className="w-full flex items-center justify-center space-x-2"
          >
            {activeTask === 'asistencia' ? (
              <>
                <span>Ir a Inicio de Sesión Maestros</span>
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>Volver a Registro de Asistencia</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
