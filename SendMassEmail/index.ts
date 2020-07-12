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

        const clientsToSendTo = await mongoSvc.getCollection('Clients', clientsWhere);
        const { subject, message, isTest } = context.req.body;
        await emailSvc.sendEmail([`${process.env.ADMIN_EMAIL}`], subject, `${message}
        ${JSON.stringify(clientsToSendTo)}`);
        let emailRecipents: string[] = [];
        if (!!clientsToSendTo) {
            clientsToSendTo.forEach(async client => {
                emailRecipents = [...emailRecipents, client.ClientEmail];
            });
            if (!isTest) {
                await emailSvc.sendEmail(emailRecipents, subject, message);
            }
        }

        context.res = {
            status: 200,
            body: "Emails sent"
        };
    } catch (ex) {
        context.res = {
            status: 500,
            body: ex
        }
    } finally {
        if (mongoSvc) {
            mongoSvc.disconnect();
        }
        context.done();
    }
};

export default httpTrigger;
