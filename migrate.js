const fs = require('fs');

try {
    const companies = JSON.parse(fs.readFileSync('companies.json', 'utf8'));
    const updated = companies.map(c => ({
        ...c,
        level: c.level || 0,
        assets: c.assets || 0,
        sharePrice: c.sharePrice || 0,
        partners: c.partners || [],
        partnershipRequests: c.partnershipRequests || [],
        visaType: c.visaType || 'Basic'
    }));
    fs.writeFileSync('companies.json', JSON.stringify(updated, null, 2));
    console.log('Migration complete');
} catch (e) {
    console.error('Migration failed', e);
}
