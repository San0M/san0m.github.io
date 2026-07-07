const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);


const particlesArray = [];
const numberOfParticles = 100; 
const particleColor = 'rgba(255, 255, 255, 0.8)'; 


class Particle {
    constructor() {
        
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() * 2) - 1;
        this.speedY = (Math.random() * 2) - 1;
    }

    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        
        if (this.x > canvas.width || this.x < 0) {
            this.speedX = -this.speedX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.speedY = -this.speedY;
        }
    }

    
    draw() {
        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}


function init() {
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}


function animate() {
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
  
    requestAnimationFrame(animate);
}

init();
animate();
