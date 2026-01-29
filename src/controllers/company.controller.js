class CompanyController {
    static async getCompanyDetails(req, res) {
        try {
            const { companyId } = req.params;
            const userId = req.session.userId;
            const db = require('../db/index.js');

            const company = db.prepare('SELECT * FROM companies WHERE id = ? AND user_id = ?')
                .get(companyId, userId);

            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }

            res.json({ success: true, company });
        } catch (error) {
            console.error('Get company error:', error);
            res.status(500).json({ error: 'Failed to get company' });
        }
    }

    static async deleteCompany(req, res) {
        try {
            const { companyId } = req.params;
            const userId = req.session.userId;
            const db = require('../db/index.js');

            const company = db.prepare('SELECT * FROM companies WHERE id = ? AND user_id = ?')
                .get(companyId, userId);

            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }

            // Can't delete last company
            const count = db.prepare('SELECT COUNT(*) as count FROM companies WHERE user_id = ?')
                .get(userId).count;

            if (count <= 1) {
                return res.status(400).json({ error: 'Cannot delete your last company' });
            }

            db.prepare('DELETE FROM companies WHERE id = ?').run(companyId);
            res.json({ success: true, message: 'Company deleted' });
        } catch (error) {
            console.error('Delete company error:', error);
            res.status(500).json({ error: 'Failed to delete company' });
        }
    }

    static async listCompanies(req, res) {
        try {
            const userId = req.session.userId;
            const db = require('../db/index.js');

            const companies = db.prepare('SELECT * FROM companies WHERE user_id = ?')
                .all(userId);

            res.json({ success: true, companies });
        } catch (error) {
            console.error('List companies error:', error);
            res.status(500).json({ error: 'Failed to list companies' });
        }
    }
}

module.exports = CompanyController;
