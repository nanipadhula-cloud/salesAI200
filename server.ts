import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

import { db, User, Customer, Lead, Opportunity, Task, Meeting, Email, Invoice, Notification, Activity } from './server/db.js';
import {
  scoreAndQualifyLead,
  generateSalesEmail,
  summarizeCallTranscript,
  forecastOpportunityClosing,
  getSalesCoachTips,
  analyzeCompetitorIntel,
  prepareMeetingAgenda,
  recommendProducts,
  generateDailyBrief,
  chatWithCRMAgent,
  generateMlTrainingMetrics,
  runMlInference
} from './server/gemini.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'salesgenie_secret_key_1029384756';

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper function for user context inside requests
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    role: 'Admin' | 'Sales Manager' | 'Sales Executive';
    name: string;
  };
}

// JWT Authentication Middleware
const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required. Please login.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
      return;
    }
    req.user = decoded as AuthenticatedRequest['user'];
    next();
  });
};

// Role Checking Middleware
const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient privileges.' });
      return;
    }
    next();
  };
};

/**
 * 1. USER AUTHENTICATION ENDPOINTS
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Name, email, password, and role are required.' });
      return;
    }

    const existingUsers = db.getUsers();
    if (existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      res.status(400).json({ error: 'A user with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: 'u-' + Math.random().toString(36).substring(2, 9),
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role as User['role'],
      createdAt: new Date().toISOString()
    };

    db.addUser(newUser);

    // Create default notification
    db.addNotification({
      id: 'n-' + Math.random().toString(36).substring(2, 9),
      userId: newUser.id,
      title: 'Welcome to SalesgenieAI!',
      message: `Account created successfully with role: ${role}. Explore your daily briefings now.`,
      read: false,
      type: 'System',
      createdAt: new Date().toISOString()
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to sign up.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to log in.' });
  }
});

app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized.' });
    return;
  }
  const users = db.getUsers();
  const user = users.find(u => u.id === req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt
    }
  });
});

app.post('/api/auth/forgot', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }
  res.json({ message: 'Password recovery email simulated successfully. In a real-world scenario, a link would be sent.' });
});

/**
 * 2. CUSTOMERS ENDPOINTS
 */
app.get('/api/customers', authenticateToken, (req, res) => {
  res.json(db.getCustomers());
});

app.post('/api/customers', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const { name, email, phone, company, industry, size, budget, country, source } = req.body;
    if (!name || !email || !company) {
      res.status(400).json({ error: 'Name, email, and company are required.' });
      return;
    }

    const newCustomer: Customer = {
      id: 'c-' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      phone: phone || '',
      company,
      industry: industry || 'Technology',
      size: size || '11-50',
      budget: Number(budget) || 10000,
      country: country || 'United States',
      source: source || 'Direct Web',
      status: 'Active',
      ownerId: req.user!.id,
      createdAt: new Date().toISOString(),
      purchaseHistory: []
    };

    db.addCustomer(newCustomer);
    res.status(201).json(newCustomer);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create customer.' });
  }
});

