export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Sales Manager' | 'Sales Executive';
  avatar?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  size: string;
  budget: number;
  country: string;
  source: string;
  status: 'Active' | 'Inactive' | 'Churned';
  ownerId: string;
  createdAt: string;
  purchaseHistory?: Array<{ id: string; date: string; amount: number; items: string }>;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: string;
  size: string;
  budget: number;
  jobTitle: string;
  source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  tags: string[];
  notes: string;
  ownerId: string;
  score: number;
  scoreExplanation: string;
  buyingIntent: 'Low' | 'Medium' | 'High' | 'Very High';
  painPoints: string;
  urgency: 'Cold' | 'Warm' | 'Hot' | 'Very Hot';
  budgetLevel: 'Low' | 'Medium' | 'High' | 'Enterprise';
  recommendation: string;
  nextAction: string;
  createdAt: string;
  engagement: {
    emailOpens: number;
    websiteVisits: number;
    callDuration: number;
  };
}

export interface Opportunity {
  id: string;
  leadId?: string;
  customerId?: string;
  name: string;
  company: string;
  stage: 'Discovery' | 'Proposal' | 'Negotiation' | 'Contracting' | 'Closed Won' | 'Closed Lost';
  revenue: number;
  expectedClosingDate: string;
  probability: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  predictedStrategy: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'Pending' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  type: 'Call' | 'Email' | 'Meeting' | 'Follow-up';
  ownerId: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: number;
  attendees: string[];
  summary?: string;
  mood?: string;
  interestLevel?: string;
  actionItems?: string[];
  followUpTasks?: string[];
  agenda?: string;
  talkingPoints?: string[];
  questions?: string[];
  risks?: string[];
  suggestedOffer?: string;
  createdAt: string;
}

export interface Email {
  id: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  type: 'Cold' | 'Follow-up' | 'Proposal' | 'Reminder' | 'Thank You' | 'Meeting Request' | 'Personalized';
  status: 'Sent' | 'Draft';
  createdAt: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  customerId?: string;
  leadId?: string;
  opportunityId?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  issueDate: string;
  dueDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'Meeting' | 'Task' | 'Lead' | 'Deal' | 'System';
  createdAt: string;
}
