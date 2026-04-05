const { error, success } = require('../utils/response.util');
const { generateAssistantReply } = require('../services/ai.service');

exports.askAssistant = async (req, res) => {
  try {
    const { prompt, context = {}, history = [], userName } = req.body || {};

    if (!prompt || !String(prompt).trim()) {
      return error(res, 'Prompt is required');
    }

    const reply = await generateAssistantReply({
      prompt: String(prompt).trim(),
      history,
      context,
      workspaceRole: req.workspaceRole || req.user?.role,
      userName: userName || req.user?.name,
    });

    return success(res, { reply });
  } catch (err) {
    console.error('[ai assistant error]', err.message);
    const status = err.message.includes('configured') ? 503 : 500;
    return error(res, err.message || 'Unable to generate an AI response right now.', status);
  }
};
