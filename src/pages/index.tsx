'use client'

import { useState, useEffect } from 'react'
import { Microscope, User, UserCog, Beaker, Moon, Sun, Settings } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc, collection, serverTimestamp, onSnapshot, query, where, getDocs } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { motion, AnimatePresence } from 'framer-motion'
import swal from 'sweetalert'
import Image from 'next/image'

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

type UserType = 'estudiante' | 'maestro' | 'laboratorista'

export default function InterfazLaboratorio() {
  const [activeTab, setActiveTab] = useState<UserType>('estudiante')
  const [matricula, setMatricula] = useState('')
  const [equipo, setEquipo] = useState('')
  const [maestroMatricula, setMaestroMatricula] = useState('')
  const [labTechMatricula, setLabTechMatricula] = useState('')
  const [password, setPassword] = useState('')
  const [isClassStarted, setIsClassStarted] = useState(false)
  const [welcomeMessageIndex, setWelcomeMessageIndex] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [backgroundSize, setBackgroundSize] = useState(4)

  const welcomeMessages = [
    "Bienvenido, Estudiante",
    "Bienvenido, Maestro",
    "Bienvenido, Laboratorista"
  ]

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'EstadoClase', 'actual'), (doc) => {
      if (doc.exists()) {
        const newStatus = doc.data().iniciada
        setIsClassStarted(prevStatus => {
          if (prevStatus !== newStatus) {
            if (newStatus) {
              swal({
                title: "¡La clase ha iniciado!",
                text: `Ya puedes registrar tu asistencia`,
                icon: "success",
              })
            } else {
              swal({
                title: "La clase ha finalizado",
                text: "El registro de asistencia está cerrado.",
                icon: "info",
              })
            }
          }
          return newStatus
        })
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setWelcomeMessageIndex((prevIndex) => (prevIndex + 1) % welcomeMessages.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (activeTab === 'estudiante') {
        if (!matricula || !equipo) {
          await swal({
            title: "Error",
            text: "Por favor, completa todos los campos.",
            icon: "error",
          })
          return
        }

        if (!isClassStarted) {
          await swal({
            title: "Error",
            text: "La clase no está iniciada",
            icon: "error",
          })
          return
        }

        const asistenciasRef = collection(db, 'Asistencias')
        const matriculaQuery = query(asistenciasRef, where("alumnoId", "==", matricula))
        const equipoQuery = query(asistenciasRef, where("equipo", "==", equipo))

        const [matriculaSnapshot, equipoSnapshot] = await Promise.all([
          getDocs(matriculaQuery),
          getDocs(equipoQuery)
        ])

        if (!matriculaSnapshot.empty) {
          await swal({
            title: "Error",
            text: "Ya has registrado tu asistencia.",
            icon: "error",
          })
          return
        }

        if (!equipoSnapshot.empty) {
          await swal({
            title: "Error",
            text: "Este equipo ya ha sido registrado.",
            icon: "error",
          })
          return
        }

        const alumnoRef = doc(db, 'Alumnos', matricula)
        const alumnoSnap = await getDoc(alumnoRef)

        if (alumnoSnap.exists()) {
          const alumnoData = alumnoSnap.data()
          const asistenciaRef = doc(collection(db, 'Asistencias'))
          await setDoc(asistenciaRef, {
            alumnoId: matricula,
            nombre: alumnoData.Nombre,
            apellido: alumnoData.Apellido,
            equipo: equipo,
            fecha: serverTimestamp()
          })

          await swal({
            title: "¡Asistencia registrada!",
            text: "Tu asistencia se ha registrado correctamente.",
            icon: "success",
          })

          setMatricula('')
          setEquipo('')
        } else {
          await swal({
            title: "Error",
            text: "Matrícula no encontrada",
            icon: "error",
          })
        }
      } else if (activeTab === 'maestro') {
        if (!maestroMatricula || !password) {
          await swal({
            title: "Error",
            text: "Por favor, completa todos los campos.",
            icon: "error",
          })
          return
        }

        const maestroRef = doc(db, 'Docentes', maestroMatricula)
        const maestroSnap = await getDoc(maestroRef)

        if (maestroSnap.exists()) {
          const maestroData = maestroSnap.data()
          if (maestroData.Contraseña === password) {
            await swal({
              title: "¡Bienvenido!",
              text: "Inicio de sesión exitoso",
              icon: "success",
            })
            
            localStorage.setItem('maestroId', maestroMatricula);
            
            window.location.href = '/lista-asistencias'
          } else {
            await swal({
              title: "Error",
              text: "Contraseña incorrecta",
              icon: "error",
            })
          }
        } else {
          await swal({
            title: "Error",
            text: "Matrícula no encontrada",
            icon: "error",
          })
        }
      } else if (activeTab === 'laboratorista') {
        if (!labTechMatricula || !password) {
          await swal({
            title: "Error",
            text: "Por favor, completa todos los campos.",
            icon: "error",
          })
          return
        }

        const labTechRef = doc(db, 'Laboratoristas', labTechMatricula)
        const labTechSnap = await getDoc(labTechRef)

        if (labTechSnap.exists()) {
          const labTechData = labTechSnap.data()
          if (labTechData.Contraseña === password) {
            await swal({
              title: "¡Bienvenido!",
              text: "Inicio de sesión exitoso",
              icon: "success",
            })
            
            localStorage.setItem('labTechId', labTechMatricula);
            
            window.location.href = '/panel-laboratorista'
          } else {
            await swal({
              title: "Error",
              text: "Contraseña incorrecta",
              icon: "error",
            })
          }
        } else {
          await swal({
            title: "Error",
            text: "Matrícula no encontrada",
            icon: "error",
          })
        }
      }
    } catch (error) {
      console.error('Error al procesar la solicitud:', error)
      await swal({
        title: "Error",
        text: "Ha ocurrido un error. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const value = e.target.value.replace(/\D/g, '')
    setter(value)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
      <AnimatePresence mode="wait">
        <motion.h2
          key={welcomeMessageIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-4xl md:text-7xl font-semibold text-green-800 dark:text-white bg-white/80 dark:bg-gray-800/80 mb-8 text-center z-10 p-4 rounded-lg shadow-lg max-w-[90rem] mx-auto"
        >
          {welcomeMessages[welcomeMessageIndex]}
        </motion.h2>
      </AnimatePresence>

      <Card className="w-full max-w-[90rem] mx-auto my-1 overflow-hidden shadow-xl relative z-10 bg-white dark:bg-gray-800">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 relative h-64 md:h-auto">
            <Image
              src="/fondozugey.jpg"
              layout="fill"
              objectFit="cover"
              quality={100}
              alt="Background"
              className="object-cover object-center"
              style={{ objectPosition: `center ${100 - backgroundSize}%` }}
            />
          </div>
          
          <div className="md:w-1/2">
            <CardHeader className="relative z-10 bg-white dark:bg-gray-800">
              <div className="flex justify-center mb-4">
                <div className="rounded-full overflow-hidden w-24 h-24 bg-white flex items-center justify-center">
                  <Image
                    src="/logo isc.jpeg.png"
                    width={96}
                    height={96}
                    alt="Logo de la carrera"
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="text-center">
                <CardTitle className="text-2xl md:text-4xl font-bold flex items-center justify-center text-green-800 dark:text-white">
                  <Microscope className="w-8 h-8 md:w-10 md:h-10 mr-3" />
                  Laboratorio Sistemas
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-gray-300 text-lg md:text-xl">
                  Sistema de Gestión de Laboratorio
                </CardDescription>
              </div>
              <div className="mt-4 flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Sun className={`h-5 w-5 md:h-6 md:w-6 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={setIsDarkMode}
                    aria-label="Toggle dark mode"
                  />
                  <Moon className={`h-5 w-5 md:h-6 md:w-6 ${isDarkMode ? 'text-blue-400' : 'text-gray-400'}`} />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Ajuste de fondo</h4>
                        <p className="text-sm text-muted-foreground">
                          Ajusta el tamaño de la imagen de fondo
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                          <Label htmlFor="width">Tamaño</Label>
                          <Slider
                            id="width"
                            max={100}
                            defaultValue={[backgroundSize]}
                            step={1}
                            className="col-span-2"
                            onValueChange={([value]) => setBackgroundSize(value)}
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            
            <CardContent className="p-4 md:p-8 bg-white dark:bg-gray-800">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserType)} className="mt-4">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger 
                    value="estudiante" 
                    className="text-base md:text-xl data-[state=active]:bg-green-600 data-[state=active]:text-white dark:data-[state=active]:bg-green-700 transition-all duration-300 ease-in-out"
                  >
                    <User className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                    Estudiante
                  </TabsTrigger>
                  <TabsTrigger 
                    value="maestro"
                    className="text-base md:text-xl data-[state=active]:bg-green-600 data-[state=active]:text-white dark:data-[state=active]:bg-green-700 transition-all duration-300 ease-in-out"
                  >
                    <UserCog className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                    Maestro
                  </TabsTrigger>
                  <TabsTrigger 
                    value="laboratorista"
                    className="text-base md:text-xl data-[state=active]:bg-green-600 data-[state=active]:text-white dark:data-[state=active]:bg-green-700 transition-all duration-300 ease-in-out"
                  >
                    <Beaker className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                    Laboratorista
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="estudiante">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="matricula" className="text-green-700 dark:text-gray-300 text-lg md:text-xl">Matrícula</Label>
                      <Input
                        id="matricula"
                        type="text"
                        placeholder="Ingrese su matrícula"
                        value={matricula}
                        onChange={(e) => handleNumberInput(e, setMatricula)}
                        className="bg-white dark:bg-gray-700 text-green-800 dark:text-white border-green-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 text-lg md:text-xl py-4 md:py-6"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="equipo" className="text-green-700 dark:text-gray-300 text-lg md:text-xl">Número de Equipo</Label>
                      <Select onValueChange={setEquipo} value={equipo}>
                        <SelectTrigger id="equipo" className="bg-white dark:bg-gray-700 text-green-800 dark:text-white border-green-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 text-lg md:text-xl py-4 md:py-6">
                          <SelectValue placeholder="Seleccione el equipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(30)].map((_, i) => (
                            <SelectItem key={i} value={(i + 1).toString()} className="text-lg md:text-xl">
                              Equipo {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="submit" 
                      className={`w-full ${isClassStarted ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600' : 'bg-gray-400'} transition-colors duration-300 text-lg md:text-xl py-4 md:py-6`}
                      disabled={!isClassStarted}
                    >
                      {isClassStarted ? 'Registrar Asistencia' : 'Esperando inicio de clase'}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="maestro">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="maestroMatricula" className="text-green-700 dark:text-gray-300 text-lg md:text-xl">Matrícula del Maestro</Label>
                      <Input
                        id="maestroMatricula"
                        type="text"
                        placeholder="Ingrese su matrícula"
                        value={maestroMatricula}
                        onChange={(e) => handleNumberInput(e, setMaestroMatricula)}
                        className="bg-white dark:bg-gray-700 text-green-800 dark:text-white border-green-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 text-lg md:text-xl py-4 md:py-6"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-green-700 dark:text-gray-300 text-lg md:text-xl">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Ingrese su contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white dark:bg-gray-700 text-green-800 dark:text-white border-green-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 text-lg md:text-xl py-4 md:py-6"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors duration-300 text-lg md:text-xl py-4 md:py-6">
                      Iniciar Sesión
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="laboratorista">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="labTechMatricula" className="text-green-700 dark:text-gray-300 text-lg md:text-xl">Matrícula del Laboratorista</Label>
                      <Input
                        id="labTechMatricula"
                        type="text"
                        placeholder="Ingrese su matrícula"
                        value={labTechMatricula}
                        onChange={(e) => handleNumberInput(e, setLabTechMatricula)}
                        className="bg-white dark:bg-gray-700 text-green-800 dark:text-white border-green-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 text-lg md:text-xl py-4 md:py-6"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-green-700 dark:text-gray-300 text-lg md:text-xl">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Ingrese su contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white dark:bg-gray-700 text-green-800 dark:text-white border-green-300 dark:border-gray-600 focus:border-green-500 focus:ring-green-500 text-lg md:text-xl py-4 md:py-6"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors duration-300 text-lg md:text-xl py-4 md:py-6">
                      Iniciar Sesión
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  )
}