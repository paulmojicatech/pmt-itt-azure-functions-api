import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let mongoSvc: MongoService;
    try {
        mongoSvc = new MongoService();
        const deleteClause = {
            ClientSessionID: +req.body.clientSessionId
        };
        await mongoSvc.deleteItemFromCollection('ClientSessions', deleteClause);
        context.res = {
            status: 200,
            body: { clientId: +req.body.clientId, clientSessionId: +req.body.clientSessionId }
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
