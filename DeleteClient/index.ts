import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let mongoSvc: MongoService = null;

    try {
        mongoSvc = new MongoService();
        const id: number = context.req.body.clientId;
        const deleteClause = {
            ClientID: id
        };

        await mongoSvc.deleteItemFromCollection('Clients', deleteClause);
        context.res = {
            status: 200,
            body: { ClientID: id }
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
