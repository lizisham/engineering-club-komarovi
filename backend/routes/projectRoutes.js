const express = require('express');
const router = express.Router();
const { getProjects, createProject, deleteProject, getPendingProjects, approveProject } = require('../controllers/projectController');

// Define API routes
router.route('/')
    .get(getProjects)
    .post(createProject);

// IMPORTANT: /pending must come before /:id to prevent 'pending' from being treated as an id
router.route('/pending')
    .get(getPendingProjects);

router.route('/:id')
    .delete(deleteProject);

router.route('/:id/approve')
    .patch(approveProject);

module.exports = router;
