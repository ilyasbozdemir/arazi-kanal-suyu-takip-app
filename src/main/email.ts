import nodemailer from 'nodemailer'
import path from 'path'

export interface SmtpConfig {
  host: string
  port: number
  user: string
  pass: string
  to: string
}

export async function sendBackupEmail(
  filePath: string,
  config: SmtpConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const isSecure = Number(config.port) === 465

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: Number(config.port),
      secure: isSecure, // true for 465, false for 587 / other ports
      auth: {
        user: config.user,
        pass: config.pass
      },
      tls: {
        rejectUnauthorized: false // Avoid self-signed certificate errors
      }
    })

    const fileName = path.basename(filePath)
    const dateStr = new Date().toLocaleString('tr-TR')

    const mailOptions = {
      from: `"${config.user}" <${config.user}>`,
      to: config.to,
      subject: `Arazi Suyu Takip Yedek - ${fileName} - ${dateStr}`,
      text: `${fileName} veritabanı yedeğidir.\n\nOtomatik yedekleme zamanı: ${dateStr}\nDosya Yolu: ${filePath}`,
      attachments: [
        {
          filename: fileName,
          path: filePath // Path-based streaming avoids file copy locks
        }
      ]
    }

    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (e: any) {
    console.error('SMTP Error:', e)
    return { success: false, error: e.message }
  }
}
