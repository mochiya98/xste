const assert = require("assert");
const path = require("path");

const {generateSandboxedXste} = require("./mocha_sandbox_xste");
const {generateXsteInstance} = require("./xste_init");

const assertError = require("./mocha_error");
const MochaTmpdir = require("./mocha_tmpdir");

const xste = require("../../xste_node.js");
const ERROR_BAD_ARGUMENTS = "BAD_ARGUMENTS";

function testXsteNodeExtension(type){
	let xste_agent;
	let mtmp;
	
	//mtmp init
	beforeEach(async function(){
		mtmp = new MochaTmpdir();
	});
	afterEach(async function(){
		await mtmp.destroy();
		mtmp = null;
	});
	//xste init
	beforeEach(async function(){
		xste_agent = await generateXsteInstance(type);
	});
	
	let sync_mode = false;
	const xste_both = new Proxy(
		{}, //dummy target( --> xste_agent)
		{
			get: function(target, name){
				if(
					sync_mode
					&& typeof xste_agent[name] === "function"
					&& typeof xste_agent[`${name}Sync`] === "function"
				){
					//through await
					return (...args)=>xste_agent[`${name}Sync`](...args);
				}
				return xste_agent[name];
			},
			set: function(target, key, value){
				xste_agent[key] = value;
			},
		}
	);
	function itBothSync(title, it_fnc){
		it(`${title}(Async)`, async function(){
			sync_mode = false;
			await it_fnc();
		});
		it(`${title}(Sync)`, async function(){
			sync_mode = true;
			await it_fnc();
		});
	}
	
	describe("NodeExtension", async function(){
		describe("FileLoad", async function(){
			itBothSync("SingleFile(StaticLoad)", async function(){
				await mtmp.addFile("hoge.tpl", "<%=self.test%>");
				await xste_both.load("tpl_name", path.join(mtmp.path, "hoge.tpl"));
				const result = await xste_both.compile("tpl_name", {test: "foo"});
				assert.strictEqual(result, "foo");
			});
			itBothSync("SingleFile(DynamicLoad)", async function(){
				//when DynamicLoad, bind "foo/bar/filename.tpl"-> template_name "filename"
				await mtmp.addFile("hoge.tpl", "<%=self.test%>");
				await xste_both.addSource(mtmp.path);
				const result = await xste_both.compile("hoge", {test: "foo"});
				assert.strictEqual(result, "foo");
			});
			itBothSync("SingleFile(DynamicLoad)(Recursion)", async function(){
				await mtmp.addFile("a/b/c/hoge.tpl", "<%=self.test%>");
				await xste_both.addSource(mtmp.path);
				const result = await xste_both.compile("hoge", {test: "foo"});
				assert.strictEqual(result, "foo");
			});
			itBothSync("MultipleFile(DynamicLoad)", async function(){
				await mtmp.addFile("foo.tpl", "[foo]<%=self.test%>[/foo]");
				await mtmp.addFile("hoge.tpl", "<%=include(\"foo\",{test:self.test})%>");
				await xste_both.addSource(mtmp.path);
				const result = await xste_both.compile("hoge", {test: "fuga"});
				assert.strictEqual(result, "[foo]fuga[/foo]");
			});
		});
		describe("Error", async function(){
			itBothSync("UnknownTemplateName", async function(){
				await assertError(
					ERROR_BAD_ARGUMENTS
					, (...a)=>xste_both.compile(...a)
					, "_unknown_template"
					, {}
				);
			});
		});
		describe("ScanDependents", async function(){
			itBothSync("ScanDependents(DynamicLoad)", async function(){
				await mtmp.addFile("foo.tpl", "[foo]<%=self.test%>[/foo]");
				await mtmp.addFile("bar.tpl", "<%=include(\"foo\",{test:self.test})%>");
				await mtmp.addFile("hoge.tpl", "<%=include(\"bar\",{test:self.test})%>");
				await xste_both.addSource(mtmp.path);
				await xste_both.loadAllFromSource();
				async function assertScanDependents(template_name, check_depend_raw){
					const scanned_depend = [...await xste_both.scanDependents(template_name)].sort();
					const check_depend = [...check_depend_raw].sort();
					assert.deepStrictEqual(scanned_depend, check_depend);
				}
				await assertScanDependents("foo", ["foo", "bar", "hoge"]);
				await assertScanDependents("bar", ["bar", "hoge"]);
				await assertScanDependents("hoge", ["hoge"]);
			});
		});
		describe("Bundle", async function(){
			let bundled_source;
			beforeEach(async function(){
				await mtmp.addFile("foo.tpl", "[foo]<%=self.test%>[/foo]");
				await mtmp.addFile("hoge.tpl", "<%=include(\"foo\",{test:self.test})%>");
			});
			it("RunBundle", async function(){
				bundled_source = await xste.bundle({
					mode: "raw",
					src : [mtmp.path],
				});
			});
			it("ExecuteBundledScript", async function(){
				const bundled_file = await mtmp.addFile("bundled.js", bundled_source);
				const bundled_xste =
					await generateSandboxedXste({
						filepath: bundled_file,
						is_temp : true,
					});
				const result = bundled_xste("hoge", {test: "fuga"});
				assert.strictEqual(result, "[foo]fuga[/foo]");
			});
			describe("Variation of argument", async function(){
				it("typeof options.src===\"string\"", async function(){
					const bundled_source_textarg = await xste.bundle({
						mode: "raw",
						src : mtmp.path,
					});
					assert.strictEqual(bundled_source, bundled_source_textarg);
				});
				it("options.mode=undefined", async function(){
					const bundled_source_nomode = await xste.bundle({
						src: mtmp.path,
					});
					//default raw-mode
					assert.strictEqual(bundled_source, bundled_source_nomode);
				});
				it("options=undefined", async function(){
					await assertError(ERROR_BAD_ARGUMENTS, xste.bundle);
				});
				it("options={}", async function(){
					await assertError(ERROR_BAD_ARGUMENTS, xste.bundle, {});
				});
				it("options.mode=\"_unknown_mode\"", async function(){
					await assertError(ERROR_BAD_ARGUMENTS, xste.bundle, {
						mode: "_unknown_mode",
						src : mtmp.path,
					});
				});
			});
		});
	});
}


module.exports = {
	testXsteNodeExtension,
};
