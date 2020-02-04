import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let mongoSvc: MongoService = null;
    try {
        mongoSvc = new MongoService();
        const clientId = +req.body.clientId;
        const clientSessionDate = req.body.clientSessionDate;

        const lastClientSession = await mongoSvc.getlastDocumentInCollection('ClientSessions', 
            {}, 
            { ClientSessionID: -1 });
        const newSessionID = !!lastClientSession.ClientSessionID ? 
            lastClientSession.ClientSessionID + 1 :
            1;
        const newSession = {
            ClientSessionID: newSessionID,
            ClientID: clientId,
            ClientSessionDate: clientSessionDate
        };

        await mongoSvc.addToCollection('ClientSessions', newSession);
        context.res = {
            status: 200,
            body: { clientId, newClientSession: clientSessionDate }
        };
        
    } catch (err) {
        context.res = {
            status: 500,
            body: err
        };
    } finally {
        if (!!mongoSvc) {
            mongoSvc.disconnect();
        }
        context.done();
    }
};

export default httpTrigger;
