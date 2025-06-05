import { describe, it, expect, beforeEach } from "bun:test";
import { Yeet, run } from './index';

// Test utilities - your Monad implementation
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
};

// Mock functions with deterministic behavior for testing
const createMockGetUser = (shouldSucceed: boolean) => (id?: number) => {
  if (!id) return Monad.none("No Id!");
  return shouldSucceed
    ? Monad.of({ name: "Jim", age: 41, id })
    : Monad.none("No user");
};

const createMockGetAddress = (shouldSucceed: boolean) => (user: { name: string, age: number }) => {
  return shouldSucceed
    ? Monad.of({ city: 'Melbourne', user })
    : Monad.none("No address");
};

describe("Yeet Stack", () => {
  describe("run() with arguments", () => {
    it("should pass arguments to generator function", () => {
      // Create mocks for this specific test
      const getUser = createMockGetUser(true);
      const getAddress = createMockGetAddress(true);

      function* getUserProfile(id: number) {
        const { yeet, yoink } = Yeet({ getUser, getAddress });
        yield yeet.getUser(id).user;
        yield yeet.getAddress('user').address;
        return { ...yoink() };
      }

      const result = run(getUserProfile, 4);

      // Verify the result structure
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');

      // If your run function returns the final value, you might test:
      // expect(result.user).toEqual({ name: "Jim", age: 41, id: 4 });
      // expect(result.address).toEqual({ city: 'Melbourne', user: expect.any(Object) });
    });

    it("should handle multiple arguments", () => {
      const getUser = createMockGetUser(true);
      const getAddress = createMockGetAddress(true);

      function* testGenerator(arg1: number, arg2: string) {
        const { yeet, yoink } = Yeet({ getUser, getAddress });
        yield yeet.getUser(arg1).user;
        return { arg1, arg2, ...yoink() };
      }

      const result = run(testGenerator, 5, "test");

      expect(result).toBeDefined();
      // Add more specific assertions based on your expected behavior
    });
  });

  describe("run() without arguments", () => {
    it("should work when no arguments are passed to run()", () => {
      const getUser = createMockGetUser(true);
      const getAddress = createMockGetAddress(true);

      function* getUserProfileNoArgs() {
        const { yeet, yoink } = Yeet({ getUser, getAddress });
        // Use a default ID since no arguments are passed
        yield yeet.getUser(1).user;
        yield yeet.getAddress('user').address;
        return { ...yoink() };
      }

      const result = run(getUserProfileNoArgs);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it("should handle generator that expects no arguments", () => {
      function* simpleGenerator() {
        const { yeet, yoink } = Yeet({
          getValue: () => Monad.of("test value")
        });
        yield yeet.getValue().value;
        return { ...yoink() };
      }

      const result = run(simpleGenerator);

      expect(result).toBeDefined();
      // Add assertions based on your expected behavior
    });
  });

  describe("error handling", () => {
    it("should handle failed user lookup", () => {
      const getUser = createMockGetUser(false); // Will return Monad.none
      const getAddress = createMockGetAddress(true);

      function* getUserProfile(id: number) {
        const { yeet, yoink } = Yeet({ getUser, getAddress });
        yield yeet.getUser(id).user;
        yield yeet.getAddress('user').address;
        return { ...yoink() };
      }

      const result = run(getUserProfile, 4);

      expect(result).toEqual({
        status: "stopped",
        data: "No user",
        yields: []
      });
    });

    it("should handle failed address lookup", () => {
      const getUser = createMockGetUser(true);
      const getAddress = createMockGetAddress(false); // Will return Monad.none

      function* getUserProfile(id: number) {
        const { yeet, yoink } = Yeet({ getUser, getAddress });
        yield yeet.getUser(id).user;
        yield yeet.getAddress('user').address;
        return { ...yoink() };
      }

      const result = run(getUserProfile, 4);

      expect(result).toEqual({
        status: "stopped",
        data: "No address",
        yields: [
          {
            name: "Jim",
            age: 41,
            id: 4
          }
        ]
      });
    });

    it("should handle missing user ID", () => {
      const getUser = (id?: number) => {
        if (!id) return Monad.none("No Id!");
        return Monad.of({ name: "Jim", age: 41, id });
      };
      const getAddress = createMockGetAddress(true);

      function* getUserProfile(id?: number) {
        const { yeet, yoink } = Yeet({ getUser, getAddress });
        yield yeet.getUser(id).user;
        yield yeet.getAddress('user').address;
        return { ...yoink() };
      }

      const result = run(getUserProfile, undefined);

      expect(result).toEqual({
        status: "stopped",
        data: "No Id!",
        yields: []
      });
    });
  });
});
