// สร้างเสียงแจ้งเตือนแบบ simple tone
export const createNotificationSound = (): HTMLAudioElement => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
  
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  const audio = new Audio();
  return audio;
};

// เล่นเสียงแจ้งเตือนโดยใช้ Web Audio API
export const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // สร้างเสียง beep อย่างง่าย
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // ตั้งค่าความถี่ (800Hz)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    
    // ตั้งค่าระดับเสียง
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    // เล่นเสียง
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    console.log('🔔 เล่นเสียงแจ้งเตือนสำเร็จ');
  } catch (error) {
    console.log('❌ ไม่สามารถเล่นเสียงแจ้งเตือนได้:', error);
    
    // Fallback: ใช้เสียง system bell
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAcBzmM1fPTgC4DI3LI8+OYTgwNUKbh8LpkGwQ4j9n1unIlBi15yPLZizoIGGS+8+OdUAwLTKXh8bliHgg6itf00okuAyJv');
      audio.volume = 0.3;
      audio.play();
    } catch (fallbackError) {
      console.log('❌ Fallback sound ก็เล่นไม่ได้:', fallbackError);
    }
  }
};

// สร้างเสียงแจ้งเตือนแบบ double beep
export const playDoubleBeepSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // เสียง beep แรก
    const playBeep = (delay: number, frequency: number = 800) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + delay + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.15);
      
      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + 0.15);
    };
    
    // เล่น 2 เสียง beep
    playBeep(0, 800);      // เสียงแรก
    playBeep(0.2, 1000);   // เสียงที่สอง (pitch สูงกว่า)
    
    console.log('🔔🔔 เล่นเสียงแจ้งเตือนแบบ double beep สำเร็จ');
  } catch (error) {
    console.log('❌ ไม่สามารถเล่นเสียงแจ้งเตือนได้:', error);
    playNotificationSound(); // fallback ไปเสียงเดี่ยว
  }
};