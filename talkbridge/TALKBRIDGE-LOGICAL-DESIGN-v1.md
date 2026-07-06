# TALKBRIDGE Logical Design & Build Package v1

Status: audit-before-build package for `TALKBRIDGE-MASTER-PLAN-v6.html v6.3.0`.

Purpose: define the final TalkBridge app top-down before code is written. This document is the auditable logical design, inventory, schema, physical structure, interface contract, and build package for the first implementation. `bridge-turn08-base.html` and `test.html` are reference inputs only; they are not runtime bases.

## 0. Non-negotiable product definition

- TalkBridge is one final app, not a merge of prior apps.
  - Plan surfaces and navigation are product authority.
  - Old artifacts may answer implementation questions only.
  - No old boot system, router, lobby, room manager, transcript owner, composer, phrasebook, call app, or hidden DOM may be imported.
- First meaningful build must include planned navigation and working bilingual messaging.
  - L1 and L2 are implemented as one coherent delivery package.
  - A build that cannot create/join a room and exchange bilingual messages in planned S4 is not acceptable.
- Every visible state must be a coherent product state.
  - No partial exposed shell-only app.
  - No transcript without composer.
  - No composer/search without transcript.
  - No duplicate owner for any surface or service.

## 1. Logical outline inventory

- App
  - Boot
    - Input: browser load, stored app state, URL route.
    - Output: S0 name ask, S1 start, or S10 joiner landing.
    - Rules:
      - Never auto-open S4 on normal owner boot.
      - Never request media permissions on boot.
      - Never start call/STT on boot.
      - Never mount any prior app surface.
  - Identity
    - S0 owner name ask.
    - S10 joiner name ask.
    - Local display name is required before room entry.
  - Routing
    - Owner routes: S0, S1, S2, S3, S4, S4a, S4b, S5, S6, S7, S8, S9, S11, S13, S14.
    - Joiner routes: S10, S4, S4b limited, S5, S6/S7/S8 limited by room pair, S9, S14.
    - Route guard blocks joiner from S2/S3.
  - Persistence
    - Local state persists identity, rooms, messages, settings, phrasebooks, pending outbound queue, invite cache.
    - Transport sync may enrich state but must not own UI.

- S0 First run
  - Purpose: collect owner display name once.
  - Inputs:
    - text field `displayName`.
    - Continue tap.
  - Outputs:
    - `setCurrentUser(displayName)`.
    - route to S1.
  - Errors:
    - empty name: inline error.
    - name over 40 chars: trim or inline error.
  - Owner: M1 App shell/router.

- S1 Start screen
  - Purpose: neutral landing; no active room.
  - Inputs:
    - menu tap opens S2.
    - global auto-read toggle.
  - Outputs:
    - `openPanel()`.
    - `toggleGlobalAutoRead()`.
  - Owner: M1 App shell/router.

- S2 Left panel
  - Purpose: room list, access to create, long-press settings.
  - Inputs:
    - room card tap.
    - plus tap.
    - card title edit.
    - transcript/diagnostics tap.
    - soft-delete tap.
    - recycle restore.
    - blank square long-press.
    - scrim tap close.
  - Outputs:
    - `enterRoom(roomId)`.
    - `openCreateRoom()`.
    - `renameRoom(roomId,title)`.
    - `softDeleteRoom(roomId)`.
    - `restoreRoom(roomId)`.
    - `openDeviceSettings()`.
    - `closePanel()`.
  - Forbidden:
    - no room-card share icon.
    - no phrasebook/global catalog buttons.
  - Owner: M1 App shell/router.

- S3 Create room
  - Purpose: create one partner/language-pair room.
  - Inputs:
    - local language select.
    - partner language select.
    - auto-read toggle.
    - Cancel.
    - OK.
  - Outputs:
    - `createRoom(pair, autoRead)`.
    - route to S4 with invite card visible.
  - Owner: M1 App shell/router, transport adapter for room creation.

