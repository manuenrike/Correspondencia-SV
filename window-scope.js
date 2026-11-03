// Demo routing by institution AND window. This is not server authorization.
function activeWindowId() {
 const key = document.querySelector('#sessionUser')?.value;
 return availableSessionUsers().find(entry => entry.key === key)?.window.id || null;
}

function correspondenceWindow(record, side) {
 const explicit = record[side + 'Window'] || (side === 'from' ? record.sentBy?.windowId : null);
 if (explicit) return explicit;
 // Legacy records without a window belong to General, never every window.
 const windows = inst(record[side])?.windows || [];
 return windows.find(window => window.name.toLowerCase() === 'correspondencia general')?.id || windows[0]?.id || null;
}

function isWindowSender(record) {
 const windowId = activeWindowId();
 return !!windowId && record.from === active && correspondenceWindow(record, 'from') === windowId;
}

function isWindowRecipient(record) {
 const windowId = activeWindowId();
 return !!windowId && record.to === active && correspondenceWindow(record, 'to') === windowId;
}

function canAccessCorrespondence(record) {
 return !!record && (isWindowSender(record) || isWindowRecipient(record));
}

function canAccessDraft(draft) {
 return !!draft && isWindowSender(draft);
}
