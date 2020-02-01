import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { MongoService } from '../shared/services/mongo.service';
import { Client, ClientSession } from '../shared/models/clients.interface';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<Client[]> {

    try {
        const mongoSvc = new MongoService();
        const clients: Client[] = await mongoSvc.getCollection('Clients');
        const clientSessions: ClientSession[] = await mongoSvc.getCollection('ClientSessions');
        const clientsWithSessions = clients.map(client => {
            const currentClientSessions = clientSessions.filter(session => client.ClientID === session.ClientID);
            return { ...client, ClientSessions: currentClientSessions };
        });
        return Promise.resolve(clientsWithSessions);
    } catch (ex) {
        return Promise.reject(ex);
    } finally {
        this._dataSvc.disconnect();
    }
};

export default httpTrigger;
