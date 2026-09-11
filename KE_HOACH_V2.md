# KẾ HOẠCH V2 — CHUỖI VẬN HÀNH TRỌN VẸN · PK DIỆU SINH
*(Nguồn chuẩn thiết kế — cập nhật file này TRƯỚC khi code. Bản 1.0 — 19/08/2026, chốt cùng anh Khang)*

## 0. NGUYÊN TẮC THIẾT KẾ
1. **Mỗi bàn giao đúng 1 nút bấm** — thông tin đi theo ĐƠN, không ai phải hỏi lại bệnh nhân hay gõ lại.
2. **Chỉ tính tiền dịch vụ ĐÃ XÁC NHẬN** — chưa ai xác nhận thực hiện thì thu ngân không thể thu.
3. **Mọi bước có dấu thời gian + người thao tác** — để Tổng quan thấy dòng chảy và tìm chỗ nghẽn.
4. **Xác nhận DV: bác sĩ HOẶC trợ lý đều được** — hệ thống ghi lại ai xác nhận (quyết định 19/8).
5. **Chấm công: máy chung ở quầy** — bấm tên mình, Vào ca / Ra ca (quyết định 19/8).
6. **Xây từng đợt, mỗi đợt 1 lần publish.** Code viết & test trong sandbox, trình duyệt chỉ để publish + verify.
7. Không phá dữ liệu cũ: cột mới đều là cột THÊM, code cũ không gãy.

---

## 1. MÔ HÌNH DỮ LIỆU

### 1.1 Bảng SỬA (thêm cột — không đổi cột cũ)

**HANG_CHO** *(nay đóng vai trò ĐƠN DỊCH VỤ — giữ tên bảng)*
| Cột mới | Ý nghĩa |
|---|---|
| DV_YEU_CAU | Mã DV lễ tân chọn lúc tiếp nhận, cách nhau `\|` (vd `DV01\|DV05`) |
| BS_YEU_CAU | Bác sĩ BN muốn (trống = ai cũng được) |
| MA_HEN | Nếu check-in từ lịch hẹn |
| GIO_TIEP_NHAN / GIO_GOI / GIO_XONG / GIO_THU | HH:mm:ss từng mốc |
| LY_DO_HUY | Chỉ điền khi hủy đơn |

| UU_TIEN | `Có` = lên đầu hàng (BN có hẹn đến đúng giờ, ca gấp) — lễ tân/quản lý bấm |

TRANG_THAI mở rộng: `Chờ khám → Đang khám → Chờ kết quả → Xong khám → Đã thu` + `Hủy`.
(`Chờ kết quả` chỉ dùng khi có DV cận lâm sàng chưa xong — Đợt C.)

**VÃNG LAI vs CÓ HẸN (bổ sung 19/8):** cùng MỘT đường tạo đơn — khác nhau duy nhất là MA_HEN có hay không:
- Có hẹn → bấm Check-in từ panel "Hẹn hôm nay" (1 chạm, DV + BS gợi ý sẵn từ lịch hẹn).
- Vãng lai → tìm hồ sơ cũ hoặc tạo BN mới → chọn DV + BS như thường. MA_HEN trống.
- Hàng chờ hiển thị nhãn: 🗓 `hẹn 9:00` / 🚶 `vãng lai` — bác sĩ và lễ tân đều thấy ai là ai.
- Thứ tự mặc định = đến trước khám trước (STT). BN có hẹn đến ĐÚNG GIỜ mà phải chờ sau nhiều vãng lai → lễ tân bấm **"⬆ Ưu tiên"** (UU_TIEN=Có, sắp trước nhưng sau các ca ưu tiên trước đó). Ca gấp/cấp cũng dùng nút này. Không tự động hóa phức tạp — quyền quyết định ở lễ tân.

**SO_KHAM** *(mỗi dòng = 1 dịch vụ trong đơn)*
| Cột mới | Ý nghĩa |
|---|---|
| MA_CHO | Link về đơn (HANG_CHO.MA_CHO) |
| TRANG_THAI_DV | `Chỉ định` → `Đang làm` → `Hoàn thành` / `Hủy` |
| NGUOI_XAC_NHAN | Email người bấm Hoàn thành (BS hoặc trợ lý) |
| GIO_XAC_NHAN | HH:mm:ss |

**QUY TẮC VÀNG:** hóa đơn của thu ngân = tổng các dòng SO_KHAM có `TRANG_THAI_DV = Hoàn thành` thuộc đơn đó. Không hơn, không kém.

**LICH_HEN**: thêm `LOAI` (`Khám mới`/`Tái khám`), `TU_DONG` (`Có` nếu tạo từ nút hẹn tái khám).

### 1.2 Bảng MỚI

**LICH_LAM_VIEC** *(lịch làm việc cố định — quản lý sửa trực tiếp trong Sheet)*
`MA_LLV · TEN (khớp BAC_SI.TEN_BS hoặc NGUOI_DUNG.HO_TEN) · VAI_TRO · THU (2–7, CN, hoặc * = mọi ngày) · GIO_VAO · GIO_RA · CON_AP_DUNG · GHI_CHU`

**CHAM_CONG** *(thực tế vào/ra — sổ cái duy nhất, nhiều nguồn ghi vào)*
`MA_CC (CC00001…) · NGAY · TEN · VAI_TRO · GIO_VAO · GIO_RA · NGUON · GHI_CHU`
- NGUON = `may-quay` (bấm trên cham-cong.html) / `may-vantay` (nhập từ máy chấm công) / `sua-tay` (quản lý sửa, bắt buộc ghi chú).
- Bấm "Vào ca" → tạo dòng có GIO_VAO. Bấm "Ra ca" → điền GIO_RA vào dòng đang mở của người đó hôm nay.
- **KHẢ DỤNG** = có lịch hôm nay (đúng thứ, trong giờ) **và** đã Vào ca chưa Ra ca **và** không có đơn Đang khám.

**TÍCH HỢP MÁY CHẤM CÔNG VÂN TAY (bổ sung 19/8 — để số liệu trung thực, không bấm hộ được):**
- Thiết kế MÁY-NÀO-CŨNG-ĐƯỢC: mọi máy chấm công vân tay phổ biến ở VN (ZKTeco, Ronald Jack… ~1–3 triệu) đều xuất được file chấm công (.xls/.csv/.dat qua USB hoặc phần mềm kèm máy).
- Thêm cột **MA_NV** vào NGUOI_DUNG (và TEN_BS map tương ứng) = mã nhân viên khai trên máy vân tay.
- Trang cham-cong.html có khu QUẢN LÝ: nút **"Nhập file máy vân tay"** → dán/tải file xuất từ máy → hệ thống đọc (Mã NV, Ngày, Giờ), lần quẹt đầu trong ngày = GIO_VAO, lần cuối = GIO_RA → ghi vào CHAM_CONG với NGUON=may-vantay (ghi đè bản máy quầy cùng ngày nếu trùng — máy vân tay là nguồn tin cậy hơn).
- Tổng quan hiện cảnh báo khi máy quầy và máy vân tay lệch nhau > 15 phút (phát hiện bấm hộ).
- Nếu sau này mua máy có wifi/cloud (vd ZKTeco + BioTime): làm cầu tự động ở đợt riêng — sổ CHAM_CONG không đổi, chỉ thêm nguồn.
- Trong lúc CHƯA có máy: máy quầy vẫn chạy được ngay, dữ liệu cùng một bảng.

**TOA_THUOC** *(Đợt D — GHI CHÚ VẬN HÀNH 19/8 từ chị chủ)*: kê toa GIỮ NỘI BỘ/OFFLINE trước (chưa liên thông quốc gia — sẽ bàn riêng; thiết kế trường dữ liệu ĐỦ chuẩn TT26 ngay từ đầu để sau này bật liên thông không phải sửa). Dược sỹ NHẬN toa từ bác sĩ hoặc thư ký qua dashboard → thực hiện → toa LƯU VÀO HỒ SƠ BN → THU NGÂN XEM ĐƯỢC toa để đối chiếu phát đúng thuốc.
`MA_TOA (TT00001…) · NGAY · MA_CHO · MA_BN · BS_KE · NGUOI_NHAP (BS hoặc thư ký nhập hộ) · TRANG_THAI · GHI_CHU`
**TOA_CT** *(chi tiết toa)*: `MA_TOA · MA_THUOC · LIEU_LAN (viên/lần) · LAN_NGAY (lần/ngày) · SO_NGAY · THOI_DIEM (sáng/trưa/tối, trước/sau ăn) · SO_LUONG (tự tính = liều×lần×ngày, sửa được) · SL_PHAT (thực phát nếu thiếu) · GHI_CHU`

**AN TOÀN KÊ & PHÁT THUỐC (yêu cầu chị chủ 19/8 — chống nhầm/quá liều):**
1. **Liều dùng là LỰA CHỌN CHỦ ĐỘNG từng bệnh nhân** — người kê (BS hoặc thư ký) phải tự chọn/nhập cho mỗi dòng: thuốc nào · liều mỗi lần · mấy lần/ngày · trong bao nhiêu ngày · thời điểm dùng. KHÔNG tự điền sẵn liều (liều thường dùng chỉ hiện dạng gợi ý mờ bên cạnh, bấm mới lấy). Số lượng tự nhân từ liều (sửa tay được).
2. **Phát thuốc LUÔN là thao tác tay của dược sỹ, từng dòng một** — không có nút "phát tất cả": dược sỹ tick ✓ từng thuốc sau khi tự tay soát tên thuốc – hàm lượng – số lượng với toa; đủ hết các dòng thì nút "Đã phát" mới sáng. Áp dụng cho cả bước Soạn lẫn bước Phát.
3. Toa mẫu/lặp toa cũ (nếu dùng sau này) cũng chỉ đổ THUỐC vào toa, liều vẫn phải xác nhận từng dòng theo nguyên tắc 1.
- TRẠNG THÁI toa (đề xuất, chờ chốt): `Chờ soạn → Đã soạn → Đã phát` + `Hủy`. Dược soạn thuốc + xác nhận đủ hàng TRƯỚC khi thu tiền; PHÁT sau khi đơn `Đã thu`. Tồn khả dụng = tồn − thuốc đang soạn (giữ chỗ, tránh 2 toa tranh viên cuối).
- Dược bấm "Đã phát" → tự append KHO_GD loại `Xuất` từng dòng + set Đã phát. Kho không bao giờ trừ tay.
- Thu ngân: panel thanh toán hiện TOA (read-only) cạnh hóa đơn — đối chiếu túi thuốc với danh sách; hồ sơ BN có mục "Toa thuốc" xem/in lại các toa cũ.
- **QUYẾT ĐỊNH ĐÃ CHỐT (19/8):** trình tự `Soạn → Thu → Phát` ✓ · tiền thuốc GỘP CHUNG 1 hóa đơn (2 phần: Dịch vụ + Thuốc, thuốc tính theo GIA_BAN) ✓ · thư ký nhập toa hộ KHÔNG cần BS duyệt trên máy (ghi rõ BS kê + người nhập) ✓.

