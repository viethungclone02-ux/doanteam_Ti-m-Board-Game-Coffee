document.addEventListener('DOMContentLoaded', function() {
    // --- Navbar Effect ---
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // --- Date Initialization ---
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }

    // --- DOM Elements ---
    const guestInput = document.getElementById('guestCount');
    const hoursInput = document.getElementById('hoursCount');
    const displayGuests = document.getElementById('displayGuests');
    const displayHours = document.getElementById('displayHours');
    const totalPrice = document.getElementById('totalPrice');
    
    const timeInput = document.getElementById('timeInput');
    const timeWarning = document.getElementById('timeWarning');
    const submitBtn = document.getElementById('submitBtn');
    
    const paymentMethod = document.getElementById('paymentMethod');
    const qrContainer = document.getElementById('qrContainer');
    const discountRow = document.getElementById('discountRow');

    const preOrderSwitch = document.getElementById('preOrderSwitch');
    const preOrderMenu = document.getElementById('preOrderMenu');
    const drinkItems = document.querySelectorAll('.drink-item');
    const drinksRow = document.getElementById('drinksRow');
    const displayDrinksPrice = document.getElementById('displayDrinksPrice');
    const freePlaytimeRow = document.getElementById('freePlaytimeRow');
    const displayFreePlaytime = document.getElementById('displayFreePlaytime');

    const RATE_PER_HOUR = 25000;
    
    // Mảng giờ bận theo yêu cầu
    const BUSY_TIMES = ['19:00', '20:00'];

    // --- Tính tiền & Giảm giá ---
    function updatePrice() {
        if (!guestInput || !hoursInput) return;
        
        let guests = parseInt(guestInput.value);
        let hours = parseInt(hoursInput.value);
        
        // Tối ưu: Nếu NaN thì quy về 0. Nếu nhỏ hơn 0 thì quy về 0.
        if (isNaN(guests) || guests < 0) guests = 0;
        if (isNaN(hours) || hours < 0) hours = 0;
        
        if (displayGuests) displayGuests.textContent = guests + ' người';
        if (displayHours) displayHours.textContent = hours + ' giờ';
        
        // Tính tiền giờ
        let tableTotal = guests * hours * RATE_PER_HOUR;
        
        // Tính tiền nước
        let drinksTotal = 0;
        let hasCombo = false;
        
        if (preOrderSwitch && preOrderSwitch.checked) {
            drinkItems.forEach(item => {
                if(item.checked) {
                    drinksTotal += parseInt(item.value);
                    if (item.getAttribute('data-is-combo') === 'true') {
                        hasCombo = true;
                    }
                }
            });
            if (drinksRow) drinksRow.classList.remove('d-none');
            if (displayDrinksPrice) {
                displayDrinksPrice.textContent = '+ ' + new Intl.NumberFormat('vi-VN').format(drinksTotal) + ' VNĐ';
            }
        } else {
            if (drinksRow) drinksRow.classList.add('d-none');
        }
        
        // Cập nhật ưu đãi miễn phí giờ chơi (nếu chọn Combo và n >= 4)
        if (hasCombo && guests >= 4) {
            if (freePlaytimeRow) freePlaytimeRow.classList.remove('d-none');
            if (displayFreePlaytime) {
                displayFreePlaytime.textContent = '- ' + new Intl.NumberFormat('vi-VN').format(tableTotal) + ' VNĐ';
            }
            tableTotal = 0; // Miễn phí giờ chơi
        } else {
            if (freePlaytimeRow) freePlaytimeRow.classList.add('d-none');
        }
        
        let total = tableTotal + drinksTotal;
        
        // Giảm 5% nếu chọn ví điện tử/Chuyển khoản
        if (paymentMethod && paymentMethod.value === 'wallet') {
            total = total * 0.95; 
        }
        
        // Định dạng tiền tệ VNĐ
        if (totalPrice) {
            totalPrice.textContent = new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
            }).format(total);
        }
    }

    // Lắng nghe thay đổi input người/giờ
    if (guestInput) guestInput.addEventListener('input', updatePrice);
    if (hoursInput) hoursInput.addEventListener('input', updatePrice);

    // Lắng nghe thay đổi đồ uống
    if (preOrderSwitch) {
        preOrderSwitch.addEventListener('change', function() {
            if (this.checked) {
                if (preOrderMenu) preOrderMenu.classList.remove('d-none');
            } else {
                if (preOrderMenu) preOrderMenu.classList.add('d-none');
                // Bỏ chọn tất cả nếu tắt switch
                if (drinkItems) drinkItems.forEach(item => item.checked = false);
            }
            updatePrice();
        });
    }

    if (drinkItems) {
        drinkItems.forEach(item => {
            item.addEventListener('change', updatePrice);
        });
    }

    // --- Thanh toán & QR Code ---
    if (paymentMethod) {
        paymentMethod.addEventListener('change', function() {
            if (this.value === 'wallet') {
                // Hiện QR Code và dòng hiển thị giảm giá
                if (qrContainer) qrContainer.classList.remove('d-none');
                if (discountRow) discountRow.classList.remove('d-none');
            } else {
                // Ẩn QR Code và dòng hiển thị giảm giá
                if (qrContainer) qrContainer.classList.add('d-none');
                if (discountRow) discountRow.classList.add('d-none');
            }
            // Trigger tính lại giá để áp dụng giảm giá
            updatePrice();
        });
    }

    // --- Check Bàn (Busy times) ---
    if (timeInput) {
        timeInput.addEventListener('input', function() {
            const selectedTime = this.value; // Lấy khung giờ người dùng chọn
            
            if (BUSY_TIMES.includes(selectedTime)) {
                // Hiện cảnh báo và Khóa nút submit
                if (timeWarning) timeWarning.classList.remove('d-none');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.classList.add('opacity-50');
                    submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Hiện đã Hết Bàn';
                }
            } else {
                // Ẩn cảnh báo và Mở Khóa nút submit
                if (timeWarning) timeWarning.classList.add('d-none');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-50');
                    submitBtn.innerHTML = '<i class="fa-solid fa-calendar-check fs-5"></i> XÁC NHẬN ĐẶT BÀN';
                }
            }
        });
    }

    // Cập nhật giá trị đầu tiên trên UI
    updatePrice();

    // --- Form Validation (Giữ lại logic cũ) ---
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        const nameInput = bookingForm.querySelector('input[type="text"]');
        const phoneInput = bookingForm.querySelector('input[type="tel"]');

        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const nameVal = nameInput ? nameInput.value.trim() : '';
            if (nameVal === '') {
                alert('❌ Lỗi: Vui lòng nhập Họ và Tên của bạn.');
                if (nameInput) nameInput.focus();
                return;
            }
            
            const phoneVal = phoneInput ? phoneInput.value.trim() : '';
            if (phoneVal === '') {
                alert('❌ Lỗi: Vui lòng nhập Số điện thoại.');
                if (phoneInput) phoneInput.focus();
                return;
            }
            
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(phoneVal)) {
                alert('❌ Lỗi: Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số.');
                if (phoneInput) phoneInput.focus();
                return;
            }
            
            // Thông báo tùy theo hình thức thanh toán
            let successMsg = `🎉 Bàn của bạn lúc ${timeInput.value || 'giờ chọn'} đã được lưu thành công.`;
            if (paymentMethod && paymentMethod.value === 'wallet') {
                successMsg += '\nVui lòng đi tới ứng dụng Ngân hàng để quét mã QR hoàn tất thanh toán (Đã nhận ưu đãi giảm 5%).';
            } else {
                successMsg += '\nQuý khách vui lòng thanh toán tiền mặt trực tiếp tại quầy Board Game Cntral khi đến chơi.';
            }
            
            alert(successMsg);
            
            // Reset trạng thái sau submit
            this.reset();
            updatePrice(); 
            
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
            }
            
            if (qrContainer) qrContainer.classList.add('d-none');
            if (discountRow) discountRow.classList.add('d-none');
            
            if (timeWarning) timeWarning.classList.add('d-none');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50');
                submitBtn.innerHTML = '<i class="fa-solid fa-calendar-check fs-5"></i> XÁC NHẬN ĐẶT BÀN';
            }
        });
    }
});
