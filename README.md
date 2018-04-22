# xste:custard: [![Travis Status](https://travis-ci.org/mochiya98/xste.svg?branch=master)](https://travis-ci.org/mochiya98/xste) [![Coverage Status](https://coveralls.io/repos/github/mochiya98/xste/badge.svg?branch=master)](https://coveralls.io/github/mochiya98/xste?branch=master) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)  
_extra small template engine_ (**under 370bytes, not gzipped**)
> recommend using vdom.

> THIS ENGINE DOESN'T ESCAPE.  
> escape on server side recommend.  
> don't let the client if possible.  
> for user experience.

> xste is beta-release.  
> the interface could change at any time.
## How to use(Browser)
### Hello!
- foo
- bar
```html
<script src="xste.js"></script>
<script>
//Add Template
xste.add("h3","<h3><%=self.text%></h3>");
xste.add("mbox",`
  <div class="mbox">
    <%=include("h3",{text:self.title})%>
    <ul>
    <!-- don't forget "var"(let, const) -->
    <%for(var i=0,l=self.list.length;i<l;i++){%>
      <li><%=self.list[i]%></li>
    <%}%>
  </div>
`);
//Compile
document.body.innerHTML =
  xste("mbox", {
    title:"Hello!",
    list:["foo", "bar"]
  });
</script>
```
## How to use(node)
```javascript
const fs = require("fs"):
const xste = require("xste"):

let xste_agent;
fs.writeFileSync("./template/a/b/c/test.tpl", "<%=self.hoge%>");

//@Browser-like
xste_agent = new xste();
xste_agent.add("test", "<%=self.hoge%>");
const result = await xste_agent.compile("test", {hoge: "foobar"});
assert.strictEqual(result, "foobar");

//@LoadFromFile,Dynamic
xste_agent = new xste();
await xste_agent.addSource("./template/");
//DynamicLoad when compile(template_name == filename)
const result = await xste_agent.compile("test", {hoge: "foobar"});
assert.strictEqual(result, "foobar");

//@LoadFromFile,Manual
xste_agent = new xste();
await xste_agent.load("test", "./template/a/b/c/test.tpl");
const result = await xste_agent.compile("test", {hoge: "foobar"});
assert.strictEqual(result, "foobar");

//@Bundle
const bundled_source = await xste.bundle({
  mode: "raw",
  src : ["./template/"],
});
fs.writeFileSync("./bundled.js", bundled_source);

//and more methods...
```
## Do you need full documentation?
see `/test/**/*.js`, almost cover all methods.
```sh
git clone git@github.com:mochiya98/xste.git
cd xste
npm i
npm test
```
