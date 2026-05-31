import express from 'express';
import axios from 'axios';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import Task from '../models/Task.js';
import Expense from '../models/Expense.js';
import Meeting from '../models/Meeting.js';
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
    const query = message.toLowerCase().trim();

    // ONLY ADMINS can record/enter attendance
    if (user.role === 'admin' && (query.includes('attendance') || query.includes('mark'))) {
      
      // Pattern 1: Single user attendance checking
      // e.g. "mark Sarah Chen present for meeting Project Sync"
      const singleMatch = message.match(/(?:mark|set)\s+(.+?)\s+(?:as\s+)?(present|absent)\s+(?:for|in|meeting|for meeting|in meeting)\s+(.+)/i);
      
      if (singleMatch) {
        const userNameInput = singleMatch[1].trim();
        const status = singleMatch[2].toLowerCase().trim();
        let meetingTitleInput = singleMatch[3].trim();
        
        // Strip leading "meeting" word if present in title input
        meetingTitleInput = meetingTitleInput.replace(/^meeting\s+/i, '').trim();

        // Search for user
        const targetUser = await User.findOne({ name: { $regex: new RegExp(`^${userNameInput}$`, 'i') } });
        // Search for meeting (case-insensitive regex match)
        const targetMeeting = await Meeting.findOne({ title: { $regex: new RegExp(meetingTitleInput, 'i') } });

        if (!targetUser) {
          return res.json({ response: `I couldn't find a member named "${userNameInput}".` });
        }
        if (!targetMeeting) {
          return res.json({ response: `I couldn't find a meeting matching "${meetingTitleInput}".` });
        }

        // Update targetMeeting attendees status
        const attendeeIdx = targetMeeting.attendees.findIndex(a => String(a.userId) === String(targetUser._id));
        if (attendeeIdx > -1) {
          targetMeeting.attendees[attendeeIdx].status = status;
        } else {
          targetMeeting.attendees.push({
            userId: targetUser._id,
            userName: targetUser.name,
            status: status
          });
        }
        await targetMeeting.save();

        // Trigger Socket.io update to refresh screen components
        const io = req.app.get('io');
        if (io) {
          io.emit(`meeting_${targetMeeting._id}_update`, targetMeeting);
        }

        // Auto-post the updated attendance to appropriate team chat rooms
        try {
          const presentList = targetMeeting.attendees.filter(a => a.status === 'present').map(a => a.userName);
          const absentList = targetMeeting.attendees.filter(a => a.status === 'absent').map(a => a.userName);

          let messageText = `⚡ **Meeting Attendance Logged via Bot**\n`;
          messageText += `Meeting: **"${targetMeeting.title}"**\n`;
          messageText += `Updated: **${targetUser.name}** marked as **${status}** by *${user.name}*\n\n`;
          
          if (presentList.length > 0) {
            messageText += `✅ **Present (${presentList.length})**:\n${presentList.map(name => `- ${name}`).join('\n')}\n\n`;
          }
          if (absentList.length > 0) {
            messageText += `❌ **Absent (${absentList.length})**:\n${absentList.map(name => `- ${name}`).join('\n')}\n\n`;
          }

          let targetRooms = [];
          if (targetMeeting.teamId) {
            targetRooms.push(String(targetMeeting.teamId));
          } else if (targetMeeting.eventId) {
            const eventObj = await Event.findById(targetMeeting.eventId);
            if (eventObj && eventObj.teamIds) {
              eventObj.teamIds.forEach(tId => targetRooms.push(String(tId)));
            }
          }
          if (targetRooms.length === 0) {
            const allTeams = await Team.find({});
            allTeams.forEach(t => targetRooms.push(String(t._id)));
          }

          for (const roomId of targetRooms) {
            const chatMsg = new ChatMessage({
              roomId,
              senderId: req.user.id,
              senderName: 'System (Attendance Bot)',
              message: messageText
            });
            await chatMsg.save();

            if (io) {
              io.to(roomId).emit('new-message', chatMsg);
            }
          }
        } catch (chatErr) {
          console.error('Failed to post chatbot single update to rooms:', chatErr);
        }

        return res.json({ 
          response: `⚡ **Attendance Logged**\n\nI have successfully marked **${targetUser.name}** as **${status}** for meeting **"${targetMeeting.title}"**.` 
        });
      }

      // Pattern 2: Bulk attendance entry
      // e.g. "attendance for Project Sync: present: Sarah Chen, Alex Mercer; absent: Admin User"
      if (query.includes('present') || query.includes('absent')) {
        let meetingPart = '';
        let presentPart = '';
        let absentPart = '';

        const cleanMsg = message.replace(/^attendance\s*(?:for|:)?\s*/i, '').trim();
        const firstKeywordIdx = cleanMsg.search(/present:|absent:/i);
        if (firstKeywordIdx > -1) {
          meetingPart = cleanMsg.substring(0, firstKeywordIdx).replace(/[-:,;]$/, '').trim();
          
          const rest = cleanMsg.substring(firstKeywordIdx);
          
          const presentMatch = rest.match(/present:\s*([^;]+)/i);
          if (presentMatch) {
            presentPart = presentMatch[1].trim();
          }
          
          const absentMatch = rest.match(/absent:\s*([^;]+)/i);
          if (absentMatch) {
            absentPart = absentMatch[1].trim();
          }
        }

        if (meetingPart) {
          const targetMeeting = await Meeting.findOne({ title: { $regex: new RegExp(meetingPart, 'i') } });
          if (targetMeeting) {
            let responseLines = [`⚡ **Bulk Attendance Logged for "${targetMeeting.title}"**`];
            
            const updateNames = async (namesString, statusVal) => {
              if (!namesString) return [];
              const names = namesString.split(/[,;]/).map(n => n.trim()).filter(Boolean);
              const processed = [];
              for (const name of names) {
                const u = await User.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
                if (u) {
                  const idx = targetMeeting.attendees.findIndex(a => String(a.userId) === String(u._id));
                  if (idx > -1) {
                    targetMeeting.attendees[idx].status = statusVal;
                  } else {
                    targetMeeting.attendees.push({
                      userId: u._id,
                      userName: u.name,
                      status: statusVal
                    });
                  }
                  processed.push(u.name);
                }
              }
              return processed;
            };

            const presentProcessed = await updateNames(presentPart, 'present');
            const absentProcessed = await updateNames(absentPart, 'absent');

            await targetMeeting.save();

            const io = req.app.get('io');
            if (io) {
              io.emit(`meeting_${targetMeeting._id}_update`, targetMeeting);
            }

            // Auto-post the updated attendance to appropriate team chat rooms
            try {
              const presentList = targetMeeting.attendees.filter(a => a.status === 'present').map(a => a.userName);
              const absentList = targetMeeting.attendees.filter(a => a.status === 'absent').map(a => a.userName);

              let messageText = `⚡ **Meeting Attendance Logged via Bot**\n`;
              messageText += `Meeting: **"${targetMeeting.title}"**\n`;
              messageText += `Bulk Attendance Update by: *${user.name}*\n\n`;
              
              if (presentList.length > 0) {
                messageText += `✅ **Present (${presentList.length})**:\n${presentList.map(name => `- ${name}`).join('\n')}\n\n`;
              }
              if (absentList.length > 0) {
                messageText += `❌ **Absent (${absentList.length})**:\n${absentList.map(name => `- ${name}`).join('\n')}\n\n`;
              }

              let targetRooms = [];
              if (targetMeeting.teamId) {
                targetRooms.push(String(targetMeeting.teamId));
              } else if (targetMeeting.eventId) {
                const eventObj = await Event.findById(targetMeeting.eventId);
                if (eventObj && eventObj.teamIds) {
                  eventObj.teamIds.forEach(tId => targetRooms.push(String(tId)));
                }
              }
              if (targetRooms.length === 0) {
                const allTeams = await Team.find({});
                allTeams.forEach(t => targetRooms.push(String(t._id)));
              }

              for (const roomId of targetRooms) {
                const chatMsg = new ChatMessage({
                  roomId,
                  senderId: req.user.id,
                  senderName: 'System (Attendance Bot)',
                  message: messageText
                });
                await chatMsg.save();

                if (io) {
                  io.to(roomId).emit('new-message', chatMsg);
                }
              }
            } catch (chatErr) {
              console.error('Failed to post chatbot bulk update to rooms:', chatErr);
            }

            if (presentProcessed.length > 0) {
              responseLines.push(`✅ **Present**: ${presentProcessed.join(', ')}`);
            }
            if (absentProcessed.length > 0) {
              responseLines.push(`❌ **Absent**: ${absentProcessed.join(', ')}`);
            }
            if (presentProcessed.length === 0 && absentProcessed.length === 0) {
              responseLines.push(`⚠️ No matching user names found in database for present/absent lists.`);
            }

            return res.json({ response: responseLines.join('\n') });
          } else {
            return res.json({ response: `Could not find a meeting matching "${meetingPart}".` });
          }
        }
      }
    }
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
