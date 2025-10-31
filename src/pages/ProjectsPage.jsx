import React, { useEffect, useRef } from "react";
import ProjectDetailModal from "../components/ProjectDetailModal"; 
import "./ProjectsPage.module.css";

const projects = [
  {
    id: 1,
    title: "Snuger",
    desc: "Snuger is a real-time chat platform built with Socket.io and MongoDB, designed for instant and reliable communication across devices. It focuses on fast message delivery, minimal design, and scalability, providing a strong foundation for future AI integrations.",
    details: "Snuger began as an experiment in building a robust, event-driven chat system. Using Socket.io for bi-directional communication, it supports instant message updates, read receipts, group chats, and user status tracking. The backend runs on Fastify and MongoDB, ensuring efficient handling of concurrent connections. The project also demonstrates modular architecture — separating routes, controllers, and WebSocket handlers for cleaner management. Beyond messaging, Snuger taught me how to handle data persistence and scalability challenges common to real-world apps. Its design encourages extendability, like integrating AI-driven assistants or analytics, making it a reliable base for future interactive systems.",
    tech: ["Socket.io", "Fastify", "MongoDB", "Node.js", "JavaScript"],
    bgImageUrl: "/images/Snuger.jpg"
  },
  {
    id: 2,
    title: "3D Website",
    desc: "An immersive 3D portfolio built using React Three Fiber (R3F) and Three.js. It blends design and interaction, transforming static web elements into a dynamic environment that reacts to user movement and light.",
    details: "This project began as a challenge — to make a personal website feel more alive than a simple list of links. Using React Three Fiber, I created an interactive 3D environment where models and animations respond to user input in real time. I integrated custom shaders and lighting effects to make transitions smooth and cinematic. The aim was to strike a balance between art and usability, maintaining fast performance while keeping visual depth. This project deepened my understanding of WebGL, 3D rendering pipelines, and optimization techniques for browser-based graphics. It now serves as both a portfolio and a living lab for creative experimentation.",
    tech: ["React Three Fiber", "Three.js", "JavaScript", "GLSL", "HTML/CSS"],
    bgImageUrl: "/images/3DWebsite.jpg"
  },
  {
    id: 3,
    title: "Cube Runner 3D Game",
    desc: "Cube Runner is a fast-paced 3D game prototype made in Unity, focused on reflexes and timing. It’s simple on the surface but demonstrates core game development mechanics like physics, collision, and procedural difficulty scaling.",
    details: "I built Cube Runner to explore real-time physics, player control systems, and procedural generation in Unity. The concept is straightforward — guide a cube through an obstacle path — but the underlying code involves dynamic difficulty, modular architecture, and performance-aware asset loading. It gave me hands-on experience with C# scripting, Unity’s physics engine, and scene management. I also designed a minimal UI and integrated audio cues to enhance player feedback. Though compact, this prototype taught me the essentials of rapid game prototyping, camera control, and input responsiveness — lessons that scale well into larger gameplay projects.",
    tech: ["Unity", "C#", "Physics Engine", "Game Design", "UI/UX"],
    bgImageUrl: "/images/Cube-Runner.png"
  },
  {
    id: 4,
    title: "Age Detection Camera",
    desc: "A computer vision project that detects and estimates a person’s age in real time using a live camera feed. Built with Python and OpenCV, it showcases machine learning in a practical, interactive setup.",
    details: "This project combines Python, OpenCV, and deep learning to create a real-time age prediction tool. The pipeline starts with face detection using Haar cascades or DNN-based models, followed by feeding the cropped faces into a pre-trained neural network for age estimation. The real-time feedback loop was implemented with efficient frame handling to maintain smooth video output. This project helped me understand preprocessing pipelines, model integration, and frame optimization for live systems. It’s practical for retail analytics, security verification, or smart camera setups. Beyond the tech, the process refined my grasp of how AI models interact with real-world data and hardware constraints.",
    tech: ["Python", "OpenCV", "Deep Learning", "NumPy", "TensorFlow"],
    bgImageUrl: "/images/FaceRec.jpg"
  },
  {
    id: 5,
    title: "Text to Image",
    desc: "A generative AI tool that converts written prompts into images, exploring the intersection of creativity and neural networks. It’s designed to make text-based imagination visually tangible.",
    details: "Built as part of my experimentation with transformer models, this project uses diffusion-based architecture and APIs for text-to-image synthesis. It interprets natural language descriptions and generates corresponding visual outputs. My focus was on prompt engineering — how phrasing changes the generated results — and on optimizing inference performance through caching and fine-tuned model weights. The system demonstrates how language models and image generators can collaborate, translating abstract ideas into coherent images. The project opened my path toward understanding multimodal AI systems and creative automation, where human intent meets algorithmic interpretation.",
    tech: ["Python", "Diffusion Models", "Transformers", "AI/ML", "APIs"],
    bgImageUrl: "/images/text2img.jpg"
  },
  {
    id: 6,
    title: "Expense Tracker",
    desc: "A personal finance tracker that helps users log and visualize expenses in real time. It’s a clean, responsive app focused on daily usability and performance.",
    details: "This project focuses on data-driven user experience. The tracker uses Node.js and MongoDB for backend storage, React for dynamic UI updates, and Chart.js for real-time expense visualization. I aimed to make the interface intuitive while maintaining consistent performance across devices. It features authentication, CRUD operations, and category-based filtering. Beyond coding, this project taught me the importance of data presentation — how meaningful visualizations can turn plain numbers into insights. It’s a strong example of applying full-stack development skills to solve an everyday problem with polish and functionality.",
    tech: ["React", "Node.js", "MongoDB", "Chart.js", "CSS"],
    bgImageUrl: "/images/Expence-Tracker.jpg"
  },
  {
    id: 7,
    title: "Telegram Chatbot",
    desc: "An intelligent Telegram bot designed to handle automated conversations, perform tasks, and assist users in real time using natural language understanding.",
    details: "This chatbot was built to explore conversational AI and automation. Using Python and the Telegram Bot API, it handles user commands, responses, and database interactions. I later integrated BERT-based models to improve contextual understanding, allowing the bot to hold more natural, adaptive conversations. It can fetch data, respond to user intents, and even connect with external APIs for automation. Through this project, I learned about NLP pipelines, intent mapping, and the subtle balance between predefined responses and generative ones. It reflects how conversational interfaces are becoming the new frontier for user interaction.",
    tech: ["Python", "Telegram Bot API", "BERT", "AI/NLP", "FastAPI"],
    bgImageUrl: "/images/PythonChatbot.jpg"
  },
  {
    id: 8,
    title: "ASCII Art Generator",
    desc: "A playful utility that transforms images or text into ASCII art, blending coding logic with visual creativity. It’s a compact project but visually expressive.",
    details: "I developed the ASCII Art Generator to explore how character mapping and pixel density could recreate visual depth using plain text. The algorithm reads image pixels, calculates brightness, and maps them to characters of varying intensity. It’s built with Python, using libraries like Pillow for image manipulation and NumPy for array operations. The output can be printed in the console or saved as a text file. This project gave me a deep appreciation for the creative potential in simple algorithms and how low-level data processing can produce aesthetically pleasing results. It remains one of my favorite small-scale experiments.",
    tech: ["Python", "Pillow", "NumPy", "ASCII Mapping", "CLI Tools"],
    bgImageUrl: "/images/AsciiArt.jpg"
  }
];

