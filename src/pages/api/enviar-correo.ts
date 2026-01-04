import type { NextApiRequest, NextApiResponse } from "next"

interface DatosCorreoEquipo {
  equipoId: string
  motivo: string
  notas: string
  laboratorista: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" })
  }

  try {
    const datos: DatosCorreoEquipo = req.body

    const mensaje = `
REPORTE AUTOMÁTICO DE EQUIPO DESHABILITADO

═══════════════════════════════════════════════════════════════
INFORMACIÓN DEL EQUIPO
═══════════════════════════════════════════════════════════════
• Equipo ID: ${datos.equipoId}
• Fecha y hora: ${new Date().toLocaleString("es-MX")}
• Usuario responsable: ${datos.laboratorista}
• Estado anterior: En servicio
• Estado nuevo: Fuera de servicio

═══════════════════════════════════════════════════════════════
RAZÓN DE LA DESHABILITACIÓN
═══════════════════════════════════════════════════════════════
${datos.motivo}

═══════════════════════════════════════════════════════════════
NOTAS ADICIONALES DEL EQUIPO
═══════════════════════════════════════════════════════════════
${datos.notas || "Sin notas adicionales"}

═══════════════════════════════════════════════════════════════
ACCIONES REQUERIDAS
═══════════════════════════════════════════════════════════════
1. Revisar físicamente el equipo ${datos.equipoId}
2. Diagnosticar el problema reportado: "${datos.motivo}"
3. Realizar las reparaciones necesarias
4. Notificar al laboratorio cuando esté listo para reactivación
5. Actualizar el estado en el sistema una vez reparado

⚠️  ATENCIÓN: Este equipo NO debe ser utilizado hasta completar la revisión técnica.

═══════════════════════════════════════════════════════════════
Sistema de Gestión de Laboratorio - Reporte Automático
Generado el: ${new Date().toLocaleString("es-MX")}
═══════════════════════════════════════════════════════════════
    `

    const datosParaScript = {
      asunto: `REPORTE URGENTE - Equipo ${datos.equipoId} Fuera de Servicio`,
      mensaje: mensaje,
      correoDestino: "l21303162@puertopenasco.tecnm.mx",
    }

    const googleScriptURL = "https://script.google.com/macros/s/TU_SCRIPT_ID/exec"

    await fetch(googleScriptURL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosParaScript),
    })

    console.log("[v0] Reporte enviado exitosamente al departamento de sistemas")

    return res.status(200).json({
      success: true,
      message: "Correo enviado exitosamente a l21303162@puertopenasco.tecnm.mx",
    })
  } catch (error) {
    console.error("[v0] Error al enviar correo:", error)
    return res.status(500).json({
      success: false,
      message: "Error al enviar el correo. Por favor, contacta a sistemas manualmente.",
    })
  }
}
