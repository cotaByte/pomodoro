import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

export const FadeInAnimation = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('400ms ease-in', style({ opacity: 1 })),
  ]),
]);
