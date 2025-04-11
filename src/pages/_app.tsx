"use client"

import "@/styles/globals.css"
import type { AppProps } from "next/app"
import { useEffect, useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import Head from "next/head"
import ErrorBoundary from "@/components/ErrorBoundary"
import { InstallPWA } from "@/components/InstallPWA"

export default function App({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Colores para la aplicación
  const colors = {
    light: {
      buttonPrimary: "bg-[#800040] text-white hover:bg-[#600030]",
    },
    dark: {
      buttonPrimary: "bg-[#1d5631] text-white hover:bg-[#164726]",
    },
  }

  useEffect(() => {
    // Detectar modo oscuro
    const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDarkMode(darkModeMediaQuery.matches)

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches)
    }

    darkModeMediaQuery.addEventListener("change", handleDarkModeChange)

    // Simular tiempo de carga para mostrar la pantalla de carga
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    // Registrar el service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("Service Worker registrado con éxito:", registration.scope)
          },
          (err) => {
            console.log("Error al registrar el Service Worker:", err)
          },
        )
      })
    }

    return () => {
      clearTimeout(timer)
      darkModeMediaQuery.removeEventListener("change", handleDarkModeChange)
    }
  }, [])

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#800040] to-[#a30050] dark:from-[#1d5631] dark:to-[#2a7a45] text-white p-4 text-center">
        <img src="/icons/icon-192x192.png" alt="Logo" className="w-24 h-24 mb-6 animate-pulse" />
        <h1 className="text-2xl font-bold mb-4">Sistema de Laboratorio</h1>
        <p className="mb-6">Cargando la aplicación...</p>
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Head>
          <meta name="application-name" content="Sistema de Laboratorio" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="SisLab" />
          <meta name="description" content="Sistema de gestión para laboratorios educativos" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#800040" media="(prefers-color-scheme: light)" />
          <meta name="theme-color" content="#1d5631" media="(prefers-color-scheme: dark)" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="shortcut icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        </Head>
        <Component {...pageProps} />
        <InstallPWA isDarkMode={isDarkMode} colors={colors} />
      </ThemeProvider>
    </ErrorBoundary>
  )
}
