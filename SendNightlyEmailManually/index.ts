import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";
import { EmailService } from "../shared/services/email.service";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let mongoSvc: MongoService;
    let emailSvc: EmailService;
    try {
        mongoSvc = new MongoService();
        emailSvc = new EmailService();

        // const clientsWhere = { $and: [ 
        //     {
        //         ClientID: {
        //             $in: context.req.body.clientsToInclude
        //         }
        //     },
        //     { 
        //         ClientEmail: { 
        //             $not: { 
        //                 $type: 10 // null type
        //             }, 
        //             $ne: "" // empty strings
        //         } 
        //     } 
        // ]};

        //const clientsToSendTo = await mongoSvc.getCollection('Clients', clientsWhere);
        const objsToSend = await mongoSvc.getJoinedTables('ClientSessions', 'Clients', 'ClientID', 'ClientID', 'client_docs');
        console.log('Objects To Send', objsToSend);
        await emailSvc.sendEmail('paulmojicatech@gmail.com', 'Testing Nightly Email', JSON.stringify(objsToSend));
        if (!!objsToSend) {
            objsToSend.forEach(async client => {
                await emailSvc.sendEmail(client.ClientEmail, context.req.body.subject, context.req.body.message);
            });``
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
