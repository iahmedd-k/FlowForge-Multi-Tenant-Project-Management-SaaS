const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const tenantScope = require('../middleware/tenantScope');
const checkRole = require('../middleware/checkRole');
const { success, error } = require('../utils/response.util');
const Automation = require('../models/Automation');
const { AUTOMATION_CATALOG, AUTOMATION_KEYS, getAutomationDefinition } = require('../utils/automationCatalog');

router.use(verifyToken, tenantScope, checkRole('owner', 'admin'));

router.get('/', async (req, res) => {
  try {
    const { workspaceId } = req.query;
    if (workspaceId && String(workspaceId) !== String(req.workspaceId)) {
      return error(res, 'Workspace mismatch', 403);
    }

    const automations = await Automation.find({
      workspaceId: req.workspaceId,
      key: { $in: AUTOMATION_KEYS },
    }).sort({ createdAt: -1 });

    return success(res, { automations, catalog: AUTOMATION_CATALOG });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

router.put('/sync', async (req, res) => {
  try {
    const { workspaceId, automations = [] } = req.body || {};

    if (workspaceId && String(workspaceId) !== String(req.workspaceId)) {
      return error(res, 'Workspace mismatch', 403);
    }
    if (!Array.isArray(automations)) {
      return error(res, 'automations must be an array', 400);
    }

    const incomingKeys = new Set();
    for (const entry of automations) {
      if (!entry?.key || !AUTOMATION_KEYS.includes(entry.key)) {
        return error(res, `Unsupported automation key: ${entry?.key || 'unknown'}`, 400);
      }
      if (incomingKeys.has(entry.key)) {
        return error(res, `Duplicate automation key: ${entry.key}`, 400);
      }
      incomingKeys.add(entry.key);
    }

    await Automation.deleteMany({
      workspaceId: req.workspaceId,
      $or: [
        { key: { $exists: false } },
        { key: { $nin: AUTOMATION_KEYS } },
      ],
    });

    await Promise.all(
      AUTOMATION_KEYS.map(async (key) => {
        const incoming = automations.find((entry) => entry.key === key);
        const definition = getAutomationDefinition(key);
        return Automation.findOneAndUpdate(
          { workspaceId: req.workspaceId, key },
          {
            workspaceId: req.workspaceId,
            key,
            name: definition.name,
            isActive: Boolean(incoming?.isActive),
            config: { ...(definition.defaults || {}), ...(incoming?.config || {}) },
            createdBy: req.user.userId,
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      })
    );

    const nextAutomations = await Automation.find({
      workspaceId: req.workspaceId,
      key: { $in: AUTOMATION_KEYS },
    }).sort({ createdAt: -1 });

    return success(res, { automations: nextAutomations, catalog: AUTOMATION_CATALOG });
  } catch (err) {
    return error(res, err.message, 500);
  }
});

module.exports = router;
