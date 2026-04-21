document.addEventListener('DOMContentLoaded', () => {
    const API_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
        ? 'http://localhost:5000/api/projects' 
        : '/api/projects';
    const projectGrid = document.getElementById('project-grid');

    // Navigation Logic
    const navLinks = document.querySelectorAll('.nav-link, .btn-yellow[data-page]');
    const pages = document.querySelectorAll('.page-view');

    function navigateTo(pageId) {
        if (pageId === 'projects') {
            navigateTo('home');
            setTimeout(() => {
                const projectsSection = document.getElementById('projects-section');
                if (projectsSection) {
                    projectsSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 50);
            return;
        }

        pages.forEach(page => {
            if (page.id === pageId) page.classList.add('active');
            else page.classList.remove('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.page === pageId) link.classList.add('active');
            else link.classList.remove('active');
        });
        
        window.scrollTo(0, 0);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.dataset.page;
            if (targetPage) navigateTo(targetPage);
        });
    });

    // Secret Admin Trigger
    const logoTexts = document.querySelectorAll('.logo-text, .logo-img');
    logoTexts.forEach(el => {
        el.addEventListener('dblclick', () => {
            navigateTo('admin');
        });
    });

    // Helper to get image URL from input
    function getImageUrl(url) {
        if (!url) return '';
        // Try to extract youtube ID for thumbnail
        const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch && ytMatch[1]) {
            return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
        }
        return url; // Assume it's a direct image link if not YouTube
    }

    // Live Image Preview Logic
    const linkInput = document.getElementById('project-link');
    const previewContainer = document.getElementById('image-preview-container');
    const previewImg = document.getElementById('image-preview-img');

    if (linkInput && previewContainer && previewImg) {
        linkInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
                const imageUrl = getImageUrl(url);
                previewImg.src = imageUrl;
                previewContainer.style.display = 'block';
            } else {
                previewContainer.style.display = 'none';
                previewImg.src = '';
            }
        });

        previewImg.addEventListener('error', () => {
            // Hide if image fails to load
            previewContainer.style.display = 'none';
        });
    }

    // Fetch and Render Projects from Backend
    async function fetchProjects() {
        if (!projectGrid) return;
        
        projectGrid.innerHTML = '<p style="text-align:center; color:gray; grid-column: 1/-1;">იტვირთება პროექტები (დარწმუნდით რომ Backend ჩართულია)...</p>';
        
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const projects = await response.json();
            renderProjects(projects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            projectGrid.innerHTML = '<p style="text-align:center; color:#ef4444; grid-column: 1/-1; padding: 2rem; border: 1px dashed #ef4444; border-radius: 8px;">ბექენდთან კავშირი ვერ მოხერხდა.<br>გთხოვთ ჩართოთ Node.js სერვერი: <b>npm start</b> backend საქაღალდეში.</p>';
        }
    }

    // Delete Project Logic (attached to window so onclick can see it)
    window.deleteProject = async function(id, event) {
        event.stopPropagation(); // Prevent opening the project when clicking delete
        
        if (!confirm('ნამდვილად გსურთ პროექტის წაშლა?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-passcode': window.adminPasscode || ''
                }
            });
            
            if (!response.ok) {
                if (response.status === 403) throw new Error('არასწორი პაროლი ან წვდომა შეზღუდულია');
                throw new Error('Failed to delete project');
            }
            
            alert('პროექტი წაიშალა');
            fetchProjects(); // Refresh the list
            if (window.adminPasscode) {
                if (typeof fetchPendingProjects === 'function') fetchPendingProjects();
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            alert(error.message || 'შეცდომა პროექტის წაშლისას.');
        }
    };

    function renderProjects(projects) {
        if (!projectGrid) return;
        
        projectGrid.innerHTML = '';
        
        if (projects.length === 0) {
            projectGrid.innerHTML = '<p style="text-align:center; color:gray; grid-column: 1/-1;">პროექტები ჯერ არ არის დამატებული. ატვირთეთ პირველი პროექტი!</p>';
            return;
        }

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.style.position = 'relative'; // For absolute positioning of delete button
            
            // Try to open link if valid URL
            card.onclick = () => {
                try {
                    new URL(project.image);
                    window.open(project.image, '_blank');
                } catch(e) {
                    console.log('Not a valid URL, cannot open');
                }
            };

            const authorInitials = project.author && project.author.length >= 2 
                ? project.author.substring(0, 2).toUpperCase() 
                : 'U';
            
            const dateStr = new Date(project.createdAt).toLocaleDateString('ka-GE');
            
            let imageSource = getImageUrl(project.image);
            if (!imageSource || !imageSource.startsWith('http')) {
                 imageSource = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80";
            }

            card.innerHTML = `
                ${window.adminPasscode ? `<button class="delete-btn" onclick="deleteProject('${project.id}', event)" title="წაშლა" style="position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 32px; height: 32px; color: #ef4444; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10; transition: all 0.2s;">🗑</button>` : ''}
                <div class="card-image-wrapper">
                    <img src="${imageSource}" alt="${project.title}" onerror="this.src='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80'">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${project.title}</h3>
                    <p class="card-desc">${project.description}</p>
                    
                    <div class="card-footer">
                        <div class="card-author">
                            <div class="author-avatar">${authorInitials}</div>
                            <div class="author-info">
                                <span class="author-name">${project.author}</span>
                                <span class="post-time">${dateStr}</span>
                            </div>
                        </div>
                        <div class="card-stats">
                            <div class="stat-item">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                0
                            </div>
                        </div>
                    </div>
                </div>
            `;
            projectGrid.appendChild(card);
        });
    }

    // Load projects initially
    fetchProjects();

    // Form Submission Logic
    const submitForm = document.getElementById('submit-form');
    if (submitForm) {
        submitForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = submitForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.textContent = 'ქვეყნდება...';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';
            
            const title = document.getElementById('project-title').value;
            const description = document.getElementById('project-desc').value;
            const author = document.getElementById('project-members').value;
            const image = document.getElementById('project-link').value;
            
            const newProject = { title, description, author, image };
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProject)
                });
                
                if (!response.ok) throw new Error('Failed to create project');
                
                alert('პროექტი წარმატებით აიტვირთა! ის გამოჩნდება მთავარ გვერდზე მას შემდეგ, რაც ადმინისტრატორი დაამტკიცებს.');
                submitForm.reset();
                if (previewContainer) previewContainer.style.display = 'none'; // hide preview
                navigateTo('home');
                
                // Refresh project list
                fetchProjects();
                
            } catch (error) {
                console.error('Error:', error);
                alert('შეცდომა! დარწმუნდით რომ Backend (Node.js) სერვერი ჩართულია.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }
        });
    }

    // --- Admin Logic ---
    window.adminPasscode = '';
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminPasscodeInput = document.getElementById('admin-passcode-input');
    const adminError = document.getElementById('admin-error');
    const adminLoginDiv = document.getElementById('admin-login');
    const adminContentDiv = document.getElementById('admin-content');
    const pendingProjectGrid = document.getElementById('pending-project-grid');

    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            const passcode = adminPasscodeInput.value.trim();
            if (!passcode) return;
            window.adminPasscode = passcode;
            fetchPendingProjects();
        });
    }

    window.fetchPendingProjects = async function() {
        if (!pendingProjectGrid) return;
        pendingProjectGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">იტვირთება დასამტკიცებელი პროექტები...</p>';
        adminError.style.display = 'none';

        try {
            const response = await fetch(`${API_URL}/pending`, {
                headers: { 'x-admin-passcode': window.adminPasscode }
            });

            if (!response.ok) {
                if (response.status === 403) throw new Error('Unauthorized');
                throw new Error('Network error');
            }

            const projects = await response.json();
            
            // Successfully logged in
            adminLoginDiv.style.display = 'none';
            adminContentDiv.style.display = 'block';
            
            renderPendingProjects(projects);
            
            // Also re-render public feed to show delete buttons since admin is logged in
            fetchProjects();
        } catch (error) {
            console.error('Admin fetch error:', error);
            window.adminPasscode = '';
            adminError.style.display = 'block';
        }
    };

    window.approveProject = async function(id, event) {
        event.stopPropagation();
        try {
            const response = await fetch(`${API_URL}/${id}/approve`, {
                method: 'PATCH',
                headers: { 'x-admin-passcode': window.adminPasscode }
            });
            if (!response.ok) throw new Error('Failed to approve');
            alert('პროექტი დამტკიცდა და გამოჩნდება მთავარ გვერდზე!');
            fetchPendingProjects();
            fetchProjects();
        } catch(e) {
            alert('შეცდომა დამტკიცებისას');
        }
    };

    function renderPendingProjects(projects) {
        pendingProjectGrid.innerHTML = '';
        if (projects.length === 0) {
            pendingProjectGrid.innerHTML = '<p style="text-align:center; color:gray; grid-column: 1/-1;">დასამტკიცებელი პროექტები არ არის.</p>';
            return;
        }

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.style.position = 'relative';
            
            let imageSource = getImageUrl(project.image);
            if (!imageSource || !imageSource.startsWith('http')) imageSource = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80";

            card.innerHTML = `
                <div style="position: absolute; top: 12px; right: 12px; z-index: 10; display: flex; gap: 8px;">
                    <button onclick="approveProject('${project.id}', event)" title="დამტკიცება" style="background: #22c55e; border: none; border-radius: 50%; width: 32px; height: 32px; color: white; font-weight: bold; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">✓</button>
                    <button onclick="deleteProject('${project.id}', event)" title="წაშლა" style="background: #ef4444; border: none; border-radius: 50%; width: 32px; height: 32px; color: white; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">🗑</button>
                </div>
                <div class="card-image-wrapper">
                    <img src="${imageSource}" alt="${project.title}">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${project.title}</h3>
                    <p class="card-desc">${project.description}</p>
                    <p style="font-size: 0.8rem; color: gray; margin-top: auto; padding-top: 10px; border-top: 1px solid #eee;">ავტორი: ${project.author}</p>
                </div>
            `;
            pendingProjectGrid.appendChild(card);
        });
    }
});
