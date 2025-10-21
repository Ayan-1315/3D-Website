import React from 'react';
import './ProjectDetailModal.css'; // We'll create this CSS file next

export default function ProjectDetailModal({ project, onClose }) {
  if (!project) return null;

  // Prevent clicks inside the modal from closing it
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    // Backdrop - clicking this closes the modal
    <div className="modal-backdrop" onClick={onClose}>
      {/* Modal Content */}
      <div className="modal-content" onClick={handleModalContentClick}>
        {/* Close Button */}
        <button className="modal-close-button" onClick={onClose} aria-label="Close project details">
          &times; {/* Simple 'X' character */}
        </button>

        {/* Project Details */}
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
          {project.liveLink && (
            <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="modal-link-button">
              Live Demo
            </a>
          )}
          {project.githubLink && (
            <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="modal-link-button">
              View Code (GitHub)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}