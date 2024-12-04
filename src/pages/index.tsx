'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, UserCog, Moon, Sun, Computer } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc, collection, serverTimestamp, onSnapshot, query, where, getDocs } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ImageCarousel } from './ImageCarousel'
import { Sidebar } from './Sidebar'
import { getTheme, setTheme, toggleTheme, applyTheme, Theme } from '../lib/theme'

import Image from 'next/image'
import swal from 'sweetalert'
import { motion, AnimatePresence } from 'framer-motion'
import bcrypt from 'bcryptjs'

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

type UserType = 'estudiante' | 'maestro'

interface Equipment {
  id: string;
  fueraDeServicio: boolean;
}

const colors = {
  light: {
    background: 'bg-green-50',
    cardBackground: 'bg-white',
    headerBackground: 'bg-green-100',
    titleText: 'text-green-800',
    descriptionText: 'text-green-700',
    hoverBackground: 'hover:bg-green-50',
    buttonGreen: 'bg-green-500 hover:bg-green-600',
    buttonBlue: 'bg-blue-500 hover:bg-blue-600',
    countBackground: 'bg-green-100',
    countText: 'text-green-800',
    inputBackground: 'bg-green-50',
    inputBorder: 'border-green-300',
    inputText: 'text-green-800',
    switchBackground: 'bg-green-200',
    switchToggle: 'bg-white',
  },
  dark: {
    background: 'bg-gray-900',
    cardBackground: 'bg-gray-800',
    headerBackground: 'bg-gray-700',
    titleText: 'text-white',
    descriptionText: 'text-gray-300',
    hoverBackground: 'hover:bg-gray-700',
    buttonGreen: 'bg-green-700 hover:bg-green-600',
    buttonBlue: 'bg-blue-700 hover:bg-blue-600',
    countBackground: 'bg-green-900',
    countText: 'text-green-100',
    inputBackground: 'bg-gray-700',
    inputBorder: 'border-gray-600',
    inputText: 'text-gray-200',
    switchBackground: 'bg-gray-600',
    switchToggle: 'bg-gray-300',
  },
};

const TabAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 }
};

const SlideAnimation = {
  initial: (isReversed: boolean) => ({
    x: isReversed ? "100%" : "-100%",
    opacity: 0
  }),
  animate: {
    x: 0,
    opacity: 1
  },
  exit: (isReversed: boolean) => ({
    x: isReversed ? "-100%" : "100%",
    opacity: 0
  }),
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 30
  }
};

