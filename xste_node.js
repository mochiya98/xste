const fs = require("mz/fs");
const path = require("path");

const ERROR_BAD_ARGUMENTS = "BAD_ARGUMENTS";

function createErrorWithName(name, message){
	const e = new Error(message);
	e.name = name;
	return e;
}

/* eslint-disable no-invalid-this */
function xste(){
	this.t = new Map();
	this.filelist = new Map();
}
/* eslint-enable no-invalid-this */
xste.prototype.add = function(name, template){
	template = template.replace(/\r\n?/g, "\n");
	let depend = [],
		sliceIndex = 0,
		source = "var include=this.compileSync.bind(this),x=\"\";";
	const include_regex = /include *\( *['"]([^'"]+)['"] *,/g,
		tagRegEx = /<%(=?)([\s\S]*?)%>/g;

	function appendTextOutput(sliceEndIndex){
		if(sliceIndex === sliceEndIndex)return;//===""
		source
			+= "x+=\""
			+ template
				.slice(sliceIndex, sliceEndIndex)
				.replace(/"/g, "\\\"")
				.replace(/\n/g, "\\n")
			+ "\";";
	}
	// eslint-disable-next-line no-cond-assign
	for(let match; match = tagRegEx.exec(template); sliceIndex = tagRegEx.lastIndex){
		appendTextOutput(match.index);
		if(match[1]){
			let include_match;
			// eslint-disable-next-line no-cond-assign
			while(include_match = include_regex.exec(match[2])){
				depend.push(include_match[1]);
			}
			source += "x+=" + match[2] + ";";
		}else{
			source += match[2];
		}
	}
	appendTextOutput();
	this.t.set(name, {
		compiler: new Function("self", source.replace(/[\r\n]+/g, "") + "return x")
			.bind(this),
		depend,
	});
};
//"
xste.prototype.addSource = async function(dir){
	for(const filename of await fs.readdir(dir + "/")){
		const fullpath = path.join(dir, filename);
		if((await fs.stat(fullpath))
			.isDirectory()){
			await this.addSource(fullpath);
		}else{
			this.filelist.set(path.parse(fullpath).name, fullpath);
		}
	}
};
xste.prototype.addSourceSync = function(dir){
	for(const filename of fs.readdirSync(dir + "/")){
		const fullpath = path.join(dir, filename);
		if(fs.statSync(fullpath)
			.isDirectory()){
			this.addSourceSync(fullpath);
		}else{
			this.filelist.set(path.parse(fullpath).name, fullpath);
		}
	}
};
xste.prototype.load = async function(name, fp){
	this.add(name, (await fs.readFile(fp))
		.toString());
};
xste.prototype.loadSync = function(name, fp){
	this.add(name, fs.readFileSync(fp)
		.toString());
};
xste.prototype.loadAllFromSourceSync = function(){
	for(const [key, value] of this.filelist){
		this.loadSync(key, value);
	}
};
xste.prototype.loadAllFromSource = async function(){
	for(const [key, value] of this.filelist){
		await this.load(key, value);
	}
};
xste.prototype.compile = async function(name, template){
	if(!this.t.has(name)){
		if(this.filelist.has(name)){
			await this.load(name, this.filelist.get(name));
		}else{
			throw createErrorWithName(ERROR_BAD_ARGUMENTS, "unknown template name");
		}
	}
	return this.t.get(name)
		.compiler(template);
};
xste.prototype.compileSync = function(name, template){
	if(!this.t.has(name)){
		if(this.filelist.has(name)){
			this.loadSync(name, this.filelist.get(name));
		}else{
			throw createErrorWithName(ERROR_BAD_ARGUMENTS, "unknown template name");
		}
	}
	return this.t.get(name)
		.compiler(template);
};
xste.prototype.scanDependents = function(name, depend){
	if(!depend)depend = new Set();
	depend.add(name);
	for(const [name_sc, template] of this.t){
		const isDepend = template.depend.includes(name);
		if(isDepend && !depend.has(name_sc)){
			this.scanDependents(name_sc, depend);
		}
	}
	return depend;
};
xste.bundle = async function(opts){
	let source = "";
	const xste_agent = new xste();
	opts = opts || {};
	if(!opts.src){
		throw createErrorWithName(ERROR_BAD_ARGUMENTS, "undefined source");
	}
	opts.mode = opts.mode || "raw";
	if(typeof opts.src === "string"){
		opts.src = [opts.src];
	}
	for(const srcdir of opts.src){
		await xste_agent.addSource(srcdir);
	}
	if(opts.mode === "raw"){
		const xste_browser_filename =
			path.join(path.dirname(module.filename), "./xste.js");
		source += (await fs.readFile(xste_browser_filename, "utf8"))
			.replace(/[\r\n]+/g, "");
		for(const [template_name, template_filename] of xste_agent.filelist){
			const template_data = (await fs.readFile(template_filename, "utf8"))
				.replace(/'/g, "\\'")
				.replace(/\r\n?/g, "\n")
				.replace(/\n/g, "\\n");
			source += `xste.add(\'${template_name}\',\'${template_data}\');`;
		}
	}else{
		throw createErrorWithName(ERROR_BAD_ARGUMENTS, "unknown bundle mode");
	}
	return source;
};

module.exports = xste;
