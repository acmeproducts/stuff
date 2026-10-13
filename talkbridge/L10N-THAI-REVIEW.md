# TalkBridge · Thai review sheet (29·post-ship localization, generated 2026-10-13)

Every word the app itself says, English beside the Thai the phone shows. Rows marked MT are machine translation (Google, the app's own chat path); rows marked OK were reviewed. To correct a row: write the Thai into `talkbridge/fixtures/l10n/overrides.json` under `th` by key (the builder does this from your notes) and the row loses its MT mark on the next build. `{name}` tokens are filled at runtime and must stay.

| key | English | Thai | |
|---|---|---|---|
| `partner` | Partner | คู่สนทนา | OK |
| `someone` | Someone | ใครบางคน | MT |
| `they` | They | พวกเขา | MT |
| `me` | me | ฉัน | MT |
| `your_partner` | Your partner | คู่สนทนา | OK |
| `thread` | Thread | ด้าย | MT |
| `a_thread` | a thread | ด้าย | MT |
| `their_chat` | their chat | แชทของพวกเขา | MT |
| `close` | Close | ปิด | MT |
| `cancel` | Cancel | ยกเลิก | MT |
| `ok` | OK | ตกลง | MT |
| `copy` | Copy | คัดลอก | MT |
| `share` | Share | แบ่งปัน | MT |
| `join` | Join | เข้าร่วม | OK |
| `download` | Download | ดาวน์โหลด | MT |
| `delete` | Delete | ลบ | MT |
| `restore` | Restore | คืนค่า | MT |
| `delete_forever` | Delete Forever | ลบถาวร | MT |
| `accept` | Accept | ยอมรับ | MT |
| `decline` | Decline | ปฏิเสธ | MT |
| `send` | Send | ส่ง | MT |
| `clarify` | Clarify | ชี้แจง | MT |
| `debug` | Debug | ดีบัก | MT |
| `privacy` | Privacy | ความเป็นส่วนตัว | MT |
| `about` | About | เกี่ยวกับ | MT |
| `size` | Size | ขนาด | MT |
| `rooms` | Rooms | ห้องพัก | MT |
| `voice_call` | Voice call | โทรด้วยเสียง | MT |
| `video_call` | Video call | แฮงเอาท์วิดีโอ | MT |
| `save_to_phrasebook` | Save to phrasebook | บันทึกลงในสมุดวลี | MT |
| `tags` | Tags | แท็ก | MT |
| `read` | Read | อ่าน | MT |
| `sent` | Sent | ส่งแล้ว | MT |
| `delivered` | Delivered | จัดส่งแล้ว | MT |
| `received` | Received | ได้รับแล้ว | MT |
| `install` | Install | ติดตั้ง | MT |
| `turn_on` | Turn on | เปิดเครื่อง | MT |
| `not_now` | Not now | ไม่ใช่ตอนนี้ | MT |
| `show_me` | Show me | แสดงให้ฉันดู | MT |
| `room_name` | Room name | ชื่อห้อง | MT |
| `phrasebook` | Phrasebook | หนังสือวลี | MT |
| `reach_none` | {who} won't be alerted when away | {who} จะไม่ได้รับการแจ้งเตือนเมื่อไม่อยู่ | MT |
| `reach_none_many` | Nobody will be alerted while away | จะไม่มีใครได้รับการแจ้งเตือนในขณะที่ไม่อยู่ | MT |
| `n10_unreachable` | {who} can't be reached when away yet | ไม่สามารถติดต่อ {who} ได้เมื่อไม่อยู่ | MT |
| `n10_unreachable_many` | Nobody can be reached when away yet | ยังไม่มีใครสามารถติดต่อได้เมื่อไม่อยู่ | MT |
| `s0_title` | Hi, let's get ready to chat! | สวัสดี เรามาเตรียมตัวแชทกันเถอะ! | MT |
| `s0_sub` | What's your name? | คุณชื่ออะไร? | MT |
| `your_name` | Your name | ชื่อของคุณ | OK |
| `name_required` | Please enter your name | กรุณาใส่ชื่อของคุณ | OK |
| `continue` | Continue | ดำเนินการต่อ | MT |
| `welcome` | Welcome | ยินดีต้อนรับ | MT |
| `welcome_sub` | Please select a conversation on the left<br>or tap the + icon to start a new chat | โปรดเลือกการสนทนาทางด้านซ้าย<br>หรือแตะไอคอน + เพื่อเริ่มแชทใหม่ | MT |
| `mic` | Mic | ไมค์ | MT |
| `camera` | Camera | กล้อง | MT |
| `end_call` | End call | วางสาย | MT |
| `room_settings` | Room settings | การตั้งค่าห้อง | MT |
| `dg_fail_banner` | Transcription stopped — check your Deepgram key in Calling & sync keys | การถอดเสียงหยุดแล้ว — ตรวจสอบคีย์ Deepgram ของคุณในปุ่มการโทรและการซิงค์ | MT |
| `dismiss` | Dismiss | ยกเลิก | MT |
| `flip_camera` | Flip camera | กล้องพลิก | MT |
| `attach` | Attach | แนบ | MT |
| `compose_ph` | Type or /search | พิมพ์หรือ /ค้นหา | MT |
| `clear` | Clear | ชัดเจน | MT |
| `customize_room` | Customize Room | ปรับแต่งห้อง | MT |
| `tab_general` | General | ทั่วไป | MT |
| `tab_customize` | Customize | ปรับแต่ง | MT |
| `label_your_name_partner` | Your name (partner sees this) | ชื่อของคุณ (คู่หูเห็นสิ่งนี้) | MT |
| `label_room_title` | Room title (your list) | ชื่อห้อง (รายการของคุณ) | MT |
| `info_ear` | Hear their voice during a call or video call. | ได้ยินเสียงของพวกเขาระหว่างการโทรหรือแฮงเอาท์วิดีโอ | MT |
| `ear` | Ear | หู | MT |
| `info_autoread` | Reads the other person's messages aloud in your language. | อ่านออกเสียงข้อความของบุคคลอื่นในภาษาของคุณ | MT |
| `autoread` | Auto-read | อ่านอัตโนมัติ | MT |
| `info_mute` | Silences new-message and call alerts for this room. | ปิดเสียงข้อความใหม่และการแจ้งเตือนการโทรสำหรับห้องนี้ | MT |
| `mute_notifications` | Mute notifications | ปิดเสียงการแจ้งเตือน | MT |
| `go_button` | Go button | ปุ่มไป | MT |
| `chat_bubble_header` | Chat bubble header | ส่วนหัวของฟองแชท | MT |
| `opt_top` | Top | ด้านบน | MT |
| `opt_bottom` | Bottom | ก้น | MT |
| `opt_off` | Off | ปิด | MT |
| `color` | Color | สี | MT |
| `appearance` | Appearance | ลักษณะที่ปรากฏ | MT |
| `me_cap` | Me | ฉัน | MT |
| `preset` | Preset | ที่ตั้งไว้ล่วงหน้า | MT |
| `opt_light` | Light | เบา | MT |
| `opt_medium` | Medium | ปานกลาง | MT |
| `opt_dark` | Dark | มืด | MT |
| `tone` | Tone | โทน | MT |
| `bubble` | Bubble | บับเบิ้ล | MT |
| `font` | Font | แบบอักษร | MT |
| `width` | Width | ความกว้าง | MT |
| `share_room` | Share room | แชร์ห้อง | MT |
| `link_a_device` | Link a device | เชื่อมโยงอุปกรณ์ | MT |
| `export_transcript` | Export transcript | ส่งออกใบรับรองผลการเรียน | MT |
| `start_new_chat` | Start new chat | เริ่มแชทใหม่ | MT |
| `your_language` | Your language | ภาษาของคุณ | MT |
| `partner_language` | Partner language | ภาษาพันธมิตร | MT |
| `autoread_for_partner` | Auto-read for your partner | อ่านอัตโนมัติสำหรับคู่ของคุณ | MT |
| `calling_sync_keys` | Calling & sync keys | ปุ่มโทรและซิงค์ | MT |
| `deepgram_key` | Deepgram key | คีย์ดีพแกรม | MT |
| `turn_token_id` | TURN token ID | เปลี่ยนรหัสโทเค็น | MT |
| `turn_api_token` | TURN API token | เปลี่ยนโทเค็น API | MT |
| `github_pat` | GitHub PAT (phrasebook sync, optional) | GitHub PAT (การซิงค์สมุดวลี ไม่จำเป็น) | MT |
| `about_tagline` | Two people, two languages, one conversation. | สองคน สองภาษา หนึ่งบทสนทนา | MT |
| `about_version` | Version | เวอร์ชัน | MT |
| `about_no_account` | No account. No tracking. | ไม่มีบัญชี. ไม่มีการติดตาม | MT |
| `privacy_text` | No accounts. Conversations live on your devices, not on a server. Keys stay local. Rooms and phrasebooks are yours to delete. | ไม่มีบัญชี การสนทนาถ่ายทอดสดบนอุปกรณ์ของคุณ ไม่ใช่บนเซิร์ฟเวอร์ กุญแจอยู่ในพื้นที่ ห้องและหนังสือวลีเป็นของคุณที่จะลบ | MT |
| `pb_new_phrase` | New phrase | วลีใหม่ | MT |
| `pb_save_now` | Save now | บันทึกตอนนี้ | MT |
| `pb_search_ph` | Search all phrases… (-word to exclude) | ค้นหาวลีทั้งหมด... (-คำที่จะยกเว้น) | MT |
| `app_language` | App language | ภาษาของแอป | MT |
| `preview_not_available` | Preview not available | ดูตัวอย่างไม่พร้อมใช้งาน | MT |
| `about_start_screen` | About & start screen | เกี่ยวกับ & หน้าจอเริ่มต้น | MT |
| `no_conversations_yet` | No conversations yet | ยังไม่มีการสนทนา | MT |
| `not_translated` | ⚠ not translated | ⚠ไม่ได้แปล | MT |
| `no_phrasebook_loaded` | No phrasebook loaded. | ไม่ได้โหลดสมุดวลี | MT |
| `toast_storage_full` | Storage is full — recent messages may not be saving. Export your transcripts or free up space. | พื้นที่เก็บข้อมูลเต็ม — ข้อความล่าสุดอาจไม่ถูกบันทึก ส่งออกใบรับรองผลการเรียนของคุณหรือเพิ่มพื้นที่ว่าง | MT |
| `toast_link_copied` | Link copied | คัดลอกลิงก์แล้ว | MT |
| `toast_already_saved` | Already saved | บันทึกแล้ว | MT |
| `toast_saved_to_pb` | Saved to phrasebook | บันทึกไว้ในสมุดวลีแล้ว | MT |
| `confirm_delete_message` | Delete this message? | ลบข้อความนี้ใช่ไหม | MT |
| `toast_two_languages` | Choose two different languages | เลือกสองภาษาที่แตกต่างกัน | MT |
| `toast_file_too_large` | File too large (400 KB max) | ไฟล์ใหญ่เกินไป (สูงสุด 400 KB) | MT |
| `toast_copied` | Copied | คัดลอกแล้ว | MT |
| `toast_nothing_to_save` | Nothing to save | ไม่มีอะไรจะบันทึก | MT |
| `toast_add_pat` | Add a GitHub PAT in Calling & sync keys | เพิ่ม GitHub PAT ในปุ่มการโทรและซิงค์ | MT |
| `toast_offline_retry` | Offline — will retry | ออฟไลน์ — จะลองอีกครั้ง | MT |
| `toast_pat_rejected` | GitHub rejected the PAT — check it in Calling & sync keys | GitHub ปฏิเสธ PAT — ตรวจสอบได้ในปุ่มการโทรและการซิงค์ | MT |
| `toast_mic_needed` | Microphone access needed | จำเป็นต้องเข้าถึงไมโครโฟน | MT |
| `toast_relay_unavailable` | Call relay unavailable — connection may fail | รีเลย์การโทรไม่พร้อมใช้งาน — การเชื่อมต่ออาจล้มเหลว | MT |
| `toast_no_relay` | No call relay configured — add TURN keys | ไม่มีการกำหนดค่ารีเลย์การโทร — เพิ่มปุ่ม TURN | MT |
| `toast_room_needs_name` | A room needs a name | ห้องหนึ่งต้องมีชื่อ | MT |
| `toast_transcript_cleared` | Transcript cleared on this device | ล้างการถอดเสียงบนอุปกรณ์นี้แล้ว | MT |
| `toast_debug_cleared` | Debug log cleared | ล้างบันทึกการแก้ไขข้อบกพร่องแล้ว | MT |
| `toast_pb_synced` | Phrasebook synced | ซิงค์สมุดวลีแล้ว | MT |
| `toast_no_shared_pb` | No shared phrasebook yet | ยังไม่มีสมุดวลีที่ใช้ร่วมกัน | MT |
| `toast_pb_add_pat` | Phrasebook: add GitHub PAT in Calling & sync keys | หนังสือวลี: เพิ่ม GitHub PAT ในปุ่มการโทรและการซิงค์ | MT |
| `toast_pb_pat_rejected` | Phrasebook: GitHub rejected the PAT — check it in Calling & sync keys | หนังสือวลี: GitHub ปฏิเสธ PAT — ตรวจสอบได้ในปุ่มการโทรและการซิงค์ | MT |
| `toast_they_left` | They left this chat | พวกเขาออกจากแชทนี้ | MT |
| `toast_no_dg_key` | Deepgram key missing — no live transcription | คีย์ Deepgram หายไป — ไม่มีการถอดเสียงสด | MT |
| `toast_saved_v` | Saved · v{v} | บันทึกแล้ว · วี{v} | MT |
| `toast_pb_file_url` | Phrasebook can't sync from file:// — use the deployed URL | Phrasebook ไม่สามารถซิงค์จาก file:// — ใช้ URL ที่ปรับใช้ | MT |
| `toast_pb_sync_failed` | Phrasebook sync failed: {detail} | การซิงค์สมุดวลีล้มเหลว: {detail} | MT |
| `toast_pb_loaded` | Phrasebook loaded · {n} phrases (v{v}) | โหลดหนังสือวลีแล้ว · {n} วลี (v{v}) | MT |
| `toast_no_voice` | No voice installed for {lang} | ไม่มีการติดตั้งเสียงสำหรับ {lang} | MT |
| `toast_thread_invited` | {who} invited you to ‘{name}’ | {who} เชิญคุณเข้าร่วม '{name}' | MT |
| `label_background` | Background | พื้นหลัง | MT |
| `tab_manage` | Manage | จัดการ | MT |
| `label_your_name_in_chat` | Your name in this chat | ชื่อของคุณในแชทนี้ | MT |
| `menu_export_data` | Export transcript (data) | ส่งออกใบรับรองผลการเรียน (ข้อมูล) | MT |
| `menu_clear_transcript` | Clear transcript | การถอดเสียงที่ชัดเจน | MT |
| `menu_clear_log` | Clear debug log | ล้างบันทึกการแก้ไขข้อบกพร่อง | MT |
| `menu_hear_their_voice` | Hear their voice | ได้ยินเสียงของพวกเขา | MT |
| `menu_hear_translation` | Hear translation | ฟังคำแปล | MT |
| `menu_ringer` | Ringer | ริงเกอร์ | MT |
| `attachment` | Attachment | เอกสารแนบ | MT |
| `not_named` | Not named | ไม่ระบุชื่อ | MT |
| `talking_to` | Talking to {who} | กำลังพูดคุยกับ {who} | MT |
| `pill_is_now` | {old} is now {v} | {old} ขณะนี้ {v} | MT |
| `pill_video_call_declined` | Video call declined | แฮงเอาท์วิดีโอถูกปฏิเสธ | MT |
| `pill_voice_call_declined` | Voice call declined | การโทรด้วยเสียงถูกปฏิเสธ | MT |
| `pill_missed_video_call` | Missed video call | ไม่ได้รับแฮงเอาท์วิดีโอ | MT |
| `pill_missed_voice_call` | Missed voice call | สายสนทนาที่ไม่ได้รับ | MT |
| `pill_video_call_canceled` | Video call canceled — no answer | แฮงเอาท์วิดีโอถูกยกเลิก — ไม่มีการตอบรับ | MT |
| `pill_voice_call_canceled` | Voice call canceled — no answer | การโทรด้วยเสียงถูกยกเลิก — ไม่มีการตอบรับ | MT |
| `pill_video_call_ended_min` | Video call ended · {n} min | แฮงเอาท์วิดีโอสิ้นสุดแล้ว · {n} นาที | MT |
| `pill_video_call_ended_sec` | Video call ended · {n} sec | แฮงเอาท์วิดีโอสิ้นสุดลง · {n} วินาที | MT |
| `pill_voice_call_ended_min` | Voice call ended · {n} min | การโทรด้วยเสียงสิ้นสุดลง · {n} นาที | MT |
| `pill_voice_call_ended_sec` | Voice call ended · {n} sec | การโทรด้วยเสียงสิ้นสุดลง · {n} วินาที | MT |
| `pill_left_chat` | Left the chat | ออกจากแชทแล้ว | MT |
| `pill_rejoined` | Rejoined | เข้าร่วมอีกครั้ง | MT |
| `pill_renamed` | {who} changed the room from "{from}" to "{to}" | {who} เปลี่ยนห้องจาก "{from}" เป็น "{to}" | MT |
| `pill_named` | {who} named the room "{to}" | {who} ตั้งชื่อห้องว่า "{to}" | MT |
| `pill_thread_accepted` | {who} accepted ‘{name}’ | {who} ยอมรับ '{name}' | MT |
| `pill_thread_declined` | {who} declined ‘{name}’ | {who} ปฏิเสธ '{name}' | MT |
| `pill_joined` | {who} joined | {who} เข้าร่วม | MT |
| `pill_inviting` | {who} is inviting you to {room}{langs} | {who} กำลังเชิญคุณเข้าร่วม {room}{langs} | MT |
| `joiner_invite` | {who} invited you to chat | {who} ชวนคุณมาคุยกัน | OK |
| `joiner_note` | Calls will ask for camera and microphone access | การโทรจะขออนุญาตใช้กล้องและไมโครโฟน | OK |
| `calling` | Calling… | กำลังโทร... | MT |
| `video_call_ringing` | Video call · Ringing… | แฮงเอาท์วิดีโอ · กำลังส่งเสียง... | MT |
| `voice_call_ringing` | Voice call · Ringing… | การโทรด้วยเสียง · กำลังเรียกเข้า... | MT |
| `connecting` | Connecting… | กำลังเชื่อมต่อ... | MT |
| `video_call_tb` | Video call · TalkBridge | แฮงเอาท์วิดีโอ · TalkBridge | MT |
| `voice_call_tb` | Voice call · TalkBridge | การโทรด้วยเสียง · TalkBridge | MT |
| `reconnecting` | Reconnecting… | กำลังเชื่อมต่อใหม่... | MT |
| `speaking` | Speaking… | กำลังพูด... | MT |
| `is_typing` | {who} is typing… | {who} กำลังพิมพ์... | MT |
| `n10_mic_muted` | Your microphone is muted until they answer | ไมโครโฟนของคุณจะถูกปิดเสียงจนกว่าจะรับสาย | MT |
| `cancel_call` | Cancel call | ยกเลิกการโทร | MT |
| `last_seen` | Last seen {when} | เห็นครั้งสุดท้าย {when} | MT |
| `not_seen_yet` | Not seen yet | ยังไม่เห็นเลย | MT |
| `home_sum_none_1` | You have 1 active room, there are no waiting messages. | คุณมีห้องที่ใช้งานอยู่ 1 ห้อง ไม่มีข้อความรออยู่ | MT |
| `home_sum_none` | You have {n} active rooms, there are no waiting messages. | คุณมีห้องที่ใช้งานอยู่ {n} ห้อง ไม่มีข้อความรอ | MT |
| `count_chat_1` | 1 chat | 1 แชท | MT |
| `count_chat` | {n} chats | {n} แชท | MT |
| `count_voice_call_1` | 1 voice call | 1 การโทรด้วยเสียง | MT |
| `count_voice_call` | {n} voice calls | {n} การโทรด้วยเสียง | MT |
| `count_video_call_1` | 1 video call | แฮงเอาท์วิดีโอ 1 รายการ | MT |
| `count_video_call` | {n} video calls | แฮงเอาท์วิดีโอ {n} | MT |
| `count_waiting_1` | 1 waiting message | 1 ข้อความรอ | MT |
| `count_waiting` | {n} waiting messages | {n} ข้อความรอ | MT |
| `home_sum_1` | Of 1 active room there are {waiting}, {list}. | จาก 1 ห้องที่ใช้งานอยู่มี {waiting}, {list} | MT |
| `home_sum` | Of {n} active rooms there are {waiting}, {list}. | จาก {n} ห้องที่ใช้งานอยู่ มี {waiting}, {list} | MT |
| `and_sep` |  and  | และ | MT |
| `ago_now` | now | ตอนนี้ | MT |
| `ago_m` | {n}m ago | {n}ม.ที่แล้ว | MT |
| `ago_h` | {n}h ago | {n}ชม.แล้ว | MT |
| `ago_d` | {n}d ago | {n}ที่ผ่านมา | MT |
| `recycle_bin` | Recycle bin ({n}) | ถังขยะรีไซเคิล ({n}) | MT |
| `add_a_thread` | Add a thread | เพิ่มเธรด | MT |
| `thread_from_in` | Thread from {from} · in {room} | กระทู้จาก {from} · ใน {room} | MT |
| `thread_name_ph` | Thread name | ชื่อกระทู้ | MT |
| `join_thread` | Join thread | เข้าร่วมกระทู้ | MT |
| `invite_link` | Invite link | ลิงค์เชิญชวน | MT |
| `paste_invite_ph` | Paste an invite link | วางลิงก์คำเชิญ | MT |
| `link_failed` | That link didn't work | ลิงก์นั้นใช้งานไม่ได้ | MT |
| `scan_qr` | Scan QR | สแกนคิวอาร์ | MT |
| `grant_initiator` | Grant initiator status | สถานะผู้ริเริ่มให้ทุน | MT |
| `grant_hint` | They can create their own rooms until this date, and can pass that on. Granting shares your working credentials. | พวกเขาสามารถสร้างห้องของตัวเองได้จนถึงวันนี้และสามารถส่งต่อได้ การให้สิทธิ์จะแบ่งปันข้อมูลรับรองการทำงานของคุณ | MT |
| `message_status` | Message status | สถานะข้อความ | MT |
| `room_about_ph` | What is this about? | เรื่องนี้เกี่ยวกับอะไร? | MT |
| `invite_your_partner` | Invite your partner | เชิญคู่ของคุณ | MT |
| `back_colon` | Back:  | กลับ: | MT |
| `n_of_m` | {n} of {m} | {n} จาก {m} | MT |
| `pb_no_matching` | No matching phrases | ไม่มีวลีที่ตรงกัน | MT |
| `pb_no_result_yet` | No result yet. | ยังไม่มีผล | MT |
| `pb_local_only` | Local only — add a GitHub PAT (long-press square → Calling & sync keys) to sync | เฉพาะในเครื่องเท่านั้น — เพิ่ม GitHub PAT (กดสี่เหลี่ยมยาว → ปุ่มโทรและซิงค์) เพื่อซิงค์ | MT |
| `pb_not_synced_yet` | Not synced yet this session | ยังไม่ซิงค์เซสชันนี้ | MT |
| `by_who` |  by {who} | โดย {who} | MT |
| `pb_synced_status` | {file} · {n} phrases · last synced {when}{who} | {file} · {n} วลี · ซิงค์ครั้งล่าสุด {when}{who} | MT |
| `pb_pat_rejected_detail` | GitHub rejected the PAT ({detail}) — check the token has repo read access | GitHub ปฏิเสธ PAT ({detail}) — ตรวจสอบว่าโทเค็นมีสิทธิ์การเข้าถึงการอ่าน repo | MT |
| `pb_no_pair_file` | No shared phrasebook file on GitHub yet for this pair — first save will create one | ยังไม่มีไฟล์ Phrasebook ที่แชร์บน GitHub สำหรับคู่นี้ — การบันทึกครั้งแรกจะสร้างขึ้นมา | MT |
| `pb_sync_blocked_file` | Sync blocked: file:// pages cannot call the GitHub API (CORS). Open the deployed URL to sync. | การซิงค์ถูกบล็อก: หน้า file:// ไม่สามารถเรียก GitHub API (CORS) เปิด URL ที่ใช้งานเพื่อซิงค์ | MT |
| `pb_sync_failed` | Sync failed: {detail} · {when} | การซิงค์ล้มเหลว: {detail} · {when} | MT |
| `pb_created_modified` | Created {cby} · {cat}  —  Modified {mby} · {mat} | สร้าง {cby} · {cat} — แก้ไข {mby} · {mat} | MT |
| `verdict_sounds_good` | ✓ Sounds Good | ✓ ฟังดูดี | MT |
| `verdict_flag` | ⚑ Flag | ⚑ ธง | MT |
| `pb_add_tag_ph` | Add tag… | เพิ่มแท็ก... | MT |
| `pb_clarify_note_ph` | Clarify note… | ชี้แจงหมายเหตุ... | MT |
| `pb_move_to_trash` | Move to trash | ย้ายไปที่ถังขยะ | MT |
| `pb_recently_deleted` | Recently Deleted ({n}) | ลบล่าสุด ({n}) | MT |
| `n_of_m_phrases` | {n} of {m} phrases | {n} จาก {m} วลี | MT |
| `n_phrases` | {n} phrases | {n} วลี | MT |
| `ks_verifying` | Verifying… | กำลังยืนยัน... | MT |
| `ks_timed_out` | Timed out | หมดเวลาแล้ว | MT |
| `ks_verified` | Verified | ตรวจสอบแล้ว | MT |
| `ks_invalid_key` | Invalid key | รหัสไม่ถูกต้อง | MT |
| `ks_rejected` | Rejected | ถูกปฏิเสธ | MT |
| `ks_network_error` | Network error | ข้อผิดพลาดของเครือข่าย | MT |
| `ks_pat_rejected` | GitHub rejected the PAT | GitHub ปฏิเสธ PAT | MT |
| `translation_check` | Translation check | ตรวจสอบการแปล | MT |
| `tc_said` | Said | กล่าวว่า | MT |
| `tc_normalized` | Normalized | ทำให้เป็นมาตรฐาน | MT |
| `tc_translated` | Translated | แปลแล้ว | MT |
| `tc_no_translation_yet` | (no translation yet) | (ยังไม่มีการแปล) | MT |
| `tc_back_translation` | Back-translation | แปลกลับ | MT |
| `tc_route` | Route | เส้นทาง | MT |
| `route_voice` | Voice | เสียง | MT |
| `route_phrasebook` | Phrasebook | หนังสือวลี | MT |
| `route_keyboard` | Keyboard | คีย์บอร์ด | MT |
| `route_desc_call` | Spoken into the microphone during a call | พูดใส่ไมโครโฟนระหว่างการโทร | MT |
| `route_desc_chat` | Spoken into the chat microphone | พูดใส่ไมโครโฟนแชท | MT |
| `route_desc_phrase` | Sent from the phrasebook | ส่งมาจากหนังสือวลี | MT |
| `route_desc_typed` | Typed on the keyboard | พิมพ์บนแป้นพิมพ์ | MT |
| `tc_checking` | Checking… | กำลังตรวจสอบ... | MT |
| `tc_match` | Match | ตรงกัน | MT |
| `tc_partial` | Partial | บางส่วน | MT |
| `tc_miss` | Miss | นางสาว | MT |
| `tc_said_vs_translated` | Said vs Translated | พูด vs แปลแล้ว | MT |
| `tc_normalized_vs_translated` | Normalized vs Translated | ทำให้เป็นมาตรฐานและแปลแล้ว | MT |
| `copied` | Copied | คัดลอกแล้ว | MT |
| `copy_failed` | Copy failed | การคัดลอกล้มเหลว | MT |
| `tc_no_translation` | No translation | ไม่มีการแปล | MT |
| `tc_bt_failed` | (back-translation failed) | (การแปลกลับล้มเหลว) | MT |
| `tc_check_failed` | Check failed | การตรวจสอบล้มเหลว | MT |
| `tc_same_as_target` |  · same as target | · เช่นเดียวกับเป้าหมาย | MT |
| `rh_ios` | Add TalkBridge to your Home Screen — calls and messages reach you when it’s closed. | เพิ่ม TalkBridge ลงในหน้าจอหลักของคุณ — สายและข้อความจะเข้าถึงคุณเมื่อปิดอยู่ | MT |
| `rh_step_share` | Tap the {b}Share{eb} button | แตะปุ่ม {b}แบ่งปัน{eb} | MT |
| `rh_step_add` | Choose {b}Add to Home Screen{eb} | เลือก {b}เพิ่มลงในหน้าจอหลัก{eb} | MT |
| `rh_unsupported_device` | This device’s software cannot deliver notifications to web apps. | ซอฟต์แวร์ของอุปกรณ์นี้ไม่สามารถส่งการแจ้งเตือนไปยังเว็บแอปได้ | MT |
| `rh_unsupported_browser` | Notifications can’t work in this browser — open the link in {browser} to be reached when the app is closed. | การแจ้งเตือนไม่ทำงานในเบราว์เซอร์นี้ — เปิดลิงก์ใน {browser} เพื่อให้เข้าถึงได้เมื่อปิดแอป | MT |
| `rh_default` | Want to know when they call or write? | ต้องการทราบเมื่อพวกเขาโทรหรือเขียน? | MT |
| `rh_denied_android` | Notifications are blocked for TalkBridge. Allow them in Chrome: ⋮ → Settings → Site settings → Notifications. | การแจ้งเตือนถูกบล็อกสำหรับ TalkBridge อนุญาตใน Chrome: ⋮ → การตั้งค่า → การตั้งค่าไซต์ → การแจ้งเตือน | MT |
| `rh_denied_ios` | Notifications are off for TalkBridge. Allow them in Settings → Notifications → TalkBridge. | การแจ้งเตือนสำหรับ TalkBridge ปิดอยู่ อนุญาตได้ในการตั้งค่า → การแจ้งเตือน → TalkBridge | MT |
| `rh_denied_desktop` | Notifications are blocked for TalkBridge. Allow them in your browser’s site settings for this page. | การแจ้งเตือนถูกบล็อกสำหรับ TalkBridge อนุญาตในการตั้งค่าไซต์เบราว์เซอร์ของคุณสำหรับหน้านี้ | MT |
| `rh_install` | Install TalkBridge as an app — optional. | ติดตั้ง TalkBridge เป็นแอป — เป็นทางเลือก | MT |
| `rh_nokeys` | This phone has no translation keys for this room — open the invite link again on this phone. | โทรศัพท์เครื่องนี้ไม่มีคีย์การแปลสำหรับห้องนี้ โปรดเปิดลิงก์คำเชิญอีกครั้งในโทรศัพท์เครื่องนี้ | MT |
| `sw_incoming_voice_call` | Incoming voice call | สายสนทนาเรียกเข้า | MT |
| `sw_incoming_video_call` | Incoming video call | สายวิดีโอขาเข้า | MT |
| `sw_new_message` | New message | ข้อความใหม่ | MT |
| `sw_missed_call` | Missed call | สายที่ไม่ได้รับ | MT |
| `sw_new_activity` | New activity | กิจกรรมใหม่ | MT |
