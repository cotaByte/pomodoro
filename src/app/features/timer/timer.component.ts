import { AsyncPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  filter,
  interval,
  map,
  merge,
  ReplaySubject,
  shareReplay,
  Subject,
  switchMap,
} from 'rxjs';
import { debug } from '../../shared/operators';

@Component({
  selector: 'pomodoro-timer',
  imports: [AsyncPipe],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss',
})
export class TimerComponent {
  public readonly DEFAULT_WORK_TIME = 0.25 * 60;

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

  public running$ = merge(
    this.start$.pipe(map(() => true)),
    this.resume$.pipe(map(() => true)),
    this.reset$.pipe(map(() => false)),
    this.pause$.pipe(map(() => false))
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  //#endregion RESUME
  public countdown$ = this.running$.pipe(
    debug('is running'),
    switchMap((run) =>
      interval(100).pipe(
        filter(() => !!run),
        map((seconds) => this.DEFAULT_WORK_TIME - seconds * 0.1),
        filter((seconds) => seconds >= 0)
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public countdownDisplay$ = this.countdown$.pipe(
    map((remainingSeconds) => {
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = Math.floor(remainingSeconds % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public circleDashOffset$ = this.countdown$.pipe(
    map((countdown) => {
      const radius = 48;
      const circumference = 2 * Math.PI * radius;

      const remainingPercentage = countdown / this.DEFAULT_WORK_TIME;
      return circumference * remainingPercentage;
    })
  );
}
