"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react" // Import useRef
import { useRouter } from "next/navigation"
import { User, UserCog, Computer, Moon, Sun, ChevronRight, Monitor, Wifi, ArrowLeft } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  const [laboratorioSeleccionado, setLaboratorioSeleccionado] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("laboratorio") || ""
    }
    return ""
  })

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
    // Obtener el laboratorio actual (de localStorage o del estado)
    const lab = laboratorioSeleccionado || localStorage.getItem("laboratorio") || "programacion"

    // Verificar si hay una clase normal iniciada en este laboratorio
    const unsubscribeClass = onSnapshot(doc(db, "EstadoClase", lab), (doc) => {
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

    // Verificar si hay una clase de invitado iniciada en este laboratorio
    const unsubscribeGuestClass = onSnapshot(doc(db, "EstadoClaseInvitado", lab), (doc) => {
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
              title: "Clase iniciada!",
              text: `Maestro: ${data.MaestroInvitado}
Materia: ${data.Materia}
Practica: ${data.Practica}
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
  }, [laboratorioSeleccionado])

  // Añadir este efecto después del useEffect que verifica las clases
  // Modificar este efecto para prevenir cierre accidental de la ventana del navegador
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "" // Chrome requiere returnValue

      // Aquí podrías agregar lógica para intentar guardar el estado o notificar al usuario
      // Por ahora, solo prevenimos el cierre.
      console.log("Navegador intentando cerrar, prevented.")
    }

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
    const lab = laboratorioSeleccionado || localStorage.getItem("laboratorio") || "programacion"
    const unsubscribe = onSnapshot(doc(db, "Numero de equipos", lab), (doc) => {
      if (doc.exists()) {
        const data = doc.data()
        const dbEquipment = data.Equipos || []
        setEquipmentList([{ id: "personal", fueraDeServicio: false }, ...dbEquipment])
      }
    })

    return () => unsubscribe()
  }, [laboratorioSeleccionado])

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

  const resetEquiposEnUso = async () => {
    try {
      const lab = laboratorioSeleccionado || localStorage.getItem("laboratorio") || "programacion"
      const equipoRef = doc(db, "Numero de equipos", lab)
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
        const isAnyClassStarted = isClassStarted || isGuestClassStarted
        if (!isAnyClassStarted) {
          await swal({
            title: "Error",
            text: "No hay clases iniciadas en este momento.",
            icon: "error",
          })
          return
        }

        const selectedClass = isGuestClassStarted ? "invitado" : "normal"
        setClassChoice(selectedClass as "normal" | "invitado")

        const asistenciasCollection = selectedClass === "invitado" ? "AsistenciasInvitado" : "Asistencias"

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

            const alumnoRef = doc(db, "Alumnos", matricula)
            const alumnoSnap = await getDoc(alumnoRef)

            if (alumnoSnap.exists()) {
              const alumnoData = alumnoSnap.data()

              const lab = laboratorioSeleccionado || localStorage.getItem("laboratorio") || "programacion"
              const estadoRef = doc(db, "EstadoClase", lab)
              const estadoSnap = await getDoc(estadoRef)

              if (estadoSnap.exists()) {
                const materiaActualId = estadoSnap.data().materiaId
                const materiasAlumno = alumnoData.Materias || []

                if (!materiasAlumno.includes(materiaActualId)) {
                  await swal({
                    title: "Error",
                    text: "No estás inscrito en esta materia",
                    icon: "error",
                  })
                  return
                }
              }

              const asistenciaRef = doc(collection(db, asistenciasCollection))

              const labActual = laboratorioSeleccionado || localStorage.getItem("laboratorio") || "programacion"
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
                laboratorio: labActual,
              }

              if (classInfo) {
                await setDoc(asistenciaRef, {
                  ...commonData,
                  MaestroNombre: classInfo.maestroNombre || "",
                  MaestroApellido: classInfo.maestroApellido || "",
                  Materia: classInfo.materiaNombre || "",
                  Practica: classInfo.practicaTitulo || "",
                })
              } else {
                await setDoc(asistenciaRef, commonData)
              }

              if (equipo !== "personal") {
                try {
                  const labEquipo = laboratorioSeleccionado || localStorage.getItem("laboratorio") || "programacion"
                  const equipoRef = doc(db, "Numero de equipos", labEquipo)
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
                title: "Asistencia registrada!",
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
          if (!nombre || !apellido || !equipo) {
            await swal({
              title: "Error",
              text: "Por favor, completa todos los campos.",
              icon: "error",
            })
            return
          }

          try {
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

            const alumnoId = matriculaInvitado ? matriculaInvitado : `INV-${Date.now()}`
            const asistenciaRef = doc(collection(db, asistenciasCollection))

            const labInv = laboratorioSeleccionado || localStorage.getItem("laboratorio") || "programacion"
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
              laboratorio: labInv,
            }

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

            if (equipo !== "personal") {
              try {
                const labEqInv = laboratorioSeleccionado || localStorage.getItem("laboratorio") || "programacion"
                const equipoRef = doc(db, "Numero de equipos", labEqInv)
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
        localStorage.setItem("laboratorio", laboratorioSeleccionado)

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

      const adminRef = doc(db, "Administrador", adminEmail)
      const adminSnap = await getDoc(adminRef)

      if (!adminSnap.exists()) {
        console.log("Administrador no encontrado por matrícula, buscando por email...")

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

        localStorage.setItem("adminId", adminDoc.id)
        localStorage.setItem("laboratorio", laboratorioSeleccionado)

        setIsAdminLoginOpen(false)
        router.push("/AdminPanel")
        return
      }

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

      localStorage.setItem("adminId", adminEmail)
      localStorage.setItem("laboratorio", laboratorioSeleccionado)

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

  const carouselImages = ["/FondoItspp.png", "/tecnmImagen.png", "/LogoSistemas.png"]

  if (isLoading) {
    return <Loader />
  }

  // Pantalla de seleccion de laboratorio
  if (!laboratorioSeleccionado) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-4 ${
          theme === "dark" ? "bg-[#0c1f15]" : "bg-[#fff0f5]"
        } transition-colors duration-300`}
      >
        <button
          onClick={handleThemeToggle}
          className={`fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-300 ${
            theme === "dark" ? "bg-[#1C4A3F] text-white hover:bg-[#153731]" : "bg-[#1BB827] text-white hover:bg-[#18a423]"
          }`}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
              theme === "dark" ? "bg-[#1d5631]/30" : "bg-[#800040]/10"
            }`}>
              <Image
                src="/FondoItspp.png"
                alt="Logo ITSPP"
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            </div>
          </div>

          <h1 className={`text-2xl sm:text-3xl font-bold text-center mb-2 ${
            theme === "dark" ? "text-white" : "text-[#800040]"
          }`}>
            Sistema de Control de Asistencias
          </h1>
          <p className={`text-center mb-8 text-sm sm:text-base ${
            theme === "dark" ? "text-gray-400" : "text-[#800040]/60"
          }`}>
            Selecciona el laboratorio donde te encuentras
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Laboratorio de Programacion */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setLaboratorioSeleccionado("programacion")
                localStorage.setItem("laboratorio", "programacion")
              }}
              className={`group relative overflow-hidden rounded-2xl p-6 sm:p-8 text-left transition-all duration-300 border-2 ${
                theme === "dark"
                  ? "bg-[#1a2e25] border-[#1d5631]/40 hover:border-[#1d5631] hover:bg-[#1d3a2c]"
                  : "bg-white border-[#800040]/20 hover:border-[#800040] hover:shadow-lg hover:shadow-[#800040]/10"
              }`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                theme === "dark"
                  ? "bg-[#1d5631]/30 group-hover:bg-[#1d5631]/50"
                  : "bg-[#800040]/10 group-hover:bg-[#800040]/20"
              }`}>
                <Monitor className={`w-7 h-7 ${
                  theme === "dark" ? "text-[#2a7a45]" : "text-[#800040]"
                }`} />
              </div>
              <h2 className={`text-lg sm:text-xl font-bold mb-2 ${
                theme === "dark" ? "text-white" : "text-[#800040]"
              }`}>
                Laboratorio de Programacion
              </h2>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-[#74726f]"
              }`}>
                Desarrollo de software, bases de datos y programacion
              </p>
              <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 ${
                theme === "dark" ? "text-[#2a7a45]" : "text-[#800040]"
              }`} />
            </motion.button>

            {/* Laboratorio de Redes */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setLaboratorioSeleccionado("redes")
                localStorage.setItem("laboratorio", "redes")
              }}
              className={`group relative overflow-hidden rounded-2xl p-6 sm:p-8 text-left transition-all duration-300 border-2 ${
                theme === "dark"
                  ? "bg-[#1a2e25] border-[#1d5631]/40 hover:border-[#1d5631] hover:bg-[#1d3a2c]"
                  : "bg-white border-[#800040]/20 hover:border-[#800040] hover:shadow-lg hover:shadow-[#800040]/10"
              }`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                theme === "dark"
                  ? "bg-[#1d5631]/30 group-hover:bg-[#1d5631]/50"
                  : "bg-[#800040]/10 group-hover:bg-[#800040]/20"
              }`}>
                <Wifi className={`w-7 h-7 ${
                  theme === "dark" ? "text-[#2a7a45]" : "text-[#800040]"
                }`} />
              </div>
              <h2 className={`text-lg sm:text-xl font-bold mb-2 ${
                theme === "dark" ? "text-white" : "text-[#800040]"
              }`}>
                Laboratorio de Redes
              </h2>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-[#74726f]"
              }`}>
                Redes de computadoras, telecomunicaciones y conectividad
              </p>
              <ChevronRight className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 ${
                theme === "dark" ? "text-[#2a7a45]" : "text-[#800040]"
              }`} />
            </motion.button>
          </div>

          <p className={`text-center mt-6 text-xs ${
            theme === "dark" ? "text-gray-500" : "text-[#74726f]/60"
          }`}>
            Instituto Tecnologico Superior de Puerto Penasco
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 ${
        theme === "dark" ? colors.dark.background : colors.light.background
      } transition-colors duration-300`}
    >
      <div className="fixed top-2 left-2 z-50">
        <Sidebar
          isDarkMode={theme === "dark"}
          onAdminLogin={() => setIsAdminLoginOpen(true)}
          adminLoginText="Administrador"
        />
      </div>

      {/* Indicador de laboratorio */}
      <button
        onClick={() => {
          setLaboratorioSeleccionado("")
          localStorage.removeItem("laboratorio")
        }}
        className={`fixed top-14 left-2 sm:top-4 sm:left-16 z-40 flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 text-xs sm:text-sm font-medium ${
          theme === "dark"
            ? "bg-[#1C4A3F] text-white hover:bg-[#153731]"
            : "bg-[#800040] text-white hover:bg-[#5c002e]"
        }`}
        title="Cambiar laboratorio"
      >
        {laboratorioSeleccionado === "programacion" ? (
          <Monitor size={16} />
        ) : (
          <Wifi size={16} />
        )}
        <span>
          {laboratorioSeleccionado === "programacion" ? "Lab. Programacion" : "Lab. Redes"}
        </span>
        <ArrowLeft size={14} className="opacity-60" />
      </button>

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
          theme === "dark" ? colors.dark.cardBackground : colors.light.cardBackground
        } border-none relative z-10 shadow-xl rounded-2xl sm:rounded-3xl`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
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
                  onValueChange={(value: string) => {
                    // Agregando tipo string al parámetro value
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

                      {isClassStarted && !isGuestClassStarted && (
                        <>
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
                        </>
                      )}

                      {isGuestClassStarted && !isClassStarted && (
                        <>
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
                        </>
                      )}

                      <Button
                        type="submit"
                        className={`w-full py-6 rounded-xl text-base sm:text-lg font-medium flex items-center justify-center gap-2 ${
                          theme === "dark" ? colors.dark.buttonPrimary : colors.light.buttonPrimary
                        } transition-all duration-300 ${!(isClassStarted || isGuestClassStarted) ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={!(isClassStarted || isGuestClassStarted)}
                      >
                        {!(isClassStarted || isGuestClassStarted) ? (
                          "No hay clases iniciadas"
                        ) : (
                          <>
                            Registrar Asistencia
                            <ChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="maestro" className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-3">
                        <Label
                          htmlFor="userType"
                          className={`text-sm sm:text-base font-medium ${
                            theme === "dark" ? colors.dark.titleText : colors.light.titleText
                          }`}
                        >
                          Tipo de Usuario
                        </Label>
                        <Select
                          value={userType}
                          onValueChange={(value: string) => setUserType(value as "maestro" | "laboratorista")} // Agregando tipo string al parámetro value
                        >
                          <SelectTrigger
                            className={`${
                              theme === "dark" ? colors.dark.inputBackground : colors.light.inputBackground
                            } ${theme === "dark" ? colors.dark.inputBorder : colors.light.inputBorder} ${
                              theme === "dark" ? colors.dark.inputText : colors.light.inputText
                            } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                          >
                            <SelectValue placeholder="Selecciona tipo de usuario" />
                          </SelectTrigger>
                          <SelectContent className={`${theme === "dark" ? "bg-[#1C4A3F] text-white" : "bg-white"}`}>
                            <SelectItem value="maestro">Maestro</SelectItem>
                            <SelectItem value="laboratorista">Laboratorista</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label
                          htmlFor="userMatricula"
                          className={`text-sm sm:text-base font-medium ${
                            theme === "dark" ? colors.dark.titleText : colors.light.titleText
                          }`}
                        >
                          {userType === "maestro" ? "Numero de Empleado" : "ID de Laboratorista"}
                        </Label>
                        <Input
                          id="userMatricula"
                          type="text"
                          value={userMatricula}
                          onChange={(e) => handleNumberInput(e, setUserMatricula)}
                          placeholder={`Ingresa tu ${userType === "maestro" ? "número de empleado" : "ID de laboratorista"}`}
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

                      <Button
                        type="submit"
                        className={`w-full py-6 rounded-xl text-base sm:text-lg font-medium flex items-center justify-center gap-2 ${
                          theme === "dark" ? colors.dark.buttonSecondary : colors.light.buttonSecondary
                        } transition-all duration-300`}
                      >
                        Iniciar Sesión
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>

              <CardFooter className={`p-4 ${theme === "dark" ? "bg-[#153731]" : "bg-[#f0fff4]"} text-center text-sm`}>
                <p className={`w-full ${theme === "dark" ? "text-gray-300" : "text-[#1C4A3F]/70"}`}>
                  Instituto Tecnológico Superior de Puerto Peñasco © {new Date().getFullYear()}
                </p>
              </CardFooter>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </Card>


      )

      <Dialog open={isAdminLoginOpen} onOpenChange={setIsAdminLoginOpen}>
        <DialogContent
          className={`sm:max-w-md ${
            theme === "dark" ? "bg-[#1C4A3F] text-white" : "bg-white"
          } border-none shadow-lg rounded-2xl`}
        >
          <DialogHeader>
            <DialogTitle className={`text-center text-xl ${theme === "dark" ? "text-white" : "text-[#1C4A3F]"}`}>
              Acceso Administrador
            </DialogTitle>
            <DialogDescription className={`text-center ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              Ingresa tus credenciales de administrador
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div className="space-y-3">
              <Label
                htmlFor="adminEmail"
                className={`text-sm sm:text-base font-medium ${theme === "dark" ? "text-white" : "text-[#1C4A3F]"}`}
              >
                Matricula o Correo Electronico
              </Label>
              <Input
                id="adminEmail"
                type="text"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Ingresa tu matrícula o correo"
                className={`${
                  theme === "dark"
                    ? "bg-[#153731] border-[#1BB827]/30 text-white"
                    : "bg-[#f0fff4] border-[#1BB827]/30 text-[#1C4A3F]"
                } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                required
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="adminPassword"
                className={`text-sm sm:text-base font-medium ${theme === "dark" ? "text-white" : "text-[#1C4A3F]"}`}
              >
                Contraseña
              </Label>
              <Input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className={`${
                  theme === "dark"
                    ? "bg-[#153731] border-[#1BB827]/30 text-white"
                    : "bg-[#f0fff4] border-[#1BB827]/30 text-[#1C4A3F]"
                } rounded-xl border-2 focus:ring-[#1BB827] focus:border-[#1BB827] transition-all duration-300`}
                required
              />
            </div>

            <Button
              type="submit"
              className={`w-full py-6 rounded-xl text-base sm:text-lg font-medium ${
                theme === "dark" ? colors.dark.buttonSecondary : colors.light.buttonSecondary
              } transition-all duration-300`}
            >
              Iniciar Sesión
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
