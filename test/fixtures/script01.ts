
print('starting...');
await sleep(1000);
print('after one second...');
await sleepThenFail(1000, 'oops!');
throw 42;
//print('...finished');
