import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    let mongo: MongoService;
    try {
        mongo = new MongoService();
        const insurances = await mongo.getCollection('Insurances');
        context.res = {
            status: 200,
            body: insurances
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: err
        };

    } finally {
        if (!!mongo) {
            mongo.disconnect();
        }
        context.done();
    }

};

export default httpTrigger;