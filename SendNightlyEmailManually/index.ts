import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";
import { EmailService } from "../shared/services/email.service";

const getEmailBody = (clientName: string, sessionTime: string) => {
    return `Hi ${clientName},

This is a reminder that you have a scheduled telehealth session with Kirstin Abraham, LCSW on ${sessionTime}. 
    
Prior to our session time, please visit my website at: www.marvintherapy.com (or www.indiantrailtherapy.com) and make the required co-payment or session fee under the tab called “make a payment”. You will be prompted to enter the payment amount and your payment information; you do not need to have a paypal account to use this system. Session will not take place without the advance session fee payment.
   
Currently, our telehealth sessions can take place through various methods of your choosing.
    
To reach me through VSee: You may download the VSee Clinic mobile app at https://go.vsee.me/h08px and enter the room code: h08px.
    
To reach me through Apple FaceTime: please call/ FaceTime 914-469-9824.
    
To reach me through Facebook Messenger: please find my Facebook page here, https://www.facebook.com/indiantrailtherapy/
    
To have a regular telephone session: you can reach me at (704) 233-7594.
  
Since I have no way of knowing what method of telehealth works best for each individual, it is your responsibility to call this provider during your scheduled session time. As a reminder, there is a 24 hour cancellation requirement to avoid being charged for a scheduled session slot that was not attended.
    
As always, please feel free to reach out anytime. I hope you are staying healthy admits these changing times. And, I look forward to our upcoming telehealth session.

Warmly,
Kirstin R. Abraham, LCSW
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
                const sessionTime =  new Date(session.ClientSessionDate);
                const utc = new Date(Date.UTC(sessionTime.getFullYear(), 
                    sessionTime.getMonth(), sessionTime.getDate(),
                    sessionTime.getHours(), sessionTime.getMinutes()));
                const offset = utc.getTimezoneOffset() * 60000;
                const utcOffset = utc.getTime() + offset;
                const estOffset = 1000 * 60 * 60 * -4;       
                const estTime = new Date(utcOffset + estOffset);       
                const formattedTime = `${estTime
                                        .toLocaleString()
                                        .substring(0, sessionTime.toString().lastIndexOf(':'))}`;

                clientsToSendTo = [...clientsToSendTo, {
                    'ClientName': found.ClientName,
                    'ClientEmail': found.ClientEmail,
                    'SessionTime': formattedTime
                }];
            }
        });
        if (!!clientsToSendTo?.length) {
            clientsToSendTo.forEach(async client => {
                await emailSvc.sendEmail([client.ClientEmail], 'Upcoming Appointment Reminder' , getEmailBody(client.ClientName, client.SessionTime));
            });

            const confirmMessage = `${getEmailBody(clientsToSendTo[0].ClientName, clientsToSendTo[0].SessionTime)} 
            
            ${JSON.stringify(clientsToSendTo)}`;

            await emailSvc.sendEmail([`${process.env.ADMIN_EMAIL}`], 'Upcoming Appointment Reminder' , confirmMessage);

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
