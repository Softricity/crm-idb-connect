export type Lead = {
    id: string;
    serial: string;
    date: string;
    time: string;
    name: string;
    phone: string;
    branch: string;
    leadManager: string;
    leadSource: 'QR' | 'Web' | 'Referral';
    country: 'Finland' | 'Europe' | 'Spain';
    status: 'New' | 'Contacted' | 'Lead In Process' | 'Assigned' | 'Cold' | 'Rejected';
    starred: boolean;
};


