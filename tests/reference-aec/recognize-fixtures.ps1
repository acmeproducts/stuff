param([Parameter(Mandatory=$true)][string]$FixtureDirectory)
Add-Type -AssemblyName System.Speech
$result=@()
foreach($name in @('baseline','clean-20','clean-80','clean-160')){
 $rec=New-Object System.Speech.Recognition.SpeechRecognitionEngine([Globalization.CultureInfo]::GetCultureInfo('en-US'))
 $rec.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
 $rec.SetInputToWaveFile((Join-Path $FixtureDirectory "$name.wav"))
 $sentences=@()
 try { while($null -ne ($item=$rec.Recognize())){$sentences+=$item.Text} } catch { if($_.Exception.InnerException.Message -notlike '*No audio input*'){throw} }
 $result+=@{name=$name;text=($sentences -join ' ')}
 $rec.Dispose()
}
$result | ConvertTo-Json

if(@($result | Where-Object { $_.name -ne 'baseline' -and $_.text -match 'This is' }).Count -gt 0){throw 'Quality gate failed: speaker transcript leaked into cleaned speech'}
