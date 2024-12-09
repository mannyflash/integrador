import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, UserSquare2, BookOpen } from 'lucide-react'

interface Stats {
  totalAlumnos: number;
  totalDocentes: number;
  totalMaterias: number;
  totalLaboratoristas: number;
}

export function StatsCards({ stats, isDarkMode, colors }: { stats: Stats; isDarkMode: boolean; colors: any }) {
  return (
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
  )
}

