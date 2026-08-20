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

TRANG_THAI mở rộng: `Chờ khám → Đang khám → Chờ kết quả → Xong khám → Đã thu` + `Hủy`.
(`Chờ kết quả` chỉ dùng khi có DV cận lâm sàng chưa xong — Đợt C.)

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

**CHAM_CONG** *(thực tế vào/ra — ghi từ máy quầy)*
`MA_CC (CC00001…) · NGAY · TEN · VAI_TRO · GIO_VAO · GIO_RA · NGUON (email tài khoản máy quầy) · GHI_CHU`
- Bấm "Vào ca" → tạo dòng có GIO_VAO. Bấm "Ra ca" → điền GIO_RA vào dòng đang mở của người đó hôm nay.
- **KHẢ DỤNG** = có lịch hôm nay (đúng thứ, trong giờ) **và** đã Vào ca chưa Ra ca **và** không có đơn Đang khám.

**TOA_THUOC** *(Đợt D)*: `MA_TOA (TT00001…) · NGAY · MA_CHO · MA_BN · BS_KE · TRANG_THAI (Chờ phát/Đã phát/Hủy) · GHI_CHU`
**TOA_CT** *(chi tiết toa)*: `MA_TOA · MA_THUOC · SO_LUONG · LIEU_DUNG`
- Dược sỹ bấm "Đã phát" → tự append KHO_GD loại `Xuất` từng dòng + set Đã phát. Kho không bao giờ trừ tay.

**MAU_GHI_CHU** *(Đợt C)*: `MA_MAU · TEN_MAU · NOI_DUNG · CON_AP_DUNG` — mẫu ghi chú khám soạn sẵn, quản lý sửa trong Sheet.

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

## 3. THAY ĐỔI TỪNG MÀN HÌNH

**thu-ngan.html** — panel Hẹn hôm nay + Check-in 1 chạm · form tiếp nhận có chọn DV yêu cầu + chọn BS kèm trạng thái khả dụng · hóa đơn chỉ tính dòng Hoàn thành · nút Hủy đơn (bắt buộc lý do) · vẫn thêm DV tại quầy được (dòng thêm tại quầy tự coi là Hoàn thành vì thu ngân xác nhận trực tiếp với BN).

**ban-kham.html** — checklist DV từ đơn (tick sẵn theo yêu cầu) · nút ✓ Hoàn thành từng dòng (ai bấm hệ thống ghi người đó) · thêm DV phát sinh ngay trong khám · (C) nút Hẹn tái khám · (C) dropdown Mẫu ghi chú chèn vào ô ghi chú · (D) khối Kê toa (tìm thuốc còn tồn, SL, liều dùng) · board toàn phòng khám bổ sung trạng thái vào ca (⚪ chưa đến / 🟤 đã về).

**ban-thu-ky.html** — (C) tab Cận lâm sàng: danh sách DV `Đang làm` toàn phòng khám → bấm "Có kết quả" → dòng Hoàn thành, đơn nào đủ thì tự sang Xong khám · check-in từ hẹn tạo ĐƠN đầy đủ (kèm LY_DO làm DV yêu cầu gợi ý).

**duoc-sy.html** — (D) tab Toa chờ phát: xem toa, xác nhận Đã phát (tự trừ kho), in toa khổ nhỏ.

**tong-quan.html** — PIPELINE HÔM NAY: funnel Tiếp nhận → Đang khám → Chờ KQ → Chờ thu → Đã thu, kèm thời gian chờ trung bình từng khâu (tính từ GIO_*), khâu chậm nhất tô đỏ · (B) bảng giờ công tháng theo người (từ CHAM_CONG) · tỉ lệ hủy đơn/no-show · công suất BS = số ca / giờ có mặt.

**cham-cong.html (MỚI — máy chung ở quầy)** — đăng nhập 1 lần bằng tài khoản quầy (phiên 12h) · lưới thẻ tên toàn bộ nhân sự (từ NGUOI_DUNG + BAC_SI) · bấm tên → hộp xác nhận "Vào ca lúc HH:mm?" / "Ra ca?" · thẻ đang trong ca viền xanh + hiện giờ vào · ghi NGUON = email tài khoản máy để đối chiếu.

**index.html (hub)** — thêm tab 🕐 Chấm công (roles Thu ngân, Lễ tân, Quản lý).

---

## 4. THỨ TỰ XÂY (mỗi đợt = 1 commit + 1 deploy, xong đợt này mới sang đợt sau)

| Đợt | Nội dung | Đụng vào |
|---|---|---|
| **A** | Chuỗi đơn dịch vụ: cột mới HANG_CHO/SO_KHAM · check-in từ hẹn ở thu ngân · chọn DV+BS lúc tiếp nhận · checklist xác nhận ở bàn khám · hóa đơn theo dòng Hoàn thành · timestamps · hủy đơn · PIPELINE ở Tổng quan | API v0.5, thu-ngan, ban-kham, ban-thu-ky, tong-quan |
| **B** | Chấm công: LICH_LAM_VIEC + CHAM_CONG + cham-cong.html + trạng thái khả dụng lúc chọn BS + board vào ca + giờ công ở Tổng quan | API, cham-cong (mới), thu-ngan, ban-kham, tong-quan, hub |
| **C** | Cận lâm sàng (Chờ kết quả) · Hẹn tái khám 1 chạm · Mẫu ghi chú | ban-kham, ban-thu-ky, thu-ngan |
| **D** | Toa thuốc: kê ở bàn khám → dược phát → kho tự trừ → in toa | API, ban-kham, duoc-sy |
| **E** | TV phòng chờ + chuông gọi số + in số thứ tự (P3 cũ) | tv.html (mới), thu-ngan |

Việc còn chờ chị: **BANK_INFO** (ô chuyển khoản) · **email nhân viên** vào NGUOI_DUNG (kèm vai trò: Thu ngân/Lễ tân/Bác sĩ/Thư ký/Dược sỹ/Kế toán) · **lịch làm việc** của từng người (để đổ vào LICH_LAM_VIEC) · **GIA_BAN** thuốc nào khác giá vốn · logo.

## 5. QUY TRÌNH LÀM VIỆC (chống mất thông tin & tiết kiệm)
1. File này (KE_HOACH_V2.md) nằm trong repo GitHub — máy làm việc có reset cũng không mất.
2. Mọi thay đổi thiết kế: sửa file này trước → rồi mới code.
3. Code viết + kiểm tra cú pháp hoàn toàn trong sandbox → publish MỘT commit/đợt → verify live một lần. Trình duyệt chỉ dùng cho: publish GitHub, deploy Apps Script, verify, thao tác Sheet.