- S4 Room transcript
  - Purpose: one continuous typed/spoken bilingual conversation.
  - Inputs:
    - menu tap.
    - call/video tap.
    - overflow tap.
    - attach tap.
    - composer text input.
    - send tap or Enter.
    - slash/double-dot search predicate.
    - bubble column tap for TTS.
    - bubble long-press.
  - Outputs:
    - `openPanel()`.
    - `startCall(roomId, kind)`.
    - `openRoomDrawer(roomId)`.
    - `updateDraft(roomId,text)`.
    - `sendDraft(roomId)`.
    - `openPhraseSearch(roomId,query)`.
    - `speakMessageColumn(messageId, column)`.
    - `openBubbleActions(messageId)`.
  - Render rules:
    - Each bubble has original and translated text side-by-side.
    - Viewer's language is always left.
    - Meta line supports top/bottom/off setting.
    - Typed and spoken messages share the same stream.
    - One composer only.
  - Owner: M2 Conversation.

- S4a Invite card
  - Purpose: invite partner before join and expose invite/share actions from room context.
  - Inputs:
    - link tap.
    - Copy tap.
    - Share tap.
  - Outputs:
    - `copyInvite(roomId)`.
    - `shareInvite(roomId)`.
  - Rules:
    - appears at top of S4 before partner joins.
    - disappears after partner joins.
    - invite/link access after join lives in S4b.
  - Owner: M2 Conversation.

- S4b Room drawer
  - Purpose: room-scoped settings and tools.
  - Inputs:
    - room display name edit.
    - meta placement select.
    - send-button visibility toggle if retained.
    - Link a device.
    - invite/link.
    - export.
    - debug.
  - Outputs:
    - `updateRoomSettings(roomId, patch)`.
    - `openDeviceLink(roomId)`.
    - `copyInvite(roomId)`.
    - `exportRoom(roomId)`.
    - `openDebug(roomId)`.
  - Owner: M4 Room drawer/settings.

- S5 Phrase search overlay
  - Purpose: search pair-scoped phrasebook from composer.
  - Inputs:
    - `/` or `..` predicate.
    - query text.
    - exclude token `-word`.
    - result text tap.
    - result arrow tap.
    - TTS tap.
    - close.
    - send.
  - Outputs:
    - `searchPhrases(pairKey, query)`.
    - `usePhrase(cardId, side)`.
    - `speakPhrase(cardId, side)`.
    - `closePhraseSearch()`.
  - Owner: M3 Phrasebook.

- S6 Phrase card
  - Purpose: reusable phrase display.
  - Inputs:
    - source/target tap.
    - use.
    - edit.
    - delete.
    - TTS.
  - Outputs:
    - `usePhrase(cardId, side)`.
    - `editPhrase(cardId, patch)`.
    - `deletePhrase(cardId)`.
    - `speakPhrase(cardId, side)`.
  - Owner: M3 Phrasebook.

- S7 Phrasebook list
  - Purpose: full pair-scoped phrasebook.
  - Inputs:
    - open from S4/S5.
    - search query.
    - plus.
    - card actions.
  - Outputs:
    - `openPhrasebook(pairKey)`.
    - `searchPhrases(pairKey, query)`.
    - `createPhraseDraft(pairKey)`.
  - Owner: M3 Phrasebook.

- S8 New/edit phrase inline card
  - Purpose: add or edit phrase without separate sheet.
  - Inputs:
    - source text.
    - Enter.
    - target edit.
    - save.
    - cancel/delete.
  - Outputs:
    - `translatePhraseDraft(pairKey, sourceText)`.
    - `savePhrase(card)`.
    - `cancelPhraseDraft()`.
  - Rules:
    - plus while empty draft exists focuses existing draft.
    - no stacked empty cards.
  - Owner: M3 Phrasebook.

