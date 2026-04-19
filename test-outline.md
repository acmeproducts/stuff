# App Information Architecture — Version Alpha (Updated post base-case)

<table>
  <thead>
    <tr>
      <th align="left">AS IS (v3.9 — base case confirmed)</th>
      <th align="left">TO BE (backlog target)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td valign="top">
        <ol>
          <li>
            <strong>Onboarding (first launch only)</strong>
            <ol>
              <li>Name entry modal (full-screen card) → Continue</li>
              <li>Name persists to <code>prefs.globalName</code> / <code>prefs.userName</code></li>
            </ol>
          </li>
          <li>
            <strong>Main Shell</strong>
            <ol>
              <li>
                <strong>Top Ribbon (always visible)</strong>
                <ol>
                  <li>Hamburger button → opens Left Panel (session list)</li>
                  <li>Book button → opens Phrasebook Screen</li>
                  <li>Share button → opens Share Overlay (owner-handoff QR for active session)</li>
                  <li>Globe button → shows flag of current session language; opens Language Picker sheet</li>
                  <li><em>(spacer)</em></li>
                  <li>Speaker button → auto-read on/off; slash overlay when off</li>
                </ol>
              </li>
              <li>
                <strong>Participant Name Bar (below ribbon)</strong>
                <ol>
                  <li>Self name (contenteditable, presence dot, tap to edit inline)</li>
                  <li>Arrow (↔) hidden until partner joins</li>
                  <li>Partner name (presence dot, hidden until partner joins)</li>
                </ol>
              </li>
              <li>
                <strong>Left Panel (slides in, scrim behind)</strong>
                <ol>
                  <li>
                    Gear button (top of panel) → Settings Drawer
                    <ol>
                      <li>
                        <strong>Settings Drawer (expands below gear; hides session list when open)</strong>
                        <ol>
                          <li>
                            Appearance
                            <ol>
                              <li>Bubble preset selector (Light / Medium / Dark)</li>
                              <li>Color pickers per preset (Me / Partner)</li>
                              <li>Font size sliders (Me / Partner)</li>
                              <li>Bubble width sliders (Me / Partner)</li>
                            </ol>
                          </li>
                          <li>Auto-read toggle (mirrors ribbon speaker; controls same session-level flag)</li>
                          <li>
                            Data management grid
                            <ol>
                              <li>Sessions: Export / Import / Clear</li>
                              <li>Settings: Export / Import / Clear</li>
                            </ol>
                          </li>
                          <li>Reset all settings</li>
                          <li>About / Privacy</li>
                        </ol>
                      </li>
                    </ol>
                  </li>
                  <li>
                    <strong>Session List (visible when settings drawer closed; drag to reorder)</strong>
                    <ol>
                      <li>
                        <strong>Session Card (one per chat)</strong>
                        <ol>
                          <li>Title (participant names — e.g. "Mike / Invite Pending")</li>
                          <li>Last activity timestamp (relative)</li>
                          <li>Unread message badge (count of unread incoming messages)</li>
                          <li>Share button → Share Overlay (owner-handoff QR)</li>
                          <li>Export button (⇩) → downloads .txt transcript + diagnostics</li>
                          <li>Diagnostics button (doc icon) → Diagnostic Modal</li>
                          <li>Delete button → moves to Recycle Bin</li>
                        </ol>
                      </li>
                    </ol>
                  </li>
                  <li>
                    <strong>Recycle Bin (recently deleted, 30-day expiry)</strong>
                    <ol>
                      <li>Per item: Restore / Permanent Delete</li>
                    </ol>
                  </li>
                  <li>Plus (+) FAB → opens New Chat Modal</li>
                </ol>
              </li>
              <li>
                <strong>New Chat Modal (pre-flight)</strong>
                <ol>
                  <li>Your language selector (default: Auto 🌐)</li>
                  <li>Partner language selector (default: Auto 🌐)</li>
                  <li>Auto-read toggle (default: on)</li>
                  <li>OK → creates session, connects WebSocket, injects Invite Card in chat stream</li>
                  <li>Cancel</li>
                </ol>
              </li>
              <li>
                <strong>Chat Stream — Initiator (owner) view</strong>
                <ol>
                  <li>Invite Card (partner-invite QR + Copy Link) — injected at position 0 on session open</li>
                  <li>System Announcements (join, leave, name change)</li>
                  <li>Chat Bubbles (see 2.8 below)</li>
                </ol>
              </li>
              <li>
                <strong>Chat Stream — Partner view</strong>
                <br/><em>Structurally same renderer as initiator. Partner receives history via history-sync; invite card is appended below that history by the same <code>addInviteMessage()</code> path.</em>
                <ol>
                  <li>Synced chat history (received from owner on connect)</li>
                  <li>Invite Card (partner-invite QR + Copy Link) — same card type, same code path</li>
                  <li>System Announcements</li>
                  <li>Chat Bubbles</li>
                </ol>
              </li>
              <li>
                <strong>Typing Indicator Bar</strong>
                <br/><em>Shows "[Name] is typing…" with 3.2 s auto-clear.</em>
              </li>
              <li>
                <strong>Chat Bubble (shared renderer — chat stream + phrasebook)</strong>
                <ol>
                  <li>
                    <strong>Header</strong>
                    <ol>
                      <li>Sender name</li>
                      <li>Delivery/read status dot (chat only; clickable → Status Popup)</li>
                      <li>Timestamp</li>
                    </ol>
                  </li>
                  <li>
                    <strong>Body (two-column layout)</strong>
                    <ol>
                      <li>
                        Left side (source for mine; translation for theirs)
                        <ol>
                          <li>Text (shimmer placeholder while loading)</li>
                          <li>"Use" button (inserts text into composer)</li>
                          <li>TTS button</li>
                        </ol>
                      </li>
                      <li>1px divider</li>
                      <li>
                        Right side (translation for mine; original for theirs)
                        <ol>
                          <li>Text</li>
                          <li>"Use" button</li>
                          <li>TTS button</li>
                        </ol>
                      </li>
                    </ol>
                  </li>
                  <li>
                    <strong>Footer</strong>
                    <ol>
                      <li>
                        Action bar (4 buttons)
                        <ol>
                          <li>Save to phrasebook (chat) / Delete (phrasebook)</li>
                          <li>Tags (#)</li>
                          <li>Clarify</li>
                          <li>Back-translate</li>
                        </ol>
                      </li>
                      <li>Tag drawer (expandable: assigned tags, search/add input, suggestions)</li>
                      <li>Clarify panel (expandable: thread history, compose + Send)</li>
                      <li>
                        Back-translate panel (expandable)
                        <ol>
                          <li>"Back translate" run button</li>
                          <li>Result text + TTS</li>
                          <li>Auto quality pill (Good / Partial / Poor) + manual verdict (Sounds right / Flag)</li>
                          <li>Stale indicator if source text changed</li>
                        </ol>
                      </li>
                      <li>Save confirmation inline, 4 s (chat only)</li>
                    </ol>
                  </li>
                </ol>
              </li>
              <li>
                <strong>Composer Bar</strong>
                <ol>
                  <li>Mic button (STT; hidden if API unavailable)</li>
                  <li>Auto-expanding textarea</li>
                  <li>Send button (disabled when empty)</li>
                </ol>
              </li>
              <li>
                <strong>Welcome State (no active chat)</strong>
                <br/><em>Replaces chat stream + composer. "Please select a conversation on the left or tap the + icon to start a new chat."</em>
              </li>
              <li>
                <strong>Overlays / Modals</strong>
                <ol>
                  <li>
                    <strong>Share Overlay (owner-handoff QR)</strong>
                    <br/><em>Two entry points: ribbon Share button OR session card share button. Generates owner-handoff QR (joinOrigin: share-owner-handoff). Separate from partner-invite QR in chat stream.</em>
                    <ol>
                      <li>Owner-handoff QR code</li>
                      <li>Copy Link button</li>
                    </ol>
                  </li>
                  <li>
                    <strong>Language Picker (bottom sheet)</strong>
                    <br/><em>Opens from ribbon globe button. Writes to global prefs.myLang AND to the active session's role-scoped LangMode/FixedLang fields (owner or partner, based on localRole). Sends hello to peer on change.</em>
                    <ol>
                      <li>🌐 Auto-detect (clears fixed lang)</li>
                      <li>Language list with flags (21 languages)</li>
                      <li>Close button</li>
                    </ol>
                  </li>
                  <li>
                    <strong>Diagnostic Modal (per-session debug log)</strong>
                    <ol>
                      <li>Session label</li>
                      <li>Log viewer (monospace, scrollable)</li>
                      <li>Copy / Clear buttons</li>
                    </ol>
                  </li>
                  <li>Delivery Status Popup (delivered / read timestamps)</li>
                  <li>Join Blocked Modal (invalid or blocked invite link)</li>
                  <li>Confirm Dialog (generic yes/no)</li>
                  <li>Info Modal (About / Privacy)</li>
                  <li>Session Note (per-chat notes)</li>
                  <li>New Chat Modal (pre-flight — listed at 2.4 above for flow clarity)</li>
                </ol>
              </li>
            </ol>
          </li>
          <li>
            <strong>Phrasebook Screen</strong>
            <ol>
              <li>
                <strong>Toolbar</strong>
                <ol>
                  <li>+ New card button</li>
                  <li>Print button</li>
                  <li>Import button</li>
                  <li>Export button</li>
                  <li>Search input (omni: source, target, tags)</li>
                  <li>Catalog filter chip (when active)</li>
                  <li>Catalog selector button → Catalog Filter overlay</li>
                </ol>
              </li>
              <li>Card List (same Chat Bubble renderer; footerMode = delete)</li>
              <li>Phrasebook Recycle Bin (per-card soft delete, 30-day expiry)</li>
              <li>
                <strong>New Phrase Overlay</strong>
                <ol>
                  <li>Editable bubble (source + target, contenteditable)</li>
                  <li>Language selectors (src / tgt) in bubble header</li>
                  <li>Translate → button</li>
                  <li>Back-translate button</li>
                  <li>Tags drawer</li>
                  <li>Catalog picker drawer</li>
                  <li>Save button</li>
                </ol>
              </li>
              <li>
                <strong>Catalog Management</strong>
                <ol>
                  <li>Create catalog (name, description, language, emoji preview)</li>
                  <li>Delete catalog (cards move to All)</li>
                </ol>
              </li>
              <li>
                <strong>Export / Import Modal</strong>
                <ol>
                  <li>Format: JSON / CSV</li>
                  <li>Swap source↔target toggle</li>
                  <li>Select / deselect all; per-card checkbox</li>
                  <li>Export / Save copy</li>
                </ol>
              </li>
            </ol>
          </li>
          <li>
            <strong>Background / Invisible</strong>
            <ol>
              <li>
                <strong>WebSocket relay</strong>
                <br/><em>Heartbeat keepalive, automatic reconnect with exponential backoff + jitter (max 30 s), offline message queue, tab-writer lease (one tab sends durable events at a time).</em>
              </li>
              <li>
                <strong>Translation pipeline (runs independently on each device)</strong>
                <ol>
                  <li>Same-language skip</li>
                  <li>In-memory session cache</li>
                  <li>Chrome on-device Translation API (where available)</li>
                  <li>MyMemory cloud API (free tier, 8 s timeout)</li>
                  <li>Null fallback — source text shown untranslated ("fallback=source" in logs)</li>
                </ol>
              </li>
              <li>
                <strong>Language detection</strong>
                <br/><em>Script-range detector for Thai, Japanese, Chinese, Korean, Arabic. fastText WASM (lid.176.ftz) planned for Latin scripts — not yet active. Falls back to browser language.</em>
              </li>
              <li>
                <strong>Language routing (per session, per role)</strong>
                <br/><em>Each role (owner / partner) has independent LangMode (auto | fixed), FixedLang, LastSentLang, and EffectiveReplyLang stored flat on the session object. Roles sub-object carries identity only — lang state never written there to avoid split-brain.</em>
              </li>
              <li>
                <strong>Auto-read (per session)</strong>
                <br/><em>Session-level <code>autoSpeakIncoming</code> is authoritative. Global pref is fallback when session field is null. Ribbon speaker and settings drawer both call through <code>getEffectiveAutoRead(sess)</code>.</em>
              </li>
              <li>
                <strong>Text-to-speech (TTS)</strong>
                <br/><em>Browser Web Speech API. Manual via TTS button per bubble side. Auto-read speaks incoming translations. iOS requires touch gesture to unlock audio context.</em>
              </li>
              <li>
                <strong>Speech-to-text (STT)</strong>
                <br/><em>Mic button in composer. Browser Speech Recognition API. Hidden when unavailable.</em>
              </li>
              <li>Tab coordination (multi-tab writer lease via BroadcastChannel / storage event)</li>
              <li>Canonical event ledger (message ordering, dedup)</li>
              <li>History sync (owner pushes up to 1500 messages in 80-message chunks on partner connect)</li>
            </ol>
          </li>
        </ol>
        <hr/>
        <strong>Confirmed fragmentation (AS IS):</strong>
        <ol type="a">
          <li><strong>Two QR types, two entry points.</strong> Partner-invite QR in chat stream (joinOrigin: share-partner). Owner-handoff QR in Share Overlay (joinOrigin: share-owner-handoff), reached from ribbon OR session card. Users must know the difference.</li>
          <li><strong>Invite card in chat stream has no expiry or dismissal.</strong> Stays permanently; URL refreshed on every session open.</li>
          <li><strong>Auto-read toggle duplicated</strong> (ribbon speaker + settings drawer). Both resolve to the same flag. Consistent but redundant surface.</li>
          <li><strong>Language writes to two scopes.</strong> <code>setMyLang()</code> writes to <code>prefs.myLang</code> (global) AND to the active session's role-scoped fields. New sessions pick up the global; existing sessions are independent.</li>
          <li><strong>Session card export overlaps with diagnostics.</strong> The ⇩ export already includes the diagnostics log; the modal surfaces the same data live.</li>
          <li><strong>No language pair visible on session card.</strong> Card title shows participant names only.</li>
        </ol>
      </td>
      <td valign="top">
        <strong>Target state — post backlog</strong>
        <br/><em>Changes from AS IS are <u>underlined</u>. Items not called out are unchanged.</em>
        <ol>
          <li><strong>Onboarding</strong> — no change</li>
          <li>
            <strong>Main Shell</strong>
            <ol>
              <li>
                <strong>Top Ribbon</strong>
                <ol>
                  <li>Hamburger → Left Panel — no change</li>
                  <li>Book → Phrasebook — no change</li>
                  <li>Share button → <u>Share Modal (consolidated — see 2.10.1)</u></li>
                  <li>Globe → Language Picker — no change</li>
                  <li>(spacer)</li>
                  <li>Speaker → auto-read — no change</li>
                </ol>
              </li>
              <li><strong>Participant Name Bar</strong> — no change</li>
              <li>
                <strong>Left Panel</strong>
                <ol>
                  <li>Gear → Settings Drawer — no change</li>
                  <li>
                    <strong>Session Card</strong>
                    <ol>
                      <li>Title — no change</li>
                      <li>Last activity timestamp — no change</li>
                      <li>Unread badge — no change (already present)</li>
                      <li><u>Language pair flags (e.g. 🇺🇸 → 🇹🇭) in card subtitle</u></li>
                      <li>Share button → <u>Share Modal (consolidated)</u></li>
                      <li>Export (⇩) — no change</li>
                      <li>Diagnostics — no change</li>
                      <li>Delete — no change</li>
                    </ol>
                  </li>
                  <li>Recycle Bin — no change</li>
                  <li>Plus (+) FAB — no change</li>
                </ol>
              </li>
              <li><strong>New Chat Modal</strong> — no change</li>
              <li>
                <strong>Chat Stream — Initiator view</strong>
                <ol>
                  <li><u>Invite Card removed from chat stream entirely</u></li>
                  <li>System Announcements — no change</li>
                  <li>Chat Bubbles — no change</li>
                  <li><u>Bubble footer: one-click "Import to Phrasebook" action</u></li>
                </ol>
              </li>
              <li>
                <strong>Chat Stream — Partner view</strong>
                <ol>
                  <li><u>Invite Card removed from chat stream entirely</u></li>
                  <li>Otherwise same as initiator view</li>
                </ol>
              </li>
              <li><strong>Typing Indicator Bar</strong> — no change</li>
              <li><strong>Chat Bubble</strong> — renderer unchanged; phrasebook import action added to footer</li>
              <li><strong>Composer Bar</strong> — no change</li>
              <li><strong>Welcome State</strong> — no change</li>
              <li>
                <strong>Overlays / Modals</strong>
                <ol>
                  <li>
                    <u><strong>Share Modal (consolidated — replaces Share Overlay)</strong></u>
                    <br/><em>Single origin point reached from ribbon share button OR session card share icon. Replaces the owner-handoff-only overlay. Surfaces both QR types, eliminating the in-stream invite card.</em>
                    <ol>
                      <li><u>Partner Invite section — QR + Copy Link (joinOrigin: share-partner)</u></li>
                      <li><u>Change Device section — QR + Copy Link (joinOrigin: share-owner-handoff)</u></li>
                      <li>Close</li>
                    </ol>
                  </li>
                  <li><strong>Language Picker</strong> — no change</li>
                  <li><strong>Diagnostic Modal</strong> — no change</li>
                  <li>Status Popup — no change</li>
                  <li>Join Blocked Modal — no change</li>
                  <li>Confirm Dialog — no change</li>
                  <li>Info Modal — no change</li>
                  <li>Session Note — no change</li>
                  <li>New Chat Modal — no change</li>
                </ol>
              </li>
            </ol>
          </li>
          <li><strong>Phrasebook Screen</strong> — no change</li>
          <li><strong>Background / Invisible</strong> — no change</li>
        </ol>
        <hr/>
        <strong>Fragmentation resolved in TO BE:</strong>
        <ol type="a">
          <li><del>Two QR types with no unified home</del> → Single Share Modal; invite card removed from stream.</li>
          <li><del>No language pair on session card</del> → Language pair flags in session card subtitle.</li>
        </ol>
        <strong>Fragmentation remaining (accepted, out of scope):</strong>
        <ol type="a" start="3">
          <li>Auto-read toggle still in two places (ribbon + settings drawer).</li>
          <li>Language scope writes to global prefs AND active session.</li>
          <li>Session card export overlaps with diagnostics modal.</li>
        </ol>
        <hr/>
        <strong>Backlog items — mapped:</strong>
        <ol>
          <li>✅ <strong>QR consolidation</strong> — Share Modal (2.10.1); invite card removed from stream (2.5, 2.6)</li>
          <li>✅ <strong>Unread badge</strong> — already present in AS IS; validate during base case+ testing</li>
          <li>✅ <strong>Language pair flags on session card</strong> — session card subtitle (2.3.2.d)</li>
          <li>✅ <strong>One-click chat import to phrasebook</strong> — bubble footer action (2.5.d)</li>
        </ol>
      </td>
    </tr>
  </tbody>
</table>
