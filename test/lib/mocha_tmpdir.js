const fs = require("mz/fs");
const os = require("os");
const path = require("path");
const util = require("util");

const rimraf = require("rimraf");
const rimrafPromise = util.promisify(rimraf);

function MochaTmpdir(){
	this.path = path.join(
		os.tmpdir(),
		"mochatmp_"
			+ Math.random()
				.toString(36)
				.slice(-6)
	);
	this.filelist = {};
	fs.mkdirSync(this.path);
}

MochaTmpdir.prototype.addFile = async function(filepath, contents){
	const split_path = filepath.split(/[\\\/]/);
	for(let i = 1, l = split_path.length; i < l; i++){
		const dirpath = path.join(this.path, ...split_path.slice(0, i));
		try{
			await fs.stat(dirpath);
		}catch(e){
			await fs.mkdir(dirpath);
		}
	}
	const fullpath = path.join(this.path, filepath);
	await fs.writeFile(fullpath, contents);
	return fullpath;
};
MochaTmpdir.prototype.destroy = async function(){
	return await rimrafPromise(this.path);
};

module.exports = MochaTmpdir;
