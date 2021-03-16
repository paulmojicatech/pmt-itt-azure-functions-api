import { AzureFunction, Context } from "@azure/functions";
import { MongoService } from "../shared/services/mongo.service";
import { chain, map, filter } from "lodash";
import { EmailService } from "../shared/services/email.service";

const getFormattedDateString = (
  dayIndex: number,
  monthIndex: number,
  date: number,
  hour: number,
  minute: number
): string => {
  let dow;
  switch (dayIndex) {
    case 0:
      dow = "Sunday";
      break;
    case 1:
      dow = "Monday";
      break;
    case 2:
      dow = "Tuesday";
      break;
    case 3:
      dow = "Wednesday";
      break;
    case 4:
      dow = "Thursday";
      break;
    case 5:
      dow = "Friday";
      break;
    case 6:
      dow = "Saturday";
  }

  let monthString;
  switch (monthIndex) {
    case 0:
      monthString = "January";
      break;
    case 1:
      monthString = "February";
      break;
    case 2:
      monthString = "March";
      break;
    case 3:
      monthString = "April";
      break;
    case 4:
      monthString = "May";
      break;
    case 5:
      monthString = "June";
      break;
    case 6:
      monthString = "July";
      break;
    case 7:
      monthString = "August";
      break;
    case 8:
      monthString = "September";
      break;
    case 9:
      monthString = "October";
      break;
    case 10:
      monthString = "November";
      break;
    case 11:
      monthString = "December";
      break;
  }

  const hourString = hour > 12 ? `${hour - 12}` : `${hour}`;
  const minuteString =
    minute < 10 ? `0${minute}` : minute > 58 ? `00` : `${minute}`;
  const ampm = hour > 11 ? "PM" : "AM";

  return `${dow} ${monthString} ${date} at ${hourString}:${minuteString} ${ampm}`;
};

const getEmailBody = (clientName: string, sessionTime: string) => {
  return `Hi ${clientName},
  
  This is a reminder that you have an upcoming TeleHealth appointment with Kirstin R. Abraham, LCSW scheduled for ${sessionTime}. You may attend your session by clicking on the following link: https://sessions.psychologytoday.com/kirstinabraham . As always, if you prefer to call instead of using video you can do so by calling (704) 233-7594 at our scheduled session time. Please feel free to make any payment due prior to your appointment on my website at: www.marvintherapy.com under the tab called “make a payment”. I look forward to hearing from you during our scheduled session.
  
  Warmly,
  Kirstin R. Abraham, LCSW
      `;
};

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  let mongoSvc: MongoService;
  let emailSvc: EmailService;
  try {
    mongoSvc = new MongoService();
    emailSvc = new EmailService();

    const clientsWhere = {
      $and: [
        {
          ClientEmail: {
            $not: {
              $type: 10, // null type
            },
            $ne: "", // empty strings
          },
        },
      ],
    };

    const allClientsWithEmails = await mongoSvc.getCollection(
      "Clients",
      clientsWhere
    );
    const now = new Date().getTime();
    const startDate = new Date(now + 24 * 60 * 60 * 1000);
    const endDate = new Date(now + 2 * 24 * 60 * 60 * 1000);
    const clientSessionsWhere = {
      $and: [
        {
          ClientSessionDate: { $gte: startDate },
        },
        {
          ClientSessionDate: { $lte: endDate },
        },
      ],
    };
    const clientSessions = await mongoSvc.getCollection(
      "ClientSessions",
      clientSessionsWhere
    );
    let clientsToSendTo = [];
    clientSessions.forEach((session) => {
      const found = allClientsWithEmails.find(
        (client) => client.ClientID === session.ClientID
      );
      if (!!found) {
        const sessionTime = new Date(session.ClientSessionDate);
        const utc = new Date(
          Date.UTC(
            sessionTime.getFullYear(),
            sessionTime.getMonth(),
            sessionTime.getDate(),
            sessionTime.getHours(),
            sessionTime.getMinutes()
          )
        );

        const offset = process?.env?.PLATFORM === 'Azure' ?
            utc.getHours() - 4 :
            utc.getHours() + 4;
        const timeZoneDate = new Date(utc.setHours(offset)); 
        const hour = timeZoneDate.getHours();
        
        const minute = utc.getMinutes() === 29 ?
          30 ?
          59 : 
          0 : 
          utc.getMinutes();
        const day = utc.getDay();
        const month = utc.getMonth();
        const date = utc.getDate();
        const formattedTime = `${getFormattedDateString(
          day,
          month,
          date,
          hour,
          minute
        )}`;

        clientsToSendTo = [
          ...clientsToSendTo,
          {
            ClientName: found.ClientName,
            ClientEmail: found.ClientEmail,
            SessionTime: formattedTime,
          },
        ];
      }
    });
    if (!!clientsToSendTo?.length) {
      clientsToSendTo.forEach(async (client) => {
        await emailSvc.sendEmail(
          [client.ClientEmail],
          "Appointment Reminder",
          getEmailBody(client.ClientName, client.SessionTime)
        );
      });

      const confirmMessage = `${getEmailBody(
        clientsToSendTo[0].ClientName,
        clientsToSendTo[0].SessionTime
      )}
            
      ${JSON.stringify(clientsToSendTo)}`;

      await emailSvc.sendEmail(
        [`${process.env.ADMIN_EMAIL}`],
        "Upcoming Appointment Reminder",
        confirmMessage
      );

      context.res = {
        status: 200,
        body: "Emails sent",
      };
    } else {
      context.res = {
        status: 200,
        body: "No Clients scheduled",
      };
    }
  } catch (ex) {
    context.res = {
      status: 500,
      body: ex,
    };
  } finally {
    if (!!mongoSvc) {
      mongoSvc.disconnect();
    }
    context.done();
  }

};

export default timerTrigger;
