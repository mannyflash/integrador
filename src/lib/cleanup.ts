import { getFirestore, collection, getDocs, doc, getDoc, writeBatch, setDoc } from "firebase/firestore"
import { logAction } from "./logging"

const db = getFirestore()

/**
 * Verifica y limpia asistencias huérfanas (asistencias que quedaron sin eliminar después de finalizar una clase)
 * @param forzarLimpieza Si es true, fuerza la limpieza incluso si detecta una clase activa
 * @returns Promise que se resuelve cuando la verificación y limpieza se completa
 */
export async function verificarYLimpiarAsistenciasHuerfanas(forzarLimpieza = false): Promise<void> {
  try {
    // Obtener laboratorio actual
    const lab = typeof window !== "undefined" ? localStorage.getItem("laboratorio") || "programacion" : "programacion"

    // Verificar si hay una clase activa
    const estadoClaseDoc = await getDoc(doc(db, "EstadoClase", lab))

    // Verificacion mas inteligente: una clase esta realmente activa si tiene iniciada=true Y tiene datos de maestro y practica
    const data = estadoClaseDoc.exists() ? estadoClaseDoc.data() : null
    const claseActiva = data?.iniciada === true && data?.maestroId && data?.practica && data?.horaInicio

    // Si no hay una clase activa o se fuerza la limpieza, verificar si hay asistencias
    if (!claseActiva || forzarLimpieza) {
      // Si hay un estado de clase inconsistente y estamos forzando la limpieza, corregirlo
      if (data?.iniciada === true && forzarLimpieza) {
        try {
          await setDoc(doc(db, "EstadoClase", lab), {
            iniciada: false,
            horaFin: new Date().toLocaleTimeString(),
            corregidoAutomaticamente: true,
          })
          console.log("Estado de clase corregido: se estableció iniciada=false")
          await logAction("Corrección Automática", "Se corrigió el estado de clase inconsistente")
        } catch (error) {
          console.error("Error al corregir el estado de clase:", error)
        }
      }

      const asistenciasSnapshot = await getDocs(collection(db, "Asistencias"))
      // Solo eliminar asistencias del laboratorio actual
      const asistenciasDelLab = asistenciasSnapshot.docs.filter((d) => {
        const data = d.data()
        return !data.laboratorio || data.laboratorio === lab
      })

      if (asistenciasDelLab.length > 0) {
        console.log(`Se encontraron ${asistenciasDelLab.length} asistencias huerfanas del lab ${lab}. Limpiando...`)

        // Usar batch para eliminar las asistencias del laboratorio
        const batchAsistencias = writeBatch(db)

        asistenciasDelLab.forEach((d) => {
          batchAsistencias.delete(d.ref)
        })

        // Ejecutar el batch de asistencias
        await batchAsistencias.commit()
        console.log(`Limpieza completada: ${asistenciasDelLab.length} asistencias eliminadas del lab ${lab}`)

        // Resetear el estado de los equipos con un NUEVO batch
        await resetearEstadoEquipos()

        await logAction("Limpieza Automatica", `Se eliminaron ${asistenciasDelLab.length} asistencias huerfanas del lab ${lab}`)

        return Promise.resolve()
      } else {
        console.log("No se encontraron asistencias huérfanas")
      }
    } else {
      console.log("Hay una clase activa, no se realizará limpieza de asistencias")
      console.log("Datos de la clase activa:", data)
    }
  } catch (error) {
    console.error("Error al verificar y limpiar asistencias huérfanas:", error)
    await logAction("Error", `Error al verificar y limpiar asistencias huérfanas: ${error}`)
    throw error
  }
}

/**
 * Resetea el estado "enUso" de todos los equipos
 */
export async function resetearEstadoEquipos(): Promise<void> {
  try {
    const labEquipos = typeof window !== "undefined" ? localStorage.getItem("laboratorio") || "programacion" : "programacion"
    const equipoRef = doc(db, "Numero de equipos", labEquipos)
    const equipoDoc = await getDoc(equipoRef)

    if (equipoDoc.exists()) {
      const equiposData = equipoDoc.data()
      const equiposActualizados = equiposData.Equipos.map((eq: any) => ({
        ...eq,
        enUso: false,
      }))

      // Crear un batch para actualizar los equipos
      const batchEquipos = writeBatch(db)
      batchEquipos.set(equipoRef, { Equipos: equiposActualizados })
      await batchEquipos.commit()

      console.log("Estado de equipos restablecido")
      await logAction("Equipos", "Se han restablecido los estados de los equipos a 'no en uso'")
    }
  } catch (error) {
    console.error("Error al resetear el estado de los equipos:", error)
    await logAction("Error", `Error al resetear el estado de los equipos: ${error}`)
    throw error
  }
}
