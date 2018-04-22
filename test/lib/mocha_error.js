const assert = require("assert");

module.exports = async function assertError(error_name, testfnc, ...args){
	let success = false;
	try{
		await testfnc(...args);
		success = true;
	}catch(e){
		//console.log(e);
		assert.strictEqual(e.name, error_name);
	}
	if(success)throw new Error("no exception occurred");
};