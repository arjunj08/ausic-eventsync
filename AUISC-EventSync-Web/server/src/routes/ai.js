import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to initialize Anthropic client
const getAnthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
};

// 1. AI Task Suggester
router.post('/suggest-tasks', authMiddleware, async (req, res) => {
  const { eventType, eventDescription, expectedAttendees } = req.body;
  if (!eventType) {
    return res.status(400).json({ error: 'Event type is required' });
  }

  const client = getAnthropicClient();

  if (client) {
    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: `You are an event planning assistant for a university club (AUISC).
Given an event type and description, suggest a comprehensive list of tasks needed to organize the event successfully.
Return ONLY a valid JSON array of task objects with fields:
title, description, teamType, priority. No other conversational text. Do not wrap the JSON in Markdown formatting.
Values for teamType MUST be one of: 'Design', 'Dev', 'Media', 'Logistics'.
Values for priority MUST be one of: 'High', 'Medium', 'Low'.`,
        messages: [{
          role: 'user',
          content: `Suggest tasks for this event:
Type: ${eventType}
Description: ${eventDescription || 'No description'}
Expected Attendees: ${expectedAttendees || 'Unknown'}`
        }]
      });

      const text = response.content[0].text.trim();
      // Handle potential markdown block wraps
      const cleanJsonText = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const tasks = JSON.parse(cleanJsonText);
      return res.json({ tasks });
    } catch (err) {
      console.error('Claude tasks suggestion failed, falling back to mock:', err);
    }
  }

  // Graceful Mock Fallback
  const mockTasks = [
    {
      title: 'Design Event Poster & Banners',
      description: 'Create high-contrast dark theme visual flyers for social media and campus walls.',
      teamType: 'Design',
      priority: 'High'
    },
    {
      title: 'Setup Event Landing Page',
      description: 'Develop registration form, link database collection, and verify responsiveness.',
      teamType: 'Dev',
      priority: 'Medium'
    },
    {
      title: 'Draft Social Media Captions',
      description: 'Write promotional copy and release countdown posts on Instagram and LinkedIn.',
      teamType: 'Media',
      priority: 'Medium'
    },
    {
      title: 'Acquire Sound System and Lighting',
      description: 'Reserve equipment from university logistics department and coordinate staging.',
      teamType: 'Logistics',
      priority: 'High'
    },
    {
      title: 'Arrange Guest Refreshments',
      description: 'Order snacks, water bottles, and schedule vendor delivery timings.',
      teamType: 'Logistics',
      priority: 'Low'
    }
  ];

  res.json({ tasks: mockTasks });
});

// 2. AI Meeting Summarizer
router.post('/summarize-meeting', authMiddleware, async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: 'Transcript is required' });
  }

  const client = getAnthropicClient();

  if (client) {
    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        system: `You are a professional secretary assistant for a university IT/Security club.
Analyze the pasted meeting transcript. Return ONLY a JSON object with the following fields:
"summary": Array of 3-5 bullet strings,
"actionItems": Array of objects containing { "task": String, "assignedTo": String, "dueDate": String in YYYY-MM-DD format },
"keyDecisions": Array of strings representing decisions,
"nextSteps": Array of strings.
Do not include any other markdown code block wrapper or text.`,
        messages: [{
          role: 'user',
          content: `Summarize the following meeting transcript:\n\n${transcript}`
        }]
      });

      const text = response.content[0].text.trim();
      const cleanJsonText = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const summaryObj = JSON.parse(cleanJsonText);
      return res.json(summaryObj);
    } catch (err) {
      console.error('Claude meeting summarizer failed, falling back to mock:', err);
    }
  }

  // Graceful Mock Fallback
  const mockSummary = {
    summary: [
      'Reviewed current progress on the AUISC Web application development.',
      'Identified Room database compilation compatibility errors on the Android build and deployed fixes.',
      'Decided to integrate email notifications using Nodemailer for task assignments.'
    ],
    actionItems: [
      {
        task: 'Implement SMTP credentials config',
        assignedTo: 'Finance Team',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      {
        task: 'Design Ctrl+K spotlight UI component',
        assignedTo: 'Design Squad',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ],
    keyDecisions: [
      'Use SMTP Gmail service to dispatch notifications.',
      'Group less frequent nav tabs inside a collapsible More modal.'
    ],
    nextSteps: [
      'Complete local Git commits and prepare the remote repository link.',
      'Schedule a progress sync on Monday 9 AM.'
    ]
  };

  res.json(mockSummary);
});

