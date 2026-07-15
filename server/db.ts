import fs from 'fs';
import path from 'path';

// Define the interface structures
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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
  size: string; // "1-10", "11-50", "51-200", "201-500", "500+"
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
  // AI fields
  score: number; // 0-100
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
    callDuration: number; // in seconds
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
  probability: number; // 0 to 100
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
  duration: number; // in minutes
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
  type: string; // e.g., "lead_create", "email_sent", "meeting_scheduled", "opportunity_won", "task_completed"
  description: string;
  customerId?: string;
  leadId?: string;
  opportunityId?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sku: string;
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

export interface CompetitorAnalysis {
  competitorName: string;
  strengths: string;
  weaknesses: string;
  pricing: string;
  comparison: string;
  salesStrategy: string;
  analyzedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  leads: Lead[];
  opportunities: Opportunity[];
  tasks: Task[];
  meetings: Meeting[];
  emails: Email[];
  activities: Activity[];
  products: Product[];
  invoices: Invoice[];
  notifications: Notification[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sales_crm.json');

class SalesCRMDatabase {
  private db: DatabaseSchema = {
    users: [],
    customers: [],
    leads: [],
    opportunities: [],
    tasks: [],
    meetings: [],
    emails: [],
    activities: [],
    products: [],
    invoices: [],
    notifications: []
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.db = JSON.parse(raw);
        // Ensure all arrays are initialized
        this.db.users = this.db.users || [];
        this.db.customers = this.db.customers || [];
        this.db.leads = this.db.leads || [];
        this.db.opportunities = this.db.opportunities || [];
        this.db.tasks = this.db.tasks || [];
        this.db.meetings = this.db.meetings || [];
        this.db.emails = this.db.emails || [];
        this.db.activities = this.db.activities || [];
        this.db.products = this.db.products || [];
        this.db.invoices = this.db.invoices || [];
        this.db.notifications = this.db.notifications || [];
      } catch (err) {
        console.error('Failed to read database file, seeding defaults:', err);
        this.seedDefaults();
      }
    } else {
      this.seedDefaults();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  private seedDefaults() {
    // Generate simple bcrypt password hash placeholder for 'password123'
    // To keep startup instantaneous, we use pre-hashed strings for the seeded accounts.
    // Hash for 'admin123' is '$2a$10$tZ27f1AisE8F.hKkQZ8NQuX4.LzM0N8Mv8h9vW2ZAnfepgYIorS86'
    const adminHash = '$2a$10$tZ27f1AisE8F.hKkQZ8NQuX4.LzM0N8Mv8h9vW2ZAnfepgYIorS86'; // "admin123"

    const seedUsers: User[] = [
      {
        id: 'u-1',
        name: 'Sarah Jenkins',
        email: 'nanipadhula@gmail.com', // Seed for user's profile
        passwordHash: adminHash,
        role: 'Admin',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        createdAt: new Date().toISOString()
      },
      {
        id: 'u-2',
        name: 'Michael Chang',
        email: 'michael.chang@salesgenie.ai',
        passwordHash: adminHash,
        role: 'Sales Manager',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        createdAt: new Date().toISOString()
      },
      {
        id: 'u-3',
        name: 'Jessica Vance',
        email: 'jessica.v@salesgenie.ai',
        passwordHash: adminHash,
        role: 'Sales Executive',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        createdAt: new Date().toISOString()
      }
    ];

    const seedProducts: Product[] = [
      { id: 'p-1', name: 'Enterprise Cloud CRM Suite', description: 'Complete omni-channel customer pipeline package.', price: 12000, category: 'Software', sku: 'SaaS-CRM-ENT' },
      { id: 'p-2', name: 'AI Sales Copilot Add-on', description: 'Intelligent scoring and automated email drafting engine.', price: 2400, category: 'Software', sku: 'SaaS-AI-COP' },
      { id: 'p-3', name: 'API Integration Bridge', description: 'Universal synchronization middleware with legacy databases.', price: 4500, category: 'Software', sku: 'SaaS-API-BRG' },
      { id: 'p-4', name: 'Premium Dedicated Support', description: '24/7 priority support and custom onboarding workflow design.', price: 6000, category: 'Services', sku: 'SRV-SUP-PRM' }
    ];

    const seedCustomers: Customer[] = [
      {
        id: 'c-1',
        name: 'Robert Stark',
        email: 'robert@starkindustries.com',
        phone: '+1-212-555-0199',
        company: 'Stark Industries',
        industry: 'Aerospace & Defense',
        size: '500+',
        budget: 150000,
        country: 'United States',
        source: 'Inbound Request',
        status: 'Active',
        ownerId: 'u-1',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        purchaseHistory: [
          { id: 'pur-1', date: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(), amount: 18000, items: 'Enterprise Cloud CRM Suite x1, Premium Support x1' }
        ]
      },
      {
        id: 'c-2',
        name: 'Elena Rostova',
        email: 'elena@novatech.io',
        phone: '+44-20-7946-0158',
        company: 'NovaTech Solutions',
        industry: 'FinTech',
        size: '201-500',
        budget: 95000,
        country: 'United Kingdom',
        source: 'LinkedIn Outbound',
        status: 'Active',
        ownerId: 'u-3',
        createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
        purchaseHistory: [
          { id: 'pur-2', date: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString(), amount: 12000, items: 'Enterprise Cloud CRM Suite x1' },
          { id: 'pur-3', date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), amount: 2400, items: 'AI Sales Copilot Add-on x1' }
        ]
      },
      {
        id: 'c-3',
        name: 'Marcus Vance',
        email: 'm.vance@vanguardlogistics.com',
        phone: '+1-312-555-0144',
        company: 'Vanguard Logistics',
        industry: 'Transportation',
        size: '500+',
        budget: 70000,
        country: 'United States',
        source: 'Webinar Attendee',
        status: 'Active',
        ownerId: 'u-1',
        createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
        purchaseHistory: []
      },
      {
        id: 'c-4',
        name: 'Kenji Tanaka',
        email: 'tanaka@cyber-grid.jp',
        phone: '+81-3-5555-0122',
        company: 'CyberGrid Japan',
        industry: 'Cybersecurity',
        size: '51-200',
        budget: 45000,
        country: 'Japan',
        source: 'Google Search',
        status: 'Inactive',
        ownerId: 'u-2',
        createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
        purchaseHistory: []
      }
    ];

    const seedLeads: Lead[] = [
      {
        id: 'l-1',
        name: 'Diana Prince',
        email: 'diana@themyscira.org',
        phone: '+1-202-555-0188',
        company: 'Themyscira Cultural Corp',
        industry: 'Education & Non-Profit',
        size: '11-50',
        budget: 35000,
        jobTitle: 'Executive Director',
        source: 'Webinar Attendee',
        status: 'Contacted',
        priority: 'High',
        tags: ['non-profit', 'education', 'interested'],
        notes: 'Highly engaged during our SaaS webinar. Expressed immediate pain points in managing regional donor relationships and keeping track of multi-year campaign proposals.',
        ownerId: 'u-3',
        score: 88,
        scoreExplanation: 'High score assigned due to high engagement (5 email opens, 12 website visits) and matching job title (Executive Director). The budget ($35k) fits perfectly with our standard cloud suite.',
        buyingIntent: 'High',
        painPoints: 'Struggling to synchronize external donor databases and track interaction historical records among regional chapters.',
        urgency: 'Hot',
        budgetLevel: 'Medium',
        recommendation: 'Send a targeted email offering a custom CRM sandbox for non-profit operations.',
        nextAction: 'Schedule a discovery session focusing on donor tracking features.',
        createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        engagement: { emailOpens: 5, websiteVisits: 12, callDuration: 420 }
      },
      {
        id: 'l-2',
        name: 'Victor Stone',
        email: 'v.stone@cyberdyne-cyber.com',
        phone: '+1-512-555-0177',
        company: 'Cyberdyne Advanced Labs',
        industry: 'Healthcare & Biotech',
        size: '201-500',
        budget: 180000,
        jobTitle: 'VP of Operations',
        source: 'Inbound Request',
        status: 'New',
        priority: 'Urgent',
        tags: ['enterprise', 'high-budget', 'fast-track'],
        notes: 'Submitted an inbound inquiry requesting deep API integration capabilities. Requires strict security standards (SOC 2, GDPR) as they operate in healthcare intelligence.',
        ownerId: 'u-1',
        score: 95,
        scoreExplanation: 'Excellent candidate with high purchasing power ($180,000 budget), enterprise scale, and direct VP title. Inbound intent signifies high urgency.',
        buyingIntent: 'Very High',
        painPoints: 'Current pipeline CRM lacks advanced enterprise API hooks and cannot handle massive concurrent lead syncs securely.',
        urgency: 'Very Hot',
        budgetLevel: 'Enterprise',
        recommendation: 'Arrange an executive meeting with the CTO and provide SOC 2 certification documentations.',
        nextAction: 'Create proposal covering custom SLA, API integration details, and Dedicated Support Add-on.',
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        engagement: { emailOpens: 3, websiteVisits: 8, callDuration: 180 }
      },
      {
        id: 'l-3',
        name: 'Arthur Curry',
        email: 'arthur@atlantis-aquafarm.com',
        phone: '+1-207-555-0111',
        company: 'Atlantis Aquaculture',
        industry: 'Agriculture & Fishing',
        size: '51-200',
        budget: 12000,
        jobTitle: 'General Manager',
        source: 'Cold Call',
        status: 'New',
        priority: 'Low',
        tags: ['small-business', 'low-priority'],
        notes: 'Cold outbound lead. Showed minimal interest initially but acknowledged issues with legacy Excel spreadsheet pipelines.',
        ownerId: 'u-3',
        score: 35,
        scoreExplanation: 'Cold score due to small budget ($12,000), traditional industry, and minimal outbound engagement (1 email open, 1 website visit).',
        buyingIntent: 'Low',
        painPoints: 'No centralized system for field agents; tracking distribution contracts manually using static desktop sheets.',
        urgency: 'Cold',
        budgetLevel: 'Low',
        recommendation: 'Enroll in automated nursery nurturing email sequence for small operations.',
        nextAction: 'Send general introductory material on CRM ROI.',
        createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
        engagement: { emailOpens: 1, websiteVisits: 1, callDuration: 45 }
      }
    ];

    const seedOpportunities: Opportunity[] = [
      {
        id: 'o-1',
        leadId: 'l-1',
        name: 'Themyscira CRM Implementation',
        company: 'Themyscira Cultural Corp',
        stage: 'Proposal',
        revenue: 35000,
        expectedClosingDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
        probability: 65,
        riskLevel: 'Low',
        predictedStrategy: 'Focus on demonstrating donor data export compliance and multi-year tracking reports to secure alignment with their board.',
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'o-2',
        leadId: 'l-2',
        name: 'Cyberdyne Enterprise Architecture Rollout',
        company: 'Cyberdyne Advanced Labs',
        stage: 'Negotiation',
        revenue: 180000,
        expectedClosingDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
        probability: 85,
        riskLevel: 'Medium',
        predictedStrategy: 'Fast-track legal reviews of the SLA, provide detailed enterprise deployment architecture, and offer a 5% multi-year discount if contract signed before month-end.',
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'o-3',
        customerId: 'c-3',
        name: 'Vanguard Add-on Suite License Expansion',
        company: 'Vanguard Logistics',
        stage: 'Discovery',
        revenue: 14400,
        expectedClosingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        probability: 30,
        riskLevel: 'High',
        predictedStrategy: 'Address their operational bottlenecks. Highlight how the AI Copilot saves 10 hours per week per executive, directly impacting dispatch turnaround times.',
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      }
    ];

    const seedTasks: Task[] = [
      { id: 't-1', title: 'Call Diana Prince', description: 'Follow up on non-profit proposal and schedule tech demo.', dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString().split('T')[0], status: 'Pending', priority: 'High', type: 'Call', ownerId: 'u-1', createdAt: new Date().toISOString() },
      { id: 't-2', title: 'Draft SLA for Cyberdyne Advanced Labs', description: 'Collaborate with legal department to outline custom SLA standards.', dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0], status: 'Pending', priority: 'High', type: 'Email', ownerId: 'u-1', createdAt: new Date().toISOString() },
      { id: 't-3', title: 'Prepare onboarding outline for NovaTech Solutions', description: 'Organize training slide deck and timeline for team onboarding.', dueDate: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0], status: 'Completed', priority: 'Medium', type: 'Follow-up', ownerId: 'u-3', createdAt: new Date().toISOString() },
      { id: 't-4', title: 'Cold follow-up with Atlantis Aquaculture', description: 'Email Arthur Curry with case studies of local food suppliers utilizing our suite.', dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0], status: 'Pending', priority: 'Low', type: 'Email', ownerId: 'u-3', createdAt: new Date().toISOString() }
    ];

    const seedMeetings: Meeting[] = [
      {
        id: 'm-1',
        title: 'Cyberdyne Technical Architecture Call',
        description: 'Discuss custom API endpoints, security, and cloud deployment plans.',
        date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        duration: 45,
        attendees: ['Sarah Jenkins (Admin)', 'Victor Stone (Cyberdyne Advance Labs VP)', 'Silas Stone (Chief Architect)'],
        summary: 'The client is highly interested. They have immediate scaling limits with their legacy platform and want a complete SOC 2 report. Their architect Silas had specific concerns on database replication and payload overhead.',
        mood: 'Extremely Enthusiastic & Cooperative',
        interestLevel: 'Very High',
        actionItems: ['Provide security SOC 2 documentations', 'Draft a proof-of-concept payload schema for their custom endpoints'],
        followUpTasks: ['Legal review of SLA details', 'Send meeting recap email with dynamic credentials link'],
        agenda: 'API Security Standards, Custom Connectors, and Multi-region availability',
        talkingPoints: ['Highlight end-to-end encryption in transit and rest', 'Show dynamic JSON serialization middleware', 'Confirm service-level uptime standards'],
        questions: ['What is your target integration timeline?', 'Do you have custom data warehouses like Snowflake to synchronize?'],
        risks: ['Strict data-residency compliance in EU may complicate replication models.'],
        suggestedOffer: 'Premium Enterprise Package including SOC 2 Audit compliance templates and dedicated solution architect.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'm-2',
        title: 'Themyscira Cultural Corp Demo Session',
        description: 'Walkthrough of customer pipelines and automated messaging systems.',
        date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
        duration: 30,
        attendees: ['Jessica Vance (Sales Executive)', 'Diana Prince (Themyscira Cultural Corp)'],
        agenda: 'Pipeline tracking, bulk email campaigns, and custom lead fields.',
        talkingPoints: ['Demonstrate drag-and-drop opportunity boards', 'Highlight visual custom fields for donor tiers', 'Showcase automated reminder triggers'],
        questions: ['How many volunteers require simultaneous pipeline access?', 'What is your current donor contact count?'],
        risks: ['Budget constraint if board refuses the multi-year support add-on.'],
        suggestedOffer: 'Software Cloud Suite with custom volunteer training discount.',
        createdAt: new Date().toISOString()
      }
    ];

    const seedEmails: Email[] = [
      {
        id: 'e-1',
        senderId: 'u-1',
        recipient: 'v.stone@cyberdyne-cyber.com',
        subject: 'RE: Technical Architecture Recap - SalesgenieAI Integration',
        body: `Dear Victor,\n\nThank you for the fantastic discussion yesterday during our Technical Architecture Call. I have compiled the SOC 2 documentation along with our encryption standards as discussed.\n\nOur team is fully prepared to guarantee 99.99% uptime and handle your high-budget security constraints. We can arrange a quick follow-up meeting this Thursday to finalize our customized proposal.\n\nWarm regards,\nSarah Jenkins\nSenior AI Sales Architect, SalesgenieAI`,
        type: 'Proposal',
        status: 'Sent',
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'e-2',
        senderId: 'u-3',
        recipient: 'diana@themyscira.org',
        subject: 'Personalized Donor CRM Demonstration - SalesgenieAI',
        body: `Dear Diana,\n\nFollowing our brief conversation on LinkedIn, I would love to show you how SalesgenieAI can help you easily synchronize and track multi-year campaigns for your regional non-profit chapters.\n\nI have scheduled a dedicated 30-minute workspace demo for tomorrow morning to show you our visual donor pipeline first-hand.\n\nBest regards,\nJessica Vance\nSales Executive, SalesgenieAI`,
        type: 'Personalized',
        status: 'Sent',
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      }
    ];

    const seedInvoices: Invoice[] = [
      { id: 'i-1', customerId: 'c-1', customerName: 'Stark Industries', invoiceNumber: 'INV-2026-001', amount: 18000, status: 'Paid', issueDate: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString().split('T')[0], dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0] },
      { id: 'i-2', customerId: 'c-2', customerName: 'NovaTech Solutions', invoiceNumber: 'INV-2026-002', amount: 14400, status: 'Paid', issueDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0], dueDate: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString().split('T')[0] },
      { id: 'i-3', customerId: 'c-3', customerName: 'Vanguard Logistics', invoiceNumber: 'INV-2026-003', amount: 5000, status: 'Unpaid', issueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0], dueDate: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString().split('T')[0] }
    ];

    const seedActivities: Activity[] = [
      { id: 'act-1', type: 'lead_create', description: 'New lead "Victor Stone" from "Cyberdyne Advanced Labs" created.', leadId: 'l-2', userId: 'u-1', userName: 'Sarah Jenkins', createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
      { id: 'act-2', type: 'meeting_scheduled', description: 'Technical Architecture Call with Silas & Victor scheduled.', leadId: 'l-2', userId: 'u-1', userName: 'Sarah Jenkins', createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
      { id: 'act-3', type: 'email_sent', description: 'Follow-up proposal email sent to v.stone@cyberdyne-cyber.com', leadId: 'l-2', userId: 'u-1', userName: 'Sarah Jenkins', createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
      { id: 'act-4', type: 'lead_create', description: 'New lead "Diana Prince" created from Webinar Attendee.', leadId: 'l-1', userId: 'u-3', userName: 'Jessica Vance', createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() }
    ];

    const seedNotifications: Notification[] = [
      { id: 'n-1', userId: 'u-1', title: 'Urgent Task Due', message: 'You have high-priority task: "Call Diana Prince" due tomorrow.', read: false, type: 'Task', createdAt: new Date().toISOString() },
      { id: 'n-2', userId: 'u-1', title: 'High Intent Lead Created', message: 'Victor Stone scored 95/100 and has been assigned to you.', read: false, type: 'Lead', createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
      { id: 'n-3', userId: 'u-3', title: 'Upcoming Meeting Tomorrow', message: 'Themyscira Cultural Corp Walkthrough with Diana Prince is scheduled for 10:00 AM.', read: false, type: 'Meeting', createdAt: new Date().toISOString() }
    ];

    this.db = {
      users: seedUsers,
      customers: seedCustomers,
      leads: seedLeads,
      opportunities: seedOpportunities,
      tasks: seedTasks,
      meetings: seedMeetings,
      emails: seedEmails,
      activities: seedActivities,
      products: seedProducts,
      invoices: seedInvoices,
      notifications: seedNotifications
    };

    this.save();
    console.log('CRM Database initialized with default records!');
  }

  // Database helper actions
  public getUsers(): User[] { return this.db.users; }
  public addUser(user: User) { this.db.users.push(user); this.save(); }
  public updateUser(id: string, updates: Partial<User>) {
    const user = this.db.users.find(u => u.id === id);
    if (user) { Object.assign(user, updates); this.save(); }
  }

  public getCustomers(): Customer[] { return this.db.customers; }
  public addCustomer(cust: Customer) { this.db.customers.push(cust); this.addActivity('customer_create', `Customer ${cust.name} added.`, cust.id, undefined, undefined, cust.ownerId); this.save(); }
  public updateCustomer(id: string, updates: Partial<Customer>) {
    const cust = this.db.customers.find(c => c.id === id);
    if (cust) { Object.assign(cust, updates); this.save(); }
  }
  public deleteCustomer(id: string) {
    this.db.customers = this.db.customers.filter(c => c.id !== id);
    this.save();
  }

  public getLeads(): Lead[] { return this.db.leads; }
  public addLead(lead: Lead) { this.db.leads.push(lead); this.addActivity('lead_create', `Lead ${lead.name} (${lead.company}) created.`, undefined, lead.id, undefined, lead.ownerId); this.save(); }
  public updateLead(id: string, updates: Partial<Lead>) {
    const lead = this.db.leads.find(l => l.id === id);
    if (lead) { Object.assign(lead, updates); this.save(); }
  }
  public deleteLead(id: string) {
    this.db.leads = this.db.leads.filter(l => l.id !== id);
    this.save();
  }

  public getOpportunities(): Opportunity[] { return this.db.opportunities; }
  public addOpportunity(opp: Opportunity) { this.db.opportunities.push(opp); this.save(); }
  public updateOpportunity(id: string, updates: Partial<Opportunity>) {
    const opp = this.db.opportunities.find(o => o.id === id);
    if (opp) { Object.assign(opp, updates); this.save(); }
  }
  public deleteOpportunity(id: string) {
    this.db.opportunities = this.db.opportunities.filter(o => o.id !== id);
    this.save();
  }

  public getTasks(): Task[] { return this.db.tasks; }
  public addTask(task: Task) { this.db.tasks.push(task); this.save(); }
  public updateTask(id: string, updates: Partial<Task>) {
    const t = this.db.tasks.find(x => x.id === id);
    if (t) { Object.assign(t, updates); this.save(); }
  }
  public deleteTask(id: string) {
    this.db.tasks = this.db.tasks.filter(t => t.id !== id);
    this.save();
  }

  public getMeetings(): Meeting[] { return this.db.meetings; }
  public addMeeting(meeting: Meeting) { this.db.meetings.push(meeting); this.save(); }
  public updateMeeting(id: string, updates: Partial<Meeting>) {
    const m = this.db.meetings.find(x => x.id === id);
    if (m) { Object.assign(m, updates); this.save(); }
  }
  public deleteMeeting(id: string) {
    this.db.meetings = this.db.meetings.filter(m => m.id !== id);
    this.save();
  }

  public getEmails(): Email[] { return this.db.emails; }
  public addEmail(email: Email) { this.db.emails.push(email); this.save(); }

  public getProducts(): Product[] { return this.db.products; }
  public getInvoices(): Invoice[] { return this.db.invoices; }
  public addInvoice(inv: Invoice) { this.db.invoices.push(inv); this.save(); }

  public getActivities(): Activity[] { return this.db.activities; }
  public addActivity(type: string, description: string, customerId?: string, leadId?: string, opportunityId?: string, userId: string = 'u-1') {
    const user = this.db.users.find(u => u.id === userId) || { name: 'System' };
    const act: Activity = {
      id: 'act-' + Math.random().toString(36).substring(2, 9),
      type,
      description,
      customerId,
      leadId,
      opportunityId,
      userId,
      userName: user.name,
      createdAt: new Date().toISOString()
    };
    this.db.activities.unshift(act);
    this.save();
  }

  public getNotifications(userId: string): Notification[] {
    return this.db.notifications.filter(n => n.userId === userId);
  }
  public addNotification(noti: Notification) { this.db.notifications.unshift(noti); this.save(); }
  public markNotificationAsRead(id: string) {
    const n = this.db.notifications.find(x => x.id === id);
    if (n) { n.read = true; this.save(); }
  }

  public clearAll() {
    this.seedDefaults();
  }
}

export const db = new SalesCRMDatabase();
