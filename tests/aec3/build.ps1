$ErrorActionPreference = 'Stop'
rustup target add wasm32-unknown-unknown
if ($LASTEXITCODE) { throw 'Target installation failed' }
cargo build --manifest-path "$PSScriptRoot/Cargo.toml" --target wasm32-unknown-unknown --release --locked
if ($LASTEXITCODE) { throw 'WASM build failed' }
[IO.File]::WriteAllText("$PSScriptRoot/aec3.wasm.b64", [Convert]::ToBase64String([IO.File]::ReadAllBytes("$PSScriptRoot/target/wasm32-unknown-unknown/release/chat_aec3.wasm")))
