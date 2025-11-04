import type { NextApiRequest, NextApiResponse } from "next"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const { equipoId, motivo, notas, laboratorista } = req.body

    const { data, error } = await resend.emails.send({
      from: "Sistema de Laboratorio <onboarding@resend.dev>",
      to: ["manuelgaona800@gmail.com"],
      subject: `⚠️ Equipo Desactivado - ID: ${equipoId}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .info-box {
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 15px 0;
                border-left: 4px solid #ef4444;
              }
              .info-row {
                display: flex;
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .label {
                font-weight: 600;
                color: #6b7280;
                min-width: 140px;
              }
              .value {
                color: #111827;
                flex: 1;
              }
              .footer {
                background: #111827;
                color: #9ca3af;
                padding: 20px;
                text-align: center;
                border-radius: 0 0 10px 10px;
                font-size: 14px;
              }
              .alert {
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #991b1b;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>⚠️ Notificación de Equipo Desactivado</h1>
            </div>
            
            <div class="content">
              <div class="alert">
                Se ha desactivado un equipo en el sistema de laboratorio y requiere atención del departamento de sistemas.
              </div>
              
              <div class="info-box">
                <h2 style="margin-top: 0; color: #111827; font-size: 18px;">Detalles del Equipo</h2>
                
                <div class="info-row">
                  <span class="label">ID del Equipo:</span>
                  <span class="value"><strong>${equipoId}</strong></span>
                </div>
                
                <div class="info-row">
                  <span class="label">Motivo:</span>
                  <span class="value">${motivo}</span>
                </div>
                
                ${
                  notas
                    ? `
                <div class="info-row">
                  <span class="label">Notas Adicionales:</span>
                  <span class="value">${notas}</span>
                </div>
                `
                    : ""
                }
                
                <div class="info-row">
                  <span class="label">Reportado por:</span>
                  <span class="value">${laboratorista}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Fecha y Hora:</span>
                  <span class="value">${new Date().toLocaleString("es-MX", {
                    dateStyle: "full",
                    timeStyle: "short",
                    timeZone: "America/Mexico_City",
                  })}</span>
                </div>
              </div>
              
              <p style="color: #6b7280; margin-top: 20px;">
                Por favor, revise el sistema de laboratorio para más detalles y tome las acciones necesarias.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">Sistema de Gestión de Laboratorio</p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">Este es un correo automático, por favor no responder.</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("Error al enviar correo:", error)
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error("Error en el servidor:", error)
    return res.status(500).json({ error: "Error al enviar el correo" })
  }
}
