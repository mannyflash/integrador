'use client'

import * as React from 'react'
import { GraduationCap, UserSquare2, BookOpenCheck, FlaskRoundIcon as Flask } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
}

export function Sidebar({ activeTab, setActiveTab, isDarkMode }: SidebarProps) {
  const tabs = [
    { name: 'alumnos', icon: GraduationCap, label: 'Alumnos' },
    { name: 'docentes', icon: UserSquare2, label: 'Docentes' },
    { name: 'materias', icon: BookOpenCheck, label: 'Materias' },
    { name: 'laboratoristas', icon: Flask, label: 'Laboratoristas' },
  ]

  return (
    <aside className={`w-32 h-screen transition-all duration-300 ease-in-out ${isDarkMode ? 'bg-gray-900' : 'bg-green-50'}`}>
      <nav className="flex flex-col items-center py-8 space-y-12">
        <TooltipProvider delayDuration={300}>
          {tabs.map((tab) => (
            <Tooltip key={tab.name}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === tab.name ? 'default' : 'ghost'}
                  size="icon"
                  className={cn(
                    "w-24 h-24 rounded-xl transition-all duration-200",
                    activeTab === tab.name 
                      ? isDarkMode 
                        ? "bg-gray-700 text-white" 
                        : "bg-green-100 text-green-800"
                      : isDarkMode
                        ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                        : "text-green-700 hover:bg-green-50 hover:text-green-800"
                  )}
                  onClick={() => setActiveTab(tab.name)}
                >
                  <tab.icon className="h-16 w-16" />
                  <span className="sr-only">{tab.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-green-800'}>
                <p>{tab.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
    </aside>
  )
}

