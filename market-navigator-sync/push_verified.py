"""Publish a verified commit without overwriting concurrent repository work."""
import hashlib,json,subprocess,sys
from pathlib import Path

def checked_inputs(proof):
    for name,expected in proof['input_hashes'].items():
        if hashlib.sha256(Path(name).read_bytes()).hexdigest()!=expected:
            raise RuntimeError('Publication blocked: verified implementation changed concurrently: '+name)

def publish(proof):
    for attempt in range(3):
        checked_inputs(proof)
        result=subprocess.run(['git','push','origin','HEAD:main'],capture_output=True,text=True)
        if result.returncode==0:
            print(result.stdout+result.stderr);return
        if not any(token in result.stderr for token in ('fetch first','non-fast-forward','[rejected]')) or attempt==2:
            raise RuntimeError('Publication push failed; verified data remains preserved. '+result.stderr)
        # Only replay the already verified commit. No force push, reset or discard.
        subprocess.run(['git','-c','rebase.autoStash=true','pull','--rebase','origin','main'],check=True)
    raise RuntimeError('Concurrent publication did not settle')

if __name__=='__main__':
    publish(json.loads(Path('.evidence/chart-construction-proof.json').read_text()))
