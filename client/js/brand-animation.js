// KingChat Brand Text Animation
class BrandTextAnimation {
    constructor() {
        this.init();
    }

    init() {
        // รอให้ DOM โหลดเสร็จ
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAnimation());
        } else {
            this.setupAnimation();
        }
    }

    setupAnimation() {
        const brandTexts = document.querySelectorAll('.brand-text');
        
        brandTexts.forEach(brandText => {
            this.animateBrandText(brandText);
        });
    }

    animateBrandText(element) {
        if (!element) return;
        
        const text = element.textContent || element.innerText;
        if (text !== 'KingChat') return;
        
        // เคลียร์เนื้อหาเดิม
        element.innerHTML = '';
        
        // กำหนดสีตามตำแหน่ง
        const isInNavbar = element.closest('.navbar');
        const color = isInNavbar ? 'white' : 'var(--text-primary)';
        
        // สร้าง span สำหรับแต่ละตัวอักษร
        const letters = text.split('');
        letters.forEach((letter, index) => {
            const span = document.createElement('span');
            span.className = 'letter';
            span.textContent = letter;
            span.style.color = color;
            element.appendChild(span);
        });

        // เพิ่มเอฟเฟกต์เมื่อคลิก
        element.addEventListener('click', () => {
            this.replayAnimation(element);
        });
        
        // Listen for theme changes
        window.addEventListener('themeChanged', () => {
            this.updateTextColors(element);
        });
    }

    updateTextColors(element) {
        if (!element) return;
        
        const isInNavbar = element.closest('.navbar');
        const color = isInNavbar ? 'white' : 'var(--text-primary)';
        
        const letters = element.querySelectorAll('.letter');
        letters.forEach(letter => {
            letter.style.color = color;
        });
    }

    replayAnimation(element) {
        const letters = element.querySelectorAll('.letter');
        
        // รีเซ็ต animation
        letters.forEach(letter => {
            letter.style.animation = 'none';
            letter.offsetHeight; // force reflow
            letter.style.animation = '';
        });
    }

    // เมธอดสำหรับเปลี่ยนความเร็ว animation
    setAnimationSpeed(speed = 'normal') {
        const speeds = {
            slow: {
                duration: '1.2s',
                delays: [0.15, 0.3, 0.45, 0.6, 0.9, 1.05, 1.2, 1.35]
            },
            normal: {
                duration: '0.8s',
                delays: [0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9]
            },
            fast: {
                duration: '0.5s',
                delays: [0.05, 0.1, 0.15, 0.2, 0.3, 0.35, 0.4, 0.45]
            }
        };

        const config = speeds[speed] || speeds.normal;
        
        // สร้าง dynamic CSS
        const style = document.createElement('style');
        style.id = 'brand-animation-speed';
        
        // ลบ style เก่าถ้ามี
        const oldStyle = document.getElementById('brand-animation-speed');
        if (oldStyle) {
            oldStyle.remove();
        }

        let css = `
            .brand-text .letter {
                animation-duration: ${config.duration} !important;
            }
        `;

        config.delays.forEach((delay, index) => {
            css += `.brand-text .letter:nth-child(${index + 1}) { animation-delay: ${delay}s !important; }\n`;
        });

        style.textContent = css;
        document.head.appendChild(style);
    }
}

// เริ่มต้น animation เมื่อโหลดหน้า
const brandAnimation = new BrandTextAnimation();

// ให้สามารถเรียกใช้จาก console ได้
window.brandAnimation = brandAnimation;