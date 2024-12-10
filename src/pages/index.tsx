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
import { ImageCarousel } from '../components/ImageCarousel'
import { Sidebar } from '../components/Sidebar'
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

const Loader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900"
    >
      <div className="w-32 aspect-square rounded-full relative flex justify-center items-center animate-spin-slow z-40 bg-[conic-gradient(white_0deg,white_300deg,transparent_270deg,transparent_360deg)]">
        <div className="absolute w-[60%] aspect-square rounded-full z-[80] animate-spin-medium bg-[conic-gradient(white_0deg,white_270deg,transparent_180deg,transparent_360deg)]" />
        <div className="absolute w-3/4 aspect-square rounded-full z-[60] animate-spin-slow bg-[conic-gradient(#065f46_0deg,#065f46_180deg,transparent_180deg,transparent_360deg)]" />
        <div className="absolute w-[85%] aspect-square rounded-full z-[60] animate-spin-extra-slow bg-[conic-gradient(#34d399_0deg,#34d399_180deg,transparent_180deg,transparent_360deg)]" />
      </div>
    </motion.div>
  )
}

export default function InterfazLaboratorio() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<UserType>('estudiante')
  const [matricula, setMatricula] = useState('')
  const [equipo, setEquipo] = useState('')
  const [userMatricula, setUserMatricula] = useState('')
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
  const [isLoading, setIsLoading] = useState(true)
  const [isRegularClassStarted, setIsRegularClassStarted] = useState(false)
  const [isGuestClassStarted, setIsGuestClassStarted] = useState(false)
  const [classChoice, setClassChoice] = useState<'regular' | 'guest' | null>(null)
  const [guestClassInfo, setGuestClassInfo] = useState<any>(null)
  const [lastGuestClassStatus, setLastGuestClassStatus] = useState<boolean>(false);
  const [lastRegularClassStatus, setLastRegularClassStatus] = useState<boolean>(false);

  const welcomeMessages = [
    '"Hombres y Mujeres Del Mar y Desierto',
    'Unidos Por La Educación Tecnológica De Calidad."',
  ]

  useEffect(() => {
    const currentTheme = getTheme();
    setThemeState(currentTheme);
    applyTheme(currentTheme);

    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribeRegularClass = onSnapshot(doc(db, 'EstadoClase', 'actual'), (doc) => {
      if (doc.exists()) {
        const newStatus = doc.data().iniciada;
        setIsRegularClassStarted(newStatus);
      
        if (newStatus !== lastRegularClassStatus) {
          setLastRegularClassStatus(newStatus);
          if (newStatus) {
            swal({
              title: "¡Clase regular iniciada!",
              text: "Ya puedes registrar tu asistencia",
              icon: "success",
            });
          } else {
            swal({
              title: "Clase regular finalizada",
              text: "El registro de asistencia está cerrado.",
              icon: "info",
            });
          }
        }
        setIsClassStarted(newStatus);
      }
    });

    const unsubscribeGuestClass = onSnapshot(doc(db, 'EstadoClaseInvitado', 'actual'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const newStatus = data.iniciada;
        setIsGuestClassStarted(newStatus);
      
        // Only show alert if status changed
        if (newStatus !== lastGuestClassStatus) {
          setLastGuestClassStatus(newStatus);
          if (newStatus) {
            swal({
              title: "¡Clase invitada iniciada!",
              text: `Maestro: ${data.MaestroInvitado}\nMateria: ${data.Materia}\nPráctica: ${data.Practica}\nHora de inicio: ${data.HoraInicio}`,
              icon: "success",
            });
          } else {
            swal({
              title: "Clase invitada finalizada",
              text: `La clase con el maestro ${data.MaestroInvitado} ha finalizado.`,
              icon: "info",
            });
          }
        }
        setGuestClassInfo(data);
      }
    });

    return () => {
      unsubscribeRegularClass()
      unsubscribeGuestClass()
    }
  }, [lastGuestClassStatus, lastRegularClassStatus]);

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
    }, 3500);

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

        if (!isRegularClassStarted && !isGuestClassStarted) {
          await swal({
            title: "Error",
            text: "No hay clases iniciadas en este momento.",
            icon: "error",
          })
          return
        }

        const selectedClass = isRegularClassStarted ? 'regular' : 'guest';

        // Check for duplicate matricula
        const asistenciasRef = collection(db, selectedClass === 'guest' ? 'AsistenciasInvitado' : 'Asistencias')
        const matriculaQuery = query(asistenciasRef, where("AlumnoId", "==", matricula))
        const matriculaSnapshot = await getDocs(matriculaQuery)

        if (!matriculaSnapshot.empty) {
          await swal({
            title: "Atención",
            text: "Ya has registrado tu asistencia.",
            icon: "warning",
          });
          return
        }

        // Check for duplicate equipo, except for personal equipment
        if (equipo !== 'personal') {
          const equipoQuery = query(asistenciasRef, where("Equipo", "==", equipo))
          const equipoSnapshot = await getDocs(equipoQuery)

          if (!equipoSnapshot.empty) {
            await swal({
              title: "Atención",
              text: "Este equipo ya ha sido registrado.",
              icon: "warning",
            });
            return
          }
        }

        // Get all student data
        const alumnoRef = doc(db, 'Alumnos', matricula)
        const alumnoSnap = await getDoc(alumnoRef)

        if (alumnoSnap.exists()) {
          const alumnoData = alumnoSnap.data()
          const asistenciaRef = doc(collection(db, selectedClass === 'guest' ? 'AsistenciasInvitado' : 'Asistencias'))

          // Copy all fields from Alumnos to Asistencias
          await setDoc(asistenciaRef, {
            AlumnoId: matricula,
            Nombre: alumnoData.Nombre ?? '',
            Apellido: alumnoData.Apellido ?? '',
            Carrera: alumnoData.Carrera ?? '',
            Grupo: alumnoData.Grupo ?? '',
            Semestre: alumnoData.Semestre ?? '',
            Turno: alumnoData.Turno ?? '',
            Equipo: equipo,
            Fecha: serverTimestamp(),
            ...(selectedClass === 'guest' ? {
              MaestroInvitado: guestClassInfo.MaestroInvitado,
              Materia: guestClassInfo.Materia
            } : {})
          })

          await swal({
            title: "¡Asistencia registrada!",
            text: `Tu asistencia se ha registrado correctamente para la ${selectedClass === 'guest' ? 'clase invitada' : 'clase regular'}.`,
            icon: "success",
          })

          setMatricula('')
          setEquipo('')
          setClassChoice(null)
        } else {
          await swal({
            title: "Error",
            text: "Matrícula no encontrada",
            icon: "error",
          })
        }
      } else if (activeTab === 'maestro') {
        if (!userMatricula || !password) {
          await swal({
            title: "Error",
            text: "Por favor, completa todos los campos.",
            icon: "error",
          })
          return
        }

        console.log('Intentando iniciar sesión:', { userType, userMatricula, password })

        const collectionName = userType === 'maestro' ? 'Docentes' : 'Laboratoristas'
        const userRef = doc(db, collectionName, userMatricula)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          console.log('Usuario no encontrado')
          await swal({
            title: "Error",
            text: "Credenciales incorrectas. Por favor, inténtalo de nuevo.",
            icon: "error",
          })
          return
        }

        const userData = userSnap.data()
        console.log('Datos del usuario:', userData)
        const passwordMatch = await bcrypt.compare(password, userData.Contraseña)

        if (!passwordMatch) {
          console.log('Contraseña incorrecta')
          await swal({
            title: "Error",
            text: "Credenciales incorrectas. Por favor, inténtalo de nuevo.",
            icon: "error",
          })
          return
        }

        console.log('Inicio de sesión exitoso')
        await swal({
          title: "¡Bienvenido!",
          text: "Inicio de sesión exitoso",
          icon: "success",
        })

        localStorage.setItem(userType === 'maestro' ? 'maestroId' : 'labTechId', userMatricula);

        router.push(userType === 'maestro' ? '/lista-asistencias' : '/panel-laboratorista')
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
      if (!adminEmail || !adminPassword) {
        await swal({
          title: "Error",
          text: "Por favor, completa todos los campos.",
          icon: "error",
        });
        return;
      }

      const adminRef = doc(db, 'Administrador', adminEmail)
      const adminSnap = await getDoc(adminRef)

      if (!adminSnap.exists()) {
        await swal({
          title: "Error",
          text: "Credenciales incorrectas. Por favor, inténtalo de nuevo.",
          icon: "error",
        });
        return;
      }

      const adminData = adminSnap.data()
      if (!adminData || !adminData.Contraseña) {
        await swal({
          title: "Error",
          text: "Error en los datos del administrador. Por favor, contacte al soporte técnico.",
          icon: "error",
        });
        return;
      }

      const passwordMatch = await bcrypt.compare(adminPassword, adminData.Contraseña)

      if (!passwordMatch) {
        await swal({
          title: "Error",
          text: "Credenciales incorrectas. Por favor, inténtalo de nuevo.",
          icon: "error",
        });
        return;
      }

      await swal({
        title: "¡Bienvenido Administrador!",
        text: "Inicio de sesión exitoso",
        icon: "success",
      })
      setIsAdminLoginOpen(false)
      router.push('/AdminPanel')
    } catch (error) {
      console.error('Error al procesar la solicitud:', error)
      let errorMessage = "Ha ocurrido un error. Por favor, intenta de nuevo."
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      await swal({
        title: "Error",
        text: errorMessage,
        icon: "error",
      })
    }
  }

  const carouselImages = [
    "/fondozugey.jpg",
   // "/fondo_de_pantalla_de_salon.jpeg",
    "/FondoItspp.png",
    "/tecnmImagen.png",
    "/LogoSistemas.png",
    "/momos.png",
  ]

  if (isLoading) {
    return <Loader />
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-green-50'} transition-colors duration-300`}>
      <div className="fixed top-2 left-2 z-50">
        <Sidebar isDarkMode={theme === 'dark'} onAdminLogin={() => setIsAdminLoginOpen(true)} adminLoginText="Administrador"/>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessageIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className={`text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-green-800'} mb-2 sm:mb-4 text-center z-10 p-1 sm:p-2 rounded-xl max-w-[95%] sm:max-w-[90%] mx-auto overflow-hidden`}
        >
          {welcomeMessages[currentMessageIndex]}
        </motion.div>
      </AnimatePresence>

      <Card className={`w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] xl:max-w-[75%] mx-auto overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-none relative z-10 shadow-lg rounded-xl sm:rounded-2xl`}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div 
            key={activeTab}
            className="flex flex-col lg:flex-row min-h-[70vh] sm:min-h-[80vh] relative overflow-hidden rounded-xl sm:rounded-2xl"
            {...TabAnimation}
          >
            <motion.div 
              className={`lg:w-2/5 relative h-48 sm:h-64 lg:h-auto ${isReversed ? 'order-last' : 'order-first'}`}
              custom={isReversed}
              variants={SlideAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ImageCarousel images={carouselImages} />
            </motion.div>

            <motion.div 
              className={`lg:w-3/5 relative flex flex-col ${isReversed ? 'order-first' : 'order-last'}`}
              custom={!isReversed}
              variants={SlideAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="absolute top-0 left-0 right-0 h-12 sm:h-16 flex justify-center items-center z-10 bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75">
                <div className="w-24 sm:w-32 h-12 sm:h-16 relative">
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
              <CardHeader className={`relative z-10 ${theme === 'dark' ? colors.dark.headerBackground : colors.light.headerBackground} p-2 sm:p-4`}>
                <div className="text-center">
                  <CardTitle className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold flex flex-col items-center justify-center ${theme === 'dark' ? colors.dark.titleText : colors.light.titleText} mb-1 sm:mb-2`}>
                    <Computer className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mb-1 sm:mb-2" />
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.8,
                        delay: 0.5,
                        ease: [0, 0.71, 0.2, 1.01]
                      }}
                    >
                      Laboratorio Programacion
                    </motion.span>
                  </CardTitle>
                </div>
                <div className={`mt-2 flex items-center justify-center space-x-2 sm:space-x-4`}>
                  <div className={`flex items-center space-x-1 sm:space-x-2 ${theme === 'dark' ? 'bg-gray-700 border border-gray-600' : 'bg-green-100 border border-green-200'} p-1 rounded-full transition-colors duration-200 shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#1c1c1c,inset_-2px_-2px_4px_#262626]`}>
                    <Sun className={`h-3 w-3 sm:h-4 sm:w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-yellow-500'}`} />
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={handleThemeToggle}
                      className={`${theme === 'dark' ? colors.dark.switchBackground : colors.light.switchBackground} data-[state=checked]:bg-green-600`}
                    />
                    <Moon className={`h-3 w-3 sm:h-4 sm:w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-gray-400'}`} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className={`p-2 sm:p-4 ${theme === 'dark' ? colors.dark.cardBackground : colors.light.cardBackground} flex-grow overflow-y-auto shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] rounded-b-lg sm:rounded-b-xl`}>
                <Tabs 
                  value={activeTab} 
                  onValueChange={(value) => {
                    setIsReversed(value === 'estudiante' ? false : true);
                    setActiveTab(value as UserType);
                    setUserType('maestro');
                    // Clear all input fields
                    setPassword('');
                    setMatricula('');
                    setUserMatricula('');
                    setEquipo('');
                  }} 
                  className="h-full flex flex-col"
                >
                  <TabsList className="grid w-full grid-cols-2 h-10 mb-2 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden p-1 bg-gray-100 dark:bg-gray-800">
                    {['estudiante', 'maestro'].map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className={`
                          relative flex items-center justify-center text-xs sm:text-sm md:text-base
                          ${theme === 'dark'
                            ? 'text-gray-400 data-[state=active]:text-white'
                            : 'text-green-700 data-[state=active]:text-gray-900'
                          } 
                          transition-all duration-300 z-10 h-full rounded-md sm:rounded-lg
                          data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700
                        `}
                      >
                        <motion.div
                          className="flex items-center justify-center w-full h-full"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {tab === 'estudiante' && <User className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />}
                          {tab === 'maestro' && <UserCog className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" />}
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </motion.div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  <div className="flex-grow overflow-y-auto">
                    <AnimatePresence mode="wait">
                      <TabsContent value="estudiante" className="flex-grow">
                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 h-full flex flex-col justify-between">
                          <div className="space-y-3 sm:space-y-4">
                            <div className="space-y-1 sm:space-y-2">
                              <Label htmlFor="matricula" className={`${theme === 'dark' ? 'text-gray-300' : 'text-green-700'} text-sm sm:text-base`}>Matrícula</Label>
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
                                } border text-xs sm:text-sm w-full py-1 sm:py-2 rounded-md sm:rounded-lg transition-all duration-200 shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#1c1c1c,inset_-2px_-2px_4px_#262626] focus:shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] dark:focus:shadow-[inset_3px_3px_6px_#151515,inset_-3px_-3px_6px_#292929]`}
                              />
                            </div>
                            <div className="space-y-1 sm:space-y-2">
                              <Label htmlFor="equipo" className={`${theme === 'dark' ? 'text-gray-300' : 'text-green-700'} text-sm sm:text-base`}>Número de Equipo</Label>
                              <Select onValueChange={setEquipo} value={equipo}>
                                <SelectTrigger id="equipo" className={`${
                                  theme === 'dark'
                                    ? `${colors.dark.inputBackground} ${colors.dark.inputText} ${colors.dark.inputBorder}`
                                    : `${colors.light.inputBackground} ${colors.light.inputText} ${colors.light.inputBorder}`
                                } border text-xs sm:text-sm w-full py-1 sm:py-2 rounded-md sm:rounded-lg transition-all duration-200 shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#1c1c1c,inset_-2px_-2px_4px_#262626] focus:shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] dark:focus:shadow-[inset_3px_3px_6px_#151515,inset_-3px_-3px_6px_#292929]`} >
                                  <SelectValue placeholder="Seleccione el equipo" />
                                </SelectTrigger>
                                <SelectContent className={`${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'} rounded-lg sm:rounded-xl border ${theme === 'dark' ? 'border-gray-600' : 'border-green-300'}`}>
                                  {equipmentList.map((equipment) => (
                                    <SelectItem 
                                      key={equipment.id} 
                                      value={equipment.id}
                                      disabled={equipment.fueraDeServicio}
                                      className={`text-xs sm:text-sm ${equipment.fueraDeServicio ? 'text-gray-400' : ''}`}
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
                              isRegularClassStarted || isGuestClassStarted ? (theme === 'dark' ? colors.dark.buttonGreen : colors.light.buttonGreen) : 'bg-gray-400'
                            } transition-all duration-200 text-xs sm:text-sm py-1 sm:py-2 rounded-md sm:rounded-lg text-white transform hover:-translate-y-1 active:translate-y-0 shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_#1c1c1c,-2px_-2px_4px_#262626] hover:shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] dark:hover:shadow-[3px_3px_6px_#151515,-3px_-3px_6px_#292929]`}
                            disabled={!isRegularClassStarted && !isGuestClassStarted}
                          >
                            {isRegularClassStarted || isGuestClassStarted ? 'Registrar Asistencia' : 'Esperando inicio de clase'}
                          </Button>
                        </form>
                      </TabsContent>
                      <TabsContent value="maestro" className="flex-grow">
                        <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4">
                          <Label className={`${theme === 'dark' ? 'text-gray-300' : 'text-green-700'} text-sm sm:text-base`}>Seleccione surol</Label>
                          <div className="flex space-x-2 sm:space-x-4">
                            <Button
                              onClick={() => {
                                setUserType('maestro');
                                setUserMatricula('');
                                setPassword('');
                              }}
                              className={`flex-1 ${userType === 'maestro' ? (theme === 'dark' ? colors.dark.buttonGreen : colors.light.buttonGreen) : 'bg-gray-400'} shadow-[0_2px_4px_rgba(50,50,93,0.1),0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_6px_rgba(50,50,93,0.1),0_2px_4px_rgba(0,0,0,0.08)]`}
                            >
                              Maestro
                            </Button>
                            <Button
                              onClick={() => {
                                setUserType('laboratorista');
                                setUserMatricula('');
                                setPassword('');
                              }}
                              className={`flex-1 ${userType === 'laboratorista' ? (theme === 'dark' ? colors.dark.buttonGreen : colors.light.buttonGreen) : 'bg-gray-400'} shadow-[0_2px_4px_rgba(50,50,93,0.1),0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_6px_rgba(50,50,93,0.1),0_2px_4px_rgba(0,0,0,0.08)]`}
                            >
                              Laboratorista
                            </Button>
                          </div>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 h-full flex flex-col justify-between">
                          <div className="space-y-3 sm:space-y-4">
                            <div className="space-y-1 sm:space-y-2">
                              <Label htmlFor="userMatricula" className={`${theme === 'dark' ? 'text-gray-300' : 'text-green-700'} text-sm sm:text-base`}>
                                Matrícula del {userType === 'maestro' ? 'Maestro' : 'Laboratorista'}
                              </Label>
                              <Input
                                id="userMatricula"
                                type="text"
                                placeholder={`Ingrese su matrícula de ${userType === 'maestro' ? 'maestro' : 'laboratorista'}`}
                                value={userMatricula}
                                onChange={(e) => handleNumberInput(e, setUserMatricula)}
                                className={`${
                                  theme === 'dark'
                                    ? `${colors.dark.inputBackground} ${colors.dark.inputText} ${colors.dark.inputBorder}`
                                    : `${colors.light.inputBackground} ${colors.light.inputText} ${colors.light.inputBorder}`
                                } border text-xs sm:text-sm w-full py-1 sm:py-2 rounded-md sm:rounded-lg transition-all duration-200 shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#1c1c1c,inset_-2px_-2px_4px_#262626] focus:shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] dark:focus:shadow-[inset_3px_3px_6px_#151515,inset_-3px_-3px_6px_#292929]`}
                              />
                            </div>
                            <div className="space-y-1 sm:space-y-2">
                              <Label htmlFor="password" className={`${theme === 'dark' ? 'text-gray-300' : 'text-green-700'} text-sm sm:text-base`}>Contraseña</Label>
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
                                } border text-xs sm:text-sm w-full py-1 sm:py-2 rounded-md sm:rounded-lg transition-all duration-200 shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#1c1c1c,inset_-2px_-2px_4px_#262626] focus:shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] dark:focus:shadow-[inset_3px_3px_6px_#151515,inset_-3px_-3px_6px_#292929]`}
                              />
                            </div>
                          </div>
                          <Button type="submit" className={`w-full ${theme === 'dark' ? colors.dark.buttonGreen : colors.light.buttonGreen} transition-all duration-200 text-xs sm:text-sm py-1 sm:py-2 rounded-md sm:rounded-lg text-white transform hover:-translate-y-1 active:translate-y-0 shadow-[2px_2px_4px_#bebebe,-2px_-2px_4px_#ffffff] dark:shadow-[2px_2px_4px_#1c1c1c,-2px_-2px_4px_#262626] hover:shadow-[3px_3px_6px_#bebebe,-3px_-3px_6px_#ffffff] dark:hover:shadow-[3px_3px_6px_#151515,-3px_-3px_6px_#292929]`}>
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
          <DialogContent className={`${theme === 'dark' ? colors.dark.cardBackground : colors.light.cardBackground} rounded-xl sm:rounded-2xl border-none shadow-[0_5px_15px_rgba(0,0,0,0.2)] p-3 sm:p-4`}>
            <DialogHeader>
              <DialogTitle className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? colors.dark.titleText : colors.light.titleText}`}>Inicio de Sesión de Administrador</DialogTitle>
              <DialogDescription className={`${theme === 'dark' ? colors.dark.descriptionText : colors.light.descriptionText}`}>
                Ingrese sus credenciales de administrador
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdminLogin} className="space-y-3 sm:space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="adminEmail" className={`${theme === 'dark' ? colors.dark.titleText : colors.light.titleText}`}>
                  ID de Administrador
                </Label>
                <Input
                  id="adminEmail"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Ingrese el ID de administrador"
                  className={`${
                    theme === 'dark'
                      ? `${colors.dark.inputBackground} ${colors.dark.inputText} ${colors.dark.inputBorder}`
                      : `${colors.light.inputBackground} ${colors.light.inputText} ${colors.light.inputBorder}`
                  } border rounded-md sm:rounded-lg transition-all duration-200 shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#1c1c1c,inset_-2px_-2px_4px_#262626] focus:shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] dark:focus:shadow-[inset_3px_3px_6px_#151515,inset_-3px_-3px_6px_#292929]`}
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
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
                  } border rounded-md sm:rounded-lg transition-all duration-200 shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] dark:shadow-[inset_2px_2px_4px_#1c1c1c,inset_-2px_-2px_4px_#262626] focus:shadow-[inset_3px_3px_6px_#bebebe,inset_-3px_-3px_6px_#ffffff] dark:focus:shadow-[inset_3px_3px_6px_#151515,inset_-3px_-3px_6px_#292929]`}
                />
              </div>
              <Button type="submit" className={`w-full ${theme === 'dark' ? colors.dark.buttonBlue : colors.light.buttonBlue} text-white transition-all duration-200 rounded-md sm:rounded-lg py-1 sm:py-2 shadow-[0_2px_4px_rgba(50,50,93,0.1),0_1px_2px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_6px_rgba(50,50,93,0.1),0_2px_4px_rgba(0,0,0,0.08)]`}>
                Iniciar Sesión
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
      <style jsx global>{`
        html {
          font-size: 14px;
        }
        @media (min-width: 640px) {
          html {
            font-size: 16px;
          }
        }
        @media (min-width: 1024px) {
          html {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  )
}

