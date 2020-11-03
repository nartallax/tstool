import * as tsc from "typescript";
import {ModuleOrderer} from "impl/module_orderer";
import {loaderCode} from "generated/loader_code";
import {logDebug} from "utils/log";
import * as path from "path";
import {readTextFile, stat, writeTextFile} from "utils/afs";
import {stripTsExt} from "utils/path_utils";
import {minifyJsCode, MinifierOptions} from "impl/minification";
import * as fs from "fs";
import * as TSTool from "tstool";

export class BundlerImpl implements TSTool.Bundler {

	constructor(private readonly context: TSTool.Context){}

	async produceBundle(): Promise<void>{
		logDebug("Starting to produce bundle.");
		let code = await this.assembleBundleCode();
		await writeTextFile(this.context.config.outFile, code);
		logDebug("Bundle produced (" + this.context.config.outFile + ")");
	}

	async assembleBundleCode(): Promise<string>{
		if(!this.context.compiler.lastBuildWasSuccessful){
			throw new Error("Last build was not successful! Could not produce bundle.");
		}

		let result = [] as string[];
		
		await this.loadAbsentModuleCode();

		let moduleOrder = new ModuleOrderer(this.context.moduleStorage).getModuleOrder(this.getEntryModuleName());
		logDebug("Bundle related modules: " + JSON.stringify(moduleOrder))

		let defArrArr = this.buildModuleDefinitionArrayArray(moduleOrder.modules, moduleOrder.circularDependentRelatedModules);
		if(this.context.config.embedTslib && moduleOrder.absentModules.has("tslib")){
			defArrArr.push(await this.getTslibDefArr());
		}
		result.push(JSON.stringify(defArrArr));		
		
		let code = result.join("\n");
		if(!this.context.config.noLoaderCode){
			code = await this.wrapBundleCode(code)
		}

		return code;
	}

	async wrapBundleCode(bareCode: string, otherParams: TSTool.BundlerWrapperParameters = {}): Promise<string>{
		return [
			await this.getPrefixCode(), 
			bareCode, 
			this.getPostfixCode(otherParams)
		].join("\n");
	}

	private getEntryModuleName(): string {
		let absPath = path.resolve(path.dirname(this.context.config.tsconfigPath), this.context.config.entryModule);
		let name = stripTsExt(this.context.modulePathResolver.getCanonicalModuleName(absPath));
		return name;
	}

	private async getTslibDefArr(): Promise<TSToolModuleDefinitonArray> {
		let root = path.resolve(path.dirname(this.context.config.tsconfigPath), "./node_modules/tslib/");
		let stats: fs.Stats;
		try {
			stats = await stat(root);
		} catch(e){
			throw new Error("Failed to fstat tslib directory " + root);
		}
		if(!stats.isDirectory()){
			throw new Error("Expected " + root + " to be tslib directory, but it's not directory.");
		}

		let libPath = path.resolve(root, "./tslib.js");
		let libCode = await readTextFile(libPath);
		if(this.context.config.minify){
			libCode = "function(global){var define=function(){};" + libCode + "}"
			libCode = await this.minify(libCode, "tslib", { removeLegalComments: true });
		}
		return ["tslib", libCode];
	}

	private buildModuleDefinitionArrayArray(modules: string[], circularDependentRelatedModules: Set<string>): TSToolModuleDefinitonArray[] {
		return modules.map(name => {
			let meta = this.context.moduleStorage.get(name);
			let code = meta.jsCode;
			if(!code){
				throw new Error("Code for module " + name + " is not loaded at bundling time.");
			}

			let shouldIncludeFullExportInfo = circularDependentRelatedModules.has(name);
			let haveModuleRefs = meta.exportModuleReferences.length > 0 && shouldIncludeFullExportInfo;
			let needExports = meta.exports.length > 0 && shouldIncludeFullExportInfo
			if(needExports || !!meta.altName || meta.hasOmniousExport || haveModuleRefs){

				let short: TSToolModuleLoaderData = {}
				if(haveModuleRefs){
					short.exportRefs = meta.exportModuleReferences.sort();
				}
				if(needExports){
					short.exports = meta.exports.sort();
				}
				if(meta.hasOmniousExport){
					short.arbitraryType = true;
				}
				if(meta.altName){
					short.altName = meta.altName;
				}

				return [name, meta.dependencies, short, code]
			} else {
				return meta.dependencies.length > 0? [name, meta.dependencies, code]: [name, code]
			}
		});
	}

	private minifiedLoaderCode: string | null = null;
	private async getPrefixCode(): Promise<string> {
		let resultLoaderCode = loaderCode;
		if(this.context.config.minify){
			if(this.minifiedLoaderCode === null){
				this.minifiedLoaderCode = await this.minify(resultLoaderCode, "<loader>", { target: tsc.ScriptTarget.ES5 });
			}
			resultLoaderCode = this.minifiedLoaderCode;
		}
		resultLoaderCode = resultLoaderCode.replace(/;?[\n\s]*$/, "");
		return "(" + resultLoaderCode + ")(\n";
	}

	/* получить код, который должен стоять в бандле после перечисления определения модулей
	thenCode - код, который будет передан в качестве аргумента в launch (см. код лоадера) */
	private getPostfixCode(wrapParams: TSTool.BundlerWrapperParameters): string {
		let cfg = this.context.config;
		let params: any = {
			entryPoint: {
				module: this.getEntryModuleName(),
				function: cfg.entryFunction
			}
		};
		if(cfg.amdRequireName !== "require"){
			params.amdRequire = cfg.amdRequireName
		}
		if(cfg.commonjsRequireName !== "require"){
			params.commonjsRequire = cfg.commonjsRequireName;
		}
		if(cfg.loadInitialExternalsWithCommonJS){
			params.preferCommonjs = true;
		}
		let paramStr = JSON.stringify(params);
		if(wrapParams.afterEntryPointExecuted){
			paramStr = paramStr.substr(0, paramStr.length - 1) + 
				`,${JSON.stringify("afterEntryPointExecuted")}:${wrapParams.afterEntryPointExecuted}}`;
		}
		if(wrapParams.entryPointArgCode){
			paramStr = paramStr.substr(0, paramStr.length - 1) + 
				`,${JSON.stringify("entryPointArgs")}:[${wrapParams.entryPointArgCode.join(",")}]}`;
		}
		if(cfg.errorHandlerName){
			paramStr = paramStr.substr(0, paramStr.length - 1) + 
				`,${JSON.stringify("errorHandler")}:${cfg.errorHandlerName}}`;
		}
		return ",\n" + paramStr + ",eval);"
	}

	private async loadAbsentModuleCode(): Promise<void> {
		let storage = this.context.moduleStorage;
		let proms = [] as Promise<void>[];
		let names = storage.getKnownModuleNames();
		let outDir = this.context.config.tscParsedCommandLine.options.outDir as string;
		names.forEach(moduleName => {
			let mod = storage.get(moduleName);
			if(!mod.jsCode){
				let modulePath = path.join(outDir, moduleName + ".js");
				proms.push((async () => {
					let code = await readTextFile(modulePath);
					if(this.context.config.minify){
						code = await this.minify(code, moduleName);
					}
					mod.jsCode = code;
				})());
			}
		});
		if(proms.length > 0){
			await Promise.all(proms);
		}
	}

	private minify(code: string, moduleName: string, opts: Partial<MinifierOptions> = {}): Promise<string> {
		return minifyJsCode({
			target: tsc.ScriptTarget[this.context.config.target],
			...opts,
			code, 
			moduleName
		});
	}

}