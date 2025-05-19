"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, UserCog, Computer, Moon, Sun } from "lucide-react"
import { initializeApp } from "firebase/app"
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageCarousel } from "../components/ImageCarousel"
import { Sidebar } from "../components/Sidebar"
import { getTheme, toggleTheme, applyTheme, type Theme } from "../lib/theme"

import Image from "next/image"
import swal from "sweetalert"
import { motion, AnimatePresence } from "framer-motion"
import bcrypt from "bcryptjs"

const firebaseConfig = {
  apiKey: "AIzaSyCX5WX8tTkWRsIikpV3-pTXIsYUXfF5Eqk",
  authDomain: "integrador-7b39d.firebaseapp.com",
  projectId: "integrador-7b39d",
  storageBucket: "integrador-7b39d.appspot.com",
  messagingSenderId: "780966021686",
  appId: "1:780966021686:web:485712fb7509339c6ae697",
  measurementId: "G-FGB03PFM7Z",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

type UserType = "estudiante" | "maestro"

interface Equipment {
  id: string
  fueraDeServicio: boolean
  enUso?: boolean
}

// Modificar la definición de colores para intercambiar los colores principales
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
    badge: "bg-[#800040]",
    badgeOutline: "border-[#800040] text-[#800040]",
    badgeSecundario: "bg-[#800040]/20 text-[#800040]",
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
    badge: "bg-[#1d5631]",
    badgeOutline: "border-[#1d5631] text-[#2a7a45]",
    badgeSecundario: "bg-[#1d5631]/20 text-[#1d5631]",
  },
}

const TabAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

const SlideAnimation = {
  initial: (isReversed: boolean) => ({
    x: isReversed ? "100%" : "-100%",
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
  },
  exit: (isReversed: boolean) => ({
    x: isReversed ? "-100%" : "100%",
    opacity: 0,
  }),
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
}

const Loader = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center h-screen bg-[#f0fff4] dark:bg-[#0c1f1a]"
    >
      <div className="relative flex flex-col items-center">
        <div className="w-32 aspect-square rounded-full relative flex justify-center items-center animate-spin-slow z-40 bg-[conic-gradient(#1BB827_0deg,#1BB827_300deg,transparent_270deg,transparent_360deg)]">
          <div className="absolute w-[60%] aspect-square rounded-full z-[80] animate-spin-medium bg-[conic-gradient(#1BB827_0deg,#1BB827_270deg,transparent_180deg,transparent_360deg)]" />
          <div className="absolute w-3/4 aspect-square rounded-full z-[60] animate-spin-slow bg-[conic-gradient(#1C4A3F_0deg,#1C4A3F_180deg,transparent_180deg,transparent_360deg)]" />
          <div className="absolute w-[85%] aspect-square rounded-full z-[60] animate-spin-extra-slow bg-[conic-gradient(#25D533_0deg,#25D533_180deg,transparent_180deg,transparent_360deg)]" />
        </div>
        <div className="mt-8 text-[#1C4A3F] dark:text-white text-xl font-medium">Cargando...</div>
      </div>
    </motion.div>
  )
}

