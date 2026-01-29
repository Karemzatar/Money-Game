class LegacyController {
    static async getCompaniesList(req, res) {
        try {
            const db = require('../db/index.js');
            const companies = db.prepare('SELECT * FROM companies LIMIT 100').all();
            res.json({ success: true, companies });
        } catch (error) {
            console.error('Get companies list error:', error);
            res.status(500).json({ error: 'Failed to get companies' });
        }
    }

    static async requestPartnership(req, res) {
        try {
            const userId = req.session.userId;
            const { partnerId } = req.body;

            if (!partnerId) {
                return res.status(400).json({ error: 'Partner ID required' });
            }

            res.json({ success: true, message: 'Partnership request sent' });
        } catch (error) {
            console.error('Request partnership error:', error);
            res.status(500).json({ error: 'Failed to request partnership' });
        }
    }

    static async acceptPartnership(req, res) {
        try {
            const userId = req.session.userId;
            const { requestId } = req.body;

            if (!requestId) {
                return res.status(400).json({ error: 'Request ID required' });
            }

            res.json({ success: true, message: 'Partnership accepted' });
        } catch (error) {
            console.error('Accept partnership error:', error);
            res.status(500).json({ error: 'Failed to accept partnership' });
        }
    }

    static async getLegacyData(req, res) {
        try {
            const { id } = req.params;
            const db = require('../db/index.js');

            const data = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);

            if (!data) {
                return res.status(404).json({ error: 'Data not found' });
            }

            res.json(data);
        } catch (error) {
            console.error('Get legacy data error:', error);
            res.status(500).json({ error: 'Failed to get data' });
        }
    }
}

module.exports = LegacyController;
