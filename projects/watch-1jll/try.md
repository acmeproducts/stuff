## (0) TURN/STAGE LEDGER

| Turn | Date | Status | Note |
|:---|:---|:---|:---|
| 0 | 2026-10-16 | INIT | Plan seeded; target locked to try.html |

## (1) RELEASES

1. **R1** — First playable (scope TBD)
2. **R2** — TBD
3. **R3** — TBD

## (2) R1: FIRST PLAYABLE

### Scope
**IN:** • TBD  
**OUT:** • TBD  

### Build Gates
• Loads on mobile without console errors  
• All state visible via in-app diagnostics (no DevTools-only checks)  
• Touch interactions responsive  

### Backlog
• Define app concept and core loop  
• Scaffold single-file HTML/CSS/JS  
• Implement basic functionality  
• Add diagnostics panel  

## (3) FUTURE IDEAS

• TBD

## (4) IMMUTABLE WORKING RULES

1. **Mobile-first**: Touch-optimized, small-screen layout  
2. **In-app diagnostics**: Debug state/logs visible in UI only  
3. **Update-plan-before-code**: Append LEDGER row before writing code  
4. **Read-back verification**: Test on real device after every push  
5. **No stubs**: No placeholder data or fake logic  

## (5) DECISION LOG

- **2026-10-16**: Plan established. Build target is `projects/watch-1jll/try.html` regardless of any conflicting plan entries.

## (6) APPENDIX

**Authority Order** (highest first):  
1. This plan file  
2. Owner instructions in current run  
3. Referenced file blocks (if provided)  
4. Code file content  

**Persistence**: Chat history may be partial; this plan is the sole memory that persists between runs.
