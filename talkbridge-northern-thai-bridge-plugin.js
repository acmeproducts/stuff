<.>
Copy everything below into a file named exactly:
Plain text
talkbridge-northern-thai-bridge-plugin.js
JavaScript
/*
TalkBridge Northern Thai Bridge Plugin
Filename: talkbridge-northern-thai-bridge-plugin.js
Purpose: Browser-side normalization layer between Thai STT transcript and translation.
Runtime: Plain browser JavaScript. No build step. No external dependency.
API: window.TalkBridgeNorthernThaiBridge
*/

(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.TalkBridgeNorthernThaiBridge = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const VERSION = "0.3.0-copy-paste";

  const DEFAULT_OPTIONS = Object.freeze({
    enabled: true,
    sourceDialect: "northern_thai",
    targetThai: "central_thai",
    minConfidence: 0.5,
    applyMediumConfidence: true,
    preservePoliteParticles: true,
    sentenceFinalJaoReplacement: "ครับ",
    subjectJaoReplacement: "คุณ",
    enableBoPrefixRule: true,
    enableJaoDisambiguation: true,
    enableKnownHToRFallback: true,
    enableHeuristicHToR: false,
    emitEvents: false,
    debug: false
  });

  const THAI_MARKS = "\u0E31\u0E34-\u0E3A\u0E47-\u0E4E";
  const THAI_BASE = "\u0E01-\u0E2E";

  function e(id, northernThai, standardThai, englishHint, category, priority, confidence, requiresContext) {
    return {
      id,
      northernThai,
      standardThai,
      englishHint,
      category,
      matchType: "exact",
      priority,
      confidence,
      requiresContext: Boolean(requiresContext)
    };
  }

  const ENTRIES = [
    e("tb-001", "จอยเป็นไง", "ฉันเป็นอย่างไร", "How am I?", "critical_phrase", 100, 0.95),
    e("tb-002", "เจ้าเป็นไง", "คุณเป็นอย่างไร", "How are you?", "critical_phrase", 100, 0.95),
    e("tb-003", "ผ ้ ชาย", "ผู้ชาย", "man / male", "asr_repair", 100, 0.95),
    e("tb-004", "ผ้ ชาย", "ผู้ชาย", "man / male", "asr_repair", 100, 0.9),
    e("tb-005", "ผ ู ้ ชาย", "ผู้ชาย", "man / male", "asr_repair", 100, 0.95),
    e("tb-006", "ผู้ ชาย", "ผู้ชาย", "man / male", "asr_repair", 100, 0.85),
    e("tb-007", "ผ้ชาย", "ผู้ชาย", "man / male", "asr_repair", 100, 0.9),
    e("tb-008", "ผูชาย", "ผู้ชาย", "man / male", "asr_repair", 100, 0.9),
    e("tb-009", "ผ ้ หญิง", "ผู้หญิง", "woman / female", "asr_repair", 100, 0.9),
    e("tb-010", "ผ้ หญิง", "ผู้หญิง", "woman / female", "asr_repair", 100, 0.9),
    e("tb-011", "ผ ู ้ หญิง", "ผู้หญิง", "woman / female", "asr_repair", 100, 0.95),
    e("tb-012", "ผู้ หญิง", "ผู้หญิง", "woman / female", "asr_repair", 100, 0.85),
    e("tb-013", "ผ้หญิง", "ผู้หญิง", "woman / female", "asr_repair", 100, 0.9),
    e("tb-014", "ผูหญิง", "ผู้หญิง", "woman / female", "asr_repair", 100, 0.9),

    e("ph-001", "เปิ้นกึ๊ดเติงตั๋วหนา", "ฉันคิดถึงเธอนะ", "I miss you", "relationship_phrase", 98, 0.92),
    e("ph-002", "เปิ้นฮักตั๋วหนา", "ฉันรักเธอนะ", "I love you", "relationship_phrase", 98, 0.92),
    e("ph-003", "เปิ้นฮักตั๋ว", "ฉันรักเธอ", "I love you", "relationship_phrase", 98, 0.92),
    e("ph-004", "เป๋นใดสบายดีบ๋อ", "เป็นอย่างไร สบายดีไหม", "How are you? Are you well?", "greeting_question", 98, 0.92),
    e("ph-005", "สบายดีบ๋อ", "สบายดีไหม", "Are you well?", "greeting_question", 96, 0.9),
    e("ph-006", "กิ๋นข้าวแล้วกา", "กินข้าวแล้วหรือยัง", "Have you eaten?", "daily_question", 96, 0.9),
    e("ph-007", "ตั๋วกินข้าวแล้วบ่", "เธอกินข้าวแล้วหรือยัง", "Have you eaten?", "daily_question", 96, 0.9),
    e("ph-008", "ไป๋ย่ะหยังอยู่ตี้ได๋", "ไปทำอะไรอยู่ที่ไหน", "What are you doing and where?", "daily_question", 96, 0.9),
    e("ph-009", "อันนี้ของไผ", "อันนี้ของใคร", "Whose is this?", "question_phrase", 96, 0.9),
    e("ph-010", "อันนี้คือหยัง", "อันนี้คืออะไร", "What is this?", "question_phrase", 96, 0.9),
    e("ph-011", "อู้กำเมือง", "พูดภาษาเหนือ", "speak Northern Thai", "verb_phrase", 96, 0.9),
    e("ph-012", "ซาวบาท", "ยี่สิบบาท", "twenty baht", "money", 96, 0.94),
    e("ph-013", "ซาวเอ๋ด", "ยี่สิบเอ็ด", "twenty-one", "number", 96, 0.9),
    e("ph-014", "จ๊าดลำ", "อร่อยมาก", "very delicious", "adjective_phrase", 96, 0.92),
    e("ph-015", "ม่วนหลาย", "สนุกมาก", "very fun", "adjective_phrase", 96, 0.9),
    e("ph-016", "แซ่บหลาย", "อร่อยมาก", "very delicious", "adjective_phrase", 96, 0.9),
    e("ph-017", "บ่เป็นหยัง", "ไม่เป็นไร", "no problem / never mind", "negation_phrase", 96, 0.95),
    e("ph-018", "ขอบใจเจ้า", "ขอบคุณครับ", "thank you politely", "polite_phrase", 96, 0.9),
    e("ph-019", "ขอบใจ", "ขอบคุณ", "thank you", "polite_phrase", 96, 0.9),
    e("ph-020", "สวัสดีเจ้า", "สวัสดีครับ", "hello politely", "polite_phrase", 96, 0.9),
    e("ph-021", "สบายดีเจ้า", "สบายดีครับ", "I am fine politely", "polite_phrase", 96, 0.9),
    e("ph-022", "ลาก่อนเจ้า", "ลาก่อนครับ", "goodbye politely", "polite_phrase", 96, 0.9),
    e("ph-023", "ไปไสมาเจ้า", "ไปไหนมาครับ", "Where have you been?", "greeting_question", 96, 0.9),
    e("ph-024", "กิ๋นข้าวแล้วเจ้า", "กินข้าวแล้วครับ", "I have eaten already", "daily_phrase", 96, 0.9),
    e("ph-025", "เมินแล้ว", "นานแล้ว", "It has been a long time", "time_phrase", 96, 0.9),
    e("ph-026", "ฮักเจ้า", "รักคุณ", "I love you", "relationship_phrase", 96, 0.9),
    e("ph-027", "เว้ากันก่อน", "คุยกันก่อน", "Let's talk first", "verb_phrase", 96, 0.9),
    e("ph-028", "อู้ช้าๆ ได้ก่อ", "พูดช้าๆ ได้ไหม", "Can you speak slowly?", "service_phrase", 92, 0.86),
    e("ph-029", "อู้ใหม่ได้ก่อ", "พูดใหม่ได้ไหม", "Can you say it again?", "service_phrase", 92, 0.86),
    e("ph-030", "แปลเป็นภาษาอังกฤษได้ก่อ", "แปลเป็นภาษาอังกฤษได้ไหม", "Can you translate to English?", "service_phrase", 92, 0.86),
    e("ph-031", "ห้องน้ำอยู่ตี้ได๋", "ห้องน้ำอยู่ที่ไหน", "Where is the bathroom?", "service_phrase", 94, 0.9),
    e("ph-032", "ราคาเต้าใด", "ราคาเท่าไหร่", "How much is it?", "business_phrase", 94, 0.9),
    e("ph-033", "ลดได้ก่อ", "ลดได้ไหม", "Can you discount it?", "business_phrase", 94, 0.88),
    e("ph-034", "จ่ายเงินตี้ได๋", "จ่ายเงินที่ไหน", "Where do I pay?", "business_phrase", 94, 0.88),
    e("ph-035", "ขอใบเสร็จได้ก่อ", "ขอใบเสร็จได้ไหม", "Can I have a receipt?", "business_phrase", 94, 0.88),
    e("ph-036", "มีห้องว่างก่อ", "มีห้องว่างไหม", "Do you have a room available?", "hotel_phrase", 94, 0.88),
    e("ph-037", "ไปสนามบินทางใด", "ไปสนามบินทางไหน", "Which way to the airport?", "travel_phrase", 94, 0.88),
    e("ph-038", "ไปโฮงแรมทางใด", "ไปโรงแรมทางไหน", "Which way to the hotel?", "travel_phrase", 94, 0.88),

    e("pr-001", "จอย", "ฉัน", "I / me; Northern Thai first-person pronoun in TalkBridge context", "pronoun", 95, 0.82, true),
    e("pr-002", "เปิ้น", "เขา", "he / she / they; context-dependent", "pronoun", 95, 0.86, true),
    e("pr-003", "เฮา", "เรา", "we / us", "pronoun", 95, 0.9),
    e("pr-004", "ตั๋ว", "เธอ", "you; familiar", "pronoun", 95, 0.9),
    e("pr-005", "คิง", "มึง", "you; very informal", "pronoun", 92, 0.86, true),
    e("pr-006", "สู", "พวกคุณ", "you plural", "pronoun", 90, 0.82, true),
    e("pr-007", "หมู่เฮา", "พวกเรา", "we / us", "pronoun", 92, 0.86),
    e("pr-008", "หมู่เปิ้น", "พวกเขา", "they / them", "pronoun", 92, 0.86),
    e("pr-009", "อ้าย", "พี่ชาย", "older brother / older male", "person", 84, 0.76, true),
    e("pr-010", "ปี้", "พี่", "older sibling / respectful address", "person", 84, 0.76, true),
    e("pr-011", "แม่ญิง", "ผู้หญิง", "woman / female", "person", 92, 0.86),
    e("pr-012", "ป้อจาย", "ผู้ชาย", "man / male", "person", 92, 0.86),
    e("pr-013", "ละอ่อน", "เด็ก", "child", "person", 88, 0.82),

    e("ng-001", "บ่ได้", "ไม่ได้", "cannot / did not", "negation", 96, 0.9),
    e("ng-002", "บ่มี", "ไม่มี", "do not have / there is no", "negation", 96, 0.9),
    e("ng-003", "บ่ฮู้", "ไม่รู้", "do not know", "negation", 96, 0.9),
    e("ng-004", "บ่รู้", "ไม่รู้", "do not know", "negation", 96, 0.9),
    e("ng-005", "บ่ดี", "ไม่ดี", "not good", "negation", 96, 0.9),
    e("ng-006", "บ่ชอบ", "ไม่ชอบ", "do not like", "negation", 96, 0.9),
    e("ng-007", "บ่อยาก", "ไม่อยาก", "do not want", "negation", 96, 0.9),
    e("ng-008", "บ่เอา", "ไม่เอา", "do not want this", "negation", 96, 0.9),

    e("pt-001", "เน้อ", "นะ", "softening particle", "particle", 88, 0.84),
    e("pt-002", "เนาะ", "นะ", "softening / agreement particle", "particle", 88, 0.84),
    e("pt-003", "กา", "หรือยัง", "question particle in many eating/doing phrases", "particle", 80, 0.7, true),
    e("pt-004", "ก่อ", "ไหม", "question particle", "particle", 90, 0.86),
    e("pt-005", "บ๋อ", "ไหม", "question particle", "particle", 90, 0.86),

    e("qw-001", "จั๋งใด", "อย่างไร", "how", "question", 94, 0.9),
    e("qw-002", "เป็นไง", "เป็นอย่างไร", "how is it / how are you", "question", 94, 0.9),
    e("qw-003", "เป๋นหยัง", "เป็นอะไร", "what is wrong / what is it", "question", 94, 0.9),
    e("qw-004", "ทำหยัง", "ทำอะไร", "what are you doing", "question", 94, 0.9),
    e("qw-005", "ยะหยัง", "ทำอะไร", "what are you doing", "question", 94, 0.88),
    e("qw-006", "หยัง", "อะไร", "what", "question", 92, 0.86),
    e("qw-007", "อะหยัง", "อะไร", "what", "question", 92, 0.86),
    e("qw-008", "ไผ", "ใคร", "who", "question", 92, 0.86),
    e("qw-009", "ผู้ใด", "ใคร", "who", "question", 90, 0.82),
    e("qw-010", "ไส", "ไหน", "where", "question", 90, 0.82, true),
    e("qw-011", "ตี้ได๋", "ที่ไหน", "where", "question", 94, 0.9),
    e("qw-012", "เต้าใด", "เท่าไหร่", "how much", "question", 94, 0.9),
    e("qw-013", "เมื่อใด", "เมื่อไหร่", "when", "question", 90, 0.82),

    e("vb-001", "กิ๋น", "กิน", "eat", "verb", 92, 0.9),
    e("vb-002", "ผ่อ", "ดู", "look / watch / see", "verb", 92, 0.9),
    e("vb-003", "แอ่ว", "เที่ยว", "travel / visit / go out", "verb", 92, 0.9),
    e("vb-004", "กึ๊ด", "คิด", "think", "verb", 92, 0.9),
    e("vb-005", "กึ๊ดเติง", "คิดถึง", "miss / think of", "verb", 94, 0.9),
    e("vb-006", "อู้", "พูด", "speak / talk", "verb", 92, 0.9),
    e("vb-007", "เว้า", "พูด", "speak / talk", "verb", 88, 0.82),
    e("vb-008", "หื้อ", "ให้", "give / for / to", "verb", 92, 0.9),
    e("vb-009", "ฮู้", "รู้", "know", "verb", 92, 0.9),
    e("vb-010", "ฮัก", "รัก", "love", "verb", 92, 0.9),
    e("vb-011", "ฮับ", "รับ", "receive", "verb", 92, 0.9),
    e("vb-012", "ฮ้องไห้", "ร้องไห้", "cry", "verb", 92, 0.9),
    e("vb-013", "เมือ", "ไป", "go; directional/context-dependent", "verb", 78, 0.7, true),
    e("vb-014", "ล่น", "วิ่ง", "run", "verb", 82, 0.76),
    e("vb-015", "ปิ๊ก", "กลับ", "return", "verb", 86, 0.78),
    e("vb-016", "ปิ๊กบ้าน", "กลับบ้าน", "go home", "verb_phrase", 92, 0.86),

    e("ad-001", "หลาย", "มาก", "many / much / very", "modifier", 90, 0.86, true),
    e("ad-002", "ขนาด", "มาก", "very", "modifier", 88, 0.82, true),
    e("ad-003", "จ๊าด", "มาก", "very", "modifier", 88, 0.82, true),
    e("ad-004", "ลำ", "อร่อย", "delicious", "adjective", 92, 0.9),
    e("ad-005", "แซ่บ", "อร่อย", "delicious", "adjective", 88, 0.82),
    e("ad-006", "ม่วน", "สนุก", "fun", "adjective", 92, 0.9),
    e("ad-007", "ม่วนใจ๋", "มีความสุข", "happy", "adjective", 92, 0.9),
    e("ad-008", "งาม", "สวย", "beautiful", "adjective", 92, 0.9),
    e("ad-009", "ดีใจ๋", "ดีใจ", "glad", "adjective", 90, 0.86),
    e("ad-010", "ใจ๋", "ใจ", "heart / mind", "noun", 88, 0.82),
    e("ad-011", "เมิน", "นาน", "long time", "time", 90, 0.86),
    e("ad-012", "ฮ้อน", "ร้อน", "hot", "adjective", 92, 0.9),
    e("ad-013", "แปง", "แพง", "expensive", "adjective", 84, 0.76, true),
    e("ad-014", "ถืก", "ถูก", "cheap / correct", "adjective", 84, 0.76, true),

    e("nn-001", "มื้อ", "วัน", "day", "time", 88, 0.82, true),
    e("nn-002", "มื้อนี้", "วันนี้", "today", "time", 94, 0.9),
    e("nn-003", "มื้อวาน", "เมื่อวาน", "yesterday", "time", 94, 0.9),
    e("nn-004", "มื้ออื่น", "วันอื่น", "another day", "time", 90, 0.82),
    e("nn-005", "ค่ำนี้", "คืนนี้", "tonight", "time", 90, 0.82),
    e("nn-006", "กาด", "ตลาด", "market", "place", 90, 0.86),
    e("nn-007", "โฮงเฮียน", "โรงเรียน", "school", "place", 88, 0.82),
    e("nn-008", "โฮงแรม", "โรงแรม", "hotel", "place", 88, 0.82),
    e("nn-009", "ฮ้าน", "ร้าน", "shop / restaurant", "place", 88, 0.82),
    e("nn-010", "ตี้", "ที่", "at / place marker", "location", 90, 0.86),
    e("nn-011", "หั้น", "นั้น", "there / that", "location", 88, 0.82),
    e("nn-012", "อั้น", "อัน", "that thing / one", "location", 84, 0.76, true),
    e("nn-013", "ฮ่ม", "ร่ม", "umbrella / shade", "noun", 88, 0.82),
    e("nn-014", "ซาว", "ยี่สิบ", "twenty", "number", 94, 0.9),
    e("nn-015", "ฝรั่ง", "ชาวต่างชาติ", "foreigner / Westerner", "person", 70, 0.66),
    e("nn-016", "รถแดง", "รถแดง", "red truck / songthaew", "transport", 60, 0.6),
    e("nn-017", "ข้าวซอย", "ข้าวซอย", "khao soi", "food", 60, 0.6),
    e("nn-018", "น้ำเปล่า", "น้ำเปล่า", "water", "food", 60, 0.6),
    e("nn-019", "สนามบิน", "สนามบิน", "airport", "place", 60, 0.6),
    e("nn-020", "แท็กซี่", "แท็กซี่", "taxi", "transport", 60, 0.6),
    e("nn-021", "ร้านอาหาร", "ร้านอาหาร", "restaurant", "place", 60, 0.6),
    e("nn-022", "บ้าน", "บ้าน", "home / village", "place", 60, 0.6),
    e("nn-023", "ร้าน", "ร้าน", "shop / restaurant", "place", 60, 0.6),
    e("nn-024", "เงิน", "เงิน", "money", "business", 60, 0.6),
    e("nn-025", "ราคา", "ราคา", "price", "business", 60, 0.6)
  ];

  const CENTRAL_LEXICON = new Set([
    "รู้", "รัก", "รับ", "ร้อน", "ร้องไห้", "ร่ม", "ร้าน", "รู้สึก", "โรงเรียน", "โรงแรม",
    "ไม่รู้", "ไม่รัก", "ไม่รับ", "ไม่ร้อน", "ไม่ร้องไห้", "ไม่เป็นไร", "ไม่ได้", "ไม่มี",
    "ผู้ชาย", "ผู้หญิง", "ฉัน", "คุณ", "เขา", "เรา", "เธอ", "กิน", "พูด", "เที่ยว", "คิด",
    "ตลาด", "ร้านอาหาร", "โรงแรม", "สนามบิน", "ราคา", "เท่าไหร่", "ที่ไหน", "อะไร", "ใคร",
    "ยี่สิบ", "ยี่สิบเอ็ด", "ยี่สิบบาท", "วันนี้", "เมื่อวาน", "คืนนี้", "นาน", "สนุก", "อร่อย", "สวย"
  ]);

  const SUBJECT_JAO_FOLLOWERS = [
    "เป็น", "ไป", "มา", "กิน", "กิ๋น", "ฮู้", "รู้", "ฮัก", "รัก", "เอา", "อยาก", "มี", "อยู่",
    "ทำ", "ยะ", "อู้", "พูด", "ซื้อ", "ขาย", "จ่าย", "ช่วย", "ขอ", "จะ", "ได้"
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function cleanThaiText(input) {
    if (input == null) return "";

    let text = String(input).normalize("NFC").trim();
    text = text.replace(/\s+/g, " ");

    text = text.replace(new RegExp("([" + THAI_BASE + "])\\s+([" + THAI_MARKS + "])", "g"), "$1$2");
    text = text.replace(new RegExp("([" + THAI_MARKS + "])\\s+([" + THAI_BASE + "])", "g"), "$1$2");

    text = text.replace(/ผ\s*ู\s*้\s*/g, "ผู้");
    text = text.replace(/ผ\s*้\s*/g, "ผู้");
    text = text.replace(/ผู้\s+(ชาย|หญิง)/g, "ผู้$1");

    return text.trim();
  }

  function normalizeOptions(baseOptions, runtimeOptions) {
    return Object.assign({}, DEFAULT_OPTIONS, baseOptions || {}, runtimeOptions || {});
  }

  function shouldApplyEntry(entry, options) {
    if (!entry) return false;
    if (entry.confidence < options.minConfidence) return false;
    if (!options.applyMediumConfidence && entry.confidence < 0.75) return false;
    return true;
  }

  function splitEntries(entries) {
    const asrRepair = [];
    const phrase = [];
    const word = [];

    for (const entry of entries) {
      if (entry.category === "asr_repair") {
        asrRepair.push(entry);
      } else if (entry.northernThai.length > 4 || /\s/.test(entry.northernThai)) {
        phrase.push(entry);
      } else {
        word.push(entry);
      }
    }

    const sorter = (a, b) =>
      b.priority - a.priority ||
      b.northernThai.length - a.northernThai.length ||
      b.confidence - a.confidence ||
      a.northernThai.localeCompare(b.northernThai);

    asrRepair.sort(sorter);
    phrase.sort(sorter);
    word.sort(sorter);

    return { asrRepair, phrase, word };
  }

  function addRule(appliedRules, dialectHints, entry, before, after, phase) {
    appliedRules.push({
      id: entry.id,
      phase,
      source: entry.northernThai,
      replacement: entry.standardThai,
      confidence: entry.confidence,
      category: entry.category,
      before,
      after
    });

    if (entry.englishHint) {
      dialectHints.push(entry.northernThai + " = " + entry.englishHint);
    }
  }

  function applyExactEntries(text, entries, options, phase, appliedRules, dialectHints) {
    let output = text;

    for (const entry of entries) {
      if (!shouldApplyEntry(entry, options)) continue;
      if (!output.includes(entry.northernThai)) continue;

      const before = output;
      output = output.split(entry.northernThai).join(entry.standardThai);

      if (output !== before) {
        addRule(appliedRules, dialectHints, entry, before, output, phase);
      }
    }

    return output;
  }

  function applyJaoDisambiguation(text, options, appliedRules, dialectHints) {
    if (!options.enableJaoDisambiguation || !text.includes("เจ้า")) return text;

    let output = text;
    const beforeAll = output;

    output = output.replace(/เจ้า\s*([.!?。！？]*\s*)$/u, options.sentenceFinalJaoReplacement + "$1");

    for (const follower of SUBJECT_JAO_FOLLOWERS) {
      output = output.replace(new RegExp("เจ้า(?=" + escapeRegex(follower) + ")", "g"), options.subjectJaoReplacement);
      output = output.replace(new RegExp("เจ้า\\s+(?=" + escapeRegex(follower) + ")", "g"), options.subjectJaoReplacement + " ");
    }

    if (output !== beforeAll) {
      appliedRules.push({
        id: "rule-jao-disambiguation",
        phase: "context_rule",
        source: "เจ้า",
        replacement: "contextual: " + options.subjectJaoReplacement + " / " + options.sentenceFinalJaoReplacement,
        confidence: 0.84,
        category: "context_rule",
        before: beforeAll,
        after: output
      });
      dialectHints.push("เจ้า = คุณ when subject-like; เจ้า = polite particle when sentence-final");
    }

    return output;
  }

  function applyBoPrefixRule(text, options, appliedRules, dialectHints) {
    if (!options.enableBoPrefixRule || !text.includes("บ่")) return text;

    const before = text;
    let output = text;

    output = output.replace(/บ่\s*/g, "ไม่");
    output = output.replace(/ไม่ฮู้/g, "ไม่รู้");
    output = output.replace(/ไม่ฮัก/g, "ไม่รัก");
    output = output.replace(/ไม่ฮับ/g, "ไม่รับ");
    output = output.replace(/ไม่เป็นหยัง/g, "ไม่เป็นไร");

    if (output !== before) {
      appliedRules.push({
        id: "rule-bo-prefix",
        phase: "pattern_rule",
        source: "บ่ + word",
        replacement: "ไม่ + word",
        confidence: 0.9,
        category: "negation_rule",
        before,
        after: output
      });
      dialectHints.push("บ่ = ไม่ as Northern Thai negation prefix");
    }

    return output;
  }

  function applyKnownHToRFallback(text, options, appliedRules, dialectHints) {
    if (!options.enableKnownHToRFallback && !options.enableHeuristicHToR) return text;

    const before = text;
    let output = text;

    const known = [
      ["ฮู้สึก", "รู้สึก"],
      ["ฮ้องไห้", "ร้องไห้"],
      ["ฮู้", "รู้"],
      ["ฮัก", "รัก"],
      ["ฮับ", "รับ"],
      ["ฮ้อน", "ร้อน"],
      ["ฮ่ม", "ร่ม"],
      ["ฮ้าน", "ร้าน"],
      ["โฮงเฮียน", "โรงเรียน"],
      ["โฮงแรม", "โรงแรม"]
    ];

    if (options.enableKnownHToRFallback) {
      for (const pair of known) {
        output = output.split(pair[0]).join(pair[1]);
      }
    }

    if (options.enableHeuristicHToR) {
      output = output.replace(/(^|\s)ฮ([\u0E01-\u0E7F]+)/g, function (match, prefix, rest) {
        const candidate = "ร" + rest;
        return CENTRAL_LEXICON.has(candidate) ? prefix + candidate : match;
      });
    }

    if (output !== before) {
      appliedRules.push({
        id: "rule-h-to-r",
        phase: "pattern_rule",
        source: "ฮ → ร",
        replacement: "known Northern Thai h-initial to Central Thai r-initial",
        confidence: 0.84,
        category: "phonological_rule",
        before,
        after: output
      });
      dialectHints.push("Northern Thai ฮ often maps to Central Thai ร in common words");
    }

    return output;
  }

  function computeConfidence(appliedRules) {
    if (!appliedRules.length) return 0;
    const total = appliedRules.reduce((sum, rule) => sum + (Number(rule.confidence) || 0), 0);
    return Number((total / appliedRules.length).toFixed(3));
  }

  function buildTranslatorInstruction(result) {
    if (!result || !result.shouldUseNormalizedThai) {
      return "Translate the provided Thai text into natural English.";
    }

    return [
      "Translate the normalized Central Thai text into natural English.",
      "The original source may be Northern Thai / Kam Mueang or damaged Thai ASR output.",
      "Use normalizedThai as the primary source.",
      "Use dialectHints only to resolve ambiguity.",
      "Do not treat จอย as the English name Joy when it is marked as a first-person pronoun."
    ].join(" ");
  }

  class Bridge {
    constructor(options) {
      this.options = normalizeOptions(options);
      this.entries = clone(ENTRIES);

      const split = splitEntries(this.entries);
      this.asrRepairEntries = split.asrRepair;
      this.phraseEntries = split.phrase;
      this.wordEntries = split.word;
    }

    normalize(input, runtimeOptions) {
      const options = normalizeOptions(this.options, runtimeOptions);
      const rawTranscript = input == null ? "" : String(input);
      const cleanedTranscript = cleanThaiText(rawTranscript);

      if (!options.enabled) {
        return {
          rawTranscript,
          cleanedTranscript,
          normalizedThai: cleanedTranscript,
          translationText: cleanedTranscript,
          sourceDialect: options.sourceDialect,
          targetThai: options.targetThai,
          dialectHints: [],
          appliedRules: [],
          bridgeConfidence: 0,
          changed: cleanedTranscript !== rawTranscript,
          shouldUseNormalizedThai: false,
          translatorInstruction: "Translate the provided Thai text into natural English."
        };
      }

      const appliedRules = [];
      const dialectHints = [];
      let working = cleanedTranscript;

      working = applyExactEntries(working, this.asrRepairEntries, options, "asr_repair", appliedRules, dialectHints);
      working = cleanThaiText(working);
      working = applyExactEntries(working, this.phraseEntries, options, "lookup_phrase", appliedRules, dialectHints);
      working = applyJaoDisambiguation(working, options, appliedRules, dialectHints);
      working = applyBoPrefixRule(working, options, appliedRules, dialectHints);
      working = applyKnownHToRFallback(working, options, appliedRules, dialectHints);
      working = applyExactEntries(working, this.wordEntries, options, "lookup_word", appliedRules, dialectHints);
      working = cleanThaiText(working);

      const result = {
        rawTranscript,
        cleanedTranscript,
        normalizedThai: working,
        translationText: appliedRules.length ? working : cleanedTranscript,
        sourceDialect: options.sourceDialect,
        targetThai: options.targetThai,
        dialectHints: Array.from(new Set(dialectHints)),
        appliedRules,
        bridgeConfidence: computeConfidence(appliedRules),
        changed: working !== cleanedTranscript || cleanedTranscript !== rawTranscript,
        shouldUseNormalizedThai: appliedRules.length > 0,
        translatorInstruction: ""
      };

      result.translatorInstruction = buildTranslatorInstruction(result);

      if (options.emitEvents && typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
        window.dispatchEvent(new CustomEvent("talkbridge:transcript-bridged", { detail: result }));
      }

      if (options.debug && typeof console !== "undefined") {
        console.debug("TalkBridgeNorthernThaiBridge.normalize", result);
      }

      return result;
    }

    prepareForTranslation(input, runtimeOptions) {
      const result = this.normalize(input, runtimeOptions);

      return Object.assign({}, result, {
        payload: {
          text: result.translationText,
          normalizedThai: result.normalizedThai,
          rawTranscript: result.rawTranscript,
          sourceDialect: result.sourceDialect,
          dialectHints: result.dialectHints,
          translatorInstruction: result.translatorInstruction
        }
      });
    }

    wrapTranslator(translatorFunction, runtimeOptions) {
      if (typeof translatorFunction !== "function") {
        throw new TypeError("wrapTranslator expects a function.");
      }

      const bridge = this;

      return async function bridgedTranslator(input) {
        const text = typeof input === "string"
          ? input
          : (input && (input.text || input.transcript || input.rawTranscript)) || "";

        const bridged = bridge.prepareForTranslation(text, runtimeOptions);

        if (typeof input === "string") {
          return translatorFunction.call(this, bridged.translationText, bridged);
        }

        const nextInput = Object.assign({}, input || {}, bridged.payload, {
          text: bridged.translationText,
          bridge: bridged
        });

        return translatorFunction.call(this, nextInput);
      };
    }

    installGlobalPatch(config) {
      const options = Object.assign({ functionName: "translateToEnglish", overwrite: true }, config || {});

      if (typeof window === "undefined") return false;

      const fn = window[options.functionName];

      if (typeof fn !== "function") return false;
      if (fn.__talkBridgeNorthernThaiWrapped && !options.overwrite) return true;

      const wrapped = this.wrapTranslator(fn, options.runtimeOptions || {});
      wrapped.__talkBridgeNorthernThaiWrapped = true;
      wrapped.__talkBridgeNorthernThaiOriginal = fn;

      window[options.functionName] = wrapped;
      return true;
    }

    attachTranscriptEventListener(config) {
      const options = Object.assign({
        eventName: "talkbridge:transcript-final",
        outputEventName: "talkbridge:transcript-bridged"
      }, config || {});

      if (typeof window === "undefined" || typeof window.addEventListener !== "function") return false;

      const bridge = this;

      window.addEventListener(options.eventName, function (event) {
        const detail = event && event.detail ? event.detail : {};
        const text = typeof detail === "string" ? detail : (detail.text || detail.transcript || detail.rawTranscript || "");
        const bridged = bridge.prepareForTranslation(text, options.runtimeOptions || {});
        window.dispatchEvent(new CustomEvent(options.outputEventName, { detail: bridged }));
      });

      return true;
    }

    getData() {
      return {
        version: VERSION,
        entries: clone(this.entries),
        options: clone(this.options)
      };
    }
  }

  function create(options) {
    return new Bridge(options);
  }

  const defaultBridge = create();

  return {
    version: VERSION,
    create,
    defaultBridge,
    cleanThaiText,

    normalizeTranscript: function (input, options) {
      return defaultBridge.normalize(input, options);
    },

    prepareForTranslation: function (input, options) {
      return defaultBridge.prepareForTranslation(input, options);
    },

    wrapTranslator: function (translatorFunction, options) {
      return defaultBridge.wrapTranslator(translatorFunction, options);
    },

    installGlobalPatch: function (config) {
      return defaultBridge.installGlobalPatch(config);
    }
  };
});
