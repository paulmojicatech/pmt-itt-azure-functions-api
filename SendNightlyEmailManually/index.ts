import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";
import { EmailService } from "../shared/services/email.service";

const getEmailBody = (clientName: string, sessionTime: string) => {
    return `
Dear ${clientName},

This is a friendly reminder that you have an appointment scheduled with Kirstin R. Abraham, LCSW on ${sessionTime}.

Your appointment is at the following location: 

Kirstin R. Abraham, LCSW
8211 Avanti Drive
Marvin, NC 28173
704-233-7594

This is an automated email. If you need to reschedule or cancel your appointment, please call the office at 704 - 233 - 7594 or email: 
kirstin.abraham@indiantrailtherapy.com

The Private Practice of Kirstin R. Abraham, LCSW
Tel: 704-233-7594
Fax: 866-706-1632
Email:kirstin.abraham@indiantrailtherapy.com
Website:www.indiantrailtherapy.com
Practice Address: 8211 Avanti Drive. Marvin, NC 28173
    `;
};

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let mongoSvc: MongoService;
    let emailSvc: EmailService;
    try {
        mongoSvc = new MongoService();
        emailSvc = new EmailService();

        const clientsWhere = {
            $and: [
                {
                    ClientEmail: {
                        $not: {
                            $type: 10 // null type
                        },
                        $ne: "" // empty strings
                    }
                }
            ]
        };

        const allClientsWithEmails = await mongoSvc.getCollection('Clients', clientsWhere);
        const now = new Date().getTime();
        const startDate = new Date(now + (24*60*60*1000));
        const endDate = new Date(now + (2*24*60*60*1000));
        const clientSessionsWhere = {
            $and: [{
                ClientSessionDate: { $gte: startDate }
            }, {
                ClientSessionDate: { $lte: endDate }
            }]
        };
        const clientSessions = await mongoSvc.getCollection('ClientSessions', clientSessionsWhere);
        let clientsToSendTo = [];
        clientSessions.forEach(session => {
            const found = allClientsWithEmails.find(client => client.ClientID === session.ClientID);
            if (!!found) {
                const sessionTime =  new Date(new Date(session.ClientSessionDate).toLocaleString());                
                const AMPM = sessionTime.getHours() > 11 ? 'PM' : 'AM';
                const formattedTime = `${sessionTime
                                        .toLocaleString()
                                        .substring(0, sessionTime.toLocaleString().lastIndexOf(':'))} ${AMPM}`;

                clientsToSendTo = [...clientsToSendTo, {
                    'ClientName': found.ClientName,
                    'ClientEmail': found.ClientEmail,
                    'SessionTime': formattedTime
                }];
            }
        });
        if (!!clientsToSendTo?.length) {
            clientsToSendTo.forEach(async client => {
                await emailSvc.sendEmail(client.ClientEmail, 'Upcoming Appointment Reminder' , getEmailBody(client.ClientName, client.SessionTime));
            });

            const confirmMessage = `${getEmailBody(clientsToSendTo[0].ClientName, clientsToSendTo[0].SessionTime)} 
            
            ${JSON.stringify(clientsToSendTo)}`;

            await emailSvc.sendEmail(`${process.env.ADMIN_EMAIL}`, 'Upcoming Appointment Reminder' , confirmMessage);

            context.res = {
                status: 200,
                body: "Emails sent"
            };

        } else {
            context.res = {
                status: 200,
                body: 'No Clients scheduled'
            }
        }

        
    } catch (ex) {
        context.res = {
            status: 500,
            body: ex
        };
    } finally {
        if (!!mongoSvc) {
            mongoSvc.disconnect();
        }
        context.done();
    }
};


export default httpTrigger;
