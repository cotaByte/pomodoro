import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface TimerEvent {
  type: 'tick' | 'done';
  value?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      new URL('../worker/timer.worker', import.meta.url),
      {
        type: 'module',
      }
    );
  }

  startTimer(duration: number): Observable<TimerEvent> {
    return new Observable<TimerEvent>((subscriber) => {
      this.worker.onmessage = ({ data }) => {
        subscriber.next(data);

        if (data.type === 'done') {
          subscriber.complete();
        }
      };

      this.worker.postMessage({ command: 'start', duration });
    });
  }

  stopTimer() {
    console.log('Stopping timer');
    this.worker.postMessage({ command: 'stop' });
  }
}