- S9 Call band
  - Purpose: call/video layer over S4, with STT lines into transcript.
  - Inputs:
    - call/video start.
    - accept/decline.
    - mute/camera controls.
    - back.
    - expand PiP.
    - hang up.
  - Outputs:
    - `startCall(roomId, kind)`.
    - `acceptCall(callId)`.
    - `declineCall(callId)`.
    - `setCallPip(true|false)`.
    - `hangupCall(callId)`.
    - `appendSpeechLine(roomId, text, lang, speakerId)`.
  - Rules:
    - no permission request before call action.
    - no full-screen prior call app.
    - call-ended pill persists in transcript.
  - Owner: M5 Call/STT.

- S10 Joiner landing
  - Purpose: invite URL entry for partner.
  - Inputs:
    - invite token from URL.
    - localized display name.
    - Join tap.
  - Outputs:
    - `resolveInvite(token)`.
    - `setJoinerName(name)`.
    - `joinRoom(token, user)`.
    - route to S4.
  - Rules:
    - joiner cannot access S2/S3.
    - joiner sees only joined room.
  - Owner: M1 App shell/router with transport adapter.

- S11 Keys
  - Purpose: credential entry for transport/translation/STT/GitHub as required.
  - Inputs:
    - key fields.
    - save.
    - validate.
  - Outputs:
    - `saveKeys(keys)`.
    - `validateKeys(keys)`.
  - Owner: M6 Keys/settings/about/privacy.

- S13 Device settings/about/privacy
  - Purpose: device-level settings only.
  - Inputs:
    - Keys.
    - About.
    - Privacy.
  - Outputs:
    - route to S11 or static panels.
  - Forbidden:
    - no global appearance controls.
    - no reset/data-grid controls.
  - Owner: M6 Keys/settings/about/privacy.

- S14 Notifications
  - Purpose: OS/PWA incoming call/message routing.
  - Inputs:
    - incoming message.
    - incoming call.
    - Accept.
    - Decline.
    - notification tap.
    - mute state.
  - Outputs:
    - `showMessageWaiting(roomId)`.
    - `showIncomingCall(roomId, callId)`.
    - `notificationOpenRoom(roomId)`.
    - `notificationAcceptCall(callId)`.
    - `notificationDeclineCall(callId)`.
  - Owner: M7 PWA/notifications.

## 2. Physical structure

- Recommended files
  - `talkbridge-app/index.html`
    - static root document.
    - loads `styles.css` and `src/main.js`.
  - `talkbridge-app/styles.css`
    - design tokens.
    - layout primitives.
    - surface styles S0-S14.
  - `talkbridge-app/src/main.js`
    - app bootstrap.
    - initializes store, router, services.
    - mounts root render.
  - `talkbridge-app/src/state.js`
    - initial state.
    - reducer/action handlers.
    - selectors.
  - `talkbridge-app/src/schema.js`
    - schema comments/validators.
    - id factories.
    - pair key helpers.
  - `talkbridge-app/src/router.js`
    - route parsing.
    - route guards.
    - navigation helpers.
  - `talkbridge-app/src/storage.js`
    - local persistence.
    - migration/version handling.
  - `talkbridge-app/src/services/transport.js`
    - create/join/send/subscribe interface.
    - local two-tab fallback for first audit build.
  - `talkbridge-app/src/services/translator.js`
    - translation interface.
    - configured real provider or deterministic fallback.
  - `talkbridge-app/src/services/speech.js`
    - TTS/STT interface.
  - `talkbridge-app/src/services/phrasebook-store.js`
    - phrase search/save/update/delete.
  - `talkbridge-app/src/services/calls.js`
    - call signaling/media interface.
  - `talkbridge-app/src/services/pwa-notify.js`
    - install/notification interface.
  - `talkbridge-app/src/ui/render.js`
    - root render dispatch.
    - common DOM helpers.
  - `talkbridge-app/src/ui/screens/*.js`
    - one screen renderer per surface group.
  - `talkbridge-app/src/ui/components/*.js`
    - bubble, composer, panel card, invite card, phrase card, drawer, call band.
  - `talkbridge-app/tests/smoke.mjs`
    - deterministic DOM and state smoke checks.

