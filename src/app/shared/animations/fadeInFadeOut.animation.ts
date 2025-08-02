import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

export const FadeInFadeOutAnimation = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('400ms ease-in', style({ opacity: 1 })),
  ]),
  transition(':leave', [animate('400ms ease-out', style({ opacity: 0 }))]),
]);