// 3. AI Event Planner
router.post('/plan-event', authMiddleware, async (req, res) => {
  const { name, type, attendees, budget, date, requirements } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Event name and type are required' });
  }

  const client = getAnthropicClient();

  if (client) {
    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        system: `You are an expert event architect for a university club.
Given event parameters, design a complete plan.
Return ONLY a valid JSON object containing fields:
"tasks": Array of task objects { title, description, teamType, priority },
"budgetBreakdown": Array of budget items { category, estimatedCostInRs },
"timeline": Array of countdown week steps { week, objectives },
"teamStructure": Array of role assignments { roleTitle, squadType, responsibilities }.
Do not include any conversational text or markdown code wraps.`,
        messages: [{
          role: 'user',
          content: `Create a plan for:
Name: ${name}
Type: ${type}
Expected Attendees: ${attendees}
Budget: ₹${budget}
Date: ${date}
Special Requirements: ${requirements || 'None'}`
        }]
      });

      const text = response.content[0].text.trim();
      const cleanJsonText = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      const planObj = JSON.parse(cleanJsonText);
      return res.json(planObj);
    } catch (err) {
      console.error('Claude event planner failed, falling back to mock:', err);
    }
  }

  // Graceful Mock Fallback
  const totalBudget = Number(budget) || 10000;
  const mockPlan = {
    tasks: [
      { title: `${name} Graphic Visuals`, description: 'Poster design, pamphlets distribution, and ID badges.', teamType: 'Design', priority: 'High' },
      { title: `${name} Registration WebApp`, description: 'Launch RSVP forms, link QR ticket builders, and database checks.', teamType: 'Dev', priority: 'High' },
      { title: `${name} Press Release`, description: 'Distribute banners across university groups and email campaigns.', teamType: 'Media', priority: 'Medium' },
      { title: `${name} Hall Stage Setup`, description: 'Acquire projection sheets, speakers, microphones, and set seating.', teamType: 'Logistics', priority: 'High' }
    ],
    budgetBreakdown: [
      { category: 'Venue Decoration & Stage Lighting', estimatedCostInRs: Math.round(totalBudget * 0.3) },
      { category: 'Catering & Guest Refreshments', estimatedCostInRs: Math.round(totalBudget * 0.4) },
      { category: 'Prizes, Certificates & Printing', estimatedCostInRs: Math.round(totalBudget * 0.2) },
      { category: 'Marketing & Digital Hostings', estimatedCostInRs: Math.round(totalBudget * 0.1) }
    ],
    timeline: [
      { week: 'Week 1 (Init)', objectives: 'Confirm auditorium reservation and assign task columns on Kanban board.' },
      { week: 'Week 2 (Promo)', objectives: 'Deploy registration website, distribute visual flyers, and launch social updates.' },
      { week: 'Week 3 (Audit)', objectives: 'Approve expenditure slips, run audio-visual tech tests, and seed tickets.' },
      { week: 'Event Day', objectives: 'Execute check-in logs using door QR scanners and log minutes of the summary.' }
    ],
    teamStructure: [
      { roleTitle: 'Event Director', squadType: 'Logistics', responsibilities: 'Supervise staging timelines and verify guest lists.' },
      { roleTitle: 'Creative Coordinator', squadType: 'Design', responsibilities: 'Oversee flyer palettes, tickets design, and photography.' },
      { roleTitle: 'Fullstack Tech Lead', squadType: 'Dev', responsibilities: 'Verify database checks and scan APIs functionality.' }
    ]
  };

  res.json(mockPlan);
});

// 4. AI Onboarding Team Suggestion
router.post('/suggest-team', authMiddleware, async (req, res) => {
  const { skills, interests } = req.body;
  if (!skills || !Array.isArray(skills)) {
    return res.status(400).json({ error: 'Skills list array is required' });
  }

  // Simple heuristic/AI logic to suggest team
  const skillsStr = skills.map(s => s.toLowerCase()).join(' ');
  const interestsStr = (interests || '').toLowerCase();

  let teamName = 'Logistics Team'; // default fallback

  if (skillsStr.includes('development') || skillsStr.includes('dev') || skillsStr.includes('coding') || skillsStr.includes('software')) {
    teamName = 'Dev Force';
  } else if (skillsStr.includes('design') || skillsStr.includes('photography') || skillsStr.includes('ui') || skillsStr.includes('video')) {
    teamName = 'Design Squad';
  } else if (skillsStr.includes('marketing') || skillsStr.includes('content') || skillsStr.includes('social') || skillsStr.includes('public')) {
    teamName = 'Media Team';
  } else if (skillsStr.includes('finance') || skillsStr.includes('budget') || skillsStr.includes('treasury')) {
    teamName = 'Finance Team';
  }

  res.json({ suggestedTeam: teamName });
});

export default router;
