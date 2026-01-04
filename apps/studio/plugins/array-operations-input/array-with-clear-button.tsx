import { TrashIcon } from "@sanity/icons";
import { Box, Button, Card, Dialog, Flex, Stack, Text } from "@sanity/ui";
import { useCallback, useState } from "react";
import { type ArrayOfObjectsInputProps, unset } from "sanity";

/**
 * Custom array input component that wraps the default array input
 * and adds a "Clear All" button below the array items.
 */
export function ArrayWithClearButton(props: ArrayOfObjectsInputProps) {
  const { renderDefault, onChange, value } = props;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const handleConfirmClear = useCallback(() => {
    onChange(unset());
    setIsDialogOpen(false);
  }, [onChange]);

  const hasItems = value && value.length > 0;

  return (
    <Stack space={3}>
      {/* Render the default array input */}
      {renderDefault(props)}

      {/* Add the clear button below */}
      {hasItems && (
        <Card padding={3} radius={2} shadow={1} tone="default">
          <Flex align="center" justify="space-between">
            <Text size={1} muted>
              {value.length} {value.length === 1 ? "item" : "items"} in array
            </Text>
            <Button
              icon={TrashIcon}
              mode="ghost"
              tone="critical"
              text="Clear all"
              onClick={handleOpenDialog}
              fontSize={1}
            />
          </Flex>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {isDialogOpen && (
        <Dialog
          id="clear-array-dialog"
          header="Clear all items?"
          onClose={handleCloseDialog}
          footer={
            <Box padding={3}>
              <Flex gap={2} justify="flex-end">
                <Button
                  text="Cancel"
                  mode="ghost"
                  onClick={handleCloseDialog}
                />
                <Button
                  text="Clear all"
                  tone="critical"
                  onClick={handleConfirmClear}
                  icon={TrashIcon}
                />
              </Flex>
            </Box>
          }
          width={1}
        >
          <Box padding={4}>
            <Text>
              Are you sure you want to clear all {value?.length}{" "}
              {value?.length === 1 ? "item" : "items"} from this array? This
              action cannot be undone.
            </Text>
          </Box>
        </Dialog>
      )}
    </Stack>
  );
}