## 3. Schemas

```js
AppState = {
  version: 'tb-app-v1',
  currentUserId: string | null,
  users: Record<UserId, User>,
  route: Route,
  activeRoomId: RoomId | null,
  rooms: Record<RoomId, Room>,
  roomOrder: RoomId[],
  messages: Record<RoomId, Message[]>,
  drafts: Record<RoomId, Draft>,
  phrasebooks: Record<PairKey, PhraseBook>,
  settings: Settings,
  callState: CallState,
  notificationState: NotificationState,
  pendingOutbound: OutboundEvent[],
  ui: UiState
}
```

```js
User = {
  id: string,
  displayName: string,
  preferredLanguage: LangCode,
  deviceId: string,
  roleByRoom: Record<RoomId, 'owner' | 'joiner'>,
  createdAt: ISODateString,
  updatedAt: ISODateString
}
```

```js
Room = {
  id: string,
  role: 'owner' | 'joiner',
  ownerUserId: string,
  partnerUserId: string | null,
  localTitle: string,
  pair: LanguagePair,
  autoRead: boolean,
  muted: boolean,
  invite: Invite,
  joinedAt: ISODateString | null,
  lastActivityAt: ISODateString,
  unreadCount: number,
  receiptWatermark: Record<UserId, MessageId>,
  settings: RoomSettings,
  deletedAt: ISODateString | null
}
```

```js
LanguagePair = {
  localLang: LangCode,
  partnerLang: LangCode,
  localLabel: string,
  partnerLabel: string,
  localFlag: string,
  partnerFlag: string,
  pairKey: string
}
```

```js
Message = {
  id: string,
  roomId: string,
  senderId: string,
  kind: 'typed' | 'speech' | 'system',
  sourceLang: LangCode,
  targetLang: LangCode,
  originalText: string,
  translatedText: string,
  translationStatus: 'pending' | 'complete' | 'error',
  translationError: string | null,
  createdAt: ISODateString,
  updatedAt: ISODateString,
  receipt: 'queued' | 'sent' | 'delivered' | 'read',
  source: 'composer' | 'stt' | 'system' | 'phrase',
  savedPhraseId: string | null
}
```

```js
Draft = {
  text: string,
  mode: 'compose' | 'phrase-search',
  searchQuery: string,
  updatedAt: ISODateString
}
```

```js
PhraseBook = {
  pairKey: string,
  cards: PhraseCard[],
  syncStatus: 'local' | 'syncing' | 'synced' | 'error',
  updatedAt: ISODateString
}
```

```js
PhraseCard = {
  id: string,
  pairKey: string,
  sourceText: string,
  targetText: string,
  backTranslation: string | null,
  notes: string | null,
  createdBy: string,
  createdAt: ISODateString,
  updatedAt: ISODateString,
  deletedAt: ISODateString | null
}
```

```js
Invite = {
  token: string,
  url: string,
  qrPayload: string,
  createdAt: ISODateString,
  acceptedAt: ISODateString | null,
  revokedAt: ISODateString | null
}
```

```js
Settings = {
  globalAutoRead: boolean,
  keys: Record<string, string>,
  privacyAcceptedAt: ISODateString | null,
  installPromptSeenAt: ISODateString | null
}
```

```js
RoomSettings = {
  metaPlacement: 'top' | 'bottom' | 'off',
  showSendButton: boolean,
  appearance: 'light',
  debugEnabled: boolean
}
```

```js
CallState = {
  roomId: string | null,
  callId: string | null,
  status: 'idle' | 'ringing' | 'connecting' | 'active' | 'ended' | 'error',
  kind: 'audio' | 'video' | null,
  startedAt: ISODateString | null,
  endedAt: ISODateString | null,
  pip: boolean,
  participants: Record<UserId, CallParticipant>
}
```

