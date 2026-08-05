/**
 * Prints a styled CLI message with instructions for importing Sanity seed data.
 */
function printSeedDataImportInstructions() {
  const COLOR_BLUE = "\x1b[34m";
  const COLOR_CYAN = "\x1b[36m";
  const COLOR_RESET = "\x1b[0m";

  const BOX_WIDTH = 109;
  const SIDE_PADDING = 2;

  // ANSI codes are stripped first so colored text still aligns to the box edge.
  function padLine(text = ""): string {
    // biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are used for styling
    const visibleLength = text.replace(/\x1b\[[0-9;]*m/g, "").length;
    const totalPadding = BOX_WIDTH - visibleLength;
    const left = " ".repeat(SIDE_PADDING);
    const right = " ".repeat(Math.max(0, totalPadding - SIDE_PADDING));
    return `│${left}${text}${right}│`;
  }

  function styleCommand(cmd: string): string {
    return `${COLOR_CYAN}${cmd}${COLOR_RESET}${COLOR_BLUE}`;
  }

  const lines = [
    "",
    `┌${"─".repeat(BOX_WIDTH)}┐`,
    padLine(
      `${COLOR_BLUE}To import the provided seed data into your Sanity dataset, run:${COLOR_RESET}`
    ),
    padLine(),
    padLine(
      `${COLOR_BLUE}${styleCommand("cd apps/studio && npx sanity dataset import seed-data.tar.gz <TARGET_DATASET>")}${COLOR_RESET}`
    ),
    padLine(),
    padLine(`${COLOR_BLUE}Example:${COLOR_RESET}`),
    padLine(
      `${COLOR_BLUE}${styleCommand("cd apps/studio && npx sanity dataset import seed-data.tar.gz production --replace")}${COLOR_RESET}`
    ),
    padLine(),
    `└${"─".repeat(BOX_WIDTH)}┘`,
    "",
    `${COLOR_BLUE}For more info, run: npx sanity dataset import --help${COLOR_RESET}`,
    "",
  ];

  for (const line of lines) {
    console.log(line);
  }
}

printSeedDataImportInstructions();
