import express from 'express';
import axios from 'axios';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import Task from '../models/Task.js';
import Expense from '../models/Expense.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get list of chat rooms (Teams the user belongs to + list of other members for DM)
router.get('/rooms', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // 1. Get teams
    let teams = [];
    if (req.user.role === 'admin') {
      // Admins see all teams
      teams = await Team.find({});
    } else if (user.teamId) {
      // Members see their assigned team
      teams = await Team.find({ _id: user.teamId });
    }

    // 2. Get list of other members for DM
    const members = await User.find({ _id: { $ne: req.user.id } })
      .select('name email avatar role teamId');

    res.json({
      teams: teams.map(t => ({
        id: t._id,
        name: t.name,
        color: t.color,
        type: 'team'
      })),
      members: members.map(m => ({
        id: m._id,
        name: m.name,
        avatar: m.avatar,
        role: m.role,
        teamId: m.teamId,
        type: 'direct'
      }))
    });
  } catch (error) {
    console.error('Fetch rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

// Get messages for a specific room (team ID or DM key user1_user2)
router.get('/messages/:roomId', authMiddleware, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ roomId: req.params.roomId })
      .sort({ timestamp: 1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Clear all chat messages (Admin only)
router.delete('/messages/clear', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can clear chat history' });
    }
    await ChatMessage.deleteMany({});
    
    // Notify all connected sockets
    const io = req.app.get('io');
    if (io) {
      io.emit('chat_cleared');
    }
    
    res.json({ message: 'Chat history cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

// AI Chatbot endpoint
router.post('/ai', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Retrieve user data for context
    const user = await User.findById(req.user.id);
    const tasks = await Task.find({ assignedTo: req.user.id }).populate('teamId', 'name');
    const events = await Event.find({ status: 'published' });
    const expenses = await Expense.find({ submittedBy: req.user.id });
    
    let teamName = 'No Team';
    let teamMembers = [];
    if (user.teamId) {
      const teamObj = await Team.findById(user.teamId);
      if (teamObj) {
        teamName = teamObj.name;
        const members = await User.find({ teamId: user.teamId }).select('name role');
        teamMembers = members.map(m => `${m.name} (${m.role})`);
      }
    }

    const contextData = {
      user: {
        name: user.name,
        role: user.role,
        team: teamName,
        teamMembers
      },
      tasks: tasks.map(t => ({
        title: t.title,
        description: t.description,
        status: t.status,
        team: t.teamId?.name
      })),
      events: events.map(e => ({
        title: e.title,
        description: e.description,
        date: e.date
      })),
      expenses: expenses.map(ex => ({
        title: ex.title,
        amount: ex.amount,
        category: ex.category,
        status: ex.status
      }))
    };

    const apiKey = process.env.AI_API_KEY;

    if (apiKey) {
      // We have an AI API Key (can support Anthropic or OpenAI)
      try {
        let aiResponseText = '';
        if (apiKey.startsWith('sk-ant-')) {
          // Anthropic Claude call
          const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 1024,
              system: `You are the AUISC EventSync AI Assistant for Anurag University ISC club.
              You have access to the current logged-in user's database context. Use this context to answer questions accurately.
              Context: ${JSON.stringify(contextData)}`,
              messages: [{ role: 'user', content: message }]
            },
            {
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
              }
            }
          );
          aiResponseText = response.data.content[0].text;
        } else {
          // OpenAI call
          const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: `You are the AUISC EventSync AI Assistant for Anurag University ISC club.
                  You have access to the current logged-in user's database context. Use this context to answer questions.
                  Context: ${JSON.stringify(contextData)}`
                },
                { role: 'user', content: message }
              ]
            },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          aiResponseText = response.data.choices[0].message.content;
        }
        return res.json({ response: aiResponseText });
      } catch (err) {
        console.error('Real AI API call failed, falling back to database parser:', err);
      }
    }

    // Fallback: Smart local rule-based database parser
    const query = message.toLowerCase();
    let responseText = '';

    if (query.includes('task')) {
      if (contextData.tasks.length === 0) {
        responseText = `Hi ${user.name}, you currently have no tasks assigned.`;
      } else {
        const pending = contextData.tasks.filter(t => t.status !== 'done');
        const done = contextData.tasks.filter(t => t.status === 'done');
        responseText = `Here are your tasks, ${user.name}:\n`;
        if (pending.length > 0) {
          responseText += `\n**Pending Tasks:**\n` + pending.map(t => `- **${t.title}** (${t.status}) in team ${t.team}: ${t.description}`).join('\n');
        }
        if (done.length > 0) {
          responseText += `\n\n**Completed Tasks:**\n` + done.map(t => `- ~~${t.title}~~ (done)`).join('\n');
        }
      }
    } else if (query.includes('event')) {
      if (contextData.events.length === 0) {
        responseText = `Hi ${user.name}, there are no upcoming events scheduled at the moment.`;
      } else {
        responseText = `Here are the upcoming published events for AUISC:\n\n` + 
          contextData.events.map(e => `- **${e.title}** on ${new Date(e.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}: ${e.description}`).join('\n');
      }
    } else if (query.includes('expense') || query.includes('spent') || query.includes('spend')) {
      if (contextData.expenses.length === 0) {
        responseText = `Hi ${user.name}, you haven't submitted any expenses yet.`;
      } else {
        const total = contextData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const approved = contextData.expenses.filter(e => e.status === 'approved').reduce((sum, exp) => sum + exp.amount, 0);
        const pending = contextData.expenses.filter(e => e.status === 'pending').reduce((sum, exp) => sum + exp.amount, 0);
        responseText = `Here is your expense summary, ${user.name}:\n` +
          `- **Total Submitted**: ₹${total}\n` +
          `- **Approved**: ₹${approved}\n` +
          `- **Pending**: ₹${pending}\n\n` +
          `**Details:**\n` +
          contextData.expenses.map(e => `- ₹${e.amount} for **${e.title}** [${e.category}] - Status: *${e.status}*`).join('\n');
      }
    } else if (query.includes('team') || query.includes('member')) {
      if (teamName === 'No Team') {
        responseText = `Hi ${user.name}, you are not currently assigned to any team. Admins can configure your team assignments.`;
      } else {
        responseText = `You are in **${teamName}**.\n\n**Team Members:**\n` + 
          teamMembers.map(m => `- ${m}`).join('\n');
      }
    } else {
      responseText = `Hello ${user.name}! I am your AUISC EventSync assistant. ⚡\n\nI can help you with details in our database. You can ask me:\n` +
        `- *"What are my pending tasks?"*\n` +
        `- *"When is the next event?"*\n` +
        `- *"How much have I spent this month?"*\n` +
        `- *"Who is in my team?"*\n` +
        `- *"Show my expenses"*`;
    }

    res.json({ response: responseText });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

export default router;
