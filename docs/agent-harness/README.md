# Kiểm chứng cho AGY CLI trong pb-desk

## Cách dùng

### Kiểm chứng ngay trong phiên AGY đang làm việc

Mở `agy` trong repo và giao task như bình thường. Rule
`.agents/rules/command-evidence.md` hướng dẫn agent chuẩn bị `.agents/task.json`,
sau khi sửa xong gọi lệnh Bash ngay trong phiên hiện tại:

```bash
bun --no-env-file run agent:verify <sessionId>
```

Đặt working directory của công cụ Bash là `/home/arch/Project/test/pb-desk`.
Nếu không chỉ định được thư mục cho công cụ, chuyển thư mục ngay trong lệnh:

```bash
cd /home/arch/Project/test/pb-desk && bun --no-env-file run agent:verify <sessionId>
```

`<sessionId>` phải trùng trường `sessionId` trong task contract. Khi không có
driver/hook cung cấp ID, dùng ID conversation nếu biết; nếu không, tạo ID riêng
cho task. ID tự tạo không được coi là ID conversation do AGY xác nhận.
Agent phải cập nhật tiêu chí cho task mới; contract của đợt cài harness không
thay thế tiêu chí nghiệm thu tính năng đang làm.

`agent:verify` chạy các lệnh kiểm tra và ghi evidence, không gọi model khác.
Nó nhận ID và đọc tiêu chí trong file JSON, không nhận đề bài ngôn ngữ tự nhiên.
Agent chờ exit code và kết quả rồi sửa lỗi, chạy lại và báo cáo đúng trạng thái.
Rule được khai báo Always On; với phiên đã mở trước khi thêm rule, yêu cầu agent
đọc `.agents/rules/command-evidence.md` hoặc mở phiên mới.

**Đây là quy trình do agent tuân thủ.** Rule không cưỡng chế agent gọi lệnh và
không chặn được mọi báo cáo sai. Việc thực thi verifier không cần native hooks.

### Bộ điều phối kiểm chứng độc lập

Chạy từ terminal khi muốn chương trình điều phối cả task và kiểm chứng:

```bash
bun --no-env-file run agent:run "Mô tả yêu cầu sửa hoặc thêm tính năng"
```

Driver dùng Gemini 3.8 Flash High mặc định; có thể truyền model ID ở đối số thứ hai.
Driver gọi AGY ở chế độ headless, cung cấp session ID, tự chạy verify sau mỗi lượt,
và gửi lỗi trở lại cùng conversation (tối đa ba lượt). Kết quả cuối được chương
trình tạo: PASS hoặc BLOCKED, cùng đường dẫn log. Phản hồi model được giữ trong
log, không hiển thị thành tuyên bố hoàn thành chưa kiểm chứng. Đây là lệnh dành
cho **tác vụ lập trình**, không dùng nó làm lệnh kiểm chứng bên trong AGY vì nó
sẽ khởi chạy một lượt AGY khác. Trong phiên AGY hiện tại dùng `agent:verify`.

**Native hook chưa được xác nhận hoạt động trên AGY 1.2.3 tại máy này.** Các probe
workspace/global/plugin và TUI nhận phản hồi từ model, nhưng không ghi được lần
gọi hook. `/hooks` liệt kê cấu hình không chứng minh thực thi. Đã gỡ các đăng ký
thử nghiệm; không coi `agy` chạy trực tiếp là đã được bảo vệ. Script hook và
installer được giữ để thử lại khi CLI hỗ trợ ổn định. Plugin superpowers hiện
có lỗi schema hooks riêng; tạm tắt để chẩn đoán vẫn không làm probe hoạt động,
và đã bật lại sau thử nghiệm.

Với tác vụ chạy qua driver, agent phải:

1. Đọc yêu cầu, tạo `.agents/task.json` trước khi sửa code, dùng đúng `sessionId`.
2. Liệt kê đầy đủ yêu cầu và ánh xạ từng yêu cầu tới kiểm tra hành vi có thể chạy.
3. Sửa code; driver tự chạy `bun --no-env-file run agent:verify <sessionId>` sau phản hồi.
4. Đọc kết quả và log. Sửa lỗi trong phạm vi công việc rồi chạy lại nếu cần.
5. Chỉ báo PASS cho các kiểm tra được chứng minh; nêu rõ giới hạn kiểm chứng.

Ví dụ cấu trúc task (thay nội dung và đường dẫn test bằng yêu cầu thực tế):

```json
{
  "sessionId": "ID_CUA_TASK_DANG_LAM",
  "title": "Lưu và đọc lại cài đặt",
  "requirements": [
    {
      "id": "R1",
      "description": "Giá trị đã lưu được đọc lại sau khi mở storage",
      "checks": ["settings-persistence"]
    }
  ],
  "checks": [
    {
      "id": "settings-persistence",
      "command": ["cargo", "test", "-p", "pb_storage", "settings_persistence"],
      "timeoutMs": 120000,
      "testFormat": "cargo"
    }
  ]
}
```

Ví dụ chỉ mô tả schema, không khẳng định repo có test `settings_persistence`.
Kiểm tra Bun dùng `testFormat: "bun"`; script kiểm tra khác phải trả exit code
khác 0 nếu điều kiện không đạt. Không dùng lệnh chỉ in “PASS”. Không tự sửa
evidence, bỏ test hoặc thay hook để vượt cổng kiểm chứng.

## Các lệnh

```bash
bun --no-env-file run agent:eval
bun --no-env-file run agent:typecheck
bun --no-env-file run agent:verify <sessionId>
bun --no-env-file run agent:install
```

