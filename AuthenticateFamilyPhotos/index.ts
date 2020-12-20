import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { env } from "process";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const { user, password } = req.body;
    const isAuthenticated = user === process.env['FAMILY_PHOTO_USER'] && password === process.env['FAMILY_PHOTO_PWD'];
    if (isAuthenticated) {
        context.res = {
            status: 200
        };
    } else {
        context.res = {
            status: 401
        };
    }

};

export default httpTrigger;