import { OverlayModule } from '@angular/cdk/overlay';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  EMPTY,
  filter,
  interval,
  map,
  merge,
  Observable,
  of,
  ReplaySubject,
  shareReplay,
  startWith,
  switchMap,
  takeWhile,
} from 'rxjs';
import { FadeInAnimation } from '../../shared/animations/fadeIn.animation';
import { FadeInFadeOutAnimation } from '../../shared/animations/fadeInFadeOut.animation';
import { debug } from '../../shared/operators';

enum TimerState {
  running = 'running',
  paused = 'paused',
  pristine = 'pristine',
}

export type MinuteSecondPair = {
  minutes: number;
  seconds: number;
};
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

  //#region STATES
  public start$ = new ReplaySubject<void>();
  public reset$ = new ReplaySubject<void>();
  public pause$ = new ReplaySubject<void>();
  public resume$ = new ReplaySubject<void>();
  //#endregion STATES

  //#region TIME FORM
  form = new FormGroup({
    minutes: new FormControl<number>(5, {
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
  public time$ = merge(
    this.form.valueChanges.pipe(
      debug('form.valueChanges'),
      map((value) => this.toSeconds(value as MinuteSecondPair))
    ),
    this.reset$.pipe(
      switchMap(() => of(this.toSeconds(this.form.getRawValue())))
    )
  ).pipe(
    startWith(this.form.value.minutes! * 60 + this.form.value.seconds!),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  //#endregion TIME FOR COUNTDOWN

  //#region STATE
  public readonly TimerState = TimerState;

  public state$: Observable<TimerState> = merge(
    this.start$.pipe(map(() => TimerState.running)),
    this.pause$.pipe(map(() => TimerState.paused)),
    this.resume$.pipe(map(() => TimerState.running)),
    this.reset$.pipe(map(() => TimerState.pristine))
  ).pipe(
    startWith(TimerState.pristine),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  public readonly TIMER_STATE_OBSERVABLES: Record<
    TimerState,
    (state: TimerState) => Observable<any>
  > = {
    [TimerState.running]: (state) =>
      interval(100).pipe(
        switchMap((seconds) => this.time$.pipe(map((t) => [seconds, t]))),
        map(([seconds, time]) => time - seconds * 0.1),
        filter((remainingTime) => remainingTime >= 0),
        takeWhile(() => state === TimerState.running)
      ),
    [TimerState.pristine]: (state) =>
      of(this.toSeconds(this.form.getRawValue())),
    [TimerState.paused]: (state) => EMPTY,
  };
  //#endregion STATE

  //#region COUNTDOWN
  public countdown$ = this.state$.pipe(
    switchMap((state) => this.TIMER_STATE_OBSERVABLES[state](state)),
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
      const timeSelected = this.toSeconds(this.form.getRawValue());
      const radius = 48;
      const circumference = 2 * Math.PI * radius;

      const remainingPercentage = countdown / timeSelected;
      return circumference * remainingPercentage;
    })
  );
  //#endregion TIME PROGRSS

  //#region HELPERS
  public isValidMinuteValue(value: number): boolean {
    return value > 0 && value < 60;
  }
  private toSeconds(value: MinuteSecondPair): number {
    return value.minutes * 60 + value.seconds;
  }
  //#region HELPERS
}
