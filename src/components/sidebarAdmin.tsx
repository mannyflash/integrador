import { UserSquare2, GraduationCap, BookOpen, Users, UserCog, LogOut } from 'lucide-react'

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  onLogout: () => void;
}

export function Sidebar({ activeTab, setActiveTab, isDarkMode, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'alumnos', label: 'Alumnos', icon: GraduationCap },
    { id: 'docentes', label: 'Docentes', icon: UserSquare2 },
    { id: 'materias', label: 'Materias', icon: BookOpen },
    { id: 'laboratoristas', label: 'Laboratoristas', icon: Users },
    { id: 'administradores', label: 'Administradores', icon: UserCog },
    { 
      id: 'cerrar-sesion', 
      label: 'Cerrar Sesión', 
      icon: LogOut, 
      onClick: onLogout,
      className: 'text-red-600 hover:bg-red-100 hover:text-red-800'
    },
  ]

  return (
    <aside className={`w-72 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4`}>
      <nav>
        <ul className="space-y-4">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => item.onClick ? item.onClick() : setActiveTab(item.id)}
                className={`flex items-center space-x-4 w-full px-4 py-6 rounded-md transition-colors duration-200 text-xl
                  ${item.className || (activeTab === item.id
                    ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-green-100 text-green-800')
                    : (isDarkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-green-800 hover:bg-green-50 hover:text-green-900')
                  )}`}
              >
                <item.icon className="h-8 w-8 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