app.put('/api/customers/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.updateCustomer(id, req.body);
    res.json({ success: true, message: 'Customer updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', authenticateToken, requireRole(['Admin', 'Sales Manager']), (req, res) => {
  try {
    const { id } = req.params;
    db.deleteCustomer(id);
    res.json({ success: true, message: 'Customer deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. LEADS ENDPOINTS
 */
app.get('/api/leads', authenticateToken, (req, res) => {
  res.json(db.getLeads());
});

app.post('/api/leads', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const { name, email, phone, company, industry, size, budget, jobTitle, source, notes, priority, tags } = req.body;
    if (!name || !email || !company) {
      res.status(400).json({ error: 'Name, email, and company are required.' });
      return;
    }

    const newLead: Lead = {
      id: 'l-' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      phone: phone || '',
      company,
      industry: industry || 'Technology',
      size: size || '1-10',
      budget: Number(budget) || 0,
      jobTitle: jobTitle || 'Lead Contact',
      source: source || 'Web Search',
      status: 'New',
      priority: (priority as Lead['priority']) || 'Medium',
      tags: Array.isArray(tags) ? tags : [],
      notes: notes || '',
      ownerId: req.user!.id,
      score: 0,
      scoreExplanation: 'Pending AI calculation.',
      buyingIntent: 'Low',
      painPoints: 'Not qualified yet.',
      urgency: 'Cold',
      budgetLevel: 'Low',
      recommendation: 'Initialize qualification audit.',
      nextAction: 'Trigger AI Scoring or call the contact.',
      createdAt: new Date().toISOString(),
      engagement: { emailOpens: 0, websiteVisits: 1, callDuration: 0 }
    };

    db.addLead(newLead);
    res.status(201).json(newLead);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Import bulk leads
app.post('/api/leads/import', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads)) {
      res.status(400).json({ error: 'Leads must be an array of records.' });
      return;
    }

    const imported: Lead[] = [];
    for (const raw of leads) {
      if (!raw.name || !raw.email || !raw.company) continue;
      const newLead: Lead = {
        id: 'l-' + Math.random().toString(36).substring(2, 9),
        name: raw.name,
        email: raw.email,
        phone: raw.phone || '',
        company: raw.company,
        industry: raw.industry || 'Technology',
        size: raw.size || '11-50',
        budget: Number(raw.budget) || 25000,
        jobTitle: raw.jobTitle || 'Executive Contact',
        source: raw.source || 'CSV Import',
        status: 'New',
        priority: (raw.priority as Lead['priority']) || 'Medium',
        tags: Array.isArray(raw.tags) ? raw.tags : (raw.tags ? String(raw.tags).split(',').map(t => t.trim()) : []),
        notes: raw.notes || '',
        ownerId: req.user!.id,
        score: 0,
        scoreExplanation: 'Uploaded via CSV. Pending validation.',
        buyingIntent: 'Low',
        painPoints: 'Awaiting discovery call.',
        urgency: 'Cold',
        budgetLevel: 'Medium',
        recommendation: 'Run automatic pipeline screening.',
        nextAction: 'Qualify lead.',
        createdAt: new Date().toISOString(),
        engagement: { emailOpens: 0, websiteVisits: 0, callDuration: 0 }
      };
      db.addLead(newLead);
      imported.push(newLead);
    }

    res.status(201).json({ success: true, count: imported.length, leads: imported });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leads/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.updateLead(id, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/leads/:id', authenticateToken, (req, res) => {
  try {
    db.deleteLead(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4 & 5. AI LEAD SCORING & QUALIFICATION
 */
app.post('/api/leads/:id/ai-score', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const leads = db.getLeads();
    const lead = leads.find(l => l.id === id);

    if (!lead) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    // Trigger Gemini to analyze
    const analysis = await scoreAndQualifyLead(lead);

    // Update lead in DB
    db.updateLead(id, {
      score: analysis.score,
      scoreExplanation: analysis.scoreExplanation,
      buyingIntent: analysis.buyingIntent,
      painPoints: analysis.painPoints,
      urgency: analysis.urgency,
      budgetLevel: analysis.budgetLevel,
      recommendation: analysis.recommendation,
      nextAction: analysis.nextAction,
      status: 'Qualified'
    });

    db.addActivity('lead_qualified', `Lead ${lead.name} evaluated by Gemini AI. Score: ${analysis.score}/100. Urgency: ${analysis.urgency}.`, undefined, lead.id, undefined, req.body.userId);

    // Create notification if score is hot
    if (analysis.score >= 80) {
      db.addNotification({
        id: 'n-' + Math.random().toString(36).substring(2, 9),
        userId: lead.ownerId,
        title: '🔥 Hot Lead Evaluated',
        message: `${lead.name} from ${lead.company} scored ${analysis.score}/100. Buying Intent is ${analysis.buyingIntent}.`,
        read: false,
        type: 'Lead',
        createdAt: new Date().toISOString()
      });
    }

    res.json({ success: true, lead: { ...lead, ...analysis, status: 'Qualified' } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gemini calculation failed.' });
  }
});

/**
 * 9. OPPORTUNITY MANAGEMENT ENDPOINTS
 */
app.get('/api/opportunities', authenticateToken, (req, res) => {
  res.json(db.getOpportunities());
});

app.post('/api/opportunities', authenticateToken, (req, res) => {
  try {
    const { name, company, revenue, stage, expectedClosingDate, leadId, customerId } = req.body;
    if (!name || !company || !revenue || !stage) {
      res.status(400).json({ error: 'Name, company, revenue, and stage are required.' });
      return;
    }

    const defaultProbabilities = {
      'Discovery': 15,
      'Proposal': 40,
      'Negotiation': 65,
      'Contracting': 85,
      'Closed Won': 100,
      'Closed Lost': 0
    };

    const newOpp: Opportunity = {
      id: 'o-' + Math.random().toString(36).substring(2, 9),
      leadId: leadId || undefined,
      customerId: customerId || undefined,
      name,
      company,
      stage,
      revenue: Number(revenue),
      expectedClosingDate: expectedClosingDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      probability: defaultProbabilities[stage as keyof typeof defaultProbabilities] || 20,
      riskLevel: 'Medium',
      predictedStrategy: 'Awaiting AI Forecasting evaluation.',
      createdAt: new Date().toISOString()
    };

    db.addOpportunity(newOpp);

    if (stage === 'Closed Won' && customerId) {
      // Add custom purchase history item
      const cust = db.getCustomers().find(c => c.id === customerId);
      if (cust) {
        cust.purchaseHistory = cust.purchaseHistory || [];
        cust.purchaseHistory.push({
          id: 'pur-' + Math.random().toString(36).substring(2, 9),
          date: new Date().toISOString(),
          amount: Number(revenue),
          items: `${name} Implementation`
        });
        db.updateCustomer(customerId, { purchaseHistory: cust.purchaseHistory });
      }
    }

    res.status(201).json(newOpp);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/opportunities/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    db.updateOpportunity(id, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/opportunities/:id', authenticateToken, (req, res) => {
  try {
    db.deleteOpportunity(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 10. AI SALES FORECAST PREDICTION
 */
app.post('/api/opportunities/:id/ai-forecast', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const opp = db.getOpportunities().find(o => o.id === id);
    if (!opp) {
      res.status(404).json({ error: 'Opportunity not found.' });
      return;
    }

    const forecast = await forecastOpportunityClosing(opp);

    db.updateOpportunity(id, {
      probability: forecast.probability,
      riskLevel: forecast.riskLevel as 'Low' | 'Medium' | 'High',
      predictedStrategy: forecast.predictedStrategy
    });

    db.addActivity('opportunity_forecasted', `Opportunity "${opp.name}" close forecast generated by Gemini AI. Probability: ${forecast.probability}%, Risk: ${forecast.riskLevel}.`, undefined, undefined, opp.id, req.body.userId);

    res.json({ success: true, opportunity: { ...opp, ...forecast } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gemini forecast failed.' });
  }
});

/**
 * 11. SALES ANALYTICS DATA ENDPOINT
 */
app.get('/api/analytics/dashboard', authenticateToken, (req, res) => {
  const leads = db.getLeads();
  const customers = db.getCustomers();
  const opportunities = db.getOpportunities();

  // Metrics calculation
  const totalRevenue = opportunities
    .filter(o => o.stage === 'Closed Won')
    .reduce((sum, o) => sum + o.revenue, 0);

  const pipelineValue = opportunities
    .filter(o => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost')
    .reduce((sum, o) => sum + o.revenue, 0);

  const wonCount = opportunities.filter(o => o.stage === 'Closed Won').length;
  const totalDeals = opportunities.length;
  const winRate = totalDeals > 0 ? Math.round((wonCount / totalDeals) * 100) : 0;

  // Monthly Sales Chart Data (Mocking based on real dates)
  const monthlySales = [
    { name: 'Jan', sales: 45000, revenue: 38000 },
    { name: 'Feb', sales: 52000, revenue: 49000 },
    { name: 'Mar', sales: 61000, revenue: 58000 },
    { name: 'Apr', sales: 58000, revenue: 64000 },
    { name: 'May', sales: 71000, revenue: 82000 },
    { name: 'Jun', sales: 85000, revenue: 95000 },
    { name: 'Jul', sales: totalRevenue > 0 ? totalRevenue : 110000, revenue: totalRevenue > 0 ? totalRevenue * 0.95 : 102000 }
  ];

  // Lead Funnel
  const funnel = {
    new: leads.filter(l => l.status === 'New').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    qualified: leads.filter(l => l.status === 'Qualified').length,
    opportunities: opportunities.length,
    closedWon: opportunities.filter(o => o.stage === 'Closed Won').length
  };

  // Lead Sources
  const sourceMap: Record<string, number> = {};
  leads.forEach(l => {
    sourceMap[l.source] = (sourceMap[l.source] || 0) + 1;
  });
  const leadSources = Object.keys(sourceMap).map(key => ({
    name: key,
    value: sourceMap[key]
  }));

  // Industry Distribution
  const industryMap: Record<string, number> = {};
  customers.forEach(c => {
    industryMap[c.industry] = (industryMap[c.industry] || 0) + 1;
  });
  const industries = Object.keys(industryMap).map(key => ({
    name: key,
    value: industryMap[key]
  }));

  res.json({
    metrics: {
      totalRevenue,
      pipelineValue,
      winRate,
      activeLeads: leads.filter(l => l.status !== 'Lost').length,
      customersCount: customers.length
    },
    monthlySales,
    funnel,
    leadSources: leadSources.length > 0 ? leadSources : [{ name: 'Inbound', value: 5 }, { name: 'Outbound', value: 3 }],
    industries: industries.length > 0 ? industries : [{ name: 'Tech', value: 4 }, { name: 'Finance', value: 2 }]
  });
});

/**
 * 12. NOTIFICATIONS
 */
app.get('/api/notifications', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json(db.getNotifications(req.user!.id));
});

app.post('/api/notifications/:id/read', authenticateToken, (req, res) => {
  db.markNotificationAsRead(req.params.id);
  res.json({ success: true });
});

/**
 * 13. CALENDAR & MEETINGS / TASKS
 */
app.get('/api/tasks', authenticateToken, (req, res) => {
  res.json(db.getTasks());
});

app.post('/api/tasks', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, dueDate, priority, type } = req.body;
    if (!title || !dueDate) {
      res.status(400).json({ error: 'Title and due date are required.' });
      return;
    }

    const newTask: Task = {
      id: 't-' + Math.random().toString(36).substring(2, 9),
      title,
      description: description || '',
      dueDate,
      status: 'Pending',
      priority: priority || 'Medium',
      type: type || 'Follow-up',
      ownerId: req.user!.id,
      createdAt: new Date().toISOString()
    };

    db.addTask(newTask);
    res.status(201).json(newTask);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    db.updateTask(req.params.id, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    db.deleteTask(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/meetings', authenticateToken, (req, res) => {
  res.json(db.getMeetings());
});

app.post('/api/meetings', authenticateToken, (req, res) => {
  try {
    const { title, description, date, duration, attendees, agenda } = req.body;
    if (!title || !date) {
      res.status(400).json({ error: 'Title and date are required.' });
      return;
    }

    const newMeeting: Meeting = {
      id: 'm-' + Math.random().toString(36).substring(2, 9),
      title,
      description: description || '',
      date,
      duration: Number(duration) || 30,
      attendees: Array.isArray(attendees) ? attendees : [],
      agenda: agenda || '',
      createdAt: new Date().toISOString()
    };

    db.addMeeting(newMeeting);
    res.status(201).json(newMeeting);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/meetings/:id', authenticateToken, (req, res) => {
  try {
    db.updateMeeting(req.params.id, req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/meetings/:id', authenticateToken, (req, res) => {
  try {
    db.deleteMeeting(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 8. AI CALL / MEETING SUMMARY
 */
app.post('/api/meetings/:id/ai-summary', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { transcript } = req.body;
    if (!transcript) {
      res.status(400).json({ error: 'Transcript or call notes are required.' });
      return;
    }

    const meeting = db.getMeetings().find(m => m.id === id);
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found.' });
      return;
    }

    const summaryData = await summarizeCallTranscript(transcript);

    db.updateMeeting(id, {
      summary: summaryData.summary,
      mood: summaryData.mood,
      interestLevel: summaryData.interestLevel,
      actionItems: summaryData.actionItems,
      followUpTasks: summaryData.followUpTasks
    });

    // Create automatic task recommendations based on follow up tasks
    if (summaryData.followUpTasks && summaryData.followUpTasks.length > 0) {
      summaryData.followUpTasks.forEach((taskTitle: string) => {
        db.addTask({
          id: 't-' + Math.random().toString(36).substring(2, 9),
          title: `AI Action Item: ${taskTitle}`,
          description: `Automatically created follow-up from meeting "${meeting.title}" summary logs.`,
          dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
          status: 'Pending',
          priority: 'Medium',
          type: 'Follow-up',
          ownerId: req.body.userId || 'u-1',
          createdAt: new Date().toISOString()
        });
      });
    }

    res.json({ success: true, meeting: { ...meeting, ...summaryData } });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Call summary failed.' });
  }
});

/**
 * 16. AI MEETING PREPARATION
 */
app.post('/api/meetings/ai-prep', authenticateToken, async (req, res) => {
  try {
    const { title, agenda } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Meeting title is required.' });
      return;
    }

    const prep = await prepareMeetingAgenda(title, agenda || 'General discovery call.');
    res.json({ success: true, prep });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI preparation failed.' });
  }
});

/**
 * 7. AI EMAIL GENERATOR
 */
app.get('/api/emails', authenticateToken, (req, res) => {
  res.json(db.getEmails());
});

app.post('/api/emails/ai-generate', authenticateToken, async (req, res) => {
  try {
    const { leadName, company, type, customDetails, senderName } = req.body;
    if (!leadName || !company || !type) {
      res.status(400).json({ error: 'Lead name, company, and email type are required.' });
      return;
    }

    const result = await generateSalesEmail({
      leadName,
      company,
      type,
      customDetails,
      senderName: senderName || 'Senior Sales Advisor'
    });

    res.json({ success: true, emailText: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI email generation failed.' });
  }
});

app.post('/api/emails/send', authenticateToken, (req: AuthenticatedRequest, res) => {
  try {
    const { recipient, subject, body, type, status } = req.body;
    if (!recipient || !subject || !body) {
      res.status(400).json({ error: 'Recipient, subject, and body are required.' });
      return;
    }

    const newEmail: Email = {
      id: 'e-' + Math.random().toString(36).substring(2, 9),
      senderId: req.user!.id,
      recipient,
      subject,
      body,
      type: type || 'Follow-up',
      status: status || 'Sent',
      createdAt: new Date().toISOString()
    };

    db.addEmail(newEmail);

    // Create record in activities if Sent
    if (newEmail.status === 'Sent') {
      db.addActivity('email_sent', `Email sent to ${recipient}. Subject: "${subject}"`, undefined, undefined, undefined, req.user!.id);
    }

    res.status(201).json(newEmail);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 14. AI DAILY ASSISTANT BRIEF
 */
app.get('/api/ai/daily-brief', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const leads = db.getLeads();
    const tasks = db.getTasks();
    const meetings = db.getMeetings();
    const opportunities = db.getOpportunities();

    // Prepare quick metadata string context for the database
    const contextStr = `
- Total active leads: ${leads.length}
- Hot leads (score >= 80): ${leads.filter(l => l.score >= 80).map(l => `${l.name} from ${l.company}`).join(', ')}
- Critical tasks pending: ${tasks.filter(t => t.status === 'Pending' && t.priority === 'High').map(t => t.title).join(', ')}
- Deals in negotiation / contracting: ${opportunities.filter(o => o.stage === 'Negotiation' || o.stage === 'Contracting').map(o => `${o.name} ($${o.revenue})`).join(', ')}
`;

    const brief = await generateDailyBrief(
      req.user!.role,
      req.user!.name,
      leads.length,
      tasks.filter(t => t.status === 'Pending').length,
      meetings.length,
      opportunities.filter(o => o.riskLevel === 'High').length,
      contextStr
    );

    res.json({ success: true, brief });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Daily brief generation failed.' });
  }
});

/**
 * 15. AI SALES COACH
 */
app.post('/api/ai/coach', authenticateToken, async (req, res) => {
  try {
    const { category, context } = req.body;
    if (!category || !context) {
      res.status(400).json({ error: 'Category and context are required.' });
      return;
    }

    const tips = await getSalesCoachTips(category, context);
    res.json({ success: true, tips });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sales coaching failed.' });
  }
});

/**
 * 17. AI COMPETITOR ANALYSIS
 */
app.post('/api/ai/competitor', authenticateToken, async (req, res) => {
  try {
    const { competitorName } = req.body;
    if (!competitorName) {
      res.status(400).json({ error: 'Competitor name is required.' });
      return;
    }

    const analysis = await analyzeCompetitorIntel(competitorName);
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Competitor analysis failed.' });
  }
});

/**
 * 18. AI PRODUCT RECOMMENDATION
 */
app.post('/api/customers/:id/ai-recommend', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const customer = db.getCustomers().find(c => c.id === id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }

    const recommendation = await recommendProducts(customer as any);
    res.json({ success: true, recommendation });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Product recommendation failed.' });
  }
});

/**
 * 23. AI AGENT CHAT & CHATBOT
 */
app.post('/api/ai/agent-chat', authenticateToken, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    // Dump a compressed JSON database snapshot of CRM statistics to guide Gemini's context
    const leads = db.getLeads().map(l => ({ id: l.id, name: l.name, company: l.company, score: l.score, status: l.status, budget: l.budget }));
    const opportunities = db.getOpportunities().map(o => ({ id: o.id, name: o.name, company: o.company, revenue: o.revenue, stage: o.stage, probability: o.probability, riskLevel: o.riskLevel }));
    const customers = db.getCustomers().map(c => ({ id: c.id, name: c.name, company: c.company, industry: c.industry }));
    const tasks = db.getTasks().map(t => ({ title: t.title, dueDate: t.dueDate, status: t.status }));

    const dbDumpContext = JSON.stringify({
      dashboardMetrics: {
        totalLeads: leads.length,
        totalOpportunities: opportunities.length,
        closedWonRevenue: opportunities.filter(o => o.stage === 'Closed Won').reduce((sum, o) => sum + o.revenue, 0),
        forecastedPipeline: opportunities.filter(o => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost').reduce((sum, o) => sum + o.revenue, 0)
      },
      activeLeads: leads.slice(0, 5),
      priorityDeals: opportunities.slice(0, 5),
      activeCustomers: customers.slice(0, 5),
      pendingTasks: tasks.slice(0, 5)
    }, null, 1);

    const reply = await chatWithCRMAgent({
      userQuery: message,
      chatHistory: Array.isArray(history) ? history : [],
      crmDataState: dbDumpContext
    });

    res.json({ success: true, reply });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI agent chat failed.' });
  }
});

/**
 * 19. REPORTS DYNAMIC GENERATOR (PDF / CSV / Excel formatters)
 */
app.get('/api/reports/download', authenticateToken, (req, res) => {
  const { type, format } = req.query; // type: sales, lead, customer, revenue. format: csv, pdf
  if (!type || !format) {
    res.status(400).json({ error: 'Type (sales/lead/customer/revenue) and format (csv/pdf/excel) are required.' });
    return;
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `SalesgenieAI_Report_${type}_${timestamp}.${format}`;

  if (format === 'csv') {
    let csvContent = '';
    if (type === 'lead') {
      const leads = db.getLeads();
      csvContent = 'ID,Name,Email,Company,Industry,Budget,Score,Buying Intent,Urgency,Status,Created At\n';
      leads.forEach(l => {
        csvContent += `"${l.id}","${l.name}","${l.email}","${l.company}","${l.industry}",${l.budget},${l.score},"${l.buyingIntent}","${l.urgency}","${l.status}","${l.createdAt}"\n`;
      });
    } else if (type === 'customer') {
      const customers = db.getCustomers();
      csvContent = 'ID,Name,Email,Company,Industry,Country,Status,Created At\n';
      customers.forEach(c => {
        csvContent += `"${c.id}","${c.name}","${c.email}","${c.company}","${c.industry}","${c.country}","${c.status}","${c.createdAt}"\n`;
      });
    } else if (type === 'sales' || type === 'revenue') {
      const opps = db.getOpportunities();
      csvContent = 'ID,Deal Name,Company,Stage,Revenue,Probability,Risk Level,Close Date\n';
      opps.forEach(o => {
        csvContent += `"${o.id}","${o.name}","${o.company}","${o.stage}",${o.revenue},${o.probability},"${o.riskLevel}","${o.expectedClosingDate}"\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csvContent);
  } else {
    // Generate a simple, clean, mock raw PDF structure/readable layout to fulfill reports.
    // Since building standard PDF on server is highly dependency heavy, we return an elegant HTML representation
    // or string that is completely readable and can be printed to PDF instantly!
    const titleText = `SALESGENIEAI CRM REPORT - ${String(type).toUpperCase()}`;
    const leads = db.getLeads();
    const customers = db.getCustomers();
    const opps = db.getOpportunities();

    let contentStr = `
========================================
${titleText}
Date: ${new Date().toLocaleDateString()}
Company Scope: Live CRM Workspace
========================================\n\n`;

    if (type === 'lead') {
      contentStr += `LEAD PIPELINE OVERVIEW:\n\n`;
      leads.forEach(l => {
        contentStr += `- ${l.name} (${l.company}) | Score: ${l.score}/100 | Budget: $${l.budget} | Intent: ${l.buyingIntent} | Urgency: ${l.urgency}\n`;
      });
    } else if (type === 'customer') {
      contentStr += `ACTIVE CLIENT LIFECYCLE DIRECTORY:\n\n`;
      customers.forEach(c => {
        contentStr += `- ${c.name} | ${c.company} (${c.industry}) | Budget Pool: $${c.budget} | Status: ${c.status}\n`;
      });
    } else {
      contentStr += `SALES PIPELINE FORECAST SUMMARY:\n\n`;
      const wonSum = opps.filter(o => o.stage === 'Closed Won').reduce((sum, o) => sum + o.revenue, 0);
      const pipelineSum = opps.filter(o => o.stage !== 'Closed Won').reduce((sum, o) => sum + o.revenue, 0);
      contentStr += `Closed Won Revenue Pool: $${wonSum}\nActive Pipeline Forecast: $${pipelineSum}\n\n`;
      opps.forEach(o => {
        contentStr += `- ${o.name} | Client: ${o.company} | Stage: ${o.stage} | Revenue Target: $${o.revenue} | Win Probability: ${o.probability}%\n`;
      });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(contentStr);
  }
});

/**
 * 21. ADMIN PANEL ENDPOINTS
 */
app.get('/api/admin/users', authenticateToken, requireRole(['Admin', 'Sales Manager']), (req, res) => {
  res.json(db.getUsers());
});

app.post('/api/admin/seed-reset', authenticateToken, requireRole(['Admin']), (req, res) => {
  db.clearAll();
  res.json({ success: true, message: 'Workspace CRM database cleared and reset to pristine demo values!' });
});

app.get('/api/admin/backup', authenticateToken, requireRole(['Admin']), (req, res) => {
  const backupFile = path.join(process.cwd(), 'data', 'sales_crm.json');
  if (fs.existsSync(backupFile)) {
    res.download(backupFile);
  } else {
    res.status(404).json({ error: 'Backup not found.' });
  }
});

/**
 * 22. MACHINE LEARNING MODEL PIPELINE ENDPOINTS
 */
app.post('/api/ml/train', authenticateToken, async (req, res) => {
  try {
    const { modelType, targetFeature, epochs, learningRate, features } = req.body;
    
    // Load database status
    const leads = db.getLeads();
    const customers = db.getCustomers();
    const opportunities = db.getOpportunities();

    const datasetSummary = `
Active Pipeline Leads: ${leads.length} entries.
Onboarded Customers: ${customers.length} entries.
Deal Opportunities: ${opportunities.length} entries.
Key Leads Features Available: budget, emailOpens, websiteVisits, callDuration, industry, companySize, source, priority.
Key Opportunities Features Available: revenue, stage, probability, riskLevel.
`;

    const metrics = await generateMlTrainingMetrics({
      modelType,
      targetFeature,
      epochs: Number(epochs) || 100,
      learningRate: Number(learningRate) || 0.01,
      features: Array.isArray(features) ? features : ['callDuration', 'budget'],
      datasetSummary
    });

    if (!metrics) {
      res.status(500).json({ error: 'Failed to train ML model.' });
      return;
    }

    res.json({ success: true, metrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ML Model training failed.' });
  }
});

app.post('/api/ml/inference', authenticateToken, async (req, res) => {
  try {
    const { modelType, targetFeature, leadId, featureImportances } = req.body;
    
    const leads = db.getLeads();
    const lead = leads.find(l => l.id === leadId);

    if (!lead) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    const result = await runMlInference({
      modelType,
      targetFeature,
      leadData: {
        name: lead.name,
        company: lead.company,
        industry: lead.industry,
        size: lead.size,
        budget: lead.budget,
        priority: lead.priority,
        engagement: lead.engagement
      },
      featureImportances: Array.isArray(featureImportances) ? featureImportances : []
    });

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Model prediction failed.' });
  }
});

/**
 * SERVE WEB FRONTEND (Vite integration for development and static production files)
 */
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SalesgenieAI production CRM running at: http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Failed to boot SalesgenieAI server:', err);
});
