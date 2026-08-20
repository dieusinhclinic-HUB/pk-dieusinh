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

| Đợt | Nội dung | Đụng vào |
|---|---|---|
| **A** | Chuỗi đơn dịch vụ: cột mới HANG_CHO/SO_KHAM · check-in từ hẹn + vãng lai cùng 1 đường · nhãn 🗓/🚶 + nút ⬆ Ưu tiên · chọn DV+BS lúc tiếp nhận · checklist xác nhận ở bàn khám · hóa đơn theo dòng Hoàn thành + **mẫu in hóa đơn A5** · timestamps · hủy đơn · PIPELINE ở Tổng quan | API v0.5, thu-ngan, ban-kham, ban-thu-ky, tong-quan |
| **B** | Chấm công: LICH_LAM_VIEC + CHAM_CONG + cham-cong.html (máy quầy) + **nhập file máy vân tay** + cột MA_NV + trạng thái khả dụng lúc chọn BS + board vào ca + giờ công & cảnh báo lệch ở Tổng quan | API, cham-cong (mới), thu-ngan, ban-kham, tong-quan, hub |
| **C** | Cận lâm sàng (Chờ kết quả) · Hẹn tái khám 1 chạm · Mẫu ghi chú | ban-kham, ban-thu-ky, thu-ngan |
| **D** | Toa thuốc: kê ở bàn khám → dược phát → kho tự trừ → in toa | API, ban-kham, duoc-sy |
| **E** | TV phòng chờ + chuông gọi số + in số thứ tự (P3 cũ) | tv.html (mới), thu-ngan |

| **D** *(bổ sung)* | Toa thuốc dùng **mẫu in A5 theo TT52** (mockup_toa_thuoc.html đã duyệt) | ban-kham, duoc-sy |

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
