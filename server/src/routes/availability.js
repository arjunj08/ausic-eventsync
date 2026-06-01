import express from 'express';
import Availability from '../models/Availability.js';
import Team from '../models/Team.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: Get Monday of the week for date normalization
const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// 1. Submit/Update Availability (POST /api/availability)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { weekOf, slots } = req.body;
    if (!weekOf || !slots || !Array.isArray(slots)) {
      return res.status(400).json({ error: 'Week starting date and slots array are required' });
    }

    const normalizedWeekOf = getMonday(weekOf);

    // Update if exists, else create new
    let availability = await Availability.findOne({
      userId: req.user.id,
      weekOf: normalizedWeekOf
    });

    if (availability) {
      availability.slots = slots;
    } else {
      availability = new Availability({
        userId: req.user.id,
        weekOf: normalizedWeekOf,
        slots
      });
    }

    await availability.save();
    res.status(201).json(availability);
  } catch (error) {
    console.error('Save availability error:', error);
    res.status(500).json({ error: 'Failed to save availability planner data' });
  }
});

// 2. Get Team Availabilities for a specific week (GET /api/availability/team/:teamId/week/:date)
router.get('/team/:teamId/week/:date', authMiddleware, async (req, res) => {
  try {
    const normalizedWeek = getMonday(req.params.date);
    const team = await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const availabilities = await Availability.find({
      userId: { $in: team.memberIds },
      weekOf: normalizedWeek
    }).populate('userId', 'name email avatar');

    res.json(availabilities);
  } catch (error) {
    console.error('Fetch team availabilities error:', error);
    res.status(500).json({ error: 'Failed to fetch team weekly availabilities' });
  }
});

// 3. Auto-Suggest Best Meeting Times (GET /api/availability/best-times/:teamId)
router.get('/best-times/:teamId', authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team || team.memberIds.length === 0) {
      return res.status(404).json({ error: 'Team not found or has no members' });
    }

    const memberCount = team.memberIds.length;
    const currentWeekMonday = getMonday(new Date());

    // Fetch all availabilities for the current week for team members
    const availabilities = await Availability.find({
      userId: { $in: team.memberIds },
      weekOf: currentWeekMonday
    });

    if (availabilities.length === 0) {
      return res.json({
        message: 'No availabilities submitted for this week. Ask team members to fill in schedules.',
        suggestions: []
      });
    }

    // Map slot keys to counts of available members
    // Key: "YYYY-MM-DD|HH:MM-HH:MM" -> { count, members: [] }
    const slotsMap = {};

    availabilities.forEach(av => {
      av.slots.forEach(slot => {
        if (slot.isAvailable) {
          const dateStr = slot.date.toISOString().split('T')[0];
          const key = `${dateStr}|${slot.startTime}-${slot.endTime}`;
          if (!slotsMap[key]) {
            slotsMap[key] = {
              date: slot.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              availableCount: 0,
              userIds: []
            };
          }
          slotsMap[key].availableCount += 1;
          slotsMap[key].userIds.push(av.userId);
        }
      });
    });

    // Convert map to array and sort by count descending
    const sortedSlots = Object.values(slotsMap).sort((a, b) => b.availableCount - a.availableCount);

    // Format top 3 suggestions
    const suggestions = sortedSlots.slice(0, 3).map(slot => {
      const dateObj = new Date(slot.date);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Convert "16:00" to "4:00 PM"
      const formatTime = (timeStr) => {
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${m} ${ampm}`;
      };

      const timeLabel = `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;

      return {
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableCount: slot.availableCount,
        totalMembers: memberCount,
        label: `${dayName} (${dateLabel}) at ${formatTime(slot.startTime)}`,
        subLabel: `${slot.availableCount} out of ${memberCount} members available (${Math.round((slot.availableCount / memberCount) * 100)}% free)`
      };
    });

    res.json({
      weekOf: currentWeekMonday,
      suggestions
    });
  } catch (error) {
    console.error('Calculate best times error:', error);
    res.status(500).json({ error: 'Failed to calculate best meeting times suggestions' });
  }
});

export default router;
