document.addEventListener('DOMContentLoaded', function () {
    // --- 1. Khởi tạo & Khai báo biến ---
    const navbar = document.getElementById('navbar');
    const dateInput = document.getElementById('dateInput');
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
    const BUSY_TIMES = ['19:00', '20:00'];
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzR0AEpjAXKootSoL5v9s-6V9UHC11-BlJu4gSxSWITTNn8CZLaKzEbrPAd6vqE8QL/exec';

    // --- 2. Hiệu ứng Navbar & Ngày mặc định ---
    if (navbar) {
        window.addEventListener('scroll', function () {
            navbar.classList.toggle('scrolled', window.scrollY > 40);
        });
    }

    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }

    // --- 3. Hàm tính tiền & Cập nhật giao diện ---
    function updatePrice() {
        if (!guestInput || !hoursInput) return;

        let guests = parseInt(guestInput.value) || 0;
        let hours = parseInt(hoursInput.value) || 0;

        // Cập nhật text hiển thị số lượng
        if (displayGuests) displayGuests.textContent = guests + ' người';
        if (displayHours) displayHours.textContent = hours + ' giờ';

        let tableTotal = guests * hours * RATE_PER_HOUR;
        let drinksTotal = 0;
        let hasCombo = false;

        // Tính tiền nước & kiểm tra combo
        if (preOrderSwitch && preOrderSwitch.checked) {
            drinkItems.forEach(item => {
                if (item.checked) {
                    drinksTotal += parseInt(item.value) || 0;
                    if (item.getAttribute('data-is-combo') === 'true') hasCombo = true;
                }
            });
            drinksRow?.classList.remove('d-none');
            if (displayDrinksPrice) {
                displayDrinksPrice.textContent = '+ ' + new Intl.NumberFormat('vi-VN').format(drinksTotal) + ' VNĐ';
            }
        } else {
            drinksRow?.classList.add('d-none');
        }

        // Ưu đãi: Miễn phí giờ chơi nếu chọn Combo và đi từ 4 người trở lên
        if (hasCombo && guests >= 4) {
            freePlaytimeRow?.classList.remove('d-none');
            if (displayFreePlaytime) {
                displayFreePlaytime.textContent = '- ' + new Intl.NumberFormat('vi-VN').format(tableTotal) + ' VNĐ';
            }
            tableTotal = 0;
        } else {
            freePlaytimeRow?.classList.add('d-none');
        }

        let total = tableTotal + drinksTotal;

        // Ưu đãi: Giảm 5% nếu thanh toán qua Ví điện tử/Chuyển khoản
        if (paymentMethod && paymentMethod.value === 'wallet') {
            total *= 0.95;
            qrContainer?.classList.remove('d-none');
            discountRow?.classList.remove('d-none');
        } else {
            qrContainer?.classList.add('d-none');
            discountRow?.classList.add('d-none');
        }

        // Hiển thị tổng tiền cuối cùng
        if (totalPrice) {
            totalPrice.textContent = new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(total);
        }
    }

    // --- 4. Lắng nghe sự kiện thay đổi ---
    [guestInput, hoursInput, paymentMethod].forEach(el => {
        el?.addEventListener('input', updatePrice);
        el?.addEventListener('change', updatePrice);
    });

    if (preOrderSwitch) {
        preOrderSwitch.addEventListener('change', function () {
            if (this.checked) {
                preOrderMenu?.classList.remove('d-none');
            } else {
                preOrderMenu?.classList.add('d-none');
                drinkItems.forEach(item => item.checked = false); // Bỏ chọn hết nếu tắt
            }
            updatePrice();
        });
    }

    drinkItems.forEach(item => item.addEventListener('change', updatePrice));

    // Kiểm tra khung giờ bận
    if (timeInput) {
        timeInput.addEventListener('input', function () {
            if (BUSY_TIMES.includes(this.value)) {
                timeWarning?.classList.remove('d-none');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.classList.add('opacity-50');
                    submitBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Hiện đã Hết Bàn';
                }
            } else {
                timeWarning?.classList.add('d-none');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-50');
                    submitBtn.innerHTML = '<i class="fa-solid fa-calendar-check fs-5"></i> XÁC NHẬN ĐẶT BÀN';
                }
            }
        });
    }

    // --- 5. Xử lý gửi Form (Validation + Google Sheets) ---
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        const nameInput = bookingForm.querySelector('input[type="text"]');
        const phoneInput = bookingForm.querySelector('input[type="tel"]');

        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Validation dữ liệu
            const nameVal = nameInput?.value.trim() || "";
            const phoneVal = phoneInput?.value.trim() || "";
            const phoneRegex = /^[0-9]{10}$/;

            if (nameVal === "") {
                alert('❌ Lỗi: Vui lòng nhập Họ và Tên.');
                nameInput?.focus();
                return;
            }
            if (!phoneRegex.test(phoneVal)) {
                alert('❌ Lỗi: Số điện thoại không hợp lệ (phải đủ 10 chữ số).');
                phoneInput?.focus();
                return;
            }

            // Gom danh sách đồ uống đã chọn
            let selectedItems = [];
            if (preOrderSwitch && preOrderSwitch.checked) {
                drinkItems.forEach(item => {
                    if (item.checked) selectedItems.push(item.getAttribute('data-name'));
                });
            }
            const comboString = selectedItems.length > 0 ? selectedItems.join(', ') : 'Không đặt trước';
            const paymentText = paymentMethod?.options[paymentMethod.selectedIndex].text || "Tiền mặt";

            // Hiệu ứng đang gửi
            const originalBtnContent = submitBtn.innerHTML;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi thông tin...';
            }

            // Chuẩn bị dữ liệu gửi đi Google Sheets
            const formData = new URLSearchParams();
            formData.append('customerName', nameVal);
            formData.append('phoneNumber', phoneVal);
            formData.append('bookingDate', dateInput?.value || "");
            formData.append('bookingTime', timeInput?.value || "");
            formData.append('hoursCount', hoursInput?.value || "0");
            formData.append('preOrderItems', comboString);
            formData.append('paymentMethod', paymentText);
            formData.append('totalPrice', totalPrice?.textContent || "");

            fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: formData
            })
                .then(() => {
                    let successMsg = `🎉 Cảm ơn ${nameVal}!\nĐơn đặt bàn lúc ${timeInput.value} ngày ${dateInput.value} đã được ghi nhận.`;
                    if (paymentMethod.value === 'wallet') {
                        successMsg += '\nVui lòng quét mã QR để hoàn tất thanh toán (Đã giảm 5%).';
                    }
                    alert(successMsg);

                    // Reset form và UI
                    bookingForm.reset();
                    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
                    updatePrice();
                })
                .catch(error => {
                    console.error('Lỗi!', error);
                    alert('Có lỗi xảy ra khi gửi dữ liệu. Vui lòng thử lại!');
                })
                .finally(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnContent;
                    }
                });
        });
    }

    // Chạy tính toán lần đầu khi load trang
    updatePrice();
});
