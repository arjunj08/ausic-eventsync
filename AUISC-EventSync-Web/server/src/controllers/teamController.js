import Team from '../models/Team.js';
import Event from '../models/Event.js';

export const createTeam = async (req, res) => {
  try {
    const { name, eventId, color, description } = req.body;
    const team = new Team({ name, eventId, color, description });
    await team.save();
    
    await Event.findByIdAndUpdate(eventId, { $push: { teams: team._id } });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeams = async (req, res) => {
  try {
    const teams = await Team.find().populate('leadId', 'name email').populate('members', 'name email').populate('eventId', 'title');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('leadId', 'name email').populate('members', 'name email');
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const assignTeamLead = async (req, res) => {
  try {
    const { leadId } = req.body;
    const team = await Team.findByIdAndUpdate(req.params.id, { leadId, updatedAt: Date.now() }, { new: true }).populate('leadId');
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addTeamMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const team = await Team.findByIdAndUpdate(req.params.id, { $push: { members: memberId } }, { new: true }).populate('members');
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeTeamMember = async (req, res) => {
  try {
    const { memberId } = req.body;
    const team = await Team.findByIdAndUpdate(req.params.id, { $pull: { members: memberId } }, { new: true }).populate('members');
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTeam = async (req, res) => {
  try {
    const { name, color, description } = req.body;
    const team = await Team.findByIdAndUpdate(req.params.id, { name, color, description, updatedAt: Date.now() }, { new: true });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
