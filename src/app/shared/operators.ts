import { Observable, tap } from 'rxjs';

export function debug(log?: string) {
  return (source: Observable<any>) =>
    source.pipe(
      tap((value) => {
        console.log(log ?? '', value);
      })
    );
}