```js
NotificationState = {
  permission: 'default' | 'granted' | 'denied',
  pendingRoomId: string | null,
  pendingCallId: string | null,
  mutedRoomIds: string[]
}
```

## 4. Function definitions and contracts

- App lifecycle
  - `bootApp(): void`
    - Input: none.
    - Reads: local storage, location URL.
    - Output: initialized state and first render.
  - `renderApp(state: AppState): void`
    - Input: full state.
    - Output: root DOM for current route.
  - `dispatch(action: Action): void`
    - Input: action object.
    - Output: state mutation, persistence, render, optional service effect.

- Routing
  - `parseRoute(url: URL): Route`
  - `navigate(route: Route): void`
  - `guardRoute(route: Route, state: AppState): Route`
  - `enterRoom(roomId: string): void`
  - `leaveRoom(): void`

- Identity
  - `setCurrentUser(displayName: string, preferredLanguage?: LangCode): User`
  - `setJoinerName(inviteToken: string, displayName: string): User`

- Rooms
  - `createRoom(pair: LanguagePair, options: { autoRead: boolean }): Promise<Room>`
  - `joinRoom(inviteToken: string, user: User): Promise<Room>`
  - `renameRoom(roomId: string, localTitle: string): void`
  - `softDeleteRoom(roomId: string): void`
  - `restoreRoom(roomId: string): void`
  - `updateRoomSettings(roomId: string, patch: Partial<RoomSettings>): void`

- Messaging
  - `updateDraft(roomId: string, text: string): void`
  - `sendDraft(roomId: string): Promise<Message>`
    - validates non-empty draft.
    - creates pending message.
    - calls translator.
    - calls transport send.
    - updates receipt.
  - `receiveMessage(roomId: string, message: Message): void`
  - `appendSpeechLine(roomId: string, text: string, lang: LangCode, speakerId: string): Promise<Message>`
  - `setReceipt(roomId: string, messageId: string, receipt: Message['receipt']): void`
  - `deleteMessage(roomId: string, messageId: string): void`
  - `clarifyMessage(roomId: string, messageId: string): Promise<void>`

- Invite/link
  - `buildInvite(roomId: string): Invite`
  - `copyInvite(roomId: string): Promise<void>`
  - `shareInvite(roomId: string): Promise<void>`
  - `resolveInvite(token: string): Promise<InviteResolution>`

- Phrasebook
  - `openPhraseSearch(roomId: string, query: string): void`
  - `searchPhrases(pairKey: string, query: string): PhraseCard[]`
  - `usePhrase(cardId: string, side: 'source' | 'target'): void`
  - `savePhraseFromMessage(roomId: string, messageId: string): Promise<PhraseCard>`
  - `createPhraseDraft(pairKey: string): PhraseCard`
  - `translatePhraseDraft(pairKey: string, sourceText: string): Promise<PhraseCard>`
  - `savePhrase(card: PhraseCard): Promise<PhraseCard>`
  - `editPhrase(cardId: string, patch: Partial<PhraseCard>): Promise<PhraseCard>`
  - `deletePhrase(cardId: string): Promise<void>`

- Speech
  - `speakText(text: string, lang: LangCode): Promise<void>`
  - `startStt(roomId: string, pair: LanguagePair): Promise<void>`
  - `stopStt(): Promise<void>`

- Calls
  - `startCall(roomId: string, kind: 'audio' | 'video'): Promise<void>`
  - `acceptCall(callId: string): Promise<void>`
  - `declineCall(callId: string): Promise<void>`
  - `setCallPip(pip: boolean): void`
  - `hangupCall(callId: string): Promise<void>`

- PWA/notifications
  - `registerPwa(): Promise<void>`
  - `requestNotificationPermission(): Promise<NotificationPermission>`
  - `showIncomingCall(roomId: string, callId: string): Promise<void>`
  - `showMessageWaiting(roomId: string, messageId: string): Promise<void>`
  - `handleNotificationAction(action: NotificationAction): void`

