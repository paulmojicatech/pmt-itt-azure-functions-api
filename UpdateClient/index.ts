import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let mongoSvc: MongoService = null;
    const { updatedClient } = req.body;
    try {
        mongoSvc = new MongoService();
        const where = { ClientID: updatedClient.ClientID };
        const updatedCollection = await mongoSvc.updateCollection('Clients', where, updatedClient);
        if (!!updatedCollection) {
            
            context.res = {
                status: 200,
                body: updatedCollection
            };
            
        } else {
            context.res = {
                status: 500,
                body: 'Error updating client'
            };
        }
    } catch (err) {
        context.res = {
            status: 500,
            body: err
        };
    } finally {
        mongoSvc.disconnect();
        context.done();
    }
};

export default httpTrigger;
