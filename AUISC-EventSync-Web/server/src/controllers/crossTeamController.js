import CrossTeamRequest from '../models/CrossTeamRequest.js';

export const submitRequest = async (req, res) => {
  try {
    const { fromTeamId, toTeamId, message } = req.body;
    const request = new CrossTeamRequest({ fromTeamId, toTeamId, senderId: req.userId, message });
    await request.save();
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const requests = await CrossTeamRequest.find()
      .populate('fromTeamId', 'name')
      .populate('toTeamId', 'name')
      .populate('senderId', 'name email');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveRequest = async (req, res) => {
  try {
    const { approverRole, status } = req.body;
    const updates = {};
    
    if (approverRole === 'from_lead') updates.fromLeadApproved = status;
    if (approverRole === 'to_lead') updates.toLeadApproved = status;
    if (approverRole === 'admin') updates.adminApproved = status;
    
    const request = await CrossTeamRequest.findByIdAndUpdate(
      req.params.id,
      { ...updates, updatedAt: Date.now() },
      { new: true }
    );
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
