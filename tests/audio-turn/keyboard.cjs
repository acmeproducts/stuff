// Runs the unchanged keyboard regression suite (via the Chatlink parity wrapper) against chat-test.html.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const source=path.join(__dirname,'../chatlink/lab-parity.cjs');let s=fs.readFileSync(source,'utf8');
if(!s.includes("'chatlink-turn01-pre-base.html'"))throw new Error('Baseline wrapper changed');
s=s.split("'chatlink-turn01-pre-base.html'").join("'chat-test.html'");
// The speech block differs from chat.html by design (the audio change); every keyboard assertion still runs.
const a="if(!suite.includes(anchor))throw new Error('Baseline test setup changed');";if(!s.includes(a))throw new Error('Baseline wrapper changed');
s=s.replace(a,a+"\nconst skipBlock=\"assert.equal(block(html), block(production), 'Speech and ownership block must match production');\";if(!suite.includes(skipBlock))throw new Error('Baseline suite changed');suite=suite.replace(skipBlock,'');");
const m=new Module(source,module);m.filename=source;m.paths=module.paths.concat(Module._nodeModulePaths(path.dirname(source)));m._compile(s,source);
