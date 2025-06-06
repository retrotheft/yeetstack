import { Yeet, run } from './index'

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

const getUser = (id?: number) =>  {
   if (!id) return Monad.none("No Id!")
   return Math.random() < 1
      ? Monad.of({ name: "Jim", age: 41, id })
      : Monad.none("No user")
}

const getAddress = (user: { name: string, age: number }) => {
   return Math.random() < 1
      ? Monad.of({ city: 'Melbourne', user })
      : Monad.none("No address")
}

function* getUserProfile(id: number) {
   const { yeet: db, yoink } = Yeet({ getUser, getAddress })

   yield db.getUser(id).user
   yield db.getAddress('user')
   // this returns the proxy to yield, which breaks the runner

   yield db.user.getUser(id)
   yield db.address.getAddress('user')
   // if this syntax could work, then the function still needs to return a monad

   return { ...yoink() }
}

const result = run(getUserProfile, 4)

console.log(result)
