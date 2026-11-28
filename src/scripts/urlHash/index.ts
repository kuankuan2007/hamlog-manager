import { createActiveBehavior } from './active';
import { createHashDirective } from './directive';
import { createFocusBehavior } from './focus';

export const vUrlHashActive = createHashDirective(createActiveBehavior);
export const vUrlHashFocus = createHashDirective(createFocusBehavior);
