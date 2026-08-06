'use strict';

function activity(id, name, icon, instruction, modification, seconds = null, reps = null) {
  return { id, name, icon: ICONS[icon] || '✨', instruction, modification, seconds, reps, free: false };
}
