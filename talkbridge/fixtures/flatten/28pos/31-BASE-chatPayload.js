function chatPayload(e){
  return{type:'chat-msg',chatId:e.id,srcText:e.sourceText,tgtText:e.translatedText,srcLang:e.srcLang,tgtLang:e.tgtLang,senderName:e.senderName,origin:e.origin||'typed',attachment:e.attachment||null,ts:e.ts};
}
