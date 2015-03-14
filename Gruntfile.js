module.exports = function (grunt) {

	grunt.initConfig({
		bower_concat: {
			all: {
				dest: 'js/bower.js',
				dependencies: {
					'bootstrap-sass': 'jquery',
					'jquery.svg': ['jquery'],
					'jquery-mousewheel': ['jquery'],
					'underscore': ['jquery']
				}
			}
		},
		uglify: {
			bower: {
				options: {
					sourceMap: true,
					sourceMapName: 'js/bower.min.js.map'
				},
				files: {
					'js/bower.min.js': ['js/bower.js']
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-bower-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('default', ['bower_concat','uglify']);

};