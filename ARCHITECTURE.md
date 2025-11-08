# ARCHITECTURE

## Data Flow
1. Client captures pointer points and batches them into `stroke-progress` segments.
2. Client sends `stroke-commit` when a stroke finishes (authoritative stroke).
3. Server appends committed strokes to per-room operation log (`DrawingState`).
4. Server broadcasts `stroke-progress` to other clients for live preview.
5. Server broadcasts `stroke-added` after commit; clients render authoritatively.
6. Clients can request `state` to rehydrate canvas if they join later.

## WebSocket Messages

**Client → Server:**
- `join-room` `{ name, roomId }`
- `stroke-progress` `{ segment | batch }`
- `stroke-commit` `{ stroke }`
- `cursor` `{ x, y }`
- `undo`
- `redo`
- `clear`
- `get-state`

**Server → Client:**
- `state` `{ strokes, users }`
- `stroke-progress` `{ segment }`
- `stroke-added` `{ stroke }`
- `users` `{ users }`
- `cursor`
- `remove-cursor`

## Undo/Redo Strategy
- Server keeps an ordered operation log (`strokes` array) per room.
- `undo` removes the last stroke from the log (affects all users).
- `redo` restores the last undone stroke.
- Global approach; conflicts handled by order of operations.

## Performance Decisions
- Client batches small stroke segments and emits them periodically (25–30ms) to reduce network traffic.
- Client-side prediction: strokes drawn locally immediately for responsiveness.
- Server maintains canonical operation log; authoritative source of truth.

## Limitations
- Global undo is coarse (undo affects last stroke globally, not per-user).
- No database persistence; all data is in-memory.
- Large histories may require heavy replays; snapshots could be added for optimization.
- Mobile touch support not fully optimized.