// --- End project data ---

export default function ProjectsPage({
  setScene,
  seasonalShadow,
  selectedProject,      // Prop from App
  setSelectedProject    // Prop from App
}) {
  const scrollerRef = useRef(null);
  const scrollAmountRef = useRef(0);

  const extendedProjects = [...projects, ...projects, ...projects];

  const handleScrollLeft = () => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({ left: -scrollAmountRef.current, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollBy({ left: scrollAmountRef.current, behavior: 'smooth' });
  };

  // Use the passed-in setSelectedProject
  const handleCardClick = (project) => {
    setSelectedProject(project);
  };

  useEffect(() => {
    setScene(null);

    const scroller = scrollerRef.current;
    if (!scroller) return;

    let scheduled = false;
    let isRepositioning = false;
    let blockWidth = 0;

    const setupScroller = () => {
      // Ensure enough children exist before calculating
      if (scroller.children.length > projects.length) {
        const firstCard = scroller.children[0];
        const secondBlockStartNode = scroller.children[projects.length];

        // Add checks to prevent errors if elements aren't found immediately
        if (!firstCard || !secondBlockStartNode) {
          console.warn("Card elements not ready for width calculation.");
          // Optionally retry after a short delay
          // setTimeout(setupScroller, 50);
          return;
        }

        blockWidth = secondBlockStartNode.offsetLeft - firstCard.offsetLeft;

        // Ensure blockWidth is a valid positive number
        if (isNaN(blockWidth) || blockWidth <= 0) {
            console.warn("Invalid blockWidth calculated:", blockWidth);
            // Optionally retry
            // setTimeout(setupScroller, 50);
            return;
        }

        scroller.scrollLeft = blockWidth;

        const cardStyle = getComputedStyle(firstCard);
        const cardWidth = parseFloat(cardStyle.width);
        const cardGap = parseFloat(getComputedStyle(scroller).gap) || 30; // Provide default gap
        scrollAmountRef.current = cardWidth + cardGap;

        requestAnimationFrame(animateCards);
      } else {
          console.warn("Not enough project cards rendered yet for infinite scroll setup.");
          // Optionally retry
          // setTimeout(setupScroller, 50);
      }
    };

    // Increased timeout for potentially slower rendering/layout
    const setupTimeout = setTimeout(setupScroller, 150);

    const animateCards = () => {
      if (!scroller) return;
      const scrollerCenter = scroller.offsetWidth / 2;

      for (const card of scroller.children) {
        const cardRect = card.getBoundingClientRect();
        const scrollerRect = scroller.getBoundingClientRect();
        // Check if scrollerRect has valid dimensions
        if (scrollerRect.width === 0) continue;

        const cardCenter = cardRect.left - scrollerRect.left + cardRect.width / 2;
        const distanceFromCenter = cardCenter - scrollerCenter;

        // Ensure scrollerCenter is not zero to prevent division by zero
        const rotation = scrollerCenter !== 0 ? (distanceFromCenter / scrollerCenter) * -15 : 0;
        const scale = scroller.offsetWidth > 0 ? 1 - Math.abs(distanceFromCenter) / (scroller.offsetWidth * 2) : 1;

        // Apply transform only if values are valid numbers
        if (!isNaN(rotation) && !isNaN(scale)) {
           card.style.transform = `rotateY(${rotation.toFixed(2)}deg) scale(${scale.toFixed(2)})`;
        }
      }
    };

    const onScroll = () => {
      // Add checks for valid numbers and conditions
      if (isRepositioning || blockWidth === 0 || isNaN(blockWidth)) return;

      const scrollLeft = scroller.scrollLeft;
       if (isNaN(scrollLeft)) return;

      // Adjust thresholds slightly to prevent rapid jumping if scroll momentum is high
      if (scrollLeft <= blockWidth * 0.1) {
        isRepositioning = true;
        scroller.scrollLeft += blockWidth;
        // Use timeout to allow rendering before resetting flag
        setTimeout(() => { isRepositioning = false; }, 50); // Small delay
      } else if (scrollLeft >= blockWidth * 1.9) {
         isRepositioning = true;
        scroller.scrollLeft -= blockWidth;
         setTimeout(() => { isRepositioning = false; }, 50); // Small delay
      }

      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(() => {
          animateCards();
          scheduled = false;
        });
      }
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(animateCards); // Call initially

    // Cleanup function
    return () => {
      clearTimeout(setupTimeout);
      if (scroller) { // Check scroller exists before removing listener
        scroller.removeEventListener("scroll", onScroll);
      }
    };
  // Add projects.length to dependencies to re-run effect if project count changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setScene, projects.length]);

  return (
    <div className="projects-page">
      <header className="projects-header">
        <h1
          className="sumi-title"
          style={{ textShadow: seasonalShadow }}
        >
          Projects
        </h1>
        <p className="projects-lead">
          Selected experiments — click to open.
        </p>
      </header>

      <button className="nav-arrow nav-arrow-left" onClick={handleScrollLeft} aria-label="Scroll left">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.75 19.5L8.25 12L15.75 4.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button className="nav-arrow nav-arrow-right" onClick={handleScrollRight} aria-label="Scroll right">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.25 4.5L15.75 12L8.25 19.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="projects-scroller" ref={scrollerRef} tabIndex={0} aria-label="Projects carousel">
        {extendedProjects.map((p, i) => (
          <article
            key={`${p.id}-${i}`} // Use original ID + index for uniqueness
            className="project-card"
            tabIndex={0}
            role="button"
            onClick={() => handleCardClick(p)}
            style={{
              backgroundImage: `url(${p.bgImageUrl})`
            }}
          >
            <div className="card-inner">
              <h3 className="project-title">{p.title}</h3>
              <p className="project-desc">{p.desc}</p>
            </div>
          </article>
        ))}
      </div>

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
