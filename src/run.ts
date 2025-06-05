export function run(generatorFn: (...args: any) => Generator<any, any, any>, ...args: any) {
  const gen = generatorFn(...args);
  const yields = [];
  let result = gen.next();

  while (!result.done) {
    const monad = result.value;

    // Let the monad decide control flow
    if (monad.stop) {
      gen.return(monad);
      return {
         status: "stopped",
         data: monad.extract(),
         yields
      };
    }

    // Extract value and continue
    yields.push(monad.extract());
    result = gen.next();
  }

  // Wrap final result in the monad type
  return {
     status: "success",
     data: result.value,
     yields
  }
}
