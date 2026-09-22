# Chatlink audio overlap experiment

Open chat-test.html. This is a copy of the accepted portal with separate conversation storage and writer lock. Device speech credentials are reused. Existing conversations are not automatically copied.

- Queue until gap (default): keeps STT streaming, queues TTS in order, starts playback after 900 ms without microphone energy above the experimental threshold.
- Continuous + AEC: keeps STT streaming and plays queued TTS without waiting for a gap.
- Hold / resume: stops current playback while leaving recognition running; interrupted audio can be replayed from its message. Pending items remain queued.

The microphone already requests browser echo cancellation in the accepted build. This experiment does not claim stronger cancellation. Energy is not speaker identification; background noise and residual speaker echo can delay queued playback. Playback already underway is not automatically interrupted by energy, because speaker echo could trigger that interruption itself. The queue is limited to 20 pending items; further audio is available through message replay. Room changes, owner-menu opening and page hiding clear playback through existing cancellation paths.

No recognition results are filtered or buffered. Normalization and translation remain unchanged. This tests scheduling and browser AEC, not a solved full-duplex acoustic system.

Build: node tests/audio-overlap/build.cjs
Control tests: node tests/audio-overlap/test.cjs

Acoustic evaluation: compare both modes with speaker-only playback, human-only speech, simultaneous speech, high speaker volume, both directions and background noise. Verify original spoken words and absence of self-generated messages. Real microphone/speaker evaluation remains required; automated scheduling tests cannot establish acoustic cancellation quality.

## r2 microphone guard and debug log
Default Hold while mic on blocks TTS while either microphone is active or being acquired. Finish speaking / play queue stops recognition and releases retained playback; toggling the microphone off also retains pending playback. Other teardown paths clear pending audio. This trades simultaneous spoken translation for preventing overlap. The expandable debug log beneath configuration contains timestamped STT microphone/socket events, recognized text, queued/spoken TTS text, cancellation, errors and mode changes. It is capped at 300 entries, kept in memory and can be copied. Prior comparison modes remain available and may reproduce feedback.
