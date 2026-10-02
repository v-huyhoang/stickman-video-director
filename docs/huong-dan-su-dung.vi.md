# Hướng dẫn sử dụng Stickman Video Director

> Repository này gồm ba lớp: **Codex Skill** tạo nội dung, **CLI** bảo vệ state
> và approval gate, còn **Flask UI** giúp thao tác bằng trình duyệt. Source và
> project workspace ở local; app không tự gọi Gemini, ElevenLabs hay upload nội
> dung của bạn.

## Mục lục

1. [Workflow tổng quan](#workflow-tổng-quan)
2. [Research Review cho factual topic](#research-review-cho-factual-topic)
3. [Cài đặt và chạy UI](#cài-đặt-và-chạy-ui)
4. [Dùng UI từng bước](#dùng-ui-từng-bước)
5. [Ví dụ video 30 giây](#ví-dụ-video-30-giây)
6. [ElevenLabs và external voiceover](#elevenlabs-và-external-voiceover)
7. [Tạo subtitle SRT/VTT](#tạo-subtitle-srtvtt)
8. [Dùng CLI](#dùng-cli)
9. [File, state và backup](#file-state-và-backup)
10. [Troubleshooting](#troubleshooting)
11. [Checklist publish](#checklist-publish)

## Workflow tổng quan

Mỗi video luôn theo flow sau:

```text
Setup → Phase A → Capture → Explicit approval → Phase B → Subtitle → Edit/export
```

| Bước | Kết quả | Điều kiện đi tiếp |
|---|---|---|
| Setup | Source, ratio, duration, style, audio mode | Đủ các trường bắt buộc |
| Phase A | Director's proposal | Bạn review proposal |
| Capture | Lưu proposal hiện tại | Proposal được dán/lưu vào workspace |
| Approval | Unlock Phase B | Bạn xác nhận rõ proposal hiện tại |
| Phase B | Prompt package cho từng clip 10 giây | Phase A đã approved |
| Subtitle | `.srt` hoặc `.vtt` draft | Approved narration, một paragraph mỗi clip |
| Edit/export | Video hoàn chỉnh | Clip, voice và caption đã được kiểm tra |

CLI và UI **không thay thế** `$directing-stickman-videos`. Chúng chỉ tạo handoff
request cho Codex, giữ artifact, và ngăn bỏ qua approval gate.

## Research Review cho factual topic

Với history, science, medicine, law, finance, current events, public figure,
product, date, statistic, quotation hoặc causal claim, core Skill tự research
trước khi viết storyboard. Review tách các claim thành:

| Status | Ý nghĩa trong script |
|---|---|
| Supported | Có thể nói theo wording đã được nguồn tốt hỗ trợ. |
| Qualified | Chỉ được nói với qualifier như “accounts say” hoặc “historians disagree”. |
| Unresolved | Không được trình bày như fact; chỉ nêu là theory/question nếu cần. |
| Remove | Không đưa vào narration hoặc visual. |

Research Review xuất hiện ngắn gọn trước Phase A: source types reviewed,
supported points, unresolved/qualified points và script rule. Nếu core claim bị
mâu thuẫn đáng kể hoặc không thể support có trách nhiệm, agent dừng ở review và
hỏi bạn trước khi viết Phase A. Với fiction hoặc câu chuyện sáng tạo thuần túy,
research không tự chạy trừ khi bạn yêu cầu.

## Cài đặt và chạy UI

### Yêu cầu

| Thành phần | Mục đích | Kiểm tra |
|---|---|---|
| Node.js 20+ | Chạy CLI workflow | `node --version` |
| Python 3.10+ | Chạy Flask UI | `python3 --version` |
| pip | Cài Flask local | `python3 -m pip --version` |
| Codex + skill | Tạo Phase A/B | `$directing-stickman-videos` |
| Gemini Omni Flash/Flow | Render clips | Tùy tài khoản |
| ElevenLabs | External voice, tùy chọn | Tùy tài khoản |
| Video editor | Ghép video, audio, subtitle | CapCut, DaVinci, Premiere… |

### Cài Flask local

Từ root repository:

```bash
python3 -m pip install --target .python-packages -r requirements.txt
```

Flask được cài vào `.python-packages/` của repo, không cần cài global hoặc dùng
`sudo`.

### Chạy app

```bash
npm run ui
```

Mở browser tại:

```text
http://127.0.0.1:8765
```

Server chỉ bind `127.0.0.1`, nên máy khác trong mạng không truy cập được. Nhấn
`Ctrl+C` ở terminal để dừng app.

### Các khu vực trên UI

| Khu vực | Công dụng |
|---|---|
| **Setup** | Tạo project, chọn ratio/style/duration/audio/subtitle mode. |
| **Workflow stepper** | Hiển thị state: Setup, Phase A, Approval hoặc Delivery. |
| **Control room** | Mở handoff, capture proposal, approve, tạo subtitle. |
| **Artifact panel** | Copy request sang Codex, dán Phase A về, copy SRT/VTT. |
| **Project picker** | Mở lại workspace trong `.director-projects/`. |

## Dùng UI từng bước

### 1. Tạo project

Trong **Start a video project**, điền:

| Field | Cách chọn |
|---|---|
| Project name | Chữ thường, số, gạch ngang. Ví dụ: `strasbourg-dance`. |
| Aspect ratio | `9:16` cho Shorts/Reels/TikTok; `16:9` cho YouTube ngang. |
| Duration | Bội số 10 giây. `30s` = 3 clips, `60s` = 6 clips. |
| Visual style | Classic Minimalist, Modern Studio Tech, hoặc Cinematic Story. |
| Classic theme | Chỉ có ở Classic: light hoặc dark. |
| Subtitle format | `SRT` cho đa số editor; `VTT` cho WebVTT. |
| Source copy or verified notes | Source, facts, caveat, CTA, yêu cầu sáng tạo. |
| External voiceover | Bật nếu dùng ElevenLabs hoặc giọng người thật. |

Nhấn **Create project**. UI tạo workspace local và mở **Phase A handoff** để bạn
copy sang Codex.

### 2. Tạo và review Phase A trong Codex

Dán handoff vào Codex. Core Skill phải tạo Phase A gồm title, hook, English VO,
reference translation, storyboard, timed beats, palette, BGM/SFX và transition.
Nó phải dừng để xin approval, chưa được tạo prompt Phase B.

Trước khi capture, kiểm tra:

- Source có bị thêm fact, statistic, quote hoặc product claim không?
- Số storyboard rows có bằng `duration ÷ 10` không?
- Mỗi row có ba timed beat và action cụ thể không?
- Ratio, style, theme và audio mode có đúng setup không?
- Ending mỗi row có thể nối opening row kế tiếp không?

### 3. Capture proposal

1. Chọn **Capture current Phase A**.
2. Dán toàn bộ proposal Codex vừa trả về.
3. Nhấn **Save Phase A**.
4. Đọc lại artifact đã lưu.

Capture chỉ lưu proposal; nó **không phải approval**.

### 4. Approve và tạo Phase B

Khi proposal hiện tại đúng ý bạn:

1. Chọn **Approve current Phase A**.
2. Xác nhận dialog.
3. Chọn **Open Phase B handoff**.
4. Copy artifact sang Codex.

Codex phải tạo đúng số production prompts của duration approved. Nếu sửa ratio,
duration, style, theme, narration, scene structure hoặc global direction, hãy
làm Phase A mới, capture và approve lại; approval cũ không còn dùng được.

### 5. Render và edit

1. Generate từng Phase B prompt thành một clip khoảng 10 giây trong Gemini.
2. Đặt clips đúng thứ tự trên timeline.
3. Dùng stitching guide/match-cut để nối clip.
4. Thêm voice track, subtitle và BGM final trong video editor.

## Ví dụ video 30 giây

### Setup mẫu

| Field | Giá trị |
|---|---|
| Project name | `break-hesitation-loop` |
| Aspect ratio | `9:16` |
| Duration | `30 seconds` |
| Style | `Style 1 · Classic Minimalist` |
| Theme | `Light` |
| Subtitle format | `SRT` |
| External voiceover | Bật |

Dán source sau:

```text
A tiny action can interrupt a loop of hesitation. Do not claim that action
eliminates anxiety; frame it as one practical way to break the first cycle.
End by asking what one small action the viewer can take today.
```

Phase A handoff sẽ có ý chính như sau:

```text
Use $directing-stickman-videos to turn this source into an English stickman video.

Aspect ratio: 9:16
Duration: 30s
Style: Style 1 Classic Light
Use an external post-production voiceover. Keep generated clips to music and
ambient SFX only; do not generate speech or dialogue.
Subtitle deliverable: SRT draft after Phase B.

Create Phase A only. Stop and request my explicit approval before producing
Gemini Omni Flash prompts or subtitle files.
```

Sau approval, Phase B phải có đúng **3** prompt độc lập. Render Clip 1 → Clip 2
→ Clip 3 theo thứ tự đã approved.

## ElevenLabs và external voiceover

Bật **External voiceover** nếu bạn muốn giọng ổn định qua nhiều clip. Prompt
video khi đó chỉ có music và ambient SFX, không có generated narration/dialogue.

### Quy trình khuyến nghị

1. Lấy approved English VO trong Phase A; không tự đổi wording nếu chưa revise.
2. Trong ElevenLabs, chọn một voice duy nhất cho toàn bộ video.
3. Render narration thành track liên tục hoặc từng paragraph theo clip.
4. Import clips và voice track vào editor.
5. Căn narration theo từng block 10 giây.
6. Hạ BGM/SFX clip cho đến khi voice rõ ràng.
7. Nếu delivery cuối lệch timing, retime cue subtitle trong editor.

### Checklist voiceover

- [ ] Không có generated speech/narration bên trong video clip.
- [ ] Cùng một voice/narrator cho toàn bộ project.
- [ ] Narration, subtitle và approved VO có wording giống nhau.
- [ ] BGM không reset gắt ở mỗi clip.
- [ ] Video model không tự render chữ/caption lỗi.

## Tạo subtitle SRT/VTT

Sau Phase B, chọn **Create subtitle draft**. Dán narration đã approved, với
**một paragraph không rỗng cho mỗi clip 10 giây**.

Video 30 giây cần đúng 3 paragraph:

```text
The loop feels huge because every possible failure arrives before you move.
One tiny action gives the present moment something real to answer.

Open one document. Send one message. Take one small step before your thoughts
write the ending for you.

The goal is not perfect confidence. It is proof that movement can begin before
certainty. What small action will you take today?
```

UI trả `.srt` hoặc `.vtt` draft. Một phần output SRT:

```srt
1
00:00:00,000 --> 00:00:05,000
The loop feels huge because every possible
failure arrives before you move.

2
00:00:05,000 --> 00:00:10,000
One tiny action gives the present moment
something real to answer.
```

Timing dựa trên clip boundary, không phải forced alignment từ file audio cuối.
Sau khi có voice track:

1. Lưu output thành `subtitles.en.srt` với UTF-8.
2. Import vào CapCut, DaVinci Resolve hoặc Premiere.
3. Retime cue start/end theo audio final.
4. Giữ tối đa hai dòng/cue, tránh che action chính.

## Dùng CLI

UI và CLI dùng cùng core state. CLI phù hợp cho terminal hoặc automation local.

### Tạo project

```bash
node bin/stickman-director.mjs init projects/break-hesitation-loop \
  --source-file notes.txt \
  --aspect 9:16 \
  --duration 30 \
  --theme light \
  --external-voiceover \
  --subtitle-format srt
```

`--theme light` hoặc `--theme dark` mặc định Classic style. Nếu dùng
`--style modern-studio-tech` hoặc `--style cinematic-story`, không truyền
`--theme`.

### Capture, approve, Phase B

```bash
node bin/stickman-director.mjs capture-phase-a \
  projects/break-hesitation-loop phase-a.md

node bin/stickman-director.mjs approve projects/break-hesitation-loop

node bin/stickman-director.mjs phase-b projects/break-hesitation-loop
```

### Subtitle và status

```bash
node bin/stickman-director.mjs subtitle projects/break-hesitation-loop \
  --transcript narration.en.txt \
  --format srt

node bin/stickman-director.mjs status projects/break-hesitation-loop
```

## File, state và backup

Mỗi UI project nằm tại:

```text
.director-projects/<project-name>/.stickman-video/
```

| File | Nội dung |
|---|---|
| `project.json` | Setup, phase và artifact paths. |
| `source.md` | Source gốc. |
| `phase-a-request.md` | Request copy sang Codex để tạo proposal. |
| `phase-a.md` | Phase A đã capture. |
| `phase-b-request.md` | Request copy sang Codex để tạo prompts. |
| `narration.en.txt` | Narration dùng để tạo subtitle. |
| `subtitles.srt` / `subtitles.vtt` | Subtitle draft hậu kỳ. |

`.director-projects/` bị Git ignore vì thường chứa source/artifact riêng. Để
backup, copy folder project ra nơi an toàn hoặc thay đổi `.gitignore` theo chính
sách của bạn.

## Troubleshooting

### `python3 -m pip` không chạy

Python máy bạn chưa có pip. Cài pip theo chính sách hệ điều hành, sau đó chạy:

```bash
python3 -m pip install --target .python-packages -r requirements.txt
```

### Port 8765 đã được dùng

Tìm terminal đang chạy `npm run ui` và nhấn `Ctrl+C`. Nếu cần port khác, đổi
`port=8765` trong `app.py` rồi chạy lại.

### Nút Approve bị mờ

Approval chỉ mở khi project ở `awaiting_approval` và có `phase-a.md`. Hãy
capture proposal trước; state `draft` chưa thể approve.

### Không tạo được subtitle

Kiểm tra:

1. Phase A đã approve và Phase B handoff đã sẵn sàng.
2. Số paragraph = `duration ÷ 10`.
3. Mỗi paragraph không rỗng.
4. Format là `srt` hoặc `vtt`.

### Project name bị từ chối

Dùng dạng `strasbourg-dance-1518`. Không dùng space, underscore, chữ hoa hoặc
ký tự đặc biệt.

### Đã đổi global direction nhưng Phase B vẫn có sẵn

Không dùng approval cũ. Tạo Phase A mới trong Codex, capture lại và approve bản
mới trước khi generate Phase B.

## Checklist publish

- [ ] Ratio, duration, style trong clips khớp proposal approved.
- [ ] Số clips bằng `duration ÷ 10`.
- [ ] Ending clip N khớp opening clip N+1.
- [ ] External voiceover không bị lẫn generated speech.
- [ ] Approved VO, ElevenLabs audio và subtitle có wording thống nhất.
- [ ] Subtitle đã retime theo audio cuối.
- [ ] Không có visible text/number/caption do video model tự tạo.
- [ ] Không có unsupported facts, statistics hoặc product claims.

## Tài liệu liên quan

- UI quickstart: `docs/ui.md`
- CLI quickstart: `docs/cli.md`
- Core contract: `skills/directing-stickman-videos/SKILL.md`
- Subtitle contract: `skills/directing-stickman-videos/references/subtitle-contract.md`
- Production prompt contract: `skills/directing-stickman-videos/references/omni-flash-prompt-contract.md`
- Evaluation rubric: `tests/evaluation-rubric.md`
