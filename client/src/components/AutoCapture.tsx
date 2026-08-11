import { useEffect } from "react";
import { installAutoCapture } from "../lib/bugHub";

export function AutoCapture() {
  useEffect(() => {
    const env = import.meta.env.PROD ? "production" : "staging";
    return installAutoCapture(env);
  }, []);

  return null;
}
