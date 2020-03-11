import * as nodemailer from 'nodemailer';

export class EmailService {
    constructor() { }

    async sendEmail(emailRecipents: string[], subject: string, message: string): Promise<boolean> {
        let isSuccess = false;
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_SERVER,
                port: process.env.SMTP_PORT,
                secure: false,
                auth: {
                    user: process.env.FROM_EMAIL,
                    pass: process.env.FROM_PWD
                }
            });
            const fromDisplay = `${process.env.FROM_EMAIL_FIRST_NAME} ${process.env.FROM_EMAIL_MIDDLE_NAME} ${process.env.FROM_EMAIL_LAST_NAME}, ${process.env.FROM_EMAIL_TITLE}`;
            await transporter.sendMail({
                from: `"${fromDisplay}" ${process.env.FROM_EMAIL}`,
                to: `${process.env.FROM_EMAIL}`,
                bcc: emailRecipents.join(','),
                subject,
                text: message
            });
            isSuccess = true;

        } catch (ex) {
            console.log('ERR', ex);
            
        } finally {
            return Promise.resolve(isSuccess);
        }
        
    }

}