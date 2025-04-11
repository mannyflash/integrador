import { Users, BookOpen, UserCog, Shield } from "lucide-react"

interface StatsCardsProps {
  stats: {
    totalAlumnos: number
    totalDocentes: number
    totalMaterias: number
    totalLaboratoristas: number
    totalAdministradores: number
  }
  isDarkMode: boolean
  colors: any
}

export function StatsCards({ stats, isDarkMode, colors }: StatsCardsProps) {
  const currentColors = isDarkMode ? colors.dark : colors.light

  const statItems = [
    {
      title: "Alumnos",
      value: stats.totalAlumnos,
      icon: <Users className="h-8 w-8" />,
      color: "from-blue-500 to-blue-600",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Docentes",
      value: stats.totalDocentes,
      icon: <Users className="h-8 w-8" />,
      color: "from-purple-500 to-purple-600",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Materias",
      value: stats.totalMaterias,
      icon: <BookOpen className="h-8 w-8" />,
      color: "from-yellow-500 to-yellow-600",
      textColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "Laboratoristas",
      value: stats.totalLaboratoristas,
      icon: <UserCog className="h-8 w-8" />,
      color: "from-green-500 to-green-600",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Administradores",
      value: stats.totalAdministradores,
      icon: <Shield className="h-8 w-8" />,
      color: "from-red-500 to-red-600",
      textColor: "text-red-600 dark:text-red-400",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div
          key={index}
          className={`
            ${isDarkMode ? "bg-[#2a2a2a] border-gray-700" : "bg-white border-gray-200"}
            border rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105
          `}
        >
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>{item.title}</h3>
              <div
                className={`
                p-2 rounded-lg bg-gradient-to-br ${item.color} text-white
              `}
              >
                {item.icon}
              </div>
            </div>
            <div className="mt-auto">
              <p className={`text-3xl font-bold ${item.textColor}`}>{item.value}</p>
              <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total registrado</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
