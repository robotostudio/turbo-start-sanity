async function main() {
  console.log(
    "\n\x1b[34m┌────────────────────────────────────────────────────────────────────────────┐\x1b[0m",
  );
  console.log(
    "\x1b[34m│                                                                            │\x1b[0m",
  );
  console.log(
    "\x1b[34m│  To seed sample data, run:                                                 │\x1b[0m",
  );
  console.log(
    "\x1b[34m│                                                                            │\x1b[0m",
  );
  console.log(
    "\x1b[34m│                                                                            │\x1b[0m",
  );
  console.log(
    "\x1b[34m│                                                                            │\x1b[0m",
  );
  console.log(
    "\x1b[34m│                                                                            │\x1b[0m",
  );
  console.log(
    "\x1b[34m└────────────────────────────────────────────────────────────────────────────┘\x1b[0m\n",
  );
  console.log(
    "\x1b[34m cd apps/studio && npx sanity exec scripts/create-data.ts --with-user-token    \x1b[0m",
  );
  console.log("\x1b[34m mv github .github for actions to work  \x1b[0m");
}

main();
