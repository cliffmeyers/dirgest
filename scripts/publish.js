#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const shell = require('shelljs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function prompt(question, defaultValue) {
    return new Promise(resolve => {
        const text = question + (defaultValue && `[${defaultValue}]: ` || '');
        rl.question(text, answer => {
            answer = answer && answer.trim()
            resolve(answer ? answer : defaultValue)
        });
    })
}

function run(command, options) {
    const continueOnErrors = options && options.continueOnErrors
    const ret = shell.exec(command, options)
    if (!continueOnErrors && ret.code !== 0) {
        shell.exit(1)
    }
    return ret;
}

function exit(code, msg) {
    console.error(msg)
    shell.exit(code)
}

async function publish() {
    if (checkLatestRelease()) {
        failIfInvalidRelease();
        startLatestRelease();
    } else {
        startBetaRelease();
    }
}

function startLatestRelease() {
    const versions = getRegistryVersions();

    let versionNext = '';

    if (versions.latest.includes('-beta')) {
        const index = versions.latest.indexOf('-beta');
        versionNext = versions.latest.slice(0, index);
    } else {
        versionNext = tickVersion(versions.latest);
    }

    completeRelease(versionNext, 'latest', true);
}

function startBetaRelease() {
    let answer = '';

    const versions = getRegistryVersions();

    if (!versions.latest && !versions.beta) {
        versionToTick = '0.0.1-beta.0';
    } else if (!versions.beta || versions.latest === versions.beta) {
        versionToTick = versions.latest;
    } else {
        console.log(`(A) latest ${versions.latest}`);
        console.log(`(B) beta   ${versions.beta}`)
        let answer = await prompt(`which version do you want to tick for this beta? `);
        if (answer === 'A') {
            versionToTick = versions.latest;
        } else if (answer === 'B') {
            versionToTick = versions.beta
        } else {
            exit(0, 'aborting');
        }
    }

    answer = await prompt(`Proceed with publish? type 'yes' to confirm)`);

    if (answer !== 'yes') {
        exit(0, 'aborting');
    }

    const versionNext = tickVersion(versionToTick);
    completeRelease(versionNext, 'beta');
}

function completeRelease(versionNext, npmTag, gitTag = false) {
    run(`npm run build`);

    preparePackage(versionNext);
    run(`npm publish --tag ${npmTag}`);

    run(`git commit -am "published version ${versionNext}"`);
    run('git push');

    if (gitTag) {
        run(`git tag ${versionNext}`);
        run('git push --tags');
    }

    exit(0, 'published successfully.');
}

function checkLatestRelease() {
    return process.args.some(arg => arg === '--release-latest');
}

function failIfInvalidRelease() {
    if (checkLatestRelease() && process.env.BRANCH_NAME !== 'refs/heads/master') {
        exit(1, `can't release latest from non-master branch`);
    }
}

function getRegistryVersions() {
    const pkgInfo = readPackage();
    console.log(`checking for '${pkgInfo.name}' in registry...`);
    const query = run(`npm view ${pkgInfo.name} --json`, { silent: true, continueOnErrors: true });
    const registryInfo = JSON.parse(query.toString().trim());

    let versions = {
        latest: null,
        beta: null
    }

    if (query.code !== 0 && registryInfo.error.code === 'E404') {
        console.log(`package '${pkgInfo.name}' not found`);
        return '0.0.1';
    } else if (query.code !== 0) {
        console.log('unknown error from registry');
        console.log(registryInfo)
        exit(1, 'aborting');
    } else {
        const registryVersions = registryInfo && registryInfo['dist-tags'] || {};

        versions = {
            ...versions,
            ...registryVersions
        };
    }

    return versions;
}

function tickVersion(version) {
    const versions = version.split('.');
    const incr = parseInt(versions.pop()) + 1;
    versions.push(incr);
    const ticked = versions.join('.');
    return ticked;
}

function preparePackage(version) {
    const pkg = readPackage();
    pkg.version = version;
    fs.writeFileSync(path.resolve(__dirname, '../package.json'), JSON.stringify(pkg, null, 2) + '\n');
}

function readPackage() {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json')));
}

publish();
