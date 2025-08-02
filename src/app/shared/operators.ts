import { Observable, tap } from 'rxjs';

export function debug<T>(log?: string) {
  return (source: Observable<T>) =>
    source.pipe(
      tap((value) => {
        console.log(log ?? '', value);
      })
    );
}
