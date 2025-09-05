function saveSettings() {
    const name = document.getElementById('line-name').value;
    const platform = document.getElementById('platform').value;
    const virtualId = document.getElementById('virtual-id').value;
    const virtualLink = document.getElementById('virtual-link').value;

    if(!name || !virtualId || !virtualLink) {
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
    }

    // ส่งข้อมูลไป backend
    fetch('/save_line_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, platform, virtualId, virtualLink })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            document.getElementById('status').innerText = 'สถานะ: เชื่อมต่อแล้ว';
        } else {
            document.getElementById('status').innerText = 'สถานะ: เชื่อมต่อไม่สำเร็จ';
        }
    });
}
