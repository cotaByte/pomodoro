import {
  CdkOverlayOrigin,
  ConnectedPosition,
  OverlayModule,
} from '@angular/cdk/overlay';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, signal, viewChild } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  filter,
  interval,
  map,
  merge,
  of,
  ReplaySubject,
  shareReplay,
  startWith,
  switchMap,
  take,
} from 'rxjs';
import { FadeInFadeOutAnimation } from '../../shared/animations/fadeInFadeOut.animation';
import { debug } from '../../shared/operators';
import { FadeInAnimation } from '../../shared/animations/fadeIn.animation';

@Component({
  selector: 'pomodoro-timer',
  imports: [
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    OverlayModule,
    DecimalPipe,
  ],
  templateUrl: './timer.component.html',
  animations: [FadeInFadeOutAnimation, FadeInAnimation],
  styleUrl: './timer.component.scss',
})
export class TimerComponent {
  //#region CONSTANTS
  public readonly MINUTES = Array.from({ length: 60 }, (_, i) => i);
  //#region START
  public start$ = new ReplaySubject<void>();
  //#endregion START

  //#region RESET
  public reset$ = new ReplaySubject<void>();
  //#endregion RESET

  //#region PAUSE
  public pause$ = new ReplaySubject<void>();
  //#endregion PAUSE

  //#region RESUME
  public resume$ = new ReplaySubject<void>();
  //#endregion RESUME

  //#region OVERLAY
  public $overlayVisibility = signal<boolean>(false);
  $overlayTrigger = viewChild<CdkOverlayOrigin>('trigger');
  overlayTrigger$ = toObservable(this.$overlayTrigger).pipe(
    filter(Boolean),
    debug('overlayTrigger$'),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public readonly CONNECTED_POSITION_STRATEGY: ConnectedPosition = {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
  };
  //#endregion OVERLAY

  //#region TIME FORM
  form = new FormGroup({
    minutes: new FormControl<number>(25, {
      validators: [Validators.required],
      nonNullable: true,
    }),
    seconds: new FormControl<number>(0, {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });
  //#endregion TIME FORM

  //#region TIME FOR COUNTDOWN
  public readonly DEFAULT_WORK_TIME = 25 * 60;

  public time$ = merge(
    this.form.valueChanges.pipe(
      debug('form.valueChanges'),
      map((value) => value.minutes! * 60 + value.seconds!)
    ),
    this.reset$.pipe(
      switchMap(() =>
        of(this.form.value.minutes! * 60 + this.form.value.seconds!)
      )
    )
  ).pipe(
    debug('time$'),
    startWith(this.form.value.minutes! * 60 + this.form.value.seconds!),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion TIME FOR COUNTDOWN

  //#region RUNNING
  public running$ = merge(
    this.start$.pipe(map(() => true)),
    this.resume$.pipe(map(() => true)),
    this.reset$.pipe(map(() => false)),
    this.pause$.pipe(map(() => false))
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  //#endregion RUNNING

  //#region COUNTDOWN
  public countdown$ = this.running$.pipe(
    switchMap((run) =>
      interval(100).pipe(
        switchMap((seconds) =>
          this.time$.pipe(
            take(1),
            map((t) => [seconds, t])
          )
        ),
        debug('countdown$'),
        filter(() => !!run),
        map(([seconds, time]) => (run ? time - seconds * 0.1 : time)),
        filter((seconds) => seconds >= 0)
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion COUNTDOWN

  //#region COUNTDOWN DISPLAY
  public countdownDisplay$ = this.countdown$.pipe(
    map((remainingSeconds) => {
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = Math.floor(remainingSeconds % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }),
    startWith(
      `${this.form.controls.minutes.value}:${this.form.controls.seconds.value
        .toString()
        .padStart(2, '0')}`
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion COUNTDOWN DISPLAY

  //#region TIME PROGRSS
  public circleDashOffset$ = this.countdown$.pipe(
    map((countdown) => {
      const radius = 48;
      const circumference = 2 * Math.PI * radius;

      const remainingPercentage = countdown / this.DEFAULT_WORK_TIME;
      return circumference * remainingPercentage;
    })
  );
  //#endregion TIME PROGRSS

  //#region HELPERS
  public isValidMinuteValue(value: number): boolean {
    return value > 0 && value < 60;
  }
  //#region HELPERS
}
