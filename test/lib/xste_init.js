const path = require("path");

const xste_node = require("../../xste_node.js");

const xste_default_fullpath = path.join(__dirname, "../../xste.js");
const {generateSandboxedXste} = require("./mocha_sandbox_xste");

async function generateXsteInstance(type){
	let xste;
	await ({
		"xste-default": async function(){
			xste = await generateSandboxedXste(xste_default_fullpath);
		},
		"xste-node": function(){
			xste = new xste_node();
		},
	})[type]();
	return xste;
}

module.exports = {
	generateXsteInstance,
};
