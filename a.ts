// cSpell:disable
import ts from "typescript";

type Func<T, Arg extends any[]> = (...args: Arg) => T;

function topm<T, Arg extends any[]>(
  fun: Func<T, Arg>,
  time?: number | undefined
) {
  return (...args: Arg) => {
    return new Promise<T>((re, rj) => {
      try {
        const result = fun(...args);
        setTimeout(() => re(result), time ?? 500);
      } catch (error) {
        rj(error);
      }
    });
  };
}

const aa = (a: number, b: string) => a + b;

const bb = (a: string) => a;

const ac = await topm(aa)(1, "2");
