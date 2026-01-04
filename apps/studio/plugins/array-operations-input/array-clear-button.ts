import {
  type ArrayOfObjectsInputProps,
  definePlugin,
} from "sanity";

import { ArrayWithClearButton } from "./array-with-clear-button";

/**
 * Plugin that adds a "Clear All" button to all array input fields in the Studio.
 * The button appears below the array items and allows users to clear the entire array
 * with a confirmation dialog.
 */
export const arrayClearButton = definePlugin(() => ({
  name: "array-clear-button",
  form: {
    components: {
      input: (props: ArrayOfObjectsInputProps) => {
        if (props.schemaType.jsonType === "array") {
          return ArrayWithClearButton(props);
        }
        return props.renderDefault(props);
      },
    },
  },
}));
