﻿import tl = require('vsts-task-lib/task');
import path = require('path');
import fs = require('fs');

var msDeploy = require('webdeployment-common/deployusingmsdeploy.js');
var utility = require('webdeployment-common/utility.js');
var fileTransformationsUtility = require('webdeployment-common/fileTransformationsUtility.js');

async function run()
{
	try
	{
		tl.setResourcePath(path.join( __dirname, 'task.json'));
		var webSiteName: string = tl.getInput('WebSiteName', true);
		var virtualApplication: string = tl.getInput('VirtualApplication', false);
		var webDeployPkg: string = tl.getPathInput('Package', true);
		var setParametersFile: string = tl.getPathInput('SetParametersFile', false);
		var removeAdditionalFilesFlag: boolean = tl.getBoolInput('RemoveAdditionalFilesFlag', false);
		var excludeFilesFromAppDataFlag: boolean = tl.getBoolInput('ExcludeFilesFromAppDataFlag', false);
		var takeAppOfflineFlag: boolean = tl.getBoolInput('TakeAppOfflineFlag', false);
		var additionalArguments: string = tl.getInput('AdditionalArguments', false);
		var xmlTransformation: boolean = tl.getBoolInput('XmlTransformation', false);
		var JSONFiles = tl.getDelimitedInput('JSONFiles', '\n', false);
		var xmlVariableSubstitution: boolean = tl.getBoolInput('XmlVariableSubstitution', false);		
		var availableWebPackages = utility.findfiles(webDeployPkg);
        var tempPackagePath = null;

		if(availableWebPackages.length == 0)
		{
			throw new Error(tl.loc('Nopackagefoundwithspecifiedpattern'));
		}

		if(availableWebPackages.length > 1)
		{
			throw new Error(tl.loc('MorethanonepackagematchedwithspecifiedpatternPleaserestrainthesearchpatern'));
		}
		webDeployPkg = availableWebPackages[0];

		var isFolderBasedDeployment = await utility.isInputPkgIsFolder(webDeployPkg);

        if ( JSONFiles.length != 0 || xmlTransformation || xmlVariableSubstitution ) {

			var folderPath = await fileTransformationsUtility.generateTemporaryFolder(isFolderBasedDeployment, webDeployPkg);
            await fileTransformationsUtility.fileTransformations(isFolderBasedDeployment, JSONFiles, xmlTransformation, xmlVariableSubstitution, folderPath);
			var output = await fileTransformationsUtility.archiveFolder(isFolderBasedDeployment, webDeployPkg, folderPath);
            tempPackagePath = output.tempPackagePath;
            webDeployPkg = output.webDeployPkg;
		}		
		
		await msDeploy.DeployUsingMSDeploy(webDeployPkg, webSiteName, null, removeAdditionalFilesFlag,
                        excludeFilesFromAppDataFlag, takeAppOfflineFlag, virtualApplication, setParametersFile,
                        additionalArguments, isFolderBasedDeployment, true);
        
	}
	catch(error)
	{
		tl.setResult(tl.TaskResult.Failed,error);
	}
	
}
run();