# Yeetstack

Yeetstack is an implementation of Yeet Notation - an ergonomic monadic control flow for javascript/typescript. It's the equivalent of Haskell's Do Notation or Gleam's Use.

Yeetstack uses a combination of a generator function, a proxy and a stack to provide devs with a clean imperative looking syntax for any monadic control flow. Think of it async/await but for any monadic operation. It looks like this:

```ts
function* getUserProfile(id: number) {
   const { yeet, yoink } = Yeet({ getUser, getAddress })

   yield yeet.getUser(id).user
   yield yeet.getAddress('user').address

   return { ...yoink() } // returns { user, address }
}

const result = run(getUserProfile, 4)

// this will give you a success result, or it will short circuit, give you a failure result and include any data accumulated so far
```

## How to use it

Say you have a workflow that consists of multiple steps that could fail, for instance, getting a user and their address from somewhere. It doesn't have to be an async workflow necessarily.

You define your workflow using a generator function. Here, you should:

- receive any initial arguments to your generator function
- destructure `yeet` and `yoink` from `Yeet`, and pass it the functions you want to use.
- define each step of the workflow like so:
   - begin each step with `yield`
   - call your desired function as a property of `yeet`
      - except for the initial argument, these need to be strings, as they're on the yeetstack, and not in scope
   - define the name for the return variable as a prop on the function call (`user`, `address` in the example)
   - finally, use `yoink` to retrieve all stored values from the yeetstack

You can easily rename `yeet` to something more domain-specific, for instance:

```ts
const { yeet: db, yoink } = Yeet({ getUser, getAddress })

yield db.getUser(id).user
```

## WTF is going on?

When you initially call Yeet with your functions, it returns an object containing `yeet` and `yoink`. It also registers the functions you pass it and creates an empty array, which it uses like a stack.

The `yeet` object is a proxy that behaves differently depending on whether you pass it a registered function or a property. When you pass it a registered function name, it saves it as a pending call and resolves the argument names with values on the yeetstack.

When it receives a property and there is a pending function call, it runs the function and pushes the return value to the yeetstack, as an object where name is the prop key you gave and value is the return value.

Finally, when you call `yoink()`, everything is pulled off the stack and converted to an object that you can destructure, with their saved names as the property keys.

## Why?

The generator and associated runner give you complete control flow safety no matter which step fails, and ensure you always get a consistent result type.

But even with that, consider the case where your workflow doesn't need to store every variable, e.g. a CSS parser:

```ts
const name = yield eat("PROPERTY_NAME")
yield eat(":")
const value = yield eat('VALUE')
yield eat(";")

return { name, value }
```

I didn't like that the `yield`s weren't all lined up. So I added the yeetstack so that I could write:

```ts
// yeet has been renamed to parser
yield parser.eat("PROPERTY_NAME").name
yield parser.eat(":")
yield parser.eat('VALUE').value
yield parser.eat(";")

return { ...yoink() }
```

You can also pass any variable on the yeetstack to any function, but you have to pass its name as a string, since the variable isn't in scope.

## License

Yeetstack is completely open source and MIT licensed. Feel free to use it however you like. I think it has some potential as a way to escape flatMap hell for other monadic workflows, such as Effect.ts.
