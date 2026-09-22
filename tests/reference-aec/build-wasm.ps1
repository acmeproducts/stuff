param([Parameter(Mandatory=$true)][string]$EmccPython,[Parameter(Mandatory=$true)][string]$Python,[Parameter(Mandatory=$true)][string]$SpeexSource)
# SpeexDSP 1.2.1 archive SHA256:
# 8c777343e4a6399569c72abc38a95b24db56882c83dbdb6c6424a5f4aeb54d3d
# Emscripten 3.1.64. Set EM_CONFIG to its workspace-local .emscripten file.
$ErrorActionPreference='Stop'
$types=Join-Path $SpeexSource 'include/speex/speexdsp_config_types.h'
@'
#pragma once
#include <stdint.h>
typedef int16_t spx_int16_t;
typedef uint16_t spx_uint16_t;
typedef int32_t spx_int32_t;
typedef uint32_t spx_uint32_t;
'@ | Set-Content -Encoding utf8 $types
$sources=@('mdf.c','preprocess.c','filterbank.c','fftwrap.c','smallft.c') | ForEach-Object { Join-Path $SpeexSource "libspeexdsp/$_" }
$destination=Join-Path $PSScriptRoot 'speex.wasm'
& $Python $EmccPython (Join-Path $PSScriptRoot 'wrapper.c') @sources -I (Join-Path $SpeexSource 'include') -I (Join-Path $SpeexSource 'libspeexdsp') -DFLOATING_POINT -DUSE_SMALLFT -DEXPORT= -O3 -sSTANDALONE_WASM=1 -sFILESYSTEM=0 -sMALLOC=emmalloc -sINITIAL_MEMORY=4194304 -sSTACK_SIZE=65536 '-sEXPORTED_FUNCTIONS=["_aec_init","_aec_mic","_aec_reference","_aec_output","_aec_process","_aec_reset"]' --no-entry -o $destination
if($LASTEXITCODE -ne 0){throw 'AEC compilation failed'}
[IO.File]::WriteAllText((Join-Path $PSScriptRoot 'speex.wasm.b64'),[Convert]::ToBase64String([IO.File]::ReadAllBytes($destination)))
