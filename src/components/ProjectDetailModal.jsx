import React from 'react';
import './ProjectDetailModal.css'; 

export default function ProjectDetailModal({ project, onClose }) {
  if (!project) return null;

  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={handleModalContentClick}>
        
        <button className="modal-close-button" onClick={onClose} aria-label="Close project details">
          &times; 
        </button>

        <div className="modal-scroll-area">
          <h2 className="modal-title">{project.title}</h2>
          
          <p className="modal-details">{project.details}</p>

          {project.tech && project.tech.length > 0 && (
            <div className="modal-tech-stack">
              <strong>Technologies:</strong>
              <ul>
                {project.tech.map((tech, index) => (
                  <li key={index}>{tech}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="modal-links">
            
            {/* --- LIVE DEMO BUTTON REMOVED --- */}

            {project.githubLink && (
              <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="modal-link-button">
                {/* --- TEXT WRAPPED IN SPAN --- */}
                <span className="modal-button-text">
                  View Code (GitHub)
                </span>
              </a>
            )}
          </div>
        </div> 

      </div>
    </div>
  );
}