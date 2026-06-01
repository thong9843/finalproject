const enterpriseController = require('./backend/src/controllers/enterpriseController');
const studentController = require('./backend/src/controllers/studentController');
const activityController = require('./backend/src/controllers/activityController');
const mouController = require('./backend/src/controllers/mouController');
const chatbotController = require('./backend/src/controllers/chatbotController');
const pool = require('./backend/src/config/db');

function mockResponse() {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.jsonData = data;
        return res;
    };
    return res;
}

async function runTests() {
    const mockUser = { id: 1, role: 'ADMIN', faculty_id: 1 };

    console.log('--- RUNNING CONTROLLER DUPLICATE VALIDATION TESTS ---');

    // Fetch existing records to use for testing
    const [ents] = await pool.query('SELECT id, name, tax_code FROM enterprises WHERE is_deleted = 0 LIMIT 1');
    const [students] = await pool.query('SELECT id, student_code, name FROM students WHERE is_deleted = 0 LIMIT 1');
    const [activities] = await pool.query('SELECT id, enterprise_id, title FROM activities WHERE is_deleted = 0 LIMIT 1');
    const [mous] = await pool.query('SELECT id, enterprise_id, mou_code FROM mous WHERE is_deleted = 0 LIMIT 1');

    console.log('Using active enterprise:', ents[0]);
    console.log('Using active student:', students[0]);
    console.log('Using active activity:', activities[0]);
    console.log('Using active MOU:', mous[0]);

    // 1. Enterprise create validation
    if (ents.length > 0) {
        const req = {
            user: mockUser,
            body: { name: ents[0].name, tax_code: ents[0].tax_code }
        };
        const res = mockResponse();
        await enterpriseController.create(req, res);
        console.log('Enterprise create duplicate name status:', res.statusCode);
        console.log('Enterprise create duplicate name message:', res.jsonData);
    } else {
        console.log('Skipping Enterprise create validation (no active enterprise found)');
    }

    // 2. Student create validation
    if (students.length > 0) {
        const req = {
            user: mockUser,
            body: { student_code: students[0].student_code, name: students[0].name }
        };
        const res = mockResponse();
        await studentController.create(req, res);
        console.log('Student create duplicate code status:', res.statusCode);
        console.log('Student create duplicate code message:', res.jsonData);
    } else {
        console.log('Skipping Student create validation (no active student found)');
    }

    // 3. Activity create validation
    if (activities.length > 0) {
        const req = {
            user: mockUser,
            body: { title: activities[0].title, enterprise_id: activities[0].enterprise_id }
        };
        const res = mockResponse();
        await activityController.create(req, res);
        console.log('Activity create duplicate status:', res.statusCode);
        console.log('Activity create duplicate message:', res.jsonData);
    } else {
        console.log('Skipping Activity create validation (no active activity found)');
    }

    // 4. MOU create validation
    if (mous.length > 0) {
        const req = {
            user: mockUser,
            body: { mou_code: mous[0].mou_code, enterprise_id: mous[0].enterprise_id }
        };
        const res = mockResponse();
        await mouController.create(req, res);
        console.log('MOU create duplicate status:', res.statusCode);
        console.log('MOU create duplicate message:', res.jsonData);
    } else {
        console.log('Skipping MOU create validation (no active MOU found)');
    }

    // 5. Chatbot confirmInsert validation
    if (ents.length > 0) {
        const req = {
            user: mockUser,
            body: { actionType: 'create_enterprise', data: { name: ents[0].name } }
        };
        const res = mockResponse();
        await chatbotController.confirmInsert(req, res);
        console.log('Chatbot confirmInsert duplicate name status:', res.statusCode);
        console.log('Chatbot confirmInsert duplicate name message:', res.jsonData);
    } else {
        console.log('Skipping Chatbot confirmInsert validation (no active enterprise found)');
    }

    process.exit(0);
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
