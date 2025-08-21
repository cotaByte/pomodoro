/// <reference lib="webworker" />

let countdown = 0;
let timer: any;

addEventListener('message', ({ data }) => {
  const { command, duration } = data;
  command === 'stop' && clearInterval(timer);

  if (command === 'start') {
    clearInterval(timer);
    countdown = duration;

    timer = setInterval(() => {
      countdown--;
      postMessage({ type: 'tick', value: countdown });

      countdown <= 0 && clearInterval(timer);
      countdown <= 0 && postMessage({ type: 'done' });
    }, 1000);
  }
});