## 5. Service inputs and outputs

- `transport.createRoom(room)`
  - Input: Room draft.
  - Output: persisted/synced Room with invite token.
  - Errors: unavailable, conflict, invalid credentials.
- `transport.joinRoom(token, user)`
  - Input: invite token, user.
  - Output: joined Room and initial transcript.
  - Errors: expired invite, revoked invite, not found.
- `transport.sendMessage(roomId, message)`
  - Input: room id, message.
  - Output: receipt status.
  - Errors: offline queued, rejected, unauthorized.
- `transport.subscribeRoom(roomId, onEvent)`
  - Input: room id, event callback.
  - Output: unsubscribe function.
- `translator.translate(text, fromLang, toLang)`
  - Input: text and language codes.
  - Output: `{ text, provider, confidence? }`.
  - Errors: unavailable, unsupported pair, quota.
- `phrasebookStore.search(pairKey, query)`
  - Input: pair key and query.
  - Output: ranked cards.
- `calls.start(roomId, kind)`
  - Input: room id, call kind.
  - Output: call id and media/session state.
- `pwaNotify.showIncomingCall(payload)`
  - Input: room/call payload.
  - Output: displayed notification or fallback signal.

## 6. L1 + L2 first implementation package

- Must build
  - App entry and layout.
  - S0/S1/S2/S3/S10 routing.
  - S4 planned conversation surface.
  - S4a invite card.
  - Room creation.
  - Join via invite token.
  - One composer.
  - Message creation, translation, persistence, send/receive between two sessions.
  - Receipt states at least queued/sent/read locally.
  - Two-session deterministic harness.
- May stub
  - Real network relay, if local two-tab transport is explicitly named and swappable.
  - Real translation provider, if deterministic fallback is explicitly named and UI still renders original+translated columns.
  - QR visual encoding, if invite URL copy/share works and QR contract is isolated.
- Must not fake
  - Route guards.
  - Room creation.
  - Invite token resolution.
  - Message persistence.
  - The existence of original+translated message fields.
  - The single S4 composer/transcript ownership.

## 7. Acceptance harness

- Static checks
  - No import/reference to `bridge-turn08-base.html` or `test.html` from runtime files.
  - No duplicate screen owner files for S4 transcript or composer.
  - No media permission APIs called during boot.
  - No route from joiner to S2/S3.
- State checks
  - `bootApp()` with empty storage routes to S0.
  - `setCurrentUser()` routes to S1.
  - `createRoom()` creates Room, Invite, empty Message list, and route S4.
  - `joinRoom()` with token creates joiner state locked to room.
  - `sendDraft()` appends Message with original and translated fields.
  - reload restores room and transcript.
- DOM checks
  - S2 has no share icon.
  - S4 has one transcript container.
  - S4 has one composer.
  - S4a appears before partner join and disappears after join.
  - S5 opens only from phrase predicates or phrasebook action.
- Two-session script
  - Session A clear storage.
  - A enters name.
  - A opens S2 and creates EN↔TH room.
  - A sees S4 with invite card.
  - Session B opens invite URL.
  - B enters name and joins.
  - A sends message.
  - B receives original+translated message.
  - B replies.
  - A receives original+translated reply.
  - Both reload.
  - Both retain room and transcript.

## 8. Audit checklist before build

- Product
  - Every planned surface S0-S14 has an owner.
  - Every navigation path has an action.
  - Every action has state input/output.
  - Every service has a boundary.
- Safety
  - Old apps are reference only.
  - No hidden prior app can boot.
  - No duplicate transcript/composer/call owner exists.
  - No permission prompt before user intent.
- Delivery
  - L1+L2 are implemented together or in one branch with no shell-only release claim.
  - First real build demonstrates two-person bilingual messaging.
  - Later layers cannot proceed if L2 fails.
