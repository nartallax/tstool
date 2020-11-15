import {runAllTests, runSingleTest} from "test/test";
import {logError, logErrorAndExit, logInfo, setLogVerbosityLevel} from "utils/log";
import {updateCliArgsWithTsconfig, parseToolCliArgs} from "impl/config";
import {CLI} from "utils/cli";
import {TSToolContextImpl} from "impl/context";
import {TSToolWatchCompiler} from "impl/compilers/watch_compiler";
import {TSToolSingleRunCompiler} from "impl/compilers/single_run_compiler";
import {TransformerControllerImpl} from "impl/transformer/transformer_controller";
import {BundlerImpl} from "impl/bundler";
import {ModulePathResolverImpl} from "impl/module_path_resolver";
import {HttpApi} from "impl/http_api";

export async function tstoolMain(){
	TSToolContextImpl.createCompiler = context => context.config.watchMode
		? new TSToolWatchCompiler(context)
		: new TSToolSingleRunCompiler(context)

	TSToolContextImpl.createTransformerController = context => new TransformerControllerImpl(context);
	TSToolContextImpl.createBundler = context => new BundlerImpl(context);
	TSToolContextImpl.createPathResolver = context => new ModulePathResolverImpl(context);

	let cliArgs = parseToolCliArgs(CLI.processArgvWithoutExecutables);

	if(cliArgs.verbose){
		setLogVerbosityLevel(1);
	}

	if(cliArgs.test){
		await runAllTests();
		return;
	}

	if(cliArgs.testSingle){
		await runSingleTest(cliArgs.testSingle);
		return
	}

	if(!cliArgs.tsconfigPath){
		logErrorAndExit("Path to tsconfig.json is not passed. Could not start bundler.");
	}


	let config = updateCliArgsWithTsconfig(cliArgs);
	let context = new TSToolContextImpl(config);
	if(!config.watchMode){
		logInfo("Starting to build project.");
		await context.compiler.run();
		if(context.compiler.lastBuildWasSuccessful){
			await context.bundler.produceBundle();
			logInfo("Done.");
		} else {
			logError("Done; bundle was not produced as build was not successful.");
		}
	} else {
		logInfo("Starting initial build.");
		await context.compiler.run();
		if(typeof(config.httpPort) === "number"){
			await new HttpApi(context).start();
		}
		logInfo("Up and running.");
	}

}