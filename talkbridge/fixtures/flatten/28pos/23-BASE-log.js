function log(ev,d,lvl){debugLog.push({ts:new Date().toISOString(),ev:ev,d:d||{},lvl:lvl||'info'});if(debugLog.length>400)debugLog.shift()}
