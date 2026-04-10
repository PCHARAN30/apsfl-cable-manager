const Settings = require("../models/Settings");

/** GET /api/settings — fetch global settings */
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    // If no settings exist yet, create a default document
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** PUT /api/settings — update global settings */
exports.updateSettings = async (req, res) => {
  try {
    const { companyName, plans } = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    
    if (companyName !== undefined) settings.companyName = companyName;
    if (plans !== undefined) settings.plans = plans;
    
    await settings.save();
    res.json({ success: true, message: "Settings updated successfully", data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};