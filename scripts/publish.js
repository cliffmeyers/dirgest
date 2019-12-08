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
    let answer = '';

    const branch = getBranch();
    let publishBeta = false;

    if (branch !== 'master') {
        console.log(`current branch is not 'master'`);
        answer = await prompt(`Would you like to publish a beta? `);

        if (answer !== 'yes') {
            exit(0, 'aborting');
        }

        publishBeta = true;
    }

    const versionNext = await getNextVersion(publishBeta);
    answer = await prompt('Proceed with publish? ');

    if (answer !== 'yes') {
        exit(0, 'aborting');
    }

    const npmTags = publishBeta ? '--tag beta' : '';

    run(`npm run build`);
    preparePackage(versionNext);
    run(`npm publish ${npmTags}`);

    run(`git commit -am "published version ${versionNext}"`);
    run(`git tag ${versionNext}`);
    run('git push');
    run('git push --tags');

    exit(0, 'published successfully.');
}

function getBranch() {
    console.log('git branch...');
    let branch = run(`git rev-parse --abbrev-ref HEAD`).toString().trim();

    if (!!branch) {
        return branch;
    }
    
    exit(1, `could not get clean branch name, was '${branch}'; aborting`);
}

async function getNextVersion(beta = false) {
    const pkgInfo = readPackage();
    const versionLocal = pkgInfo.version;
    console.log(`checking for '${pkgInfo.name}' in registry...`);
    const query = run(`npm view ${pkgInfo.name} --json`, { silent: true, continueOnErrors: true });
    const registryInfo = JSON.parse(query.toString().trim());

    let versions = {
        latest: null,
        beta: null
    }

    if (query.code !== 0 && registryInfo.error.code === 'E404') {
        console.log(`package '${pkgInfo.name}' not found`);
    } else if (query.code !== 0) {
        console.log('unknown error from registry');
        console.log(registryInfo)
        exit(1, 'aborting')
    } else {
        const registryVersions = registryInfo && registryInfo['dist-tags'] || {};

        versions = {
            ...versions,
            ...registryVersions
        };
    }

    console.log(versions);

    let versionToTick = '';
    let versionNext = '';

    if (beta) {
        if (!versions.latest && !versions.beta) {
            versionToTick = '0.0.1-beta.0';
        } else if (!versions.beta || versions.latest === versions.beta) {
            versionToTick = `${versions.latest}`;
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
    } else {
        if (versions.latest.includes('-beta')) {
            const index = versions.latest.indexOf('-beta');
            versionNext = versions.latest.slice(0, index);
        } else {
            versionToTick = versions.latest;
        }        
    }
    
    if (!versionNext) {
        versionNext = tickVersion(versionToTick);
    }

    console.log(`current version is:  ${versionLocal}`);
    console.log(`new version will be: ${versionNext}`);
    return versionNext;
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
