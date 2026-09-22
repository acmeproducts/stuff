#include <stdint.h>
#include "speex/speex_echo.h"
#include "speex/speex_preprocess.h"
static SpeexPreprocessState *pre;
static SpeexEchoState *state;
static int16_t mic[128], reference[128], output[128];
int aec_init(int rate, int tail) {
 if(pre) speex_preprocess_state_destroy(pre);
 if(state) speex_echo_state_destroy(state);
 state=speex_echo_state_init(128,tail);
 if(!state) return 0;
 speex_echo_ctl(state,SPEEX_ECHO_SET_SAMPLING_RATE,&rate);
 pre=speex_preprocess_state_init(128,rate);
 int off=0,on=1,echo=-45,active=-6;
 speex_preprocess_ctl(pre,SPEEX_PREPROCESS_SET_ECHO_STATE,state);
 speex_preprocess_ctl(pre,SPEEX_PREPROCESS_SET_DENOISE,&on);
 speex_preprocess_ctl(pre,SPEEX_PREPROCESS_SET_AGC,&off);
 speex_preprocess_ctl(pre,SPEEX_PREPROCESS_SET_ECHO_SUPPRESS,&echo);
 speex_preprocess_ctl(pre,SPEEX_PREPROCESS_SET_ECHO_SUPPRESS_ACTIVE,&active);
 return 1;
}
int16_t *aec_mic(void){return mic;}
int16_t *aec_reference(void){return reference;}
int16_t *aec_output(void){return output;}
void aec_process(void){if(state){speex_echo_cancellation(state,mic,reference,output);speex_preprocess_run(pre,output);}}
void aec_reset(void){if(state)speex_echo_state_reset(state);}
