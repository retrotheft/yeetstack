type StackItem = {
   name: string,
   value: unknown
}

// Helper type to extract return type and infer the property name from a function
type ExtractReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// Helper type to convert function arguments, adding string option for stack references
type ConvertArgs<T extends readonly unknown[]> = {
  [K in keyof T]: T[K] | string
}

// Create a typed yeet object that allows both function calls and arbitrary property access
type TypedYeet<T extends Record<string, Function>> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => any
    ? (...args: ConvertArgs<Args>) => TypedYeet<T>
    : never
} & {
  // Allow any string property access for stack references and chaining
  [key: string]: any
}

export function Yeet<T extends Record<string, Function>>(_fns: T) {
   const fns = new Map<keyof T, Function>()
   const stack: StackItem[] = []
   let pending: any = null

   // register functions
   Object.entries(_fns).forEach(([name, func]) => {
      fns.set(name, func);
   });

   function getFromStack(name: string) {
      const item = stack.find(el => el.name === name)
      return item?.value
   }

   const yeet = new Proxy({} as TypedYeet<T>, {
      get: (target, prop) => handleGet(target, prop)
   })

   function handleGet(target: any, prop: string | symbol): any {
      if (typeof prop === 'symbol') return

      if (pending) {
         const result = pending.result;
         stack.push({ name: prop as string, value: result.extract() })
         pending = null
         return result
      }

      if (fns.has(prop as keyof T)) {
         const fn = fns.get(prop as keyof T)!
         return (...args: any[]) => {
            const resolvedArgs = args.map((arg: unknown) => {
               if (typeof arg === 'string' && getFromStack(arg) !== undefined) {
                  return getFromStack(arg);
               }
               return arg
            })
            const result = fn(...resolvedArgs)
            pending = { result }
            return yeet
         }
      }

      // For non-function properties, just return the yeet object to allow chaining
      return yeet
   }

   function yoink(n = stack.length): Record<string, unknown> {
      const items = stack.slice(-n)
      const result: Record<string, unknown> = {}
      items.forEach(item => {
         result[item.name] = item.value
      })
      return result
   }

   return {
      yeet,
      yoink
   }
}
