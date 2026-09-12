from pathlib import Path
p=Path('market-navigator-build-turn23.py')
s=p.read_text()
bad="assert 'type=\"password\"' not in ''.join(x for x in s.split('<div class=\"cfgPanel card\" id=\"cfgAi\"',1)[1].split('</div><div class=\"cfgPanel card\" id=\"cfgChart\"',1)[:1])"
good="ai=s.split('id=\"cfgAi\"',1)[1].split('id=\"cfgChart\"',1)[0]; assert 'type=\"password\"' not in ai"
if bad not in s: raise SystemExit('builder validation anchor missing')
exec(compile(s.replace(bad,good,1),'market-navigator-build-turn23.py','exec'))
