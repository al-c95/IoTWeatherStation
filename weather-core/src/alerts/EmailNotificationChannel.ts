import NotificationChannel from "./NotificationChannel";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { AppLogger, getLogger } from "../logger";

class EmailNotificationChannel implements NotificationChannel
{
    private _recipients: string[];
    protected readonly _logger: AppLogger;

    constructor(recipients: string[]) {
        this._recipients=recipients;
        this._logger=getLogger(this.constructor.name);
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

              this._logger.info(`Email sent. ID: ${info.messageId}`);
            } 
            catch (error) {
              this._logger.error('Error sending email:', {error});
            }
          };
         
        await sendEmail();
    }
}

export default EmailNotificationChannel;