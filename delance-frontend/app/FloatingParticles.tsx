const FloatingParticles = () => {
    const particles = Array.from({ length: 50 }); // Adjust number of particles
  
    return (
      <div
        className="animated-gradient"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%", // Ensures it covers the entire viewport
          zIndex: 0, // Pushes the particles to the background
          overflow: "hidden",
        }}
      >
        {particles.map((_, index) => (
          <span
            key={index}
            className="particle"
            style={{
              position: "absolute",
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
            }}
          ></span>
        ))}
      </div>
    );
  };
  
  export default FloatingParticles;
  