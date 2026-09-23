param([string]$FixtureDirectory=(Join-Path $PSScriptRoot 'fixtures'))
New-Item -ItemType Directory -Force $FixtureDirectory | Out-Null
Add-Type -AssemblyName System.Speech
$synth=New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('Microsoft David Desktop')
$format=New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000,[System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,[System.Speech.AudioFormat.AudioChannel]::Mono)
$synth.SetOutputToWaveFile((Join-Path $FixtureDirectory 'reference-voice.wav'),$format)
$synth.Speak('This is the translated message from the device speaker. We need to make sure the microphone does not transcribe these words again. The other person should be able to keep talking naturally while the translation is read aloud. This is the translated message from the device speaker. We need to make sure the microphone does not transcribe these words again.')
$synth.SetOutputToNull()
$synth.Rate=1
$synth.SetOutputToWaveFile((Join-Path $FixtureDirectory 'near-voice.wav'),$format)
$synth.Speak('I would like to order a cup of coffee and a glass of water. Can you tell me where the nearest train station is? I am speaking while the translated message is playing. Please keep all of my words in the conversation. I would like to order a cup of coffee and a glass of water. Can you tell me where the nearest train station is?')
$synth.Dispose()
