'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sun, Moon, BookOpen, GraduationCap, UserSquare2, BookOpenCheck, Pencil, Trash2, X } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, setDoc, doc, getDoc, updateDoc, getDocs, query, deleteDoc } from 'firebase/firestore'
import Swal from 'sweetalert2'
import bcrypt from 'bcryptjs'
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Sidebar } from './sidebarAdmin'

const firebaseConfig = {
  apiKey: "AIzaSyCX5WX8tTkWRsIikpV3-pTXIsYUXfF5Eqk",
  authDomain: "integrador-7b39d.firebaseapp.com",
  projectId: "integrador-7b39d",
  storageBucket: "integrador-7b39d.appspot.com",
  messagingSenderId: "780966021686",
  appId: "1:780966021686:web:485712fb7509339c6ae697",
  measurementId: "G-FGB03PFM7Z"
}

const colors = {
  light: {
    background: 'bg-green-50',
    cardBackground: 'bg-white',
    headerBackground: 'bg-green-100',
    titleText: 'text-green-800',
    descriptionText: 'text-green-700',
    hoverBackground: 'hover:bg-green-50',
    buttonGreen: 'bg-green-600 hover:bg-green-700',
    buttonBlue: 'bg-blue-600 hover:bg-blue-700',
    countBackground: 'bg-green-100',
    countText: 'text-green-800',
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
  },
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

interface Materia {
  id: string;
  MaestroID: string;
  NombreMateria: string;
  Semestre: string;
}

interface Docente {
  Matricula: string;
  Nombre: string;
  Apellido: string;
  Email: string;
  Contraseña: string;
}

interface Alumno {
  Matricula: string;
  Nombre: string;
  Apellido: string;
  Carrera: string;
  Semestre: string;
  Turno: string;
}

interface Laboratorista {
  ID: string;
  Nombre: string;
  Apellido: string;
  Email: string;
  Contraseña: string;
}

export default function PanelAdministrador() {
  const [activeTab, setActiveTab] = useState('alumnos')
  const [datosAlumno, setDatosAlumno] = useState<Alumno>({
    Matricula: '',
    Nombre: '',
    Apellido: '',
    Carrera: '',
    Semestre: '',
    Turno: ''
  })
  const [datosDocente, setDatosDocente] = useState<Docente>({
    Matricula: '',
    Nombre: '',
    Apellido: '',
    Email: '',
    Contraseña: ''
  })
  const [datosMateria, setDatosMateria] = useState<Omit<Materia, 'id'>>({
    MaestroID: '',
    NombreMateria: '',
    Semestre: ''
  })
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [materias, setMaterias] = useState<Materia[]>([])
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    totalDocentes: 0,
    totalMaterias: 0,
    totalLaboratoristas: 0
  })
  const [datosLaboratorista, setDatosLaboratorista] = useState<Laboratorista>({
    ID: '',
    Nombre: '',
    Apellido: '',
    Email: '',
    Contraseña: ''
  })
  const [laboratoristas, setLaboratoristas] = useState<Laboratorista[]>([])

  const { theme, setTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark')
  const [editingItem, setEditingItem] = useState<{ type: 'alumno' | 'docente' | 'materia' | 'laboratorista', id: string } | null>(null)
  const [editingData, setEditingData] = useState<any>(null)

  const currentColors = isDarkMode ? colors.dark : colors.light

  useEffect(() => {
    cargarDocentes()
    cargarAlumnos()
    cargarMaterias()
    cargarLaboratoristas()
    fetchStats()
  }, [])

  useEffect(() => {
    setTheme(isDarkMode ? 'dark' : 'light')
  }, [isDarkMode, setTheme])

  const cargarDocentes = async () => {
    try {
      const docentesRef = collection(db, 'Docentes')
      const docentesSnapshot = await getDocs(query(docentesRef))
      const docentesData = docentesSnapshot.docs.map(doc => ({
        Matricula: doc.id,
        ...doc.data()
      })) as Docente[]
      setDocentes(docentesData)
    } catch (error) {
      console.error('Error al cargar docentes:', error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los docentes. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const cargarAlumnos = async () => {
    try {
      const alumnosRef = collection(db, 'Alumnos')
      const alumnosSnapshot = await getDocs(query(alumnosRef))
      const alumnosData = alumnosSnapshot.docs.map(doc => ({
        Matricula: doc.id,
        ...doc.data()
      })) as Alumno[]
      setAlumnos(alumnosData)
    } catch (error) {
      console.error('Error al cargar alumnos:', error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los alumnos. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const cargarMaterias = async () => {
    try {
      const materiasRef = collection(db, 'Materias')
      const materiasSnapshot = await getDocs(query(materiasRef))
      const materiasData = materiasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Materia[]
      setMaterias(materiasData)
    } catch (error) {
      console.error('Error al cargar materias:', error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar las materias. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const cargarLaboratoristas = async () => {
    try {
      const laboratoristasRef = collection(db, 'Laboratoristas')
      const laboratoristasSnapshot = await getDocs(query(laboratoristasRef))
      const laboratoristasData = laboratoristasSnapshot.docs.map(doc => ({
        ID: doc.id,
        ...doc.data()
      })) as Laboratorista[]
      setLaboratoristas(laboratoristasData)
    } catch (error) {
      console.error('Error al cargar laboratoristas:', error)
      await Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los laboratoristas. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const fetchStats = async () => {
    const alumnosSnapshot = await getDocs(query(collection(db, 'Alumnos')))
    const docentesSnapshot = await getDocs(query(collection(db, 'Docentes')))
    const materiasSnapshot = await getDocs(query(collection(db, 'Materias')))
    const laboratoristasSnapshot = await getDocs(query(collection(db, 'Laboratoristas')))

    setStats({
      totalAlumnos: alumnosSnapshot.size,
      totalDocentes: docentesSnapshot.size,
      totalMaterias: materiasSnapshot.size,
      totalLaboratoristas: laboratoristasSnapshot.size
    })
  }

  const generarMateriaID = async () => {
    let counter = 1
    let materiaID = `MateriaID${counter}`
    
    while (true) {
      const docRef = doc(db, 'Materias', materiaID)
      const docSnap = await getDoc(docRef)
      
      if (!docSnap.exists()) {
        return materiaID
      }
      
      counter++
      materiaID = `MateriaID${counter}`
    }
  }

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let nombreColeccion, datos
      switch (activeTab) {
        case 'alumnos':
          nombreColeccion = 'Alumnos'
          const { Matricula, ...restoDatosAlumno } = datosAlumno
          datos = restoDatosAlumno
          await setDoc(doc(db, nombreColeccion, Matricula), datos)
          break
        case 'docentes':
          nombreColeccion = 'Docentes'
          const { Matricula: matriculaDocente, Contraseña, ...restoDatosDocente } = datosDocente
          const contraseñaEncriptada = await bcrypt.hash(Contraseña, 10)
          datos = { Matricula: matriculaDocente, ...restoDatosDocente, Contraseña: contraseñaEncriptada }
          await setDoc(doc(db, nombreColeccion, matriculaDocente), datos)
          break
        case 'materias':
          nombreColeccion = 'Materias'
          const materiaID = await generarMateriaID()
          await setDoc(doc(db, nombreColeccion, materiaID), datosMateria)
          break
        case 'laboratoristas':
          nombreColeccion = 'Laboratoristas'
          const { ID, Contraseña: contraseñaLab, ...restoDatosLab } = datosLaboratorista
          const contraseñaLabEncriptada = await bcrypt.hash(contraseñaLab, 10)
          datos = { ...restoDatosLab, Contraseña: contraseñaLabEncriptada }
          await setDoc(doc(db, nombreColeccion, ID), datos)
          break
        default:
          throw new Error('Pestaña inválida')
      }

      await Swal.fire({
        title: "¡Éxito!",
        text: `${activeTab === 'alumnos' ? 'Alumno' : activeTab === 'docentes' ? 'Docente' : activeTab === 'materias' ? 'Materia' : 'Laboratorista'} agregado correctamente`,
        icon: "success",
      })
      
      if (activeTab === 'alumnos') setDatosAlumno({ Matricula: '', Nombre: '', Apellido: '', Carrera: '', Semestre: '', Turno: '' })
      else if (activeTab === 'docentes') setDatosDocente({ Matricula: '', Nombre: '', Apellido: '', Email: '', Contraseña: '' })
      else if (activeTab === 'materias') setDatosMateria({ MaestroID: '', NombreMateria: '', Semestre: '' })
      else if (activeTab === 'laboratoristas') setDatosLaboratorista({ ID: '', Nombre: '', Apellido: '', Email: '', Contraseña: '' })

      if (activeTab === 'alumnos') {
        cargarAlumnos()
      } else if (activeTab === 'docentes') {
        cargarDocentes()
      } else if (activeTab === 'materias') {
        cargarMaterias()
      } else if (activeTab === 'laboratoristas') {
        cargarLaboratoristas()
      }
      fetchStats()
    } catch (error) {
      console.error('Error al procesar la solicitud:', error)
      await Swal.fire({
        title: "Error",
        text: "Ha ocurrido un error. Por favor, intenta de nuevo.",
        icon: "error",
      })
    }
  }

  const eliminarAlumno = async (matricula: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'Alumnos', matricula));
        Swal.fire(
          'Eliminado!',
          'El alumno ha sido eliminado.',
          'success'
        );
        cargarAlumnos();
        fetchStats();
      } catch (error) {
        console.error('Error al eliminar alumno:', error);
        Swal.fire(
          'Error!',
          'Ha ocurrido un error al eliminar el alumno.',
          'error'
        );
      }
    }
  };

  const eliminarDocente = async (matricula: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'Docentes', matricula));
        Swal.fire(
          'Eliminado!',
          'El docente ha sido eliminado.',
          'success'
        );
        cargarDocentes();
        fetchStats();
      } catch (error) {
        console.error('Error al eliminar docente:', error);
        Swal.fire(
          'Error!',
          'Ha ocurrido un error al eliminar el docente.',
          'error'
        );
      }
    }
  };

  const eliminarMateria = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'Materias', id));
        Swal.fire(
          'Eliminado!',
          'La materia ha sido eliminada.',
          'success'
        );
        cargarMaterias();
        fetchStats();
      } catch (error) {
        console.error('Error al eliminar materia:', error);
        Swal.fire(
          'Error!',
          'Ha ocurrido un error al eliminar la materia.',
          'error'
        );
      }
    }
  };

  const eliminarLaboratorista = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'Laboratoristas', id));
        Swal.fire(
          'Eliminado!',
          'El laboratorista ha sido eliminado.',
          'success'
        );
        cargarLaboratoristas();
        fetchStats();
      } catch (error) {
        console.error('Error al eliminar laboratorista:', error);
        Swal.fire(
          'Error!',
          'Ha ocurrido un error al eliminar el laboratorista.',
          'error'
        );
      }
    }
  };

  const modificarAlumno = async (matricula: string) => {
    console.log('Modificar alumno:', matricula)
  }

  const modificarDocente = async (matricula: string) => {
    console.log('Modificar docente:', matricula)
  }

  const modificarMateria = async (id: string) => {
    console.log('Modificar materia:', id)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleEdit = async (type: 'alumno' | 'docente' | 'materia' | 'laboratorista', id: string) => {
    let data;
    switch (type) {
      case 'alumno':
        data = alumnos.find(a => a.Matricula === id);
        break;
      case 'docente':
        data = docentes.find(d => d.Matricula === id);
        break;
      case 'materia':
        data = materias.find(m => m.id === id);
        break;
      case 'laboratorista':
        data = laboratoristas.find(l => l.ID === id);
        break;
    }
    setEditingItem({ type, id });
    setEditingData(data);
  }

  const handleUpdate = async () => {
    if (!editingItem || !editingData) return;

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Quieres guardar los cambios?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, guardar!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        let collectionName;
        switch (editingItem.type) {
          case 'alumno':
            collectionName = 'Alumnos';
            break;
          case 'docente':
            collectionName = 'Docentes';
            if (editingData.Contraseña) {
              editingData.Contraseña = await bcrypt.hash(editingData.Contraseña, 10);
            }
            break;
          case 'materia':
            collectionName = 'Materias';
            break;
          case 'laboratorista':
            collectionName = 'Laboratoristas';
            if (editingData.Contraseña) {
              editingData.Contraseña = await bcrypt.hash(editingData.Contraseña, 10);
            }
            break;
        }

        const docRef = doc(db, collectionName, editingItem.id);
        await updateDoc(docRef, editingData);

        Swal.fire(
          '¡Actualizado!',
          `${editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)} actualizado correctamente`,
          'success'
        );

        // Recargar los datos
        if (editingItem.type === 'alumno') cargarAlumnos();
        else if (editingItem.type === 'docente') cargarDocentes();
        else if (editingItem.type === 'materia') cargarMaterias();
        else if (editingItem.type === 'laboratorista') cargarLaboratoristas();

        setEditingItem(null);
        setEditingData(null);
      } catch (error) {
        console.error('Error al actualizar:', error);
        Swal.fire(
          'Error!',
          'Ha ocurrido un error al actualizar. Por favor, intenta de nuevo.',
          'error'
        );
      }
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? colors.dark.background : colors.light.background} transition-all duration-300`}>
      <header className={`${isDarkMode ? colors.dark.headerBackground : colors.light.headerBackground} shadow-md p-4`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-2xl font-semibold ${isDarkMode ? colors.dark.titleText : colors.light.titleText}`}>Panel de Administrador</h1>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              isDarkMode
                ? 'bg-gradient-to-tl from-[#343a40] to-[#495057] border border-[#6c757d]'
                : 'bg-gradient-to-tl from-[#f8f9fa] to-[#e9ecef] border border-[#ced4da]'
            } p-1 rounded-full transition-all duration-200`}>
              <Sun className={`h-5 w-5 ${isDarkMode ? 'text-[#adb5bd]' : 'text-[#ffc107]'}`} />
              <Switch
                checked={isDarkMode}
                onCheckedChange={toggleDarkMode}
                className={`${isDarkMode ? 'bg-[#28a745]' : 'bg-[#6c757d]'}`}
              />
              <Moon className={`h-5 w-5 ${isDarkMode ? 'text-[#007bff]' : 'text-[#6c757d]'}`} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isDarkMode={isDarkMode} />
        <main className="flex-1 p-6 overflow-auto h-[calc(100vh-64px)]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} p-2`}>
              <CardHeader className="flex flex-row items-center justify-between py-2">
                <CardTitle className={`text-sm font-medium ${isDarkMode ? colors.dark.titleText : colors.light.titleText}`}>
                  Total Alumnos
                </CardTitle>
                <GraduationCap className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${isDarkMode ? colors.dark.titleText : colors.light.titleText}`}>{stats.totalAlumnos}</div>
              </CardContent>
            </Card>
            <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} p-2`}>
              <CardHeader className="flex flex-row items-center justify-between py-2">
                <CardTitle className={`text-sm font-medium ${isDarkMode ? colors.dark.titleText : colors.light.titleText}`}>
                  Total Docentes
                </CardTitle>
                <UserSquare2 className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${isDarkMode ? colors.dark.titleText : colors.light.titleText}`}>{stats.totalDocentes}</div>
              </CardContent>
            </Card>
            <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} p-2`}>
              <CardHeader className="flex flex-row items-center justify-between py-2">
                <CardTitle className={`text-sm font-medium ${isDarkMode ? colors.dark.titleText : colors.light.titleText}`}>
                  Total Materias
                </CardTitle>
                <BookOpen className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${isDarkMode ? colors.dark.titleText : colors.light.titleText}`}>{stats.totalMaterias}</div>
              </CardContent>
            </Card>
            <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} p-2`}>
              <CardHeader className="flex flex-row items-center justify-between py-2">
                <CardTitle className={`text-sm font-medium ${isDarkMode ? colors.dark.titleText : colors.light.titleText}`}>
                  Total Laboratoristas
                </CardTitle>
                <UserSquare2 className="h-3 w-3 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${isDarkMode ? colors.dark.titleText : colors.light.titleText}`}>{stats.totalLaboratoristas}</div>
              </CardContent>
            </Card>
          </div>

          {activeTab === 'alumnos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} h-full`}>
                <CardHeader>
                  <CardTitle className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Agregar Alumno</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={manejarEnvio} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="matriculaAlumno" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Matrícula</Label>
                      <Input
                        id="matriculaAlumno"
                        value={datosAlumno.Matricula}
                        onChange={(e) => setDatosAlumno({...datosAlumno, Matricula: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombreAlumno" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre</Label>
                      <Input
                        id="nombreAlumno"
                        value={datosAlumno.Nombre}
                        onChange={(e) => setDatosAlumno({...datosAlumno, Nombre: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellidoAlumno" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Apellido</Label>
                      <Input
                        id="apellidoAlumno"
                        value={datosAlumno.Apellido}
                        onChange={(e) => setDatosAlumno({...datosAlumno, Apellido: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carreraAlumno" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Carrera</Label>
                      <Select
                        value={datosAlumno.Carrera}
                        onValueChange={(value) => setDatosAlumno({...datosAlumno, Carrera: value})}
                      >
                        <SelectTrigger id="carreraAlumno" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
                          <SelectValue placeholder="Selecciona una carrera" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ingenieria en sistemas computacionales">Ingeniería en Sistemas Computacionales</SelectItem>
                          <SelectItem value="Ingenieria industrial">Ingeniería Industrial</SelectItem>
                          <SelectItem value="Licenciatura en administracion de empresas">Licenciatura en Administración de Empresas</SelectItem>
                          <SelectItem value="Ingenieria civil">Ingeniería Civil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semestreAlumno" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Semestre</Label>
                      <Select
                        value={datosAlumno.Semestre}
                        onValueChange={(value) => setDatosAlumno({...datosAlumno, Semestre: value})}
                      >
                        <SelectTrigger id="semestreAlumno" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
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
                      <Label htmlFor="turnoAlumno" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Turno</Label>
                      <Select
                        value={datosAlumno.Turno}
                        onValueChange={(value) => setDatosAlumno({...datosAlumno, Turno: value})}
                      >
                        <SelectTrigger id="turnoAlumno" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
                          <SelectValue placeholder="Selecciona un turno" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="matutino">Matutino</SelectItem>
                          <SelectItem value="vespertino">Vespertino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="submit" 
                      className={`w-full h-8 px-1 py-0 text-xs font-tall transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        isDarkMode ? colors.dark.buttonGreen : colors.light.buttonGreen
                      }`}
                    >
                      Agregar Alumno
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} h-full overflow-auto`}>
                <CardHeader>
                  <CardTitle className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Lista de Alumnos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Matrícula</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Apellido</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Carrera</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Semestre</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Turno</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alumnos.map((alumno) => (
                        <TableRow key={alumno.Matricula}>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{alumno.Matricula}</TableCell>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{alumno.Nombre}</TableCell>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{alumno.Apellido}</TableCell>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{alumno.Carrera}</TableCell>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{alumno.Semestre}</TableCell>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{alumno.Turno}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleEdit('alumno', alumno.Matricula)}
                              className="mr-2"
                              size="sm"
                              variant="outline"
                              style={{ color: currentColors.buttonBlue, borderColor: currentColors.buttonBlue }}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar alumno</span>
                            </Button>
                            <Button
                              onClick={() => eliminarAlumno(alumno.Matricula)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar alumno</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === 'docentes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} h-full`}>
                <CardHeader>
                  <CardTitle className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Agregar Docente</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={manejarEnvio} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="matriculaDocente" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Matrícula</Label>
                      <Input
                        id="matriculaDocente"
                        value={datosDocente.Matricula}
                        onChange={(e) => setDatosDocente({...datosDocente, Matricula: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombreDocente" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre</Label>
                      <Input
                        id="nombreDocente"
                        value={datosDocente.Nombre}
                        onChange={(e) => setDatosDocente({...datosDocente, Nombre: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellidoDocente" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Apellido</Label>
                      <Input
                        id="apellidoDocente"
                        value={datosDocente.Apellido}
                        onChange={(e) => setDatosDocente({...datosDocente, Apellido: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailDocente" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Email</Label>
                      <Input
                        id="emailDocente"
                        type="email"
                        value={datosDocente.Email}
                        onChange={(e) => setDatosDocente({...datosDocente, Email: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contraseñaDocente" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Contraseña</Label>
                      <Input
                        id="contraseñaDocente"
                        type="password"
                        value={datosDocente.Contraseña}
                        onChange={(e) => setDatosDocente({...datosDocente, Contraseña: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className={`w-full h-8 px-1 py-0 text-xs font-tall transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        isDarkMode ? colors.dark.buttonGreen : colors.light.buttonGreen
                      }`}
                    >
                      Agregar Docente
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} h-full overflow-auto`}>
                <CardHeader>
                  <CardTitle className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Lista de Docentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Matrícula</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Apellido</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docentes.map((docente) => (
                        <TableRow key={docente.Matricula}>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{docente.Matricula}</TableCell>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{docente.Nombre}</TableCell>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{docente.Apellido}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleEdit('docente', docente.Matricula)}
                              className="mr-2"
                              size="sm"
                              variant="outline"
                              style={{ color: currentColors.buttonBlue, borderColor: currentColors.buttonBlue }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => eliminarDocente(docente.Matricula)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === 'materias' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} h-full`}>
                <CardHeader>
                  <CardTitle className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Agregar Materia</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={manejarEnvio} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombreMateria" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre de la Materia</Label>
                      <Input
                        id="nombreMateria"
                        value={datosMateria.NombreMateria}
                        onChange={(e) => setDatosMateria({...datosMateria, NombreMateria: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maestroID" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Maestro</Label>
                      <Select
                        value={datosMateria.MaestroID}
                        onValueChange={(value) => setDatosMateria({...datosMateria, MaestroID: value})}
                      >
                        <SelectTrigger id="maestroID" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
                          <SelectValue placeholder="Selecciona un maestro" />
                        </SelectTrigger>
                        <SelectContent>
                          {docentes.map((docente) => (
                            <SelectItem key={docente.Matricula} value={docente.Matricula}>
                              {`${docente.Nombre} ${docente.Apellido}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semestreMateria" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Semestre</Label>
                      <Select
                        value={datosMateria.Semestre}
                        onValueChange={(value) => setDatosMateria({...datosMateria, Semestre: value})}
                      >
                        <SelectTrigger id="semestreMateria" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
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
                    <Button 
                      type="submit" 
                      className={`w-full h-8 px-1 py0 text-xs font-tall transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        isDarkMode ? colors.dark.buttonGreen : colors.light.buttonGreen
                      }`}
                    >
                      Agregar Materia
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} h-full overflow-auto`}>
                <CardHeader>
                  <CardTitle className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Lista de Materias</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>ID</TableHead><TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Maestro</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materias.map((materia) => {
                        const docenteAsignado = docentes.find(d => d.Matricula === materia.MaestroID);
                        return (
                          <TableRow key={materia.id}>
                            <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{materia.id}</TableCell>
                            <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{materia.NombreMateria}</TableCell>
                            <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>
                              {docenteAsignado ? `${docenteAsignado.Nombre} ${docenteAsignado.Apellido}` : 'No asignado'}
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => handleEdit('materia', materia.id)}
                                className="mr-2"
                                size="sm"
                                variant="outline"
                                style={{ color: currentColors.buttonBlue, borderColor: currentColors.buttonBlue }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => eliminarMateria(materia.id)}
                                size="sm"
                                variant="destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'laboratoristas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} h-full`}>
                <CardHeader>
                  <CardTitle className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Agregar Laboratorista</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={manejarEnvio} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="idLaboratorista" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>ID</Label>
                      <Input
                        id="idLaboratorista"
                        value={datosLaboratorista.ID}
                        onChange={(e) => setDatosLaboratorista({...datosLaboratorista, ID: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nombreLaboratorista" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre</Label>
                      <Input
                        id="nombreLaboratorista"
                        value={datosLaboratorista.Nombre}
                        onChange={(e) => setDatosLaboratorista({...datosLaboratorista, Nombre: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apellidoLaboratorista" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Apellido</Label>
                      <Input
                        id="apellidoLaboratorista"
                        value={datosLaboratorista.Apellido}
                        onChange={(e) => setDatosLaboratorista({...datosLaboratorista, Apellido: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailLaboratorista" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Email</Label>
                      <Input
                        id="emailLaboratorista"
                        type="email"
                        value={datosLaboratorista.Email}
                        onChange={(e) => setDatosLaboratorista({...datosLaboratorista, Email: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contraseñaLaboratorista" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Contraseña</Label>
                      <Input
                        id="contraseñaLaboratorista"
                        type="password"
                        value={datosLaboratorista.Contraseña}
                        onChange={(e) => setDatosLaboratorista({...datosLaboratorista, Contraseña: e.target.value})}
                        required
                        className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className={`w-full h-8 px-1 py-0 text-xs font-tall transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        isDarkMode ? colors.dark.buttonGreen : colors.light.buttonGreen
                      }`}
                    >
                      Agregar Laboratorista
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <Card className={`${isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground} h-full overflow-auto`}>
                <CardHeader>
                  <CardTitle className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Lista de Laboratoristas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>ID</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Apellido</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Email</TableHead>
                        <TableHead className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {laboratoristas.map((laboratorista) => (
                        <TableRow key={laboratorista.ID}>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{laboratorista.ID}</TableCell>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{laboratorista.Nombre}</TableCell>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{laboratorista.Apellido}</TableCell>
                          <TableCell className={isDarkMode ? colors.dark.descriptionText : colors.light.descriptionText}>{laboratorista.Email}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleEdit('laboratorista', laboratorista.ID)}
                              className="mr-2"
                              size="sm"
                              variant="outline"
                              style={{ color: currentColors.buttonBlue, borderColor: currentColors.buttonBlue }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => eliminarLaboratorista(laboratorista.ID)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
          {editingItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className={isDarkMode ? colors.dark.cardBackground : colors.light.cardBackground}>
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>
                    Editar {editingItem.type.charAt(0).toUpperCase() + editingItem.type.slice(1)}
                  </CardTitle>
                  <Button variant="ghost" onClick={() => setEditingItem(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
                    {editingItem.type === 'alumno' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="editNombre" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre</Label>
                          <Input
                            id="editNombre"
                            value={editingData.Nombre}
                            onChange={(e) => setEditingData({...editingData, Nombre: e.target.value})}
                            required
                            className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editApellido" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Apellido</Label>
                          <Input
                            id="editApellido"
                            value={editingData.Apellido}
                            onChange={(e) => setEditingData({...editingData, Apellido: e.target.value})}
                            required
                            className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editCarrera" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Carrera</Label>
                          <Select
                            value={editingData.Carrera}
                            onValueChange={(value) => setEditingData({...editingData, Carrera: value})}
                          >
                            <SelectTrigger id="editCarrera" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
                              <SelectValue placeholder="Selecciona una carrera" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ingenieria en sistemas computacionales">Ingeniería en Sistemas Computacionales</SelectItem>
                              <SelectItem value="Ingenieria industrial">Ingeniería Industrial</SelectItem>
                              <SelectItem value="Licenciatura en administracion de empresas">Licenciatura en Administración de Empresas</SelectItem>
                              <SelectItem value="Ingenieria civil">Ingeniería Civil</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editSemestre" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Semestre</Label>
                          <Select
                            value={editingData.Semestre}
                            onValueChange={(value) => setEditingData({...editingData, Semestre: value})}
                          >
                            <SelectTrigger id="editSemestre" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
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
                          <Label htmlFor="editTurno" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Turno</Label>
                          <Select
                            value={editingData.Turno}
                            onValueChange={(value) => setEditingData({...editingData, Turno: value})}
                          >
                            <SelectTrigger id="editTurno" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
                              <SelectValue placeholder="Selecciona un turno" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="matutino">Matutino</SelectItem>
                              <SelectItem value="vespertino">Vespertino</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    {editingItem.type === 'docente' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="editNombre" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre</Label>
                          <Input
                            id="editNombre"
                            value={editingData.Nombre}
                            onChange={(e) => setEditingData({...editingData, Nombre: e.target.value})}
                            required
                            className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editApellido" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Apellido</Label>
                          <Input
                            id="editApellido"
                            value={editingData.Apellido}
                            onChange={(e) => setEditingData({...editingData, Apellido: e.target.value})}
                            required
                            className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editEmail" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Email</Label>
                          <Input
                            id="editEmail"
                            type="email"
                            value={editingData.Email}
                            onChange={(e) => setEditingData({...editingData, Email: e.target.value})}
                            required
                            className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editContraseña" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nueva Contraseña (dejar en blanco para no cambiar)</Label>
                          <Input
                            id="editContraseña"
                            type="password"
                            value={editingData.Contraseña || ''}
                            onChange={(e) => setEditingData({...editingData, Contraseña: e.target.value})}
                            className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                          />
                        </div>
                      </>
                    )}
                    {editingItem.type === 'materia' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="editNombreMateria" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre de la Materia</Label>
                          <Input
                            id="editNombreMateria"
                            value={editingData.NombreMateria}
                            onChange={(e) => setEditingData({...editingData, NombreMateria: e.target.value})}
                            required
                            className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editMaestroID" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Maestro</Label>
                          <Select
                            value={editingData.MaestroID}
                            onValueChange={(value) => setEditingData({...editingData, MaestroID: value})}
                          >
                            <SelectTrigger id="editMaestroID" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
                              <SelectValue placeholder="Selecciona un maestro" />
                            </SelectTrigger>
                            <SelectContent>
                              {docentes.map((docente) => (
                                <SelectItem key={docente.Matricula} value={docente.Matricula}>
                                  {`${docente.Nombre} ${docente.Apellido}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editSemestreMateria" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Semestre</Label>
                          <Select
                            value={editingData.Semestre}
                            onValueChange={(value) => setEditingData({...editingData, Semestre: value})}
                          >
                            <SelectTrigger id="editSemestreMateria" className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}>
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
                      </>
                    )}
                    {editingItem.type === 'laboratorista' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="editNombre" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nombre</Label>
                          <Input
                            id="editNombre"
                            value={editingData.Nombre}
                            onChange={(e) => setEditingData({...editingData, Nombre: e.target.value})}
                            required
                            className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editApellido" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Apellido</Label>
                          <Input
                            id="editApellido"
                            value={editingData.Apellido}
                            onChange={(e) => setEditingData({...editingData, Apellido: e.target.value})}
                            required
                            className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editEmail" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Email</Label>
                          <Input
                            id="editEmail"
                            type="email"
                            value={editingData.Email}
                            onChange={(e) => setEditingData({...editingData, Email: e.target.value})}
                            required
                            className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editContraseña" className={isDarkMode ? colors.dark.titleText : colors.light.titleText}>Nueva Contraseña (dejar en blanco para no cambiar)</Label>
                          <Input
                            id="editContraseña"
                            type="password"
                            value={editingData.Contraseña || ''}
                            onChange={(e) => setEditingData({...editingData, Contraseña: e.target.value})}
                            className={`${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} border-gray-300`}
                          />
                        </div>
                      </>
                    )}
                    <Button 
                      type="submit" 
                      className={`w-full h-8 px-1 py-0 text-xs font-tall transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                        isDarkMode ? colors.dark.buttonGreen : colors.light.buttonGreen
                      }`}
                    >
                      Actualizar
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

