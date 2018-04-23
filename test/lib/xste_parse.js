const assert = require("assert");

const {generateXsteInstance} = require("./xste_init");

function testXsteParse(opts){
	if(!opts)throw "Please define opts(argument)";
	for(const checkKey of ["type", "template", "exec", "assert"]){
		if(opts[checkKey] === void 0) new Error("Please define opts." + checkKey);
	}
	const assertText = opts.assert.replace(/\n/g, "\\n");
	const execTemplateText = opts.templates[opts.exec[0]].replace(/\n/g, "\\n");
	
	describe(`\`${execTemplateText}\` === \`${assertText}\``, async function(){
		let xste;
		before(async function(){
			xste = await generateXsteInstance(opts.type);
		});
		it("Compile Template", function(){
			for(const template_name in opts.templates){
				const template = opts.templates[template_name];
				xste.add(template_name, template);
			}
		});
		let result = null;
		it("Exec Teplater", async function(){
			await ({
				"xste-default": function(){
					result = xste(opts.exec[0], opts.exec[1]);
				},
				"xste-node": async function(){
					result = await xste.compile(opts.exec[0], opts.exec[1]);
				},
			})[opts.type]();
		});
		it("Assert Result", function(){
			assert.strictEqual(result, opts.assert);
		});
		//xste
	});
	//xste.add("test","");
}

function testXsteParseAll(type){
	describe("Parse", function(){
		testXsteParse({
			assert   : "",
			exec     : ["test", {}],
			templates: {
				"test": "",
			},
			type,
		});
		testXsteParse({
			assert   : "",
			exec     : ["test", {}],
			templates: {
				"test": "<%%>",
			},
			type,
		});
		testXsteParse({
			assert   : "hoge",
			exec     : ["test", {}],
			templates: {
				"test": "<%=\"hoge\"%>",
			},
			type,
		});
		testXsteParse({
			assert   : "hoge",
			exec     : ["test", {}],
			templates: {
				"test": "<%=\"hoge\" %>",
			},
			type,
		});
		testXsteParse({
			assert   : {}.toString(),
			exec     : ["test", {}],
			templates: {
				"test": "<%={}%>",
			},
			type,
		});
		testXsteParse({
			assert   : "9",
			exec     : ["test", {}],
			templates: {
				"test": "<%=3*3%>",
			},
			type,
		});
		testXsteParse({
			assert   : "foo\"bar",
			exec     : ["test", {}],
			templates: {
				"test": "foo\"bar",
			},
			type,
		});
		testXsteParse({
			assert   : "foo'bar",
			exec     : ["test", {}],
			templates: {
				"test": "foo'bar",
			},
			type,
		});
		testXsteParse({
			assert   : "foo\nbar",
			exec     : ["test", {}],
			templates: {
				"test": "foo\nbar",
			},
			type,
		});
		testXsteParse({
			assert   : "foo\nbar",
			exec     : ["test", {}],
			templates: {
				"test": "<%=\"foo\\nbar\"%>",
			},
			type,
		});
		testXsteParse({
			assert   : "foobar",
			exec     : ["test", {hoge: "foobar"}],
			templates: {
				"test": "<%=self.hoge%>",
			},
			type,
		});
		testXsteParse({
			assert   : "hoge",
			exec     : ["test", {}],
			templates: {
				"test": "<%if(true)%>hoge",
			},
			type,
		});
		testXsteParse({
			assert   : "",
			exec     : ["test", {}],
			templates: {
				"test": "<%if(false)%>hoge",
			},
			type,
		});
		testXsteParse({
			assert   : "",
			exec     : ["test", {}],
			templates: {
				"test": "<%if(false)%><%%>hoge",
			},
			type,
		});
		testXsteParse({
			assert   : "hoge",
			exec     : ["test", {}],
			templates: {
				"test": "<%if(false)%><%=\"\"%>hoge",
			},
			type,
		});
		testXsteParse({
			assert   : "hoge",
			exec     : ["test", {}],
			templates: {
				"test": "<%if(false)%><%=\"fuga\"%>hoge",
			},
			type,
		});
		testXsteParse({
			assert   : "",
			exec     : ["test", {}],
			templates: {
				"test": "<%if(false)%><%=\"hoge\"%>",
			},
			type,
		});
		testXsteParse({
			assert   : "hoge",
			exec     : ["test", {}],
			templates: {
				"test": "<%if(false)%><%=\"fuga\"%><%=\"hoge\"%>",
			},
			type,
		});
		testXsteParse({
			assert   : "0,1,2,",
			exec     : ["test", {}],
			templates: {
				"test": "<%for(var i=0;i<3;i++){%><%=i%>,<%}%>",
			},
			type,
		});
		testXsteParse({
			assert   : "foobar",
			exec     : ["test2", {}],
			templates: {
				"test1": "<%=\"foobar\"%>",
				"test2": "<%=include(\"test1\")%>",
			},
			type,
		});
		testXsteParse({
			assert   : "foo=\"bar\"",
			exec     : ["test2", {bar: "bar"}],
			templates: {
				"test1": "foo=\"<%=self.foo%>\"",
				"test2": "<%=include(\"test1\",{foo:self.bar})%>",
			},
			type,
		});
	});
}


module.exports = {
	testXsteParse,
	testXsteParseAll,
};