**BÁO CÁO DOANH THU CHO KẾ TOÁN (yêu cầu chị chủ 19/8):** Tổng quan thêm panel **"Doanh thu theo nhóm"**: Khám bệnh · Siêu âm · Xét nghiệm · Thuốc · Khác — lấy từ SO_KHAM ghép DICH_VU.NHOM (cần rà cột NHOM trong DICH_VU đặt đúng 1 trong các nhóm này), phần Thuốc từ toa đã thu (Đợt D). Doanh thu theo bác sĩ ĐÃ CÓ — sẽ thêm cột thuốc-do-BS-kê. Kế toán xem được như Quản lý (read-only). Xuất CSV theo nhóm + theo BS + theo ngày.

**MAU_GHI_CHU** *(Đợt C)*: `MA_MAU · TEN_MAU · NOI_DUNG · CON_AP_DUNG` — mẫu ghi chú khám soạn sẵn, quản lý sửa trong Sheet.

### 1.3 MẪU IN (bổ sung 19/8 — có mockup riêng để duyệt trước khi code)

**HÓA ĐƠN (in từ thu ngân, Đợt A):** 2 khổ — **A5 dọc** (máy in thường) và **80mm** (máy in nhiệt, Đợt E). Nội dung: logo + tên PK + địa chỉ/SĐT · số HĐ (MA_TT) + ngày giờ · BN (tên, mã, SĐT) · bảng DV **chỉ gồm dòng Hoàn thành** (tên, SL, đơn giá, thành tiền) · tổng — giảm (kèm lý do) — đã thu — còn lại · hình thức + ô QR chuyển khoản (khi có BANK_INFO) · tên thu ngân · lời cảm ơn. File mẫu: `mockup_hoa_don.html`.

**ĐƠN THUỐC (Đợt D) — PHÁP LÝ (tra cứu 19/8/2026):**
- TT 52/2017 ĐÃ HẾT HIỆU LỰC — thay bằng **Thông tư 26/2025/TT-BYT** (hiệu lực 01/07/2025). Mẫu đơn phải theo **Phụ lục I** với các trường bắt buộc: mã đơn thuốc (14 ký tự: 5 số mã cơ sở + 7 ký tự + 1 ký hiệu loại), tên/địa chỉ/ĐT cơ sở, họ tên BN, **số định danh cá nhân/CCCD/hộ chiếu**, ngày sinh, **cân nặng**, giới, **mã BHYT**, nơi cư trú, **SĐT BN**, người chăm sóc (trẻ <72 tháng), chẩn đoán, thuốc (tên hoạt chất INN với thuốc đơn thành phần; SL <10 ghi thêm số 0 phía trước; liều/lần + số lần/ngày + đường dùng + thời điểm + số ngày), lời dặn, ngày + chữ ký người kê. Đơn có giá trị lấy thuốc trong **05 ngày**; đơn thường tối đa 30 ngày thuốc.
- **BẮT BUỘC ĐƠN THUỐC ĐIỆN TỬ từ 01/01/2026** với phòng khám: ký số + gửi lên **Hệ thống đơn thuốc quốc gia** (donthuocquocgia.vn) ngay sau khám. Không tuân thủ: phạt ~3tr/lần, BHYT từ chối thanh toán.
- **LIÊN THÔNG BẰNG PHẦN MỀM TỰ VIẾT — ĐƯỢC (xác minh 19/8 từ Quyết định 808, tài liệu API chính thức trên donthuocquocgia.vn):** không có "kỳ thi chứng nhận" — chỉ cần đáp ứng chuẩn API + đăng ký 2 thứ:
  1. **Mã liên thông CƠ SỞ + mật khẩu**: chị đăng ký cơ sở trên donthuocquocgia.vn (giấy phép hoạt động + danh sách nhân sự PDF) → Sở Y tế duyệt.
  2. **app-name + app-key CHO PHẦN MỀM**: liên hệ đơn vị vận hành/hỗ trợ hệ thống để được cấp cho "phần mềm PK Diệu Sinh" (đây là bước "danh sách phần mềm" mà vài bài viết nhắc — bản chất là xin cấp khóa, không phải thi chứng nhận).
  CHUẨN KỸ THUẬT PHẢI ĐÁP ỨNG (QĐ 808): đăng nhập `/api/auth/dang-nhap-co-so-kham-chua-benh` (mã liên thông + mật khẩu → Bearer token 7 ngày) · gửi đơn `/api/v1/gui-don-thuoc` (JSON ~27 trường: thông tin BN, **chẩn đoán mã ICD-10**, thuốc, chữ ký số) · quản lý BS `/api/v1/them-bac-si`, `/xoa-bac-si` · mã đơn 14 ký tự · Content-Type JSON. → Apps Script gọi được hết bằng UrlFetchApp; app-key giấu trong Script Properties (không lộ ra frontend).
  VIỆC PHÁT SINH CHO ĐỢT D: thêm cột **MA_ICD** vào chẩn đoán (kèm danh mục ICD-10 sản phụ khoa hay dùng để BS chọn nhanh) · đăng ký danh sách BS lên hệ thống qua API · làm rõ cơ chế **chữ ký số** khi gửi qua API với đơn vị vận hành (điểm mờ duy nhất còn lại). LƯU Ý: QĐ 808 ban hành theo TT 27/2021; NHIC (Trung tâm Thông tin Y tế Quốc gia) có tài liệu API cập nhật 2026 — khi làm Đợt D lấy bản mới nhất từ nhic.vn.
  Phương án B nếu vướng cấp app-key: kê chính thức trên cổng web donthuocquocgia (miễn phí), hệ thống mình lưu bản nội bộ + trừ kho + in.
- Mẫu in `mockup_toa_thuoc.html` ĐÃ CẬP NHẬT theo Phụ lục I TT26/2025 (bản v2, 19/8).

**LƯU Ý HÓA ĐƠN:** bản in của thu ngân về pháp lý là **PHIẾU THU / BẢNG KÊ DỊCH VỤ** (chứng từ nội bộ — hợp pháp, in thoải mái). **HÓA ĐƠN theo luật thuế = hóa đơn điện tử** phát hành qua nhà cung cấp được cấp phép (Viettel/VNPT/MISA…) — không tự in được; chị xác nhận với kế toán xem phòng khám thuộc diện phát hành HĐĐT thế nào. Tiêu đề bản in sẽ đổi thành "PHIẾU THANH TOÁN" khi code Đợt A.

**API v0.5**: thêm các bảng trên vào READ_TABLES/WRITE_TABLES (LICH_LAM_VIEC + MAU_GHI_CHU chỉ READ — sửa trong Sheet).

---

## 2. LUỒNG CHUẨN CỦA MỘT BỆNH NHÂN

```
┌─ TIẾP NHẬN (lễ tân/thu ngân) ──────────────────────────────┐
│ • BN có hẹn → panel "Hẹn hôm nay" → bấm CHECK-IN (1 chạm)   │
│ • BN vãng lai → tìm/tạo hồ sơ                                │
│ • Chọn DV YÊU CẦU + chọn BS — hệ thống hiện từng BS:         │
│   🟢 trống · 🟡 đang khám (+n chờ) · ⚪ chưa vào ca · 🔴 nghỉ │
│ → Tạo ĐƠN: Chờ khám, STT, GIO_TIEP_NHAN,                     │
│   đồng thời ghi các dòng SO_KHAM trạng thái "Chỉ định"       │
└──────────────────────────────────────────────────────────────┘
┌─ KHÁM (bàn khám) ───────────────────────────────────────────┐
│ • Gọi tiếp theo → Đang khám, BS_KHAM, GIO_GOI, chuông        │
│ • Checklist DV hiện SẴN từ đơn — tick ✓ Hoàn thành từng dòng │
│   (BS hoặc trợ lý — ghi NGUOI_XAC_NHAN + GIO_XAC_NHAN),      │
│   thêm/bớt DV được, bớt thì dòng đó = Hủy (không tính tiền)  │
│ • Có DV cận lâm sàng chưa xong → đơn sang "Chờ kết quả",     │
│   kết quả về → trợ lý bấm Hoàn thành (Đợt C)                 │
│ • (Đợt C) Nút HẸN TÁI KHÁM: 1/2/4/6 tuần hoặc mốc thai kỳ    │
│ • (Đợt D) Kê toa thuốc → TOA_THUOC "Chờ phát"                │
│ • Xong khám → GIO_XONG                                       │
└──────────────────────────────────────────────────────────────┘
┌─ THANH TOÁN (thu ngân) ─────────────────────────────────────┐
│ • Hóa đơn = CHỈ các dòng Hoàn thành của đơn                  │
│ • Giảm giá cần lý do · thu thiếu bị gắn cờ (như hiện tại)    │
│ • Đã thu → GIO_THU · in hóa đơn                              │
└──────────────────────────────────────────────────────────────┘
┌─ PHÁT THUỐC (dược sỹ — Đợt D) ──────────────────────────────┐
│ • Toa "Chờ phát" → xác nhận Đã phát → kho tự trừ, in toa     │
└──────────────────────────────────────────────────────────────┘
Hủy đơn: lễ tân/quản lý, bắt buộc lý do → thống kê BN bỏ về/no-show.
```

---

## 2b. HỒ SƠ BỆNH NHÂN 360° (chính thức hóa — yêu cầu 19/8, đưa vào ĐỢT A)

**Nguyên tắc: TÊN BỆNH NHÂN Ở ĐÂU CŨNG BẤM ĐƯỢC** — trong hàng chờ thu ngân, hàng chờ bàn khám, kết quả tìm kiếm, danh sách hẹn, sổ khám… bấm tên → mở ngay HỒ SƠ đầy đủ. Cùng MỘT hồ sơ trên mọi màn hình (một bộ code dùng chung, dữ liệu từ các bảng sẵn có — không cần bảng mới).

