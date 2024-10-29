import { useState, useEffect } from 'react'
import { Waves, Microscope, ChevronLeft, ChevronRight } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function InterfazLaboratorio() {
  const [activeTask, setActiveTask] = useState('asistencia')
  const [matricula, setMatricula] = useState('')
  const [equipo, setEquipo] = useState('')
  const [maestroMatricula, setMaestroMatricula] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [isClassStarted, setIsClassStarted] = useState(false) // Nueva variable de estado para el estado de la clase

  useEffect(() => {
    const checkClassStatus = async () => {
      const estadoClaseRef = doc(db, 'EstadoClase', 'actual')
      const estadoClaseSnap = await getDoc(estadoClaseRef)

      if (estadoClaseSnap.exists() && estadoClaseSnap.data().iniciada) {
        setIsClassStarted(true)
      } else {
        setIsClassStarted(false)
      }
    }

    checkClassStatus()

    const timer = setTimeout(() => {
      setMessage('')
    }, 5000)

    return () => clearTimeout(timer)
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isClassStarted) {
        if (activeTask === 'asistencia') {
          const alumnoRef = doc(db, 'Alumnos', matricula);
          const alumnoSnap = await getDoc(alumnoRef);

          if (alumnoSnap.exists()) {
            const alumnoData = alumnoSnap.data();
            const asistenciaRef = doc(collection(db, 'Asistencias'));
            await setDoc(asistenciaRef, {
              alumnoId: matricula,
              nombre: alumnoData.nombre,
              apellido: alumnoData.apellido,
              equipo: equipo,
              fecha: serverTimestamp()
            });

            swal({
              title: "¡Buen trabajo!",
              text: "La asistencia se registró correctamente.",
              icon: "success",
              buttons: {
                confirm: {
                  text: "OK",
                  className: "btn btn-success",
                }
              }
            });

            setMessageType('success');
            setMatricula('');
            setEquipo('');
          } else {
            setMessage('Matrícula no encontrada');
            setMessageType('error');
          }
        } else {
          // Inicio de sesión de maestros
          const maestroRef = doc(db, 'Docentes', maestroMatricula);
          const maestroSnap = await getDoc(maestroRef);

          if (maestroSnap.exists()) {
            const maestroData = maestroSnap.data();
            if (maestroData.contraseña === password) {
              swal({
                title: "¡Inicio de sesión exitoso!",
                text: "Bienvenido al sistema de docentes.",
                icon: "success",
                buttons: {
                  confirm: {
                    text: "Continuar",
                    className: "btn btn-success",
                  }
                }
              }).then(() => {
                window.location.href = '/lista-asistencias';
              });
            } else {
              setMessage('Contraseña incorrecta');
              setMessageType('error');
            }
          } else {
            setMessage('Matrícula no encontrada');
            setMessageType('error');
          }
        }
      } else {
        setMessage('La clase no está iniciada');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
      setMessage('Error al registrar asistencia');
      setMessageType('error');
    }
  }

  const toggleTask = () => {
    setActiveTask(activeTask === 'asistencia' ? 'login' : 'asistencia')
    setMessage('')
  }

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const value = e.target.value.replace(/\D/g, '')
    setter(value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4 relative overflow-hidden wave-animation">
      <div className="absolute inset-0 overflow-hidden">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      <Card className="w-full max-w-md relative z-20 shadow-xl">
        <CardHeader className="bg-blue-800 text-white rounded-t-lg">
          <CardTitle className="text-3xl font-bold flex items-center">
            <Microscope className="w-8 h-8 mr-2" />
            Laboratorio Marino
          </CardTitle>
          <CardDescription className="text-blue-100">Sistema de Registro de Asistencia</CardDescription>
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
                  onChange={(e) => handleNumberInput(e, setMatricula)}
                  className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipo">Número de Equipo</Label>
                <Select onValueChange={setEquipo} value={equipo}>
                  <SelectTrigger className="border-blue-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Seleccione el equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(30)].map((_, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>
                        Equipo {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!isClassStarted} // Solo deshabilita cuando la clase no está iniciada
              >
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
                  onChange={(e) => handleNumberInput(e, setMaestroMatricula)}
                  className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
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
                  className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Iniciar Sesión
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="p-4 border-t bg-gray-100 rounded-b-lg flex justify-center space-x-4">
          <button onClick={toggleTask} className="text-blue-700 font-semibold hover:underline flex items-center">
            {activeTask === 'asistencia' ? (
              <>
                <ChevronRight className="mr-1" /> Iniciar Sesión Maestros
              </>
            ) : (
              <>
                <ChevronLeft className="mr-1" /> Volver a Asistencia
              </>
            )}
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
