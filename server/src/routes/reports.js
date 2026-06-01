import express from 'express';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Meeting from '../models/Meeting.js';
import Expense from '../models/Expense.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Helper: Calculate statistics for a single team
const calculateTeamStats = async (teamId) => {
  const team = await Team.findById(teamId).populate('memberIds', 'name email avatar subRole');
  if (!team) return null;

  const memberIds = team.memberIds.map(m => m._id);

  // 1. Task Completion Stats
  const tasks = await Task.find({ teamId });
  const tasksAssigned = tasks.length;
  const tasksCompleted = tasks.filter(t => t.status === 'done').length;

  // 2. Average Task Completion Time
  let totalCompletionTimeMs = 0;
  let completedCountWithDates = 0;
  tasks.forEach(t => {
    if (t.status === 'done' && t.createdAt) {
      const completionTime = new Date(t.updatedAt || Date.now()) - new Date(t.createdAt);
      totalCompletionTimeMs += completionTime;
      completedCountWithDates++;
    }
  });
  const avgTaskCompletionTime = completedCountWithDates > 0 
    ? Math.round(totalCompletionTimeMs / (completedCountWithDates * 60 * 60 * 1000)) // In hours
    : 0;

  // 3. Meeting Attendance Stats
  const meetings = await Meeting.find({ status: 'completed' });
  let meetingsTotal = 0;
  let meetingsAttended = 0;

  meetings.forEach(m => {
    // Check if any attendee of the meeting is a member of this team
    const teamAttendees = m.attendees.filter(att => memberIds.some(mId => String(mId) === String(att.userId)));
    meetingsTotal += teamAttendees.length;
    meetingsAttended += teamAttendees.filter(att => att.status === 'present').length;
  });

  // 4. Expenses Stats
  const expenses = await Expense.find({ submittedBy: { $in: memberIds } });
  const expensesSubmitted = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const expensesApproved = expenses
    .filter(e => e.status === 'approved')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 5. Most Active Member
  let mostActiveMember = null;
  let maxCompletedTasks = -1;

  for (const member of team.memberIds) {
    const completedTasksCount = await Task.countDocuments({
      teamId,
      assignedTo: member._id,
      status: 'done'
    });
    if (completedTasksCount > maxCompletedTasks) {
      maxCompletedTasks = completedTasksCount;
      mostActiveMember = member;
    }
  }

  return {
    id: team._id,
    name: team.name,
    color: team.color,
    memberCount: team.memberIds.length,
    tasksAssigned,
    tasksCompleted,
    avgTaskCompletionTime,
    meetingsTotal,
    meetingsAttended,
    expensesSubmitted,
    expensesApproved,
    mostActiveMember: mostActiveMember ? {
      id: mostActiveMember._id,
      name: mostActiveMember.name,
      avatar: mostActiveMember.avatar,
      completedTasks: maxCompletedTasks
    } : null,
    members: team.memberIds
  };
};

// 1. Get all teams reports (GET /api/reports/teams)
router.get('/teams', authMiddleware, adminOnly, async (req, res) => {
  try {
    const teams = await Team.find({});
    const reports = [];
    for (const team of teams) {
      const stats = await calculateTeamStats(team._id);
      if (stats) {
        reports.push(stats);
      }
    }
    res.json(reports);
  } catch (error) {
    console.error('Fetch teams reports error:', error);
    res.status(500).json({ error: 'Failed to retrieve team performance reports' });
  }
});

// 2. Get single team report (GET /api/reports/teams/:teamId)
router.get('/teams/:teamId', authMiddleware, async (req, res) => {
  try {
    const stats = await calculateTeamStats(req.params.teamId);
    if (!stats) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(stats);
  } catch (error) {
    console.error('Fetch team report error:', error);
    res.status(500).json({ error: 'Failed to retrieve team report' });
  }
});

// 3. Export full report data (GET /api/reports/teams/export-pdf)
// Handled by the client side for rendering with jsPDF. We expose the raw data endpoint here.
router.get('/teams/export/raw', authMiddleware, adminOnly, async (req, res) => {
  try {
    const teams = await Team.find({});
    const reports = [];
    for (const team of teams) {
      const stats = await calculateTeamStats(team._id);
      if (stats) {
        reports.push(stats);
      }
    }
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export reports data' });
  }
});

export default router;
