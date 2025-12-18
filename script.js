const provinceSelect = document.getElementById("province");
const wardSelect = document.getElementById("ward");
const infoDiv = document.getElementById("info");
let data = {};
let wardTom; // TomSelect instance cho ward

// Helper: Render info table
function renderInfoTable(rows) {
  return `
    <div class="info-table">
      ${rows.map(row => `
        <div class="info-row${row.header ? ' info-row-header' : ''}">
          <div class="info-label">${row.label}</div>
          <div class="info-value">${row.value}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// Load data và khởi tạo dropdown
fetch('data.json')
  .then(res => res.json())
  .then(jsonData => {
    data = jsonData;

    // Render province options
    provinceSelect.innerHTML =
      `<option value=""></option>` +
      Object.keys(data).map(province =>
        `<option value="${province}">${province}</option>`
      ).join('');
    wardSelect.innerHTML = '';
    wardSelect.disabled = true;

    // Khởi tạo Tom Select cho tỉnh/thành phố
    const provinceTom = new TomSelect("#province", {
      create: false,
      allowEmptyOption: true,
      maxItems: 1,
      maxOptions: 999,
      searchField: ['text'],
      plugins: ['clear_button'],
      closeAfterSelect: true,
      hideSelected: false,
      onChange: function(value) {
        // Khi đổi tỉnh, reset ward
        if (wardTom) {
          wardTom.clearOptions();
          wardTom.clear();
          wardTom.disable();
        }
        wardSelect.innerHTML = '';
        infoDiv.textContent = "";

        // Nếu chọn tỉnh/thành phố, hiển thị info ngay
        if (value && data[value] && data[value]._info) {
          const info = data[value]._info;
          // Đếm số phường/xã và đặc khu
          let soPhuongXa = 0, soDacKhu = 0;
          Object.keys(data[value]).forEach(key => {
            if (key === "_info") return;
            const loai = data[value][key]?.loai;
            if (loai === "Đặc khu") soDacKhu++;
            else soPhuongXa++;
          });

          const soLuongRows = [
            { label: "Số phường/xã:", value: soPhuongXa },
          ];
          if (soDacKhu > 0) {
            soLuongRows.push({ label: "Số đặc khu:", value: soDacKhu });
          }

          infoDiv.innerHTML = renderInfoTable([
            { label: (info.loai ? info.loai : "Tỉnh/Thành phố") + ":", value: `<b>${info.ten}</b>`, header: true },
            { label: "Đơn vị cũ được sáp nhập:", value: info.donViCu, header: true },
            { label: "Diện tích:", value: info.dienTich },
            { label: "Dân số:", value: info.danSo },
            { label: "GRDP bình quân:", value: info.grdp },
            ...soLuongRows,
            { label: "Biển số xe:", value: info.bienSo }
          ]);
        }

        // Nếu có tỉnh, load danh sách phường/xã
        if (value && data[value]) {
          // Tạo danh sách option cho ward
          const wardOptions = Object.keys(data[value])
            .filter(ward => ward !== "_info")
            .map(ward => ({
              value: ward,
              text: ward
            }));

          // Nếu đã có wardTom thì cập nhật lại options, nếu chưa thì khởi tạo mới
          if (wardTom) {
            wardTom.clearOptions();
            wardTom.addOption(wardOptions);
            wardTom.refreshOptions(false);
            wardTom.clear();
            wardTom.enable();
          } else {
            wardTom = new TomSelect("#ward", {
              create: false,
              maxItems: 1,
              maxOptions: 999,
              searchField: ['text'],
              plugins: ['clear_button'],
              //placeholder: "Chọn Phường/Xã",
              allowEmptyOption: true,
              closeAfterSelect: true, // Đảm bảo dropdown tự đóng sau khi chọn
              hideSelected: false,
              onChange: function(value) {
                const province = provinceSelect.value;
                // Nếu chưa chọn phường/xã, hiển thị lại info tỉnh/thành
                if (province && (!value || value === "") && data[province] && data[province]._info) {
                  const info = data[province]._info;
                  infoDiv.innerHTML = renderInfoTable([
                    { label: (info.loai ? info.loai : "Tỉnh/Thành phố") + ":", value: `<b>${info.ten}</b>`, header: true },
                    
                    { label: "Đơn vị cũ được sáp nhập:", value: info.donViCu, header: true },
                    { label: "Diện tích:", value: info.dienTich },
                    { label: "Dân số:", value: info.danSo },
                    
                    { label: "GRDP bình quân:", value: info.grdp },
                    { label: "Số phường/xã:", value: info.soPhuongXa },
                    { label: "Biển số xe:", value: info.bienSo }
                  ]);
                  return;
                }
                // Nếu chọn phường/xã, hiển thị info chi tiết
                if (province && value && data[province] && data[province][value]) {
                  const detail = data[province][value];
                  infoDiv.innerHTML = renderInfoTable([
                    { label: (detail.loai ? detail.loai : "Phường/Xã") + ":", value: `<b>${value}</b>`, header: true },
                    { label: "Đơn vị cũ được sáp nhập:", value: detail.donViCu || "", header: true },
                    { label: "Diện tích:", value: detail.dienTich || "" },
                    { label: "Dân số:", value: detail.danSo || "" },
                    
                    { label: "Trụ sở hành chính (mới):", value: detail.tS || "" }
                  ]);
                } else {
                  infoDiv.textContent = "Vui lòng chọn phường/xã để xem Thông tin.";
                }
                
              },
   
            });
          }
        }
       
        const selectEl = this.input || this.control_input || this.control;
        if (selectEl && typeof selectEl.blur === 'function') {
        setTimeout(() => selectEl.blur(), 100);
        }
        
      },
      onItemAdd: function() {
        const selectEl = this.input || this.control_input || this.control;
        if (selectEl && typeof selectEl.blur === 'function') {
          selectEl.focus();
          setTimeout(() => selectEl.blur(), 100);
        }
      }
    });
    // provinceTom.clear(); // Đảm bảo luôn để trống khi load

    // Khởi tạo Tom Select cho phường/xã (ban đầu disable)
    wardTom = new TomSelect("#ward", {
      create: false,
      maxItems: 1,
      maxOptions: 999,
      searchField: ['text'],
      plugins: ['clear_button'],
      //placeholder: "Chọn Phường/Xã",
      allowEmptyOption: true,
      closeAfterSelect: true, // Đảm bảo dropdown tự đóng sau khi chọn
      hideSelected: false,
      onInitialize: function() {
        this.disable();
      },
      onChange: function(value) {
        const province = provinceSelect.value;
        if (province && (!value || value === "") && data[province] && data[province]._info) {
          const info = data[province]._info;
          // Đếm số phường/xã và đặc khu
          let soPhuongXa = 0, soDacKhu = 0;
          Object.keys(data[province]).forEach(key => {
            if (key === "_info") return;
            const loai = data[province][key]?.loai;
            if (loai === "Đặc khu") soDacKhu++;
            else soPhuongXa++;
          });

          const soLuongRows = [
            { label: "Số phường/xã:", value: soPhuongXa },
          ];
          if (soDacKhu > 0) {
            soLuongRows.push({ label: "Số đặc khu:", value: soDacKhu });
          }

          infoDiv.innerHTML = renderInfoTable([
            { label: (info.loai ? info.loai : "Tỉnh/Thành phố") + ":", value: `<b>${info.ten}</b>`, header: true },
            { label: "Đơn vị cũ được sáp nhập:", value: info.donViCu, header: true },
            { label: "Diện tích:", value: info.dienTich },
            { label: "Dân số:", value: info.danSo },
            
            { label: "GRDP bình quân:", value: info.grdp },
            ...soLuongRows,
            { label: "Biển số xe:", value: info.bienSo }
          ]);
          return;
        }
        if (province && value && data[province] && data[province][value]) {
          const detail = data[province][value];
          infoDiv.innerHTML = renderInfoTable([
            { label: (detail.loai ? detail.loai : "Phường/Xã") + ":", value: `<b>${value}</b>`, header: true },
            { label: "Đơn vị cũ được sáp nhập:", value: detail.donViCu || "", header: true },
            { label: "Bí thư Đảng ủy:", value: detail.bT || ""},
            { label: "Chủ tịch UBND:", value: detail.cT || ""},
            { label: "Diện tích:", value: detail.dienTich || "" },
            { label: "Dân số:", value: detail.danSo || "" },
            
            { label: "Trụ sở hành chính (mới):", value: detail.tS || "" }
          ]);
        } else {
          infoDiv.textContent = "Vui lòng chọn phường/xã để xem Thông tin.";
        }
        // Tự động ẩn bàn phím trên mobile khi chọn xong
        const selectEl = this.input || this.control_input || this.control;
        if (selectEl && typeof selectEl.blur === 'function') {
        setTimeout(() => selectEl.blur(), 100);
        }
      },
      onItemAdd: function() {
        const selectEl = this.input || this.control_input || this.control;
        if (selectEl && typeof selectEl.blur === 'function') {
          selectEl.focus(); // Đảm bảo input được focus trước
          setTimeout(() => selectEl.blur(), 100);
        }
      }
    });
  });

// CSS style cho Tom Select control (có thể bổ sung trong style.css)
const style = document.createElement('style');
style.textContent = `
  .ts-control input {
    font-size: 1.1rem !important;
    font-family: inherit !important;
  }
  /* Đừng ẩn input khi đã chọn! */
  /* .ts-wrapper.single.has-items .ts-control input {
    display: none !important;
  } */
`;
document.head.appendChild(style);

/*
HƯỚNG DẪN:
- Đảm bảo bạn đã import Tom Select và plugin clear_button trong file HTML:
  <link href="https://cdn.jsdelivr.net/npm/tom-select/dist/css/tom-select.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/tom-select/dist/js/tom-select.complete.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/tom-select/dist/js/plugins/clear_button.min.js"></script>
- Đảm bảo có 2 thẻ select với id="province" và id="ward" trong HTML.
*/
