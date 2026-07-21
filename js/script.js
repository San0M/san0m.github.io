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
const particleColor = 'rgba(254, 244, 20, 0.8)'; 


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

document.addEventListener('DOMContentLoaded', () => {
    const donateModal = document.getElementById('donateModal');
    const openDonateBtn = document.getElementById('openDonate');
    const closeDonateBtn = donateModal.querySelector('.close-btn');

    openDonateBtn.addEventListener('click', () => {
        donateModal.classList.add('active');
    });

    closeDonateBtn.addEventListener('click', () => {
        donateModal.classList.remove('active');
    });

    const wechatModal = document.getElementById('wechatModal');
    const openWechatBtn = document.getElementById('openWechat');
    const closeWechatBtn = wechatModal.querySelector('.close-btn');

    openWechatBtn.addEventListener('click', () => {
        wechatModal.classList.add('active');
    });

    closeWechatBtn.addEventListener('click', () => {
        wechatModal.classList.remove('active');
    });

    window.addEventListener('click', (e) => {
        if (e.target === donateModal) {
            donateModal.classList.remove('active');
        }
        if (e.target === wechatModal) {
            wechatModal.classList.remove('active');
        }
    });
});

function copyToClipboard(elementId, btnElement) {
    const textToCopy = document.getElementById(elementId).innerText;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const icon = btnElement.querySelector('i');
        
        icon.classList.remove('fa-regular', 'fa-copy');
        icon.classList.add('fa-solid', 'fa-check');
        icon.style.color = '#06C755';
        
        setTimeout(() => {
            icon.classList.remove('fa-solid', 'fa-check');
            icon.classList.add('fa-regular', 'fa-copy');
            icon.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Не удалось скопировать текст: ', err);
    });
}
