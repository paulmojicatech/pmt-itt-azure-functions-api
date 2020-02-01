export interface Client {
    ClientName: string;
    ClientSSN: string;
    ClientDoB: string;
    ClientAddress: string;
    ClientCity: string;
    ClientState: string;
    ClientZip: string;
    ClientEmail: string;
    ClientID: number;
    ClientPhone: string;
    ClientSecondaryEmail: string;
    ClientSecondaryPhone: string;
    ClientSessions: ClientSession[];
    
}

export interface ClientSession {
    ClientSessionID: number;
    ClientID: number;
    ClientSessionDate: Date;
}