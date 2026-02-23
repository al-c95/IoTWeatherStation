import NotificationChannel from "./NotificationChannel";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

class EmailNotificationChannel implements NotificationChannel
{
    private _recipients: string[];

    constructor(recipients: string[]) {
        this._recipients=recipients;
    }

    async send(title: string, message: string): Promise<void>
    {
        dotenv.config();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
            tls: {
              rejectUnauthorized: false
            }
          });

          const sendEmail = async () => {
            try {
              const info = await transporter.sendMail({
                from: `"weather-core" <${process.env.EMAIL_USER}>`,
                to: `${this._recipients.join(', ')}`,
                subject: title,
                text: message, // plain text body
                html: "", // html body
              });
          
              console.log("Email sent! ID:", info.messageId);
            } catch (error) {
              console.error("Error sending email:", error);
            }
          };
         
        await sendEmail();
    }
}

export default EmailNotificationChannel;