'use client'

import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { BarChart2, Calendar, Laptop, ClipboardList, Moon, Sun, UserPlus, BookOpen } from 'lucide-react'
import VistaReportes from '../components/VistaReportes'
import VistaPracticas from '../components/VistaPracticas'
import VistaHorario from '../components/VistaHorario'
import VistaEquipos from '../components/VistaEquipos'
import VistaMaestroInvitado from '../components/VistaMaestroInvitado'
import VistaBitacora from '../components/VistaBitacora'
import { firebaseConfig } from '../lib/constants'
import { getTheme, setTheme, toggleTheme, applyTheme, Theme } from '../lib/theme'

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

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

export default function PanelLaboratorista() {
  const [theme, setThemeState] = useState<Theme>('light')
  const [vistaActual, setVistaActual] = useState<'reportes' | 'practicas' | 'horario' | 'equipos' | 'maestroInvitado' | 'bitacora'>('reportes')

  useEffect(() => {
    const currentTheme = getTheme();
    setThemeState(currentTheme);
    applyTheme(currentTheme);
  }, []);

  const modoColor = theme === 'dark' ? colors.dark : colors.light

  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const logAction = async (action: string, details: string) => {
    try {
      await addDoc(collection(db, 'logs'), {
        timestamp: serverTimestamp(),
        action,
        user: 'Mock User', // Replace with actual user data when authentication is implemented
        details
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  return (
    <div className={`min-h-screen w-full ${modoColor.background}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-64 ${modoColor.headerBackground} p-6 hidden md:block`}>
          <h2 className={`text-2xl font-bold mb-6 ${modoColor.titleText}`}>Panel de Control</h2>
          <nav>
            {['reportes', 'practicas', 'horario', 'equipos', 'maestroInvitado', 'bitacora'].map((vista) => (
              <Button
                key={vista}
                variant="ghost"
                className={`w-full justify-start mb-4 text-lg font-semibold ${
                  vistaActual === vista 
                    ? `${modoColor.buttonGreen} ${modoColor.titleText}` 
                    : `${modoColor.hoverBackground} ${modoColor.descriptionText}`
                }`}
                onClick={() => setVistaActual(vista as typeof vistaActual)}
              >
                {vista === 'reportes' && <BarChart2 className="mr-2 h-5 w-5" />}
                {vista === 'practicas' && <ClipboardList className="mr-2 h-5 w-5" />}
                {vista === 'horario' && <Calendar className="mr-2 h-5 w-5" />}
                {vista === 'equipos' && <Laptop className="mr-2 h-5 w-5" />}
                {vista === 'maestroInvitado' && <UserPlus className="mr-2 h-5 w-5" />}
                {vista === 'bitacora' && <BookOpen className="mr-2 h-5 w-5" />}
                {vista.charAt(0).toUpperCase() + vista.slice(1)}
              </Button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className={`p-4 ${modoColor.headerBackground} flex justify-between items-center`}>
            <h1 className={`text-2xl font-bold ${modoColor.titleText}`}>
              {vistaActual === 'reportes' ? 'Reporte de Clases' : 
               vistaActual === 'practicas' ? 'Todas las Prácticas' :
               vistaActual === 'horario' ? 'Horario Semanal' : 
               vistaActual === 'equipos' ? 'Equipos' : 
               vistaActual === 'maestroInvitado' ? 'Maestro Invitado' :
               'Bitácora'}
            </h1>
            <div className="flex items-center space-x-2">
              <Sun className={`h-4 w-4 ${theme === 'dark' ? 'text-gray-400' : 'text-yellow-500'}`} />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={handleThemeToggle}
                className={`${modoColor.switchBackground}`}
              />
              <Moon className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>
          </header>

          {/* Dashboard content */}
          <div className="p-6">
            <Card className={modoColor.cardBackground}>
              <CardContent className={`pt-6 ${modoColor.descriptionText}`}>
                {vistaActual === 'reportes' && <VistaReportes esModoOscuro={theme === 'dark'} logAction={logAction} />}
                {vistaActual === 'practicas' && <VistaPracticas esModoOscuro={theme === 'dark'} logAction={logAction} />}
                {vistaActual === 'horario' && <VistaHorario esModoOscuro={theme === 'dark'} logAction={logAction} />}
                {vistaActual === 'equipos' && <VistaEquipos esModoOscuro={theme === 'dark'} logAction={logAction} />}
                {vistaActual === 'maestroInvitado' && <VistaMaestroInvitado esModoOscuro={theme === 'dark'} logAction={logAction} />}
                {vistaActual === 'bitacora' && <VistaBitacora esModoOscuro={theme === 'dark'} logAction={logAction} />}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