`agent:verify` chạy đủ các gate cố định: Cargo clippy, Cargo tests, frontend
check/build, typecheck và eval của harness, rồi các check nghiệm thu của task.
Không có tùy chọn bỏ gate cố định. Log ghi cả stdout/stderr, thời gian,
working directory, exit code, số test khi nhận diện được và hash nguồn.
Script tiếp tục thu kết quả các gate khác khi một gate fail.

## Cơ chế hoạt động

- Hook `PreInvocation` lấy snapshot đầu phiên. Hook `Stop` kiểm tra kết quả;
  hook không tự chạy build nặng trong timeout của AGY.
- Nếu thiếu evidence, fail, có task chưa kiểm tra hoặc nguồn đã thay đổi,
  hook yêu cầu agent xử lý tiếp. Tối đa ba lần nhắc sửa, một lần yêu cầu báo
  BLOCKED, rồi cho phép dừng với trạng thái BLOCKED trong báo cáo máy.
- Lỗi runtime/hủy phiên không bị cưỡng ép chạy lại. Background work chưa idle
  không được xem là đã hoàn thành.
- Phiên chỉ hỏi đáp, không thay đổi file và không khai báo task được bỏ qua.
- Kết quả quá sáu giờ, thiếu log, log bị đổi hoặc kiểm tra không có test nào
  pass không được công nhận. Test bị skip/ignore cần xử lý trước khi PASS.
- Hash gồm nội dung và quyền file, kể cả `.env` (chỉ hash, không lưu giá trị).
  Không cần Git. Bỏ qua thư mục dependency/build/index, `.agent-evidence` và
  execution ledger của đợt cài đặt. Symlink trong phạm vi nguồn hiện bị chặn.
- `.agents/task.json` nằm trong snapshot; sửa tiêu chí cũng làm evidence cũ hết hạn.

Evidence nằm ngoài source, tại `~/.local/state/pb-desk-agent/<workspace-hash>/<session-hash>/`:

| File            | Ý nghĩa                                    |
| --------------- | ------------------------------------------ |
| `evidence.json` | Kết quả thực thi của lần verify gần nhất   |
| `run-*/`        | Log riêng từng lệnh, giữ lại các lần trước |
| `session.json`  | Snapshot đầu phiên và số lần nhắc          |
| `status.json`   | Quyết định gần nhất của hook               |
| `hooks.jsonl`   | Bằng chứng hook thực sự được gọi           |

Không dùng `status: SUCCESS` của AGY làm bằng chứng test pass: đó là trạng thái
phiên CLI đã tạo phản hồi, không phải kết quả nghiệm thu phần mềm.

## Cài đặt và gỡ

`bun --no-env-file run agent:install` thêm một mục riêng vào `.agents/hooks.json`, giữ các
hook khác và backup cấu hình trước khi đổi. Nếu bản CLI không nạp hook workspace,
dùng `bun --no-env-file run agent:install --global` để đăng ký vào `~/.gemini/config/hooks.json`.
Hook toàn cục chỉ hoạt động khi `workspacePaths` chứa chính xác thư mục repo này.
Chỉ bật một vị trí đăng ký sau khi probe để tránh gọi hai lần.

Các lệnh cài hook là tùy chọn thử nghiệm; driver hoạt động độc lập, không yêu cầu
cài hook. Không bật cả driver và native gate cho cùng tác vụ nếu chưa kiểm tra
cách phối hợp session ID.

```bash
bun --no-env-file run agent:install --remove
bun --no-env-file run agent:install --global --remove
```

Các lệnh gỡ chỉ xóa mục riêng của repo này. Khởi động lại phiên AGY để nạp thay đổi.
Nếu chuyển repo sang đường dẫn khác, gỡ đăng ký cũ trước khi di chuyển và cài lại.

## Giới hạn cần hiểu đúng

Đây là cơ chế tăng độ tin cậy cục bộ, không phải ranh giới bảo mật đối với
agent có quyền shell cùng tài khoản người dùng. Agent vẫn có thể cố ý sửa
script, cấu hình hoặc dữ liệu bên ngoài; cần runner/CI độc lập để chống điều đó.

PASS chỉ chứng minh **các check đã cấu hình**. Bộ kiểm chứng không tự biết đề bài
đã được chuyển thành đầy đủ tiêu chí hay test có đủ mạnh không. UI/IPC cần test
runtime phù hợp; build pass không chứng minh tương tác đúng. Nếu agent không tạo
task và không sửa gì, hook không phân biệt được việc bỏ cuộc với một câu hỏi đáp.
Hook Stop không rút lại được câu trả lời đã stream ra màn hình; trạng thái máy
và log là nguồn đối chiếu. Các eval ở đây kiểm tra cơ chế bằng chương trình,
không phải benchmark chứng minh mức độ tin cậy của Gemini trên mọi tác vụ.

Một workspace chỉ nên có một phiên đang sửa code: task contract là file dùng
chung. Các session có evidence riêng nhưng sửa đồng thời làm snapshot mất hiệu lực.
Các dependency và biến môi trường ngoài repo chưa nằm trong hash; chạy lại verify
khi thay toolchain, dependency cài sẵn hoặc cấu hình môi trường.

Nguồn schema: https://www.antigravity.google/docs/hooks (đối chiếu 2026-09-15).

## Môi trường thực thi

Luôn dùng `bun --no-env-file run agent:run` và `bun --no-env-file run agent:verify`
ở điểm vào. Cờ này chỉ ngăn harness tự nạp `.env`; các biến đã export trong shell
vẫn được giữ. Các subprocess frontend `bun run check/build` tiếp tục nạp môi trường
theo cấu hình của chúng. Không đổi cấu hình Bun toàn repo. Trong workspace này,
`.env` có endpoint WebSocket cho ứng dụng web; tự đưa nó vào Cargo test có thể
làm client HTTP Rust thất bại dù cùng lệnh Cargo chạy từ shell thành công.
