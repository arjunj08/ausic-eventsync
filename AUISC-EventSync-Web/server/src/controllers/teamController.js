const Team = require('../models/Team');
const Event = require('../models/Event');

exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate('memberIds', 'name email').populate('eventId');
    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('memberIds', 'name email')
      .populate('eventId');

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createTeam = async (req, res) => {
  try {
    const { name, color, eventId } = req.body;

    if (!name || !color || !eventId) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const team = await Team.create({
      name,
      color,
      eventId,
      memberIds: [req.user._id]
    });

    event.teamIds.push(team._id);
    await event.save();

    const populatedTeam = await team.populate('memberIds', 'name email');

    res.status(201).json({ success: true, data: populatedTeam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const { name, color } = req.body;

    if (name) team.name = name;
    if (color) team.color = color;

    await team.save();

    const populatedTeam = await Team.findById(team._id).populate('memberIds', 'name email');

    res.status(200).json({ success: true, data: populatedTeam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const event = await Event.findById(team.eventId);
    if (event) {
      event.teamIds = event.teamIds.filter(id => id.toString() !== team._id.toString());
      await event.save();
    }

    await Team.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Please provide a user ID' });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.memberIds.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User is already a member' });
    }

    team.memberIds.push(userId);
    await team.save();

    const populatedTeam = await Team.findById(team._id).populate('memberIds', 'name email');

    res.status(200).json({ success: true, data: populatedTeam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Please provide a user ID' });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    team.memberIds = team.memberIds.filter(id => id.toString() !== userId);
    await team.save();

    const populatedTeam = await Team.findById(team._id).populate('memberIds', 'name email');

    res.status(200).json({ success: true, data: populatedTeam });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
