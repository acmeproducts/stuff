function leaveRoomInternals(){
  if(CALL.active)CALL.hangUp(true);
  if(CHATMIC.on)CHATMIC.stop(true); // was leaking across room switches — never torn down on exit
  relayDisconnect();
  if(PB.isDirty())pbWriteBack();
  S.roomId=null;transcript=[];
}
