'use client'

import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { BarChart2, Calendar, Laptop, ClipboardList, Moon, Sun, UserPlus } from 'lucide-react'
import VistaReportes from '../components/VistaReportes'
import VistaPracticas from '../components/VistaPracticas'
import VistaHorario from '../components/VistaHorario'
import VistaEquipos from '../components/VistaEquipos'
import VistaMaestroInvitado from '../components/VistaMaestroInvitado'
import { colors, firebaseConfig } from '../lib/constants'

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

export default function PanelLaboratorista() {
  const [esModoOscuro, setEsModoOscuro] = useState(false)
  const [vistaActual, setVistaActual] = useState<'reportes' | 'practicas' | 'horario' | 'equipos' | 'maestroInvitado'>('reportes')

  const modoColor = esModoOscuro ? colors.dark : colors.light

  return (
    <div className={`min-h-screen w-full ${modoColor.background}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-64 ${modoColor.headerBackground} p-6 hidden md:block`}>
          <h2 className={`text-2xl font-bold mb-6 ${modoColor.titleText}`}>Panel de Control</h2>
          <nav>
            <Button
              variant="ghost"
              className={`w-full justify-start mb-4 text-lg font-semibold ${vistaActual === 'reportes' ? `${modoColor.hoverBackground} ${modoColor.titleText}` : ''}`}
              onClick={() => setVistaActual('reportes')}
            >
              <BarChart2 className="mr-2 h-5 w-5" /> Reportes
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start mb-4 text-lg font-semibold ${vistaActual === 'practicas' ? `${modoColor.hoverBackground} ${modoColor.titleText}` : ''}`}
              onClick={() => setVistaActual('practicas')}
            >
              <ClipboardList className="mr-2 h-5 w-5" /> Todas las Prácticas
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start mb-4 text-lg font-semibold ${vistaActual === 'horario' ? `${modoColor.hoverBackground} ${modoColor.titleText}` : ''}`}
              onClick={() => setVistaActual('horario')}
            >
              <Calendar className="mr-2 h-5 w-5" /> Horario
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start mb-4 text-lg font-semibold ${vistaActual === 'equipos' ? `${modoColor.hoverBackground} ${modoColor.titleText}` : ''}`}
              onClick={() => setVistaActual('equipos')}
            >
              <Laptop className="mr-2 h-5 w-5" /> Equipos
            </Button>
            <Button
              variant="ghost"
              className={`w-full justify-start mb-4 text-lg font-semibold ${vistaActual === 'maestroInvitado' ? `${modoColor.hoverBackground} ${modoColor.titleText}` : ''}`}
              onClick={() => setVistaActual('maestroInvitado')}
            >
              <UserPlus className="mr-2 h-5 w-5" /> Maestro Invitado
            </Button>
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
               vistaActual === 'equipos' ? 'Equipos' : 'Maestro Invitado'}
            </h1>
            <div className="flex items-center space-x-2">
              <Sun className={`h-4 w-4 ${esModoOscuro ? 'text-gray-400' : 'text-yellow-500'}`} />
              <Switch
                checked={esModoOscuro}
                onCheckedChange={setEsModoOscuro}
                aria-label="Alternar modo oscuro"
              />
              <Moon className={`h-4 w-4 ${esModoOscuro ? 'text-blue-400' : 'text-gray-400'}`} />
            </div>
          </header>

          {/* Dashboard content */}
          <div className="p-6">
            <Card className={modoColor.cardBackground}>
              <CardContent className="pt-6">
                {vistaActual === 'reportes' && <VistaReportes esModoOscuro={esModoOscuro} />}
                {vistaActual === 'practicas' && <VistaPracticas esModoOscuro={esModoOscuro} />}
                {vistaActual === 'horario' && <VistaHorario esModoOscuro={esModoOscuro} />}
                {vistaActual === 'equipos' && <VistaEquipos esModoOscuro={esModoOscuro} />}
                {vistaActual === 'maestroInvitado' && <VistaMaestroInvitado esModoOscuro={esModoOscuro} />}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

