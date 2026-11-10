import { useSyncExternalStore } from "react";
import { getUi, subscribeUi, type UiState } from "../core/ui";

export function useUi(): UiState {
  return useSyncExternalStore(subscribeUi, getUi);
}
