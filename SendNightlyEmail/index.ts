import { AzureFunction, Context } from "@azure/functions"
import { MongoService } from "../shared/services/mongo.service";
import { chain, map, filter } from 'lodash';

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    var timeStamp = new Date().toISOString();
    let mongoSvc: MongoService;
    try {
        mongoSvc = new MongoService();
        if (myTimer.IsPastDue) {
            const sessionWhere = {
                $and: [
                    {
                        ClientSessionDate: { $gte: "2019-12-01" }
                    },
                    {
                        ClientSessionDate: { $gte: "2020-01-01" }
                    },
                    {
                        ClientID: 2
                    }
                ]
            };

            // const clientSessions = await mongoSvc.getCollection('ClientSessions', sessionWhere);
            // const clientWhere = {
            //     $or: [
            //         {
            //             ClientEmail: { $nin: [null, ""]}
            //         },
            //         {
            //             ClientSecondaryEmail: { $nin: [null, ""]}
            //         }
            //     ]
            // };
            // const clients = await mongoSvc.getCollection('Clients', clientWhere);
            // const emailsToSend = chain(clientSessions)
            //                         .filter(item => item.)
        }
        context.res = {
            status: 200, 
            body: 'Emails sent'
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

export default timerTrigger;
