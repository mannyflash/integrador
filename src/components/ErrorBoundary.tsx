"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error capturado por ErrorBoundary:", error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#800040] to-[#a30050] dark:from-[#1d5631] dark:to-[#2a7a45] text-white p-4 text-center">
          <img src="/icons/icon-192x192.png" alt="Logo" className="w-24 h-24 mb-6" />
          <h1 className="text-2xl font-bold mb-4">Sistema de Laboratorio</h1>
          <p className="mb-6">Ha ocurrido un error inesperado. Por favor, intenta recargar la página.</p>
          <div className="bg-black/20 p-4 rounded-lg text-left overflow-auto max-w-full text-sm mb-6">
            <p className="font-bold">Detalles del error:</p>
            <p className="mt-2">{this.state.error?.toString()}</p>
          </div>
          <button
            onClick={() => {
              // Limpiar caché del Service Worker
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  for (const registration of registrations) {
                    registration.unregister()
                  }
                })
                caches.keys().then((cacheNames) => {
                  cacheNames.forEach((cacheName) => {
                    caches.delete(cacheName)
                  })
                })
              }
              // Recargar la página
              window.location.reload()
            }}
            className="px-4 py-2 bg-white text-[#800040] dark:text-[#1d5631] rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Limpiar caché y recargar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