Bố cục hồ sơ (modal lớn, các khối):
1. **Hành chính**: họ tên, mã BN, năm sinh/tuổi, giới, SĐT, địa chỉ, ngày lập — sửa được tại thu ngân/thư ký (quyền như hiện tại).
2. **⚠ Tiền sử / dị ứng** (TIEN_SU + GHI_CHU): khung nổi bật màu vàng, luôn hiện trên cùng — BS và thư ký sửa được.
3. **Thai kỳ hiện tại** (nếu có, từ THAI_KY): tuần thai hôm nay, dự sinh, mốc khám sắp tới.
4. **Lịch sử khám**: các lượt SO_KHAM gộp theo ngày/đơn — dịch vụ, BS, trạng thái xác nhận, ghi chú khám.
5. **Thanh toán**: các hóa đơn THANH_TOAN (ngày, tổng, đã thu, còn nợ, hình thức).
6. **Lịch hẹn**: hẹn sắp tới + lịch sử hẹn (đến/hủy).
7. **Toa thuốc** (từ Đợt D): các toa cũ, xem/in lại.
8. Nút hành động theo vai trò: ➕ vào hàng chờ (chặn trùng) · ➕ thêm DV · 📅 đặt hẹn · ✏ sửa hồ sơ.

Đợt A làm khối 1–6 + nút hành động; khối 7 tự xuất hiện ở Đợt D.

## 3. THAY ĐỔI TỪNG MÀN HÌNH

**thu-ngan.html** — panel Hẹn hôm nay + Check-in 1 chạm · form tiếp nhận có chọn DV yêu cầu + chọn BS kèm trạng thái khả dụng · hóa đơn chỉ tính dòng Hoàn thành · nút Hủy đơn (bắt buộc lý do) · vẫn thêm DV tại quầy được (dòng thêm tại quầy tự coi là Hoàn thành vì thu ngân xác nhận trực tiếp với BN).

**ban-kham.html** — checklist DV từ đơn (tick sẵn theo yêu cầu) · nút ✓ Hoàn thành từng dòng (ai bấm hệ thống ghi người đó) · thêm DV phát sinh ngay trong khám · (C) nút Hẹn tái khám · (C) dropdown Mẫu ghi chú chèn vào ô ghi chú · (D) khối Kê toa (tìm thuốc còn tồn, SL, liều dùng) · board toàn phòng khám bổ sung trạng thái vào ca (⚪ chưa đến / 🟤 đã về).

**ban-thu-ky.html** — (C) tab Cận lâm sàng: danh sách DV `Đang làm` toàn phòng khám → bấm "Có kết quả" → dòng Hoàn thành, đơn nào đủ thì tự sang Xong khám · check-in từ hẹn tạo ĐƠN đầy đủ (kèm LY_DO làm DV yêu cầu gợi ý).

**duoc-sy.html** — (D) tab Toa chờ phát: xem toa, xác nhận Đã phát (tự trừ kho), in toa khổ nhỏ.

**tong-quan.html** — (Đợt A) BỎ nút "30 ngày" ở bộ lọc kỳ (trùng ý "Tháng này") → còn: **Hôm nay · 7 ngày · Tháng này** (+ sau này: Tháng trước, Tùy chọn từ–đến khi kế toán cần) · PIPELINE HÔM NAY: funnel Tiếp nhận → Đang khám → Chờ KQ → Chờ thu → Đã thu, kèm thời gian chờ trung bình từng khâu (tính từ GIO_*), khâu chậm nhất tô đỏ · (B) bảng giờ công tháng theo người (từ CHAM_CONG) · tỉ lệ hủy đơn/no-show · công suất BS = số ca / giờ có mặt.

**cham-cong.html (MỚI — máy chung ở quầy)** — đăng nhập 1 lần bằng tài khoản quầy (phiên 12h) · lưới thẻ tên toàn bộ nhân sự (từ NGUOI_DUNG + BAC_SI) · bấm tên → hộp xác nhận "Vào ca lúc HH:mm?" / "Ra ca?" · thẻ đang trong ca viền xanh + hiện giờ vào · ghi NGUON = email tài khoản máy để đối chiếu.

**index.html (hub)** — thêm tab 🕐 Chấm công (roles Thu ngân, Lễ tân, Quản lý).

---

## 4. THỨ TỰ XÂY (mỗi đợt = 1 commit + 1 deploy, xong đợt này mới sang đợt sau)

**SẮP XẾP LẠI 20/8/2026 (chốt với anh Khang):** ✅ A, DB, D đã xong · **CHẤM CÔNG KIỂU CŨ BỎ HẲN** (không máy quầy Vào/Ra ca, không nhập máy vân tay) — thay bằng Đợt B-mới "Lịch + Hiện diện" · iPad check-in: bỏ · TV kéo lên làm ngay.

| Đợt | Trạng thái | Nội dung |
|---|---|---|
| **A** | ✅ xong 20/8 | Chuỗi đơn dịch vụ, check-in, ưu tiên, phiếu A5, pipeline |
| **DB** | ✅ xong 20/8 | Chuyển Supabase (schema, RLS, realtime, migrate, mirror đêm) |
| **D** | ✅ xong 20/8 | Toa thuốc: kê → soạn → thu → phát, kho tự trừ, in TT26, gộp tiền thuốc |
| **E-TV** | 🔨 đang làm | **tv.html — TV phòng chờ**: khung to mỗi phòng BS đang khám hiện SỐ (KHÔNG tên — chốt 20/8, kín đáo cho PK phụ sản), dải "sắp tới" các số chờ, chuông + ĐỌC LOA từ TV khi gọi số (loa phát ở phòng chờ), banner "MỜI SỐ X VÀO PHÒNG BS Y" ~10s, realtime ~1s, đồng hồ + tên PK; nút 🔊 bấm 1 lần khi mở TV để mở khóa âm thanh (quy định trình duyệt); đăng nhập tài khoản phòng khám bất kỳ |
| **F-Vật tư** | ⏳ kế tiếp | **Kho vật tư tiêu hao + danh mục thiết bị** (chưa có trong bản 1.0 — anh Khang bổ sung 20/8, dược sỹ kiêm quản): bảng VAT_TU (mã, tên, ĐVT, nhóm, tồn tối thiểu) + VT_GD (nhập/xuất/kiểm kê — tồn tự tính, giống kho thuốc) · bảng THIET_BI (mã, tên, ngày mua, giá, bảo hành đến, chu kỳ bảo trì, lần bảo trì gần nhất, tình trạng, ghi chú) + nhắc đến hạn bảo trì trên Tổng quan · tab mới trong duoc-sy.html |
| **B-mới** | ⏳ chờ tài khoản BS | **Lịch + Hiện diện** (thay chấm công): LICH_LAM_VIEC (thứ, giờ vào/ra từng người — Quản lý sửa trong hệ thống) · bảng HIEN_DIEN (EMAIL, LAST_SEEN — trang tự đánh dấu mỗi ~60s khi đăng nhập) · BS "có mặt" = đúng lịch hôm nay + đang đăng nhập → chọn BS lúc tiếp nhận/gọi vào phòng hiện 🟢 có mặt / ⚪ chưa đến (theo lịch) / 🔴 nghỉ; điều phối siêu âm chỉ đề xuất BS siêu âm ĐANG CÓ MẶT · CẦN TRƯỚC: Gmail riêng từng BS nhập vào tab Nhân sự |
| **C** | ⏳ sau B | Cận lâm sàng (Chờ kết quả) · Hẹn tái khám 1 chạm · Mẫu ghi chú |
| **E-còn lại** | ⏳ cuối | In số thứ tự + phiếu in nhiệt 80mm |

Việc còn chờ chị: **BANK_INFO** (ô chuyển khoản) · **email nhân viên** vào NGUOI_DUNG (kèm vai trò: Thu ngân/Lễ tân/Bác sĩ/Thư ký/Dược sỹ/Kế toán) · **lịch làm việc** của từng người (để đổ vào LICH_LAM_VIEC) · **GIA_BAN** thuốc nào khác giá vốn · **logo** (cho mẫu in) · **duyệt 2 mẫu in** (hóa đơn + toa thuốc) · nếu đã có/định mua **máy chấm công vân tay**: cho biết hãng/model để em khớp định dạng file xuất.

## 4b. CHUẨN NGÔN NGỮ GIAO DIỆN (yêu cầu 19/8 — chuyên nghiệp, thân thiện, dùng cho môi trường phòng khám)

Áp dụng từ Đợt A cho MỌI màn hình (rà lại cả chữ cũ):
- **Thuật ngữ thống nhất** (một khái niệm – một từ, không đổi qua lại):
  Tiếp nhận · Bệnh nhân (viết tắt duy nhất: BN) · Hàng chờ · Số thứ tự (STT) · Đang khám · Chờ kết quả · Hoàn tất khám · Chờ thanh toán · Đã thanh toán · Phiếu thanh toán · Đơn thuốc · Soạn thuốc · Phát thuốc · Tồn kho · Vào ca / Ra ca · Lịch hẹn · Tái khám · Hồ sơ bệnh nhân.
- **Giọng văn**: ngắn gọn, lịch sự, chủ động ("Chọn bác sĩ khám", không "bạn phải chọn…"); không tiếng lóng, không emoji lạm dụng trong chữ chính (icon chỉ để nhận diện nhanh ở nút/nhãn); dấu tiếng Việt đầy đủ, viết hoa đúng chuẩn (viết hoa chữ đầu câu/nhãn, KHÔNG VIẾT HOA TOÀN BỘ trừ tiêu đề in).
- **Thông báo lỗi/cảnh báo**: nói rõ chuyện gì + cách xử lý ("Bệnh nhân đã có trong hàng chờ — số 3, đang khám" thay vì "Lỗi trùng"). Không đổ lỗi cho người dùng.
- **Nút bấm**: động từ rõ nghĩa ("Tiếp nhận", "Hoàn tất khám", "Thu tiền", "Phát thuốc") — tránh "OK/Đồng ý" chung chung.
- **Số liệu**: tiền định dạng 1.234.567 đ; ngày dd/MM/yyyy; giờ HH:mm.
- Rà soát toàn bộ chữ hiện có trong Đợt A (thu ngân, bàn khám, thư ký, tổng quan, dược, hub) theo chuẩn này.

