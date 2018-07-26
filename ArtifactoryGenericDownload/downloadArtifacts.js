
const tl = require('vsts-task-lib/task');
const execSync = require('child_process').execSync;
const utils = require('jfrog-utils');
const path = require('path');

const cliDownloadCommand = "rt dl";

function RunTaskCbk(cliPath) {
    let buildDir = tl.getVariable('Agent.BuildDirectory');
    let buildDefinition = tl.getVariable('BUILD.DEFINITIONNAME');
    let buildNumber = tl.getVariable('BUILD_BUILDNUMBER');
    let specPath = path.join(buildDir, "downloadSpec.json");

    // Get input parameters
    let artifactoryService = tl.getInput("artifactoryService", false);
    let artifactoryUrl = tl.getEndpointUrl(artifactoryService, false);
    let fileSpec = tl.getInput("fileSpec", false);
    let collectBuildInfo = tl.getBoolInput("collectBuildInfo");

    // Write provided fileSpec to file
    try {
        tl.writeFile(specPath, fileSpec);
    } catch (ex) {
        handleException(ex);
    }

    let cliCommand = utils.cliJoin(cliPath, cliDownloadCommand, "--url=" + utils.quote(artifactoryUrl), "--spec=" + utils.quote(specPath));
    cliCommand = utils.addArtifactoryCredentials(cliCommand, artifactoryService);

    // Add build info collection
    if (collectBuildInfo) {
        cliCommand = utils.cliJoin(cliCommand, "--build-name=" + utils.quote(buildDefinition), "--build-number=" + utils.quote(buildNumber));
    }

    executeCliCommand(cliCommand, buildDir);

    tl.setResult(tl.TaskResult.Succeeded, "Build Succeeded.");
}

function executeCliCommand(cliCommand, runningDir) {
    try {
        execSync(cliCommand, {cwd:runningDir, stdio:[0,1,2]});
    } catch (ex) {
        // Error occurred
        handleException(ex);
    }
}

function handleException (ex) {
    tl.setResult(tl.TaskResult.Failed, ex);
    process.exit(1);
}

utils.executeCliTask(RunTaskCbk);