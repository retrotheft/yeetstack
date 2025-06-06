# Yeetstack

Yeetstack is an implementation of Yeet Notation - an ergonomic monadic control flow for javascript/typescript. It's the equivalent of Haskell's Do Notation or Gleam's Use.

Yeetstack uses a combination of a generator function, a proxy and a stack to provide devs with a clean imperative looking syntax for any monadic control flow. Think of it as async/await but for any monadic operation. It looks like this:

```ts
function* getUserProfile(id: number) {
   const { yeet, yoink } = Yeet({ getUser, getAddress })

   yield yeet.user.getUser(id)
   yield yeet.address.getAddress('user')

   return yoink() // returns { user, address }
}

const result = run(getUserProfile, 4)

// this will give you a success result, or it will short circuit,
// give you a failure result and include any data accumulated so far
```

## How to use it

Say you have a workflow that consists of multiple steps that could fail, for instance, getting a user and their address from somewhere. It doesn't have to be an async workflow necessarily.

You define your workflow using a generator function. Here, you should:

- receive any initial arguments to your generator function
- destructure `yeet` and `yoink` from `Yeet`, and pass it the functions you want to use.
- define each step of the workflow like so:
   - begin each step with `yield`
   - reference `yeet`, and then:
      - (optionally) access a property, which will set up a variable name for the return value of a subsequent function, and/or;
      - call a registered function, and pass it any arguments you need to.
   - finally, use `yoink` to retrieve all stored values from the yeetstack

You can access previously saved variables on the yeetstack by passing their name as a string to a function call.
If you do not save a return value from a function, the function will still run normally.

So in this example:

```ts
yield yeet.user.getUser(id)
yield yeet.getAddress('user')
````

The return value of `getUser` is saved to `user` on the yeetstack. Then `getAddress` is called and `user` is referenced. However, in this example, the return value of address is not stored anywhere.

You can easily rename `yeet` to something more domain-specific, for instance:

```ts
const { yeet: db, yoink } = Yeet({ getUser, getAddress })

yield db.user.getUser(id)
```

## WTF is going on?

When you initially call Yeet with your functions, it returns an object containing `yeet` and `yoink`. It also registers the functions you pass it and creates an empty array, which it uses like a stack.

The `yeet` object is a proxy that behaves differently depending on whether you access a property or call a function.

When you access a property, it creates a pending variable with that property name.

When you call a function, yeet runs the function, and if there is a pending variable, saves the return value of the function to the pending variable and adds it to the yeetstack.

Finally, when you call `yoink()`, everything is pulled off the stack and converted to an object containing your stored variables.

## Why?

The generator and associated runner give you complete control flow safety no matter which step fails, and ensure you always get a consistent result type.

But even with that, consider the case where your workflow doesn't need to store every variable, e.g. a CSS parser:

```ts
const name = yield eat("PROPERTY")
yield eat(":")
const value = yield eat('VALUE')
yield eat(";")

return { name, value }
```

I didn't like that the `yield`s weren't all lined up. So I added the yeetstack so that I could write:

```ts
yield yeet.prop.eat("PROPERTY")
yield yeet.eat(":")
yield yeet.value.eat('VALUE')
yield yeet.eat(";")

return yoink()
```

---

## License

Yeetstack is completely open source and MIT licensed. Feel free to use it however you like. I think it has some potential as a way to escape flatMap hell for other monadic workflows, such as Effect.ts.
