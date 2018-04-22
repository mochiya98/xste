const fs = require("mz/fs");
const vm = require("vm");

//メインとなる短いコードは、
//singletonで尚且グローバルに依存する為そのままでは並列にテスト出来ない
//…ので無理やりvm_contextに詰め込んでシミュレートするためのラッパー。
async function generateSandboxedXste(options){
	if(!options){
		throw new Error("must define filename");
	}
	if(typeof options === "string"){
		options = {filepath: options};
	}
	const __sandbox = {};
	vm.createContext(__sandbox);

	function __vmrun(program, filename){
		return vm.runInContext(program, __sandbox, filename);
	}

	const vm_filename = options.is_temp ? void 0 : options.filepath;
	__vmrun((await fs.readFile(options.filepath)).toString(), vm_filename);

	// eslint-disable-next-line func-style
	const sandboxedXste = function(...args){
		const source = `xste(...${JSON.stringify(args)})`;
		return __vmrun(source);
	};
	
	for(const key in __sandbox.xste){
		const property = __sandbox.xste[key];
		if(typeof property === "function"){
			sandboxedXste[key] = function(...args){
				const source = `xste["${key}"](...${JSON.stringify(args)})`;
				return __vmrun(source);
			};
		}else{
			Object.defineProperty(
				sandboxedXste,
				key,
				{
					get: ()=>function(){
						const source = `xste[${JSON.stringify(key)}]`;
						return __vmrun(source);
					},
					set: (val)=>function(){
						const source = `xste[${JSON.stringify(key)}]=${JSON.stringify(val)}`;
						return __vmrun(source);
					},
				}
			);
		}
	}
	
	return sandboxedXste;
}

module.exports = {generateSandboxedXste};
