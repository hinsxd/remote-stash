import { program } from "commander";

program.name("remote-stash");
program.command("test").action(() => {});

program.parse(process.argv);
