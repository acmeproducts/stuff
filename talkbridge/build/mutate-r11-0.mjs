#!/usr/bin/env node
/* R11.0 mutation gate: delegates to the harness's planted defects. */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
execFileSync(process.execPath, [path.resolve('talkbridge/build/harness-r11-0.mjs'), '--mutations'], { stdio: 'inherit' });
