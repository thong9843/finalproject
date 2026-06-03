const express = require('express');
const router = express.Router();
const structureController = require('../controllers/structureController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.use(verifyToken);

const isManagerOrAdmin = verifyRole(['ADMIN', 'FACULTY_MANAGER']);

router.get('/clusters', structureController.getClusters);
router.get('/departments', structureController.getDepartments);
router.get('/faculties', structureController.getFaculties);
router.get('/activity-types', structureController.getActivityTypes);
router.get('/scales', structureController.getScales);
router.get('/fields', structureController.getFields);
router.get('/act-types', structureController.getActTypes);
router.get('/targets', structureController.getTargets);

// Activity Types CRUD
router.post('/activity-types', isManagerOrAdmin, structureController.createActivityType);
router.put('/activity-types/:id', isManagerOrAdmin, structureController.updateActivityType);
router.delete('/activity-types/:id', isManagerOrAdmin, structureController.deleteActivityType);

// Fields CRUD
router.post('/fields', isManagerOrAdmin, structureController.createField);
router.put('/fields/:id', isManagerOrAdmin, structureController.updateField);
router.delete('/fields/:id', isManagerOrAdmin, structureController.deleteField);

// Departments CRUD
router.post('/departments', isManagerOrAdmin, structureController.createDepartment);
router.put('/departments/:id', isManagerOrAdmin, structureController.updateDepartment);
router.delete('/departments/:id', isManagerOrAdmin, structureController.deleteDepartment);

module.exports = router;
