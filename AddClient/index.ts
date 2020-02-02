import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let newClient = req.body.newClient;
    let mongoSvc: MongoService = null;
    try {
        mongoSvc = new MongoService();
        const lastClient = await mongoSvc.getlastDocumentInCollection('Clients', {}, { ClientID: -1});
        const clientId = lastClient ? lastClient.ClientID + 1 : 1;
        newClient = {...newClient, ClientID: clientId};
        await mongoSvc.addToCollection('Clients', newClient);
        context.res = {
            status: 200,
            body: newClient
        };
        
    } catch (ex) {
        context.res = {
            status: 500,
            body: ex
        };
    } finally {
        mongoSvc.disconnect();
        context.done();
    }

};

export default httpTrigger;
