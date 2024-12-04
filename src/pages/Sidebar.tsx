import React from 'react'
import { Menu, X, User } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  isDarkMode: boolean
  onAdminLogin: () => void
  adminLoginText: string
}

export function Sidebar({ isDarkMode, onAdminLogin, adminLoginText }: SidebarProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className={`${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex flex-col h-full">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <nav className="space-y-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onAdminLogin}
            >
              <User className="mr-2 h-4 w-4" />
              {adminLoginText}
            </Button>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

