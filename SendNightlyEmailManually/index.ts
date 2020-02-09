import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";
import { EmailService } from "../shared/services/email.service";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let mongoSvc: MongoService;
    let emailSvc: EmailService;
    try {
        mongoSvc = new MongoService();
        emailSvc = new EmailService();

        const clientsWhere = { $and: [ 
            {
                ClientID: {
                    $in: context.req.body.clientsToInclude
                }
            },
            { 
                ClientEmail: { 
                    $not: { 
                        $type: 10 // null type
                    }, 
                    $ne: "" // empty strings
                } 
            } 
        ]};

        const allClientsWithEmails = await mongoSvc.getCollection('Clients', clientsWhere);
        const clientSessionsWhere = {
            ClientSessionDate: { $gte: "2019-12-01" }
        };
        const clientSessions = await mongoSvc.getCollection('ClientSessions', clientSessionsWhere);
        let clientsToSendTo = [];
        clientSessions.forEach(session => {
            const found = allClientsWithEmails.find(client => client.ClientID === session.ClientID);
            if (!!found) {
                clientsToSendTo = [...clientsToSendTo, {
                    'ClientName': found.ClientName,
                    'ClientEmail': found.ClientEmail,
                    'SessionTime': session.ClientSessionDate
                }];
            }
        });
        await emailSvc.sendEmail('paulmojicatech@gmail.com', 'Testing Nightly Email', JSON.stringify(clientsToSendTo));
        if (!!clientsToSendTo) {
            clientsToSendTo.forEach(async client => {
                //await emailSvc.sendEmail(client.ClientEmail, context.req.body.subject, context.req.body.message);
            });
        }

        context.res = {
            status: 200,
            body: "Emails sent"
        };
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
