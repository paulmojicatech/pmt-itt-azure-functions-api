import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { EmailService } from '../shared/services/email.service';

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    let emailSvc: EmailService;

    try {
        emailSvc = new EmailService();
        const emailToSend: IEmailMessage = context.req.body;
        const { name, phone, email, message } = emailToSend;
        const subject = 'Incoming Message From Website';
        const emailMessageToSend = `
        Name: ${name}
        Phone: ${phone}
        Email: ${email}
        Message: ${message}
        `;
        const isSuccess = await emailSvc.sendEmail(
            ['kirstin.abraham@marvintherapy.com', 'paulmojicatech@gmail.com'],
            subject,
            emailMessageToSend
        );
        if (isSuccess) {
            context.res = {
                status: 200
            };
        } else {
            context.res = {
                status: 500,
                body: JSON.stringify({ error: 'Email failed to send' }),
            };
        }
    } catch (err) {
        context.res = {
            status: 500,
            body: JSON.stringify({error: err }),
        };
    } finally {
    }
};

export interface IEmailMessage {
    name: string;
    phone: string;
    email: string;
    message: string;
}

export default httpTrigger;
