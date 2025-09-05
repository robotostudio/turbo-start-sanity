import { NavbarProps, useWorkspace } from "sanity";
import { Card, Stack, Text } from "@sanity/ui";

export function DatasetBanner(props: NavbarProps) {
  const { dataset } = useWorkspace();

  // Check if we're on the production studio hostname
  const productionHostname = process.env.SANITY_STUDIO_PRODUCTION_HOSTNAME ?? "";
  const isProductionStudio = productionHostname 
    ? window.location.hostname === `${productionHostname}.sanity.studio`
    : false;

  // Don't show banner if we're on production studio with production dataset
  // This is a content editor using the intended production environment
  if (isProductionStudio && dataset === "production") {
    return props.renderDefault(props);
  }

  // Use different tones based on dataset importance
  const tone = dataset === "production" ? "critical" : "caution";

  return (
    <Stack>
      <Card padding={3} tone={tone}>
        <Text size={1}>
          Using the <strong>{dataset}</strong> dataset
        </Text>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  );
}
