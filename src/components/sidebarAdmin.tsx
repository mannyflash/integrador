"use client"

import { useState } from "react"
import { Users, BookOpen, UserCog, Shield, LogOut, ChevronRight, User, Menu, X } from "lucide-react"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isDarkMode: boolean
  onLogout: () => void
}

export function Sidebar({ activeTab, setActiveTab, isDarkMode, onLogout }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const tabs = [
    { id: "alumnos", label: "Alumnos", icon: <Users size={20} /> },
    { id: "docentes", label: "Docentes", icon: <User size={20} /> },
    { id: "materias", label: "Materias", icon: <BookOpen size={20} /> },
    { id: "laboratoristas", label: "Laboratoristas", icon: <UserCog size={20} /> },
    { id: "administradores", label: "Administradores", icon: <Shield size={20} /> },
  ]

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 right-4 z-50 md:hidden bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isDarkMode ? "bg-[#0c1f15] text-white" : "bg-[#fff0f5] text-[#800040]"}
          ${isCollapsed ? "w-20" : "w-64"} 
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          fixed md:relative h-[calc(100vh-64px)] z-50 transition-all duration-300 ease-in-out
          border-r ${isDarkMode ? "border-gray-700" : "border-[#800040]/20"}
        `}
      >
        <div className="h-full flex flex-col justify-between">
          <div className="overflow-y-auto">
            <div className="flex items-center justify-between p-4">
              <h2 className={`font-bold text-lg ${isCollapsed ? "hidden" : "block"}`}>Navegación</h2>
              <button
                onClick={toggleSidebar}
                className={`
                  ${isDarkMode ? "text-white hover:bg-[#1d5631]/30" : "text-[#800040] hover:bg-[#800040]/10"}
                  p-2 rounded-full hidden md:flex items-center justify-center transition-colors
                `}
              >
                <ChevronRight
                  size={20}
                  className={`transform transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            <nav className="mt-2 px-2">
              <ul className="space-y-1">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => {
                        setActiveTab(tab.id)
                        if (window.innerWidth < 768) {
                          setIsMobileOpen(false)
                        }
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${
                          activeTab === tab.id
                            ? isDarkMode
                              ? "bg-[#1d5631] text-white font-medium shadow-md"
                              : "bg-[#800040] text-white font-medium shadow-md"
                            : isDarkMode
                              ? "hover:bg-[#1d5631]/20 text-gray-200"
                              : "hover:bg-[#800040]/10 text-[#800040]"
                        }
                        ${isCollapsed ? "justify-center" : "justify-start"}
                      `}
                    >
                      <div
                        className={`
                        ${activeTab === tab.id ? "text-white" : isDarkMode ? "text-gray-300" : "text-[#800040]"}
                      `}
                      >
                        {tab.icon}
                      </div>
                      <span className={`${isCollapsed ? "hidden" : "block"} truncate`}>{tab.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="p-4">
            <button
              onClick={onLogout}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isDarkMode ? "bg-red-700 hover:bg-red-600 text-white" : "bg-red-600 hover:bg-red-500 text-white"}
                ${isCollapsed ? "justify-center" : "justify-start"}
              `}
            >
              <LogOut size={20} />
              <span className={`${isCollapsed ? "hidden" : "block"}`}>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
