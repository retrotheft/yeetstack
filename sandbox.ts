import { run } from './src/run'
import { Yeet } from './src/Yeet'

// function Yeet<T extends Record<string, Function>>(_fns: T) {
//    const fns = new Map<keyof T, Function>()
//    const stack: any[] = []
//    let pending: any = null

//    Object.entries(_fns).forEach(([name, func]) => {
//       fns.set(name, func);
//    });

//    // for retrieving function arguments from stack
//    function getFromStack(prop: string) {
//       const item = stack.find(el => el.prop === prop)
//       return item?.value
//    }

//    function handleGet(target: any, prop: string | symbol): any {
//       if (typeof prop === 'symbol') return

//       if (fns.has(prop as keyof T)) {
//          console.log("Matching function", prop)
//          return (...args: any[]) => {
//             const resolvedArgs = args.map((arg: unknown) => {
//                if (typeof arg === 'string' && getFromStack(arg)) {
//                   return getFromStack(arg)
//                }
//                return arg
//             })
//             const fn = fns.get(prop)!
//             if (!pending) return fn()
//             const monad = fn(...resolvedArgs)
//             pending.value = monad.extract()
//             console.log(pending)
//             stack.push(pending)
//             pending = null
//             return monad
//          }
//       } else {
//          console.log("No matching function", prop)
//          console.log("...saving as pending assignment.")
//          pending = { prop, value: undefined }
//          return yeet
//       }
//    }

//    const yeet: Record<string, any> & (() => any) = new Proxy(() => {}, {
//       get: (target, prop) => handleGet(target, prop),
//       apply: (target, thisArg, argumentsList) => ({
//          stop: true,
//          extract: () => "Yeet terminated operation due to error."
//       })
//    })

//    function yoink(n = stack.length): Record<string, unknown> {
//       const items = stack.slice(-n)
//       const result: Record<string, unknown> = {}
//       items.forEach(item => {
//          result[item.prop] = item.value
//       })
//       return result
//    }

//    return {
//       yeet,
//       yoink
//    }
// }

const Monad = {
  of: (value: any) => ({
    flatMap: (fn: (v: any) => typeof Monad) => fn(value),
    extract: () => value,
    stop: false
  }),

  none: (value: any) => ({
    flatMap: () => Monad.none(value),
    extract: () => value,
    stop: true
  })
}

const greet = () => Math.random() < 0.5 ? Monad.none("Nope!") : Monad.of("Hello there")

function* testGenerator() {
   const { yeet, yoink } = Yeet({ greet })

   yield yeet.greeting.greet()
   yield yeet.greet()

   return yoink() // could potentially be yeet with an apply
}

const result = run(testGenerator)
console.log("Result: ", result)
