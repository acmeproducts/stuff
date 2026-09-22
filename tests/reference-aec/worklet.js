/* SpeexDSP 1.2.1 runs on paired 128-sample microphone/reference blocks. */
class ReferenceAEC extends AudioWorkletProcessor {
 constructor(options){
  super();const module=options.processorOptions.module;
  const instance=new WebAssembly.Instance(module,{wasi_snapshot_preview1:{fd_write:()=>0,fd_close:()=>0,fd_seek:()=>0,proc_exit:()=>{throw new Error('AEC runtime exit')}},env:{emscripten_notify_memory_growth:()=>{}}});
  this.e=instance.exports;if(this.e._initialize)this.e._initialize();
  if(!this.e.aec_init(sampleRate,Math.round(sampleRate*.256)))throw new Error('AEC initialization failed');
  this.mic=new Int16Array(this.e.memory.buffer,this.e.aec_mic(),128);
  this.ref=new Int16Array(this.e.memory.buffer,this.e.aec_reference(),128);
  this.clean=new Int16Array(this.e.memory.buffer,this.e.aec_output(),128);
  this.bypass=false;this.frames=0;this.energy=[0,0,0];this.clipped=0;
  this.port.onmessage=ev=>{if(ev.data.type==='bypass')this.bypass=!!ev.data.value;};
 }
 process(inputs,outputs){
  const mic=inputs[0]?.[0],ref=inputs[1]?.[0],out=outputs[0][0];
  if(out.length!==128)throw new Error('Unsupported render quantum');
  for(let i=0;i<128;i++){const m=mic?.[i]||0,r=ref?.[i]||0;this.mic[i]=Math.max(-32768,Math.min(32767,Math.round(m*32768)));this.ref[i]=Math.max(-32768,Math.min(32767,Math.round(r*32768)));if(Math.abs(m)>=.99)this.clipped++;this.energy[0]+=m*m;this.energy[1]+=r*r;}
  this.e.aec_process();
  for(let i=0;i<128;i++){out[i]=this.bypass?(mic?.[i]||0):this.clean[i]/32768;this.energy[2]+=out[i]*out[i];}
  this.frames++;
  if(this.frames>=125){this.port.postMessage({type:'levels',micRms:Math.sqrt(this.energy[0]/(128*this.frames)),referenceRms:Math.sqrt(this.energy[1]/(128*this.frames)),outputRms:Math.sqrt(this.energy[2]/(128*this.frames)),clipped:this.clipped,bypass:this.bypass});this.frames=0;this.energy.fill(0);this.clipped=0;}
  return true;
 }
}
registerProcessor('chat-reference-aec',ReferenceAEC);
