'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const code=fs.readFileSync('market-navigator-chart-correction/etl.js','utf8'),guard=code.slice(0,code.indexOf("const ETL_BUILD_ID"));
(async()=>{
async function check(fresh,expectedError){let blocked=false;const bytes=Buffer.from(JSON.stringify({qualification:{freshness:fresh}})),hash=crypto.createHash('sha256').update(bytes).digest('hex');
const scope={fetch:async()=>({ok:true,arrayBuffer:async()=>bytes}),etlHash:async b=>crypto.createHash('sha256').update(Buffer.from(b)).digest('hex'),TextDecoder,URL,Date,setTimeout:()=>1,clearTimeout:()=>{},location:{href:'https://example.test/throwaway.html'},document:{body:{classList:{remove:()=>{},add:()=>{blocked=true}}},getElementById:()=>null},console};
vm.createContext(scope);vm.runInContext(guard+'\nglobalThis.check=etlRequireComplete',scope);
if(expectedError)await assert.rejects(()=>scope.check({resources:{'market-evidence/sync-proof.json':hash}}),expectedError);else assert.equal((await scope.check({resources:{'market-evidence/sync-proof.json':hash}})).status,'PASS')}
const row={id:'hySpread',cadence:'daily',latest:'2026-10-20',required:'2026-10-20',status:'PASS',problems:[],missingMarketSessions:[]};
const q={schema:'market-navigator-release-completeness-v1',status:'PASS',marketDate:'2026-10-20',requiredSourceIds:['hySpread'],sources:[row],validUntil:new Date(Date.now()+3600000).toISOString()};
await check(q);await check(undefined,/INCOMPLETE_DATA/);await check({...q,status:'BLOCKED'},/INCOMPLETE_DATA/);await check({...q,sources:[{...row,latest:'2026-10-19'}]},/INCOMPLETE_DATA/);await check({...q,sources:[{...row,missingMarketSessions:['2026-10-20']}]},/INCOMPLETE_DATA/);await check({...q,validUntil:'2026-01-01'},/expired/);await check({...q,requiredSourceIds:['hySpread','tenYear']},/INCOMPLETE_DATA/);
console.log(JSON.stringify({status:'PASS',consumerGateCases:7}));
})().catch(e=>{console.error(e);process.exitCode=1});
