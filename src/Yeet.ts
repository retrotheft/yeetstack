type StackItem = {
   prop: string,
   value: unknown
}

export function Yeet<T extends Record<string, Function>>(_fns: T) {
   const fns = new Map<keyof T, Function>()
   const stack: StackItem[] = []
   let pending: any = null

   Object.entries(_fns).forEach(([name, func]) => {
      fns.set(name, func);
   });

   // for retrieving function arguments from stack
   function getFromStack(prop: string) {
      const item = stack.find(el => el.prop === prop)
      return item?.value
   }

   function handleGet(target: any, prop: string | symbol): any {
      if (typeof prop === 'symbol') return

      if (!fns.has(prop)) {
         pending = { prop, value: undefined }
         return yeet
      }

      return (...args: any[]) => {
         const resolvedArgs = args.map((arg: unknown) => {
            if (typeof arg === 'string' && getFromStack(arg)) {
               return getFromStack(arg)
            }
            return arg
         })
         const fn = fns.get(prop)!
         if (!pending) return fn(...resolvedArgs)
         const monad = fn(...resolvedArgs)
         pending.value = monad.extract()
         stack.push(pending)
         pending = null
         return monad
      }

   }

   const yeet: Record<string, any> & (() => any) = new Proxy(() => { }, {
      get: (target, prop) => handleGet(target, prop),
      apply: (target, thisArg, argumentsList) => ({
         stop: true,
         extract: () => "Yeet terminated operation due to error."
      })
   })

   function yoink(n = stack.length): Record<string, unknown> {
      const items = stack.slice(-n)
      const result: Record<string, unknown> = {}
      items.forEach(item => {
         result[item.prop] = item.value
      })
      return result
   }

   return {
      yeet,
      yoink
   }
}