export default function InterfazLaboratorio() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<UserType>('estudiante')
  const [matricula, setMatricula] = useState('')
  const [equipo, setEquipo] = useState('')
  const [maestroMatricula, setMaestroMatricula] = useState('')
  const [labTechMatricula, setLabTechMatricula] = useState('')
  const [password, setPassword] = useState('')
  const [isClassStarted, setIsClassStarted] = useState(false)
  const [theme, setThemeState] = useState<Theme>('light')
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [isReversed, setIsReversed] = useState(false)
  const [userType, setUserType] = useState<'maestro' | 'laboratorista'>('maestro')
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  const welcomeMessages = [
    '"Hombres y Mujeres"',
    '"Del Mar y Desierto"',
    '"Unidos Por La Educación"',
    '"Tecnológica De Calidad."',
  ]

  useEffect(() => {
    const currentTheme = getTheme();
    setThemeState(currentTheme);
    applyTheme(currentTheme);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'EstadoClase', 'actual'), (doc) => {
      if (doc.exists()) {
        const newStatus = doc.data().iniciada
        setIsClassStarted(prevStatus => {
          if (prevStatus !== newStatus) {
            if (newStatus) {
              swal({
                title: "¡La clase ha iniciado!",
                text: "Ya puedes registrar tu asistencia",
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
    const unsubscribe = onSnapshot(doc(db, 'Numero de equipos', 'equipos'), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const dbEquipment = data.Equipos || []
        setEquipmentList([
          { id: 'personal', fueraDeServicio: false },
          ...dbEquipment
        ])
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % welcomeMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

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

        if (!equipoSnapshot.empty && equipo !== 'personal') {
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

        const collectionName = userType === 'maestro' ? 'Docentes' : 'Laboratoristas'
        const userRef = doc(db, collectionName, userType === 'maestro' ? maestroMatricula : labTechMatricula)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const userData = userSnap.data()
          const passwordMatch = await bcrypt.compare(password, userData.Contraseña)
          if (passwordMatch) {
            await swal({
              title: "¡Bienvenido!",
              text: "Inicio de sesión exitoso",
              icon: "success",
            })
            
            localStorage.setItem(userType === 'maestro' ? 'maestroId' : 'labTechId', userType === 'maestro' ? maestroMatricula : labTechMatricula);
            
            router.push(userType === 'maestro' ? '/lista-asistencias' : '/panel-laboratorista')
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const adminQuery = query(collection(db, 'Administrador'), where("email", "==", adminEmail))
      const adminSnapshot = await getDocs(adminQuery)

      if (!adminSnapshot.empty) {
        const adminDoc = adminSnapshot.docs[0]
        const adminData = adminDoc.data()
        const passwordMatch = await bcrypt.compare(adminPassword, adminData.contraseña)
        if (passwordMatch) {
          await swal({
            title: "¡Bienvenido Administrador!",
            text: "Inicio de sesión exitoso",
            icon: "success",
          })
          setIsAdminLoginOpen(false)
          router.push('/AdminPanel')
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
          text: "Email de administrador no encontrado",
          icon: "error",
        })
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

  const carouselImages = [
    "/fondozugey.jpg",
    "/fondo_de_pantalla_de_salon.jpeg",
    "/fondoitspp.jpg",
    "/tecnm imagen.jpg",
    "/Diseño sin título (2).png",
    "/Diseño sin título (1).png",
  ]

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-green-50'} transition-colors duration-300`}>
      <div className="fixed top-4 left-4 z-50">
        <Sidebar isDarkMode={theme === 'dark'} onAdminLogin={() => setIsAdminLoginOpen(true)} adminLoginText="Administrador"/>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessageIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className={`text-2xl md:text-4xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-green-800'} mb-6 text-center z-10 p-4 rounded-xl max-w-[90%] mx-auto overflow-hidden`}
        >
          {welcomeMessages[currentMessageIndex]}
        </motion.div>
      </AnimatePresence>

      <Card className={`w-full max-w-[90%] mx-auto overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-none relative z-10 shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-colors duration-300 rounded-[2rem]`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div 
            key={activeTab}
            className="flex flex-col md:flex-row h-[calc(100vh-12rem)] max-h-[800px] relative overflow-hidden rounded-[2rem]"
            {...TabAnimation}
          >
            <motion.div 
              className={`md:w-2/5 relative h-full ${isReversed ? 'order-last rounded-[2rem]' : 'order-first rounded-[2rem]'} overflow-hidden`}
              custom={isReversed}
              variants={SlideAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ImageCarousel images={carouselImages} />
            </motion.div>

            <motion.div 
              className={`md:w-3/5 relative flex flex-col h-full ${isReversed ? 'order-first rounded-[2rem]' : 'order-last rounded-[2rem]'} overflow-hidden`}
              custom={!isReversed}
              variants={SlideAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="absolute top-0 left-0 right-0 h-20 flex justify-center items-center z-10 bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75">
                <div className="w-40 h-20 relative">
                  <Image
                    src="/logo itspp.jpeg"
                    alt="Logos institucionales"
                    layout="fill"
                    objectFit="contain"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <CardHeader className={`relative z-10 ${theme === 'dark' ? colors.dark.headerBackground : colors.light.headerBackground} p-6 pt-12 shadow-[0_4px_6px_rgba(0,0,0,0.1)] rounded-t-[2rem]`}>
                <div className="text-center">
                  <CardTitle className={`text-4xl md:text-5xl lg:text-6xl font-bold flex flex-col items-center justify-center ${theme === 'dark' ? colors.dark.titleText : colors.light.titleText} mb-4`}>
                    <Computer className="w-16 h-16 md:w-20 md:h-20 mb-2" />
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.8,
                        delay: 0.5,
                        ease: [0, 0.71, 0.2, 1.01]
                      }}
                    >
                      Laboratorio Sistemas
                    </motion.span>
                  </CardTitle>
                </div>
                <div className="mt-4 flex items-center justify-center space-x-4">
                  <div className={`flex items-center space-x-2 ${theme === 'dark' ? 'bg-gray-700 border border-gray-600' : 'bg-green-100 border border-green-200'} p-1 rounded-full transition-colors duration-200`}>
                    <Sun className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-400' : 'text-yellow-500'}`} />
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={handleThemeToggle}
                      className={`${theme === 'dark' ? colors.dark.switchBackground : colors.light.switchBackground} data-[state=checked]:bg-green-600`}
                    />
                    <Moon className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-400' : 'text-gray-400'}`} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className={`p-6 pt-4 ${theme === 'dark' ? colors.dark.cardBackground : colors.light.cardBackground} flex-grow overflow-y-auto shadow-[inset_0_4px_6px_rgba(0,0,0,0.1)] rounded-b-[2rem]`}>
                <Tabs 
                  value={activeTab} 
                  onValueChange={(value) => {
                    setIsReversed(value === 'estudiante' ? false : true);
                    setActiveTab(value as UserType);
                    setUserType('maestro');
                    // Clear all input fields
                    setPassword('');
                    setMatricula('');
                    setMaestroMatricula('');
                    setLabTechMatricula('');
                    setEquipo('');
                  }} 
                  className="h-full flex flex-col"
                >
                  <TabsList className="grid w-full grid-cols-2 h-14 mb-8 rounded-2xl overflow-hidden p-1 bg-gray-100 dark:bg-gray-800 shadow-inner">
                    {['estudiante', 'maestro'].map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className={`
                          relative flex items-center justify-center text-base md:text-xl
                          ${theme === 'dark'
                            ? 'text-gray-400 data-[state=active]:text-white'
                            : 'text-green-700 data-[state=active]:text-gray-900'
                          } 
                          transition-all duration-300 z-10 h-full rounded-xl
                          data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700
                          data-[state=active]:shadow-[inset_0_1px_1px_rgba(0,0,0,0.075),0_0_8px_rgba(102,175,233,0.6)]
                          hover:bg-opacity-80 hover:scale-105 hover:shadow-lg
                        `}
                      >
                        <motion.div
                          className="flex items-center justify-center w-full h-full"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {tab === 'estudiante' && <User className="w-5 h-5 md:w-6 md:h-6 mr-2" />}
                          {tab === 'maestro' && <UserCog className="w-5 h-5 md:w-6 md:h-6 mr-2" />}
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </motion.div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <div className="flex-grow overflow-y-auto">
                    <AnimatePresence mode="wait">
                      <TabsContent value="estudiante" className="flex-grow">
                        <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col justify-between">
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <Label htmlFor="matricula" className={`${theme === 'dark' ? 'text-gray-300' : 'text-green-700'} text-lg md:text-xl`}>Matrícula</Label>
                              <Input
                                id="matricula"
                                type="text"
                                placeholder="Ingrese su matrícula"
                                value={matricula}
                                onChange={(e) => handleNumberInput(e, setMatricula)}
                                className={`${
                                  theme === 'dark'
                                    ? `${colors.dark.inputBackground} ${colors.dark.inputText} ${colors.dark.inputBorder}`
                                    : `${colors.light.inputBackground} ${colors.light.inputText} ${colors.light.inputBorder}`
                                } border text-lg md:text-xl py-6 rounded-xl transition-all duration-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] focus:shadow-[0_0_0_3px_rgba(66,153,225,0.5)]`}
                              />
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor="equipo" className={`${theme === 'dark' ? 'text-gray-300' : 'text-green-700'} text-lg md:text-xl`}>Número de Equipo</Label>
                              <Select onValueChange={setEquipo} value={equipo}>
                                <SelectTrigger id="equipo" className={`${
                                  theme === 'dark'
                                    ? `${colors.dark.inputBackground} ${colors.dark.inputText} ${colors.dark.inputBorder}`
                                    : `${colors.light.inputBackground} ${colors.light.inputText} ${colors.light.inputBorder}`
                                } border text-lg md:text-xl py-6 rounded-xl transition-all duration-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] focus:shadow-[0_0_0_3px_rgba(66,153,225,0.5)]`}>
                                  <SelectValue placeholder="Seleccione el equipo" />
                                </SelectTrigger>
                                <SelectContent className={`${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} rounded-xl border ${theme === 'dark' ? 'border-gray-600' : 'border-green-300'}`}>
                                  {equipmentList.map((equipment) => (
                                    <SelectItem 
                                      key={equipment.id} 
                                      value={equipment.id}
                                      disabled={equipment.fueraDeServicio}
                                      className={`text-lg md:text-xl ${equipment.fueraDeServicio ? 'text-gray-400' : ''}`}
                                    >
                                      {equipment.id === 'personal' ? 'Equipo Personal' : `Equipo ${equipment.id}`} {equipment.fueraDeServicio ? '(Fuera de servicio)' : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button 
                            type="submit" 
                            className={`w-full ${
                              isClassStarted ? (theme === 'dark' ? colors.dark.buttonGreen : colors.light.buttonGreen) : 'bg-gray-400'
                            } transition-all duration-200 text-lg md:text-xl py-6 rounded-xl text-white transform hover:-translate-y-1 active:translate-y-0 shadow-[0_4px_6px_rgba(50,50,93,0.11),0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_7px_14px_rgba(50,50,93,0.1),0_3px_6px_rgba(0,0,0,0.08)]`}
                            disabled={!isClassStarted}
                          >
                            {isClassStarted ? 'Registrar Asistencia' : 'Esperando inicio de clase'}
                          </Button>
                        </form>
                      </TabsContent>
                      <TabsContent value="maestro" className="flex-grow">
                        <div className="space-y-6 mb-6">
                          <Label className={`${theme === 'dark' ? 'text-gray-300' : 'text-green-700'} text-lg md:text-xl`}>Seleccione su rol</Label>
                          <div className="flex space-x-4">
                            <Button
                              onClick={() => {
                                setUserType('maestro');
                                setMaestroMatricula('');
                                setLabTechMatricula('');
                                setPassword('');
                              }}
                              className={`flex-1 ${userType === 'maestro' ? (theme === 'dark' ? colors.dark.buttonGreen : colors.light.buttonGreen) : 'bg-gray-400'} shadow-[0_4px_6px_rgba(50,50,93,0.11),0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_7px_14px_rgba(50,50,93,0.1),0_3px_6px_rgba(0,0,0,0.08)]`}
                            >
                              Maestro
                            </Button>
                            <Button
                              onClick={() => {
                                setUserType('laboratorista');
                                setMaestroMatricula('');
                                setLabTechMatricula('');
                                setPassword('');
                              }}
                              className={`flex-1 ${userType === 'laboratorista' ? (theme === 'dark' ? colors.dark.buttonGreen : colors.light.buttonGreen) : 'bg-gray-400'} shadow-[0_4px_6px_rgba(50,50,93,0.11),0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_7px_14px_rgba(50,50,93,0.1),0_3px_6px_rgba(0,0,0,0.08)]`}
                            >
                              Laboratorista
                            </Button>
                          </div>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col justify-between">
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <Label htmlFor={userType === 'maestro' ? "maestroMatricula" : "labTechMatricula"} className={`${theme === 'dark' ? 'text-gray-300' : 'text-green-700'} text-lg md:text-xl`}>
                                Matrícula del {userType === 'maestro' ? 'Maestro' : 'Laboratorista'}
                              </Label>
                              <Input
                                id={userType === 'maestro' ? "maestroMatricula" : "labTechMatricula"}
                                type="text"
                                placeholder={`Ingrese su matrícula de ${userType === 'maestro' ? 'maestro' : 'laboratorista'}`}
                                value={userType === 'maestro' ? maestroMatricula : labTechMatricula}
                                onChange={(e) => userType === 'maestro' ? handleNumberInput(e, setMaestroMatricula) : handleNumberInput(e, setLabTechMatricula)}
                                className={`${
                                  theme === 'dark'
                                    ? `${colors.dark.inputBackground} ${colors.dark.inputText} ${colors.dark.inputBorder}`
                                    : `${colors.light.inputBackground} ${colors.light.inputText} ${colors.light.inputBorder}`
                                } border text-lg md:text-xl py-6 rounded-xl transition-all duration-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] focus:shadow-[0_0_0_3px_rgba(66,153,225,0.5)]`}
                              />
                            </div>
                            <div className="space-y-3">
                              <Label htmlFor="password" className={`${theme === 'dark' ? 'text-gray-300' : 'text-green-700'} text-lg md:text-xl`}>Contraseña</Label>
                              <Input
                                id="password"
                                type="password"
                                placeholder="Ingrese su contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`${
                                  theme === 'dark'
                                    ? `${colors.dark.inputBackground} ${colors.dark.inputText} ${colors.dark.inputBorder}`
                                    : `${colors.light.inputBackground} ${colors.light.inputText} ${colors.light.inputBorder}`
                                } border text-lg md:text-xl py-6 rounded-xl transition-all duration-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] focus:shadow-[0_0_0_3px_rgba(66,153,225,0.5)]`}
                              />
                            </div>
                          </div>
                          <Button type="submit" className={`w-full ${theme === 'dark' ? colors.dark.buttonGreen : colors.light.buttonGreen} transition-all duration-200 text-lg md:text-xl py-6 rounded-xl text-white transform hover:-translate-y-1 active:translate-y-0 shadow-[0_4px_6px_rgba(50,50,93,0.11),0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_7px_14px_rgba(50,50,93,0.1),0_3px_6px_rgba(0,0,0,0.08)]`}>
                            Iniciar Sesión
                          </Button>
                        </form>
                      </TabsContent>
                    </AnimatePresence>
                  </div>
                </Tabs>
              </CardContent>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </Card>

      {isAdminLoginOpen && (
        <Dialog open={isAdminLoginOpen} onOpenChange={setIsAdminLoginOpen}>
          <DialogContent className={`${theme === 'dark' ? colors.dark.cardBackground : colors.light.cardBackground} rounded-3xl border-none shadow-[0_10px_20px_rgba(0,0,0,0.2)]`}>
            <DialogHeader>
              <DialogTitle className={`text-2xl font-bold ${theme === 'dark' ? colors.dark.titleText : colors.light.titleText}`}>Inicio de Sesión de Administrador</DialogTitle>
              <DialogDescription className={`${theme === 'dark' ? colors.dark.descriptionText : colors.light.descriptionText}`}>
                Ingrese sus credenciales de administrador
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminEmail" className={`${theme === 'dark' ? colors.dark.titleText : colors.light.titleText}`}>
                  Email
                </Label>
                <Input
                  id="adminEmail"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className={`${
                    theme === 'dark'
                      ? `${colors.dark.inputBackground} ${colors.dark.inputText} ${colors.dark.inputBorder}`
                      : `${colors.light.inputBackground} ${colors.light.inputText} ${colors.light.inputBorder}`
                  } border rounded-xl transition-all duration-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] focus:shadow-[0_0_0_3px_rgba(66,153,225,0.5)]`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword" className={`${theme === 'dark' ? colors.dark.titleText : colors.light.titleText}`}>
                  Contraseña
                </Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className={`${
                    theme === 'dark'
                      ? `${colors.dark.inputBackground} ${colors.dark.inputText} ${colors.dark.inputBorder}`
                      : `${colors.light.inputBackground} ${colors.light.inputText} ${colors.light.inputBorder}`
                  } border rounded-xl transition-all duration-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] focus:shadow-[0_0_0_3px_rgba(66,153,225,0.5)]`}
                />
              </div>
              <Button type="submit" className={`w-full ${theme === 'dark' ? colors.dark.buttonBlue : colors.light.buttonBlue} text-white transition-all duration-200 rounded-xl py-2 shadow-[0_4px_6px_rgba(50,50,93,0.11),0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_7px_14px_rgba(50,50,93,0.1),0_3px_6px_rgba(0,0,0,0.08)]`}>
                Iniciar Sesión
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

