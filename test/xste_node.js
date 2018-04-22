const {testXsteParse, testXsteParseAll} = require("./lib/xste_parse");
const {testXsteNodeExtension} = require("./lib/xste_node_ext");

describe("xste(node)", function(){
	testXsteParseAll("xste-node");
	testXsteNodeExtension("xste-node");
});