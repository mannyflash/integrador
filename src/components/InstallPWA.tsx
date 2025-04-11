"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

interface InstallPWAProps {
  isDarkMode: boolean
  colors: any
}

export function InstallPWA({ isDarkMode, colors }: InstallPWAProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [showManualInstructions, setShowManualInstructions] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir que Chrome muestre el diálogo automáticamente
      e.preventDefault()
      console.log("Evento beforeinstallprompt capturado")
      // Guardar el evento para usarlo más tarde
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Actualizar el estado para mostrar el botón de instalación
      setIsInstallable(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Verificar si la app ya está instalada
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("La aplicación ya está instalada")
      setIsInstallable(false)
    } else {
      console.log("La aplicación NO está instalada")
      // Si después de 3 segundos no se ha capturado el evento, mostrar instrucciones manuales
      const timer = setTimeout(() => {
        if (!deferredPrompt) {
          console.log("No se capturó el evento beforeinstallprompt, mostrando instrucciones manuales")
          setShowManualInstructions(true)
        }
      }, 3000)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [deferredPrompt])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowManualInstructions(true)
      return
    }

    // Mostrar el diálogo de instalación
    deferredPrompt.prompt()

    // Esperar a que el usuario responda al diálogo
    const { outcome } = await deferredPrompt.userChoice

    // Limpiar el evento guardado
    setDeferredPrompt(null)

    if (outcome === "accepted") {
      setIsInstallable(false)
      console.log("Usuario aceptó la instalación")
    } else {
      console.log("Usuario rechazó la instalación")
    }
  }

  // Si la app ya está instalada, no mostrar nada
  if (!isInstallable && !showManualInstructions) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`p-4 rounded-lg shadow-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
        <h3 className="font-bold text-lg mb-2">Instalar aplicación</h3>

        <button
          onClick={handleInstallClick}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md transition-transform transform hover:scale-105 mb-2 w-full justify-center ${
            isDarkMode ? colors.dark.buttonPrimary : colors.light.buttonPrimary
          }`}
        >
          <Download className="h-5 w-5" />
          <span>Instalar ahora</span>
        </button>

        {showManualInstructions && (
          <div className="text-sm mt-2">
            <p className="mb-1">Si el botón no funciona, puedes instalar manualmente:</p>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs">
              <p className="mb-1">
                <strong>En Chrome/Edge (PC):</strong> Haz clic en ⋮ (menú) → Instalar aplicación
              </p>
              <p className="mb-1">
                <strong>En Safari (iOS):</strong> Toca el botón compartir → Añadir a pantalla de inicio
              </p>
              <p>
                <strong>En Chrome (Android):</strong> Toca ⋮ (menú) → Instalar aplicación
              </p>
            </div>
            <button onClick={() => setShowManualInstructions(false)} className="text-xs underline mt-2">
              Ocultar instrucciones
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
