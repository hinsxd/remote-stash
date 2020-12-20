import chalk from "chalk";
import { exec as _exec } from "child_process";
import { program } from "commander";
import util from "util";

const stashBranchRegex = /^([0-9A-z-]*)-progress-([1-9][0-9]*)-?(.*)$/;

const getStashNo = (stashBranch: string) => {
  const match = stashBranch.match(stashBranchRegex);
  if (!match) {
    return null;
  }

  const number = parseInt(match[2]);
  if (!Number.isNaN(number)) {
    return number;
  }
  return null;
};

const exec = util.promisify(_exec);

program.name("remote-stash");

program
  .command("push [message]", { isDefault: true })
  .action(async (message?: string) => {
    const branchName = await exec("git branch --show-current").then((r) =>
      r.stdout.trim()
    );

    const match = branchName.match(stashBranchRegex);
    const baseBranch = match ? match[1] : branchName;
    if (!baseBranch) {
      console.log(chalk.red("Branch name not found"));
      process.exit(0);
    }

    const stashesWithNumber = await exec(
      `git for-each-ref --format='%(refname:short)' refs/heads/${baseBranch}-progress-[1-9]*`
    ).then((r) => r.stdout.trim().split("\n"));

    const maxStashBranch = stashesWithNumber.reduce(
      (maxObj, branch) => {
        const stashNum = getStashNo(branch);
        if (!!stashNum && stashNum > maxObj.num)
          return { name: branch, num: stashNum };
        return maxObj;
      },
      { name: null, num: 0 } as { name: string | null; num: number }
    );

    const newStashNum = maxStashBranch.num + 1;
    const newBranchName = `${baseBranch}-progress-${newStashNum}${
      message ? `-${message}` : ""
    }`;

    await exec(`git checkout -b ${newBranchName}`);
    await exec("git add -A");
    await exec(`git commit -m "Remote stash #${newStashNum} - ${message}"`);
  });

program.parse(process.argv);
