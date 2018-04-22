//const path = require("path");

const colors = require("ansi-colors");
const gulp = require("gulp");
const log = require("fancy-log");
const mocha = require("gulp-mocha");
const plumber = require("gulp-plumber");
const exhaust = require("stream-exhaust");

const {
	gulpColorfulEslint,
	gulpWatchColorful,
} = require("gulp-colorfulkits");

function runMocha(glob){
	log(
		colors.bold(colors.bggreen(
			`mocha: ${glob}`
		))
	);
	return new Promise(function(resolve){
		let gs = gulp.src(glob, {read: false})
			.pipe(plumber())
			.pipe(mocha({
				bail      : true,
				checkLeaks: true,
				reporter  : "nyan",
			}))
			.on("error", function(){
				log(colors.red("An error occoused.(mocha)"));
			})
			.on("end", resolve);
		exhaust(gs);
	});
}
function runEslint(glob){
	return new Promise(function(resolve){
		let gs = gulp.src(glob)
			.pipe(plumber())
			.pipe(gulpColorfulEslint())
			.on("end", resolve);
		exhaust(gs);
	});
}

gulp.task("test:xste", async function(done){
	log("testing:xste(browser)");
	await runMocha("./test/xste.js");
});
gulp.task("test:xste_node", async function(){
	log("testing:xste(node)");
	await runMocha("./test/xste_node.js");
	await runEslint("./xste_node.js");
});
gulp.task("test", gulp.series("test:xste_node", "test:xste"));


gulp.task("watch", async function(){
	gulpWatchColorful("./xste.js", gulp.series("test:xste"));
	gulpWatchColorful("./xste_node.js", gulp.series("test:xste_node"));
});
