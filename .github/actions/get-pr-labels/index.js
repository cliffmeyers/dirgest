const core = require('@actions/core');
const github = require('@actions/github');

async function main() {
  try {
    // `who-to-greet` input defined in action metadata file
    // const nameToGreet = core.getInput('who-to-greet');
    // console.log(`Hello ${nameToGreet}!`);
    // const time = (new Date()).toTimeString();
    // core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    // const payload = JSON.stringify(github.context.payload, undefined, 2)
    // console.log(`The event payload: ${payload}`);
  
    console.log('reading token');
    const token = core.getInput('github-token');

    const octokit = new github.GitHub(token);
    console.log('calling octokit');
    const { data: pullRequests } = await octokit.pulls.get({
        owner: 'cliffmeyers',
        repo: 'dirgest'
    });
  
    console.log(pullRequests);
  
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();