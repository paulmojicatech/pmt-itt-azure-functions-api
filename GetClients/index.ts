import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { MongoService } from '../shared/services/mongo.service';
import { Client, ClientSession } from '../shared/models/clients.interface';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<Client[]> {
    let mongoSvc: MongoService = null;
    try {
        mongoSvc = new MongoService();
        const clients: Client[] = await mongoSvc.getCollection('Clients');
        const clientSessions: ClientSession[] = await mongoSvc.getCollection('ClientSessions');
        const clientsWithSessions = clients.map(client => {
            const currentClientSessions = clientSessions.filter(session => client.ClientID === session.ClientID);
            return { ...client, ClientSessions: currentClientSessions };
        });
        context.res = {
            status: 200,
            body: clientsWithSessions
        };
        
    } catch (ex) {
        return Promise.reject(ex);
    } finally {
        mongoSvc.disconnect();
        context.done();
    }
};

export default httpTrigger;
