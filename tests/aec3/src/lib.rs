use sonora::{AudioProcessing, Config, StreamConfig};
use sonora::config::EchoCanceller;
static mut ENGINE: Option<AudioProcessing> = None;
static mut MIC: [i16;160] = [0;160];
static mut REF: [i16;160] = [0;160];
static mut OUT: [i16;160] = [0;160];
#[no_mangle] pub unsafe extern "C" fn aec_init() -> i32 {
 let config=Config{echo_canceller:Some(EchoCanceller::default()),..Default::default()};
 ENGINE=Some(AudioProcessing::builder().config(config).capture_config(StreamConfig::new(16000,1)).render_config(StreamConfig::new(16000,1)).build());1
}
#[no_mangle] pub unsafe extern "C" fn aec_mic()->*mut i16 {std::ptr::addr_of_mut!(MIC).cast()}
#[no_mangle] pub unsafe extern "C" fn aec_reference()->*mut i16 {std::ptr::addr_of_mut!(REF).cast()}
#[no_mangle] pub unsafe extern "C" fn aec_output()->*mut i16 {std::ptr::addr_of_mut!(OUT).cast()}
#[no_mangle] pub unsafe extern "C" fn aec_process()->i32 {
 if let Some(e)=ENGINE.as_mut(){let mut rendered=[0i16;160];
 if e.process_render_i16(&REF,&mut rendered).is_err(){return 0}
 if e.process_capture_i16(&MIC,&mut OUT).is_err(){return 0}return 1}0
}

#[no_mangle] pub unsafe extern "C" fn aec_delay(ms:i32){if let Some(e)=ENGINE.as_mut(){let _=e.set_stream_delay_ms(ms);}}