export default function InterfazLaboratorio() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<UserType>("estudiante")
  const [matricula, setMatricula] = useState("")
  const [equipo, setEquipo] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [matriculaInvitado, setMatriculaInvitado] = useState("")
  const [userMatricula, setUserMatricula] = useState("")
  const [password, setPassword] = useState("")
  const [isClassStarted, setIsClassStarted] = useState(false)
  const [theme, setThemeState] = useState<Theme>("light")
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [isReversed, setIsReversed] = useState(false)
  const [userType, setUserType] = useState<"maestro" | "laboratorista">("maestro")
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isGuestClassStarted, setIsGuestClassStarted] = useState(false)
  const [guestClassInfo, setGuestClassInfo] = useState<any>(null)
  const [lastGuestClassStatus, setLastGuestClassStatus] = useState<boolean>(false)
  const [classChoice, setClassChoice] = useState<"normal" | "invitado">("normal")
  const [classInfo, setClassInfo] = useState<any>(null)

  const welcomeMessages = ['"Hombres y Mujeres Del Mar y Desierto', 'Unidos Por La Educación Tecnológica De Calidad."']

  useEffect(() => {
    const currentTheme = getTheme()
    setThemeState(currentTheme)
    applyTheme(currentTheme)

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Verificar si hay una clase normal iniciada
    const unsubscribeClass = onSnapshot(doc(db, "EstadoClase", "actual"), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const isStarted = data.iniciada === true
        setIsClassStarted(isStarted)
        if (isStarted) {
          setClassInfo(data)
          console.log("Clase normal actualizada:", data)
        } else {
          setClassInfo(null)
          console.log("Clase normal finalizada")
        }
      }
    })

    // Verificar si hay una clase de invitado iniciada
    const unsubscribeGuestClass = onSnapshot(doc(db, "EstadoClaseInvitado", "actual"), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const newStatus = data.iniciada
        setIsGuestClassStarted(newStatus)
        console.log("Estado de clase invitado actualizado:", newStatus)

        // Only show alert if status changed
        if (newStatus !== lastGuestClassStatus) {
          setLastGuestClassStatus(newStatus)
          if (newStatus) {
            swal({
              title: "¡Clase iniciada!",
              text: `Maestro: ${data.MaestroInvitado}
Materia: ${data.Materia}
Práctica: ${data.Practica}
Hora de inicio: ${data.HoraInicio}`,
              icon: "success",
            })
          } else {
            swal({
              title: "Clase finalizada",
              text: `La clase con el maestro ${data.MaestroInvitado} ha finalizada.`,
              icon: "info",
            })

            // Cuando finaliza la clase, resetear el estado "enUso" de todos los equipos
            resetEquiposEnUso()
          }
        }
        setGuestClassInfo(data)
      }
    })

    return () => {
      unsubscribeClass()
      unsubscribeGuestClass()
    }
  }, [])

  // Añadir este efecto después del useEffect que verifica las clases
  useEffect(() => {
    const handleBeforeUnload = async (event: BeforeUnloadEvent) => {
      // Verificar si hay una sesión de maestro activa
      const storedMaestroId = localStorage.getItem("maestroId")
      const storedLabTechId = localStorage.getItem("labTechId")

      if (storedMaestroId || storedLabTechId) {
        try {
          // Verificar si hay una clase iniciada por este maestro
          const estadoRef = doc(db, "EstadoClase", "actual")
          const estadoDoc = await getDoc(estadoRef)

          if (
            estadoDoc.exists() &&
            estadoDoc.data().iniciada === true &&
            estadoDoc.data().maestroId === storedMaestroId
          ) {
            // Hay una clase activa iniciada por este maestro, finalizarla
            const horaActual = new Date().toLocaleTimeString()

            // Actualizar el estado de la clase
            await setDoc(estadoRef, {
              iniciada: false,
              horaFin: horaActual,
              finalizadaAutomaticamente: true,
            })

            // Resetear el estado de los equipos
            await resetEquiposEnUso()

            // Registrar la acción
            console.log("Clase finalizada automáticamente debido al cierre del navegador")
          }

          // Verificar si hay una clase de invitado iniciada por este laboratorista
          if (storedLabTechId) {
            const estadoInvitadoRef = doc(db, "EstadoClaseInvitado", "actual")
            const estadoInvitadoDoc = await getDoc(estadoInvitadoRef)

            if (estadoInvitadoDoc.exists() && estadoInvitadoDoc.data().iniciada === true) {
              // Finalizar la clase de invitado
              await setDoc(estadoInvitadoRef, {
                iniciada: false,
                horaFin: new Date().toLocaleTimeString(),
                finalizadaAutomaticamente: true,
              })

              // Resetear el estado de los equipos
              await resetEquiposEnUso()

              console.log("Clase de invitado finalizada automáticamente debido al cierre del navegador")
            }
          }

          // Eliminar las sesiones
          localStorage.removeItem("maestroId")
          localStorage.removeItem("labTechId")
        } catch (error) {
          console.error("Error al finalizar la clase automáticamente:", error)
        }
      }
    }

    // Registrar el evento beforeunload
    window.addEventListener("beforeunload", handleBeforeUnload)

    // Limpiar el evento cuando el componente se desmonte
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  // Efecto separado para manejar los cambios en lastGuestClassStatus
  useEffect(() => {
    // Este efecto se ejecutará cuando cambie lastGuestClassStatus
    // pero no afectará a los listeners de Firestore
  }, [lastGuestClassStatus])

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "Numero de equipos", "equipos"), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const dbEquipment = data.Equipos || []
        setEquipmentList([{ id: "personal", fueraDeServicio: false }, ...dbEquipment])
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % welcomeMessages.length)
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  const handleThemeToggle = () => {
    const newTheme = toggleTheme()
    setThemeState(newTheme)
    applyTheme(newTheme)
  }

  // Función para resetear el estado "enUso" de todos los equipos
  const resetEquiposEnUso = async () => {
    try {
      const equipoRef = doc(db, "Numero de equipos", "equipos")
      const equipoDoc = await getDoc(equipoRef)

      if (equipoDoc.exists()) {
        const equiposData = equipoDoc.data()
        const equiposActualizados = equiposData.Equipos.map((eq: Equipment) => ({
          ...eq,
          enUso: false,
        }))

        await setDoc(equipoRef, { Equipos: equiposActualizados })
      }
    } catch (error) {
      console.error("Error al restablecer el estado de los equipos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (activeTab === "estudiante") {
        // Verificar si hay alguna clase iniciada
        const isAnyClassStarted = isClassStarted || isGuestClassStarted
        if (!isAnyClassStarted) {
          await swal({
            title: "Error",
            text: "No hay clases iniciadas en este momento.",
            icon: "error",
          })
          return
        }

        // Determinar qué tipo de clase está activa
        const selectedClass = isGuestClassStarted ? "invitado" : "normal"
        setClassChoice(selectedClass as "normal" | "invitado")

        // Colección de asistencias según el tipo de clase
        const asistenciasCollection = selectedClass === "invitado" ? "AsistenciasInvitado" : "Asistencias"

        // Para clase normal, verificar matrícula y equipo
        if (selectedClass === "normal") {
          if (!matricula || !equipo) {
            await swal({
              title: "Error",
              text: "Por favor, completa todos los campos.",
              icon: "error",
            })
            return
          }

          try {
            // Check for duplicate matricula
            const asistenciasRef = collection(db, asistenciasCollection)
            const matriculaQuery = query(asistenciasRef, where("AlumnoId", "==", matricula))
            const matriculaSnapshot = await getDocs(matriculaQuery)

            if (!matriculaSnapshot.empty) {
              await swal({
                title: "Atención",
                text: "Ya has registrado tu asistencia.",
                icon: "warning",
              })
              return
            }

            // Check for duplicate equipo, except for personal equipment
            if (equipo !== "personal") {
              const equipoQuery = query(asistenciasRef, where("Equipo", "==", equipo))
              const equipoSnapshot = await getDocs(equipoQuery)

              if (!equipoSnapshot.empty) {
                await swal({
                  title: "Atención",
                  text: "Este equipo ya ha sido registrado.",
                  icon: "warning",
                })
                return
              }
            }

            // Get all student data
            const alumnoRef = doc(db, "Alumnos", matricula)
            const alumnoSnap = await getDoc(alumnoRef)

            if (alumnoSnap.exists()) {
              const alumnoData = alumnoSnap.data()
              const asistenciaRef = doc(collection(db, asistenciasCollection))

              // Datos comunes para ambos tipos de asistencia
              const commonData = {
                AlumnoId: matricula,
                Nombre: alumnoData.Nombre ?? "",
                Apellido: alumnoData.Apellido ?? "",
                Carrera: alumnoData.Carrera ?? "",
                Grupo: alumnoData.Grupo ?? "",
                Semestre: alumnoData.Semestre ?? "",
                Turno: alumnoData.Turno ?? "",
                Equipo: equipo,
                Fecha: serverTimestamp(),
              }

              // Datos específicos según el tipo de clase
              if (classInfo) {
                // Para clase normal
                await setDoc(asistenciaRef, {
                  ...commonData,
                  MaestroNombre: classInfo.maestroNombre || "",
                  MaestroApellido: classInfo.maestroApellido || "",
                  Materia: classInfo.materiaNombre || "",
                  Practica: classInfo.practicaTitulo || "",
                })
              } else {
                // Caso básico sin información adicional
                await setDoc(asistenciaRef, commonData)
              }

              // Marcar el equipo como "en uso" si no es equipo personal
              if (equipo !== "personal") {
                try {
                  const equipoRef = doc(db, "Numero de equipos", "equipos")
                  const equipoDoc = await getDoc(equipoRef)

                  if (equipoDoc.exists()) {
                    const equiposData = equipoDoc.data()
                    const equiposActualizados = equiposData.Equipos.map((eq: Equipment) => {
                      if (eq.id === equipo) {
                        return { ...eq, enUso: true }
                      }
                      return eq
                    })

                    await setDoc(equipoRef, { Equipos: equiposActualizados })
                  }
                } catch (error) {
                  console.error("Error al actualizar el estado del equipo:", error)
                }
              }

              await swal({
                title: "¡Asistencia registrada!",
                text: "Tu asistencia se ha registrado correctamente.",
                icon: "success",
              })

              setMatricula("")
              setEquipo("")
            } else {
              await swal({
                title: "Error",
                text: "Matrícula no encontrada",
                icon: "error",
              })
            }
          } catch (error) {
            console.error("Error al procesar la asistencia:", error)
            await swal({
              title: "Error",
              text: `Error al procesar la asistencia: ${error instanceof Error ? error.message : "Error desconocido"}`,
              icon: "error",
            })
          }
        } else {
          // Para clase invitada, verificar nombre, apellido y equipo
          if (!nombre || !apellido || !equipo) {
            await swal({
              title: "Error",
              text: "Por favor, completa todos los campos.",
              icon: "error",
            })
            return
          }

          try {
            // Check for duplicate equipo, except for personal equipment
            if (equipo !== "personal") {
              const asistenciasRef = collection(db, asistenciasCollection)
              const equipoQuery = query(asistenciasRef, where("Equipo", "==", equipo))
              const equipoSnapshot = await getDocs(equipoQuery)

              if (!equipoSnapshot.empty) {
                await swal({
                  title: "Atención",
                  text: "Este equipo ya ha sido registrado.",
                  icon: "warning",
                })
                return
              }
            }

            // Generar un ID único para el alumno invitado
            const alumnoId = matriculaInvitado ? matriculaInvitado : `INV-${Date.now()}`
            const asistenciaRef = doc(collection(db, asistenciasCollection))

            // Datos para asistencia de invitado
            const invitadoData = {
              AlumnoId: alumnoId,
              Nombre: nombre,
              Apellido: apellido,
              Carrera: "Externo",
              Grupo: "Externo",
              Semestre: "Externo",
              Turno: "Externo",
              Equipo: equipo,
              Fecha: serverTimestamp(),
            }

            // Añadir datos específicos de la clase invitada
            if (guestClassInfo) {
              await setDoc(asistenciaRef, {
                ...invitadoData,
                MaestroInvitado: guestClassInfo.MaestroInvitado || "",
                Materia: guestClassInfo.Materia || "",
                Practica: guestClassInfo.Practica || "",
                Departamento: guestClassInfo.Departamento || "",
              })
            } else {
              await setDoc(asistenciaRef, invitadoData)
            }

            // Marcar el equipo como "en uso" si no es equipo personal
            if (equipo !== "personal") {
              try {
                const equipoRef = doc(db, "Numero de equipos", "equipos")
                const equipoDoc = await getDoc(equipoRef)

                if (equipoDoc.exists()) {
                  const equiposData = equipoDoc.data()
                  const equiposActualizados = equiposData.Equipos.map((eq: Equipment) => {
                    if (eq.id === equipo) {
                      return { ...eq, enUso: true }
                    }
                    return eq
                  })

                  await setDoc(equipoRef, { Equipos: equiposActualizados })
                }
              } catch (error) {
                console.error("Error al actualizar el estado del equipo:", error)
              }
            }

            await swal({
              title: "¡Asistencia registrada!",
              text: `Tu asistencia se ha registrado correctamente para la clase con ${guestClassInfo?.MaestroInvitado || "el maestro invitado"}.`,
              icon: "success",
            })

            setNombre("")
            setApellido("")
            setEquipo("")
            setMatriculaInvitado("")
          } catch (error) {
            console.error("Error al procesar la asistencia de invitado:", error)
            await swal({
              title: "Error",
              text: `Error al procesar la asistencia: ${error instanceof Error ? error.message : "Error desconocido"}`,
              icon: "error",
            })
          }
        }
      } else if (activeTab === "maestro") {
        if (!userMatricula || !password) {
          await swal({
            title: "Error",
            text: "Por favor, completa todos los campos.",
            icon: "error",
          })
          return
        }

        console.log("Intentando iniciar sesión:", { userType, userMatricula, password })

        const collectionName = userType === "maestro" ? "Docentes" : "Laboratoristas"
        const userRef = doc(db, collectionName, userMatricula)
        const userSnap = await getDoc(userRef)

        if (!userSnap.exists()) {
          console.log("Usuario no encontrado")
          await swal({
            title: "Error",
            text: "Credenciales incorrectas. Por favor, inténtalo de nuevo.",
            icon: "error",
          })
          return
        }

        const userData = userSnap.data()
        console.log("Datos del usuario:", userData)
        const passwordMatch = await bcrypt.compare(password, userData.Contraseña)

        if (!passwordMatch) {
          console.log("Contraseña incorrecta")
          await swal({
            title: "Error",
            text: "Credenciales incorrectas. Por favor, inténtalo de nuevo.",
            icon: "error",
          })
          return
        }

        console.log("Inicio de sesión exitoso")
        await swal({
          title: "¡Bienvenido!",
          text: "Inicio de sesión exitoso",
          icon: "success",
        })

        localStorage.setItem(userType === "maestro" ? "maestroId" : "labTechId", userMatricula)

        router.push(userType === "maestro" ? "/lista-asistencias" : "/panel-laboratorista")
      }
    } catch (error) {
      console.error("Error al procesar la solicitud:", error)
      await swal({
        title: "Error",
        text: `Ha ocurrido un error: ${error instanceof Error ? error.message : "Error desconocido"}`,
        icon: "error",
      })
    }
  }

  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    const value = e.target.value.replace(/\D/g, "")
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
        })
        return
      }

      console.log("Intentando iniciar sesión como administrador:", { adminEmail })

      // Primero, intentamos buscar por matrícula directamente
      const adminRef = doc(db, "Administrador", adminEmail)
      const adminSnap = await getDoc(adminRef)

      if (!adminSnap.exists()) {
        console.log("Administrador no encontrado por matrícula, buscando por email...")

        // Si no se encuentra por matrícula, intentamos buscar por email
        const adminQuery = query(collection(db, "Administrador"), where("Email", "==", adminEmail))
        const querySnapshot = await getDocs(adminQuery)

        if (querySnapshot.empty) {
          console.log("Administrador no encontrado")
          await swal({
            title: "Administrador no encontrado",
            text: "No existe un administrador con esa matrícula o correo electrónico.",
            icon: "error",
          })
          return
        }

        // Si encontramos por email, usamos ese documento
        const adminDoc = querySnapshot.docs[0]
        const adminData = adminDoc.data()

        if (!adminData || !adminData.Contraseña) {
          console.log("Error en los datos del administrador")
          await swal({
            title: "Error",
            text: "Error en los datos del administrador. Por favor, contacte al soporte técnico.",
            icon: "error",
          })
          return
        }

        console.log("Verificando contraseña para administrador encontrado por email")
        const passwordMatch = await bcrypt.compare(adminPassword, adminData.Contraseña)

        if (!passwordMatch) {
          console.log("Contraseña incorrecta para administrador")
          await swal({
            title: "Contraseña incorrecta",
            text: "La contraseña ingresada no es correcta. Por favor, inténtalo de nuevo.",
            icon: "error",
          })
          return
        }

        console.log("Inicio de sesión exitoso como administrador")
        await swal({
          title: "¡Bienvenido Administrador!",
          text: `Inicio de sesión exitoso. Bienvenido ${adminData.Nombre} ${adminData.Apellido}`,
          icon: "success",
        })

        // Guardar el ID del administrador en localStorage
        localStorage.setItem("adminId", adminDoc.id)

        setIsAdminLoginOpen(false)
        router.push("/AdminPanel")
        return
      }

      // Si llegamos aquí, encontramos al administrador por matrícula
      const adminData = adminSnap.data()
      if (!adminData || !adminData.Contraseña) {
        console.log("Error en los datos del administrador")
        await swal({
          title: "Error",
          text: "Error en los datos del administrador. Por favor, contacte al soporte técnico.",
          icon: "error",
        })
        return
      }

      console.log("Administrador encontrado por matrícula, verificando contraseña")
      await swal({
        title: "Administrador encontrado",
        text: `Se encontró al administrador ${adminData.Nombre} ${adminData.Apellido}`,
        icon: "info",
      })

      // Usar bcrypt.compare para comparar la contraseña ingresada con la hasheada
      const passwordMatch = await bcrypt.compare(adminPassword, adminData.Contraseña)

      if (!passwordMatch) {
        console.log("Contraseña incorrecta para administrador")
        await swal({
          title: "Contraseña incorrecta",
          text: "La contraseña ingresada no es correcta. Por favor, inténtalo de nuevo.",
          icon: "error",
        })
        return
      }

      console.log("Inicio de sesión exitoso como administrador")
      await swal({
        title: "¡Bienvenido Administrador!",
        text: `Inicio de sesión exitoso. Bienvenido ${adminData.Nombre} ${adminData.Apellido}`,
        icon: "success",
      })

      // Guardar el ID del administrador en localStorage
      localStorage.setItem("adminId", adminEmail)

      setIsAdminLoginOpen(false)
      router.push("/AdminPanel")
    } catch (error) {
      console.error("Error al procesar la solicitud:", error)
      let errorMessage = "Ha ocurrido un error. Por favor, intenta de nuevo."
      if (error instanceof Error) {
        errorMessage = error.message
      }
      await swal({
        title: "Error",
        text: errorMessage,
        icon: "error",
      })
    }
  }

  const carouselImages = ["/fondo chato.jpg", "/FondoItspp.png", "/tecnmImagen.png", "/LogoSistemas.png"]

  if (isLoading) {
    return <Loader />
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 ${
        theme === "dark" ? "dark bg-[#0c1f1a]" : "bg-[#f0fff4]"
      } transition-colors duration-300`}
    >
      <div className="fixed top-2 left-2 z-50">
        <Sidebar
          isDarkMode={theme === "dark"}
          onAdminLogin={() => setIsAdminLoginOpen(true)}
          adminLoginText="Administrador"
        />
      </div>

      {/* Botón de cambio de tema */}
      <button
        onClick={handleThemeToggle}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-300 ${
          theme === "dark" ? "bg-[#1C4A3F] text-white hover:bg-[#153731]" : "bg-[#1BB827] text-white hover:bg-[#18a423]"
        }`}
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessageIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className={`text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold ${
            theme === "dark" ? "text-white" : "text-[#1C4A3F]"
          } mb-6 sm:mb-8 text-center z-10 p-2 sm:p-3 rounded-xl max-w-[95%] sm:max-w-[90%] mx-auto overflow-hidden`}
        >
          {welcomeMessages[currentMessageIndex]}
        </motion.div>
      </AnimatePresence>

      <Card
        className={`w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] xl:max-w-[75%] mx-auto overflow-hidden ${
          theme === "dark" ? "bg-[#1C4A3F]" : "bg-white"
        } border-none relative z-10 shadow-xl rounded-2xl sm:rounded-3xl`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            className="flex flex-col lg:flex-row min-h-[70vh] sm:min-h-[80vh] relative overflow-hidden rounded-2xl sm:rounded-3xl"
            {...TabAnimation}
          >
            <motion.div
              className={`lg:w-2/5 relative h-53 sm:h-69 lg:h-auto ${isReversed ? "order-last" : "order-first"}`}
              custom={isReversed}
              variants={SlideAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ImageCarousel images={carouselImages} />
            </motion.div>

            <motion.div
              className={`lg:w-3/5 relative flex flex-col ${isReversed ? "order-first" : "order-last"}`}
              custom={!isReversed}
              variants={SlideAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="absolute top-0 left-0 right-0 h-16 sm:h-20 flex justify-center items-center z-10 bg-white/80 dark:bg-[#1C4A3F]/80 backdrop-blur-sm">
                <div className="w-28 sm:w-36 h-14 sm:h-18 relative">
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
              <CardHeader
                className={`relative z-10 ${
                  theme === "dark" ? colors.dark.headerBackground : colors.light.headerBackground
                } p-6 sm:p-8 pt-20 sm:pt-24`}
              >
                <div className="text-center">
                  <CardTitle
                    className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold flex flex-col items-center justify-center ${
                      theme === "dark" ? "text-white" : "text-white"
                    } mb-2 sm:mb-3`}
                  >
                    <Computer className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 sm:mb-3" />
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.8,
                        delay: 0.5,
                        ease: [0, 0.71, 0.2, 1.01],
                      }}
                    >
                      Laboratorio Programación
                    </motion.span>
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent
                className={`flex-grow flex flex-col justify-center items-center p-6 sm:p-8 ${
                  theme === "dark" ? colors.dark.cardBackground : colors.light.cardBackground
                }`}
              >
                <Tabs
                  defaultValue="estudiante"
                  className="w-full max-w-md mx-auto"
                  value={activeTab}
                  onValueChange={(value) => {
                    setIsReversed(!isReversed)
                    setTimeout(() => {
                      setActiveTab(value as UserType)
                    }, 100)
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-[#1BB827]/10 dark:bg-[#1BB827]/20 rounded-xl">
                    <TabsTrigger
                      value="estudiante"
                      className={`text-sm sm:text-base py-3 rounded-lg transition-all duration-300 ${
                        theme === "dark"
                          ? "data-[state=active]:bg-[#1BB827] data-[state=active]:text-white"
                          : "data-[state=active]:bg-[#1BB827] data-[state=active]:text-white"
                      }`}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Estudiante
                    </TabsTrigger>
                    <TabsTrigger
                      value="maestro"
                      className={`text-sm sm:text-base py-3 rounded-lg transition-all duration-300 ${
                        theme === "dark"
                          ? "data-[state=active]:bg-[#1BB827] data-[state=active]:text-white"
                          : "data-[state=active]:bg-[#1BB827] data-[state=active]:text-white"
                      }`}
                    >
                      <UserCog className="w-4 h-4 mr-2" />
                      Maestro/Laboratorista
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="estudiante" className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Estado de las clases */}
                      <div className="space-y-3">
                        <Label
                          htmlFor="classStatus"
                          className={`text-sm sm:text-base font-medium ${
                            theme === "dark" ? colors.dark.titleText : colors.light.titleText
                          }`}
                        >
                          Estado de Clases
                        </Label>
                        <div
                          className={`p-3 rounded-xl ${
                            theme === "dark" ? "bg-[#153731] text-white" : "bg-[#e6ffe9] text-[#1C4A3F]"
                          }`}
                        >
                          {isClassStarted || isGuestClassStarted ? (
                            <>
                              <div className="flex items-center justify-center mb-2">
                                <div
                                  className={`w-3 h-3 rounded-full animate-pulse mr-2 ${
                                    theme === "dark" ? "bg-green-400" : "bg-green-500"
                                  }`}
                                ></div>
                                <p className="font-medium text-center">¡Clase activa en este momento!</p>
                              </div>

                              {isClassStarted && classInfo && (
                                <div className="mt-3 p-3 rounded-lg bg-opacity-20 bg-white">
                                  <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                                    <span className="font-semibold">Maestro:</span>
                                    <span>
                                      {classInfo.maestroNombre} {classInfo.maestroApellido}
                                    </span>

                                    <span className="font-semibold">Materia:</span>
                                    <span>{classInfo.materiaNombre}</span>

                                    <span className="font-semibold">Práctica:</span>
                                    <span>{classInfo.practicaTitulo}</span>

                                    <span className="font-semibold">Inicio:</span>
                                    <span>{classInfo.horaInicio}</span>
                                  </div>
                                </div>
                              )}

                              {isGuestClassStarted && guestClassInfo && (
                                <div className="mt-3 p-3 rounded-lg bg-opacity-20 bg-white">
                                  <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                                    <span className="font-semibold">Maestro:</span>
                                    <span>{guestClassInfo.MaestroInvitado}</span>

                                    <span className="font-semibold">Materia:</span>
                                    <span>{guestClassInfo.Materia}</span>

                                    <span className="font-semibold">Práctica:</span>
                                    <span>{guestClassInfo.Practica}</span>

                                    <span className="font-semibold">Inicio:</span>
                                    <span>{guestClassInfo.HoraInicio}</span>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center justify-center">
                              <div
                                className={`w-3 h-3 rounded-full mr-2 ${
                                  theme === "dark" ? "bg-red-400" : "bg-red-500"
                                }`}
                              ></div>
                              <p className="font-medium text-center">No hay clases iniciadas en este momento</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Formulario para clase normal */}
                      {isClassStarted && !isGuestClassStarted && (
                        <>
                          <div className="space-y-3">
                            <Label
                              htmlFor="matricula"
                              className={`text-sm sm:text-base font-medium ${
                                theme === "dark" ? colors.dark.titleText : colors.light.titleText
                              }`}
                            >
                              Matrícula
                            </Label>
                            <Input
                              id="matricula"
                              type="text"
                              value={matricula}
                              onChange={(e) => handleNumberInput(e, setMatricula)}
                              placeholder="Ingresa tu matrícula"
                              className={`${
                                theme === "dark" ? colors.dark.inputBackground : colors.light.inputBackground
                              } ${theme === "dark" ? colors.dark.inputBorder : colors.light.inputBorder} ${
                                theme === "dark" ? colors.dark.inputText : colors.light.inputText
                              } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                              maxLength={8}
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <Label
                              htmlFor="equipo"
                              className={`text-sm sm:text-base font-medium ${
                                theme === "dark" ? colors.dark.titleText : colors.light.titleText
                              }`}
                            >
                              Equipo
                            </Label>
                            <Select value={equipo} onValueChange={setEquipo}>
                              <SelectTrigger
                                className={`${
                                  theme === "dark" ? colors.dark.inputBackground : colors.light.inputBackground
                                } ${theme === "dark" ? colors.dark.inputBorder : colors.light.inputBorder} ${
                                  theme === "dark" ? colors.dark.inputText : colors.light.inputText
                                } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                              >
                                <SelectValue placeholder="Selecciona un equipo" />
                              </SelectTrigger>
                              <SelectContent className={`${theme === "dark" ? "bg-[#1C4A3F] text-white" : "bg-white"}`}>
                                {equipmentList.map((equipment) => (
                                  <SelectItem
                                    key={equipment.id}
                                    value={equipment.id}
                                    disabled={equipment.fueraDeServicio || equipment.enUso}
                                    className={`${equipment.fueraDeServicio || equipment.enUso ? "opacity-50" : ""}`}
                                  >
                                    {equipment.id}
                                    {equipment.fueraDeServicio ? " (Fuera de servicio)" : ""}
                                    {equipment.enUso ? " (En uso)" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      {/* Formulario para clase invitada */}
                      {isGuestClassStarted && !isClassStarted && (
                        <>
                          <div className="space-y-3">
                            <Label
                              htmlFor="nombre"
                              className={`text-sm sm:text-base font-medium ${
                                theme === "dark" ? colors.dark.titleText : colors.light.titleText
                              }`}
                            >
                              Nombre
                            </Label>
                            <Input
                              id="nombre"
                              type="text"
                              value={nombre}
                              onChange={(e) => setNombre(e.target.value)}
                              placeholder="Ingresa tu nombre"
                              className={`${
                                theme === "dark" ? colors.dark.inputBackground : colors.light.inputBackground
                              } ${theme === "dark" ? colors.dark.inputBorder : colors.light.inputBorder} ${
                                theme === "dark" ? colors.dark.inputText : colors.light.inputText
                              } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <Label
                              htmlFor="apellido"
                              className={`text-sm sm:text-base font-medium ${
                                theme === "dark" ? colors.dark.titleText : colors.light.titleText
                              }`}
                            >
                              Apellido
                            </Label>
                            <Input
                              id="apellido"
                              type="text"
                              value={apellido}
                              onChange={(e) => setApellido(e.target.value)}
                              placeholder="Ingresa tu apellido"
                              className={`${
                                theme === "dark" ? colors.dark.inputBackground : colors.light.inputBackground
                              } ${theme === "dark" ? colors.dark.inputBorder : colors.light.inputBorder} ${
                                theme === "dark" ? colors.dark.inputText : colors.light.inputText
                              } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <Label
                              htmlFor="matriculaInvitado"
                              className={`text-sm sm:text-base font-medium ${
                                theme === "dark" ? colors.dark.titleText : colors.light.titleText
                              }`}
                            >
                              Matrícula
                            </Label>
                            <Input
                              id="matriculaInvitado"
                              type="text"
                              value={matriculaInvitado}
                              onChange={(e) => setMatriculaInvitado(e.target.value)}
                              placeholder="Ingresa tu matrícula (opcional)"
                              className={`${
                                theme === "dark" ? colors.dark.inputBackground : colors.light.inputBackground
                              } ${theme === "dark" ? colors.dark.inputBorder : colors.light.inputBorder} ${
                                theme === "dark" ? colors.dark.inputText : colors.light.inputText
                              } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                            />
                          </div>

                          <div className="space-y-3">
                            <Label
                              htmlFor="equipo"
                              className={`text-sm sm:text-base font-medium ${
                                theme === "dark" ? colors.dark.titleText : colors.light.titleText
                              }`}
                            >
                              Equipo
                            </Label>
                            <Select value={equipo} onValueChange={setEquipo}>
                              <SelectTrigger
                                className={`${
                                  theme === "dark" ? colors.dark.inputBackground : colors.light.inputBackground
                                } ${theme === "dark" ? colors.dark.inputBorder : colors.light.inputBorder} ${
                                  theme === "dark" ? colors.dark.inputText : colors.light.inputText
                                } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                              >
                                <SelectValue placeholder="Selecciona un equipo" />
                              </SelectTrigger>
                              <SelectContent className={`${theme === "dark" ? "bg-[#1C4A3F] text-white" : "bg-white"}`}>
                                {equipmentList.map((equipment) => (
                                  <SelectItem
                                    key={equipment.id}
                                    value={equipment.id}
                                    disabled={equipment.fueraDeServicio || equipment.enUso}
                                    className={`${equipment.fueraDeServicio || equipment.enUso ? "opacity-50" : ""}`}
                                  >
                                    {equipment.id}
                                    {equipment.fueraDeServicio ? " (Fuera de servicio)" : ""}
                                    {equipment.enUso ? " (En uso)" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </form>
                  </TabsContent>

                  <TabsContent value="maestro" className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-3">
                        <Label
                          htmlFor="userMatricula"
                          className={`text-sm sm:text-base font-medium ${
                            theme === "dark" ? colors.dark.titleText : colors.light.titleText
                          }`}
                        >
                          Matrícula
                        </Label>
                        <Input
                          id="userMatricula"
                          type="text"
                          value={userMatricula}
                          onChange={(e) => setUserMatricula(e.target.value)}
                          placeholder="Ingresa tu matrícula"
                          className={`${
                            theme === "dark" ? colors.dark.inputBackground : colors.light.inputBackground
                          } ${theme === "dark" ? colors.dark.inputBorder : colors.light.inputBorder} ${
                            theme === "dark" ? colors.dark.inputText : colors.light.inputText
                          } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="password"
                          className={`text-sm sm:text-base font-medium ${
                            theme === "dark" ? colors.dark.titleText : colors.light.titleText
                          }`}
                        >
                          Contraseña
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Ingresa tu contraseña"
                          className={`${
                            theme === "dark" ? colors.dark.inputBackground : colors.light.inputBackground
                          } ${theme === "dark" ? colors.dark.inputBorder : colors.light.inputBorder} ${
                            theme === "dark" ? colors.dark.inputText : colors.light.inputText
                          } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                          required
                        />
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="userType"
                          className={`text-sm sm:text-base font-medium ${
                            theme === "dark" ? colors.dark.titleText : colors.light.titleText
                          }`}
                        >
                          Tipo de Usuario
                        </Label>
                        <Select value={userType} onValueChange={(value) => setUserType(value as "maestro" | "laboratorista")}>
                          <SelectTrigger
                            className={`${
                              theme === "dark" ? colors.dark.inputBackground : colors.light.inputBackground
                            } ${theme === "dark" ? colors.dark.inputBorder : colors.light.inputBorder} ${
                              theme === "dark" ? colors.dark.inputText : colors.light.inputText
                            } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                          >
                            <SelectValue placeholder="Selecciona un tipo de usuario" />
                          </SelectTrigger>
                          <SelectContent className={`${theme === "dark" ? "bg-[#1C4A3F] text-white" : "bg-white"}`}>
                            <SelectItem value="maestro">Maestro</SelectItem>
                            <SelectItem value="laboratorista">Laboratorista</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button type="submit" className="w-full">
                        Iniciar Sesión
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  )
}