## 4c. NHẬT KÝ XÂY DỰNG
- **BS thực hiện theo TỪNG dịch vụ siêu âm + bỏ Hay dùng (11/9/2026):** Bàn khám bỏ dải chip "Hay dùng"; dòng chỉ định SIÊU ÂM có ô chọn "TH: …" (BS Mai Anh/BS Phúc/phòng nào trống) — BS ra y lệnh chọn vì mỗi BS SA làm được dịch vụ khác nhau; lưu tạm vào SO_KHAM.BS_THUC_HIEN (không thêm cột). Điều phối SA theo TỪNG DÒNG: ghim ai thì vào hàng chờ người đó (ghim > yêu cầu chung của lượt); người được ghim đang bận + phòng SA kia trống → gợi ý nhận thay như cũ. Khi XÁC NHẬN thực hiện, BS cùng loại phòng bấm ✓ thì ghi đè bằng người làm THẬT — báo cáo Doanh thu theo bác sĩ (thực hiện/chỉ định) tự đúng để trả lương theo thực làm. Lễ tân chọn "Bác sĩ siêu âm" ở tiếp nhận cũng ghim thẳng vào từng dòng SA. version.json → 2026-09-11.6.
- **XN gửi lab: LUÔN tính tiền + đồng bộ mọi màn hình (11/9/2026):** XN nhóm Xét nghiệm chưa xác nhận vẫn nằm trong danh sách TÍNH TIỀN (phòng khám là bên chỉ định) với nhãn vàng 'gửi lab — chưa lấy mẫu' + nút ✓ nhỏ; nút 'Đủ DV — thanh toán' ở hàng chờ không còn bị XN chặn; khi THU TIỀN, mọi XN còn treo tự chuyển Hoàn thành (ghi 'tự xác nhận khi thanh toán') → sau thanh toán mọi màn hình thống nhất một trạng thái. Bệnh án (profile.js) đọc thêm DICH_VU: dòng XN Chỉ định hiện 'gửi lab — chưa lấy mẫu (vẫn tính tiền)' thay vì 'chưa thực hiện', tổng lần khám gồm cả XN treo; Hành trình cột Chờ thanh toán cũng cộng XN treo; Bàn khám dòng chờ ghi '(XN gửi lab — vẫn tính tiền · ✓ khi đã lấy mẫu)'. version.json → 2026-09-11.5.
- **XN gửi lab ngoài — hết kẹt thanh toán (11/9/2026):** (1) Bảng thanh toán: dòng chỉ định chưa xác nhận thuộc nhóm XÉT NGHIỆM có nút "✓ Đã lấy mẫu — hoàn thành" (+ nút gộp khi nhiều XN) — thu ngân bấm được, ghi rõ người xác nhận + ghi chú 'XN gửi lab ngoài — thu ngân xác nhận đã lấy mẫu', tiền cập nhật ngay; khám/SA/thủ thuật vẫn CHỈ bác sĩ xác nhận · (2) Chống quên tại nguồn: bác sĩ bấm Hoàn tất khám mà còn XN chưa đánh dấu → hỏi 'Đã lấy mẫu xong chưa? OK = hoàn thành luôn'; kết quả lab về sau vẫn nhập bằng ✎ KQ như thường. version.json → 2026-09-11.4.
- **Toàn hệ thống chạy theo GIỜ VIỆT NAM (11/9/2026):** phát hiện anh Khang ở múi giờ khác thấy hàng chờ trống trong khi nhân viên thấy đầy — vì "hôm nay" trước đây lấy theo đồng hồ MÁY NGƯỜI XEM. Sửa: mọi hàm ngày/giờ (todayStr, nowTime, tdy, nowT, jnToday, jnMin, dayOffset, tiêu đề ngày, tháng mặc định báo cáo, quỹ giờ hẹn) đổi sang Asia/Ho_Chi_Minh trên cả 9 file. Máy ở đâu cũng thấy đúng ngày làm việc của phòng khám. version.json → 2026-09-11.3.
- **Phân công 2 bác sĩ: khám + siêu âm (11/9/2026):** cột mới HANG_CHO.BS_YEU_CAU_SA. Tiếp nhận: ô "Bác sĩ khám" chỉ liệt kê BS khám; đơn có siêu âm → hiện thêm ô "Bác sĩ siêu âm" (BS Mai Anh/BS Phúc, kèm trạng thái bận/trống) — cả 2 ô đều có "ai trống cũng được". Điều phối theo ĐÚNG LOẠI PHÒNG: phòng khám tôn trọng BS_YEU_CAU, phòng SA tôn trọng BS_YEU_CAU_SA. BS được yêu cầu đang TRỐNG → bệnh nhân chỉ nằm hàng chờ của BS đó; đang BẬN → hiện trong hàng chờ BS cùng loại phòng khác với nhãn vàng "YC BS X — đang bận, có thể nhận thay", bấm Gọi sẽ HỎI xác nhận (Cancel = giữ cho BS được yêu cầu, xét người kế). Gợi ý Gọi ở lễ tân ưu tiên BS SA được yêu cầu khi trống, nếu bận thì gợi ý phòng SA trống kèm ghi chú hỏi ý bệnh nhân. version.json → 2026-09-11.2.
- **Báo cáo cho Kế toán (11/9/2026, yêu cầu BS Thủy):** Tổng quan (màn hình vai trò Kế toán xem read-only) thêm 2 báo cáo: (1) **Doanh thu lũy kế** — bảng theo TUẦN (10 tuần) hoặc THÁNG (12 tháng, nút chuyển), mỗi kỳ: số hóa đơn · doanh thu đã thu · cột LŨY KẾ cộng dồn từ đầu năm, kỳ hiện tại tô đậm; (2) **Xuất – Nhập – Tồn thuốc** — chọn tháng, mỗi thuốc: tồn đầu kỳ + nhập − xuất ± kiểm kê = tồn cuối + giá trị tồn theo giá bán, có ô tìm, dòng TỔNG, nút **Xuất CSV** (mở được bằng Excel); combo không tính (không có tồn riêng). Tổng quan nạp thêm bảng KHO_GD. version.json → 2026-09-11.1.
- **Hành trình gắn thẳng vào hàng chờ (10/9/2026):** bỏ nút/cửa sổ "Hành trình" ở quầy lễ tân — thay bằng dải hành trình NHỎ ngay dưới mỗi dòng hàng chờ: 5 chấm tiến độ + đang ở bước nào ghi rõ việc ("chờ xét nghiệm — TSH", "đang siêu âm — BS Mai Anh", "chờ phát thuốc") + đồng hồ chờ tô màu, tự nhảy mỗi phút. hanh-trinh.js thêm PKJourney.rowStrip(maCho) (cache 3s); Tổng quan giữ nguyên bảng 7 cột. version.json → 2026-09-10.5.
- **Hành trình BN cho lễ tân (10/9/2026):** tách bảng hành trình ra module dùng chung **hanh-trinh.js** (tự chèn CSS, PKJourney.render). Tổng quan dùng module (bỏ code nội bộ); Quầy thu ngân/lễ tân thêm nút **"Hành trình"** trên thanh đầu → mở cửa sổ nổi bảng 7 cột y hệt Tổng quan, tự cập nhật realtime + đồng hồ mỗi phút khi đang mở. Lễ tân trả lời ngay "chị ấy tới đâu rồi?" mà không cần vào Tổng quan (Tổng quan vẫn chỉ Quản lý/Kế toán thấy doanh thu). version.json → 2026-09-10.4.
- **Hành trình BN — gọi tên đúng việc (10/9/2026):** thêm cột **Xét nghiệm / thủ thuật** (7 cột); bệnh nhân xếp cột theo VIỆC CÒN LẠI thật: chỉ còn SA → cột Siêu âm, chỉ còn XN/thủ thuật → cột Xét nghiệm, còn cả khám → cột chờ khám kèm 'còn: …' liệt kê từng dịch vụ; thẻ ghi rõ 'chờ làm — Beta HCG, TSH' thay vì chung chung; dòng thời gian chi tiết cũng gọi đúng tên bước. version.json → 2026-09-10.3.
- **Hành trình bệnh nhân (10/9/2026, đã duyệt mockup):** Tổng quan thêm bảng trực tiếp ngay dưới KPI — 6 cột suy THẲNG từ dữ liệu hàng chờ (không thêm trạng thái mới, không ai nhập gì thêm): Tiếp nhận–chờ khám (Chờ khám còn việc phòng khám) · Đang khám (Đang khám với BS khám) · Siêu âm (Đang khám với BS SA, hoặc Chờ khám mà chỉ còn việc SA) · Chờ thanh toán (Xong khám) · Nhà thuốc (Đã thu + toa Chờ soạn/Đã soạn) · Ra về (Đã thu, hết toa treo — kèm tổng thời gian tại PK). Thời gian chờ tính từ mốc thật (tiếp nhận / xong DV gần nhất / GIO_GOI / GIO_XONG / GIO_THU), tô xanh <15′ · vàng 15–30′ · đỏ >30′, đồng hồ tự nhảy mỗi phút + realtime. Bấm thẻ → dòng thời gian chi tiết từng bước của người đó (giờ từng dịch vụ, ai làm). version.json → 2026-09-10.2.
- **Đợt 10/9/2026 — 4 việc:** (1) **Người giới thiệu + hoa hồng 10%**: ô "Người giới thiệu" ở form Tiếp nhận và Đặt hẹn (gõ tự do + gợi ý tên đã dùng qua datalist — cột HANG_CHO.NGUOI_GT, LICH_HEN.NGUOI_GT; check-in từ hẹn tự mang tên sang); Tổng quan thêm bảng "Hoa hồng người giới thiệu" theo tháng = 10% × (siêu âm + xét nghiệm Hoàn thành, lượt Đã thu) · (2) **Lễ tân có chọn dịch vụ theo nhóm** giống bàn khám (2 dropdown + giữ ô tìm) · (3) **Combo thuốc** (BS Thủy): THUOC thêm cột THANH_PHAN ('T012:2|T045:1'); thêm T116 Combo Rg 650k, T117 Combo Orga/prim 1.350k (NHOM='Combo', chưa khai thành phần); kê toa như thuốc thường (không cảnh báo tồn); Bàn dược sỹ hiện "BỘ COMBO — lấy: 2× thuốc A · 1× thuốc B" kèm tồn từng món, phát → TRỪ KHO TỪNG THÀNH PHẦN (chưa khai thành phần thì cảnh báo + không trừ); combo ẩn khỏi Tồn kho/Nhập-Xuất/KPI (không có tồn riêng) · (4) Xác nhận: thư ký đã mirror đúng BS theo ca (PHAN_CONG) và đã gọi bệnh được — không cần sửa. CHỜ: chị Thủy gửi danh sách thuốc trong mỗi combo → điền THANH_PHAN; mockup tab "Hành trình bệnh nhân" cho Tổng quan chờ anh Khang duyệt. version.json → 2026-09-10.1.
- **Chọn dịch vụ theo NHÓM (07/9/2026, yêu cầu bác sĩ):** Bàn khám và Bàn thư ký (tab Nhập sổ khám) đổi sang 2 dropdown: **Nhóm dịch vụ** (Khám 5 · Siêu âm 23 · Xét nghiệm 97 · Thủ thuật 48) → **Dịch vụ** (xếp A→Z kèm giá; riêng Xét nghiệm chia 12 nhóm nhỏ trong dropdown: Huyết học/Đông máu/Sinh hoá/Miễn dịch/Viêm/SXH/Nước tiểu/Tuyến giáp/Nội tiết/Xương khớp–Tim mạch/Dấu ấn ung thư/Tiền sản + "Thường dùng" cho 10 XN cũ). Ô tìm gõ nhanh GIỮ LẠI bên dưới (nhỏ hơn) + chips "Hay dùng" giữ nguyên. Bàn thư ký tab Bàn khám là iframe nên tự có giao diện mới. Quầy thu ngân giữ ô tìm như cũ (theo anh Khang). version.json → 2026-09-07.3.
- **Sắp xếp lại Bàn dược sỹ (07/9/2026):** 8 tab → **3 tab theo chủ đề**: (1) **Toa thuốc** = Toa hôm nay + Toa đã phát · (2) **Kho — Thuốc & Vật tư** = Tồn kho thuốc + Nhập/Xuất/Kiểm kê + Vật tư + Lịch sử giao dịch (hàng tab con bên dưới) · (3) **Thiết bị**. **Quét mã** bỏ tab riêng → thành nút "▦ Quét mã" góc phải, mở CỬA SỔ NỔI dùng được từ bất kỳ tab nào. Chống nhầm việc: phải chọn chế độ TRƯỚC khi quét — mặc định **TRA CỨU** (chỉ xem tồn + giá, KHÔNG ghi gì; có nút +Nhập/−Xuất ngay trên kết quả), còn NHẬP kho / XUẤT kho mới ghi giao dịch; quét tem thiết bị thì mở hồ sơ máy ở mọi chế độ. Thêm **quét ngầm nền**: đang đứng ở tab nào cũng vậy, không cần bấm gì — súng quét bắn mã (chuỗi gõ nhanh + Enter) là cửa sổ tra cứu tự bật lên. version.json → 2026-09-07.2.
- **Nút "Cập nhật ngay" (07/9/2026):** thêm version.json + bộ kiểm tra trong supabase-api.js (5 phút/lần, bỏ qua khi chạy trong iframe). Trang đang mở thấy version.json đổi số → hiện thẻ xanh góc phải-dưới "Hệ thống có bản cập nhật mới — Cập nhật ngay", bấm mới reload (không tự reload giữa lúc làm việc). **QUY TRÌNH PUBLISH MỚI: mỗi đợt publish PHẢI tăng "v" trong version.json** (dạng YYYY-MM-DD.n) — quên tăng thì máy đang mở không được báo.
- **Cài như ứng dụng máy tính — PWA (07/9/2026):** thêm manifest.json + icon DS (192/512) + sw.js đăng ký trên 7 trang. Nhân viên mở trang trong Chrome/Edge → bấm nút **Cài đặt** trên thanh địa chỉ (hoặc menu ⋮ → "Cài đặt Phòng khám Diệu Sinh") → có icon riêng trên Desktop/taskbar, chạy trong cửa sổ riêng như phần mềm. Service worker CỐ TÌNH không cache gì — mọi lần mở đều tải bản mới nhất, publish là toàn phòng khám nhận ngay, không cần cài lại. Không làm bản .exe (Electron) vì mỗi lần sửa phải build + phát lại từng máy.
- **Thêm thuốc mới ngay trên web (07/9/2026):** tab Tồn kho của Bàn dược sỹ có khối "Thêm thuốc mới vào danh mục" (tên*, ĐVT, nhóm, giá bán, giá vốn, tồn tối thiểu) — mã T tự cấp tiếp (T116, T117…), cảnh báo nếu tên gần trùng thuốc có sẵn, thêm xong tự mở form NHẬP KHO để ghi tồn ban đầu. Dược sỹ và Quản lý đều dùng được (RLS đã cho phép ghi THUOC với mọi vai trò trừ Kế toán). Trước đây thêm thuốc chỉ làm được qua SQL editor.
- **Bảng giá dịch vụ 2026 (07/9/2026):** nhập từ 2 file của chị chủ (GIÁ KHÁM.docx + GÍA XN.xlsx) vào DICH_VU — 28 → **175 dịch vụ**. Cập nhật giá 10 mục cũ (Khám vô sinh 400k =Khám hiếm muộn; SA nhũ 400k Doppler; Huyết đồ 100k =Tổng PTTB máu; Đường huyết đói 60k; HbA1C 150k; Pap 700k =Liqui prep; Double/Triple 350k; NIPT 3.600k; βHCG 170k; CTG 200k). **DV402 'Đặt/tháo vòng' NGƯNG áp dụng** — thay bằng 12 mục vòng chi tiết (T380 600k, Mirena 3.600k, tháo có/không dây 200k/800k, thay 850k/1.550k, Pessary 600k, Implanon 3.100k…). Thêm mới: 1 khám (nội tiết), 12 siêu âm (DV112–123, NHOM='Siêu âm' nên tự chia phòng SA), 87 xét nghiệm (DV211–297, GHI_CHU ghi nhóm: Huyết học/Sinh hoá/Nội tiết/Tiền sản…), 47 thủ thuật (DV403–449). Giá file tính bằng nghìn → ×1.000. Ô tìm dịch vụ ở tiếp nhận là gõ-tìm nên 175 mục không làm chậm thao tác.
- **Địa chỉ phòng khám (01/9/2026):** đổi thành **28 Tăng Bạt Hổ, Phường Chợ Lớn, TP. Hồ Chí Minh** trên phiếu thu (thu-ngan.html `CLINIC_ADDR`) và đơn thuốc in (toa.js). Địa chỉ chỉ nằm ở 2 chỗ này — đổi lần sau cũng sửa đúng 2 dòng.
- **Góp ý in toa của BS Thủy (01/9/2026):** (1) Tiêu đề đơn thuốc đổi thành **"PHÒNG KHÁM SẢN PHỤ KHOA DIỆU SINH"** (bỏ "chuyên khoa") · (2) Thêm cột **"Đường dùng"** bắt buộc trên từng dòng thuốc — chọn: Uống / Đặt âm đạo / Đặt hậu môn / Bôi ngoài / Ngâm rửa / Tiêm / Khác (tự ghi); máy GỢI Ý: ưu tiên đường dùng đã kê GẦN NHẤT cho thuốc đó (học theo cách phòng khám kê — kê đúng 1 lần, lần sau tự nhớ), chưa có thì đoán theo tên–ĐVT–nhóm thuốc (viên đặt → Đặt âm đạo, kem/gel → Bôi ngoài, dung dịch vệ sinh → Ngâm rửa, viên/gói → Uống), bác sĩ đổi được và lựa chọn tay không bị đè khi đổi thuốc. Trên đơn in, dòng cách dùng đọc rõ: **"Uống 1 viên/lần × 2 lần/ngày, trong 5 ngày — Sáng & tối."** (đường dùng in đậm thay chữ "Dùng"; liều chỉ ghi số thì tự thêm đơn vị theo ĐVT). Cột mới `TOA_CT.DUONG_DUNG` (text, mặc định '') — toa cũ chưa có sẽ in "Dùng" như trước · (3) Danh mục thuốc khi kê **xếp A→Z** theo tên (localeCompare 'vi') · (4) Lỗi **"JWT issued at future"** (PGRST303) khi mở Sửa toa: đồng hồ máy PostgREST của Supabase chậm hơn máy Auth vài chục giây → token vừa cấp mới bị từ chối, token cũ vài chục giây thì qua; lỗi phía máy chủ Supabase, KHÔNG do máy phòng khám. Adapter nay tự đợi-gọi-lại (2s→4s→8s→16s, ~30s) nên người dùng chỉ thấy tải lâu hơn chút; nếu vẫn lỗi thì báo tiếng Việt "Máy chủ đang lệch giờ tạm thời… đợi 30 giây rồi bấm lại". Nếu tái diễn thường xuyên: gửi ticket Supabase support xin đồng bộ NTP cho project.
- **Góp ý pilot của BS Thủy + anh Khang (27/8/2026):** (1) TIẾP NHẬN: ô "Ghi chú" nâng thành khung riêng "Triệu chứng lâm sàng / Lý do khám" (textarea, có ví dụ gợi ý) — bác sĩ mở bệnh nhân thấy NGAY khung vàng nổi "Triệu chứng / lý do khám" trên cùng thẻ bệnh nhân · (2) TOA THUỐC: "Thời điểm dùng" đổi từ gõ tay sang CHỌN danh sách có sẵn (Sáng / Tối / Sáng & tối / Sau ăn / Trước ăn 30' / Trước khi ngủ / Đặt âm đạo buổi tối… — chọn "Khác (tự ghi)…" mới hiện ô gõ tay); sửa toa cũ tự khớp lại lựa chọn.
- **TV chỉ hiện Số đang chờ (26/8/2026):** bỏ dải "Mời thanh toán" VÀ 4 thẻ phòng bác sĩ trên tv.html theo yêu cầu anh Khang — màn hình TV giờ CHỈ còn dải SỐ ĐANG CHỜ cỡ lớn giữa màn hình (banner + loa gọi số vẫn giữ nguyên khi có phòng mời).
- **Y lệnh siêu âm + nút TV (22/8/2026, chốt với anh Khang):** siêu âm chỉ đi vào hệ thống qua 2 cửa, luôn mang tên BS khám ra y lệnh: (1) BS khám (hoặc thư ký đứng bàn) thêm DV siêu âm tại bàn khám → TỰ ĐỘNG thành CHỈ ĐỊNH (BS_CHI_DINH = BS bàn đó, không ghi "hoàn thành" hộ) → tự chuyển hàng chờ phòng siêu âm theo điều phối sẵn có; chiều ngược lại (BS siêu âm thêm DV khám) cũng vậy · (2) Lễ tân tiếp nhận đơn có siêu âm (BS dặn từ hôm trước / gọi điện) → hiện ô "BS khám nào chỉ định?" (danh sách BS khám, KHÔNG bắt buộc — bỏ trống ghi chú "LT tiếp nhận, BS dặn trước") · nút ➕DV tại quầy: dòng siêu âm luôn ghi dạng Chỉ định (không hoàn thành từ quầy), BS chỉ định chọn trong form sẵn có · thanh đầu thu ngân thêm nút "Màn hình TV" mở tv.html cửa sổ riêng để kéo sang TV phòng chờ (F11 toàn màn hình).
- **Chuyển thẳng sau siêu âm + gợi ý bác sĩ quen (22/8/2026, chốt với anh Khang):** khi BS bấm Hoàn tất mà BN còn việc phòng khác, hệ thống dò ngay phòng phù hợp ĐANG TRỐNG — nếu có và KHÔNG cướp lượt của BN nào đến trước (kiểm tra STT nhỏ hơn đang chờ phòng đó) → hỏi 1 nút "CHUYỂN THẲNG sang phòng BS X ngay?" — OK là loa đọc mời luôn, khỏi quay lại hàng chờ; ưu tiên chọn phòng: BS được yêu cầu → BS ĐÃ KHÁM BN LẦN TRƯỚC (dò Sổ khám cũ, đúng loại phòng) → phòng trống bất kỳ · hộp Gọi của thu ngân cũng gợi ý bác sĩ quen: BN không yêu cầu ai + BS lần trước đang trống → đề xuất chọn sẵn "BN từng khám BS Hà lần trước"; nếu BS quen đang bận thì vẫn ghi chú để thu ngân hỏi ý BN.
- **Giao diện chuyên nghiệp y khoa (22/8/2026, theo yêu cầu anh Khang "clean, professional, not childish"):** BỎ TOÀN BỘ emoji trang trí trên mọi màn hình (tab, nút, tiêu đề, thông báo, phiếu in) — giữ lại ký hiệu chức năng ✓ ✕ ⚠ ✎; nhãn "BS siêu âm" thay loa 🔊 bằng chữ SIÊU ÂM; logo đăng nhập thành huy hiệu DS tròn · file MỚI theme.css nạp sau style từng trang — 1 file chỉnh cả hệ thống: font Inter (số tabular), bảng màu lâm sàng dịu (xanh đậm #0C4F44, xám xanh, viền mảnh), bo góc nhỏ lại (thẻ 10px, nút 8px, chip 6px vuông vắn thay viên thuốc 99px), bóng đổ mỏng, tiêu đề thẻ chữ HOA nhỏ giãn cách, tab/ô nhập/scrollbar tinh gọn · tv.html giữ nền tối riêng, chỉ đổi font · nút +/− kho thuốc & vật tư từng là emoji nay là ký hiệu chữ.
- **Bàn khám LỒNG trong Bàn thư ký — soi gương, không nhân bản (22/8/2026, chốt với anh Khang):** chuyển sang trang riêng bị "một chiều" khó quay lại → tab đầu "🩺 Bàn khám" của Bàn thư ký giờ hiển thị CHÍNH TRANG ban-kham.html lồng bên trong (iframe cùng nguồn, cùng phiên đăng nhập) — MỘT bộ code duy nhất, mọi cập nhật bàn khám tự có ở cả 2 nơi; mở tab này rail phải tự ẩn cho full màn hình, thanh đầu trang con tự ẩn (đã có thanh mẹ); các tab Nhập sổ khám/Hồ sơ/Thai kỳ/Lịch hẹn/Kê đơn giữ nguyên, chuyển qua lại tự do · vai trò Thư ký mặc định về Bàn thư ký (bàn khám nằm sẵn trong đó); lỡ mở thẳng ban-kham.html có nút "📋 Bàn thư ký" quay về.
- **Thư ký làm việc TRÊN GIAO DIỆN BÁC SĨ (22/8/2026, chốt với anh Khang):** thực tế thư ký là người ghi chép chính, không phải bác sĩ → màn hình mặc định của vai trò Thư ký giờ là BÀN KHÁM (giống hệt BS, vẫn giới hạn bàn theo ca đã nhận); tab "Đang khám" tự chế ở Bàn thư ký thay bằng nút "🩺 Bàn khám — giao diện bác sĩ ↗" (mở thẳng ban-kham); Bàn thư ký giữ lại cho: nhận ca đầu ngày, hồ sơ BN, thai kỳ, lịch hẹn — bàn khám GIỮ NGUYÊN vì có hôm không có trợ lý, bác sĩ tự thao tác · sửa dàn trang thẻ thai kỳ (tên + chip tuổi thai/dự sinh/mốc khám bị dính nhau → 2 hàng thoáng, chip có khoảng cách).
- **Điều phối tinh gọn theo phòng + máy tính tiền thối POS (22/8/2026, chốt với anh Khang):** MÔ HÌNH MỚI: đơn dịch vụ TỰ CHIA VIỆC về từng phòng — dịch vụ siêu âm/SHG vào hàng chờ của BS siêu âm, dịch vụ khám vào hàng chờ BS khám (BN yêu cầu BS nào thì ghim BS đó; không yêu cầu = bể chung, phòng nào trống nhận trước) · mỗi bác sĩ TỰ GỌI từ bàn khám của mình ("Gọi bệnh nhân tiếp theo" giờ chỉ lấy BN có việc cho PHÒNG MÌNH, kèm ước thời gian) · KHÓA 1 PHÒNG: BN đang ở phòng nào thì phòng khác thấy 🔒, hàng chờ ghi "sau đó → phòng mình" · QUỸ GIỜ TRƯỚC HẸN: DICH_VU thêm cột THOI_LUONG (siêu âm 20', còn lại 15' — chỉnh được); nếu ca ước 45' mà BS có hẹn sau 30' → hệ thống cảnh báo, BS quyết · Hoàn tất khám THÔNG MINH: còn việc phòng khác → BN tự QUAY LẠI hàng chờ GIỮ NGUYÊN SỐ (đến trước vẫn trước, không tụt xuống cuối); hết việc → tự chuyển thu ngân; hàng chờ thu ngân có nhãn hành trình "✅ siêu âm xong · còn 🩺 khám" + nút "✓ Đủ DV — thanh toán" khi mọi dịch vụ đã xong mà BN còn đứng chờ · thu ngân vẫn gọi tay được (dự phòng) · POS TIỀN THỐI: ô "Khách đưa" + nút mệnh giá nhanh (đủ, 480k, 500k…) + số TIỀN THỐI LẠI to rõ (478k đưa 500k → thối 22k), in luôn trên phiếu; chỉ hiện với Tiền mặt, không đổi CSDL.
- **MỘT giao diện duy nhất — bỏ hub tab-iframe (21/8/2026, chốt với anh Khang):** trước đây tồn tại 2 giao diện (hub index.html nhúng iframe + các trang độc lập) gây lệch tính năng — nay CHỈ CÒN các trang độc lập (giao diện "chuyên nghiệp" anh Khang chọn); index.html viết lại thành trang ĐĂNG NHẬP + TỰ CHUYỂN: đăng nhập Google xong tự mở đúng màn hình theo vai trò (Quản lý→Tổng quan, Thu ngân/Lễ tân→Thu ngân, Bác sĩ→Bàn khám, Thư ký→Bàn thư ký, Dược sỹ→Dược sỹ, Kế toán→Tổng quan; nhớ trang mở lần trước với Quản lý) · dropdown chuyển màn hình CHỈ Quản lý có (đủ 5 màn hình, nằm cạnh tên trên thanh đầu) — nhân viên vai trò khác bị GIM vào đúng màn hình của mình, gõ tay URL khác sẽ tự bị đưa về · riêng Thư ký có nút liên kết Bàn thư ký ↔ Bàn khám (2 màn hình đều thuộc việc của họ) · nút 👥 Nhân sự chỉ Quản lý, hiện trên mọi màn hình · toàn bộ code hub (tab, iframe, pausePoll, hubNhanSu) đã xóa — MỌI cập nhật sau này chỉ sửa 1 bộ trang duy nhất.
- **Bàn khám đồng bộ GIỐNG HỆT giữa BS ↔ thư ký (21/8/2026):** thêm dịch vụ giờ GHI THẲNG vào sổ khám (Hoàn thành + người xác nhận) thay vì đệm cục bộ chờ Hoàn tất khám → màn bác sĩ và màn thư ký thấy dòng mới trong ~1s; dòng đã ghi có nút ✕ bỏ (thành Hủy, không tính tiền) · TỰ BÁM BÀN: khi bàn gọi ca mới (đổi BN Đang khám), mọi màn hình đang đứng bàn đó TỰ MỞ đúng bệnh nhân — trừ khi đang gõ ghi chú chưa lưu (chỉ nhắc, không cướp màn hình) · thư ký đứng bàn BS nào là thấy đúng những gì BS đó thấy: hàng chờ, hồ sơ, dịch vụ, kết quả, toa — hai màn hình như một.
- **Sửa/hủy toa + thư ký dùng bàn khám + fix lỗi lưu toa (21/8/2026):** FIX toa.js: lưu toa xong báo lỗi "Cannot read properties of null (onDone)" dù toa ĐÃ lưu — do close() xóa ctx trước khi gọi callback → giữ callback trước khi đóng · SỬA TOA tại bàn khám: toa Chờ soạn có nút ✎ Sửa (mở lại form với đủ dòng thuốc cũ, lưu = toa MỚI thay thế, toa cũ tự Hủy ghi chú "thay bằng TTxxxxx" — không sửa đè, giữ vết) + ✕ Hủy toa; toa đã Soạn/Phát thì khóa · THƯ KÝ theo quyết định mới của anh Khang: được vào giao diện BÀN KHÁM đầy đủ (hub thêm role Thư ký) — ô chọn bàn tự GIỚI HẠN theo ca đã nhận trong PHAN_CONG (chưa nhận ca thì chọn tự do + nhắc), mọi thao tác ghi email thư ký, kê toa BS kê = bác sĩ bàn đang đứng · CHẨN ĐOÁN tiền thuốc: pipeline tính đúng (4 toa test đều gắn MA_TT khi thu) — "không thấy tiền" là do 110/112 thuốc GIA_BAN=0, CẦN BẢNG GIÁ BÁN từ chị chủ.
- **Quét mã vạch kho (21/8/2026):** (bổ sung: quét tem THIẾT BỊ theo serial/mã TB → mở thẳng hồ sơ + nhật ký máy — dùng khi đi bảo trì) cột MA_VACH trên THUOC + VAT_TU · duoc-sy tab mới 📷 Quét mã: dùng SÚNG QUÉT USB bất kỳ (chuẩn bàn phím, cắm là chạy, ~150–400k đ) — chế độ XUẤT/NHẬP, mỗi lần quét +1 (chỉnh ➕➖), tiếng bíp nhận/lỗi, chặn xuất quá tồn, một nút ghi tất cả giao dịch (ghi chú "Quét mã vạch — bởi ai") · mã vạch lạ → hộp gắn-1-lần vào vật tư/thuốc, các lần sau tự nhận · quét được cả mã nội bộ VTxxxx/Txxx lẫn mã vạch nhà sản xuất (EAN-13).
- **Thiết bị: hồ sơ đầy đủ theo NĐ 98/2021 (21/8/2026):** nghiên cứu pháp lý: hồ sơ thiết bị bắt buộc (nhận diện, lịch sử bảo trì/sửa chữa, sự cố, kiểm định) — kiểm định nhà nước CHỈ bắt buộc với 6 loại máy (TT 33/2020: máy thở, gây mê, dao mổ điện, lồng ấp, phá rung, thận nhân tạo — máy siêu âm KHÔNG thuộc; nồi hấp = kiểm định áp lực) · THIET_BI thêm cột MODEL/SERIAL/VI_TRI/PHU_TRACH/HO_SO · bảng mới TB_LOG (TL00001 — Bảo trì/Sửa chữa/Sự cố, nội dung, chi phí, người ghi; RLS+audit+realtime) · duoc-sy tab Thiết bị: panel 📋 Nhật ký & hồ sơ từng máy — lịch sử đầy đủ, form ghi chép, ĐÍNH TỆP (HDSD/hóa đơn/giấy kiểm định vào bucket ketqua, đường dẫn TB/mã/) , ✎ sửa thông tin; nút Đã bảo trì tự ghi nhật ký · seed 15 vật tư tiêu hao chuẩn sản phụ khoa VT0002–VT0016 (khẩu trang, bao đầu dò, gel siêu âm, mỏ vịt 1 lần, cytobrush, lam kính, ống nghiệm, bơm kim tiêm, bông, gạc, cồn, giấy lót giường, găng vô trùng, túi rác y tế, que thử).
- **Đợt F — Kho vật tư + thiết bị — ĐÃ XÂY (21/8/2026):** 3 bảng mới VAT_TU (danh mục: mã VT0001, tên, ĐVT, nhóm, tồn tối thiểu) · VT_GD (giao dịch VG00001 — Nhập/Xuất/Kiểm kê, tồn TỰ TÍNH như kho thuốc, kiểm kê ghi chênh lệch + bắt buộc lý do, không xuất quá tồn) · THIET_BI (TB001 — ngày mua, giá, bảo hành đến, chu kỳ bảo trì tháng, bảo trì gần nhất, tình trạng Đang dùng/Sửa chữa/Hỏng/Ngừng) — RLS + audit + realtime như mọi bảng · duoc-sy: 2 tab mới 🧴 Vật tư (tồn + badge sắp hết/hết, quick ➕➖, form giao dịch, thêm mặt hàng, 30 giao dịch gần nhất) + 🔧 Thiết bị (thẻ từng máy: bảo hành còn/hết, bảo trì kế tiếp tự tính = gần nhất + chu kỳ, đỏ quá hạn/vàng ≤14 ngày, nút "Đã bảo trì hôm nay", sửa tình trạng, thêm thiết bị) · tong-quan Cần đối soát: cảnh báo thiết bị quá hạn/sắp đến hạn bảo trì, thiết bị Hỏng, vật tư chạm tồn tối thiểu.
- **Tên hiển thị + tab Nhân sự + khóa bàn bác sĩ (20/8/2026, chốt với anh Khang):** thanh đầu trang mọi màn hình hiện HO_TEN từ NGUOI_DUNG thay email (chỉ thanh đầu — các cột dữ liệu vẫn lưu email/tên BS như cũ để truy vết) · tong-quan: nút 👥 Nhân sự (chỉ Quản lý) — thêm/sửa tài khoản: email + vai trò + tên hiển thị; vai trò Bác sĩ bắt buộc chọn tên từ danh sách BAC_SI · RLS mới: p_nd_ins/p_nd_upd chỉ Quản lý ghi NGUOI_DUNG · ban-kham: tài khoản vai trò 'Bác sĩ' bị KHÓA vào đúng bàn mình (ô chọn disabled, bsSwitch chặn, openPatient chặn mở ca đang khám của BS khác) — tên hiển thị phải khớp TEN_BS · thư ký KHÔNG vào giao diện bàn khám (dùng tab Đang khám) — theo 4 lựa chọn của anh Khang. Việc còn: tạo Gmail riêng từng BS + nhập qua tab Nhân sự.
- **Fix tong-quan header (20/8):** class .bar của biểu đồ 14 ngày trùng tên với header.bar làm header xếp chồng → scope thành .chart .bar.
- **Ca trực trợ lý — 2 thư ký ↔ 5 bác sĩ (20/8/2026, chốt với anh Khang):** bảng mới PHAN_CONG (MA_PC=NGAY~EMAIL, DS_BS nối '|', RLS + audit + realtime) · ban-thu-ky: khối "👥 Ca của tôi hôm nay" — TK TỰ NHẬN ca đầu ngày bằng cách bấm tên bác sĩ (xanh=của mình, 🔒 xám=TK kia giữ, bấm vào báo tên người giữ — 2 TK không trùng bác sĩ được; Quản lý sửa được vì cùng quyền ghi) · tab MỚI ĐẦU TIÊN "🧑‍⚕️ Đang khám": tự hiện bệnh nhân mà (các) bác sĩ của mình đang khám — đồng bộ realtime 2 chiều với bàn bác sĩ (cùng MA_CHO): xem tiền sử/tiếp nhận, ✓ Hoàn thành / ✕ Không làm từng chỉ định, ✎ nhập KQ + đính tệp (host dkq_ riêng, kqEdit nhận prefix), kê toa HỘ đúng bác sĩ đang khám, mở bệnh án; nhiều BS cùng khám → tab con · thao tác NGOÀI vùng ca (Nhập sổ khám/Kê đơn cho BS của TK kia): CHO PHÉP nhưng confirm cảnh báo (chọn của anh Khang) · hàng chờ rail chú thích "ca của tôi"/"ca của X".
- **Điều phối siêu âm + giọng nữ + tìm DV ở tiếp nhận + lịch sử toa (20/8/2026):** BAC_SI.CHUYEN_KHOA='Siêu âm' cho BS Mai Anh + BS Phúc → hộp Gọi vào phòng: đơn có dịch vụ siêu âm/SHG mà BN không yêu cầu ai → tự đề xuất + chọn sẵn BS siêu âm ĐANG LÀM VIỆC ít bận nhất (nhãn 🔊, cấu hình bằng cột Chuyên khoa — thêm/bớt BS siêu âm không cần sửa code) · giọng đọc loa ưu tiên giọng NỮ tiếng Việt tự nhiên (HoaiMy/Google Tiếng Việt, pitch 1.05; muốn giọng AI thật cần API TTS có key — chưa gắn) · modal Tiếp nhận: bỏ danh sách toàn bộ DV → thanh tìm kiếm + danh sách đã chọn (✕ bỏ) + hàng ⚡ Hay dùng, rcSave đọc từ mảng rcSel · duoc-sy: tab mới 🗂 Toa đã phát — toàn bộ lịch sử nhóm theo ngày, lọc theo tên BN/mã toa, mở xem từng thuốc SL phát + người soạn/phát + in lại (hiện 200 toa gần nhất) · sửa thẻ BS giãn full hàng ở tổng quan/bàn khám (flex 0 1 176px).
- **Gọi vào phòng + đọc loa + chuyển bàn BS (20/8/2026):** thu-ngan: nút 📢 Gọi giờ GỌI THẬT — mở hộp chọn phòng bác sĩ (tự chọn sẵn BS bệnh nhân yêu cầu, đánh dấu BS đang bận) → chuyển Đang khám + BS_KHAM + GIO_GOI + máy ĐỌC LOA "Mời số …, …, vào phòng khám bác sĩ …" (Web Speech API vi-VN) · ban-kham: nút Gọi bệnh nhân tiếp theo cũng đọc loa; ô chọn bác sĩ = CHUYỂN BÀN thật (nhớ theo máy qua localStorage pk_bs_bk, đổi bàn tự mở BN đang khám của bác sĩ đó, cảnh báo nếu có dòng DV chưa lưu); bấm thẻ bác sĩ trên bảng Toàn phòng khám cũng chuyển bàn; vào trang tự mở BN đang khám của bàn mình.
- **Tệp kết quả + UI bàn khám/lịch hẹn — ĐÃ XÂY (20/8/2026):** (1) KẾT QUẢ DỊCH VỤ ĐÍNH KÈM TỆP: bucket Storage riêng tư `ketqua` (15MB/tệp, chỉ tài khoản phòng khám mở qua signed URL 1h, Kế toán không ghi được) · SB_FILES trong adapter (upload/url/open) · ô nhập KQ ở ban-kham + ban-thu-ky có chọn tệp (ảnh/PDF, nhiều tệp) · chip 📎 trong sổ khám + bệnh án (profile.js) · ANH_KET_QUA lưu đường dẫn nối '|' · verify live: upload + fetch 200 + chip hiện trong bệnh án ✓. (2) BÀN KHÁM SẮP XẾP LẠI: workspace tách 5 THẺ RIÊNG (Bệnh nhân / Dịch vụ & chỉ định / Toa thuốc / Kết luận / Lịch sử) · bỏ danh sách toàn bộ dịch vụ → THANH TÌM KIẾM (gõ không dấu được, mũi tên + Enter, gợi ý kèm nhóm + giá) + hàng ⚡ Hay dùng (6 DV hay dùng nhất theo thống kê SO_KHAM) · giữ con trỏ đang gõ khi dữ liệu tự làm tươi. (3) LỊCH HẸN DẠNG CALENDAR (thu-ngan): nút 🗓 Xem lịch mở overlay lớn ~toàn màn hình, chuyển Tháng ↔ Tuần · Tháng: lưới T2→CN 6 tuần, ô ngày hiện các hẹn (xanh dương chưa đến / xanh lá đã đến / xám quá hạn) + đếm, bấm Ô NGÀY → đặt hẹn điền sẵn ngày · Tuần: khung giờ 07–18h, bấm ô giờ → đặt hẹn điền sẵn ngày + giờ · ‹ › Hôm nay điều hướng · tự làm tươi realtime khi đang mở.
- **Đợt D + Bệnh án — ĐÃ XÂY (20/8/2026):** SO_KHAM +KET_QUA · bảng mới TOA_THUOC/TOA_CT (RLS + audit + realtime) · **toa.js MỚI** (kê toa dùng chung: chọn thuốc + tồn khả dụng, liều/lần + lần/ngày + số ngày NHẬP TAY từng dòng — không autofill, SL tự nhân sửa được; in toa A5) · ban-kham: khối Toa thuốc trong workspace + nút Kê toa (BS kê = mình), ✓ Hoàn thành mở ô NHẬP KẾT QUẢ, nút ✎ KQ sửa lại · ban-thu-ky: tab Kê đơn hoạt động (chọn BN + BS kê, ghi người nhập), ✎ KQ trong Sổ khám hôm nay, sửa nhãn Dịch vụ trùng · duoc-sy: tab Toa thuốc ĐẦU TIÊN (Chờ soạn → tick đủ hàng TỪNG DÒNG → Đã soạn; chỉ phát khi đơn Đã thu; tick phát từng dòng + SL phát → Xác nhận phát → KHO_GD Xuất tự động + Đã phát) · thu-ngan: tiền thuốc toa Đã soạn GỘP vào phiếu (cảnh báo toa chưa soạn), phiếu in 2 phần, toa gắn MA_TT khi thu · tong-quan: nhóm Thuốc trong doanh thu nhóm · **profile.js v3 — BỆNH ÁN 3 PHẦN**: (1) thông tin + dị ứng + thai kỳ + hẹn sắp tới, (2) các lần khám thu gọn/mở rộng — dịch vụ kèm giờ + người thực hiện + KẾT QUẢ + ghi chú + toa + thanh toán của lần đó, (3) toàn bộ toa + in lại · dọn C00001 kẹt từ 18/8.
- **Đợt DB — ĐÃ CHUYỂN (20/8/2026):** project Supabase `pk-dieusinh` (Singapore, URL bhixwqpyvspmtumbvbhc.supabase.co) · schema 11 bảng + RLS + trigger nhật ký + realtime ✓ · Google sign-in (CLIENT_ID cũ, skip nonce) ✓ · test-sb.html 4/4 ✓ · di chuyển dữ liệu qua Apps Script migrateToSupabase (NGUOI_DUNG 2, BENH_NHAN 117/118 — 1 dòng mã trống/trùng bị bỏ, BAC_SI 7 — MA_BS=TEN_BS vì sheet không có cột mã, DICH_VU 28, HANG_CHO 4, SO_KHAM 7, THANH_TOAN 1, THUOC 112, KHO_GD 109) · 6 trang chuyển sang supabase-api.js (api() → SB_API, logout → signOut, POLL_MS 1000 — version cục bộ realtime, không tốn mạng) · LƯU Ý: khóa server dùng LEGACY service_role (khóa sb_secret mới bị Supabase chặn từ Apps Script vì UA giống trình duyệt) · Apps Script API cũ GIỮ NGUYÊN làm đường lùi 2 tuần · còn lại: bật trigger đêm mirrorFromSupabase.
- **Đợt A — ĐÃ XÂY (20/8/2026):** API v0.5 (seedDotA thêm cột HANG_CHO/SO_KHAM/LICH_HEN) · thu-ngan: panel Hẹn hôm nay + check-in 1 chạm, modal Tiếp nhận (chọn DV + BS kèm trạng thái 🟢/🟡), nhãn 🗓/🚶 + ⬆ Ưu tiên, Hủy tiếp nhận bắt buộc lý do (hủy kèm DV Chỉ định), hóa đơn CHỈ tính dòng Hoàn thành (dòng cũ không có TRANG_THAI_DV vẫn tính — tương thích ngược), GIO_THU, Phiếu thanh toán A5 · ban-kham: checklist DV của đơn với ✓ Hoàn thành / ✕ Không làm từng dòng (ghi NGUOI_XAC_NHAN + GIO_XAC_NHAN), gọi ưu tiên + đúng BS yêu cầu, GIO_GOI/GIO_XONG, DV bác sĩ tự thêm = Hoàn thành ngay · ban-thu-ky: check-in từ hẹn tạo ĐƠN đầy đủ, nhập sổ khám = dòng Hoàn thành có người xác nhận · tong-quan: bỏ nút 30 ngày, panel Dòng chảy bệnh nhân hôm nay (funnel + thời gian chờ trung bình, khâu chậm nhất 🔴), panel Doanh thu theo nhóm dịch vụ, doanh thu bỏ dòng Hủy/Chỉ định · **profile.js MỚI**: Hồ sơ BN 360° dùng chung — bấm tên BN ở mọi màn hình (hàng chờ, tìm kiếm, lịch hẹn, sổ khám, board BS) mở hồ sơ đầy đủ (hành chính, tiền sử, thai kỳ, lịch sử khám theo ngày, thanh toán, lịch hẹn + nút hành động theo vai trò).

## 6. ĐỢT DB — CHUYỂN SANG DATABASE THẬT (SUPABASE) — chốt 20/8/2026
**Quyết định của anh Khang (20/8):** chuyển NGAY (trước Đợt B) · frontend GIỮ trên GitHub Pages (URL không đổi) · tên miền riêng: để sau.

### Kiến trúc mới
- **Database:** Supabase (PostgreSQL, gói miễn phí 500MB — dữ liệu phòng khám ~vài MB). Bảng + cột giữ NGUYÊN TÊN như Google Sheet (quoted identifiers) → code màn hình gần như không đổi.
- **Đăng nhập:** giữ nút Google hiện tại (GIS) → `supabase.auth.signInWithIdToken({provider:'google', token})`. Supabase Dashboard: bật Google provider, thêm CLIENT_ID hiện có vào "Authorized Client IDs", bật "Skip nonce checks". KHÔNG cần client secret.
- **Phân quyền:** Row Level Security ngay trong database — hàm `pk_role()` tra email đăng nhập trong bảng NGUOI_DUNG; chỉ email có trong bảng mới ĐỌC được; 'Kế toán' bị chặn GHI ở tầng database (chặt hơn cả bản Apps Script).
- **Realtime:** subscribe postgres_changes → biến đếm version LOCAL trong adapter; các màn hình giữ nguyên vòng poll `api('version')` nhưng giờ trả lời tức thì 0ms không tốn mạng; có thay đổi thật thì loadAll. Màn hình khác thấy thay đổi sau ~100ms thay vì 3-4s.
- **Adapter (supabase-api.js MỚI):** định nghĩa `SB_API(action, extra)` mô phỏng đúng hợp đồng cũ: login/logout/version/readAll/append/update, trả `{ok, v, tables:{T:{header, rows}}}` y hệt — mỗi trang chỉ sửa 1 dòng: thân hàm `api()` gọi `SB_API`. AUTH_REQUIRED khi hết phiên Supabase (tự refresh, thực tế đăng nhập 1 lần dùng rất lâu).
- **Chống trùng mã:** PRIMARY KEY trong Postgres → mã trùng (vd 2 C00002) bị TỪ CHỐI thay vì ghi đè im lặng như Sheet. (Nâng cấp sau: RPC next_id cấp mã nguyên tử phía server.)
- **Nhật ký:** trigger Postgres tự ghi NHAT_KY mọi insert/update kèm email người thao tác.
- **Google Sheet cũ = GƯƠNG + SAO LƯU:** Apps Script thêm hàm `mirrorFromSupabase()` chạy trigger mỗi đêm — kéo toàn bộ bảng từ Supabase ghi đè vào một file Sheet "PK_MIRROR" để chị chủ vẫn mở xem quen thuộc + backup. Khóa service_role chỉ nằm trong Script Properties (server-side, không bao giờ ra frontend).
- **Di chuyển dữ liệu:** hàm Apps Script `migrateToSupabase()` chạy 1 lần — đọc từng sheet, đẩy lên Supabase qua REST (chỉ copy các cột có trong schema). Chạy xong đối chiếu số dòng từng bảng.
- **Cắt chuyển an toàn:** làm bản mới ở các file `*-sb` thử trước (hoặc cờ USE_SB trong trang) → test song song với bản Sheets đang chạy → khớp thì đổi hẳn, bản Apps Script API giữ nguyên làm phương án lùi trong 2 tuần.

### Việc của anh Khang (một lần, ~15 phút — tài khoản & khóa luôn là việc của anh)
1. Tạo tài khoản supabase.com (đăng nhập bằng GitHub hoặc Google) → New project (tên `pk-dieusinh`, region Singapore, đặt database password và CẤT KỸ).
2. Gửi em: **Project URL** (`https://xxxx.supabase.co`) và **anon key** (Settings → API — khóa này thiết kế để công khai trong frontend).
3. Authentication → Providers → Google: bật, dán CLIENT_ID hiện có vào "Authorized Client IDs", bật "Skip nonce checks", Save.
4. Tự dán **service_role key** vào Apps Script: Project Settings → Script Properties → thêm `SB_URL` và `SB_SERVICE_KEY` (em không đụng vào khóa bí mật này).

### Thứ tự thi công (em làm sau khi có URL + anon key)
1. Dán `supabase_schema.sql` vào SQL Editor (tạo bảng, RLS, trigger, realtime) — em dán, anh chỉ cần đã đăng nhập.
2. Dán khối `migrateToSupabase()` vào Apps Script → Run → đối chiếu số dòng.
3. Commit `supabase-api.js` + sửa 6 trang trỏ sang adapter (1 commit) → test end-to-end.
4. Bật trigger đêm `mirrorFromSupabase()`.
5. Theo dõi 2 tuần → gỡ đường lùi. Các Đợt B–E xây thẳng trên Supabase.

## 5. QUY TRÌNH LÀM VIỆC (chống mất thông tin & tiết kiệm)
1. File này (KE_HOACH_V2.md) nằm trong repo GitHub — máy làm việc có reset cũng không mất.
2. Mọi thay đổi thiết kế: sửa file này trước → rồi mới code.
3. Code viết + kiểm tra cú pháp hoàn toàn trong sandbox → publish MỘT commit/đợt → verify live một lần. Trình duyệt chỉ dùng cho: publish GitHub, deploy Apps Script, verify, thao tác Sheet.
