import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let mongoSvc: MongoService;
    try {
        mongoSvc = new MongoService();
        const { clientId, clientSessionId } = req.body.sessionToDelete;
        const deleteClause = {
            ClientSessionID: clientSessionId
        };
        await mongoSvc.deleteItemFromCollection('ClientSessions', deleteClause);
        context.res = {
            status: 200,
            body: { clientId: clientId, clientSessionId: clientSessionId }
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
