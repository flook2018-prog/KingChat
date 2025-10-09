// Fix Dark Mode Chat Message Colors
document.addEventListener('DOMContentLoaded', function() {
    function forceDarkModeMessageColors() {
        // ตรวจสอบว่าอยู่ในโหมดกลางคืนหรือไม่
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            // หาข้อความจากลูกค้า (ไม่ใช่ข้อความที่เราส่ง)
            const receivedMessages = document.querySelectorAll('.message:not(.sent) .message-bubble');
            
            receivedMessages.forEach(bubble => {
                // บังคับให้พื้นหลังเป็นสีขาว
                bubble.style.setProperty('background', '#FFFFFF', 'important');
                bubble.style.setProperty('color', '#000000', 'important');
                bubble.style.setProperty('font-weight', '700', 'important');
                
                // บังคับให้ทุก element ข้างในเป็นสีดำ
                const allElements = bubble.querySelectorAll('*');
                allElements.forEach(el => {
                    el.style.setProperty('color', '#000000', 'important');
                    el.style.setProperty('font-weight', '700', 'important');
                });
            });
        }
    }
    
    // เรียกใช้ทันทีเมื่อโหลดหน้า
    forceDarkModeMessageColors();
    
    // เรียกใช้เมื่อมีการเปลี่ยนธีม
    window.addEventListener('themeChanged', forceDarkModeMessageColors);
    
    // เรียกใช้เมื่อมีข้อความใหม่
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                forceDarkModeMessageColors();
            }
        });
    });
    
    // เฝ้าดูการเปลี่ยนแปลงใน chat messages container
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
        observer.observe(chatContainer, { childList: true, subtree: true });
    }
});