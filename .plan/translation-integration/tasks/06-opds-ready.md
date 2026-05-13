# Task 06 — OPDS-ready Edition Bridge

## Objective

Chuẩn bị dữ liệu, manifest, artifact path, và selection model để phase sau cho OPDS tải đúng bản gốc hoặc đúng bản dịch/version mà user chọn.

## Scope

- edition publish metadata
- artifact organization cho translation editions
- API/library metadata đủ cho OPDS selection phase sau
- không bắt buộc public full translation feed trong phase này

## Required Changes

### Edition publish model
- Mỗi edition phải có:
  - identifier ổn định
  - label người dùng đọc được
  - language
  - project linkage nếu là translation edition
  - current publish state

### Artifact paths
- Tổ chức riêng cho edition artifacts, ví dụ:
  - original edition paths
  - translation edition paths theo `projectId` hoặc `editionId`
- Không reuse path gốc để tránh ghi đè hoặc lẫn file.

### Manifest-ready metadata
- Tạo metadata đủ để phase sau map thành OPDS entries:
  - novel
  - edition list
  - chapter availability
  - selected published version per chapter
  - lastUpdated

### Future selection behavior
- Thiết kế để library/OPDS có thể chọn:
  - `gốc`
  - `dịch1_theo_project_A`
  - `dịch2_theo_project_B`
  - `dịch3...`
- Phase này chỉ cần chuẩn bị model/API; chưa cần fully expose end-user OPDS UI nếu scope cần giữ nhỏ.

## Acceptance Criteria

- Edition artifacts có path riêng.
- Metadata đủ để thêm OPDS selection sau mà không đổi schema lớn.
- Không ảnh hưởng OPDS gốc hiện tại.

## Validation

- Dry inspection artifact layout pass.
- Edition metadata query pass.
- Original OPDS behavior không regression.

## Dependencies

- `01-foundation.md`
- `05-library-export.md`
