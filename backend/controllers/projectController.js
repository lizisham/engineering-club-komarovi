const Project = require('../models/Project');

// GET /api/projects (Public, only approved)
const getProjects = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 0;
        
        const projects = await Project.find({ isApproved: true })
            .sort({ createdAt: -1 }) // Newest first
            .limit(limit);

        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching projects' });
    }
};

// POST /api/projects
const createProject = async (req, res) => {
    try {
        const { title, description, image, author } = req.body;

        // Basic validation
        if (!title || !description || !image || !author) {
            return res.status(400).json({ error: 'Please provide title, description, image, and author' });
        }

        const newProject = new Project({
            title,
            description,
            image,
            author
        });

        const savedProject = await newProject.save();
        res.status(201).json(savedProject);
    } catch (error) {
        res.status(500).json({ error: 'Server error while creating project' });
    }
};

// DELETE /api/projects/:id (Admin only)
const deleteProject = async (req, res) => {
    try {
        const adminPasscode = req.headers['x-admin-passcode'];
        if (adminPasscode !== (process.env.ADMIN_PASSCODE || 'komarovi_admin_2024')) {
            return res.status(403).json({ error: 'Unauthorized. Invalid admin passcode.' });
        }

        const project = await Project.findByIdAndDelete(req.params.id);
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.status(200).json({ message: 'Project deleted successfully', id: req.params.id });
    } catch (error) {
        res.status(500).json({ error: 'Server error while deleting project' });
    }
};

// GET /api/projects/pending (Admin only)
const getPendingProjects = async (req, res) => {
    try {
        const adminPasscode = req.headers['x-admin-passcode'];
        if (adminPasscode !== (process.env.ADMIN_PASSCODE || 'komarovi_admin_2024')) {
            return res.status(403).json({ error: 'Unauthorized. Invalid admin passcode.' });
        }

        const projects = await Project.find({ isApproved: false })
            .sort({ createdAt: -1 });

        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching pending projects' });
    }
};

// PATCH /api/projects/:id/approve (Admin only)
const approveProject = async (req, res) => {
    try {
        const adminPasscode = req.headers['x-admin-passcode'];
        if (adminPasscode !== (process.env.ADMIN_PASSCODE || 'komarovi_admin_2024')) {
            return res.status(403).json({ error: 'Unauthorized. Invalid admin passcode.' });
        }

        const project = await Project.findByIdAndUpdate(
            req.params.id, 
            { isApproved: true }, 
            { new: true }
        );
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.status(200).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Server error while approving project' });
    }
};

module.exports = {
    getProjects,
    createProject,
    deleteProject,
    getPendingProjects,
    approveProject
};
